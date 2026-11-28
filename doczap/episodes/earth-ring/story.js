// Doc Zap — "What if Earth had a ring… like Saturn?" (Ordovician, ~466 million years ago; Tomkins et al. 2024)
// Voice: Patrick, Eleven v4 (Diyar's MP3, pauses trimmed, 1.08x). Shot timing from words.json via cues.js (frames @ 60 fps).
// Motion: DocZap Motion Engine v1 (rig channels via kit/act.js; see doczap/docs/ENGINE.md). Look: measured modern grade (ADR-002).
import { M as E, clamp, lerp, lerp3, ramp, q } from './motion.js';
import { LP, tint } from './kit/lights.js';
import { emote } from './kit/emotes.js';
import { arms, react, reacts, ease, pick, idle3, blinkV, shiver3, lookSeq, vnoise, ease2, nod, shake } from './kit/act.js';
import { CUE, TOTAL_FRAMES } from './cues.js';
export const FPS = 60, TOTAL = TOTAL_FRAMES, DECK = 0, LOOK = 'modern';
const SHOTDEF = [['hook', 0, 'shore'], ['space', CUE.space, 'space'], ['picture', CUE.picture, 'night'], ['asteroid', CUE.asteroid, 'space'], ['tear', CUE.tear, 'space'],
  ['rain', CUE.rain, 'space'], ['lab', CUE.lab, 'lab'], ['tropics', CUE.tropics, 'lab'], ['worse', CUE.worse, 'shore'], ['shadow', CUE.shadow, 'space'], ['frozen', CUE.frozen, 'frozen'], ['loop', CUE.loop, 'shore']];
