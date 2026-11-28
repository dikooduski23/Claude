// Doc Zap — "Count Rumford made the fireplace smaller... and the room got warmer." (London, 1796)
// Voice: Patrick, Eleven v4 (Diyar's MP3). Shot timing comes from words.json via the CUE table below (frames @ 60 fps).
// Look: the measured modern grade (ADR-002) in warm firelit Georgian rooms; characters act with kit/act.js.
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, talkAt, q } from './motion.js';
import { LP, tint } from './kit/lights.js';
import { emote } from './kit/emotes.js';
import { arms, react, reacts, ease, walk, sway, pick, alive, strike, shiver, cough, ease2, shake, nod, idle3, blinkV, strike3, cough3, shiver3, rubHands3, lookSeq, walk3, vnoise } from './kit/act.js';
import { CUE, TOTAL_FRAMES } from './cues.js';
export const FPS = 60, TOTAL = TOTAL_FRAMES, DECK = 0, LOOK = 'modern';
// shots: [id, firstFrame, light]; each runs until the next one starts
const SHOTDEF = [['hook', 0, 'rum'], ['old', CUE.old, 'old'], ['cold', CUE.cold, 'old'], ['squeeze', CUE.squeeze, 'rum'], ['angles', CUE.angles, 'rum'], ['backwards', CUE.backwards, 'rum'], ['radiant', CUE.radiant, 'cut'],
  ['hotair', CUE.hotair, 'cut'], ['bounce', CUE.bounce, 'cut'], ['throat', CUE.throat, 'cut'], ['street', CUE.street, 'street'], ['austen', CUE.austen, 'austen'], ['today', CUE.today, 'today'], ['punch', CUE.punch, 'rum'], ['loop', CUE.loop, 'rum']];
