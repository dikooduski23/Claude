# Doc Zap engine reference

The engine lives in `doczap/engine/`. This page covers the **world kit upgrade (Nov 23 2026)**, which brings the engine closer to `STYLE.md`. Every future episode gets these features without extra work. For the general pipeline, see `CLAUDE.md` and the `doczap-next-video` skill.

Watch the demo first. `web/demo_story.js` uses almost everything below in 6 seconds:

```bash
cd doczap/engine
QS="&story=demo_story.js" HASH="#raw" node render.mjs ../work/demo/plates 0-359      # split into 2-3 ranges and run them in parallel
python3 demo_audio.py ../work/demo/mix.wav
python3 compose_plates.py ../work/demo/plates ../work/demo/DocZap_EngineDemo_1080x1920.mp4 --whips 280 --audio ../work/demo/mix.wav
```

## What changed, at a glance
| Area | Where | Use it from |
|---|---|---|
| Textured materials (stone, brick, planks, plaster, dirt, snow, cobble, wood, patterned rugs) | `web/kit/kit.js` (`TEX`, `K.mat`) | `sets(K)` |
| Prop library | `web/kit/kit.js` (`K.prop.*`) | `sets(K)` |
| Room builder | `K.room()` | `sets(K)` |
| Warm flickering lights, flames, window beams, haze shafts | `K.prop.torch/candle/lantern/window`, `K.warmLight`, `K.flame`, `K.beam` | `sets(K)` |
| Lighting presets: day, sunset, night, candle, indoor | `web/kit/lights.js` (`LP`) | `LIGHTS` in story.js |
| Glass, cross-sections, 3D arrows and rings | `K.glass`, `K.section`, `K.arrow3d`, `K.ring3d` | `sets(K)` |
| Handwritten labels, arrows, red circles (camera-tracked) | `web/kit/annot.js` | `export const annotAt(f)` |
| Pop-in emotes: ? ! !? bulb heart Zzz sweat vein $ note | `web/kit/emotes.js` | `fxAt` |
| New faces: angry, furious, cry, sleepy, yawn, sideeye, scared, unimpressed | `toonbase.js` + `roman.js` | `expr:` |
| Talking mouths | `motion.talkAt` + card `talk:` | `actorsAt` |
| Face flush red/purple, anger veins | card `flush`, `flushCol`, `veins` | `actorsAt` |
| Hats above the brows: crown, helmet, cowboy, tophat, hood, turban, soldier | outfit `hat` (or card `hat`) | OUTFITS / `over` |
| Beards (full, stubble, short, long, goatee) and moustaches (pencil, chevron, handlebar, walrus) | outfit `beardStyle`, `stache` | OUTFITS |
| Outfit patterns | outfit `pattern` | OUTFITS |
| Character sheet tool | `cardsheet.mjs`, `web/cardsheet.html` | QC |
| Choose a story file per render | `?story=` (`QS="&story=x.js"`) | render.mjs |
| Plates to MP4 with whip blur and loudnorm | `compose_plates.py` | delivery |

After editing `toonbase.js` or `roman.js`, always rebuild: `cat toonbase.js roman.js > toon.js` (in `web/`).

---

## 1. Building sets with the kit: `export const sets = (K) => {...}`
`main.js` calls `sets(K)` once at load, if story.js exports it, and before the materials are converted to the final look. Whatever it returns can include `update(W, f, camera)`, which runs every frame after `worldAt`. Build each episode's sets at their own far-away X (for example `X0 = 40000`), so they don't collide with the older worlds still in `main.js`.

```js
import { LP, tint, withHaze } from './kit/lights.js';
export const sets = (K) => {
  const R = K.room({ x: 40000, w: 7, d: 6.4, h: 3.8, floor: 'planks', wall: 'stone', wallOpts: { moss: 0.25 }, ceil: 'beams' });
  K.prop.torch(R, { x: -1.4, z: -3.2, shadow: true });          // wall torch: flame + flickering light
  K.prop.window(R, { x: 0, y: 2.1, z: -3.14, kind: 'moon', depth: 0.12 });
  K.prop.rug(R, { w: 3, d: 2, pattern: 'persian' });
  return { update: (W, f) => { /* animate from worldAt flags */ } };
};
```
Every prop has the signature `K.prop.name(parent, opts)` and returns a `THREE.Group`. Its origin sits on the floor and its front faces +z. Positions are local to `parent`, which is usually the room. Common options are `x, y, z, ry` (yaw in radians).

