# TRD — Technical Requirements Document

**Project:** Neon Dojo Tournament
**Status:** Draft v1
Read together with `CLAUDE.md` (rules), `docs/PRD.md` (what/why) and `docs/SPEC_ADDENDUM.md` (authoritative conflict resolution).

## 1. System overview

```
 Phone A (browser/PWA)                         Phone B (browser/PWA)
 ┌────────────────────────┐                    ┌────────────────────────┐
 │ Phaser renderer + UI   │                    │ Phaser renderer + UI   │
 │ Touch/keyboard input   │                    │ Touch/keyboard input   │
 │ Rollback netcode       │◄── WebRTC DataCh ─►│ Rollback netcode       │
 │ /shared deterministic  │    (inputs only)   │ /shared deterministic  │
 │ simulation (60 Hz)     │                    │ simulation (60 Hz)     │
 └───────────┬────────────┘                    └───────────┬────────────┘
             │ WebSocket (signaling, rooms, relay fallback)│
             └──────────────►  Node.js `ws` server  ◄──────┘
```

The server never simulates the game. Both peers run the identical deterministic simulation and exchange only inputs.

## 2. Repository layout

```
/shared
  sim.js            step(state, inputs) -> state ; init ; checksum ; clone
  fixed.js          integer / fixed-point helpers, seeded PRNG
  input.js          input bitmask, buffer, motion parser
  tuning.json       global physics + feel values
  characters/*.json per-fighter data (frame data, boxes, moves)
  stages/*.json     stage bounds, camera limits
/client
  src/main.js, scenes/ (Boot, Menu, Fight, Lobby), render/, ui/touch.js,
  net/ (transport, rollback, session), audio/, i18n/
  public/ (manifest.webmanifest, icons, sw.js)
/server
  src/index.js, rooms.js, signaling.js, relay.js, ratelimit.js
/tools
  boxviewer, frame-data validator, replay runner
/docs
```

npm workspaces; scripts at repo root (see `CLAUDE.md`).

## 3. Deterministic simulation (`/shared`)

### 3.1 Constraints

- No `Math.random`, `Date.now`, `performance.now`, DOM, Phaser.
- All gameplay numbers are **integers**. Position unit = 1/100 pixel ("subpixel"). Velocity unit = subpixels per frame. Division uses integer helpers (`idiv`, truncation toward zero, consistent everywhere).
- PRNG: small seeded integer PRNG (e.g. xorshift32); its state lives inside the sim state.
- Iteration order of players, hitboxes, projectiles is fixed and index-based (no object key iteration dependence).
- Fighter move data comes from JSON loaded once and treated as immutable; the sim state stores only references (ids) to moves/frames, never copies.

### 3.2 State shape (serializable, flat where possible)

```
state = {
  frame, rngState, roundState, timer, roundNo,
  players: [P0, P1],         // later 3 fighters per side + active index
  projectiles: [...],        // fixed-capacity pool
  hitstop, cameraX, ...
}
P = {
  x, y, vx, vy, facing,
  action, actionFrame,       // id into character move table + frame counter
  hp, power, stun, blockstun, hitstop,
  inputHistory[30],          // ring buffer of bitmasks
  comboHits, comboDamage, juggle, flags (bitfield)
}
```

Prefer typed arrays / fixed-size arrays so `clone`/`restore` has no allocations in the rollback hot path (use a preallocated snapshot pool).

### 3.3 API

- `createState(seed, charIdsP1, charIdsP2) -> state`
- `step(state, in0, in1) -> void` (mutates state in place, advances exactly 1 frame)
- `snapshot(state, out)` / `restore(state, snap)` — copy into preallocated buffers
- `checksum(state) -> uint32` over all gameplay fields
- `getEvents(state)` — per-frame event list (hit, block, KO, sfx cue) for renderer/audio, derived from state, never feeds back

### 3.4 Frame order inside `step`

1. Push inputs into history; resolve facing.
2. Decrement hitstop; if in hitstop, skip movement/animation advance for affected player.
3. Resolve action transitions (input buffer 4–6 frames, cancels, motion parser).
4. Apply movement (walk/run/jump/gravity/roll) and clamp to stage bounds.
5. Resolve pushbox separation.
6. Hit detection: hitboxes vs hurtboxes → hit/block/throw resolution, damage, scaling, hitstun, pushback, power gain.
7. Projectiles update.
8. Round logic: KO, timer, round end/reset.
9. Increment frame.

### 3.5 Character data schema (JSON)

```
{
  "id": "kaze", "name": "Kaze",
  "hp": 1000, "walkSpeed": 320, "runSpeed": 780, "backstepFrames": 14,
  "jump": { "up": 1900, "gravity": 120, "airFrames": 42, "forward": 360 },
  "roll": { "frames": 22, "invulnFrames": 16, "speed": 700 },
  "hurtboxes": { "stand": [x,y,w,h], "crouch": [...], "air": [...] },
  "moves": {
    "5A": {
      "startup": 4, "active": 3, "recovery": 7,
      "damage": 30, "hitstun": 16, "blockstun": 10, "pushback": 200, "hitstop": 8,
      "hitbox": [x,y,w,h], "level": "mid", "cancelInto": ["5B","236A"], "meterGain": 20
    }
  },
  "specials": [{ "id": "fireball", "motion": "236", "button": "A", "move": "236A" }],
  "super": { "motion": "2363214", "button": "C", "move": "super1", "cost": 1000 }
}
```

