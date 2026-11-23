// ================= 1898 CLINIC (world x = 2100): Royal Surgical Hospital, Kiel — exam room + recovery beds; MODERN maternity room (x = 2130) =================
const CL = new THREE.Group(); CL.position.set(2100, 0, 0); scene.add(CL);
const clTileC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#1f5a4a'; g.fillRect(0, 0, W, H); const n = 8, s = W / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = (i * 5 + j * 3) % 7; g.fillStyle = `rgb(${34 + v * 3},${104 + v * 4},${86 + v * 3})`; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(i * s + 6, j * s + 6, s * 0.3, 4); } });
const clFloorC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#8a5a34'; g.fillRect(0, 0, W, H); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#96643a' : '#7e5230'; g.fillRect(0, i * 32, W, 30); } g.strokeStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(((i * 137) % W), i * 32); g.lineTo(((i * 137) % W), i * 32 + 30); g.stroke(); } });
const boardC = cvs(512, 384, (g, W, H) => { g.fillStyle = '#26332c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#7a5230'; g.lineWidth = 18; g.strokeRect(0, 0, W, H); g.strokeStyle = 'rgba(240,240,230,.9)'; g.lineWidth = 5; g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { g.strokeRect(236, 40 + i * 32, 40, 24); } g.beginPath(); g.moveTo(256, 330); g.lineTo(220, 360); g.moveTo(256, 330); g.lineTo(292, 360); g.stroke();
  g.beginPath(); g.moveTo(330, 230); g.lineTo(290, 236); g.stroke(); g.beginPath(); g.moveTo(290, 236); g.lineTo(304, 226); g.moveTo(290, 236); g.lineTo(304, 246); g.stroke();
  g.fillStyle = 'rgba(240,240,230,.95)'; g.font = '700 30px DejaVu Sans, sans-serif'; g.fillText('KOKAIN', 340, 240); g.font = '600 26px DejaVu Sans, sans-serif'; g.fillText('Rückenmark', 40, 80); g.setLineDash([10, 10]); g.beginPath(); g.moveTo(40, 250); g.lineTo(200, 250); g.stroke(); g.fillText('taub ↓', 60, 290); });
