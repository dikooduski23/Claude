// ================= HOSPITAL (x = 2000): Eberswalde, 1929 — operating room, stairwell, X-ray room =================
const HO = new THREE.Group(); HO.position.set(2000, 0, 0); scene.add(HO);
const tileC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#e9efe9'; g.fillRect(0, 0, W, H); const n = 8, s = W / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 236 + ((i * 7 + j * 13) % 9); g.fillStyle = `rgb(${v - 4},${v + 2},${v - 2})`; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(i * s + 6, j * s + 6, s * 0.35, 4); } });
const floorC = cvs(512, 512, (g, W, H) => { const n = 8, s = W / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#3c5a6e' : '#e8e4da'; g.fillRect(i * s, j * s, s, s); } g.strokeStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, H); g.moveTo(0, i * s); g.lineTo(W, i * s); g.stroke(); } });
M.tile = texM(tileC, 1, 1, '#ffffff'); M.hfloor = texM(floorC, 1, 1, '#ffffff'); M.mint = texM(P.plaster(71, 20), 1, 1, '#bfe6d6'); M.lead = texM(P.plaster(72, 20), 1, 1, '#7aa0a8');
M.steel = toon({ color: '#c8d0d8' }); M.steelD = toon({ color: '#7a8490' }); M.sheet = toon({ color: '#f8f8f4' }); M.rubber = toon({ color: '#c8683a' }); M.leather = toon({ color: '#7a4a2a' });
M.lampGlow = new THREE.MeshBasicMaterial({ color: '#fffbe8' }); M.screenG = new THREE.MeshBasicMaterial({ color: '#2a5a3a' });
const room = (gx, w, d, h, wallLo, wallHi, floorM) => { const g = new THREE.Group(); g.position.set(gx, 0, 0); HO.add(g);
  add(tbox(w, 0.3, d, 1.6), floorM, 0, -0.15, 0, g, { cast: false });
  for (const [x, z, ww, dd] of [[0, -d / 2, w, 0.3], [-w / 2, 0, 0.3, d], [w / 2, 0, 0.3, d]]) { add(tbox(ww, h * 0.55, dd, 1.2), wallLo, x, h * 0.275, z, g); add(tbox(ww, h * 0.45, dd, 2.2), wallHi, x, h * 0.775, z, g); add(box(ww + 0.02, 0.08, dd + 0.04), M.steelD, x, h * 0.55, z, g, { cast: false }); }
  add(tbox(w, 0.3, d, 2), M.cream, 0, h, 0, g, { cast: false }); return g; };
// ---- operating room ----
const OR = room(0, 8, 8, 4.4, M.tile, M.mint, M.hfloor);
const opTable = new THREE.Group(); opTable.position.set(0, 0, -0.6); OR.add(opTable);
add(new THREE.CylinderGeometry(0.16, 0.3, 0.8, 16), M.steel, 0, 0.4, 0, opTable); add(box(2.1, 0.12, 0.8), M.steelD, 0, 0.86, 0, opTable); add(box(2.0, 0.1, 0.74), M.sheet, 0, 0.97, 0, opTable);
add(box(0.42, 0.12, 0.5), M.sheet, -0.82, 1.06, 0, opTable, { cast: false });
const opLamp = new THREE.Group(); opLamp.position.set(0, 3.1, -0.6); OR.add(opLamp);
add(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), M.steelD, 0, 0.65, 0, opLamp, { cast: false }); add(new THREE.SphereGeometry(0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.steel, 0, 0, 0, opLamp);
const lampFace = add(new THREE.CircleGeometry(0.55, 24), M.lampGlow, 0, -0.01, 0, opLamp, { cast: false }); lampFace.rotation.x = Math.PI / 2; lampFace.userData.ndSkip = false;
const opLight = new THREE.SpotLight('#fff6e0', 0, 9, 0.7, 0.6, 1.2); opLight.position.set(0, 3.0, -0.6); opLight.target.position.set(0, 0.9, -0.6); OR.add(opLight); OR.add(opLight.target);
const cart = new THREE.Group(); cart.position.set(1.55, 0, -0.1); OR.add(cart);
for (const [x, z] of [[-0.35, -0.22], [0.35, -0.22], [-0.35, 0.22], [0.35, 0.22]]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), M.steel, x, 0.45, z, cart, { cast: false });
add(box(0.8, 0.04, 0.5), M.steel, 0, 0.9, 0, cart); add(box(0.8, 0.03, 0.5), M.steel, 0, 0.35, 0, cart);
for (let i = 0; i < 5; i++) add(box(0.015, 0.01, 0.16), M.steelD, -0.25 + i * 0.06, 0.93, -0.05, cart, { cast: false });
const coil = add(new THREE.TorusGeometry(0.12, 0.014, 6, 30), M.rubber, 0.2, 0.935, 0.05, cart, { cast: false }); coil.rotation.x = Math.PI / 2;
add(new THREE.TorusGeometry(0.08, 0.014, 6, 30), M.rubber, 0.2, 0.95, 0.05, cart, { cast: false }).rotation.x = Math.PI / 2;
for (let i = 0; i < 3; i++) { const sy = add(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8), vialMat, -0.1 + i * 0.05, 0.93, 0.15, cart, { cast: false }); sy.rotation.z = Math.PI / 2; }
// glass cabinet with bottles
const cab = new THREE.Group(); cab.position.set(-2.6, 0, -3.55); OR.add(cab); add(box(1.4, 2.2, 0.45), M.steel, 0, 1.1, 0, cab);
for (let k = 0; k < 3; k++) { add(box(1.3, 0.03, 0.4), M.steelD, 0, 0.5 + k * 0.55, 0.02, cab, { cast: false }); for (let i = 0; i < 6; i++) vial(cab, -0.5 + i * 0.2, 0.52 + k * 0.55, 0.05, ['#7ac8ff', '#ffb04a', '#9be07a', '#ff7a8a', '#ffffff', '#c8a0ff'][(i + k) % 6], 0.2, 0.05, 0.7); }
add(box(1.3, 2.1, 0.02), vialMat, 0, 1.1, 0.24, cab, { cast: false });
// window + daylight
const orWinC = skyPane(1.6, 2.2); const orWin = add(new THREE.PlaneGeometry(1.6, 2.0), new THREE.MeshBasicMaterial({ map: P.tex(orWinC) }), 1.8, 2.6, -3.84, OR, { cast: false });
for (const s of [-1, 1]) add(box(0.1, 2.1, 0.1), M.steelD, 1.8 + s * 0.8, 2.6, -3.8, OR, { cast: false }); add(box(1.7, 0.1, 0.1), M.steelD, 1.8, 2.6, -3.8, OR, { cast: false }); add(box(0.06, 2.0, 0.08), M.steelD, 1.8, 2.6, -3.8, OR, { cast: false });
shaft(OR, [1.8, 3.4, -3.7], [0.6, 0.0, 0.2], 0.5, 1.2, '#fff4d8', 0.16);
// sink + clock + chair
add(box(0.7, 0.25, 0.45), M.sheet, 3.7, 0.95, 1.0, OR); add(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), M.steel, 3.78, 1.25, 1.0, OR, { cast: false });
decal(OR, 0.5, 0.5, (g, W, H) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.46, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#222'; g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2, H * 0.18); g.moveTo(W / 2, H / 2); g.lineTo(W * 0.72, H / 2); g.stroke(); }, -1.0, 3.3, -3.82);
const orFill = new THREE.PointLight('#eaf6ff', 0, 14, 1.1); orFill.position.set(0.5, 3.6, 2.0); OR.add(orFill);
// ---- stairwell (local x = 12): stairs go DOWN toward +z ----
const STW = new THREE.Group(); STW.position.set(12, 0, 0); HO.add(STW);
const N_ST = 12, RISE = 0.2, RUN = 0.3, Z0 = -2.4; // top edge z, top height 2.4
add(tbox(2.4, 0.3, 2.4, 1.6), M.hfloor, 0, 2.4 - 0.15, Z0 - 1.2, STW, { cast: false });            // top landing
add(tbox(5.0, 0.3, 4, 1.6), M.hfloor, 0, -0.15, Z0 + N_ST * RUN + 1.8, STW, { cast: false });      // bottom floor
for (let i = 0; i < N_ST; i++) { const y = 2.4 - (i + 1) * RISE, z = Z0 + i * RUN + RUN / 2; add(box(2.2, y + 0.0001 + RISE, RUN), M.stoneG, 0, (y + RISE) / 2, z, STW); add(box(2.24, 0.04, RUN + 0.04), M.steelD, 0, y + RISE, z + 0.01, STW, { cast: false }); }
add(tbox(0.3, 5.4, 9, 1.2), M.tile, -1.25, 2.2, -0.2, STW); add(tbox(0.3, 5.4, 9, 1.2), M.mint, 1.6, 2.2, -0.6, STW);
add(tbox(3.2, 5.4, 0.3, 1.2), M.mint, 0.2, 2.7, Z0 - 2.4, STW);
const stWinC = skyPane(1.2, 1.8); add(new THREE.PlaneGeometry(1.0, 1.5), new THREE.MeshBasicMaterial({ map: P.tex(stWinC) }), 0, 4.0, Z0 - 2.24, STW, { cast: false });
shaft(STW, [0, 4.3, Z0 - 2.2], [0.2, 1.0, 0.4], 0.35, 1.0, '#fff2d0', 0.18);
for (let i = 0; i <= N_ST; i += 2) { const y = 2.4 - i * RISE, z = Z0 + i * RUN; add(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), M.timber, 1.05, y + 0.47, z, STW, { cast: false }); }
{ const a = new THREE.Vector3(1.05, 2.4 + 0.95, Z0), b = new THREE.Vector3(1.05, 0.95, Z0 + N_ST * RUN); const L = a.distanceTo(b); const rail = add(new THREE.CylinderGeometry(0.04, 0.04, L, 8), M.wood, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, STW, { cast: false }); rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); }
decal(STW, 0.9, 0.5, (g, W, H) => { g.fillStyle = '#f4ead2'; g.fillRect(0, 0, W, H); g.strokeStyle = '#3a3a3a'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6); g.fillStyle = '#222'; g.font = `800 ${H * 0.34}px DejaVu Sans, sans-serif`; g.textAlign = 'center'; g.fillText('RÖNTGEN ↓', W / 2, H * 0.62); }, -1.08, 1.7, 1.0, Math.PI / 2);
const stFill = new THREE.PointLight('#fff2e0', 0, 12, 1.1); stFill.position.set(0.3, 3.8, 1.5); STW.add(stFill);
// ---- X-ray room (local x = 24) ----
const XR_ = room(24, 7, 7, 4.0, M.lead, M.lead, M.hfloor);
const xm = new THREE.Group(); xm.position.set(-0.6, 0, -1.6); XR_.add(xm);
add(new THREE.CylinderGeometry(0.12, 0.16, 3.0, 12), M.steelD, 0, 1.5, 0, xm); add(box(0.7, 0.12, 0.7), M.steelD, 0, 0.06, 0, xm);
add(box(1.3, 0.1, 0.1), M.steelD, 0.55, 2.55, 0, xm); const tubeH = add(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 18), M.steel, 1.15, 2.3, 0, xm); tubeH.rotation.z = Math.PI / 2;
const bulb = add(new THREE.SphereGeometry(0.2, 16, 12), vialMat, 1.15, 2.0, 0, xm, { cast: false });
const fluoro = new THREE.Group(); fluoro.position.set(1.0, 0, -1.2); XR_.add(fluoro);
add(box(1.1, 1.5, 0.08), M.timber, 0, 1.55, 0, fluoro); const fscr = add(new THREE.PlaneGeometry(0.9, 1.3), M.screenG, 0, 1.55, 0.05, fluoro, { cast: false });
for (const s of [-1, 1]) add(box(0.06, 0.85, 0.06), M.timber, s * 0.45, 0.42, 0, fluoro);
const panel = add(box(1.0, 1.2, 0.4), M.steelD, -2.5, 0.6, -3.1, XR_); for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), M.sheet, -2.8 + i * 0.3, 0.95, -2.88, XR_, { cast: false }).rotation.x = Math.PI / 2;
decal(XR_, 1.1, 0.55, (g, W, H) => { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; g.font = `900 ${H * 0.3}px DejaVu Sans, sans-serif`; g.textAlign = 'center'; g.fillText('⚡ RÖNTGEN', W / 2, H * 0.45); g.font = `700 ${H * 0.18}px DejaVu Sans, sans-serif`; g.fillText('X-RAY · KEEP OUT', W / 2, H * 0.78); }, 1.2, 3.0, -3.33);
const xrFill = new THREE.PointLight('#d8f0ff', 0, 12, 1.1); xrFill.position.set(0, 3.4, 1.5); XR_.add(xrFill);
const xrGlow = new THREE.PointLight('#7aff9a', 0, 5, 1.5); xrGlow.position.set(1.0, 1.6, -0.6); XR_.add(xrGlow);
