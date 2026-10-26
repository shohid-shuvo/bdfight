# INSTRUCTIONS — Phase Checklist (source of truth for progress)

> **Agent rules for this file**
>
> 1. Work top-down. Do not start a phase until the previous phase header is `[x]`.
> 2. Tick each task `[x]` **immediately** when it is actually working (tests + lint pass). Never tick something that isn't done.
> 3. When every task and acceptance criterion in a phase is `[x]`: tick the phase header, fill `Completed on: YYYY-MM-DD`, and add an entry to `docs/STATUS.md` (what works, known issues, how to run, what the human should test manually).
> 4. If a task is blocked, write `BLOCKED: reason` under it, log in `docs/DECISIONS.md`, continue with the next unblocked task in the same phase.
> 5. Read `CLAUDE.md`, `docs/PRD.md`, `docs/TRD.md` and `docs/SPEC_ADDENDUM.md` before starting. SPEC_ADDENDUM.md wins on specification conflicts; this checklist controls progress.

**Overall progress**

- [ ] Phase 0 — Setup
- [ ] Phase 1 — Deterministic core, local 1v1
- [ ] Phase 2 — Mobile controls + PWA
- [ ] Phase 3 — Online multiplayer (rollback)
- [ ] Phase 4 — Content + 3v3
- [ ] Phase 5 — Polish + release

---

## [ ] PHASE 0 — Setup

**Completed on:** ____-**-**

- [x] 0.1 Init git repo, `.gitignore`, `.editorconfig`, MIT-or-private license note
- [x] 0.2 npm workspaces: `shared`, `client`, `server`, `tools`
- [x] 0.3 Vite client boots a Phaser scene with a scaled, letterboxed canvas
- [x] 0.4 Vitest configured; one trivial passing test in `/shared`
- [x] 0.5 ESLint + Prettier configured; `npm run lint` passes
- [x] 0.6 Root scripts from `CLAUDE.md` all work (`dev`, `dev:server`, `test`, `lint`, `build`)
- [ ] 0.7 GitHub Actions CI: install, lint, test, build
  - **BLOCKED:** No GitHub remote is configured, so the workflow cannot run remotely yet.
- [x] 0.8 Create `docs/DECISIONS.md`, `docs/STATUS.md`, `docs/ASSET_LICENSES.md`
- [x] 0.9 Minimal `server` that starts and serves `/health`
- [x] 0.10 Read SPEC_ADDENDUM.md, create shared/rules.json with section F defaults

**Acceptance**

- [x] `npm run dev` shows the scaled canvas
- [ ] `npm test` and `npm run lint` pass; CI green

---

## [ ] PHASE 1 — Deterministic core, local 1v1

**Completed on:** ____-**-**

- [ ] 1.1 `fixed.js` (integer helpers, seeded PRNG) + tests
- [ ] 1.2 `tuning.json` + character JSON schema + validator script (`/tools`)
- [ ] 1.3 `createState`, `step`, `snapshot/restore`, `checksum` skeleton
- [ ] 1.4 **Determinism test:** same input log twice → identical checksums every frame
- [ ] 1.5 Snapshot/restore round-trip test
- [ ] 1.6 Movement: walk, run, back-step, crouch (fast, tuned via JSON)
- [ ] 1.7 Jump arc, short hop, super jump, gravity, stage bounds, facing flip
- [ ] 1.8 Roll/dodge with invulnerability frames
- [ ] 1.9 Input byte encoding + 30-frame history + 4–6 frame input buffer
- [ ] 1.10 Action state machine (idle/walk/run/jump/crouch/attacks/hitstun/blockstun/knockdown)
- [ ] 1.11 4 normal attacks (A/B/C/D) data-driven with startup/active/recovery
- [ ] 1.12 Hitbox/hurtbox/pushbox resolution, hit vs block, damage, hitstun, pushback, hitstop
- [ ] 1.13 Throw + throw escape
- [ ] 1.14 Health, KO, round system (best of 3), 99s timer
- [ ] 1.15 Two placeholder fighters (original names) as JSON only
- [ ] 1.16 Fixed-timestep game loop (rAF accumulator) in client
- [ ] 1.17 Placeholder renderer (rectangles + labels), HUD (health bars, timer, round pips)
- [ ] 1.18 Keyboard control for 2 players on one screen
- [ ] 1.19 Debug overlay (boxes, inputs, frame counter, FPS) toggle
- [ ] 1.20 Fuzz test: random inputs 10k frames, no NaN / out-of-bounds / crashes

