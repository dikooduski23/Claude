// Doc Zap — "They saved the Leaning Tower by digging under it" (Pisa, 1990–2001). World kit + remocn transitions.
// Voice: Patrick, Eleven v4 (generated via API). 36.62 s = 2197 frames @ 60 fps. Plates render with HARD CUTS; Remotion adds
// remocn transitions from TRANSITIONS. Acts (design.md): danger = overcast, idea = dusk work-lights, mechanism = dark cutaway,
// payoff = golden hour. One accent: safety orange #ff6a1e on what the narration names. The tower always leans screen-right (+x).
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, talkAt, q } from './motion.js';
import { LP, tint } from './kit/lights.js';
import { emote } from './kit/emotes.js';
export const FPS = 60, TOTAL = 2197, DECK = 0, LOOK = 'mini';
const SH = [
  ['hook', 0, 215, 'sunny'], ['closed', 216, 470, 'sunny'], ['lead', 471, 690, 'sunny'], ['freeze', 691, 875, 'sunny'],
  ['burland', 876, 1040, 'dusk'], ['dig', 1041, 1210, 'dusk'], ['insane', 1211, 1290, 'dusk'],
  ['cutaway', 1291, 1729, 'cut'], ['tipback', 1730, 2010, 'golden'], ['loop', 2011, 2196, 'golden']];
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a, b, light }));
export const TRANSITIONS = [{ at: 216, type: 'whip', dir: 'left' }, { at: 471, type: 'whip', dir: 'right' }, { at: 691, type: 'zoom' },
  { at: 876, type: 'whip', dir: 'left' }, { at: 1041, type: 'cut' }, { at: 1211, type: 'whip', dir: 'right' }, { at: 1291, type: 'focus', len: 24 },
  { at: 1730, type: 'cut' }, { at: 2011, type: 'whip', dir: 'left' }];
