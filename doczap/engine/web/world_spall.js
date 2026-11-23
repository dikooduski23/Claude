// ---------- world: Lazzaro Spallanzani, Italy 1773 (Doc Zap Ep15, Rick's-Clips look, rich + 4K detail) ----------
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const ENV = { beams: [], candles: [], candleLights: [] };
// ---- shared helpers ----
const cvs = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
const mapM = (c, opts = {}) => new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(c), ...opts });
const beamTex = new THREE.CanvasTexture(cvs(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const g2 = g.createLinearGradient(0, 0, 64, 0); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(0.25, 'rgba(0,0,0,0)'); g2.addColorStop(0.75, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = g2; g.fillRect(0, 0, 64, 256); }));
const shaft = (parent, from, to, r0, r1, col, op, tag = 'day') => {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = new THREE.Vector3().subVectors(b, a), L = d.length();
  const geo = new THREE.CylinderGeometry(r0, r1, L, 24, 1, true); geo.translate(0, -L / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamTex, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.copy(a); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize()); m.userData.ndSkip = true; m.castShadow = false; m.renderOrder = 4; m.userData.tag = tag; parent.add(m); ENV.beams.push(m); return m; };
M.white = toon({ color: '#f6f4ee' }); M.fireCore = new THREE.MeshBasicMaterial({ color: '#fff0a0' }); M.fireHalo = new THREE.MeshBasicMaterial({ color: '#ffb84a', transparent: true, opacity: 0.25, depthWrite: false });
const candle = (parent, x, y, z, light = false, h = 0.16) => {
  add(new THREE.CylinderGeometry(0.035, 0.04, h, 10), M.white, x, y + h / 2, z, parent, { cast: false });
  const fl = add(new THREE.SphereGeometry(0.025, 8, 6), M.fireCore, x, y + h + 0.04, z, parent, { cast: false }); fl.scale.y = 1.8; fl.userData.ndSkip = true; ENV.candles.push(fl);
  const ha = add(new THREE.SphereGeometry(0.06, 8, 6), M.fireHalo, x, y + h + 0.05, z, parent, { cast: false }); ha.scale.y = 1.5; ha.userData.ndSkip = true; ENV.candles.push(ha);
  if (light) { const pl = new THREE.PointLight('#ffb060', 0, 4.5, 1.6); pl.position.set(x, y + h + 0.15, z); parent.add(pl); ENV.candleLights.push(pl); } };
const decal = (parent, w, h, draw, x, y, z, ry = 0, alpha = true, res = 320) => { const c = cvs(Math.round(res * w), Math.round(res * h), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(c), transparent: alpha, alphaTest: alpha ? 0.05 : 0 })); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = false; m.receiveShadow = true; parent.add(m); return m; };
const parchment = (title, lines) => (g, W, H) => { g.fillStyle = '#f1dfb4'; g.fillRect(0, 0, W, H); const r = P.rng(title.length * 7); g.fillStyle = 'rgba(150,100,50,0.22)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(r() * W, r() * H, 4 + r() * 16, 0, 7); g.fill(); }
  g.strokeStyle = '#8a5a2a'; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12); g.fillStyle = '#4a2a14'; g.textAlign = 'center'; g.font = `700 ${Math.round(W * 0.11)}px DejaVu Serif, serif`; g.fillText(title, W / 2, H * 0.2);
  g.strokeStyle = '#6a4020'; g.lineWidth = 3; for (let i = 0; i < lines; i++) { g.beginPath(); g.moveTo(W * 0.15, H * (0.32 + i * 0.09)); g.lineTo(W * (0.6 + r() * 0.25), H * (0.32 + i * 0.09)); g.stroke(); } };
const crate = (parent, x, y, z, s = 0.6, r = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = r; parent.add(g); add(tbox(s, s, s, 0.6), M.plank, 0, s / 2, 0, g); for (const yy of [0.06, s - 0.06]) add(box(s + 0.02, 0.07, s + 0.02), M.timber, 0, yy, 0, g, { cast: false }); return g; };
const prism = (len, dep, ht, mat, x, y, z, parent) => { const sh = new THREE.Shape(); sh.moveTo(-dep / 2, 0); sh.lineTo(dep / 2, 0); sh.lineTo(0, ht); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2); const m = add(geo, mat, x, y, z, parent); m.rotation.y = Math.PI / 2; return m; };
const BOOKC = ['#b83a3a', '#2f5aa8', '#3a8a5a', '#c89a3a', '#6a3a8a', '#2a6a7a', '#a8603a', '#3a3a5a'];
M.books = BOOKC.map((c) => toon({ color: c }));
const bookshelf = (parent, x, z, w = 2.2, h = 3.0, ry = 0, seed = 3) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g); const r = P.rng(seed);
  add(tbox(w, h, 0.45, 1), M.timber, 0, h / 2, -0.05, g); const rows = Math.floor(h / 0.55);
  for (let k = 0; k < rows; k++) { const y = 0.25 + k * 0.55; add(box(w - 0.1, 0.05, 0.42), M.wood, 0, y, 0.02, g, { cast: false }); let xx = -w / 2 + 0.1;
    while (xx < w / 2 - 0.15) { const bw = 0.05 + r() * 0.05, bh = 0.3 + r() * 0.16; const bk = add(box(bw, bh, 0.28), M.books[Math.floor(r() * 8)], xx + bw / 2, y + 0.025 + bh / 2, 0.05, g, { cast: false }); if (r() < 0.08) bk.rotation.z = 0.25; xx += bw + 0.008; } }
  return g; };
