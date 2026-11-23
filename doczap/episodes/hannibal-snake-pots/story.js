// Doc Zap — "Hannibal's snake pots" (Hannibal for Prusias I of Bithynia vs Eumenes II of Pergamon, c. 184 BC; Nepos, Justin, Frontinus).
// Built with the world kit (docs/ENGINE.md). Voice: Patrick, Eleven v4. 41.1 s = 2466 frames @ 60 fps. Timed in 60-fps frames.
// The last shot returns to frame 0 (jar spinning past the lens), so the video loops.
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, talkAt, q } from './motion.js';
import { LP, tint, withHaze } from './kit/lights.js';
import { emote } from './kit/emotes.js';
export const FPS = 60, TOTAL = 2466, DECK = 0, LOOK = 'mini';
// ---------------- shots ----------------
const SH = [
  ['hook', 0, 137, 'sea'], ['fly', 138, 269, 'sea'], ['fleet', 270, 544, 'fleet'], ['order', 545, 763, 'sea'],
  ['smash', 764, 904, 'sea'], ['laugh', 905, 1014, 'sea'], ['move', 1015, 1129, 'sea'], ['scared', 1130, 1171, 'sea'],
  ['camp', 1172, 1419, 'camp'], ['jarcut', 1420, 1599, 'camp'], ['panic', 1600, 1849, 'sea'], ['flee', 1850, 1904, 'sea'],
  ['won', 1905, 2024, 'sea'], ['hall', 2025, 2329, 'hall'], ['loop', 2330, 2465, 'sea']];
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a, b, light }));
export const WHIPS = [138, 270, 545, 764, 1172, 1600, 1850, 2025, 2330];
export const WHIP_FRAMES = WHIPS.map((a) => [a - 14, a + 18]);
export const CUTS = [];
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = shot;
export const LIGHTS = {
  sea: tint(LP.day, { az: 215, el: 34, sun: '#fff0d4', sunI: 1.3, fog: '#cfe0ee', fogNear: 25, fogFar: 230, skyTop: '#2f7fe0', skyHor: '#d6ecff', shadowExt: 9, bloom: 0.5, sat: 1.18 }),
  fleet: tint(LP.day, { az: 215, el: 40, fog: '#d4e6f4', fogNear: 60, fogFar: 520, shadowExt: 60, ink: 1.0 }),
  camp: tint(LP.night, { hemi: 0.78, sat: 1.08, fogNear: 6, fogFar: 30, bloom: 0.8, rimCol: '#ffb070', rimDir: [-0.8, 0.5] }),
  hall: tint(LP.candle, { hemi: 0.95, sat: 1.05, fogNear: 6, fogFar: 22 }),
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- world layout ----------------
const XS = 60000, XF = 62000, XC = 64000, XH = 66000;
const A = [XS, 0, 0], B = [XS + 1, 0, -13];                 // our ship (red sails) / enemy ship (blue sails); decks at y = 0
const at = (o, p) => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
const SEA_Y = -1.2;
// cast positions (ship-local)
const SAIL_A = [1.25, 0, -0.6], SAIL_B = [0.35, 0, 0.25], HAN = [2.15, 0, 0.45];
const ADM = [-1.25, 0, -0.45], EN1 = [-2.15, 0, -0.65], EN2 = [-0.4, 0, -0.75];
const CAMP_M1 = [-0.6, 0, 0.2], CAMP_M2 = [0.75, 0, -0.1], CAMP_H = [2.0, 0, -1.4];
const HY = 1.33;
// jar flight: from the sailor's hand (computed from the card geometry at release) to the enemy deck
const R1 = [0.97, 1.8, -2.6], L1 = [1.16, 1.42, 0.1], HAN_H = [1.75, 0, 0.75];        // hook camera (ship-local)
const handWorld = (P, cam, dx = 0.3, dy = 1.47) => { const th = Math.atan2(cam[0] - P[0], cam[2] - P[2]); return [P[0] + Math.cos(th) * dx, P[1] + dy, P[2] - Math.sin(th) * dx]; };
const JS = handWorld(at(A, SAIL_A), at(A, R1)), JE = at(B, [-0.7, 0.17, 0.45]);
const jarP = (p) => [lerp(JS[0], JE[0], p), lerp(JS[1], JE[1], p) + 4 * 1.6 * p * (1 - p), lerp(JS[2], JE[2], p)];
const flightP = (f) => f < 138 ? 0.02 + 0.13 * Math.pow(f / 137, 1.6) : f < 270 ? lerp(0.18, 0.8, E.smooth((f - 138) / 131)) : f >= 2420 ? lerp(0.0, 0.02, (f - 2420) / 45) : -1;
// smashed jars on the enemy deck: landing point (ship-local), frame
const SMASH = [[[-0.7, 0, 0.45], 778], [[-1.8, 0, 0.15], 806], [[-1.15, 0, -0.25], 838]];
// ---------------- the sets ----------------
let ST = {};
export const sets = (K) => {
  const { THREE, prop } = K;
  const P = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  // ---- sea (vertex waves + scrolling painted texture) ----
  const seaTex = P(512, 512, (g, W, H) => { g.fillStyle = '#2f7fb8'; g.fillRect(0, 0, W, H); let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(20,70,130,${0.15 + r() * 0.2})`; g.beginPath(); g.ellipse(r() * W, r() * H, 30 + r() * 60, 8 + r() * 14, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 520; i++) { const x = r() * W, y = r() * H; g.strokeStyle = r() < 0.65 ? 'rgba(255,255,255,.55)' : 'rgba(10,50,100,.35)'; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 9, y - 5, x + 20 + r() * 10, y); g.stroke(); } });
  const makeSea = (x, z, size, seg, rep) => { const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2); const t = ctex(seaTex, rep, rep);
    const m = K.add(geo, K.toon({ map: t, color: '#ffffff' }), x, SEA_Y, z, K.scene, false); m.userData.base = Float32Array.from(geo.attributes.position.array); m.userData.tex = t; return m; };
  const seaA = makeSea(XS, -6, 240, 120, 60), seaF = makeSea(XF, -30, 1400, 80, 220);
  const waves = (m, f, amp) => { const p = m.geometry.attributes.position, b = m.userData.base, t = f / 60; for (let i = 0; i < p.count; i++) { const x = b[i * 3], z = b[i * 3 + 2];
      p.array[i * 3 + 1] = amp * (0.55 * Math.sin(0.33 * x + t * 1.3) + 0.35 * Math.sin(0.47 * z - t * 1.1) + 0.2 * Math.sin(1.1 * (x + z) + t * 2.2)); } p.needsUpdate = true; m.geometry.computeVertexNormals(); m.userData.tex.offset.set(t * 0.012, t * 0.007); };
  // ---- terracotta jars ----
  const jarCanvas = P(256, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#d8743a'); gr.addColorStop(1, '#b85a2a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a1a12'; g.fillRect(0, H * 0.32, W, 10); g.fillRect(0, H * 0.58, W, 6); for (let x = 0; x < W; x += 32) { g.strokeStyle = '#2a1a12'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, H * 0.4); g.lineTo(x + 10, H * 0.4); g.lineTo(x + 10, H * 0.5); g.lineTo(x + 22, H * 0.5); g.lineTo(x + 22, H * 0.42); g.stroke(); }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,220,180' : '80,30,10'},.08)`; g.fillRect(Math.random() * W, Math.random() * H, 3, 3); } });
  const clay = K.toon({ map: ctex(jarCanvas) }), clayIn = K.toon({ color: '#8a4020' }), wax = K.toon({ color: '#c89a3a' });
  const JR = (t) => t < 0.08 ? 0.09 + t * 0.6 : t < 0.78 ? 0.14 + 0.05 * Math.sin(Math.PI * (t - 0.08) / 0.7) - (t > 0.6 ? (t - 0.6) * 0.45 : 0) : t < 0.92 ? 0.075 : 0.088;
  const jarGeo = (H = 0.44, hollow = false, wall = 0.018) => { const pts = []; if (hollow) pts.push(new THREE.Vector2(0.0001, 0)); for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(JR(t), t * H)); }
    if (hollow) { for (let i = 24; i >= 1; i--) { const t = i / 24; pts.push(new THREE.Vector2(JR(t) - wall, t * H)); } pts.push(new THREE.Vector2(0.0001, wall * 1.5)); } return new THREE.LatheGeometry(pts, 28); };
  const JG = jarGeo();
  const jar = (parent, x, y, z, s = 1, lid = true) => { const g = K.grp(parent, x, y, z); g.scale.setScalar(s); K.add(JG, clay, 0, 0, 0, g); K.add(new THREE.CircleGeometry(0.09, 20), clayIn, 0, 0.002, 0, g, false).rotation.x = Math.PI / 2; if (lid) K.add(new THREE.CylinderGeometry(0.095, 0.095, 0.025, 18), wax, 0, 0.445, 0, g); return g; };
  // ---- snakes: a chain of segments that follows its own path (body retraces the head's curve) ----
  const segG = new THREE.SphereGeometry(1, 12, 9), eyeW = K.toon({ color: '#ffffff' }), eyeK = K.toon({ color: '#141418' }), tongueM = K.toon({ color: '#d0283a' });
  const snakeTex = ctex(P(256, 64, (g, W, H) => { g.fillStyle = '#4c9a32'; g.fillRect(0, 0, W, H); g.fillStyle = '#2c6420'; for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x + 16, H * 0.15); g.lineTo(x + 29, H * 0.5); g.lineTo(x + 16, H * 0.85); g.lineTo(x + 3, H * 0.5); g.fill(); }
    g.fillStyle = '#e8cc3a'; for (let x = 0; x < W; x += 64) g.fillRect(x, 0, 9, H); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, H * 0.44, W, 4); }));
  const snakeM = K.toon({ map: snakeTex }), headM = K.toon({ color: '#4c9a32' });
  /** snake = tapered tube rebuilt each frame from its segment points + a head with eyes and a flicking tongue */
  const makeSnake = (parent, n = 26, r = 0.03) => { const g = K.grp(parent), RS = 8, pos = new Float32Array(n * RS * 3), uv = new Float32Array(n * RS * 2), idx = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < RS; j++) { uv[(i * RS + j) * 2] = i / 6; uv[(i * RS + j) * 2 + 1] = j / RS; }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < RS; j++) { const a = i * RS + j, b = i * RS + (j + 1) % RS, c = (i + 1) * RS + j, d = (i + 1) * RS + (j + 1) % RS; idx.push(a, b, c, b, d, c); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const body = K.add(geo, snakeM, 0, 0, 0, g); body.frustumCulled = false;
    const head = K.add(segG, headM, 0, 0, 0, g); head.scale.set(r * 1.7, r * 1.0, r * 1.3);
    for (const sd of [-1, 1]) { const e = K.add(segG, eyeW, 0.42, 0.5, sd * 0.55, head); e.scale.setScalar(0.34); const p = K.add(segG, eyeK, 0.56, 0.58, sd * 0.62, head); p.scale.setScalar(0.18); }
    const tg = K.add(new THREE.ConeGeometry(0.1, 0.9, 5), tongueM, 1.35, -0.15, 0, head, false); tg.rotation.z = -Math.PI / 2;
    g.userData = { n, r, RS, geo, head, tongue: tg, segs: { length: n } }; return g; };
  const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  const poseSnake = (sn, pts, f) => { const { n, r, RS, geo, head, tongue } = sn.userData, P_ = geo.attributes.position.array;
    for (let i = 0; i < n; i++) { const p = pts[Math.min(i, pts.length - 1)], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      _t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (_t.lengthSq() < 1e-10) _t.set(1, 0, 0); _t.normalize(); _n.crossVectors(_t, _up); if (_n.lengthSq() < 1e-6) _n.set(1, 0, 0); _n.normalize(); _b.crossVectors(_n, _t);
      const rad = r * (i < 2 ? 0.8 + 0.1 * i : Math.max(0.12, 1 - 0.85 * Math.pow(i / n, 1.4)));
      for (let j = 0; j < RS; j++) { const an = j / RS * Math.PI * 2, c = Math.cos(an) * rad, s2 = Math.sin(an) * rad * 0.82, k = (i * RS + j) * 3; P_[k] = p[0] + _n.x * c + _b.x * s2; P_[k + 1] = p[1] + _n.y * c + _b.y * s2; P_[k + 2] = p[2] + _n.z * c + _b.z * s2; } }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    const a = pts[0], b = pts[1]; head.position.set(a[0] + (a[0] - b[0]) * 0.6, a[1] + r * 0.15, a[2] + (a[2] - b[2]) * 0.6); head.rotation.set(0, Math.atan2(-(a[2] - b[2]), a[0] - b[0]), 0); tongue.visible = (Math.floor(f / 7) % 3) === 0; };
  /** slithering along a straight heading from origin O on a floor y; segments not yet "out" stay coiled at O */
  const slither = (sn, O, ang, s, f, amp = 0.07) => { const r = sn.userData.r, n = sn.userData.n, sp = r * 1.25, pts = [], dx = Math.cos(ang), dz = -Math.sin(ang);
    for (let i = 0; i < n; i++) { const si = s - i * sp; if (si >= 0) { const lat = amp * Math.sin(si * 11 - 0.5); pts.push([O[0] + dx * si - dz * lat, O[1] + r * 0.8, O[2] + dz * si + dx * lat]); }
      else { const k = -si / sp, a = k * 0.55 + ang, rr = r * 1.6 + k * r * 0.12; pts.push([O[0] + Math.cos(a) * rr, O[1] + r * 0.8 + k * r * 0.05, O[2] - Math.sin(a) * rr]); } } poseSnake(sn, pts, f); };
  // ---- ships ----
  const hullS = new THREE.Shape(); hullS.moveTo(-7, -1.5); hullS.lineTo(6, -1.5); hullS.quadraticCurveTo(8.2, -1.4, 8.6, 0.2); hullS.lineTo(9.0, 1.5); hullS.lineTo(8.4, 1.55); hullS.lineTo(7.6, 0); hullS.lineTo(-6.6, 0); hullS.lineTo(-7.6, 1.1); hullS.quadraticCurveTo(-8.4, 2.1, -8.0, 2.7); hullS.lineTo(-8.5, 2.6); hullS.quadraticCurveTo(-9.2, 0.4, -7, -1.5);
  const hullG = new THREE.ExtrudeGeometry(hullS, { depth: 3.5, bevelEnabled: true, bevelSize: 0.18, bevelThickness: 0.18, bevelSegments: 3 }); hullG.translate(0, -0.21, -1.75);   // bevel grows the shape by 0.18: keep the hull top just under the deck planks
  { const uv = hullG.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v * 0.4, u * 0.12); } }
  const hullM = K.mat('planks', { seed: 31, lig: 32, hue: 24 }), deckM = K.mat('planks', { seed: 33, lig: 44 });
  const shieldTex = (c1, c2) => ctex(P(128, 128, (g) => { g.fillStyle = c1; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = c2; g.lineWidth = 12; g.beginPath(); g.arc(64, 64, 46, 0, 7); g.stroke(); g.fillStyle = c2; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 9 : 24; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); } g.fill(); g.lineWidth = 6; g.strokeStyle = '#1e1e24'; g.beginPath(); g.arc(64, 64, 61, 0, 7); g.stroke(); }));
  const sailTex = (c1, c2) => ctex(P(256, 256, (g, W, H) => { g.fillStyle = '#f2e8d0'; g.fillRect(0, 0, W, H); g.fillStyle = c1; for (let i = 0; i < 8; i += 2) g.fillRect(i * W / 8, 0, W / 8, H); g.fillStyle = 'rgba(0,0,0,.07)'; for (let i = 0; i < 600; i++) g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    g.fillStyle = c2; g.beginPath(); g.arc(W / 2, H * 0.48, 34, 0, 7); g.fill(); g.strokeStyle = '#1e1e24'; g.lineWidth = 5; g.stroke(); }));
  const eyeTex = ctex(P(128, 64, (g) => { g.fillStyle = '#f4f0e6'; g.beginPath(); g.ellipse(64, 32, 58, 26, 0, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#1e1e24'; g.stroke(); g.fillStyle = '#1e1e24'; g.beginPath(); g.arc(70, 32, 17, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 26, 5, 0, 7); g.fill(); }));
  const ship = (pos, team, detail = true, s = 1) => { const red = team === 'red', c1 = red ? '#b8262e' : '#2a5ab0', c2 = red ? '#e8c040' : '#f2f2f2';
    const g = K.grp(K.scene, pos[0], pos[1], pos[2]); g.scale.setScalar(s); K.add(hullG, hullM, 0, 0, 0, g);
    const band = K.toon({ color: c1 }); for (const sz of [-1, 1]) K.add(new THREE.BoxGeometry(14.6, 0.22, 0.04), band, 0.4, -0.2, sz * 1.95, g, false);
    const mast = K.add(new THREE.CylinderGeometry(0.11, 0.14, 9, 10), K.M.woodD, 0.3, 4.5, 0, g); K.add(new THREE.CylinderGeometry(0.06, 0.06, 7.2, 8), K.M.woodD, 0.42, 8.2, 0, g).rotation.x = Math.PI / 2;
    const sail = K.add(new THREE.PlaneGeometry(6.6, 4.8, 8, 4), K.toon({ map: sailTex(c1, c2), side: THREE.DoubleSide }), 0.5, 5.75, 0, g, true); sail.rotation.y = Math.PI / 2;
    { const p = sail.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.45 * Math.cos(x / 3.3 * Math.PI / 2) * (0.6 + 0.4 * (y + 2.4) / 4.8)); } sail.geometry.computeVertexNormals(); }
    K.add(new THREE.ConeGeometry(0.26, 1.3, 12), K.toon({ color: '#b08a3a' }), 9.2, -1.05, 0, g, false).rotation.z = -Math.PI / 2;
    for (const sz of [-1, 1]) { const e = K.add(new THREE.PlaneGeometry(0.75, 0.38), K.toon({ map: eyeTex, transparent: true, alphaTest: 0.4 }), 7.4, -0.55, sz * 1.96, g, false); e.rotation.y = sz > 0 ? 0 : Math.PI; }
    if (detail) {
      K.add(K.tplane(14.2, 3.35, 1.2), deckM, 0.5, 0.012, 0, g, false).rotation.x = -Math.PI / 2;
      for (const sz of [-1, 1]) { K.add(K.tbox(14.4, 0.62, 0.12, 0.9), hullM, 0.5, 0.31, sz * 1.72, g); K.add(new THREE.BoxGeometry(14.5, 0.08, 0.22), K.M.woodD, 0.5, 0.64, sz * 1.72, g); }
      const sm = K.toon({ map: shieldTex(c1, c2) }); for (const sz of [-1, 1]) for (let k = 0; k < 9; k++) { const sh = K.add(new THREE.CircleGeometry(0.3, 20), sm, -5 + k * 1.35, 0.35, sz * 1.85, g, false); sh.rotation.y = sz > 0 ? 0 : Math.PI; }
      for (const sz of [-1, 1]) for (let k = 0; k < 10; k++) { const o = K.add(new THREE.CylinderGeometry(0.035, 0.035, 4.2, 6), K.M.wood, -5.2 + k * 1.2, -0.6, sz * 3.4, g, false); o.rotation.x = sz * 1.05; }
      for (const [a, b] of [[[0.3, 9, 0], [8.6, 1.5, 0]], [[0.3, 9, 0], [-8.0, 2.7, 0]], [[0.3, 8.6, 0], [0.3, 0.6, 1.7]], [[0.3, 8.6, 0], [0.3, 0.6, -1.7]]]) { const v = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)); const r = K.add(new THREE.CylinderGeometry(0.012, 0.012, v.length(), 4), K.M.rope, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, g, false); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); }
      const so = K.add(new THREE.BoxGeometry(0.12, 3.2, 0.32), K.M.woodD, -7.2, -0.4, 1.95, g, false); so.rotation.z = 0.5;
    }
    g.userData.sail = sail; return g; };
  const shipA = ship(A, 'red'), shipB = ship(B, 'blue');
  // deck dressing: our ship carries rows of sealed jars (the ammunition); theirs has barrels, crates, rope
  for (let k = 0; k < 7; k++) for (let j = 0; j < 2; j++) jar(shipA, -3.6 + k * 0.36, 0, 1.15 - j * 0.34, 1, true);
  for (let k = 0; k < 4; k++) jar(shipA, 4.4 + k * 0.36, 0, -1.25, 1, true);
  prop.barrel(shipA, { x: -1.6, z: -1.2, r: 0.28, h: 0.72 }); prop.crate(shipA, { x: 5.5, z: 1.0, s: 0.55, ry: 0.4 });
  prop.barrel(shipB, { x: 3.4, z: -1.15, r: 0.28, h: 0.72 }); prop.barrel(shipB, { x: 3.95, z: -1.1, r: 0.28, h: 0.72, ry: 0.6 }); prop.crate(shipB, { x: -2.6, z: -1.1, s: 0.6, ry: 0.2 }); prop.crate(shipB, { x: -2.5, z: -1.15, y: 0.6, s: 0.42, ry: -0.3 });
  { const coil = K.add(new THREE.TorusGeometry(0.22, 0.04, 6, 24), K.M.rope, 2.9, 0.05, 1.0, shipB, false); coil.rotation.x = Math.PI / 2; K.add(new THREE.TorusGeometry(0.16, 0.04, 6, 24), K.M.rope, 2.9, 0.11, 1.0, shipB, false).rotation.x = Math.PI / 2; }
  // the flying jar
  const fjar = jar(K.scene, 0, 0, 0, 1, true);
  // smashed jars: shards + snakes on the enemy deck
  const shardG = new THREE.TetrahedronGeometry(1, 0), rr = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  const puffTex = ctex(P(128, 128, (g, W, H) => { for (let k = 0; k < 7; k++) { const x = 64 + Math.cos(k * 0.9) * 16, y = 66 + Math.sin(k * 1.3) * 10, gr = g.createRadialGradient(x, y, 2, x, y, 30); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); } })); puffTex.wrapS = puffTex.wrapT = THREE.ClampToEdgeWrapping;
  const SM = SMASH.map(([p, f0], si) => { const g = K.grp(shipB, p[0], 0, p[2]); const sh = []; for (let i = 0; i < 16; i++) { const m = K.add(shardG, i % 3 ? clay : clayIn, 0, 0, 0, g); const s = 0.07 + rr(i, si) * 0.07; m.scale.set(s, s * 0.5, s * 1.3);
      const a = rr(i, si + 3) * Math.PI * 2, v = 0.6 + rr(i, si + 5) * 1.4; sh.push({ m, v: [Math.cos(a) * v, 1.2 + rr(i, si + 7) * 1.6, Math.sin(a) * v], rs: [rr(i, 1) * 6, rr(i, 2) * 6, rr(i, 3) * 6] }); }
    const fall = jar(g, 0, 0, 0, 1, true); const snakes = [0, 1].map(() => makeSnake(shipB, 28, 0.03));
    const puff = K.noInk(K.add(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, color: '#e8c8a0' }), 0, 0.25, 0, g, false)); puff.renderOrder = 6; K.billboard(puff);
    return { g, sh, f0, fall, snakes, p, puff }; });
  // extra snakes for the panic shot
  const PANIC = Array.from({ length: 6 }, (_, i) => ({ sn: makeSnake(shipB, 30, 0.045), O: [-2.6 + i * 0.5, 0.012, 0.85 - (i % 2) * 0.3], ang: [0.2, 2.9, -0.15, 3.3, 0.35, 2.7][i], f0: 1585 + i * 10 }));
  // ---- fleet (top-down "bigger. much bigger.") ----
  const simple = (x, z, team, ry) => { const g = ship([XF + x, 0, z], team, false, 1); g.rotation.y = ry; return g; };
  const RED = [[-6, 18], [4, 21], [-2, 27], [9, 26]].map(([x, z], i) => simple(x, z, 'red', Math.PI / 2 + 0.1 * (i - 1.5)));
  const BLUE = []; { let k = 0; for (let row = 0; row < 7; row++) for (let col = -3; col <= 3; col++) { if ((row + col) % 2 && row < 2) continue; const x = col * 13 + (row % 2) * 6 + Math.sin(k) * 2, z = -6 - row * 15 + Math.cos(k * 1.7) * 2; BLUE.push(simple(x, z, 'blue', -Math.PI / 2 + Math.sin(k * 2.3) * 0.12)); k++; } }
  // ---- night camp: tents, torches, campfire, baskets, jars, a work table with the cutaway jar ----
  const C = K.grp(K.scene, XC, 0, 0);
  { const gnd = K.add(K.tplane(80, 80, 2.5), K.mat('dirt', { seed: 4 }), 0, 0, 0, C, false); gnd.rotation.x = -Math.PI / 2; }
  prop.tent(C, { x: -2.6, z: -3.2, ry: 0.35, col: '#e8dcc0', col2: '#a8262e' }); prop.tent(C, { x: 3.3, z: -4.0, ry: -0.4, w: 2.6, d: 3.0, h: 2.2, col: '#e0d4b4', col2: '#7a1a24' });
  prop.torch(C, { x: -1.6, z: -0.9, y: 1.9, wall: false, i: 3.2, dist: 8, shadow: true }); prop.torch(C, { x: 2.2, z: 0.6, y: 1.9, wall: false, i: 2.6, dist: 7 }); prop.torch(C, { x: 0.2, z: -3.4, y: 1.9, wall: false, i: 2.2, dist: 7 });
  { const fire = K.grp(C, 0.4, 0, 1.9); for (let k = 0; k < 5; k++) { const l = K.add(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 7), K.M.woodD, 0, 0.12, 0, fire); l.rotation.set(Math.PI / 2 - 0.3, k * 1.26, 0); }
    for (let k = 0; k < 9; k++) K.add(new THREE.DodecahedronGeometry(0.11, 0), K.mat('stone', { seed: 50 }), Math.cos(k * 0.7) * 0.55, 0.06, Math.sin(k * 0.7) * 0.55, fire);
    K.flame(fire, 0, 0.12, 0, 0.62, { haloK: 0.7 }); K.flame(fire, 0.12, 0.1, 0.05, 0.4, { halo: false, seed: 9 }); K.warmLight(fire, 0, 0.8, 0, { i: 4.2, dist: 9, col: '#ff9a48', flicker: 0.22 }); }
  for (let k = 0; k < 9; k++) jar(C, -3.0 + (k % 5) * 0.38, 0, 0.9 + Math.floor(k / 5) * 0.4, 1, k % 3 !== 0);
  const basketM = K.mat('woodGrain', { seed: 61, lig: 48, hue: 38 }); for (const [x, z] of [[0.15, 0.55], [-1.3, 0.9], [1.6, -0.6]]) { K.add(new THREE.CylinderGeometry(0.26, 0.2, 0.36, 16, 1, true), basketM, x, 0.18, z, C).material.side = THREE.DoubleSide; K.add(new THREE.CircleGeometry(0.2, 16), basketM, x, 0.02, z, C, false).rotation.x = -Math.PI / 2; }
  const campSnakes = [0, 1, 2].map(() => makeSnake(C, 26, 0.028));
  // the work table + the cutaway jar (sliced open, snakes coiled inside, wax lid descending)
  const TBL = prop.table(C, { x: 3.0, z: 1.6, w: 1.3, d: 0.8 });
  const CJ = K.grp(C, 3.0, 0.78, 1.65); const cjBody = K.add(jarGeo(0.44, true, 0.02), clay, 0, 0, 0, CJ); cjBody.material = clay.clone(); cjBody.material.side = THREE.DoubleSide;
  CJ.scale.setScalar(1.25);
  const CUTSEC = K.section(CJ, { normal: [0, 0, -1], point: [XC + 3.0, 1.0, 1.65], cap: '#e0a070', hatch: 'rgba(110,40,20,.55)' });
  const cjLid = K.add(new THREE.CylinderGeometry(0.095, 0.095, 0.025, 18), wax, 0, 0.6, 0, CJ);
  const coils = [0, 1, 2].map(() => makeSnake(CJ, 34, 0.02));
  prop.candle(C, { x: 2.55, y: 0.78, z: 1.45, light: 0.55, h: 0.15, dist: 3 }); K.add(new THREE.BoxGeometry(0.16, 0.08, 0.1), wax, 3.45, 0.82, 1.5, C);
  // ---- hall: elephant fresco + the lone pot ----
  const Hroom = K.room({ x: XH, w: 6, d: 6, h: 4, floor: 'stone', floorOpts: { seed: 70, lig: 52, hue: 34 }, wall: 'plaster', wallOpts: { seed: 71, col: [36, 42, 72], bricks: 0.3 }, ceil: 'beams' });
  const fresco = P(1536, 640, (g, W, H) => { g.fillStyle = '#d8b07a'; g.fillRect(0, 0, W, H); g.fillStyle = '#b84a2a'; g.fillRect(0, 0, W, 40); g.fillRect(0, H - 40, W, 40); g.fillStyle = '#2a4a6a'; for (let x = 0; x < W; x += 60) { g.fillRect(x, 8, 30, 24); g.fillRect(x + 30, H - 32, 30, 24); }
    const ele = (x, y, s, fl) => { g.save(); g.translate(x, y); g.scale(fl * s, s); g.lineWidth = 7; g.strokeStyle = '#2a1a12'; g.fillStyle = '#8a8a96';
      g.beginPath(); g.ellipse(0, 0, 150, 95, 0, 0, 7); g.fill(); g.stroke(); for (const lx of [-100, -45, 45, 100]) { g.beginPath(); g.roundRect(lx - 24, 40, 48, 130, 14); g.fill(); g.stroke(); }
      g.beginPath(); g.ellipse(150, -40, 70, 65, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(200, -10); g.quadraticCurveTo(250, 80, 210, 150); g.lineTo(185, 145); g.quadraticCurveTo(215, 80, 170, 10); g.fill(); g.stroke();
      g.fillStyle = '#7a7a86'; g.beginPath(); g.ellipse(120, -40, 45, 60, -0.2, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(195, 20); g.quadraticCurveTo(240, 40, 255, 15); g.lineTo(250, 30); g.quadraticCurveTo(230, 60, 192, 34); g.fill(); g.stroke();
      g.fillStyle = '#1e1e24'; g.beginPath(); g.arc(170, -60, 9, 0, 7); g.fill(); g.fillStyle = '#b8262e'; g.beginPath(); g.roundRect(-80, -175, 150, 95, 8); g.fill(); g.stroke(); g.fillStyle = '#e8c040'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(-60 + k * 38, -150, 12, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = '#e8c040'; g.beginPath(); g.moveTo(-160, -20); g.lineTo(-200, 40); g.stroke(); g.restore(); };
    ele(300, 330, 0.95, 1); ele(780, 350, 1.05, 1); ele(1250, 330, 0.95, -1);
    g.fillStyle = 'rgba(80,50,20,.18)'; for (let i = 0; i < 60; i++) { g.beginPath(); g.ellipse(Math.random() * W, Math.random() * H, 10 + Math.random() * 60, 6 + Math.random() * 30, 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); let x = Math.random() * W, y = Math.random() * H; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += Math.random() * 40 - 20; y += 20; g.lineTo(x, y); } g.stroke(); } });
  K.add(new THREE.PlaneGeometry(4.8, 2.0), K.toon({ map: ctex(fresco) }), 0, 2.2, -2.98, Hroom, false);
  prop.torch(Hroom, { x: -2.7, z: -3.0, y: 2.0, i: 2.6, dist: 7, shadow: true }); prop.torch(Hroom, { x: 2.7, z: -3.0, y: 2.0, i: 2.4, dist: 7 });
  K.add(K.tbox(0.7, 1.0, 0.7, 1), K.mat('stone', { seed: 72, lig: 64 }), 0, 0.5, -0.6, Hroom); K.add(new THREE.BoxGeometry(0.82, 0.08, 0.82), K.mat('stone', { seed: 73, lig: 70 }), 0, 1.04, -0.6, Hroom);
  const pot = jar(Hroom, 0, 1.08, -0.6, 1.25, false); const potLid = K.add(new THREE.CylinderGeometry(0.095, 0.095, 0.025, 18), wax, 0, 0.445, 0, pot);
  const potSnake = makeSnake(pot, 8, 0.024); K.warmLight(Hroom, 0.4, 2.2, 1.0, { i: 1.6, dist: 4, col: '#ffcf90', flicker: 0.05 }); K.warmLight(Hroom, 0, 3.0, -1.4, { i: 2.4, dist: 6, col: '#ffd8a8', flicker: 0.04 });
  prop.rug(Hroom, { x: 0, z: 0.4, w: 2.4, d: 1.6, pattern: 'kilim', cols: ['#8a2a24', '#2a3a5a', '#e0b050', '#f0e2c0'] });
  // ---------------- per-frame state ----------------
  window.HDBG = { jarP, flightP, JS, JE, PANIC };
  ST = { seaA, seaF, fjar, SM, PANIC, shipB, CUTSEC, cjLid, coils, campSnakes, potLid, potSnake };
  return { update: (W, f, cam) => {
    const S = shot(f);
    if (S.light === 'sea') waves(seaA, f, 0.16); if (S.light === 'fleet') waves(seaF, f, 0.3);
    // flying jar
    const p = flightP(f); fjar.visible = p >= 0; if (p >= 0) { const pp = jarP(p); fjar.position.set(pp[0], pp[1], pp[2]); fjar.rotation.set(f * 0.045, f * 0.02, f * 0.06); }
    // enemy ship flees in its own shot (and stays far afterwards)
    const fl = W.flee ?? 0; shipB.position.set(B[0] + fl * 9, 0, B[2] - fl * 22); shipB.rotation.y = fl * 0.55;
    // smashed jars
    for (const s of SM) { const t = (f - s.f0) / 60; const vis = t > -0.5 && S.light === 'sea' && fl === 0; s.g.visible = vis; s.fall.visible = vis && t < 0; if (t < 0) s.fall.position.set(0, -t * 5, -t * 2.5);
      s.puff.visible = vis && t >= 0 && t < 0.7; if (s.puff.visible) { const k = t / 0.7; s.puff.scale.setScalar(0.2 + 0.55 * Math.sqrt(k)); s.puff.material.opacity = 0.6 * (1 - k); s.puff.position.y = 0.3 + 0.22 * k; } s.fall.rotation.set(f * 0.08, 0, f * 0.05);
      s.sh.forEach((o, i) => { o.m.visible = t >= 0; if (t < 0) return; const tt = Math.min(t, 0.9); let y = o.v[1] * tt - 4.9 * tt * tt; const ground = 0.02 + (i % 4) * 0.01; let sc = 1; if (y < ground) { y = ground; }
        const tl = Math.min(t, 0.45); o.m.position.set(o.v[0] * tl * 0.9, Math.max(ground, y), o.v[2] * tl * 0.9); o.m.rotation.set(o.rs[0] * tl, o.rs[1] * tl, o.rs[2] * tl); });
      s.snakes.forEach((sn, k) => { sn.visible = vis && t >= 0; if (!sn.visible) return; const O = [s.p[0] + (k ? 0.04 : -0.03), 0.012, s.p[2] + (k ? -0.03 : 0.02)]; const go = Math.max(0, (f - (1022 + k * 14 + SMASH.indexOf(SMASH.find((x) => x[1] === s.f0)) * 10)) / 60);
        slither(sn, O, [0.6, 2.4, -0.3, 1.7, 3.3, 0.2][(SM.indexOf(s) * 2 + k) % 6] + 0.0, Math.min(1.0, go * 0.42), f); }); }
    PANIC.forEach((o) => { o.sn.visible = S.id === 'panic'; if (o.sn.visible) slither(o.sn, o.O, o.ang, Math.max(0, (f - o.f0) / 60) * 0.5, f, 0.08); });
    // camp: snakes on the ground near the men + the coils in the cutaway jar
    campSnakes.forEach((sn, k) => { sn.visible = S.light === 'camp'; if (sn.visible) slither(sn, [-0.2 + k * 0.6, 0.012, 0.9 + k * 0.25], [2.2, 0.4, 1.4][k], 0.35 + 0.18 * Math.sin(f * 0.02 + k), f, 0.06); });
    coils.forEach((sn, k) => { const n = sn.userData.n, pts = []; for (let i = 0; i < n; i++) { const a = i * 0.3 + k * 2.1 + Math.sin(f * 0.05 + k) * 0.15, rr2 = 0.09 + 0.01 * Math.sin(i * 0.5 + f * 0.06 + k); pts.push([Math.cos(a) * rr2, 0.05 + i * 0.0062 + k * 0.03, Math.sin(a) * rr2]); } pts.reverse(); poseSnake(sn, pts, f + k * 5); });
    const ld = W.lid ?? 1; cjLid.position.y = 0.445 + ld * 0.32; cjLid.rotation.z = ld * 0.3;
    CUTSEC.set(W.cut ?? -0.5);
    // the lone pot: lid pops at "pot", a snake head peeks out
    const pk = W.peek ?? 0; potLid.position.set(0.02 * pk, 0.445 + 0.07 * pk, 0); potLid.rotation.z = -0.5 * pk; potSnake.visible = pk > 0.01;
    if (potSnake.visible) { const pts = []; for (let i = 0; i < 8; i++) pts.push([0.035 - i * 0.008, 0.43 + pk * 0.09 - i * 0.03, 0.01]); poseSnake(potSnake, pts, f); }
  } };
};
// ---------------- cast ----------------
const SK = '#f7f4ee';
const HANNIBAL = { tunic: '#8a1a2a', cape: '#3a2a6a', stick: true, skin: SK, hair: '#2a1a12', beard: '#2a1a12', beardStyle: 'short', hat: 'helmet', hatCol: '#c8a040', plume: '#f4f0e6', pattern: { type: 'stripes', col: 'rgba(232,192,64,.55)', scale: 0.9 } };
const SAILA = { tunic: '#c8643a', stick: true, skin: SK, hair: '#3a2a1c', moustache: '#3a2a1c', stache: 'chevron', pattern: { type: 'patches' } };
const SAILB = { tunic: '#d8b870', stick: true, skin: SK, hair: '#9a5228', beard: '#9a5228', beardStyle: 'stubble', hat: 'hood', hatCol: '#7a4a2a' };
const ADMIRAL = { tunic: '#2a4a9a', cape: '#e8e8f0', stick: true, skin: SK, hair: '#d8d8d8', beard: '#e0e0e0', beardStyle: 'full', hat: 'helmet', hatCol: '#aeb6bf', plume: '#2a6ad0' };
const ENEMY1 = { tunic: '#3a7ad0', stick: true, skin: SK, hair: '#2b211c', moustache: '#2b211c', stache: 'handlebar', pattern: { type: 'vstripes', col: 'rgba(255,255,255,.8)', scale: 1.3 } };
const ENEMY2 = { tunic: '#5a8ab8', stick: true, skin: SK, hair: '#c8862a', beard: '#c8862a', beardStyle: 'goatee', hat: 'turban', hatCol: '#e8e4d8', hatBand: '#2a5ab0' };
export const actorsAt = (f, T) => {
  const S = shot(f), out = [], u = Math.floor(f / 2);
  const I = (seed) => { const i = idle(u, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const tintL = S.light === 'camp' ? '#ffd8b4' : S.light === 'hall' ? '#ffe6c8' : '#ffffff';
  const card = (id, O, o, origin, pos, seed, extra = {}) => { const w = at(origin, pos); out.push({ key: id + JSON.stringify(o) + JSON.stringify(extra), draw: (p) => T.romanFront(p, O, { seed, blink: blinkAt(u, seed), ...I(seed), L: 'hang', R: 'hang', look: 0, ...o }), x: w[0], y: w[1] + (extra.y || 0), z: w[2], s: 0.9, ground: w[1], tint: tintL, ...extra }); };
  const jump = (k, ph) => q(0.16 * Math.abs(Math.sin(f * k + ph)), 3);
  switch (S.id) {
    case 'hook': case 'loop': { const held = S.id === 'loop' && f < 2420;
      card('sa', SAILA, { expr: held ? 'smile' : 'grin', R: 'up', L: 'hip', tool: held ? 'jar' : undefined, look: -0.3 }, A, SAIL_A, 41);
      card('han', HANNIBAL, { expr: 'smug', L: 'hip', R: 'hip', look: -0.4 }, A, HAN_H, 23);
      card('sb', SAILB, { expr: 'grin', R: 'grab', gx: 0.2, gy: 0.35, tool: 'jar', look: -0.2 }, A, SAIL_B, 43); break; }
    case 'order': { const t = f >= 690 && f < 752 ? talkAt(f, 5, 1.1) : -1;
      card('han', HANNIBAL, { expr: f < 650 ? 'smug' : f < 690 ? 'sly' : 'stern', talk: t, L: 'hip', R: f >= 690 ? 'point' : 'hip', look: -0.5 }, A, HAN, 23);
      card('sa', SAILA, { expr: f < 705 ? 'neutral' : 'nervous', R: 'grab', gx: 0.2, gy: 0.35, tool: 'jar', look: 0.4 }, A, SAIL_A, 41);
      card('sb', SAILB, { expr: f < 715 ? 'neutral' : 'unimpressed', R: 'grab', gx: 0.2, gy: 0.35, tool: 'jar', look: 0.4 }, A, SAIL_B, 43); break; }
    case 'laugh': card('adm', ADMIRAL, { expr: 'laugh', talk: talkAt(f, 9, 1.4), L: 'belly', R: 'point', look: 0 }, B, ADM, 51); card('e1', ENEMY1, { expr: 'laugh', talk: talkAt(f, 11, 1.5), L: 'belly', R: 'belly' }, B, EN1, 53); card('e2', ENEMY2, { expr: 'laugh', L: 'point', R: 'belly', talk: talkAt(f, 13, 1.3) }, B, EN2, 55); break;
    case 'scared': card('adm', ADMIRAL, { expr: 'scared', L: 'up', R: 'up', look: 0, sweat: 0.6, sweatT: f / 60 }, B, ADM, 51); break;
    case 'camp': card('m1', SAILA, { expr: 'nervous', R: 'grab', gx: 0.5, gy: 0.4, tool: 'snakestick', toolRot: -0.5, wig: f * 0.12, look: -0.2, sweat: 0.4, sweatT: f / 60 }, [XC, 0, 0], CAMP_M1, 41);
      card('m2', SAILB, { expr: 'scared', R: 'grab', gx: 0.4, gy: 0.3, tool: 'snakestick', toolRot: -0.2, wig: f * 0.1 + 2, L: 'up', look: 0.3 }, [XC, 0, 0], CAMP_M2, 43);
      card('han', HANNIBAL, { expr: 'sly', L: 'cross', R: 'cross', look: -0.6 }, [XC, 0, 0], CAMP_H, 23); break;
    case 'panic': card('adm', ADMIRAL, { expr: 'scared', L: 'up', R: 'up', sweat: 0.7, sweatT: f / 60 }, B, [ADM[0] + 0.2, 0, ADM[2]], 51, { y: jump(0.2, 0) });
      card('e1', ENEMY1, { expr: 'shock', L: 'up', R: 'up', look: 0.5 }, B, [EN1[0] - 0.1, 0, EN1[2] + 0.2], 53, { y: jump(0.23, 1.3) });
      card('e2', ENEMY2, { expr: 'scared', L: 'up', R: 'up', look: -0.5, sweat: 0.5, sweatT: f / 60 }, B, EN2, 55, { y: jump(0.19, 2.1) }); break;
    case 'won': card('han', HANNIBAL, { expr: 'sideeye', L: 'hip', R: 'hip', look: -1 }, A, HAN, 23); card('sa', SAILA, { expr: 'laugh', L: 'up', R: 'up', look: 0.2 }, A, SAIL_A, 41, { y: jump(0.15, 0.4) }); card('sb', SAILB, { expr: 'laugh', L: 'up', R: 'up' }, A, SAIL_B, 43, { y: jump(0.17, 1.9) }); break;
  }
  return out;
};
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'order') { if (f >= 708) out.push(emote('?', f - 708, at(A, [SAIL_A[0] - 0.28, HY + 0.42, SAIL_A[2]]), { s: 0.18 })); if (f >= 720) out.push(emote('?', f - 720, at(A, [SAIL_B[0] + 0.28, HY + 0.42, SAIL_B[2]]), { s: 0.18, rot: 0.15 })); }
  if (S.id === 'scared' && f >= 1134) out.push(emote('!', f - 1134, at(B, [ADM[0] + 0.3, HY + 0.45, ADM[2]]), { s: 0.2 }));
  if (S.id === 'panic' && f >= 1640) out.push(emote('sweat', f - 1640, at(B, [EN1[0] - 0.3, HY + 0.3, EN1[2] + 0.2]), { s: 0.16 }));
  return out; };
// ---------------- camera ----------------
const yawLook = (pos, look, deg) => { const a = deg * Math.PI / 180, dx = look[0] - pos[0], dz = look[2] - pos[2]; return [pos[0] + dx * Math.cos(a) - dz * Math.sin(a), look[1], pos[2] + dx * Math.sin(a) + dz * Math.cos(a)]; };
const orbit = (c, ang, d, y) => [c[0] + Math.sin(ang * Math.PI / 180) * d, y, c[2] + Math.cos(ang * Math.PI / 180) * d];
const HOOK0 = { pos: at(A, R1), look: at(A, L1), fov: 44 };
const camRaw = (f) => { const S = shot(f), v = (f - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v);
  switch (S.id) {
    case 'hook': return { pos: lerp3(HOOK0.pos, at(A, [1.0, 1.81, -2.52]), sv), look: lerp3(HOOK0.look, at(A, [1.25, 1.42, 0.15]), sv), fov: 44 };
    case 'fly': { const p = flightP(f), j = jarP(p), j2 = jarP(Math.min(1, p + 0.05)), d = [j2[0] - j[0], 0, j2[2] - j[2]], L = Math.hypot(...d); return { pos: [j[0] - d[0] / L * 1.4 + 0.12, j[1] + 0.32, j[2] - d[2] / L * 1.4], look: [j[0] + d[0] / L * 3, j[1] - 0.25, j[2] + d[2] / L * 3], fov: 50 }; }
    case 'fleet': { const k = E.smooth(v), kk = E.easeOut(ramp(f, 485, 544)); return { pos: [XF + lerp(2, 0, k), lerp(26, 44, k) + 30 * kk, lerp(70, 92, k) + 34 * kk], look: [XF, 0, lerp(-4, -18, k) - 12 * kk], fov: 46 }; }
    case 'order': return { pos: at(A, lerp3([2.95, 1.3, 2.25], [2.75, 1.32, 1.95], sv)), look: at(A, lerp3([1.75, 1.42, -0.1], [1.85, 1.42, -0.1], sv)), fov: 46 };
    case 'smash': return { pos: at(B, lerp3([-0.35, 0.45, 1.35], [-0.5, 0.5, 1.2], sv)), look: at(B, [-1.0, 0.22, 0.1]), fov: 50 };
    case 'laugh': return { pos: at(B, orbit([-1.27, 0, -0.6], lerp(-8, 8, sv), lerp(4.1, 3.7, sv), 1.5)), look: at(B, [-1.27, 1.22, -0.6]), fov: 50 };
    case 'move': return { pos: at(B, lerp3([-0.4, 0.2, 1.4], [-0.5, 0.17, 1.1], sv)), look: at(B, [-1.0, 0.08, 0.25]), fov: 46 };
    case 'scared': return { pos: at(B, orbit(ADM, lerp(12, 4, sv), lerp(1.75, 1.5, sv), 1.22)), look: at(B, [ADM[0], HY + 0.12, ADM[2]]), fov: 44 };
    case 'camp': return { pos: [XC + lerp(-1.6, -1.1, sv), lerp(1.55, 1.45, sv), lerp(4.6, 3.7, sv)], look: [XC + lerp(0.1, 0.25, sv), 1.0, 0.0], fov: 48 };
    case 'jarcut': { const c = [XC + 3.0, 0, 1.65]; return { pos: orbit(c, lerp(-18, 10, sv), lerp(1.35, 1.05, sv), lerp(1.45, 1.35, sv)), look: [c[0], lerp(1.08, 1.05, sv), c[2]], fov: 44 }; }
    case 'panic': return { pos: at(B, lerp3([-2.3, 2.15, 2.5], [-0.6, 2.1, 2.3], sv)), look: at(B, lerp3([-1.7, 0.75, -0.3], [-1.0, 0.75, -0.3], sv)), fov: 54 };
    case 'flee': { const fl = E.easeIn(ramp(f, 1850, 1904)) * 0.6 + 0.05; return { pos: at(A, lerp3([3.6, 1.75, -1.3], [3.8, 1.8, -1.4], sv)), look: [B[0] + fl * 9, 2.2, B[2] - fl * 22], fov: 48 }; }
    case 'won': return { pos: at(A, orbit(HAN, lerp(-10, 2, sv), lerp(2.1, 1.75, sv), lerp(0.95, 1.0, sv))), look: at(A, [HAN[0] - 0.25, HY + 0.05, HAN[2]]), fov: 46 };
    case 'hall': { const k1 = E.smooth(ramp(f, 2025, 2150)), k2 = E.smooth(ramp(f, 2130, 2329)); const p1 = lerp3([XH - 1.6, 2.0, 0.6], [XH + 0.9, 1.9, 0.4], k1), p2 = [XH + 0.25, 1.5, 0.75];
      const l1 = lerp3([XH - 1.4, 2.2, -3], [XH + 1.2, 2.15, -3], k1), l2 = [XH, 1.38, -0.6]; return { pos: lerp3(p1, p2, k2), look: lerp3(l1, l2, k2), fov: 46 }; }
    case 'loop': { const k = E.smooth(ramp(f, 2335, 2465)); return { pos: lerp3(at(A, [1.3, 1.6, -2.3]), HOOK0.pos, k), look: lerp3(at(A, [1.5, 1.4, 0.0]), HOOK0.look, k), fov: 44 }; }
  } };
const cam = (f) => { const S = shot(f), c = camRaw(f); const wi = WHIPS.indexOf(S.b + 1), wo = WHIPS.indexOf(S.a);
  if (wi >= 0 && f > S.b - 14) c.look = yawLook(c.pos, c.look, (wi % 2 ? -55 : 55) * E.easeIn(ramp(f, S.b - 14, S.b + 1)));
  if (wo >= 0 && f < S.a + 18) c.look = yawLook(c.pos, c.look, -(wo % 2 ? -55 : 55) * (1 - E.easeOut(ramp(f, S.a, S.a + 18))));
  c.shadowAt = S.id === 'fleet' ? [XF, 0, -20] : c.look; return c; };
export const camAt = cam;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shot(f), C = cam(f), atp = (p, k) => ({ focus: dist(C.pos, p), cinf: k });
  switch (S.id) {
    case 'hook': case 'loop': { const p = flightP(f); const jarF = p >= 0 ? dist(C.pos, jarP(p)) : 1; const k = S.id === 'hook' ? E.smooth(ramp(f, 92, 128)) : 1 - E.smooth(ramp(f, 2420, 2465)); return { focus: lerp(jarF, dist(C.pos, at(A, [HAN_H[0], HY, HAN_H[2]])), k), cinf: lerp(26, 11, k) }; }
    case 'fly': return atp(jarP(flightP(f)), 10);
    case 'fleet': return { focus: 50, cinf: 0 };
    case 'order': return atp(at(A, [HAN[0], HY, HAN[2]]), 11);
    case 'smash': return atp(at(B, [-1.0, 0.2, 0.2]), 12);
    case 'laugh': return atp(at(B, [ADM[0], HY, ADM[2]]), 9);
    case 'move': return atp(at(B, [-0.85, 0.08, 0.4]), 22);
    case 'scared': return atp(at(B, [ADM[0], HY, ADM[2]]), 12);
    case 'camp': return atp([XC + 0.1, 1.2, 0.0], 9);
    case 'jarcut': return atp([XC + 3.0, 1.05, 1.65], 12);
    case 'panic': return atp(at(B, [lerp(-1.8, -0.8, (f - 1600) / 249), 1.0, -0.5]), 9);
    case 'flee': return { focus: 20, cinf: 3 };
    case 'won': return atp(at(A, [HAN[0], HY, HAN[2]]), 11);
    case 'hall': return { focus: lerp(dist(C.pos, [XH, 2.2, -3]), dist(C.pos, [XH, 1.4, -0.6]), E.smooth(ramp(f, 2130, 2300))), cinf: 9 };
  }
  return { focus: 5, cinf: 0 }; };
