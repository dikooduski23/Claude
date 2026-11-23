// ================= STAPP (1954): Holloman desert track (S_x=8000), blockhouse console (S_x=8800), office (S_x=9200), medical tent (S_x=9600), modern car (S_x=10000) =================
const SR_ = P.rng(1954);
// ---------- desert ----------
const DES = new THREE.Group(); DES.position.set(8000, 0, 0); scene.add(DES);
const sandC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#efe2c6'; g.fillRect(0, 0, W, H); const S_r = P.rng(54); for (let i = 0; i < 5000; i++) { g.fillStyle = S_r() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(150,110,60,.10)'; g.fillRect(S_r() * W, S_r() * H, 2, 2); }
  g.strokeStyle = 'rgba(170,130,80,.18)'; g.lineWidth = 3; for (let i = 0; i < 40; i++) { const S_y = S_r() * H; g.beginPath(); g.moveTo(0, S_y); for (let S_x = 0; S_x <= W; S_x += 32) g.lineTo(S_x, S_y + Math.sin(S_x * 0.03 + i) * 6); g.stroke(); } });
const sandT = P.tex(sandC); sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(160, 160);
add(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshToonMaterial({ gradientMap: grad, map: sandT }), 0, 0, 0, DES, { cast: false }).rotation.x = -Math.PI / 2;
M.mtnA = toon({ color: '#b88a7a' }); M.mtnB = toon({ color: '#9a7a9a' }); M.mtnC = toon({ color: '#c8a090' });
for (let i = 0; i < 18; i++) { const S_h = 40 + SR_() * 70, S_r = 60 + SR_() * 90; const S_m = add(new THREE.ConeGeometry(S_r, S_h, 7), [M.mtnA, M.mtnB, M.mtnC][i % 3], -900 + i * 105 + SR_() * 40, S_h / 2 - 2, -420 - SR_() * 160, DES, { cast: false }); S_m.rotation.y = SR_() * 3; }
for (let i = 0; i < 10; i++) { const S_h = 25 + SR_() * 40, S_r = 50 + SR_() * 60; add(new THREE.ConeGeometry(S_r, S_h, 6), M.mtnB, -900 + i * 190, S_h / 2 - 2, 520 + SR_() * 100, DES, { cast: false }); }
const bushG = new THREE.IcosahedronGeometry(0.5, 0); const BUSH = new THREE.InstancedMesh(bushG, toon({ color: '#7a8a4a' }), 420); { const o = new THREE.Object3D();
  for (let i = 0; i < 420; i++) { let S_x = -600 + SR_() * 1200, S_z = -160 + SR_() * 320; if (Math.abs(S_z) < 7) S_z += Math.sign(S_z || 1) * 9; o.position.set(S_x, 0.2, S_z); o.scale.set(0.6 + SR_(), 0.4 + SR_() * 0.5, 0.6 + SR_()); o.rotation.y = SR_() * 3; o.updateMatrix(); BUSH.setMatrixAt(i, o.matrix); } } DES.add(BUSH);