const SH = SHOTDEF.map(([id, a, light], i) => [id, a, (SHOTDEF[i + 1] ? SHOTDEF[i + 1][1] : TOTAL) - 1, light]);
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a, b, light }));
export const WHIPS = [CUE.old, CUE.squeeze, CUE.radiant, CUE.street, CUE.austen, CUE.today, CUE.punch];   // cold, angles, backwards, hotair, bounce, throat, loop = hard cuts   // in-camera whip-pans; other changes are hard cuts
export const WHIP_FRAMES = WHIPS.map((a) => [a - 14, a + 18]);
export const TRANSITIONS = SH.slice(1).map(([, a]) => ({ at: a, type: 'cut' }));
export const CUTS = [];
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = shot;
export const LIGHTS = {
  rum: tint(LP.indoor, { sky: '#ffe2b8', ground: '#3a2014', hemi: 0.8, sun: '#ffd8a8', sunI: 0.7, az: 200, el: 30, fog: '#2a1810', fogNear: 6, fogFar: 20, gain: '#fff0dc', bloom: 0.9, bthr: 0.8, rimCol: '#ffb070', shadowExt: 6 }),
  old: tint(LP.indoor, { sky: '#a8b8d0', ground: '#20242c', hemi: 0.75, sun: '#b8c8e0', sunI: 0.55, az: 120, el: 25, fog: '#5e6470', fogNear: 2.5, fogFar: 12, rimCol: '#ffa060', shadowExt: 6 }),
  cut: tint(LP.indoor, { sky: '#ffe2b8', hemi: 1.0, sunI: 1.0, az: 30, el: 55, fog: '#2a1810', fogNear: 10, fogFar: 40, bloom: 1.0, bthr: 0.8, shadowExt: 6 }),
  street: tint(LP.sunset, { sun: '#ff9a60', sunI: 0.8, az: 240, el: 8, skyTop: '#1e2a5a', skyHor: '#ff9a70', sky: '#8a7aa8', fog: '#4a4060', fogNear: 15, fogFar: 90, shadowExt: 12 }),
  austen: tint(LP.candle, { hemi: 0.8, sunI: 0.4, fog: '#1a120c', fogNear: 4, fogFar: 14, rimCol: '#ffb060', shadowExt: 5 }),
  today: tint(LP.indoor, { hemi: 0.9, sunI: 0.8, az: 140, el: 30, fog: '#5a4030', fogNear: 6, fogFar: 22, gain: '#fff0e0', shadowExt: 6 }),
};
const MODL = { rum: { env: 0.8, hemiK: 0.8 }, old: { env: 0.6, hemiK: 0.8 }, cut: { env: 0.6, hemiK: 0.6 }, street: { env: 0.7 }, austen: { env: 0.7, hemiK: 1.0 }, today: { env: 0.8, hemiK: 0.8 } };
for (const k in LIGHTS) { const L = LIGHTS[k]; LIGHTS[k] = { ...L, sunI: L.sunI * 1.45, hemiK: 0.2, expo: 1.45, shadowExt: (L.shadowExt ?? 10) * 2.2, con: 1.0, sat: (L.sat ?? 1.16) * 0.64, gain: '#faf4f6', shCol: '#f5f0ff', hiCol: '#fff5f0', fogNear: L.fogNear * 1.5, fogFar: L.fogFar * 1.7, ao: 0.35, bloom: (L.bloom ?? 0.5) * 0.8, bthr: Math.max((L.bthr ?? 1) * 1.9, 1.55), vig: Math.max(L.vig ?? 0.22, 0.4), inkA: 0.75, ...(MODL[k] || {}) }; }
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- layout ----------------
const XA = 100000, XB = 102000, XC = 104000, XD = 106000, XE = 108000, XF = 110000;
const A = (x, y, z) => [XA + x, y, z], B = (x, y, z) => [XB + x, y, z], C = (x, y, z) => [XC + x, y, z], D = (x, y, z) => [XD + x, y, z], Ev = (x, y, z) => [XE + x, y, z], F = (x, y, z) => [XF + x, y, z];
const FIRE_B = [0, 0, -2.2];   // Rumford fireplace opening centre (room B); room A's old hearth is at the same spot
let ST = {};
const rnd = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
export const sets = (K) => {
  const { THREE, prop } = K;
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  const damask = (base, ink) => cv(512, 512, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); g.fillStyle = ink;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const cx = 128 + x * 256 + (y % 2) * 128, cy = 128 + y * 256; g.beginPath(); g.ellipse(cx, cy, 46, 78, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx, cy - 92, 18, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx, cy + 92, 18, 26, 0, 0, 7); g.fill(); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 60, cy, 14, 30, s * 0.5, 0, 7); g.fill(); } } });
  const wallM = (base, ink, rx = 4, ry = 1.5) => { const m = K.toon({ map: ctex(damask(base, ink), rx, ry) }); m.userData = { rough: 0.7 }; return m; };
  const brickM = K.mat('brick', { seed: 11, lig: 40 }), sootM = K.mat('brick', { seed: 12, lig: 16 }), stoneM = K.toon({ color: '#d8ccb8' }); stoneM.userData = { rough: 0.5, envK: 0.8 };
  const plasterM = K.toon({ color: '#f2e8d8' }); plasterM.userData = { rough: 0.35, envK: 0.9 };
  // smoke puffs: soft grey spheres, each with its own material so it can fade
  const puffTex = ctex(cv(128, 128, (g, W, H) => { for (let k = 0; k < 6; k++) { const x = 64 + (rnd(k, 1) - 0.5) * 40, y = 64 + (rnd(k, 2) - 0.5) * 40, r = 30 + rnd(k, 3) * 26; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); } }));
  const puffs = (parent, n, col = '#8a8480') => Array.from({ length: n }, (_, i) => { const m = new THREE.SpriteMaterial({ map: puffTex, color: col, transparent: true, opacity: 0, depthWrite: false, rotation: rnd(i, 7) * 6 }); const s = new THREE.Sprite(m); s.position.set(0, -10, 0); s.scale.setScalar(0.4); parent.add(s); return s; });
  // ---- a parametric fireplace: k = 0 old deep square box, k = 1 Rumford (shallow, back 1/3 of the opening, covings at 135 deg) ----
  const fireplace = (parent, o) => { const g = K.grp(parent, o.x, 0, o.z); const w = o.w, h = o.h, inner = o.inner, cov = o.coving || inner;
    const back = K.add(new THREE.BoxGeometry(1, h, 0.12), inner, 0, h / 2, 0, g); const covL = K.add(new THREE.BoxGeometry(0.1, h, 1), cov, 0, h / 2, 0, g), covR = K.add(new THREE.BoxGeometry(0.1, h, 1), cov, 0, h / 2, 0, g);
    const hearth = K.add(new THREE.BoxGeometry(w + 0.6, 0.06, 1.4), stoneM, 0, 0.03, 0.1, g);
    // surround: pilasters, lintel, mantel shelf, breast up to the ceiling
    const sw = o.sw ?? 0.32; for (const s of [-1, 1]) K.add(new THREE.BoxGeometry(sw, h + 0.1, 0.22), o.surround, s * (w / 2 + sw / 2), (h + 0.1) / 2, 0.08, g);
    K.add(new THREE.BoxGeometry(w + 2 * sw + 0.12, 0.28, 0.24), o.surround, 0, h + 0.14, 0.08, g); K.add(new THREE.BoxGeometry(w + 2 * sw + 0.4, 0.07, 0.42), o.surround, 0, h + 0.32, 0.12, g);
    K.add(new THREE.BoxGeometry(w + 2 * sw, (o.ceil ?? 3) - h - 0.35, 0.1), o.breast, 0, h + 0.35 + ((o.ceil ?? 3) - h - 0.35) / 2, -0.02, g);
    // logs + fire
    const logM = K.toon({ color: '#4a2c18' }); for (const [x, r] of [[-0.18, 0.3], [0.16, -0.25]]) { const l = K.add(new THREE.CylinderGeometry(0.07, 0.08, 0.62, 12), logM, x, 0.12, 0, g); l.rotation.set(0, r, Math.PI / 2); }
    const flames = [K.flame(g, 0, 0.18, 0, o.flame ?? 0.22), K.flame(g, -0.16, 0.16, 0.02, (o.flame ?? 0.22) * 0.7), K.flame(g, 0.17, 0.16, -0.02, (o.flame ?? 0.22) * 0.75)];
    const light = K.warmLight(g, 0, 0.5, 0.6, { col: '#ff8a3a', i: o.lightI ?? 2.6, dist: 7, flicker: 0.15, shadow: true });
    const set = (k) => { const d = lerp(o.d0, o.d1, k), b = lerp(w, w / 3, k); back.scale.x = b; back.position.z = -d;
      for (const [m, s] of [[covL, -1], [covR, 1]]) { const x0 = s * w / 2, x1 = s * b / 2, z1 = -d, len = Math.hypot(x1 - x0, z1); m.scale.z = len; m.position.set((x0 + x1) / 2, h / 2, z1 / 2); m.rotation.y = Math.atan2(x1 - x0, z1) + Math.PI; }
      flames.forEach((fl, i) => { if (fl && fl.position) fl.position.z = -d * 0.45 + [0, 0.02, -0.02][i]; }); };
    set(o.k ?? 1); return { g, set, light }; };

  // ======================= A. 1796: THE OLD DRAWING ROOM (cavernous hearth, smoke, cold) =======================
  const RA = K.room({ x: XA, w: 7, d: 6, h: 3.0, floor: 'planks', wall: 'plaster', wallOpts: { seed: 21, col: [8, 40, 40], bricks: 0, stains: 0.2 }, floorOpts: { seed: 22, hue: 26, sat: 40, lig: 30 }, ceil: 'flat' });
  { const back = K.add(new THREE.PlaneGeometry(6.9, 2.9), wallM('#6a1e22', 'rgba(150,60,50,.45)'), 0, 1.5, -2.97, RA, false); }
  ST.oldFP = fireplace(RA, { x: 0, z: -2.85, w: 2.1, h: 1.55, d0: 1.0, d1: 1.0, k: 0, inner: sootM, surround: K.toon({ color: '#6a5a4a' }), breast: K.toon({ color: '#5a4a3c' }), ceil: 3.0, flame: 0.3, lightI: 1.6 });
  ST.oldSmoke = puffs(RA, 22, '#7a746e');
  prop.rug(RA, { x: 0, z: -0.6, w: 3.8, d: 2.6, pattern: 'persian', cols: ['#5a1a1e', '#2a3040', '#c8a048', '#e8dcc0'] });
  for (const [x, ry] of [[-1.4, 0.5], [1.4, -0.5]]) prop.chair(RA, { x, z: -0.9, ry });
  prop.window(RA, { x: 2.6, y: 1.6, z: -2.99, w: 0.9, h: 1.5, kind: 'moon', depth: 0.12, i: 1.2 });
  for (const x of [-2.6]) { const fr = K.grp(RA, x, 1.75, -2.94); K.add(new THREE.BoxGeometry(0.8, 1.0, 0.05), K.toon({ color: '#b8902a' }), 0, 0, 0, fr); K.add(new THREE.PlaneGeometry(0.66, 0.86), K.toon({ color: '#3a3428' }), 0, 0, 0.03, fr, false); }
  prop.candle(RA, { x: -0.7, y: 1.92, z: -2.7, h: 0.22, light: 0.5, holder: 'brass' }); prop.candle(RA, { x: 0.7, y: 1.92, z: -2.7, h: 0.22, light: 0.5, holder: 'brass' });
  K.motes(RA, { n: 40, box: [-2, 0.4, -2.6, 2, 2.6, -0.2], col: '#d8d0c8', size: 0.012, speed: 0.001 });

  // ======================= B. RUMFORD'S ROOM (the tall, shallow fireplace) =======================
  const RB = K.room({ x: XB, w: 7, d: 6, h: 3.0, floor: 'planks', wall: 'plaster', wallOpts: { seed: 31, col: [24, 40, 46], bricks: 0, stains: 0.1 }, floorOpts: { seed: 32, hue: 28, sat: 42, lig: 34 }, ceil: 'flat' });
  K.add(new THREE.PlaneGeometry(6.9, 2.9), wallM('#7a2a24', 'rgba(210,120,70,.35)'), 0, 1.5, -2.97, RB, false);
  ST.rumFP = fireplace(RB, { x: 0, z: -2.62, w: 1.25, h: 1.35, d0: 0.95, d1: 0.36, k: 1, inner: brickM, coving: plasterM, surround: K.toon({ color: '#efe6d6' }), breast: wallM('#7a2a24', 'rgba(210,120,70,.35)', 1.2, 1.2), ceil: 3.0, flame: 0.34, lightI: 3.4 });
  prop.rug(RB, { x: 0, z: -0.8, w: 3.6, d: 2.4, pattern: 'persian', cols: ['#7a1a22', '#1f2a4a', '#d8a848', '#f0e2c0'] });
  for (const [x, ry] of [[-1.25, 0.55], [1.25, -0.55]]) prop.chair(RB, { x, z: -1.0, ry });
  prop.window(RB, { x: -2.5, y: 1.6, z: -2.99, w: 0.9, h: 1.5, kind: 'moon', depth: 0.12, i: 1.0 });
  prop.shelf(RB, { x: 3.2, z: -1.5, ry: -Math.PI / 2, w: 1.4, h: 1.8, seed: 7 });
  { const fr = K.grp(RB, 2.3, 1.85, -2.94); K.add(new THREE.BoxGeometry(0.7, 0.9, 0.05), K.toon({ color: '#c8a03a' }), 0, 0, 0, fr); K.add(new THREE.PlaneGeometry(0.56, 0.76), K.toon({ color: '#3a4a3a' }), 0, 0, 0.03, fr, false); }
  for (const x of [-0.45, 0.45]) prop.candle(RB, { x, y: 1.7, z: -2.45, h: 0.2, light: 0.6, holder: 'brass' });
  ST.bricks = []; { const bM = K.mat('brick', { seed: 33, lig: 44 }); for (let i = 0; i < 10; i++) ST.bricks.push(K.add(new THREE.BoxGeometry(0.22, 0.07, 0.11), bM, -1.1 + (i % 4) * 0.24 + (i >= 8 ? 0.12 : 0), 0.035 + Math.floor(i / 4) * 0.075, -1.6, RB)); }
  K.motes(RB, { n: 40, box: [-2, 0.4, -2.4, 2, 2.4, -0.6], col: '#ffe0b0', size: 0.01, speed: 0.001 });

  // ======================= C. CUTAWAY: inside the fireplace (side section + plan) =======================
  const CG = K.grp(K.scene, XC, 0, 0);
  const bgC = cv(512, 1024, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H * 0.45, 30, W / 2, H * 0.45, H * 0.6); gr.addColorStop(0, '#5a3220'); gr.addColorStop(1, '#120a06'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
  K.noInk(K.add(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ map: ctex(bgC), fog: false }), 0, 3, -4, CG, false));
  { const wm = wallM('#5a2018', 'rgba(150,70,40,.4)', 3, 3); K.add(new THREE.PlaneGeometry(9, 9), wm, -0.5, 3.5, -1.2, CG, false); }
  // side section (x is depth: fire at x 0, room to +x): floor, back wall, curved breast making a narrow throat, flue
  { const inM = K.mat('brick', { seed: 41, lig: 30 }), cutM = K.toon({ color: '#e2a274' }); cutM.userData = { rough: 0.8 }; const S = K.grp(CG, -1.2, 0, 0); ST.side = S;
    const shp = (pts) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) sh.lineTo(p[0], p[1]); return sh; };
    const BACK = [[-1.1, 0], [-0.45, 0], [-0.45, 1.3], [-0.08, 1.95], [-0.25, 2.5], [-0.25, 6.8], [-1.1, 6.8]];
    const BREAST = [[0.62, 1.45], [1.1, 1.45], [1.1, 6.8], [0.35, 6.8], [0.35, 2.5], [0.22, 1.98], [0.27, 1.8], [0.38, 1.62], [0.5, 1.52]];
    for (const P of [BACK, BREAST]) { const g = new THREE.ExtrudeGeometry(shp(P), { depth: 0.9, bevelEnabled: false }); g.translate(0, 0, -0.9); K.add(g, inM, 0, 0, 0, S);
      const cap = K.add(new THREE.ShapeGeometry(shp(P)), cutM, 0, 0, 0.006, S, false); }
    K.add(new THREE.BoxGeometry(4.6, 0.12, 0.9), K.toon({ color: '#c8a888' }), 1.2, 0.06, -0.45, S);       // hearth + room floor
    K.add(new THREE.BoxGeometry(1.0, 0.04, 0.95), stoneM, 0.35, 0.13, -0.45, S);
    const logM = K.toon({ color: '#4a2c18' }); for (const z of [-0.3, -0.6]) { const l = K.add(new THREE.CylinderGeometry(0.06, 0.07, 0.45, 12), logM, 0.05, 0.2, z, S); l.rotation.x = Math.PI / 2; l.rotation.z = (z + 0.45) * 0.8; }
    ST.sideFire = K.flame(S, 0.05, 0.24, -0.2, 0.34); K.warmLight(S, 0.5, 0.7, 0.6, { col: '#ff8a3a', i: 2.6, dist: 6, flicker: 0.12 });
    prop.chair(S, { x: 2.0, z: -0.3, ry: -Math.PI / 2 });
    ST.sideSmoke = puffs(S, 18, '#b0aaa4'); }
  // heat rays (glowing rods drawn out over time) for the side view and the plan view
  const rayM = new THREE.MeshBasicMaterial({ color: '#ffb050', transparent: true, opacity: 0.95, fog: false }); rayM.color.multiplyScalar(2.2);
  const ray = (parent) => { const g = K.grp(parent, 0, 0, 0); const r = K.add(new THREE.CylinderGeometry(0.025, 0.025, 1, 8), rayM, 0, 0.5, 0, g, false); K.noInk(r); r.castShadow = false;
    const tip = K.add(new THREE.ConeGeometry(0.07, 0.16, 12), rayM, 0, 1.0, 0, g, false); K.noInk(tip); return { g, r, tip }; };
  ST.sideRays = [0, 1, 2].map(() => ray(CG));
  ST.hotAir = Array.from({ length: 3 }, (_, i) => { const c = new THREE.CatmullRomCurve3([0, 1, 2, 3, 4, 5].map((k) => new THREE.Vector3(-1.13 + Math.sin(k * 1.3 + i) * (k < 2 ? 0.14 : 0.07), 0.45 + k * 1.15, 0.05 + i * 0.08)));
    const m = new THREE.MeshBasicMaterial({ color: '#ff6a4a', transparent: true, opacity: 0.0, fog: false }); const t = K.add(new THREE.TubeGeometry(c, 40, 0.025, 6), m, 0, 0, 0, CG, false); K.noInk(t); return t; });
  // plan view model (look down into the firebox): back wall + angled covings, rays bounce off them into the room
  { const P = K.grp(CG, 4.0, 0, 0); ST.plan = P; const cutM = K.toon({ color: '#d8b08a' });
    K.add(new THREE.BoxGeometry(3.4, 0.08, 3.0), K.toon({ color: '#3a2a20' }), 0, 0.04, 0.6, P);
    const wallH = 0.5, w = 1.25, b = w / 3, d = 0.36;
    K.add(new THREE.BoxGeometry(b, wallH, 0.12), cutM, 0, wallH / 2, -d - 0.06, P);
    for (const s of [-1, 1]) { const x0 = s * w / 2, x1 = s * b / 2, len = Math.hypot(x1 - x0, d); const m = K.add(new THREE.BoxGeometry(0.1, wallH, len), plasterM, (x0 + x1) / 2, wallH / 2, -d / 2, P); m.rotation.y = Math.atan2(x1 - x0, -d) + Math.PI;
      K.add(new THREE.BoxGeometry(0.4, wallH, 0.12), cutM, s * (w / 2 + 0.2), wallH / 2, 0, P); }
    ST.planFire = K.flame(P, 0, 0.12, -0.15, 0.22); K.warmLight(P, 0, 0.8, 0.4, { col: '#ff8a3a', i: 2.0, dist: 5 });
    ST.planRays = [0, 1, 2, 3, 4].map(() => ray(CG)); }

  // ======================= D. LONDON STREET AT DUSK (150 fireplaces in two months) =======================
  const DG = K.grp(K.scene, XD, 0, 0);
  { const cob = K.add(new THREE.PlaneGeometry(60, 30), K.mat('stone', { seed: 51, lig: 34 }), 0, 0, 3, DG, false); cob.rotation.x = -Math.PI / 2; cob.receiveShadow = true;
    const skyC = cv(256, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a2050'); gr.addColorStop(0.55, '#6a4a8a'); gr.addColorStop(0.85, '#ff9a70'); gr.addColorStop(1, '#ffc890'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    K.noInk(K.add(new THREE.SphereGeometry(200, 32, 16), new THREE.MeshBasicMaterial({ map: ctex(skyC), side: THREE.BackSide, fog: false }), 0, -10, 0, DG, false)); }
  ST.houses = []; const winOff = new THREE.MeshStandardMaterial({ color: '#2a3040', roughness: 0.2, metalness: 0.3 });
  for (let i = 0; i < 7; i++) { const x = -6.3 + i * 2.1, hh = 6.2 + (i % 3) * 0.5; const H = K.grp(DG, x, 0, -2);
    const bm = K.mat('brick', { seed: 60 + i, lig: 34 + (i % 3) * 6, hue: [14, 22, 8][i % 3] }); K.add(new THREE.BoxGeometry(2.0, hh, 2.0), bm, 0, hh / 2, 0, H);
    K.add(new THREE.BoxGeometry(2.04, 0.18, 2.04), K.toon({ color: '#e8dcc8' }), 0, hh, 0, H);
    const wins = []; for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c += 2) { const m = winOff.clone(); const wnd = K.add(new THREE.BoxGeometry(0.5, 0.8, 0.04), m, c * 0.48, 1.6 + r * 1.55, 1.02, H, false); wins.push(m);
      K.add(new THREE.BoxGeometry(0.6, 0.06, 0.08), K.toon({ color: '#f0e6d4' }), c * 0.48, 1.18 + r * 1.55, 1.04, H, false); }
    K.add(new THREE.BoxGeometry(0.6, 1.1, 0.06), K.toon({ color: ['#1a2a4a', '#3a1a1a', '#1a3a2a'][i % 3] }), 0, 0.55, 1.02, H);
    const ch = K.add(new THREE.BoxGeometry(0.5, 0.9, 0.4), bm, 0.5, hh + 0.45, -0.3, H);
    ST.houses.push({ wins, smoke: puffs(H, 4, '#8a8090'), top: [0.5, hh + 0.95, -0.3] }); }
  for (const x of [-4.2, 0, 4.2]) { const lp = K.grp(DG, x, 0, 0.9); K.add(new THREE.CylinderGeometry(0.05, 0.07, 2.8, 12), K.M.iron, 0, 1.4, 0, lp); K.bulb(lp, 0, 2.9, 0, { size: 0.07, i: 1.4, dist: 5, col: '#ffcf80' }); }
  for (const x of [-2.1, 2.1]) { const ld = K.grp(DG, x - 0.3, 0, -0.95); for (const s of [-1, 1]) { const r = K.add(new THREE.BoxGeometry(0.05, 3.6, 0.05), K.M.woodD, s * 0.2, 1.75, 0, ld); r.rotation.x = -0.18; }
    for (let k = 0; k < 9; k++) { const rg = K.add(new THREE.BoxGeometry(0.4, 0.04, 0.04), K.M.woodD, 0, 0.3 + k * 0.37, 0.05 - k * 0.066, ld); } }

  // ======================= E. JANE AUSTEN'S DESK (candlelight) =======================
  const RE = K.room({ x: XE, w: 4, d: 4, h: 2.7, floor: 'planks', wall: 'plaster', wallOpts: { seed: 71, col: [36, 30, 60], bricks: 0, stains: 0.1 }, floorOpts: { seed: 72, hue: 26, sat: 40, lig: 30 }, ceil: 'flat' });
  K.add(new THREE.PlaneGeometry(3.9, 2.6), wallM('#3a4a3a', 'rgba(140,170,120,.3)', 2.5, 1.2), 0, 1.35, -1.97, RE, false);
  prop.table(RE, { x: 0, z: -0.75, w: 1.3, d: 0.7 }); prop.chair(RE, { x: 0, z: -1.5, ry: 0 });
  prop.candle(RE, { x: -0.42, y: 0.79, z: -0.6, h: 0.24, light: 1.4, holder: 'brass' });
  { const bk = K.grp(RE, 0.12, 0.8, -0.62); const pg = K.toon({ color: '#f4ecd8' }); const a = K.add(new THREE.BoxGeometry(0.26, 0.02, 0.34), pg, -0.13, 0.01, 0, bk); a.rotation.z = 0.08; const b2 = K.add(new THREE.BoxGeometry(0.26, 0.02, 0.34), pg, 0.13, 0.01, 0, bk); b2.rotation.z = -0.08;
    const lineC = cv(256, 320, (g, W, H) => { g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = 3; for (let y = 30; y < H - 20; y += 18) { g.beginPath(); g.moveTo(20, y); g.lineTo(20 + (W - 40) * (0.6 + 0.4 * rnd(y, 3)), y + (rnd(y, 5) - 0.5) * 2); g.stroke(); } });
    const top = K.add(new THREE.PlaneGeometry(0.5, 0.33), K.toon({ map: ctex(lineC) }), 0, 0.025, 0, bk, false); top.rotation.x = -Math.PI / 2; }
  prop.window(RE, { x: 1.3, y: 1.6, z: -1.99, w: 0.7, h: 1.1, kind: 'moon', depth: 0.1, i: 0.8 });

  // ======================= F. TODAY: A MODERN LIVING ROOM WITH A RUMFORD =======================
  const RF = K.room({ x: XF, w: 6.4, d: 5.6, h: 2.8, floor: 'planks', wall: 'plaster', wallOpts: { seed: 81, col: [30, 22, 78], bricks: 0, stains: 0 }, floorOpts: { seed: 82, hue: 30, sat: 30, lig: 50 }, ceil: 'flat' });
  ST.modFP = fireplace(RF, { x: 0, z: -2.62, w: 1.15, h: 1.3, d0: 0.36, d1: 0.36, k: 1, inner: brickM, coving: plasterM, surround: K.toon({ color: '#f4f2ee' }), breast: K.toon({ color: '#ece6dc' }), ceil: 2.8, flame: 0.24, lightI: 3.0 });
  { const sofaM = K.toon({ color: '#3a6a7a' }); K.add(new THREE.BoxGeometry(2.4, 0.45, 0.9), sofaM, 0, 0.32, 0.5, RF); K.add(new THREE.BoxGeometry(2.4, 0.6, 0.2), sofaM, 0, 0.75, 0.9, RF); for (const s of [-1, 1]) K.add(new THREE.BoxGeometry(0.2, 0.6, 0.9), sofaM, s * 1.25, 0.5, 0.5, RF);
    K.add(new THREE.BoxGeometry(1.0, 0.04, 0.6), K.toon({ color: '#c8a070' }), 0, 0.42, -0.7, RF); }
  prop.rug(RF, { x: 0, z: -0.4, w: 3.2, d: 2.2, pattern: 'stripes', cols: ['#e8dcc8', '#c8603a', '#3a6a7a', '#f4ecd8'] });
  prop.shelf(RF, { x: -2.8, z: -1.6, ry: Math.PI / 2, w: 1.4, h: 1.8, seed: 3 }); K.bulb(RF, 2.4, 1.6, -2.3, { size: 0.08, i: 0.9, dist: 4, col: '#ffd8a0' });

  const emberTex = ctex(cv(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.35, 'rgba(255,150,60,.8)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }));
  const embers = (parent, n, x, y, z, w = 0.5, hgt = 1.4) => Array.from({ length: n }, (_, i) => { const m = new THREE.SpriteMaterial({ map: emberTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }); const sp = new THREE.Sprite(m); parent.add(sp); return { sp, i, x, y, z, w, hgt }; });
  ST.embers = [...embers(RB, 16, 0, 0.25, -2.75, 0.45, 1.3), ...embers(RA, 8, 0, 0.25, -3.2, 0.8, 1.2), ...embers(RF, 12, 0, 0.25, -2.75, 0.4, 1.2), ...embers(ST.side, 10, 0.05, 0.3, -0.2, 0.25, 1.6)];
  // dust + brick chips at each trowel / hammer hit
  const dustTex = ctex(cv(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(230,215,195,.8)'); gr.addColorStop(1, 'rgba(230,215,195,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  ST.dust = Array.from({ length: 10 }, (_, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, transparent: true, depthWrite: false, opacity: 0 })); K.scene.add(sp); return sp; });
  ST.chips = Array.from({ length: 6 }, (_, i) => { const c = K.add(new THREE.BoxGeometry(0.04, 0.025, 0.03), K.mat('brick', { seed: 90 + i, lig: 44 }), 0, -10, 0, K.scene); c.castShadow = false; return c; });
  // airflow arrows climbing the flue
  ST.arrows = Array.from({ length: 4 }, (_, i) => { const m = new THREE.MeshBasicMaterial({ color: '#ff7a4a', transparent: true, opacity: 0, fog: false }); m.color.multiplyScalar(1.6); const a = K.add(new THREE.ConeGeometry(0.07, 0.18, 12), m, 0, -10, 0, CG, false); K.noInk(a); return a; });
  const SETG = { old: RA, rum: RB, cut: CG, street: DG, austen: RE, today: RF };
  return { update: (W, f) => {
    for (const k in SETG) SETG[k].visible = k === W.set;
    ST.rumFP.set(W.squeeze ?? 1);
    ST.embers.forEach((E2) => { const per = 70 + (E2.i * 13) % 50, t = ((f + E2.i * 37) % per) / per, sw = Math.sin(t * 7 + E2.i) * 0.06;
      E2.sp.position.set(E2.x + (rnd(E2.i, 3) - 0.5) * E2.w + sw, E2.y + t * E2.hgt, E2.z + (rnd(E2.i, 4) - 0.5) * 0.2); const sz = 0.035 + rnd(E2.i, 5) * 0.03; E2.sp.scale.setScalar(sz * (1 - t * 0.5));
      E2.sp.material.opacity = Math.min(1, (1 - t) * 1.6) * (0.6 + 0.4 * Math.sin(f * 0.9 + E2.i * 2)); });
    const hit = W.hit || null; ST.dust.forEach((d, i) => { if (!hit) { d.material.opacity = 0; return; } const a = hit.age, ang = rnd(i, 8) * 6.28, sp = 0.004 + rnd(i, 9) * 0.006;
      d.position.set(hit.p[0] + Math.cos(ang) * sp * a, hit.p[1] + 0.01 * a * rnd(i, 10), hit.p[2] + Math.sin(ang) * sp * a * 0.5); d.scale.setScalar(0.06 + a * 0.008); d.material.opacity = Math.max(0, 0.55 * (1 - a / 22)); });
    ST.chips.forEach((c, i) => { if (!hit || hit.age > 20) { c.position.y = -10; return; } const a = hit.age, ang = rnd(i, 11) * 6.28, v = 0.012 + rnd(i, 12) * 0.01;
      c.position.set(hit.p[0] + Math.cos(ang) * v * a, Math.max(0.02, hit.p[1] + 0.025 * a - 0.0016 * a * a), hit.p[2] + Math.abs(Math.sin(ang)) * v * a * 0.6); c.rotation.set(a * 0.4 + i, a * 0.3, 0); });
    ST.arrows.forEach((ar, i) => { const on = W.arrows ?? 0, t = ((f * 0.012 + i / 4) % 1); ar.position.set(-1.13, 0.9 + t * 5.0, 0.3); ar.material.opacity = on * Math.sin(Math.PI * t); });
    const used = W.bricksUsed ?? 10; for (let i = 0; i < ST.bricks.length; i++) ST.bricks[i].visible = (ST.bricks.length - 1 - i) >= used;
    // old hearth smoke rolls OUT into the room
    ST.oldSmoke.forEach((s, i) => { const t = ((f * 0.004 + i / ST.oldSmoke.length) % 1); s.position.set(-0.7 + rnd(i, 1) * 1.4 + Math.sin(t * 6 + i) * 0.2, 1.2 + t * 1.5, -2.6 + t * 2.4); s.scale.setScalar(0.8 + t * 2.6); s.material.opacity = 0.6 * Math.sin(Math.PI * t); });
    // cutaway: smoke rises straight up the flue; rays and hot air drawn out over time
    ST.sideSmoke.forEach((s, i) => { const t = ((f * 0.006 + i / ST.sideSmoke.length) % 1); const yy = 0.5 + t * 6.0, xx = yy < 1.9 ? 0.05 + (yy - 0.5) / 1.4 * 0.02 : 0.07; s.position.set(xx + Math.sin(t * 9 + i) * (yy < 2.5 ? 0.04 : 0.1), yy, 0.1); s.scale.setScalar(yy < 2.5 ? 0.3 : 0.45 + t * 0.3); s.material.opacity = (W.smokeUp ?? 0) * 0.8 * Math.sin(Math.PI * t); });
    const rays = (list, segs, k) => list.forEach((R, i) => { const sg = segs[i]; if (!sg) { R.g.visible = false; return; } const [p0, p1] = sg, kk = clamp((k * segs.length - i * 0.6) / 1.2, 0, 1);
      R.g.visible = kk > 0.01; const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], L = Math.hypot(dx, dy, dz) * kk; R.g.position.set(p0[0], p0[1], p0[2]); R.r.scale.y = Math.max(L, 0.001); R.r.position.y = L / 2; R.tip.position.y = L;
      R.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize()); });
    rays(ST.sideRays, [[[-1.0, 0.35, 0.15], [1.2, 0.75, 0.15]], [[-1.0, 0.28, 0.1], [1.2, 0.3, 0.1]], [[-1.0, 0.45, 0.15], [1.0, 1.25, 0.15]]], W.rays ?? 0);
    ST.hotAir.forEach((t) => { t.material.opacity = (W.hot ?? 0) * 0.85; });
    const PX = 4.0; rays(ST.planRays, [[[PX - 0.05, 0.25, -0.15], [PX - 0.37, 0.25, -0.2]], [[PX - 0.37, 0.25, -0.2], [PX - 1.3, 0.25, 1.7]], [[PX + 0.05, 0.25, -0.15], [PX + 0.37, 0.25, -0.2]], [[PX + 0.37, 0.25, -0.2], [PX + 1.3, 0.25, 1.7]], [[PX, 0.25, -0.1], [PX, 0.25, 1.9]]], W.bounce ?? 0);
    // street: windows light up house by house as the fireplaces are rebuilt
    ST.houses.forEach((H, i) => { const on = (W.lit ?? 0) > i; H.wins.forEach((m) => { m.color.set(on ? '#ffc070' : '#2a3040'); m.emissive.set(on ? '#ff9a40' : '#000000'); m.emissiveIntensity = on ? 1.6 : 0; });
      H.smoke.forEach((s, k) => { const t = ((f * 0.004 + k / 4) % 1); s.position.set(H.top[0] + Math.sin(t * 5 + k) * 0.1, H.top[1] + t * 1.8, H.top[2]); s.scale.setScalar(0.6 + t * 1.8); s.material.opacity = (on ? 0.2 : 0.6) * Math.sin(Math.PI * t); }); });
  } };
};
// ---------------- cast ----------------
const SK = '#f7f4ee';
const RUMF = { tunic: '#25385e', stick: true, skin: SK, hair: '#e4e0d8', wig: true, collar: '#f4ecd8', tie: '#f4ecd8', pattern: { type: 'vstripes', col: 'rgba(216,176,64,.25)', scale: 0.6 } };
const LORDS = [
  { tunic: '#6a1e2a', stick: true, skin: SK, hair: '#5a3a24', hat: 'tophat', hatCol: '#1e1a1a', hatBand: '#3a2a1a', collar: '#ffffff' },
  { tunic: '#6a4a2e', stick: true, skin: SK, hair: '#d8b870', collar: '#ffffff', glasses: true },
  { tunic: '#6f8a62', dress: '#6f8a62', stick: true, skin: SK, hair: '#6a4228' }];
