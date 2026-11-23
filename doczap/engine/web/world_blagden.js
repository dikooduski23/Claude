// ================= BLAGDEN (1775): hot room (x=11000), London study (x=11400), modern sauna (x=11800) =================
const BR_ = P.rng(1775);
const hdr = (hex, k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });
// ---------- hot room ----------
const HR = new THREE.Group(); HR.position.set(11000, 0, 0); scene.add(HR);
M.hrWall = texM(P.plaster(1775, 24), 1, 1, '#e8d4b4'); M.hrPanel = toon({ color: '#6a4228' }); M.hrFloor = M.plank || M.darkWood; M.iron = toon({ color: '#2e2a2a' });
add(tbox(6, 0.3, 6, 1.4), M.hrFloor, 0, -0.15, 0, HR, { cast: false });
for (const [x, z, B_w, d] of [[0, -2.4, 6, 0.3], [-2.4, 0, 0.3, 6], [2.4, 0, 0.3, 6]]) { add(tbox(B_w, 3.4, d, 1.2), M.hrWall, x, 1.7, z, HR); add(box(B_w + 0.02, 0.9, d + 0.02), M.hrPanel, x, 0.45, z, HR, { cast: false }); add(box(B_w + 0.03, 0.08, d + 0.04), toon({ color: '#4a2a18' }), x, 0.92, z, HR, { cast: false }); }
add(tbox(6, 0.3, 6, 1.2), M.hrWall, 0, 3.55, 0, HR, { cast: false }); for (const z of [-1.5, 0, 1.5]) add(box(6, 0.22, 0.25), toon({ color: '#5a3a22' }), 0, 3.3, z, HR, { cast: false });
// window (right wall) and door (left wall)
const hwinC = cvs(256, 320, (g, W, H) => { const B_gr = g.createLinearGradient(0, 0, 0, H); B_gr.addColorStop(0, '#8ac4f0'); B_gr.addColorStop(1, '#e8f4ff'); g.fillStyle = B_gr; g.fillRect(0, 0, W, H); g.strokeStyle = '#4a2a18'; g.lineWidth = 16; g.strokeRect(8, 8, W - 16, H - 16); g.lineWidth = 9; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); });
const hwin = add(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ map: P.tex(hwinC), color: new THREE.Color(1.15, 1.15, 1.15) }), 2.24, 1.9, -0.6, HR, { cast: false }); hwin.rotation.y = -Math.PI / 2;
add(box(0.08, 2.1, 1.0), toon({ color: '#7a4a2a' }), -2.23, 1.05, 1.2, HR); add(new THREE.SphereGeometry(0.04, 8, 6), M.brass, -2.17, 1.05, 0.85, HR);
// the iron stove (glows red-hot)
const STV = new THREE.Group(); STV.position.set(-1.35, 0, -1.65); HR.add(STV);
M.stoveHot = toon({ color: '#3a2a26', emissive: '#ff3a10', emissiveIntensity: 0 });
add(box(1.0, 1.0, 0.75), M.stoveHot, 0, 0.6, 0, STV); add(box(1.1, 0.08, 0.85), M.iron, 0, 1.12, 0, STV); for (const [x, z] of [[-0.42, -0.3], [0.42, -0.3], [-0.42, 0.3], [0.42, 0.3]]) add(box(0.08, 0.12, 0.08), M.iron, x, 0.06, z, STV);
const pipe = add(new THREE.CylinderGeometry(0.11, 0.11, 2.3, 14), M.stoveHot, 0.2, 2.3, -0.1, STV);
M.grate = hdr('#ff7a20', 2.6); const grate = add(new THREE.PlaneGeometry(0.55, 0.38), M.grate, 0, 0.55, 0.381, STV, { cast: false }); grate.userData.ndSkip = true;
for (let i = 0; i < 6; i++) add(box(0.02, 0.38, 0.01), M.iron, -0.24 + i * 0.1, 0.55, 0.385, STV, { cast: false });
const sdoor = add(box(0.62, 0.45, 0.04), M.iron, 0, 0.55, 0.4, STV, { cast: false }); sdoor.geometry.translate(0.31, 0, 0); sdoor.position.x = -0.31;
const stoveL = new THREE.PointLight('#ff8a3a', 0, 9, 1.4); stoveL.position.set(-1.0, 0.9, -1.0); HR.add(stoveL);
const kettle = new THREE.Group(); kettle.position.set(-0.2, 1.16, 0); STV.add(kettle); add(new THREE.SphereGeometry(0.13, 16, 12), M.copper || toon({ color: '#c8783a' }), 0, 0.1, 0, kettle).scale.set(1, 0.8, 1); const spout = add(new THREE.CylinderGeometry(0.015, 0.03, 0.18, 8), toon({ color: '#c8783a' }), 0.14, 0.14, 0, kettle); spout.rotation.z = -0.9; add(new THREE.TorusGeometry(0.09, 0.012, 6, 16, Math.PI), M.iron, 0, 0.2, 0, kettle);
// coal scuttle
add(new THREE.CylinderGeometry(0.2, 0.16, 0.32, 14), M.iron, -0.4, 0.16, -0.9, HR); add(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon({ color: '#1a1a1e' }), -0.4, 0.3, -0.9, HR);
// chair + Blagden's spot; tin rack stand with eggs and steak
const chair = new THREE.Group(); chair.position.set(0.45, 0, -0.45); HR.add(chair); add(box(0.5, 0.06, 0.5), M.timber, 0, 0.48, 0, chair); for (const [x, z] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) add(box(0.05, 0.48, 0.05), M.timber, x, 0.24, z, chair); add(box(0.5, 0.6, 0.05), M.timber, 0, 0.8, -0.23, chair);
const RACK = new THREE.Group(); RACK.position.set(-0.32, 0, -0.35); HR.add(RACK);
add(new THREE.CylinderGeometry(0.03, 0.04, 0.95, 8), M.timber, 0, 0.475, 0, RACK); add(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 16), M.timber, 0, 0.02, 0, RACK);
add(box(0.46, 0.02, 0.34), toon({ color: '#b8bcc4' }), 0, 0.96, 0, RACK); for (let i = 0; i < 7; i++) add(box(0.46, 0.01, 0.008), toon({ color: '#d8dce2' }), 0, 0.975, -0.15 + i * 0.05, RACK, { cast: false });
const stS = new THREE.Shape(); stS.moveTo(-0.11, 0); stS.bezierCurveTo(-0.12, 0.08, -0.02, 0.09, 0.03, 0.075); stS.bezierCurveTo(0.1, 0.07, 0.13, 0.02, 0.1, -0.03); stS.bezierCurveTo(0.07, -0.08, -0.08, -0.08, -0.11, 0);
M.steak = toon({ color: '#d8505a' }); const STEAK = add(new THREE.ExtrudeGeometry(stS, { depth: 0.025, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.008, bevelSegments: 2 }), M.steak, 0.08, 0.985, 0, RACK); STEAK.rotation.x = -Math.PI / 2; STEAK.scale.setScalar(1.25);
M.egg = toon({ color: '#f6f0e2' }); const EGGS = []; for (let i = 0; i < 3; i++) { const B_e = add(new THREE.SphereGeometry(0.032, 14, 10), M.egg, -0.15 + (i % 2) * 0.06, 1.005, -0.08 + i * 0.07, RACK); B_e.scale.set(1, 1.28, 1); B_e.rotation.z = Math.PI / 2; EGGS.push(B_e); }
// thermometer on the back wall
const TH_ = new THREE.Group(); TH_.position.set(1.05, 1.75, -2.23); HR.add(TH_); add(box(0.22, 1.1, 0.03), toon({ color: '#d8c8a0' }), 0, 0, 0, TH_);
add(new THREE.CylinderGeometry(0.018, 0.018, 0.95, 10), new THREE.MeshStandardMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.6, roughness: 0.1 }), 0, 0.02, 0.03, TH_, { cast: false }).material.userData.keepStd = true;
add(new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: '#d02020' }), 0, -0.47, 0.03, TH_, { cast: false });
const merc = add(new THREE.CylinderGeometry(0.01, 0.01, 1, 8), new THREE.MeshBasicMaterial({ color: '#d02020' }), 0, -0.45, 0.031, TH_, { cast: false }); merc.geometry.translate(0, 0.5, 0);
for (let i = 0; i < 9; i++) add(box(0.06, 0.006, 0.005), toon({ color: '#2a2a2a' }), -0.06, -0.35 + i * 0.1, 0.02, TH_, { cast: false });
// wall clock (right wall)
const clockC = cvs(256, 256, (g) => { g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill(); g.lineWidth = 14; g.strokeStyle = '#5a3a22'; g.stroke(); g.fillStyle = '#2a2a2a'; for (let i = 0; i < 12; i++) { const B_a = i / 12 * Math.PI * 2; g.beginPath(); g.arc(128 + Math.sin(B_a) * 92, 128 - Math.cos(B_a) * 92, i % 3 ? 4 : 8, 0, 7); g.fill(); } });
const CLK = new THREE.Group(); CLK.position.set(2.23, 2.55, 0.9); CLK.rotation.y = -Math.PI / 2; HR.add(CLK); add(new THREE.CircleGeometry(0.28, 32), new THREE.MeshBasicMaterial({ map: P.tex(clockC) }), 0, 0, 0, CLK, { cast: false });
const hMin = add(box(0.016, 0.22, 0.01), new THREE.MeshBasicMaterial({ color: '#1a1a1a' }), 0, 0, 0.01, CLK, { cast: false }); hMin.geometry.translate(0, 0.1, 0); const hHr = add(box(0.022, 0.14, 0.01), new THREE.MeshBasicMaterial({ color: '#1a1a1a' }), 0, 0, 0.012, CLK, { cast: false }); hHr.geometry.translate(0, 0.06, 0);
const hrFill = new THREE.PointLight('#fff0dc', 0, 10, 1.0); hrFill.position.set(1.2, 2.8, 1.8); HR.add(hrFill);
// ---------- London study (night, candles + fireplace) ----------
const STU = new THREE.Group(); STU.position.set(11400, 0, 0); scene.add(STU);
add(tbox(8, 0.3, 7, 1.4), M.hrFloor, 0, -0.15, 0, STU, { cast: false });
for (const [x, z, B_w, d] of [[0, -3, 8, 0.3], [-4, 0, 0.3, 7], [4, 0, 0.3, 7]]) add(box(B_w, 3.8, d), toon({ color: '#5a3a26' }), x, 1.9, z, STU);
for (let i = 0; i < 9; i++) add(box(0.06, 3.6, 0.04), toon({ color: '#4a2a18' }), -3.6 + i * 0.9, 1.9, -2.83, STU, { cast: false });
const FP = new THREE.Group(); FP.position.set(-2.2, 0, -2.75); STU.add(FP); add(box(1.8, 1.4, 0.4), toon({ color: '#d8ccb8' }), 0, 0.7, 0, FP); add(box(1.0, 0.8, 0.42), toon({ color: '#1a1210' }), 0, 0.45, 0.01, FP); add(box(2.0, 0.12, 0.5), toon({ color: '#c8bca8' }), 0, 1.45, 0.02, FP);
const FLAMES = []; for (let i = 0; i < 5; i++) { const B_f = add(new THREE.ConeGeometry(0.09 + (i % 2) * 0.03, 0.42, 8), hdr(i % 2 ? '#ffb040' : '#ff7a20', 2.4), -0.3 + i * 0.15, 0.32, 0.18, FP, { cast: false }); B_f.userData.ndSkip = true; FLAMES.push(B_f); }
const fireL2 = new THREE.PointLight('#ff9a40', 0, 9, 1.3); fireL2.position.set(-2.2, 0.8, -2.0); STU.add(fireL2);
const shelfS = new THREE.Group(); shelfS.position.set(2.4, 0, -2.6); STU.add(shelfS); add(box(2.4, 3.0, 0.45), M.timber, 0, 1.5, 0, shelfS); for (let B_r = 0; B_r < 5; B_r++) { let x = -1.1; while (x < 1.1) { const B_w = 0.07 + BR_() * 0.08, h = 0.35 + BR_() * 0.18; add(box(B_w, h, 0.3), M.books[Math.floor(BR_() * 8)], x + B_w / 2, 0.25 + B_r * 0.58 + h / 2, 0.08, shelfS, { cast: false }); x += B_w + 0.01; } }
const DSK = new THREE.Group(); DSK.position.set(0.2, 0, -1.2); STU.add(DSK); add(tbox(2.2, 0.1, 1.1, 1), M.darkWood, 0, 0.92, 0, DSK); for (const sx of [-0.95, 0.95]) add(box(0.25, 0.88, 1.0), M.darkWood, sx, 0.44, 0, DSK);
const CANDF = []; for (const [x, z] of [[-0.8, -0.3], [0.85, -0.35]]) { add(new THREE.CylinderGeometry(0.07, 0.09, 0.05, 12), M.brass, x, 0.995, z, DSK); add(new THREE.CylinderGeometry(0.028, 0.028, 0.24, 10), M.white, x, 1.14, z, DSK); const B_fl = add(new THREE.SphereGeometry(0.026, 8, 6), hdr('#ffc060', 2.8), x, 1.29, z, DSK, { cast: false }); B_fl.scale.set(1, 1.9, 1); B_fl.userData.ndSkip = true; CANDF.push(B_fl); }
const candL = new THREE.PointLight('#ffb870', 0, 6, 1.3); candL.position.set(0.2, 1.6, -0.9); STU.add(candL);
const BT = new THREE.Group(); BT.position.set(0.2, 0.97, -1.35); STU.add(BT); add(box(0.16, 0.06, 0.12), M.timber, 0, 0.03, 0, BT); add(box(0.12, 0.7, 0.03), toon({ color: '#d8c8a0' }), 0, 0.41, 0, BT); add(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), new THREE.MeshBasicMaterial({ color: '#e8f0f8' }), 0, 0.42, 0.02, BT, { cast: false }); add(box(0.008, 0.3, 0.008), new THREE.MeshBasicMaterial({ color: '#d02020' }), 0, 0.27, 0.025, BT, { cast: false }); add(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: '#d02020' }), 0, 0.12, 0.025, BT, { cast: false });
const TBL2 = new THREE.Group(); TBL2.position.set(-1.2, 0, 0.6); STU.add(TBL2); add(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 24), M.darkWood, 0, 0.78, 0, TBL2); add(new THREE.CylinderGeometry(0.06, 0.1, 0.76, 10), M.darkWood, 0, 0.38, 0, TBL2);
add(new THREE.CylinderGeometry(0.28, 0.24, 0.03, 24), M.white, 0, 0.825, 0, TBL2); const roast = add(new THREE.SphereGeometry(0.18, 18, 12), toon({ color: '#8a4a22' }), 0, 0.92, 0, TBL2); roast.scale.set(1.3, 0.62, 0.9); add(new THREE.CylinderGeometry(0.02, 0.025, 0.18, 6), M.white, 0.26, 0.97, 0, TBL2).rotation.z = 1.2;
// ---------- modern sauna ----------
const SAU = new THREE.Group(); SAU.position.set(11800, 0, 0); scene.add(SAU);
M.sauWood = texM(P.plaster(181, 6), 1, 1, '#d8a46a'); M.sauDark = toon({ color: '#b07a44' });
add(tbox(6, 0.3, 6, 1), M.sauDark, 0, -0.15, 0, SAU, { cast: false });
for (const [x, z, B_w, d] of [[0, -2.5, 6, 0.3], [-2.6, 0, 0.3, 6], [2.6, 0, 0.3, 6]]) { add(box(B_w, 3.2, d), M.sauWood, x, 1.6, z, SAU); }
for (let i = 0; i < 14; i++) add(box(0.02, 3.2, 0.02), M.sauDark, -2.4 + i * 0.36, 1.6, -2.33, SAU, { cast: false });
for (const [y, z] of [[0.45, -1.2], [0.95, -1.9]]) add(box(4.2, 0.08, 0.7), toon({ color: '#e0b07a' }), 0.4, y, z, SAU);
for (const [y, z] of [[0.22, -1.2], [0.7, -1.9]]) add(box(4.2, y * 2 - 0.1, 0.06), M.sauDark, 0.4, y - 0.02, z + 0.3, SAU, { cast: false });
const SST = new THREE.Group(); SST.position.set(-1.9, 0, -0.4); SAU.add(SST); add(box(0.7, 0.8, 0.55), toon({ color: '#3a3a3e' }), 0, 0.4, 0, SST); add(box(0.78, 0.12, 0.62), M.steelD, 0, 0.86, 0, SST);
const ROCKS = []; for (let i = 0; i < 14; i++) { const B_r = add(new THREE.IcosahedronGeometry(0.08 + BR_() * 0.04, 0), toon({ color: '#5a5a60', emissive: '#ff5a20', emissiveIntensity: 0.15 }), -0.25 + (i % 5) * 0.12, 0.98 + Math.floor(i / 5) * 0.06, -0.18 + (i % 3) * 0.16, SST); ROCKS.push(B_r); }
add(new THREE.CylinderGeometry(0.16, 0.13, 0.22, 16), toon({ color: '#b07a44' }), -1.3, 0.11, 0.3, SAU); add(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), toon({ color: '#8a5a30' }), -1.25, 0.32, 0.3, SAU).rotation.z = 0.5;
const sauL = new THREE.PointLight('#ffc890', 0, 9, 1.2); sauL.position.set(1.4, 2.6, 0.8); SAU.add(sauL);
const sauLamp = add(new THREE.SphereGeometry(0.1, 12, 10), hdr('#ffd8a0', 1.6), 1.6, 2.7, -2.25, SAU, { cast: false }); sauLamp.userData.ndSkip = true;
