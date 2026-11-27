# DocZap Motion Engine v1 (Nov 28 2026)

This is how Doc Zap characters move. Every episode uses it: never write new movement code inside an episode. If a movement is missing, add it to the library (`web/kit/act.js`), then use it.

First used in: Rumford's fireplace (Nov 28 2026). Built from Diyar's "Physical Character Movement Engine v3.0" and "Permanent Character Animation Engine" documents.

## Why the old movement looked like puppets
- Acting moved or stretched the **whole character card** (card `x`, `sx`/`sy`). The feet slid across the floor, and squash looked rubbery.
- Arms jumped between fixed poses, and the preset poses had different bone lengths.
- Idle motion was the same few sine waves on everyone, so it repeated like a wobble. Blinking was perfectly regular.
- Actions were arm-only: the hips, knees and spine never took part.

## The pieces
| Part | File | What it does |
|---|---|---|
| Skeleton / rig | `web/roman.js` (`romanFront`) | Draws the character from body channels: pelvis, two-bone legs (knee IK) with planted feet, spine curl, shoulders, head, and two-bone arms. Rebuild `toon.js` after any change (`cat toonbase.js roman.js > toon.js`). |
| Movement library | `web/kit/act.js` | Pure functions of the frame number. They are deterministic and return rig channels. |
| Quality control | `tools/motion_qc.mjs` | Runs the real rig on every frame without rendering and reports movement defects. |
| Episode | `web/story.js` | Only the story: cast, shots, camera, and which library actions happen when. |

## Rig channels (the card options the engine understands)
- `px`: pelvis sideways shift in design px (weight transfer). The feet stay where they are.
- `crouch` 0..1: the pelvis lowers and the knees bend (squash, landing, effort).
- `sit` 0..1: the pelvis drops to seat height, and the thighs come toward the camera.
- `chest` 0..1: the spine curls, the shoulders come forward and the head drops (a cough, crying, writing).
- `shrug` 0..1: raised shoulders (cold, fear, breathing).
- `headDrop`, `headTilt`, `look`, `tilt`: the head and the upper-body lean. The lean rotates around the hips, never around the feet.
- `fL` / `fR` = `[dx, lift]`: foot offsets in design px (planted feet, steps).
- Arms take the old presets (`hang`, `cross`, `point`, `mouth`, `slam`, `grab`, `hip`, `wave`, `cheek`, …) or `ik` with a hand target:
  - `Lh`/`Rh = [out, down]` relative to the shoulder, or
  - `LhD`/`RhD = [x, y]` in card design px, for a world contact point.
  - **Every** arm is re-solved as two bones of constant length (0.95 head heights in total), so no arm ever stretches.
- Balance: if a foot is placed further than the leg can reach, the rig lowers the pelvis instead of stretching the leg.
- Units: 1 design px = `0.00225 × card scale` metres (`DPX` in act.js). Design y 975 is the floor.

## Movement library (`web/kit/act.js`)
| Function | Use |
|---|---|
| `idle3(f, seed, energy)` | Breathing in the shoulders, irregular weight transfers through the pelvis, posture corrections and relaxed hands. Every character gets a different rhythm from its seed. |
| `blinkV(f, seed)` | Irregular blinking (1.5–5 s apart), with an occasional double blink. |
| `vnoise(t, seed)` | Smooth irregular noise. Use it instead of `Math.sin` for anything alive. |
| `strike3(f, t0, period, n, power)` | Hammer or trowel blow with the whole body: weight back → pelvis and torso wind up → accelerate → contact (hand held) → knees absorb the recoil → recover. Returns `sk` (arm), `tilt`, `px`, `crouch` and the exact `hits` frames (use them for dust, chips, sound and camera shake). |
| `cough3(f, t0, reps, gap)` | Chest contracts, shoulders forward, head down, hand to the mouth (`mk`), `reps` barks; then a breath in, straightening up and recovery. |
| `shiver3(f, seed, amp)` | Raised shoulders, irregular tremor in the shoulders and elbows, slow weight shifts. The body itself is not shaken. |
| `rubHands3(f, y, speed)` | Palms stay in contact and slide against each other. |
| `lookSeq(f, keys)` | Eyes lead, the head follows a moment later, the torso follows last. |
| `walk3(f, path, scale, stride)` | Foot-locked walk: each planted foot stays fixed in the world while the pelvis travels. Heel lifts and swings, knees take the weight, there's an eased start, and a closing step at the stop. |
| `ease`, `ease2`, `arms`, `react`, `reacts`, `pick`, `shake`, `nod` | Eased numbers, 2D targets, blended presets, reactions, expression timing, head no/yes. |

In `story.js`, the episode's `card()` helper sums the idle and the action channels and passes them to the rig. It **never** moves or stretches the card for acting. Reactions become knee compression (`crouch`) and lifted shoulders. A hop is allowed only on purpose (`hop: true`).

## Quality control (run it before every render)
```bash
node tools/motion_qc.mjs web/story.js      # every frame; ~1 minute
```
It fails on:
- feet sliding while planted (> 4 mm per frame)
- legs longer than their rest length, reversed knees
- arms that change length (IK arms exactly; presets within tolerance)
- sudden position jumps or channel snaps (tilt, px, crouch, shrug, chest, look, headTilt)
- characters inside each other
- characters floating above the floor

**PASS is required before the full render.** The Rumford episode passed on all 2,640 frames.

## Not built yet (be honest about these)
- No `character.walkTo()`-style controller class yet. Episodes call the library functions directly in `actorsAt`. A thin controller with a per-character timeline of actions is the next step.
- Not yet: running, jumping/landing, carrying a heavy box, pick-up, push/pull, kneeling, stumble/recover, laughing, fear/panic and crowd ripple reactions. The rig channels support them, but the library functions still need writing and testing.
- No cloth or hat spring physics. Hats are fixed to the head.
- Walk foot-locking assumes the walk runs mostly across the screen (along world x).