const SH = SHOTDEF.map(([id, a, light], i) => [id, a, (SHOTDEF[i + 1] ? SHOTDEF[i + 1][1] : TOTAL) - 1, light]);
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a, b, light }));
export const WHIPS = [CUE.space, CUE.picture, CUE.asteroid, CUE.lab, CUE.worse, CUE.shadow, CUE.frozen];   // tear, rain, tropics, loop = hard cuts
export const WHIP_FRAMES = WHIPS.map((a) => [a - 14, a + 18]);
export const TRANSITIONS = SH.slice(1).map(([, a]) => ({ at: a, type: 'cut' }));
export const CUTS = [];
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = shot;
export const LIGHTS = {
  shore: tint(LP.sunset, { sun: '#ffb070', sunI: 0.9, az: 250, el: 9, skyTop: '#2a2a6a', skyHor: '#ff9a6a', sky: '#9a88b8', ground: '#5a3a2a', fog: '#8a6a7a', fogNear: 20, fogFar: 140, rimCol: '#ffb070', shadowExt: 8 }),
  night: tint(LP.sunset, { sun: '#c8b8ff', sunI: 0.55, az: 200, el: 25, skyTop: '#0e1240', skyHor: '#4a3a7a', sky: '#6a6aa8', ground: '#2a2440', fog: '#2a2a50', fogNear: 20, fogFar: 140, rimCol: '#ffd8a0', shadowExt: 8 }),
  frozen: tint(LP.sunset, { sun: '#ffc890', sunI: 0.8, az: 250, el: 10, skyTop: '#3a4a8a', skyHor: '#ffb090', sky: '#a8b8d8', ground: '#c8d0e0', fog: '#b8c0d8', fogNear: 15, fogFar: 110, rimCol: '#ffc890', shadowExt: 8 }),
  space: tint(LP.night, { sun: '#fff0dc', sunI: 1.6, az: 300, el: 15, sky: '#1a2040', ground: '#0a0a14', hemi: 0.35, fog: '#05060c', fogNear: 200, fogFar: 600, rimCol: '#8ab8ff', shadowExt: 8 }),
  lab: tint(LP.indoor, { sky: '#ffe2c0', ground: '#3a2a20', hemi: 0.85, sun: '#ffd8a8', sunI: 0.8, az: 210, el: 35, fog: '#3a2a20', fogNear: 6, fogFar: 22, rimCol: '#ffc080', shadowExt: 6 }),
};
const MODL = { shore: { env: 0.8, hemiK: 0.7 }, night: { env: 0.6, hemiK: 0.8, expo: 1.75, gain: '#fff2e4' }, frozen: { env: 0.9, hemiK: 0.7 }, space: { env: 0.3, hemiK: 0.25, expo: 1.95, gain: '#fff0dc' }, lab: { env: 0.8, hemiK: 0.8 } };
for (const k in LIGHTS) { const L = LIGHTS[k]; LIGHTS[k] = { ...L, sunI: L.sunI * 1.45, hemiK: 0.2, expo: 1.45, shadowExt: (L.shadowExt ?? 10) * 2.2, con: 1.0, sat: (L.sat ?? 1.16) * 0.64, gain: '#faf4f6', shCol: '#f5f0ff', hiCol: '#fff5f0', fogNear: L.fogNear * 1.5, fogFar: L.fogFar * 1.7, ao: 0.35, bloom: (L.bloom ?? 0.5) * 0.8, bthr: Math.max((L.bthr ?? 1) * 1.9, 1.55), vig: Math.max(L.vig ?? 0.22, 0.4), inkA: 0.75, ...(MODL[k] || {}) }; }
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- layout ----------------
const XA = 100000, XB = 102000, XC = 104000;
const A = (x, y, z) => [XA + x, y, z], B = (x, y, z) => [XB + x, y, z], C = (x, y, z) => [XC + x, y, z];
const ER = 2.0;                       // Earth radius in the space set
let ST = {};
const rnd = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
// Ordovician continents (lon, lat in degrees, radius deg): Gondwana sprawls over the south; Laurentia, Baltica, Siberia near the equator
const LANDS = [[20, -55, 38], [55, -35, 28], [-15, -30, 24], [95, -20, 20], [120, -5, 16], [-60, 5, 17], [-35, -5, 9], [10, 0, 10], [150, 15, 11], [-95, 20, 7]];
// 21 crater sites, all within 30 degrees of the (Ordovician) equator
const CRATERS = Array.from({ length: 21 }, (_, i) => [((i * 47 + 13) % 300) - 150 + rnd(i, 2) * 20, (rnd(i, 5) - 0.5) * 52]);
export const sets = (K) => {
  const { THREE, prop } = K;
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  // ---- the Ordovician Earth map (equirectangular), used for the globe AND the lab wall map ----
  const blob = (g, W, H, lon, lat, r, col, k) => { const x = (lon + 180) / 360 * W, y = (90 - lat) / 180 * H, rr = r / 360 * W; g.fillStyle = col; g.beginPath();
    for (let a = 0; a <= 64; a++) { const t = a / 64 * Math.PI * 2, rad = rr * (0.75 + 0.25 * Math.sin(t * 3 + k) + 0.12 * Math.sin(t * 7 + k * 2)); g.lineTo(x + Math.cos(t) * rad, y + Math.sin(t) * rad * 0.9); } g.fill(); };
  const mapCanvas = (opts = {}) => cv(1024, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1e4a7a'); gr.addColorStop(0.5, '#1a5a8e'); gr.addColorStop(1, '#1e4a7a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + rnd(i, 1) * 0.03})`; g.fillRect(rnd(i, 2) * W, rnd(i, 3) * H, 30 * rnd(i, 4), 3); }
    LANDS.forEach(([lo, la, r], i) => blob(g, W, H, lo, la, r * 1.18, 'rgba(110,190,200,.55)', i));         // shallow seas
    LANDS.forEach(([lo, la, r], i) => blob(g, W, H, lo, la, r, i % 3 ? '#b8875a' : '#a8784a', i));              // barren land (no plants on land yet)
    LANDS.forEach(([lo, la, r], i) => blob(g, W, H, lo + 3, la - 2, r * 0.45, 'rgba(120,80,50,.6)', i + 5));
    if (opts.ice) { g.fillStyle = '#f4f8ff'; LANDS.forEach(([lo, la, r], i) => { if (la < -20) blob(g, W, H, lo, la - 6, r * 0.8, '#eef4ff', i + 9); }); g.fillRect(0, H * 0.86, W, H * 0.14); }
    if (opts.grid) { g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let lo = -150; lo <= 180; lo += 30) { const x = (lo + 180) / 360 * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let la = -60; la <= 60; la += 30) { const y = (90 - la) / 180 * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } } });
  const earthTex = ctex(mapCanvas()), iceTex = ctex(mapCanvas({ ice: true }));
  const cloudTex = ctex(cv(1024, 512, (g, W, H) => { for (let i = 0; i < 160; i++) { const x = rnd(i, 7) * W, y = (0.15 + 0.7 * rnd(i, 8)) * H, r = 6 + rnd(i, 9) * 18; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }));
  // ring texture: concentric bands, mapped through RingGeometry's planar UVs
  const ringTex = (night, t0 = 0.62) => ctex(cv(2048, 2048, (g, W, H) => { const c = W / 2; for (let r = 0; r < c; r++) { const t = r / c; if (t < t0) continue; const u_ = (t - t0) / (1 - t0), band = 0.55 + 0.45 * Math.sin(u_ * 55) * Math.sin(u_ * 14 + 1);
      const a = Math.max(0.08, band) * Math.min(1, u_ / 0.08) * Math.min(1, (1 - u_) / 0.08) * (night ? 0.95 : 0.85); g.strokeStyle = `rgba(${night ? '255,236,210' : '255,226,190'},${a})`; g.lineWidth = 1.6; g.beginPath(); g.arc(c, c, r, 0, 7); g.stroke(); } }));
  const RT = ringTex(false), RTN = ringTex(true, 0.92), RTA = ringTex(false, 0.92);
  const starTex = ctex(cv(2048, 1024, (g, W, H) => { g.fillStyle = '#04050c'; g.fillRect(0, 0, W, H); for (let i = 0; i < 2600; i++) { const s = rnd(i, 1) < 0.92 ? 1 : 2; g.fillStyle = `rgba(255,${230 + rnd(i, 3) * 25 | 0},${200 + rnd(i, 4) * 55 | 0},${0.35 + rnd(i, 2) * 0.65})`; g.fillRect(rnd(i, 5) * W, rnd(i, 6) * H, s, s); }
    const gr = g.createRadialGradient(W * 0.7, H * 0.4, 0, W * 0.7, H * 0.4, H * 0.7); gr.addColorStop(0, 'rgba(150,90,120,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }));
  const glowSprite = (col) => ctex(cv(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  const flashTex = glowSprite('rgba(255,230,180,1)');
  const rockGeo = (seed, r = 1) => { const geo = new THREE.IcosahedronGeometry(r, 2), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), n = 1 + 0.28 * Math.sin(v.x * 3.1 + seed) * Math.sin(v.y * 2.7 + seed * 2) + 0.12 * Math.sin(v.z * 7 + seed); v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; };
  const rockM = K.toon({ color: '#7a6858' }); rockM.userData = { rough: 0.9 };

  // ======================= A. THE ORDOVICIAN SHORE (dusk / night / frozen) =======================
  const AG = K.grp(K.scene, XA, 0, 0);
  const skyM = (top, mid, hor) => new THREE.MeshBasicMaterial({ map: ctex(cv(256, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(0.55, mid); gr.addColorStop(0.82, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (top < '#3') for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd(i, 1) * 0.6})`; g.fillRect(rnd(i, 2) * W, rnd(i, 3) * H * 0.6, 1.2, 1.2); } })), side: THREE.BackSide, fog: false });
  ST.skies = { shore: skyM('#3a2a60', '#c0687a', '#ffaa70'), night: skyM('#1a0e30', '#4a2a6a', '#8a4a7a'), frozen: skyM('#3a3a7a', '#b88aa8', '#ffb890') };
  ST.skyDome = K.noInk(K.add(new THREE.SphereGeometry(300, 32, 16), ST.skies.shore, 0, 0, 0, AG, false));
  // the sun on the horizon
  ST.sunDisk = K.noInk(K.add(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: '#ffd8a0', fog: false }), -60, 6, -230, AG, false)); ST.sunDisk.material.color.multiplyScalar(2.4);
  // THE RING: a huge banded arch across the sky (a giant flat ring whose centre sits far below the horizon)
  ST.arch = K.noInk(K.add(new THREE.RingGeometry(116, 131, 240, 1), new THREE.MeshBasicMaterial({ map: RTA, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), -45, -52, -85, AG, false));
  ST.arch.rotation.set(-0.38, 0.18, 0.5); ST.arch.material.color.setRGB(1.6, 1.45, 1.3);
  // ground: barren rock beach, tide pools, the sea, distant headlands
  const sandM = K.mat('stone', { seed: 5, lig: 46, hue: 28, sat: 26 }); ST.sandM = sandM;
  const ground = K.add(new THREE.PlaneGeometry(120, 80, 1, 1), sandM, 0, 0, -10, AG, false); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  const seaM = new THREE.MeshStandardMaterial({ color: '#2a5a7a', roughness: 0.12, metalness: 0.3 }); ST.seaM = seaM;
  const sea = K.add(new THREE.PlaneGeometry(600, 300), seaM, 0, -0.02, -170, AG, false); sea.rotation.x = -Math.PI / 2; K.noInk(sea);
  ST.rocks = []; for (let i = 0; i < 26; i++) { const r = K.add(rockGeo(i, 0.25 + rnd(i, 1) * 0.9), rockM, (rnd(i, 2) - 0.5) * 26, 0.05, -2 - rnd(i, 3) * 14, AG); r.rotation.set(rnd(i, 4), rnd(i, 5) * 6, 0); r.scale.y = 0.5 + rnd(i, 6) * 0.5; ST.rocks.push(r); }
  for (let i = 0; i < 6; i++) { const h = K.add(rockGeo(40 + i, 1), K.toon({ color: '#5a4a5a' }), -60 + i * 26, 0, -110 - rnd(i, 7) * 30, AG); h.scale.set(14 + rnd(i, 8) * 10, 6 + rnd(i, 9) * 8, 8); }
  const moss = K.toon({ color: '#6a8a4a' }); for (let i = 0; i < 10; i++) { const m = K.add(new THREE.CircleGeometry(0.3 + rnd(i, 3) * 0.4, 12), moss, (rnd(i, 1) - 0.5) * 10, 0.012, -1 - rnd(i, 2) * 8, AG, false); m.rotation.x = -Math.PI / 2; }
  // snow (frozen) and meteors streaking down from the ring
  const snowM = K.toon({ color: '#eef2fa' }); snowM.userData = { rough: 0.6, envK: 1.2 };
  ST.snow = K.add(new THREE.PlaneGeometry(120, 80), snowM, 0, 0.01, -10, AG, false); ST.snow.rotation.x = -Math.PI / 2; ST.snow.receiveShadow = true;
  const flakeTex = ctex(cv(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }));
  ST.flakes = Array.from({ length: 70 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flakeTex, transparent: true, depthWrite: false, opacity: 0.95, fog: false })); s.material.color.setRGB(1.4, 1.4, 1.5); s.scale.setScalar(0.05 + rnd(i, 3) * 0.05); AG.add(s); return s; });
  ST.meteors = Array.from({ length: 8 }, (_, i) => { const m = new THREE.MeshBasicMaterial({ color: '#ffd090', transparent: true, opacity: 0, fog: false }); m.color.multiplyScalar(2); const t = K.noInk(K.add(new THREE.CylinderGeometry(0.0, 0.5, 18, 8), m, 0, -50, 0, AG, false)); return t; });

  // ======================= B. SPACE: the ringed Earth, the asteroid, the rocks raining down =======================
  const BG = K.grp(K.scene, XB, 0, 0);
  K.noInk(K.add(new THREE.SphereGeometry(400, 48, 24), new THREE.MeshBasicMaterial({ map: starTex, side: THREE.BackSide, fog: false }), 0, 0, 0, BG, false));
  { const sun = new THREE.DirectionalLight('#ffe6c4', 4.0); sun.position.set(-6, 3, 7); BG.add(sun); sun.target.position.set(0, 0, 0); BG.add(sun.target); const fill = new THREE.AmbientLight('#3a4a7a', 0.35); BG.add(fill); }
  ST.earth = K.grp(BG, 0, 0, 0); ST.earth.rotation.z = 0.32;      // axial tilt
  const earthM = new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.55, metalness: 0.05, emissive: '#ffffff', emissiveMap: earthTex, emissiveIntensity: 0.08 }); ST.earthM = earthM;
  ST.globe = K.noInk(K.add(new THREE.SphereGeometry(ER, 96, 48), earthM, 0, 0, 0, ST.earth, false));
  ST.iceM = new THREE.MeshStandardMaterial({ map: iceTex, roughness: 0.4, transparent: true, opacity: 0 }); ST.ice = K.noInk(K.add(new THREE.SphereGeometry(ER * 1.002, 96, 48), ST.iceM, 0, 0, 0, ST.earth, false));
  ST.clouds = K.noInk(K.add(new THREE.SphereGeometry(ER * 1.015, 64, 32), new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, opacity: 0.45, depthWrite: false, roughness: 1 }), 0, 0, 0, ST.earth, false));
  const atm = K.noInk(K.add(new THREE.SphereGeometry(ER * 1.04, 64, 32), new THREE.MeshBasicMaterial({ color: '#6ab0ff', transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0, 0, 0, ST.earth, false));
  // the ring's shadow on the globe: a dark band that sweeps (south of the equator in this season)
  ST.shadowM = new THREE.MeshBasicMaterial({ map: ctex(cv(64, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,20,0)'); gr.addColorStop(0.55, 'rgba(0,0,20,0)'); gr.addColorStop(0.6, 'rgba(0,0,30,.85)'); gr.addColorStop(0.82, 'rgba(0,0,30,.85)'); gr.addColorStop(0.88, 'rgba(0,0,20,0)'); gr.addColorStop(1, 'rgba(0,0,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); })), transparent: true, opacity: 0, depthWrite: false, fog: false });
  ST.shadowBand = K.noInk(K.add(new THREE.SphereGeometry(ER * 1.02, 64, 32), ST.shadowM, 0, 0, 0, ST.earth, false));
  ST.ringM = new THREE.MeshBasicMaterial({ map: RT, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false }); ST.ringM.color.setRGB(1.7, 1.5, 1.25);
  ST.ring = K.noInk(K.add(new THREE.RingGeometry(ER * 1.35, ER * 2.3, 180, 1), ST.ringM, 0, 0, 0, ST.earth, false)); ST.ring.rotation.x = -Math.PI / 2;
  // the asteroid and its fragments
  ST.asteroid = K.add(rockGeo(7, 0.5), rockM, 0, -50, 0, BG);
  ST.frags = Array.from({ length: 70 }, (_, i) => { const s = 0.025 + rnd(i, 1) * 0.06; const r = K.add(rockGeo(i + 100, s), rockM, 0, -50, 0, BG); r.castShadow = false; return r; });
  ST.flashes = Array.from({ length: 10 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false })); BG.add(s); return s; });
  ST.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('rgba(255,240,210,1)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); 

  // ======================= C. THE LAB (2024): the geologist, the globe, the crater map =======================
  const RC = K.room({ x: XC, w: 5.5, d: 5, h: 2.9, floor: 'planks', wall: 'plaster', wallOpts: { seed: 61, col: [28, 30, 62], bricks: 0, stains: 0.05 }, floorOpts: { seed: 62, hue: 28, sat: 36, lig: 38 }, ceil: 'flat' });
  prop.table(RC, { x: 0.2, z: -0.6, w: 1.5, d: 0.75 });
  { const gb = K.grp(RC, -0.25, 0.79, -0.65); K.add(new THREE.CylinderGeometry(0.09, 0.12, 0.05, 20), K.M.brass || K.toon({ color: '#c8a040' }), 0, 0.025, 0, gb); K.add(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), K.toon({ color: '#c8a040' }), 0, 0.09, 0, gb);
    ST.labGlobe = K.add(new THREE.SphereGeometry(0.16, 48, 24), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.4 }), 0, 0.3, 0, gb); ST.labGlobe.rotation.z = 0.32; }
  // the wall map: the Ordovician world, a tropics band (±30°) that lights up, and 21 crater pins
  const MW = 2.6, MH = 1.3, mapZ = -2.45;
  { const fr = K.add(new THREE.BoxGeometry(MW + 0.12, MH + 0.12, 0.05), K.toon({ color: '#5a3a24' }), 0, 1.65, mapZ - 0.03, RC);
    K.add(new THREE.PlaneGeometry(MW, MH), K.toon({ map: ctex(mapCanvas({ grid: true })) }), 0, 1.65, mapZ, RC, false); }
  ST.bandM = new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0, depthWrite: false }); ST.band = K.noInk(K.add(new THREE.PlaneGeometry(MW, MH * 60 / 180), ST.bandM, 0, 1.65, mapZ + 0.005, RC, false));
  ST.pins = CRATERS.map(([lo, la], i) => { const p = K.grp(RC, (lo / 360) * MW, 1.65 + (la / 180) * MH, mapZ + 0.01); K.add(new THREE.SphereGeometry(0.025, 12, 8), K.toon({ color: '#e0302a' }), 0, 0, 0.03, p); K.add(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 6), K.M.iron, 0, 0, 0.012, p).rotation.x = Math.PI / 2; p.visible = false; return p; });
  prop.lamp && prop.lamp(RC, { x: 0.75, z: -0.75, y: 0.79 });
  K.bulb(RC, 1.9, 2.4, -1.4, { size: 0.06, i: 1.4, dist: 5, col: '#ffd8a0' });
  prop.shelf(RC, { x: 2.6, z: -1.2, ry: -Math.PI / 2, w: 1.4, h: 1.9, seed: 4 });
  for (let i = 0; i < 4; i++) K.add(rockGeo(200 + i, 0.05), rockM, -0.55 + i * 0.12, 0.81, -0.35, RC);

  const SETG = { shore: AG, night: AG, frozen: AG, space: BG, lab: RC };
  return { update: (W, f) => {
    for (const k in SETG) SETG[k].visible = false; SETG[W.set].visible = true;
    // shore variants
    const mode = W.set === 'night' ? 'night' : W.set === 'frozen' ? 'frozen' : 'shore';
    ST.skyDome.material = ST.skies[mode]; ST.arch.material.map = mode === 'night' ? RTN : RTA; ST.arch.material.opacity = W.archK ?? 1; ST.arch.visible = (W.archK ?? 1) > 0.01;
    ST.snow.visible = mode === 'frozen'; ST.sunDisk.visible = mode !== 'night';
    ST.seaM.color.set(mode === 'frozen' ? '#9ab8d0' : mode === 'night' ? '#1a2a5a' : '#2a5a7a');
    ST.flakes.forEach((s, i) => { s.visible = mode === 'frozen'; const t = ((f * 0.004 + rnd(i, 1)) % 1); s.position.set((rnd(i, 2) - 0.5) * 8 + Math.sin(f * 0.02 + i) * 0.3, 3.2 - t * 3.4, 2 - rnd(i, 4) * 7); });
    ST.meteors.forEach((m, i) => { const per = 70 + (i * 17) % 40, t = ((f + i * 23) % per) / per, on = (W.meteors ?? 0) > 0; m.material.opacity = on ? Math.sin(Math.PI * t) * 0.9 : 0;
      const sx = -40 + i * 12 + (rnd(i, 3) - 0.5) * 8; m.position.set(sx + t * 14, 70 - t * 55, -120 - i * 6); m.rotation.z = -0.25; });
    // space
    ST.earth.rotation.y = f * 0.0016;
    ST.ringM.opacity = W.ringK ?? 1; ST.ring.visible = (W.ringK ?? 1) > 0.01; ST.iceM.opacity = W.ice ?? 0; ST.shadowM.opacity = W.shadow ?? 0;
    ST.shadowBand.rotation.y = -f * 0.0016 + (W.shadowSweep ?? 0);
    // asteroid approach (W.ast 0..1) then break-up (W.tear 0..1): fragments spread along the orbit and settle into the ring
    const ast = W.ast ?? -1, tear = W.tear ?? -1;
    if (ast >= 0 && tear < 0) { const a0 = new THREE.Vector3(-7, 2.2, -4), a1 = new THREE.Vector3(-ER * 1.6, 0.2, ER * 0.6); ST.asteroid.position.copy(a0.lerp(a1, ast)); ST.asteroid.rotation.set(f * 0.02, f * 0.03, 0); ST.asteroid.scale.set(1 + 0.25 * ast, 1 - 0.1 * ast, 1); }
    else ST.asteroid.position.y = -50;
    ST.frags.forEach((r, i) => { if (tear < 0 && (W.rain ?? -1) < 0) { r.position.y = -50; return; }
      const R0 = ER * (1.4 + 0.85 * rnd(i, 3)), ang0 = 2.6 + (rnd(i, 4) - 0.5) * 0.12, spread = (tear >= 0 ? tear : 1);
      const ang = ang0 - spread * (1.2 + rnd(i, 5) * 5.6) - f * 0.003, rad = lerp(ER * 1.6, R0, Math.min(1, spread * 1.4)), y = (rnd(i, 6) - 0.5) * 0.12 * (1 - spread * 0.7);
      let p = new THREE.Vector3(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
      // raining down: some fragments spiral in to the equator
      const rain = W.rain ?? -1; if (rain >= 0 && i % 2 === 0) { const t = ((rain * 3 + rnd(i, 8)) % 1); p.multiplyScalar(lerp(1, ER * 1.01 / rad, E.easeIn(t))); }
      p.applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.32); r.position.set(p.x, p.y, p.z); r.rotation.set(f * 0.02 + i, f * 0.03, 0); });
    ST.flashes.forEach((s, i) => { const rain = W.rain ?? -1; if (rain < 0) { s.material.opacity = 0; return; } const per = 40 + i * 7, t = ((f + i * 13) % per) / per, ang = rnd(i, 1) * 6.28 + f * 0.0016;
      const p = new THREE.Vector3(Math.cos(ang) * ER * 1.01, (rnd(i, 2) - 0.5) * 0.5, Math.sin(ang) * ER * 1.01).applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.32); s.position.copy(p); s.scale.setScalar(0.25 * (1 - t)); s.material.opacity = t < 0.5 ? 1 - t * 2 : 0; });
    // lab
    ST.bandM.opacity = (W.band ?? 0) * 0.32; ST.pins.forEach((p, i) => { p.visible = (W.pins ?? 0) > i; });
    ST.labGlobe.rotation.y = f * 0.004;
  } };
};
// ---------------- cast ----------------
const SK = '#f7f4ee';
const EXPL = { tunic: '#b8864a', stick: true, skin: SK, hair: '#6a4228', hat: 'cowboy', hatCol: '#d8b47a', hatBand: '#6a4228', collar: '#f4ecd8', glasses: false, pattern: { type: 'vstripes', col: 'rgba(120,80,40,.18)', scale: 0.8 } };
const PAL = { tunic: '#3a6a8a', stick: true, skin: SK, hair: '#c8823a', collar: '#f4ecd8' };
const GEO = { tunic: '#2a7a6a', stick: true, skin: SK, hair: '#4a3020', beard: '#4a3020', beardStyle: 'short', glasses: true, collar: '#ffffff' };
export const actorsAt = (f, T) => {
  const S = shot(f), out = [];
  const tintL = { shore: '#fff0e4', night: '#e8e8ff', frozen: '#f0f4ff', space: '#ffffff', lab: '#fff2e6' }[S.light] || '#ffffff';
  const card = (id, O, o, w, seed, extra = {}) => { const I = idle3(f, seed, extra.e ?? 1), A = extra.act || {}, r = extra.r || { sx: 1, sy: 1, y: 0 };
    const rc = Math.min(0.12, Math.max(0, 1 - r.sy) * 1.6), rs = Math.min(0.1, Math.max(0, r.sy - 1) * 1.2);
    const opts = { seed, blink: blinkV(f, seed), L: 'hang', R: 'hang', look: 0, Ld: A.Ld ?? I.Ld, Rd: A.Rd ?? I.Rd, ...o };
    opts.tilt = q(I.tilt + (A.tilt || 0) + (o.tilt || 0), 1); opts.headTilt = q(I.headTilt + (A.headTilt || 0) + (o.headTilt || 0), 1);
    opts.px = q(I.px + (A.px || 0), 1); opts.crouch = q(Math.max(0, I.crouch + (A.crouch || 0) + rc), 3);
    opts.shrug = q(Math.max(-0.2, I.shrug + (A.shrug || 0) + rs), 3); opts.chest = q(A.chest || 0, 3); opts.headDrop = q(A.headDrop || 0, 3);
    if (A.fL) opts.fL = A.fL; if (A.fR) opts.fR = A.fR; if (A.sit) opts.sit = A.sit;
    out.push({ key: id + JSON.stringify(opts), draw: (p) => T.romanFront(p, O, opts), opts, x: w[0], y: w[1] + (extra.y || 0) + (A.sit ? 0.45 * 0.6975 * (extra.s ?? 0.9) * A.sit : 0), z: w[2], s: extra.s ?? 0.9, sx: 1, sy: 1, ground: w[1], tint: tintL, id }); };
  // looking up at the ring: head tilted back = head drop negative + shoulders lifting with wonder
  const gaze = (k) => ({ headDrop: -0.03 * k, shrug: 0.08 * k, chest: -0.1 * k });
  switch (S.id) {
    case 'hook': case 'loop': { const ff = S.id === 'loop' ? Math.max(0, S.b - f) : f,   // the loop runs the hook backwards so its last frame matches frame 0
      a = 0, k = ease(ff, [[0, 0.3], [40, 1]], 30), L_ = lookSeq(ff, [[0, -0.2], [50, 0.25]], 20);
      card('ex', EXPL, { expr: pick(ff, [[0, 'shock'], [70, 'grin']]), L: 'ik', Lh: ease2(ff, [[0, [0.2, 0.85]], [30, [0.55, -0.35]]], 22), Ld: null, R: 'ik', Rh: [0.15, 0.85], Rd: null, look: L_.look }, A(0.25, 0, 0.6), 11,
        { e: 0.7, act: { ...gaze(k), headTilt: L_.headTilt, tilt: L_.tilt + 3 * k, px: -4 * k } }); break; }
    case 'picture': { const a = S.a, k = ease(f, [[a, 0], [a + 40, 1]], 30);
      card('ex', EXPL, { expr: pick(f, [[a, 'shock'], [a + 60, 'grin']]), L: 'hang', R: 'ik', Rh: ease2(f, [[a, [0.2, 0.85]], [a + 50, [0.9, -0.3]]], 20), Rd: null, look: q(0.2 + 0.1 * vnoise(f * 0.02, 11), 2) }, A(0.45, 0, 0.4), 11, { e: 0.6, act: { ...gaze(k), tilt: -3 * k } });
      card('pal', PAL, { expr: pick(f, [[a, 'smile'], [a + 90, 'grin']]), L: 'ik', Lh: [0.1, 0.55, 1], Ld: null, R: 'cheek', look: q(-0.2 + 0.1 * vnoise(f * 0.02, 13), 2) }, A(-0.4, 0, 0.2), 13, { e: 0.6, act: { ...gaze(ease(f, [[a, 0], [a + 70, 1]], 30)), tilt: 4 } }); break; }
    case 'worse': { const a = S.a, k = ease(f, [[a, 0], [a + 50, 1]], 20);
      card('ex', EXPL, { expr: pick(f, [[a, 'grin'], [a + 45, 'nervous']]), L: 'hang', R: 'ik', Rh: ease2(f, [[a, [0.9, -0.3]], [a + 50, [0.1, 0.55]]], 16), Rd: null, look: q(ease(f, [[a, 0.2], [a + 50, -0.15]], 16), 2) }, A(0.25, 0, 0.6), 11,
        { e: 0.6, act: { ...gaze(1 - k), headTilt: 5 * k, chest: 0.1 * k }, r: react(f, a + 48, 0.6, 0) }); break; }
    case 'frozen': { const a = S.a, sv = shiver3(f, 11, 1.3);
      card('ex', EXPL, { expr: pick(f, [[a, 'pained'], [a + 70, 'cry']]), L: 'cross', R: 'cross', look: q(-0.1 + 0.1 * vnoise(f * 0.03, 11), 2) }, A(0.15, 0, 0.6), 11, { e: 0.4, act: { ...sv, headDrop: 0.02 } });
      card('pal', PAL, { expr: 'pained', L: 'cross', R: 'cross', look: 0.25 }, A(-0.6, 0, 0.3), 13, { e: 0.4, act: shiver3(f, 13, 1.0) }); break; }
    case 'lab': case 'tropics': { const a = CUE.lab, L_ = lookSeq(f, [[a, 0.4], [a + 50, -0.2], [CUE.tropics + 10, 0.1]], 16), up = f > a + 160;
      card('geo', GEO, { expr: pick(f, [[a, 'squint'], [a + 150, 'shock'], [CUE.tropics + 30, 'eureka']]), L: 'hang', ...(f < CUE.tropics ? { R: 'ik', Rh: ease2(f, [[a, [0.3, 0.9]], [a + 120, [0.8, 0.35]]], 18), Rd: null } : arms(f, [[CUE.tropics, 'hang'], [CUE.tropics + 14, 'point']], 'R', 12)), look: L_.look },
        C(0.65, 0, -1.25), 21, { s: 0.92, e: 0.7, act: { headTilt: L_.headTilt, tilt: L_.tilt + (up ? -3 : 0), shrug: up ? 0.1 : 0 }, r: reacts(f, [a + 150, CUE.tropics + 30], 0.6, 0) }); break; }
  }
  return out;
};
// ---------------- fx ----------------
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'lab' && f >= S.a + 150) out.push(emote('!', f - S.a - 150, C(0.65, 1.95, -1.25), { s: 0.22 }));
  if (S.id === 'tropics' && f >= S.a + 30 && f < S.a + 140) out.push(emote('bulb', f - S.a - 30, C(0.65, 1.95, -1.25), { s: 0.22 }));
  if (S.id === 'worse' && f >= S.a + 50) out.push(emote('!?', f - S.a - 50, A(0.25, 1.85, 0.6), { s: 0.2 }));
  return out; };
// ---------------- camera ----------------
const yawLook = (pos, look, deg) => { const a = deg * Math.PI / 180, dx = look[0] - pos[0], dz = look[2] - pos[2]; return [pos[0] + dx * Math.cos(a) - dz * Math.sin(a), look[1], pos[2] + dx * Math.sin(a) + dz * Math.cos(a)]; };
const orbit = (r, ang, y, look = B(0, 0, 0)) => ({ pos: [XB + Math.sin(ang) * r, y, Math.cos(ang) * r], look });
const HOOK0 = { pos: A(0.6, 0.5, 2.6), look: A(-0.2, 2.6, -2.0), fov: 56 };
const HOOK1 = { pos: A(0.5, 0.75, 2.9), look: A(0.0, 2.0, -2.0), fov: 54 };
const camRaw = (f) => { const S = shot(f), v = (f - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v), a = S.a;
  switch (S.id) {
    // low angle past the explorer up to the giant glowing arch
    case 'hook': return { pos: lerp3(HOOK0.pos, HOOK1.pos, sv), look: lerp3(HOOK0.look, HOOK1.look, sv), fov: lerp(56, 54, sv) };
    case 'loop': return { pos: lerp3(HOOK1.pos, HOOK0.pos, sv), look: lerp3(HOOK1.look, HOOK0.look, sv), fov: lerp(54, 56, sv) };
    // space: arc around the ringed Earth
    case 'space': { const o = orbit(lerp(22, 18.5, sv), lerp(-0.5, 0.25, sv), lerp(6.0, 3.2, sv)); return { ...o, fov: 40 }; }
    // night: tilt up from the two faces to the arch
    case 'picture': return { pos: lerp3(A(0.1, 1.2, 3.0), A(0.0, 0.8, 3.3), sv), look: lerp3(A(0.0, 1.35, 0), A(-0.3, 3.4, -3), E.smooth(ramp(f, a + 60, S.b))), fov: 50 };
    case 'asteroid': { const o = orbit(lerp(15, 13, sv), lerp(-1.0, -0.8, sv), lerp(2.0, 1.4, sv), lerp3(B(-4.2, 1.3, -2.2), B(-2.8, 0.4, 0.6), sv)); return { ...o, fov: 42 }; }
    case 'tear': { const o = orbit(lerp(12, 20, sv), lerp(-0.7, -0.1, sv), lerp(2.2, 7.0, sv), lerp3(B(-2.4, 0.2, 0.6), B(0, 0, 0), sv)); return { ...o, fov: 42 }; }
    case 'rain': { const o = orbit(lerp(11, 9.5, sv), lerp(0.3, 0.6, sv), lerp(2.4, 1.6, sv), B(0, 0, 0)); return { ...o, fov: 40 }; }
    // lab: push in on the geologist at the globe, then to the map
    case 'lab': return { pos: lerp3(C(1.2, 1.75, 1.6), C(0.9, 1.6, 0.9), sv), look: lerp3(C(0.25, 1.1, -1.0), C(0.3, 1.35, -1.8), sv), fov: 46 };
    case 'tropics': return { pos: lerp3(C(0.2, 1.65, 0.5), C(0.05, 1.65, -0.4), sv), look: C(0, 1.62, -2.45), fov: 50 };
    case 'worse': return { pos: lerp3(A(0.55, 1.35, 2.2), A(0.4, 1.3, 1.75), sv), look: A(0.2, 1.3, 0.4), fov: 46 };
    case 'shadow': { const o = orbit(lerp(16, 13, sv), lerp(0.2, 0.7, sv), lerp(-2.5, -4.5, sv), B(0, -0.3, 0)); return { ...o, fov: 40 }; }
    case 'frozen': return { pos: lerp3(A(0.0, 1.0, 2.9), A(-0.1, 0.9, 2.4), sv), look: lerp3(A(-0.2, 1.4, 0), A(-0.3, 2.2, -2), E.smooth(ramp(f, a + 80, S.b))), fov: 52 };
  } };
const cam = (f) => { const S = shot(f), c = camRaw(f);
  const wi = WHIPS.indexOf(S.b + 1), wo = WHIPS.indexOf(S.a);
  if (wi >= 0 && f > S.b - 14) c.look = yawLook(c.pos, c.look, (wi % 2 ? -55 : 55) * E.easeIn(ramp(f, S.b - 14, S.b + 1)));
  if (wo >= 0 && f < S.a + 18) c.look = yawLook(c.pos, c.look, -(wo % 2 ? -55 : 55) * (1 - E.easeOut(ramp(f, S.a, S.a + 18))));
  c.shadowAt = c.look; return c; };
export const camAt = cam;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shot(f), C0 = cam(f), at = (p, k) => ({ focus: dist(C0.pos, p), cinf: k * 0.6 });
  switch (S.id) {
    case 'hook': case 'loop': case 'worse': return at(A(0.25, 1.3, 0.6), 6);
    case 'picture': case 'frozen': return at(A(0, 1.3, 0.4), 6);
    case 'lab': return at(C(0.5, 1.2, -1.2), 8);
    case 'tropics': return at(C(0, 1.65, -2.45), 6);
    default: return at(B(0, 0, 0), 2);
  } };
export const worldAt = (f) => { const S = shot(f), W = { set: S.light };
  if (S.id === 'space') W.ringK = 1;
  if (S.id === 'asteroid') { W.ringK = 0; W.ast = q(E.smooth(ramp(f, S.a, S.b)), 3); }
  if (S.id === 'tear') { W.ringK = q(E.smooth(ramp(f, S.a + 80, S.b)), 3); W.tear = q(E.smooth(ramp(f, S.a, S.b - 20)), 3); }
  if (S.id === 'rain') { W.ringK = 1; W.rain = q((f - S.a) / 220, 3); }
  if (S.id === 'shadow') { W.ringK = 1; W.shadow = q(E.smooth(ramp(f, S.a + 20, S.a + 90)), 3); W.ice = q(E.smooth(ramp(f, S.a + 120, S.b - 30)), 3); W.shadowSweep = q(-0.6 + 0.6 * E.smooth(ramp(f, S.a, S.b)), 3); }
  if (S.id === 'rain' || S.id === 'worse') W.meteors = S.id === 'worse' ? 0 : 1;
  if (S.id === 'lab') { W.pins = Math.floor(E.smooth(ramp(f, S.a + 130, S.b)) * 21.99); }
  if (S.id === 'tropics') { W.pins = 21; W.band = q(E.smooth(ramp(f, S.a + 10, S.a + 50)), 3); }
  return W; };
// ---------------- handwritten labels (kept above the caption band y 1250-1450) ----------------
export const annotAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'space' && f >= S.a + 30) out.push({ type: 'label', text: '466 million years ago', at: B(0.0, 2.1, 0), dx: -40, dy: -330, age: f - S.a - 30, bend: 0.15 });
  if (S.id === 'tear' && f >= S.a + 40) out.push({ type: 'label', text: 'torn apart by gravity', at: B(-2.3, 0.3, 0.8), dx: 120, dy: -300, age: f - S.a - 40, bend: -0.2 });
  if (S.id === 'lab' && f >= S.a + 170) out.push({ type: 'label', text: '21 craters', at: C(0.4, 1.75, -2.4), dx: -160, dy: -250, age: f - S.a - 170, bend: 0.2 });
  if (S.id === 'tropics' && f >= S.a + 40) out.push({ type: 'label', text: 'all in the tropics', at: C(-0.1, 1.9, -2.4), dx: -90, dy: -260, age: f - S.a - 40, bend: 0.15 });
  if (S.id === 'shadow' && f >= S.a + 100) out.push({ type: 'label', text: 'ice age', at: B(0.3, -1.6, 1.2), dx: 140, dy: -360, age: f - S.a - 100, bend: -0.2 });
  return out; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
