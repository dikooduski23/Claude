// ================= 1816 PARIS WARD (world x = 2200): Hôpital Necker — long ward, curtained beds, arched windows; workbench corner. MODERN corridor (x = 2240) =================
const WD = new THREE.Group(); WD.position.set(2200, 0, 0); scene.add(WD);
const stoneC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#c8b898'; g.fillRect(0, 0, W, H); const s = 128; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = (i * 3 + j * 5) % 6; g.fillStyle = `rgb(${196 + v * 4},${182 + v * 4},${150 + v * 3})`; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); } });
const curtC = cvs(256, 512, (g, W, H) => { g.fillStyle = '#f4eee0'; g.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, 'rgba(0,0,0,.10)'); gr.addColorStop(0.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.10)'); g.fillStyle = gr; g.fillRect(x, 0, 32, H); } });
M.stoneF = texM(stoneC, 1, 1, '#ffffff'); M.wardW = texM(P.plaster(101, 30), 1, 1, '#f6e8cc'); M.curt = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(curtC), color: '#ffffff', side: THREE.DoubleSide });
M.paper = toon({ color: '#f6f2e6' }); M.woodT = toon({ color: '#b07a40' }); M.bedW = toon({ color: '#7a4a28' });
add(tbox(10, 0.3, 14, 2), M.stoneF, 0, -0.15, -1.5, WD, { cast: false });
for (const [x, z, w, d] of [[0, -8.5, 10, 0.3], [-5, -1.5, 0.3, 14], [5, -1.5, 0.3, 14]]) add(tbox(w, 5.6, d, 2.2), M.wardW, x, 2.8, z, WD);
add(tbox(10, 0.3, 14, 2), M.wardW, 0, 5.6, -1.5, WD, { cast: false });
for (let k = 0; k < 4; k++) add(box(10, 0.35, 0.35), M.darkWood, 0, 5.3, -7 + k * 3, WD, { cast: false });
// arched windows along the left wall
for (const z of [-6.5, -3.5, -0.5, 2.5]) { const wc = skyPane(1.3, 2.6); const w = add(new THREE.PlaneGeometry(1.3, 2.6), new THREE.MeshBasicMaterial({ map: P.tex(wc) }), -4.84, 3.0, z, WD, { cast: false }); w.rotation.y = Math.PI / 2;
  const arch = add(new THREE.CircleGeometry(0.65, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ map: P.tex(wc) }), -4.84, 4.3, z, WD, { cast: false }); arch.rotation.y = Math.PI / 2;
  add(box(0.1, 2.7, 0.1), M.timber, -4.8, 3.0, z, WD, { cast: false }); add(box(0.1, 0.1, 1.35), M.timber, -4.8, 3.0, z, WD, { cast: false });
  shaft(WD, [-4.7, 3.6, z], [1.6, 0.0, 0.0], 0.5, 1.4, '#fff2d4', 0.14); }
// two rows of curtained beds
const wardBed = (x, z, rot) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = rot; WD.add(b);
  add(box(1.0, 0.5, 2.0), M.bedW, 0, 0.3, 0, b); add(box(0.95, 0.16, 1.95), M.sheet, 0, 0.62, 0, b); add(box(0.98, 0.1, 1.2), toon({ color: ['#c8d8f0', '#e8c8a0', '#d0e8c8'][Math.abs(Math.round(x * 3 + z)) % 3] }), 0, 0.73, 0.35, b, { cast: false });
  const pw = add(new THREE.SphereGeometry(0.22, 12, 8), M.sheet, 0, 0.76, -0.75, b); pw.scale.set(1.6, 0.45, 0.8);
  for (const s of [-1, 1]) for (const zz of [-1, 1]) add(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 6), M.darkWood, s * 0.5, 1.1, zz * 1.0, b, { cast: false });
  add(box(1.05, 0.05, 2.05), M.darkWood, 0, 2.2, 0, b, { cast: false });
  const c1 = add(new THREE.PlaneGeometry(2.0, 1.6), M.curt, -0.5, 1.4, 0, b, { cast: false }); c1.rotation.y = Math.PI / 2;
  const c2 = add(new THREE.PlaneGeometry(1.0, 1.6), M.curt, 0, 1.4, -1.0, b, { cast: false }); return b; };
