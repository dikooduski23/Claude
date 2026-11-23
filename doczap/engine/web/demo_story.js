// Doc Zap ENGINE DEMO (Nov 2026) — not an episode. ~6 s showcase of the world kit:
// a medieval hall at night (stone, planks, rug, torches, candles, lantern, moonlit window, shelf, barrels, crates, stairs, banner, door),
// two characters talking (mouths move), the king flushes red→purple with fury (vein emote), the knight gets a "?",
// then a whip-pan to a glass cutaway (key inside a glass bottle + a sliced barrel of gold) with handwritten labels and a red circle.
// Render:  QS="&story=demo_story.js" HASH="#raw" node render.mjs plates 0-359
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, talkAt, q } from './motion.js';
import { LP, tint } from './kit/lights.js';
import { emote } from './kit/emotes.js';
export const FPS = 60, TOTAL = 360, DECK = 0, LOOK = 'mini';
const X0 = 40000;                                   // the demo set lives far from the other worlds
const w = (x, y, z) => [X0 + x, y, z];              // room-local -> world
// ---------------- shots (60-fps frames) ----------------
const SH = [['two', 0, 131], ['king', 132, 221], ['knight', 222, 279], ['glass', 280, 359]];
export const SHOTS = SH.map(([id, a, b]) => ({ id, a, b, light: 'hall' }));
export const WHIPS = [280];                          // whip-pan into the cutaway (blur these windows in post)
export const WHIP_FRAMES = WHIPS.map((a) => [a - 14, a + 18]);
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: 'hall' }; };
export const shotAt = shot;
export const LIGHTS = { hall: tint(LP.candle, { hemi: 0.5, fogNear: 4, fogFar: 15, bloom: 0.8 }) };
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- the set (built once with the kit) ----------------
const KEY = [0.1, 0.97, -0.55], BAR = [0.8, 0, -0.5];   // bottle (key inside) on the table, sliced barrel beside it
let SEC = null;
export const sets = (K) => {
  const { THREE, prop } = K;
  const R = K.room({ x: X0, w: 7, d: 6.4, h: 3.8, floor: 'planks', wall: 'stone', wallOpts: { seed: 4, moss: 0.25 }, floorOpts: { seed: 3, lig: 34 }, ceil: 'beams' });
  // back wall: two torches, an arched moonlit window, a banner, a door
  prop.torch(R, { x: -1.45, z: -3.2, y: 1.85, i: 3.0, dist: 7.5, shadow: true });
  prop.torch(R, { x: 1.55, z: -3.2, y: 1.85, i: 2.8, dist: 7.5 });
  prop.window(R, { x: 0.05, y: 2.15, z: -3.14, w: 0.78, h: 1.0, depth: 0.12, kind: 'moon', beamTo: [0.2, 0, 2.6], i: 5 });
  prop.banner(R, { x: -2.45, y: 3.2, z: -3.17, col: '#7a1a2a' });
  prop.door(R, { x: 2.55, z: -3.12, w: 0.95, h: 2.0, open: 0.0 });
  // floor dressing
  prop.rug(R, { x: -0.1, z: -0.1, w: 3.0, d: 2.1, pattern: 'persian', cols: ['#8a2030', '#1f3a6a', '#e0b050', '#f0e2c0'] });
  const T = prop.table(R, { x: -0.4, z: -0.62, w: 1.7, d: 0.85 });
  prop.chair(R, { x: -1.05, z: -1.25, ry: 0.15 }); prop.bench(R, { x: -0.3, z: 0.05 + -1.6, w: 1.4 });
  prop.candle(R, { x: -0.95, y: 0.78, z: -0.5, light: 0.9, h: 0.2 }); prop.candle(R, { x: -0.72, y: 0.78, z: -0.75, h: 0.13 });
  prop.candle(R, { x: -0.2, y: 0.78, z: -0.85, h: 0.17, holder: 'stick' });
  // parchment + coins on the table
  const parch = K.add(new THREE.PlaneGeometry(0.42, 0.3), K.toon({ color: '#ecdcb0' }), -0.45, 0.787, -0.5, R, false); parch.rotation.set(-Math.PI / 2, 0, 0.2);
  const gold = K.toon({ color: '#f2c230', emissive: '#7a5000', emissiveIntensity: 0.25 });
  for (let i = 0; i < 7; i++) K.add(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 16), gold, -0.12 + (i % 3) * 0.05, 0.789 + Math.floor(i / 3) * 0.009, -0.38 + (i % 2) * 0.03, R);
  // the hero: a glass bottle with the king's key inside
  const bottle = new THREE.Group(); bottle.position.set(KEY[0], 0.785, KEY[2]); R.add(bottle);
  const prof = []; for (let i = 0; i <= 24; i++) { const t = i / 24, y = t * 0.52; prof.push(new THREE.Vector2(t < 0.62 ? 0.15 * Math.min(1, 0.85 + t * 2) : t < 0.8 ? lerp(0.15, 0.04, E.smooth((t - 0.62) / 0.18)) : 0.04, y)); }
  bottle.add(K.glass(new THREE.LatheGeometry(prof, 36), { tint: '#bfe8d8', opacity: 0.08, rim: 0.8 }));
  K.add(new THREE.CylinderGeometry(0.035, 0.042, 0.06, 12), K.toon({ color: '#a87a4a' }), 0, 0.54, 0, bottle);           // cork
  const key = new THREE.Group(); key.position.set(0, 0.18, 0); key.rotation.set(0.15, 0.6, 0.35); key.scale.setScalar(1.45); bottle.add(key);
  const brass = K.toon({ color: '#e0b040', emissive: '#6a4000', emissiveIntensity: 0.3 });
  K.add(new THREE.TorusGeometry(0.032, 0.009, 8, 20), brass, 0, 0.07, 0, key); K.add(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 8), brass, 0, -0.01, 0, key);
  K.add(new THREE.BoxGeometry(0.03, 0.012, 0.008), brass, 0.015, -0.06, 0, key); K.add(new THREE.BoxGeometry(0.022, 0.01, 0.008), brass, 0.011, -0.035, 0, key);
  // a hollow barrel full of gold, sliced open with a cross-section
  const bar = prop.barrel(R, { x: BAR[0], z: BAR[2], hollow: true, r: 0.3, h: 0.82 });
  SEC = K.section(bar, { normal: [0, 0, -1], point: [X0 + BAR[0], 0.4, BAR[2]], cap: '#d8b888', hatch: 'rgba(120,60,30,.6)' });
  for (let i = 0; i < 70; i++) { const a = i * 2.4, rr = 0.2 * Math.sqrt((i % 23) / 23), yy = 0.07 + Math.floor(i / 23) * 0.012 + (i % 5) * 0.004;
    const c = K.add(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 14), gold, BAR[0] + Math.cos(a) * rr, yy + 0.25 * Math.min(1, i / 70), BAR[2] + Math.sin(a) * rr * 0.6 - 0.05, R); c.rotation.set(Math.sin(i) * 0.5, 0, Math.cos(i * 1.3) * 0.5); }
  K.warmLight(R, 0.55, 1.25, 0.25, { i: 1.3, dist: 2.6, flicker: 0.06, col: '#ffc890' });   // soft practical fill for the cutaway
  // back-right corner: barrels + crates; right wall: shelf; left: stairs going up + lantern
  prop.barrel(R, { x: 1.55, z: -2.55 }); prop.barrel(R, { x: 2.15, z: -2.35, ry: 0.5 }); prop.barrel(R, { x: 1.85, z: -2.6, y: 0.86 });
  prop.crate(R, { x: 2.75, z: -1.7, ry: 0.3 }); prop.crate(R, { x: 2.7, z: -1.6, y: 0.6, s: 0.45, ry: -0.2 });
  prop.shelf(R, { x: 3.3, z: 0.4, ry: -Math.PI / 2, w: 1.6, seed: 9 });
  prop.stairs(R, { x: -2.85, z: -0.4, n: 9, w: 1.0, ry: 0 });
  prop.lantern(R, { x: -1.9, y: 2.25, z: 0.3, light: 1.2, hang: 1.2 });
  prop.sign(R, { x: 2.55, y: 2.55, z: -3.08, text: 'VAULT', w: 0.7, h: 0.3, hang: false });
  return { update: (W, f) => { if (SEC) SEC.set(W.cut ?? 0); } };
};
// ---------------- cast ----------------
const KING = { tunic: '#5a2a8a', cape: '#b8202e', stick: true, skin: '#f7f4ee', hair: '#6a4228', beard: '#6a4228', beardStyle: 'full', hat: 'crown', pattern: { type: 'diamonds', col: '#7a3aa8', col2: '#4a1a6a' } };
const KNIGHT = { tunic: '#c8ccd2', stick: true, skin: '#f7f4ee', hair: '#c8862a', moustache: '#c8862a', stache: 'handlebar', hat: 'helmet', plume: '#d0283a', pattern: { type: 'vstripes', col: '#b8202e', scale: 1.4 } };
const KP = [-0.44, 0, 0.5], NP = [0.44, 0, 0.62], HY = 1.33;     // feet positions (room-local), head height
export const actorsAt = (f, T) => {
  const S = shot(f), out = [], u = Math.floor(f / 2);
  const I = (seed) => { const i = idle(u, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const card = (id, O, o, pos, seed) => out.push({ key: id + JSON.stringify(o), draw: (p) => T.romanFront(p, O, o), x: X0 + pos[0], y: pos[1], z: pos[2], s: 0.9, ground: 0, tint: '#ffe9cc' });
  if (S.id === 'glass') return out;
  // dialogue: king speaks 0-60 and 132-221 (angry), knight speaks 62-120; the king's fury floods his face from 150
  const kTalk = (f < 60 || (f >= 132 && f < 221)) ? talkAt(f, 3, f >= 170 ? 1.25 : 1) : -1, nTalk = (f >= 62 && f < 120) ? talkAt(f, 7) : -1;
  const fury = clamp((f - 140) / 60), kExpr = f < 132 ? (f < 62 ? 'stern' : 'unimpressed') : f < 175 ? 'angry' : 'furious';
  const flush = f < 140 ? 0 : q(E.smooth(fury), 2);
  card('king', KING, { seed: 23, blink: kTalk > 0.5 ? 0 : blinkAt(u, 23), ...I(23), expr: kExpr, talk: kTalk, flush, flushCol: f > 195 ? 'purple' : 'red', look: 0.4,
    L: f >= 160 ? 'up' : 'hip', R: f >= 132 ? 'point' : 'hang' }, KP, 23);
  const nExpr = f < 62 ? 'smile' : f < 132 ? 'grin' : f < 228 ? 'nervous' : 'scared';
  card('knight', KNIGHT, { seed: 31, blink: blinkAt(u, 31), ...I(31), expr: nExpr, talk: nTalk, look: -0.4, L: f >= 62 && f < 132 ? 'up' : 'hang', R: f >= 228 ? 'cheek' : 'hip', sweat: f >= 228 ? 0.5 : 0, sweatT: f / 60 }, NP, 31);
  return out;
};
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'king' && f >= 178) out.push(emote('vein', f - 178, w(KP[0] + 0.3, HY + 0.32, KP[2] + 0.05), { s: 0.16 }));
  if (S.id === 'knight' && f >= 230) out.push(emote('?', f - 230, w(NP[0] - 0.28, HY + 0.4, NP[2] + 0.05), { s: 0.2 }));
  return out; };
