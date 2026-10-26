Historical. docs/INSTRUCTIONS.md and docs/SPEC_ADDENDUM.md take precedence.

# PROJECT BRIEF FOR CODING AGENT: Mobile Online 2D Fighting Game (KOF'97-style gameplay, original IP)

You are the lead engineer. Build this project phase by phase. Do NOT jump ahead. After each phase: run tests, commit, write a short status note in `docs/STATUS.md`, then continue. If something is ambiguous, pick the simplest option that matches this brief, note it in `docs/DECISIONS.md`, and keep going.

---

## 1. Goal

A 2D side-view fighting game, playable in a mobile browser (installable as PWA, later wrapped with Capacitor), with **online multiplayer** and **very responsive, fast movement**. Gameplay feel is inspired by King of Fighters '97 (4 attack buttons, run/roll, jump arcs, command special moves, power gauge, team of 3). **All art, names, music, characters, logos, UI are ORIGINAL.** Only generic mechanics are reused.

Budget: **zero**. Everything uses free tools and free hosting tiers.

## 2. Legal / IP rules (hard rules)

- Never use: the name "King of Fighters"/"KOF", SNK character names, move names (e.g. "Raging Storm"), sprites, sounds, music, stage art, logos, fonts from the original, ripped assets of any kind.
- Characters, names, stories, special-move names, stages, UI: all original. Create a fictional world (suggestion: "Neon Dojo Tournament", cyber-street setting) and 6 original fighters (see §8).
- Allowed: generic mechanics (4-button layout, quarter-circle inputs, power gauge, 3v3 team format, run/roll). Mechanics are not protected the way art/characters are.
- Assets: only (a) self-made, (b) AI/hand generated original, or (c) CC0 from OpenGameArt/itch.io/Kenney with license noted in `docs/ASSET_LICENSES.md`. Record every asset's source + license.
- Keep a placeholder-art mode (colored rectangles + labels) so the game is fully playable before final art exists.

## 3. Tech stack (all free)

| Layer | Choice |
|---|---|
| Language | JavaScript (ES modules); TypeScript allowed if you prefer, but keep it simple |
| Build | Vite |
| Rendering | Phaser 3 (Canvas/WebGL) — rendering only, NOT game logic |
| Game simulation | Pure JS module in `/shared`, no Phaser, no DOM, runs in Node and browser identically |
| Netcode | Rollback netcode (GGPO-style) over WebRTC DataChannel, WebSocket relay fallback |
| Server | Node.js + `ws` (signaling, rooms, matchmaking, relay fallback) |
| Hosting | Client: Cloudflare Pages or GitHub Pages. Server: Render/Fly.io/Railway free tier (note: free tiers may sleep; add a wake-up/health ping + "connecting…" UI) |
| STUN/TURN | Public STUN (Google). TURN: free tier (e.g. Metered/Cloudflare) via env var; fallback to WebSocket relay if WebRTC fails |
| Tests | Vitest |
| Mobile | PWA first (manifest + service worker), Capacitor wrapper later |

## 4. Architecture (most important section)

```
/shared          deterministic game simulation (the heart)
  sim.js         step(state, inputs) -> state
  characters/    data-driven JSON per fighter (frame data, hitboxes)
  input.js       input bitmask + command-motion parser
  fixed.js       fixed-point / integer math helpers
/client          Phaser renderer, touch UI, audio, netcode client
/server          signaling + matchmaking + relay
/tools           frame-data editor/debug overlay (later)
/docs
```

**Rules for `/shared/sim.js` (non-negotiable for rollback to work):**
1. Fully deterministic: no `Math.random`, no `Date.now`, no floating-point drift. Use integers (positions in 1/100 px or fixed-point) and a seeded PRNG stored in state if randomness is needed.
2. State is a plain serializable object (or typed arrays). `cloneState`/`serialize` must be fast (target < 0.3 ms).
3. `step(state, [p1Input, p2Input])` advances exactly 1 frame at **60 Hz fixed timestep**.
4. Renderer reads state and interpolates visuals only; it never mutates sim state.
5. Add a `checksum(state)` function (used for desync detection online).
6. Unit test: running the same input log twice gives identical checksums every frame.