### Materials: `K.mat(name, opts)` or `K.materials.name(opts)`
Each material is painted onto a canvas with a matching **bump map**, so torches and window light pick out the relief. Names and their main options:
- `stone`: `{ seed, hue, sat, lig, moss: 0..1 }` ashlar blocks with mortar, chips, cracks and moss.
- `brick`: `{ seed, hue, sat, lig, mortar }` running bond, with some burnt bricks.
- `planks`: `{ seed, hue, lig, n }` boards with grain, knots, nails and butt joints.
- `plaster`: `{ seed, col: [h,s,l], bricks: 0..1, stains }` with cracks, water stains and a chipped patch showing brick.
- `dirt`, `snow`, `cobble`, `woodGrain`: `{ staves: n }` gives barrel staves.
- `K.materials.rug({ pattern: 'persian'|'kilim'|'stripes'|'checker', cols: [field, border, accent, light] })` has fringed ends, which are transparent at the edges.
Every material also takes `tint` and `bump` (strength). Use `K.tbox(w,h,d,tile)` and `K.tplane(w,h,tile)` for geometry with world-scaled UVs, so the texture stays the same size on every face.

### Room: `K.room({...})`
`{ x, y, z, w, d, h, floor, wall, ceil: 'beams'|'flat'|null, open: ['front'], wallOpts, floorOpts, tile }` builds the floor, three walls (the front is open for the camera), a plank ceiling with timber beams and a stone skirting. The walls are named `back/left/right/front`. The back wall's inner face is at `z = -d/2`, so wall props go at `z = -d/2 + 0.0x`.

### Props
| Prop | Key options |
|---|---|
| `barrel` | `r, h, hollow` (`hollow: true` is a thick-walled open shell, ready for `K.section`) |
| `crate` | `s` (size), with a frame and diagonal braces |
| `table` | `w, d, h` (`g.userData.top` is the top height) |
| `chair`, `bench` | `h`, `w` |
| `shelf` | `w, h, d, rows, seed, items` (random books, jars and scrolls) |
| `door` | `w, h, open: 0..1, arch, frame` (planks with iron straps and a ring; `userData.hinge` to animate) |
| `window` | `w, h, y, kind: 'moon'|'sun'|'sunset', depth, beam, beamTo:[x,y,z], light, i, shadow, beamOp` (arched sky pane with mullions, stone jambs and sill, a light shaft, a matching spotlight and a light pool on the floor) |
| `stairs` | `n, w, rise, run, side: 'stone'` (steps climb toward -z) |
| `tent` | `w, d, h, col, col2` (striped canvas), `open` |
| `sign` | `text, w, h, hang, bg, fg, font` (painted board on a bracket or post) |
| `banner` | `w, h, col, emblem` |
| `torch` | `wall: true/false, y, i, dist, col, size, shadow` |
| `candle` | `h, r, lit, light` (0 means no light, only the flame), `holder: 'brass'|'stick'|'none'` |
| `lantern` | `light, hang` (chain length), `s` (glass panes and a candle inside) |
| `rug` | `w, d, pattern, cols` |
| `jar` | `r, h, col` |

## 2. Lighting
- **Presets** are in `kit/lights.js`: `LP.day`, `LP.sunset`, `LP.night`, `LP.candle` (indoor candle and torch light) and `LP.indoor`. Use them as `LIGHTS` entries: `LIGHTS = { hall: tint(LP.candle, { hemi: 0.5 }) }`. `withHaze(L, k)` pulls the depth haze (fog) closer when `k > 1`.
- **Warm practical lights**: torch, candle (`light > 0`) and lantern each create a `PointLight` that flickers every frame (`K.update`) and lights nearby walls, floor and props. `K.warmLight(parent, x, y, z, { col, i, dist, decay, flicker, shadow })` makes one without a flame (a fill light).
- **Soft shadows**: `shadow: true` on a torch, candle or window gives a PCF-soft shadow map. Use it on the **1–2 key lights per shot** only, because each point-light shadow costs 6 extra depth renders. Lights more than 22 m from the camera are switched off automatically.
- **Flames** (`K.flame`) are camera-facing HDR sprites with a halo, so they **bloom** through the existing selective bloom. They are skipped by the ink and depth-of-field depth pass.
- **Depth haze**: the preset's `fog`, `fogNear` and `fogFar`. Light shafts come from `K.beam(parent, from, to, r0, r1, col, opacity)` (windows add one automatically).
- **Characters are unlit cards.** Give them a warm `tint` (for example `'#ffe9cc'`) in dim sets so they sit in the light. Rim light comes from the preset (`rim`, `rimCol`, `rimDir`).