export const WHIPS = [], WHIP_FRAMES = [], CUTS = [];
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = shot;
export const LIGHTS = {   // rich, saturated, glowing in every act (Diyar, Nov 25 2026: "where are the rich colours, the blooms, the glows")
  sunny: tint(LP.day, { az: 130, el: 40, sun: '#fff1d8', sunI: 1.45, hemi: 1.2, sky: '#dff0ff', skyTop: '#1764d8', skyHor: '#9fd8ff', fog: '#b8e0ff', fogNear: 30, fogFar: 220, sat: 1.3, con: 1.06, gain: '#fffaf2', bloom: 0.85, bthr: 0.84, rim: 0.45, rimCol: '#fff0c8', sunDisc: '#fff6d8', sunSize: 0.022, shadowExt: 14 }),
  dusk: tint(LP.sunset, { az: 250, el: 4, sun: '#ff8a5a', sunI: 0.95, hemi: 0.95, sky: '#ff9a7a', skyTop: '#2a1a70', skyHor: '#ff7a48', fog: '#8a4a8a', fogNear: 16, fogFar: 110, sat: 1.38, gain: '#fff0e4', lift: '#140a1a', bloom: 1.05, bthr: 0.78, rim: 0.55, rimCol: '#ff9a6a', shadowExt: 12 }),
  cut: tint(LP.indoor, { hemi: 1.1, sunI: 0.95, az: 20, el: 35, sky: '#ffd8a8', fog: '#2a1a14', fogNear: 14, fogFar: 60, skyTop: '#1a0e0a', skyHor: '#3a2016', sat: 1.32, gain: '#fff0d8', vig: 0.38, bloom: 0.95, bthr: 0.8, rim: 0.4, rimCol: '#ffb070', shadowExt: 10 }),
  golden: tint(LP.sunset, { az: 160, el: 14, sunI: 1.5, sat: 1.38, gain: '#fff0dc', bloom: 1.1, bthr: 0.78, rim: 0.6, sunSize: 0.045, fogNear: 22, fogFar: 170, shadowExt: 14 }),
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- layout ----------------
const XP = 70000, XC = 72000;
const at = (o, p) => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
const PZ = [XP, 0, 0], CU = [XC, 0, 0];
const HY = 1.33;
const TB = [0, 0, -4];                    // tower base centre in the piazza
const R = 1.6, SH_H = 1.15, NST = 8, TH = NST * SH_H + 1.0;   // radius, storey height, storeys, total height (stylised scale)
const LEAN0 = 7.5 * Math.PI / 180, LEAN1 = 6.5 * Math.PI / 180;   // stylised: the real 5.5 deg lean is lost in perspective, so it's drawn steeper; the fix is labelled 40 cm
const DRILL = [-2.2, 0, -1.6];             // where the hook's drill bit enters the ground (north side, in front of the tower)
const ACC = '#ff6a1e';
let ST = {}, ST_flag = null, ST_glow = {}; const lampBulbs = [];
// lean per frame: creeps a hair further when they freeze the ground, tips back in the payoff
const leanAt = (f) => { if (f < 691) return LEAN0; if (f < 1291) return LEAN0 + 0.12 * Math.PI / 180 * E.smooth(ramp(f, 735, 800)); if (f < 1776) return LEAN0 + 0.12 * Math.PI / 180;
  return lerp(LEAN0 + 0.12 * Math.PI / 180, LEAN1, E.smooth(ramp(f, 1790, 1930))); };
const creak = (f) => (f >= 735 && f <= 820 ? 0.004 * Math.sin(f * 1.7) * (1 - ramp(f, 735, 820)) : 0);
export const sets = (K) => {
  const { THREE, prop } = K;
  const P = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  const rnd = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  // ---- marble with arcades, one band per storey ----
  const marbleC = (arches, rows, dark) => P(1024, 256 * rows, (g, W, H) => { g.fillStyle = '#fffaf0'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260 * rows; i++) { g.strokeStyle = `rgba(150,140,125,${0.05 + rnd(i) * 0.08})`; g.lineWidth = 1 + rnd(i, 1) * 2; g.beginPath(); const x = rnd(i, 2) * W, y = rnd(i, 3) * H; g.moveTo(x, y); g.quadraticCurveTo(x + 30, y + 10 * rnd(i, 4), x + 60 + 40 * rnd(i, 5), y + 6); g.stroke(); }
    for (let r = 0; r < rows; r++) { const y0 = r * 256; g.fillStyle = 'rgba(120,110,95,.25)'; g.fillRect(0, y0, W, 10); g.fillRect(0, y0 + 246, W, 10);
      for (let k = 0; k < arches; k++) { const aw = W / arches, x = k * aw + aw * 0.18, w = aw * 0.64, top = y0 + 50, bot = y0 + 240;
        g.fillStyle = dark ? 'rgba(40,34,30,.78)' : 'rgba(150,138,120,.42)'; g.beginPath(); g.moveTo(x, bot); g.lineTo(x, top + w / 2); g.arc(x + w / 2, top + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, bot); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(110,98,84,.6)'; g.lineWidth = 4; g.stroke(); } } });
  const baseM = K.toon({ map: ctex(marbleC(12, 1, false)) }), galM = K.toon({ map: ctex(marbleC(16, 1, true)) }), belM = K.toon({ map: ctex(marbleC(8, 1, true)) });
  const corM = K.toon({ color: '#f8efe0' }), colM = K.toon({ color: '#ffffff' });
  const colGeo = new THREE.CylinderGeometry(0.05, 0.05, SH_H * 0.82, 8), corGeo = new THREE.CylinderGeometry(R + 0.34, R + 0.34, 0.1, 40);
  const tower = (parent, o = {}) => { const g = K.grp(parent, 0, 0, 0); const body = K.grp(g, 0, 0, 0);
    for (let s = 0; s < NST; s++) { const y = s * SH_H; const m = s === 0 ? baseM : galM; K.add(new THREE.CylinderGeometry(R, R, SH_H, 40, 1, true), m, 0, y + SH_H / 2, 0, body);
      K.add(corGeo, corM, 0, y + SH_H, 0, body);
      if (s > 0) for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2; K.add(colGeo, colM, Math.cos(a) * (R + 0.26), y + SH_H * 0.47, Math.sin(a) * (R + 0.26), body, false); } }
    K.add(new THREE.CylinderGeometry(R * 0.62, R * 0.62, 0.9, 32, 1, true), belM, 0, NST * SH_H + 0.45, 0, body); K.add(new THREE.CylinderGeometry(R * 0.68, R * 0.68, 0.08, 32), corM, 0, NST * SH_H + 0.92, 0, body);
    K.add(new THREE.CylinderGeometry(R * 0.6, R * 0.6, 0.06, 32), corM, 0, NST * SH_H + 0.99, 0, body);
    K.add(new THREE.CylinderGeometry(R + 0.36, R + 0.5, 0.25, 40), K.mat('stone', { seed: 7, lig: 70, hue: 40 }), 0, 0.12, 0, body);   // plinth
    return g; };
  // ======================= PIAZZA DEI MIRACOLI =======================
  const PZG = K.grp(K.scene, XP, 0, 0);
  { const lawn = K.add(K.tplane(90, 70, 8), K.mat('dirt', { seed: 11, hue: 100, sat: 62, lig: 46 }), 0, 0, -6, PZG, false); lawn.rotation.x = -Math.PI / 2;
    const path = K.add(K.tplane(5, 40, 4), K.mat('cobble', { seed: 12, lig: 66, hue: 36 }), 3.2, 0.01, 4, PZG, false); path.rotation.x = -Math.PI / 2;
    const ring = K.add(new THREE.RingGeometry(R + 0.5, R + 2.6, 48), K.mat('cobble', { seed: 13, lig: 62, hue: 36 }), TB[0], 0.012, TB[2], PZG, false); ring.rotation.x = -Math.PI / 2; }
  const TW = K.grp(PZG, TB[0], TB[1], TB[2]); const TWin = tower(TW);
  // cathedral facade (background, left)
  { const C = K.grp(PZG, -9.5, 0, -15, 0.35); const fac = marbleC(10, 4, false); K.add(K.tbox(9, 6.5, 3, 1), K.toon({ map: ctex(fac) }), 0, 3.25, 0, C);
    const ped = new THREE.Shape(); ped.moveTo(-3, 0); ped.lineTo(3, 0); ped.lineTo(0, 2.2); ped.lineTo(-3, 0); K.add(new THREE.ExtrudeGeometry(ped, { depth: 1, bevelEnabled: false }), K.toon({ map: ctex(marbleC(6, 1, false)) }), 0, 6.5, 0.6, C);
    K.add(new THREE.CylinderGeometry(1.4, 1.4, 1.6, 24), corM, 2.6, 7.2, -2, C); K.add(new THREE.SphereGeometry(1.45, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), K.toon({ color: '#c8aa8a' }), 2.6, 8.0, -2, C); }
  // trees at the edges
  for (const [x, z, s] of [[8, -10, 1.2], [10, -6, 1], [-7, -4, 1], [9, -14, 1.3], [-12, -8, 1.1]]) { const t = K.grp(PZG, x, 0, z); K.add(new THREE.CylinderGeometry(0.12 * s, 0.16 * s, 1.6 * s, 8), K.mat('woodGrain', { seed: 21 }), 0, 0.8 * s, 0, t);
    K.add(new THREE.SphereGeometry(1.1 * s, 14, 10), K.toon({ color: '#4a7a3a' }), 0, 2.2 * s, 0, t).scale.y = 1.15; }
  // barrier + gate + sign (1990: closed)
  const GATE = K.grp(PZG, 0.6, 0, 1.6);
  for (let k = -6; k <= 6; k++) { if (k === 0 || k === 1) continue; K.add(new THREE.BoxGeometry(0.06, 1.0, 0.06), K.M.iron, k * 0.55, 0.5, 0, GATE); }
  K.add(new THREE.BoxGeometry(7.2, 0.05, 0.05), K.M.iron, 0.27, 0.95, 0, GATE); K.add(new THREE.BoxGeometry(7.2, 0.05, 0.05), K.M.iron, 0.27, 0.2, 0, GATE);
  const gateL = K.grp(GATE, -0.0, 0, 0), gateR = K.grp(GATE, 1.1, 0, 0);
  for (const [gp, sx] of [[gateL, 1], [gateR, -1]]) { for (let k = 0; k < 5; k++) K.add(new THREE.BoxGeometry(0.04, 1.0, 0.04), K.M.iron, sx * (0.06 + k * 0.11), 0.5, 0, gp); K.add(new THREE.BoxGeometry(0.55, 0.04, 0.04), K.M.iron, sx * 0.27, 0.9, 0, gp); K.add(new THREE.BoxGeometry(0.55, 0.04, 0.04), K.M.iron, sx * 0.27, 0.2, 0, gp); }
  const signC = P(512, 256, (g, W, H) => { g.fillStyle = '#c8202a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(12, 12, W - 24, H - 24); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = '900 96px Arial, sans-serif'; g.fillText('CHIUSO', W / 2, 120); g.font = '700 54px Arial, sans-serif'; g.fillText('CLOSED', W / 2, 200); });
  const sign = K.add(new THREE.PlaneGeometry(0.62, 0.31), K.toon({ map: ctex(signC) }), 0.55, 0.62, 0.04, GATE, false);
  // lead weights on the north side (-x) + crane lowering one
  const leadM = K.toon({ color: '#5a5e66' }), leadStack = K.grp(PZG, TB[0] - R - 0.55, 0, TB[2]);
  for (let i = 0; i < 18; i++) { const lvl = Math.floor(i / 6), k = i % 6; K.add(new THREE.BoxGeometry(0.42, 0.22, 0.6), leadM, 0, 0.11 + lvl * 0.23, -1.3 + k * 0.5, leadStack); }
  const CR = K.grp(PZG, TB[0] - 5.2, 0, TB[2] + 0.4); const crM = K.toon({ color: '#e8b830' });
  K.add(new THREE.BoxGeometry(0.4, 6.2, 0.4), crM, 0, 3.1, 0, CR); K.add(new THREE.BoxGeometry(5.2, 0.3, 0.3), crM, 2.1, 6.1, 0, CR); K.add(new THREE.BoxGeometry(1.2, 0.5, 0.6), K.toon({ color: '#3a3a40' }), -0.6, 6.1, 0, CR);
  const PIVC = at(at(PZ, [TB[0] - 5.2, 0, TB[2] + 0.4]), [4.3, 6.0, 0]);
  const cRope = K.add(new THREE.CylinderGeometry(0.015, 0.015, 1, 5), K.M.rope, 0, 0, 0, K.scene, false);
  const cBlock = K.add(new THREE.BoxGeometry(0.42, 0.22, 0.6), leadM, 0, 0, 0, K.scene);
  // freezing pipes + frost on the ground (south-front)
  const FZ = K.grp(PZG, TB[0] + 1.2, 0, TB[2] + 2.3); const frostM = K.toon({ color: '#eaf6ff', transparent: true, opacity: 0.0 });
  for (let k = 0; k < 6; k++) { const p = K.add(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 10), K.M.iron, -1 + k * 0.42, 0.4, (k % 2) * 0.3, FZ); K.add(new THREE.TorusGeometry(0.07, 0.02, 6, 12), K.toon({ color: '#3a6aa0' }), -1 + k * 0.42, 0.8, (k % 2) * 0.3, FZ).rotation.x = Math.PI / 2; }
  K.add(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 10), K.toon({ color: '#3a6aa0' }), 0.05, 0.85, 0.15, FZ).rotation.z = Math.PI / 2;
  const frost = K.add(new THREE.CircleGeometry(1.8, 36), frostM, 0, 0.02, 0.1, FZ, false); frost.rotation.x = -Math.PI / 2;
  const mist = []; for (let i = 0; i < 40; i++) { const m = K.add(new THREE.SphereGeometry(0.08 + rnd(i) * 0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }), -1.2 + rnd(i, 1) * 2.4, 0.1, -0.2 + rnd(i, 2) * 0.8, FZ, false); K.noInk(m); mist.push(m); }
  // drill rig on the north side (-x), its drill going down into the ground; the bit in the orange accent
  const RIG = K.grp(PZG, DRILL[0] - 1.7, 0, DRILL[2] - 0.2, 0.2); const rigM = K.toon({ color: '#e8b830' });
  K.add(new THREE.BoxGeometry(1.4, 0.6, 0.9), rigM, 0, 0.5, 0, RIG); for (const z of [-0.5, 0.5]) K.add(new THREE.BoxGeometry(1.6, 0.25, 0.22), K.toon({ color: '#2a2a2e' }), 0, 0.13, z, RIG);
  K.add(new THREE.BoxGeometry(0.6, 0.5, 0.7), K.toon({ color: '#3a3a40' }), -0.35, 1.05, 0, RIG);
  const mast = K.add(new THREE.BoxGeometry(0.14, 2.6, 0.14), rigM, 0.75, 1.6, 0, RIG); mast.rotation.z = -0.35;
  const DG = K.grp(PZG, DRILL[0], 0, DRILL[2]); DG.rotation.z = -0.35;   // drill string, angled under the tower
  const tube = K.add(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 12), K.toon({ color: '#c8ccd2' }), 0, 0.8, 0, DG);
  const bitM = K.toon({ color: ACC, emissive: '#ff5a10', emissiveIntensity: 0.6 });
  const bit = K.grp(DG, 0, 0.02, 0); K.add(new THREE.ConeGeometry(0.11, 0.28, 14), bitM, 0, -0.08, 0, bit).rotation.x = Math.PI;
  for (let k = 0; k < 3; k++) { const fl = K.add(new THREE.TorusGeometry(0.1, 0.022, 6, 14, Math.PI * 1.6), bitM, 0, 0.06 + k * 0.1, 0, bit, false); fl.rotation.x = Math.PI / 2; fl.rotation.z = k * 2.1; }
  const clods = []; for (let i = 0; i < 26; i++) { const c = K.add(new THREE.DodecahedronGeometry(0.03 + rnd(i) * 0.04, 0), K.toon({ color: '#5a4030' }), 0, 0, 0, PZG, false); clods.push(c); }
  const hole = K.add(new THREE.CircleGeometry(0.22, 20), K.toon({ color: '#3a2a20' }), DRILL[0], 0.013, DRILL[2], PZG, false); hole.rotation.x = -Math.PI / 2;
  const work1 = K.warmLight(PZG, DRILL[0] - 1.6, 2.6, DRILL[2] + 2.2, { i: 6.0, dist: 16, col: '#ffd8a0', flicker: 0.02 });
  const work2 = K.warmLight(PZG, TB[0] + 2.5, 2.2, TB[2] + 3.2, { i: 5.0, dist: 16, col: '#ffcf90', flicker: 0.02 });
  // ---- colour + glow: souvenir stalls, flower beds, flag, barrier tape, glowing work-lamp bulbs, sun shafts, dust motes ----
  prop.tent(PZG, { x: 6.2, z: 2.0, w: 2.0, d: 1.6, h: 2.0, col: '#ffffff', col2: '#e0302a', open: 0.9 }); prop.tent(PZG, { x: -6.0, z: 2.6, w: 2.0, d: 1.6, h: 2.0, col: '#ffffff', col2: '#2a8ad0', open: 0.9 });
  for (let i = 0; i < 70; i++) { const x = -7 + rnd(i, 1) * 14, z = 4.6 + rnd(i, 2) * 0.6; K.add(new THREE.SphereGeometry(0.06 + rnd(i) * 0.04, 8, 6), K.toon({ color: ['#e8302a', '#ffd23f', '#ff7ab0', '#ffffff', '#ff8a2a'][i % 5] }), x, 0.08, z, PZG, false); }
  { const fp = K.add(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 8), K.M.iron, 5.0, 1.7, -2.0, PZG); const flagC = P(300, 200, (g) => { ['#1f9a4a', '#ffffff', '#d8202a'].forEach((c, k) => { g.fillStyle = c; g.fillRect(k * 100, 0, 100, 200); }); });
    const fl = K.add(new THREE.PlaneGeometry(0.9, 0.6, 8, 2), K.toon({ map: ctex(flagC), side: THREE.DoubleSide }), 5.47, 3.05, -2.0, PZG, false); const pp = fl.geometry.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, 0.06 * Math.sin(pp.getX(i) * 6)); fl.geometry.computeVertexNormals(); ST_flag = fl; }
  for (let k = -6; k <= 6; k++) { if (k === 0 || k === 1) continue; K.add(new THREE.BoxGeometry(0.56, 0.06, 0.012), K.toon({ color: k % 2 ? '#e8302a' : '#ffffff' }), k * 0.55 + 0.27, 0.72, 0.035, GATE, false); }
  const bulbM = new THREE.MeshBasicMaterial({ color: '#fff2c8' });
  for (const [x, y, z] of [[DRILL[0] - 1.6, 2.6, DRILL[2] + 2.2], [TB[0] + 2.5, 2.2, TB[2] + 3.2]]) { const pole = K.add(new THREE.CylinderGeometry(0.03, 0.03, y, 8), K.M.iron, x, y / 2, z, PZG); const head = K.add(new THREE.BoxGeometry(0.34, 0.24, 0.12), K.toon({ color: '#2a2a30' }), x, y, z, PZG);
    const b = K.add(new THREE.PlaneGeometry(0.28, 0.18), bulbM, x, y, z + 0.065, PZG, false); K.noInk(b); lampBulbs.push(b, head, pole); }
  const sunShafts = [K.beam(PZG, [6, 14, -14], [1.5, 0, -1], 0.6, 2.4, '#ffd89a', 0.22), K.beam(PZG, [9, 14, -12], [4.0, 0, 1.0], 0.5, 2.0, '#ffe0a8', 0.18)];
  const motes = []; for (let i = 0; i < 60; i++) { const m = K.add(new THREE.SphereGeometry(0.012 + rnd(i) * 0.012, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: 0.8 }), 0, 0, 0, PZG, false); K.noInk(m); motes.push(m); }
  ST_glow = { sunShafts, motes };
  // ======================= CUTAWAY: ground under the tower =======================
  const CUG = K.grp(K.scene, XC, 0, 0);
  const SW = 8, SD = 3.4;
  const sandM = K.mat('dirt', { seed: 31, hue: 38, sat: 38, lig: 62 }), clayM = K.mat('dirt', { seed: 32, hue: 205, sat: 14, lig: 44 }), firmM = K.mat('dirt', { seed: 33, hue: 30, sat: 30, lig: 40 });
  // the block's front face IS the cut: strata painted on it (no stencil section needed)
  const SHH = 3.1;
  const strataC = P(1024, Math.round(1024 * SHH / SW), (g, W, H) => { const sy = (y) => (y / SHH) * H;
    // firm ground (north, left) and soft clay (south, right)
    g.fillStyle = '#9a7a56'; g.fillRect(0, 0, W / 2, H); g.fillStyle = '#8ea4b6'; g.fillRect(W / 2, 0, W / 2, H);
    // sand/silt band on top; its base dips on the clay side, where the ground has sunk
    g.fillStyle = '#d2b88e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, sy(1.05)); g.bezierCurveTo(W * 0.78, sy(1.15), W * 0.6, sy(0.98), W * 0.5, sy(0.9)); g.lineTo(0, sy(0.86)); g.closePath(); g.fill();
    // hairline strata in ink ~15%
    for (let i = 0; i < 26; i++) { const y = sy(0.2 + i * 0.12); g.strokeStyle = 'rgba(40,30,25,.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y + Math.sin(i) * 4); for (let x = 0; x <= W; x += 64) g.lineTo(x, y + Math.sin(i + x * 0.01) * 4 + (x > W / 2 ? (x - W / 2) / W * 30 : 0)); g.stroke(); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd(i) < 0.5 ? '40,30,25' : '255,250,240'},${0.06 + rnd(i, 1) * 0.08})`; g.beginPath(); g.arc(rnd(i, 2) * W, rnd(i, 3) * H, 1 + rnd(i, 4) * 3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(20,16,14,.85)'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6); });
  const strataM = K.toon({ map: ctex(strataC) }), soilSide = K.mat('dirt', { seed: 34, hue: 34, sat: 30, lig: 44 }), soilTop = K.mat('dirt', { seed: 35, hue: 40, sat: 34, lig: 60 });
  K.add(new THREE.BoxGeometry(SW, SHH, SD), [soilSide, soilSide, soilTop, soilSide, strataM, soilSide], 0, -SHH / 2, -SD / 2, CUG);
  const CTW = K.grp(CUG, 0, 0, -1.2); const CTin = tower(CTW);
  const ghost = K.grp(CUG, 0, 0, -1.2); K.add(new THREE.CylinderGeometry(R, R, TH, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false }), 0, TH / 2, 0, ghost, false);
  const foundM = K.toon({ color: '#b8b0a0' }); const found = K.add(new THREE.CylinderGeometry(R + 0.5, R + 0.5, 0.5, 40), foundM, 0, -0.25, 0, CTW);
  // drill tubes under the high (north, -x) side, in the accent
  const tubesG = K.grp(CUG, 0, 0, 0); const tubes = [];
  for (const [y0, y1] of [[-0.25, -0.75], [-0.3, -1.05]]) { const a = [-3.6, y0 + 0.25, 0.0], b = [-1.0, y1, 0.0]; const v = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
    const t = K.add(new THREE.CylinderGeometry(0.06, 0.06, v.length(), 12), K.toon({ color: ACC, emissive: '#ff5a10', emissiveIntensity: 0.55 }), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2], tubesG); t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); tubes.push({ a, b }); }
  const plugs = []; for (let i = 0; i < 14; i++) { const p = K.add(new THREE.SphereGeometry(0.07, 10, 8), K.toon({ color: '#7a5a3a' }), 0, 0, 0, tubesG, false); plugs.push(p); }
  const cutLamp = K.warmLight(CUG, 1.5, 0.6, 5.0, { i: 7.0, dist: 18, col: '#ffe8c8', flicker: 0.01 }), cutLamp2 = K.warmLight(CUG, -2.5, -0.4, 4.5, { i: 5.0, dist: 16, col: '#ffe0b8', flicker: 0.01 });
  const cutBack = K.add(K.tplane(30, 14, 1), K.toon({ color: '#3a3040' }), 0, 2, -4.2, CUG, false);
  ST = { RIG, DG, TW, CTW, ghost, cRope, cBlock, frost, mist, bit, clods, plugs, tubes, gateL, gateR };
  return { update: (W, f) => { const S = shot(f);
    const L = leanAt(f) + creak(f); TW.rotation.z = -L; CTW.rotation.z = -L; ghost.rotation.z = -(LEAN0 + 0.12 * Math.PI / 180); ghost.visible = S.id === 'tipback';
    lampBulbs.forEach((b) => { b.visible = S.light === 'dusk'; }); work1.l.visible = work2.l.visible = S.light === 'dusk';
    (ST_glow.sunShafts || []).forEach((b) => { b.visible = S.light === 'golden'; });
    (ST_glow.motes || []).forEach((m, i) => { m.visible = S.light === 'golden' || S.light === 'sunny'; const t = (f * 0.0016 + rnd(i, 7)) % 1; m.position.set(-3 + rnd(i, 8) * 7 + Math.sin(f * 0.01 + i) * 0.3, 0.3 + t * 3.2, -1 + rnd(i, 9) * 6); });
    if (ST_flag) ST_flag.rotation.y = 0.15 * Math.sin(f * 0.05);
    // gate swings shut in 'closed'
    const g = S.id === 'closed' ? E.smooth(ramp(f, 400, 455)) : (f > 470 ? 1 : 0.0); gateL.rotation.y = lerp(1.25, 0, g); gateR.rotation.y = lerp(-1.25, 0, g);
    // crane lowering a lead block onto the stack
    const lk = S.id === 'lead' ? E.smooth(ramp(f, 480, 640)) : 1; const bx = lerp(PIVC[0], XP + TB[0] - R - 0.55, lk), by = lerp(4.2, 0.11 + 3 * 0.23, lk), bz = lerp(PIVC[2], TB[2] + 1.2, lk);
    cBlock.position.set(bx, by, bz); cBlock.visible = S.light === 'sunny' && f >= 471 && f <= 690;
    const top = new THREE.Vector3(...PIVC), bot = new THREE.Vector3(bx, by + 0.11, bz); cRope.position.copy(top).add(bot).multiplyScalar(0.5); cRope.scale.set(1, top.distanceTo(bot), 1); cRope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bot.clone().sub(top).normalize()); cRope.visible = cBlock.visible;
    // frost + mist when they freeze the ground
    const fk = S.id === 'freeze' ? E.smooth(ramp(f, 700, 790)) : 0; frost.material.opacity = 0.7 * fk; mist.forEach((m, i) => { const t = ((f * 0.01 + rnd(i, 3)) % 1); m.position.y = 0.1 + t * 0.9; m.material.opacity = fk * 0.5 * (1 - t); m.scale.setScalar(0.6 + t * 1.6); });
    // drill bit spinning + clods flying (hook / dig / loop)
    const drilling = S.id === 'hook' || S.id === 'dig' || S.id === 'loop'; bit.rotation.y = f * 0.45; RIG.visible = DG.visible = hole.visible = drilling || S.id === 'insane' || S.id === 'burland';
    clods.forEach((c, i) => { const t = ((f * 0.022 + rnd(i, 1)) % 1); const a = rnd(i, 2) * Math.PI * 2, r = 0.12 + t * (0.35 + rnd(i, 3) * 0.3); c.position.set(XP + DRILL[0] + Math.cos(a) * r, 0.03 + Math.sin(t * Math.PI) * (0.25 + rnd(i, 4) * 0.25), DRILL[2] + Math.sin(a) * r); c.visible = drilling; c.rotation.set(f * 0.1 + i, f * 0.07, 0); });
    // cutaway section + soil plugs travelling out along the tubes
    const pk = S.id === 'cutaway' ? ramp(f, 1590, 1729) : S.id === 'tipback' ? 1 : 0;
    plugs.forEach((p, i) => { const tb = ST.tubes[i % 2]; const t = ((f * 0.006 + i / 14) % 1); const vis = pk > 0 && S.light !== 'sunny'; p.visible = vis && t < pk + 0.05;
      p.position.set(lerp(tb.b[0], tb.a[0], t), lerp(tb.b[1], tb.a[1], t), 0.05); });
  } };
};
// ---------------- cast ----------------
const SK = '#f7f4ee';
const ENG1 = { tunic: '#3a5a8a', stick: true, skin: SK, hair: '#3a2a1c', apron: '#ff8a2a', hat: 'hardhat', hatCol: '#f2c230', moustache: '#3a2a1c' };
const ENG2 = { tunic: '#5a6a3a', stick: true, skin: SK, hair: '#9a5228', apron: '#ff8a2a', hat: 'hardhat', hatCol: '#ffffff', beard: '#9a5228', beardStyle: 'short' };
const BURL = { tunic: '#2a3448', stick: true, skin: SK, hair: '#d8d8d8', collar: '#ffffff', tie: '#b8202e', glasses: true, hat: 'hardhat', hatCol: '#ffffff' };
const EXPERT = { tunic: '#6a6a72', stick: true, skin: SK, hair: '#4a3a2a', collar: '#ffffff', tie: '#2a5ab0', glasses: true };
const GUARD = { tunic: '#2a3a5a', stick: true, skin: SK, hair: '#1e1714', hat: 'soldier', hatCol: '#1e2a44', hatBand: '#c8202a', moustache: '#1e1714' };
const TOUR1 = { tunic: '#e05a7a', stick: true, skin: SK, hair: '#c8862a', hat: 'cowboy', hatCol: '#f2e2b8', hatBand: '#2a9a7a', pattern: { type: 'dots', col: '#ffffff' } };
const TOUR2 = { tunic: '#2aa08a', dress: '#2aa08a', stick: true, skin: SK, hair: '#1e1714', pattern: { type: 'stripes', col: 'rgba(255,255,255,.6)' } };
export const actorsAt = (f, T) => {
  const S = shot(f), out = [], u = Math.floor(f / 2);
  const I = (seed) => { const i = idle(u, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const tintL = { dusk: '#d8e0ff', cut: '#ffe6c8', golden: '#ffe2c4', overcast: '#f2f4f8' }[S.light] || '#ffffff';
  const card = (id, O, o, origin, pos, seed, extra = {}) => { const w = at(origin, pos); out.push({ key: id + JSON.stringify(o) + JSON.stringify(extra), draw: (p) => T.romanFront(p, O, { seed, blink: blinkAt(u, seed), ...I(seed), L: 'hang', R: 'hang', look: 0, ...o }), x: w[0], y: w[1] + (extra.y || 0), z: w[2], s: 0.9, ground: w[1], tint: tintL, ...extra }); };
  const hop = (k, ph) => q(0.12 * Math.abs(Math.sin(f * k + ph)), 3);
  switch (S.id) {
    case 'closed': card('ex', EXPERT, { expr: f < 380 ? 'scared' : 'nervous', L: 'up', R: 'point', look: 0.6, talk: talkAt(f, 2, 1.2) }, PZ, [-0.3, 0, 3.4], 31);
      card('t1', TOUR1, { expr: 'shock', L: 'up', R: 'up', look: -0.3 }, PZ, [1.5, 0, 3.9], 33); card('t2', TOUR2, { expr: 'sideeye', L: 'cross', R: 'cross', look: -0.6 }, PZ, [2.05, 0, 3.0], 35);
      card('gd', GUARD, { expr: 'unimpressed', L: 'grab', R: 'hip', gx: 0.5, gy: 0.5, look: -0.3 }, PZ, [1.15, 0, 2.05], 37); break;
    case 'lead': card('e1', ENG1, { expr: 'nervous', sweat: 0.8, sweatT: f / 60, L: 'up', R: 'up', look: 0.7 }, PZ, [-1.75, 0, -0.9], 41); card('e2', ENG2, { expr: 'neutral', L: 'hip', R: 'point', look: -0.4 }, PZ, [-2.7, 0, -1.4], 43); break;
    case 'freeze': card('e1', ENG1, { expr: f < 760 ? 'nervous' : 'scared', L: f < 760 ? 'hip' : 'up', R: f < 760 ? 'point' : 'up', look: 0.6, sweat: 0.9, sweatT: f / 60 }, PZ, [0.25, 0, -0.75], 41); break;
    case 'burland': card('bu', BURL, { expr: f < 985 ? 'squint' : 'eureka', L: 'hip', R: f < 985 ? 'cheek' : 'up', look: 0.3, talk: f > 900 && f < 1030 ? talkAt(f, 4, 1.1) : 0 }, PZ, [-0.4, 0, 0.6], 51); break;
    case 'dig': card('e2', ENG2, { expr: 'stubborn', L: 'grab', R: 'grab', gx: 0.5, gy: 0.4, look: 0.5 }, PZ, [DRILL[0] - 1.5, 0, DRILL[2] + 0.9], 43); break;
    case 'insane': card('e1', ENG1, { expr: 'shock', L: 'up', R: 'up', look: 0.4 }, PZ, [-0.78, 0, 3.0], 41); card('e2', ENG2, { expr: 'scared', L: 'cheek', R: 'cheek', look: -0.3 }, PZ, [0.82, 0, 3.05], 43);
      card('bu', BURL, { expr: 'smug', L: 'hip', R: 'thumb', look: 0 }, PZ, [0.05, 0, 2.45], 51); break;
    case 'loop': card('bu', BURL, { expr: 'grin', L: 'hip', R: 'thumb', look: 0.4 }, PZ, [-3.4, 0, -0.9], 51); card('e1', ENG1, { expr: 'laugh', L: 'up', R: 'up' }, PZ, [-4.2, 0, -1.5], 41, { y: hop(0.2, 0) }); break;
  }
  return out;
};
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'freeze' && f >= 760) out.push(emote('!', f - 760, at(PZ, [0.5, HY + 0.42, -0.75]), { s: 0.18 }));
  if (S.id === 'lead' && f >= 520) out.push(emote('sweat', f - 520, at(PZ, [-1.5, HY + 0.38, -0.9]), { s: 0.14 }));
  if (S.id === 'burland' && f >= 990) out.push(emote('bulb', f - 990, at(PZ, [-0.4, HY + 0.52, 0.6]), { s: 0.24 }));
  if (S.id === 'insane' && f >= 1222) { out.push(emote('?', f - 1222, at(PZ, [-0.78, HY + 0.42, 3.0]), { s: 0.16 })); out.push(emote('!', f - 1232, at(PZ, [0.82, HY + 0.42, 3.05]), { s: 0.16 })); }
  return out; };