export const worldAt = (f) => { const S = shot(f), W = {};
  W.flee = S.id === 'flee' ? q(E.easeIn(ramp(f, 1850, 1904)) * 0.6 + 0.05, 3) : (f > 1904 && S.light === 'sea' && S.id !== 'loop') ? 1 : 0;
  W.lid = S.id === 'jarcut' ? q(1 - E.smooth(ramp(f, 1495, 1532)), 3) : 0;
  W.cut = S.id === 'jarcut' ? q(lerp(-0.5, 0, E.smooth(ramp(f, 1425, 1452))), 3) : -0.5;
  W.peek = S.id === 'hall' ? q(E.back(ramp(f, 2298, 2318)), 3) : 0;
  return W; };
// ---------------- handwritten labels ----------------
export const annotAt = (f) => { if (shot(f).id !== 'jarcut') return [];
  const coil = [XC + 3.0, 0.78 + 0.18 * 1.25, 1.65], lid = [XC + 3.0, 0.78 + 0.46 * 1.25, 1.65];
  return [{ type: 'label', text: 'venomous snakes', at: coil, dx: -150, dy: -400, age: f - 1452, bend: -0.3, size: 84, out: 1548 - f }, { type: 'circle', at: coil, rw: 0.14, age: f - 1466, out: 1548 - f },
    { type: 'label', text: 'wax seal', at: lid, dx: 90, dy: -200, age: f - 1538 }]; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
