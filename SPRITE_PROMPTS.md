# SPRITE_PROMPTS.md — Original character art prompts (Muse / any image AI)

Rules: original designs only. Never write "King of Fighters", "KOF", "SNK" or any real character/game name in a prompt. Do not upload copyrighted sprites as reference. Log tool + date + licence note for every generated image in `docs/ASSET_LICENSES.md`.

## 0. Workflow (important)

1. Generate **character design sheet** first (step A) until you like it. Save as the master reference.
2. For every pose, upload the master sheet as reference and use the pose prompt (step B). Keep seed/style words identical.
3. Clean in Aseprite/LibreSprite: remove background, fix palette (max 32 colors per fighter), align feet to the same baseline, same canvas size (128x128 or 160x160), pivot = bottom center.
4. Export atlas PNG + JSON. Frame data and hitboxes stay in `/shared/characters/*.json`, not in the image.

Expect inconsistency between AI-generated frames. Plan manual cleanup, or use AI only for key poses and hand-fix the in-betweens.

## 1. Global style block (paste at the start of EVERY prompt)

```
2D pixel art character sprite for a 16-bit arcade fighting game, side view facing right,
full body visible head to feet, strong readable silhouette, bold dark outline,
limited palette (max 32 colors), flat cel shading, no anti-aliasing blur,
solid pure magenta (#FF00FF) background, no shadow, no text, no watermark, no border,
single character, consistent proportions (about 6.5 heads tall), original design.
```

## 2. Step A — Design sheet prompt (per fighter)

```
[GLOBAL STYLE BLOCK]
Character design sheet: same character in three views (front, side facing right, back),
neutral standing fighting stance, plus a small color palette strip.
Character: <FIGHTER DESCRIPTION BELOW>
```

## 3. The six original fighters

### 3.1 Zephyr (rushdown, fast)
Lean male kickboxer, early 20s, short swept-back black hair with a teal streak, sleeveless white-and-teal track jacket, loose grey training pants, bare taped fists, light running shoes with teal soles. Energy colour: teal speed lines.
Super: rapid multi-hit rush ending in a spinning kick, teal afterimages.

### 3.2 Bajra (grappler, heavy)
Very tall, broad-shouldered man, shaved head, thick beard, torn orange sleeveless vest over a bare chest, heavy iron wrist guards, dark baggy trousers with rope belt, bare feet with wrapped ankles. Energy colour: orange-gold shock rings.
Super: grabs the opponent and slams them with a ground-shaking impact.

### 3.3 Nila (zoner, projectiles)
Slim woman, late 20s, long dark-blue braid, long navy coat open at the front over a light-blue fitted top, short black shorts, knee-high boots with silver trim, small floating energy orbs around her hands. Energy colour: electric blue.
Super: wide wave of blue orbs that fills half the screen.

### 3.4 Arman (all-rounder)
Athletic man, mid 20s, short messy brown hair, plain off-white martial-arts gi top with sleeves rolled up, dark green sash, grey trousers, black fingerless gloves, simple barefoot stance. Energy colour: pale green wind slashes.
Super: powerful uppercut combo with a large wind burst.

### 3.5 Shiuli (counter-fighter)
Calm woman, early 30s, hair in a high silver-white bun, deep-purple wrap jacket with long sleeves and high collar, black fitted trousers, light wrist wraps, thin silver bracelet. Energy colour: violet mirror-like shimmer.
Super: absorbs an attack with a counter pose, then releases a violet burst.

### 3.6 Miraj (trickster)
Slender person in a half-face carnival mask (gold and black), tousled dark hair, yellow-and-black patterned jacket with asymmetric sleeves, striped trousers, mismatched boots, small hidden blades at the belt. Energy colour: yellow sparks and smoke.
Super: teleporting flurry strikes from different angles, smoke bursts.

## 4. Step B — Pose prompt template

```
[GLOBAL STYLE BLOCK]
Use the attached character design sheet as the exact reference (same face, outfit, colours, proportions).
Pose: <POSE FROM LIST BELOW>. Same canvas framing and ground line as the idle pose, feet on the same baseline.
```

### 4.1 Required poses (map 1:1 to `animations.json` and move ids)

Movement and states:
- idle (3–4 frames breathing), walk-forward (6), walk-back (6), run (6), back-step (3), crouch-down (2) + crouch-hold (1), stand-up (2)
- jump-up (2), jump-peak (1), fall (2), land (2), super-jump (stretched pose), roll/dodge (6, low and fast)
- block-stand (1), block-crouch (1)
- hit-light-high, hit-light-low, hit-heavy, hit-air, knockdown (3), get-up (3)
- throw-grab, throw-hit (2), thrown (2)
- win-pose (3), lose/KO (3)

Normal attacks (each: windup / active / recovery frames, 3–5 frames):
- 5A light punch, 5B light kick, 5C heavy punch, 5D heavy kick
- 2A, 2B, 2C, 2D (crouching versions)
- j.A, j.B, j.C, j.D (air versions)

Specials and super (per fighter, 4–8 frames each):
- 236A special 1 (e.g. projectile cast or forward rush)
- 623C special 2 (rising/anti-air move)
- 214 + button optional third special
- 2363214C super (large dramatic key pose + 6–8 frame animation)
- Effects as separate transparent images: projectile loop, projectile hit, hit spark (light/heavy), block spark, dust (run/land), super flash.

## 5. Effects prompt (separate from characters)

```
2D pixel art effect sprite sheet for a 16-bit fighting game, <EFFECT>, 6 frames in a row,
solid pure magenta (#FF00FF) background, limited palette in <ENERGY COLOUR>, no text, original design.
```

Effects: light hit spark, heavy hit spark, block spark, dust puff, energy projectile loop, projectile impact, super flash.

## 6. Stage prompts (parallax layers, original setting: "Neon Dojo Tournament")

```
2D pixel art background layer for a 16-bit fighting game stage, side view, wide 1536x448 image,
<LAYER>, cyber-street / rooftop dojo at night in a South Asian city, neon signs with invented
fictional text, no real brands, no real landmarks, limited palette, no characters.
```

Layers: far sky/skyline, mid buildings/crowd, near ground with fighting floor line, foreground details.
Make 2–3 stages: rooftop dojo, rainy market street, riverside dock.

## 7. Checklist before an image enters the game

- [ ] Looks nothing like any existing game character (no similar outfit + hair + colour + pose combos)
- [ ] No text, logos, brand names, watermark visible
- [ ] Background removed, same canvas size, feet on the same baseline
- [ ] Palette reduced, file name follows `fighter-move-frame.png`
- [ ] Entry added to `docs/ASSET_LICENSES.md` (tool, date, prompt, licence note)