// ---------------- camera ----------------
const orbit = (c, ang, d, y) => [c[0] + Math.sin(ang * Math.PI / 180) * d, y, c[2] + Math.cos(ang * Math.PI / 180) * d];
const TOWER_MID = at(PZ, [TB[0] + 0.5, 5.0, TB[2]]);
const HOOK0 = { pos: at(PZ, [DRILL[0] + 0.9, 0.32, DRILL[2] + 1.35]), look: at(PZ, [DRILL[0] - 0.05, 0.25, DRILL[2]]), fov: 46 };
const HOOK1 = { pos: at(PZ, [DRILL[0] + 1.6, 0.55, DRILL[2] + 7.2]), look: at(PZ, [TB[0] + 0.7, 5.2, TB[2]]), fov: 64 };
const cam = (f) => { const S = shot(f), v = (f - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v); let c;
  switch (S.id) {
    case 'hook': { const k = E.smooth(ramp(f, 55, 150)); c = { pos: lerp3(HOOK0.pos, HOOK1.pos, k), look: lerp3(HOOK0.look, HOOK1.look, k), fov: lerp(46, 52, k) }; break; }
    case 'closed': c = { pos: at(PZ, lerp3([0.75, 1.55, 8.4], [0.75, 1.5, 7.6], sv)), look: at(PZ, lerp3([0.7, 2.6, 1.0], [0.7, 2.0, 1.8], sv)), fov: 58 }; break;
    case 'lead': c = { pos: at(PZ, lerp3([0.2, 1.5, 2.6], [-0.3, 1.6, 2.0], sv)), look: at(PZ, lerp3([-2.4, 2.6, -3.6], [-2.4, 1.4, -3.4], sv)), fov: 58 }; break;
    case 'freeze': c = { pos: at(PZ, lerp3([1.7, 1.05, 1.5], [1.5, 1.15, 1.1], sv)), look: at(PZ, lerp3([0.45, 0.95, -1.4], [0.4, 4.2, -3.6], E.smooth(ramp(f, 745, 850)))), fov: 56 }; break;
    case 'burland': c = { pos: at(PZ, orbit([-0.4, 0, 0.6], lerp(-12, 6, sv), lerp(1.9, 1.5, sv), 1.38)), look: at(PZ, [-0.4, HY + 0.05, 0.6]), fov: 44 }; break;
    case 'dig': c = { pos: at(PZ, lerp3([DRILL[0] + 0.5, 0.25, DRILL[2] + 1.1], [DRILL[0] + 0.35, 0.22, DRILL[2] + 0.75], sv)), look: at(PZ, lerp3([DRILL[0] + 0.25, 0.7, DRILL[2]], [TB[0] + 0.6, 7.5, TB[2]], E.smooth(ramp(f, 1080, 1190)))), fov: 62 }; break;
    case 'insane': c = { pos: at(PZ, lerp3([0.0, 1.45, 6.3], [0.0, 1.45, 5.8], sv)), look: at(PZ, [0.0, 1.3, 2.6]), fov: 58 }; break;
    case 'cutaway': { const k = E.smooth(ramp(f, 1470, 1560)); c = { pos: at(CU, lerp3([1.0, -0.6, 7.6], [-1.4, -0.4, 6.2], k)), look: at(CU, lerp3([1.0, -0.9, -0.5], [-1.6, -0.6, -0.5], k)), fov: 50 }; break; }
    case 'tipback': c = { pos: at(CU, lerp3([0.2, 1.5, 12.5], [0.3, 2.0, 13.5], sv)), look: at(CU, [0.3, 3.4, -1.0]), fov: 54 }; break;
    case 'loop': { const k = E.smooth(ramp(f, 2080, 2196)); c = { pos: lerp3(at(PZ, [1.6, 1.4, 6.5]), HOOK0.pos, k), look: lerp3(at(PZ, [TB[0] + 0.3, 4.0, TB[2]]), HOOK0.look, k), fov: lerp(54, 46, k) }; break; }
  }
  c.shadowAt = c.look; return c; };
