# SPEC_ADDENDUM.md — Resolved specification gaps (authoritative)

This file resolves the gaps found in the pre-start review. **Where this file conflicts with `PRD.md`, `TRD.md` or `AGENT_PLAN.md`, this file wins.** `INSTRUCTIONS.md` stays the source of truth for progress. All numbers below are defaults: put them in `shared/rules.json` / `shared/tuning.json`, never hard-code. Log any change in `DECISIONS.md`.

## A. Phase scope (single source of truth)

`INSTRUCTIONS.md` decides what belongs to which phase. `AGENT_PLAN.md` is historical background only.
- Phase 1: movement, normals, hit/block, throw + escape, rounds, timer.
- Phase 2: motion inputs, specials, super, power gauge, projectiles, touch controls, PWA, CPU.
- Phase 3: online rollback.
- Phase 4: more fighters, 3v3, stages, sprites, audio.
- Phase 5: polish, matchmaking, training, replays, Android build.

First two playable fighters (Phase 1-3): **Zephyr (rushdown)** and **Bajra (grappler)** — contrasting archetypes stress-test the sim, and their design sheets already exist. Phase 1 uses placeholder rectangles.

## B. Input byte and extra buttons

The 8-bit input byte (`UP DOWN LEFT RIGHT A B C D`) **does not change**. Extra touch buttons are converted by the client input layer into this same byte:

| Touch button | Resulting input |
|---|---|
| Roll | A+B pressed on the same frame (direction held on stick = roll direction; none = forward roll) |
| Throw | C+D pressed on the same frame |
| Special shortcut | macro sequence (section C), written into the normal byte stream |

Same rules apply on keyboard/gamepad (A+B = roll, C+D = throw). Forward/back + C or D while close also throws.

**Priority per frame (sim resolves in this order):**
1. Throw (C+D) — only if grounded, actionable and target in throw range
2. Roll (A+B)
3. Super / special motion (motion parser, most complex motion wins: super > special)
4. Normal attacks (D > C > B > A when several pressed without a combo)
5. Jump / crouch / run / walk

**Direction conflicts (SOCD):** LEFT+RIGHT = neutral. UP+DOWN = UP.
**Facing:** left/right are absolute on the wire; converted to forward/back with facing inside the sim.

## C. Assist / one-tap special shortcut

- A shortcut is **not instant**. It injects the motion directions over frames, then presses the button on the last frame.
- Frame budget: 2 frames per direction step. `236+button` = 6 frames of motion, button on frame 7. `623+button` = 6 frames. `2363214+button` (super) = 14 frames. Make the numbers JSON-configurable.
- Macro inputs go into the **same input stream** that is sent online (frame-stamped like normal inputs), so netcode needs no change.
- Any real stick direction pressed while a macro runs **cancels the macro**. A new macro press replaces a running macro.
- A macro never starts while the fighter is in hitstun/knockdown (it is dropped, not queued).
- Assist is a settings toggle (default ON on touch, OFF on desktop). Settings UI must say shortcuts have a few frames of delay compared with manual motions.

## D. Rollback correctness tests (replace the old 3.5 wording)

The old criterion "two sims identical for 10,000 frames" is wrong: predicted state differs between peers during play, which is normal. The correct criterion:

> For every frame N, once both players' inputs for frame N are confirmed, and after any needed rollback finishes, the checksum of frame N is identical on both peers.

Required automated tests (headless, loopback transport):
1. 100 ms latency + 5% loss + jitter, 10,000 frames, checksum parity on all confirmed frames.
2. Packet reorder, duplicate packets, burst loss (e.g. 30 consecutive packets dropped).
3. Lost-input recovery via redundancy + ack.
4. Rollback window exceeded → stall → recovery with parity restored.
5. **Frame number wrap:** run a session whose start frame is near 65,500 (u16 wraps in ~18 min 12 s). Internally keep frame numbers as plain non-wrapping integers; on the wire use u16 and "unwrap" relative to the newest known frame (wrap-safe compare).
6. Keep a checksum history ring for at least the last 600 confirmed frames so a delayed checksum message can still be compared.
7. Snapshot/restore must not change checksums.

## E. Slow-frame handling (replaces "drop after 5 steps" for online)

- **Offline / local modes:** max 5 catch-up steps per rAF, then discard leftover time (spiral protection). Fine.
- **Online:** the simulation never skips or drops a frame. If the device falls behind, it keeps stepping (up to 8 steps per rAF, including rollback resims) and reports its frame advantage to the peer so the **other peer slows down (≤ 2% stretch)** or briefly stalls.
- If one peer stays > 12 frames behind for > 3 s: show "poor connection" and stall.
- If a peer sends no inputs for 5 s: pause, show reconnecting; at 10 s: end match as forfeit/disconnect.
- Tab hidden / app backgrounded: send "away" message; same timeouts apply.