// ---------------- camera ----------------
const yawLook = (pos, look, deg) => { const a = deg * Math.PI / 180, dx = look[0] - pos[0], dz = look[2] - pos[2]; return [pos[0] + dx * Math.cos(a) - dz * Math.sin(a), look[1], pos[2] + dx * Math.sin(a) + dz * Math.cos(a)]; };
const orbit = (c, ang, d, y) => [c[0] + Math.sin(ang * Math.PI / 180) * d, y, c[2] + Math.cos(ang * Math.PI / 180) * d];
const camL = (f) => { const S = shot(f), v = (f - S.a) / (S.b - S.a), sv = E.smooth(v);
  switch (S.id) {
    case 'two': return { pos: orbit([0, 0, 0.55], lerp(16, 4, sv), lerp(4.05, 3.6, sv), lerp(1.5, 1.44, sv)), look: [lerp(0.08, 0.0, sv), 1.28, 0.3], fov: 48 };
    case 'king': return { pos: orbit([KP[0], 0, KP[2]], lerp(26, 16, sv), lerp(1.8, 1.5, sv), lerp(1.16, 1.22, sv)), look: [KP[0] + 0.02, HY + 0.1, KP[2]], fov: 44 };
    case 'knight': return { pos: orbit([NP[0], 0, NP[2]], lerp(-24, -14, sv), lerp(1.75, 1.48, sv), 1.28), look: [NP[0] - 0.04, HY + 0.12, NP[2]], fov: 44 };
    case 'glass': { const c = [0.45, 0, -0.52]; return { pos: orbit(c, lerp(-9, 1, sv), lerp(2.1, 1.8, sv), lerp(1.48, 1.4, sv)), look: lerp3([0.42, 0.68, -0.52], [0.38, 0.64, -0.54], sv), fov: 48 }; }
  } };