Per-frame hurtbox overrides are allowed (`frames: [{from,to,hurtbox}]`). A schema validator in `/tools` must reject malformed files (CI step).

### 3.6 Input encoding

One byte per player per frame: bit0 UP, bit1 DOWN, bit2 LEFT, bit3 RIGHT, bit4 A, bit5 B, bit6 C, bit7 D. Left/right are absolute on the wire; the sim converts to forward/back using facing. Motion parser reads the 30-frame history with a 12–15 frame window and numpad notation (236, 214, 623, 41236 …).

## 4. Client

### 4.1 Game loop

`requestAnimationFrame` + fixed-timestep accumulator (1/60 s). Offline/local modes run at most 5 catch-up steps per rAF, then discard leftover time for spiral protection. Online never skips or drops simulation/input frames: preserve accumulated time and allow at most 8 simulation steps per rAF total, including rollback resims. Report frame advantage so the ahead peer slows by ≤ 2% timestep stretch or briefly stalls. If a peer stays more than 12 frames behind for more than 3 s, show "poor connection" and stall. No inputs for 5 s means pause/reconnecting; at 10 s end as forfeit/disconnect. Send "away" on tab hiding/backgrounding; the same timeouts apply. All numeric defaults belong in shared JSON configuration. Render interpolation factor = accumulator / step (clamped while online catch-up is pending). Sim never runs inside Phaser `update` directly; Phaser is only a renderer fed by a thin `Renderer.draw(state, alpha)`.

### 4.2 Rendering

- Internal resolution 384×224 (or 640×360), integer-scaled to the screen, `image-rendering: pixelated`, letterboxed.
- Placeholder mode: colored rectangles + text labels. Sprite mode: texture atlases (≤ 2048²), animation → frame-data link via `animations.json` per fighter (animation frame index driven by `actionFrame`).
- Object pools for particles/hit sparks; no allocation in the frame loop.
- Debug overlay (toggle): hitboxes, hurtboxes, pushboxes, frame counter, inputs, FPS.

### 4.3 Input layer

- Touch: left-zone virtual stick (8-way, dead-zone, floating origin), right-zone buttons A/B/C/D + Roll + Throw + Special shortcuts; per-pointer tracking for full multi-touch; `touch-action: none`; block context menu; optional haptics.
- Keyboard and Gamepad API for desktop.
- Assist mode: shortcut buttons inject the full motion sequence into the input stream over the required frames, so the sim/netcode see ordinary inputs.
- Output of the input layer each tick = one bitmask byte.

### 4.4 PWA

Manifest (landscape, standalone), service worker with cache-first for static assets, icons, install prompt, wake lock while in a match, orientation lock where supported, visibility-change handling.

### 4.5 i18n

Simple key→string map; English default, Bangla later.

## 5. Networking

### 5.1 Server (`/server`)

- Node.js + `ws`. Responsibilities: create/join rooms (4-char code), forward SDP/ICE, ping/pong RTT measurement, matchmaking queue (Phase 5), WebSocket **relay fallback** (forward input packets verbatim when WebRTC fails).
- Message format: small JSON for control; binary for relayed inputs.
- Limits: rate-limit per connection, max rooms per IP, room TTL (e.g. 10 min idle), max message size, input validation on every message.
- Config via env: `PORT`, `ALLOWED_ORIGINS`, `STUN_URLS`, `TURN_*`.
- `/health` HTTP endpoint for uptime pinger and wake-up.
- Deploy target: Render free web service for the first public test; Railway optional, not guaranteed (document limits in `docs/DEPLOY.md`).

### 5.2 Transport

Primary: WebRTC `RTCDataChannel` with `{ ordered: false, maxRetransmits: 0 }`. Fallback: WebSocket relay. Transport interface is abstract (`send(bytes)`, `onmessage`, `rtt`) so rollback code does not care which is used. A local loopback transport with configurable latency/jitter/loss exists for tests.

### 5.3 Input packet

```
[ frame:u16 ][ ackFrame:u16 ][ count:u8 ][ inputs: count × u8 ]  (+ checksum fields every N frames)
```

Each packet redundantly carries the last N (≈ 8–12) local inputs so a lost packet rarely matters. Frame numbers wrap-safe.

### 5.4 Rollback algorithm

