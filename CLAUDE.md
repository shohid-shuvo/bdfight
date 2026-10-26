# CLAUDE.md — Project Memory & Rules

Read this file first in every session. Then read `docs/INSTRUCTIONS.md` to find the current phase.

## Project

Mobile-first 2D online fighting game (KOF'97-style gameplay feel, **100% original IP**). Working title: **Neon Dojo Tournament**. Free tools and free hosting only.

Docs:

- `docs/PRD.md` — what we build and why
- `docs/TRD.md` — how we build it (architecture, netcode, schemas)
- `docs/INSTRUCTIONS.md` — phase checklist (the source of truth for progress)
- `docs/SPEC_ADDENDUM.md` — authoritative rules; takes precedence over conflicting project docs
- `docs/DECISIONS.md` — log of decisions you made (create if missing)
- `docs/ASSET_LICENSES.md` — source + license of every asset (create if missing)

## Stack

JavaScript (ES modules), Vite, Phaser 3 (rendering only), Node.js + `ws` (server), WebRTC DataChannel (netcode transport), Vitest (tests), PWA → Capacitor.

## Folder layout

```
/shared    deterministic simulation (pure JS, no DOM, no Phaser)
/client    Phaser renderer, touch UI, audio, netcode client
/server    signaling, rooms, matchmaking, WebSocket relay fallback
/tools     debug / frame-data tools
/docs      PRD, TRD, INSTRUCTIONS, DECISIONS, STATUS, ASSET_LICENSES
```

## Commands (keep these working; update here if they change)

- `npm run dev` — start client dev server
- `npm run dev:server` — start signaling server
- `npm test` — run Vitest
- `npm run lint` — ESLint + Prettier check
- `npm run build` — production build

## Non-negotiable rules

1. **`/shared` must be deterministic.** No `Math.random`, `Date.now`, `performance.now`, floats for positions, or DOM/Phaser imports. Integers/fixed-point only; seeded PRNG stored in state.
2. **Game logic never lives in Phaser scenes.** Renderer reads sim state, never mutates it.
3. **Fixed 60 Hz simulation step**, independent of display refresh rate.
4. **All tuning values** (speeds, jump, frame data) come from JSON in `/shared`, never hard-coded.
5. **Zero-garbage frame loop** on the client: no per-frame object/array allocation in hot paths.
6. **IP safety:** never use KOF/SNK names, characters, move names, sprites, audio, stages, logos or fonts. Only original or CC0 assets, each recorded in `docs/ASSET_LICENSES.md`. If unsure, use placeholder art.
7. **Tests before UI:** sim and netcode get unit tests first. Determinism test must always pass.
8. Minimal dependencies; justify any new one in `docs/DECISIONS.md`.
9. Do not skip phases. Do not start a phase until the previous phase's acceptance criteria are ticked.

## Workflow for every session

1. Read `CLAUDE.md` → `docs/INSTRUCTIONS.md` → `docs/SPEC_ADDENDUM.md` → find the first unchecked task.
2. Work on it. Commit small, with clear messages.
3. When a task is done, tick it `[x]` in `docs/INSTRUCTIONS.md` **immediately** (not at the end).
4. When ALL tasks and acceptance criteria of a phase are done, tick the phase header, fill the "Completed on" date, and add a short entry to `docs/STATUS.md` (what works, known issues, how to run, what the human should test manually).
5. Run `npm test` and `npm run lint` before marking anything done. Never tick a box for something that is not actually working.
6. Ask the human only when truly blocked (art direction, accounts/keys). Otherwise choose the simplest option, log it in `docs/DECISIONS.md`, and continue.

## Code style

- ES modules, `const`/`let`, small pure functions in `/shared`.
- Data-driven: new fighters/moves = new JSON, not new code paths.
- Comments explain _why_, not _what_.
- Name things in English; user-facing strings go through a simple i18n map (English + Bangla later).

## Definition of done (per task)

Works on desktop + a real phone browser (when relevant), tests pass, lint clean, no new console errors, docs/checklist updated.