M.clTile = texM(clTileC, 1, 1, '#ffffff'); M.clFloor = texM(clFloorC, 1, 1, '#ffffff'); M.clCream = texM(P.plaster(91, 30), 1, 1, '#fbecc8'); M.leatherR = toon({ color: '#8a2a2a' }); M.bone = toon({ color: '#f2ead8' }); M.ironB = toon({ color: '#2a2a30' }); M.blanket = toon({ color: '#c8d8f0' }); M.blanket2 = toon({ color: '#f0d0a0' });
add(tbox(9, 0.3, 9, 1.6), M.clFloor, 0, -0.15, 0, CL, { cast: false });
for (const [x, z, w, d] of [[0, -4.5, 9, 0.3], [-4.5, 0, 0.3, 9], [4.5, 0, 0.3, 9]]) { add(tbox(w, 1.7, d, 1.2), M.clTile, x, 0.85, z, CL); add(tbox(w, 3.0, d, 2.2), M.clCream, x, 3.2, z, CL); add(box(w + 0.04, 0.12, d + 0.06), M.timber, x, 1.72, z, CL, { cast: false }); }
add(tbox(9, 0.3, 9, 2), M.clCream, 0, 4.7, 0, CL, { cast: false });
// tall arched window on the back wall
const clWinC = skyPane(1.6, 2.6); add(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshBasicMaterial({ map: P.tex(clWinC) }), 1.9, 2.75, -4.34, CL, { cast: false });
for (const s of [-1, 1]) add(box(0.12, 2.5, 0.12), M.timber, 1.9 + s * 0.8, 2.75, -4.3, CL, { cast: false }); add(box(1.7, 0.12, 0.12), M.timber, 1.9, 2.75, -4.3, CL, { cast: false }); add(box(1.7, 0.12, 0.12), M.timber, 1.9, 4.0, -4.3, CL, { cast: false }); add(box(0.08, 2.4, 0.1), M.timber, 1.9, 2.75, -4.3, CL, { cast: false });
shaft(CL, [1.9, 3.8, -4.2], [0.7, 0.0, 0.4], 0.6, 1.3, '#fff2d0', 0.16);
// chalkboard with spine sketch
const board = add(new THREE.PlaneGeometry(1.8, 1.35), new THREE.MeshBasicMaterial({ map: P.tex(boardC) }), -1.6, 2.5, -4.33, CL, { cast: false });
// exam couch (leather) at the centre
const couch = new THREE.Group(); couch.position.set(0, 0, -0.5); CL.add(couch);
for (const [x, z] of [[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.3], [0.9, 0.3]]) add(new THREE.CylinderGeometry(0.05, 0.04, 0.6, 8), M.timber, x, 0.3, z, couch, { cast: false });
add(box(2.0, 0.12, 0.75), M.timber, 0, 0.62, 0, couch); add(box(1.95, 0.16, 0.7), M.leatherR, 0, 0.76, 0, couch); add(box(0.5, 0.35, 0.7), M.leatherR, -0.8, 0.98, 0, couch).rotation.z = 0.35;
// skeleton model on a stand
const skel = new THREE.Group(); skel.position.set(-3.2, 0, -3.4); CL.add(skel);
add(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), M.ironB, 0, 0.95, 0, skel, { cast: false }); add(box(0.5, 0.04, 0.5), M.ironB, 0, 0.02, 0, skel, { cast: false });
add(new THREE.SphereGeometry(0.13, 16, 12), M.bone, 0, 1.75, 0.05, skel); for (let i = 0; i < 6; i++) { const r = add(new THREE.TorusGeometry(0.16 - Math.abs(i - 2) * 0.012, 0.012, 6, 20, Math.PI * 1.4), M.bone, 0, 1.5 - i * 0.07, 0.04, skel, { cast: false }); r.rotation.x = Math.PI / 2; r.rotation.z = -Math.PI * 0.2; }
add(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), M.bone, 0, 1.2, 0, skel, { cast: false }); add(box(0.34, 0.12, 0.12), M.bone, 0, 0.92, 0.03, skel);
for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 6), M.bone, s * 0.1, 0.45, 0.03, skel, { cast: false }); const a = add(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), M.bone, s * 0.24, 1.25, 0.03, skel, { cast: false }); a.rotation.z = s * 0.15; }
// cabinet with bottles + brass gas lamps
const ccab = new THREE.Group(); ccab.position.set(3.4, 0, -3.9); CL.add(ccab); add(box(1.3, 2.2, 0.45), M.darkWood, 0, 1.1, 0, ccab);
for (let k = 0; k < 3; k++) { add(box(1.2, 0.03, 0.4), M.timber, 0, 0.6 + k * 0.5, 0.05, ccab, { cast: false }); for (let i = 0; i < 5; i++) vial(ccab, -0.45 + i * 0.22, 0.62 + k * 0.5, 0.1, ['#7ac8ff', '#ffb04a', '#9be07a', '#ff7a8a', '#c8a0ff'][(i + k) % 5], 0.2, 0.05, 0.75); }
const gasL = []; for (const x of [-3.0, 0.2, 3.0]) { const gl = new THREE.Group(); gl.position.set(x, 3.0, -4.28); CL.add(gl); add(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), M.brass, 0, 0, 0.15, gl, { cast: false }).rotation.x = Math.PI / 2; add(new THREE.SphereGeometry(0.11, 12, 10), M.lampGlow, 0, 0.05, 0.3, gl, { cast: false }); gasL.push(gl); }
// instrument tray with a big hammer + syringe + wine bottle on a side table
const side = new THREE.Group(); side.position.set(1.5, 0, 0.2); CL.add(side);
for (const [x, z] of [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), M.brass, x, 0.42, z, side, { cast: false });
add(box(0.75, 0.04, 0.5), M.timber, 0, 0.85, 0, side); add(box(0.5, 0.02, 0.3), M.steel, -0.05, 0.88, 0, side, { cast: false });
const wine = add(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 12), toon({ color: '#3a1020' }), 0.25, 1.01, 0.1, side); add(new THREE.CylinderGeometry(0.018, 0.03, 0.1, 10), toon({ color: '#3a1020' }), 0.25, 1.2, 0.1, side, { cast: false });
// recovery corner: two iron beds against the right wall
const BEDS = []; for (const z of [1.2, 2.9]) { const b = new THREE.Group(); b.position.set(3.2, 0, z); CL.add(b); add(box(2.0, 0.08, 1.0), M.ironB, 0, 0.5, 0, b); add(box(1.95, 0.18, 0.95), M.sheet, 0, 0.62, 0, b);
  add(box(0.06, 1.0, 1.0), M.ironB, 1.0, 0.5, 0, b); add(box(0.06, 0.7, 1.0), M.ironB, -1.0, 0.35, 0, b); for (const s of [-1, 1]) for (const xx of [-1, 1]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), M.ironB, xx * 0.97, 0.25, s * 0.47, b, { cast: false });
  const bl = add(box(1.25, 0.12, 0.98), z < 2 ? M.blanket : M.blanket2, -0.3, 0.76, 0, b); const pw = add(new THREE.SphereGeometry(0.22, 12, 8), M.sheet, 0.72, 0.78, 0, b); pw.scale.set(0.9, 0.45, 1.6); BEDS.push(b); }