## 3. Faces (`expr:` on `romanFront`)
New expressions: `angry` (toothy snarl, V brows), `furious` (open roar, both rows of teeth; the face floods by default and anger veins appear), `cry` (shut eyes, tear streams, wailing mouth), `sleepy`, `yawn`, `sideeye` (smug side-eye; pupils follow the sign of `look`), `scared` (tiny pupils, chattering teeth) and `unimpressed`. The older ones remain: neutral, stern, grin, laugh, smug, wink, eureka, shock, nervous, squint, sly, sick, disgust and others.

Card options (the `o` passed to `T.romanFront(p, outfit, o)`):
- `talk`: mouth openness from 0 to 1, or `-1`/omitted when silent. Use `talkAt(f, seed, rate)` from `motion.js`. It gives about 4 syllables per second with accents and short pauses, quantised so cards only redraw when the mouth changes. The mouth shape follows the mood: angry expressions talk through gritted teeth, happy ones through an open smile, scared ones with a small "o", and everything else with a plain open mouth that shows teeth and tongue.
- `flush`: 0 to 1, colour flooding up from the chin. `flushCol`: `'red'` (default), `'purple'` or any hex. Animate it, for example `flush: E.smooth(ramp(f, a, b))`, and switch to purple at the peak.
- `veins`: 0 to 1, anger veins on the forehead (automatic with `furious`).
- `brow: [inner, outer]` overrides the brows. `hat` overrides the outfit's hat. `over: {...}` merges outfit overrides for one shot, for example `over: { pattern: {...} }`.
- Existing options still apply: `sweat`, `sweatT`, `glasses`, `blindfold`, `rash`, `tool`, `L`/`R` arm poses and the rest.

## 4. Characters (outfit fields in `OUTFITS` or an inline outfit object)
- `hat`: `crown | helmet | cowboy | tophat | hood | turban | soldier`. Every hat's brim sits at `hc − 29u`, always **above the brows** (which sit between hc−14u and hc−26u). With a hat on, the hair is reduced to side tufts. The hood draws a cowl behind the head and a face opening that frames everything from the brows to the chin. Colours: `hatCol`, `hatBand`, `plume` (helmet feather).
- `beard` (colour) plus `beardStyle`: `full | stubble | short | long | goatee`. Leaving `beardStyle` out keeps the older beard. The mouth area is cleared so speech stays visible, and it picks up the flush tint.
- `moustache` (colour) plus `stache`: `pencil | chevron | handlebar | walrus | none` (omitted gives the older taper).
- `pattern: { type, col, col2, scale }`, where type is `stripes | vstripes | plaid | checks | dots | diamonds | patches | stars`. It applies to the tunic and the dress.
- Example: `const KING = { tunic: '#5a2a8a', cape: '#b8202e', stick: true, skin: '#f7f4ee', hair: '#6a4228', beard: '#6a4228', beardStyle: 'full', hat: 'crown', pattern: { type: 'diamonds', col: '#7a3aa8', col2: '#4a1a6a' } }`.

**Check characters in seconds, without 3D:** run `node cardsheet.mjs out.png faces|hats|beards|patterns|talk` and look at the PNG.

## 5. Emotes: `kit/emotes.js`
```js
import { emote } from './kit/emotes.js';
export const fxAt = (f) => { const out = []; if (f >= 230) out.push(emote('?', f - 230, [x, headY + 0.4, z], { s: 0.2 })); return out; };
```
Kinds: `?`, `!`, `!?`, `bulb`, `heart` (beats), `zzz` (floats up in a loop), `sweat` (drops fall), `vein` (pulses), `dollar` (spins), `note`. Each one bounces in (overshoots to 1.22, then wobbles back to 1). The second argument is the age in 60-fps frames, and the position is the centre of the emote in world space. `pop(age)` is exported for custom FX.