**Acceptance**

- [ ] Determinism + fuzz tests pass
- [ ] Movement feels fast (human play-test sign-off recorded in `docs/STATUS.md`)
- [ ] 60 FPS stable on desktop
- [ ] All frame data and tuning come from JSON (no hard-coded gameplay numbers)

---

## [ ] PHASE 2 — Mobile controls + PWA

**Completed on:** ____-**-**

- [ ] 2.1 Responsive integer-scaled canvas, landscape-only handling, rotate-device prompt
- [ ] 2.2 Virtual joystick (8-way, dead-zone, floating origin)
- [ ] 2.3 Action buttons A/B/C/D + Roll + Throw, multi-touch per-pointer tracking
- [ ] 2.4 Block scroll/zoom/long-press/context menu (`touch-action: none`)
- [ ] 2.5 Motion parser (236, 214, 623, 41236, 2363214…) with 12–15 frame window + tests
- [ ] 2.6 Specials per fighter (2 each) + 1 super data-driven; projectile pool
- [ ] 2.7 Power gauge (build on hit/damage, EX/super spend)
- [ ] 2.8 Assist mode: same-byte motion macros, 2 frames per direction then button on next frame (236/623: 6 motion frames; super: 14); real stick cancels, new macro replaces, hitstun/knockdown drops; default ON touch/OFF desktop; configurable timings and shortcut-delay disclosure (§C)
- [ ] 2.9 Control layout settings (size, position, opacity), haptics toggle
- [ ] 2.10 Gamepad support
- [ ] 2.11 PWA: manifest, icons, service worker, install prompt, wake lock in match
- [ ] 2.12 Simple CPU opponent (training dummy + basic AI)
- [ ] 2.13 Menu scene (Local, Online placeholder, Training, Settings)

**Acceptance**

- [ ] Playable on a real mid-range Android phone vs CPU at stable 60 FPS
- [ ] No accidental scroll/zoom/selection while playing
- [ ] Installable as PWA; works offline for local modes

---

## [ ] PHASE 3 — Online multiplayer (rollback)

**Completed on:** ____-**-**

- [ ] 3.1 Server: rooms (4-char code), WebSocket signaling, ping/pong RTT
- [ ] 3.2 Server limits: rate limit, max rooms/IP, room TTL, message validation, origin allowlist
- [ ] 3.3 Abstract `Transport` interface + `LoopbackTransport` (latency/jitter/loss)
- [ ] 3.4 Rollback engine (input delay, prediction, snapshot ring, resim, stall on max rollback)
- [ ] 3.5 **Netcode test:** loopback (100 ms latency, 5% loss, jitter), 10,000 frames → for every frame N, after both inputs are confirmed and rollback completes, frame N checksums match on both peers (predicted states may differ)
- [ ] 3.5b Packet reorder, duplicates and burst loss (e.g. 30 consecutive dropped packets)
- [ ] 3.5c Lost-input recovery through redundancy + ack
- [ ] 3.5d Exceed rollback window → stall → recovery with confirmed-frame parity
- [ ] 3.5e Start near frame 65,500 and cross u16 wrap; non-wrapping internal integers and wire unwrapping relative to newest known frame
- [ ] 3.5f Checksum history ring retains at least 600 confirmed frames and compares delayed checksum messages
- [ ] 3.5g Snapshot/restore preserves checksums
- [ ] 3.6 Redundant input packets + ack handling + wrap-safe frame numbers
- [ ] 3.7 WebRTC DataChannel transport (unordered, no retransmit) + STUN/TURN config via env
- [ ] 3.8 WebSocket relay fallback transport + automatic fallback
- [ ] 3.9 Handshake: version, seed, characters, tuning/data hash; mismatch handling
- [ ] 3.10 Frame-advantage sync: online never drops frames; max 8 steps/rAF including resims; ahead peer slows ≤ 2% or briefly stalls; > 12 frames behind for > 3 s → poor-connection stall (§E)
- [ ] 3.11 Periodic checksum exchange + desync handling (input log dump)
- [ ] 3.12 Event de-duplication for audio/VFX during rollback
- [ ] 3.13 Online lobby UI: create room, join by code, connection quality HUD (ping, rollback frames)
- [ ] 3.14 Disconnect/background handling: away message on hide; no inputs for 5 s → pause/reconnecting, 10 s → forfeit/disconnect; rematch flow (§E)
- [ ] 3.15 `?lag=&loss=&jitter=` URL flags for real-session testing
- [ ] 3.16 `docs/DEPLOY.md`; client deployed (Cloudflare/GitHub Pages) + server deployed (free tier) + health ping

