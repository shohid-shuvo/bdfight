# PRD — Product Requirements Document

**Working title:** Neon Dojo Tournament
**Owner:** Shohidul
**Status:** Draft v1

## 1. Vision
A fast, responsive 2D fighting game you can play on a phone browser against a friend or a random opponent online, with the classic 90s arcade team-fighter feel — but entirely original characters, art and audio.

## 2. Goals
- G1: Snappy, fast movement and near-zero input lag (local player feels instant).
- G2: Smooth online play via rollback netcode, playable on mobile networks.
- G3: Mobile-first controls that are usable without a controller.
- G4: Built and hosted for **$0** (free tools, free tiers).
- G5: Legally safe: original IP only.

## 3. Non-goals (for now)
- No real-money purchases, ads, accounts with email/password in MVP.
- No 3D, no console/Steam release in MVP.
- No cloning of any existing game's characters, assets or names.
- No server-authoritative simulation (peer rollback instead).

## 4. Target users
- Casual and hardcore fighting-game fans on Android/iOS phones (primarily Bangladesh and South Asia, but global-capable).
- Friends playing together via a room code.

## 5. Platforms
- Primary: mobile browsers (Chrome Android, Safari iOS), installable PWA, landscape.
- Secondary: desktop browsers (keyboard/gamepad) for development and play.
- Later: Android APK via Capacitor.

## 6. Core features

### 6.1 Gameplay
- 2D side-view, 1v1 rounds (Phase 1) and **3v3 team battle** (Phase 4).
- 4 attack buttons: A (light punch), B (light kick), C (heavy punch), D (heavy kick).
- Movement: walk, run, back-step, roll/dodge, jump, short hop, super jump, crouch.
- Defense: stand/crouch block, throw, throw escape.
- Command inputs: quarter-circle, dragon-punch, half-circle style motions (+ button).
- Power gauge: fills on damage dealt/taken; spend for enhanced specials; full gauge for Super move. Optional MAX-style power-up mode (Phase 5).
- Combos with damage scaling and juggle limits; combo counter.
- Round system: best of 3, 99-second timer (configurable).

### 6.2 Online
- Private match via 4-character room code.
- Random matchmaking queue (Phase 5).
- Rollback netcode, connection quality indicator, rematch option.
- Graceful disconnect handling.

### 6.3 Mobile UX
- Virtual joystick/D-pad + 4 attack buttons + extra buttons (roll, throw, special shortcuts).
- Multi-touch, no scroll/zoom, adjustable layout/size/opacity, haptics.
- Motion-input assist (one-tap special shortcuts) toggle.

### 6.4 Content
- 6 original fighters (2 in MVP, 6 by Phase 4/5), 2–3 original stages, original SFX/music.
- Fighter archetypes: rushdown, grappler, zoner, all-rounder, counter-fighter, trickster.
- Single-player: training mode and a basic CPU opponent.

### 6.5 Settings
- Control layout, sound volume, input delay, language (English; Bangla later), show/hide debug HUD.

## 7. Legal / IP requirements
- No KOF/SNK name, characters, moves, sprites, audio, stages, logos, fonts.
- Every asset has a recorded source and license in `docs/ASSET_LICENSES.md`.
- Original game name, logo, character names, stories.
- Generic mechanics (button layout, motion inputs, gauge, team format) are allowed.
- Commercial release requires a legal review (the team is not a law firm).

## 8. Success metrics
- Stable 60 FPS on a mid-range Android phone.
- Local input-to-screen latency ≤ 2 frames.
- Online matches complete without desync in ≥ 99% of test matches (with 100 ms latency, 5% loss simulated).
- Two players on different networks can finish a full match using a room code.
- Crash-free sessions ≥ 99%.

## 9. Release scope
- **MVP (end of Phase 3):** local 1v1 + mobile controls + online room-code 1v1, 2 fighters, placeholder or basic art.
- **v1.0 (end of Phase 5):** 3v3, 6 fighters, 2–3 stages, matchmaking, training mode, polished UI, Android build.

## 10. Risks
| Risk | Mitigation |
|---|---|
| Rollback desync | Deterministic sim, checksums, automated lag/loss tests |
| WebRTC blocked on some mobile networks | WebSocket relay fallback, TURN free tier |
| Free server sleeps | Health ping, "waking server" UI |
| Mobile performance | Small internal resolution, atlas size limits, no per-frame allocation |
| IP infringement | Original-only assets policy, license log |
| Touch controls too hard | Assist mode, adjustable layout, playtesting |
