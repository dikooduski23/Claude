// Doc Zap — "Captain Cook got his crew eating stinky pickled cabbage... by feeding it to his officers." (HMB Endeavour, 1768-69)
// Voice: Patrick, Eleven v4 (generated with Diyar's ElevenLabs), pauses trimmed -> 37.7 s -> 2262 frames @ 60 fps.
// Look: the modern measured grade (ADR-002) in warm wooden ship interiors with lantern light and deep shadows (the gap our
// measurements found vs. the reference reels). Last shot returns to frame 0 so the video loops.
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, talkAt, q } from './motion.js';
import { LP, tint } from './kit/lights.js';
import { emote } from './kit/emotes.js';
export const FPS = 60, TOTAL = 2262, DECK = 0, LOOK = 'modern';
const SH = [
  ['hook', 0, 299, 'cabin'], ['scurvy', 300, 539, 'low'], ['hold', 540, 821, 'hold'], ['trick', 822, 1048, 'cabin'], ['door', 1049, 1149, 'cabin'],
  ['galley', 1150, 1489, 'galley'], ['scale', 1490, 1599, 'cut'], ['finest', 1600, 1704, 'galley'], ['voyage', 1705, 1959, 'deck'],
  ['punch', 1960, 2109, 'cabin'], ['kids', 2110, 2197, 'kitchen'], ['loop', 2198, 2261, 'cabin']];
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a, b, light }));
export const WHIPS = [300, 540, 822, 1150, 1490, 1600, 1705, 1960, 2110, 2198];   // in-camera whip-pans (no blends)
export const WHIP_FRAMES = WHIPS.map((a) => [a - 14, a + 18]);
export const TRANSITIONS = SH.slice(1).map(([, a]) => ({ at: a, type: 'cut' }));
export const CUTS = [];
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = shot;
// light: warm lantern interiors with real dark corners; a sunlit deck; a cosy modern kitchen
export const LIGHTS = {
  cabin: tint(LP.indoor, { sky: '#ffe2b8', ground: '#3a2418', hemi: 0.75, sun: '#ffd8a8', sunI: 0.75, az: 200, el: 28, fog: '#2a1a12', fogNear: 5, fogFar: 18, gain: '#fff0dc', bloom: 0.9, bthr: 0.8, rimCol: '#ffb870', shadowExt: 6 }),
  low: tint(LP.candle, { hemi: 0.8, sunI: 0.45, fog: '#1a120e', fogNear: 3, fogFar: 13, rimCol: '#ffa860', shadowExt: 5 }),
  hold: tint(LP.candle, { hemi: 0.85, sunI: 0.5, az: 160, el: 70, fog: '#20150e', fogNear: 3.5, fogFar: 15, rimCol: '#ffb060', shadowExt: 6 }),
  galley: tint(LP.candle, { hemi: 0.85, sunI: 0.5, fog: '#2a170c', fogNear: 4, fogFar: 15, gain: '#fff0dc', rimCol: '#ff9a50', shadowExt: 6 }),
  cut: tint(LP.indoor, { sky: '#ffe2b8', hemi: 1.0, sunI: 1.0, az: 30, el: 55, fog: '#2a1810', fogNear: 10, fogFar: 40, skyTop: '#1a0e08', skyHor: '#4a2a18', bloom: 1.0, bthr: 0.8, shadowExt: 6 }),
  deck: tint(LP.day, { sun: '#ffdca0', sunI: 1.35, az: 215, el: 22, sky: '#ffe6c0', skyTop: '#2a6ad6', skyHor: '#ffd8a8', fog: '#f0dcc0', fogNear: 30, fogFar: 260, rim: 0.42, rimCol: '#ffcf88', shadowExt: 14 }),
  kitchen: tint(LP.indoor, { hemi: 0.95, sunI: 1.0, az: 130, el: 40, fog: '#c8a888', fogNear: 6, fogFar: 26, shadowExt: 6 }),
};
// modern measured grade (ADR-002, Nov 26 2026): saturation x0.64, neutral white balance, darker fill, white faces, warm outlines
const MODL = { cabin: { env: 0.8, hemiK: 0.8 }, low: { env: 0.8, hemiK: 1.1 }, hold: { env: 0.9, hemiK: 1.4 }, galley: { env: 0.8, hemiK: 1.05 }, cut: { env: 0.5, hemiK: 0.5 }, deck: { env: 0.7 }, kitchen: { env: 0.55, hemiK: 0.4 } };
for (const k in LIGHTS) { const L = LIGHTS[k]; LIGHTS[k] = { ...L, sunI: L.sunI * 1.45, hemiK: 0.2, expo: 1.45, shadowExt: (L.shadowExt ?? 10) * 2.2, con: 1.0, sat: (L.sat ?? 1.16) * 0.64, gain: '#faf4f6', shCol: '#f5f0ff', hiCol: '#fff5f0', fogNear: L.fogNear * 1.5, fogFar: L.fogFar * 1.7, ao: 0.35, bloom: (L.bloom ?? 0.5) * 0.8, bthr: Math.max((L.bthr ?? 1) * 1.9, 1.55), vig: Math.max(L.vig ?? 0.22, 0.4), inkA: 0.75, ...(MODL[k] || {}) }; }
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- layout ----------------
const XA = 80000, XB = 82000, XC = 84000, XD = 86000, XE = 88000, XF = 90000, XG = 92000;
const A = (x, y, z) => [XA + x, y, z], B = (x, y, z) => [XB + x, y, z], C = (x, y, z) => [XC + x, y, z], D = (x, y, z) => [XD + x, y, z], Ev = (x, y, z) => [XE + x, y, z], F = (x, y, z) => [XF + x, y, z], G = (x, y, z) => [XG + x, y, z];
// cabin: officers stand behind the table (z -1.2); sailors peek in from the doorway on the left (x -2.35)
const OFF = [[-0.75, 0, -1.25], [0.05, 0, -1.35], [0.85, 0, -1.25]], COOKP = [1.55, 0, -0.9], SAIL = [[-2.25, 0, 0.55], [-2.35, 0, 1.05], [-2.15, 0, 1.5]];
let ST = {};
const rnd = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
export const sets = (K) => {
  const { THREE, prop } = K;
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  const wood = (o = {}) => ({ seed: 41, hue: 24, sat: 44, lig: 30, ...o });
  // sauerkraut: a pale gold-green shredded mound (canvas strands) on a white plate / in a barrel
  const krautC = cv(512, 512, (g, W, H) => { g.fillStyle = '#c8c070'; g.fillRect(0, 0, W, H); for (let i = 0; i < 1600; i++) { const x = rnd(i, 1) * W, y = rnd(i, 2) * H, a = rnd(i, 3) * 6.28, l = 14 + rnd(i, 4) * 26;
    g.strokeStyle = ['#e8e09a', '#b8b060', '#f2ecb8', '#a8a050', '#d8d088'][i % 5]; g.lineWidth = 2 + rnd(i, 5) * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l * 0.5, y + Math.sin(a + 1) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } });
  const krautM = K.toon({ map: ctex(krautC, 2, 2), color: '#ffffff' }); krautM.userData = { rough: 0.45, envK: 0.6 };
  const plateM = K.toon({ color: '#f4f0ea' }); plateM.userData = { rough: 0.2, envK: 1.2 };
  const plate = (parent, x, y, z, kraut = true, s = 1) => { const g = K.grp(parent, x, y, z); g.scale.setScalar(s); K.add(new THREE.CylinderGeometry(0.17, 0.12, 0.025, 32), plateM, 0, 0.012, 0, g);
    if (kraut) { const m = K.add(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), krautM, 0, 0.022, 0, g); m.scale.set(1, 0.55, 1); } return g; };
  const sternWin = (parent, x, y, z, w, h) => { const g = K.grp(parent, x, 0, z); const skyC = cv(256, 384, (gg, W, H) => { const gr = gg.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5a8ad8'); gr.addColorStop(0.62, '#ffd8a8'); gr.addColorStop(0.64, '#2a5a8a'); gr.addColorStop(1, '#1a3a5a'); gg.fillStyle = gr; gg.fillRect(0, 0, W, H);
      gg.fillStyle = 'rgba(255,240,200,.9)'; gg.beginPath(); gg.arc(W * 0.7, H * 0.5, 22, 0, 7); gg.fill(); for (let i = 0; i < 30; i++) { gg.fillStyle = 'rgba(255,230,180,.5)'; gg.fillRect(rnd(i, 7) * W, H * 0.66 + rnd(i, 8) * H * 0.3, 10 + rnd(i, 9) * 30, 2); } });
    const m = new THREE.MeshBasicMaterial({ map: ctex(skyC), fog: false }); m.color.setScalar(1.5); K.noInk(K.add(new THREE.PlaneGeometry(w, h), m, 0, y, 0, g, false));
    const fr = K.M.woodD; for (let i = 0; i <= 3; i++) K.add(new THREE.BoxGeometry(0.05, h, 0.06), fr, -w / 2 + i * w / 3, y, 0.03, g); for (let j = 0; j <= 2; j++) K.add(new THREE.BoxGeometry(w, 0.05, 0.06), fr, 0, y - h / 2 + j * h / 2, 0.03, g);
    return g; };

  // ======================= A. THE GREAT CABIN (officers' table) =======================
  const RA = K.room({ x: XA, w: 6.4, d: 5.6, h: 2.7, floor: 'planks', wall: 'planks', wallOpts: wood({ seed: 42, lig: 34 }), floorOpts: wood({ seed: 43, lig: 26 }), ceil: 'beams' });
  sternWin(RA, -1.6, 1.55, -2.79, 1.2, 1.0); sternWin(RA, 0.1, 1.55, -2.79, 1.2, 1.0); sternWin(RA, 1.8, 1.55, -2.79, 1.2, 1.0);
  K.beam(RA, [0.1, 1.9, -2.7], [0.2, 0.0, 0.4], 0.5, 1.3, '#ffd8a0', 0.14); K.beam(RA, [-1.6, 1.9, -2.7], [-1.2, 0.0, 0.2], 0.45, 1.1, '#ffd8a0', 0.1);
  prop.rug(RA, { x: 0.1, z: -0.5, w: 3.6, d: 2.4, pattern: 'persian', cols: ['#7a1a22', '#1f2a4a', '#d8a848', '#f0e2c0'] });
  prop.table(RA, { x: 0.05, z: -0.75, w: 2.5, d: 1.05 });
  const cloth = K.add(new THREE.BoxGeometry(2.56, 0.012, 1.1), K.toon({ color: '#efe6d4' }), 0.05, 0.786, -0.75, RA, false); cloth.receiveShadow = true;
  ST.platesA = [plate(RA, -0.75, 0.79, -0.6), plate(RA, 0.05, 0.79, -0.62), plate(RA, 0.85, 0.79, -0.6)];
  ST.bowlA = plate(RA, 0.05, 0.79, -0.95, true, 1.6);
  for (const [x, z] of [[-0.35, -0.8], [0.45, -0.8]]) prop.candle(RA, { x: 0.05 + x, y: 0.79, z, h: 0.2, light: 0.9, holder: 'brass' });
  K.add(new THREE.CylinderGeometry(0.05, 0.04, 0.16, 16), K.toon({ color: '#5a1a22' }), -1.0, 0.87, -0.95, RA); K.add(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), K.toon({ color: '#2a4a2a' }), 1.05, 0.85, -0.98, RA);
  for (const x of [-0.75, 0.05, 0.85]) prop.chair(RA, { x, z: -1.55, ry: 0 });
  prop.door(RA, { x: -3.17, z: 1.0, ry: Math.PI / 2, w: 0.9, h: 1.95, open: 0.85, arch: false });
  prop.shelf(RA, { x: 3.0, z: -1.6, ry: -Math.PI / 2, w: 1.4, h: 1.6, seed: 9 });
  prop.lantern(RA, { x: -1.2, y: 2.05, z: -0.4, hang: 0.25, light: 1.6, dist: 5, shadow: true }); prop.lantern(RA, { x: 1.3, y: 2.05, z: -0.4, hang: 0.25, light: 1.3, dist: 5 });
  // a chart and a brass globe: Cook's table
  K.add(new THREE.SphereGeometry(0.14, 24, 16), K.toon({ color: '#3a6a8a' }), 2.65, 1.75, -1.6, RA); K.add(new THREE.TorusGeometry(0.16, 0.008, 6, 32), K.toon({ color: '#c89a3a' }), 2.65, 1.75, -1.6, RA);
  K.motes(RA, { n: 40, box: [-2, 0.4, -2.4, 2, 2.3, 1], col: '#ffe8c0', size: 0.01, speed: 0.001 });

  // ======================= B. THE LOWER DECK (hammocks, scurvy) =======================
  const RB = K.room({ x: XB, w: 6, d: 7, h: 2.3, floor: 'planks', wall: 'planks', wallOpts: wood({ seed: 51, lig: 24 }), floorOpts: wood({ seed: 52, lig: 22 }), ceil: 'beams' });
  const hamM = K.toon({ color: '#c8b890', side: THREE.DoubleSide });
  for (let r = 0; r < 4; r++) for (let c = -1; c <= 1; c++) { if (r === 0 && c === 0) continue; const h = K.add(new THREE.CylinderGeometry(0.32, 0.32, 1.7, 16, 1, true, Math.PI * 0.65, Math.PI * 0.7), hamM, c * 1.5, 1.45, -0.6 - r * 1.3, RB);
    h.rotation.set(0, 0, Math.PI / 2); for (const s of [-1, 1]) K.add(new THREE.CylinderGeometry(0.008, 0.008, 0.7, 4), K.M.iron, c * 1.5 + s * 0.95, 1.9, -0.6 - r * 1.3, RB, false); }
  for (let i = 0; i < 5; i++) prop.crate(RB, { x: -2.5 + rnd(i, 3) * 0.3, z: 1.6 - i * 1.3, s: 0.5, ry: rnd(i, 4) });
  prop.lantern(RB, { x: 0.6, y: 1.75, z: 0.9, hang: 0.25, light: 2.4, dist: 5, shadow: true }); prop.lantern(RB, { x: -0.8, y: 1.75, z: -2.2, hang: 0.25, light: 1.6, dist: 5 });
  K.motes(RB, { n: 30, box: [-1.5, 0.4, -2, 1.5, 2, 0.6], col: '#ffd8a0', size: 0.009, speed: 0.0008 });

  // ======================= C. THE HOLD (barrels of sauerkraut) =======================
  const RC = K.room({ x: XC, w: 6.5, d: 9, h: 2.4, floor: 'planks', wall: 'planks', wallOpts: wood({ seed: 61, lig: 26 }), floorOpts: wood({ seed: 62, lig: 22 }), ceil: 'beams' });
  for (let r = 0; r < 6; r++) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) prop.barrel(RC, { x: s * (1.2 + k * 0.72), z: 2.6 - r * 1.25, r: 0.32, h: 0.86, ry: rnd(r, s + k) });
  for (let r = 0; r < 5; r++) for (const s of [-1, 1]) { const b = prop.barrel(RC, { x: s * 1.55, z: 2.0 - r * 1.25, y: 0.86 + 0.02, r: 0.3, h: 0.8, ry: rnd(r, 9 + s) }); }
  const stencil = cv(512, 512, (g, W, H) => { g.fillStyle = '#8a6438'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(40,24,12,.9)'; g.font = '900 92px Georgia, serif'; g.textAlign = 'center'; g.fillText('SOUR', W / 2, 190); g.fillText('KROUT', W / 2, 300); g.font = '900 70px Georgia, serif'; g.fillText('1768', W / 2, 410);
    g.strokeStyle = 'rgba(40,24,12,.6)'; g.lineWidth = 8; g.strokeRect(30, 30, W - 60, H - 60); });
  const stM = K.toon({ map: ctex(stencil) });
  { const c = prop.crate(RC, { x: 0.55, z: 2.15, s: 0.62, ry: -0.25 }); const f = K.add(new THREE.PlaneGeometry(0.5, 0.5), stM, 0, 0.31, 0.317, c, false); }
  ST.openBarrel = prop.barrel(RC, { x: -0.25, z: 1.9, r: 0.33, h: 0.86, hollow: true });
  { const m = K.add(new THREE.CylinderGeometry(0.29, 0.29, 0.06, 24), krautM, -0.25, 0.8, 1.9, RC, false); const top = K.add(new THREE.SphereGeometry(0.27, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), krautM, -0.25, 0.82, 1.9, RC, false); top.scale.set(1, 0.3, 1); }
  prop.lantern(RC, { x: 0.1, y: 1.85, z: 1.3, hang: 0.25, light: 2.6, dist: 6, shadow: true }); prop.lantern(RC, { x: 0, y: 1.85, z: -1.0, hang: 0.25, light: 2.0, dist: 6 }); prop.lantern(RC, { x: 0, y: 1.85, z: -3.2, hang: 0.25, light: 1.6, dist: 5 }); K.warmLight(RC, 0, 1.6, 3.4, { col: '#ffb870', i: 1.8, dist: 6, flicker: 0.08 }); K.beam(RC, [0.6, 2.4, 0.4], [0.2, 0, 1.2], 0.15, 0.6, '#ffd8a0', 0.12);
  K.motes(RC, { n: 25, box: [-1.5, 0.4, -3, 1.5, 2.1, 0.4], col: '#ffd8a0', size: 0.009, speed: 0.0008 });

  // ======================= D. THE GALLEY (queue, ration, grumbling) =======================
  const RD = K.room({ x: XD, w: 6.4, d: 6, h: 2.5, floor: 'planks', wall: 'planks', wallOpts: wood({ seed: 71, lig: 30 }), floorOpts: wood({ seed: 72, lig: 24 }), ceil: 'beams' });
  { const st = K.add(K.tbox(1.6, 1.0, 0.8, 0.8), K.mat('brick', { seed: 73, lig: 38 }), -1.6, 0.5, -2.55, RD); K.flame(RD, -1.6, 1.02, -2.45, 0.16); K.warmLight(RD, -1.6, 1.3, -2.1, { col: '#ff9040', i: 2.6, dist: 6, flicker: 0.18, shadow: true });
    const pot = K.add(new THREE.SphereGeometry(0.34, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), K.M.iron, -1.6, 1.42, -2.5, RD); pot.rotation.x = Math.PI;
    K.add(new THREE.TorusGeometry(0.34, 0.025, 8, 32), K.M.iron, -1.6, 1.42, -2.5, RD).rotation.x = Math.PI / 2; }
  prop.table(RD, { x: 0.4, z: -1.4, w: 2.2, d: 0.8 });
  ST.galleyBarrel = prop.barrel(RD, { x: 0.4, z: -1.75, y: 0.78, r: 0.26, h: 0.5, hollow: true }); K.add(new THREE.CylinderGeometry(0.23, 0.23, 0.05, 20), krautM, 0.4, 1.22, -1.75, RD, false);
  for (let i = 0; i < 4; i++) plate(RD, -0.4 + i * 0.5, 0.79, -1.15);
  prop.table(RD, { x: 1.7, z: 1.2, w: 1.8, d: 0.8 }); prop.bench(RD, { x: 1.7, z: 1.85 }); for (let i = 0; i < 3; i++) plate(RD, 1.1 + i * 0.55, 0.79, 1.25);
  for (let i = 0; i < 6; i++) prop.barrel(RD, { x: 2.7, z: -2.4 + i * 0.7, r: 0.28, h: 0.75 });
  prop.lantern(RD, { x: 0.4, y: 1.95, z: -0.6, hang: 0.25, light: 1.4, dist: 5 }); prop.lantern(RD, { x: 1.7, y: 1.95, z: 1.0, hang: 0.25, light: 1.2, dist: 4.5 });
  ST.glowG = K.bulb(RD, 0.4, 1.35, 0.9, { size: 0.03, i: 0.0, light: false, haloK: 0.9, col: '#ffd890' });
  K.motes(RD, { n: 50, box: [-2, 0.4, -2.5, 2, 2.2, 0.8], col: '#ffc890', size: 0.01, speed: 0.0012 });

  // ======================= E. THE DECK AT SEA (HMS Resolution, the next voyage) =======================
  const EG = K.grp(K.scene, XE, 0, 0);
  const seaC = cv(512, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1e5a8a'); gr.addColorStop(1, '#2a7aa8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 700; i++) { g.strokeStyle = rnd(i, 3) < 0.6 ? `rgba(255,236,200,${0.15 + rnd(i, 4) * 0.25})` : 'rgba(10,40,70,.3)'; g.lineWidth = 2; const x = rnd(i, 1) * W, y = rnd(i, 2) * H, l = 10 + rnd(i, 5) * 22; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3, x + l, y); g.stroke(); } });
  const seaM = K.toon({ map: ctex(seaC, 40, 40) }); seaM.userData = { rough: 0.1, metal: 0.2, envK: 1.4 }; { const s = K.add(new THREE.PlaneGeometry(600, 600), seaM, 0, -1.2, 0, EG, false); s.rotation.x = -Math.PI / 2; }
  ST.ship = K.grp(EG, 0, 0, 0);
  { const S = ST.ship; const deck = K.add(K.tbox(4.4, 0.25, 14, 1.2), K.mat('planks', wood({ seed: 81, lig: 42 })), 0, -0.125, 0, S);
    const hullM = K.toon({ color: '#3a2618' }); K.add(new THREE.BoxGeometry(4.6, 1.4, 14.2), hullM, 0, -0.85, 0, S);
    for (const s of [-1, 1]) { K.add(new THREE.BoxGeometry(0.12, 0.9, 14), K.M.woodD, s * 2.2, 0.45, 0, S); for (let i = 0; i < 14; i++) K.add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), K.M.woodD, s * 2.2, 0.45, -6.5 + i, S); K.add(new THREE.BoxGeometry(0.16, 0.06, 14.1), K.toon({ color: '#c8a050' }), s * 2.2, 0.92, 0, S); }
    const mastM = K.toon({ color: '#7a5434' }); K.add(new THREE.CylinderGeometry(0.16, 0.22, 11, 20), mastM, 0, 5.5, -1.5, S); K.add(new THREE.CylinderGeometry(0.12, 0.16, 8, 16), mastM, 0, 4.0, -6.5, S);
    const sailM = K.toon({ color: '#f2e8d2', side: THREE.DoubleSide }); sailM.userData = { rough: 0.8 };
    for (const [y, w, h, z] of [[3.4, 4.6, 2.4, -1.4], [6.2, 3.8, 2.2, -1.4], [8.6, 3.0, 1.8, -1.4], [3.2, 3.6, 2.0, -6.4], [5.6, 3.0, 1.8, -6.4]]) { const g = new THREE.PlaneGeometry(w, h, 8, 4); const P_ = g.attributes.position; for (let i = 0; i < P_.count; i++) { const x = P_.getX(i) / w, yy = P_.getY(i) / h; P_.setZ(i, 0.45 * (1 - 4 * x * x) * (0.6 + 0.4 * (0.5 - yy))); } g.computeVertexNormals(); K.add(g, sailM, 0, y, z + 0.25, S);
      K.add(new THREE.CylinderGeometry(0.05, 0.05, w + 0.4, 8), mastM, 0, y + h / 2, z + 0.2, S).rotation.z = Math.PI / 2; }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const ln = K.add(new THREE.CylinderGeometry(0.008, 0.008, 9, 4), K.toon({ color: '#3a2a1a' }), s * 1.1, 4.8, -0.5 + i * 0.4, S, false); ln.rotation.z = s * 0.24; }
    const flagC = cv(256, 128, (g, W, H) => { g.fillStyle = '#c8202a'; g.fillRect(0, 0, W, H); g.fillStyle = '#1e2a6a'; g.fillRect(0, 0, W * 0.45, H * 0.5); });
    K.add(new THREE.PlaneGeometry(1.0, 0.5), K.toon({ map: ctex(flagC), side: THREE.DoubleSide }), 0.55, 11.1, -1.5, S, false);
    prop.barrel(S, { x: 1.5, z: 2.5, r: 0.3, h: 0.8 }); prop.barrel(S, { x: 1.5, z: 3.2, r: 0.3, h: 0.8 }); prop.crate(S, { x: -1.5, z: 3.0, s: 0.55 });
    const wheel = K.grp(S, 0, 1.15, 5.6); for (let i = 0; i < 8; i++) { const sp = K.add(new THREE.BoxGeometry(0.04, 0.95, 0.04), K.M.woodD, 0, 0, 0, wheel); sp.rotation.z = i * Math.PI / 8; } K.add(new THREE.TorusGeometry(0.36, 0.03, 8, 32), K.M.woodD, 0, 0, 0, wheel); K.add(new THREE.BoxGeometry(0.1, 1.15, 0.1), K.M.woodD, 0, -0.58, 0.05, S === wheel ? S : wheel); }
  // the sky dome with a low gold sun and a few clouds
  const skyC = cv(512, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a62c8'); gr.addColorStop(0.55, '#8ab0e0'); gr.addColorStop(0.82, '#ffd8a8'); gr.addColorStop(1, '#ffc890'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) { const x = rnd(i, 1) * W, y = H * (0.3 + rnd(i, 2) * 0.4); g.fillStyle = 'rgba(255,246,236,.75)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + k * 16, y - Math.sin(k) * 8, 14 + rnd(i, k + 3) * 10, 0, 7); g.fill(); } } });
  K.noInk(K.add(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: ctex(skyC), side: THREE.BackSide, fog: false }), 0, -20, 0, EG, false));
  K.bulb(EG, 90, 30, -200, { size: 6, i: 0, light: false, haloK: 0.7, col: '#ffe0a8' });

  // ======================= F. A MODERN KITCHEN (it still works on kids) =======================
  const RF = K.room({ x: XF, w: 5.6, d: 5, h: 2.7, floor: 'planks', wall: 'plaster', wallOpts: { seed: 91, col: [28, 40, 70], bricks: 0, stains: 0.1 }, floorOpts: wood({ seed: 92, lig: 52, hue: 30 }), ceil: 'flat' });
  prop.window(RF, { x: 1.4, y: 1.6, z: -2.49, w: 1.1, h: 1.1, kind: 'sun', depth: 0.12, beamTo: [0.6, 0, 0.3], i: 4 });
  prop.table(RF, { x: 0, z: -0.6, w: 1.6, d: 0.9 }); K.add(new THREE.BoxGeometry(1.64, 0.01, 0.94), K.toon({ color: '#e8f0f4' }), 0, 0.786, -0.6, RF, false);
  { const g = K.grp(RF, -0.35, 0.79, -0.45); K.add(new THREE.CylinderGeometry(0.17, 0.12, 0.025, 32), plateM, 0, 0.012, 0, g); const brM = K.toon({ color: '#3a8a3a' });
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const b = K.add(new THREE.IcosahedronGeometry(0.05, 2), brM, Math.cos(a) * 0.06, 0.07, Math.sin(a) * 0.06, g); K.add(new THREE.CylinderGeometry(0.012, 0.016, 0.06, 8), K.toon({ color: '#8ac06a' }), Math.cos(a) * 0.06, 0.035, Math.sin(a) * 0.06, g); } }
  { const g = K.grp(RF, 0.4, 0.79, -0.45); K.add(new THREE.CylinderGeometry(0.17, 0.12, 0.025, 32), plateM, 0, 0.012, 0, g); }
  K.add(new THREE.BoxGeometry(0.75, 1.9, 0.7), K.toon({ color: '#f2f2f0' }), -2.3, 0.95, -2.0, RF); prop.shelf(RF, { x: 2.5, z: -1.2, ry: -Math.PI / 2, w: 1.2, h: 1.4, seed: 4 });
  K.add(new THREE.BoxGeometry(2.2, 0.9, 0.6), K.toon({ color: '#d86a4a' }), -0.6, 0.45, -2.15, RF);
  K.bulb(RF, 0, 2.45, -0.4, { size: 0.06, i: 1.2, dist: 5 });

  // ======================= G. CUTAWAY: the balance of a sailor's mind =======================
  const GG = K.grp(K.scene, XG, 0, 0);
  const bgC = cv(512, 1024, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H * 0.45, 30, W / 2, H * 0.45, H * 0.6); gr.addColorStop(0, '#6a3a1e'); gr.addColorStop(1, '#140a06'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
  K.noInk(K.add(new THREE.PlaneGeometry(14, 24), new THREE.MeshBasicMaterial({ map: ctex(bgC), fog: false }), 0, 1.5, -3, GG, false));
  const brass = K.toon({ color: '#d8a83a' }); brass.userData = { rough: 0.3, metal: 0.8, envK: 1.6 };
  K.add(new THREE.CylinderGeometry(0.06, 0.08, 2.0, 20), brass, 0, 1.0, 0, GG); K.add(new THREE.CylinderGeometry(0.45, 0.55, 0.12, 32), brass, 0, 0.06, 0, GG); K.add(new THREE.SphereGeometry(0.1, 16, 12), brass, 0, 2.05, 0, GG);
  ST.beam = K.grp(GG, 0, 2.0, 0); K.add(new THREE.BoxGeometry(1.7, 0.07, 0.07), brass, 0, 0, 0, ST.beam);
  ST.pans = [-1, 1].map((s) => { const p = K.grp(GG, s * 0.8, 1.4, 0); for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28; const ch = K.add(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 4), K.M.iron, Math.cos(a) * 0.17, 0.3, Math.sin(a) * 0.17, p, false); ch.rotation.set(Math.sin(a) * 0.28, 0, -Math.cos(a) * 0.28); }
    K.add(new THREE.CylinderGeometry(0.34, 0.24, 0.06, 28), brass, 0, 0, 0, p); return p; });
  plate(ST.pans[0], 0, 0.03, 0, true, 1.4);
  { const hat = K.grp(ST.pans[1], 0, 0.05, 0); ST.hat = hat; const hm = K.toon({ color: '#1e1e26' }); const c = K.add(new THREE.SphereGeometry(0.14, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), hm, 0, 0.02, 0, hat); c.scale.set(1, 0.9, 1);
    for (let k = 0; k < 3; k++) { const s = K.add(new THREE.BoxGeometry(0.34, 0.1, 0.03), hm, 0, 0.05, 0, hat); s.rotation.y = k * Math.PI / 3 * 2; s.translateZ(0.12); s.rotation.x = -0.6; } K.add(new THREE.TorusGeometry(0.17, 0.012, 6, 24), K.toon({ color: '#d8b040' }), 0, 0.02, 0, hat).rotation.x = Math.PI / 2; }
  K.bulb(GG, -2.2, 3.2, 0.5, { size: 0.05, i: 1.6, dist: 6, col: '#ffd8a0' });
  const SETG = { cabin: RA, low: RB, hold: RC, galley: RD, deck: EG, kitchen: RF, cut: GG };
  return { update: (W, f) => {
    for (const k in SETG) SETG[k].visible = k === W.set;      // only the set in shot exists: its lanterns and shadow maps are the only ones computed
    const t = W.tip ?? 0, a = lerp(0.18, -0.24, t); ST.beam.rotation.z = a;
    ST.pans.forEach((p, i) => { const sg = i ? 1 : -1; p.position.set(sg * 0.8 * Math.cos(a), 2.0 + sg * 0.8 * Math.sin(a) - 0.6, 0); });
    ST.ship.rotation.z = W.roll ?? 0;
  } };
};
// ---------------- cast ----------------
const SK = '#f7f4ee';
const COOK = { tunic: '#1f2c58', stick: true, skin: SK, hair: '#e2ddd2', hat: 'tricorn', hatCol: '#1a1a22', hatBand: '#d8b040', collar: '#ffffff', pattern: { type: 'vstripes', col: 'rgba(216,176,64,.35)', scale: 0.6 } };
const OFFI = [
  { tunic: '#25336a', stick: true, skin: SK, hair: '#6a4228', hat: 'tricorn', hatCol: '#1a1a22', hatBand: '#d8b040', collar: '#ffffff' },
  { tunic: '#25336a', stick: true, skin: SK, hair: '#e8b860', hat: 'tricorn', hatCol: '#22222a', hatBand: '#d8b040', collar: '#ffffff', glasses: true },
  { tunic: '#25336a', stick: true, skin: SK, hair: '#3a2a1c', hat: 'tricorn', hatCol: '#1a1a22', hatBand: '#d8b040', collar: '#ffffff', moustache: '#3a2a1c', stache: 'chevron' }];
