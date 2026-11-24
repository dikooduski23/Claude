// Doc Zap — "He shipped ice to the Caribbean" (Frederic Tudor, the Ice King, 1806–1833). World kit + remocn transitions.
// Voice: Patrick, Eleven v4. 35.6 s = 2136 frames @ 60 fps. Plates are rendered with HARD CUTS; Remotion adds remocn
// transitions from TRANSITIONS (docs/ENGINE.md §8). The last shot returns to frame 0 (ice block swinging past the lens).
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, talkAt, q } from './motion.js';
import { LP, tint } from './kit/lights.js';
import { emote } from './kit/emotes.js';
export const FPS = 60, TOTAL = 2136, DECK = 0, LOOK = 'mini';
const SH = [
  ['hook', 0, 159, 'winter'], ['sail', 160, 304, 'winter'], ['gazette', 305, 554, 'winter'], ['tropic', 555, 759, 'tropic'],
  ['prison', 760, 944, 'cell'], ['quit', 945, 1049, 'cell'], ['mill', 1050, 1309, 'mill'], ['hold', 1310, 1559, 'hold'],
  ['survive', 1560, 1699, 'tropic'], ['india', 1700, 1894, 'india'], ['king', 1895, 2039, 'winter'], ['loop', 2040, 2135, 'winter']];
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a, b, light }));
// remocn transitions in the Remotion edit, centred on each cut
export const TRANSITIONS = [{ at: 160, type: 'whip', dir: 'left' }, { at: 305, type: 'whip', dir: 'right' }, { at: 555, type: 'whip', dir: 'left' }, { at: 760, type: 'zoom' },
  { at: 945, type: 'cut' }, { at: 1050, type: 'whip', dir: 'right' }, { at: 1310, type: 'focus', len: 24 }, { at: 1560, type: 'whip', dir: 'left' }, { at: 1700, type: 'whip', dir: 'right' },
  { at: 1895, type: 'zoom' }, { at: 2040, type: 'whip', dir: 'left' }];