// rails + concrete bed + sleepers
M.rail = toon({ color: '#8a9098' }); M.bed = toon({ color: '#cfc8bc' });
add(box(900, 0.3, 4.2), M.bed, 0, 0.15, 0, DES, { cast: false });
for (const S_z of [-1.1, 1.1]) add(box(900, 0.22, 0.18), M.rail, 0, 0.41, S_z, DES, { cast: false });
const SLP = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.08, 3.0), toon({ color: '#9a9088' }), 900); { const o = new THREE.Object3D(); for (let i = 0; i < 900; i++) { o.position.set(-450 + i, 0.32, 0); o.updateMatrix(); SLP.setMatrixAt(i, o.matrix); } } DES.add(SLP);
// water-brake trough near the end of the track (S_x 150..260)
const trough = add(box(110, 0.12, 1.2), new THREE.MeshStandardMaterial({ color: '#4aa8e0', roughness: 0.15, transparent: true, opacity: 0.85 }), 205, 0.36, 0, DES, { cast: false }); trough.material.userData.keepStd = true;
for (let i = 0; i < 12; i++) add(box(0.12, 0.3, 1.25), M.bed, 152 + i * 9.5, 0.4, 0, DES, { cast: false });
// poles with camera boxes every 12 S_m
for (let i = -30; i <= 30; i++) { const S_x = i * 12; add(new THREE.CylinderGeometry(0.09, 0.12, 4.5, 6), M.timber, S_x, 2.25, -3.2, DES, { cast: false }); if (i % 2 === 0) add(box(0.5, 0.35, 0.4), toon({ color: '#2a2a30' }), S_x, 3.6, -2.9, DES, { cast: false }); if (i % 3 === 0) add(box(0.6, 0.6, 0.02), toon({ color: i % 6 ? '#ffffff' : '#e8382e' }), S_x, 1.8, -3.08, DES, { cast: false }); }
// blockhouse (exterior) near the start
const BLK = new THREE.Group(); BLK.position.set(-40, 0, -16); DES.add(BLK);
add(box(10, 3.2, 6), toon({ color: '#c8c0b0' }), 0, 1.6, 0, BLK); add(box(10.6, 0.5, 6.6), toon({ color: '#b0a898' }), 0, 3.4, 0, BLK); add(box(5, 0.5, 0.1), toon({ color: '#1a1e24' }), 0, 2.1, 3.02, BLK, { cast: false });
for (let i = 0; i < 9; i++) add(new THREE.CapsuleGeometry(0.28, 0.7, 4, 8), toon({ color: '#c8b48a' }), -4 + i, 0.3, 3.6, BLK).rotation.z = Math.PI / 2;
add(new THREE.CylinderGeometry(0.05, 0.05, 6, 5), M.steelD, 4, 6.4, 0, BLK); const flag = add(new THREE.PlaneGeometry(1.4, 0.8), toon({ color: '#ffffff', side: THREE.DoubleSide }), 4.72, 8.9, 0, BLK, { cast: false });
// ---------- the rocket sled ----------
M.sledS = toon({ color: '#c8ccd2' }); M.sledR = toon({ color: '#d8382e' }); M.sledD = toon({ color: '#3a3e46' }); M.fl1 = new THREE.MeshBasicMaterial({ color: '#fff4c0' }); M.fl2 = new THREE.MeshBasicMaterial({ color: '#ff9a20', transparent: true, opacity: 0.85, depthWrite: false });
const SLED = new THREE.Group(); DES.add(SLED);
for (const S_z of [-1.1, 1.1]) { add(box(6.2, 0.22, 0.26), M.sledS, 0, 0.75, S_z * 0.75, SLED); for (const S_x of [-2.4, 2.4]) add(box(0.7, 0.3, 0.3), M.sledD, S_x, 0.52, S_z, SLED); }
for (const S_x of [-2.6, -1.2, 0.4, 2.0]) add(box(0.18, 0.18, 1.9), M.sledS, S_x, 0.75, 0, SLED);
add(box(2.0, 0.12, 1.5), M.sledS, 1.9, 0.92, 0, SLED);                       // pilot deck (front = +S_x)
add(box(0.18, 1.6, 1.0), M.sledR, 1.45, 1.75, 0, SLED); add(box(0.6, 0.12, 1.0), M.sledR, 1.75, 1.25, 0, SLED); // seat back + pan
add(box(0.35, 0.2, 1.3), M.sledR, 2.95, 0.85, 0, SLED); const S_nose = add(new THREE.ConeGeometry(0.55, 1.0, 4), M.sledR, 3.4, 0.85, 0, SLED); S_nose.rotation.z = -Math.PI / 2; S_nose.rotation.x = Math.PI / 4;
for (const S_z of [-0.62, 0.62]) add(box(1.4, 0.06, 0.05), M.sledD, 2.3, 1.25, S_z, SLED, { cast: false });                      // side rails of the seat
const RK = [], FL = []; for (let i = 0; i < 6; i++) { const S_z = (i % 3 - 1) * 0.42, S_y = 1.05 + Math.floor(i / 3) * 0.42; const S_c = add(new THREE.CylinderGeometry(0.19, 0.19, 2.4, 14), M.sledS, -1.6, S_y, S_z, SLED); S_c.rotation.z = Math.PI / 2; RK.push(S_c);
  const nz = add(new THREE.CylinderGeometry(0.17, 0.24, 0.3, 14), M.sledD, -2.95, S_y, S_z, SLED); nz.rotation.z = Math.PI / 2;
  const f1 = add(new THREE.ConeGeometry(0.17, 1.6, 12), M.fl1, -3.9, S_y, S_z, SLED, { cast: false }); f1.rotation.z = Math.PI / 2; f1.userData.ndSkip = true;
  const f2 = add(new THREE.ConeGeometry(0.3, 3.2, 12), M.fl2, -4.6, S_y, S_z, SLED, { cast: false }); f2.rotation.z = Math.PI / 2; f2.userData.ndSkip = true; FL.push(f1, f2); }