const BUILDERS = [{ tunic: '#7a5a3a', stick: true, skin: SK, hair: '#8a5a2a', apron: '#d8ccb0', hat: 'brim17', hatCol: '#3a2a1e', hatBand: '#2a1a10' }, { tunic: '#4a5a6a', stick: true, skin: SK, hair: '#2a1e18', apron: '#d8ccb0', beard: '#2a1e18', beardStyle: 'short' }];
const AUSTEN = { tunic: '#e8e0d0', dress: '#e8e0d0', stick: true, skin: SK, hair: '#6a4228' };
const MOM = { tunic: '#c8603a', stick: true, skin: SK, hair: '#6a4228' }, KID = { tunic: '#f2c230', stick: true, skin: SK, hair: '#e8b860', pattern: { type: 'stripes', col: '#3a6a7a', scale: 1.4 } }, DAD = { tunic: '#3a4a5a', stick: true, skin: SK, hair: '#3a2a1c', beard: '#3a2a1c', beardStyle: 'short' };
const RUM_T0 = CUE.squeeze + 38, RUM_P = 28, rumHits = Array.from({ length: 5 }, (_, i) => RUM_T0 + i * RUM_P + Math.round(0.62 * RUM_P));
const BLD_T = (S0, i) => S0 + 74 + i * 12, BLD_P = 28, bldHits = (S0) => [0, 1].flatMap((i) => Array.from({ length: 6 }, (_, k) => BLD_T(S0, i) + k * BLD_P + Math.round(0.62 * BLD_P)));
export const actorsAt = (f, T) => {
  const S = shot(f), out = [];
  const tintL = { rum: '#fff1e6', old: '#f4f0ec', cut: '#fff1e6', street: '#fff0e8', austen: '#ffeee0', today: '#fff6ee' }[S.light] || '#ffffff';
  // card(): Motion Engine v1 physical layer. Idle (breathing, irregular weight transfers, posture corrections) + the shot's acting,
  // all through rig channels (pelvis, knees, spine, shoulders, feet, hands). The card itself never slides or stretches.
  const card = (id, O, o, w, seed, extra = {}) => { const I = idle3(f, seed, extra.e ?? 1), A = extra.act || {}, r = extra.r || { sx: 1, sy: 1, y: 0 };
    const rc = Math.min(0.12, Math.max(0, 1 - r.sy) * 1.6), rs = Math.min(0.1, Math.max(0, r.sy - 1) * 1.2);           // reaction squash -> knee compression, stretch -> shoulders lift
    const opts = { seed, blink: blinkV(f, seed), L: 'hang', R: 'hang', look: 0, Ld: A.Ld ?? I.Ld, Rd: A.Rd ?? I.Rd, ...o };
    opts.tilt = q(I.tilt + (A.tilt || 0) + (o.tilt || 0), 1); opts.headTilt = q(I.headTilt + (A.headTilt || 0) + (o.headTilt || 0), 1);
    opts.px = q(I.px + (A.px || 0), 1); opts.crouch = q(Math.max(0, I.crouch + (A.crouch || 0) + rc), 3);
    opts.shrug = q(Math.max(-0.2, I.shrug + (A.shrug || 0) + rs), 3); opts.chest = q(A.chest || 0, 3); opts.headDrop = q(A.headDrop || 0, 3);
    if (A.fL) opts.fL = A.fL; if (A.fR) opts.fR = A.fR; if (A.sit) opts.sit = A.sit;
    out.push({ key: id + JSON.stringify(opts), draw: (p) => T.romanFront(p, O, opts), opts, x: w[0], y: w[1] + (extra.y || 0) + (A.sit ? 0.45 * 0.6975 * (extra.s ?? 0.9) * A.sit : 0) + (extra.hop ? r.y : 0), z: w[2], s: extra.s ?? 0.9, sx: 1, sy: 1, ground: w[1], tint: tintL, roll: extra.roll, id }); };
  // palms held out in front of the chest toward the fire (the fire is toward the camera), fingers opening and closing a little
  const warmHands = (k) => ({ L: 'ik', R: 'ik', Lh: [-0.42 + 0.03 * vnoise(f * 0.03, 1), 0.42 - 0.06 * k + 0.02 * vnoise(f * 0.05, 2), 1], Rh: [-0.42 + 0.03 * vnoise(f * 0.03, 3), 0.4 - 0.06 * k + 0.02 * vnoise(f * 0.05, 4), 1], Ld: null, Rd: null, LhFront: true, RhFront: true });
  const warmLord = (ff, start, pos = B(0.72, 0, -0.55)) => { const relax = ease(ff, [[0, 0], [start + 50, 1]], 40), L_ = lookSeq(ff, [[0, -0.45], [start + 70, 0.15], [start + 160, -0.35]], 18);
    const rubbing = Math.floor((ff - start + 400) / 150) % 2 === 0;
    card('lw', LORDS[0], { expr: ff < start + 60 ? 'smile' : 'relief', ...(rubbing ? rubHands3(ff, 0.62, 0.42) : warmHands(relax)), look: L_.look }, pos, 11, { e: 0.8, act: { headTilt: L_.headTilt, tilt: L_.tilt, shrug: -0.08 * relax, crouch: rubbing ? 0.02 + 0.015 * Math.abs(Math.sin(ff * 0.42)) : 0 }, r: react(ff, start + 60, 0.5) }); };
  switch (S.id) {
    case 'hook': case 'loop': { const ff = S.id === 'loop' ? f - S.a + 40 : f; warmLord(ff, 0);
      card('lady', LORDS[2], { expr: ff > 120 ? 'grin' : 'smile', L: 'ik', Lh: [0.25, 0.75, 1], R: 'ik', Rh: ease2(ff, [[0, [0.4, 0.75]], [70, [0.05, -0.18]]], 18), Rd: null, Ld: null, look: q(-0.3 + 0.1 * vnoise(ff * 0.02, 13), 2) }, B(-0.6, 0, -0.4), 13, { e: 1.0, act: { headTilt: 6 * ease(ff, [[0, 0], [80, 1]], 30), shrug: -0.06 }, r: react(ff, 120, 0.4) }); break; }
    case 'old': case 'cold': { const a = CUE.old;
      // lord 0: one coughing fit (exactly three coughs), recovers, then cries: lowered head, shoulder sobs, wiping his eye
      const c0 = cough3(f, a + 50, 3, 10), crying = f > a + 120 && !c0.on, sob = crying ? Math.max(0, vnoise(f * 0.09, 21)) : 0, wipe = crying && ((f - a) % 110) > 70;
      card('o0', LORDS[0], { expr: c0.on ? 'pained' : pick(f, [[a, 'sick'], [a + 120, 'cry']]), L: 'cross', R: c0.on ? 'mouth' : wipe ? 'ik' : 'cross', Rh: [-0.55, -0.42, 1], mk: c0.mk, look: q(ease(f, [[a, 0.35], [a + 150, -0.35]], 20), 2) },
        A(-0.6, 0, -0.9), 21, { e: 0.6, act: { chest: c0.chest + 0.12 * sob, headDrop: c0.headDrop + (crying ? 0.03 : 0), tilt: c0.tilt, shrug: c0.shrug + 0.18 * sob } });
      // lord 1: hugging himself, tremors in shoulders and elbows, shoulders raised, shifting weight and lifting a cold foot now and then
      const sv = shiver3(f, 22, 1.2), lift = Math.max(0, Math.sin((f - a) / 34)) ** 4 * 14;
      card('o1', LORDS[1], { expr: 'pained', L: 'cross', R: 'cross', look: q(-0.2 + 0.1 * vnoise(f * 0.03, 22), 2) }, A(0.62, 0, -1.1), 22,
        { e: 0.4, act: { ...sv, px: sv.px + 6 * Math.sin((f - a) / 34), fL: [0, lift], fR: [0, Math.max(0, -Math.sin((f - a) / 34)) ** 4 * 14] } });
      // lady: leans back from the smoke (weight on the back foot), fans hard, coughs twice in the close-up
      const c2 = cough3(f, CUE.cold + 40, 2, 9);
      card('o2', LORDS[2], { expr: c2.on ? 'sick' : pick(f, [[a, 'disgust'], [a + 140, 'pained']]), L: c2.on ? 'mouth' : 'wave', mk: c2.mk, wv: f / 2.2, R: 'ik', Rh: [0.2, 0.7, 1], Rd: null, look: q(0.25 + 0.08 * vnoise(f * 0.05, 23), 2) },
        A(0.35, 0, 0.3), 23, { e: 0.8, act: { tilt: 6 + 1.5 * Math.sin(f / 2.2) + c2.tilt, px: 10, chest: c2.chest, headDrop: c2.headDrop, shrug: c2.shrug } }); break; }
    case 'squeeze': case 'angles': { const a = CUE.squeeze, st = strike3(f, RUM_T0, RUM_P, 5, 1), L_ = lookSeq(f, [[a, 0.2], [a + 14, 0.6]], 12);
      // looks at the wall first (eyes -> head -> torso), squints, raises an eyebrow, then 5 whole-body strikes
      card('rum', RUMF, { expr: pick(f, [[a, 'squint'], [a + 22, 'sly'], [RUM_T0, 'stubborn'], [rumHits[4] + 8, 'grin']]), tool: 'trowel', R: 'slam', sk: q(0.55 + 0.45 * st.sk, 3), Rd: null, toolRot: q(-0.6 - 0.5 * (1 - st.sk), 2), L: 'hip', look: L_.look },
        B(-0.78, 0, -1.9), 9, { s: 0.92, e: 0.5, act: { tilt: st.tilt + L_.tilt, headTilt: L_.headTilt - 0.4 * st.tilt, px: st.px, crouch: st.crouch } }); break; }
    case 'backwards': { const a = S.a;
      card('rum', RUMF, { expr: pick(f, [[a, 'smug'], [a + 70, 'wink'], [a + 82, 'smug']]), L: 'hip', R: 'ik', Rh: ease2(f, [[a, [0.3, 0.9]], [a + 12, [1.15, -0.05]], [a + 80, [0.9, 0.1]]], 10), Rd: null, look: q(0.55 - 0.3 * ease(f, [[a, 0], [a + 60, 1]], 15), 2) }, B(0.45, 0, -1.75), 9, { s: 0.92, e: 0.9, act: { tilt: 3 * ease(f, [[a, 0], [a + 12, 1]], 10), px: 6 * ease(f, [[a, 0], [a + 12, 1]], 10) } });
      [0, 1].forEach((i) => { const t = a + 40 + i * 14, L_ = lookSeq(f, [[a, -0.6], [a + 26 + i * 6, -0.15]], 14);
        card('b' + i, LORDS[i], { expr: pick(f, [[a, 'unimpressed'], [t, ['sideeye', 'dazed'][i]]]), ...arms(f, [[a, 'hang'], [a + 10 + i * 8, 'cross']], 'R', 12), ...arms(f, [[a, 'hang'], [a + 12 + i * 8, 'cross']], 'L', 12),
          look: q(L_.look + (i ? 0 : shake(f, t, 44, 0.3)), 2) }, B(-0.45 - i * 0.6, 0, -0.55 + i * 0.45), 21 + i,
          { e: 0.8, act: { headTilt: L_.headTilt + (i ? 9 * ease(f, [[a, 0], [t, 1]], 12) : 0), tilt: L_.tilt, px: i ? -5 * ease(f, [[a, 0], [t, 1]], 14) : 0, shrug: i ? 0.12 * ease(f, [[a, 0], [t, 1]], 10) : 0 }, r: react(f, t, 0.6, 0) }); }); break; }
    case 'radiant': case 'hotair': case 'bounce': case 'throat': { const a = CUE.radiant;
      if (S.id === 'radiant') { const k = ease(f, [[a, 0], [a + 70, 1]], 30);
        card('warm', LORDS[0], { expr: pick(f, [[a, 'neutral'], [a + 75, 'relief']]), ...(f > a + 110 ? rubHands3(f, 0.62, 0.42) : warmHands(k)), look: -0.55 }, C(0.12, 0, 0.3), 11, { s: 0.7, e: 0.6, act: { shrug: 0.25 * (1 - k) - 0.1 * k, tilt: -3 * k }, r: react(f, a + 75, 0.6, 0) }); } break; }
    case 'street': { const a = S.a; BUILDERS.forEach((O, i) => { const P0 = D(-3.4 + i * 3.4, 0, -0.75), P1 = D(-2.35 + i * 3.6, 0, -0.75), wk = walk3(f, [[a + i * 14, P0], [a + 62 + i * 14, P1]], 0.9, 0.36), st = strike3(f, BLD_T(a, i), BLD_P, 6, 0.8);
        card('bd' + i, O, { expr: pick(f, [[a, 'smile'], [a + 80, 'grin']]), tool: i ? 'hammer' : 'trowel', R: wk.moving ? 'hang' : 'slam', sk: q(0.55 + 0.45 * st.sk, 3), Rd: wk.moving ? [0.07 * wk.swing, 0] : null, Ld: wk.moving ? [-0.07 * wk.swing, 0] : undefined, look: 0.3 },
          wk.p, 31 + i, { e: 0.6, act: { fL: wk.fL, fR: wk.fR, crouch: wk.moving ? wk.crouch : st.crouch, tilt: wk.moving ? 2 * wk.dir : st.tilt * 0.8, px: wk.moving ? 0 : st.px * 0.8 } }); }); break; }
    case 'austen': { const a = S.a, up = f > a + 70;
      card('jane', AUSTEN, { expr: up ? 'grin' : 'smile', tool: 'quill', R: 'grab', gx: q(0.18 + 0.22 * (((f - a) / 50) % 1) + 0.02 * vnoise(f * 0.5, 41), 3), gy: q(0.55 + 0.03 * vnoise(f * 0.6, 42) - 0.35 * ease(f, [[a, 0], [a + 66, 1]], 12), 3), Rd: null, toolRot: q(-0.5 + 0.15 * vnoise(f * 0.4, 43), 2), look: up ? 0.05 : q(0.2 + 0.1 * (((f - a) / 50) % 1), 2) },
        Ev(0, 0, -1.25), 41, { s: 0.9, y: -0.32, e: 0.5, act: { sit: 1, headTilt: up ? 0 : 6, headDrop: up ? 0 : 0.03, chest: up ? 0 : 0.15 }, r: react(f, a + 72, 0.4) }); break; }
    case 'today': { const a = S.a, pull = ease(f, [[a, 0], [a + 30, 1]], 20);
      card('mom', MOM, { expr: 'relief', L: 'ik', Lh: [0.1 - 0.25 * pull, 0.55 - 0.15 * pull, 1], Ld: null, R: 'cheek', look: -0.3, blanket: '#c8a0d0' }, F(-0.45, 0, 0.6), 51, { s: 0.85, y: -0.3, e: 0.5, act: { sit: 1, shrug: 0.2 * pull, tilt: 4 } });
      card('kid', KID, { expr: 'grin', L: 'ik', R: 'ik', Lh: [0.9 + 0.08 * vnoise(f * 0.2, 53), 0.15 + 0.06 * vnoise(f * 0.3, 54)], Rh: [0.9 + 0.08 * vnoise(f * 0.2, 55), 0.15 + 0.06 * vnoise(f * 0.3, 56)], Ld: null, Rd: null, look: -0.5 }, F(0.05, 0, 0.55), 53, { s: 0.6, y: -0.18, e: 1.2, hop: true, act: { sit: 1, chest: -0.1, headDrop: -0.02 }, r: reacts(f, [a + 10, a + 40, a + 70], 0.8, 0.04) });
      card('dad', DAD, { expr: 'smile', L: 'hang', ...arms(f, [[a, 'hang'], [a + 12, 'point']], 'R', 10), look: -0.2 }, F(0.5, 0, 0.6), 55, { s: 0.88, y: -0.3, e: 0.5, act: { sit: 1, headTilt: nod(f, a + 20, 40, 6), tilt: 2 * ease(f, [[a, 0], [a + 12, 1]], 10) } }); break; }
    case 'punch': { const a = S.a; warmLord(f, a - 60, B(0.72, 0, -0.55));
      card('rum', RUMF, { expr: pick(f, [[a, 'smug'], [a + 55, 'wink'], [a + 70, 'grin']]), L: 'hip', R: 'ik', Rh: ease2(f, [[a, [0.3, 0.9]], [a + 18, [1.0, -0.15]], [a + 60, [0.85, 0.05]]], 12), Rd: null, look: q(ease(f, [[a, 0.5], [a + 40, -0.1]], 12), 2) }, B(-0.42, 0, -0.65), 9, { s: 0.92, e: 0.9, act: { headTilt: nod(f, a + 58, 24, 5), tilt: 3 * ease(f, [[a, 0], [a + 18, 1]], 12), px: 5 * ease(f, [[a, 0], [a + 18, 1]], 12) }, r: react(f, a + 55, 0.8, 0) }); break; }
  }
  return out;
};
// ---------------- fx ----------------
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'backwards' && f >= S.a + 50) out.push(emote('?', f - S.a - 50, B(-0.45, 1.8, -0.55), { s: 0.22 }));
  if (S.id === 'squeeze' && f >= rumHits[4] + 8) out.push(emote('bulb', f - rumHits[4] - 8, B(-0.78, 1.95, -1.9), { s: 0.24 }));
  if (S.id === 'old' && f >= S.a + 120) out.push(emote('!?', f - S.a - 120, A(-0.6, 1.85, -0.9), { s: 0.2 }));
  if (S.id === 'punch' && f >= S.a + 50 && f < S.a + 130) out.push(emote('heart', f - S.a - 50, B(0.72, 1.85, -0.55), { s: 0.2 }));
  return out; };
