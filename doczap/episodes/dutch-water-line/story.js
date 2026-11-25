// Doc Zap — "The Dutch flooded their own country to stop France's army" (Holland Water Line, 1672). Flat toon look, rich light.
// Voice: Patrick, Eleven v4 (via API). 40.6 s = 2436 frames @ 60 fps. NO blended transitions (Diyar, Nov 25 2026): hard cuts,
// plus real camera whip-pans made here in the plates (yaw out 14 frames / in 18 frames). The last shot returns to frame 0.
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, talkAt, q } from './motion.js';
import { LP, tint } from './kit/lights.js';
import { emote } from './kit/emotes.js';
export const FPS = 60, TOTAL = 2436, DECK = 0, LOOK = 'toon';
const SH = [
  ['hook', 0, 232, 'sunny'], ['army', 233, 473, 'sunny'], ['tiny', 474, 579, 'sunny'], ['open', 580, 790, 'sunny'],
  ['useless', 791, 1119, 'sunny'], ['couldnt', 1120, 1176, 'sunny'], ['cutaway', 1177, 1609, 'cut'],
  ['chaos', 1610, 1901, 'sunny'], ['puddle', 1902, 2077, 'golden'], ['loop', 2078, 2435, 'golden']];
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a, b, light }));
export const WHIPS = [233, 580, 1610, 2078];                       // camera whip-pans made in the plates (no frame blending)
export const TRANSITIONS = SH.slice(1).map(([, a]) => ({ at: a, type: 'cut' }));
export const WHIP_FRAMES = [], CUTS = [];
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = shot;
export const LIGHTS = {
  sunny: tint(LP.day, { az: 120, el: 38, sun: '#fff1d8', sunI: 1.45, skyTop: '#1a6ae0', skyHor: '#a8dcff', fog: '#c0e2ff', fogNear: 30, fogFar: 220, gain: '#fffaf2', sunDisc: '#fff6d8', sunSize: 0.022, shadowExt: 16 }),
  cut: tint(LP.indoor, { hemi: 1.1, sunI: 0.95, az: 20, el: 35, sky: '#ffd8a8', fog: '#2a1a14', fogNear: 14, fogFar: 60, skyTop: '#1a0e0a', skyHor: '#3a2016', gain: '#fff0d8', vig: 0.36, shadowExt: 10 }),
  golden: tint(LP.sunset, { az: 230, el: 9, sunI: 1.5, gain: '#fff0dc', rim: 0.6, sunSize: 0.05, fogNear: 22, fogFar: 180, shadowExt: 16 }),
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- layout ----------------
const XP = 90000, XC = 92000;
const at = (o, p) => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
const PD = [XP, 0, 0], CW = [XC, 0, 0];
const HY = 1.33;
const DIKE_Z = -3, SEA_Y = 0.85;             // the river behind the dike is higher than the farmland (Holland is below water level)
const GATE = [0, 0, DIKE_Z];                 // sluice gate in the dike
const ROAD_Z = 7, DITCH_X = 3.2;             // the road the army marches on; a ditch crossing the field at x=3.2 (the hidden trap)
const FLOOD = 0.28;                          // knee-deep
let ST = {};
const floodAt = (f) => (f < 640 ? -0.12 : lerp(-0.12, FLOOD, E.smooth(ramp(f, 640, 780))));
const gateAt = (f) => (f < 600 ? 0 : E.smooth(ramp(f, 600, 650)));
export const sets = (K) => {
  const { THREE, prop } = K;
  const P = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  const rnd = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  // ---- water with gentle waves (flat-toon blue, sparkles) ----
  const waterC = P(512, 512, (g, W, H) => { g.fillStyle = '#2f9ad8'; g.fillRect(0, 0, W, H); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(20,90,170,${0.12 + rnd(i) * 0.15})`; g.beginPath(); g.ellipse(rnd(i, 1) * W, rnd(i, 2) * H, 30 + rnd(i, 3) * 50, 6 + rnd(i, 4) * 10, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 420; i++) { const x = rnd(i, 5) * W, y = rnd(i, 6) * H; g.strokeStyle = rnd(i, 7) < 0.6 ? 'rgba(255,255,255,.6)' : 'rgba(10,60,120,.3)'; g.lineWidth = 2 + rnd(i, 8) * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 4, x + 20, y); g.stroke(); } });
  const waters = [];
  const makeWater = (parent, x, y, z, w, d, seg, rep, col = '#ffffff', op = 1) => { const geo = new THREE.PlaneGeometry(w, d, seg, seg); geo.rotateX(-Math.PI / 2); const t = ctex(waterC, rep, rep * d / w);
    const m = K.add(geo, K.toon({ map: t, color: col, transparent: op < 1, opacity: op }), x, y, z, parent, false); m.userData.base = Float32Array.from(geo.attributes.position.array); m.userData.tex = t; waters.push(m); return m; };
  const waves = (m, f, amp) => { const p = m.geometry.attributes.position, b = m.userData.base, t = f / 60; for (let i = 0; i < p.count; i++) { const x = b[i * 3], z = b[i * 3 + 2]; p.array[i * 3 + 1] = amp * (0.6 * Math.sin(0.5 * x + t * 1.4) + 0.4 * Math.sin(0.7 * z - t * 1.1)); }
    p.needsUpdate = true; m.geometry.computeVertexNormals(); m.userData.tex.offset.set(t * 0.015, t * 0.008); };
  // ======================= THE POLDER =======================
  const PG = K.grp(K.scene, XP, 0, 0);
  const fieldC = P(1024, 1024, (g, W, H) => { const cols = ['#5cb83a', '#7ccc44', '#4aa832', '#8ad04a', '#e8c040', '#5cb83a'];
    for (let k = 0; k < 6; k++) { g.fillStyle = cols[k]; g.fillRect(0, k * H / 6, W, H / 6); for (let r = 0; r < 14; r++) { g.fillStyle = 'rgba(30,80,20,.16)'; g.fillRect(0, k * H / 6 + r * (H / 6 / 14), W, 3); } }
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,220,${0.06 + rnd(i) * 0.08})`; g.beginPath(); g.arc(rnd(i, 1) * W, rnd(i, 2) * H, 1 + rnd(i, 3) * 3, 0, 7); g.fill(); } });
  { const fld = K.add(K.tplane(120, 80, 1), K.toon({ map: ctex(fieldC, 4, 3) }), 0, 0, 20, PG, false); fld.rotation.x = -Math.PI / 2; }
  // the dike: a long grassy embankment with a brick-and-timber sluice in it
  const dikeS = new THREE.Shape(); dikeS.moveTo(-1.8, 0); dikeS.lineTo(1.8, 0); dikeS.lineTo(0.7, 1.25); dikeS.lineTo(-0.7, 1.25); dikeS.lineTo(-1.8, 0);
  const grassM = K.toon({ color: '#58b03a' }), dikeTop = K.toon({ color: '#c8a870' });
  for (const [x0, x1] of [[-60, -0.85], [0.85, 60]]) { const geo = new THREE.ExtrudeGeometry(dikeS, { depth: x1 - x0, bevelEnabled: false }); geo.rotateY(Math.PI / 2); const d = K.add(geo, grassM, x0, 0, DIKE_Z, PG); }
  K.add(K.tbox(120, 0.05, 1.4, 1), dikeTop, 0, 1.26, DIKE_Z, PG);
  const seaW = makeWater(PG, 0, SEA_Y, -30, 160, 52, 60, 30, '#d8f0ff');
  // sluice: brick piers, two timber gate leaves that swing open, a capstan wheel on top for the dike-keeper
  const SL = K.grp(PG, GATE[0], 0, GATE[2]); const brickM = K.mat('brick', { seed: 5, lig: 50 });
  for (const sx of [-1, 1]) K.add(K.tbox(0.6, 1.6, 2.6, 0.6), brickM, sx * 1.15, 0.8, 0, SL);
  K.add(K.tbox(2.9, 0.3, 0.6, 0.6), brickM, 0, 1.75, 0, SL);
  const plankM = K.mat('planks', { seed: 9, lig: 38 }); const leafL = K.grp(SL, -0.85, 0, -0.9), leafR = K.grp(SL, 0.85, 0, -0.9);
  for (const [lf, sx] of [[leafL, 1], [leafR, -1]]) { K.add(K.tbox(0.85, 1.4, 0.12, 0.6), plankM, sx * 0.425, 0.7, 0, lf); for (const y of [0.3, 1.1]) K.add(new THREE.BoxGeometry(0.86, 0.06, 0.14), K.M.iron, sx * 0.425, y, 0.01, lf); }
  const WHEEL = K.grp(SL, 0, 1.95, 0.35); for (let k = 0; k < 4; k++) { const sp = K.add(new THREE.BoxGeometry(0.06, 0.9, 0.06), K.M.woodD, 0, 0, 0, WHEEL); sp.rotation.z = k * Math.PI / 4; }
  K.add(new THREE.TorusGeometry(0.45, 0.04, 8, 28), K.M.woodD, 0, 0, 0, WHEEL); K.add(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), K.M.iron, 0, 0, 0, WHEEL).rotation.x = Math.PI / 2;
  // the gush of water through the open gate + foam
  const gushM = K.toon({ map: ctex(waterC, 1, 2), color: '#e8f8ff', transparent: true, opacity: 0.92, emissive: '#2a7ac0', emissiveIntensity: 0.2 });
  const gush = K.add(new THREE.PlaneGeometry(1.6, 3.2, 8, 16), gushM, 0, 0.55, 0.6, SL, false); gush.rotation.x = -1.15; const gushT = gush.material.map;
  const foam = []; for (let i = 0; i < 46; i++) { const m = K.add(new THREE.SphereGeometry(0.05 + rnd(i) * 0.08, 8, 6), K.toon({ color: '#ffffff' }), 0, 0, 0, PG, false); foam.push(m); }
  // the flood water over the fields (rises to knee-deep) and the field ditches (always water)
  const flood = makeWater(PG, 0, -0.12, 18, 120, 42, 80, 40, '#ffffff', 0.9);
  const ditchM = K.toon({ color: '#2a7ab8' });
  for (const z of [4.2, 13.5]) K.add(K.tbox(120, 0.06, 0.7, 4), ditchM, 0, -0.02, z, PG, false);
  const ditchX = K.add(K.tbox(0.8, 0.06, 60, 4), ditchM, DITCH_X, -0.02, 18, PG, false);
  // windmills (sails turn), farmhouse, haystacks, cows, tulip strip
  const mills = [];
  const windmill = (x, z, s = 1, ry = 0) => { const g = K.grp(PG, x, 0, z, ry); K.add(new THREE.CylinderGeometry(0.9 * s, 1.3 * s, 3.6 * s, 10), K.toon({ color: '#c8402a' }), 0, 1.8 * s, 0, g);
    K.add(new THREE.ConeGeometry(1.1 * s, 1.2 * s, 10), K.toon({ color: '#3a3a44' }), 0, 4.2 * s, 0, g); K.add(new THREE.BoxGeometry(0.5 * s, 0.8 * s, 0.1), K.toon({ color: '#3a2a20' }), 0, 0.4 * s, 1.25 * s, g);
    const hub = K.grp(g, 0, 3.6 * s, 1.15 * s); const sailM = K.toon({ color: '#f4ecd8', side: THREE.DoubleSide });
    for (let k = 0; k < 4; k++) { const arm = K.grp(hub, 0, 0, 0); arm.rotation.z = k * Math.PI / 2; K.add(new THREE.BoxGeometry(0.1, 2.6 * s, 0.06), K.M.woodD, 0, 1.3 * s, 0, arm); K.add(new THREE.PlaneGeometry(0.55 * s, 2.0 * s), sailM, 0.32 * s, 1.5 * s, 0.03, arm); }
    mills.push(hub); return g; };
  windmill(-9, 9, 1.1, 0.4); windmill(12, 16, 1.3, -0.3); windmill(-18, 22, 1.2, 0.2);
  { const H = K.grp(PG, 7.5, 0, 4.0, -0.4); K.add(K.tbox(2.6, 1.6, 2.0, 1), K.mat('brick', { seed: 21, lig: 46, hue: 8 }), 0, 0.8, 0, H);
    const roof = new THREE.Shape(); roof.moveTo(-1.5, 0); roof.lineTo(1.5, 0); roof.lineTo(0, 1.3); roof.lineTo(-1.5, 0); const rg = new THREE.ExtrudeGeometry(roof, { depth: 2.3, bevelEnabled: false }); rg.translate(0, 1.6, -1.15); K.add(rg, K.toon({ color: '#d84a2a' }), 0, 0, 0, H);
    K.add(new THREE.BoxGeometry(0.5, 0.7, 0.05), K.toon({ color: '#2a6a3a' }), 0, 0.35, 1.01, H); for (const x of [-0.8, 0.8]) K.add(new THREE.BoxGeometry(0.45, 0.45, 0.05), K.toon({ color: '#fff2c0', emissive: '#ffcf60', emissiveIntensity: 0.15 }), x, 1.05, 1.01, H); }
  for (const [x, z] of [[4.5, 6.5], [5.6, 7.6], [-6, 4.8]]) K.add(new THREE.ConeGeometry(0.7, 1.2, 12), K.toon({ color: '#f0c850' }), x, 0.6, z, PG);
  const cowC = P(256, 128, (g, W, H) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.fillStyle = '#1e1e24'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(rnd(i, 1) * W, rnd(i, 2) * H, 18 + rnd(i, 3) * 24, 12 + rnd(i, 4) * 16, rnd(i, 5) * 3, 0, 7); g.fill(); } });
  const cowM = K.toon({ map: ctex(cowC) }), cows = [];
  const cow = (x, z, ry) => { const g = K.grp(PG, x, 0, z, ry); K.add(new THREE.BoxGeometry(1.0, 0.5, 0.45), cowM, 0, 0.62, 0, g); K.add(new THREE.BoxGeometry(0.34, 0.32, 0.3), cowM, 0.62, 0.78, 0, g); K.add(new THREE.BoxGeometry(0.16, 0.16, 0.26), K.toon({ color: '#ffb0b8' }), 0.82, 0.7, 0, g);
    for (const [lx, lz] of [[-0.38, -0.15], [-0.38, 0.15], [0.38, -0.15], [0.38, 0.15]]) K.add(new THREE.BoxGeometry(0.1, 0.4, 0.1), cowM, lx, 0.2, lz, g); for (const s of [-1, 1]) K.add(new THREE.ConeGeometry(0.03, 0.1, 6), K.toon({ color: '#f2e6c0' }), 0.62, 0.98, s * 0.11, g); cows.push(g); return g; };
  cow(-3.2, 5.6, 0.6); cow(-1.8, 6.4, -0.3); cow(-4.5, 6.9, 1.4);
  for (let i = 0; i < 120; i++) K.add(new THREE.SphereGeometry(0.07, 8, 6), K.toon({ color: ['#e8302a', '#ffd23f', '#ff7ab0', '#ffffff', '#ff8a2a'][i % 5] }), -14 + (i % 60) * 0.47, 0.1, 10.6 + Math.floor(i / 60) * 0.3, PG, false);
  // the road the French march on + the French cannon + horse
  { const road = K.add(K.tplane(80, 2.2, 6), K.mat('dirt', { seed: 31, lig: 58, hue: 34 }), -10, 0.012, ROAD_Z, PG, false); road.rotation.x = -Math.PI / 2; }
  const CANNON = K.grp(PG, 1.6, 0, 9.4, 0.3); const bronze = K.toon({ color: '#b8862a', emissive: '#5a3a00', emissiveIntensity: 0.15 });
  K.add(new THREE.CylinderGeometry(0.11, 0.16, 1.3, 14), bronze, 0, 0.55, 0, CANNON).rotation.z = Math.PI / 2 - 0.1; for (const z of [-0.28, 0.28]) { const wh = K.add(new THREE.TorusGeometry(0.28, 0.05, 6, 16), K.M.woodD, 0.1, 0.3, z, CANNON); }
  K.add(new THREE.BoxGeometry(0.9, 0.12, 0.4), K.M.woodD, -0.25, 0.32, 0, CANNON);
  const HORSE = K.grp(PG, 5.6, 0, 8.4, -0.2); HORSE.scale.setScalar(0.85); const horseM = K.toon({ color: '#8a5228' }), maneM = K.toon({ color: '#2a1a12' });
  const hb = K.grp(HORSE, 0, 0, 0); K.add(new THREE.BoxGeometry(1.1, 0.45, 0.38), horseM, 0, 0.95, 0, hb); const neck = K.grp(hb, 0.5, 1.05, 0); K.add(new THREE.BoxGeometry(0.22, 0.6, 0.22), horseM, 0.08, 0.28, 0, neck).rotation.z = -0.5;
  K.add(new THREE.BoxGeometry(0.4, 0.2, 0.2), horseM, 0.36, 0.58, 0, neck); K.add(new THREE.BoxGeometry(0.08, 0.5, 0.1), maneM, -0.04, 0.32, 0, neck).rotation.z = -0.5;
  const hLegs = []; for (const [lx, lz] of [[-0.42, -0.12], [-0.42, 0.12], [0.42, -0.12], [0.42, 0.12]]) { const l = K.grp(hb, lx, 0.78, lz); K.add(new THREE.BoxGeometry(0.1, 0.78, 0.1), horseM, 0, -0.39, 0, l); hLegs.push(l); }
  K.add(new THREE.BoxGeometry(0.08, 0.5, 0.08), maneM, -0.6, 0.85, 0, hb).rotation.z = 0.5;
  // a floating French hat (for the soldier who vanishes into the hidden ditch)
  const hat = K.grp(PG, DITCH_X, FLOOD, 9.0); K.add(new THREE.CylinderGeometry(0.16, 0.14, 0.24, 14), K.toon({ color: '#1e2a5a' }), 0, 0.1, 0, hat); K.add(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 16), K.toon({ color: '#1e1e24' }), 0, -0.01, 0, hat); K.add(new THREE.SphereGeometry(0.045, 8, 6), K.toon({ color: '#ffffff' }), 0, 0.25, 0.06, hat);
  const ripple = K.add(new THREE.RingGeometry(0.2, 0.26, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false }), DITCH_X, FLOOD + 0.01, 9.0, PG, false); ripple.rotation.x = -Math.PI / 2; K.noInk(ripple);
  const motesPD = K.motes(PG, { n: 50, box: [-4, 0.4, 3, 6, 3.4, 11], col: '#fff0c8', speed: 0.0015 });
  // ======================= GLASS CUTAWAY of the flooded polder =======================
  const CG = K.grp(K.scene, XC, 0, 0); const TW = 7, TD = 2.2;
  const soilC = P(1024, 512, (g, W, H) => { g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, W, H); g.fillStyle = '#5cb83a'; g.fillRect(0, 0, W, 26);
    for (let i = 0; i < 20; i++) { g.strokeStyle = 'rgba(40,25,15,.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 40 + i * 24); for (let x = 0; x <= W; x += 64) g.lineTo(x, 40 + i * 24 + Math.sin(i + x * 0.01) * 4); g.stroke(); }
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${rnd(i) < 0.5 ? '40,25,15' : '255,240,220'},${0.06 + rnd(i, 1) * 0.08})`; g.beginPath(); g.arc(rnd(i, 2) * W, rnd(i, 3) * H, 1 + rnd(i, 4) * 3, 0, 7); g.fill(); } });
  const soilM = K.toon({ map: ctex(soilC) }), soilSide = K.mat('dirt', { seed: 41, lig: 36, hue: 30 });
  const DX0 = 1.0, DW = 1.1, DD = 1.5;          // the hidden ditch: x from DX0 to DX0+DW, depth DD below the field
  for (const [x0, x1] of [[-TW / 2, DX0], [DX0 + DW, TW / 2]]) { const w = x1 - x0; K.add(new THREE.BoxGeometry(w, 2.4, TD), [soilSide, soilSide, K.toon({ color: '#5cb83a' }), soilSide, soilM, soilSide], (x0 + x1) / 2, -1.2, -TD / 2, CG); }
  K.add(new THREE.BoxGeometry(DW, 2.4 - DD, TD), [soilSide, soilSide, K.toon({ color: '#4a3a2a' }), soilSide, soilM, soilSide], DX0 + DW / 2, -1.2 - DD / 2, -TD / 2, CG);
  // water layer in a glass tank: knee-deep over the field, deep over the ditch
  const tankW = K.glass(new THREE.BoxGeometry(TW, FLOOD * 3.2 + 0.6, TD), { tint: '#cfefff', opacity: 0.03, rim: 0.3 }); tankW.position.set(XC, (FLOOD * 3.2 + 0.6) / 2 - 0.02, -TD / 2); K.scene.add(tankW);
  const cutWaterM = K.toon({ color: '#3aa8e8', transparent: true, opacity: 0.55, emissive: '#1a5a9a', emissiveIntensity: 0.15 });
  const WL = FLOOD * 3.2;                         // the cutaway is drawn bigger: knee-deep water = 0.9 m in this model
  K.add(new THREE.BoxGeometry(TW, WL, TD), cutWaterM, 0, WL / 2, -TD / 2, CG, false);
  K.add(new THREE.BoxGeometry(DW, DD, TD), cutWaterM, DX0 + DW / 2, -DD / 2, -TD / 2, CG, false);
  const surf = makeWater(CG, 0, WL, -TD / 2, TW, TD, 30, 6, '#ffffff', 0.85);
  // a French supply boat stuck: its keel scrapes the field under the water
  const BOAT = K.grp(CG, -2.3, 0, -0.4); BOAT.scale.setScalar(1.1); const bs = new THREE.Shape(); bs.moveTo(-0.9, 0.35); bs.lineTo(0.9, 0.35); bs.lineTo(0.6, -0.05); bs.lineTo(-0.6, -0.05); bs.lineTo(-0.9, 0.35);
  K.add(new THREE.ExtrudeGeometry(bs, { depth: 0.7, bevelEnabled: false }), K.mat('planks', { seed: 43, lig: 40 }), 0, 0.02, -0.35, BOAT); K.add(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), K.M.woodD, 0, 1.1, 0, BOAT);
  K.add(new THREE.PlaneGeometry(0.7, 0.9), K.toon({ color: '#2a3a8a', side: THREE.DoubleSide }), 0.02, 1.15, 0, BOAT).rotation.y = Math.PI / 2;
  const sparks = []; for (let i = 0; i < 10; i++) { const s = K.add(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff2c0' }), 0, 0, 0, CG, false); K.noInk(s); sparks.push(s); }
  K.warmLight(CG, 1.5, 1.6, 4.5, { i: 6.5, dist: 16, col: '#ffe8c8', flicker: 0.01 }); K.warmLight(CG, -2.5, 0.4, 4.0, { i: 4.5, dist: 14, col: '#ffe0b8', flicker: 0.01 });
  K.add(K.tplane(30, 14, 1), K.toon({ color: '#1a141e' }), 0, 1, -3.5, CG, false);
  ST = { waters, seaW, flood, surf, leafL, leafR, WHEEL, gush, gushT, foam, mills, cows, CANNON, HORSE, hb, hLegs, hat, ripple, BOAT, sparks };
  return { update: (W, f) => { const S = shot(f);
    if (S.light !== 'cut') { waves(seaW, f, 0.06); waves(flood, f, 0.03); } else waves(surf, f, 0.02);
    const fl = floodAt(f); flood.position.y = fl; flood.visible = fl > -0.11;
    const g = gateAt(f); leafL.rotation.y = -1.35 * g; leafR.rotation.y = 1.35 * g; WHEEL.rotation.z = -f * (f > 520 && f < 650 ? 0.06 : 0) - (f >= 650 ? 7.8 : f > 520 ? (f - 520) * 0.06 : 0);
    gush.visible = g > 0.05; gushT.offset.y = -f * 0.03; gush.scale.set(1, 0.4 + 0.6 * g, 1);
    foam.forEach((m, i) => { const t = (f * 0.02 + rnd(i, 1)) % 1; m.visible = g > 0.1; m.position.set(XP + GATE[0] + (rnd(i, 2) - 0.5) * 1.6, 0.05 + Math.sin(t * Math.PI) * 0.5, GATE[2] + 1.0 + t * 3.0); m.scale.setScalar(1 - t * 0.6); });
    mills.forEach((h, i) => { h.rotation.z = f * 0.012 + i; });
    cows.forEach((c, i) => { c.position.y = Math.max(0, fl - 0.05) * 0; });
    // the cannon sinks into the ditch; the horse rears
    const ck = S.id === 'chaos' ? E.smooth(ramp(f, 1765, 1830)) : S.a > 1830 ? 1 : 0; CANNON.position.y = -0.55 * ck; CANNON.rotation.z = 0.35 * ck;
    const hk = S.id === 'chaos' ? Math.max(0, Math.sin(ramp(f, 1831, 1901) * Math.PI)) : 0; hb.rotation.z = 0.55 * hk; hb.position.y = 0.15 * hk; hLegs[2].rotation.z = 0.8 * hk; hLegs[3].rotation.z = 0.8 * hk;
    // the hat floats where a soldier vanished
    const hv = S.id === 'chaos' && f >= 1712; hat.visible = hv; ripple.visible = hv; if (hv) { hat.position.y = FLOOD + 0.02 + 0.015 * Math.sin(f * 0.15); hat.rotation.y = f * 0.02; const rk = ramp(f, 1712, 1790); ripple.scale.setScalar(1 + rk * 3); ripple.material.opacity = 0.8 * (1 - rk); }
    // the stuck boat rocks and scrapes (sparks of grit) in the cutaway
    BOAT.rotation.z = 0.03 * Math.sin(f * 0.08); sparks.forEach((s, i) => { const t = (f * 0.03 + rnd(i, 1)) % 1; s.visible = S.light === 'cut' && f >= 1404; s.position.set(-2.2 + (rnd(i, 2) - 0.5) * 1.0, 0.02 + t * 0.25, 0.02); });
  } };
};
// ---------------- cast ----------------
const SK = '#f7f4ee';
const KEEPER = { tunic: '#2a6aa8', stick: true, skin: SK, hair: '#c8862a', hat: 'cowboy', hatCol: '#e8cc78', hatBand: '#ff8a2a', beard: '#c8862a', beardStyle: 'short', apron: '#f2e6c8' };
const FARMER = { tunic: '#d84a2a', stick: true, skin: SK, hair: '#f0d070', cap: '#2a5a8a', pattern: { type: 'dots', col: '#ffffff' } };
const FR = { tunic: '#2a3a8a', stick: true, skin: SK, hair: '#3a2a1c', collar: '#ffffff', hat: 'soldier', hatCol: '#1e2a5a', hatBand: '#d0283a', pattern: { type: 'vstripes', col: 'rgba(255,255,255,.12)', scale: 1.2 } };
const GENERAL = { tunic: '#2a3a8a', stick: true, skin: SK, hair: '#d8d8d8', collar: '#ffffff', tie: '#d0283a', hat: 'tophat', hatCol: '#1e1e24', hatBand: '#d0283a', moustache: '#d8d8d8', stache: 'handlebar' };
const NL = { tunic: '#ff8a2a', stick: true, skin: SK, hair: '#c8862a', hat: 'soldier', hatCol: '#2a2a34', hatBand: '#ff8a2a', pattern: { type: 'stripes', col: 'rgba(255,255,255,.35)' } };
export const actorsAt = (f, T) => {
  const S = shot(f), out = [], u = Math.floor(f / 2);
  const I = (seed) => { const i = idle(u, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const tintL = { cut: '#ffe6c8', golden: '#ffe2c4' }[S.light] || '#ffffff';
  const card = (id, O, o, origin, pos, seed, extra = {}) => { const w = at(origin, pos); out.push({ key: id + JSON.stringify(o) + JSON.stringify(extra), draw: (p) => T.romanFront(p, O, { seed, blink: blinkAt(u, seed), ...I(seed), L: 'hang', R: 'hang', look: 0, ...o }), x: w[0], y: w[1] + (extra.y || 0), z: w[2], s: 0.9, ground: w[1] + (extra.y || 0), tint: tintL, ...extra }); };
  const march = (k) => q(0.06 * Math.abs(Math.sin(f * 0.18 + k)), 3);
  switch (S.id) {
    case 'hook': case 'loop': card('kp', KEEPER, { expr: f < 120 || S.id === 'loop' ? 'stubborn' : 'grin', L: 'grab', R: 'grab', gx: 0.6, gy: 0.3, look: 0.3 }, PD, [GATE[0] + 0.55, 1.26, GATE[2] + 0.75], 21); break;
    case 'army': { const dx = (f - 233) * 0.012; for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) card(`fr${r}${c}`, FR, { expr: r === 0 && c === 1 ? 'smug' : 'stern', look: 1, L: 'hang', R: 'up' }, PD, [-6.5 + r * 1.1 + dx, 0, ROAD_Z - 0.6 + c * 0.42], 30 + r * 4 + c, { y: march(r + c) });
      card('gen', GENERAL, { expr: 'smug', look: 1, L: 'hip', R: 'point' }, PD, [-1.0 + dx, 0, ROAD_Z + 1.4], 61); break; }
    case 'tiny': card('n1', NL, { expr: 'nervous', sweat: 0.8, sweatT: f / 60, L: 'up', R: 'hang', look: -0.3 }, PD, [-0.6, 0, 1.4], 71); card('n2', NL, { expr: 'scared', L: 'cheek', R: 'cheek' }, PD, [0.45, 0, 1.2], 73); card('n3', { ...NL, hatBand: '#ffffff' }, { expr: 'nervous', L: 'hip', R: 'up', look: 0.4 }, PD, [1.4, 0, 1.5], 75); break;
    case 'open': card('kp', KEEPER, { expr: 'stubborn', L: 'grab', R: 'grab', gx: 0.6, gy: 0.3, look: 0.3 }, PD, [GATE[0] + 0.55, 1.26, GATE[2] + 0.75], 21); card('fm', FARMER, { expr: f < 700 ? 'neutral' : 'shock', L: f < 700 ? 'hip' : 'up', R: f < 700 ? 'hang' : 'up', look: -0.4 }, PD, [-2.6, 0, 4.9], 81); break;
    case 'useless': { const wd = clamp((f - 960) / 160); card('gen', GENERAL, { expr: f < 960 ? 'sideeye' : 'smug', L: 'hip', R: f < 960 ? 'hip' : 'point', look: 0.6, talk: f > 990 && f < 1100 ? talkAt(f, 5, 1.1) : 0 }, PD, [-1.2, 0, ROAD_Z + 0.2], 61);
      for (let k = 0; k < 3; k++) card(`w${k}`, FR, { expr: 'grin', L: 'up', R: 'hang', look: 1 }, PD, [0.2 + k * 0.9 + wd * 1.2, 0, ROAD_Z + 1.2 + k * 0.5], 34 + k, { y: march(k) * 0.5 }); break; }
    case 'couldnt': card('w0', FR, { expr: 'shock', L: 'up', R: 'up', look: 0.5 }, PD, [DITCH_X - 0.4, 0, 9.0], 34); break;
    case 'cutaway': card('cw', FR, { expr: f < 1300 ? 'grin' : 'nervous', L: 'up', R: 'hang', look: 0.4 }, CW, [-0.5, 0, 0.12], 34); break;
    case 'chaos': { const sink = clamp((f - 1680) / 40); if (f < 1722) card('w0', FR, { expr: f < 1670 ? 'grin' : 'shock', L: 'up', R: 'up', look: 0.6 }, PD, [DITCH_X - 0.5 + clamp((f - 1610) / 70) * 0.5, 0, 9.0], 34, { y: -1.4 * sink });
      card('w1', FR, { expr: f < 1765 ? 'shock' : 'scared', L: 'cheek', R: 'cheek', look: -0.4 }, PD, [DITCH_X - 1.6, 0, 9.6], 35); card('w2', FR, { expr: 'scared', L: 'up', R: 'up', look: 0.3 }, PD, [DITCH_X + 1.6, 0, 10.4], 36); break; }
    case 'puddle': for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) card(`st${r}${c}`, FR, { expr: ['sick', 'unimpressed', 'cry', 'sleepy'][(r + c) % 4], look: (r % 2) - 0.5, L: 'hang', R: (r + c) % 3 ? 'hang' : 'cheek' }, PD, [-3.5 + r * 1.3, 0, ROAD_Z + 0.6 + c * 0.7], 40 + r * 3 + c);
      card('gen', GENERAL, { expr: 'cry', L: 'cheek', R: 'cheek', look: 0.2 }, PD, [1.8, 0, ROAD_Z + 0.4], 61); break;
  }
  return out;
};
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'open' && f >= 712) out.push(emote('?', f - 712, at(PD, [-2.35, HY + 0.42, 4.9]), { s: 0.18 }));
  if (S.id === 'tiny' && f >= 500) out.push(emote('sweat', f - 500, at(PD, [-0.35, HY + 0.38, 1.4]), { s: 0.14 }));
  if (S.id === 'couldnt' && f >= 1130) out.push(emote('!', f - 1130, at(PD, [DITCH_X - 0.15, HY + 0.42, 9.0]), { s: 0.18 }));
  if (S.id === 'chaos' && f >= 1840) out.push(emote('!', f - 1840, at(PD, [5.9, 1.8, 8.4]), { s: 0.2 }));
  if (S.id === 'puddle' && f >= 1990) out.push(emote('zzz', f - 1990, at(PD, [0.4, HY + 0.4, ROAD_Z + 1.3]), { s: 0.16 }));
  return out; };
// ---------------- camera ----------------
const orbit = (c, ang, d, y) => [c[0] + Math.sin(ang * Math.PI / 180) * d, y, c[2] + Math.cos(ang * Math.PI / 180) * d];
const yawLook = (pos, look, deg) => { const a = deg * Math.PI / 180, dx = look[0] - pos[0], dz = look[2] - pos[2]; return [pos[0] + dx * Math.cos(a) - dz * Math.sin(a), look[1], pos[2] + dx * Math.sin(a) + dz * Math.cos(a)]; };
const HOOK0 = { pos: at(PD, [GATE[0] + 1.25, 2.35, GATE[2] + 3.1]), look: at(PD, [GATE[0] + 0.3, 2.15, GATE[2] + 0.5]), fov: 46 };
const camL = (f) => { const S = shot(f), v = (f - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v);
  switch (S.id) {
    case 'hook': { const k = E.smooth(ramp(f, 90, 230)); return { pos: lerp3(HOOK0.pos, at(PD, [GATE[0] + 1.6, 2.4, GATE[2] + 4.4]), k), look: lerp3(HOOK0.look, at(PD, [GATE[0], 1.0, GATE[2] + 0.8]), k), fov: lerp(46, 54, k) }; }
    case 'army': return { pos: at(PD, lerp3([-2.0, 0.55, ROAD_Z + 3.4], [-0.8, 0.5, ROAD_Z + 3.0], sv)), look: at(PD, lerp3([-4.0, 1.2, ROAD_Z], [-2.2, 1.3, ROAD_Z], sv)), fov: 56 };
    case 'tiny': return { pos: at(PD, lerp3([0.4, 1.4, 5.6], [0.4, 1.45, 5.0], sv)), look: at(PD, [0.4, 1.2, 1.3]), fov: 58 };
    case 'open': { const k = E.smooth(ramp(f, 600, 760)); return { pos: lerp3(at(PD, [GATE[0] + 2.4, 2.6, GATE[2] + 3.8]), at(PD, [-0.5, 3.6, 9.0]), k), look: lerp3(at(PD, [GATE[0], 1.2, GATE[2] + 0.6]), at(PD, [-1.5, 0.3, 4.0]), k), fov: lerp(54, 60, k) }; }
    case 'useless': { const k = E.smooth(ramp(f, 960, 1060)); return { pos: lerp3(at(PD, [-0.2, 1.45, ROAD_Z + 2.3]), at(PD, [2.6, 1.5, ROAD_Z + 4.6]), k), look: lerp3(at(PD, [-1.2, 1.35, ROAD_Z + 0.2]), at(PD, [1.4, 0.7, ROAD_Z + 1.6]), k), fov: lerp(46, 56, k) }; }
    case 'couldnt': return { pos: at(PD, [DITCH_X - 0.1, 0.52, 10.9]), look: at(PD, [DITCH_X - 0.4, 0.85, 9.0]), fov: 56 };
    case 'cutaway': { const k = E.smooth(ramp(f, 1360, 1480)), k2 = E.smooth(ramp(f, 1500, 1600)); return { pos: at(CW, lerp3(lerp3([-0.3, 0.8, 5.6], [-1.8, 0.6, 4.6], k), [1.4, 0.0, 4.6], k2)), look: at(CW, lerp3(lerp3([-0.4, 0.5, -0.3], [-1.9, 0.4, -0.5], k), [1.5, -0.6, -0.5], k2)), fov: 52 }; }
    case 'chaos': { const k = E.smooth(ramp(f, 1815, 1860)); return { pos: at(PD, lerp3(lerp3([DITCH_X + 0.6, 1.3, 12.4], [DITCH_X + 1.0, 1.5, 12.8], sv), [6.4, 1.5, 12.4], k)), look: at(PD, lerp3(lerp3([DITCH_X - 0.2, 0.7, 9.2], [DITCH_X + 0.4, 0.8, 9.6], sv), [5.6, 1.1, 8.4], k)), fov: 56 }; }
    case 'puddle': return { pos: at(PD, lerp3([-0.6, 3.2, ROAD_Z + 7.0], [-0.6, 2.4, ROAD_Z + 5.4], sv)), look: at(PD, [-0.8, 0.8, ROAD_Z + 1.0]), fov: 54 };
    case 'loop': { const k = E.smooth(ramp(f, 2250, 2435)); return { pos: lerp3(at(PD, [GATE[0] - 3.0, 2.6, GATE[2] + 6.0]), HOOK0.pos, k), look: lerp3(at(PD, [GATE[0] + 0.5, 2.6, GATE[2] - 2.0]), HOOK0.look, k), fov: lerp(56, 46, k) }; }
  } };
const cam = (f) => { const S = shot(f), c = camL(f);
  const wi = WHIPS.indexOf(S.b + 1), wo = WHIPS.indexOf(S.a);   // real camera whip: yaw out of the old shot, yaw into the new one
  if (wi >= 0 && f > S.b - 14) c.look = yawLook(c.pos, c.look, 60 * E.easeIn(ramp(f, S.b - 14, S.b + 1)));
  if (wo >= 0 && f < S.a + 18) c.look = yawLook(c.pos, c.look, -60 * (1 - E.easeOut(ramp(f, S.a, S.a + 18))));
  c.shadowAt = c.look; return c; };
export const camAt = cam;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shot(f), C = cam(f), atp = (p, k) => ({ focus: dist(C.pos, p), cinf: k * 0.5 });   // light DOF (STYLE: image quality)
  switch (S.id) {
    case 'hook': case 'loop': return atp(at(PD, [GATE[0] + 0.4, 1.9, GATE[2] + 0.5]), 9);
    case 'army': return atp(at(PD, [-3.2, 1.2, ROAD_Z]), 8);
    case 'tiny': return atp(at(PD, [0.4, HY, 1.3]), 9);
    case 'open': return atp(at(PD, [-0.5, 0.8, 2.0]), 5);
    case 'useless': return atp(at(PD, [-0.6, HY, ROAD_Z + 0.6]), 8);
    case 'couldnt': return atp(at(PD, [DITCH_X - 0.4, 1.0, 9.0]), 10);
    case 'cutaway': return atp(at(CW, [0, 0.2, 0]), 4);
    case 'chaos': return atp(at(PD, [DITCH_X, 0.8, 9.5]), 7);
    case 'puddle': return atp(at(PD, [-0.8, 1.0, ROAD_Z + 1.0]), 5);
  }
  return { focus: 5, cinf: 0 }; };
export const worldAt = (f) => ({});
// ---------------- handwritten labels ----------------
export const annotAt = (f) => { const S = shot(f); if (S.id !== 'cutaway') return [];
  return [...(f < 1370 ? [{ type: 'label', text: 'knee-deep', at: at(CW, [-0.2, FLOOD * 3.2, 0.02]), dx: -60, dy: -300, age: f - 1212 }] : []),
    ...(f >= 1404 ? [{ type: 'label', text: 'boats get stuck', at: at(CW, [-2.2, 0.05, 0.02]), dx: 40, dy: -330, age: f - 1404, bend: 0.25 }] : []),
    ...(f >= 1520 ? [{ type: 'label', text: 'hidden ditch', at: at(CW, [1.55, -0.9, 0.02]), dx: -280, dy: -320, age: f - 1520, bend: -0.25 }, { type: 'circle', at: at(CW, [1.55, -0.75, 0.02]), rw: 0.16, age: f - 1532 }] : [])]; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
