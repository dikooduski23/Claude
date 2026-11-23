// ================= RUPERT'S DROP: Royal Society lab (x=5000), Thames dock (x=5400), throne room (x=5800), glasshouse (x=6200), modern street (x=6600) =================
const RP = P.rng(1660);
// ---------- the glass drop (lathe), crack line, shards ----------
const DR = 0.09, DL = 0.5, DS0 = DR * 1.25;
const dropR = (s) => s < DS0 ? DR * Math.sqrt(Math.max(0, 1 - ((s - DR) / DR) ** 2)) : Math.max(0.004, DR * 0.78 * Math.exp(-(s - DS0) / 0.09));
const dropBend = (s) => s > DS0 ? 0.55 * ((s - DS0) / (DL - DS0)) ** 2 * (DL - DS0) : 0;
const makeDropGeo = () => { const pts = []; for (let i = 0; i <= 80; i++) { const s = DL * (i / 80) ** 1.4; pts.push(new THREE.Vector2(i === 0 ? 0.0001 : dropR(s), s)); } pts.push(new THREE.Vector2(0.0001, DL));
  const g = new THREE.LatheGeometry(pts, 40); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + dropBend(p.getY(i))); g.computeVertexNormals(); return g; };
const DROPG = makeDropGeo();
M.glassD = new THREE.MeshStandardMaterial({ color: '#cfefff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.78, emissive: '#3a8ab0', emissiveIntensity: 0.35 });
M.glassD.userData.keepStd = true;
M.hotD = new THREE.MeshBasicMaterial({ color: '#ffb040' });
M.crackL = new THREE.MeshBasicMaterial({ color: '#ffffff' });
// a drop = group whose local +y runs bulb -> tail; laid on its side so the tail points to world -x and curls up
const makeDrop = (mat) => { const G = new THREE.Group(); const inner = new THREE.Group(); inner.rotation.z = Math.PI / 2; G.add(inner);
  const body = new THREE.Mesh(DROPG, mat); body.castShadow = true; inner.add(body);
  const hi = new THREE.Mesh(new THREE.SphereGeometry(DR * 0.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); hi.position.set(-DR * 0.35, DR * 0.75, DR * 0.55); inner.add(hi);
  const cr = []; for (let i = 0; i < 40; i++) { const s0 = DL * 0.8 * (1 - i / 40), s1 = DL * 0.8 * (1 - (i + 1) / 40); const a = new THREE.Vector3(dropBend(s0), s0, 0), b = new THREE.Vector3(dropBend(s1), s1, 0);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, a.distanceTo(b) + 0.002, 5), M.crackL); seg.position.copy(a).add(b).multiplyScalar(0.5); seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); seg.visible = false; seg.userData.ndSkip = true; inner.add(seg); cr.push(seg); }
  const br = []; for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2, L = DR * (0.5 + 0.5 * RP()); const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, L, 4), M.crackL);
    const dir = new THREE.Vector3(Math.cos(a) * 0.9, -0.5 - RP() * 0.4, Math.sin(a) * 0.9).normalize(); seg.position.copy(new THREE.Vector3(0, DR * 1.2, 0)).addScaledVector(dir, L / 2); seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); seg.visible = false; seg.userData.ndSkip = true; inner.add(seg); br.push(seg); }
  G.userData = { body, hi, cr, br, inner }; return G; };
// shards: sampled inside the drop volume (in the drop's inner frame), flung outwards
const NSH = 520, SHP = [], SHV = [];
for (let i = 0; i < NSH; i++) { let s; do { s = RP() * DL; } while (RP() > (dropR(s) / DR) ** 2 * 1.2 + 0.02); const r = dropR(s) * Math.sqrt(RP()), a = RP() * Math.PI * 2;
  SHP.push(new THREE.Vector3(dropBend(s) + Math.cos(a) * r, s, Math.sin(a) * r)); const out = new THREE.Vector3(Math.cos(a), (RP() - 0.5) * 0.6, Math.sin(a)).normalize(); SHV.push(out.multiplyScalar(0.25 + RP() * 0.55)); }