export const camAt = cam;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shot(f), C = cam(f), atp = (p, k) => ({ focus: dist(C.pos, p), cinf: k });
  switch (S.id) {
    case 'hook': { const k = E.smooth(ramp(f, 60, 140)); return { focus: lerp(dist(C.pos, at(PZ, [DRILL[0], 0.2, DRILL[2]])), dist(C.pos, TOWER_MID), k), cinf: lerp(24, 6, k) }; }
    case 'loop': { const k = E.smooth(ramp(f, 2120, 2196)); return { focus: lerp(dist(C.pos, TOWER_MID), dist(C.pos, at(PZ, [DRILL[0], 0.2, DRILL[2]])), k), cinf: lerp(6, 24, k) }; }
    case 'closed': return atp(at(PZ, [0.4, HY, 2.6]), 8);
    case 'lead': return atp(at(PZ, [-2.0, 1.3, -1.6]), 8);
    case 'freeze': return atp(at(PZ, [0.2, HY, -0.3]), 9);
    case 'burland': return atp(at(PZ, [-0.4, HY, 0.6]), 11);
    case 'dig': return atp(at(PZ, [TB[0], 4.0, TB[2]]), 7);
    case 'insane': return atp(at(PZ, [0.0, HY, 2.8]), 9);
    case 'cutaway': return atp(at(CU, [-0.5, -0.7, 0.0]), 6);
    case 'tipback': return atp(at(CU, [0, 2.5, -1.0]), 4);
  }
  return { focus: 5, cinf: 0 }; };
export const worldAt = (f) => ({});
// ---------------- handwritten labels ----------------
export const annotAt = (f) => { const S = shot(f);
  if (S.id === 'hook') return [{ type: 'label', text: 'about to fall', at: at(PZ, [TB[0] + 1.6, 8.2, TB[2]]), dx: -330, dy: -140, age: f - 70 }];
  if (S.id === 'cutaway') return [{ type: 'label', text: 'soft clay', at: at(CU, [2.2, -1.3, 0.02]), dx: -330, dy: -300, age: f - 1440, bend: -0.25 },
    ...(f >= 1600 ? [{ type: 'label', text: 'soil out', at: at(CU, [-3.0, -0.35, 0.05]), dx: 40, dy: -260, age: f - 1600, bend: 0.3 }, { type: 'circle', at: at(CU, [-3.2, -0.25, 0.05]), rw: 0.12, age: f - 1610 }] : [])];
  if (S.id === 'tipback') return [{ type: 'label', text: '40 cm back', at: at(CU, [0.8, 9.0, -1.2]), dx: -320, dy: -120, age: f - 1925 }];
  return []; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
