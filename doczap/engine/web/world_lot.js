// ================= LOTTERY MAN (1992): warehouse (x=17000), TV draw studio (x=17400), gas station at night (x=17800), office (x=18200) =================
const LRG = P.rng(1992);
const LGLASS = (col = '#e6f4ff', op = 0.3) => { const m = new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: op, roughness: 0.05, metalness: 0.1 }); m.userData.keepStd = true; return m; };
const LSETS = [];
// lottery ticket slip (generic, no real logo): pink/white with a printed grid and a number row
const tickC = cvs(160, 96, (g, W, H) => { g.fillStyle = '#fbf6ec'; g.fillRect(0, 0, W, H); g.fillStyle = '#e04a6a'; g.fillRect(0, 0, W, 18); g.fillStyle = '#2a5ab0'; g.fillRect(0, H - 10, W, 10); g.strokeStyle = 'rgba(224,74,106,.6)'; g.lineWidth = 1.5;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { g.strokeRect(10 + c * 17, 26 + r * 14, 12, 10); if ((r * 8 + c) % 5 === 1) { g.fillStyle = '#1e1e28'; g.fillRect(12 + c * 17, 28 + r * 14, 8, 6); } } });
M.tick = toon({ map: P.tex(tickC), color: '#ffffff' }); const TICKG = new THREE.BoxGeometry(0.14, 0.003, 0.085);
const tickField = (parent, pts) => { const m = new THREE.InstancedMesh(TICKG, M.tick, pts.length); const d = new THREE.Object3D(); pts.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.rotation.set(p[3] || 0, p[4] || 0, p[5] || 0); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
  m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; parent.add(m); const set = { m, n: pts.length, setK: (k) => { m.count = Math.max(0, Math.min(pts.length, Math.round(pts.length * k))); } }; LSETS.push(set); return set; };
const moundPts = (cx, cy, cz, rx, rz, h, n, seed) => { const r = P.rng(seed), out = []; for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); const x = cx + Math.cos(a) * rx * d, z = cz + Math.sin(a) * rz * d; const top = h * (1 - d * d);
  out.push([x, cy + top * (0.85 + 0.15 * r()), z, (r() - 0.5) * 0.9, r() * 6, (r() - 0.5) * 0.9]); } return out; };
// lotto ball with a number (canvas)
const ballTex = {}; const ballM = (n, col) => { const k = n + col; if (ballTex[k]) return ballTex[k]; const c = cvs(128, 64, (g, W, H) => { g.fillStyle = col; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(32, 32, 20, 0, 7); g.fill(); g.arc(96, 32, 20, 0, 7); g.fill(); g.fillStyle = '#1e1e28'; g.font = '900 24px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 32, 33); g.fillText(String(n), 96, 33); });
  return (ballTex[k] = toon({ map: P.tex(c), color: '#ffffff', emissive: col, emissiveIntensity: 0.25 })); };
const BALLCOL = ['#ff4a5a', '#ffd23f', '#3ab0ff', '#5adf6a', '#ff8a2a', '#c86aff'];
const WIN = [8, 11, 13, 15, 19, 20];
const crt = (parent, x, y, z, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); add(box(0.42, 0.36, 0.4), toon({ color: '#d8d2c0' }), 0, 0.18, 0, g); const s = add(box(0.32, 0.25, 0.02), hdr('#7ab8ff', 0.8), 0, 0.2, 0.205, g, { cast: false }); s.userData.ndSkip = true; add(box(0.46, 0.04, 0.18), toon({ color: '#d8d2c0' }), 0, 0.0, 0.32, g); return g; };
const printer = (parent, x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g); add(box(0.9, 0.72, 0.6), M.darkWood, 0, 0.36, 0, g); add(box(0.55, 0.3, 0.45), toon({ color: '#e8e4d8' }), 0, 0.87, 0, g); add(box(0.4, 0.02, 0.2), toon({ color: '#3a3a40' }), 0, 1.0, -0.05, g, { cast: false });
  const led = add(new THREE.SphereGeometry(0.012, 6, 5), hdr('#7aff7a', 2), 0.22, 0.95, 0.23, g, { cast: false }); led.userData.ndSkip = true; return g; };