const WBEDS = []; for (let i = 0; i < 4; i++) { WBEDS.push(wardBed(-3.4, -6.5 + i * 2.6, Math.PI / 2)); WBEDS.push(wardBed(3.4, -6.5 + i * 2.6, -Math.PI / 2)); }
// workbench corner (front right) with wooden tubes, shavings, a lathe-ish wheel
const wb = new THREE.Group(); wb.position.set(1.6, 0, 2.8); WD.add(wb);
add(box(1.8, 0.1, 0.8), M.woodT, 0, 0.9, 0, wb); for (const [x, z] of [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]]) add(box(0.08, 0.9, 0.08), M.bedW, x, 0.45, z, wb, { cast: false });
for (let i = 0; i < 3; i++) { const t = add(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 14), M.woodT, -0.5 + i * 0.18, 0.99, -0.15, wb, { cast: false }); t.rotation.z = Math.PI / 2; }
for (let i = 0; i < 14; i++) { const sh = add(new THREE.TorusGeometry(0.03, 0.006, 4, 10, Math.PI * 1.5), toon({ color: '#e0b070' }), -0.3 + (i * 37 % 60) / 100, 0.955, 0.05 + (i * 13 % 25) / 100, wb, { cast: false }); sh.rotation.x = Math.PI / 2; }
const wheel = add(new THREE.TorusGeometry(0.28, 0.035, 8, 24), M.ironB, 0.65, 1.25, -0.25, wb); 
// the rolled paper tube (positioned per shot)
const ptube = add(new THREE.CylinderGeometry(0.045, 0.045, 1, 18, 1, true), M.paper, 0, 0, 0, WD, { cast: false }); ptube.material = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#f6f2e6', side: THREE.DoubleSide }); ptube.visible = false;
const wdFill = new THREE.PointLight('#fff0dc', 0, 16, 1.0); wdFill.position.set(0.5, 4.6, 3.5); WD.add(wdFill);
const wdBack = new THREE.PointLight('#ffe6c0', 0, 12, 1.2); wdBack.position.set(0, 4.0, -5.5); WD.add(wdBack);
// ---------------- MODERN hospital corridor (x = 2240) ----------------
const MC = new THREE.Group(); MC.position.set(2240, 0, 0); scene.add(MC);
add(tbox(6, 0.3, 16, 2), toon({ color: '#d4dfe4' }), 0, -0.15, -3, MC, { cast: false });
for (const [x, z, w, d] of [[-3, -3, 0.3, 16], [3, -3, 0.3, 16], [0, -11, 6, 0.3]]) { add(tbox(w, 1.2, d, 2), toon({ color: '#5ab0c8' }), x, 0.6, z, MC); add(tbox(w, 2.8, d, 2), toon({ color: '#eef6f8' }), x, 2.6, z, MC); }
add(tbox(6, 0.3, 16, 2), toon({ color: '#f6fafc' }), 0, 4.0, -3, MC, { cast: false });
const mcLights = []; for (let k = 0; k < 6; k++) { const l = add(box(1.2, 0.04, 0.4), M.lampGlow, 0, 3.84, 2 - k * 2.4, MC, { cast: false }); mcLights.push(l); }
for (const z of [-1, -5, -9]) add(box(0.06, 2.2, 1.1), toon({ color: '#3a8ab0' }), 2.84, 1.1, z, MC, { cast: false });
const mcFill = new THREE.PointLight('#f6fcff', 0, 16, 1.0); mcFill.position.set(0, 3.5, 3); MC.add(mcFill);