const SAILORS = [
  { tunic: '#e8e2d6', stick: true, skin: SK, hair: '#3a2a1c', tie: '#c8202a', pattern: { type: 'stripes', col: '#2a4a8a', scale: 1.2 }, beard: '#3a2a1c', beardStyle: 'short' },
  { tunic: '#b8402a', stick: true, skin: SK, hair: '#c86a2a', hat: 'brim17', hatCol: '#2a2420', hatBand: '#3a2418' },
  { tunic: '#3a5a7a', stick: true, skin: SK, hair: '#e8c870', tie: '#f2c230' },
  { tunic: '#e8e2d6', stick: true, skin: SK, hair: '#6a4228', pattern: { type: 'stripes', col: '#b8202a', scale: 1.2 }, moustache: '#6a4228', stache: 'walrus' },
  { tunic: '#5a4a3a', stick: true, skin: SK, hair: '#2a1e18', hat: 'brim17', hatCol: '#3a3028', hatBand: '#1e1812', beard: '#2a1e18', beardStyle: 'full' },
  { tunic: '#2a6a5a', stick: true, skin: SK, hair: '#a8a8a8', tie: '#ffffff' }];
const STEWARD = { tunic: '#7a5a3a', stick: true, skin: SK, hair: '#8a5a2a', apron: '#efe6d4', moustache: '#8a5a2a', stache: 'handlebar' };
const MOM = { tunic: '#2a8a8a', dress: '#2a8a8a', stick: true, skin: SK, hair: '#6a4228' }, KID = { tunic: '#f2c230', stick: true, skin: SK, hair: '#e8b860', pattern: { type: 'stripes', col: '#e8602a', scale: 1.4 } };
export const actorsAt = (f, T) => {
  const S = shot(f), out = [], u = Math.floor(f / 2);
  const I = (seed) => { const i = idle(u, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const tintL = { cabin: '#fff1e6', low: '#ffeee0', hold: '#ffeee0', galley: '#ffeee0', cut: '#fff1e6', deck: '#fff4ea', kitchen: '#fffaf4' }[S.light] || '#ffffff';
  const card = (id, O, o, w, seed, extra = {}) => out.push({ key: id + JSON.stringify(o) + JSON.stringify(extra.y || 0), draw: (p) => T.romanFront(p, O, { seed, blink: blinkAt(u, seed), ...I(seed), L: 'hang', R: 'hang', look: 0, ...o }), x: w[0], y: w[1] + (extra.y || 0), z: w[2], s: extra.s ?? 0.9, ground: w[1], tint: tintL, roll: extra.roll });
  const cabinCast = (ff, mode) => {   // mode: 'hook' | 'table' | 'door' | 'punch'
    const eat = mode === 'hook' || mode === 'table';
    OFF.forEach((p, i) => card('o' + i, OFFI[i], { expr: eat ? ['lick', 'laugh', 'grin'][i] : 'smug', look: q([0.3, 0, -0.3][i], 1), L: 'hang', R: i === 0 && eat ? 'up' : 'hang', talk: eat && i === 1 ? talkAt(ff, 21, 1.1) : -1 }, A(...p), 11 + i));
    if (mode !== 'hook') card('cook', COOK, { expr: mode === 'punch' ? (ff >= 2050 ? 'wink' : 'sly') : (ff >= 868 && ff < 930 ? 'wink' : 'smug'), L: 'hip', R: mode === 'punch' ? 'up' : 'point', look: -0.5 }, A(...COOKP), 9, { s: 0.95 });
    const peek = mode === 'hook' ? ff >= 200 : true;
    if (peek) SAIL.forEach((p, i) => card('s' + i, SAILORS[i], { expr: mode === 'door' ? ['stubborn', 'sideeye', 'unimpressed'][i] : mode === 'punch' ? 'gulp' : ['gulp', 'shock', 'lick'][i], look: 0.8, L: mode === 'door' ? 'cross' : 'hang', R: mode === 'door' ? 'cross' : (i === 1 ? 'cheek' : 'hang') }, A(...p), 21 + i));
  };
  switch (S.id) {
    case 'hook': cabinCast(f, 'hook'); break;
    case 'loop': cabinCast(0, 'hook'); break;
    case 'trick': cabinCast(f, 'table'); if (f >= 930) card('stew', STEWARD, { expr: 'smile', L: 'hang', R: 'up', look: 0.4 }, A(-1.55, 0, -0.6), 31); break;
    case 'door': cabinCast(f, 'door'); break;
    case 'punch': cabinCast(f, 'punch'); break;
    case 'scurvy': { card('sick', SAILORS[3], { expr: f < 460 ? 'sick' : 'pained', L: 'belly', R: 'cheek', look: 0.2 }, B(0, 0, 0.2), 41, { s: 0.92 });
      [[-1.4, -1.6], [1.3, -2.1], [-0.4, -3.4]].forEach(([x, z], i) => card('sk' + i, SAILORS[(i + 4) % 6], { expr: ['sick', 'pained', 'dazed'][i], L: 'belly', R: 'hang', look: q(-0.3 + i * 0.3, 1) }, B(x, 0, z), 43 + i)); break; }
    case 'hold': card('sniff', SAILORS[1], { expr: f < 765 ? 'neutral' : 'disgust', L: 'hang', R: f < 765 ? 'cheek' : 'hang', look: 0.6 }, C(0.3, 0, 2.3), 51, { s: 0.92 }); break;
    case 'galley': case 'finest': { const ration = f >= 1285, grum = f >= 1335 && S.id === 'galley';
      card('stew', STEWARD, { expr: ration ? 'stern' : 'grin', L: 'hang', R: ration ? 'up' : 'grab', gx: 0.2, gy: 0.3, look: 0.5 }, D(0.4, 0, -2.15), 31);
      if (S.id === 'galley') for (let i = 0; i < 6; i++) card('q' + i, SAILORS[i], { expr: grum ? ['stubborn', 'angry', 'unimpressed', 'sideeye', 'angry', 'stubborn'][i] : (ration ? ['shock', 'cry', 'gulp', 'shock', 'gulp', 'pained'][i] : ['lick', 'grin', 'gulp', 'smile', 'lick', 'grin'][i]), L: grum ? 'cross' : 'hang', R: grum ? 'cross' : (i % 2 ? 'reach' : 'hang'), look: q(-0.6 + (i % 3) * 0.2, 1) }, D(0.25 + (i % 2) * 0.35, 0, -0.55 + i * 0.6), 61 + i);
      if (S.id === 'finest') card('taste', SAILORS[2], { expr: f >= 1600 && f < 1630 ? 'gulp' : 'eureka', L: 'hang', R: 'cheek', look: 0.3 }, D(0.4, 0, 0.35), 63, { s: 0.92 });
      break; }
    case 'voyage': { const cheer = f >= 1915; for (let i = 0; i < 6; i++) card('c' + i, SAILORS[i], { expr: cheer ? ['laugh', 'grin', 'laugh', 'eureka', 'laugh', 'grin'][i] : 'smile', L: cheer ? 'up' : 'hang', R: cheer ? 'up' : (i % 2 ? 'wave' : 'hang'), look: q(-0.5 + i * 0.2, 1) }, Ev(-1.4 + (i % 3) * 1.4, 0, 1.4 + Math.floor(i / 3) * 1.1), 71 + i, { y: cheer ? Math.abs(Math.sin((f + i * 9) * 0.22)) * 0.06 : 0 });
      card('cook', COOK, { expr: 'smug', L: 'hip', R: 'hang', look: -0.3 }, Ev(0, 0, 4.9), 9, { s: 0.95 }); break; }
    case 'kids': { const want = f >= 2160; card('mom', MOM, { expr: 'lick', L: 'hang', R: 'up', look: 0.4 }, F(-0.25, 0, -1.25), 81);
      card('kid', KID, { expr: want ? 'gulp' : 'sideeye', L: 'hang', R: want ? 'reach' : 'cross', look: -0.6 }, F(0.22, 0, 0.1), 83, { s: 0.62 }); break; }
    case 'scale': break;
  }
  return out;
};
// ---------------- fx ----------------
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'hook' && f >= 228) out.push(emote('!', f - 228, A(SAIL[0][0] + 0.2, 1.75, SAIL[0][2]), { s: 0.2 }));
  if (S.id === 'trick' && f >= 875) out.push(emote('bulb', f - 875, A(COOKP[0], 1.95, COOKP[2]), { s: 0.24 }));
  if (S.id === 'door' && f >= 1058) out.push(emote('?', f - 1058, A(SAIL[1][0] + 0.15, 1.78, SAIL[1][2]), { s: 0.22 }));
  if (S.id === 'galley' && f >= 1291 && f < 1335) out.push(emote('!?', f - 1291, D(0.6, 1.75, 0.1), { s: 0.22 }));
  if (S.id === 'galley' && f >= 1380) out.push(emote('vein', f - 1380, D(0.6, 1.7, 0.65), { s: 0.2 }));
  if (S.id === 'finest' && f >= 1620) out.push(emote('heart', f - 1620, D(0.55, 1.75, 0.4), { s: 0.22 }));
  if (S.id === 'kids' && f >= 2160) out.push(emote('!', f - 2160, F(0.3, 1.2, 0.15), { s: 0.18 }));
  return out; };