add(box(2.6, 0.08, 1.4), M.sledS, -1.6, 0.85, 0, SLED, { cast: false });
const scoop = add(box(0.6, 0.35, 0.5), M.sledD, 0.9, 0.35, 0, SLED, { cast: false });   // water-brake scoop
const fireL = new THREE.PointLight('#ffb050', 0, 30, 1.2); fireL.position.set(-4.5, 1.4, 0); SLED.add(fireL);
// smoke trail puffs (camera-facing)
const smokeC = cvs(256, 256, (g) => { const S_gr = g.createRadialGradient(128, 128, 10, 128, 128, 126); S_gr.addColorStop(0, 'rgba(255,255,255,.95)'); S_gr.addColorStop(0.6, 'rgba(240,236,228,.6)'); S_gr.addColorStop(1, 'rgba(230,226,220,0)'); g.fillStyle = S_gr; g.fillRect(0, 0, 256, 256); });
const smokeM = new THREE.MeshBasicMaterial({ map: P.tex(smokeC), transparent: true, depthWrite: false });
const SMK = []; for (let i = 0; i < 70; i++) { const S_m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), smokeM.clone()); S_m.userData.ndSkip = true; S_m.visible = false; DES.add(S_m); SMK.push(S_m); }
const sunL = new THREE.PointLight('#fff0d8', 0, 40, 1.0); sunL.position.set(0, 8, 12); DES.add(sunL);
// ---------- blockhouse console (interior) ----------
const CON = new THREE.Group(); CON.position.set(8800, 0, 0); scene.add(CON);
add(tbox(10, 0.3, 8, 1), M.concrete || M.stone, 0, -0.15, 0, CON, { cast: false });
for (const [S_x, S_z, S_w, d] of [[0, -4, 10, 0.3], [-5, 0, 0.3, 8], [5, 0, 0.3, 8]]) add(box(S_w, 4, d), toon({ color: '#b8b4aa' }), S_x, 2, S_z, CON);
const slitC = cvs(512, 128, (g, W, H) => { const S_gr = g.createLinearGradient(0, 0, 0, H); S_gr.addColorStop(0, '#6aa0e8'); S_gr.addColorStop(0.62, '#ffd8a8'); S_gr.addColorStop(0.63, '#efe2c6'); S_gr.addColorStop(1, '#d8c8a8'); g.fillStyle = S_gr; g.fillRect(0, 0, W, H); g.fillStyle = '#9a7a9a'; g.beginPath(); g.moveTo(0, 80); for (let S_x = 0; S_x <= W; S_x += 32) g.lineTo(S_x, 60 + Math.sin(S_x * 0.04) * 14); g.lineTo(W, 80); g.fill(); g.fillStyle = '#8a9098'; g.fillRect(0, 100, W, 4); });
add(new THREE.PlaneGeometry(4.5, 0.9), new THREE.MeshBasicMaterial({ map: P.tex(slitC) }), 0, 2.6, -3.84, CON, { cast: false }).userData.ndSkip = true;
const PANEL = new THREE.Group(); PANEL.position.set(0, 0, -2.6); CON.add(PANEL);
add(box(4.4, 1.0, 1.0), toon({ color: '#5a6a5a' }), 0, 0.5, 0, PANEL); const ptop = add(box(4.4, 0.08, 1.2), toon({ color: '#4a5a4a' }), 0, 1.05, 0.05, PANEL); ptop.rotation.x = 0.35;
const S_dialC = cvs(128, 128, (g) => { g.fillStyle = '#f4efe0'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#222'; g.stroke(); g.lineWidth = 3; for (let i = 0; i < 9; i++) { const S_a = Math.PI * 0.8 + i * Math.PI * 0.175; g.beginPath(); g.moveTo(64 + Math.cos(S_a) * 50, 64 + Math.sin(S_a) * 50); g.lineTo(64 + Math.cos(S_a) * 40, 64 + Math.sin(S_a) * 40); g.stroke(); } });
const DIALS = []; for (let i = 0; i < 5; i++) { add(new THREE.CircleGeometry(0.17, 24), new THREE.MeshBasicMaterial({ map: P.tex(S_dialC) }), -1.6 + i * 0.55, 1.38, -0.42, PANEL, { cast: false }); const S_nd = add(box(0.015, 0.13, 0.01), new THREE.MeshBasicMaterial({ color: '#d02020' }), -1.6 + i * 0.55, 1.38, -0.41, PANEL, { cast: false }); S_nd.geometry.translate(0, 0.055, 0); DIALS.push(S_nd); }
add(box(4.3, 0.55, 0.06), toon({ color: '#4a5a4a' }), 0, 1.38, -0.47, PANEL, { cast: false });
const LAMPS = []; for (let i = 0; i < 8; i++) { const S_l = add(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#40e060' }), -1.4 + i * 0.4, 1.14, 0.12, PANEL, { cast: false }); LAMPS.push(S_l); }
add(new THREE.CylinderGeometry(0.22, 0.24, 0.1, 20), toon({ color: '#2a2a30' }), 1.3, 1.12, 0.32, PANEL); const BTN = add(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), new THREE.MeshBasicMaterial({ color: '#ff2a1a' }), 1.3, 1.2, 0.32, PANEL, { cast: false });
const conL = new THREE.PointLight('#fff2dc', 0, 12, 1.0); conL.position.set(0, 3, 2); CON.add(conL);
// ---------- office with the chalkboard ----------
const OF = new THREE.Group(); OF.position.set(9200, 0, 0); scene.add(OF);
add(tbox(10, 0.3, 8, 1.4), M.plank || M.darkWood, 0, -0.15, 0, OF, { cast: false });
for (const [S_x, S_z, S_w, d] of [[0, -4, 10, 0.3], [-5, 0, 0.3, 8], [5, 0, 0.3, 8]]) add(box(S_w, 4.5, d), toon({ color: '#d8e0e8' }), S_x, 2.25, S_z, OF);
add(box(10, 1.0, 0.32), toon({ color: '#6a7a8a' }), 0, 0.5, -3.98, OF, { cast: false });
const boardC0 = cvs(1024, 576, (g, W, H) => { g.fillStyle = '#2a4a3a'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.arc(300, 120, 48, 0, 7); g.stroke(); g.beginPath(); g.moveTo(300, 168); g.lineTo(300, 340); g.moveTo(300, 210); g.lineTo(220, 290); g.moveTo(300, 210); g.lineTo(380, 290); g.moveTo(300, 340); g.lineTo(240, 470); g.moveTo(300, 340); g.lineTo(360, 470); g.stroke();
  for (const [x0, y0] of [[520, 160], [520, 260], [520, 360]]) { g.beginPath(); g.moveTo(x0 + 140, y0); g.lineTo(x0, y0); g.lineTo(x0 + 26, y0 - 18); g.moveTo(x0, y0); g.lineTo(x0 + 26, y0 + 18); g.stroke(); }
  g.font = '700 150px DejaVu Sans, sans-serif'; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText('?', 760, 330); g.font = '700 70px DejaVu Sans, sans-serif'; g.fillText('G = ?', 700, 470); });
const boardC1 = cvs(1024, 576, (g, W, H) => { g.drawImage(boardC0, 0, 0); g.fillStyle = '#2a4a3a'; g.fillRect(660, 60, 360, 480); g.font = '700 110px DejaVu Sans, sans-serif'; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText('17 G', 690, 220); g.strokeStyle = '#ff5a4a'; g.lineWidth = 12; g.beginPath(); g.moveTo(680, 190); g.lineTo(960, 160); g.stroke(); g.fillStyle = '#ffd23f'; g.fillText('46 G', 690, 400); });
const S_BOARD = add(new THREE.PlaneGeometry(4.2, 2.36), new THREE.MeshBasicMaterial({ map: P.tex(boardC0) }), -0.6, 2.35, -3.82, OF, { cast: false }); const boardT0 = S_BOARD.material.map, boardT1 = P.tex(boardC1);
add(box(4.4, 2.56, 0.08), M.timber, -0.6, 2.35, -3.87, OF, { cast: false });
const owinC = cvs(256, 384, (g, W, H) => { const S_gr = g.createLinearGradient(0, 0, 0, H); S_gr.addColorStop(0, '#5a9ae8'); S_gr.addColorStop(0.7, '#cfe4fa'); S_gr.addColorStop(0.71, '#efe2c6'); S_gr.addColorStop(1, '#e0d0b0'); g.fillStyle = S_gr; g.fillRect(0, 0, W, H); g.fillStyle = '#9a7a9a'; g.beginPath(); g.moveTo(0, 270); g.lineTo(80, 230); g.lineTo(150, 262); g.lineTo(256, 236); g.lineTo(256, 272); g.fill(); g.strokeStyle = '#e8ecf0'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14); g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); });
add(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshBasicMaterial({ map: P.tex(owinC) }), 3.0, 2.4, -3.82, OF, { cast: false });
const DESK = new THREE.Group(); DESK.position.set(0.4, 0, -1.4); OF.add(DESK); add(tbox(2.6, 0.1, 1.2, 1), M.darkWood, 0, 0.92, 0, DESK); add(box(0.5, 0.88, 1.1), M.darkWood, -1.0, 0.44, 0, DESK); add(box(0.5, 0.88, 1.1), M.darkWood, 1.0, 0.44, 0, DESK);
const MS = SLED.clone(); MS.scale.setScalar(0.12); MS.position.set(0.5, 0.99, 0.1); MS.rotation.y = 0.5; MS.traverse((o) => { if (o.isLight) o.intensity = 0; if (FL.includes(o)) o.visible = false; }); MS.children.forEach((S_c) => { if (S_c.material === M.fl1 || S_c.material === M.fl2) S_c.visible = false; }); DESK.add(MS);
for (const [S_x, S_r] of [[-0.6, 0.2], [-0.2, -0.3]]) { const S_pp = add(new THREE.PlaneGeometry(0.42, 0.3), M.paper, S_x, 0.975, 0.1, DESK, { cast: false }); S_pp.rotation.set(-Math.PI / 2, 0, S_r); }
const ofL = new THREE.PointLight('#fff6e8', 0, 14, 1.0); ofL.position.set(0.5, 3.6, 2); OF.add(ofL);
// ---------- medical tent ----------
const S_MD = new THREE.Group(); S_MD.position.set(9600, 0, 0); scene.add(S_MD);
add(tbox(10, 0.3, 8, 1.4), M.plank || M.darkWood, 0, -0.15, 0, S_MD, { cast: false });
const tentM = toon({ color: '#8a9a6a', side: THREE.DoubleSide }); for (const sx of [-1, 1]) { const S_w = add(new THREE.PlaneGeometry(8, 5.2), tentM, sx * 2.3, 2.3, 0, S_MD, { cast: false }); S_w.rotation.y = Math.PI / 2; S_w.rotation.x = sx * 0.5; } add(new THREE.PlaneGeometry(6, 4.6), tentM, 0, 2.3, -3.6, S_MD, { cast: false });
const xrC = cvs(512, 640, (g, W, H) => { g.fillStyle = '#0a1420'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(210,235,255,.9)'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(256, 60); g.lineTo(256, 600); g.stroke();
  for (let i = 0; i < 8; i++) { const S_y = 120 + i * 58; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(256, S_y); g.bezierCurveTo(256 + sd * 120, S_y - 30, 256 + sd * 190, S_y + 10, 256 + sd * 170, S_y + 70); g.stroke(); } }
  g.strokeStyle = '#ff5a4a'; g.lineWidth = 7; g.beginPath(); g.moveTo(400, 330); g.lineTo(418, 352); g.lineTo(404, 368); g.lineTo(426, 392); g.stroke(); });