export const WHIPS = [], WHIP_FRAMES = [], CUTS = [];
const shot = (f) => { const s = SH.find((s) => f >= s[1] && f <= s[2]) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = shot;
export const LIGHTS = {
  winter: tint(LP.day, { sky: '#e4eef8', ground: '#c8d0dc', hemi: 1.2, sun: '#fff2e0', sunI: 1.05, az: 150, el: 26, fog: '#d8e2ec', fogNear: 14, fogFar: 120, skyTop: '#7aa4d0', skyHor: '#e8eef4', sat: 1.05, bloom: 0.55, rimCol: '#dfeaff', shadowExt: 8 }),
  tropic: tint(LP.day, { az: 120, el: 62, sun: '#fff0c8', sunI: 1.4, fog: '#e8f0e0', fogNear: 25, fogFar: 200, skyTop: '#2a8ae8', skyHor: '#bfe8ff', sat: 1.24, gain: '#fff8e8', shadowExt: 8 }),
  india: tint(LP.sunset, { fogNear: 18, fogFar: 160, shadowExt: 8 }),
  cell: tint(LP.indoor, { hemi: 0.55, sunI: 0.3, fog: '#3a3024', fogNear: 4, fogFar: 18, sat: 1.0, vig: 0.42, gain: '#ffeedc', shadowExt: 5 }),
  mill: tint(LP.indoor, { hemi: 0.95, sunI: 0.8, fogNear: 6, fogFar: 28, shadowExt: 6 }),
  hold: tint(LP.candle, { hemi: 0.7, sat: 1.1, fogNear: 5, fogFar: 22 }),
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
// ---------------- layout ----------------
const XD = 70000, XT = 72000, XI = 74000, XP = 76000, XM = 78000, XHD = 80000;
const at = (o, p) => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
const D = [XD, 0, 0], TR = [XT, 0, 0], IN = [XI, 0, 0], PR = [XP, 0, 0], MI = [XM, 0, 0], HO = [XHD, 0, 0];
const HY = 1.33, SEA_Y = -1.3;
const TUD_D = [0.35, 0, 0.25], W1 = [-0.55, 0, -0.45], W2 = [0.95, 0, -0.55];
const PIV = [0.85, 3.7, 1.95];           // crane boom tip over the camera's foreground; the ice block swings across the lens
const ROPE = 2.15, swingAng = (f) => 0.42 * Math.sin(f * 0.02 - 0.9);
const blockPos = (f) => { const a = swingAng(f); return [PIV[0] + Math.sin(a) * ROPE, PIV[1] - Math.cos(a) * ROPE, PIV[2]]; };
let ST = {};
export const sets = (K) => {
  const { THREE, prop } = K;
  const P = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  const rnd = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  // ---- sea ----
  const seaTex = P(512, 512, (g, W, H) => { g.fillStyle = '#3a7fb0'; g.fillRect(0, 0, W, H); for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(20,70,120,${0.12 + rnd(i) * 0.2})`; g.beginPath(); g.ellipse(rnd(i, 1) * W, rnd(i, 2) * H, 30 + rnd(i, 3) * 60, 8 + rnd(i, 4) * 14, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 500; i++) { const x = rnd(i, 5) * W, y = rnd(i, 6) * H; g.strokeStyle = rnd(i, 7) < 0.65 ? 'rgba(255,255,255,.5)' : 'rgba(10,50,100,.3)'; g.lineWidth = 2 + rnd(i, 8) * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 9, y - 5, x + 22, y); g.stroke(); } });
  const seas = []; const makeSea = (x, z, size, seg, rep, col = '#ffffff') => { const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2); const t = ctex(seaTex, rep, rep);
    const m = K.add(geo, K.toon({ map: t, color: col }), x, SEA_Y, z, K.scene, false); m.userData.base = Float32Array.from(geo.attributes.position.array); m.userData.tex = t; seas.push(m); return m; };
  const waves = (m, f, amp) => { const p = m.geometry.attributes.position, b = m.userData.base, t = f / 60; for (let i = 0; i < p.count; i++) { const x = b[i * 3], z = b[i * 3 + 2]; p.array[i * 3 + 1] = amp * (0.55 * Math.sin(0.33 * x + t * 1.3) + 0.35 * Math.sin(0.47 * z - t * 1.1) + 0.2 * Math.sin(1.1 * (x + z) + t * 2.2)); }
    p.needsUpdate = true; m.geometry.computeVertexNormals(); m.userData.tex.offset.set(t * 0.012, t * 0.007); };
  const seaD = makeSea(XD, -40, 200, 90, 50, '#cfe0ec'), seaT = makeSea(XT, -40, 200, 90, 50, '#bff0ff'), seaI = makeSea(XI, -40, 200, 90, 50, '#ffd8c0');
  // ---- ice blocks: frosty inner cube + fresnel glass shell ----
  const iceTex = ctex(P(256, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#e8f8ff'); gr.addColorStop(1, '#a8d8f0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); let x = rnd(i, 1) * W, y = rnd(i, 2) * H; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd(i, k + 3) - 0.5) * 70; y += (rnd(i, k + 8) - 0.5) * 70; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(rnd(i, 20) * W, rnd(i, 21) * H, 1 + rnd(i, 22) * 3, 0, 7); g.fill(); } }));
  const iceM = K.toon({ map: iceTex, color: '#ffffff', emissive: '#3a6a8a', emissiveIntensity: 0.25 });
  const iceBlock = (parent, x, y, z, s = 0.45, ry = 0) => { const g = K.grp(parent, x, y, z, ry); const c = K.add(new THREE.BoxGeometry(s * 0.96, s * 0.96, s * 0.96), iceM, 0, s / 2, 0, g); const gl = K.glass(new THREE.BoxGeometry(s, s, s), { tint: '#cfefff', opacity: 0.12, rim: 0.7 }); gl.position.y = s / 2; g.add(gl); g.userData.core = c; return g; };
  const sawM = K.mat('dirt', { seed: 41, hue: 38, sat: 45, lig: 62 });
  // ---- brig (1806 two-masted sailing ship), bow +x, deck y=0 ----
  const hullS = new THREE.Shape(); hullS.moveTo(-6, -1.6); hullS.lineTo(5.2, -1.6); hullS.quadraticCurveTo(7.2, -1.4, 7.6, 0.4); hullS.lineTo(7.4, 0.9); hullS.lineTo(-6.6, 0.9); hullS.quadraticCurveTo(-7.2, -0.6, -6, -1.6);
  const hullG = new THREE.ExtrudeGeometry(hullS, { depth: 3.4, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 3 }); hullG.translate(0, -0.95, -1.7); { const uv = hullG.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v * 0.4, u * 0.12); } }
  const hullM = K.mat('planks', { seed: 61, lig: 26, hue: 22 }), deckM = K.mat('planks', { seed: 62, lig: 46 }), sailM = K.toon({ color: '#f2ecdc', side: THREE.DoubleSide });
  const brig = (pos) => { const g = K.grp(K.scene, pos[0], pos[1], pos[2]); K.add(hullG, hullM, 0, 0, 0, g);
    for (const sz of [-1, 1]) { K.add(new THREE.BoxGeometry(13.6, 0.22, 0.04), K.toon({ color: '#e8c040' }), 0.5, -0.45, sz * 1.86, g, false); for (let k = 0; k < 6; k++) K.add(new THREE.BoxGeometry(0.32, 0.26, 0.05), K.toon({ color: '#1e1e24' }), -4 + k * 1.7, -0.75, sz * 1.87, g, false); }
    K.add(K.tplane(13, 3.2, 1.2), deckM, 0.4, 0.012, 0, g, false).rotation.x = -Math.PI / 2;
    for (const sz of [-1, 1]) K.add(K.tbox(13.4, 0.5, 0.1, 0.9), hullM, 0.4, 0.25, sz * 1.62, g);
    const sails = []; for (const mx of [-2.2, 2.4]) { K.add(new THREE.CylinderGeometry(0.1, 0.13, 10, 10), K.M.woodD, mx, 5, 0, g); for (const [y, w, h] of [[2.9, 5.2, 2.3], [5.4, 4.4, 2.0], [7.6, 3.4, 1.6]]) { K.add(new THREE.CylinderGeometry(0.05, 0.05, w + 0.4, 6), K.M.woodD, mx + 0.1, y + h / 2, 0, g).rotation.x = Math.PI / 2;
        const s = K.add(new THREE.PlaneGeometry(w, h, 6, 3), sailM, mx + 0.2, y, 0, g); s.rotation.y = Math.PI / 2; const p = s.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.35 * Math.cos(p.getX(i) / w * Math.PI)); s.geometry.computeVertexNormals(); sails.push(s); } }
    K.add(new THREE.CylinderGeometry(0.06, 0.08, 4.5, 8), K.M.woodD, 8.6, 1.6, 0, g).rotation.z = -1.1;
    for (const [a, b] of [[[2.4, 10, 0], [8.6, 2.6, 0]], [[-2.2, 10, 0], [-6.6, 1.0, 0]], [[2.4, 9.6, 0], [2.4, 0.5, 1.6]], [[2.4, 9.6, 0], [2.4, 0.5, -1.6]], [[-2.2, 9.6, 0], [-2.2, 0.5, 1.6]], [[-2.2, 9.6, 0], [-2.2, 0.5, -1.6]]]) { const v = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)); const r = K.add(new THREE.CylinderGeometry(0.012, 0.012, v.length(), 4), K.M.rope, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, g, false); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); }
    return g; };
  // ================= BOSTON DOCK (winter) =================
  const DK = K.grp(K.scene, XD, 0, 0);
  { const snow = K.add(K.tplane(60, 30, 3), K.mat('snow', { seed: 3 }), 0, 0.0, 14, DK, false); snow.rotation.x = -Math.PI / 2; }
  { const pier = K.add(K.tbox(14, 0.3, 7, 1.2), K.mat('planks', { seed: 71, lig: 40 }), 0, -0.15, -1.5, DK); for (let k = 0; k < 8; k++) for (const z of [-4.9, 1.9]) K.add(new THREE.CylinderGeometry(0.16, 0.16, 2.2, 10), K.M.woodD, -6.5 + k * 1.85, -1.1, z, DK); }
  for (let i = 0; i < 40; i++) { const sn = K.add(new THREE.SphereGeometry(0.06 + rnd(i) * 0.08, 8, 6), K.toon({ color: '#ffffff' }), -6 + rnd(i, 1) * 12, 0.02, -4.6 + rnd(i, 2) * 6.2, DK, false); sn.scale.y = 0.35; }
  const shipD = brig([XD + 0.5, 0, -7.0]);
  // crane: A-frame + boom + rope + swinging ice block
  { const CR = K.grp(DK, 3.3, 0, 1.95); for (const sz of [-1, 1]) { const l = K.add(new THREE.BoxGeometry(0.18, 4.0, 0.18), K.M.woodD, 0, 1.95, sz * 0.7, CR); l.rotation.x = sz * 0.18; }
    K.add(new THREE.BoxGeometry(2.7, 0.2, 0.2), K.M.woodD, -1.25, 3.85, 0, CR); K.add(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 14), K.M.iron, -2.45, 3.72, 0, CR).rotation.x = Math.PI / 2; }
  const rope = K.add(new THREE.CylinderGeometry(0.014, 0.014, 1, 5), K.M.rope, 0, 0, 0, DK, false);
  const hookBlock = iceBlock(DK, 0, 0, 0, 0.55); const net = K.add(new THREE.TorusGeometry(0.33, 0.012, 4, 4), K.M.rope, 0, 0.56, 0, hookBlock, false); net.rotation.x = Math.PI / 2;
  for (const [x, z] of [[-2.4, -1.0], [-1.9, -1.6], [-2.6, -1.9], [2.6, -2.2]]) iceBlock(DK, x, 0, z, 0.5, rnd(x) * 0.6);
  prop.crate(DK, { x: -0.25, z: 1.05, s: 0.62, ry: 0.15 }); prop.barrel(DK, { x: -3.2, z: 0.6 }); prop.barrel(DK, { x: -3.6, z: 0.1, ry: 0.5 }); prop.crate(DK, { x: 3.2, z: 0.3, s: 0.7, ry: -0.3 });
  prop.sign(DK, { x: -4.4, y: 2.6, z: -0.2, text: 'TUDOR ICE CO.', w: 1.6, h: 0.42, hang: false, fg: '#e8f4ff' });
  // the Boston Gazette on the crate
  const paperC = P(768, 1024, (g, W, H) => { g.fillStyle = '#ece2c8'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(120,90,50,.12)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(rnd(i, 3) * W, rnd(i, 4) * H, 8 + rnd(i, 5) * 30, 0, 7); g.fill(); }
    g.fillStyle = '#1a1612'; g.textAlign = 'center'; g.font = '900 86px Georgia, serif'; g.fillText('THE BOSTON', W / 2, 120); g.fillText('GAZETTE', W / 2, 210); g.fillRect(40, 240, W - 80, 6); g.font = 'italic 30px Georgia, serif'; g.fillText('February, 1806', W / 2, 285); g.fillRect(40, 305, W - 80, 3);
    g.font = '900 52px Georgia, serif'; g.fillText('ICE TO THE INDIES?', W / 2, 390); g.font = 'italic 40px Georgia, serif'; ['"We hope this will not', 'prove a slippery', 'speculation."'].forEach((l, i) => g.fillText(l, W / 2, 470 + i * 52));
    g.fillStyle = 'rgba(26,22,18,.55)'; for (let c = 0; c < 2; c++) for (let r = 0; r < 14; r++) g.fillRect(50 + c * 350, 660 + r * 24, 300 - (r % 4) * 30, 10); });
  const paper = K.add(new THREE.PlaneGeometry(0.42, 0.56), K.toon({ map: ctex(paperC) }), -0.25, 0.625, 1.05, DK, false); paper.rotation.set(-Math.PI / 2, 0, 0.12);
  // snowfall
  const flakes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 5, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 260); flakes.frustumCulled = false; K.noInk(flakes); DK.add(flakes);
  // ice throne for the ending
  const THRONE = K.grp(DK, 0.4, 0, -1.8); for (let i = 0; i < 9; i++) { const lvl = i < 5 ? 0 : i < 8 ? 1 : 2, k = i < 5 ? i : i < 8 ? i - 5 : 0, n = [5, 3, 1][lvl]; iceBlock(THRONE, (k - (n - 1) / 2) * 0.52, lvl * 0.5, 0, 0.5); }
  THRONE.visible = false;
  // ================= TROPICAL MARKET (Martinique) / CALCUTTA PORT =================
  const leafTex = ctex(P(256, 64, (g, W, H) => { g.fillStyle = '#3a8a2a'; g.beginPath(); g.moveTo(0, H / 2); g.quadraticCurveTo(W * 0.5, -H * 0.2, W, H / 2); g.quadraticCurveTo(W * 0.5, H * 1.2, 0, H / 2); g.fill(); g.strokeStyle = '#2a6a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    g.strokeStyle = '#2a6a1a'; g.lineWidth = 2; for (let x = 12; x < W; x += 12) { g.beginPath(); g.moveTo(x, H / 2); g.lineTo(x + 6, 6 + (x % 24 ? 4 : 0)); g.moveTo(x, H / 2); g.lineTo(x + 6, H - 6); g.stroke(); } }));
  const leafM = K.toon({ map: leafTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const palm = (parent, x, z, h = 4.2, lean = 0.25, rot = 0) => { const g = K.grp(parent, x, 0, z, rot); let px = 0, py = 0; for (let k = 0; k < 8; k++) { const t = k / 8, dx = lean * 1.6 * t * t; const seg = K.add(new THREE.CylinderGeometry(0.12 - t * 0.04, 0.14 - t * 0.04, h / 8 + 0.02, 8), K.mat('woodGrain', { seed: 81, hue: 30, lig: 42 }), dx, py + h / 16, 0, g); seg.rotation.z = -lean * 0.6 * t; py += h / 8; px = dx; }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, l = K.add(new THREE.PlaneGeometry(1.8, 0.45, 6, 1), leafM, px + Math.cos(a) * 0.8, py - 0.15, Math.sin(a) * 0.8, g, false); l.rotation.set(0, -a, -0.45); const pp = l.geometry.attributes.position; for (let i = 0; i < pp.count; i++) pp.setY(i, pp.getY(i) - 0.18 * (pp.getX(i) + 0.9) ** 2); l.geometry.computeVertexNormals(); }
    for (let k = 0; k < 3; k++) K.add(new THREE.SphereGeometry(0.09, 8, 6), K.toon({ color: '#6a4a22' }), px + Math.cos(k * 2.1) * 0.12, py - 0.2, Math.sin(k * 2.1) * 0.12, g); return g; };
  const sandM = K.mat('dirt', { seed: 91, hue: 42, sat: 40, lig: 74 });
  const market = (origin, india) => { const g = K.grp(K.scene, origin[0], 0, origin[2]); const sand = K.add(K.tplane(60, 30, 3), sandM, 0, 0, 2, g, false); sand.rotation.x = -Math.PI / 2;
    const quay = K.add(K.tbox(30, 0.4, 2, 1.2), K.mat('stone', { seed: 92, lig: 70, hue: 36 }), 0, -0.2, -13.5, g);
    for (const [x, z, h, l, r] of [[-3.2, -2.6, 4.6, 0.3, 0.4], [3.6, -3.2, 4.2, -0.25, 2.1], [-5.5, -5.5, 5.0, 0.2, 1.2], [5.8, -6, 4.8, 0.3, 3.3], [-1.2, -7.5, 4.4, -0.2, 0.7]]) palm(g, x, z, h, l, r);
    prop.tent(g, { x: -1.9, z: -1.6, w: 2.2, d: 2.0, h: 2.0, col: india ? '#f2d28a' : '#f4ead2', col2: india ? '#d0402a' : '#2a9a7a', open: 0.9 }); prop.tent(g, { x: 2.4, z: -1.9, w: 2.2, d: 2.0, h: 2.0, col: '#f4ead2', col2: india ? '#8a3ab0' : '#e0802a', open: 0.9 });
    const T = prop.table(g, { x: 0.3, z: -0.35, w: 1.4, d: 0.8 }); for (const [x, c] of [[-0.25, '#e8d040'], [0.75, '#e05a2a']]) for (let k = 0; k < 5; k++) K.add(new THREE.SphereGeometry(0.06, 10, 8), K.toon({ color: c }), x + (k % 3) * 0.1, 0.84 + (k > 2 ? 0.08 : 0), -0.5 + (k % 2) * 0.1, g);
    prop.barrel(g, { x: -1.2, z: 0.6, r: 0.25, h: 0.65 }); prop.crate(g, { x: 1.7, z: 0.5, s: 0.5, ry: 0.4 });
    if (india) { const domeM = K.toon({ color: '#f2e6d0' }), goldM = K.toon({ color: '#e8b840' }); for (const [x, z, s] of [[-7, -12, 1.4], [0, -16, 2.2], [7.5, -12.5, 1.6]]) { K.add(new THREE.CylinderGeometry(1.6 * s, 1.6 * s, 2.4 * s, 16), domeM, x, 1.2 * s, z, g); K.add(new THREE.SphereGeometry(1.5 * s, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeM, x, 2.4 * s, z, g); K.add(new THREE.ConeGeometry(0.14 * s, 0.9 * s, 8), goldM, x, 4.3 * s, z, g); }
      brig([origin[0] + 3, 0, -20]).rotation.y = 0.3; }
    return g; };
  const MK = market(TR, false), MKI = market(IN, true);
  const meltBlock = iceBlock(MK, 0.3, 0.8, -0.35, 0.42), puddle = K.add(new THREE.CircleGeometry(0.4, 28), K.toon({ color: '#7ac8f0', transparent: true, opacity: 0.75 }), 0.3, 0.792, -0.35, MK, false); puddle.rotation.x = -Math.PI / 2;
  const drip = K.add(new THREE.SphereGeometry(0.02, 8, 6), K.toon({ color: '#9ad8ff' }), 0.55, 0.6, -0.1, MK, false);
  const survBlocks = [iceBlock(MK, 0.15, 0.79, -0.35, 0.4), iceBlock(MK, 0.62, 0.79, -0.3, 0.4, 0.3)]; const survCrate = K.grp(MK, -0.6, 0, 0.3); K.add(K.tbox(0.7, 0.45, 0.6, 0.6), K.M.plank, 0, 0.225, 0, survCrate); K.add(new THREE.SphereGeometry(0.42, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), sawM, 0, 0.42, 0, survCrate, false).scale.y = 0.35;
  const indBlocks = [iceBlock(MKI, 0.1, 0.79, -0.35, 0.42), iceBlock(MKI, 0.6, 0.79, -0.35, 0.42, 0.4), iceBlock(MKI, 0.35, 1.21, -0.35, 0.4, 0.2)];
  // ================= DEBTORS' PRISON =================
  const CELL = K.room({ x: XP, w: 4, d: 4, h: 3.2, floor: 'stone', floorOpts: { seed: 101, lig: 42 }, wall: 'stone', wallOpts: { seed: 102, lig: 50, moss: 0.4 }, ceil: 'flat' });
  for (let k = 0; k < 11; k++) K.add(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 8), K.M.iron, -2 + k * 0.4, 1.6, 1.85, CELL); for (const y of [0.15, 3.0]) K.add(new THREE.BoxGeometry(4.1, 0.07, 0.07), K.M.iron, 0, y, 1.85, CELL);
  prop.window(CELL, { x: 0.6, y: 2.4, z: -1.94, w: 0.55, h: 0.5, depth: 0.12, kind: 'sun', beamTo: [0.2, 0, 0.6], i: 9, beamOp: 0.28 }); for (let k = 0; k < 4; k++) K.add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), K.M.iron, 0.4 + k * 0.13, 2.55, -1.86, CELL, false);
  const tallyC = P(512, 256, (g, W, H) => { g.strokeStyle = 'rgba(245,240,225,.85)'; g.lineWidth = 7; g.lineCap = 'round'; for (let grp = 0; grp < 7; grp++) { const x0 = 20 + grp * 70; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x0 + k * 12, 40 + (grp % 2) * 100); g.lineTo(x0 + k * 12 + 3, 110 + (grp % 2) * 100); g.stroke(); } g.beginPath(); g.moveTo(x0 - 6, 100 + (grp % 2) * 100); g.lineTo(x0 + 48, 50 + (grp % 2) * 100); g.stroke(); } });
  const tally = K.add(new THREE.PlaneGeometry(1.4, 0.7), K.toon({ map: ctex(tallyC), transparent: true }), -1.98, 1.5, -0.7, CELL, false); tally.rotation.y = Math.PI / 2;
  K.add(new THREE.BoxGeometry(1.8, 0.35, 0.8), K.M.woodD, -1.0, 0.18, -1.45, CELL); K.add(new THREE.BoxGeometry(1.7, 0.08, 0.75), K.toon({ color: '#c8b070' }), -1.0, 0.39, -1.45, CELL);
  for (let i = 0; i < 30; i++) { const s = K.add(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4), K.toon({ color: '#d8c070' }), -1.5 + rnd(i) * 3, 0.01, -1.6 + rnd(i, 1) * 3, CELL, false); s.rotation.set(Math.PI / 2, rnd(i, 2) * 3, 0); }
  prop.candle(CELL, { x: 1.3, y: 0, z: -1.5, light: 1.2, h: 0.18, holder: 'stick', dist: 4 }); prop.jar(CELL, { x: 1.5, y: 0, z: -1.3, col: '#8a8a7a' });
  // ================= LUMBER MILL =================
  const MILL = K.room({ x: XM, w: 7, d: 5, h: 3.8, floor: 'planks', floorOpts: { seed: 111, lig: 44 }, wall: 'planks', wallOpts: { seed: 112, lig: 36 }, ceil: 'beams', open: ['front'] });
  prop.window(MILL, { x: -1.2, y: 2.2, z: -2.44, w: 1.0, h: 1.1, depth: 0.12, kind: 'sun', beamTo: [0.4, 0, 1.0], i: 8 });
  const mound = K.add(new THREE.ConeGeometry(1.5, 1.6, 28, 6), sawM, 1.6, 0.8, -1.1, MILL); { const p = mound.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > -0.79 && y < 0.79) { p.setX(i, p.getX(i) * (1 + 0.06 * Math.sin(i * 1.7))); p.setZ(i, p.getZ(i) * (1 + 0.06 * Math.cos(i * 2.3))); } } mound.geometry.computeVertexNormals(); }
  for (let i = 0; i < 26; i++) K.add(new THREE.SphereGeometry(0.06 + rnd(i) * 0.08, 8, 6), sawM, 0.2 + rnd(i, 1) * 3, 0.03, -2.2 + rnd(i, 2) * 2.6, MILL, false).scale.y = 0.3;
  const logEnd = ctex(P(128, 128, (g) => { g.fillStyle = '#d8b07a'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#a8784a'; g.lineWidth = 3; for (let r = 8; r < 60; r += 8) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); } g.strokeStyle = '#5a3a1a'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 61, 0, 7); g.stroke(); }));
  const logM = [K.mat('woodGrain', { seed: 113, lig: 30 }), K.toon({ map: logEnd }), K.toon({ map: logEnd })];
  for (let k = 0; k < 6; k++) { const lvl = k < 3 ? 0 : k < 5 ? 1 : 2, i = k < 3 ? k : k < 5 ? k - 3 : 0; const l = K.add(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 14), logM, -2.4, 0.22 + lvl * 0.38, -1.6 + (i - [1, 0.5, 0][lvl]) * 0.45, MILL); l.rotation.x = Math.PI / 2; l.rotation.z = Math.PI / 2; }
  const bench = prop.table(MILL, { x: -1.1, z: -1.5, w: 1.6, d: 0.7, h: 0.85 });
  const bladeC = P(256, 256, (g) => { g.fillStyle = '#b8c0c8'; g.beginPath(); for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; g.lineTo(128 + Math.cos(a) * (k % 2 ? 112 : 126), 128 + Math.sin(a) * (k % 2 ? 112 : 126)); } g.fill(); g.strokeStyle = '#1e1e24'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#6a7078'; g.beginPath(); g.arc(128, 128, 20, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 80, 3.6, 4.6); g.stroke(); });
  const blade = K.add(new THREE.CircleGeometry(0.42, 40), K.toon({ map: ctex(bladeC), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), -1.1, 1.18, -1.5, MILL, false);
  // ================= SHIP'S HOLD CUTAWAY =================
  const HOLD = K.room({ x: XHD, w: 3.2, d: 2.4, h: 2.2, floor: 'planks', floorOpts: { seed: 121, lig: 32 }, wall: 'planks', wallOpts: { seed: 122, lig: 30 }, ceil: 'flat', open: ['front'] });
  for (let k = 0; k < 4; k++) K.add(new THREE.BoxGeometry(0.12, 2.2, 0.14), K.M.woodD, -1.5 + k * 1.0, 1.1, -1.12, HOLD);
  const capM = K.toon({ map: ctex(P(128, 128, (g, W, H) => { g.fillStyle = '#e0c89a'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(120,60,30,.6)'; g.lineWidth = 6; for (let k = -W; k < 2 * W; k += 22) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.stroke(); } }), 2, 2) });
  for (const [x, y, w, h] of [[-1.62, 1.1, 0.06, 2.3], [1.62, 1.1, 0.06, 2.3], [0, -0.03, 3.3, 0.06], [0, 2.23, 3.3, 0.06]]) K.add(new THREE.BoxGeometry(w, h, 0.05), capM, x, y, 1.21, HOLD, false);
  const sawBlock = K.grp(HOLD, 0, 0, -0.25); K.add(K.tbox(1.65, 1.25, 1.3, 0.8), sawM, 0, 0.625, 0, sawBlock);
  const HSEC = K.section(sawBlock, { normal: [0, 0, -1], point: [XHD, 0.6, -0.25], cap: '#d8b070', hatch: 'rgba(110,70,30,.45)' });
  const holdIce = []; for (let i = 0; i < 4; i++) holdIce.push(iceBlock(HOLD, -0.23 + (i % 2) * 0.46, 0.14 + Math.floor(i / 2) * 0.47, -0.47, 0.43, 0));
  const bubbles = []; for (let i = 0; i < 40; i++) { const side = i % 3, x = side === 2 ? -0.7 + rnd(i, 1) * 1.4 : (side ? 1 : -1) * (0.5 + rnd(i, 1) * 0.28), y = side === 2 ? 1.08 + rnd(i, 2) * 0.12 : 0.06 + rnd(i, 2) * 1.12;
    const b = K.add(new THREE.CircleGeometry(0.014 + rnd(i) * 0.018, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }), x, y, -0.245, HOLD, false); K.noInk(b); bubbles.push(b); }
  const arrowG = K.grp(HOLD, 0, 0, 0);
  const heatArrow = (k) => K.arrow3d(arrowG, [-0.95, 0.32 + k * 0.36, 0.75], [-0.66, 0.32 + k * 0.36, -0.2], { col: '#ff5a1e', r: 0.03, bend: 0.06, head: 0.14 });
  const HA = [0, 1, 2].map(heatArrow), HB = [0, 1, 2].map((k) => K.arrow3d(arrowG, [-0.66, 0.32 + k * 0.36, -0.2], [-1.0, 0.45 + k * 0.36, 0.55], { col: '#ff8a3a', r: 0.025, bend: 0.1, head: 0.12 }));
  prop.lantern(HOLD, { x: 1.1, y: 1.5, z: -0.9, light: 1.6, hang: 0.5 }); K.warmLight(HOLD, 0.2, 1.7, 1.6, { i: 2.6, dist: 5, col: '#ffd8a8', flicker: 0.04 });
  ST = { seas, seaD, seaT, seaI, rope, hookBlock, flakes, THRONE, meltBlock, puddle, drip, survBlocks, survCrate, indBlocks, blade, HSEC, HA, HB, shipD };
  const _o = new THREE.Object3D();
  return { update: (W, f) => { const S = shot(f);
    if (S.light === 'winter') waves(seaD, f, 0.12); if (S.light === 'tropic') waves(seaT, f, 0.14); if (S.light === 'india') waves(seaI, f, 0.14);
    // crane swing
    const bp = blockPos(f); hookBlock.position.set(bp[0], bp[1] - 0.6, bp[2]); hookBlock.rotation.set(0, f * 0.004, swingAng(f) * 0.6);
    const top = new THREE.Vector3(PIV[0], PIV[1], PIV[2]), bot = new THREE.Vector3(bp[0], bp[1], bp[2]); rope.position.copy(top).add(bot).multiplyScalar(0.5); rope.scale.set(1, top.distanceTo(bot), 1); rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bot.clone().sub(top).normalize());
    hookBlock.visible = rope.visible = S.light === 'winter' && S.id !== 'king';
    // snowfall
    for (let i = 0; i < 260; i++) { const t = (f / 60 * (0.25 + rnd(i, 3) * 0.2) + rnd(i, 4)) % 1; _o.position.set(-4 + rnd(i, 5) * 8 + Math.sin(f * 0.02 + i) * 0.2, 4.5 - t * 4.6, -3 + rnd(i, 6) * 6); _o.updateMatrix(); flakes.setMatrixAt(i, _o.matrix); } flakes.instanceMatrix.needsUpdate = true;
    // ship sails away in its shot
    const sl = W.sail ?? 0; shipD.position.set(XD + 0.5 + sl * 3, 0, -7.0 - sl * 26); shipD.rotation.y = sl * 0.15;
    THRONE.visible = S.id === 'king';
    // melting
    const ml = W.melt ?? -1; meltBlock.visible = S.id === 'tropic' && ml < 0.98; puddle.visible = S.id === 'tropic'; if (S.id === 'tropic') { const k = Math.max(0, ml); meltBlock.scale.set(1 - 0.25 * k, Math.max(0.03, 1 - k), 1 - 0.25 * k); puddle.scale.setScalar(0.2 + 1.3 * k); drip.position.y = 0.78 - ((f * 0.03) % 0.75); drip.visible = k > 0.05; } else drip.visible = false;
    survBlocks.forEach((b) => { b.visible = S.id === 'survive'; }); survCrate.visible = S.id === 'survive';
    blade.rotation.z = -f * 0.5;
    HSEC.set(W.cut ?? 0);
    const hk = W.heat ?? -1; [...HA, ...HB].forEach((a) => { a.visible = false; }); if (hk >= 0) { const inK = clamp(hk * 2), outK = clamp(hk * 2 - 1); HA.forEach((a) => { a.visible = inK > 0.05; }); HB.forEach((a) => { a.visible = outK > 0.05; }); }
  } };
};
// ---------------- cast ----------------
const SK = '#f7f4ee';
const TUDOR = { tunic: '#2a3a5a', stick: true, skin: SK, hair: '#6a4426', collar: '#ffffff', tie: '#f4f0e6', hat: 'tophat', pattern: { type: 'vstripes', col: 'rgba(255,255,255,.08)', scale: 1.2 } };
const TUDOR_K = { ...TUDOR, hat: 'crown', cape: '#b8202e' };
const WORK1 = { tunic: '#8a5a3a', stick: true, skin: SK, hair: '#3a2a1c', cap: '#4a3a2a', beard: '#3a2a1c', beardStyle: 'short', pattern: { type: 'patches' } };
const WORK2 = { tunic: '#3a6a8a', stick: true, skin: SK, hair: '#c8862a', moustache: '#c8862a', stache: 'walrus', hat: 'soldier', hatCol: '#2a2a34', hatBand: '#2a2a34', pattern: { type: 'stripes', col: 'rgba(255,255,255,.7)' } };
const LOC1 = { tunic: '#f2c230', stick: true, skin: SK, hair: '#1e1714', hat: 'cowboy', hatCol: '#e8cc78', hatBand: '#b8262e', pattern: { type: 'dots', col: '#e05a2a' } };
const LOC2 = { tunic: '#2aa08a', dress: '#2aa08a', stick: true, skin: SK, hair: '#1e1714', pattern: { type: 'stars', col: '#f2e6c8' } };
const IND1 = { tunic: '#e8742a', stick: true, skin: SK, hair: '#1e1714', beard: '#1e1714', beardStyle: 'full', hat: 'turban', hatCol: '#f2e6c8', hatBand: '#2a6ad0' };
const IND2 = { tunic: '#c0306a', dress: '#c0306a', stick: true, skin: SK, hair: '#1e1714', pattern: { type: 'diamonds', col: '#e8c040', col2: 'rgba(0,0,0,.1)' } };
const MILLW = { tunic: '#6a7a3a', stick: true, skin: SK, hair: '#9a5228', apron: '#d8c8a8', cap: '#5a4030', moustache: '#9a5228' };
export const actorsAt = (f, T) => {
  const S = shot(f), out = [], u = Math.floor(f / 2);
  const I = (seed) => { const i = idle(u, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const tintL = { cell: '#f2e2cc', mill: '#fff2e0', hold: '#ffe6c8', india: '#ffe2cc' }[S.light] || '#ffffff';
  const card = (id, O, o, origin, pos, seed, extra = {}) => { const w = at(origin, pos); out.push({ key: id + JSON.stringify(o) + JSON.stringify(extra), draw: (p) => T.romanFront(p, O, { seed, blink: blinkAt(u, seed), ...I(seed), L: 'hang', R: 'hang', look: 0, ...o }), x: w[0], y: w[1] + (extra.y || 0), z: w[2], s: 0.9, ground: w[1], tint: tintL, ...extra }); };
  const hop = (k, ph) => q(0.14 * Math.abs(Math.sin(f * k + ph)), 3);
  switch (S.id) {
    case 'hook': case 'loop': card('tud', TUDOR, { expr: 'smug', L: 'hip', R: 'point', look: 0.5 }, D, TUD_D, 23); card('w1', WORK1, { expr: 'nervous', look: 0.4, L: 'up', R: 'up' }, D, W1, 41); break;
    case 'sail': card('tud', TUDOR, { expr: 'grin', L: 'hip', R: 'wave', wv: f * 0.3, look: -0.3 }, D, [0.6, 0, -1.2], 23); break;
    case 'gazette': card('w1', WORK1, { expr: 'laugh', talk: talkAt(f, 3, 1.4), L: 'belly', R: 'point' }, D, W1, 41); card('w2', WORK2, { expr: 'laugh', talk: talkAt(f, 5, 1.3), L: 'belly', R: 'belly' }, D, W2, 43); card('tud', TUDOR, { expr: f < 450 ? 'unimpressed' : 'stubborn', L: 'cross', R: 'cross', look: -0.4 }, D, [0.3, 0, -1.4], 23); break;
    case 'tropic': { const sh = f > 640; card('l1', LOC1, { expr: sh ? 'unimpressed' : 'squint', L: sh ? 'up' : 'hip', R: sh ? 'up' : 'hip', look: 0.4 }, TR, [-1.25, 0, 0.0], 51); card('l2', LOC2, { expr: f > 680 ? 'sideeye' : 'neutral', look: -1, L: 'cross', R: 'cross' }, TR, [1.35, 0, 0.2], 53);
      card('tud', TUDOR, { expr: f < 690 ? 'nervous' : 'shock', L: 'hip', R: 'grab', gx: 0.4, gy: 0.4, sweat: 0.7, sweatT: f / 60, look: 0.6 }, TR, [-0.45, 0, 0.6], 23); break; }
    case 'prison': card('tud', TUDOR, { expr: f < 860 ? 'cry' : 'sick', L: 'hang', R: 'hang', look: 0, over: { hat: undefined } }, PR, [-0.2, 0, -0.5], 23); break;
    case 'quit': card('tud', TUDOR, { expr: f < 1000 ? 'squint' : 'sly', L: 'hip', R: 'cheek', look: 0.3 }, PR, [-0.2, 0, -0.5], 23); break;
    case 'mill': card('mw', MILLW, { expr: 'neutral', R: 'grab', gx: 0.5, gy: 0.5, tool: 'shovel', toolRot: 0.9, coal: false, look: 0.3 }, MI, [0.45, 0, -0.35], 61);
      card('tud', TUDOR, { expr: f < 1258 ? 'squint' : 'eureka', L: 'hip', R: f < 1258 ? 'cheek' : 'up', look: 0.6 }, MI, [-0.75, 0, 0.35], 23); break;
    case 'survive': card('l1', LOC1, { expr: 'eureka', L: 'up', R: 'up', look: 0.2 }, TR, [-0.85, 0, 0.35], 51, { y: hop(0.2, 0) }); card('l2', LOC2, { expr: 'laugh', L: 'up', R: 'up' }, TR, [1.35, 0, 0.2], 53, { y: hop(0.22, 1) }); card('tud', TUDOR, { expr: 'smug', L: 'hip', R: 'thumb', look: 0.3 }, TR, [0.25, 0, 0.75], 23); break;
    case 'india': card('i1', IND1, { expr: 'eureka', L: 'up', R: 'point', look: 0.3 }, IN, [-0.85, 0, 0.35], 71); card('i2', IND2, { expr: 'laugh', L: 'belly', R: 'up' }, IN, [1.3, 0, 0.25], 73, { y: hop(0.2, 0.5) }); card('i3', { ...IND1, tunic: '#2a7ad0', beardStyle: 'goatee', hatCol: '#d0402a' }, { expr: 'shock', L: 'up', R: 'up' }, IN, [0.25, 0, 0.85], 75); break;
    case 'king': card('tud', TUDOR_K, { expr: 'smug', L: 'hip', R: 'hip', look: -0.4 }, D, [0.4, 1.5, -1.8], 23, { ground: 1.5 }); card('w1', WORK1, { expr: 'shock', L: 'up', R: 'up', look: 0.5 }, D, [-0.95, 0, -0.5], 41); card('w2', WORK2, { expr: 'eureka', L: 'up', R: 'up', look: -0.5 }, D, [1.55, 0, -0.6], 43); break;
  }
  return out;
};
export const fxAt = (f) => { const S = shot(f), out = [];
  if (S.id === 'tropic' && f >= 600) out.push(emote('?', f - 600, at(TR, [-0.95, HY + 0.4, 0.0]), { s: 0.18 }));
  if (S.id === 'quit' && f >= 960) out.push(emote('?', f - 960, at(PR, [0.12, HY + 0.42, -0.5]), { s: 0.18 }));
  if (S.id === 'mill' && f >= 1262) out.push(emote('bulb', f - 1262, at(MI, [-0.75, HY + 0.5, 0.35]), { s: 0.24 }));
  if (S.id === 'survive' && f >= 1590) out.push(emote('!', f - 1590, at(TR, [-0.5, HY + 0.42, 0.35]), { s: 0.18 }));
  if (S.id === 'india' && f >= 1740) out.push(emote('heart', f - 1740, at(IN, [1.6, HY + 0.42, 0.25]), { s: 0.16 }));
  if (S.id === 'king' && f >= 1930) out.push(emote('dollar', f - 1930, at(D, [0.8, 1.5 + HY + 0.35, -1.8]), { s: 0.16 }));
  return out; };
// ---------------- camera ----------------
const orbit = (c, ang, d, y) => [c[0] + Math.sin(ang * Math.PI / 180) * d, y, c[2] + Math.cos(ang * Math.PI / 180) * d];
const HOOK0 = { pos: at(D, [0.75, 1.55, 2.95]), look: at(D, [0.45, 1.4, 0.2]), fov: 44 };
const cam = (f) => { const S = shot(f), v = (f - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v); let c;
  switch (S.id) {
    case 'hook': c = { pos: lerp3(HOOK0.pos, at(D, [0.7, 1.55, 2.7]), sv), look: lerp3(HOOK0.look, at(D, [0.4, 1.42, 0.25]), sv), fov: 44 }; break;
    case 'sail': { const sl = E.easeIn(ramp(f, 160, 304)); c = { pos: at(D, lerp3([2.4, 2.6, 3.4], [2.6, 3.0, 2.8], sv)), look: [XD + 0.5 + sl * 3, 2.6, -7.0 - sl * 26], fov: 48 }; break; }
    case 'gazette': { const k = E.smooth(ramp(f, 330, 420)); c = { pos: lerp3(at(D, [-0.2, 1.45, 1.55]), at(D, [0.15, 1.5, 3.5]), k), look: lerp3(at(D, [-0.25, 0.62, 1.02]), at(D, [0.2, 1.25, -0.7]), k), fov: 48 }; break; }
    case 'tropic': { const k = E.smooth(ramp(f, 620, 759)); c = { pos: at(TR, lerp3([0.2, 1.55, 3.7], [0.55, 1.3, 2.3], E.smooth(v))), look: lerp3(at(TR, [0.05, 1.2, -0.1]), at(TR, [0.25, 0.9, -0.35]), k), fov: 48 }; break; }
    case 'prison': c = { pos: at(PR, lerp3([-0.15, 1.45, 3.4], [-0.2, 1.42, 2.4], sv)), look: at(PR, [-0.2, 1.35, -0.5]), fov: 46 }; break;
    case 'quit': c = { pos: at(PR, orbit([-0.2, 0, -0.5], lerp(-14, -4, sv), lerp(1.75, 1.45, sv), 1.32)), look: at(PR, [-0.2, HY + 0.08, -0.5]), fov: 44 }; break;
    case 'mill': c = { pos: at(MI, lerp3([-1.6, 1.5, 3.4], [-0.6, 1.45, 2.7], sv)), look: at(MI, lerp3([0.2, 1.1, -0.6], [-0.2, 1.25, -0.2], sv)), fov: 48 }; break;
    case 'hold': c = { pos: at(HO, orbit([-0.15, 0, -0.25], lerp(-14, 8, sv), lerp(4.0, 3.5, sv), lerp(1.3, 1.2, sv))), look: at(HO, [-0.05, 0.68, -0.25]), fov: 50 }; break;
    case 'survive': c = { pos: at(TR, orbit([0.2, 0, 0.1], lerp(10, -6, sv), lerp(4.0, 3.5, sv), 1.45)), look: at(TR, [0.2, 1.05, -0.1]), fov: 50 }; break;
    case 'india': c = { pos: at(IN, lerp3([1.4, 1.2, 3.8], [0.9, 1.35, 3.0], sv)), look: at(IN, lerp3([0.2, 1.3, -1.0], [0.25, 1.15, -0.4], sv)), fov: 50 }; break;
    case 'king': c = { pos: at(D, lerp3([0.45, 1.0, 2.4], [0.4, 1.15, 1.9], sv)), look: at(D, [0.4, 2.15, -1.6]), fov: 48 }; break;
    case 'loop': { const k = E.smooth(ramp(f, 2040, 2135)); c = { pos: lerp3(at(D, [1.5, 1.7, 3.4]), HOOK0.pos, k), look: lerp3(at(D, [0.6, 1.4, 0.0]), HOOK0.look, k), fov: 44 }; break; }
  }
  c.shadowAt = c.look; return c; };
export const camAt = cam;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shot(f), C = cam(f), atp = (p, k) => ({ focus: dist(C.pos, p), cinf: k });
  switch (S.id) {
    case 'hook': case 'loop': { const b = at(D, blockPos(f)), k = S.id === 'hook' ? E.smooth(ramp(f, 70, 120)) : 1 - E.smooth(ramp(f, 2080, 2135)); return { focus: lerp(dist(C.pos, b), dist(C.pos, at(D, [TUD_D[0], HY, TUD_D[2]])), k), cinf: lerp(22, 11, k) }; }
    case 'sail': return { focus: 18, cinf: 3 };
    case 'gazette': { const k = E.smooth(ramp(f, 330, 420)); return { focus: lerp(dist(C.pos, at(D, [-0.25, 0.62, 1.05])), dist(C.pos, at(D, [0.2, HY, -0.5])), k), cinf: lerp(16, 9, k) }; }
    case 'tropic': return atp(at(TR, [0.3, 1.0, -0.2]), 9);
    case 'prison': return atp(at(PR, [-0.2, HY, -0.5]), 10);
    case 'quit': return atp(at(PR, [-0.2, HY, -0.5]), 12);
    case 'mill': return atp(at(MI, [-0.3, 1.2, -0.1]), 8);
    case 'hold': return atp(at(HO, [0, 0.6, -0.25]), 8);
    case 'survive': return atp(at(TR, [0.3, 1.0, -0.1]), 9);
    case 'india': return atp(at(IN, [0.25, 1.2, -0.2]), 8);
    case 'king': return atp(at(D, [0.4, 2.6, -1.8]), 8);
  }
  return { focus: 5, cinf: 0 }; };
export const worldAt = (f) => { const S = shot(f), W = {};
  W.sail = S.id === 'sail' ? q(E.easeIn(ramp(f, 160, 304)), 3) : 0;
  W.melt = S.id === 'tropic' ? q(E.smooth(ramp(f, 640, 755)), 3) : -1;
  W.cut = S.id === 'hold' ? q(lerp(-0.8, 0, E.smooth(ramp(f, 1312, 1350))), 3) : -0.8;
  W.heat = S.id === 'hold' ? q(ramp(f, 1500, 1559), 3) : -1;
  return W; };
// ---------------- handwritten labels ----------------
export const annotAt = (f) => { if (shot(f).id !== 'hold') return [];
  return [{ type: 'label', text: 'sawdust', at: at(HO, [0.62, 1.0, -0.24]), dx: -170, dy: -360, age: f - 1395 },
    { type: 'label', text: 'trapped air', at: at(HO, [0.62, 0.45, -0.24]), dx: -270, dy: 105, age: f - 1452, bend: -0.3 },
    { type: 'circle', at: at(HO, [0.62, 0.45, -0.24]), rw: 0.13, age: f - 1462 }]; };
export const overlayInfo = (f) => ({ rain: 0, shot: shot(f).id, cuts: [], callouts: [], pill: null, freeze: 0 });