// ---------- WAREHOUSE (Melbourne): concrete, steel, fluorescent tubes, printers, a mountain of tickets ----------
const WARE = new THREE.Group(); WARE.position.set(17000, 0, 0); scene.add(WARE);
M.conc = texM(cvs(256, 256, (g, W, H) => { g.fillStyle = '#9a9a96'; g.fillRect(0, 0, W, H); const r = P.rng(3); for (let i = 0; i < 600; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * W, r() * H, 3, 3); } g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 2; g.strokeRect(0, 0, W, H); }), 6, 6);
M.corr = texM(cvs(128, 128, (g, W, H) => { for (let x = 0; x < W; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#6a8aa8'); gr.addColorStop(0.5, '#9ab8d0'); gr.addColorStop(1, '#6a8aa8'); g.fillStyle = gr; g.fillRect(x, 0, 16, H); } }), 8, 2);
add(tbox(14, 0.3, 12, 1), M.conc, 0, -0.15, -2, WARE, { cast: false });
for (const [x, z, w, d] of [[0, -8, 14, 0.3], [-7, -2, 0.3, 12], [7, -2, 0.3, 12]]) add(tbox(w, 5, d, 1), M.corr, x, 2.5, z, WARE);
add(tbox(14, 0.3, 12, 1), toon({ color: '#5a6a7a' }), 0, 5.15, -2, WARE, { cast: false });
for (let i = 0; i < 5; i++) { add(box(14, 0.2, 0.15), toon({ color: '#c84a2a' }), 0, 4.6, -6 + i * 2.4, WARE, { cast: false }); const t = add(box(0.18, 0.06, 1.6), hdr('#f2f8ff', 1.6), -2.5 + (i % 2) * 5, 4.4, -6 + i * 2.4, WARE, { cast: false }); t.userData.ndSkip = true; }
const PRINTERS = []; for (let i = 0; i < 6; i++) { PRINTERS.push(printer(WARE, -5.6, -5.5 + i * 1.3, Math.PI / 2)); PRINTERS.push(printer(WARE, 5.6, -5.5 + i * 1.3, -Math.PI / 2)); }
for (let i = 0; i < 6; i++) { const d = new THREE.Group(); d.position.set(-3.2 + (i % 3) * 3.2, 0, -6.8 + Math.floor(i / 3) * 0.0); WARE.add(d); add(box(1.4, 0.05, 0.7), M.timber, 0, 0.75, 0, d); for (const sx of [-0.65, 0.65]) add(box(0.05, 0.73, 0.65), M.ironK, sx, 0.37, 0, d); crt(d, -0.35, 0.78, -0.05, 0); crt(d, 0.35, 0.78, -0.05, 0); }
const ticketMound = tickField(WARE, moundPts(0, 0, -1.6, 2.0, 1.4, 1.5, 6500, 11));
const boxM = toon({ color: '#c89a6a' }); const TBOXES = []; for (let i = 0; i < 40; i++) { const r = LRG(); const b = add(box(0.5, 0.36, 0.4), boxM, (i < 20 ? -3.6 : 3.6) + ((i % 4) - 1.5) * 0.52, 0.18 + Math.floor((i % 20) / 4) * 0.37, -3.4 + (i % 2) * 0.1, WARE); b.rotation.y = (r - 0.5) * 0.15; TBOXES.push(b); }
const rainT = tickField(WARE, Array.from({ length: 160 }, () => [0, -5, 0])); // falling tickets (moved per frame)
const BALLS = WIN.map((n, i) => { const b = add(new THREE.SphereGeometry(0.16, 20, 14), ballM(n, BALLCOL[i]), 0, 0, 0, WARE, { cast: false }); return b; });
const wFillL = new THREE.PointLight('#f2f8ff', 0, 18, 1.0); wFillL.position.set(0, 4.0, 1.5); WARE.add(wFillL);
const wGlow = new THREE.PointLight('#ffd890', 0, 5, 1.4); wGlow.position.set(0, 2.6, -1.2); WARE.add(wGlow);
// Mandel's corner desk (the "eureka" shot)
const MDESK = new THREE.Group(); MDESK.position.set(-4.2, 0, 1.2); WARE.add(MDESK); add(box(1.6, 0.05, 0.8), M.darkWood, 0, 0.76, 0, MDESK); for (const [x, z] of [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]]) add(box(0.05, 0.74, 0.05), M.darkWood, x, 0.37, z, MDESK);
crt(MDESK, -0.4, 0.79, -0.1, 0.25); add(box(0.32, 0.01, 0.42), toon({ color: '#fbf8f0' }), 0.2, 0.79, 0.05, MDESK, { cast: false }).rotation.y = 0.2; add(box(0.14, 0.03, 0.2), toon({ color: '#3a3a40' }), 0.55, 0.8, 0.1, MDESK);
const lampD = add(new THREE.ConeGeometry(0.14, 0.18, 14, 1, true), toon({ color: '#2a6a4a', side: THREE.DoubleSide }), 0.6, 1.25, -0.2, MDESK, { cast: false }); add(new THREE.CylinderGeometry(0.01, 0.01, 0.45, 5), M.brass, 0.6, 1.0, -0.2, MDESK, { cast: false });
const dskL = new THREE.PointLight('#ffd8a0', 0, 3, 1.5); dskL.position.set(0.6, 1.1, -0.1); MDESK.add(dskL);
// ---------- TV DRAW STUDIO (1992): blue starry backdrop, ball drum, rack of drawn balls ----------
const TVS = new THREE.Group(); TVS.position.set(17400, 0, 0); scene.add(TVS);
add(tbox(10, 0.3, 8, 1), toon({ color: '#2a2a4a' }), 0, -0.15, -1, TVS, { cast: false });
const starC = cvs(512, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a2a8a'); gr.addColorStop(1, '#5a2aa0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); const r = P.rng(9); for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, s = 2 + r() * 6; g.fillStyle = r() > 0.6 ? '#ffd23f' : '#ffffff'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? s * 0.45 : s; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); } });
const back = add(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ map: P.tex(starC), color: new THREE.Color(1.15, 1.15, 1.15) }), 0, 2.5, -4.5, TVS, { cast: false });
const stage = add(new THREE.CylinderGeometry(2.4, 2.5, 0.25, 40), toon({ color: '#c8a040' }), 0, 0.12, -1.8, TVS); add(new THREE.TorusGeometry(2.45, 0.04, 6, 48), hdr('#ffd23f', 1.4), 0, 0.25, -1.8, TVS, { cast: false }).rotation.x = Math.PI / 2;
const DRUM = new THREE.Group(); DRUM.position.set(0.2, 1.45, -1.9); TVS.add(DRUM); add(new THREE.SphereGeometry(0.62, 32, 22), LGLASS('#dff4ff', 0.22), 0, 0, 0, DRUM, { cast: false }); add(new THREE.TorusGeometry(0.63, 0.025, 6, 40), M.brass, 0, 0, 0, DRUM, { cast: false }); add(new THREE.CylinderGeometry(0.08, 0.14, 1.2, 12), M.brass, 0, -0.9, 0, DRUM);
const DBALLS = []; for (let i = 0; i < 26; i++) { const n = 1 + ((i * 7) % 44); const b = add(new THREE.SphereGeometry(0.075, 14, 10), ballM(n, BALLCOL[i % 6]), 0, 0, 0, DRUM, { cast: false }); DBALLS.push({ b, ph: LRG() * 6, sp: 0.6 + LRG() * 0.8, r: 0.25 + LRG() * 0.27 }); }
const chute = add(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 12, 1, true), LGLASS('#dff4ff', 0.3), 0.75, 1.0, -1.9, TVS, { cast: false }); chute.rotation.z = 0.9;
const RACK = new THREE.Group(); RACK.position.set(1.15, 0.95, -1.4); TVS.add(RACK); add(box(1.5, 0.06, 0.24), M.brass, 0, 0, 0, RACK);
const RBALLS = WIN.map((n, i) => add(new THREE.SphereGeometry(0.1, 18, 12), ballM(n, BALLCOL[i]), -0.62 + i * 0.25, 0.13, 0, RACK, { cast: false }));
for (const x of [-3, 3]) { const sp = new THREE.Group(); sp.position.set(x, 0, 0.5); TVS.add(sp); add(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), M.ironK, 0, 1.3, 0, sp); const hd = add(new THREE.CylinderGeometry(0.18, 0.25, 0.4, 14), toon({ color: '#2a2a30' }), 0, 2.7, 0, sp); hd.rotation.x = 0.9; hd.rotation.z = -Math.sign(x) * 0.5; const lens = add(new THREE.CircleGeometry(0.17, 16), hdr('#fff4d8', 2.2), Math.sign(x) * -0.12, 2.6, -0.18, sp, { cast: false }); lens.lookAt(new THREE.Vector3(0, 1.5, -2)); lens.userData.ndSkip = true; }
const tvSpot = new THREE.PointLight('#fff2d8', 0, 10, 1.1); tvSpot.position.set(0, 3.0, 1.5); TVS.add(tvSpot);
const tvBack = new THREE.PointLight('#8a6aff', 0, 8, 1.2); tvBack.position.set(0, 2.5, -3.5); TVS.add(tvBack);
// ---------- GAS STATION at night: canopy lights, pumps, store with neon OPEN, roll-down shutter, wall clock ----------
const GAS = new THREE.Group(); GAS.position.set(17800, 0, 0); scene.add(GAS);
M.lasph = texM(cvs(256, 256, (g, W, H) => { g.fillStyle = '#2e3036'; g.fillRect(0, 0, W, H); const r = P.rng(8); for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.fillRect(r() * W, r() * H, 2, 2); } }), 10, 10);
add(new THREE.PlaneGeometry(80, 80), M.lasph, 0, 0, 0, GAS, { cast: false }).rotation.x = -Math.PI / 2;
const canopy = add(box(7, 0.4, 4.5), toon({ color: '#f4f4f0' }), 0, 4.0, 1.6, GAS); add(box(7.05, 0.18, 4.55), toon({ color: '#e0302a' }), 0, 3.86, 1.6, GAS, { cast: false });
for (const x of [-2.6, 2.6]) add(box(0.3, 3.9, 0.3), toon({ color: '#e8e8ec' }), x, 1.95, 1.6, GAS);
for (let i = 0; i < 6; i++) { const lp = add(box(0.6, 0.04, 0.6), hdr('#fff8e8', 1.8), -2.2 + (i % 3) * 2.2, 3.78, 0.6 + Math.floor(i / 3) * 2.0, GAS, { cast: false }); lp.userData.ndSkip = true; }
for (const x of [-1.2, 1.2]) { const pm = new THREE.Group(); pm.position.set(x, 0, 1.6); GAS.add(pm); add(box(0.6, 0.25, 0.9), toon({ color: '#c8c8cc' }), 0, 0.12, 0, pm); add(box(0.45, 1.5, 0.6), toon({ color: '#e0302a' }), 0, 1.0, 0, pm); const scr = add(box(0.3, 0.2, 0.01), hdr('#7aff9a', 0.9), 0, 1.4, 0.31, pm, { cast: false }); scr.userData.ndSkip = true; }
const SHOP = new THREE.Group(); SHOP.position.set(0, 0, -3.2); GAS.add(SHOP); add(box(9, 3.2, 3.5), toon({ color: '#e8dcc4' }), 0, 1.6, -1.75, SHOP); add(box(9.1, 0.5, 3.6), toon({ color: '#2a5ab0' }), 0, 3.45, -1.75, SHOP);
const shopWinC = cvs(256, 128, (g, W, H) => { g.fillStyle = '#ffeec0'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8c890'; for (let i = 0; i < 4; i++) g.fillRect(10 + i * 62, 30, 50, 80); g.fillStyle = PROD(); function PROD() { return '#d05a3a'; } for (let i = 0; i < 16; i++) g.fillRect(14 + (i % 4) * 62 + (i % 2) * 20, 40 + Math.floor(i / 4) * 18, 14, 12); });
for (const x of [-3, 3]) { const w = add(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshBasicMaterial({ map: P.tex(shopWinC), color: new THREE.Color(1.5, 1.4, 1.2) }), x, 1.4, 0.02, SHOP, { cast: false }); w.userData.ndSkip = true; }
const doorG = add(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.5, 1.25) }), 0, 1.2, 0.02, SHOP, { cast: false }); doorG.userData.ndSkip = true;
const SHUT = new THREE.Group(); SHUT.position.set(0, 2.45, 0.08); SHOP.add(SHUT); const shutC = cvs(64, 256, (g, W, H) => { for (let y = 0; y < H; y += 12) { g.fillStyle = '#9aa0aa'; g.fillRect(0, y, W, 10); g.fillStyle = '#6a7078'; g.fillRect(0, y + 10, W, 2); } });
const shutter = add(new THREE.PlaneGeometry(1.8, 2.5), toon({ map: P.tex(shutC), color: '#ffffff', side: THREE.DoubleSide }), 0, -1.25, 0, SHUT, { cast: false }); shutter.geometry.translate(0, -1.25, 0); shutter.position.y = 0; add(box(2.0, 0.25, 0.25), toon({ color: '#5a6068' }), 0, 0.1, 0.05, SHUT);
const neonC = cvs(256, 96, (g, W, H) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, W, H); g.shadowColor = '#ff3a5a'; g.shadowBlur = 18; g.strokeStyle = '#ff6a8a'; g.lineWidth = 8; g.beginPath(); g.roundRect(8, 8, W - 16, H - 16, 20); g.stroke(); g.font = '900 60px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd0dc'; g.fillText('OPEN', W / 2, H / 2 + 3); });
const neon = add(new THREE.PlaneGeometry(1.2, 0.45), new THREE.MeshBasicMaterial({ map: P.tex(neonC), transparent: true, color: new THREE.Color(1.8, 1.8, 1.8) }), 2.6, 2.6, 0.04, SHOP, { cast: false }); neon.userData.ndSkip = true;
const GCLK = new THREE.Group(); GCLK.position.set(-1.5, 2.65, 0.06); SHOP.add(GCLK); add(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 28), M.white, 0, 0, 0, GCLK).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(0.32, 0.03, 6, 28), toon({ color: '#1e1e28' }), 0, 0, 0.02, GCLK, { cast: false });
for (let i = 0; i < 12; i++) add(box(0.02, 0.06, 0.01), M.ironK, Math.sin(i * Math.PI / 6) * 0.26, Math.cos(i * Math.PI / 6) * 0.26, 0.035, GCLK, { cast: false });
const gHandM = add(box(0.018, 0.26, 0.01), M.ironK, 0, 0, 0.045, GCLK, { cast: false }); gHandM.geometry.translate(0, 0.12, 0); const gHandH = add(box(0.024, 0.17, 0.01), M.ironK, 0, 0, 0.05, GCLK, { cast: false }); gHandH.geometry.translate(0, 0.08, 0);
const VAN = new THREE.Group(); VAN.position.set(-4.2, 0, 2.6); VAN.rotation.y = 0.3; GAS.add(VAN); add(box(2.6, 1.5, 1.5), toon({ color: '#f2f2ee' }), 0, 1.1, 0, VAN); add(box(0.9, 1.0, 1.45), toon({ color: '#f2f2ee' }), 1.7, 0.85, 0, VAN); add(box(0.5, 0.45, 1.46), toon({ color: '#9fc4e0' }), 1.95, 1.2, 0, VAN, { cast: false });
for (const [wx, wz] of [[1.5, 0.76], [1.5, -0.76], [-0.8, 0.76], [-0.8, -0.76]]) { const w = add(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 14), M.ironK, wx, 0.3, wz, VAN); w.rotation.x = Math.PI / 2; }
const gasBoxes = []; for (let i = 0; i < 10; i++) gasBoxes.push(add(box(0.5, 0.36, 0.4), boxM, -1.6 + (i % 5) * 0.52, 0.18 + Math.floor(i / 5) * 0.37, 0.4, GAS));
const leftTix = tickField(GAS, moundPts(-2.4, 0, 0.5, 0.8, 0.5, 0.5, 900, 33));
const gCan = new THREE.PointLight('#fff4e0', 0, 12, 1.0); gCan.position.set(0, 3.5, 1.6); GAS.add(gCan);
const gShop = new THREE.PointLight('#ffe0a0', 0, 7, 1.2); gShop.position.set(0, 1.8, -2.4); GAS.add(gShop);
const gNeon = new THREE.PointLight('#ff4a6a', 0, 4, 1.5); gNeon.position.set(2.6, 2.4, -2.6); GAS.add(gNeon);
// ---------- OFFICE: agents search ticket boxes (left), the official's desk with the rule book (right) ----------
const OFF = new THREE.Group(); OFF.position.set(18200, 0, 0); scene.add(OFF);
add(tbox(10, 0.3, 7, 1), texM(P.planks(1992), 1, 4, '#8a6a4a'), 0, -0.15, 0, OFF, { cast: false });
for (const [x, z, w, d] of [[0, -3, 10, 0.3], [-5, 0, 0.3, 7], [5, 0, 0.3, 7]]) add(tbox(w, 3.4, d, 1), toon({ color: '#c8d0c0' }), x, 1.7, z, OFF);
add(tbox(10, 0.3, 7, 1), toon({ color: '#eceee6' }), 0, 3.55, 0, OFF, { cast: false });
const blindC = cvs(256, 256, (g, W, H) => { g.fillStyle = '#fff2d0'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8b890'; for (let y = 0; y < H; y += 16) g.fillRect(0, y, W, 9); g.strokeStyle = '#6a5a3a'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10); });
for (const x of [-2.4, 2.4]) { const w = add(new THREE.PlaneGeometry(1.6, 1.5), new THREE.MeshBasicMaterial({ map: P.tex(blindC), color: new THREE.Color(1.25, 1.2, 1.1) }), x, 2.0, -2.84, OFF, { cast: false }); shaft(OFF, [x, 2.4, -2.8], [x + 0.6, 0.0, -0.4], 0.5, 0.9, '#fff2d0', 0.07, 'lot'); }
for (let i = 0; i < 3; i++) { const fc = add(box(0.55, 1.35, 0.6), toon({ color: '#8a96a0' }), -4.4 + i * 0.6, 0.68, -2.5, OFF); for (let k = 0; k < 3; k++) add(box(0.2, 0.03, 0.02), M.ironK, -4.4 + i * 0.6, 0.35 + k * 0.42, -2.19, OFF, { cast: false }); }
const AT = new THREE.Group(); AT.position.set(-2.3, 0, -0.9); OFF.add(AT); add(box(2.2, 0.06, 1.0), M.darkWood, 0, 0.78, 0, AT); for (const [x, z] of [[-1.05, -0.45], [1.05, -0.45], [-1.05, 0.45], [1.05, 0.45]]) add(box(0.06, 0.76, 0.06), M.darkWood, x, 0.38, z, AT);
for (let i = 0; i < 5; i++) add(box(0.5, 0.36, 0.4), boxM, -0.8 + i * 0.4, 1.0 + (i % 2) * 0.0, -0.15 + (i % 2) * 0.25, AT).rotation.y = (i - 2) * 0.12;
const offTix = tickField(AT, moundPts(0.1, 0.81, 0.25, 0.7, 0.25, 0.08, 260, 44));
const ODESK = new THREE.Group(); ODESK.position.set(2.4, 0, -1.0); OFF.add(ODESK); add(box(1.8, 0.08, 0.9), M.darkWood, 0, 0.78, 0, ODESK); add(box(1.7, 0.74, 0.08), M.darkWood, 0, 0.38, -0.4, ODESK);
const BOOK = new THREE.Group(); BOOK.position.set(0.05, 0.83, 0.12); ODESK.add(BOOK); add(box(0.5, 0.09, 0.36), toon({ color: '#b02a2a' }), 0, 0.045, 0, BOOK); add(box(0.48, 0.08, 0.34), toon({ color: '#fbf6ea' }), 0.012, 0.045, 0, BOOK, { cast: false });
const bookLab = cvs(256, 160, (g, W, H) => { g.fillStyle = '#b02a2a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.fillStyle = '#ffd23f'; g.font = '900 40px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LOTTERY', W / 2, 60); g.fillText('RULES', W / 2, 110); });
add(new THREE.PlaneGeometry(0.46, 0.32), toon({ map: P.tex(bookLab), color: '#ffffff' }), 0, 0.092, 0, BOOK, { cast: false }).rotation.x = -Math.PI / 2;
add(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12), M.brass, -0.6, 0.88, 0.1, ODESK); const dlamp = add(new THREE.ConeGeometry(0.14, 0.16, 14, 1, true), toon({ color: '#2a6a4a', side: THREE.DoubleSide }), -0.6, 1.25, 0.0, ODESK, { cast: false });
const oFill = new THREE.PointLight('#fff2dc', 0, 14, 1.0); oFill.position.set(0, 3.0, 2.4); OFF.add(oFill);
const oLamp = new THREE.PointLight('#ffd8a0', 0, 3, 1.5); oLamp.position.set(-0.6, 1.1, 0.0); ODESK.add(oLamp);
lotState = function (W_, f) {
  const xr = !!W_.xray; for (const s of LSETS) s.m.visible = !xr;
  wFillL.intensity = W_.ware ? 3.2 : 0; wGlow.intensity = W_.ware ? 2.0 * (W_.glow ?? 0.6) : 0; dskL.intensity = W_.ware ? 1.6 : 0;
  tvSpot.intensity = W_.tvs ? 3.0 : 0; tvBack.intensity = W_.tvs ? 2.4 : 0; gCan.intensity = W_.gas ? 3.2 : 0; gShop.intensity = W_.gas ? 2.2 : 0; gNeon.intensity = W_.gas ? 2.0 * (0.85 + 0.15 * Math.sin(f * 0.7)) : 0;
  oFill.intensity = W_.off ? 2.6 : 0; oLamp.intensity = W_.off ? 1.4 : 0;
  ticketMound.setK(W_.mound ?? 1); leftTix.setK(W_.left ?? 0); offTix.setK(1);
  // ticket rain over the mound
  const rn = W_.rain; rainT.m.visible = rn != null && !xr; if (rn != null) { const d = new THREE.Object3D(); for (let i = 0; i < rainT.n; i++) { const r1 = ((i * 0.618) % 1), r2 = ((i * 0.377) % 1), t = (rn * 0.35 + r1) % 1;
      d.position.set(-2.4 + r2 * 4.8, 4.2 - t * 4.0, -3.0 + ((i * 0.211) % 1) * 3.6); d.rotation.set(t * 8 + i, i * 0.7, t * 6 + r2 * 3); d.updateMatrix(); rainT.m.setMatrixAt(i, d.matrix); } rainT.m.instanceMatrix.needsUpdate = true; }
  // floating glowing balls in the hook
  const bf = W_.balls; BALLS.forEach((b, i) => { b.visible = bf != null && !xr; if (bf != null) { const a = i / 6 * Math.PI * 2 + bf * 0.15; b.position.set(Math.cos(a) * 1.3, 2.6 + Math.sin(bf * 0.4 + i) * 0.15, -1.6 + Math.sin(a) * 0.6); b.rotation.set(bf * 0.3 + i, bf * 0.5, 0); } });
  // the drum tumbles; drawn balls appear in the rack one by one
  const dt = W_.drum ?? 0; DBALLS.forEach((o, i) => { const a = o.ph + dt * o.sp * 3; o.b.position.set(Math.cos(a) * o.r, Math.sin(a * 1.3) * o.r - 0.08, Math.sin(a) * o.r * 0.8); o.b.rotation.set(a, a * 0.7, 0); });
  const nr = W_.rack ?? 6; RBALLS.forEach((b, i) => { const s = Math.max(0, Math.min(1, nr - i)); b.visible = s > 0.02; b.scale.setScalar(Math.max(0.02, s)); });
  // the shutter rolls down; the clock races to midnight
  shutter.scale.y = Math.max(0.02, W_.shut ?? 0.02); shutter.visible = (W_.shut ?? 0) > 0.03;
  const ck = W_.clock ?? 0.8; gHandM.rotation.z = -ck * Math.PI * 2 * 6; gHandH.rotation.z = -(11 + ck) / 12 * Math.PI * 2;
  BOOK.position.y = 0.83 + (W_.bookY ?? 0); BOOK.rotation.z = (W_.bookY ?? 0) * 0.6;
};