**Input format:** one byte per player per frame bitmask: `UP DOWN LEFT RIGHT A B C D` (A=light punch, B=light kick, C=heavy punch, D=heavy kick — same layout idea as classic 4-button). Input history buffer (last ~30 frames) per player for motion detection (↓↘→ + button, etc.) with a forgiving ~12–15 frame window.

## 5. "Fast movement" requirements (design target)

- Walk fast, **run** (double-tap forward or dedicated button), **back-step**, **roll/dodge** (invulnerable frames), **short hop + super jump**.
- Jump arc quick and snappy (jump airtime ≈ 40–45 frames; short hop ≈ 28).
- Every action cancels/ends quickly; recovery frames are low; input buffer of 4–6 frames so presses right before an action ends still register.
- Total input-to-screen latency target: ≤ 2 frames local. Use `requestAnimationFrame` with fixed-step accumulator; never tie logic to display refresh.
- All tuning values live in a single `shared/tuning.json` so I can adjust game feel without touching code.

## 6. Game rules (MVP definition)

- Phase-1 format: **1v1, best of 3 rounds**, 99s timer (configurable), health bars.
- Phase-4 format: **3v3 team battle** (defeated fighter replaced by next; winner keeps remaining HP).
- Mechanics: block (hold back), crouch block, throw, hitstun/blockstun, knockdown + quick recovery, pushback, combo counter, damage scaling, juggle limit.
- Power gauge: builds on dealing/taking damage; Level-1 spend = EX/special enhancement, full gauge = Super move. "MAX mode" style power-up is optional (Phase 5).
- Each fighter: 4 normals (stand/crouch/air variants), 1 throw, 2 specials (command inputs), 1 super.
- Hitboxes/hurtboxes defined per frame in JSON: `{startup, active, recovery, hitbox:[x,y,w,h], damage, hitstun, blockstun, pushback, cancelInto:[...]}`. Debug overlay (toggle) draws all boxes.

## 7. Online multiplayer design

1. **Room code flow first** (host creates 4-char code, friend joins) → then random matchmaking queue.
2. Server only does: signaling (SDP/ICE exchange), room management, ping measurement, WebSocket relay fallback. **Server does not run the simulation.**
3. Peers exchange only inputs (1 byte/frame + frame number + redundant last N inputs to survive packet loss) over an unordered, unreliable DataChannel (`ordered:false, maxRetransmits:0`).
4. **Rollback:**
   - Local input applied immediately (zero input lag for own player).
   - Remote input predicted = last known input.
   - Snapshot state every frame in a ring buffer (≈ 10–12 frames).
   - On receiving a remote input that differs from the prediction: load snapshot, re-simulate to current frame in one tick.
   - Configurable input delay (default 1–2 frames) + max rollback window (default 8 frames); beyond it, stall and show "poor connection".
5. Exchange checksum every ~30 frames; if mismatch → log desync, end match gracefully with error message (and dump input log for debugging).
6. Frame sync: periodically exchange frame advantage and slightly adjust local speed (≤ 2%) so peers stay in lockstep.
7. Show ping, rollback frames, connection quality indicator in a small debug HUD.
8. Handle disconnect/reconnect, tab backgrounding (mobile browsers pause timers) → auto-forfeit after timeout.
9. Basic abuse limits on server: rate-limit messages, max rooms per IP, room TTL.

## 8. Content (original)

Create 6 original fighters with distinct archetypes, e.g.: rushdown (fast), grappler (heavy), zoner (projectile), all-rounder, counter-fighter, trickster. Give each: name, 1-line backstory, color palette, move list in JSON. Start with **2 playable fighters** in Phase 1–3, add the rest in Phase 4–5. 2–3 stages (parallax layers, original art).

## 9. Mobile UX