// ---------------- camera ----------------
const yawLook = (pos, look, deg) => { const a = deg * Math.PI / 180, dx = look[0] - pos[0], dz = look[2] - pos[2]; return [pos[0] + dx * Math.cos(a) - dz * Math.sin(a), look[1], pos[2] + dx * Math.sin(a) + dz * Math.cos(a)]; };
const HOOK0 = { pos: B(0.05, 0.85, -1.15), look: B(0.0, 0.62, -2.6), fov: 48 };
const camRaw = (f) => { const S = shot(f), v = (f - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v), a = S.a;
  switch (S.id) {
    // the blazing tall shallow fireplace, pull back to reveal the warm, smiling room
    case 'hook': { const k = E.smooth(ramp(f, 0, S.b)); return { pos: lerp3(HOOK0.pos, B(0.25, 1.45, 2.3), k), look: lerp3(HOOK0.look, B(0.0, 1.0, -1.4), k), fov: lerp(46, 48, k) }; }
    case 'loop': { const k = E.smooth(ramp(f, a, S.b)); return { pos: lerp3(B(0.25, 1.45, 2.3), HOOK0.pos, k), look: lerp3(B(0.0, 1.0, -1.4), HOOK0.look, k), fov: lerp(48, 46, k) }; }
    // 1796: slow push through the smoke toward the cavernous hearth past the shivering guests
    case 'old': return { pos: lerp3(A(-0.1, 1.6, 2.7), A(-0.05, 1.5, 2.1), sv), look: lerp3(A(0, 1.2, -2.6), A(0, 1.1, -1.6), sv), fov: 48 };
    case 'cold': return { pos: lerp3(A(0.85, 1.45, 2.4), A(0.7, 1.4, 2.1), sv), look: lerp3(A(0.35, 1.3, 0.1), A(0.2, 1.25, -0.2), sv), fov: 44 };
    // the squeeze: low angle on the firebox as the back wall comes forward and the sides angle out
    case 'squeeze': return { pos: lerp3(B(0.55, 0.9, 0.35), B(0.3, 1.05, -0.05), sv), look: lerp3(B(-0.6, 0.85, -2.4), B(-0.62, 1.0, -2.2), sv), fov: 50 };
    case 'angles': return { pos: lerp3(B(0.05, 2.3, -1.05), B(-0.05, 2.0, -1.3), sv), look: B(0.0, 0.1, -2.75), fov: 46 };
    case 'backwards': return { pos: lerp3(B(0.35, 1.5, 2.3), B(0.15, 1.45, 1.8), sv), look: B(-0.15, 1.1, -1.0), fov: 48 };
    case 'radiant': return { pos: lerp3(C(-0.75, 1.9, 5.6), C(-0.85, 1.7, 4.9), sv), look: lerp3(C(-0.95, 1.7, 0), C(-0.9, 1.4, 0), sv), fov: 46 };
    case 'hotair': return { pos: lerp3(C(-0.9, 1.6, 4.2), C(-1.0, 3.6, 4.6), sv), look: lerp3(C(-1.1, 1.4, 0), C(-1.15, 4.0, 0), sv), fov: 46 };
    case 'throat': return { pos: lerp3(C(-0.75, 1.9, 2.6), C(-0.9, 3.0, 2.9), sv), look: lerp3(C(-1.1, 1.8, 0), C(-1.15, 3.2, 0), sv), fov: 44 };
    case 'bounce': return { pos: lerp3(C(4.0, 3.5, 2.7), C(4.0, 3.1, 2.3), sv), look: C(4.0, 0.15, 0.4), fov: 46 };
    case 'street': return { pos: lerp3(D(-3.5, 1.6, 7.0), D(3.0, 1.9, 7.4), sv), look: lerp3(D(-2.5, 2.6, -2), D(2.6, 2.8, -2), sv), fov: 50 };
    case 'austen': return { pos: lerp3(Ev(0.5, 1.35, 1.35), Ev(0.3, 1.3, 0.95), sv), look: Ev(0.0, 0.95, -0.9), fov: 44 };
    case 'today': return { pos: lerp3(F(0.35, 1.2, -2.15), F(0.2, 1.15, -1.75), sv), look: F(0.0, 0.92, 0.6), fov: 48 };
    case 'punch': return { pos: lerp3(B(0.15, 1.45, 2.7), B(0.05, 1.4, 2.2), sv), look: B(0.1, 1.1, -0.8), fov: 46 };
  } };