**Acceptance**

- [ ] Automated netcode parity test passes in CI
- [ ] Two real phones on different networks complete a full match via room code
- [ ] Own-player inputs feel instant (no added local lag beyond configured delay)

---

## [ ] PHASE 4 — Content + 3v3

**Completed on:** ____-**-**

- [ ] 4.1 Fighters 3–6 (original names/archetypes: rushdown, grappler, zoner, all-rounder, counter, trickster) as JSON
- [ ] 4.2 Team select screen (3 fighters per side) + order
- [ ] 4.3 3v3 team battle rules in sim (replacement, HP carry, round/match flow)
- [ ] 4.4 Combo system polish: damage scaling, juggle limit, combo counter
- [ ] 4.5 Supers with cinematic freeze/effects; optional MAX-style mode flagged for Phase 5
- [ ] 4.6 2–3 stages (parallax layers, bounds) — original or CC0 only
- [ ] 4.7 Sprite atlas pipeline: animations.json linked to `actionFrame`; keep placeholder mode as fallback
- [ ] 4.8 Original sprite art integrated for at least 2 fighters (record sources in `ASSET_LICENSES.md`)
- [ ] 4.9 SFX + music (original/CC0), low-latency Web Audio, unlock on first tap
- [ ] 4.10 Balance pass using tuning/frame-data JSON only
- [ ] 4.11 Online 3v3 works (team data in handshake + checksum)
- [ ] 4.12 Rollback performance profiling with larger state

**Acceptance**

- [ ] Full 3v3 match works locally and online
- [ ] Netcode parity test updated for 3v3 and passing
- [ ] Every asset has a license entry; no KOF/SNK material anywhere

---

## [ ] PHASE 5 — Polish + release

**Completed on:** ____-**-**

- [ ] 5.1 Matchmaking queue (random opponent)
- [ ] 5.2 Rematch, quick-restart, post-match screen
- [ ] 5.3 Training mode (frame data display, input display, dummy settings, reset)
- [ ] 5.4 Replays (input-log based, deterministic playback)
- [ ] 5.5 Settings: audio, layout, input delay, language (English + Bangla), debug HUD toggle
- [ ] 5.6 Optional: simple rating/ELO (no personal data)
- [ ] 5.7 Performance pass: zero per-frame allocations, profiler on a real phone
- [ ] 5.8 Accessibility + UX polish (button sizes, contrast, tutorial/how-to-play)
- [ ] 5.9 Capacitor Android build (APK/AAB), app icon, splash
- [ ] 5.10 Privacy note + licenses page; legal self-check of names/assets
- [ ] 5.11 Public test build link shared; collect feedback
- [ ] 5.12 Final `docs/STATUS.md` summary + known issues + roadmap

**Acceptance**

- [ ] Public test build playable by outside testers
- [ ] ≥ 99% of test matches finish without desync/crash
- [ ] All checklists above are `[x]`

---

## Phase completion log (agent fills in)

| Phase | Completed on | Notes |
| ----- | ------------ | ----- |
| 0     |              |       |
| 1     |              |       |
| 2     |              |       |
| 3     |              |       |
| 4     |              |       |
| 5     |              |       |
