// ================= Ep17 additions (bats) =================
// --- obstacle threads strung across Spallanzani's lab ---
const THREADS = new THREE.Group(); LB.add(THREADS); THREADS.visible = false;
{ const r = P.rng(31); const tm = toon({ color: '#f4f0e4' });
  for (let i = 0; i < 46; i++) { const x = -3.8 + r() * 7.6, z = -0.2 + r() * 3.4; const th = add(new THREE.CylinderGeometry(0.008, 0.008, 4.8, 4), tm, x, 2.55, z, THREADS, { cast: false });
    if (r() < 0.35) { const bell = add(new THREE.SphereGeometry(0.035, 8, 6), M.brass, x, 0.6 + r() * 2.2, z, THREADS, { cast: false }); } } }
// --- Alps window texture for Jurine's Swiss study (swapped onto the lab window) ---
const alpsC = cvs(Math.round(256 * 1.8), Math.round(256 * 2.6), (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#4a9aff'); gr.addColorStop(1, '#d8f0ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#8a9ab8'; g.beginPath(); g.moveTo(0, H * 0.7); g.lineTo(W * 0.25, H * 0.32); g.lineTo(W * 0.45, H * 0.55); g.lineTo(W * 0.7, H * 0.25); g.lineTo(W, H * 0.6); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = '#ffffff'; for (const [x, y] of [[0.25, 0.32], [0.7, 0.25]]) { g.beginPath(); g.moveTo(W * (x - 0.1), H * (y + 0.1)); g.lineTo(W * x, H * y); g.lineTo(W * (x + 0.1), H * (y + 0.1)); g.lineTo(W * (x + 0.04), H * (y + 0.08)); g.lineTo(W * x, H * (y + 0.12)); g.lineTo(W * (x - 0.05), H * (y + 0.08)); g.fill(); }
  g.fillStyle = '#5aa848'; g.fillRect(0, H * 0.82, W, H * 0.18); g.fillStyle = '#3a7a3a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(W * (0.08 + i * 0.17), H * 0.84); g.lineTo(W * (0.13 + i * 0.17), H * 0.68); g.lineTo(W * (0.18 + i * 0.17), H * 0.84); g.fill(); } });
const winMatPavia = win.material, winMatAlps = new THREE.MeshBasicMaterial({ map: P.tex(alpsC) });
// --- swappable hall chalkboard ---
const hallBoard = cvs(Math.round(320 * 3.6), Math.round(320 * 1.6), () => {}); const hallBoardT = P.tex(hallBoard);
const drawHallBoard = () => { const g = hallBoard.getContext('2d'), W = hallBoard.width, H = hallBoard.height; g.fillStyle = '#2a3a32'; g.fillRect(0, 0, W, H); g.strokeStyle = '#7a4a2a'; g.lineWidth = 22; g.strokeRect(0, 0, W, H);
  g.fillStyle = 'rgba(245,245,235,0.92)'; g.font = `700 ${Math.round(H * 0.17)}px DejaVu Serif, serif`; g.textAlign = 'center'; g.fillText('BATS SEE WITH EARS?', W * 0.5, H * 0.38); g.fillText('NONSENSE. TOUCH!', W * 0.5, H * 0.72); hallBoardT.needsUpdate = true; };
drawHallBoard();
const hallBoardM = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.6), new THREE.MeshToonMaterial({ gradientMap: grad, map: hallBoardT })); hallBoardM.position.set(0, 3.6, -4.95); HL.add(hallBoardM);
// ================= HARVARD LAB 1938 (x = 1200) =================
const HV = new THREE.Group(); HV.position.set(1200, 0, 0); scene.add(HV);
const lino = cvs(512, 512, (g, W, H) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#2a2a32' : '#e8e2d0'; g.fillRect(i * 64, j * 64, 64, 64); } });
const linoT = P.tex(lino); linoT.wrapS = linoT.wrapT = THREE.RepeatWrapping; linoT.repeat.set(4, 4);
add(tbox(12, 0.3, 10, 1), new THREE.MeshToonMaterial({ gradientMap: grad, map: linoT }), 0, -0.15, 0, HV, { cast: false });
add(tbox(12, 4.6, 0.3, 2), toon({ color: '#b8dcc0' }), 0, 2.3, -3.6, HV); for (const s of [-1, 1]) add(tbox(0.3, 4.6, 10, 2), toon({ color: '#b8dcc0' }), s * 6, 2.3, 0, HV);
add(box(12, 1.2, 0.06), toon({ color: '#6a8a70' }), 0, 0.6, -3.43, HV, { cast: false });
// window with brick buildings + sunbeam
const bricksC = cvs(460, 400, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7ab8ff'); gr.addColorStop(1, '#e0f0ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#a84a32'; g.fillRect(0, H * 0.35, W * 0.45, H); g.fillRect(W * 0.55, H * 0.25, W * 0.45, H);
  g.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { g.fillRect(20 + i * 60, H * 0.42 + j * 60, 30, 40); g.fillRect(W * 0.6 + i * 60, H * 0.32 + j * 60, 30, 40); } g.fillStyle = '#3a7a3a'; g.beginPath(); g.ellipse(W * 0.5, H * 0.85, 60, 70, 0, 0, 7); g.fill(); });