const makeShards = () => { const m = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.008), new THREE.MeshBasicMaterial({ color: '#e8f8ff' }), NSH); m.visible = false; m.userData.ndSkip = true; m.frustumCulled = false; return m; };
const _o = new THREE.Object3D();
const setShards = (m, t) => { // t: seconds of (slow-motion) explosion time
  for (let i = 0; i < NSH; i++) { const p = SHP[i], v = SHV[i]; _o.position.set(p.x + v.x * t, p.y + v.y * t * 0.6, p.z + v.z * t); _o.position.x -= 0.6 * t * t * 0; _o.rotation.set(i + t * 9, i * 2 + t * 7, 0); const sc = (0.6 + (i % 5) * 0.25) * Math.max(0.2, 1 - t * 0.35); _o.scale.setScalar(sc); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); }
  m.instanceMatrix.needsUpdate = true; };
// drop state: crack (0..1 from the snap point to the head), boom (seconds after burst; <0 = intact), snapAt
const applyDrop = (D, SH, crack, boom) => { const U = D.userData; const n = Math.floor(crack * U.cr.length);
  U.cr.forEach((s, i) => { s.visible = boom < 0 && crack > 0 && i < n; }); U.br.forEach((s, i) => { s.visible = boom < 0 && crack > 0.92 && i < (crack - 0.92) / 0.08 * U.br.length; });
  U.body.visible = boom < 0; U.hi.visible = boom < 0; SH.visible = boom >= 0; if (boom >= 0) setShards(SH, boom); };
// ---------- hammer + pliers (3D props, lab) ----------
M.hamHead = toon({ color: '#5a6068' }); M.hamWood = toon({ color: '#9a6a40' }); M.plierR = toon({ color: '#c0303a' });
const makeHammer = (L = 0.55, hs = 1) => { const G = new THREE.Group(); const h = add(new THREE.CylinderGeometry(0.018, 0.022, L, 10), M.hamWood, L / 2, 0, 0, G); h.rotation.z = Math.PI / 2;
  add(box(0.09 * hs, 0.24 * hs, 0.09 * hs), M.hamHead, L, 0, 0, G); return G; };