- `localDelay` default 1–2 frames (configurable, auto-tuned from RTT later).
- Each tick: read local input → schedule at `frame + localDelay` → send → gather remote inputs; for missing remote input, predict = last confirmed remote input.
- Internally use non-wrapping integer frame numbers. Wire frame/ack fields remain u16; unwrap relative to the newest known frame and compare wrap-safely.
- Keep `confirmedFrame` = newest contiguous frame with both inputs known. Snapshot ring buffer of ≥ 12 frames; retain checksum history for at least 600 confirmed frames.
- When a remote input arrives and differs from what was predicted for an already simulated frame: restore snapshot at that frame, re-simulate to the present with correct inputs, skipping rendering for resimulated frames. Online catch-up and resimulation share the 8-step/rAF budget (§4.1); continue pending resims next rAF without dropping frames.
- If predicted frames exceed `maxRollback` (default 8): stall sim (render last frame, show "poor connection").
- Frame advantage sync: exchange local frame advantage; the ahead peer slows by ≤ 2% (stretches timestep) until balanced.
- Desync detection: every 30 confirmed frames both peers exchange `checksum(frame)` and compare the same confirmed frame after rollback, using the ≥ 600-frame checksum history for delayed messages. Predicted states need not match. Mismatch → stop match, show error, save input log + states for debugging.
- Audio/visual events produced during a rolled-back segment are deduplicated by event id/frame so sounds/sparks don't fire twice.

### 5.5 Connection lifecycle

`lobby → signaling → ICE connect → handshake (version, seed, characters, tuning hash) → countdown → match → result → rematch/leave`. Both peers must agree on `tuning.json` + character data hash; mismatch → refuse to start ("update game").

### 5.6 Test tooling

- `LoopbackTransport({ latencyMs, jitterMs, lossPct })`.
- URL flags `?lag=80&loss=5&jitter=20` simulate bad networks on a real session.
- Headless script runs two sim instances for 10,000+ frames and compares every confirmed frame after rollback, never live predicted states. Also test reorder/duplicates/burst loss, lost-input recovery, stall/recovery, u16 wrap from near 65,500, delayed checksums with ≥ 600 confirmed-frame history, and snapshot/restore invariance (SPEC_ADDENDUM.md §D).

## 6. Performance budgets

- Sim step ≤ 0.5 ms on mid-range Android; rollback resim of 8 frames ≤ 4 ms.
- Snapshot/restore ≤ 0.3 ms.
- Render ≤ 8 ms/frame; stable 60 FPS.
- Initial load ≤ 3 MB for the first playable screen (lazy-load audio/stages).
- Zero per-frame allocations in sim, input, netcode, and render hot paths (verify with a profiler pass in Phase 5).

## 7. Security & abuse

- Validate all server messages (type, size, range). Room codes unguessable enough (avoid ambiguous characters) + TTL.
- CORS / origin allowlist for WebSocket.
- Never trust the opponent's checksum for anything beyond ending the match; no server-side persistence of personal data in MVP.
- Privacy: no analytics/tracking in MVP; if added later, disclose and make opt-in.

## 8. Testing strategy

| Level         | Tool        | What                                                                         |
| ------------- | ----------- | ---------------------------------------------------------------------------- |
| Unit          | Vitest      | fixed math, input parser, move transitions, hit resolution, damage scaling   |
| Determinism   | Vitest      | same input log → identical checksum every frame; snapshot/restore round-trip |
| Property/fuzz | Vitest      | random inputs for 10k frames, no NaN/out-of-bounds, invariants hold          |
| Netcode       | Vitest      | loopback transport with lag/loss/jitter → checksum parity                    |
| Data          | Node script | JSON schema validation of characters/stages                                  |
| Manual        | real phones | feel, controls, performance, cross-network match                             |

CI (GitHub Actions): install, lint, test, build on every push.

## 9. Tooling & conventions

Node LTS, npm workspaces, Vite, Vitest, ESLint + Prettier, conventional commit messages, `.editorconfig`. Keep dependencies minimal; log additions in `docs/DECISIONS.md`.

## 10. Hosting plan (free)

- Client: Cloudflare Pages (or GitHub Pages) — static build.
- Server: Render free web service for the first public test (signaling + relay); idle sleep means wake-up ≈ 1 minute, so show "waking server…". Use health pings only within free limits. Railway is optional, not a guarantee; Fly.io is not a permanent free tier for new accounts and is excluded.
- Free relay capacity is limited: do not promise $0 at scale; record quotas and cold-start limits in `docs/DEPLOY.md`.
- STUN: public Google STUN. TURN: optional free-tier provider via env vars; WebSocket relay as final fallback.
- Domain: free subdomain initially.
- Android toolchain (JDK/SDK/Gradle) is Phase 5 only. Direct APK sharing is free; Play Store publishing fees are outside the $0 scope.

## 11. Open decisions (agent should log choices in `docs/DECISIONS.md`)

- Internal resolution (384×224 vs 640×360).
- JS vs TypeScript for `/shared` (default JS + JSDoc types).
- Fixed-point scale (default 1/100 px).
- TURN provider selection.
- Sprite pipeline (hand-made, AI-assisted original, or CC0) — placeholder rectangles until decided.