## F. Combat rules (defaults, all in `shared/rules.json`)

- **Simultaneous strikes:** trade (both take damage and hitstun). A throw loses to an active strike on the same frame; a throw beats a target that is in attack startup.
- **Double KO:** round is a draw; both fighters get a round point. If that gives both match point, play one sudden-death extra round.
- **Timeout:** higher HP percentage wins the round; equal = draw (same as double KO).
- **Attack heights** (field `level` in move JSON): `high`, `mid`, `low`, `overhead`.
  - Stand block stops high, mid, overhead. Crouch block stops high, mid, low. Low must be crouch-blocked, overhead must be stand-blocked.
  - Air attacks (`j.*`) count as `mid`.
  - **No air block** in v1.
- **Throw:** range 60 px (6000 subpixels), needs both fighters grounded and actionable, startup 3 frames, no invulnerability. Escape: defender presses C+D within 12 frames of the grab → both pushed apart, no damage. Cannot throw targets in hitstun, blockstun, knockdown, airborne or rolling.
- **Hitstop:** round timer does not tick, projectiles and animations freeze for the affected fighters. Input history keeps recording; buffered inputs (4-6 frames) are aged only on non-hitstop frames so they survive hitstop.
- **Jump types:** jump starts on the same frame UP is pressed (no added latency). If UP is released within 3 frames of take-off → short hop (reduced velocity). Super jump = DOWN then UP within 8 frames. Tune via `tuning.json`.
- **Run:** double-tap forward within 10 frames (or dedicated touch button).
- **Power gauge:** max 3000 (3 stocks of 1000). EX special costs 500, super costs 1000. Gain rules per move in JSON (`meterGain`, plus damage-taken gain).
- **3v3 rules (Phase 4):** each fighter has its own HP; defeated fighter is replaced by the next in order; the winner **keeps current HP**; the next fighter enters at full HP. Power gauge is **per team** and carries over. A team wins when all 3 opponents are KO. Bout timer 60 s per fighter-vs-fighter bout; timeout → higher HP% stays, the other is removed (equal = both removed). Double KO → both replaced.

## G. Hosting and cost honesty

- Client: static hosting (Cloudflare Pages or GitHub Pages).
- Server for first public test: **Render free web service** (signaling + relay). It sleeps when idle (wake-up ≈ 1 minute): show a "waking server…" screen and keep a health ping only if it stays within free limits. Remove Fly.io from the plan (no permanent free tier for new accounts). Railway is optional, not a guarantee.
- Do not promise $0 at scale; free tiers limit relay capacity. Document limits in `docs/DEPLOY.md`.
- Android: direct APK sharing is free. Play Store publishing has separate fees and is **outside the $0 scope**. Android toolchain (JDK, SDK, Gradle) is only needed in Phase 5; do not block earlier phases on it.

## H. Art workload

- Gameplay first with placeholder rectangles (Phases 1-3).
- Prove the sprite pipeline end-to-end with **one fighter (Zephyr)** before producing the rest: idle, walk, run, jump, 5A, 5D, hit, block, crouch first (see `docs/POSE_PROMPTS.md`).
- AI-generated art is not automatically CC0. Before release, check the generator's terms for commercial use and log tool, date, prompt, terms link in `ASSET_LICENSES.md`.
- Never use KOF/SNK characters, names or look-alikes as a design target or reference.

## I. Edits the agent must apply now

1. `CLAUDE.md` → in "Docs" list add `docs/SPEC_ADDENDUM.md` (authoritative rules) and in workflow step 1 read it after `INSTRUCTIONS.md`.
2. `INSTRUCTIONS.md` → add task `0.10 Read SPEC_ADDENDUM.md, create shared/rules.json with section F defaults`; replace task 3.5 text with the section D criteria; add 3.5b-3.5g for the extra tests; update task 2.8 with section C rules; update 3.10/3.14 with section E.
3. `TRD.md` → update §4.1 (game loop, offline vs online), §5.4 (frame numbers, checksum history), §10 (hosting) to match this file.
4. `AGENT_PLAN.md` / `agent-plan.md` → add a first line: "Historical. docs/INSTRUCTIONS.md and docs/SPEC_ADDENDUM.md take precedence."
5. Log "Fighters for Phase 1-3: Zephyr + Bajra" in `DECISIONS.md`.