// ---------------- camera ----------------
const yawLook = (pos, look, deg) => { const a = deg * Math.PI / 180, dx = look[0] - pos[0], dz = look[2] - pos[2]; return [pos[0] + dx * Math.cos(a) - dz * Math.sin(a), look[1], pos[2] + dx * Math.sin(a) + dz * Math.cos(a)]; };
const HOOK0 = { pos: A(-0.35, 1.38, 0.75), look: A(-0.72, 1.2, -1.25), fov: 42 };
const camRaw = (f) => { const S = shot(f), v = (f - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v);
  switch (S.id) {
    // push in on the officer savouring it, then a pull-back + pan that reveals the sailors in the doorway on "officers"
    case 'hook': { const k = E.smooth(ramp(f, 0, 190)), k2 = E.smooth(ramp(f, 200, 285)); return { pos: lerp3(lerp3(HOOK0.pos, A(-0.55, 1.32, 0.25), k), A(0.35, 1.4, 0.55), k2), look: lerp3(lerp3(HOOK0.look, A(-0.74, 1.18, -1.25), k), A(-2.25, 1.2, 1.0), k2), fov: lerp(42, 48, k2) }; }
    case 'loop': { const k = E.smooth(ramp(f, 2198, 2261)); return { pos: lerp3(A(0.2, 1.5, 1.4), HOOK0.pos, k), look: lerp3(A(-0.3, 1.15, -1.2), HOOK0.look, k), fov: 42 }; }
    case 'scurvy': { const k = E.smooth(ramp(f, 300, 440)), k2 = E.smooth(ramp(f, 445, 539)); return { pos: lerp3(lerp3(B(0.4, 1.45, 2.4), B(0.2, 1.4, 1.75), k), B(0.6, 1.7, 3.0), k2), look: lerp3(B(0, 1.3, 0.2), B(0, 1.05, -1.6), k2), fov: lerp(42, 52, k2) }; }
    case 'hold': { const k = E.smooth(ramp(f, 540, 735)), k2 = E.smooth(ramp(f, 740, 800)); return { pos: lerp3(lerp3(C(0, 1.25, -3.4), C(0.05, 1.3, 3.9), k), C(0.8, 1.55, 4.4), k2), look: lerp3(lerp3(C(0, 0.85, 0.5), C(-0.1, 0.9, 1.8), k), C(0.1, 1.28, 2.1), k2), fov: lerp(52, 46, k2) }; }
    // Cook's close-up and wink, then the camera travels down to the officers' table as the steward serves
    case 'trick': { const k = E.smooth(ramp(f, 822, 915)), k2 = E.smooth(ramp(f, 915, 1000)); return { pos: lerp3(lerp3(A(0.85, 1.6, 0.95), A(1.05, 1.6, 0.45), k), A(0.05, 1.75, 1.55), k2), look: lerp3(A(1.55, 1.5, -0.9), A(0.05, 1.15, -0.95), k2), fov: lerp(42, 48, k2) }; }
    case 'door': return { pos: lerp3(A(-0.2, 1.4, 1.3), A(-0.5, 1.4, 1.05), sv), look: A(-2.25, 1.2, 1.0), fov: 46 };
    case 'galley': { const k = E.smooth(ramp(f, 1150, 1300)), k2 = E.smooth(ramp(f, 1320, 1420)); return { pos: lerp3(lerp3(D(1.6, 1.4, 3.2), D(1.4, 1.35, 1.9), k), D(-0.5, 1.4, 2.6), k2), look: lerp3(lerp3(D(0.3, 1.0, -1.0), D(0.4, 1.1, -1.6), k), D(0.5, 1.05, 0.6), k2), fov: 46 }; }
    case 'scale': { const k = E.smooth(v); return { pos: lerp3(G(0.3, 1.75, 5.0), G(0.1, 1.65, 4.3), k), look: G(0, 1.45, 0), fov: 46 }; }
    case 'finest': { const k = E.smooth(ramp(f, 1600, 1680)); return { pos: lerp3(D(0.9, 1.55, 2.6), D(0.6, 1.5, 1.85), k), look: lerp3(D(0.4, 1.25, 0.3), D(0.4, 1.38, 0.35), k), fov: lerp(46, 40, k) }; }
    // the next voyage: crane up from the crew to the full sails in gold light, then back down as they cheer
    case 'voyage': { const k = E.smooth(ramp(f, 1705, 1860)), k2 = E.smooth(ramp(f, 1870, 1950)); return { pos: lerp3(lerp3(Ev(2.6, 1.4, 6.8), Ev(3.4, 3.2, 8.2), k), Ev(1.2, 1.5, 5.6), k2), look: lerp3(lerp3(Ev(0, 1.2, 1.4), Ev(0, 5.0, -1.4), k), Ev(0, 1.2, 1.6), k2), fov: lerp(48, 54, k) }; }
    case 'punch': return { pos: lerp3(A(0.55, 1.55, 1.4), A(0.95, 1.6, 0.7), sv), look: lerp3(A(1.1, 1.3, -0.9), A(1.5, 1.5, -0.9), sv), fov: lerp(46, 40, sv) };
    case 'kids': return { pos: lerp3(F(0.05, 1.3, 1.9), F(0.15, 1.2, 1.3), sv), look: F(0.0, 1.0, -1.15), fov: 46 };
  } };