const vialMat = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#bfe2f2', transparent: true, opacity: 0.22, depthWrite: false });
const vial = (parent, x, y, z, col, h = 0.22, r = 0.045, fill = 0.6) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  add(new THREE.CylinderGeometry(r, r, h, 14, 1, true), vialMat, 0, h / 2, 0, g, { cast: false });
  const liq = add(new THREE.CylinderGeometry(r * 0.88, r * 0.88, h * fill, 14), toon({ color: col, emissive: col, emissiveIntensity: 0.35 }), 0, h * fill / 2, 0, g, { cast: false }); g.userData.liq = liq; return g; };
const flask = (parent, x, y, z, col, s = 1) => { add(new THREE.SphereGeometry(0.12 * s, 14, 10), toon({ color: col, emissive: col, emissiveIntensity: 0.3 }), x, y + 0.12 * s, z, parent); add(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.2 * s, 8), vialMat, x, y + 0.32 * s, z, parent, { cast: false }); };
const linenBag = (parent, x, y, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); const b = add(new THREE.SphereGeometry(0.07 * s, 12, 10), M.linen, 0, 0.06 * s, 0, g); b.scale.set(1, 0.9, 1);
  add(new THREE.ConeGeometry(0.035 * s, 0.07 * s, 8), M.linen, 0, 0.15 * s, 0, g); add(new THREE.TorusGeometry(0.02 * s, 0.006 * s, 6, 12), M.string, 0, 0.13 * s, 0, g, { cast: false }).rotation.x = Math.PI / 2;
  const st = add(new THREE.CylinderGeometry(0.003 * s, 0.003 * s, 0.25 * s, 4), M.string, 0.06 * s, 0.1 * s, 0.02 * s, g, { cast: false }); st.rotation.z = 1.2; return g; };
// ---- materials ----
M.terra = texM(P.stone(52, 16, 46, 60, 80, 80), 1, 1, '#ffd2b8');
M.cream = texM(P.plaster(61, 40), 1, 1, '#fff2dc'); M.ochre = texM(P.plaster(62, 36), 1, 1, '#ffd890'); M.rose = texM(P.plaster(63, 12), 1, 1, '#ffc4b0');
M.timber = toon({ color: '#6a4228' }); M.wood = toon({ color: '#9a6a40' }); M.darkWood = texM(P.planks(5), 1, 2, '#b88a62');
M.roofT = texM(P.roof(19), 2, 2, '#ff9a72'); M.stoneG = texM(P.stone(44, 40, 10, 70, 110, 60), 1, 1, '#e8e2d8');
M.linen = toon({ color: '#efe6d0' }); M.string = toon({ color: '#8a6a40' }); M.meat = toon({ color: '#d0505a' }); M.bread = toon({ color: '#e0a860' });
M.brass = toon({ color: '#e0b04a' }); M.ironK = toon({ color: '#3b3b44' }); M.juice = toon({ color: '#e8f070', emissive: '#a0b020', emissiveIntensity: 0.45 });
M.gold = toon({ color: '#ffcf3a', emissive: '#5a3a00' }); M.leaf = toon({ color: '#5aa040' }); M.lemon = toon({ color: '#ffe23a' }); M.cypress = toon({ color: '#3f7a3a' });
M.trunk = toon({ color: '#6a4a32' }); M.bush = toon({ color: '#6aa848' }); M.hill = toon({ color: '#8ab85a' }); M.hillFar = toon({ color: '#9ec27a' });
const skyPane = (w, h, night = false) => cvs(Math.round(256 * w), Math.round(256 * h), (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5aa8ff'); gr.addColorStop(1, '#d8f0ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(W * (0.2 + i * 0.25), H * (0.18 + (i % 2) * 0.1), W * 0.12, H * 0.05, 0, 0, 7); g.fill(); }
  g.fillStyle = '#e8a070'; for (let i = 0; i < 7; i++) { const x = i * W / 6 - 20, hh = H * (0.25 + (i * 37 % 10) / 40); g.fillRect(x, H - hh, W / 6 + 4, hh); g.fillStyle = i % 2 ? '#d8805a' : '#f0c890'; }
  g.fillStyle = '#c86040'; g.fillRect(W * 0.62, H * 0.38, W * 0.08, H * 0.4); g.beginPath(); g.moveTo(W * 0.6, H * 0.38); g.lineTo(W * 0.66, H * 0.28); g.lineTo(W * 0.72, H * 0.38); g.fill();
  g.fillStyle = '#3f7a3a'; for (const x of [0.1, 0.85]) { g.beginPath(); g.ellipse(W * x, H * 0.7, W * 0.04, H * 0.22, 0, 0, 7); g.fill(); } });
// ---- ground, hills, clouds (outdoor) ----
const ground = add(new THREE.PlaneGeometry(2400, 2400), (() => { const m = M.grass.clone(); m.map = M.grass.map.clone(); m.map.repeat.set(300, 300); m.map.needsUpdate = true; return m; })(), 0, -0.02, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
const rt = P.rng(44);
for (let i = 0; i < 16; i++) { const a = rt() * Math.PI * 2, d = 170 + rt() * 160; const hh = add(new THREE.SphereGeometry(40 + rt() * 40, 20, 10), i % 2 ? M.hill : M.hillFar, Math.cos(a) * d, -12, Math.sin(a) * d, world, { cast: false }); hh.scale.y = 0.5 + rt() * 0.3; }
const moon = add(new THREE.SphereGeometry(30, 24, 12), new THREE.MeshBasicMaterial({ color: '#fff3d6', fog: false }), 140, 300, -620, world, { cast: false }); moon.userData.ndSkip = true; moon.visible = false;
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = -Math.PI / 2 + (r() - 0.5) * 2.2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }
// ================= COURTYARD (origin): ochre loggia, cypress, lemon trees, well, outhouse =================
const CY = new THREE.Group(); world.add(CY);
add(tbox(24, 0.06, 20, 1.2), M.terra, 0, 0, -2, CY, { cast: false });
// back loggia (z = -9): wall + arches + roof
add(tbox(24, 7, 0.6, 2.4), M.ochre, 0, 3.5, -9.3, CY);
for (let i = 0; i < 7; i++) { const x = -9 + i * 3; add(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 14), M.stoneG, x, 1.6, -8.2, CY); add(box(0.6, 0.25, 0.6), M.stoneG, x, 3.3, -8.2, CY);
  if (i < 6) { const arch = add(new THREE.TorusGeometry(1.5, 0.18, 8, 20, Math.PI), M.stoneG, x + 1.5, 3.3, -8.2, CY, { cast: false }); } }