const clFill = new THREE.PointLight('#fff0dc', 0, 16, 1.0); clFill.position.set(0.5, 3.9, 2.8); CL.add(clFill);
const clBack = new THREE.PointLight('#ffe2b8', 0, 10, 1.3); clBack.position.set(0, 3.2, -3.5); CL.add(clBack);
// ---------------- MODERN maternity / operating room (x = 2130) ----------------
const MD = new THREE.Group(); MD.position.set(2130, 0, 0); scene.add(MD);
add(tbox(8, 0.3, 8, 1.6), toon({ color: '#d8e4ea' }), 0, -0.15, 0, MD, { cast: false });
for (const [x, z, w, d] of [[0, -4, 8, 0.3], [-4, 0, 0.3, 8], [4, 0, 0.3, 8]]) add(tbox(w, 4.2, d, 2), texM(P.plaster(95, 10), 1, 1, '#cfeef0'), x, 2.1, z, MD);
add(tbox(8, 0.3, 8, 2), toon({ color: '#f4f8fa' }), 0, 4.2, 0, MD, { cast: false });
const mbed = new THREE.Group(); mbed.position.set(0, 0, -0.6); MD.add(mbed); add(box(2.1, 0.5, 0.95), toon({ color: '#9aa8b4' }), 0, 0.45, 0, mbed); add(box(2.0, 0.16, 0.9), M.sheet, 0, 0.78, 0, mbed); const mback = add(box(0.7, 0.12, 0.9), M.sheet, -0.75, 1.05, 0, mbed); mback.rotation.z = 0.6;
add(box(1.3, 0.14, 0.92), toon({ color: '#8ad0e0' }), 0.35, 0.92, 0, mbed);
const mon = new THREE.Group(); mon.position.set(-1.7, 0, -1.6); MD.add(mon); add(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), M.steel, 0, 0.8, 0, mon, { cast: false });
const monC = cvs(320, 220, (g, W, H) => { g.fillStyle = '#0a1418'; g.fillRect(0, 0, W, H); g.strokeStyle = '#4aff8a'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x < W; x += 4) { const ph = x % 80; const y = ph > 30 && ph < 40 ? 60 - (ph - 30) * 6 : ph >= 40 && ph < 46 ? 0 + (ph - 40) * 16 : 70; x ? g.lineTo(x, y + 20) : g.moveTo(x, y + 20); } g.stroke(); g.fillStyle = '#4aff8a'; g.font = '700 40px DejaVu Sans, sans-serif'; g.fillText('♥ 72', 30, 180); g.fillStyle = '#5ac8ff'; g.fillText('98%', 190, 180); });
add(box(0.75, 0.52, 0.08), toon({ color: '#3a4450' }), 0, 1.75, 0, mon); add(new THREE.PlaneGeometry(0.66, 0.44), new THREE.MeshBasicMaterial({ map: P.tex(monC) }), 0, 1.75, 0.045, mon, { cast: false });
const mdLamp = add(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 24), M.steel, 0, 3.4, -0.6, MD); const mdFace = add(new THREE.CircleGeometry(0.45, 24), M.lampGlow, 0, 3.33, -0.6, MD, { cast: false }); mdFace.rotation.x = Math.PI / 2;
const mdFill = new THREE.PointLight('#f4fbff', 0, 14, 1.0); mdFill.position.set(0.5, 3.6, 2.6); MD.add(mdFill);