const cam = (f) => { const S = shot(f), c = camRaw(f);
  const wi = WHIPS.indexOf(S.b + 1), wo = WHIPS.indexOf(S.a);
  if (wi >= 0 && f > S.b - 14) c.look = yawLook(c.pos, c.look, (wi % 2 ? -55 : 55) * E.easeIn(ramp(f, S.b - 14, S.b + 1)));
  if (wo >= 0 && f < S.a + 18) c.look = yawLook(c.pos, c.look, -(wo % 2 ? -55 : 55) * (1 - E.easeOut(ramp(f, S.a, S.a + 18))));
  c.shadowAt = c.look; return c; };
export const camAt = cam;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shot(f), C0 = cam(f), at = (p, k) => ({ focus: dist(C0.pos, p), cinf: k * 0.85 });
  switch (S.id) {
    case 'hook': return at(f < 200 ? A(-0.74, 1.0, -1.25) : A(-2.2, 1.1, 0.9), f < 200 ? 12 : 8);
    case 'loop': return at(A(-0.74, 1.0, -1.25), 12);
    case 'scurvy': return at(f < 445 ? B(0, 1.2, 0.2) : B(0, 1.1, -1.0), f < 445 ? 12 : 6);
    case 'hold': return at(f < 740 ? C(0, 0.8, 1.0) : C(0.3, 1.2, 2.3), f < 740 ? 5 : 11);
    case 'trick': return at(f < 915 ? A(...COOKP) : A(0.05, 1.0, -1.0), 10);
    case 'door': return at(A(-2.25, 1.2, 1.0), 9);
    case 'galley': return at(f < 1320 ? D(0.4, 1.1, -1.4) : D(0.5, 1.1, 0.6), 8);
    case 'scale': return at(G(0, 1.6, 0), 5);
    case 'finest': return at(D(0.4, 1.3, 0.35), 12);
    case 'voyage': return at(f < 1870 ? Ev(0, 3, 0) : Ev(0, 1.2, 1.8), 4);
    case 'punch': return at(A(...COOKP), 10);
    case 'kids': return at(F(0.1, 0.9, -1.1), 9);
  }
  return { focus: 5, cinf: 0 }; };
export const worldAt = (f) => { const S = shot(f), W = { set: S.light };
  if (S.id === 'scale') W.tip = q(E.easeOut(ramp(f, 1514, 1560)), 3);
  if (S.id === 'voyage') W.roll = q(0.02 * Math.sin(f * 0.035), 4);
  if (S.id === 'finest') W.glow = q(E.smooth(ramp(f, 1600, 1640)), 3);
  return W; };
// ---------------- handwritten labels ----------------
export const annotAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'scurvy' && f >= 344 && f < 445) out.push({ type: 'label', text: 'scurvy', at: B(0.02, 1.33, 0.25), dx: 200, dy: 240, age: f - 344, bend: -0.2 });
  if (S.id === 'scale') { if (f >= 1496) out.push({ type: 'label', text: 'something new', at: G(-0.8, 1.5, 0), dx: 160, dy: -360, age: f - 1496, bend: 0.2 });
    if (f >= 1520) out.push({ type: 'label', text: 'the boss likes it', at: G(0.8, 1.3, 0), dx: -230, dy: 150, age: f - 1520, bend: -0.25 }); }
  return out; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