// ================= LAB =================
const LAB = new THREE.Group(); LAB.position.set(5000, 0, 0); scene.add(LAB);
const labFloorC = cvs(512, 512, (g, W, H) => { const c = ['#e9dcc0', '#3a3030']; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = c[(i + j) % 2]; g.fillRect(i * 64, j * 64, 64, 64); } });
M.labFloor = texM(labFloorC, 3, 3, '#ffffff'); M.labWall = texM(P.plaster(161, 26), 1, 1, '#f4e2c0'); M.panelW = toon({ color: '#7a4a2a' });
add(tbox(14, 0.3, 12, 1.6), M.labFloor, 0, -0.15, 0, LAB, { cast: false });
for (const [x, z, w, d] of [[0, -6, 14, 0.3], [-7, 0, 0.3, 12], [7, 0, 0.3, 12]]) { add(tbox(w, 6, d, 2), M.labWall, x, 3, z, LAB); add(box(w + 0.02, 1.4, d + 0.02), M.panelW, x, 0.7, z, LAB, { cast: false }); }
add(tbox(14, 0.3, 12, 2), M.cream, 0, 6.1, 0, LAB, { cast: false });
for (let k = -2; k <= 2; k++) add(box(14, 0.35, 0.3), M.timber, 0, 5.85, k * 2.6, LAB, { cast: false });
// tall windows on the back wall with sunbeams
const R_winC = cvs(256, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7ec0ff'); gr.addColorStop(1, '#e8f6ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.strokeStyle = '#5a3a24'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14); g.lineWidth = 8; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(i * W / 3, 0); g.lineTo(i * W / 3, H); g.stroke(); } for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(0, j * H / 6); g.lineTo(W, j * H / 6); g.stroke(); } });
const winM = new THREE.MeshBasicMaterial({ map: P.tex(R_winC) });
for (const x of [-4.2, 0, 4.2]) { const w = add(new THREE.PlaneGeometry(1.6, 3.2), winM, x, 3.2, -5.84, LAB, { cast: false }); w.userData.ndSkip = true;
  const beam = add(new THREE.PlaneGeometry(1.6, 7), new THREE.MeshBasicMaterial({ color: '#fff4d0', transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide }), x + 0.6, 2.4, -3.2, LAB, { cast: false }); beam.rotation.x = -0.95; beam.userData.ndSkip = true; }
// bookshelves on the side walls
for (const sx of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(sx * 6.6, 0, -1.5); LAB.add(sh); add(box(0.6, 4.2, 5), M.timber, 0, 2.1, 0, sh);
  for (let r = 0; r < 5; r++) { let z = -2.3; while (z < 2.3) { const w = 0.08 + RP() * 0.1, h = 0.45 + RP() * 0.25; add(box(0.4, h, w), M.books[Math.floor(RP() * 8)], -sx * 0.1, 0.35 + r * 0.8 + h / 2, z + w / 2, sh, { cast: false }); z += w + 0.01; } add(box(0.62, 0.06, 5), M.darkWood, 0, 0.32 + r * 0.8, 0, sh, { cast: false }); } }
// the big table, block, candles, flasks, R_globe, telescope
const TB = new THREE.Group(); LAB.add(TB);
add(tbox(3.4, 0.12, 1.6, 1), M.darkWood, 0, 0.96, 0, TB); for (const [x, z] of [[-1.5, -0.65], [1.5, -0.65], [-1.5, 0.65], [1.5, 0.65]]) add(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 10), M.timber, x, 0.45, z, TB);
add(box(0.5, 0.14, 0.36), toon({ color: '#6a4a32' }), 0, 1.09, 0, TB);  // oak block (top at 1.16)
const R_candle = (x, z) => { add(new THREE.CylinderGeometry(0.06, 0.08, 0.05, 12), M.brass, x, 1.045, z, TB); add(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 10), M.white, x, 1.18, z, TB); const fl = add(new THREE.SphereGeometry(0.022, 8, 6), M.fireCore, x, 1.31, z, TB, { cast: false }); fl.scale.set(1, 1.8, 1); fl.userData.ndSkip = true; };
R_candle(-1.2, -0.4); R_candle(1.25, -0.45);
M.flask = new THREE.MeshStandardMaterial({ color: '#bfe8d8', roughness: 0.1, transparent: true, opacity: 0.55 }); M.flask.userData.keepStd = true;
for (const [x, z, h, c] of [[-0.9, -0.5, 0.3, '#5ac0a0'], [-0.7, -0.6, 0.22, '#e05a7a'], [0.9, -0.55, 0.26, '#f0c040']]) { add(new THREE.CylinderGeometry(0.07, 0.09, h, 14), M.flask, x, 1.02 + h / 2, z, TB, { cast: false }); add(new THREE.CylinderGeometry(0.065, 0.085, h * 0.5, 14), toon({ color: c, emissive: c, emissiveIntensity: 0.25 }), x, 1.02 + h * 0.25, z, TB, { cast: false }); }
const R_globe = new THREE.Group(); R_globe.position.set(-1.45, 1.02, 0.25); TB.add(R_globe); add(new THREE.CylinderGeometry(0.05, 0.12, 0.08, 12), M.brass, 0, 0.04, 0, R_globe); add(new THREE.SphereGeometry(0.2, 20, 14), toon({ color: '#3a7ac0' }), 0, 0.3, 0, R_globe); add(new THREE.TorusGeometry(0.23, 0.012, 6, 30), M.brass, 0, 0.3, 0, R_globe).rotation.y = 0.4;
const scope = new THREE.Group(); scope.position.set(3.6, 0, -3.6); LAB.add(scope); for (let k = 0; k < 3; k++) { const l = add(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), M.timber, Math.cos(k * 2.1) * 0.35, 0.85, Math.sin(k * 2.1) * 0.35, scope); l.rotation.set(Math.sin(k * 2.1) * 0.35, 0, -Math.cos(k * 2.1) * 0.35); }
const R_tube = add(new THREE.CylinderGeometry(0.07, 0.11, 1.6, 14), M.brass, 0, 1.85, 0, scope); R_tube.rotation.z = 0.9;
// papers on the table
for (const [x, z, r] of [[0.7, 0.35, 0.3], [-0.5, 0.45, -0.2]]) { const pp = add(new THREE.PlaneGeometry(0.42, 0.3), M.paper, x, 1.025, z, TB, { cast: false }); pp.rotation.set(-Math.PI / 2, 0, r); }
// the drop on the block, the hammer, the pliers
const LDROP = makeDrop(M.glassD); LDROP.position.set(0.07, 1.16 + DR, 0); LDROP.rotation.y = 0.25; TB.add(LDROP);
const LSH = makeShards(); LDROP.userData.inner.add(LSH);
const HAM = makeHammer(0.6); TB.add(HAM);
const PLI = new THREE.Group(); TB.add(PLI); const pj = []; for (const sd of [-1, 1]) { const j = new THREE.Group(); PLI.add(j); add(box(0.32, 0.03, 0.035), M.plierR, 0.2, 0, 0, j); add(box(0.12, 0.022, 0.03), M.hamHead, -0.02, 0, 0, j); j.position.y = sd * 0.02; j.userData.sd = sd; pj.push(j); }
const R_labFill = new THREE.PointLight('#ffe8c8', 0, 16, 1.0); R_labFill.position.set(0.5, 3.8, 2.5); LAB.add(R_labFill);
const labWin = new THREE.PointLight('#cfe6ff', 0, 14, 1.0); labWin.position.set(0, 3.2, -4.6); LAB.add(labWin);
// ================= DOCK (Thames, 1660) =================
const R_DK = new THREE.Group(); R_DK.position.set(5400, 0, 0); scene.add(R_DK);
const riverC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#3a8ab8'; g.fillRect(0, 0, W, H); const r = P.rng(31); for (let i = 0; i < 700; i++) { const x = r() * W, y = r() * H; g.strokeStyle = r() < 0.6 ? 'rgba(255,255,255,.22)' : 'rgba(0,30,60,.18)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 12, y - 5, x + 26, y); g.stroke(); } });
const riverT = P.tex(riverC); riverT.wrapS = riverT.wrapT = THREE.RepeatWrapping; riverT.repeat.set(40, 40);
const river = add(new THREE.PlaneGeometry(800, 800), new THREE.MeshToonMaterial({ gradientMap: grad, map: riverT }), 0, -0.6, -200, R_DK, { cast: false }); river.rotation.x = -Math.PI / 2;
add(tbox(40, 1.2, 10, 3), M.stone, 0, -0.0 - 0.6, 6, R_DK);                     // stone quay (top at 0)
add(tbox(40, 0.1, 10, 4), M.plank, 0, 0.05, 6, R_DK, { cast: false });
for (let i = 0; i < 6; i++) { const b = add(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 14), M.timber, -6 + i * 0.8 + (i > 2 ? 6 : 0), 0.5, 3.0 + (i % 2) * 0.7, R_DK); }
for (let i = 0; i < 4; i++) add(box(0.9, 0.9, 0.9), M.woodT, 5 + (i % 2) * 1.0, 0.55 + Math.floor(i / 2) * 0.9, 3.4, R_DK);
// the ship
const SHIP = new THREE.Group(); SHIP.position.set(0, -0.6, -6); R_DK.add(SHIP);
const hullS = new THREE.Shape(); hullS.moveTo(-9, 3.4); hullS.lineTo(9.5, 3.4); hullS.quadraticCurveTo(9.6, 0.6, 6.5, 0); hullS.lineTo(-7, 0); hullS.quadraticCurveTo(-9, 0.8, -9, 3.4);
const hullG = new THREE.ExtrudeGeometry(hullS, { depth: 4.2, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.6, bevelSegments: 3 }); hullG.translate(0, 0, -2.1);
add(hullG, toon({ color: '#7a4a28' }), 0, 0, 0, SHIP); add(box(18.5, 0.35, 0.15), toon({ color: '#f2c230' }), 0.2, 2.6, 2.75, SHIP, { cast: false }); add(box(18.5, 0.25, 0.15), toon({ color: '#2a5aa8' }), 0.2, 1.9, 2.75, SHIP, { cast: false });
for (let i = 0; i < 9; i++) add(box(0.4, 0.4, 0.1), toon({ color: '#2a1a10' }), -6 + i * 1.6, 1.3, 2.78, SHIP, { cast: false });
add(box(5, 2.0, 4.6), toon({ color: '#8a5a30' }), -6.6, 4.4, 0, SHIP);                // stern castle
M.sail = toon({ color: '#f6f0e0', side: THREE.DoubleSide });
for (const [x, h] of [[-3.5, 11], [1.5, 13], [6, 9]]) { add(new THREE.CylinderGeometry(0.16, 0.22, h, 10), M.timber, x, 3.4 + h / 2, 0, SHIP);
  for (const [y, w, hh] of [[3.4 + h * 0.42, 5.2, 3.0], [3.4 + h * 0.75, 4.0, 2.4]]) { const sg = new THREE.PlaneGeometry(w, hh, 8, 4); const pp = sg.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, 0.6 * (1 - (pp.getX(i) / (w / 2)) ** 2)); sg.computeVertexNormals(); const sl = add(sg, M.sail, x, y, 0.3, SHIP, { cast: false }); sl.rotation.y = 0.12; add(box(w + 0.4, 0.12, 0.12), M.timber, x, y + hh / 2, 0.15, SHIP, { cast: false }); }
  const fl = add(new THREE.PlaneGeometry(1.2, 0.7), toon({ color: '#c0283a', side: THREE.DoubleSide }), x + 0.62, 3.4 + h + 0.2, 0, SHIP, { cast: false }); }
