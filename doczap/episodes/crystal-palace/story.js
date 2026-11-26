// Doc Zap — "A gardener stood his daughter on a leaf… and it beat 245 experts" (Joseph Paxton, Victoria lily → Crystal Palace, 1849–51).
// Reference style: close moving camera, macro opener, in-plate whip-pans (no blends), expressive faces, glass cutaway, toon look.
// Voice: Patrick, Eleven v4 (Diyar's MP3), trimmed + 1.06x = 43.3 s -> 2600 frames @ 60 fps. Last shot returns to frame 0.
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, talkAt, q } from './motion.js';
import { LP, tint } from './kit/lights.js';
import { emote } from './kit/emotes.js';
export const FPS = 60, TOTAL = 2600, DECK = 0, LOOK = 'modern';
const SH = [
  ['hook', 0, 170, 'lily'], ['tease', 171, 347, 'room'], ['lily', 348, 607, 'lily'], ['cut', 608, 952, 'cut'], ['park', 953, 1167, 'park'],
  ['reject', 1168, 1440, 'room'], ['doodle', 1441, 1746, 'rail'], ['palace', 1747, 1854, 'gold'], ['critics', 1855, 1945, 'gold'],
  ['march', 1946, 2077, 'nave'], ['nave', 2078, 2283, 'nave'], ['roof', 2284, 2540, 'nave'], ['loop', 2541, 2599, 'lily']];
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a, b, light }));
export const WHIPS = [171, 348, 608, 953, 1441, 1747, 1946, 2541];      // camera whip-pans made in the plates
export const WHIP_FRAMES = WHIPS.map((a) => [a - 14, a + 18]);
export const TRANSITIONS = SH.slice(1).map(([, a]) => ({ at: a, type: 'cut' }));
export const CUTS = [];
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = shot;
export const LIGHTS = {
  lily: tint(LP.day, { sky: '#f4ffe8', ground: '#5a7a4a', hemi: 1.2, sun: '#ffe8b8', sunI: 1.35, az: 140, el: 58, fog: '#e6f6dc', fogNear: 9, fogFar: 46, skyTop: '#6ab8ff', skyHor: '#e8fff0', gain: '#fff8ea', bloom: 0.9, bthr: 0.82, rimCol: '#fff0c8', shadowExt: 9 }),
  room: tint(LP.indoor, { hemi: 1.05, sunI: 1.0, az: 100, el: 35, fog: '#c8a070', fogNear: 7, fogFar: 26, gain: '#fff2e0', shadowExt: 7 }),
  park: tint(LP.day, { az: 120, el: 45, sunI: 1.35, fogNear: 30, fogFar: 220, shadowExt: 18 }),
  rail: tint(LP.indoor, { hemi: 1.0, sunI: 0.95, az: 60, el: 32, sky: '#ffe6c0', fog: '#a87a50', fogNear: 6, fogFar: 22, gain: '#fff0dc', shadowExt: 6 }),
  gold: tint(LP.day, { sun: '#ffd89a', sunI: 1.5, az: 210, el: 24, sky: '#ffe6c0', skyTop: '#2a6ee0', skyHor: '#cfe4ff', fog: '#e8eef6', fogNear: 40, fogFar: 240, gain: '#fff2dc', rim: 0.45, rimCol: '#ffd08a', shadowExt: 24 }),
  nave: tint(LP.day, { sky: '#eaf6ff', hemi: 1.25, sunI: 1.3, az: 150, el: 62, fog: '#dcecf8', fogNear: 14, fogFar: 70, gain: '#fffaf0', shadowExt: 14 }),
  cut: tint(LP.indoor, { sky: '#ffe2b8', hemi: 1.1, sunI: 1.1, az: 30, el: 55, fog: '#3a2030', fogNear: 10, fogFar: 40, skyTop: '#2a1430', skyHor: '#6a3050', gain: '#fff0e0', bloom: 1.0, bthr: 0.8, shadowExt: 6 }),
};
// modern look: stronger sun vs. fill (contrast, readable form), image light, filmic exposure, deeper haze distance
const MODL = { lily: { env: 0.7, sat: 1.1 }, room: { env: 0.5, hemiK: 0.45 }, rail: { env: 0.5, hemiK: 0.45 }, cut: { env: 0.6, hemiK: 0.5 }, park: { env: 0.65 }, gold: { env: 0.7 }, nave: { env: 0.75, hemiK: 0.6, skyTop: '#2a6ad6', skyHor: '#bcd8f6', fog: '#cfe0f0' } };
for (const k in LIGHTS) { const L = LIGHTS[k]; LIGHTS[k] = { ...L, sunI: L.sunI * 1.45, hemiK: 0.3, expo: 1.0, con: 1.1, sat: (L.sat ?? 1.16) * 1.04, fogNear: L.fogNear * 1.5, fogFar: L.fogFar * 1.7, ao: 0.35, bloom: (L.bloom ?? 0.5) * 0.8, bthr: Math.max((L.bthr ?? 1) * 1.9, 1.55), expo: 0.9, con: 1.15, vig: Math.max(L.vig ?? 0.22, 0.3), ...(MODL[k] || {}) }; }
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- layout ----------------
const XA = 60000, XB = 62000, XC = 64000, XD = 66000, XE = 68000, XF = 70000;
const A = (x, y, z) => [XA + x, y, z], B = (x, y, z) => [XB + x, y, z], C = (x, y, z) => [XC + x, y, z], D = (x, y, z) => [XD + x, y, z], Ev = (x, y, z) => [XE + x, y, z], F = (x, y, z) => [XF + x, y, z];
const RIM = 0.25, POND = 3.2;                          // lily house floor level, pond radius
const PAD = [0.2, 0.05, -1.6], PADR = 0.95;            // hero leaf (Annie stands on a small tray on it)
const PAX = [-0.95, RIM, -3.4], GARD1 = [1.35, RIM, -3.5], GARD2 = [2.05, RIM, -3.15];
const dipAt = (f) => { const t = f - 4; return t < 0 ? 0 : -0.035 * Math.exp(-t / 22) * Math.cos(t / 6.5); };   // the leaf dips, then holds
let ST = {};
const rnd = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
export const sets = (K) => {
  const { THREE, prop } = K;
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  const gridC = (bg, line, n = 8, lw = 3) => cv(256, 256, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = line; g.lineWidth = lw; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * W / n, 0); g.lineTo(i * W / n, H); g.stroke(); g.beginPath(); g.moveTo(0, i * H / n); g.lineTo(W, i * H / n); g.stroke(); } });
  const paneM = (rx, ry, op = 0.28) => { const m = K.toon({ map: ctex(gridC('rgba(190,235,255,1)', '#ffffff', 6, 5), rx, ry), transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }); m.userData = { rough: 0.06, metal: 0.25, envK: 2.2 }; return m; };
  const leafTopC = cv(1024, 1024, (g, W, H) => { const cx = W / 2, cy = H / 2; const gr = g.createRadialGradient(cx, cy, 10, cx, cy, W / 2);
    gr.addColorStop(0, '#2a6a26'); gr.addColorStop(0.6, '#3c8a32'); gr.addColorStop(1, '#4f9c3a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) { const x = rnd(i, 1) * W, y = rnd(i, 2) * H; g.fillStyle = rnd(i, 4) < 0.5 ? `rgba(15,50,15,${0.06 + rnd(i) * 0.06})` : `rgba(170,230,120,${0.05 + rnd(i) * 0.06})`; g.beginPath(); g.arc(x, y, 3 + rnd(i, 3) * 9, 0, 7); g.fill(); }
    // the radial ribs and cross-ribs (the trick of the story), sunk slightly with a light edge
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; for (const [w, c] of [[11, 'rgba(10,40,12,.42)'], [4, 'rgba(160,220,110,.35)']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * W / 2, cy + Math.sin(a) * H / 2); g.stroke(); } }
    for (let r = 70; r < W / 2; r += 58) for (let i = 0; i < 26; i++) { const a0 = i / 26 * Math.PI * 2, a1 = (i + 1) / 26 * Math.PI * 2; g.strokeStyle = 'rgba(10,40,12,.28)'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r + Math.sin(i * 3.1) * 6, a0 + 0.02, a1 - 0.02); g.stroke(); }
    const sh = g.createRadialGradient(cx, cy, W * 0.42, cx, cy, W / 2); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(120,30,40,.35)'); g.fillStyle = sh; g.fillRect(0, 0, W, H); });
  const leafTopM = K.toon({ map: ctex(leafTopC), color: '#b2c2a2' }); leafTopM.userData = { rough: 0.38, envK: 0.9 }; const leafRimM = K.toon({ color: '#b8344a' });
  const makeLeaf = (parent, x, y, z, R, rot = 0) => { const g = K.grp(parent, x, y, z, rot);
    const top = K.add(new THREE.CircleGeometry(R * 0.97, 48), leafTopM, 0, 0.004, 0, g, false); top.rotation.x = -Math.PI / 2;
    const rimPts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; rimPts.push(new THREE.Vector2(R * (0.96 + 0.05 * t), 0.004 + 0.085 * Math.sin(t * Math.PI / 2))); }
    K.add(new THREE.LatheGeometry(rimPts, 48), K.toon({ color: '#6aaa3a', side: THREE.DoubleSide }), 0, 0, 0, g, false);
    K.add(new THREE.CylinderGeometry(R * 1.0, R * 0.95, 0.02, 48, 1, true), leafRimM, 0, 0.02, 0, g, false);
    return g; };
  const waterC = cv(1024, 1024, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W / 2); gr.addColorStop(0, '#2a8a8a'); gr.addColorStop(1, '#0f4f5a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 500; i++) { const x = rnd(i, 5) * W, y = rnd(i, 6) * H, l = 20 + rnd(i, 9) * 40; g.strokeStyle = rnd(i, 7) < 0.6 ? `rgba(190,245,240,${0.08 + rnd(i, 10) * 0.12})` : 'rgba(5,30,40,.18)'; g.lineWidth = 1.5 + rnd(i, 8) * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4, x + l, y); g.stroke(); } });
  // modern trees: lumpy noise-displaced canopies with vertex-colour light (dark core, sunlit crown), trunk with branches
  const nz = (x, y, z) => Math.sin(x * 1.7 + Math.sin(z * 2.3)) * Math.cos(y * 1.9 + Math.sin(x * 1.3)) + 0.5 * Math.sin(x * 4.1 + y * 3.7 + z * 4.9) + 0.25 * Math.sin(x * 9.3 - z * 8.1 + y * 7.7);
  const canopyGeo = (r, seed, det = 10) => { const g = new THREE.IcosahedronGeometry(r, det); const P_ = g.attributes.position, cols = new Float32Array(P_.count * 3); const v = new THREE.Vector3();
    const cA = new THREE.Color('#2a6226'), cB = new THREE.Color('#3f8a2e'), cC = new THREE.Color('#9fd456'), tmp = new THREE.Color();
    for (let i = 0; i < P_.count; i++) { v.fromBufferAttribute(P_, i); const n = v.clone().normalize(); const k = nz(n.x * 2 + seed, n.y * 2, n.z * 2 - seed);
      const bump = 1 + 0.15 * k;
      v.copy(n).multiplyScalar(r * bump); v.y *= 0.88; P_.setXYZ(i, v.x, v.y, v.z);
      const h = n.y * 0.5 + 0.5, lit = Math.max(0, n.dot(new THREE.Vector3(0.5, 0.75, 0.35))) ;
      tmp.copy(cA).lerp(cB, Math.min(1, h * 1.3)).lerp(cC, Math.pow(lit, 2.2) * 0.55 + Math.max(0, k) * 0.12); cols.set([tmp.r, tmp.g, tmp.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals();
    { const N_ = g.attributes.normal; for (let i = 0; i < N_.count; i++) { v.fromBufferAttribute(P_, i).normalize(); const fx = N_.getX(i), fy = N_.getY(i), fz = N_.getZ(i); const m_ = v.multiplyScalar(0.75).add(new THREE.Vector3(fx, fy, fz).multiplyScalar(0.25)).normalize(); N_.setXYZ(i, m_.x, m_.y, m_.z); } }
    return g; };
  const leafStd = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, emissive: '#16380f', emissiveIntensity: 1 }); leafStd.userData.envK = 0.7;
  const barkM = new THREE.MeshStandardMaterial({ color: '#6e6050', roughness: 0.9 });
  const tree = (parent, x, z, s = 1, seed = 1, y = 0, det = 10) => { const g = K.grp(parent, x, y, z, rnd(seed, 40) * 6);
    K.add(new THREE.CylinderGeometry(0.13 * s, 0.26 * s, 2.6 * s, 20), barkM, 0, 1.3 * s, 0, g);
    for (let b = 0; b < 3; b++) { const br = K.add(new THREE.CylinderGeometry(0.04 * s, 0.09 * s, 1.3 * s, 10), barkM, 0, 2.3 * s, 0, g); br.rotation.set(0.75, b * 2.1, 0); br.translateY(0.55 * s); }
    const n = 7; for (let i = 0; i < n; i++) { const a = i / n * 6.28 + rnd(seed, i) * 0.8, rr = (0.55 + rnd(seed, i + 9) * 0.45) * s, d = i === 0 ? 0 : 0.75 * s;
      K.add(canopyGeo(rr, seed * 3.1 + i, det), leafStd, Math.cos(a) * d, (i === 0 ? 3.9 : 3.0 + rnd(seed, i + 3) * 1.0) * s, Math.sin(a) * d, g); }
    return g; };
  const ironM = K.toon({ color: '#f2f4f0' }), blueM = K.toon({ color: '#3a6ac8' }), redM = K.toon({ color: '#d0303a' }), yelM = K.toon({ color: '#f2c230' });

  // ======================= A. THE LILY HOUSE (Chatsworth, Nov 1849) =======================
  const LG = K.grp(K.scene, XA, 0, 0);
  { const fl = K.add(K.tbox(30, 0.5, 30, 2), K.mat('stone', { seed: 21, lig: 74, hue: 38 }), 0, RIM - 0.25, 0, LG); }
  // the pond: water disc sunk into the floor, a stone kerb
  K.add(new THREE.CylinderGeometry(POND, POND, 0.5, 64), K.toon({ color: '#155a80' }), 0, -0.2, 0, LG, false);
  const waterM = K.toon({ map: ctex(waterC), color: '#ffffff' }); waterM.userData = { rough: 0.12, metal: 0.1, envK: 0.75 }; const water = K.add(new THREE.CircleGeometry(POND, 64), waterM, 0, 0.05, 0, LG, false); water.rotation.x = -Math.PI / 2;
  K.add(new THREE.TorusGeometry(POND + 0.05, 0.12, 10, 72), K.mat('stone', { seed: 22, lig: 66 }), 0, RIM - 0.04, 0, LG).rotation.x = Math.PI / 2;
  // hole in the floor for the pond: the floor box above covers it, so lift the water region by cutting a ring of floor tiles instead
  LG.children[0].visible = false;
  const ringShape = new THREE.Shape(); ringShape.moveTo(-15, -15); ringShape.lineTo(15, -15); ringShape.lineTo(15, 15); ringShape.lineTo(-15, 15); ringShape.lineTo(-15, -15);
  const hole = new THREE.Path(); hole.absarc(0, 0, POND, 0, Math.PI * 2, true); ringShape.holes.push(hole);
  const floorG = new THREE.ShapeGeometry(ringShape, 64); { const uv = floorG.attributes.uv, p = floorG.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 2, p.getY(i) / 2); }
  const floor = K.add(floorG, K.mat('stone', { seed: 21, lig: 74, hue: 38 }), 0, RIM, 0, LG, false); floor.rotation.x = -Math.PI / 2;
  // lily leaves (hero + others) and two big flowers
  const HERO = makeLeaf(LG, PAD[0], PAD[1], PAD[2], PADR);
  K.add(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 32), K.toon({ color: '#e8eef4', emissive: '#556070', emissiveIntensity: 0.2 }), 0, 0.012, 0, HERO);   // the tray under her feet
  [[1.7, 0.4, 0.75, 0.3], [-1.6, -0.6, 0.85, 1.1], [-0.8, 1.6, 0.7, 2.0], [1.4, 1.9, 0.6, 0.6], [0.95, 2.45, 0.42, 1.2], [-2.2, 1.2, 0.5, 0.2], [2.3, -1.7, 0.55, 1.7]].forEach(([x, z, r, rot]) => makeLeaf(LG, x, 0.05, z, r, rot));
  const petalM = K.toon({ color: '#fff6f2' }), petalP = K.toon({ color: '#ff9ab8' });
  [[1.15, -0.55], [-1.05, 0.55]].forEach(([x, z], k) => { const g = K.grp(LG, x, 0.08, z); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, inner = i % 2;
    const p = K.add(new THREE.ConeGeometry(0.06, 0.32, 6), inner ? petalP : petalM, Math.cos(a) * 0.1, 0.12, Math.sin(a) * 0.1, g, false); p.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); } K.add(new THREE.SphereGeometry(0.07, 10, 8), yelM, 0, 0.1, 0, g); });
  // the glasshouse: white iron columns, glass walls with outside greenery, ridge-and-furrow roof
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; K.add(new THREE.CylinderGeometry(0.07, 0.09, 5.6, 10), ironM, Math.cos(a) * 6.2, RIM + 2.8, Math.sin(a) * 6.2, LG); }
  const wall = K.add(new THREE.CylinderGeometry(6.25, 6.25, 5.6, 28, 1, true), paneM(14, 3, 0.3), 0, RIM + 2.8, 0, LG, false); K.noInk(wall);
  const outC = cv(1024, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#bfe8ff'); gr.addColorStop(0.55, '#e8fff0'); gr.addColorStop(0.56, '#6aba5a'); gr.addColorStop(1, '#3a8a3a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { g.fillStyle = ['#2f7a2a', '#3f9a32', '#4aaa3a'][i % 3]; const x = rnd(i, 1) * W, r = 18 + rnd(i, 2) * 30; g.beginPath(); g.arc(x, H * 0.55 - rnd(i, 3) * 30, r, 0, 7); g.fill(); } });
  const outside = K.add(new THREE.CylinderGeometry(9, 9, 9, 32, 1, true), new THREE.MeshBasicMaterial({ map: ctex(outC, 3, 1), side: THREE.BackSide, fog: false }), 0, RIM + 3.2, 0, LG, false); K.noInk(outside);
  { const ridge = new THREE.Group(); ridge.position.set(0, RIM + 5.6, 0); LG.add(ridge); const roofM = paneM(1, 6, 0.35);
    for (let i = -6; i <= 6; i++) { for (const s of [-1, 1]) { const p = K.add(new THREE.PlaneGeometry(0.75, 12.5), roofM, i + s * 0.25, 0.25, 0, ridge, false); p.rotation.set(Math.PI / 2, s * 0.6, 0); K.noInk(p); }
      K.add(new THREE.BoxGeometry(0.05, 0.05, 12.5), ironM, i, 0.5, 0, ridge, false); K.add(new THREE.BoxGeometry(0.05, 0.05, 12.5), ironM, i + 0.5, 0.02, 0, ridge, false); } }
  // tropical plants in pots + a banana (Paxton grew the Cavendish banana here)
  const potM = K.toon({ color: '#c8643a' }), bigLeafM = K.toon({ color: '#3aa83a', side: THREE.DoubleSide });
  [[-4.3, -2.2], [4.4, -1.9], [-4.6, 1.8], [4.2, 2.4], [-2.6, -4.6], [2.9, -4.5]].forEach(([x, z], k) => { const g = K.grp(LG, x, RIM, z, k); K.add(new THREE.CylinderGeometry(0.32, 0.24, 0.5, 14), potM, 0, 0.25, 0, g);
    K.add(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8), K.toon({ color: '#6a8a3a' }), 0, 1.2, 0, g); for (let i = 0; i < 6; i++) { const lf = K.add(new THREE.PlaneGeometry(0.4, 1.3), bigLeafM, 0, 2.0, 0, g, false); lf.rotation.set(-0.9, i * 1.05, 0); lf.translateY(0.55); } });
  // dense tropical planting all round the glass (modern look: real depth behind the cast instead of a flat wall)
  { const tleafC = cv(256, 512, (g, W, H) => { g.clearRect(0, 0, W, H); g.beginPath(); g.moveTo(W / 2, H); g.bezierCurveTo(W * 1.05, H * 0.7, W * 0.95, H * 0.2, W / 2, 0); g.bezierCurveTo(W * 0.05, H * 0.2, -W * 0.05, H * 0.7, W / 2, H); g.closePath();
      const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, '#1f5a22'); gr.addColorStop(0.6, '#3c8c30'); gr.addColorStop(1, '#6fb84a'); g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(200,240,150,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(W / 2, H); g.lineTo(W / 2, 8); g.stroke();
      g.strokeStyle = 'rgba(20,60,20,.35)'; g.lineWidth = 2; for (let i = 1; i < 14; i++) { const y = H - i * H / 14; g.beginPath(); g.moveTo(W / 2, y); g.lineTo(W * 0.1, y - 40); g.moveTo(W / 2, y); g.lineTo(W * 0.9, y - 40); g.stroke(); } });
    const tleafM = new THREE.MeshStandardMaterial({ map: ctex(tleafC), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55 }); tleafM.userData.envK = 0.8;
    const leafGeo = (() => { const g = new THREE.PlaneGeometry(0.55, 1.5, 2, 10); g.translate(0, 0.75, 0); const P_ = g.attributes.position; for (let i = 0; i < P_.count; i++) { const y = P_.getY(i), x = P_.getX(i); P_.setZ(i, 0.35 * Math.pow(y / 1.5, 2) - Math.abs(x) * 0.25); } g.computeVertexNormals(); return g; })();
    const stemM = new THREE.MeshStandardMaterial({ color: '#4f6e2c', roughness: 0.8 });
    for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2 + rnd(i, 81) * 0.15, r = 4.9 + rnd(i, 82) * 1.0, h = 1.4 + rnd(i, 83) * 2.2; const g = K.grp(LG, Math.cos(a) * r, RIM, Math.sin(a) * r, rnd(i, 84) * 6);
      K.add(new THREE.CylinderGeometry(0.03, 0.06, h, 10), stemM, 0, h / 2, 0, g);
      const nl = 5 + Math.floor(rnd(i, 85) * 4); for (let j = 0; j < nl; j++) { const lf = K.add(leafGeo, tleafM, 0, h - 0.1 - rnd(i, 86 + j) * 0.4, 0, g, false); const sc = 0.8 + rnd(i, 90 + j) * 0.7; lf.scale.setScalar(sc); lf.rotation.set(-0.5 - rnd(i, 95 + j) * 0.7, j / nl * 6.28 + rnd(i, 99 + j), 0, 'YXZ'); } }
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + 0.1, r = 5.4 + rnd(i, 120) * 0.5; K.add(canopyGeo(0.45 + rnd(i, 121) * 0.35, 200 + i, 8), leafStd, Math.cos(a) * r, RIM + 0.3, Math.sin(a) * r, LG, false); }
  }
  // a small water wheel that keeps the water moving
  const WHEEL = K.grp(LG, 2.6, 0.25, -1.9, -0.9); { for (let i = 0; i < 8; i++) { const sp = K.add(new THREE.BoxGeometry(0.05, 0.9, 0.05), K.M.woodD, 0, 0, 0, WHEEL); sp.rotation.z = i * Math.PI / 4; const pd = K.add(new THREE.BoxGeometry(0.22, 0.05, 0.16), K.M.woodD, Math.cos(i * Math.PI / 4) * 0.45, Math.sin(i * Math.PI / 4) * 0.45, 0, WHEEL); pd.rotation.z = i * Math.PI / 4; }
    K.add(new THREE.TorusGeometry(0.45, 0.025, 6, 32), K.M.woodD, 0, 0, 0, WHEEL); }
  K.beam(LG, [-1.5, RIM + 5.6, -2.5], [0.2, 0.1, -1.6], 0.4, 1.2, '#fff0c0', 0.22); K.beam(LG, [2.5, RIM + 5.6, -3.5], [1.5, 0.1, -0.6], 0.3, 1.0, '#fff0c0', 0.18);
  K.motes(LG, { n: 70, box: [-3, 0.2, -3.5, 3, 3.6, 2.5], col: '#fff6d8', size: 0.012, speed: 0.0012 });
  K.warmLight(LG, 0, RIM + 3.2, 0, { i: 1.6, dist: 12, col: '#fff0d0', flicker: 0.01 });

  // ======================= B. THE BUILDING COMMITTEE ROOM (London, 1850) =======================
  const RB = K.room({ x: XB, w: 8, d: 6.4, h: 4.0, floor: 'planks', wall: 'plaster', wallOpts: { seed: 31, col: [35, 45, 76], bricks: 0, stains: 0.4 }, floorOpts: { seed: 32, lig: 36 }, ceil: 'flat' });
  prop.window(RB, { x: -2.2, y: 2.3, z: -3.14, w: 1.0, h: 1.6, kind: 'sun', depth: 0.12, beamTo: [-0.6, 0, 0.5], i: 4 }); prop.window(RB, { x: 2.2, y: 2.3, z: -3.14, w: 1.0, h: 1.6, kind: 'sun', depth: 0.12, beamTo: [1.2, 0, 0.5], i: 3 });
  prop.poster(RB, { x: 0, y: 2.6, z: -3.12, w: 1.3, h: 0.9, parchment: true, accent: '#7a1a2a', title: 'GREAT EXHIBITION', lines: ['of the Works of Industry', 'of All Nations'], footer: 'Hyde Park · 1851' });
  prop.rug(RB, { x: 0, z: -0.3, w: 4.6, d: 3.0, pattern: 'persian', cols: ['#8a2030', '#1f3a6a', '#e0b050', '#f0e2c0'] });
  prop.table(RB, { x: 0, z: -0.6, w: 3.2, d: 1.4 }); prop.shelf(RB, { x: 3.6, z: -1.0, ry: -Math.PI / 2, w: 1.8, seed: 3 });
  const paperM = [K.toon({ color: '#f4ecd8' }), K.toon({ color: '#d8e8ff' }), K.toon({ color: '#ece0c0' })];
  for (let i = 0; i < 90; i++) { const x = (rnd(i, 1) - 0.5) * 2.6, z = -0.6 + (rnd(i, 2) - 0.5) * 1.1, y = 0.79 + Math.max(0, 0.28 - Math.hypot(x / 1.4, (z + 0.6) / 0.6) * 0.26) * rnd(i, 3) + (i % 12) * 0.004;
    if (i % 3) { const s = K.add(new THREE.BoxGeometry(0.52, 0.006, 0.38), paperM[i % 3], x, y, z, RB); s.rotation.set(0, rnd(i, 4) * 3, 0); }
    else { const r = K.add(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 10), paperM[(i + 1) % 3], x, y + 0.03, z, RB); r.rotation.set(0, (rnd(i, 5) - 0.5) * 0.8, Math.PI / 2); } }
  // the rubber stamp and its red mark on the top plan
  const STAMP = K.grp(RB, 0.55, 1.45, -0.25); K.add(new THREE.BoxGeometry(0.16, 0.05, 0.1), K.toon({ color: '#5a3a22' }), 0, 0, 0, STAMP); K.add(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10), K.toon({ color: '#8a5a32' }), 0, 0.08, 0, STAMP); K.add(new THREE.SphereGeometry(0.05, 12, 8), K.toon({ color: '#8a5a32' }), 0, 0.16, 0, STAMP);
  const topPlan = K.add(new THREE.BoxGeometry(0.6, 0.006, 0.42), K.toon({ map: ctex(cv(512, 360, (g, W, H) => { g.fillStyle = '#e6f0ff'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2a4aa8'; g.lineWidth = 4; g.strokeRect(40, 60, W - 80, H - 120); g.beginPath(); g.moveTo(40, 180); g.lineTo(W - 40, 180); g.moveTo(W / 2, 60); g.lineTo(W / 2, H - 60); g.stroke(); g.beginPath(); g.arc(W / 2, 180, 60, 0, 7); g.stroke(); })) }), 0.55, 1.12, -0.25, RB);
  const markC = cv(512, 256, (g, W, H) => { g.save(); g.translate(W / 2, H / 2); g.rotate(-0.15); g.strokeStyle = '#d0202a'; g.lineWidth = 12; g.strokeRect(-200, -60, 400, 120); g.fillStyle = '#d0202a'; g.font = '900 84px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('REJECTED', 0, 6); g.restore(); });
  const MARK = K.add(new THREE.PlaneGeometry(0.42, 0.21), new THREE.MeshBasicMaterial({ map: ctex(markC), transparent: true, depthWrite: false }), 0.55, 1.127, -0.25, RB, false); MARK.rotation.x = -Math.PI / 2; K.noInk(MARK); MARK.visible = false;
  const FLY = []; for (let i = 0; i < 10; i++) FLY.push(K.add(new THREE.BoxGeometry(0.5, 0.006, 0.36), paperM[i % 3], 0, -5, 0, RB));
  K.bulb(RB, -2.6, 2.6, 0.8, { size: 0.05, i: 1.2, dist: 5 }); K.bulb(RB, 2.6, 2.6, 0.8, { size: 0.05, i: 1.2, dist: 5 });

  // ======================= C. HYDE PARK + THE CRYSTAL PALACE =======================
  const PG = K.grp(K.scene, XC, 0, 0);
  const grassC = cv(512, 512, (g, W, H) => { g.fillStyle = '#4c9634'; g.fillRect(0, 0, W, H); for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? 'rgba(255,255,200,.06)' : 'rgba(20,80,20,.06)'; g.fillRect(0, k * H / 8, W, H / 8); }
    for (let i = 0; i < 900; i++) { g.strokeStyle = `rgba(${rnd(i) < 0.5 ? '30,90,25' : '170,230,120'},${0.25 + rnd(i, 1) * 0.3})`; g.lineWidth = 2; const x = rnd(i, 2) * W, y = rnd(i, 3) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - 7); g.stroke(); } });
  { const lawn = K.add(new THREE.PlaneGeometry(220, 220), K.toon({ map: ctex(grassC, 40, 40) }), 0, 0, 0, PG, false); lawn.rotation.x = -Math.PI / 2; }
  { const lawnBig = cv(512, 512, (g, W, H) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, W, H); for (let i = 0; i < 70; i++) { const x = rnd(i, 31) * W, y = rnd(i, 32) * H, r = 30 + rnd(i, 33) * 90; const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const c = rnd(i, 34) < 0.5 ? '20,70,20' : '190,230,110'; gr.addColorStop(0, `rgba(${c},.22)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, W, H); } });
    const ov = K.add(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ map: ctex(lawnBig, 6, 6), transparent: true, depthWrite: false, roughness: 0.9 }), 0, 0.004, 0, PG, false); ov.rotation.x = -Math.PI / 2;
    // grass tufts around the action
    const blade = new THREE.ConeGeometry(0.022, 0.2, 3); blade.translate(0, 0.1, 0);
    const N = 9000, IM = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), N); const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), col = new THREE.Color();
    let k = 0; for (let i = 0; k < N && i < N * 3; i++) { const x = (rnd(i, 51) - 0.5) * 34, z = -6 + rnd(i, 52) * 26; if (z > 4.3 && z < 7.7) continue; if (Math.abs(x) < 1.7 && z > 1.6 && z < 4.2) continue;
      e.set((rnd(i, 53) - 0.5) * 0.5, rnd(i, 54) * 6, (rnd(i, 55) - 0.5) * 0.5); qq.setFromEuler(e); const h = 0.6 + rnd(i, 56) * 0.9; sc.set(1, h, 1); ps.set(x, 0, z); m4.compose(ps, qq, sc); IM.setMatrixAt(k, m4);
      col.setHSL(0.24 + rnd(i, 57) * 0.06, 0.55 + rnd(i, 58) * 0.2, 0.28 + rnd(i, 59) * 0.18); IM.setColorAt(k, col); k++; }
    IM.count = k; IM.castShadow = false; IM.receiveShadow = true; PG.add(IM);
    const fl = new THREE.SphereGeometry(0.03, 8, 6), FN = 500, FI = new THREE.InstancedMesh(fl, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), FN);
    for (let i = 0; i < FN; i++) { let x = (rnd(i, 61) - 0.5) * 34, z = -6 + rnd(i, 62) * 26; if (z > 4.3 && z < 7.7) z += 4; ps.set(x, 0.08 + rnd(i, 63) * 0.06, z); m4.compose(ps, qq.identity(), sc.set(1, 1, 1)); FI.setMatrixAt(i, m4); FI.setColorAt(i, col.set(['#ffffff', '#ffe04a', '#ff9ac0', '#c8a0ff'][i % 4])); }
    FI.castShadow = false; PG.add(FI);
    // far tree line and hedges for depth
    for (let i = 0; i < 26; i++) { const a = i / 26; tree(PG, -60 + a * 120 + (rnd(i, 71) - 0.5) * 3, -34 - rnd(i, 72) * 10, 1.6 + rnd(i, 73) * 0.9, 40 + i, 0, 5); }
    for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) tree(PG, sx * (24 + rnd(i, 74) * 8), -20 + i * 7, 1.5 + rnd(i, 75) * 0.6, 80 + i + (sx > 0 ? 9 : 0), 0, 6);
  }
  { const path = K.add(new THREE.PlaneGeometry(3, 200), K.toon({ color: '#e0c890' }), 0, 0.01, 6, PG, false); path.rotation.set(-Math.PI / 2, 0, Math.PI / 2); }
  [[-9, -2, 1.4], [8, -3, 1.5], [11, 3, 1.3], [-14, 1, 1.6], [15, -1, 1.4], [6, -9, 1.3], [-18, -8, 1.8], [19, -9, 1.7], [0, -14, 2.2]].forEach(([x, z, s], k) => tree(PG, x, z, s, k + 3));
  const PAL = K.grp(PG, 0, 0, -8); PAL.visible = false;
  { const glassC = cv(512, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9fd2f0'); gr.addColorStop(1, '#2f6fa8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 3; for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(i * W / 16, 0); g.lineTo(i * W / 16, H); g.stroke(); } for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * H / 8); g.lineTo(W, i * H / 8); g.stroke(); }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + rnd(i) * 0.3})`; const x = Math.floor(rnd(i, 1) * 16) * W / 16, y = Math.floor(rnd(i, 2) * 8) * H / 8; g.fillRect(x + 3, y + 3, W / 16 - 6, H / 8 - 6); } });
    const gm = (rx, ry) => { const m = K.toon({ map: ctex(glassC, rx, ry), emissive: '#2a5a8a', emissiveIntensity: 0.12 }); m.userData = { rough: 0.1, metal: 0.5, envK: 1.3 }; return m; };
    K.add(new THREE.BoxGeometry(34, 3.0, 7), gm(8, 1), 0, 1.5, 0, PAL); K.add(new THREE.BoxGeometry(34, 2.0, 4.6), gm(8, 1), 0, 4.0, 0, PAL); K.add(new THREE.BoxGeometry(34, 1.4, 2.4), gm(8, 1), 0, 5.7, 0, PAL);
    const tr = K.add(new THREE.CylinderGeometry(3.6, 3.6, 9.5, 40, 1, false, 0, Math.PI), gm(6, 2), 0, 5.0, 0, PAL); tr.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    K.add(new THREE.BoxGeometry(7.2, 5.0, 9.5), gm(2, 1), 0, 2.5, 0, PAL);
    for (let i = -8; i <= 8; i++) { const f = K.add(new THREE.PlaneGeometry(0.5, 0.3), K.toon({ color: i % 2 ? '#d0303a' : '#ffffff', side: THREE.DoubleSide }), i * 2, 6.75, 0, PAL, false); K.add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4), ironM, i * 2 - 0.25, 6.6, 0, PAL, false); f.position.x += 0.0; }
    K.bulb(PAL, 0, 8.6, 0, { size: 0.0001, light: false, halo: false }); }

  // ======================= D. THE RAILWAY BOARD MEETING (Derby, June 1850) =======================
  const RD = K.room({ x: XD, w: 7, d: 6, h: 3.6, floor: 'planks', wall: 'plaster', wallOpts: { seed: 41, col: [95, 30, 62], bricks: 0, stains: 0.5 }, floorOpts: { seed: 42, lig: 32 }, ceil: 'flat' });
  prop.window(RD, { x: 2.3, y: 2.0, z: -2.94, w: 0.9, h: 1.4, kind: 'sun', depth: 0.12, beamTo: [1.2, 0, 0.6], i: 3.5 });
  prop.poster(RD, { x: -0.6, y: 2.3, z: -2.92, w: 1.5, h: 0.62, accent: '#1a4a2a', bg: '#f2e6c8', fg: '#1a3a22', title: 'MIDLAND RAILWAY', lines: ['Board of Directors'], footer: 'Derby' });
  prop.shelf(RD, { x: -3.15, z: -0.8, ry: Math.PI / 2, w: 1.6, seed: 7 });
  const RTAB = prop.table(RD, { x: 0, z: -0.6, w: 3.0, d: 1.1 });
  { const cloth = K.add(new THREE.BoxGeometry(3.04, 0.02, 1.14), K.toon({ color: '#2a7a4a' }), 0, 0.775, -0.6, RD); }
  for (let i = 0; i < 6; i++) { const s = K.add(new THREE.BoxGeometry(0.32, 0.006, 0.22), paperM[i % 3], -1.1 + i * 0.42, 0.79, -0.85 + (i % 2) * 0.3, RD); s.rotation.y = rnd(i, 3) - 0.5; }
  K.add(new THREE.CylinderGeometry(0.04, 0.05, 0.06, 12), K.toon({ color: '#1e1e2a' }), 0.95, 0.81, -0.25, RD);                       // inkwell
  const BLOT_CV = document.createElement('canvas'); BLOT_CV.width = 1024; BLOT_CV.height = 720; const BLOT_T = ctex(BLOT_CV);
  const BLOT = K.add(new THREE.PlaneGeometry(0.46, 0.32), K.toon({ map: BLOT_T, color: '#ffffff' }), 0.62, 0.792, -0.22, RD, false); BLOT.rotation.set(-Math.PI / 2, 0, 0.12);
  K.bulb(RD, -1.0, 2.5, -0.6, { size: 0.06, i: 1.6, dist: 5 }); K.bulb(RD, 1.0, 2.5, -0.6, { size: 0.06, i: 1.6, dist: 5 });
  // the sketch draws itself: a long glass hall, an arched transept, the ridge-and-furrow roof
  let lastK = -1;
  const drawSketch = (k) => { const kk = q(k, 2); if (kk === lastK) return; lastK = kk; const g = BLOT_CV.getContext('2d'), W = 1024, H = 720;
    g.fillStyle = '#f6c2cc'; g.fillRect(0, 0, W, H); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(200,120,140,${0.05 + rnd(i) * 0.06})`; g.fillRect(rnd(i, 1) * W, rnd(i, 2) * H, 3, 3); }
    g.strokeStyle = '#1a1a3a'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
    const segs = [[[300, 470], [724, 470]], [[300, 470], [300, 390]], [[724, 470], [724, 390]], [[300, 390], [724, 390]], [[340, 390], [340, 340]], [[684, 390], [684, 340]], [[340, 340], [684, 340]]];
    const arc = (t) => { g.beginPath(); g.arc(512, 340, 70, Math.PI, Math.PI + Math.PI * t); g.stroke(); };
    const total = segs.length + 2; let left = kk * total;
    for (const [a, b] of segs) { if (left <= 0) break; const t = Math.min(1, left); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); g.stroke(); left -= 1; }
    if (left > 0) { arc(Math.min(1, left)); left -= 1; }
    if (left > 0) { g.lineWidth = 4; const n = Math.floor(14 * Math.min(1, left)); for (let i = 0; i < n; i++) { const x = 318 + i * 29; g.beginPath(); g.moveTo(x, 470); g.lineTo(x, 390); g.stroke(); } }
    BLOT_T.needsUpdate = true; };
  drawSketch(0);

  // ======================= E. INSIDE THE CRYSTAL PALACE (1851) =======================
  const NG = K.grp(K.scene, XE, 0, 0);
  { const fl = K.add(K.tbox(14, 0.2, 70, 2), K.mat('planks', { seed: 51, lig: 46 }), 0, -0.1, 0, NG, false); }
  for (let z = -30; z <= 30; z += 2.4) for (const s of [-1, 1]) { const x = s * 3.2; K.add(new THREE.CylinderGeometry(0.09, 0.09, 5.0, 10), blueM, x, 2.5, z, NG); K.add(new THREE.BoxGeometry(0.24, 0.12, 0.24), redM, x, 0.06, z, NG); K.add(new THREE.BoxGeometry(0.22, 0.1, 0.22), yelM, x, 2.62, z, NG); }
  const GAL = []; for (const s of [-1, 1]) { const g = K.grp(NG, s * 4.6, 2.55, 0); GAL.push(g); K.add(new THREE.BoxGeometry(2.8, 0.14, 62), K.mat('planks', { seed: 52, lig: 44 }), 0, 0, 0, g);
    K.add(new THREE.BoxGeometry(0.05, 0.05, 62), redM, -s * 1.38, 0.62, 0, g); for (let z = -30; z <= 30; z += 0.6) K.add(new THREE.BoxGeometry(0.03, 0.6, 0.03), ironM, -s * 1.38, 0.32, z, g, false); }
  const vault = K.add(new THREE.CylinderGeometry(3.25, 3.25, 64, 48, 1, true, 0, Math.PI), paneM(6, 24, 0.22), 0, 5.0, 0, NG, false); vault.rotation.set(Math.PI / 2, 0, Math.PI / 2); K.noInk(vault); vault.material.userData = { rough: 0.35, metal: 0, envK: 0.25 };
  for (let z = -30; z <= 30; z += 2.4) { const r = K.add(new THREE.TorusGeometry(3.25, 0.05, 6, 40, Math.PI), ironM, 0, 5.0, z, NG, false); }
  for (const s of [-1, 1]) { const sr = K.add(new THREE.PlaneGeometry(3, 64), paneM(3, 24, 0.3), s * 4.7, 5.05, 0, NG, false); sr.rotation.x = -Math.PI / 2; K.noInk(sr); }
  { const sky = K.add(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: '#8ccaff', fog: false }), 0, 14, 0, NG, false); sky.rotation.x = Math.PI / 2; K.noInk(sky); }
  for (const s of [-1, 1]) { const ow = K.add(new THREE.PlaneGeometry(64, 5.2), paneM(24, 2, 0.5), s * 6.0, 2.6, 0, NG, false); ow.rotation.y = s * Math.PI / 2; K.noInk(ow); }
  tree(NG, 0, -6, 1.3, 11).traverse((o) => { if (o.isMesh) o.receiveShadow = false; });                                            // the elm trees grew inside the palace
  for (let i = 0; i < 2; i++) K.beam(NG, [(i % 2 ? 1 : -1) * 1.2, 8.2, -24 + i * 9], [(i % 2 ? 1.6 : -1.4), 0, -22 + i * 9], 0.4, 1.4, '#fff4d8', 0.16);
  K.motes(NG, { n: 60, box: [-3, 0.4, -12, 3, 5, 6], col: '#fff6d8', size: 0.013, speed: 0.0011 });
  // the leaf's skeleton, glowing on the roof (it was the model for the frame)
  const ribC = cv(1024, 1024, (g, W, H) => { const cx = W / 2, cy = H / 2; g.clearRect(0, 0, W, H); g.strokeStyle = '#ffd25a'; g.lineCap = 'round';
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; g.lineWidth = 14; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 480, cy + Math.sin(a) * 480); g.stroke(); }
    g.lineWidth = 7; for (let r = 70; r < 480; r += 52) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); } });
  const RIBS_ROOF = K.add(new THREE.PlaneGeometry(6.4, 6.4), new THREE.MeshBasicMaterial({ map: ctex(ribC), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), 0, 7.6, 10, NG, false);
  RIBS_ROOF.rotation.x = Math.PI / 2; K.noInk(RIBS_ROOF); RIBS_ROOF.material.color.setRGB(0.9, 0.55, 0.18);

  // ======================= F. THE CUTAWAY: the leaf's secret underneath =======================
  const FG = K.grp(K.scene, XF, 0, 0);
  const bgC = cv(512, 1024, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, H * 0.7); gr.addColorStop(0, '#ffcf7a'); gr.addColorStop(0.45, '#d8603a'); gr.addColorStop(1, '#3a1a3a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
  { const bg = K.add(new THREE.PlaneGeometry(26, 44), new THREE.MeshBasicMaterial({ map: ctex(bgC), fog: false }), 0, 2, -8, FG, false); K.noInk(bg); }
  const LEAF = K.grp(FG, 0, 1.6, 0);                                    // pivot for the flip
  const LR = 1.55;
  const cutTop = K.add(new THREE.CircleGeometry(LR, 64), K.toon({ map: ctex(leafTopC), color: '#ffffff', transparent: true, opacity: 1, side: THREE.DoubleSide }), 0, 0.01, 0, LEAF, false); cutTop.rotation.x = -Math.PI / 2;
  K.add(new THREE.CylinderGeometry(LR * 1.02, LR, 0.07, 64, 1, true), K.toon({ color: '#c8344a', side: THREE.DoubleSide }), 0, 0.04, 0, LEAF, false);
  const ribM = K.toon({ color: '#c83a5a', emissive: '#ff6a3a', emissiveIntensity: 0 }), crossM = K.toon({ color: '#e05a6a', emissive: '#ffb04a', emissiveIntensity: 0 });
  const RIBS = [], CROSS = [];
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, g = K.grp(LEAF, 0, -0.01, 0); g.rotation.y = a; const r = K.add(new THREE.BoxGeometry(LR * 0.95, 0.08, 0.04), ribM, LR * 0.48, -0.045, 0, g); r.scale.set(1, 1, 1); RIBS.push(r); }
  for (let k = 1; k <= 6; k++) { const rr = LR * k / 6.6; const t = K.add(new THREE.TorusGeometry(rr, 0.032, 6, 72), crossM, 0, -0.035, 0, LEAF); t.rotation.x = Math.PI / 2; CROSS.push(t); }
  const gridM = new THREE.MeshBasicMaterial({ color: '#e8f4ff', transparent: true, opacity: 0, depthWrite: false, fog: false }); const GRID = K.grp(LEAF, 0, -0.12, 0);
  for (let i = -6; i <= 6; i++) { K.noInk(K.add(new THREE.BoxGeometry(LR * 2, 0.012, 0.012), gridM, 0, 0, i * LR / 6, GRID, false)); K.noInk(K.add(new THREE.BoxGeometry(0.012, 0.012, LR * 2), gridM, i * LR / 6, 0, 0, GRID, false)); }
  K.warmLight(FG, 0, 3.5, 2.5, { i: 2.4, dist: 10, col: '#fff0d8', flicker: 0.0 }); K.warmLight(FG, -2, -0.5, 2, { i: 1.4, dist: 8, col: '#ffb8a0', flicker: 0.0 });
  K.motes(FG, { n: 40, box: [-3, -1, -2, 3, 4, 2], col: '#ffe0a0', size: 0.012, speed: 0.0012 });

  ST = { HERO, WHEEL, STAMP, MARK, FLY, PAL, GAL, RIBS_ROOF, LEAF, cutTop, ribM, crossM, gridM, drawSketch, water };
  return { update: (W, f) => {
    HERO.position.y = PAD[1] + (W.dip ?? 0); WHEEL.rotation.z = -f * 0.02;
    ST.water.material.map.offset.set(f * 0.0004, f * 0.0002);
    STAMP.position.y = W.stampY ?? 1.45; MARK.visible = !!W.mark;
    FLY.forEach((s, i) => { const t = W.fly ?? -1; if (t < 0) { s.position.y = -5; return; } const k = clamp(t - i * 0.05); s.position.set(0.55 + (rnd(i, 1) - 0.5) * 3.2 * k, 1.12 + Math.sin(k * Math.PI) * (0.8 + rnd(i, 2)), -0.25 + (rnd(i, 3) - 0.2) * 2.2 * k); s.rotation.set(k * 6 * rnd(i, 4), k * 4, k * 5 * rnd(i, 5)); });
    PAL.visible = !!W.palace; PAL.position.y = W.palY ?? 0;
    GAL.forEach((g) => { g.position.y = 2.55 + (W.bounce ?? 0); });
    RIBS_ROOF.material.opacity = W.roofRibs ?? 0;
    LEAF.rotation.x = W.flip ?? 0; LEAF.rotation.y = W.spin ?? 0; cutTop.material.opacity = W.topOp ?? 1;
    ribM.emissiveIntensity = (W.ribs ?? 0) * 0.9; crossM.emissiveIntensity = (W.cross ?? 0) * 0.9; gridM.opacity = (W.grid ?? 0) * 0.85;
    drawSketch(W.sketch ?? 0);
  } };
};
// ---------------- cast ----------------
const SK = '#f7f4ee';
const PAXTON = { tunic: '#2a5a3a', stick: true, skin: SK, hair: '#6a4228', hat: 'tophat', hatCol: '#22222a', hatBand: '#3a2a1e', collar: '#ffffff', tie: '#1e1e2a', moustache: '#6a4228', stache: 'chevron' };
const ANNIE = { tunic: '#f28ab0', dress: '#f28ab0', stick: true, skin: SK, hair: '#e8b860', collar: '#ffffff', pattern: { type: 'dots', col: '#ffffff' } };
const GARD = { tunic: '#7a5a3a', stick: true, skin: SK, hair: '#8a5a2a', hat: 'brim17', hatCol: '#d8b460', hatBand: '#7a4a2a', apron: '#3a6a3a' };
const GARDB = { tunic: '#3a6aa8', stick: true, skin: SK, hair: '#3a2a1c', hat: 'brim17', hatCol: '#c8a050', hatBand: '#3a2418', apron: '#efe2c4', beard: '#3a2a1c', beardStyle: 'short' };
const EXP = [
  { tunic: '#2a2a3a', stick: true, skin: SK, hair: '#d8d8d8', collar: '#ffffff', tie: '#1e1e2a', beard: '#d8d8d8', beardStyle: 'full' },
  { tunic: '#4a2a2a', stick: true, skin: SK, hair: '#3a2a1c', collar: '#ffffff', tie: '#7a1a2a', moustache: '#3a2a1c', stache: 'handlebar' },
  { tunic: '#1e3a5a', stick: true, skin: SK, hair: '#a8a8a8', collar: '#ffffff', tie: '#1e1e2a', glasses: true, beard: '#a8a8a8', beardStyle: 'goatee' },
  { tunic: '#3a3a2a', stick: true, skin: SK, hair: '#6a4228', collar: '#ffffff', tie: '#2a4a2a', moustache: '#6a4228', stache: 'walrus' }];
const TOP = (O, col = '#22222a') => ({ ...O, hat: 'tophat', hatCol: col, hatBand: '#3a2a1e' });
const SOLDIER = { tunic: '#c8202a', stick: true, skin: SK, hair: '#3a2a1c', hat: 'soldier', hatCol: '#1e1e24', hatBand: '#ffffff', collar: '#ffffff', pattern: { type: 'vstripes', col: 'rgba(255,255,255,.18)', scale: 1.6 } };
const CROWD = [{ tunic: '#7a3aa8', dress: '#7a3aa8', stick: true, skin: SK, hair: '#6a4228' }, { tunic: '#2a5a8a', stick: true, skin: SK, hair: '#3a2a1c', hat: 'tophat', hatCol: '#1e1e24' }, { tunic: '#2a8a6a', dress: '#2a8a6a', stick: true, skin: SK, hair: '#e8b860' }, { tunic: '#8a4a2a', stick: true, skin: SK, hair: '#a8a8a8', hat: 'tophat', hatCol: '#3a2a1e', beard: '#a8a8a8', beardStyle: 'short' }, { tunic: '#d8503a', dress: '#d8503a', stick: true, skin: SK, hair: '#3a2a1c' }];
export const actorsAt = (f, T) => {
  const S = shot(f), out = [], u = Math.floor(f / 2);
  const I = (seed) => { const i = idle(u, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const tintL = { cut: '#ffe6c8', gold: '#ffe0c4', rail: '#ffeedd', room: '#fff0e0' }[S.light] || '#ffffff';
  const card = (id, O, o, w, seed, extra = {}) => out.push({ key: id + JSON.stringify(o) + JSON.stringify(extra.y || 0), draw: (p) => T.romanFront(p, O, { seed, blink: blinkAt(u, seed), ...I(seed), L: 'hang', R: 'hang', look: 0, ...o }), x: w[0], y: w[1] + (extra.y || 0), z: w[2], s: extra.s ?? 0.9, ground: w[1], tint: tintL });
  const lilyCast = (ff, dip) => { card('annie', ANNIE, { expr: ff < 40 ? 'shock' : 'laugh', L: 'up', R: 'up', look: 0.2 }, A(PAD[0], PAD[1] + 0.03 + dip, PAD[2]), 51, { s: 0.55 });
    card('pax', PAXTON, { expr: ff < 50 ? 'grin' : 'smug', L: 'hip', R: 'point', look: 0.6 }, A(...PAX), 53, { s: 0.92 });
    card('g1', GARD, { expr: ff < 30 ? 'nervous' : 'shock', L: 'cheek', R: 'cheek', look: -0.3 }, A(...GARD1), 55); card('g2', GARDB, { expr: 'shock', L: 'up', R: 'hang', look: -0.5 }, A(...GARD2), 57); };
  switch (S.id) {
    case 'hook': lilyCast(f, dipAt(f)); break;
    case 'loop': lilyCast(0, 0); break;
    case 'lily': { const g = f >= 577; card('annie', ANNIE, { expr: 'laugh', L: 'up', R: 'up', look: 0.2 }, A(PAD[0], PAD[1] + 0.03, PAD[2]), 51, { s: 0.55 });
      card('pax', PAXTON, { expr: g ? 'smug' : 'grin', L: 'hip', R: g ? 'up' : 'point', look: 0.6 }, A(...PAX), 53, { s: 0.92 });
      card('g1', GARD, { expr: g ? 'eureka' : 'neutral', L: g ? 'up' : 'hang', R: g ? 'up' : 'hang', look: -0.3 }, A(...GARD1), 55); card('g2', GARDB, { expr: g ? 'shock' : 'smile', L: 'hip', R: 'hang', look: -0.5 }, A(...GARD2), 57); break; }
    case 'tease': case 'reject': { const rej = S.id === 'reject', pos = [[-1.25, 0, -1.65], [-0.45, 0, -1.75], [0.45, 0, -1.75], [1.3, 0, -1.6]];
      pos.forEach((p, i) => { const shake = rej ? (f > 1395 ? Math.sin(f * 0.5 + i) * 0.7 : 0) : (f > 290 ? Math.sin(f * 0.45 + i) * 0.7 : 0);
        const ex = rej ? (f > 1395 ? ['angry', 'unimpressed', 'sideeye', 'angry'][i] : 'stern') : (f > 285 ? ['sideeye', 'unimpressed', 'stern', 'smug'][i] : 'stern');
        card('e' + i, EXP[i], { expr: ex, look: q(shake + (i < 2 ? 0.4 : -0.4), 1), L: i === 1 && rej ? 'up' : 'hip', R: i === 2 ? 'cross' : 'hang', L2: 0 }, B(...p), 61 + i); }); break; }
    case 'park': card('chair', TOP(EXP[0]), { expr: f < 1060 ? 'nervous' : 'scared', L: 'hip', R: 'cheek', look: q(Math.sin(f * 0.02) * 0.8, 1), sweat: 0.6, sweatT: f / 60 }, C(0.4, 0, 2.2), 71); break;
    case 'doodle': { const k = f >= 1567; [[-1.1, -1.25], [-0.35, -1.3], [0.35, -1.3]].forEach(([x, z], i) => card('b' + i, EXP[(i + 1) % 4], { expr: 'stern', look: 0.4, talk: f < 1567 ? talkAt(f, 3 + i, 1) : -1, L: 'hip', R: i === 0 ? 'point' : 'hang' }, D(x, 0, z), 81 + i));
      card('pax', PAXTON, { expr: k ? 'eureka' : 'sleepy', L: 'hang', R: k ? 'grab' : 'cheek', gx: 0.3, gy: 0.4, look: -0.5 }, D(1.15, 0, -1.25), 53, { s: 0.92 }); break; }
    case 'palace': break;
    case 'critics': [[-1.0, 0, 3.4], [0, 0, 3.7], [1.0, 0, 3.4]].forEach((p, i) => card('c' + i, TOP(EXP[i + 1]), { expr: ['scared', 'unimpressed', 'angry'][i], L: i === 1 ? 'cross' : 'up', R: i === 1 ? 'cross' : 'point', look: q(-0.6 + i * 0.6, 1), talk: i === 2 ? talkAt(f, 9, 1.2) : -1 }, C(...p), 91 + i)); break;
    case 'march': { const held = f >= 2038; for (let i = 0; i < 6; i++) { const z = -6 + i * 0.9 + (f - 1946) * 0.012, st = Math.abs(Math.sin(f * 0.21)) * 0.04; card('s' + i, SOLDIER, { expr: 'stern', L: 'hang', R: 'hang', look: 0.8 }, Ev(-4.6, 2.62, z), 101 + i, { y: st }); }
      if (held) card('paxh', PAXTON, { expr: 'smug', L: 'hip', R: 'up', look: -0.4 }, Ev(-1.4, 0, -1.2), 53, { s: 0.92 }); break; }
    case 'nave': for (let i = 0; i < 26; i++) { const z = -16 + (i % 13) * 1.7 + rnd(i, 1) * 0.6, x = (i < 13 ? -1 : 1) * (0.6 + rnd(i, 2) * 1.8); card('n' + i, CROWD[i % 5], { expr: ['smile', 'grin', 'shock', 'laugh', 'eureka'][i % 5], L: i % 3 ? 'hang' : 'up', R: i % 4 ? 'point' : 'hang', look: q((rnd(i, 3) - 0.5) * 1.6, 1) }, Ev(x, 0, z), 120 + i, { s: 0.82 + rnd(i, 4) * 0.1 }); } break;
    case 'roof': break;
  }
  return out;
};
// ---------------- fx ----------------
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'lily' && f >= 580) { out.push(emote('!', f - 580, A(GARD1[0] - 0.25, 1.8, GARD1[2] + 0.1), { s: 0.2 })); if (f >= 586) out.push(emote('!', f - 586, A(GARD2[0] + 0.2, 1.8, GARD2[2] + 0.1), { s: 0.2 })); }
  if (S.id === 'doodle' && f >= 1570) out.push(emote('bulb', f - 1570, D(1.15, 1.95, -1.2), { s: 0.24 }));
  if (S.id === 'critics' && f >= 1885) out.push(emote('?', f - 1885, C(0, 1.85, 3.75), { s: 0.24 }));
  if (S.id === 'park' && f >= 1010) out.push(emote('?', f - 1010, C(0.15, 1.85, 2.25), { s: 0.24 }));
  return out; };
// ---------------- camera ----------------
const yawLook = (pos, look, deg) => { const a = deg * Math.PI / 180, dx = look[0] - pos[0], dz = look[2] - pos[2]; return [pos[0] + dx * Math.cos(a) - dz * Math.sin(a), look[1], pos[2] + dx * Math.sin(a) + dz * Math.cos(a)]; };
const orbit = (c, ang, d, y) => [c[0] + Math.sin(ang * Math.PI / 180) * d, y, c[2] + Math.cos(ang * Math.PI / 180) * d];
const HOOK0 = { pos: A(0.9, 1.15, 0.95), look: A(0.15, 0.42, -1.75), fov: 46 };
const camRaw = (f) => { const S = shot(f), v = (f - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v);
  switch (S.id) {
    case 'hook': return { pos: lerp3(HOOK0.pos, A(0.7, 1.0, 0.35), sv), look: lerp3(HOOK0.look, A(0.15, 0.5, -1.85), sv), fov: 46 };
    case 'loop': return { pos: lerp3(A(1.3, 1.4, 1.8), HOOK0.pos, E.smooth(ramp(f, 2541, 2599))), look: lerp3(A(0.25, 0.5, -1.6), HOOK0.look, E.smooth(ramp(f, 2541, 2599))), fov: 46 };
    case 'tease': return { pos: lerp3(B(-0.2, 1.25, 2.4), B(0.05, 1.32, 1.35), sv), look: B(0, 1.1, -1.2), fov: 46 };
    case 'lily': { const k = E.smooth(ramp(f, 348, 520)), k2 = E.smooth(ramp(f, 540, 600)); return { pos: lerp3(lerp3(A(-3.4, 5.0, 4.2), A(-1.2, 1.4, 1.6), k), A(0.55, 0.3, -0.6), k2), look: lerp3(lerp3(A(0, 1.0, -1.0), A(0.1, 0.6, -1.9), k), A(0.2, 0.12, -1.6), k2), fov: lerp(52, 40, k) }; }
    case 'cut': { const p = orbit([0, 0, 0], lerp(-18, 14, sv), lerp(7.4, 6.4, sv), lerp(3.0, 0.7, E.smooth(ramp(f, 608, 700)))); return { pos: F(...p), look: F(0, 1.35, 0), fov: 44 }; }
    case 'park': return { pos: lerp3(C(-2.6, 1.6, 6.2), C(1.6, 1.3, 5.4), sv), look: lerp3(C(-1.0, 1.4, -4), C(0.4, 1.3, 2.2), E.smooth(ramp(f, 953, 1080))), fov: 48 };
    case 'reject': { const k = E.smooth(ramp(f, 1168, 1300)); return { pos: lerp3(B(1.7, 2.0, 1.7), B(1.25, 1.85, 0.95), k), look: lerp3(B(0.45, 1.25, -0.6), B(0.55, 1.2, -0.45), k), fov: 44 }; }
    case 'doodle': { const k = E.smooth(ramp(f, 1590, 1650)); return { pos: lerp3(lerp3(D(-0.3, 1.5, 2.2), D(1.9, 1.35, 0.9), E.smooth(ramp(f, 1441, 1585))), D(0.63, 1.42, -0.14), k), look: lerp3(lerp3(D(0, 1.15, -1.0), D(1.1, 1.2, -1.2), E.smooth(ramp(f, 1441, 1585))), D(0.62, 0.79, -0.22), k), fov: lerp(46, 40, k) }; }
    case 'palace': return { pos: lerp3(C(1.5, 0.9, 17), C(0.6, 1.7, 11.5), sv), look: lerp3(C(0, 3.5, -8), C(0, 4.2, -8), sv), fov: 52 };
    case 'critics': return { pos: orbit([XC, 0, 3.55], lerp(-14, 6, sv), lerp(2.6, 2.2, sv), 1.25), look: C(0, 1.4, 3.5), fov: 46 };
    case 'march': return { pos: lerp3(Ev(-2.0, 3.2, -1.0), Ev(-2.3, 3.1, -2.4), sv), look: lerp3(Ev(-4.6, 3.2, -4.6), Ev(-4.6, 3.2, -3.4), sv), fov: 46 };
    case 'nave': return { pos: lerp3(Ev(0, 1.4, 6), Ev(0, 4.2, 2), sv), look: lerp3(Ev(0, 1.6, -12), Ev(0, 3.6, -14), sv), fov: 50 };
    case 'roof': return { pos: lerp3(Ev(0.2, 2.0, 15.5), Ev(0, 1.5, 13.2), sv), look: lerp3(Ev(0, 6.0, 11.5), Ev(0, 7.6, 10.0), sv), fov: 54 };
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
    case 'hook': { const k = E.smooth(ramp(f, 10, 55)); return { focus: lerp(1.0, dist(C0.pos, A(PAD[0], 0.5, PAD[2])), k), cinf: lerp(16, 9, k) }; }
    case 'loop': return at(A(PAD[0], 0.6, PAD[2]), 10);
    case 'lily': return at(f > 540 ? A(PAD[0], 0.1, PAD[2]) : A(PAD[0], 0.6, PAD[2]), 10);
    case 'tease': case 'reject': return at(B(0.4, 1.2, -1.2), 10);
    case 'cut': return at(F(0, 1.5, 0), 6);
    case 'park': return at(C(0.4, 1.3, 2.2), 8);
    case 'doodle': return at(f > 1600 ? D(0.62, 0.8, -0.22) : D(1.0, 1.2, -1.2), f > 1600 ? 12 : 9);
    case 'palace': return at(C(0, 3, -8), 3);
    case 'critics': return at(C(0, 1.4, 3.5), 9);
    case 'march': return at(Ev(-4.6, 3.2, -3.4), 9);
    case 'nave': return at(Ev(0, 2.5, -7), 5);
    case 'roof': return at(Ev(0, 7.6, 10), 4);
  }
  return { focus: 5, cinf: 0 }; };
export const worldAt = (f) => { const S = shot(f), W = {};
  if (S.id === 'hook') W.dip = q(dipAt(f), 4);
  if (S.id === 'tease' || S.id === 'reject') { W.stampY = 1.45; if (S.id === 'reject') { const hits = [1290, 1340, 1401]; let y = 1.45; for (const h of hits) { if (f >= h - 8 && f < h + 14) y = f < h ? lerp(1.45, 1.13, E.easeIn((f - h + 8) / 8)) : lerp(1.13, 1.45, E.easeOut((f - h) / 14)); } W.stampY = q(y, 3); W.mark = f >= 1401; W.fly = f >= 1405 ? q(ramp(f, 1405, 1440), 3) : -1; } }
  if (S.id === 'palace' || S.id === 'critics') { W.palace = 1; W.palY = S.id === 'palace' ? q(lerp(-7.2, 0, E.easeOut(ramp(f, 1747, 1830))), 3) : 0; }
  if (S.id === 'march') W.bounce = q(0.012 * Math.sin(f * 0.42), 4);
  if (S.id === 'roof') W.roofRibs = q(0.85 * E.smooth(ramp(f, 2380, 2460)), 3);
  if (S.id === 'cut') { const fl = E.smooth(ramp(f, 612, 690)); W.flip = q(lerp(0, Math.PI * 0.82, fl), 3); W.spin = q(f * 0.002, 3); W.topOp = q(lerp(1, 0.2, E.smooth(ramp(f, 650, 700))), 3);
    W.ribs = q(E.smooth(ramp(f, 700, 740)), 3); W.cross = q(E.smooth(ramp(f, 842, 880)), 3); W.grid = q(E.smooth(ramp(f, 912, 945)), 3); }
  if (S.id === 'doodle') W.sketch = q(E.smooth(ramp(f, 1600, 1740)), 2);
  return W; };
// ---------------- handwritten labels ----------------
export const annotAt = (f) => { const S = shot(f); if (S.id !== 'cut') return [];
  const fl = Math.PI * 0.82, sp = f * 0.002, pt = (r, a) => { const x = Math.cos(a) * r, z = Math.sin(a) * r; const y1 = -0.06 * Math.cos(fl) - z * Math.sin(fl), z1 = -0.06 * Math.sin(fl) + z * Math.cos(fl);
    return F(x * Math.cos(sp) + z1 * Math.sin(sp), 1.6 + y1, -x * Math.sin(sp) + z1 * Math.cos(sp)); };
  return [...(f >= 712 ? [{ type: 'label', text: 'ribs', at: pt(0.95, 0.3), dx: 150, dy: -300, age: f - 712, bend: -0.2 }] : []),
    ...(f >= 848 ? [{ type: 'label', text: 'cross-ribs', at: pt(0.7, 2.4), dx: -160, dy: 330, age: f - 848, bend: 0.25 }] : [])]; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
