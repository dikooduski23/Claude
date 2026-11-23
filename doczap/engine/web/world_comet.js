// ================= COMET (1954): jet in the sky (y = 220 over origin), Farnborough hangar + water tank (x = 2300), sea (x = 2400), modern cabin (x = 2450) =================
M.jetWhite = toon({ color: '#f4f6f8' }); M.jetBlue = toon({ color: '#1f4fa0' }); M.jetSilver = toon({ color: '#c2c8d0' }); M.jetDark = toon({ color: '#2a3038' });
M.crack = new THREE.MeshBasicMaterial({ color: '#ff5a2a' });
const makeJet = () => { const J = new THREE.Group();
  const body = add(new THREE.CylinderGeometry(0.55, 0.55, 7.2, 28), M.jetWhite, 0, 0, 0, J); body.rotation.z = Math.PI / 2;
  const belly = add(new THREE.CylinderGeometry(0.552, 0.552, 7.2, 28, 1, true, Math.PI * 0.62, Math.PI * 0.76), M.jetSilver, 0, 0, 0, J, { cast: false }); belly.rotation.z = Math.PI / 2;
  const stripe = add(new THREE.CylinderGeometry(0.556, 0.556, 7.0, 28, 1, true, Math.PI * 0.42, Math.PI * 0.1), M.jetBlue, 0, 0, 0, J, { cast: false }); stripe.rotation.z = Math.PI / 2;
  const stripe2 = add(new THREE.CylinderGeometry(0.556, 0.556, 7.0, 28, 1, true, Math.PI * 1.48, Math.PI * 0.1), M.jetBlue, 0, 0, 0, J, { cast: false }); stripe2.rotation.z = Math.PI / 2;
  const nose = add(new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.jetWhite, 3.6, 0, 0, J); nose.rotation.z = -Math.PI / 2; nose.scale.set(1, 1.9, 1);
  const tail = add(new THREE.ConeGeometry(0.55, 2.6, 24), M.jetWhite, -4.9, 0.12, 0, J); tail.rotation.z = Math.PI / 2;
  add(box(0.5, 0.18, 0.62), M.jetDark, 4.25, 0.3, 0, J, { cast: false });                  // cockpit glazing
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const w = add(new THREE.PlaneGeometry(0.2, 0.17), M.jetDark, 2.4 - i * 0.62, 0.12, s * 0.558, J, { cast: false }); w.rotation.y = s > 0 ? 0 : Math.PI; }
  const adf = add(box(0.32, 0.03, 0.2), M.jetDark, 2.6, 0.55, 0, J, { cast: false });         // the small roof window (ADF)
  const crack = add(box(1, 0.035, 0.03), M.crack, 2.6, 0.56, 0.1, J, { cast: false }); crack.visible = false; crack.userData.ndSkip = true;
  const wingShape = new THREE.Shape(); wingShape.moveTo(0.9, 0); wingShape.lineTo(-0.9, 0); wingShape.lineTo(-2.5, 5.6); wingShape.lineTo(-1.7, 5.6); wingShape.closePath();
  const wg = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1, bevelEnabled: false });
  for (const s of [-1, 1]) { const wm = add(wg, M.jetSilver, 0.2, -0.28, 0, J); wm.rotation.x = s > 0 ? Math.PI / 2 : -Math.PI / 2; wm.position.z = 0;
    const eng = add(new THREE.CylinderGeometry(0.2, 0.24, 1.3, 16), M.jetSilver, 0.5, -0.24, s * 0.95, J); eng.rotation.z = Math.PI / 2; add(new THREE.CircleGeometry(0.19, 16), M.jetDark, 1.16, -0.24, s * 0.95, J, { cast: false }).rotation.y = Math.PI / 2; }
  const finS = new THREE.Shape(); finS.moveTo(0, 0); finS.lineTo(-1.4, 0); finS.lineTo(-1.7, 1.6); finS.lineTo(-1.1, 1.6); finS.closePath();
  add(new THREE.ExtrudeGeometry(finS, { depth: 0.06, bevelEnabled: false }), M.jetWhite, -4.4, 0.3, -0.03, J);
  const hs = new THREE.Shape(); hs.moveTo(0, 0); hs.lineTo(-0.8, 0); hs.lineTo(-1.1, 1.7); hs.lineTo(-0.7, 1.7); hs.closePath();
  for (const s of [-1, 1]) { const h = add(new THREE.ExtrudeGeometry(hs, { depth: 0.05, bevelEnabled: false }), M.jetSilver, -4.6, 0.1, 0, J); h.rotation.x = s > 0 ? Math.PI / 2 : -Math.PI / 2; }
  J.userData = { crack, adf, body }; return J; };