add(box(1.7, 2.1, 0.12), toon({ color: '#d8dce2' }), -0.8, 2.0, -3.4, S_MD); const S_XR = add(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: P.tex(xrC) }), -0.8, 2.0, -3.33, S_MD, { cast: false }); S_XR.userData.ndSkip = true;
add(box(2.2, 0.5, 0.9), toon({ color: '#5a6a4a' }), 1.4, 0.5, -2.2, S_MD); add(box(2.0, 0.15, 0.8), M.white, 1.4, 0.8, -2.2, S_MD);
const tray = add(box(0.7, 0.05, 0.45), M.steelD, 0.9, 1.2, -0.2, S_MD); add(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), M.steelD, 0.9, 0.6, -0.2, S_MD);
const mdL = new THREE.PointLight('#fff4e0', 0, 14, 1.0); mdL.position.set(0, 3.5, 2); S_MD.add(mdL);
// ---------- modern car interior ----------
const CI = new THREE.Group(); CI.position.set(10000, 0, 0); scene.add(CI);
add(box(6, 0.2, 6), toon({ color: '#2a2a30' }), 0, 0, 0, CI, { cast: false });
const dash = add(box(2.6, 0.5, 0.9), toon({ color: '#2e3036' }), 0, 1.15, -1.3, CI); add(box(2.6, 0.06, 0.95), toon({ color: '#1e2026' }), 0, 1.42, -1.25, CI, { cast: false });
const S_wheel = add(new THREE.TorusGeometry(0.22, 0.035, 10, 30), toon({ color: '#1a1a1e' }), -0.42, 1.42, -0.85, CI); S_wheel.rotation.x = -0.35; add(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), toon({ color: '#1a1a1e' }), -0.42, 1.32, -1.0, CI).rotation.x = 1.1;
add(box(0.75, 0.25, 0.75), toon({ color: '#3a3e48' }), -0.42, 0.62, 0.15, CI); const seatB = add(box(0.72, 1.05, 0.2), toon({ color: '#3a3e48' }), -0.42, 1.2, 0.55, CI); seatB.rotation.x = -0.15; add(box(0.4, 0.25, 0.18), toon({ color: '#3a3e48' }), -0.42, 1.88, 0.65, CI);
add(box(0.75, 0.25, 0.75), toon({ color: '#3a3e48' }), 0.55, 0.62, 0.15, CI); add(box(0.72, 1.05, 0.2), toon({ color: '#3a3e48' }), 0.55, 1.2, 0.55, CI).rotation.x = -0.15;
const cityC = cvs(1024, 512, (g, W, H) => { const S_gr = g.createLinearGradient(0, 0, 0, H); S_gr.addColorStop(0, '#5aa8f0'); S_gr.addColorStop(1, '#d8ecff'); g.fillStyle = S_gr; g.fillRect(0, 0, W, H); const S_r = P.rng(8); for (let i = 0; i < 18; i++) { const S_x = i * 60 + S_r() * 20, S_w = 50 + S_r() * 40, S_h = 120 + S_r() * 220; g.fillStyle = ['#ff9a6a', '#7ac8e8', '#f4d06a', '#a8e0a0', '#e8a0c8'][i % 5]; g.fillRect(S_x, H - S_h, S_w, S_h); g.fillStyle = 'rgba(30,50,80,.5)'; for (let S_y = H - S_h + 14; S_y < H - 10; S_y += 26) for (let xx = S_x + 8; xx < S_x + S_w - 10; xx += 18) g.fillRect(xx, S_y, 9, 13); } });
const wsh = add(new THREE.PlaneGeometry(3.4, 1.4), new THREE.MeshBasicMaterial({ map: P.tex(cityC) }), 0, 2.05, -2.4, CI, { cast: false }); wsh.userData.ndSkip = true;
add(box(0.12, 1.3, 0.12), toon({ color: '#2e3036' }), -1.35, 2.0, -1.6, CI, { cast: false }).rotation.x = -0.4; add(box(3.0, 0.15, 0.3), toon({ color: '#2e3036' }), 0, 2.7, -1.2, CI, { cast: false });
const swin = add(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: P.tex(cityC) }), -1.5, 1.95, 0.1, CI, { cast: false }); swin.rotation.y = Math.PI / 2; swin.userData.ndSkip = true;
add(box(0.06, 0.06, 0.06), M.steelD, -0.85, 1.95, 0.6, CI, { cast: false });   // belt anchor at the B-pillar
const ciL = new THREE.PointLight('#fff8ee', 0, 10, 1.0); ciL.position.set(0.3, 2.4, 1.6); CI.add(ciL);