const cam = (f) => { const S = shot(f), c = camRaw(f);
  const wi = WHIPS.indexOf(S.b + 1), wo = WHIPS.indexOf(S.a);
  if (wi >= 0 && f > S.b - 14) c.look = yawLook(c.pos, c.look, (wi % 2 ? -55 : 55) * E.easeIn(ramp(f, S.b - 14, S.b + 1)));
  if (wo >= 0 && f < S.a + 18) c.look = yawLook(c.pos, c.look, -(wo % 2 ? -55 : 55) * (1 - E.easeOut(ramp(f, S.a, S.a + 18))));
  // controlled impact shake: 6 frames, a few millimetres, decaying (trowel and hammer hits only)
  const hs = S.id === 'squeeze' ? rumHits : S.id === 'street' ? bldHits(S.a) : [];
  for (const h of hs) { const d = f - h; if (d >= 0 && d < 6) { const k = (S.id === 'street' ? 0.006 : 0.012) * Math.exp(-d / 2) * (d % 2 ? -1 : 1); c.pos = [c.pos[0] + k * 0.6, c.pos[1] + k, c.pos[2]]; c.look = [c.look[0] + k * 0.6, c.look[1] + k, c.look[2]]; } }
  c.shadowAt = c.look; return c; };
export const camAt = cam;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shot(f), C0 = cam(f), at = (p, k) => ({ focus: dist(C0.pos, p), cinf: k * 0.6 });
  switch (S.id) {
    case 'hook': case 'loop': return at(f < S.a + 90 && S.id === 'hook' ? B(0, 0.6, -2.5) : B(0.6, 1.2, -0.55), 10);
    case 'old': return at(A(-0.6, 1.2, -0.8), 7);
    case 'cold': return at(A(0.45, 1.3, 0.3), 9);
    case 'squeeze': return at(B(0.2, 0.7, -2.5), 9);
    case 'angles': return at(B(0, 0.2, -2.8), 9);
    case 'backwards': return at(B(-0.5, 1.2, -0.5), 9);
    case 'radiant': return at(C(-0.5, 1.0, 0), 4);
    case 'hotair': return at(C(-1.1, 2.6, 0), 4);
    case 'throat': return at(C(-1.1, 2.2, 0), 5);
    case 'bounce': return at(C(4, 0.2, 0.4), 6);
    case 'street': return at(D(0, 2.5, -1), 4);
    case 'austen': return at(Ev(0, 1.0, -1.2), 10);
    case 'today': return at(F(0, 1.0, 0.6), 8);
    case 'punch': return at(B(-0.5, 1.2, -0.75), 9);
  }
  return { focus: 5, cinf: 0 }; };