## 6. Cutaway kit
- **Glass**: `K.glass(geometry, { tint, opacity, rim, glow })` returns a group (back faces, front faces and rim ink). It uses a fresnel shader: clear in the middle, bright at the rim, with a specular streak. The ink outline comes from a **rim-only** depth pass, so objects inside the glass keep their own outlines and stay in focus. Put the contents inside the group or at the same spot. (`K.glassMat` gives the material alone.)
- **Cross-section**: `const S = K.section(objectOrGroup, { normal: [0,0,-1], point: [x,y,z], cap: '#d8b888', hatch: 'rgba(...)' })` clips the object with a **world-space** plane. The side the normal points to is kept, and the cut is capped with a hatched face using stencil caps. `S.set(offset)` slides the plane along its normal (animate it from `update` for a slicing reveal). `S.visible(bool)` toggles the cap. It works on closed meshes, so use `prop.barrel({ hollow: true })` for containers to get a hatched wall ring with the contents visible. Section meshes come with clipped normal-depth materials, so the ink follows the cut.
- **3D arrows and rings**: `K.arrow3d(parent, from, to, { col, r, bend, head })` and `K.ring3d(parent, center, radius, { normal })` are in-world, ink-outlined and lightly emissive.
- **Handwritten annotations** (the reference "spike" labels): export `annotAt(f)` from story.js:
```js
export const annotAt = (f) => [
  { type: 'label', text: 'the key!', at: [x, y, z], dx: 70, dy: -300, age: f - 300 },    // text + hand-drawn arrow to `at`
  { type: 'circle', at: [x, y, z], rw: 0.085, age: f - 312 },                             // red circle; rw = world radius (or r in px)
  { type: 'arrow', from: [..], to: [..], age: f - 320 } ];                               // arrow alone (or fromPx: [x, y])
```
They render in **Caveat 700**, white with a dark outline and a soft shadow, after depth of field, so they're always sharp. They follow the moving camera because they're anchored to 3D points, and they draw on: text pops in, the arrow draws itself, then the circle. `out` (frames remaining) fades them out. `dx`/`dy` are in 1080×1920 pixels. Keep them few (STYLE: 1–2 labels). The old `labels.py` and post-overlay method still works if you need it.

## 7. Rendering and QC
- `QS="&story=demo_story.js"` (or any `*.js` in `web/`) chooses the story module through an import map in `index.html`. Without it, `story.js` renders as before.
- Every story module must export what `main.js` and `overlay.js` import: `FPS, TOTAL, SHOTS, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt, LOOK, overlayInfo` (plus the optional `sets`, `annotAt`, `CUTS`).
- The render server now sends correct MIME types (fonts, PNG, JSON).
- `compose_plates.py <plates> <out.mp4> --whips 280 --audio mix.wav --caps cap/caps.json --glow 0.85` encodes 60 fps H.264 with captions and the **glossy glow** (`--glow`: highlight bloom plus a soft sheen, blended in RGB under the captions; Diyar likes about 0.85). It also adds a `tmix` blur on each whip window (`[w−14, w+18]`) and loudnorm to −14 LUFS.
- Speed: the demo room renders at about 5–7 s per frame on 4 CPU cores. Run three ranges in parallel.
- QC as always: stills, a contact sheet, fixes, the full render, then frames from the MP4.

## Known limits
- Cards are flat billboards: kit lights don't shade characters (use `tint` and rim light).
- Point-light shadows are expensive, so keep to 1–2 per shot.
- `K.section` caps need watertight meshes. Open meshes are clipped without a clean cap.
- Glass in the depth pass is rim-only, so depth-of-field focus on glass uses its rim depth.

## 8. Final edit in Remotion with remocn (Nov 24 2026; Diyar asked for remocn)
Captions are no longer burned in with ffmpeg. The plates become `base.mp4` (whip blur, glossy glow and audio, with no captions), and a **Remotion** project (`engine/remotion/`) lays **remocn** components on top.
- **remocn** (https://github.com/Remocn/remocn, MIT) is a shadcn-style registry of more than 900 Remotion components. `remocn.dev` is blocked on some machines, so install components from raw GitHub with `python3 remocn_add.py <name> ...`. It resolves registry dependencies and writes the files to `remotion/src/components/remocn` and `remotion/src/lib/remocn`, just like `npx shadcn add @remocn/<name>`.
- Installed so far: `caption-word-pop` (used), `caption-outline`, `caption-bounce-in`, `caption-stamp` and their libs (`caption-core`, `glide`, `frame-rate`). Other fits for later: `marker-highlight` and `inline-highlight` (keyword emphasis), `whip-pan` and `zoom-blur` (transitions between separately rendered plates), `typewriter`.
- `remotion/src/Episode.tsx`: `OffthreadVideo` of `public/base.mp4` plus `CaptionWordPop` (one word at a time, springing in as it's spoken; Poppins Bold, white with a 6 px dark stroke, centred at y≈1342). The captions come from the episode's `words.json`.
- **One command** from the episode work folder: `bash ../../engine/finish_remotion.sh out/DocZap_<Name>_1080x1920.mp4 <whip frames> 0.85`.
- Setup: `cd engine/remotion && npm install`. It uses the machine's headless Chrome (`/opt/pw-browsers/...`) when present.
- Respect remocn's craft rules where they don't conflict with STYLE.md: no gradient text, one accent colour, no `Math.random()`, and sequences are never shorter than a component's length.