const SKYJ = makeJet(); SKYJ.position.set(0, 220, 0); scene.add(SKYJ);
const skyClouds = []; { const r = P.rng(321);
  for (let i = 0; i < 22; i++) { const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0; pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, (i % 12) + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 18 + r() * 40; m.userData.base = [Math.cos(a) * d, 220 - 6 - r() * 18, Math.sin(a) * d - 10]; m.position.set(...m.userData.base); m.scale.setScalar(14 + r() * 16); m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); skyClouds.push(m); } }
// ---- Farnborough hangar + the water tank (x = 2300) ----
const HG = new THREE.Group(); HG.position.set(2300, 0, 0); scene.add(HG);
const corrC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#8a98a4'; g.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 16) { g.fillStyle = (x / 16) % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.10)'; g.fillRect(x, 0, 8, H); } });
M.corr = texM(corrC, 1, 1, '#ffffff'); M.concrete = texM(P.plaster(130, 30), 1, 1, '#b8b4aa'); M.tankSteel = toon({ color: '#3a6a8a' }); M.yellowB = toon({ color: '#f0b81a' });
M.water = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#3aa0d8', transparent: true, opacity: 0.55, depthWrite: false });
add(tbox(44, 0.3, 30, 2), M.concrete, 0, -0.15, -4, HG, { cast: false });
for (const [x, z, w, d] of [[0, -19, 44, 0.3], [-22, -4, 0.3, 30], [22, -4, 0.3, 30]]) add(tbox(w, 16, d, 3), M.corr, x, 8, z, HG);
for (let k = 0; k < 7; k++) { const tr = add(box(44, 0.4, 0.4), M.steelD, 0, 15.5, -17 + k * 4.5, HG, { cast: false }); }
for (const x of [-15, -5, 5, 15]) { const sk = add(box(4, 0.05, 26), new THREE.MeshBasicMaterial({ color: '#eaf4ff' }), x, 15.9, -4, HG, { cast: false }); }
const hgFill = new THREE.PointLight('#f4f8ff', 0, 60, 0.9); hgFill.position.set(0, 13, 8); HG.add(hgFill);
const hgFill2 = new THREE.PointLight('#fff2dc', 0, 50, 1.0); hgFill2.position.set(-8, 12, -10); HG.add(hgFill2);
// tank: open-topped steel box 26 x 6 x 9 with the wings poking through its sides
const TK = new THREE.Group(); TK.position.set(0, 0, -5); HG.add(TK);
for (const [x, z, w, d] of [[0, -4.5, 26, 0.25], [0, 4.5, 26, 0.25], [-13, 0, 0.25, 9], [13, 0, 0.25, 9]]) add(box(w, 6, d), M.tankSteel, x, 3, z, TK);
for (let i = -12; i <= 12; i += 2) { add(box(0.12, 6.05, 0.3), M.steelD, i, 3, 4.62, TK, { cast: false }); }
add(box(26.4, 0.3, 9.4), M.yellowB, 0, 6.1, 0, TK, { cast: false });
const water = add(box(25.6, 5.4, 8.6), M.water, 0, 2.8, 0, TK, { cast: false }); water.userData.ndSkip = true;
const waterTop = add(new THREE.PlaneGeometry(25.6, 8.6), new THREE.MeshToonMaterial({ gradientMap: grad, color: '#5ac0f0', transparent: true, opacity: 0.6 }), 0, 5.5, 0, TK, { cast: false }); waterTop.rotation.x = -Math.PI / 2;
const TJ = makeJet(); TJ.scale.setScalar(3.0); TJ.position.set(0, 9, 0); TK.add(TJ);
// gantry crane + cables
for (const x of [-11, 11]) add(box(0.5, 13, 0.5), M.yellowB, x, 6.5, -5.4, TK); add(box(23, 0.6, 0.6), M.yellowB, 0, 13, -5.4, TK);
add(box(1.2, 13, 0.6), M.yellowB, 0, 6.5, -5.4, TK, { cast: false }).visible = false;
const cables = []; for (const x of [-6, 6]) { const c = add(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), M.jetDark, x, 11, 0, TK, { cast: false }); cables.push(c); }
const beam = add(box(23, 0.5, 0.5), M.yellowB, 0, 13, 0, TK); for (const x of [-11, 11]) add(box(0.5, 0.5, 5.4), M.yellowB, x, 13, -2.7, TK);
// pump room: pipes + pressure gauge
add(new THREE.CylinderGeometry(0.35, 0.35, 10, 12), M.steelD, 14.5, 1.0, -2, TK).rotation.x = Math.PI / 2; add(box(2, 2.4, 2), M.tankSteel, 15.5, 1.2, 2.5, TK);
const gaugeC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#f4efe0'; g.beginPath(); g.arc(256, 256, 240, 0, 7); g.fill(); g.lineWidth = 18; g.strokeStyle = '#2a2a30'; g.stroke(); g.lineWidth = 6;
  for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i * Math.PI * 0.15; g.beginPath(); g.moveTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); g.lineTo(256 + Math.cos(a) * 170, 256 + Math.sin(a) * 170); g.stroke(); }
  g.fillStyle = '#c0303a'; g.beginPath(); g.arc(256, 256, 200, Math.PI * 0.05, Math.PI * 0.25); g.arc(256, 256, 175, Math.PI * 0.25, Math.PI * 0.05, true); g.fill(); g.fillStyle = '#222'; g.font = '700 54px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillText('PSI', 256, 380); });