add(box(22, 0.5, 1.6), M.ochre, 0, 5.0, -8.4, CY); prism(22.6, 2.2, 0.9, M.roofT, 0, 5.25, -8.4, CY);
for (let i = 0; i < 6; i++) add(box(1.0, 1.2, 0.05), new THREE.MeshBasicMaterial({ color: '#4a3020' }), -7.5 + i * 3, 1.3, -9.0, CY, { cast: false });
// side walls (rose + cream) with windows, shutters, flower boxes
for (const s of [-1, 1]) { const wm = s < 0 ? M.rose : M.cream; add(tbox(0.6, 7, 16, 2.4), wm, s * 11.5, 3.5, -2, CY);
  for (let k = 0; k < 3; k++) for (const yy of [2.0, 4.6]) { const z = -6 + k * 4; add(box(0.06, 1.1, 0.8), skyPane ? new THREE.MeshBasicMaterial({ color: '#4a5a7a' }) : M.white, s * 11.18, yy, z, CY, { cast: false });
    for (const dz of [-0.55, 0.55]) add(box(0.06, 1.1, 0.3), toon({ color: ['#2f7a5a', '#2f5aa8', '#a83a2a'][k] }), s * 11.15, yy, z + dz, CY, { cast: false });
    add(box(0.25, 0.2, 1.0), M.timber, s * 11.05, yy - 0.68, z, CY, { cast: false }); for (let j = 0; j < 4; j++) add(new THREE.SphereGeometry(0.09, 8, 6), toon({ color: ['#ff4a6a', '#ffd23a', '#ff8a3a', '#ffffff'][(j + k) % 4] }), s * 11.0, yy - 0.5, z - 0.35 + j * 0.23, CY, { cast: false }); } }
// cypress trees behind the wall + distant bell tower
for (let i = 0; i < 6; i++) { const c = add(new THREE.SphereGeometry(1, 12, 10), M.cypress, -10 + i * 4, 9.5, -12, CY); c.scale.set(0.9, 3.2, 0.9); }
add(tbox(3, 16, 3, 2), M.rose, 6, 8, -16, CY); prism(3.4, 3.4, 2.2, M.roofT, 6, 16, -16, CY); add(box(1.2, 1.6, 0.1), new THREE.MeshBasicMaterial({ color: '#3a2a20' }), 6, 13, -14.45, CY, { cast: false });
// well
const well = new THREE.Group(); well.position.set(-3.2, 0, -3.2); CY.add(well);
add(new THREE.CylinderGeometry(0.9, 0.95, 0.9, 20, 1, true), M.stoneG, 0, 0.45, 0, well).material = (() => { const m = M.stoneG.clone(); m.side = THREE.DoubleSide; return m; })();
add(new THREE.TorusGeometry(0.92, 0.1, 8, 24), M.stoneG, 0, 0.9, 0, well, { cast: false }).rotation.x = Math.PI / 2;
for (const s of [-1, 1]) add(box(0.12, 1.6, 0.12), M.timber, s * 0.85, 1.6, 0, well); add(box(1.9, 0.12, 0.12), M.timber, 0, 2.4, 0, well); prism(2.2, 1.4, 0.5, M.roofT, 0, 2.45, 0, well);
// lemon trees in big terracotta pots
const lemonTree = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); CY.add(g); add(new THREE.CylinderGeometry(0.45, 0.32, 0.7, 16), M.terra, 0, 0.35, 0, g); add(new THREE.CylinderGeometry(0.06, 0.08, 1.0, 6), M.trunk, 0, 1.1, 0, g);
  const c = add(new THREE.SphereGeometry(0.75, 14, 10), M.leaf, 0, 1.9, 0, g); const r = P.rng(x * 10 + z); for (let i = 0; i < 9; i++) { const a = r() * 6.28, b = r() * 1.4; add(new THREE.SphereGeometry(0.08, 8, 6), M.lemon, Math.cos(a) * Math.sin(b) * 0.74, 1.9 + Math.cos(b) * 0.7, Math.sin(a) * Math.sin(b) * 0.74, g, { cast: false }); } };
lemonTree(-7.5, -6.5); lemonTree(-1.0, -7.0); lemonTree(8.5, -1.5); lemonTree(-8.5, 1.5);
// outhouse (right back) + bench + chamber pot
const OH = new THREE.Group(); OH.position.set(5.2, 0, -5.6); CY.add(OH);
add(tbox(1.5, 2.3, 1.4, 0.8), M.darkWood, 0, 1.15, 0, OH); prism(1.7, 1.7, 0.55, M.roofT, 0, 2.3, 0, OH);
const ohDoor = decal(OH, 0.8, 1.8, (g, W, H) => { g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#4a2a14'; g.lineWidth = 6; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.stroke(); } g.strokeRect(3, 3, W - 6, H - 6);
  g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(W * 0.5, H * 0.17, W * 0.13, 0, 7); g.fill(); g.fillStyle = '#7a4a2a'; g.beginPath(); g.arc(W * 0.57, H * 0.15, W * 0.12, 0, 7); g.fill(); }, 0, 1.0, 0.71, 0, false);