- Landscape only; scale to fit with fixed internal resolution (e.g. 384×224 or 640×360, pixel-perfect scaling, `image-rendering: pixelated`).
- Touch controls: left = virtual **joystick/D-pad with 8-direction + dead-zone**, right = 4 attack buttons (A B C D) + extra buttons (Roll/Dodge, Throw macro, Special-shortcut). Full **multi-touch**; no scrolling/zoom/long-press menus (`touch-action: none`, prevent context menu).
- **Motion-input assist**: optional toggle where swipe/one-tap shortcut buttons trigger specials (so mobile players don't need precise quarter-circles). Assist inputs are converted to the same input bitmask stream so the sim and netcode are unchanged.
- Adjustable button size/position/opacity, haptic feedback (`navigator.vibrate`), keyboard + gamepad support for desktop testing.
- Performance budget: stable 60 FPS on a mid-range Android phone; keep atlas textures ≤ 2048², limit particles, avoid allocations in the frame loop (no garbage-per-frame).
- Audio: unlock on first tap, short SFX via Web Audio, low-latency; original/CC0 sounds only.

## 10. Phases and acceptance criteria

**Phase 0 – Setup (½ day)**
Monorepo, Vite, Phaser boot scene, Vitest, ESLint/Prettier, GitHub Actions CI (lint+test), docs skeleton.
✔ `npm run dev` shows a scaled canvas; `npm test` passes.

**Phase 1 – Deterministic core, local 1v1 (core of the project)**
Sim, tuning.json, state machine (idle/walk/run/backstep/crouch/jump/roll/normals/hitstun/blockstun/knockdown), hitbox system, health, rounds, timer, placeholder-rectangle rendering, keyboard control for 2 players on one screen, debug box overlay.
✔ Determinism test passes; movement feels fast (I will play-test); 60 FPS stable; all frame data comes from JSON.

**Phase 2 – Mobile controls + PWA**
Touch UI, multi-touch, scaling, manifest, service worker, landscape lock, input buffer, motion parser, assist mode.
✔ Playable on a real phone browser vs a local CPU dummy; no accidental scroll/zoom.

**Phase 3 – Online (hardest)**
Server (rooms, signaling), WebRTC DataChannel transport, WebSocket relay fallback, rollback engine, checksum desync detector, latency simulator (`?lag=80&loss=5`) for testing.
✔ Automated test: two sim instances with simulated 100 ms latency + 5% loss + jitter stay checksum-identical across 10,000 frames. Two real phones on different networks can finish a match.

**Phase 4 – Content and 3v3**
More fighters, team mode, power gauge + supers, throws, 2–3 stages, original sprite integration (sprite atlas pipeline with animation → frame-data link), SFX/music.
✔ Full 3v3 match works online.

**Phase 5 – Polish and release**
Matchmaking queue, rematch, training mode, replays (input log), settings, rank/ELO (optional), basic analytics-free privacy, Capacitor build for Android, optional app-store prep.
✔ Public test build link shared.

## 11. Working rules for you (the agent)

1. Commit after every meaningful step with clear messages; one phase = one branch/PR-style milestone.
2. Write tests for the sim and netcode *before* building UI around them.
3. Never put game logic in Phaser scenes. Never use floats or random in `/shared`.
4. Keep dependencies minimal; justify any new one in `docs/DECISIONS.md`.
5. Every phase ends with: what works, what's known-broken, how to run it, what I should test manually.
6. Don't fabricate asset licenses; if unsure, use placeholder art.
7. Prefer simple and working over clever. Performance profile before optimizing.
8. Ask me only for things you truly can't decide (e.g., art direction choices, accounts/API keys). Otherwise proceed.

## 12. First task (start now)

Do Phase 0 and Phase 1. Deliver: runnable local 1v1 with placeholder rectangles, fast movement (walk/run/jump/roll), 4 attack buttons with working hitboxes, health, rounds, determinism test, and `docs/STATUS.md` explaining how to run and tune `tuning.json`.