const gauge = add(new THREE.CircleGeometry(1.2, 32), new THREE.MeshBasicMaterial({ map: P.tex(gaugeC) }), 15.5, 3.2, 3.55, TK, { cast: false });
const needle = add(box(0.06, 1.0, 0.04), M.crack, 15.5, 3.2, 3.6, TK, { cast: false }); needle.geometry.translate(0, 0.45, 0);
// ---- grey sea (x = 2400) ----
const SEA = new THREE.Group(); SEA.position.set(2400, 0, 0); scene.add(SEA);
const seaC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#4a6a80'; g.fillRect(0, 0, W, H); const r = P.rng(9); for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H; g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.14)' : 'rgba(0,20,40,.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 4, x + 22, y); g.stroke(); } });
const seaTex = P.tex(seaC); seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.repeat.set(30, 30);
const seaP = add(new THREE.PlaneGeometry(600, 600), new THREE.MeshToonMaterial({ gradientMap: grad, map: seaTex, color: '#ffffff' }), 0, 0, 0, SEA, { cast: false }); seaP.rotation.x = -Math.PI / 2;
// ---- modern cabin (x = 2450) ----
const CB = new THREE.Group(); CB.position.set(2450, 0, 0); scene.add(CB);
const cabWall = add(new THREE.CylinderGeometry(1.9, 1.9, 16, 32, 1, true, Math.PI * 0.15, Math.PI * 1.2), toon({ color: '#eceff2', side: THREE.BackSide }), 0, 1.2, -4, CB); cabWall.rotation.x = Math.PI / 2; cabWall.rotation.y = Math.PI / 2;
add(box(3.6, 0.1, 16), toon({ color: '#5a6a80' }), 0, 0, -4, CB, { cast: false });
const roundWinC = cvs(256, 384, (g, W, H) => { g.fillStyle = '#d8dde2'; g.fillRect(0, 0, W, H); g.save(); g.beginPath(); g.roundRect(40, 40, 176, 304, 88); g.clip(); const gr = g.createLinearGradient(0, 40, 0, 344); gr.addColorStop(0, '#5aa8f0'); gr.addColorStop(1, '#d8ecff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.9)'; for (const [x, y, r] of [[90, 250, 40], [140, 240, 50], [190, 262, 36]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.restore(); g.lineWidth = 14; g.strokeStyle = '#b8c0c8'; g.beginPath(); g.roundRect(40, 40, 176, 304, 88); g.stroke(); });
const RW = []; for (let i = 0; i < 6; i++) { const w = add(new THREE.PlaneGeometry(0.42, 0.63), new THREE.MeshBasicMaterial({ map: P.tex(roundWinC), transparent: true }), -1.62, 1.35, -0.5 - i * 1.6, CB, { cast: false }); w.rotation.y = Math.PI / 2 - 0.25; RW.push(w); }
for (let i = 0; i < 6; i++) for (const x of [-1.0, -0.45, 0.45, 1.0]) { const seat = add(box(0.5, 1.1, 0.5), toon({ color: '#2a4a8a' }), x, 0.55, -0.1 - i * 1.6, CB); }
add(box(3.4, 0.45, 15), toon({ color: '#f4f6f8' }), 0, 2.55, -4, CB, { cast: false });
const cbFill = new THREE.PointLight('#f4f8ff', 0, 14, 1.0); cbFill.position.set(0.3, 2.3, 1.5); CB.add(cbFill);