const bench = new THREE.Group(); bench.position.set(2.6, 0, -5.9); CY.add(bench); add(box(1.8, 0.1, 0.45), M.wood, 0, 0.5, 0, bench); for (const s of [-1, 1]) add(box(0.1, 0.5, 0.4), M.wood, s * 0.75, 0.25, 0, bench);
const POT = new THREE.Group(); POT.position.set(4.3, 0, -3.9); CY.add(POT);
const potM = toon({ color: '#f4f2ec' }); add(new THREE.CylinderGeometry(0.26, 0.18, 0.3, 18, 1, true), potM, 0, 0.15, 0, POT).material = (() => { const m = potM.clone(); m.side = THREE.DoubleSide; return m; })();
add(new THREE.TorusGeometry(0.26, 0.03, 6, 20), toon({ color: '#3a6ad0' }), 0, 0.3, 0, POT, { cast: false }).rotation.x = Math.PI / 2;
add(new THREE.CircleGeometry(0.24, 18), toon({ color: '#8a5a2a' }), 0, 0.22, 0, POT, { cast: false }).rotation.x = -Math.PI / 2;
const stick = add(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), M.wood, 0.25, 0.45, 0.1, POT, { cast: false }); stick.rotation.z = 0.5;
// laundry line + crates + a cat-free cart
add(new THREE.CylinderGeometry(0.008, 0.008, 9, 4), M.string, -6, 3.6, -4, CY, { cast: false }).rotation.z = Math.PI / 2;
for (let i = 0; i < 6; i++) { const cl = add(box(0.55, 0.7, 0.02), toon({ color: ['#ffffff', '#ff8a8a', '#8ac0ff', '#ffe08a', '#ffffff', '#a8e0a0'][i] }), -9.5 + i * 1.3, 3.2, -4, CY, { cast: false }); }
crate(CY, 8.5, 0, -6.8, 0.7, 0.3); crate(CY, 9.3, 0, -6.2, 0.6, -0.2); crate(CY, 8.8, 0.7, -6.6, 0.5, 0.5);
// lanterns on the walls
for (const [x, z] of [[-11.1, -4], [11.1, 0], [-3, -8.95], [3, -8.95]]) { const lb = add(new THREE.SphereGeometry(0.12, 8, 6), M.fireCore, x * 0.98, 3.0, z, CY, { cast: false }); lb.userData.ndSkip = true; ENV.candles.push(lb); }
const nightLamp = new THREE.PointLight('#ffb070', 0, 14, 1.4); nightLamp.position.set(1.5, 3.0, -2); CY.add(nightLamp);
// ================= LAB (x = 300): Spallanzani's study in Pavia =================
const LB = new THREE.Group(); LB.position.set(300, 0, 0); scene.add(LB);
add(tbox(11, 0.3, 10, 1.1), M.terra, 0, -0.15, 0.5, LB, { cast: false });
add(tbox(11, 5.2, 0.4, 2.2), M.cream, 0, 2.6, -3.6, LB); for (const s of [-1, 1]) add(tbox(0.4, 5.2, 10, 2.2), M.cream, s * 5.3, 2.6, 0.5, LB);
add(tbox(11, 0.3, 10, 2), M.darkWood, 0, 5.2, 0.5, LB, { cast: false }); for (let i = 0; i < 6; i++) add(box(0.25, 0.3, 10), M.timber, -4.5 + i * 1.8, 4.95, 0.5, LB);
add(box(11, 0.9, 0.06), toon({ color: '#c89a6a' }), 0, 0.45, -3.38, LB, { cast: false }); add(box(11, 0.08, 0.1), M.timber, 0, 0.92, -3.36, LB, { cast: false });
// arched window with Pavia view + sunbeam
const winC = skyPane(1.8, 2.6); const win = add(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshBasicMaterial({ map: P.tex(winC) }), 1.9, 2.5, -3.38, LB, { cast: false });
const winTop = add(new THREE.CircleGeometry(0.9, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#5aa8ff' }), 1.9, 3.6, -3.38, LB, { cast: false });
add(new THREE.TorusGeometry(0.95, 0.08, 6, 24, Math.PI), M.timber, 1.9, 3.6, -3.35, LB, { cast: false }); for (const s of [-1, 1]) add(box(0.14, 2.3, 0.12), M.timber, 1.9 + s * 0.95, 2.5, -3.34, LB, { cast: false });
add(box(0.07, 3.2, 0.1), M.timber, 1.9, 2.8, -3.33, LB, { cast: false }); add(box(1.9, 0.07, 0.1), M.timber, 1.9, 2.6, -3.33, LB, { cast: false }); add(box(2.2, 0.12, 0.3), M.stoneG, 1.9, 1.38, -3.25, LB, { cast: false });
shaft(LB, [1.9, 3.0, -3.3], [0.9, 0.0, 1.0], 0.75, 1.5, '#fff0c4', 0.33);
for (const s of [-1, 1]) add(box(0.45, 2.8, 0.05), toon({ color: '#b8323a' }), 1.9 + s * 1.3, 2.6, -3.32, LB, { cast: false });
// bookshelves, crucifix, paintings, parchments
bookshelf(LB, -3.6, -3.25, 2.6, 3.4, 0, 7); bookshelf(LB, -5.0, -0.6, 2.4, 3.2, Math.PI / 2, 9);
add(box(0.08, 0.7, 0.05), M.timber, -1.2, 3.6, -3.36, LB, { cast: false }); add(box(0.45, 0.08, 0.05), M.timber, -1.2, 3.75, -3.36, LB, { cast: false });
for (const [x, y, c] of [[3.9, 3.0, '#3a7ad0'], [-0.2, 3.3, '#d0803a']]) { add(box(0.9, 0.7, 0.05), M.gold, x, y, -3.37, LB, { cast: false }); add(box(0.76, 0.56, 0.06), toon({ color: c }), x, y, -3.35, LB, { cast: false }); add(new THREE.SphereGeometry(0.14, 10, 8), M.white, x - 0.1, y - 0.02, -3.31, LB, { cast: false }); }
decal(LB, 0.6, 0.8, parchment('VENTRICULUS', 5), 5.08, 2.4, -1.4, -Math.PI / 2, false); decal(LB, 0.55, 0.72, parchment('DIGESTIO', 4), 5.08, 2.6, -0.4, -Math.PI / 2, false);
// stomach anatomy chart on the wall (diegetic)
decal(LB, 1.0, 1.3, (g, W, H) => { g.fillStyle = '#f1dfb4'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a5a2a'; g.lineWidth = 8; g.strokeRect(6, 6, W - 12, H - 12);
  g.fillStyle = '#e88a8a'; g.strokeStyle = '#7a2a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(W * 0.45, H * 0.12); g.bezierCurveTo(W * 0.42, H * 0.35, W * 0.15, H * 0.4, W * 0.25, H * 0.65); g.bezierCurveTo(W * 0.35, H * 0.9, W * 0.8, H * 0.8, W * 0.75, H * 0.55); g.bezierCurveTo(W * 0.72, H * 0.4, W * 0.55, H * 0.42, W * 0.55, H * 0.12); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#4a2a14'; g.font = `700 ${Math.round(W * 0.09)}px DejaVu Serif, serif`; g.textAlign = 'center'; g.fillText('STOMACHUS', W / 2, H * 0.95); }, 5.08, 2.5, 1.3, -Math.PI / 2, false);
// the desk + props
const DK = new THREE.Group(); DK.position.set(-0.4, 0, -0.85); LB.add(DK);
add(tbox(2.9, 0.12, 1.25, 1), M.wood, 0, 1.0, 0, DK); for (const [x, z] of [[-1.3, -0.5], [1.3, -0.5], [-1.3, 0.5], [1.3, 0.5]]) add(box(0.12, 1.0, 0.12), M.timber, x, 0.5, z, DK);
add(box(2.7, 0.35, 0.05), M.timber, 0, 0.75, 0.6, DK, { cast: false });
const plate = add(new THREE.CylinderGeometry(0.22, 0.18, 0.03, 20), M.white, -0.85, 1.07, 0.25, DK); const meatP = add(new THREE.DodecahedronGeometry(0.09, 0), M.meat, -0.9, 1.14, 0.25, DK); meatP.scale.set(1.3, 0.7, 1);
const bread = add(new THREE.SphereGeometry(0.1, 12, 8), M.bread, -0.72, 1.13, 0.2, DK); bread.scale.set(1.5, 0.75, 1);
const BAGS = [linenBag(DK, -0.25, 1.06, 0.3), linenBag(DK, -0.05, 1.06, 0.38, 0.9), linenBag(DK, 0.12, 1.06, 0.26, 1.05)];
add(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), M.ironK, -0.45, 1.075, 0.35, DK, { cast: false }).rotation.z = Math.PI / 2; add(new THREE.TorusGeometry(0.04, 0.006, 6, 14), toon({ color: '#c84a4a' }), -0.5, 1.07, 0.42, DK, { cast: false }).rotation.x = Math.PI / 2;
const rack = new THREE.Group(); rack.position.set(0.75, 1.06, -0.25); DK.add(rack); add(box(0.55, 0.05, 0.14), M.wood, 0, 0.13, 0, rack, { cast: false }); add(box(0.55, 0.03, 0.14), M.wood, 0, 0.0, 0, rack, { cast: false });
['#ff7aa0', '#7ad0ff', '#c0f07a', '#ffc04a', '#b88aff'].forEach((c, i) => vial(rack, -0.22 + i * 0.11, 0.0, 0, c, 0.24, 0.035, 0.55));
const HV = vial(DK, 0.95, 1.06, 0.3, '#e0ec6a', 0.34, 0.07, 0.7); // hero vial of gastric juice
const meatV = add(new THREE.DodecahedronGeometry(0.05, 0), M.meat, 0, 0.5, 0, HV, { cast: false }); meatV.scale.set(1.2, 0.8, 1);
const bigJar = new THREE.Group(); bigJar.position.set(0.35, 1.06, 0.15); DK.add(bigJar);
add(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 18), vialMat, 0, 0.17, 0, bigJar, { cast: false }); add(new THREE.CylinderGeometry(0.105, 0.105, 0.24, 18), M.juice, 0, 0.12, 0, bigJar, { cast: false }); add(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), M.wood, 0, 0.37, 0, bigJar, { cast: false });
const gjLabel = decal(bigJar, 0.2, 0.12, (g, W, H) => { g.fillStyle = '#f4e3b8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#5a3622'; g.lineWidth = 6; g.strokeRect(4, 4, W - 8, H - 8); g.fillStyle = '#2a1a10'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${Math.round(H * 0.3)}px DejaVu Serif, serif`; g.fillText('GASTRIC', W / 2, H * 0.36); g.fillText('JUICE', W / 2, H * 0.7); }, 0, 0.17, 0.125, 0, false, 1400); gjLabel.visible = false;
const micro = new THREE.Group(); micro.position.set(1.2, 1.06, -0.35); DK.add(micro); add(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 14), M.brass, 0, 0.02, 0, micro); add(box(0.04, 0.3, 0.04), M.brass, -0.05, 0.17, 0, micro); const tube = add(new THREE.CylinderGeometry(0.03, 0.035, 0.28, 12), M.brass, 0.02, 0.32, 0, micro); tube.rotation.z = -0.3;
const book = add(box(0.5, 0.04, 0.34), M.white, -0.45, 1.08, -0.3, DK); add(box(0.02, 0.05, 0.34), M.books[0], -0.45, 1.08, -0.3, DK, { cast: false });
const quill = add(new THREE.ConeGeometry(0.025, 0.3, 6), M.white, -0.15, 1.2, -0.3, DK, { cast: false }); quill.rotation.z = -0.6; add(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), M.ironK, -0.1, 1.09, -0.38, DK, { cast: false });
candle(DK, -1.2, 1.06, -0.3, true); candle(DK, 1.25, 1.06, 0.25, false, 0.2);
// side table with basin (the vomit scene)
const ST = new THREE.Group(); ST.position.set(3.0, 0, -0.6); LB.add(ST); add(tbox(1.2, 0.1, 0.8, 1), M.wood, 0, 0.9, 0, ST); for (const [x, z] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) add(box(0.08, 0.9, 0.08), M.timber, x, 0.45, z, ST);
const basin = add(new THREE.SphereGeometry(0.3, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon({ color: '#e8eef4', side: THREE.DoubleSide }), 0, 1.25, 0.05, ST);
const basinLiq = add(new THREE.CircleGeometry(0.24, 18), M.juice, 0, 1.08, 0.05, ST, { cast: false }); basinLiq.rotation.x = -Math.PI / 2;
add(box(0.05, 0.6, 0.6), M.wood, -0.55, 1.2, 0, ST, { cast: false }); flask(ST, 0.42, 0.95, -0.2, '#7ad0ff', 0.8);
// globe, rug, stool, chest
const globe = new THREE.Group(); globe.position.set(-3.6, 0, 1.4); LB.add(globe); add(new THREE.CylinderGeometry(0.05, 0.25, 0.9, 10), M.timber, 0, 0.45, 0, globe);
const gl = add(new THREE.SphereGeometry(0.38, 24, 16), mapM(cvs(512, 256, (g, W, H) => { g.fillStyle = '#5aa0d8'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8c87a'; const r = P.rng(5); for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(r() * W, H * 0.2 + r() * H * 0.6, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); } })), 0, 1.3, 0, globe); gl.rotation.z = 0.4;
add(new THREE.TorusGeometry(0.43, 0.02, 6, 28), M.brass, 0, 1.3, 0, globe, { cast: false }).rotation.y = Math.PI / 2;
const rug = decal(LB, 3.2, 2.0, (g, W, H) => { g.fillStyle = '#2f5aa8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8b84a'; g.lineWidth = 14; g.strokeRect(18, 18, W - 36, H - 36); g.strokeStyle = '#b8323a'; g.lineWidth = 10; g.strokeRect(46, 46, W - 92, H - 92);
  g.fillStyle = '#e8b84a'; for (let i = 0; i < 6; i++) { const cx = W * (0.18 + i * 0.13); g.beginPath(); g.moveTo(cx, H * 0.5 - 40); g.lineTo(cx + 30, H * 0.5); g.lineTo(cx, H * 0.5 + 40); g.lineTo(cx - 30, H * 0.5); g.fill(); } }, -0.3, 0.012, 1.2, 0, false); rug.rotation.x = -Math.PI / 2;
crate(LB, 4.2, 0, 2.6, 0.6, 0.3); crate(LB, 4.1, 0.6, 2.6, 0.45, 0.6);
// chandelier
add(new THREE.CylinderGeometry(0.01, 0.01, 1.1, 4), M.ironK, -0.4, 4.5, 0.3, LB, { cast: false }); add(new THREE.TorusGeometry(0.45, 0.025, 6, 24), M.ironK, -0.4, 3.95, 0.3, LB, { cast: false }).rotation.x = Math.PI / 2;
for (let i = 0; i < 6; i++) { const a = i * 1.047; candle(LB, -0.4 + Math.cos(a) * 0.45, 3.95, 0.3 + Math.sin(a) * 0.45, i === 0, 0.12); }
const labFill = new THREE.PointLight('#a8c8ff', 0, 12, 1.3); labFill.position.set(1.9, 3.2, -2.0); LB.add(labFill);
// ================= HALL (x = -300): lecture hall, giant millstone, rot exhibit =================
const HL = new THREE.Group(); HL.position.set(-300, 0, 0); scene.add(HL);
add(tbox(14, 0.3, 12, 2), M.plank, 0, -0.15, 0, HL, { cast: false });
add(tbox(14, 6.5, 0.4, 2.4), M.darkWood, 0, 3.25, -5.2, HL); for (const s of [-1, 1]) add(tbox(0.4, 6.5, 12, 2.4), M.cream, s * 6.8, 3.25, 0, HL);
for (let i = 0; i < 7; i++) add(box(0.18, 6.5, 0.12), M.timber, -6 + i * 2, 3.25, -4.98, HL, { cast: false });
add(tbox(9, 0.5, 3.4, 1.5), M.darkWood, 0, 0.25, -3.4, HL); // stage
// chalkboard
decal(HL, 3.6, 1.6, (g, W, H) => { g.fillStyle = '#2a3a32'; g.fillRect(0, 0, W, H); g.strokeStyle = '#7a4a2a'; g.lineWidth = 22; g.strokeRect(0, 0, W, H); g.fillStyle = 'rgba(245,245,235,0.92)'; g.font = `700 ${Math.round(H * 0.17)}px DejaVu Serif, serif`; g.textAlign = 'center';
  g.fillText('STOMACH = MILL?', W * 0.5, H * 0.38); g.fillText('STOMACH = ROT?', W * 0.5, H * 0.72); g.strokeStyle = 'rgba(245,245,235,0.85)'; g.lineWidth = 5; g.beginPath(); g.arc(W * 0.12, H * 0.5, H * 0.18, 0, 7); g.stroke(); }, 0, 3.6, -4.97, 0, false);
// giant millstone on a timber frame
const MILL = new THREE.Group(); MILL.position.set(-1.6, 0.5, -3.6); HL.add(MILL);
for (const s of [-1, 1]) { add(box(0.18, 2.6, 0.18), M.timber, s * 0.5, 1.3, 0, MILL); }
add(box(1.2, 0.16, 0.18), M.timber, 0, 2.55, 0, MILL);
const wheel = new THREE.Group(); wheel.position.set(0, 1.35, 0); MILL.add(wheel);
const ws = add(new THREE.CylinderGeometry(1.05, 1.05, 0.42, 32), M.stoneG, 0, 0, 0, wheel); ws.rotation.x = Math.PI / 2; ws.rotation.y = 0;
const wheelFace = mapM(cvs(512, 512, (g, W, H) => { g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a8478'; g.lineWidth = 10; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * 60, H / 2 + Math.sin(a) * 60); g.lineTo(W / 2 + Math.cos(a + 0.4) * 250, H / 2 + Math.sin(a + 0.4) * 250); g.stroke(); } g.fillStyle = '#5a5248'; g.beginPath(); g.arc(W / 2, H / 2, 50, 0, 7); g.fill(); }));
for (const s of [-1, 1]) { const fc = add(new THREE.CircleGeometry(1.05, 32), wheelFace, 0, 0, s * 0.215, wheel, { cast: false }); if (s < 0) fc.rotation.y = Math.PI; }
add(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 10), M.ironK, 0, 0, 0, wheel, { cast: false }).rotation.x = Math.PI / 2;
// rot exhibit: glass dome over green meat, on a little table
const ROT = new THREE.Group(); ROT.position.set(2.4, 0.5, -3.0); HL.add(ROT);
add(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20), M.wood, 0, 0.9, 0, ROT); add(new THREE.CylinderGeometry(0.08, 0.2, 0.9, 10), M.timber, 0, 0.45, 0, ROT);
const rotMeat = add(new THREE.DodecahedronGeometry(0.16, 0), toon({ color: '#8aa84a' }), 0, 1.05, 0, ROT); rotMeat.scale.set(1.3, 0.7, 1);
add(new THREE.SphereGeometry(0.38, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), vialMat, 0, 0.94, 0, ROT, { cast: false });
// benches + chandelier + side windows with shafts + banners
for (let row = 0; row < 3; row++) { const z = 0.6 + row * 1.4; add(box(8, 0.12, 0.5), M.wood, 0, 0.5 + row * 0.15, z, HL); add(box(8, 0.6, 0.08), M.timber, 0, 0.8 + row * 0.15, z + 0.3, HL); }
for (const z of [-2.5, 1.0]) { add(box(0.06, 2.2, 1.2), new THREE.MeshBasicMaterial({ color: '#cfe8ff' }), -6.58, 3.6, z, HL, { cast: false }); shaft(HL, [-6.5, 3.8, z], [-1.5, 0.0, z + 0.8], 0.7, 1.4, '#fff0c8', 0.26); }
for (const x of [-4.5, 4.5]) { add(box(1.2, 2.4, 0.04), toon({ color: '#b8323a' }), x, 4.3, -4.95, HL, { cast: false }); add(new THREE.CircleGeometry(0.35, 20), M.gold, x, 4.6, -4.92, HL, { cast: false }); }
add(new THREE.TorusGeometry(0.8, 0.03, 6, 28), M.ironK, 0, 4.6, -0.5, HL, { cast: false }).rotation.x = Math.PI / 2;
for (let i = 0; i < 8; i++) { const a = i * 0.785; candle(HL, Math.cos(a) * 0.8, 4.6, -0.5 + Math.sin(a) * 0.8, i % 4 === 0, 0.12); }
// ================= STOMACH LAB (x = 600): cut-away stomach = chemistry lab =================
const SB = new THREE.Group(); SB.position.set(600, 0, 0); scene.add(SB);
const fleshC = cvs(1024, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ff9aa8'); gr.addColorStop(1, '#e86a80'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(160,40,70,0.45)'; g.lineWidth = 14; g.lineCap = 'round'; const r = P.rng(8); for (let i = 0; i < 26; i++) { g.beginPath(); const y0 = r() * H; g.moveTo(0, y0); for (let x = 0; x <= W; x += 40) g.lineTo(x, y0 + Math.sin(x * 0.02 + i) * 26); g.stroke(); }
  g.fillStyle = 'rgba(255,220,230,0.5)'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc(r() * W, r() * H, 3 + r() * 7, 0, 7); g.fill(); } });
const flesh = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(fleshC, 3, 2), side: THREE.BackSide });
const dome = add(new THREE.SphereGeometry(4.2, 40, 24), flesh, 0, 1.8, 0, SB, { cast: false }); dome.scale.set(1.25, 0.9, 1.0);
const juice = add(new THREE.CircleGeometry(4.6, 40), toon({ color: '#d8ec5a', emissive: '#8aa010', emissiveIntensity: 0.55 }), 0, 0.45, 0, SB, { cast: false }); juice.rotation.x = -Math.PI / 2;
const sbBag = linenBag(SB, 0.2, 0.42, -0.4, 4.0);
// flesh shelves holding glassware (the "chemistry lab")
const LABS = new THREE.Group(); SB.add(LABS);
for (const [x, z, ry] of [[-2.6, -1.8, 0.7], [2.6, -1.8, -0.7], [0, -3.0, 0]]) { const sh = new THREE.Group(); sh.position.set(x, 0, z); sh.rotation.y = ry; LABS.add(sh);
  for (const y of [1.3, 2.2]) { add(box(1.6, 0.12, 0.45), toon({ color: '#d85a72' }), 0, y, 0, sh); ['#7ad0ff', '#ffb04a', '#c0f07a', '#ff7ab0'].forEach((c, i) => flask(sh, -0.6 + i * 0.4, y + 0.06, 0, c, 1.0)); } }
const pinkL = new THREE.PointLight('#ffb0c0', 0, 12, 1.2); pinkL.position.set(0, 3.5, 1.5); SB.add(pinkL);
const juiceL = new THREE.PointLight('#d8ff6a', 0, 8, 1.4); juiceL.position.set(0, 0.9, 0); SB.add(juiceL);
const esoph = add(new THREE.CylinderGeometry(0.7, 0.9, 2.5, 20, 1, true), flesh, -0.8, 5.0, -0.5, SB, { cast: false });
// ================= CLASSROOM (x = 900): today =================
const CR = new THREE.Group(); CR.position.set(900, 0, 0); scene.add(CR);
add(tbox(12, 0.3, 10, 1.4), toon({ color: '#d8c8a8' }), 0, -0.15, 0, CR, { cast: false });
add(tbox(12, 5, 0.3, 2), toon({ color: '#cfe6f2' }), 0, 2.5, -3.6, CR); for (const s of [-1, 1]) add(tbox(0.3, 5, 10, 2), toon({ color: '#cfe6f2' }), s * 6, 2.5, 0, CR);
decal(CR, 4.0, 1.8, (g, W, H) => { g.fillStyle = '#2c4a3c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#b08a5a'; g.lineWidth = 24; g.strokeRect(0, 0, W, H); g.strokeStyle = 'rgba(245,245,235,0.9)'; g.lineWidth = 7; g.fillStyle = 'rgba(245,245,235,0.92)';
  g.beginPath(); g.moveTo(W * 0.2, H * 0.15); g.bezierCurveTo(W * 0.19, H * 0.35, W * 0.06, H * 0.4, W * 0.1, H * 0.62); g.bezierCurveTo(W * 0.15, H * 0.88, W * 0.32, H * 0.8, W * 0.3, H * 0.55); g.bezierCurveTo(W * 0.29, H * 0.4, W * 0.23, H * 0.38, W * 0.24, H * 0.15); g.stroke();
  g.font = `700 ${Math.round(H * 0.16)}px Inter, sans-serif`; g.textAlign = 'left'; g.fillText('DIGESTION', W * 0.42, H * 0.36); g.font = `600 ${Math.round(H * 0.11)}px Inter, sans-serif`; g.fillText('food + gastric juice', W * 0.42, H * 0.58); g.fillText('= dissolved!', W * 0.42, H * 0.76);
  g.beginPath(); g.moveTo(W * 0.33, H * 0.55); g.lineTo(W * 0.4, H * 0.5); g.stroke(); }, 0, 2.6, -3.43, 0, false);
add(box(1.6, 1.3, 0.05), new THREE.MeshBasicMaterial({ color: '#bfe6ff' }), 5.83, 2.5, -1.0, CR, { cast: false }); add(box(0.1, 1.4, 1.7), toon({ color: '#ffffff' }), 5.85, 2.5, -1.0, CR, { cast: false });
shaft(CR, [5.8, 2.7, -1.0], [2.5, 0.0, 0.0], 0.7, 1.4, '#fff4d8', 0.28, 'day');
for (const [x, c] of [[-4.3, '#ffb84a'], [4.0, '#7ac0ff']]) decal(CR, 0.9, 1.2, (g, W, H) => { g.fillStyle = c; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H * 0.4, W * 0.28, 0, 7); g.fill(); g.fillStyle = '#2a2a3a'; g.font = `800 ${Math.round(W * 0.12)}px Inter`; g.textAlign = 'center'; g.fillText(c === '#ffb84a' ? 'BIOLOGY' : 'SCIENCE', W / 2, H * 0.85); }, x, 2.6, -3.43, 0, false);
const DESKS = [];
for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const d = new THREE.Group(); d.position.set(-2.6 + i * 2.6, 0, 0.2 + j * 2.0); CR.add(d); DESKS.push(d);
  add(box(1.2, 0.06, 0.65), toon({ color: '#e8c890' }), 0, 0.78, 0, d); for (const s of [-1, 1]) add(box(0.05, 0.78, 0.6), M.ironK, s * 0.55, 0.39, 0, d);
  const bk = add(box(0.42, 0.03, 0.3), M.white, 0, 0.82, 0.05, d); add(box(0.43, 0.035, 0.31), M.books[(i + j) % 8], 0, 0.805, 0.05, d, { cast: false }); }
for (let i = 0; i < 6; i++) add(box(0.09, 0.32, 0.24), M.books[i], -5.5 + i * 0.1, 1.22, -3.2, CR, { cast: false }); add(box(1.0, 0.06, 0.35), M.wood, -5.25, 1.04, -3.25, CR);
add(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 12), toon({ color: '#ffffff' }), 5.0, 0.14, -2.8, CR); const pkC = add(new THREE.SphereGeometry(0.42, 10, 8), M.bush, 5.0, 0.62, -2.8, CR); pkC.scale.y = 1.4;
for (const x of [-2, 2]) { add(box(1.6, 0.06, 0.25), toon({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.6 }), x, 4.8, 0, CR, { cast: false }); }