const cam = (f) => { const S = shot(f); const c = camL(f); c.pos = w(...c.pos); c.look = w(...c.look);
  const wi = WHIPS.indexOf(S.b + 1), wo = WHIPS.indexOf(S.a);
  if (wi >= 0 && f > S.b - 14) c.look = yawLook(c.pos, c.look, 55 * E.easeIn(ramp(f, S.b - 14, S.b + 1)));
  if (wo >= 0 && f < S.a + 18) c.look = yawLook(c.pos, c.look, -55 * (1 - E.easeOut(ramp(f, S.a, S.a + 18))));
  c.shadowAt = c.look; return c; };
export const camAt = cam;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shot(f), C = cam(f), at = (p, k) => ({ focus: dist(C.pos, w(...p)), cinf: k });
  switch (S.id) { case 'two': return at([0, HY, 0.56], 8); case 'king': return at([KP[0], HY, KP[2]], 12); case 'knight': return at([NP[0], HY, NP[2]], 12); case 'glass': return at([0.45, 0.75, -0.52], 9); }
  return { focus: 5, cinf: 0 }; };
export const worldAt = (f) => { const S = shot(f), W = {}; W.cut = S.id === "glass" ? q(lerp(-0.4, 0, E.smooth(ramp(f, 292, 318))), 3) : -0.4; return W; };
// ---------------- handwritten labels (kit/annot.js) ----------------
export const annotAt = (f) => { const S = shot(f); if (S.id !== 'glass') return [];
  return [
    { type: 'label', text: 'the key!', at: w(KEY[0], KEY[1] - 0.02, KEY[2]), dx: 70, dy: -300, age: f - 300 },
    { type: 'circle', at: w(KEY[0], KEY[1] - 0.02, KEY[2]), rw: 0.085, age: f - 312 },
    { type: 'label', text: 'hidden gold', at: w(BAR[0] - 0.02, 0.3, BAR[2] + 0.05), dx: -90, dy: 330, age: f - 324, bend: -0.3 },
  ]; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
export const CUTS = [];
