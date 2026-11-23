// ================= OPERATING THEATRE (world x = 1986): Kane Summit Hospital, Pennsylvania, 1921 =================
const TH = new THREE.Group(); TH.position.set(1986, 0, 0); scene.add(TH);
const thFloorC = cvs(512, 512, (g, W, H) => { const n = 8, s = W / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#2f6a5a' : '#f2ecdc'; g.fillRect(i * s, j * s, s, s); } g.strokeStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, H); g.moveTo(0, i * s); g.lineTo(W, i * s); g.stroke(); } });
const panelC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#8a5a34'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) { g.fillStyle = '#9c6a40'; g.fillRect(i * 128 + 14, 40, 100, 432); g.strokeStyle = '#5a3a20'; g.lineWidth = 6; g.strokeRect(i * 128 + 14, 40, 100, 432); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(i * 128 + 20, 46, 20, 420); } });
M.thFloor = texM(thFloorC, 1, 1, '#ffffff'); M.panel = texM(panelC, 1, 1, '#ffffff'); M.creamW = texM(P.plaster(81, 30), 1, 1, '#fff1d8'); M.bench = toon({ color: '#7a4a2a' }); M.rail = toon({ color: '#c89a3a' });
M.jarGlass = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#d8f0e8', transparent: true, opacity: 0.35, depthWrite: false }); M.pink = toon({ color: '#f08a9a' }); M.jarLid = toon({ color: '#b08a4a' });
M.etherG = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#c8a050', transparent: true, opacity: 0.8 });
add(tbox(10, 0.3, 11, 1.6), M.thFloor, 0, -0.15, -0.5, TH, { cast: false });
for (const [x, z, w, d] of [[0, -6, 10, 0.3], [-5, -0.5, 0.3, 11], [5, -0.5, 0.3, 11]]) { add(tbox(w, 1.6, d, 1.6), M.panel, x, 0.8, z, TH); add(tbox(w, 4.0, d, 2.2), M.creamW, x, 3.6, z, TH); add(box(w + 0.04, 0.1, d + 0.06), M.timber, x, 1.6, z, TH, { cast: false }); }
add(tbox(10, 0.3, 11, 2), M.creamW, 0, 5.6, -0.5, TH, { cast: false });
const sky = add(box(3.2, 0.05, 2.4), new THREE.MeshBasicMaterial({ color: '#e8f6ff' }), 0, 5.44, -0.8, TH, { cast: false }); for (let i = -1; i <= 1; i++) add(box(0.08, 0.1, 2.5), M.timber, i * 1.07, 5.4, -0.8, TH, { cast: false }); add(box(3.3, 0.1, 0.08), M.timber, 0, 5.4, -0.8, TH, { cast: false });
shaft(TH, [0, 5.4, -0.8], [0, 0.0, -0.3], 1.3, 1.9, '#fff4dc', 0.13);
// tall windows on the side walls
for (const s of [-1, 1]) for (const z of [-3.2, 1.2]) { const wc = skyPane(1.2, 2.2); const w = add(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshBasicMaterial({ map: P.tex(wc) }), s * 4.84, 3.1, z, TH, { cast: false }); w.rotation.y = -s * Math.PI / 2;
  add(box(0.1, 2.3, 0.1), M.timber, s * 4.82, 3.1, z, TH, { cast: false }); add(box(0.1, 0.1, 1.3), M.timber, s * 4.82, 3.1, z, TH, { cast: false }); }
// tiered gallery behind the table
for (let k = 0; k < 3; k++) { const z = -3.3 - k * 0.8, y = 0.45 + k * 0.45; add(tbox(9.4, y, 0.8, 1), M.darkWood, 0, y / 2, z, TH); add(box(9.2, 0.1, 0.35), M.bench, 0, y + 0.42, z - 0.15, TH, { cast: false });
  add(box(9.4, 0.06, 0.06), M.rail, 0, y + 0.95, z + 0.36, TH, { cast: false }); for (let i = -4; i <= 4; i++) add(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), M.rail, i * 1.15, y + 0.47, z + 0.36, TH, { cast: false }); }
export const GALLERY = 0;
// operating table + pillows + sheet
const tt = new THREE.Group(); TH.add(tt);
add(new THREE.CylinderGeometry(0.16, 0.3, 0.8, 16), M.steel, 0, 0.4, 0, tt); add(box(2.1, 0.12, 0.8), M.steelD, 0, 0.86, 0, tt); add(box(2.0, 0.1, 0.74), M.sheet, 0, 0.97, 0, tt);
const pil1 = add(new THREE.SphereGeometry(0.32, 16, 10), M.sheet, 0, 1.25, -0.28, tt); pil1.scale.set(1.6, 0.7, 0.55); pil1.rotation.x = -0.5;
const pil2 = add(new THREE.SphereGeometry(0.28, 16, 10), M.sheet, 0, 1.5, -0.4, tt); pil2.scale.set(1.5, 0.75, 0.5); pil2.rotation.x = -0.6;
const lap = add(box(0.95, 0.42, 0.55), M.sheet, 0, 1.22, 0.22, tt); const lapTop = add(new THREE.CylinderGeometry(0.28, 0.28, 0.95, 16, 1, false, 0, Math.PI), M.sheet, 0, 1.43, 0.22, tt); lapTop.rotation.z = Math.PI / 2;
const THL = { lap: [lap, lapTop], pil: [pil1, pil2] };
const thLamp = new THREE.Group(); thLamp.position.set(0, 3.3, 0); TH.add(thLamp);
add(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 8), M.steelD, 0, 1.0, 0, thLamp, { cast: false }); add(new THREE.SphereGeometry(0.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.brass, 0, 0, 0, thLamp);
const thFace = add(new THREE.CircleGeometry(0.53, 24), M.lampGlow, 0, -0.01, 0, thLamp, { cast: false }); thFace.rotation.x = Math.PI / 2;
const thSpot = new THREE.SpotLight('#fff4dc', 0, 9, 0.75, 0.6, 1.2); thSpot.position.set(0, 3.2, 0.2); thSpot.target.position.set(0, 1.1, 0.1); TH.add(thSpot); TH.add(thSpot.target);
// instrument cart with ether bottle
const tc = new THREE.Group(); tc.position.set(1.6, 0, 0.4); TH.add(tc);
for (const [x, z] of [[-0.35, -0.22], [0.35, -0.22], [-0.35, 0.22], [0.35, 0.22]]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), M.steel, x, 0.45, z, tc, { cast: false });
add(box(0.8, 0.04, 0.5), M.steel, 0, 0.9, 0, tc); add(box(0.8, 0.03, 0.5), M.steel, 0, 0.35, 0, tc);
for (let i = 0; i < 6; i++) add(box(0.015, 0.01, 0.16), M.steelD, -0.3 + i * 0.05, 0.93, -0.08, tc, { cast: false });
const eth = add(new THREE.CylinderGeometry(0.09, 0.1, 0.32, 16), M.etherG, 0.22, 1.08, 0.05, tc); add(new THREE.CylinderGeometry(0.035, 0.05, 0.08, 10), M.etherG, 0.22, 1.28, 0.05, tc, { cast: false }); add(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10), M.ironK, 0.22, 1.34, 0.05, tc, { cast: false });
const ethLab = decal(tc, 0.16, 0.14, (g, W, H) => { g.fillStyle = '#f4ead2'; g.fillRect(0, 0, W, H); g.strokeStyle = '#3a2a1a'; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4); g.fillStyle = '#1a1a1a'; g.font = `900 ${H * 0.26}px DejaVu Sans, sans-serif`; g.textAlign = 'center'; g.fillText('ETHER', W / 2, H * 0.34); g.font = `${H * 0.46}px DejaVu Sans, sans-serif`; g.fillText('☠', W / 2, H * 0.86); }, 0.22, 1.08, 0.152, 0, false, 900);
// shelf of appendix jars on the right wall
const jars = new THREE.Group(); jars.position.set(4.6, 0, -1.6); jars.rotation.y = -Math.PI / 2; TH.add(jars);
add(tbox(3.2, 2.6, 0.45, 1), M.timber, 0, 1.3, -0.05, jars); const JARS = [];
for (let k = 0; k < 4; k++) { const y = 0.25 + k * 0.6; add(box(3.0, 0.05, 0.4), M.wood, 0, y, 0.02, jars, { cast: false });
  for (let i = 0; i < 9; i++) { const x = -1.32 + i * 0.33; add(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 14, 1, true), M.jarGlass, x, y + 0.19, 0.05, jars, { cast: false }); add(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 14), M.jarLid, x, y + 0.37, 0.05, jars, { cast: false });
    const ap = add(new THREE.CapsuleGeometry(0.028, 0.12, 4, 8), M.pink, x, y + 0.17, 0.05, jars, { cast: false }); ap.rotation.z = 0.6 + ((i * 7 + k * 3) % 5) * 0.2; JARS.push(ap); } }
const thFill = new THREE.PointLight('#fff4e6', 0, 16, 1.0); thFill.position.set(0.5, 4.2, 3.0); TH.add(thFill);
const thBack = new THREE.PointLight('#ffe8c8', 0, 12, 1.2); thBack.position.set(0, 3.6, -4.2); TH.add(thBack);