add(box(1.8, 1.6, 0.05), new THREE.MeshBasicMaterial({ map: P.tex(bricksC) }), 3.6, 2.5, -3.43, HV, { cast: false }); add(box(0.08, 1.7, 0.1), toon({ color: '#ffffff' }), 3.6, 2.5, -3.4, HV, { cast: false }); add(box(1.9, 0.08, 0.1), toon({ color: '#ffffff' }), 3.6, 2.5, -3.4, HV, { cast: false });
shaft(HV, [3.6, 2.8, -3.4], [1.8, 0.0, 0.8], 0.8, 1.4, '#fff4d8', 0.28);
// lab bench + the ultrasonic detector
add(tbox(5.2, 0.1, 1.1, 0.5), toon({ color: '#3a3a42' }), -0.6, 0.95, -2.3, HV); add(tbox(5.2, 0.9, 1.0, 0.4), toon({ color: '#8a6a4a' }), -0.6, 0.45, -2.3, HV);
const DET = new THREE.Group(); DET.position.set(-1.2, 1.0, -2.45); HV.add(DET);
add(tbox(1.6, 1.1, 0.6, 0.06), toon({ color: '#6a7a6a' }), 0, 0.55, 0, DET);
const dialC = cvs(256, 256, (g, W, H) => { g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 8, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = '#2a2a2a'; g.stroke(); g.lineWidth = 5; for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.8 + i * 0.14); g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * 90, H / 2 + Math.sin(a) * 90); g.lineTo(W / 2 + Math.cos(a) * 110, H / 2 + Math.sin(a) * 110); g.stroke(); } });
const NEEDLES = [];
for (const x of [-0.45, 0.0, 0.45]) { add(new THREE.CircleGeometry(0.17, 24), new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(dialC) }), x, 0.8, 0.305, DET, { cast: false }); const nd = add(box(0.012, 0.14, 0.01), toon({ color: '#d02a2a' }), x, 0.8, 0.31, DET, { cast: false }); nd.geometry.translate(0, 0.06, 0); NEEDLES.push(nd); }
for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), toon({ color: '#2a2a2a' }), -0.6 + i * 0.24, 0.35, 0.31, DET, { cast: false }).rotation.x = Math.PI / 2;
const lamps = []; for (let i = 0; i < 4; i++) { const l = add(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff4a2a' }), -0.6 + i * 0.4, 1.0, 0.31, DET, { cast: false }); l.userData.ndSkip = true; lamps.push(l); }
// oscilloscope: round green screen, wave redrawn per frame state
const SCOPE = cvs(256, 256, () => {}); const scopeT = P.tex(SCOPE); let scopeKey = '';
const drawScope = (amp, f) => { const key = Math.round(amp * 10) + ':' + (amp > 0.05 ? f % 6 : 0); if (key === scopeKey) return; scopeKey = key; const g = SCOPE.getContext('2d'); g.fillStyle = '#06200e'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(80,255,140,0.25)'; g.lineWidth = 2; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(256, i * 32); g.stroke(); }
  g.strokeStyle = '#7aff9a'; g.lineWidth = 6; g.shadowColor = '#7aff9a'; g.shadowBlur = 14; g.beginPath(); for (let x = 0; x <= 256; x += 3) { const y = 128 + Math.sin(x * 0.35 + f) * amp * 80 * (0.6 + 0.4 * Math.sin(x * 0.05 + f * 0.3)); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); scopeT.needsUpdate = true; };
drawScope(0, 0);
const scopeBox = new THREE.Group(); scopeBox.position.set(0.9, 1.0, -2.4); HV.add(scopeBox); add(tbox(0.9, 0.8, 0.7, 0.08), toon({ color: '#4a4a52' }), 0, 0.4, 0, scopeBox);
const scr = add(new THREE.CircleGeometry(0.28, 32), new THREE.MeshBasicMaterial({ map: scopeT }), 0, 0.45, 0.355, scopeBox, { cast: false }); scr.userData.ndSkip = true;
add(new THREE.TorusGeometry(0.29, 0.03, 8, 32), toon({ color: '#2a2a2a' }), 0, 0.45, 0.36, scopeBox, { cast: false });
// big speaker horn
const horn = add(new THREE.ConeGeometry(0.35, 0.7, 24, 1, true), toon({ color: '#c8a050', side: THREE.DoubleSide }), 2.0, 1.45, -2.3, HV, { cast: false }); horn.rotation.z = Math.PI / 2;
// microphone stand + bat cage
add(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), M.ironK, -0.1, 1.3, -2.0, HV); add(new THREE.SphereGeometry(0.07, 12, 8), toon({ color: '#9a9aa8' }), -0.1, 1.62, -2.0, HV);
const cage = new THREE.Group(); cage.position.set(-2.8, 1.0, -2.2); HV.add(cage); add(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), M.ironK, 0, 0.02, 0, cage); add(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), M.ironK, 0, 0.62, 0, cage);
for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; add(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 4), M.ironK, Math.cos(a) * 0.31, 0.32, Math.sin(a) * 0.31, cage, { cast: false }); }
// cables, filing cabinet, radiator, desk lamp, chalkboard with ECHOLOCATION (revealed)
for (let i = 0; i < 3; i++) { const c = add(new THREE.TorusGeometry(0.4 + i * 0.1, 0.012, 6, 20, Math.PI), M.blackS || toon({ color: '#111' }), -0.2 + i * 0.3, 1.0, -2.0, HV, { cast: false }); c.rotation.x = -Math.PI / 2; }
add(tbox(0.8, 1.4, 0.6, 0.06), toon({ color: '#7a8a7a' }), -5.2, 0.7, -3.0, HV); for (let i = 0; i < 3; i++) add(box(0.6, 0.04, 0.02), toon({ color: '#c8c8c8' }), -5.2, 0.35 + i * 0.42, -2.69, HV, { cast: false });
for (let i = 0; i < 10; i++) add(box(0.06, 0.8, 0.12), toon({ color: '#d8d8d0' }), 4.2 + i * 0.1, 0.5, -3.3, HV, { cast: false });
const BOARD = cvs(1152, 512, () => {}); const boardT = P.tex(BOARD); let boardMode = -1;
const drawBoard = (m) => { if (m === boardMode) return; boardMode = m; const g = BOARD.getContext('2d'), W = 1152, H = 512; g.fillStyle = '#2a3a32'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a6a4a'; g.lineWidth = 24; g.strokeRect(0, 0, W, H);
  g.fillStyle = 'rgba(245,245,235,0.9)'; g.font = '600 52px DejaVu Sans, sans-serif'; g.textAlign = 'left'; g.fillText('20,000 Hz = limit of human hearing', 50, 100); g.strokeStyle = 'rgba(245,245,235,0.85)'; g.lineWidth = 5; g.beginPath(); for (let x = 60; x < 600; x += 4) g.lineTo(x, 200 + Math.sin(x * 0.08) * 40); g.stroke();
  if (m >= 1) { g.fillStyle = '#ffd23f'; g.font = '900 120px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillText('ECHOLOCATION', W / 2, 400); }
  boardT.needsUpdate = true; };
drawBoard(0);
add(box(3.6, 1.6, 0.05), new THREE.MeshToonMaterial({ gradientMap: grad, map: boardT }), -2.4, 2.9, -3.43, HV, { cast: false });
const hvFill = new THREE.PointLight('#fff8ee', 0, 16, 1.2); hvFill.position.set(0, 3.8, 1.5); HV.add(hvFill);
const scopeGlow = new THREE.PointLight('#7aff9a', 0, 4, 1.5); scopeGlow.position.set(0.9, 1.5, -1.7); HV.add(scopeGlow);
// ================= MODERN PARK (x = 1500) =================
const PK = new THREE.Group(); PK.position.set(1500, 0, 0); scene.add(PK);
add(tbox(40, 0.06, 40, 4), toon({ color: '#7ac050' }), 0, 0, 0, PK, { cast: false });
add(tbox(3.2, 0.08, 40, 2), toon({ color: '#d8d0c0' }), 0, 0.04, 0, PK, { cast: false });
for (let i = 0; i < 14; i++) add(box(3.2, 0.005, 0.04), toon({ color: '#bab2a2' }), 0, 0.085, -18 + i * 2.8, PK, { cast: false });
const ptree = (x, z, s = 1) => { add(new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 2.2 * s, 8), M.trunk, x, 1.1 * s, z, PK); const c = add(new THREE.SphereGeometry(1.3 * s, 14, 10), M.bush, x, 2.8 * s, z, PK); c.scale.y = 1.1; };
for (let i = 0; i < 6; i++) { ptree(-3.6, -14 + i * 5.5, 1.1); ptree(3.8, -12 + i * 5.5, 1.0); }
const pbench = new THREE.Group(); pbench.position.set(2.4, 0, -1.5); PK.add(pbench); add(box(1.8, 0.08, 0.5), M.wood, 0, 0.48, 0, pbench); add(box(1.8, 0.45, 0.06), M.wood, 0, 0.8, -0.22, pbench); for (const s of [-1, 1]) add(box(0.08, 0.48, 0.5), M.ironK, s * 0.8, 0.24, 0, pbench);
add(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8), M.ironK, -2.2, 1.7, -3.5, PK); add(new THREE.SphereGeometry(0.22, 10, 8), toon({ color: '#ffffff' }), -2.2, 3.5, -3.5, PK);
const bike = new THREE.Group(); bike.position.set(-2.4, 0, 1.6); PK.add(bike); for (const x of [-0.5, 0.5]) add(new THREE.TorusGeometry(0.32, 0.03, 6, 20), M.ironK, x, 0.34, 0, bike, { cast: false }); add(box(1.0, 0.05, 0.05), toon({ color: '#d02a2a' }), 0, 0.55, 0, bike, { cast: false });
for (let i = 0; i < 8; i++) { const fl = add(new THREE.SphereGeometry(0.12, 8, 6), toon({ color: ['#ff4a6a', '#ffd23a', '#c84aff', '#ffffff'][i % 4] }), 2.2 + (i % 4) * 0.35, 0.15, 1.2 + Math.floor(i / 4) * 0.4, PK, { cast: false }); }
// buildings far behind the park
for (let i = 0; i < 6; i++) add(tbox(5, 8 + (i % 3) * 3, 4, 1), toon({ color: ['#ffd2b0', '#bfe0ff', '#ffc8d8', '#d8f0c8'][i % 4] }), -14 + i * 5.6, 4 + (i % 3) * 1.5, -24, PK);