const plank = add(box(1.0, 0.1, 4.2), M.plank, 2, 1.2, -1.6, R_DK); plank.rotation.x = 0.42;
// far London shore
for (let i = 0; i < 26; i++) { const w = 3 + RP() * 4, h = 3 + RP() * 6; add(box(w, h, 3), toon({ color: ['#e8d8b8', '#d8c0a0', '#c8a888', '#f0e2c8'][i % 4] }), -60 + i * 4.8, h / 2 - 0.6, -120, R_DK, { cast: false }); add(new THREE.ConeGeometry(w * 0.7, 2.2, 4), M.roofT || M.roof, -60 + i * 4.8, h + 0.5, -120, R_DK, { cast: false }).rotation.y = Math.PI / 4; }
const dockClouds = []; for (let i = 0; i < 9; i++) { const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0; T.fxCloud(pen, (i % 12) + 1);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false })); m.position.set(-90 + i * 22 + RP() * 8, 30 + RP() * 22, -260); m.scale.setScalar(34 + RP() * 20); m.userData.ndSkip = true; R_DK.add(m); dockClouds.push(m); }
// ================= THRONE ROOM =================
const CT = new THREE.Group(); CT.position.set(5800, 0, 0); scene.add(CT);
M.ctFloor = texM(P.marble(171), 4, 4, '#f4ece0'); M.ctWall = texM(P.plaster(172, 20), 1, 1, '#c8dcf0'); M.carpet = toon({ color: '#b81a2e' });
add(tbox(16, 0.3, 14, 1.6), M.ctFloor, 0, -0.15, 0, CT, { cast: false });
for (const [x, z, w, d] of [[0, -7, 16, 0.3], [-8, 0, 0.3, 14], [8, 0, 0.3, 14]]) add(tbox(w, 7, d, 2), M.ctWall, x, 3.5, z, CT);
add(box(2.4, 0.02, 14), M.carpet, 0, 0.011, 0, CT, { cast: false }); add(box(2.2, 0.03, 14), toon({ color: '#d02a40' }), 0, 0.012, 0, CT, { cast: false });
add(box(5, 0.45, 3), toon({ color: '#d8c8a8' }), 0, 0.22, -5.2, CT); add(box(4, 0.3, 2.4), toon({ color: '#c8b898' }), 0, 0.58, -5.4, CT);
const R_TH = new THREE.Group(); R_TH.position.set(0, 0.73, -5.6); CT.add(R_TH); add(box(1.3, 0.5, 1.0), M.gold, 0, 0.25, 0, R_TH); add(box(1.3, 2.2, 0.2), M.gold, 0, 1.3, -0.45, R_TH); add(box(1.0, 1.7, 0.05), M.carpet, 0, 1.3, -0.33, R_TH, { cast: false }); add(box(1.1, 0.12, 0.85), M.carpet, 0, 0.52, 0.05, R_TH, { cast: false });
for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.12, 12, 10), M.gold, s * 0.6, 2.5, -0.45, R_TH);
for (const x of [-5.5, -3, 3, 5.5]) for (const z of [-4, 1]) { add(new THREE.CylinderGeometry(0.35, 0.4, 7, 16), M.marbleTop, x, 3.5, z, CT); add(box(1.0, 0.3, 1.0), M.gold, x, 0.15, z, CT); add(box(1.0, 0.3, 1.0), M.gold, x, 6.85, z, CT); }
for (const x of [-4.2, 4.2]) { const bn = add(new THREE.PlaneGeometry(1.4, 3.6), toon({ color: '#c0283a', side: THREE.DoubleSide }), x, 4.2, -6.82, CT, { cast: false }); add(new THREE.CircleGeometry(0.4, 20), M.gold, x, 4.6, -6.8, CT, { cast: false }); }
const chand = new THREE.Group(); chand.position.set(0, 5.6, -1); CT.add(chand); add(new THREE.TorusGeometry(0.9, 0.05, 8, 30), M.gold, 0, 0, 0, chand).rotation.x = Math.PI / 2; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const f = add(new THREE.SphereGeometry(0.06, 8, 6), M.fireCore, Math.cos(a) * 0.9, 0.18, Math.sin(a) * 0.9, chand, { cast: false }); f.userData.ndSkip = true; }
add(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), M.gold, 0, 0.75, 0, chand);
const ctFill = new THREE.PointLight('#fff0d8', 0, 22, 1.0); ctFill.position.set(0, 5, 2); CT.add(ctFill);
// ================= GLASSHOUSE =================
const GH = new THREE.Group(); GH.position.set(6200, 0, 0); scene.add(GH);
M.brick = texM(P.stone(181), 2, 2, '#c87a5a');
add(tbox(12, 0.3, 10, 1.6), M.darkWood, 0, -0.15, 0, GH, { cast: false });
for (const [x, z, w, d] of [[0, -5, 12, 0.3], [-6, 0, 0.3, 10], [6, 0, 0.3, 10]]) add(tbox(w, 5, d, 2), M.brick, x, 2.5, z, GH);
const FUR = new THREE.Group(); FUR.position.set(-1.2, 0, -2.8); GH.add(FUR);
const R_dome = add(new THREE.SphereGeometry(1.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.brick, 0, 0.9, 0, FUR); add(new THREE.CylinderGeometry(1.6, 1.7, 0.9, 24), M.brick, 0, 0.45, 0, FUR);
const mouthC = cvs(256, 256, (g, W, H) => { const gr = g.createRadialGradient(128, 150, 10, 128, 140, 128); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.35, '#ffc040'); gr.addColorStop(0.8, '#ff5a10'); gr.addColorStop(1, '#7a1a00'); g.fillStyle = gr; g.beginPath(); g.arc(128, 150, 120, Math.PI, 0); g.lineTo(248, 256); g.lineTo(8, 256); g.closePath(); g.fill(); });
const mouth = add(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: P.tex(mouthC), transparent: true }), 0, 1.0, 1.62, FUR, { cast: false }); mouth.userData.ndSkip = true;
add(new THREE.CylinderGeometry(0.3, 0.35, 2.5, 12), M.brick, 0, 3.3, -0.4, FUR);
const ghFire = new THREE.PointLight('#ff8a30', 0, 10, 1.2); ghFire.position.set(-1.2, 1.2, -0.8); GH.add(ghFire);
const ghFill = new THREE.PointLight('#ffe0c0', 0, 14, 1.0); ghFill.position.set(1.5, 3.5, 3); GH.add(ghFill);
const BK = new THREE.Group(); BK.position.set(0.9, 0, -0.6); GH.add(BK);           // the bucket of cold water
add(new THREE.CylinderGeometry(0.42, 0.34, 0.6, 24, 1, true), toon({ color: '#9a6a40', side: THREE.DoubleSide }), 0, 0.3, 0, BK); add(new THREE.CircleGeometry(0.34, 24), toon({ color: '#5a3a20' }), 0, 0.01, 0, BK).rotation.x = -Math.PI / 2;
for (const y of [0.12, 0.48]) add(new THREE.TorusGeometry(0.39 - (y < 0.3 ? 0.04 : 0), 0.018, 6, 30), M.ironK, 0, y, 0, BK).rotation.x = Math.PI / 2;
const bkWater = add(new THREE.CircleGeometry(0.4, 24), new THREE.MeshStandardMaterial({ color: '#5ab0e0', transparent: true, opacity: 0.5, roughness: 0.1 }), 0, 0.5, 0, BK, { cast: false }); bkWater.rotation.x = -Math.PI / 2; bkWater.material.userData.keepStd = true;
const HDROP = makeDrop(M.hotD); HDROP.scale.setScalar(0.9); BK.add(HDROP);
for (let i = 0; i < 10; i++) { const b = add(new THREE.CylinderGeometry(0.1, 0.12, 0.25 + RP() * 0.3, 12), new THREE.MeshStandardMaterial({ color: ['#5ac0a0', '#4a8ad0', '#e0a040', '#c05a8a'][i % 4], transparent: true, opacity: 0.8, roughness: 0.1 }), -5.6 + 0.0, 1.6 + Math.floor(i / 5) * 0.8, -3 + (i % 5) * 0.5, GH, { cast: false }); b.material.userData.keepStd = true; }
add(box(0.5, 0.06, 3), M.timber, -5.6, 1.45, -2, GH); add(box(0.5, 0.06, 3), M.timber, -5.6, 2.25, -2, GH);
// ================= MODERN STREET + CAR =================
const R_ST = new THREE.Group(); R_ST.position.set(6600, 0, 0); scene.add(R_ST);
const roadC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#4a4e56'; g.fillRect(0, 0, W, H); const r = P.rng(5); for (let i = 0; i < 4000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.fillRect(r() * W, r() * H, 2, 2); } g.fillStyle = '#f4f4f0'; g.fillRect(W / 2 - 6, 0, 12, H * 0.5); });
add(tbox(80, 0.2, 10, 1), texM(roadC, 8, 1, '#ffffff'), 0, -0.1, 2, R_ST, { cast: false });
add(tbox(80, 0.3, 4, 1), texM(P.plaster(191, 10), 20, 1, '#d8d4cc'), 0, 0.05, -5, R_ST, { cast: false });
for (let i = 0; i < 14; i++) { const w = 4 + RP() * 2, h = 6 + RP() * 8; const col = ['#ff9a6a', '#7ac8e8', '#f4d06a', '#a8e0a0', '#e8a0c8', '#f4f0e8'][i % 6]; add(box(w, h, 5), toon({ color: col }), -30 + i * 5.2, h / 2, -10, R_ST);
  for (let r = 0; r < Math.floor(h / 2.2); r++) for (let c = 0; c < 2; c++) add(new THREE.PlaneGeometry(0.9, 1.2), toon({ color: '#3a5a7a', emissive: '#1a2a3a' }), -30 + i * 5.2 - w / 4 + c * w / 2, 2 + r * 2.2, -7.48, R_ST, { cast: false }); }