export const worldAt = (f) => { const S = shot(f), W = { set: S.light };
  if (S.id === 'squeeze' || S.id === 'angles') W.squeeze = q(E.smooth(ramp(f, CUE.squeeze + 30, CUE.backwards - 20)), 3);
  if (S.id === 'squeeze') { const done = rumHits.filter((h) => f >= h); W.bricksUsed = done.length * 2; if (done.length) { const h = done[done.length - 1]; if (f - h < 24) W.hit = { age: f - h, p: B(-0.5, 0.95, -2.3) }; } }
  if (S.id === 'street') { const hs = bldHits(S.a).filter((h) => f >= h).sort((x, y) => x - y); if (hs.length && f - hs[hs.length - 1] < 22) W.hit = { age: f - hs[hs.length - 1], p: D(-2.0, 1.2, -0.95) }; }
  if (S.id === 'hotair' || S.id === 'throat') W.arrows = S.id === 'hotair' ? q(E.smooth(ramp(f, S.a + 30, S.a + 70)), 3) : 1;
  if (S.id === 'radiant') W.rays = q(E.smooth(ramp(f, S.a + 20, S.a + 120)), 3);
  if (S.id === 'hotair') { W.rays = 1; W.hot = q(E.smooth(ramp(f, S.a + 10, S.a + 70)), 3); W.smokeUp = W.hot; }
  if (S.id === 'throat') { W.rays = 1; W.hot = 0.5; W.smokeUp = 1; }
  if (S.id === 'bounce') { W.bounce = q(E.smooth(ramp(f, S.a + 10, S.a + (S.b - S.a) * 0.55)), 3); }
  if (S.id === 'street') W.lit = Math.floor(E.smooth(ramp(f, S.a + 30, S.b - 20)) * 7.99);
  return W; };
// ---------------- handwritten labels ----------------
export const annotAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'angles' && f >= S.a + 20) out.push({ type: 'label', text: '135°', at: B(0.42, 0.05, -2.75), dx: -120, dy: -260, age: f - S.a - 20, bend: -0.2 });
  if (S.id === 'radiant' && f >= S.a + 60) out.push({ type: 'label', text: 'radiant heat', at: C(-0.3, 0.55, 0.2), dx: -60, dy: -330, age: f - S.a - 60, bend: 0.2 });
  if (S.id === 'hotair' && f >= S.a + 50) out.push({ type: 'label', text: 'hot air + smoke', at: C(-1.13, 3.2, 0.2), dx: 210, dy: -160, age: f - S.a - 50, bend: -0.2 });
  if (S.id === 'throat' && f >= S.a + 20) out.push({ type: 'label', text: 'narrow throat', at: C(-1.13, 1.95, 0.2), dx: 230, dy: -220, age: f - S.a - 20, bend: -0.2 });
  if (S.id === 'street' && f >= S.a + 40) out.push({ type: 'label', text: '150+ in 2 months', at: D(0.5, 4.8, -1), dx: -230, dy: -260, age: f - S.a - 40, bend: 0.15 });
  return out; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