for (const x of [-12, 4, 18]) { add(new THREE.CylinderGeometry(0.15, 0.2, 2, 8), M.trunk, x, 1.2, -4.2, R_ST); add(new THREE.SphereGeometry(1.2, 14, 10), M.leaf, x, 2.9, -4.2, R_ST); }
const CAR = new THREE.Group(); CAR.position.set(0, 0, 0.6); R_ST.add(CAR);
M.carRed = toon({ color: '#e8382e' }); M.tyre = toon({ color: '#1e1e22' }); M.rim = toon({ color: '#d0d4d8' });
const carS = new THREE.Shape(); carS.moveTo(-2.2, 0.35); carS.lineTo(2.25, 0.35); carS.quadraticCurveTo(2.4, 0.4, 2.35, 0.95); carS.lineTo(1.0, 1.05); carS.lineTo(0.45, 1.6); carS.lineTo(-1.6, 1.62); carS.quadraticCurveTo(-2.15, 1.5, -2.2, 1.0); carS.closePath();
const carG = new THREE.ExtrudeGeometry(carS, { depth: 1.7, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 }); carG.translate(0, 0, -0.85); add(carG, M.carRed, 0, 0, 0, CAR);
for (const [x, z] of [[-1.4, 0.86], [1.45, 0.86], [-1.4, -0.86], [1.45, -0.86]]) { const t = add(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20), M.tyre, x, 0.36, z, CAR); t.rotation.x = Math.PI / 2; const rm = add(new THREE.CylinderGeometry(0.2, 0.2, 0.27, 12), M.rim, x, 0.36, z, CAR, { cast: false }); rm.rotation.x = Math.PI / 2; }
M.carGlass = new THREE.MeshStandardMaterial({ color: '#7ab8e0', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.72 }); M.carGlass.userData.keepStd = true;
const winS = new THREE.Shape(); winS.moveTo(-1.45, 1.1); winS.lineTo(0.85, 1.1); winS.lineTo(0.38, 1.52); winS.lineTo(-1.45, 1.53); winS.closePath();
const CWIN = add(new THREE.ShapeGeometry(winS), M.carGlass, 0, 0, 0.94, CAR, { cast: false });
add(box(0.06, 0.45, 0.02), M.tyre, -0.35, 1.31, 0.945, CAR, { cast: false });
for (const z of [0.55, -0.55]) add(box(0.05, 0.14, 0.32), new THREE.MeshBasicMaterial({ color: '#fff8d8' }), 2.37, 0.78, z, CAR, { cast: false });
// tempered window -> cubes
const NCX = 34, NCY = 12, CUBES = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.04, 0.03), new THREE.MeshStandardMaterial({ color: '#a8d8f0', roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.9 }), NCX * NCY);
CUBES.material.userData.keepStd = true; CUBES.frustumCulled = false; CUBES.visible = false; CAR.add(CUBES); const CUB0 = [], CUBV = [];
for (let i = 0; i < NCX; i++) for (let j = 0; j < NCY; j++) { const x = -1.45 + (i + 0.5) / NCX * 2.3, y = 1.1 + (j + 0.5) / NCY * 0.43; const maxX = 0.85 - (y - 1.1) / 0.43 * 0.47; CUB0.push(new THREE.Vector3(x, y, 0.95)); CUBV.push(new THREE.Vector3((RP() - 0.5) * 0.6, RP() * 0.4, 0.3 + RP() * 0.9)); if (x > maxX) CUB0[CUB0.length - 1].y = -50; }
const setCubes = (t) => { for (let i = 0; i < CUB0.length; i++) { const p = CUB0[i], v = CUBV[i], d = Math.max(0, t - Math.abs(p.x - 0.6) * 0.05); let y = p.y + v.y * d - 4.9 * d * d; const fl = 0.04 + (i % 7) * 0.012; let z = p.z + v.z * d; if (y < fl) { y = fl; z = p.z + v.z * Math.min(d, 1.2); }
  _o.position.set(p.x + v.x * d, y, z); _o.rotation.set(d * (3 + i % 5), d * (2 + i % 3), 0); _o.scale.setScalar(p.y < -10 ? 0 : 1); _o.updateMatrix(); CUBES.setMatrixAt(i, _o.matrix); } CUBES.instanceMatrix.needsUpdate = true; };
const EHAM = new THREE.Group(); CAR.add(EHAM); add(box(0.22, 0.05, 0.05), toon({ color: '#ff3b20' }), 0.11, 0, 0, EHAM); add(new THREE.ConeGeometry(0.03, 0.08, 8), M.steelD, 0.25, 0, 0, EHAM).rotation.z = -Math.PI / 2;
const R_stFill = new THREE.PointLight('#fff4e0', 0, 16, 1.0); R_stFill.position.set(1, 3, 5); R_ST.add(R_stFill);
