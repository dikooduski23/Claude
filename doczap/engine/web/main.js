import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt, LOOK } from './story.js';
import * as STORY from './story.js';            // optional episode hooks: sets(K), annotAt(f)
import { makeKit } from './kit/kit.js';
import { drawAnnotations, fontReady, canvas as AnnCanvas } from './kit/annot.js';

const RS = +(new URLSearchParams(location.search).get('rs') || 1); window.RS = RS;
const W = Math.round(1080 * RS), H = Math.round(1920 * RS);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.localClippingEnabled = true; // kit cross-sections

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const v = [118, 168, 212, 245, 255]; const d = new Uint8Array(v.flatMap((x) => [x, x, x, 255])); const t = new THREE.DataTexture(d, v.length, 1); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vec4 p = vec4(position,1.); vec3 nn = normal;
#ifdef USE_INSTANCING
 p = instanceMatrix*p; nn = mat3(instanceMatrix)*nn;
#endif
 vN = normalize(normalMatrix*nn); vec4 mv = modelViewMatrix*p; vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world: Lazzaro Spallanzani, Italy 1773 (Doc Zap Ep15, Rick's-Clips look, rich + 4K detail) ----------
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const ENV = { beams: [], candles: [], candleLights: [] };
// ---- shared helpers ----
const cvs = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
const mapM = (c, opts = {}) => new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(c), ...opts });
const beamTex = new THREE.CanvasTexture(cvs(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const g2 = g.createLinearGradient(0, 0, 64, 0); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(0.25, 'rgba(0,0,0,0)'); g2.addColorStop(0.75, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = g2; g.fillRect(0, 0, 64, 256); }));
const shaft = (parent, from, to, r0, r1, col, op, tag = 'day') => {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = new THREE.Vector3().subVectors(b, a), L = d.length();
  const geo = new THREE.CylinderGeometry(r0, r1, L, 24, 1, true); geo.translate(0, -L / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamTex, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.copy(a); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize()); m.userData.ndSkip = true; m.castShadow = false; m.renderOrder = 4; m.userData.tag = tag; parent.add(m); ENV.beams.push(m); return m; };
M.white = toon({ color: '#f6f4ee' }); M.fireCore = new THREE.MeshBasicMaterial({ color: '#fff0a0' }); M.fireHalo = new THREE.MeshBasicMaterial({ color: '#ffb84a', transparent: true, opacity: 0.25, depthWrite: false });
const candle = (parent, x, y, z, light = false, h = 0.16) => {
  add(new THREE.CylinderGeometry(0.035, 0.04, h, 10), M.white, x, y + h / 2, z, parent, { cast: false });
  const fl = add(new THREE.SphereGeometry(0.025, 8, 6), M.fireCore, x, y + h + 0.04, z, parent, { cast: false }); fl.scale.y = 1.8; fl.userData.ndSkip = true; ENV.candles.push(fl);
  const ha = add(new THREE.SphereGeometry(0.06, 8, 6), M.fireHalo, x, y + h + 0.05, z, parent, { cast: false }); ha.scale.y = 1.5; ha.userData.ndSkip = true; ENV.candles.push(ha);
  if (light) { const pl = new THREE.PointLight('#ffb060', 0, 4.5, 1.6); pl.position.set(x, y + h + 0.15, z); parent.add(pl); ENV.candleLights.push(pl); } };
const decal = (parent, w, h, draw, x, y, z, ry = 0, alpha = true, res = 320) => { const c = cvs(Math.round(res * w), Math.round(res * h), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(c), transparent: alpha, alphaTest: alpha ? 0.05 : 0 })); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = false; m.receiveShadow = true; parent.add(m); return m; };
const parchment = (title, lines) => (g, W, H) => { g.fillStyle = '#f1dfb4'; g.fillRect(0, 0, W, H); const r = P.rng(title.length * 7); g.fillStyle = 'rgba(150,100,50,0.22)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(r() * W, r() * H, 4 + r() * 16, 0, 7); g.fill(); }
  g.strokeStyle = '#8a5a2a'; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12); g.fillStyle = '#4a2a14'; g.textAlign = 'center'; g.font = `700 ${Math.round(W * 0.11)}px DejaVu Serif, serif`; g.fillText(title, W / 2, H * 0.2);
  g.strokeStyle = '#6a4020'; g.lineWidth = 3; for (let i = 0; i < lines; i++) { g.beginPath(); g.moveTo(W * 0.15, H * (0.32 + i * 0.09)); g.lineTo(W * (0.6 + r() * 0.25), H * (0.32 + i * 0.09)); g.stroke(); } };
const crate = (parent, x, y, z, s = 0.6, r = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = r; parent.add(g); add(tbox(s, s, s, 0.6), M.plank, 0, s / 2, 0, g); for (const yy of [0.06, s - 0.06]) add(box(s + 0.02, 0.07, s + 0.02), M.timber, 0, yy, 0, g, { cast: false }); return g; };
const prism = (len, dep, ht, mat, x, y, z, parent) => { const sh = new THREE.Shape(); sh.moveTo(-dep / 2, 0); sh.lineTo(dep / 2, 0); sh.lineTo(0, ht); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2); const m = add(geo, mat, x, y, z, parent); m.rotation.y = Math.PI / 2; return m; };
const BOOKC = ['#b83a3a', '#2f5aa8', '#3a8a5a', '#c89a3a', '#6a3a8a', '#2a6a7a', '#a8603a', '#3a3a5a'];
M.books = BOOKC.map((c) => toon({ color: c }));
const bookshelf = (parent, x, z, w = 2.2, h = 3.0, ry = 0, seed = 3) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g); const r = P.rng(seed);
  add(tbox(w, h, 0.45, 1), M.timber, 0, h / 2, -0.05, g); const rows = Math.floor(h / 0.55);
  for (let k = 0; k < rows; k++) { const y = 0.25 + k * 0.55; add(box(w - 0.1, 0.05, 0.42), M.wood, 0, y, 0.02, g, { cast: false }); let xx = -w / 2 + 0.1;
    while (xx < w / 2 - 0.15) { const bw = 0.05 + r() * 0.05, bh = 0.3 + r() * 0.16; const bk = add(box(bw, bh, 0.28), M.books[Math.floor(r() * 8)], xx + bw / 2, y + 0.025 + bh / 2, 0.05, g, { cast: false }); if (r() < 0.08) bk.rotation.z = 0.25; xx += bw + 0.008; } }
  return g; };
const vialMat = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#bfe2f2', transparent: true, opacity: 0.22, depthWrite: false });
const vial = (parent, x, y, z, col, h = 0.22, r = 0.045, fill = 0.6) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  add(new THREE.CylinderGeometry(r, r, h, 14, 1, true), vialMat, 0, h / 2, 0, g, { cast: false });
  const liq = add(new THREE.CylinderGeometry(r * 0.88, r * 0.88, h * fill, 14), toon({ color: col, emissive: col, emissiveIntensity: 0.35 }), 0, h * fill / 2, 0, g, { cast: false }); g.userData.liq = liq; return g; };
const flask = (parent, x, y, z, col, s = 1) => { add(new THREE.SphereGeometry(0.12 * s, 14, 10), toon({ color: col, emissive: col, emissiveIntensity: 0.3 }), x, y + 0.12 * s, z, parent); add(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.2 * s, 8), vialMat, x, y + 0.32 * s, z, parent, { cast: false }); };
const linenBag = (parent, x, y, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); const b = add(new THREE.SphereGeometry(0.07 * s, 12, 10), M.linen, 0, 0.06 * s, 0, g); b.scale.set(1, 0.9, 1);
  add(new THREE.ConeGeometry(0.035 * s, 0.07 * s, 8), M.linen, 0, 0.15 * s, 0, g); add(new THREE.TorusGeometry(0.02 * s, 0.006 * s, 6, 12), M.string, 0, 0.13 * s, 0, g, { cast: false }).rotation.x = Math.PI / 2;
  const st = add(new THREE.CylinderGeometry(0.003 * s, 0.003 * s, 0.25 * s, 4), M.string, 0.06 * s, 0.1 * s, 0.02 * s, g, { cast: false }); st.rotation.z = 1.2; return g; };
// ---- materials ----
M.terra = texM(P.stone(52, 16, 46, 60, 80, 80), 1, 1, '#ffd2b8');
M.cream = texM(P.plaster(61, 40), 1, 1, '#fff2dc'); M.ochre = texM(P.plaster(62, 36), 1, 1, '#ffd890'); M.rose = texM(P.plaster(63, 12), 1, 1, '#ffc4b0');
M.timber = toon({ color: '#6a4228' }); M.wood = toon({ color: '#9a6a40' }); M.darkWood = texM(P.planks(5), 1, 2, '#b88a62');
M.roofT = texM(P.roof(19), 2, 2, '#ff9a72'); M.stoneG = texM(P.stone(44, 40, 10, 70, 110, 60), 1, 1, '#e8e2d8');
M.linen = toon({ color: '#efe6d0' }); M.string = toon({ color: '#8a6a40' }); M.meat = toon({ color: '#d0505a' }); M.bread = toon({ color: '#e0a860' });
M.brass = toon({ color: '#e0b04a' }); M.ironK = toon({ color: '#3b3b44' }); M.juice = toon({ color: '#e8f070', emissive: '#a0b020', emissiveIntensity: 0.45 });
M.gold = toon({ color: '#ffcf3a', emissive: '#5a3a00' }); M.leaf = toon({ color: '#5aa040' }); M.lemon = toon({ color: '#ffe23a' }); M.cypress = toon({ color: '#3f7a3a' });
M.trunk = toon({ color: '#6a4a32' }); M.bush = toon({ color: '#6aa848' }); M.hill = toon({ color: '#8ab85a' }); M.hillFar = toon({ color: '#9ec27a' });
const skyPane = (w, h, night = false) => cvs(Math.round(256 * w), Math.round(256 * h), (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5aa8ff'); gr.addColorStop(1, '#d8f0ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(W * (0.2 + i * 0.25), H * (0.18 + (i % 2) * 0.1), W * 0.12, H * 0.05, 0, 0, 7); g.fill(); }
  g.fillStyle = '#e8a070'; for (let i = 0; i < 7; i++) { const x = i * W / 6 - 20, hh = H * (0.25 + (i * 37 % 10) / 40); g.fillRect(x, H - hh, W / 6 + 4, hh); g.fillStyle = i % 2 ? '#d8805a' : '#f0c890'; }
  g.fillStyle = '#c86040'; g.fillRect(W * 0.62, H * 0.38, W * 0.08, H * 0.4); g.beginPath(); g.moveTo(W * 0.6, H * 0.38); g.lineTo(W * 0.66, H * 0.28); g.lineTo(W * 0.72, H * 0.38); g.fill();
  g.fillStyle = '#3f7a3a'; for (const x of [0.1, 0.85]) { g.beginPath(); g.ellipse(W * x, H * 0.7, W * 0.04, H * 0.22, 0, 0, 7); g.fill(); } });
// ---- ground, hills, clouds (outdoor) ----
const ground = add(new THREE.PlaneGeometry(2400, 2400), (() => { const m = M.grass.clone(); m.map = M.grass.map.clone(); m.map.repeat.set(300, 300); m.map.needsUpdate = true; return m; })(), 0, -0.02, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
const rt = P.rng(44);
for (let i = 0; i < 16; i++) { const a = rt() * Math.PI * 2, d = 170 + rt() * 160; const hh = add(new THREE.SphereGeometry(40 + rt() * 40, 20, 10), i % 2 ? M.hill : M.hillFar, Math.cos(a) * d, -12, Math.sin(a) * d, world, { cast: false }); hh.scale.y = 0.5 + rt() * 0.3; }
const moon = add(new THREE.SphereGeometry(30, 24, 12), new THREE.MeshBasicMaterial({ color: '#fff3d6', fog: false }), 140, 300, -620, world, { cast: false }); moon.userData.ndSkip = true; moon.visible = false;
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = -Math.PI / 2 + (r() - 0.5) * 2.2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }
// ================= COURTYARD (origin): ochre loggia, cypress, lemon trees, well, outhouse =================
const CY = new THREE.Group(); world.add(CY);
add(tbox(24, 0.06, 20, 1.2), M.terra, 0, 0, -2, CY, { cast: false });
// back loggia (z = -9): wall + arches + roof
add(tbox(24, 7, 0.6, 2.4), M.ochre, 0, 3.5, -9.3, CY);
for (let i = 0; i < 7; i++) { const x = -9 + i * 3; add(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 14), M.stoneG, x, 1.6, -8.2, CY); add(box(0.6, 0.25, 0.6), M.stoneG, x, 3.3, -8.2, CY);
  if (i < 6) { const arch = add(new THREE.TorusGeometry(1.5, 0.18, 8, 20, Math.PI), M.stoneG, x + 1.5, 3.3, -8.2, CY, { cast: false }); } }
add(box(22, 0.5, 1.6), M.ochre, 0, 5.0, -8.4, CY); prism(22.6, 2.2, 0.9, M.roofT, 0, 5.25, -8.4, CY);
for (let i = 0; i < 6; i++) add(box(1.0, 1.2, 0.05), new THREE.MeshBasicMaterial({ color: '#4a3020' }), -7.5 + i * 3, 1.3, -9.0, CY, { cast: false });
// side walls (rose + cream) with windows, shutters, flower boxes
for (const s of [-1, 1]) { const wm = s < 0 ? M.rose : M.cream; add(tbox(0.6, 7, 16, 2.4), wm, s * 11.5, 3.5, -2, CY);
  for (let k = 0; k < 3; k++) for (const yy of [2.0, 4.6]) { const z = -6 + k * 4; add(box(0.06, 1.1, 0.8), skyPane ? new THREE.MeshBasicMaterial({ color: '#4a5a7a' }) : M.white, s * 11.18, yy, z, CY, { cast: false });
    for (const dz of [-0.55, 0.55]) add(box(0.06, 1.1, 0.3), toon({ color: ['#2f7a5a', '#2f5aa8', '#a83a2a'][k] }), s * 11.15, yy, z + dz, CY, { cast: false });
    add(box(0.25, 0.2, 1.0), M.timber, s * 11.05, yy - 0.68, z, CY, { cast: false }); for (let j = 0; j < 4; j++) add(new THREE.SphereGeometry(0.09, 8, 6), toon({ color: ['#ff4a6a', '#ffd23a', '#ff8a3a', '#ffffff'][(j + k) % 4] }), s * 11.0, yy - 0.5, z - 0.35 + j * 0.23, CY, { cast: false }); } }
// cypress trees behind the wall + distant bell tower
for (let i = 0; i < 6; i++) { const c = add(new THREE.SphereGeometry(1, 12, 10), M.cypress, -10 + i * 4, 9.5, -12, CY); c.scale.set(0.9, 3.2, 0.9); }
add(tbox(3, 16, 3, 2), M.rose, 6, 8, -16, CY); prism(3.4, 3.4, 2.2, M.roofT, 6, 16, -16, CY); add(box(1.2, 1.6, 0.1), new THREE.MeshBasicMaterial({ color: '#3a2a20' }), 6, 13, -14.45, CY, { cast: false });
// well
const well = new THREE.Group(); well.position.set(-3.2, 0, -3.2); CY.add(well);
add(new THREE.CylinderGeometry(0.9, 0.95, 0.9, 20, 1, true), M.stoneG, 0, 0.45, 0, well).material = (() => { const m = M.stoneG.clone(); m.side = THREE.DoubleSide; return m; })();
add(new THREE.TorusGeometry(0.92, 0.1, 8, 24), M.stoneG, 0, 0.9, 0, well, { cast: false }).rotation.x = Math.PI / 2;
for (const s of [-1, 1]) add(box(0.12, 1.6, 0.12), M.timber, s * 0.85, 1.6, 0, well); add(box(1.9, 0.12, 0.12), M.timber, 0, 2.4, 0, well); prism(2.2, 1.4, 0.5, M.roofT, 0, 2.45, 0, well);
// lemon trees in big terracotta pots
const lemonTree = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); CY.add(g); add(new THREE.CylinderGeometry(0.45, 0.32, 0.7, 16), M.terra, 0, 0.35, 0, g); add(new THREE.CylinderGeometry(0.06, 0.08, 1.0, 6), M.trunk, 0, 1.1, 0, g);
  const c = add(new THREE.SphereGeometry(0.75, 14, 10), M.leaf, 0, 1.9, 0, g); const r = P.rng(x * 10 + z); for (let i = 0; i < 9; i++) { const a = r() * 6.28, b = r() * 1.4; add(new THREE.SphereGeometry(0.08, 8, 6), M.lemon, Math.cos(a) * Math.sin(b) * 0.74, 1.9 + Math.cos(b) * 0.7, Math.sin(a) * Math.sin(b) * 0.74, g, { cast: false }); } };
lemonTree(-7.5, -6.5); lemonTree(-1.0, -7.0); lemonTree(8.5, -1.5); lemonTree(-8.5, 1.5);
// outhouse (right back) + bench + chamber pot
const OH = new THREE.Group(); OH.position.set(5.2, 0, -5.6); CY.add(OH);
add(tbox(1.5, 2.3, 1.4, 0.8), M.darkWood, 0, 1.15, 0, OH); prism(1.7, 1.7, 0.55, M.roofT, 0, 2.3, 0, OH);
const ohDoor = decal(OH, 0.8, 1.8, (g, W, H) => { g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#4a2a14'; g.lineWidth = 6; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.stroke(); } g.strokeRect(3, 3, W - 6, H - 6);
  g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(W * 0.5, H * 0.17, W * 0.13, 0, 7); g.fill(); g.fillStyle = '#7a4a2a'; g.beginPath(); g.arc(W * 0.57, H * 0.15, W * 0.12, 0, 7); g.fill(); }, 0, 1.0, 0.71, 0, false);
const bench = new THREE.Group(); bench.position.set(2.6, 0, -5.9); CY.add(bench); add(box(1.8, 0.1, 0.45), M.wood, 0, 0.5, 0, bench); for (const s of [-1, 1]) add(box(0.1, 0.5, 0.4), M.wood, s * 0.75, 0.25, 0, bench);
const POT = new THREE.Group(); POT.position.set(4.3, 0, -3.9); CY.add(POT);
const potM = toon({ color: '#f4f2ec' }); add(new THREE.CylinderGeometry(0.26, 0.18, 0.3, 18, 1, true), potM, 0, 0.15, 0, POT).material = (() => { const m = potM.clone(); m.side = THREE.DoubleSide; return m; })();
add(new THREE.TorusGeometry(0.26, 0.03, 6, 20), toon({ color: '#3a6ad0' }), 0, 0.3, 0, POT, { cast: false }).rotation.x = Math.PI / 2;
add(new THREE.CircleGeometry(0.24, 18), toon({ color: '#8a5a2a' }), 0, 0.22, 0, POT, { cast: false }).rotation.x = -Math.PI / 2;
const stick = add(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), M.wood, 0.25, 0.45, 0.1, POT, { cast: false }); stick.rotation.z = 0.5;
// laundry line + crates + a cat-free cart
add(new THREE.CylinderGeometry(0.008, 0.008, 9, 4), M.string, -6, 3.6, -4, CY, { cast: false }).rotation.z = Math.PI / 2;
for (let i = 0; i < 6; i++) { const cl = add(box(0.55, 0.7, 0.02), toon({ color: ['#ffffff', '#ff8a8a', '#8ac0ff', '#ffe08a', '#ffffff', '#a8e0a0'][i] }), -9.5 + i * 1.3, 3.2, -4, CY, { cast: false }); }
crate(CY, 8.5, 0, -6.8, 0.7, 0.3); crate(CY, 9.3, 0, -6.2, 0.6, -0.2); crate(CY, 8.8, 0.7, -6.6, 0.5, 0.5);
// lanterns on the walls
for (const [x, z] of [[-11.1, -4], [11.1, 0], [-3, -8.95], [3, -8.95]]) { const lb = add(new THREE.SphereGeometry(0.12, 8, 6), M.fireCore, x * 0.98, 3.0, z, CY, { cast: false }); lb.userData.ndSkip = true; ENV.candles.push(lb); }
const nightLamp = new THREE.PointLight('#ffb070', 0, 14, 1.4); nightLamp.position.set(1.5, 3.0, -2); CY.add(nightLamp);
// ================= LAB (x = 300): Spallanzani's study in Pavia =================
const LB = new THREE.Group(); LB.position.set(300, 0, 0); scene.add(LB);
add(tbox(11, 0.3, 10, 1.1), M.terra, 0, -0.15, 0.5, LB, { cast: false });
add(tbox(11, 5.2, 0.4, 2.2), M.cream, 0, 2.6, -3.6, LB); for (const s of [-1, 1]) add(tbox(0.4, 5.2, 10, 2.2), M.cream, s * 5.3, 2.6, 0.5, LB);
add(tbox(11, 0.3, 10, 2), M.darkWood, 0, 5.2, 0.5, LB, { cast: false }); for (let i = 0; i < 6; i++) add(box(0.25, 0.3, 10), M.timber, -4.5 + i * 1.8, 4.95, 0.5, LB);
add(box(11, 0.9, 0.06), toon({ color: '#c89a6a' }), 0, 0.45, -3.38, LB, { cast: false }); add(box(11, 0.08, 0.1), M.timber, 0, 0.92, -3.36, LB, { cast: false });
// arched window with Pavia view + sunbeam
const winC = skyPane(1.8, 2.6); const win = add(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshBasicMaterial({ map: P.tex(winC) }), 1.9, 2.5, -3.38, LB, { cast: false });
const winTop = add(new THREE.CircleGeometry(0.9, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#5aa8ff' }), 1.9, 3.6, -3.38, LB, { cast: false });
add(new THREE.TorusGeometry(0.95, 0.08, 6, 24, Math.PI), M.timber, 1.9, 3.6, -3.35, LB, { cast: false }); for (const s of [-1, 1]) add(box(0.14, 2.3, 0.12), M.timber, 1.9 + s * 0.95, 2.5, -3.34, LB, { cast: false });
add(box(0.07, 3.2, 0.1), M.timber, 1.9, 2.8, -3.33, LB, { cast: false }); add(box(1.9, 0.07, 0.1), M.timber, 1.9, 2.6, -3.33, LB, { cast: false }); add(box(2.2, 0.12, 0.3), M.stoneG, 1.9, 1.38, -3.25, LB, { cast: false });
shaft(LB, [1.9, 3.0, -3.3], [0.9, 0.0, 1.0], 0.75, 1.5, '#fff0c4', 0.33);
for (const s of [-1, 1]) add(box(0.45, 2.8, 0.05), toon({ color: '#b8323a' }), 1.9 + s * 1.3, 2.6, -3.32, LB, { cast: false });
// bookshelves, crucifix, paintings, parchments
bookshelf(LB, -2.3, -3.25, 2.4, 3.4, 0, 7); bookshelf(LB, -4.4, -3.25, 1.6, 3.0, 0, 8); bookshelf(LB, -5.0, -0.6, 2.4, 3.2, Math.PI / 2, 9);
add(box(0.08, 0.7, 0.05), M.timber, -1.2, 3.6, -3.36, LB, { cast: false }); add(box(0.45, 0.08, 0.05), M.timber, -1.2, 3.75, -3.36, LB, { cast: false });
for (const [x, y, c] of [[3.9, 3.0, '#3a7ad0'], [-0.2, 3.3, '#d0803a']]) { add(box(0.9, 0.7, 0.05), M.gold, x, y, -3.37, LB, { cast: false }); add(box(0.76, 0.56, 0.06), toon({ color: c }), x, y, -3.35, LB, { cast: false }); add(new THREE.SphereGeometry(0.14, 10, 8), M.white, x - 0.1, y - 0.02, -3.31, LB, { cast: false }); }
decal(LB, 0.6, 0.8, parchment('VENTRICULUS', 5), 5.08, 2.4, -1.4, -Math.PI / 2, false); decal(LB, 0.55, 0.72, parchment('DIGESTIO', 4), 5.08, 2.6, -0.4, -Math.PI / 2, false);
// stomach anatomy chart on the wall (diegetic)
decal(LB, 1.0, 1.3, (g, W, H) => { g.fillStyle = '#f1dfb4'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a5a2a'; g.lineWidth = 8; g.strokeRect(6, 6, W - 12, H - 12);
  g.fillStyle = '#e88a8a'; g.strokeStyle = '#7a2a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(W * 0.45, H * 0.12); g.bezierCurveTo(W * 0.42, H * 0.35, W * 0.15, H * 0.4, W * 0.25, H * 0.65); g.bezierCurveTo(W * 0.35, H * 0.9, W * 0.8, H * 0.8, W * 0.75, H * 0.55); g.bezierCurveTo(W * 0.72, H * 0.4, W * 0.55, H * 0.42, W * 0.55, H * 0.12); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#4a2a14'; g.font = `700 ${Math.round(W * 0.09)}px DejaVu Serif, serif`; g.textAlign = 'center'; g.fillText('STOMACHUS', W / 2, H * 0.95); }, 5.08, 2.5, 1.3, -Math.PI / 2, false);
// the desk + props
const DK = new THREE.Group(); DK.position.set(-0.4, 0, -0.85); LB.add(DK);
add(tbox(2.9, 0.12, 1.25, 1), M.wood, 0, 1.0, 0, DK); for (const [x, z] of [[-1.3, -0.5], [1.3, -0.5], [-1.3, 0.5], [1.3, 0.5]]) add(box(0.12, 1.0, 0.12), M.timber, x, 0.5, z, DK);
add(box(2.7, 0.35, 0.05), M.timber, 0, 0.75, 0.6, DK, { cast: false });
const plate = add(new THREE.CylinderGeometry(0.22, 0.18, 0.03, 20), M.white, -0.85, 1.07, 0.25, DK); const meatP = add(new THREE.DodecahedronGeometry(0.09, 0), M.meat, -0.9, 1.14, 0.25, DK); meatP.scale.set(1.3, 0.7, 1);
const bread = add(new THREE.SphereGeometry(0.1, 12, 8), M.bread, -0.72, 1.13, 0.2, DK); bread.scale.set(1.5, 0.75, 1);
const BAGS = [linenBag(DK, -0.25, 1.06, 0.3), linenBag(DK, -0.05, 1.06, 0.38, 0.9), linenBag(DK, 0.12, 1.06, 0.26, 1.05)];
add(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), M.ironK, -0.45, 1.075, 0.35, DK, { cast: false }).rotation.z = Math.PI / 2; add(new THREE.TorusGeometry(0.04, 0.006, 6, 14), toon({ color: '#c84a4a' }), -0.5, 1.07, 0.42, DK, { cast: false }).rotation.x = Math.PI / 2;
const rack = new THREE.Group(); rack.position.set(0.2, 1.06, -0.4); DK.add(rack); add(box(0.55, 0.05, 0.14), M.wood, 0, 0.13, 0, rack, { cast: false }); add(box(0.55, 0.03, 0.14), M.wood, 0, 0.0, 0, rack, { cast: false });
['#ff7aa0', '#7ad0ff', '#c0f07a', '#ffc04a', '#b88aff'].forEach((c, i) => vial(rack, -0.22 + i * 0.11, 0.0, 0, c, 0.24, 0.035, 0.55));
const HV = vial(DK, 1.3, 1.06, 0.35, '#e0ec6a', 0.34, 0.07, 0.7); // hero vial of gastric juice
const meatV = add(new THREE.DodecahedronGeometry(0.052, 0), M.meat, 0, 0.5, 0, HV, { cast: false }); meatV.scale.set(1.2, 0.8, 1);
const bigJar = new THREE.Group(); bigJar.position.set(0.9, 1.06, -0.3); DK.add(bigJar);
add(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 18), vialMat, 0, 0.17, 0, bigJar, { cast: false }); add(new THREE.CylinderGeometry(0.105, 0.105, 0.24, 18), M.juice, 0, 0.12, 0, bigJar, { cast: false }); add(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), M.wood, 0, 0.37, 0, bigJar, { cast: false });
const gjLabel = decal(bigJar, 0.2, 0.12, (g, W, H) => { g.fillStyle = '#f4e3b8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#5a3622'; g.lineWidth = 6; g.strokeRect(4, 4, W - 8, H - 8); g.fillStyle = '#2a1a10'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${Math.round(H * 0.3)}px DejaVu Serif, serif`; g.fillText('GASTRIC', W / 2, H * 0.36); g.fillText('JUICE', W / 2, H * 0.7); }, 0, 0.17, 0.125, 0, false, 1400); gjLabel.visible = false;
const micro = new THREE.Group(); micro.position.set(-1.25, 1.06, 0.1); DK.add(micro); add(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 14), M.brass, 0, 0.02, 0, micro); add(box(0.04, 0.3, 0.04), M.brass, -0.05, 0.17, 0, micro); const tube = add(new THREE.CylinderGeometry(0.03, 0.035, 0.28, 12), M.brass, 0.02, 0.32, 0, micro); tube.rotation.z = -0.3;
const book = add(box(0.5, 0.04, 0.34), M.white, -0.45, 1.08, -0.3, DK); add(box(0.02, 0.05, 0.34), M.books[0], -0.45, 1.08, -0.3, DK, { cast: false });
const quill = add(new THREE.ConeGeometry(0.025, 0.3, 6), M.white, -0.15, 1.2, -0.3, DK, { cast: false }); quill.rotation.z = -0.6; add(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), M.ironK, -0.1, 1.09, -0.38, DK, { cast: false });
candle(DK, -1.2, 1.06, -0.35, true); candle(DK, 0.55, 1.06, 0.3, false, 0.2);
// side table with basin (the vomit scene)
const ST = new THREE.Group(); ST.position.set(3.0, 0, -0.6); LB.add(ST); add(tbox(1.2, 0.1, 0.8, 1), M.wood, 0, 0.9, 0, ST); for (const [x, z] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) add(box(0.08, 0.9, 0.08), M.timber, x, 0.45, z, ST);
const basin = add(new THREE.SphereGeometry(0.22, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon({ color: '#e8eef4', side: THREE.DoubleSide }), 0, 1.17, 0.15, ST);
const basinLiq = add(new THREE.CircleGeometry(0.17, 18), M.juice, 0, 1.06, 0.15, ST, { cast: false }); basinLiq.rotation.x = -Math.PI / 2;
add(box(0.05, 0.6, 0.6), M.wood, -0.55, 1.2, 0, ST, { cast: false }); flask(ST, 0.42, 0.95, -0.2, '#7ad0ff', 0.8);
// globe, rug, stool, chest
const globe = new THREE.Group(); globe.position.set(-3.6, 0, 1.4); LB.add(globe); add(new THREE.CylinderGeometry(0.05, 0.25, 0.9, 10), M.timber, 0, 0.45, 0, globe);
const gl = add(new THREE.SphereGeometry(0.38, 24, 16), mapM(cvs(512, 256, (g, W, H) => { g.fillStyle = '#5aa0d8'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8c87a'; const r = P.rng(5); for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(r() * W, H * 0.2 + r() * H * 0.6, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); } })), 0, 1.3, 0, globe); gl.rotation.z = 0.4;
add(new THREE.TorusGeometry(0.43, 0.02, 6, 28), M.brass, 0, 1.3, 0, globe, { cast: false }).rotation.y = Math.PI / 2;
const rug = decal(LB, 3.2, 2.0, (g, W, H) => { g.fillStyle = '#2f5aa8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8b84a'; g.lineWidth = 14; g.strokeRect(18, 18, W - 36, H - 36); g.strokeStyle = '#b8323a'; g.lineWidth = 10; g.strokeRect(46, 46, W - 92, H - 92);
  g.fillStyle = '#e8b84a'; for (let i = 0; i < 6; i++) { const cx = W * (0.18 + i * 0.13); g.beginPath(); g.moveTo(cx, H * 0.5 - 40); g.lineTo(cx + 30, H * 0.5); g.lineTo(cx, H * 0.5 + 40); g.lineTo(cx - 30, H * 0.5); g.fill(); } }, -0.3, 0.012, 1.2, 0, false); rug.rotation.x = -Math.PI / 2;
crate(LB, 4.2, 0, 2.6, 0.6, 0.3); crate(LB, 4.1, 0.6, 2.6, 0.45, 0.6);
{ const cab = new THREE.Group(); cab.position.set(0.15, 0, -3.15); LB.add(cab); add(tbox(1.2, 2.2, 0.45, 1), M.timber, 0, 1.1, 0, cab);
  for (const y of [0.9, 1.5, 2.05]) { add(box(1.1, 0.04, 0.4), M.wood, 0, y - 0.02, 0.05, cab, { cast: false }); ['#ff7aa0', '#7ad0ff', '#c0f07a', '#ffc04a', '#b88aff'].forEach((c, i) => flask(cab, -0.42 + i * 0.21, y, 0.08, c, 0.55)); } }
// chandelier
add(new THREE.CylinderGeometry(0.01, 0.01, 1.1, 4), M.ironK, -0.4, 4.5, 0.3, LB, { cast: false }); add(new THREE.TorusGeometry(0.45, 0.025, 6, 24), M.ironK, -0.4, 3.95, 0.3, LB, { cast: false }).rotation.x = Math.PI / 2;
for (let i = 0; i < 6; i++) { const a = i * 1.047; candle(LB, -0.4 + Math.cos(a) * 0.45, 3.95, 0.3 + Math.sin(a) * 0.45, i === 0, 0.12); }
const labFill = new THREE.PointLight('#a8c8ff', 0, 12, 1.3); labFill.position.set(1.9, 3.2, -2.0); LB.add(labFill);
// ================= HALL (x = -300): lecture hall, giant millstone, rot exhibit =================
const HL = new THREE.Group(); HL.position.set(-300, 0, 0); scene.add(HL);
add(tbox(14, 0.3, 12, 2), M.plank, 0, -0.15, 0, HL, { cast: false });
add(tbox(14, 6.5, 0.4, 2.4), M.darkWood, 0, 3.25, -5.2, HL); for (const s of [-1, 1]) add(tbox(0.4, 6.5, 12, 2.4), M.cream, s * 6.8, 3.25, 0, HL);
for (let i = 0; i < 7; i++) add(box(0.18, 6.5, 0.12), M.timber, -6 + i * 2, 3.25, -4.98, HL, { cast: false });
add(tbox(9, 0.5, 3.4, 1.5), M.darkWood, 0, 0.25, -3.4, HL); // stage
// chalkboard
decal(HL, 3.6, 1.6, (g, W, H) => { g.fillStyle = '#2a3a32'; g.fillRect(0, 0, W, H); g.strokeStyle = '#7a4a2a'; g.lineWidth = 22; g.strokeRect(0, 0, W, H); g.fillStyle = 'rgba(245,245,235,0.92)'; g.font = `700 ${Math.round(H * 0.17)}px DejaVu Serif, serif`; g.textAlign = 'center';
  g.fillText('STOMACH = MILL?', W * 0.5, H * 0.38); g.fillText('STOMACH = ROT?', W * 0.5, H * 0.72); g.strokeStyle = 'rgba(245,245,235,0.85)'; g.lineWidth = 5; g.beginPath(); g.arc(W * 0.12, H * 0.5, H * 0.18, 0, 7); g.stroke(); }, 0, 3.6, -4.97, 0, false);
// giant millstone on a timber frame
const MILL = new THREE.Group(); MILL.position.set(-1.6, 0.5, -3.6); HL.add(MILL);
for (const s of [-1, 1]) { add(box(0.18, 2.6, 0.18), M.timber, s * 0.5, 1.3, 0, MILL); }
add(box(1.2, 0.16, 0.18), M.timber, 0, 2.55, 0, MILL);
const wheel = new THREE.Group(); wheel.position.set(0, 1.35, 0); MILL.add(wheel);
const ws = add(new THREE.CylinderGeometry(1.05, 1.05, 0.42, 32), M.stoneG, 0, 0, 0, wheel); ws.rotation.x = Math.PI / 2; ws.rotation.y = 0;
const wheelFace = mapM(cvs(512, 512, (g, W, H) => { g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a8478'; g.lineWidth = 10; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * 60, H / 2 + Math.sin(a) * 60); g.lineTo(W / 2 + Math.cos(a + 0.4) * 250, H / 2 + Math.sin(a + 0.4) * 250); g.stroke(); } g.fillStyle = '#5a5248'; g.beginPath(); g.arc(W / 2, H / 2, 50, 0, 7); g.fill(); }));
for (const s of [-1, 1]) { const fc = add(new THREE.CircleGeometry(1.05, 32), wheelFace, 0, 0, s * 0.215, wheel, { cast: false }); if (s < 0) fc.rotation.y = Math.PI; }
add(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 10), M.ironK, 0, 0, 0, wheel, { cast: false }).rotation.x = Math.PI / 2;
// rot exhibit: glass dome over green meat, on a little table
const ROT = new THREE.Group(); ROT.position.set(2.4, 0.5, -3.0); HL.add(ROT);
add(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20), M.wood, 0, 0.9, 0, ROT); add(new THREE.CylinderGeometry(0.08, 0.2, 0.9, 10), M.timber, 0, 0.45, 0, ROT);
const rotMeat = add(new THREE.DodecahedronGeometry(0.16, 0), toon({ color: '#8aa84a' }), 0, 1.05, 0, ROT); rotMeat.scale.set(1.3, 0.7, 1);
add(new THREE.SphereGeometry(0.38, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), vialMat, 0, 0.94, 0, ROT, { cast: false });
// benches + chandelier + side windows with shafts + banners
for (let row = 0; row < 3; row++) { const z = 0.6 + row * 1.4; add(box(8, 0.12, 0.5), M.wood, 0, 0.5 + row * 0.15, z, HL); add(box(8, 0.6, 0.08), M.timber, 0, 0.8 + row * 0.15, z + 0.3, HL); }
for (const z of [-2.5, 1.0]) { add(box(0.06, 2.2, 1.2), new THREE.MeshBasicMaterial({ color: '#cfe8ff' }), -6.58, 3.6, z, HL, { cast: false }); shaft(HL, [-6.5, 3.8, z], [-1.5, 0.0, z + 0.8], 0.7, 1.4, '#fff0c8', 0.26); }
for (const x of [-4.5, 4.5]) { add(box(1.2, 2.4, 0.04), toon({ color: '#b8323a' }), x, 4.3, -4.95, HL, { cast: false }); add(new THREE.CircleGeometry(0.35, 20), M.gold, x, 4.6, -4.92, HL, { cast: false }); }
const hallFill = new THREE.PointLight('#fff0dc', 0, 16, 1.2); hallFill.position.set(0.5, 4.0, 1.5); HL.add(hallFill);
add(new THREE.TorusGeometry(0.8, 0.03, 6, 28), M.ironK, 0, 4.6, -0.5, HL, { cast: false }).rotation.x = Math.PI / 2;
for (let i = 0; i < 8; i++) { const a = i * 0.785; candle(HL, Math.cos(a) * 0.8, 4.6, -0.5 + Math.sin(a) * 0.8, i % 4 === 0, 0.12); }
// ================= STOMACH LAB (x = 600): cut-away stomach = chemistry lab =================
const SB = new THREE.Group(); SB.position.set(600, 0, 0); scene.add(SB);
const fleshC = cvs(1024, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ff9aa8'); gr.addColorStop(1, '#e86a80'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(160,40,70,0.45)'; g.lineWidth = 14; g.lineCap = 'round'; const r = P.rng(8); for (let i = 0; i < 26; i++) { g.beginPath(); const y0 = r() * H; g.moveTo(0, y0); for (let x = 0; x <= W; x += 40) g.lineTo(x, y0 + Math.sin(x * 0.02 + i) * 26); g.stroke(); }
  g.fillStyle = 'rgba(255,220,230,0.5)'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc(r() * W, r() * H, 3 + r() * 7, 0, 7); g.fill(); } });
const flesh = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(fleshC, 3, 2), side: THREE.BackSide });
const dome = add(new THREE.SphereGeometry(4.2, 40, 24), flesh, 0, 1.8, 0, SB, { cast: false }); dome.scale.set(1.25, 0.9, 1.0);
const juice = add(new THREE.CircleGeometry(4.6, 40), toon({ color: '#9fb040', emissive: '#2a3a04', emissiveIntensity: 0.2 }), 0, 0.45, 0, SB, { cast: false }); juice.rotation.x = -Math.PI / 2;
const sbBag = linenBag(SB, 0.2, 0.42, -0.4, 6.0);
// flesh shelves holding glassware (the "chemistry lab")
const LABS = new THREE.Group(); SB.add(LABS);
for (const [x, z, ry] of [[-2.6, -1.8, 0.7], [2.6, -1.8, -0.7], [0, -3.0, 0]]) { const sh = new THREE.Group(); sh.position.set(x, 0, z); sh.rotation.y = ry; LABS.add(sh);
  for (const y of [1.3, 2.2]) { add(box(1.6, 0.12, 0.45), toon({ color: '#d85a72' }), 0, y, 0, sh); ['#7ad0ff', '#ffb04a', '#c0f07a', '#ff7ab0'].forEach((c, i) => flask(sh, -0.6 + i * 0.4, y + 0.06, 0, c, 1.0)); } }
const pinkL = new THREE.PointLight('#ffb0c0', 0, 12, 1.2); pinkL.position.set(0, 3.5, 1.5); SB.add(pinkL);
const juiceL = new THREE.PointLight('#d8ff6a', 0, 8, 1.4); juiceL.position.set(0, 0.9, 0); SB.add(juiceL);
const esoph = add(new THREE.CylinderGeometry(0.7, 0.9, 2.5, 20, 1, true), flesh, -0.8, 5.0, -0.5, SB, { cast: false });
// ================= CLASSROOM (x = 900): today =================
const CR = new THREE.Group(); CR.position.set(900, 0, 0); scene.add(CR);
add(tbox(12, 0.3, 10, 1.4), toon({ color: '#d8c8a8' }), 0, -0.15, 0, CR, { cast: false });
add(tbox(12, 5, 0.3, 2), toon({ color: '#cfe6f2' }), 0, 2.5, -3.6, CR); for (const s of [-1, 1]) add(tbox(0.3, 5, 10, 2), toon({ color: '#cfe6f2' }), s * 6, 2.5, 0, CR);
decal(CR, 4.0, 1.8, (g, W, H) => { g.fillStyle = '#2c4a3c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#b08a5a'; g.lineWidth = 24; g.strokeRect(0, 0, W, H); g.strokeStyle = 'rgba(245,245,235,0.9)'; g.lineWidth = 7; g.fillStyle = 'rgba(245,245,235,0.92)';
  g.beginPath(); g.moveTo(W * 0.2, H * 0.15); g.bezierCurveTo(W * 0.19, H * 0.35, W * 0.06, H * 0.4, W * 0.1, H * 0.62); g.bezierCurveTo(W * 0.15, H * 0.88, W * 0.32, H * 0.8, W * 0.3, H * 0.55); g.bezierCurveTo(W * 0.29, H * 0.4, W * 0.23, H * 0.38, W * 0.24, H * 0.15); g.stroke();
  g.font = `700 ${Math.round(H * 0.16)}px Inter, sans-serif`; g.textAlign = 'left'; g.fillText('DIGESTION', W * 0.42, H * 0.36); g.font = `600 ${Math.round(H * 0.11)}px Inter, sans-serif`; g.fillText('food + gastric juice', W * 0.42, H * 0.58); g.fillText('= dissolved!', W * 0.42, H * 0.76);
  g.beginPath(); g.moveTo(W * 0.33, H * 0.55); g.lineTo(W * 0.4, H * 0.5); g.stroke(); }, 0, 2.6, -3.43, 0, false);
add(box(1.6, 1.3, 0.05), new THREE.MeshBasicMaterial({ color: '#bfe6ff' }), 5.83, 2.5, -1.0, CR, { cast: false }); add(box(0.1, 1.4, 1.7), toon({ color: '#ffffff' }), 5.85, 2.5, -1.0, CR, { cast: false });
shaft(CR, [5.8, 2.7, -1.0], [2.5, 0.0, 0.0], 0.7, 1.4, '#fff4d8', 0.28, 'day');
for (const [x, c] of [[-4.3, '#ffb84a'], [4.0, '#7ac0ff']]) decal(CR, 0.9, 1.2, (g, W, H) => { g.fillStyle = c; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H * 0.4, W * 0.28, 0, 7); g.fill(); g.fillStyle = '#2a2a3a'; g.font = `800 ${Math.round(W * 0.12)}px Inter`; g.textAlign = 'center'; g.fillText(c === '#ffb84a' ? 'BIOLOGY' : 'SCIENCE', W / 2, H * 0.85); }, x, 2.6, -3.43, 0, false);
const DESKS = [];
for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const d = new THREE.Group(); d.position.set(-2.6 + i * 2.6, 0, 0.2 + j * 2.0); CR.add(d); DESKS.push(d);
  add(box(1.2, 0.06, 0.65), toon({ color: '#e8c890' }), 0, 0.78, 0, d); for (const s of [-1, 1]) add(box(0.05, 0.78, 0.6), M.ironK, s * 0.55, 0.39, 0, d);
  const bk = add(box(0.42, 0.03, 0.3), M.white, 0, 0.82, 0.05, d); add(box(0.43, 0.035, 0.31), M.books[(i + j) % 8], 0, 0.805, 0.05, d, { cast: false }); }
for (let i = 0; i < 6; i++) add(box(0.09, 0.32, 0.24), M.books[i], -5.5 + i * 0.1, 1.22, -3.2, CR, { cast: false }); add(box(1.0, 0.06, 0.35), M.wood, -5.25, 1.04, -3.25, CR);
add(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 12), toon({ color: '#ffffff' }), 5.0, 0.14, -2.8, CR); const pkC = add(new THREE.SphereGeometry(0.42, 10, 8), M.bush, 5.0, 0.62, -2.8, CR); pkC.scale.y = 1.4;
for (const x of [-2, 2]) { add(box(1.6, 0.06, 0.25), toon({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.6 }), x, 4.8, 0, CR, { cast: false }); }

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
const HVD = new THREE.Group(); HVD.position.set(1200, 0, 0); scene.add(HVD);
const lino = cvs(512, 512, (g, W, H) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#2a2a32' : '#e8e2d0'; g.fillRect(i * 64, j * 64, 64, 64); } });
const linoT = P.tex(lino); linoT.wrapS = linoT.wrapT = THREE.RepeatWrapping; linoT.repeat.set(4, 4);
add(tbox(12, 0.3, 10, 1), new THREE.MeshToonMaterial({ gradientMap: grad, map: linoT }), 0, -0.15, 0, HVD, { cast: false });
add(tbox(12, 4.6, 0.3, 2), toon({ color: '#b8dcc0' }), 0, 2.3, -3.6, HVD); for (const s of [-1, 1]) add(tbox(0.3, 4.6, 10, 2), toon({ color: '#b8dcc0' }), s * 6, 2.3, 0, HVD);
add(box(12, 1.2, 0.06), toon({ color: '#6a8a70' }), 0, 0.6, -3.43, HVD, { cast: false });
// window with brick buildings + sunbeam
const bricksC = cvs(460, 400, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7ab8ff'); gr.addColorStop(1, '#e0f0ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#a84a32'; g.fillRect(0, H * 0.35, W * 0.45, H); g.fillRect(W * 0.55, H * 0.25, W * 0.45, H);
  g.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { g.fillRect(20 + i * 60, H * 0.42 + j * 60, 30, 40); g.fillRect(W * 0.6 + i * 60, H * 0.32 + j * 60, 30, 40); } g.fillStyle = '#3a7a3a'; g.beginPath(); g.ellipse(W * 0.5, H * 0.85, 60, 70, 0, 0, 7); g.fill(); });
add(box(1.8, 1.6, 0.05), new THREE.MeshBasicMaterial({ map: P.tex(bricksC) }), 3.6, 2.5, -3.43, HVD, { cast: false }); add(box(0.08, 1.7, 0.1), toon({ color: '#ffffff' }), 3.6, 2.5, -3.4, HVD, { cast: false }); add(box(1.9, 0.08, 0.1), toon({ color: '#ffffff' }), 3.6, 2.5, -3.4, HVD, { cast: false });
shaft(HVD, [3.6, 2.8, -3.4], [1.8, 0.0, 0.8], 0.8, 1.4, '#fff4d8', 0.28);
// lab bench + the ultrasonic detector
add(tbox(5.2, 0.1, 1.1, 0.5), toon({ color: '#3a3a42' }), -0.6, 0.95, -2.3, HVD); add(tbox(5.2, 0.9, 1.0, 0.4), toon({ color: '#8a6a4a' }), -0.6, 0.45, -2.3, HVD);
const DET = new THREE.Group(); DET.position.set(-1.2, 1.0, -2.45); HVD.add(DET);
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
const scopeBox = new THREE.Group(); scopeBox.position.set(0.9, 1.0, -2.4); HVD.add(scopeBox); add(tbox(0.9, 0.8, 0.7, 0.08), toon({ color: '#4a4a52' }), 0, 0.4, 0, scopeBox);
const scr = add(new THREE.CircleGeometry(0.28, 32), new THREE.MeshBasicMaterial({ map: scopeT }), 0, 0.45, 0.355, scopeBox, { cast: false }); scr.userData.ndSkip = true;
add(new THREE.TorusGeometry(0.29, 0.03, 8, 32), toon({ color: '#2a2a2a' }), 0, 0.45, 0.36, scopeBox, { cast: false });
// big speaker horn
const horn = add(new THREE.ConeGeometry(0.35, 0.7, 24, 1, true), toon({ color: '#c8a050', side: THREE.DoubleSide }), 2.0, 1.45, -2.3, HVD, { cast: false }); horn.rotation.z = Math.PI / 2;
// microphone stand + bat cage
add(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), M.ironK, -0.1, 1.3, -2.0, HVD); add(new THREE.SphereGeometry(0.07, 12, 8), toon({ color: '#9a9aa8' }), -0.1, 1.62, -2.0, HVD);
const cage = new THREE.Group(); cage.position.set(-2.8, 1.0, -2.2); HVD.add(cage); add(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), M.ironK, 0, 0.02, 0, cage); add(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), M.ironK, 0, 0.62, 0, cage);
for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; add(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 4), M.ironK, Math.cos(a) * 0.31, 0.32, Math.sin(a) * 0.31, cage, { cast: false }); }
// cables, filing cabinet, radiator, desk lamp, chalkboard with ECHOLOCATION (revealed)
for (let i = 0; i < 3; i++) { const c = add(new THREE.TorusGeometry(0.4 + i * 0.1, 0.012, 6, 20, Math.PI), M.blackS || toon({ color: '#111' }), -0.2 + i * 0.3, 1.0, -2.0, HVD, { cast: false }); c.rotation.x = -Math.PI / 2; }
add(tbox(0.8, 1.4, 0.6, 0.06), toon({ color: '#7a8a7a' }), -5.2, 0.7, -3.0, HVD); for (let i = 0; i < 3; i++) add(box(0.6, 0.04, 0.02), toon({ color: '#c8c8c8' }), -5.2, 0.35 + i * 0.42, -2.69, HVD, { cast: false });
for (let i = 0; i < 10; i++) add(box(0.06, 0.8, 0.12), toon({ color: '#d8d8d0' }), 4.2 + i * 0.1, 0.5, -3.3, HVD, { cast: false });
const BOARD = cvs(1152, 512, () => {}); const boardT = P.tex(BOARD); let boardMode = -1;
const drawBoard = (m) => { if (m === boardMode) return; boardMode = m; const g = BOARD.getContext('2d'), W = 1152, H = 512; g.fillStyle = '#2a3a32'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a6a4a'; g.lineWidth = 24; g.strokeRect(0, 0, W, H);
  g.fillStyle = 'rgba(245,245,235,0.9)'; g.font = '600 52px DejaVu Sans, sans-serif'; g.textAlign = 'left'; g.fillText('20,000 Hz = limit of human hearing', 50, 100); g.strokeStyle = 'rgba(245,245,235,0.85)'; g.lineWidth = 5; g.beginPath(); for (let x = 60; x < 600; x += 4) g.lineTo(x, 200 + Math.sin(x * 0.08) * 40); g.stroke();
  if (m >= 1) { g.fillStyle = '#ffd23f'; g.font = '900 120px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillText('ECHOLOCATION', W / 2, 400); }
  boardT.needsUpdate = true; };
drawBoard(0);
add(box(3.6, 1.6, 0.05), new THREE.MeshToonMaterial({ gradientMap: grad, map: boardT }), -2.4, 2.9, -3.43, HVD, { cast: false });
const hvFill = new THREE.PointLight('#fff8ee', 0, 16, 1.2); hvFill.position.set(0, 3.8, 1.5); HVD.add(hvFill);
const scopeGlow = new THREE.PointLight('#7aff9a', 0, 4, 1.5); scopeGlow.position.set(0.9, 1.5, -1.7); HVD.add(scopeGlow);
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

// ================= HOSPITAL (x = 2000): Eberswalde, 1929 — operating room, stairwell, X-ray room =================
const HO = new THREE.Group(); HO.position.set(2000, 0, 0); scene.add(HO);
const tileC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#e9efe9'; g.fillRect(0, 0, W, H); const n = 8, s = W / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 236 + ((i * 7 + j * 13) % 9); g.fillStyle = `rgb(${v - 4},${v + 2},${v - 2})`; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(i * s + 6, j * s + 6, s * 0.35, 4); } });
const floorC = cvs(512, 512, (g, W, H) => { const n = 8, s = W / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#3c5a6e' : '#e8e4da'; g.fillRect(i * s, j * s, s, s); } g.strokeStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, H); g.moveTo(0, i * s); g.lineTo(W, i * s); g.stroke(); } });
M.tile = texM(tileC, 1, 1, '#ffffff'); M.hfloor = texM(floorC, 1, 1, '#ffffff'); M.mint = texM(P.plaster(71, 20), 1, 1, '#bfe6d6'); M.lead = texM(P.plaster(72, 20), 1, 1, '#7aa0a8');
M.steel = toon({ color: '#c8d0d8' }); M.steelD = toon({ color: '#7a8490' }); M.sheet = toon({ color: '#f8f8f4' }); M.rubber = toon({ color: '#c8683a' }); M.leather = toon({ color: '#7a4a2a' });
M.lampGlow = new THREE.MeshBasicMaterial({ color: '#fffbe8' });
const fluoC = cvs(360, 520, (g, W, H) => { g.fillStyle = '#7dffa0'; g.fillRect(0, 0, W, H); const gr = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.8); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(0,60,20,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(10,50,25,.75)'; g.lineCap = 'round'; g.lineWidth = 10; g.beginPath(); g.moveTo(W / 2, 60); g.lineTo(W / 2, H - 40); g.stroke();
  g.lineWidth = 7; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(W / 2, 120 + i * 40, 120 - Math.abs(i - 3) * 6, 18, 0, 0.1, Math.PI - 0.1); g.stroke(); }
  g.fillStyle = 'rgba(10,50,25,.55)'; g.beginPath(); g.ellipse(W * 0.56, 290, 60, 70, 0.3, 0, 7); g.fill();
  g.strokeStyle = '#0a2a14'; g.lineWidth = 5; g.beginPath(); g.moveTo(30, 260); g.quadraticCurveTo(70, 120, 150, 110); g.quadraticCurveTo(200, 150, W * 0.56, 270); g.stroke(); });
M.screenG = new THREE.MeshBasicMaterial({ color: '#2a5a3a', map: P.tex(fluoC) });
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

// ================= OPERATING THEATRE (world x = 1986): Kane Summit Hospital, Pennsylvania, 1921 =================
const TH = new THREE.Group(); TH.position.set(1986, 0, 0); scene.add(TH);
const thFloorC = cvs(512, 512, (g, W, H) => { const n = 8, s = W / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#2f6a5a' : '#f2ecdc'; g.fillRect(i * s, j * s, s, s); } g.strokeStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, H); g.moveTo(0, i * s); g.lineTo(W, i * s); g.stroke(); } });
const panelC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#8a5a34'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) { g.fillStyle = '#9c6a40'; g.fillRect(i * 128 + 14, 40, 100, 432); g.strokeStyle = '#5a3a20'; g.lineWidth = 6; g.strokeRect(i * 128 + 14, 40, 100, 432); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(i * 128 + 20, 46, 20, 420); } });
M.thFloor = texM(thFloorC, 1, 1, '#ffffff'); M.panel = texM(panelC, 1, 1, '#ffffff'); M.creamW = texM(P.plaster(81, 30), 1, 1, '#fff1d8'); M.bench = toon({ color: '#7a4a2a' }); M.rail = toon({ color: '#c89a3a' });
M.jarGlass = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#e8fff4', transparent: true, opacity: 0.16, depthWrite: false }); M.pink = toon({ color: '#ff7a8a', emissive: '#a02030', emissiveIntensity: 0.35 }); M.jarLid = toon({ color: '#b08a4a' });
M.etherG = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#c8a050', transparent: true, opacity: 0.8 });
add(tbox(10, 0.3, 11, 1.6), M.thFloor, 0, -0.15, -0.5, TH, { cast: false });
for (const [x, z, w, d] of [[0, -6, 10, 0.3], [-5, -0.5, 0.3, 11], [5, -0.5, 0.3, 11]]) { add(tbox(w, 1.6, d, 1.6), M.panel, x, 0.8, z, TH); add(tbox(w, 4.0, d, 2.2), M.creamW, x, 3.6, z, TH); add(box(w + 0.04, 0.1, d + 0.06), M.timber, x, 1.6, z, TH, { cast: false }); }
add(tbox(10, 0.3, 11, 2), M.creamW, 0, 5.6, -0.5, TH, { cast: false });
const skyL = add(box(3.2, 0.05, 2.4), new THREE.MeshBasicMaterial({ color: '#e8f6ff' }), 0, 5.44, -0.8, TH, { cast: false }); for (let i = -1; i <= 1; i++) add(box(0.08, 0.1, 2.5), M.timber, i * 1.07, 5.4, -0.8, TH, { cast: false }); add(box(3.3, 0.1, 0.08), M.timber, 0, 5.4, -0.8, TH, { cast: false });
shaft(TH, [0, 5.4, -0.8], [0, 0.0, -0.3], 1.3, 1.9, '#fff4dc', 0.13);
// tall windows on the side walls
for (const s of [-1, 1]) for (const z of [-3.2, 1.2]) { const wc = skyPane(1.2, 2.2); const w = add(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshBasicMaterial({ map: P.tex(wc) }), s * 4.84, 3.1, z, TH, { cast: false }); w.rotation.y = -s * Math.PI / 2;
  add(box(0.1, 2.3, 0.1), M.timber, s * 4.82, 3.1, z, TH, { cast: false }); add(box(0.1, 0.1, 1.3), M.timber, s * 4.82, 3.1, z, TH, { cast: false }); }
// tiered gallery behind the table
for (let k = 0; k < 3; k++) { const z = -3.3 - k * 0.8, y = 0.45 + k * 0.45; add(tbox(9.4, y, 0.8, 1), M.darkWood, 0, y / 2, z, TH); add(box(9.2, 0.1, 0.35), M.bench, 0, y + 0.42, z - 0.15, TH, { cast: false });
  add(box(9.4, 0.06, 0.06), M.rail, 0, y + 0.95, z + 0.36, TH, { cast: false }); for (let i = -4; i <= 4; i++) add(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), M.rail, i * 1.15, y + 0.47, z + 0.36, TH, { cast: false }); }
// operating table + pillows + sheet
const tt = new THREE.Group(); TH.add(tt);
add(new THREE.CylinderGeometry(0.16, 0.3, 0.8, 16), M.steel, 0, 0.4, 0, tt); add(box(2.1, 0.12, 0.8), M.steelD, 0, 0.86, 0, tt); add(box(2.0, 0.1, 0.74), M.sheet, 0, 0.97, 0, tt);
const pil1 = add(new THREE.SphereGeometry(0.32, 16, 10), M.sheet, 0, 1.25, -0.28, tt); pil1.scale.set(1.6, 0.7, 0.55); pil1.rotation.x = -0.5;
const pil2 = add(new THREE.SphereGeometry(0.28, 16, 10), M.sheet, 0, 1.5, -0.4, tt); pil2.scale.set(1.5, 0.75, 0.5); pil2.rotation.x = -0.6;
M.drape = toon({ color: '#bfe2cf' }); const lap = add(box(0.8, 0.2, 0.5), M.drape, 0, 1.12, 0.25, tt); const lapTop = add(new THREE.CylinderGeometry(0.16, 0.16, 0.8, 16, 1, false, 0, Math.PI), M.drape, 0, 1.22, 0.25, tt); lapTop.rotation.z = Math.PI / 2;
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
add(box(3.2, 2.6, 0.06), M.timber, 0, 1.3, -0.2, jars); for (const sx of [-1.6, 1.6]) add(box(0.06, 2.6, 0.45), M.timber, sx, 1.3, 0, jars); const JARS = [];
for (let k = 0; k < 4; k++) { const y = 0.25 + k * 0.6; add(box(3.0, 0.05, 0.4), M.wood, 0, y, 0.02, jars, { cast: false });
  for (let i = 0; i < 9; i++) { const x = -1.32 + i * 0.33; add(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 14, 1, true), M.jarGlass, x, y + 0.19, 0.05, jars, { cast: false }); add(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 14), M.jarLid, x, y + 0.37, 0.05, jars, { cast: false });
    const ap = add(new THREE.CapsuleGeometry(0.04, 0.15, 4, 8), M.pink, x, y + 0.17, 0.05, jars, { cast: false }); ap.rotation.z = 0.6 + ((i * 7 + k * 3) % 5) * 0.2; JARS.push(ap); } }
const thFill = new THREE.PointLight('#fff4e6', 0, 16, 1.0); thFill.position.set(0.5, 4.2, 3.0); TH.add(thFill);
const thBack = new THREE.PointLight('#ffe8c8', 0, 12, 1.2); thBack.position.set(0, 3.6, -4.2); TH.add(thBack);

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
const WBEDS = []; for (let i = 0; i < 4; i++) { WBEDS.push(wardBed(-2.3, -7.0 + i * 2.4, Math.PI / 2)); WBEDS.push(wardBed(2.3, -7.0 + i * 2.4, -Math.PI / 2)); }
// workbench corner (front right) with wooden tubes, shavings, a lathe-ish wheel
const wb = new THREE.Group(); wb.position.set(1.6, 0, 2.8); WD.add(wb);
add(box(1.8, 0.1, 0.8), M.woodT, 0, 0.9, 0, wb); for (const [x, z] of [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]]) add(box(0.08, 0.9, 0.08), M.bedW, x, 0.45, z, wb, { cast: false });
for (let i = 0; i < 3; i++) { const t = add(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 14), M.woodT, -0.5 + i * 0.18, 0.99, -0.15, wb, { cast: false }); t.rotation.z = Math.PI / 2; }
for (let i = 0; i < 14; i++) { const sh = add(new THREE.TorusGeometry(0.03, 0.006, 4, 10, Math.PI * 1.5), toon({ color: '#e0b070' }), -0.3 + (i * 37 % 60) / 100, 0.955, 0.05 + (i * 13 % 25) / 100, wb, { cast: false }); sh.rotation.x = Math.PI / 2; }
const lwheel = add(new THREE.TorusGeometry(0.28, 0.035, 8, 24), M.ironB, 0.65, 1.25, -0.25, wb); 
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

const lerp = (a, b, t) => a + (b - a) * t;
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
  for (const s of [-1, 1]) { const cw = add(new THREE.PlaneGeometry(0.34, 0.12), M.jetDark, 3.95, 0.3, s * 0.43, J, { cast: false }); cw.rotation.y = s > 0 ? 0.5 : Math.PI - 0.5; cw.rotation.x = s * -0.5; }                  // cockpit glazing
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const w = add(new THREE.PlaneGeometry(0.2, 0.17), M.jetDark, 2.4 - i * 0.62, 0.12, s * 0.558, J, { cast: false }); w.rotation.y = s > 0 ? 0 : Math.PI; }
  const adf = add(box(0.32, 0.03, 0.2), M.jetDark, 2.6, 0.55, 0, J, { cast: false });         // the small roof window (ADF)
  const crack = new THREE.Group(); crack.position.set(2.44, 0.556, 0.1); J.add(crack); crack.visible = false;
  { const pts = [[0, 0], [-0.1, 0.05], [-0.2, 0.02], [-0.31, 0.09], [-0.42, 0.06], [-0.55, 0.13], [-0.68, 0.1], [-0.82, 0.17], [-0.95, 0.15]];
    for (let i = 1; i < pts.length; i++) { const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], L = Math.hypot(x1 - x0, z1 - z0); const m = add(box(L + 0.012, 0.02, 0.026), M.crack, (x0 + x1) / 2, -0.004 * i, (z0 + z1) / 2, crack, { cast: false }); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); m.userData.ndSkip = true; m.userData.keepXr = true; } }
  const wingShape = new THREE.Shape(); wingShape.moveTo(0.9, 0); wingShape.lineTo(-0.9, 0); wingShape.lineTo(-2.5, 5.6); wingShape.lineTo(-1.7, 5.6); wingShape.closePath();
  const wg = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1, bevelEnabled: false });
  for (const s of [-1, 1]) { const wm = add(wg, M.jetSilver, 0.2, -0.28, 0, J); wm.rotation.x = s > 0 ? Math.PI / 2 : -Math.PI / 2; wm.position.z = 0;
    const eng = add(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16), M.jetSilver, 0.75, -0.26, s * 0.78, J); eng.rotation.z = Math.PI / 2; eng.scale.set(1, 1, 0.75); add(new THREE.CircleGeometry(0.17, 16), M.jetDark, 1.51, -0.26, s * 0.78, J, { cast: false }).rotation.y = Math.PI / 2; }
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
const HG = new THREE.Group(); HG.position.set(3000, 0, 0); scene.add(HG);
const corrC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#8a98a4'; g.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 16) { g.fillStyle = (x / 16) % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.10)'; g.fillRect(x, 0, 8, H); } });
M.corr = texM(corrC, 1, 1, '#ffffff'); M.concrete = texM(P.plaster(130, 30), 1, 1, '#b8b4aa'); M.tankSteel = toon({ color: '#3a6a8a' }); M.yellowB = toon({ color: '#f0b81a' });
M.water = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#3aa0d8', transparent: true, opacity: 0.32, depthWrite: false });
add(tbox(44, 0.3, 30, 2), M.concrete, 0, -0.15, -4, HG, { cast: false });
for (const [x, z, w, d] of [[0, -19, 44, 0.3], [-22, -4, 0.3, 30], [22, -4, 0.3, 30]]) add(tbox(w, 28, d, 3), M.corr, x, 14, z, HG);
for (let k = 0; k < 7; k++) { const tr = add(box(44, 0.4, 0.4), M.steelD, 0, 27.5, -17 + k * 4.5, HG, { cast: false }); }
for (const x of [-15, -5, 5, 15]) { const sk = add(box(4, 0.05, 26), new THREE.MeshBasicMaterial({ color: '#eaf4ff' }), x, 27.9, -4, HG, { cast: false }); }
const hgFill = new THREE.PointLight('#f4f8ff', 0, 60, 0.9); hgFill.position.set(0, 18, 8); HG.add(hgFill);
const hgFill2 = new THREE.PointLight('#fff2dc', 0, 50, 1.0); hgFill2.position.set(-8, 12, -10); HG.add(hgFill2);
// tank: open-topped steel box 26 x 6 x 9 with the wings poking through its sides
const TK = new THREE.Group(); TK.position.set(0, 0, -5); HG.add(TK);
const TKF = []; for (const [x, z, w, d] of [[0, -4.5, 28, 0.25], [0, 4.5, 28, 0.25], [-14, 0, 0.25, 9], [14, 0, 0.25, 9]]) { const m = add(box(w, 6, d), M.tankSteel, x, 3, z, TK); if (z > 4) TKF.push(m); }
for (let i = -13; i <= 13; i += 2) { TKF.push(add(box(0.12, 6.05, 0.3), M.steelD, i, 3, 4.62, TK, { cast: false })); }
const cutEdge = add(box(28, 6, 0.04), new THREE.MeshBasicMaterial({ color: '#7fd0ff', transparent: true, opacity: 0.12, depthWrite: false }), 0, 3, 4.5, TK, { cast: false }); cutEdge.userData.ndSkip = true;
for (const [x, z, w, d] of [[0, -4.6, 28.4, 0.5], [0, 4.6, 28.4, 0.5], [-14.1, 0, 0.5, 9.4], [14.1, 0, 0.5, 9.4]]) add(box(w, 0.3, d), M.yellowB, x, 6.1, z, TK, { cast: false });
const water = add(box(27.6, 5.4, 8.6), M.water, 0, 2.8, 0, TK, { cast: false }); water.userData.ndSkip = true;
const waterTop = add(new THREE.PlaneGeometry(27.6, 8.6), new THREE.MeshToonMaterial({ gradientMap: grad, color: '#5ac0f0', transparent: true, opacity: 0.3, depthWrite: false }), 0, 5.5, 0, TK, { cast: false }); waterTop.rotation.x = -Math.PI / 2;
const TJ = makeJet(); TJ.scale.setScalar(2.2); TJ.position.set(0, 9, 0); TK.add(TJ);
// gantry crane + cables
for (const x of [-12, 12]) add(box(0.5, 13, 0.5), M.yellowB, x, 6.5, -5.4, TK); add(box(25, 0.6, 0.6), M.yellowB, 0, 13, -5.4, TK);
add(box(1.2, 13, 0.6), M.yellowB, 0, 6.5, -5.4, TK, { cast: false }).visible = false;
const cables = []; for (const x of [-6, 6]) { const c = add(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), M.jetDark, x, 11, 0, TK, { cast: false }); cables.push(c); }
const beam = add(box(25, 0.5, 0.5), M.yellowB, 0, 13, 0, TK); for (const x of [-12, 12]) add(box(0.5, 0.5, 5.4), M.yellowB, x, 13, -2.7, TK);
// pump room: pipes + pressure gauge
add(new THREE.CylinderGeometry(0.35, 0.35, 10, 12), M.steelD, 15.0, 1.0, -2, TK).rotation.x = Math.PI / 2; add(box(2, 2.4, 2), M.tankSteel, 16.0, 1.2, 2.5, TK);
const gaugeC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#f4efe0'; g.beginPath(); g.arc(256, 256, 240, 0, 7); g.fill(); g.lineWidth = 18; g.strokeStyle = '#2a2a30'; g.stroke(); g.lineWidth = 6;
  for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i * Math.PI * 0.15; g.beginPath(); g.moveTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); g.lineTo(256 + Math.cos(a) * 170, 256 + Math.sin(a) * 170); g.stroke(); }
  g.fillStyle = '#c0303a'; g.beginPath(); g.arc(256, 256, 200, Math.PI * 0.05, Math.PI * 0.25); g.arc(256, 256, 175, Math.PI * 0.25, Math.PI * 0.05, true); g.fill(); g.fillStyle = '#222'; g.font = '700 54px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillText('PSI', 256, 380); });
const gauge = add(new THREE.CircleGeometry(1.2, 32), new THREE.MeshBasicMaterial({ map: P.tex(gaugeC) }), 16.0, 3.2, 3.55, TK, { cast: false });
const needle = add(box(0.06, 1.0, 0.04), M.crack, 16.0, 3.2, 3.6, TK, { cast: false }); needle.geometry.translate(0, 0.45, 0);

const cseaC = cvs(1024, 1024, (g, W, H) => { g.fillStyle = '#e8f0fa'; g.fillRect(0, 0, W, H); const r = P.rng(77); for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * H, rr = 60 + r() * 160; const gr = g.createRadialGradient(x, y - rr * 0.3, rr * 0.1, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(250,252,255,.55)'); gr.addColorStop(1, 'rgba(220,230,245,0)');
  for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) { g.fillStyle = gr; g.save(); g.translate(dx, dy); g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); g.restore(); } } });
const cseaT = P.tex(cseaC); cseaT.wrapS = cseaT.wrapT = THREE.RepeatWrapping; cseaT.repeat.set(14, 14);
const cloudSea = add(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshBasicMaterial({ map: cseaT, color: '#ffffff' }), 0, 190, 0, scene, { cast: false }); cloudSea.rotation.x = -Math.PI / 2; cloudSea.userData.ndSkip = true;
const TBL = new THREE.Group(); TBL.position.set(-12, 0, 5); HG.add(TBL); add(tbox(3.2, 0.12, 1.8, 1), M.wood, 0, 1.0, 0, TBL); for (const [x, z] of [[-1.5, -0.8], [1.5, -0.8], [-1.5, 0.8], [1.5, 0.8]]) add(box(0.1, 1.0, 0.1), M.steelD, x, 0.5, z, TBL);
const bpC = cvs(512, 288, (g, W, H) => { g.fillStyle = '#1f4f9a'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.strokeRect(10, 10, W - 20, H - 20); g.beginPath(); g.moveTo(60, 144); g.lineTo(440, 144); g.moveTo(240, 144); g.lineTo(190, 40); g.moveTo(240, 144); g.lineTo(190, 248); g.moveTo(80, 144); g.lineTo(60, 100); g.moveTo(80, 144); g.lineTo(60, 188); g.stroke(); g.beginPath(); g.ellipse(250, 144, 200, 22, 0, 0, 7); g.stroke(); });
const bp = add(new THREE.PlaneGeometry(2.6, 1.46), new THREE.MeshBasicMaterial({ map: P.tex(bpC) }), 0, 1.07, 0, TBL, { cast: false }); bp.rotation.x = -Math.PI / 2;
const MJ = makeJet(); MJ.scale.setScalar(0.085); MJ.position.set(0.1, 1.42, 0.2); MJ.rotation.set(0, 0.6, 0.06); add(box(0.04, 0.3, 0.04), M.steelD, 0.1, 1.22, 0.2, TBL); TBL.add(MJ);
// ---- grey sea ----
const SEA = new THREE.Group(); SEA.position.set(4000, 0, 0); scene.add(SEA);
const seaC = cvs(512, 512, (g, W, H) => { g.fillStyle = '#4a6a80'; g.fillRect(0, 0, W, H); const r = P.rng(9); for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H; g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.14)' : 'rgba(0,20,40,.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 4, x + 22, y); g.stroke(); } });
const seaTex = P.tex(seaC); seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.repeat.set(30, 30);
const seaP = add(new THREE.PlaneGeometry(600, 600), new THREE.MeshToonMaterial({ gradientMap: grad, map: seaTex, color: '#ffffff' }), 0, 0, 0, SEA, { cast: false }); seaP.rotation.x = -Math.PI / 2;
// ---- modern cabin (x = 2450) ----
const CB = new THREE.Group(); CB.position.set(3300, 0, 0); scene.add(CB);
const cabWall = add(new THREE.CylinderGeometry(1.9, 1.9, 16, 32, 1, true, Math.PI * 0.25, Math.PI * 1.5), toon({ color: '#eceff2', side: THREE.BackSide }), 0, 1.2, -4, CB); cabWall.rotation.x = Math.PI / 2;
add(box(3.6, 0.1, 16), toon({ color: '#3a4458' }), 0, 0, -4, CB, { cast: false }); add(box(0.5, 0.11, 16), toon({ color: '#c0303a' }), 0, 0.001, -4, CB, { cast: false });
const roundWinC = cvs(256, 384, (g, W, H) => { g.fillStyle = '#d8dde2'; g.fillRect(0, 0, W, H); g.save(); g.beginPath(); g.roundRect(40, 40, 176, 304, 88); g.clip(); const gr = g.createLinearGradient(0, 40, 0, 344); gr.addColorStop(0, '#5aa8f0'); gr.addColorStop(1, '#d8ecff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.9)'; for (const [x, y, r] of [[90, 250, 40], [140, 240, 50], [190, 262, 36]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.restore(); g.lineWidth = 14; g.strokeStyle = '#b8c0c8'; g.beginPath(); g.roundRect(40, 40, 176, 304, 88); g.stroke(); });
const RW = []; for (let i = 0; i < 7; i++) { const w = add(new THREE.PlaneGeometry(0.5, 0.75), new THREE.MeshBasicMaterial({ map: P.tex(roundWinC), transparent: true }), -1.82, 1.45, -0.05 - i * 1.6, CB, { cast: false }); w.rotation.y = Math.PI / 2; RW.push(w); }
M.seatB = toon({ color: '#24479a' }); M.seatW = toon({ color: '#f4f4f0' }); M.bin = toon({ color: '#f6f7f8' });
for (let i = 0; i < 7; i++) for (const x of [-1.0, -0.45, 0.45, 1.0]) { const z = -0.1 - i * 1.6; add(box(0.5, 0.14, 0.52), M.seatB, x, 0.46, z + 0.05, CB); add(box(0.5, 0.66, 0.13), M.seatB, x, 0.78, z - 0.22, CB); add(box(0.44, 0.18, 0.15), M.seatW, x, 1.05, z - 0.21, CB, { cast: false }); add(box(0.06, 0.12, 0.5), M.seatB, x + (x < 0 ? 0.27 : -0.27), 0.62, z + 0.03, CB, { cast: false }); }
for (const sx of [-1, 1]) { const b = add(box(0.85, 0.42, 15.5), M.bin, sx * 1.28, 2.32, -4, CB); b.rotation.z = sx * 0.35; }
for (const z of [3.9, -11.9]) add(new THREE.CircleGeometry(1.9, 32), toon({ color: z > 0 ? '#e4e8ec' : '#b8c4d4', side: THREE.DoubleSide }), 0, 1.2, z, CB, { cast: false });
for (let i = 0; i < 8; i++) add(box(0.5, 0.02, 0.9), new THREE.MeshBasicMaterial({ color: '#fffdf4' }), 0, 2.76, 2 - i * 1.9, CB, { cast: false });
add(box(2.0, 0.2, 15.5), toon({ color: '#f4f6f8' }), 0, 2.82, -4, CB, { cast: false });
const cbFill = new THREE.PointLight('#f4f8ff', 0, 14, 1.0); cbFill.position.set(0.3, 2.3, 1.5); CB.add(cbFill);

// ================= RUPERT'S DROP: Royal Society lab (x=5000), Thames dock (x=5400), throne room (x=5800), glasshouse (x=6200), modern street (x=6600) =================
const RP = P.rng(1660);
// ---------- the glass drop (lathe), crack line, shards ----------
const DR = 0.1, DL = 0.5, DS0 = DR * 1.55;
const dropR = (s) => s < DR ? (DR + 0.011) * Math.sqrt(Math.max(0, 1 - ((s - DR) / DR) ** 2)) : Math.max(0.004, DR * Math.exp(-(((s - DR) / 0.085) ** 1.5)) + 0.011 * Math.exp(-(s - DR) / 0.22));
const dropBend = (s) => s > DS0 ? 0.3 * ((s - DS0) / (DL - DS0)) ** 2 * (DL - DS0) : 0;
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
add(tbox(12, 0.3, 10, 1.6), M.stone, 0, -0.15, 0, GH, { cast: false });
for (const [x, z, w, d] of [[0, -5, 12, 0.3], [-6, 0, 0.3, 10], [6, 0, 0.3, 10]]) add(tbox(w, 5, d, 2), M.brick, x, 2.5, z, GH);
const FUR = new THREE.Group(); FUR.position.set(-1.2, 0, -2.8); GH.add(FUR);
const R_dome = add(new THREE.SphereGeometry(1.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.brick, 0, 0.9, 0, FUR); add(new THREE.CylinderGeometry(1.6, 1.7, 0.9, 24), M.brick, 0, 0.45, 0, FUR);
const mouthC = cvs(256, 256, (g, W, H) => { const gr = g.createRadialGradient(128, 150, 10, 128, 140, 128); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.35, '#ffc040'); gr.addColorStop(0.8, '#ff5a10'); gr.addColorStop(1, '#7a1a00'); g.fillStyle = gr; g.beginPath(); g.arc(128, 150, 120, Math.PI, 0); g.lineTo(248, 256); g.lineTo(8, 256); g.closePath(); g.fill(); });
const mouth = add(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: P.tex(mouthC), transparent: true }), 0, 1.0, 1.62, FUR, { cast: false }); mouth.userData.ndSkip = true;
add(new THREE.CylinderGeometry(0.3, 0.35, 2.5, 12), M.brick, 0, 3.3, -0.4, FUR);
const ghFire = new THREE.PointLight('#ffb050', 0, 10, 1.2); ghFire.position.set(-1.2, 1.2, -0.8); GH.add(ghFire);
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
add(tbox(80, 0.3, 4, 1), texM(P.plaster(191, 10), 20, 1, '#d8d4cc'), 0, 0.05, -5, R_ST, { cast: false }); add(tbox(80, 0.3, 4, 1), texM(P.plaster(192, 10), 20, 1, '#d8d4cc'), 0, 0.05, 9, R_ST, { cast: false }); add(tbox(80, 0.2, 30, 1), M.grass, 0, -0.05, 26, R_ST, { cast: false });
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
const CWIN = add(new THREE.ShapeGeometry(winS), M.carGlass, 0, 0, 0.955, CAR, { cast: false }); add(new THREE.ShapeGeometry(winS), new THREE.MeshBasicMaterial({ color: '#1a1e28' }), 0, 0, 0.945, CAR, { cast: false });
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
M.sledS = toon({ color: '#c8ccd2' }); M.sledR = toon({ color: '#d8382e' }); M.sledD = toon({ color: '#3a3e46' }); M.fl1 = new THREE.MeshBasicMaterial({ color: '#ffd890' }); M.fl2 = new THREE.MeshBasicMaterial({ color: '#ff9a20', transparent: true, opacity: 0.85, depthWrite: false });
const SLED = new THREE.Group(); DES.add(SLED);
for (const S_z of [-1.1, 1.1]) { add(box(6.2, 0.22, 0.26), M.sledS, 0, 0.75, S_z * 0.75, SLED); for (const S_x of [-2.4, 2.4]) add(box(0.7, 0.3, 0.3), M.sledD, S_x, 0.52, S_z, SLED); }
for (const S_x of [-2.6, -1.2, 0.4, 2.0]) add(box(0.18, 0.18, 1.9), M.sledS, S_x, 0.75, 0, SLED);
add(box(2.0, 0.12, 1.5), M.sledS, 1.9, 0.92, 0, SLED);                       // pilot deck (front = +S_x)
add(box(0.18, 0.95, 1.0), M.sledR, 1.45, 1.42, 0, SLED); add(box(0.6, 0.12, 1.0), M.sledR, 1.75, 1.25, 0, SLED); // seat back + pan
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
const STVHOT = []; STVHOT.push(add(box(1.0, 1.0, 0.75), M.stoveHot, 0, 0.6, 0, STV)); add(box(1.1, 0.08, 0.85), M.iron, 0, 1.12, 0, STV); for (const [x, z] of [[-0.42, -0.3], [0.42, -0.3], [-0.42, 0.3], [0.42, 0.3]]) add(box(0.08, 0.12, 0.08), M.iron, x, 0.06, z, STV);
STVHOT.push(add(new THREE.CylinderGeometry(0.11, 0.11, 2.3, 14), M.stoveHot, 0.2, 2.3, -0.1, STV));
M.grate = hdr('#ff7a20', 2.6); const grate = add(new THREE.PlaneGeometry(0.55, 0.38), M.grate, 0, 0.55, 0.381, STV, { cast: false }); grate.userData.ndSkip = true;
for (let i = 0; i < 6; i++) add(box(0.02, 0.38, 0.01), M.iron, -0.24 + i * 0.1, 0.55, 0.385, STV, { cast: false });
const sdoor = add(box(0.62, 0.45, 0.04), M.iron, 0, 0.55, 0.4, STV, { cast: false }); sdoor.geometry.translate(0.31, 0, 0); sdoor.position.x = -0.31; for (const y of [-0.12, -0.04, 0.04, 0.12]) { const sl = add(new THREE.PlaneGeometry(0.4, 0.028), M.grate, 0.31, y, 0.022, sdoor, { cast: false }); sl.userData.ndSkip = true; } { const ash = add(new THREE.PlaneGeometry(0.5, 0.07), M.grate, 0, 0.22, 0.378, STV, { cast: false }); ash.userData.ndSkip = true; }
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
const steakC = cvs(256, 256, (g, W, H) => { g.fillStyle = '#c8414a'; g.fillRect(0, 0, W, H); const r = P.rng(33); g.strokeStyle = 'rgba(255,236,236,.75)'; g.lineCap = 'round'; for (let i = 0; i < 26; i++) { g.lineWidth = 2 + r() * 4; g.beginPath(); let x = r() * W, y = r() * H; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 60; y += (r() - 0.3) * 40; g.lineTo(x, y); } g.stroke(); } g.fillStyle = 'rgba(120,20,30,.35)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(r() * W, r() * H, 6 + r() * 12, 0, 7); g.fill(); } });
const steakT = P.tex(steakC); steakT.wrapS = steakT.wrapT = THREE.RepeatWrapping; steakT.repeat.set(5, 5);
const STEAK = add(new THREE.ExtrudeGeometry(stS, { depth: 0.012, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 3 }), new THREE.MeshStandardMaterial({ map: steakT, roughness: 0.55, color: '#ffffff' }), 0.08, 0.98, 0, RACK); STEAK.rotation.x = -Math.PI / 2; STEAK.scale.setScalar(1.05); STEAK.material.userData.keepStd = true;
const fatRim = add(new THREE.ExtrudeGeometry(stS, { depth: 0.01, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#f4e4dc', roughness: 0.6 }), 0.08, 0.978, 0, RACK); fatRim.rotation.x = -Math.PI / 2; fatRim.scale.set(1.12, 1.12, 1);
const EGGS = []; for (let i = 0; i < 3; i++) { const B_e = add(new THREE.SphereGeometry(0.032, 14, 10), new THREE.MeshStandardMaterial({ color: '#f6f0e2', roughness: 0.4 }), -0.15 + (i % 2) * 0.06, 1.005, -0.08 + i * 0.07, RACK); B_e.scale.set(1, 1.28, 1); B_e.rotation.z = Math.PI / 2; EGGS.push(B_e); }
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
const BT = new THREE.Group(); BT.position.set(0.2, 0.97, -1.35); STU.add(BT); add(box(0.16, 0.06, 0.12), M.timber, 0, 0.03, 0, BT); add(box(0.12, 0.7, 0.03), toon({ color: '#9a8662' }), 0, 0.41, 0, BT); add(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), new THREE.MeshBasicMaterial({ color: '#e8f0f8' }), 0, 0.42, 0.02, BT, { cast: false }); add(box(0.008, 0.3, 0.008), new THREE.MeshBasicMaterial({ color: '#d02020' }), 0, 0.27, 0.025, BT, { cast: false }); add(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: '#d02020' }), 0, 0.12, 0.025, BT, { cast: false });
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

// ================= STRATTON (1890s): Berkeley psychology lab (x=12000), bedroom at night (x=12400) =================
const SRG = P.rng(1896);
// ---------- the lab (sunny afternoon) ----------
const SLAB = new THREE.Group(); SLAB.position.set(12000, 0, 0); scene.add(SLAB);
M.sWall = texM(P.plaster(1896, 46), 1, 1, '#f4e6c8'); M.sPanel = toon({ color: '#7a4a2e' }); M.sTrim = toon({ color: '#5a321e' });
add(tbox(8, 0.3, 8, 1.4), M.plank, 0, -0.15, 0, SLAB, { cast: false });
// walls: back z=-3, left x=-3.5 (window wall, no shadow so the sun spills in), right x=3.5
for (const [x, z, w, d, cs] of [[0, -3, 8, 0.3, true], [-3.5, 0, 0.3, 8, false], [3.5, 0, 0.3, 8, true]]) { add(tbox(w, 3.6, d, 1.3), M.sWall, x, 1.8, z, SLAB, { cast: cs }); add(box(w + 0.02, 1.0, d + 0.02), M.sPanel, x, 0.5, z, SLAB, { cast: false }); add(box(w + 0.03, 0.07, d + 0.05), M.sTrim, x, 1.02, z, SLAB, { cast: false }); add(box(w + 0.03, 0.12, d + 0.05), M.sTrim, x, 3.5, z, SLAB, { cast: false }); }
add(tbox(8, 0.3, 8, 1.3), M.sWall, 0, 3.75, 0, SLAB, { cast: false }); for (const x of [-2, 0, 2]) add(box(0.22, 0.2, 8), M.sTrim, x, 3.52, 0, SLAB, { cast: false });
// sRug
const rugC = cvs(256, 192, (g, W, H) => { g.fillStyle = '#9a2a2a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8c070'; g.lineWidth = 8; g.strokeRect(12, 12, W - 24, H - 24); g.strokeStyle = '#2a3a6a'; g.lineWidth = 5; g.strokeRect(26, 26, W - 52, H - 52); g.fillStyle = '#e8c070'; g.beginPath(); g.ellipse(W / 2, H / 2, 46, 30, 0, 0, 7); g.fill(); g.fillStyle = '#2a3a6a'; g.beginPath(); g.ellipse(W / 2, H / 2, 26, 16, 0, 0, 7); g.fill(); });
const sRug = add(new THREE.PlaneGeometry(3.2, 2.3), toon({ map: P.tex(rugC) }), 0.2, 0.012, 0.1, SLAB, { cast: false }); sRug.rotation.x = -Math.PI / 2;
// big window on the left wall: California hills + eucalyptus, bright
const swinC = cvs(320, 400, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5aa8f0'); gr.addColorStop(0.6, '#bfe2ff'); gr.addColorStop(1, '#fff2d0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff'; for (const [x, y, r] of [[70, 80, 26], [100, 74, 32], [130, 84, 22], [230, 120, 20], [255, 112, 26]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.fillStyle = '#d8b060'; g.beginPath(); g.moveTo(0, 300); g.quadraticCurveTo(110, 230, 200, 280); g.quadraticCurveTo(270, 250, 320, 270); g.lineTo(320, 400); g.lineTo(0, 400); g.fill();
  g.fillStyle = '#c09048'; g.beginPath(); g.moveTo(0, 340); g.quadraticCurveTo(160, 300, 320, 340); g.lineTo(320, 400); g.lineTo(0, 400); g.fill();
  for (const [x, h] of [[60, 150], [250, 120], [290, 90]]) { g.fillStyle = '#7a6a5a'; g.fillRect(x - 4, 330 - h * 0.5, 8, h * 0.5); g.fillStyle = '#5a8a5a'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + (k - 2) * 14, 330 - h * 0.55 - (k % 2) * 20, 22, 30, 0, 0, 7); g.fill(); } }
  g.strokeStyle = '#f4f0e6'; g.lineWidth = 18; g.strokeRect(9, 9, W - 18, H - 18); g.lineWidth = 10; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H * 0.45); g.lineTo(W, H * 0.45); g.stroke(); });
const sWinP = add(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: P.tex(swinC), color: new THREE.Color(1.25, 1.22, 1.15) }), -3.34, 1.95, -0.9, SLAB, { cast: false }); sWinP.rotation.y = Math.PI / 2; sWinP.userData.ndSkip = false;
add(box(0.1, 0.1, 1.75), M.white, -3.3, 0.95, -0.9, SLAB); // sill
for (const z of [-1.95, 0.15]) { const cur = add(box(0.08, 2.4, 0.4), toon({ color: '#c8a040' }), -3.28, 1.95, z, SLAB, { cast: false }); }
shaft(SLAB, [-3.3, 2.7, -0.9], [-1.4, 0.0, -0.5], 0.5, 0.9, '#fff0c8', 0.1, 'strat');
const sunPool = add(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2cc').multiplyScalar(0.55), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), -1.2, 0.02, -0.4, SLAB, { cast: false }); sunPool.rotation.x = -Math.PI / 2; sunPool.userData.ndSkip = true;
// workbench along the back wall with brass instruments and glassware
const SWB = new THREE.Group(); SWB.position.set(0.6, 0, -2.45); SLAB.add(SWB);
add(tbox(2.6, 0.08, 0.85, 1), M.darkWood, 0, 0.92, 0, SWB); for (const sx of [-1.15, 1.15]) add(box(0.22, 0.88, 0.8), M.darkWood, sx, 0.44, 0, SWB); add(box(2.2, 0.06, 0.7), M.timber, 0, 0.3, 0, SWB);
const lensStand = new THREE.Group(); lensStand.position.set(-0.6, 0.96, 0.05); SWB.add(lensStand); add(new THREE.CylinderGeometry(0.08, 0.1, 0.03, 16), M.brass, 0, 0.015, 0, lensStand); add(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), M.brass, 0, 0.17, 0, lensStand); add(new THREE.TorusGeometry(0.07, 0.012, 8, 24), M.brass, 0, 0.36, 0, lensStand);
M.sGlass = new THREE.MeshStandardMaterial({ color: '#dff0ff', transparent: true, opacity: 0.35, roughness: 0.04, metalness: 0.1 }); M.sGlass.userData.keepStd = true;
add(new THREE.CircleGeometry(0.062, 24), M.sGlass, 0, 0.36, 0, lensStand, { cast: false });
const sScope = new THREE.Group(); sScope.position.set(0.15, 0.96, 0); SWB.add(sScope); add(box(0.16, 0.03, 0.14), M.ironK, 0, 0.015, 0, sScope); add(box(0.03, 0.22, 0.03), M.ironK, -0.04, 0.12, 0, sScope); const tb = add(new THREE.CylinderGeometry(0.025, 0.03, 0.24, 12), M.brass, 0.01, 0.26, 0, sScope); tb.rotation.z = 0.35;
for (const [x, h, r] of [[0.6, 0.18, 0.05], [0.75, 0.24, 0.04], [0.9, 0.14, 0.06]]) { add(new THREE.CylinderGeometry(r, r, h, 16), M.sGlass, x, 0.96 + h / 2, 0.1, SWB, { cast: false }); add(new THREE.CylinderGeometry(r * 0.92, r * 0.92, h * 0.45, 14), toon({ color: ['#3a8ad0', '#d8a020', '#4ab070'][Math.round(x * 10) % 3] }), x, 0.96 + h * 0.23, 0.1, SWB, { cast: false }); }
for (let i = 0; i < 4; i++) add(box(0.06 + SRG() * 0.03, 0.26, 0.2), M.books[i * 2], -1.05 + i * 0.09, 1.09, -0.15, SWB, { cast: false });
const SCAND = []; { add(new THREE.CylinderGeometry(0.05, 0.065, 0.04, 12), M.brass, -0.2, 0.98, 0.15, SWB); add(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 10), M.white, -0.2, 1.09, 0.15, SWB); const fl = add(new THREE.SphereGeometry(0.02, 8, 6), hdr('#ffc060', 2.6), -0.2, 1.205, 0.15, SWB, { cast: false }); fl.scale.set(1, 1.9, 1); fl.userData.ndSkip = true; SCAND.push(fl); }
// chalkboard with an optics sketch (lens, crossing rays, upright arrow -> inverted arrow); no lettering
const chalkC = cvs(512, 320, (g, W, H) => { g.fillStyle = '#24382e'; g.fillRect(0, 0, W, H); g.strokeStyle = '#7a4a2a'; g.lineWidth = 22; g.strokeRect(0, 0, W, H); g.strokeStyle = 'rgba(240,240,230,.9)'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(90, 200); g.lineTo(90, 110); g.moveTo(78, 124); g.lineTo(90, 108); g.lineTo(102, 124); g.stroke(); g.beginPath(); g.ellipse(256, 160, 14, 70, 0, 0, 7); g.stroke();
  g.setLineDash([10, 8]); g.beginPath(); g.moveTo(90, 110); g.lineTo(420, 215); g.moveTo(90, 200); g.lineTo(420, 120); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(420, 120); g.lineTo(420, 210); g.moveTo(408, 196); g.lineTo(420, 212); g.lineTo(432, 196); g.stroke();
  g.beginPath(); g.arc(440, 165, 70, -1.1, 1.1); g.stroke(); g.fillStyle = 'rgba(240,240,230,.25)'; g.fillRect(60, 270, 120, 6); g.fillRect(320, 50, 90, 5); });
const chalk = add(new THREE.PlaneGeometry(1.7, 1.06), toon({ map: P.tex(chalkC) }), -1.35, 2.15, -2.84, SLAB, { cast: false });
// wall calendar: a page with one big day number (redrawn per day)
const calC = document.createElement('canvas'); calC.width = 200; calC.height = 260; const calT = P.tex(calC); calT.wrapS = calT.wrapT = THREE.ClampToEdgeWrapping;
const drawCal = (d) => { const g = calC.getContext('2d'); g.fillStyle = '#f6f0e0'; g.fillRect(0, 0, 200, 260); g.fillStyle = '#c0302a'; g.fillRect(0, 0, 200, 62); g.fillStyle = '#2a2a2a'; for (const x of [50, 150]) { g.beginPath(); g.arc(x, 14, 7, 0, 7); g.fill(); } g.font = '900 150px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1e1e24'; g.fillText(String(d), 100, 168); calT.needsUpdate = true; };
drawCal(1); let calDay = 1;
const cal = add(new THREE.PlaneGeometry(0.46, 0.6), new THREE.MeshBasicMaterial({ map: calT, color: new THREE.Color(0.92, 0.92, 0.92) }), -2.75, 2.05, -2.84, SLAB, { cast: false });
// bookshelf on the right wall, door, coat sRack, plant, hanging lamp
const sshelf = new THREE.Group(); sshelf.position.set(3.15, 0, -1.4); sshelf.rotation.y = -Math.PI / 2; SLAB.add(sshelf); add(box(1.8, 2.6, 0.42), M.timber, 0, 1.3, 0, sshelf);
for (let r = 0; r < 4; r++) { let x = -0.8; while (x < 0.8) { const w = 0.06 + SRG() * 0.07, h = 0.32 + SRG() * 0.16; add(box(w, h, 0.3), M.books[Math.floor(SRG() * 8)], x + w / 2, 0.3 + r * 0.6 + h / 2, 0.08, sshelf, { cast: false }); x += w + 0.01; } }
const SBOOKS = []; for (let i = 0; i < 5; i++) { const b = add(box(0.07, 0.36, 0.26), M.books[(i * 3) % 8], 3.0, 0.3 + 3 * 0.6 + 0.18, -1.9 + i * 0.1, SLAB, { cast: false }); b.userData.base = b.position.clone(); SBOOKS.push(b); }
add(box(0.08, 2.2, 1.0), M.door, 3.32, 1.1, 1.3, SLAB); add(new THREE.SphereGeometry(0.04, 8, 6), M.brass, 3.26, 1.05, 0.95, SLAB);
const sRack = new THREE.Group(); sRack.position.set(2.7, 0, 2.3); SLAB.add(sRack); add(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), M.timber, 0, 0.9, 0, sRack); add(new THREE.CylinderGeometry(0.22, 0.25, 0.04, 12), M.timber, 0, 0.02, 0, sRack); add(new THREE.CylinderGeometry(0.17, 0.2, 0.12, 16), toon({ color: '#2a2a30' }), 0.08, 1.75, 0, sRack); add(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 20), toon({ color: '#2a2a30' }), 0.08, 1.69, 0, sRack);
const plant = new THREE.Group(); plant.position.set(-3.0, 0, -2.5); SLAB.add(plant); add(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 14), toon({ color: '#c06a3a' }), 0, 0.2, 0, plant); for (let i = 0; i < 9; i++) { const lf = add(new THREE.SphereGeometry(0.16, 8, 6), M.bush, Math.sin(i * 2.1) * 0.18, 0.55 + (i % 3) * 0.17, Math.cos(i * 2.1) * 0.18, plant); lf.scale.set(0.7, 1.3, 0.7); }
const lampH = new THREE.Group(); lampH.position.set(0.3, 3.6, -0.3); SLAB.add(lampH); add(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 4), M.ironK, 0, -0.35, 0, lampH, { cast: false }); add(new THREE.CylinderGeometry(0.3, 0.12, 0.18, 18, 1, true), toon({ color: '#2f5a3a', side: THREE.DoubleSide }), 0, -0.78, 0, lampH, { cast: false });
const lampG = add(new THREE.SphereGeometry(0.07, 12, 10), hdr('#ffd08a', 1.9), 0, -0.86, 0, lampH, { cast: false }); lampG.userData.ndSkip = true;
// the experiment corner: small round table (cup + water jug) and a chair that gets knocked over
const STBL = new THREE.Group(); STBL.position.set(-0.85, 0, -0.55); SLAB.add(STBL); add(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 24), M.darkWood, 0, 0.78, 0, STBL); add(new THREE.CylinderGeometry(0.05, 0.08, 0.76, 10), M.darkWood, 0, 0.38, 0, STBL); add(new THREE.CylinderGeometry(0.22, 0.25, 0.04, 16), M.darkWood, 0, 0.02, 0, STBL);
const SCUP = new THREE.Group(); SCUP.position.set(0.12, 0.805, 0.08); SCUP.scale.setScalar(1.9); STBL.add(SCUP); add(new THREE.CylinderGeometry(0.075, 0.06, 0.012, 20), M.white, 0, 0.006, 0, STBL.children.length ? SCUP : SCUP);
const cupBody = new THREE.Group(); SCUP.add(cupBody); add(new THREE.CylinderGeometry(0.045, 0.035, 0.07, 18), M.white, 0, 0.047, 0, cupBody); add(new THREE.TorusGeometry(0.022, 0.006, 6, 12), M.white, 0.05, 0.05, 0, cupBody); add(new THREE.CylinderGeometry(0.041, 0.041, 0.004, 18), toon({ color: '#6ab0e8' }), 0, 0.078, 0, cupBody, { cast: false });
cupBody.children.forEach((c) => c.geometry.translate(0.035, 0, 0)); cupBody.position.x = -0.035;
const jug = add(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 18), M.sGlass, -0.14, 0.915, -0.05, STBL, { cast: false }); add(new THREE.CylinderGeometry(0.068, 0.075, 0.12, 16), toon({ color: '#7ac0f0' }), -0.14, 0.865, -0.05, STBL, { cast: false });
const SCHAIR = new THREE.Group(); SCHAIR.position.set(0.95, 0, -0.35); SLAB.add(SCHAIR); const chairIn = new THREE.Group(); SCHAIR.add(chairIn);
add(box(0.46, 0.05, 0.46), M.timber, 0, 0.47, 0, chairIn); for (const [x, z] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) add(box(0.045, 0.47, 0.045), M.timber, x, 0.235, z, chairIn); add(box(0.46, 0.55, 0.045), M.timber, 0, 0.78, -0.2, chairIn);
// key/fill for the lab
const sLabFill = new THREE.PointLight('#fff2dc', 0, 14, 1.0); sLabFill.position.set(1.0, 3.0, 2.2); SLAB.add(sLabFill);
const sSunL = new THREE.PointLight('#ffe2a8', 0, 9, 1.2); sSunL.position.set(-2.6, 2.2, -0.9); SLAB.add(sSunL);
const sCandL = new THREE.PointLight('#ffb870', 0, 3, 1.5); sCandL.position.set(0.4, 1.4, -2.2); SLAB.add(sCandL);
// ---------- bedroom (night, candle + moonlight) ----------
const SBED = new THREE.Group(); SBED.position.set(12400, 0, 0); scene.add(SBED);
const wpC = cvs(256, 256, (g, W, H) => { g.fillStyle = '#3a4a7a'; g.fillRect(0, 0, W, H); g.fillStyle = '#4a5c90'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.ellipse(32 + x * 64 + (y % 2) * 32, 32 + y * 64, 9, 14, 0, 0, 7); g.fill(); } g.strokeStyle = '#2e3c66'; g.lineWidth = 3; for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } });
M.bWall = texM(wpC, 3, 2);
add(tbox(6, 0.3, 6, 1.4), M.plank, 0, -0.15, 0, SBED, { cast: false });
for (const [x, z, w, d] of [[0, -2.4, 6, 0.3], [-2.6, 0, 0.3, 6], [2.6, 0, 0.3, 6]]) { add(box(w, 3.2, d), M.bWall, x, 1.6, z, SBED); add(box(w + 0.02, 0.18, d + 0.03), M.sTrim, x, 0.09, z, SBED, { cast: false }); }
const SBEDF = new THREE.Group(); SBEDF.position.set(0.2, 0, -1.3); SBEDF.rotation.y = Math.PI / 2; SBED.add(SBEDF);
add(box(1.2, 0.35, 2.0), M.timber, 0, 0.3, 0, SBEDF); add(box(1.25, 1.0, 0.08), M.timber, 0, 0.6, -1.02, SBEDF); add(box(1.25, 0.6, 0.08), M.timber, 0, 0.4, 1.02, SBEDF);
add(box(1.12, 0.16, 1.9), M.white, 0, 0.55, 0, SBEDF); const quiltC = cvs(256, 256, (g, W, H) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = ['#c0403a', '#e8c070', '#3a7ab0', '#f2ead8'][(x + y * 3) % 4]; g.fillRect(x * 32, y * 32, 32, 32); } g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, H); g.moveTo(0, i * 32); g.lineTo(W, i * 32); g.stroke(); } });
add(box(1.18, 0.1, 1.25), toon({ map: P.tex(quiltC) }), 0, 0.66, 0.33, SBEDF); const pil = add(new THREE.SphereGeometry(0.28, 14, 10), M.white, 0, 0.7, -0.72, SBEDF); pil.scale.set(1.6, 0.4, 0.8);
const NS = new THREE.Group(); NS.position.set(-1.25, 0, -1.75); SBED.add(NS); add(box(0.45, 0.6, 0.4), M.darkWood, 0, 0.3, 0, NS); add(new THREE.CylinderGeometry(0.06, 0.08, 0.04, 12), M.brass, 0, 0.62, 0, NS); add(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 10), M.white, 0, 0.72, 0, NS);
const bFl = add(new THREE.SphereGeometry(0.022, 8, 6), hdr('#ffc060', 2.8), 0, 0.825, 0, NS, { cast: false }); bFl.scale.set(1, 1.9, 1); bFl.userData.ndSkip = true;
const bwinC = cvs(256, 320, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0e1a40'); gr.addColorStop(1, '#2a3a70'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) { g.globalAlpha = 0.4 + (i % 3) * 0.2; g.beginPath(); g.arc((i * 73) % W, (i * 41) % (H * 0.7), 1.5 + (i % 2), 0, 7); g.fill(); } g.globalAlpha = 1; g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(170, 80, 30, 0, 7); g.fill(); g.fillStyle = '#1e2a50'; g.beginPath(); g.arc(184, 72, 28, 0, 7); g.fill(); g.strokeStyle = '#5a321e'; g.lineWidth = 16; g.strokeRect(8, 8, W - 16, H - 16); g.lineWidth = 9; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); });
add(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ map: P.tex(bwinC), color: new THREE.Color(1.1, 1.1, 1.2) }), 1.4, 1.75, -2.24, SBED, { cast: false });
const bCandL = new THREE.PointLight('#ffb060', 0, 5, 1.3); bCandL.position.set(-1.15, 1.0, -1.45); SBED.add(bCandL);
const bMoonL = new THREE.PointLight('#8aa8ff', 0, 8, 1.0); bMoonL.position.set(1.4, 2.2, 0.8); SBED.add(bMoonL);

// ================= GOLDBERGER (1916): clinic (x=12800), ward (x=13200), sharecropper porch (x=13600), modern kitchen (x=14000) =================
const GRG = P.rng(1916);
const GLASS = (col = '#e6f4ff', op = 0.32) => { const m = new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: op, roughness: 0.05, metalness: 0.1 }); m.userData.keepStd = true; return m; };
M.gTile = texM(cvs(256, 256, (g, W, H) => { g.fillStyle = '#9fd2c4'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8f4ee'; g.lineWidth = 6; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, H); g.moveTo(0, i * 64); g.lineTo(W, i * 64); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.18)'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) g.fillRect(x * 64 + 8, y * 64 + 8, 20, 6); }), 6, 2);
M.gFloor = texM(cvs(256, 256, (g, W, H) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#2f5a5a' : '#efe6d2'; g.fillRect(x * 32, y * 32, 32, 32); } }), 6, 6);
M.gWall = texM(P.plaster(1916, 44), 1, 1, '#f6ecd4'); M.gTrim = toon({ color: '#3f6a5a' }); M.enamel = toon({ color: '#f8f8f4' }); M.enRim = toon({ color: '#2a5aa0' });
M.dough = toon({ color: '#ead6a6' }); M.flour = new THREE.MeshBasicMaterial({ color: '#fbf8f0', transparent: true, opacity: 0.8, depthWrite: false });
// ---------- clinic (warm Southern afternoon) ----------
const GCL = new THREE.Group(); GCL.position.set(12800, 0, 0); scene.add(GCL);
add(tbox(8, 0.3, 8, 1.4), M.gFloor, 0, -0.15, 0, GCL, { cast: false });
for (const [x, z, w, d, cs] of [[0, -3, 8, 0.3, true], [-3.5, 0, 0.3, 8, false], [3.5, 0, 0.3, 8, true]]) {
  add(tbox(w, 3.6, d, 1.3), M.gWall, x, 1.8, z, GCL, { cast: cs }); add(box(w + 0.02, 1.2, d + 0.02), M.gTile, x, 0.6, z, GCL, { cast: false });
  add(box(w + 0.03, 0.06, d + 0.05), M.gTrim, x, 1.22, z, GCL, { cast: false }); add(box(w + 0.03, 0.12, d + 0.05), M.gTrim, x, 0.06, z, GCL, { cast: false }); }
add(tbox(8, 0.3, 8, 1.3), M.gWall, 0, 3.75, 0, GCL, { cast: false });
// window on the left wall: live oaks with Spanish moss, hot sky
const gwinC = cvs(320, 400, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5ab0f0'); gr.addColorStop(0.65, '#cfeaff'); gr.addColorStop(1, '#fff0c8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#6a9a48'; g.beginPath(); g.moveTo(0, 330); g.quadraticCurveTo(160, 300, 320, 320); g.lineTo(320, 400); g.lineTo(0, 400); g.fill();
  for (const [x, y, r] of [[70, 200, 80], [250, 230, 70]]) { g.fillStyle = '#5a4a3a'; g.fillRect(x - 8, y, 16, 130); g.fillStyle = '#4f7a3a'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + (k - 2.5) * 26, y - 20 + (k % 2) * 24, r * 0.5, r * 0.36, 0, 0, 7); g.fill(); } g.strokeStyle = 'rgba(190,200,170,.85)'; g.lineWidth = 4; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(x - 60 + k * 20, y + 10); g.lineTo(x - 64 + k * 20, y + 60 + (k % 3) * 14); g.stroke(); } }
  g.strokeStyle = '#f4f0e6'; g.lineWidth = 18; g.strokeRect(9, 9, W - 18, H - 18); g.lineWidth = 10; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H * 0.45); g.lineTo(W, H * 0.45); g.stroke(); });
const gWinP = add(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: P.tex(gwinC), color: new THREE.Color(1.25, 1.22, 1.15) }), -3.34, 2.05, -0.6, GCL, { cast: false }); gWinP.rotation.y = Math.PI / 2;
add(box(0.1, 0.1, 1.75), M.white, -3.3, 1.05, -0.6, GCL);
for (const z of [-1.65, 0.45]) add(box(0.08, 2.4, 0.4), toon({ color: '#e8d8a8' }), -3.28, 2.05, z, GCL, { cast: false });
shaft(GCL, [-3.3, 2.8, -0.6], [-1.2, 0.0, -0.4], 0.5, 0.9, '#fff0c8', 0.09, 'gold');
const gPool = add(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2cc').multiplyScalar(0.55), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }), -1.1, 0.02, -0.3, GCL, { cast: false }); gPool.rotation.x = -Math.PI / 2; gPool.userData.ndSkip = true;
// the party table: white enamel top, tray of dough pills, three specimen jars, flour
const GT = new THREE.Group(); GT.position.set(0, 0, -0.6); GCL.add(GT);
add(box(1.7, 0.06, 0.85), M.enamel, 0, 0.86, 0, GT); add(box(1.72, 0.03, 0.87), M.enRim, 0, 0.82, 0, GT, { cast: false });
for (const [x, z] of [[-0.78, -0.36], [0.78, -0.36], [-0.78, 0.36], [0.78, 0.36]]) add(box(0.06, 0.82, 0.06), M.darkWood, x, 0.41, z, GT);
const TRAY = new THREE.Group(); TRAY.position.set(0.18, 0.89, 0.08); GT.add(TRAY);
add(box(0.56, 0.02, 0.38), M.enamel, 0, 0.01, 0, TRAY); for (const [x, z, w, d] of [[0, -0.19, 0.58, 0.02], [0, 0.19, 0.58, 0.02], [-0.28, 0, 0.02, 0.38], [0.28, 0, 0.02, 0.38]]) add(box(w, 0.04, d), M.enRim, x, 0.03, z, TRAY, { cast: false });
const PILLS = []; for (let i = 0; i < 15; i++) { const r = Math.floor(i / 5), c = i % 5; const pl = add(new THREE.SphereGeometry(0.03, 12, 9), M.dough, -0.2 + c * 0.1 + (GRG() - 0.5) * 0.02, 0.045, -0.11 + r * 0.11 + (GRG() - 0.5) * 0.02, TRAY); pl.scale.set(1.15, 0.8, 1.0); pl.rotation.y = GRG() * 3; PILLS.push(pl); }
const flourP = add(new THREE.CircleGeometry(0.22, 20), M.flour, -0.28, 0.892, 0.18, GT, { cast: false }); flourP.rotation.x = -Math.PI / 2; flourP.scale.set(1.4, 1, 1); flourP.userData.ndSkip = true;
const ROLLP = add(new THREE.SphereGeometry(0.034, 12, 9), M.dough, -0.3, 0.925, 0.18, GT); // the pill being rolled
const GJARS = []; for (const [x, col, h] of [[-0.62, '#7a2a20', 0.07], [-0.45, '#e8c838', 0.1], [-0.28, '#6a4426', 0.06]]) { const j = new THREE.Group(); j.position.set(x, 0.89, -0.18); GT.add(j);
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.17, 18), GLASS(), 0, 0.085, 0, j, { cast: false }); add(new THREE.CylinderGeometry(0.055, 0.055, h, 16), toon({ color: col }), 0, h / 2 + 0.004, 0, j, { cast: false }); add(new THREE.CylinderGeometry(0.064, 0.064, 0.025, 18), M.ironK, 0, 0.18, 0, j, { cast: false }); GJARS.push(j); }
const GSYR = new THREE.Group(); GSYR.position.set(0.62, 0.9, -0.15); GSYR.rotation.y = 0.5; GT.add(GSYR); { const b = add(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 12), GLASS('#ffe8e8', 0.55), 0, 0.014, 0, GSYR, { cast: false }); b.rotation.z = Math.PI / 2; const bl = add(new THREE.CylinderGeometry(0.011, 0.011, 0.08, 10), toon({ color: '#a01820' }), 0.02, 0.014, 0, GSYR, { cast: false }); bl.rotation.z = Math.PI / 2; const n = add(new THREE.CylinderGeometry(0.002, 0.002, 0.06, 4), M.ironK, -0.1, 0.014, 0, GSYR, { cast: false }); n.rotation.z = Math.PI / 2; }
add(new THREE.CylinderGeometry(0.14, 0.09, 0.07, 20), M.enamel, 0.55, 0.925, 0.18, GT); add(new THREE.TorusGeometry(0.14, 0.01, 6, 24), M.enRim, 0.55, 0.96, 0.18, GT, { cast: false }).rotation.x = Math.PI / 2;
// medicine cabinet on the back wall, glass bottles
const GCAB = new THREE.Group(); GCAB.position.set(1.7, 0, -2.7); GCL.add(GCAB); add(box(1.3, 2.1, 0.4), M.darkWood, 0, 1.05, 0, GCAB);
for (let r = 0; r < 3; r++) { add(box(1.15, 0.03, 0.32), M.timber, 0, 0.9 + r * 0.42, 0.02, GCAB, { cast: false }); for (let k = 0; k < 6; k++) { const h = 0.16 + GRG() * 0.12; add(new THREE.CylinderGeometry(0.045, 0.05, h, 12), toon({ color: ['#7a4a1a', '#2a6a4a', '#3a5a9a', '#9a3a2a', '#c8a040', '#f4f4f0'][(k + r) % 6] }), -0.45 + k * 0.18, 0.92 + r * 0.42 + h / 2, 0.04, GCAB, { cast: false }); } }
add(box(1.18, 1.3, 0.02), GLASS('#eaf6ff', 0.22), 0, 1.35, 0.2, GCAB, { cast: false });
// exam bed + folding screen at the back left
const GEXB = new THREE.Group(); GEXB.position.set(-2.0, 0, -2.2); GCL.add(GEXB); add(box(1.9, 0.08, 0.7), M.white, 0, 0.72, 0, GEXB); for (const x of [-0.9, 0.9]) for (const z of [-0.3, 0.3]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), M.ironK, x, 0.35, z, GEXB); add(box(0.5, 0.1, 0.62), M.white, -0.7, 0.82, 0, GEXB);
for (let i = 0; i < 3; i++) { const sc = add(box(0.6, 1.6, 0.03), toon({ color: '#f2efe4' }), -0.2 + i * 0.58, 0.95, 0.55 + (i % 2) * 0.12, GEXB, { cast: false }); sc.rotation.y = (i % 2 ? -0.35 : 0.35); }
// month calendar (redrawn per month) + framed diploma (no lettering)
const gcalC = document.createElement('canvas'); gcalC.width = 220; gcalC.height = 280; const gcalT = P.tex(gcalC); gcalT.wrapS = gcalT.wrapT = THREE.ClampToEdgeWrapping;
const MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV'];
const drawGCal = (i) => { const g = gcalC.getContext('2d'); g.fillStyle = '#f6f0e0'; g.fillRect(0, 0, 220, 280); g.fillStyle = '#2a5aa0'; g.fillRect(0, 0, 220, 70); g.fillStyle = '#2a2a2a'; for (const x of [55, 165]) { g.beginPath(); g.arc(x, 16, 7, 0, 7); g.fill(); }
  g.font = '900 86px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1e1e24'; g.fillText(MONTHS[i], 110, 168); g.fillStyle = 'rgba(30,30,36,.25)'; for (let r = 0; r < 2; r++) for (let c = 0; c < 7; c++) g.fillRect(18 + c * 27, 222 + r * 22, 18, 12); gcalT.needsUpdate = true; };
drawGCal(0); let gcalM = 0;
add(new THREE.PlaneGeometry(0.5, 0.64), new THREE.MeshBasicMaterial({ map: gcalT, color: new THREE.Color(0.94, 0.94, 0.94) }), 0.55, 2.1, -2.84, GCL, { cast: false });
add(box(0.62, 0.46, 0.03), M.darkWood, -0.55, 2.25, -2.84, GCL, { cast: false }); add(new THREE.PlaneGeometry(0.52, 0.36), toon({ color: '#f4ecd4' }), -0.55, 2.25, -2.82, GCL, { cast: false });
// coat rack + hanging electric lamp over the table
const gRack = new THREE.Group(); gRack.position.set(3.0, 0, -2.4); GCL.add(gRack); add(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), M.timber, 0, 0.9, 0, gRack); add(new THREE.CylinderGeometry(0.22, 0.25, 0.04, 12), M.timber, 0, 0.02, 0, gRack); add(box(0.4, 0.7, 0.12), toon({ color: '#3a3f5a' }), 0.1, 1.35, 0.05, gRack);
const gLampH = new THREE.Group(); gLampH.position.set(0.1, 3.6, -0.6); GCL.add(gLampH); add(new THREE.CylinderGeometry(0.006, 0.006, 1.0, 4), M.ironK, 0, -0.5, 0, gLampH, { cast: false }); add(new THREE.CylinderGeometry(0.3, 0.1, 0.16, 18, 1, true), toon({ color: '#2a5a48', side: THREE.DoubleSide }), 0, -1.06, 0, gLampH, { cast: false });
const gBulb = add(new THREE.SphereGeometry(0.06, 12, 10), hdr('#ffd08a', 2.2), 0, -1.14, 0, gLampH, { cast: false }); gBulb.userData.ndSkip = true;
// "everyone blamed a germ": a big glowing germ model on a stand (only in that shot)
const GERM = new THREE.Group(); GERM.position.set(1.55, 0, -1.4); GCL.add(GERM);
add(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 8), M.brass, 0, 0.6, 0, GERM); add(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 16), M.darkWood, 0, 0.03, 0, GERM);
M.germ = toon({ color: '#6adf5a', emissive: '#3aff40', emissiveIntensity: 0.55 });
const germB = add(new THREE.SphereGeometry(0.3, 24, 18), M.germ, 0, 1.5, 0, GERM); germB.scale.set(1.15, 0.9, 1);
for (let i = 0; i < 22; i++) { const th = i * 2.399, ph = Math.acos(1 - 2 * (i + 0.5) / 22), d = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
  const sp = add(new THREE.ConeGeometry(0.035, 0.16, 8), M.germ, d.x * 0.36, 1.5 + d.y * 0.29, d.z * 0.32, GERM, { cast: false }); sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  const tip = add(new THREE.SphereGeometry(0.03, 8, 6), hdr('#d8ff7a', 1.6), d.x * 0.45, 1.5 + d.y * 0.37, d.z * 0.41, GERM, { cast: false }); tip.userData.ndSkip = true; }
const germL = new THREE.PointLight('#7aff6a', 0, 3.5, 1.4); germL.position.set(0, 1.5, 0.4); GERM.add(germL);
const gFill = new THREE.PointLight('#fff2dc', 0, 14, 1.0); gFill.position.set(1.0, 3.0, 2.2); GCL.add(gFill);
const gSunL = new THREE.PointLight('#ffe2a8', 0, 9, 1.2); gSunL.position.set(-2.6, 2.2, -0.6); GCL.add(gSunL);
const gLampL = new THREE.PointLight('#ffc880', 0, 4, 1.4); gLampL.position.set(0.1, 2.3, -0.6); GCL.add(gLampL);
// ---------- the ward (cool morning light) ----------
const GWD = new THREE.Group(); GWD.position.set(13200, 0, 0); scene.add(GWD);
add(tbox(10, 0.3, 7, 1.4), M.plank, 0, -0.15, 0, GWD, { cast: false });
for (const [x, z, w, d] of [[0, -2.8, 10, 0.3], [-4.8, 0, 0.3, 7], [4.8, 0, 0.3, 7]]) { add(tbox(w, 3.8, d, 1.3), M.gWall, x, 1.9, z, GWD); add(box(w + 0.02, 1.1, d + 0.02), M.gTile, x, 0.55, z, GWD, { cast: false }); add(box(w + 0.03, 0.06, d + 0.05), M.gTrim, x, 1.12, z, GWD, { cast: false }); }
add(tbox(10, 0.3, 7, 1.3), M.gWall, 0, 3.95, 0, GWD, { cast: false });
const wwinC = cvs(200, 360, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8ac8ff'); gr.addColorStop(1, '#f0f8ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#7aa85a'; g.beginPath(); g.ellipse(60, 300, 90, 50, 0, 0, 7); g.fill(); g.strokeStyle = '#f4f4ee'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14); g.lineWidth = 8; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); for (const y of [120, 240]) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); });
for (const x of [-3.3, -1.1, 1.1, 3.3]) { add(new THREE.PlaneGeometry(0.85, 1.6), new THREE.MeshBasicMaterial({ map: P.tex(wwinC), color: new THREE.Color(1.2, 1.2, 1.25) }), x, 2.35, -2.64, GWD, { cast: false }); shaft(GWD, [x, 2.9, -2.6], [x + 0.6, 0.0, -0.4], 0.35, 0.75, '#eaf4ff', 0.07, 'gold'); }
const GBEDS = [-2.3, 0, 2.3].map((x) => { const b = new THREE.Group(); b.position.set(x, 0, -1.75); GWD.add(b);
  for (const sx of [-0.95, 0.95]) { add(new THREE.CylinderGeometry(0.025, 0.025, sx < 0 ? 1.05 : 0.8, 8), M.white, sx, sx < 0 ? 0.52 : 0.4, -0.38, b); add(new THREE.CylinderGeometry(0.025, 0.025, sx < 0 ? 1.05 : 0.8, 8), M.white, sx, sx < 0 ? 0.52 : 0.4, 0.38, b); const rl = add(new THREE.CylinderGeometry(0.02, 0.02, 0.76, 6), M.white, sx, sx < 0 ? 1.0 : 0.76, 0, b); rl.rotation.x = Math.PI / 2; }
  add(box(1.9, 0.16, 0.74), M.white, 0, 0.5, 0, b); add(box(1.25, 0.06, 0.78), toon({ color: '#8a96b0' }), 0.3, 0.6, 0, b); const pw = add(new THREE.SphereGeometry(0.2, 12, 8), M.white, -0.72, 0.62, 0, b); pw.scale.set(0.8, 0.35, 1.5); return b; });
const wTbl = add(box(0.4, 0.7, 0.4), M.darkWood, -1.15, 0.35, -2.2, GWD); add(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 12), GLASS('#dff4ff', 0.5), -1.15, 0.78, -2.2, GWD, { cast: false });
add(box(0.08, 2.3, 1.1), M.door, 4.62, 1.15, 0.8, GWD);
const wFill = new THREE.PointLight('#eef6ff', 0, 16, 1.0); wFill.position.set(0.5, 3.2, 2.4); GWD.add(wFill);
const wWin = new THREE.PointLight('#dceaff', 0, 10, 1.1); wWin.position.set(0, 2.6, -1.8); GWD.add(wWin);
// ---------- sharecropper cabin porch (hot sun) ----------
const GPO = new THREE.Group(); GPO.position.set(13600, 0, 0); scene.add(GPO);
add(new THREE.PlaneGeometry(60, 60), M.dirt, 0, 0, 0, GPO, { cast: false }).rotation.x = -Math.PI / 2;
M.cabin = texM(P.planks(1917), 1, 3, '#c8a07a');
const CAB = new THREE.Group(); CAB.position.set(0, 0, -2.6); GPO.add(CAB);
add(tbox(4.6, 2.8, 2.6, 1.2), M.cabin, 0, 1.8, -0.4, CAB); add(box(4.8, 0.35, 1.7), M.plank, 0, 0.18, 1.6, CAB);
for (const x of [-2.2, 2.2, -0.75]) add(box(0.12, 2.3, 0.12), M.timber, x, 1.5, 2.35, CAB);
const roofP = add(box(5.2, 0.1, 2.0), M.roof, 0, 2.75, 1.55, CAB); roofP.rotation.x = 0.18; const roofM = add(box(5.2, 0.1, 3.4), M.roof, 0, 3.55, -0.4, CAB); roofM.rotation.x = -0.05;
add(box(0.9, 1.9, 0.06), M.door, 0.6, 1.3, 0.92, CAB); add(box(0.8, 0.7, 0.05), toon({ color: '#2a2a30' }), -1.5, 1.8, 0.92, CAB); add(box(0.9, 0.08, 0.1), M.timber, -1.5, 1.42, 0.95, CAB);
for (let i = 0; i < 3; i++) add(box(1.0, 0.1, 0.3), M.plank, 1.6, 0.06 + i * 0.12, 2.5 + 0.28 - i * 0.28, CAB);
const tub = add(new THREE.CylinderGeometry(0.3, 0.26, 0.3, 18), M.ironK, -1.8, 0.5, 1.9, CAB); add(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 18), toon({ color: '#7ab0d0' }), -1.8, 0.63, 1.9, CAB, { cast: false });
// cotton field all around + corn crib
for (let r = 0; r < 8; r++) for (let k = 0; k < 26; k++) { const x = -13 + k * 1.0 + (r % 2) * 0.5, z = 3.5 + r * 1.3; if (Math.abs(x) < 1.5 && r < 1) continue;
  const bsh = add(new THREE.SphereGeometry(0.3, 8, 6), M.bush, x, 0.3, z, GPO, { cast: false }); bsh.scale.set(1, 0.8, 1); for (let c = 0; c < 3; c++) { const cb = add(new THREE.SphereGeometry(0.06, 6, 5), M.white, x + Math.sin(k * 3 + c) * 0.2, 0.5 + (c % 2) * 0.08, z + Math.cos(r * 2 + c) * 0.2, GPO, { cast: false }); } }
for (let r = 0; r < 6; r++) for (let k = 0; k < 12; k++) { const x = -12 + k * 2.1, z = -9 - r * 2.2; add(new THREE.SphereGeometry(0.5, 8, 6), M.bush, x, 0.4, z, GPO, { cast: false }); }
const crib = new THREE.Group(); crib.position.set(4.2, 0, -2.0); GPO.add(crib); add(box(1.6, 1.8, 1.4), M.cabin, 0, 1.0, 0, crib); add(box(1.9, 0.1, 1.7), M.roof, 0, 2.0, 0, crib).rotation.z = 0.12; for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 8), toon({ color: '#f2c230' }), -0.5 + i * 0.2, 0.25, 0.72, crib).rotation.z = Math.PI / 2;
for (const [x, z, s] of [[-7, -5, 1.4], [8, -6, 1.6], [-10, 1, 1.2]]) { add(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 3 * s, 8), M.trunk, x, 1.5 * s, z, GPO); const c = add(new THREE.SphereGeometry(1.8 * s, 12, 9), M.bush, x, 3.6 * s, z, GPO); c.scale.set(1.3, 0.75, 1.3); }
const poFill = new THREE.PointLight('#fff0d8', 0, 10, 1.0); poFill.position.set(0.5, 2.0, 2.5); GPO.add(poFill);
// ---------- modern kitchen (bright morning) ----------
const GKI = new THREE.Group(); GKI.position.set(14000, 0, 0); scene.add(GKI);
M.kWood = texM(P.planks(2026), 1, 4, '#e8c8a0'); M.kCab = toon({ color: '#f4f6f8' }); M.kTop = toon({ color: '#d8b48a' }); M.steel = toon({ color: '#c8ced6' });
M.kTile = texM(cvs(256, 256, (g, W, H) => { g.fillStyle = '#e8eef2'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; for (let y = 0; y < 8; y++) for (let x = -1; x < 4; x++) g.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26); }), 4, 2);
add(tbox(8, 0.3, 7, 1.4), M.kWood, 0, -0.15, 0, GKI, { cast: false });
for (const [x, z, w, d] of [[0, -2.6, 8, 0.3], [-3.6, 0, 0.3, 7], [3.6, 0, 0.3, 7]]) add(tbox(w, 3.4, d, 1.3), toon({ color: '#f6efe4' }), x, 1.7, z, GKI);
add(tbox(8, 0.3, 7, 1.3), toon({ color: '#fbf8f2' }), 0, 3.55, 0, GKI, { cast: false });
add(box(5.2, 0.6, 0.02), M.kTile, 0, 1.25, -2.44, GKI, { cast: false });
add(box(5.2, 0.86, 0.62), M.kCab, 0, 0.43, -2.15, GKI); add(box(5.3, 0.05, 0.68), M.kTop, 0, 0.885, -2.12, GKI);
for (let i = 0; i < 7; i++) { add(box(0.7, 0.72, 0.02), toon({ color: '#eef1f4' }), -2.25 + i * 0.75, 0.45, -1.83, GKI, { cast: false }); add(box(0.14, 0.02, 0.025), M.steel, -2.25 + i * 0.75, 0.74, -1.81, GKI, { cast: false }); }
for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; add(box(0.8, 0.8, 0.36), M.kCab, -2.0 + i * 0.8, 2.25, -2.28, GKI); add(box(0.14, 0.02, 0.025), M.steel, -2.0 + i * 0.8, 1.92, -2.09, GKI, { cast: false }); }
const kwinC = cvs(320, 260, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#6ab8ff'); gr.addColorStop(1, '#e8f6ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; for (const [x, y, r] of [[80, 70, 24], [110, 64, 30], [140, 74, 20]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.fillStyle = '#7ac05a'; g.beginPath(); g.ellipse(220, 250, 160, 70, 0, 0, 7); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14); g.lineWidth = 8; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); });
add(new THREE.PlaneGeometry(1.5, 1.2), new THREE.MeshBasicMaterial({ map: P.tex(kwinC), color: new THREE.Color(1.3, 1.3, 1.3) }), 0.0, 2.15, -2.43, GKI, { cast: false });
shaft(GKI, [0, 2.6, -2.4], [0.6, 0.85, -1.4], 0.45, 0.8, '#fff6dc', 0.07, 'gold');
const fridge = add(box(0.9, 2.0, 0.7), M.steel, 3.0, 1.0, -2.1, GKI); add(box(0.03, 0.6, 0.04), toon({ color: '#9aa2ac' }), 2.6, 1.3, -1.72, GKI, { cast: false });
const toaster = new THREE.Group(); toaster.position.set(-1.4, 0.91, -2.15); GKI.add(toaster); add(box(0.32, 0.2, 0.18), toon({ color: '#e0463c' }), 0, 0.1, 0, toaster); for (const x of [-0.06, 0.06]) add(box(0.04, 0.01, 0.12), M.ironK, x, 0.2, 0, toaster, { cast: false });
const bowlF = new THREE.Group(); bowlF.position.set(1.6, 0.91, -2.1); GKI.add(bowlF); add(new THREE.CylinderGeometry(0.2, 0.12, 0.1, 18), toon({ color: '#3a8ad0' }), 0, 0.05, 0, bowlF); for (const [x, z, c] of [[-0.06, 0, '#ff8a2a'], [0.07, 0.03, '#f2d230'], [0, -0.07, '#e0463c']]) add(new THREE.SphereGeometry(0.06, 10, 8), toon({ color: c }), x, 0.13, z, bowlF);
for (const x of [-1.1, 1.1]) { add(new THREE.CylinderGeometry(0.005, 0.005, 0.9, 4), M.ironK, x, 3.0, -0.9, GKI, { cast: false }); add(new THREE.ConeGeometry(0.18, 0.2, 16, 1, true), toon({ color: '#2a2a30', side: THREE.DoubleSide }), x, 2.48, -0.9, GKI, { cast: false }); const pb = add(new THREE.SphereGeometry(0.05, 10, 8), hdr('#fff0c8', 2.0), x, 2.4, -0.9, GKI, { cast: false }); pb.userData.ndSkip = true; }
// kitchen island with the bread
const ISL = new THREE.Group(); ISL.position.set(0, 0, -0.75); GKI.add(ISL); add(box(2.2, 0.88, 0.9), toon({ color: '#3a6a8a' }), 0, 0.44, 0, ISL); add(box(2.3, 0.05, 1.0), toon({ color: '#f2f0ec' }), 0, 0.905, 0, ISL);
const BREAD = new THREE.Group(); BREAD.position.set(0.05, 0.93, 0.05); BREAD.rotation.y = -0.18; ISL.add(BREAD);
const crustC = (vert) => cvs(256, 64, (g, W, H) => { g.fillStyle = '#d0904a'; g.fillRect(0, 0, W, H); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,220,160,.35)'); gr.addColorStop(1, 'rgba(120,60,20,.2)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(110,60,25,.75)'; for (let i = 1; i < 11; i++) g.fillRect(i * W / 11 - 1.5, 0, 3, H); });
M.crust = toon({ map: P.tex(crustC()), color: '#ffffff' }); M.crustC = toon({ map: (() => { const t = P.tex(crustC()); t.rotation = Math.PI / 2; t.center.set(0.5, 0.5); return t; })(), color: '#ffffff' }); M.crumb = toon({ color: '#f6e8c8' });
add(box(0.5, 0.1, 0.13), M.crust, 0, 0.05, 0, BREAD, { cast: false }); const btop = add(new THREE.CylinderGeometry(0.066, 0.066, 0.5, 20), M.crustC, 0, 0.1, 0, BREAD, { cast: false }); btop.rotation.z = Math.PI / 2; btop.scale.set(1, 1, 0.98);
add(box(0.012, 0.15, 0.125), M.crumb, 0.256, 0.08, 0, BREAD, { cast: false });
const bagM = GLASS('#f4faff', 0.28); add(box(0.6, 0.2, 0.17), bagM, 0.04, 0.09, 0, BREAD, { cast: false }); add(new THREE.CylinderGeometry(0.03, 0.06, 0.12, 10), bagM, 0.39, 0.09, 0, BREAD, { cast: false }).rotation.z = Math.PI / 2; add(box(0.02, 0.05, 0.05), toon({ color: '#3a8ad0' }), 0.34, 0.09, 0, BREAD, { cast: false });
const labC = document.createElement('canvas'); labC.width = 512; labC.height = 200; const labT = P.tex(labC); labT.wrapS = labT.wrapT = THREE.ClampToEdgeWrapping; let labK = -1;
const drawLabel = (k) => { const g = labC.getContext('2d'); g.clearRect(0, 0, 512, 200); g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(6, 6, 500, 188, 30); g.fill(); g.lineWidth = 8; g.strokeStyle = '#2a5aa0'; g.stroke();
  g.strokeStyle = '#d8a030'; g.fillStyle = '#e8b840'; g.lineWidth = 6; g.beginPath(); g.moveTo(70, 170); g.lineTo(70, 40); g.stroke(); for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { g.beginPath(); g.ellipse(70 + s * 14, 60 + i * 22, 9, 16, s * 0.5, 0, 7); g.fill(); }
  g.fillStyle = '#c0302a'; g.beginPath(); g.roundRect(130, 30, 350, 40, 18); g.fill();
  if (k > 0) { g.save(); g.globalAlpha = Math.min(1, k); g.font = '900 64px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1e3a7a'; g.fillText('ENRICHED', 305, 128); g.restore(); }
  else { g.fillStyle = 'rgba(42,90,160,.25)'; g.fillRect(150, 110, 310, 34); }
  labT.needsUpdate = true; };
drawLabel(0); labK = 0;
const label = add(new THREE.PlaneGeometry(0.34, 0.133), new THREE.MeshBasicMaterial({ map: labT, transparent: true, color: new THREE.Color(1.05, 1.05, 1.05) }), 0.0, 0.1, 0.087, BREAD, { cast: false });
const kPlate = new THREE.Group(); kPlate.position.set(-0.55, 0.93, 0.15); ISL.add(kPlate); add(new THREE.CylinderGeometry(0.15, 0.12, 0.02, 24), M.white, 0, 0.01, 0, kPlate); for (let i = 0; i < 2; i++) { const sl = add(box(0.13, 0.012, 0.12), toon({ color: '#d89a50' }), 0.02 * i, 0.03 + i * 0.013, -0.01 * i, kPlate); sl.rotation.y = 0.3 + i * 0.5; }
const mug = add(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 16), toon({ color: '#f2c230' }), 0.6, 0.98, 0.2, ISL); add(new THREE.TorusGeometry(0.03, 0.008, 6, 12), toon({ color: '#f2c230' }), 0.655, 0.98, 0.2, ISL, { cast: false });
const kFill = new THREE.PointLight('#ffffff', 0, 14, 1.0); kFill.position.set(0.5, 2.8, 2.4); GKI.add(kFill);
const kWin = new THREE.PointLight('#fff4e0', 0, 8, 1.2); kWin.position.set(0, 2.2, -1.8); GKI.add(kWin);
const kGlow = new THREE.PointLight('#ffd23f', 0, 1.6, 1.8); kGlow.position.set(0.05, 1.2, -0.45); GKI.add(kGlow);
function goldState(W_, f) {
  const c = !!W_.gcl; gFill.intensity = c ? 3.0 : 0; gSunL.intensity = c ? 2.4 * (W_.winK ?? 1) : 0; gLampL.intensity = c ? 1.0 : 0;
  const wk = W_.winK ?? 1; gWinP.material.color && gWinP.material.color.setRGB(lerp(0.22, 1.25, wk), lerp(0.28, 1.22, wk), lerp(0.5, 1.15, wk)); gPool.material.opacity = 0.5 * wk; gPool.visible = c && !XR.on;
  const m = Math.max(0, Math.min(7, Math.round(W_.month || 0))); if (m !== gcalM) { gcalM = m; drawGCal(m); }
  GCAB.visible = !W_.xray; gRack.visible = !W_.xray;
  GERM.visible = !!W_.germ; germL.intensity = W_.germ ? 2.2 * (0.85 + 0.15 * Math.sin(f * 0.25)) : 0; GERM.rotation.y = (W_.germ ? f * 0.01 : 0);
  const np = W_.pills ?? 15; PILLS.forEach((p, i) => { const s = Math.max(0, Math.min(1, np - i)); p.visible = s > 0.02; p.scale.set(1.15 * s, 0.8 * s, s); });
  ROLLP.visible = W_.roll != null; if (W_.roll != null) { const r = W_.roll; ROLLP.position.set(-0.3 + 0.05 * Math.sin(r * 6.3), 0.925, 0.18 + 0.03 * Math.cos(r * 6.3)); ROLLP.rotation.set(r * 9, r * 4, 0); }
  GSYR.visible = W_.syrOnTable !== false;
  wFill.intensity = W_.gwd ? 3.0 : 0; wWin.intensity = W_.gwd ? 2.2 : 0; poFill.intensity = W_.gpo ? 1.4 : 0;
  kFill.intensity = W_.gki ? 3.2 : 0; kWin.intensity = W_.gki ? 2.4 : 0; kGlow.intensity = W_.gki ? 0.5 * (W_.b3glow || 0) : 0;
  const lk = W_.enr || 0; if (Math.abs(lk - labK) > 0.04 || (lk === 0 && labK !== 0) || (lk >= 1 && labK < 1)) { labK = lk; drawLabel(lk); }
}

let lotState;
{
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
M.corr = texM(P.stone(55), 5, 2, '#c8805e');
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
// ---- NEW STYLE test: night corner behind the desk (brick partition + moonlit window), newspaper, hero ticket ----
const NIGHT = new THREE.Group(); NIGHT.position.set(-4.2, 0, -0.35); WARE.add(NIGHT); NIGHT.visible = false;
add(tbox(4.2, 3.2, 0.2, 2), texM(P.stone(77), 3, 2, '#b8664a'), 0, 1.6, 0, NIGHT);
const nwin = add(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ map: P.tex(cvs(220, 260, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0a1440'); gr.addColorStop(1, '#2a3a8a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = P.rng(5); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.4 + r() * 0.6) + ')'; g.fillRect(r() * W, r() * H * 0.8, 2, 2); } g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(W * 0.68, H * 0.28, 26, 0, 7); g.fill();
  g.fillStyle = '#141a3a'; for (let i = 0; i < 6; i++) g.fillRect(i * 40, H * 0.78 - (i % 3) * 18, 34, H); g.fillStyle = '#ffd890'; for (let i = 0; i < 9; i++) g.fillRect(8 + i * 24, H * 0.86 - (i % 2) * 14, 5, 6); })) }), -0.75, 1.95, 0.11, NIGHT, { cast: false }); nwin.userData.ndSkip = true;
for (const [w, h, x, y] of [[1.22, 0.08, -0.75, 2.62], [1.22, 0.08, -0.75, 1.28], [0.08, 1.4, -1.33, 1.95], [0.08, 1.4, -0.17, 1.95], [0.06, 1.3, -0.75, 1.95], [1.1, 0.05, -0.75, 1.95]]) add(box(w, h, 0.06), M.darkWood, x, y, 0.13, NIGHT);
const moonL = new THREE.PointLight('#8aa8ff', 0, 6, 1.2); moonL.position.set(-0.75, 2.0, 0.9); NIGHT.add(moonL);
const newsC = cvs(300, 200, (g, W, H) => { g.fillStyle = '#efe9dc'; g.fillRect(0, 0, W, H); g.fillStyle = '#1e1e24'; g.font = '900 34px Georgia, serif'; g.textAlign = 'center'; g.fillText('LOTTO RESULTS', W / 2, 40); g.fillRect(14, 50, W - 28, 3);
  g.font = '700 22px Arial'; const n = [8, 11, 13, 15, 19, 20]; n.forEach((v, i) => { g.beginPath(); g.arc(40 + i * 44, 88, 17, 0, 7); g.stroke(); g.fillText(String(v), 40 + i * 44, 96); }); g.fillStyle = 'rgba(30,30,36,.5)'; for (let i = 0; i < 6; i++) g.fillRect(16, 122 + i * 12, W - 32 - (i % 3) * 30, 5); });
const news = add(new THREE.PlaneGeometry(0.42, 0.28), toon({ map: P.tex(newsC), color: '#b8b0a2' }), -0.05, 0.792, 0.18, MDESK, { cast: false }); news.rotation.x = -Math.PI / 2; news.rotation.z = -0.25;
const HERO = add(new THREE.BoxGeometry(0.14, 0.004, 0.085), M.tick, 0, -5, 0, WARE, { cast: false });
const WSHAFTS = []; for (const z of [-5.5, -2.5, 0.5]) { const wp = add(box(0.06, 1.0, 1.4), hdr('#fff2d0', 1.6), -6.82, 3.7, z, WARE, { cast: false }); wp.userData.ndSkip = true;
  for (const dz of [-0.45, 0, 0.45]) add(box(0.08, 1.08, 0.05), M.darkWood, -6.8, 3.7, z + dz * 1.55, WARE, { cast: false });
  WSHAFTS.push(shaft(WARE, [-6.7, 3.9, z], [-2.6, 0, z + 0.9], 0.45, 1.1, '#ffd9a0', 0.16, 'lot')); }
// a tower of ticket boxes (every combination)
const TOWER = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.36, 0.4), toon({ color: '#c89a6a' }), 80); { const d = new THREE.Object3D(); let n = 0; const tr = P.rng(31);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 8; x++) { d.position.set(-3.6 + x * 0.52 + (tr() - 0.5) * 0.04, 0.18 + y * 0.37, -4.9 + (tr() - 0.5) * 0.05); d.rotation.set(0, (tr() - 0.5) * 0.1, 0); d.updateMatrix(); TOWER.setMatrixAt(n++, d.matrix); } }
TOWER.castShadow = true; TOWER.receiveShadow = true; TOWER.frustumCulled = false; WARE.add(TOWER); TOWER.visible = false;
// paper ribbons pouring out of the left row of printers (scrolling ticket grid)
const ribT = P.tex(cvs(64, 256, (g, W, H) => { g.fillStyle = '#fbf6ec'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(224,74,106,.7)'; g.lineWidth = 1.5; for (let y = 0; y < H; y += 32) { g.strokeRect(6, y + 4, W - 12, 24); g.fillStyle = '#e04a6a'; g.fillRect(6, y + 4, W - 12, 5); } }), 1, 3);
const RIBM = toon({ map: ribT, color: '#ffffff', side: THREE.DoubleSide }); PRINTERS.forEach((pr, i) => { if (i % 2) return; const r = add(new THREE.PlaneGeometry(0.28, 0.75), RIBM, 0, 0.82, 0.48, pr, { cast: false }); r.rotation.x = -0.55; });
const sunL = new THREE.PointLight('#ffd49a', 0, 12, 1.2); sunL.position.set(-4.5, 2.6, -1.0); WARE.add(sunL);
// balance scale on a side table in the night corner: the jackpot vs every ticket
const SCL = new THREE.Group(); SCL.position.set(-1.25, 0, 0.78); NIGHT.add(SCL); const sclL = new THREE.PointLight('#ffcf90', 2.2, 2.6, 1.4); sclL.position.set(0.2, 1.9, 0.7); SCL.add(sclL);
add(box(0.9, 0.05, 0.55), M.darkWood, 0, 0.78, 0, SCL); for (const [x, z] of [[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]]) add(box(0.04, 0.76, 0.04), M.darkWood, x, 0.38, z, SCL);
add(new THREE.CylinderGeometry(0.11, 0.13, 0.04, 20), M.brass, 0, 0.83, 0, SCL); add(new THREE.CylinderGeometry(0.018, 0.022, 0.5, 10), M.brass, 0, 1.08, 0, SCL);
const BEAM = new THREE.Group(); BEAM.position.set(0, 1.33, 0); SCL.add(BEAM); add(box(0.72, 0.025, 0.03), M.brass, 0, 0, 0, BEAM); add(new THREE.SphereGeometry(0.03, 12, 8), M.brass, 0, 0, 0, BEAM);
const PANS = [-1, 1].map((sd) => { const g = new THREE.Group(); SCL.add(g); for (const a of [0, 2.1, 4.2]) { const c = add(new THREE.CylinderGeometry(0.003, 0.003, 0.26, 4), M.ironK, Math.cos(a) * 0.06, -0.13, Math.sin(a) * 0.06, g, { cast: false }); c.rotation.z = -Math.cos(a) * 0.22; c.rotation.x = Math.sin(a) * 0.22; }
  add(new THREE.CylinderGeometry(0.15, 0.12, 0.025, 24), M.brass, 0, -0.27, 0, g); return g; });
const bagC = cvs(128, 128, (g, W, H) => { g.fillStyle = '#c9a46a'; g.fillRect(0, 0, W, H); g.fillStyle = '#2f7a3a'; g.font = '900 70px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', W / 2, H / 2 + 4); });
const BAG = new THREE.Group(); SCL.add(BAG); const bagB = add(new THREE.SphereGeometry(0.11, 20, 14), toon({ map: P.tex(bagC), color: '#ffffff' }), 0, 0.1, 0, BAG); bagB.scale.set(1, 1.1, 0.9); bagB.rotation.y = -Math.PI / 2;
add(new THREE.CylinderGeometry(0.03, 0.06, 0.07, 10), toon({ color: '#b8925a' }), 0, 0.23, 0, BAG); add(new THREE.TorusGeometry(0.035, 0.008, 6, 12), toon({ color: '#8a3a2a' }), 0, 0.21, 0, BAG).rotation.x = Math.PI / 2;
const STK = new THREE.Group(); PANS[1].add(STK); for (let i = 0; i < 9; i++) { const t = add(box(0.16, 0.012, 0.1), M.tick, (i % 3 - 1) * 0.006, -0.25 + i * 0.013, (i % 2) * 0.006, STK, { cast: false }); t.rotation.y = (i * 0.37) % 0.3 - 0.15; }

// ---------- TV DRAW STUDIO (1992): blue starry backdrop, ball drum, rack of drawn balls ----------
const TVS = new THREE.Group(); TVS.position.set(17400, 0, 0); scene.add(TVS);
add(tbox(10, 0.3, 8, 1), toon({ color: '#2a2a4a' }), 0, -0.15, -1, TVS, { cast: false });
const starC = cvs(512, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a2a8a'); gr.addColorStop(1, '#5a2aa0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); const r = P.rng(9); for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, s = 2 + r() * 6; g.fillStyle = r() > 0.6 ? '#ffd23f' : '#ffffff'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? s * 0.45 : s; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); } });
const back = add(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ map: P.tex(starC), color: new THREE.Color(1.15, 1.15, 1.15) }), 0, 2.5, -4.5, TVS, { cast: false });
// TV studio: a light-bulb jackpot board
const jbC = cvs(512, 256, (g, W, H) => { g.fillStyle = '#2a0a3a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd23f'; for (let x = 10; x < W; x += 22) { g.beginPath(); g.arc(x, 10, 5, 0, 7); g.fill(); g.beginPath(); g.arc(x, H - 10, 5, 0, 7); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.font = '900 54px Arial Black, Arial'; g.fillText('JACKPOT', W / 2, 78); g.fillStyle = '#7affa0'; g.font = '900 70px Arial Black, Arial'; g.fillText('$27,000,000', W / 2, 168); });
const JB = add(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: P.tex(jbC), color: new THREE.Color(1.25, 1.25, 1.25) }), -2.0, 2.75, -4.4, TVS, { cast: false }); JB.userData.ndSkip = true; add(box(2.55, 1.35, 0.08), M.brass, -2.0, 2.75, -4.46, TVS, { cast: false });
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
const PUMPS = []; for (const x of [-1.2, 1.2]) { const pm = new THREE.Group(); pm.position.set(x, 0, 1.6); GAS.add(pm); PUMPS.push(pm); add(box(0.6, 0.25, 0.9), toon({ color: '#c8c8cc' }), 0, 0.12, 0, pm); add(box(0.45, 1.5, 0.6), toon({ color: '#e0302a' }), 0, 1.0, 0, pm); const scr = add(box(0.3, 0.2, 0.01), hdr('#7aff9a', 0.9), 0, 1.4, 0.31, pm, { cast: false }); scr.userData.ndSkip = true; }
const SHOP = new THREE.Group(); SHOP.position.set(0, 0, -3.2); GAS.add(SHOP); add(box(9, 3.2, 3.5), toon({ color: '#e8dcc4' }), 0, 1.6, -1.75, SHOP); add(box(9.1, 0.5, 3.6), toon({ color: '#2a5ab0' }), 0, 3.45, -1.75, SHOP);
const shopWinC = cvs(256, 128, (g, W, H) => { g.fillStyle = '#ffeec0'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8c890'; for (let i = 0; i < 4; i++) g.fillRect(10 + i * 62, 30, 50, 80); g.fillStyle = PROD(); function PROD() { return '#d05a3a'; } for (let i = 0; i < 16; i++) g.fillRect(14 + (i % 4) * 62 + (i % 2) * 20, 40 + Math.floor(i / 4) * 18, 14, 12); });
for (const x of [-3, 3]) { const w = add(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshBasicMaterial({ map: P.tex(shopWinC), color: new THREE.Color(1.5, 1.4, 1.2) }), x, 1.4, 0.02, SHOP, { cast: false }); w.userData.ndSkip = true; }
const doorG = add(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshBasicMaterial({ map: P.tex(shopWinC), color: new THREE.Color(1.15, 1.1, 0.95) }), 0, 1.2, 0.02, SHOP, { cast: false }); doorG.userData.ndSkip = true;
const SHUT = new THREE.Group(); SHUT.position.set(0, 2.45, 0.08); SHOP.add(SHUT); const shutC = cvs(64, 256, (g, W, H) => { for (let y = 0; y < H; y += 12) { g.fillStyle = '#9aa0aa'; g.fillRect(0, y, W, 10); g.fillStyle = '#6a7078'; g.fillRect(0, y + 10, W, 2); } });
const shutter = add(new THREE.PlaneGeometry(1.8, 2.5), toon({ map: P.tex(shutC), color: '#ffffff', side: THREE.DoubleSide }), 0, -1.25, 0, SHUT, { cast: false }); shutter.geometry.translate(0, -1.25, 0); shutter.position.y = 0; add(box(2.0, 0.25, 0.25), toon({ color: '#5a6068' }), 0, 0.1, 0.05, SHUT);
const neonC = cvs(256, 96, (g, W, H) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, W, H); g.shadowColor = '#ff3a5a'; g.shadowBlur = 18; g.strokeStyle = '#ff6a8a'; g.lineWidth = 8; g.beginPath(); g.roundRect(8, 8, W - 16, H - 16, 20); g.stroke(); g.font = '900 60px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd0dc'; g.fillText('OPEN', W / 2, H / 2 + 3); });
const neon = add(new THREE.PlaneGeometry(1.2, 0.45), new THREE.MeshBasicMaterial({ map: P.tex(neonC), transparent: true, color: new THREE.Color(1.8, 1.8, 1.8) }), 2.6, 2.6, 0.04, SHOP, { cast: false }); neon.userData.ndSkip = true;
const GCLK = new THREE.Group(); GCLK.position.set(-1.5, 2.65, 0.06); SHOP.add(GCLK); add(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 28), M.white, 0, 0, 0, GCLK).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(0.32, 0.03, 6, 28), toon({ color: '#1e1e28' }), 0, 0, 0.02, GCLK, { cast: false });
for (let i = 0; i < 12; i++) add(box(0.02, 0.06, 0.01), M.ironK, Math.sin(i * Math.PI / 6) * 0.26, Math.cos(i * Math.PI / 6) * 0.26, 0.035, GCLK, { cast: false });
const gHandM = add(box(0.018, 0.26, 0.01), M.ironK, 0, 0, 0.045, GCLK, { cast: false }); gHandM.geometry.translate(0, 0.12, 0); const gHandH = add(box(0.024, 0.17, 0.01), M.ironK, 0, 0, 0.05, GCLK, { cast: false }); gHandH.geometry.translate(0, 0.08, 0);
const VAN = new THREE.Group(); VAN.position.set(-4.2, 0, 2.6); VAN.rotation.y = 0.3; GAS.add(VAN); add(box(2.6, 1.5, 1.5), toon({ color: '#f2f2ee' }), 0, 1.1, 0, VAN); add(box(0.9, 1.0, 1.45), toon({ color: '#f2f2ee' }), 1.7, 0.85, 0, VAN); add(box(0.5, 0.45, 1.46), toon({ color: '#9fc4e0' }), 1.95, 1.2, 0, VAN, { cast: false });
for (const [wx, wz] of [[1.5, 0.76], [1.5, -0.76], [-0.8, 0.76], [-0.8, -0.76]]) { const w = add(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 14), M.ironK, wx, 0.3, wz, VAN); w.rotation.x = Math.PI / 2; }
const gasBoxes = []; for (let i = 0; i < 10; i++) gasBoxes.push(add(box(0.5, 0.36, 0.4), boxM, 2.1 + (i % 5) * 0.4, 0.18 + Math.floor(i / 5) * 0.37, 0.4, GAS));
const leftTix = tickField(GAS, moundPts(2.45, 0, 0.15, 0.8, 0.5, 0.5, 900, 33));
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
for (let i = 0; i < 4; i++) add(box(0.5, 0.36, 0.4), boxM, [-0.95, -0.8, 0.8, 0.95][i], 0.99 + (i % 2) * 0.37, 0.05, AT).rotation.y = (i - 2) * 0.12;
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
  wFillL.intensity = W_.ware ? 3.2 : 0; wGlow.intensity = W_.ware ? 2.0 * (W_.glow ?? 0.6) : 0; dskL.intensity = W_.ware ? (W_.lnight ? 3.2 : 1.6) : 0; NIGHT.visible = !!W_.lnight; WSHAFTS.forEach((m) => { m.visible = !W_.lnight && !!W_.ware; }); TOWER.visible = !!W_.tower; PRINTERS.forEach((p) => { p.visible = !W_.lnight; }); TBOXES.forEach((b) => { b.visible = !W_.noBoxes; }); ribT.offset.y = -(f * 0.012) % 1; sunL.intensity = W_.ware && !W_.lnight ? 2.2 : 0;
  { const tp = W_.tip ?? -0.25, bs = W_.bag ?? 0; BEAM.rotation.z = tp * 0.32; [-1, 1].forEach((sd, i) => { const x = sd * 0.34 * Math.cos(tp * 0.32), y = 1.33 + sd * 0.34 * Math.sin(tp * 0.32); PANS[i].position.set(x, y, 0); });
    BAG.visible = bs > 0; BAG.position.set(PANS[0].position.x, PANS[0].position.y - 0.255 + (1 - bs) * 0.9, 0); } moonL.intensity = W_.lnight ? 2.2 : 0; if (W_.lnight) { wFillL.intensity = 0.35; wGlow.intensity = 0; }
  if (W_.hero) { HERO.position.set(W_.hero[0], W_.hero[1], W_.hero[2]); HERO.rotation.set(W_.hero[3], W_.hero[4], W_.hero[5]); HERO.visible = true; } else HERO.visible = false;
  tvSpot.intensity = W_.tvs ? 3.0 : 0; tvBack.intensity = W_.tvs ? 2.4 : 0; gCan.intensity = W_.gas ? 3.2 : 0; gShop.intensity = W_.gas ? 2.2 : 0; gNeon.intensity = W_.gas ? 2.0 * (0.85 + 0.15 * Math.sin(f * 0.7)) : 0;
  oFill.intensity = W_.off ? 2.6 : 0; oLamp.intensity = W_.off ? 1.4 : 0;
  PUMPS.forEach((p) => { p.visible = !W_.noPumps; });
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

}
// ---------- engine kit: episode sets built from story.js `sets(K)` (see docs/ENGINE.md) ----------
const K = makeKit({ scene, grad, camera, renderer }); window.KIT = K;
const SETS = typeof STORY.sets === 'function' ? (STORY.sets(K) || {}) : {};
// ---------- cards ----------
const CW = Math.round(1200 * RS), CH = Math.round(2000 * RS), CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType, stencilBuffer: true });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, stencilBuffer: true });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 }, xray: { value: 0 }, fz: { value: 0 }, tm: { value: 0 }, con: { value: 1 },
  bl1: { value: null }, bl2: { value: null }, bl3: { value: null }, bStr: { value: 0 }, rimDir: { value: new THREE.Vector2(-0.7, 0.7) }, rimCol: { value: new THREE.Color('#ffd8a8') }, rimStr: { value: 0 }, aoStr: { value: 0 }, haze: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd, bl1, bl2, bl3; uniform vec2 res, rimDir; uniform float px, sat, vig, flash, xray, fz, tm, con, bStr, rimStr, aoStr, haze; uniform vec3 fogCol, lift, gain, rimCol; varying vec2 vUv;
  vec3 shoulder(vec3 c){ vec3 k = vec3(.82); vec3 o = c - k; return mix(c, k + (1. - k)*(1. - exp(-max(o,0.)/(1. - k))), step(k, c)); }
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec2 hz = haze > 0. ? vec2(sin(vUv.y*70. + tm*.21) + sin(vUv.y*31. - tm*.13), cos(vUv.x*55. + tm*.17)) * haze * .0018 * (1. - smoothstep(.0, .55, vUv.y)*.3) : vec2(0.);
    vec3 c = texture2D(col, vUv + hz).rgb;
    float e = edgeAt(vUv, px);
    vec4 ndc = texture2D(nd, vUv);
    bool isCard = dot(ndc.rgb, ndc.rgb) < .01 && ndc.a > 0.;
    // ---- ambient occlusion (world only, depth based) ----
    if (aoStr > 0. && !isCard && ndc.a > 0.) { float ao = 0.; float d0 = ndc.a;
      for (int i=0;i<10;i++){ float a = float(i)*.6283; vec2 o = vec2(cos(a), sin(a))*(9. + 5.*float(i - (i/2)*2))*clamp(8./d0,.5,1.6)/res; vec4 s2 = texture2D(nd, vUv+o);
        if (dot(s2.rgb,s2.rgb) < .01) continue; float dd = (d0 - s2.a)/d0; ao += smoothstep(.015,.06,dd)*(1. - smoothstep(.25,.5,dd)); }
      c *= 1. - aoStr*clamp(ao/10., 0., 1.)*1.6; }
    // ---- rim light on character cards (lit side, inside the ink) ----
    if (rimStr > 0. && isCard) { vec4 s3 = texture2D(nd, vUv + rimDir*11./res); bool edge = !(dot(s3.rgb,s3.rgb) < .01 && s3.a > 0.) || abs(s3.a - ndc.a)/ndc.a > .08;
      float lum = dot(c, vec3(.299,.587,.114)); if (edge && lum > .22) c += rimCol * rimStr * smoothstep(.22,.5,lum); }
    // ---- selective HDR bloom ----
    if (bStr > 0.) c += (texture2D(bl1, vUv).rgb*.55 + texture2D(bl2, vUv).rgb*.35 + texture2D(bl3, vUv).rgb*.3) * bStr;
    if (xray > 0.) {
      vec3 bg = mix(vec3(.01,.03,.09), vec3(.03,.10,.22), 1.-length(vUv-vec2(.5,.55))*1.3);
      vec2 gp = fract(vUv*vec2(18.,32.)); float grid = (step(gp.x,.03)+step(gp.y,.03))*.05;
      vec3 xc = c + bg + vec3(.2,.7,1.)*grid*xray;
      xc = mix(xc, vec3(.55,.95,1.), e*.9);
      xc *= .9 + .1*sin(vUv.y*1400. + tm*6.);
      c = mix(mix(c, vec3(.012,.01,.014), e), xc, xray);
    } else c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift; c = (c-.45)*con+.45;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    if (fz > 0.) { float lf = dot(c, vec3(.299,.587,.114)); c = mix(c, mix(vec3(lf), c, .55)*vec3(.86,.97,1.12), fz*.6); }
    c = mix(c, vec3(.82,.95,1.), max(flash,0.));
    c = shoulder(max(c, 0.));
    gl_FragColor = vec4(c,1.); }` }));
// ---------- selective HDR bloom: bright-pass (cards & sky excluded) + 3-level gaussian ----------
const BL = [2, 4, 8].map((d) => ({ a: new THREE.WebGLRenderTarget(W / d, H / d, { type: THREE.HalfFloatType }), b: new THREE.WebGLRenderTarget(W / d, H / d, { type: THREE.HalfFloatType }), d }));
const bpU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, thr: { value: 1.0 } };
const bpScene = fs(new THREE.ShaderMaterial({ uniforms: bpU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform float thr; varying vec2 vUv; void main(){ vec3 acc = vec3(0.); vec2 px = vec2(1.)/vec2(textureSize(col,0));
    for (int j=-1;j<=1;j++) for (int i=-1;i<=1;i++){ vec2 uv = vUv + vec2(float(i),float(j))*px; vec4 n = texture2D(nd, uv); bool card = dot(n.rgb,n.rgb) < .01 && n.a > 0.; vec3 c = texture2D(col, uv).rgb;
      float l = max(c.r, max(c.g, c.b)); float k = smoothstep(thr*.92, thr*1.25, l); acc += card ? vec3(0.) : c*k; }
    gl_FragColor = vec4(acc/9., 1.); }` }));
const blU = { src: { value: null }, dir: { value: new THREE.Vector2() } };
const blScene = fs(new THREE.ShaderMaterial({ uniforms: blU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src; uniform vec2 dir; varying vec2 vUv; void main(){ float w[5]; w[0]=.227; w[1]=.194; w[2]=.121; w[3]=.054; w[4]=.016; vec3 a = texture2D(src, vUv).rgb*w[0];
    for (int i=1;i<5;i++){ a += texture2D(src, vUv + dir*float(i)*1.6).rgb*w[i]; a += texture2D(src, vUv - dir*float(i)*1.6).rgb*w[i]; } gl_FragColor = vec4(a, 1.); }` }));
const cpScene = fs(new THREE.MeshBasicMaterial({ map: null, toneMapped: false }));
function runBloom(thr) {
  bpU.thr.value = thr; renderer.setRenderTarget(BL[0].a); renderer.render(bpScene, fsCam);
  let src = BL[0].a.texture;
  BL.forEach((L, i) => {
    if (i > 0) { cpScene.children[0].material.map = BL[i - 1].a.texture; cpScene.children[0].material.needsUpdate = true; renderer.setRenderTarget(L.a); renderer.render(cpScene, fsCam); }
    blU.src.value = L.a.texture; blU.dir.value.set(1 / (W / L.d), 0); renderer.setRenderTarget(L.b); renderer.render(blScene, fsCam);
    blU.src.value = L.b.texture; blU.dir.value.set(0, 1 / (H / L.d)); renderer.setRenderTarget(L.a); renderer.render(blScene, fsCam);
  });
  inkU.bl1.value = BL[0].a.texture; inkU.bl2.value = BL[1].a.texture; inkU.bl3.value = BL[2].a.texture;
}
window.BLOOM_OFF = new URLSearchParams(location.search).get('nobloom') === '1';
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 }, tilt: { value: 0 }, tiltC: { value: .5 }, tiltW: { value: .12 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near, tilt, tiltC, tiltW; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; float c1 = k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); return max(c1, tilt*smoothstep(tiltW, tiltW+.3, abs(uv.y-tiltC))); }
  void main(){
    float c0 = coc(vUv);
    if ((cinf < .5 && tilt < .5) || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}


function worldState(W_, f) {
  const lit = !W_.night;
  ENV.beams.forEach((b) => { b.visible = lit && !XR.on; });
  ENV.candles.forEach((c, i) => { c.scale.y = (c.geometry.parameters.radius > 0.05 ? 1.5 : 1.8) * (1 + 0.12 * Math.sin(f * 0.8 + i)); });
  ENV.candleLights.forEach((l, i) => { l.intensity = (W_.candles ?? 1.4) * (0.9 + 0.1 * Math.sin(f * 0.7 + i)); });
  labFill.intensity = W_.labFill ?? 2.6; hallFill.intensity = W_.hall ? 4.5 : 0;
  moon.visible = !!W_.night; nightLamp.intensity = W_.night ? 5 : 0;
  // millstone
  wheel.rotation.z = -(W_.mill || 0); MILL.rotation.z = W_.millTip || 0; MILL.position.y = 0.5 - (W_.millDrop || 0);
  // stomach lab
  pinkL.intensity = W_.stomach ? 6 : 0; juiceL.intensity = W_.stomach ? 1.4 + 0.3 * Math.sin(f * 0.4) : 0;
  const ds = W_.bagDissolve ?? 0; sbBag.visible = ds < 0.98; sbBag.scale.setScalar(Math.max(0.02, 1 - ds)); sbBag.position.y = 0.42 + 0.03 * Math.sin(f * 0.15);
  LABS.visible = !!W_.labs;
  // desk props
  BAGS.forEach((b, i) => { b.visible = (W_.bags ?? 3) > i; });
  meatV.visible = W_.meatV != null; if (W_.meatV != null) { meatV.position.y = W_.meatV.y; meatV.scale.setScalar(Math.max(0.01, W_.meatV.s)); meatV.rotation.y = f * 0.02; }
  HV.userData.liq.scale.y = W_.vialFill ?? 1; HV.userData.liq.position.y = 0.34 * 0.7 * (W_.vialFill ?? 1) / 2;
  gjLabel.visible = !!W_.label;
  basinLiq.visible = !!W_.basin;
  THREADS.visible = !!W_.threads; if (!XR.on) win.material = W_.alps ? winMatAlps : winMatPavia;
  hvFill.intensity = W_.harvard ? 3.0 : 0; scopeGlow.intensity = W_.harvard ? 1.5 + 3 * (W_.scope || 0) : 0;
  drawScope(W_.scope || 0, f); NEEDLES.forEach((n, i) => { n.rotation.z = 1.0 - (W_.scope || 0) * (1.6 + 0.3 * Math.sin(f * 0.9 + i)); });
  lamps.forEach((l, i) => { l.visible = (W_.scope || 0) > 0.05 ? (Math.floor(f / 3) + i) % 2 === 0 : i === 0; });
  drawBoard(W_.board || 0);
  hgFill.intensity = W_.hg ? 5.0 : 0; hgFill2.intensity = W_.hg ? 3.0 : 0; cbFill.intensity = W_.cb ? 3.0 : 0;
  R_labFill.intensity = W_.lab ? 4.5 : 0; labWin.intensity = W_.lab ? 3.0 : 0; ctFill.intensity = W_.court ? 6 : 0; ghFire.intensity = W_.gh ? 2.4 * (W_.fire ?? 1) : 0; ghFill.intensity = W_.gh ? 6 : 0; R_stFill.intensity = W_.st ? 2.5 : 0;
  applyDrop(LDROP, LSH, W_.dcrack || 0, W_.dboom ?? -1);
  HAM.visible = W_.ham != null; if (W_.ham != null) { HAM.position.set(0.67, 1.46, 0); HAM.rotation.set(0, 0, W_.ham); }
  PLI.visible = W_.pli != null; if (W_.pli != null) { const P_ = W_.pli; PLI.position.set(-0.318, 1.312, 0.099 + (1 - P_.in) * 0.6); PLI.rotation.set(0, -Math.PI / 2, 0); pj.forEach((j) => { j.position.y = j.userData.sd * (0.006 + 0.03 * (1 - P_.close)); }); }
  if (W_.hdrop != null) { HDROP.visible = true; HDROP.position.set(0, W_.hdrop, 0); HDROP.rotation.z = W_.hrot || 0; const h = W_.heat ?? 1; HDROP.userData.body.material = h > 0.05 ? M.hotD : M.glassD; M.hotD.color.set('#ffb040').lerp(new THREE.Color('#ff3a10'), Math.max(0, 1 - h) * 0.9); } else HDROP.visible = false;
  CWIN.visible = (W_.cubes ?? -1) < 0; CUBES.visible = !CWIN.visible; if (CUBES.visible) setCubes(W_.cubes);
  EHAM.visible = W_.eham != null; if (W_.eham != null) { const e = W_.eham; EHAM.position.set(0.55 + e * 0.05, 1.2, 0.98 + e * 0.35); EHAM.rotation.set(0, Math.PI / 2, 0.3); }
  for (const c of dockClouds) c.quaternion.copy(camera.quaternion);
  sunL.intensity = W_.des ? 2.0 : 0; conL.intensity = W_.con ? 4.5 : 0; ofL.intensity = W_.of ? 4.5 : 0; mdL.intensity = W_.md ? 4.0 : 0; ciL.intensity = W_.ci ? 3.5 : 0;
  SLED.position.x = W_.sx ?? 0; { const fi = W_.fire || 0, fk = 0.85 + 0.15 * Math.sin((W_.ft || 0) * 2.1) * Math.sin((W_.ft || 0) * 3.7); FL.forEach((m, i) => { m.visible = fi > 0.01; m.scale.set(1.3, (i % 2 ? 1.7 : 1.3) * fi * fk * (1 + 0.1 * Math.sin((W_.ft || 0) * 5 + i)), 1.3); }); fireL.intensity = fi * 2.2 * fk;
    SMK.forEach((m, k) => { const age = k * 0.06, al = (W_.smoke || 0) * Math.max(0, 1 - age / 4.2); m.visible = al > 0.02 && !XR.on; if (!m.visible) return; const vel = W_.vel || 0; m.position.set((W_.sx ?? 0) - 3.6 - (vel * 30 * 0.9 + 1.5) * age + Math.sin(k * 1.7) * 0.4, 1.2 + age * 1.6 + Math.sin(k * 2.3) * 0.3, -0.2 - Math.abs(Math.sin(k * 3.1)) * (0.4 + age * 1.0)); m.scale.setScalar(1.2 + age * 5.5); m.material.opacity = al * 0.9; m.quaternion.copy(camera.quaternion); }); }
  DIALS.forEach((d, i) => { d.rotation.z = -((W_.dial || 0) * (1.2 + i * 0.3) + Math.sin((W_.ft || 0) * (0.7 + i * 0.3)) * 0.2) + 1.0; }); LAMPS.forEach((l, i) => l.material.color && l.material.color.set((W_.lamps || 0) > i / 8 ? '#ff3a2a' : '#40e060')); BTN.position.y = 1.2 - 0.05 * (W_.press || 0);
  S_BOARD.material.map = W_.board ? boardT1 : boardT0;
  { const hot = W_.hot ?? 0, fl = 0.85 + 0.15 * Math.sin((W_.ft || 0) * 0.9) * Math.sin((W_.ft || 0) * 1.7 + 1);
    STVHOT.forEach((m) => { if (m.material.emissive) { m.material.emissive.set('#ff3a10'); m.material.emissiveIntensity = hot * 0.55 * fl; } }); M.grate.color.set('#ff7a20').multiplyScalar(0.6 + 2.4 * hot * fl); stoveL.intensity = W_.hr ? (0.6 + 4.5 * hot) * fl : 0; hrFill.intensity = W_.hr ? 2.6 : 0;
    sdoor.rotation.y = -(W_.sdoor || 0) * 1.6;
    const ck = W_.cook || 0; STEAK.material.color && STEAK.material.color.set('#ffffff').lerp(new THREE.Color('#8a5a40'), Math.min(1, ck * 1.3)).lerp(new THREE.Color('#4a3020'), Math.max(0, ck - 0.7) / 0.3 * 0.7); fatRim.material.color && fatRim.material.color.set('#f4e4dc').lerp(new THREE.Color('#c88a5a'), Math.min(1, ck)); EGGS.forEach((e) => e.material.color && e.material.color.set('#f6f0e2').lerp(new THREE.Color('#e2c898'), Math.min(1, (W_.eggc || 0))));
    merc.scale.y = 0.15 + 0.8 * (W_.temp ?? 0.2); hMin.rotation.z = -(W_.clock || 0) * Math.PI * 2; hHr.rotation.z = -(W_.clock || 0) * Math.PI * 2 / 12 - 1.0;
    FLAMES.forEach((f, i) => f.scale.set(1, 0.8 + 0.3 * Math.sin((W_.ft || 0) * (1.3 + i * 0.4) + i), 1)); CANDF.forEach((f, i) => f.scale.set(1, 1.7 + 0.25 * Math.sin((W_.ft || 0) * (1.9 + i) + i * 2), 1));
    fireL2.intensity = W_.stu ? 3.2 * fl : 0; candL.intensity = W_.stu ? 2.0 : 0; sauL.intensity = W_.sau ? 3.0 : 0; }
  world.visible = !W_.sky; cloudSea.visible = !!W_.sky && !XR.on; cseaT.offset.x = -(W_.cloudShift || 0) / 3000 * 14;
  SKYJ.userData.crack.visible = (W_.crack || 0) > 0; SKYJ.userData.crack.scale.x = Math.max(0.01, W_.crack || 0);
  for (const c of skyClouds) { const b = c.userData.base, sp = W_.cloudShift || 0; c.position.set(((b[0] + sp + 60) % 120 + 120) % 120 - 60, b[1], b[2]); c.quaternion.copy(camera.quaternion); c.visible = !!W_.sky && !XR.on; }
  TJ.position.y = lerp(10.5, 4.0, W_.lower ?? 1); TJ.userData.body.scale.set(1 + 0.012 * (W_.breath || 0), 1, 1 + 0.012 * (W_.breath || 0)); for (const c of cables) { const top = 13, bot = TJ.position.y + 1.2; c.position.y = (top + bot) / 2; c.scale.y = Math.max(0.01, top - bot); }
  TKF.forEach((m) => { m.visible = !W_.cut; }); cutEdge.visible = !!W_.cut && !XR.on;
  TJ.userData.crack.visible = (W_.tcrack || 0) > 0; TJ.userData.crack.scale.x = Math.max(0.01, W_.tcrack || 0);
  needle.rotation.z = -lerp(-2.0, 1.2, W_.psi || 0);
  const wd = !!W_.wd; wdFill.intensity = wd ? 3.4 : 0; wdBack.intensity = wd ? 2.0 : 0; mcFill.intensity = W_.mc ? 3.4 : 0;
  if (W_.tube) { const [a, b] = W_.tube; const A = new THREE.Vector3(a[0] - 2200, a[1], a[2]), B = new THREE.Vector3(b[0] - 2200, b[1], b[2]); ptube.visible = true; ptube.position.copy(A).add(B).multiplyScalar(0.5); ptube.scale.set(1, A.distanceTo(B), 1); ptube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); } else ptube.visible = false;
  const cl = !!W_.cl; clFill.intensity = cl ? 3.4 : 0; clBack.intensity = cl ? 2.0 : 0; mdFill.intensity = W_.md ? 3.6 : 0;
  const th = !!W_.th; thFill.intensity = th ? 3.4 : 0; thBack.intensity = th ? 2.2 : 0; thSpot.intensity = th ? 16 : 0;
  THL.lap.forEach((m) => { m.visible = !!W_.lap; }); THL.pil.forEach((m) => { m.visible = W_.pil !== false; });
  const hos = !!W_.hos; orFill.intensity = hos ? 3.2 : 0; stFill.intensity = hos ? 3.6 : 0; xrFill.intensity = hos ? 2.4 : 0; opLight.intensity = hos ? 14 : 0;
  xrGlow.intensity = hos ? 2.0 * (W_.fluoro || 0) : 0; M.screenG.color.set((W_.fluoro || 0) > 0.5 ? '#ffffff' : '#2a5a3a');
  { const lab = !!W_.slab; sLabFill.intensity = lab ? 3.0 : 0; sSunL.intensity = lab ? 2.6 : 0; sCandL.intensity = lab ? 0.8 * (0.9 + 0.1 * Math.sin(f * 0.7)) : 0; SCAND.forEach((c) => c.scale.set(1, 1.8 + 0.2 * Math.sin(f * 0.6), 1));
    const d = Math.max(1, Math.min(8, Math.round(W_.day || 1))); if (d !== calDay) { calDay = d; drawCal(d); }
    const ct = W_.cupTip || 0; cupBody.rotation.z = ct * 1.7; SCUP.position.x = 0.12 + (W_.cupSlide || 0); SCUP.position.y = 0.805 - (W_.cupFall || 0);
    chairIn.rotation.x = -(W_.chairTip || 0) * 1.45; chairIn.position.z = (W_.chairTip || 0) * 0.25;
    SBOOKS.forEach((b, i) => { const k = Math.max(0, Math.min(1, (W_.books || 0) * 1.6 - i * 0.15)); b.position.set(b.userData.base.x - k * 0.5, b.userData.base.y - k * (b.userData.base.y - 0.05), b.userData.base.z + k * 0.25); b.rotation.set(k * 1.2, 0, k * (1.4 + i * 0.2)); });
    const wk = W_.winK ?? 1; sWinP.material.color && sWinP.material.color.setRGB(lerp(0.22, 1.25, wk), lerp(0.28, 1.22, wk), lerp(0.5, 1.15, wk)); if (lab) sSunL.intensity = 2.6 * wk; sunPool.material.opacity = 0.55 * wk;
    sunPool.visible = lab && !XR.on; const nb = !!W_.sbed; bCandL.intensity = nb ? 2.6 * (0.9 + 0.1 * Math.sin(f * 0.8)) : 0; bMoonL.intensity = nb ? 2.2 : 0; bFl.scale.set(1, 1.8 + 0.25 * Math.sin(f * 0.9), 1); }
  goldState(W_, f);
  lotState(W_, f);
  if (SETS.update) SETS.update(W_, f, camera);
  K.update(f, camera);
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}
const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};


const xrMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float a = 1.-abs(dot(normalize(vN), normalize(vV))); a = pow(a, 3.); gl_FragColor = vec4(vec3(.25,.7,1.)*(a*.09+.004), 1.); }` });
const XR = { on: false };
function setXray(v) {
  const on = v > 0.5; if (on === XR.on) return; XR.on = on;
  scene.traverse((o) => { if (!o.isMesh && !o.isSprite) return; if (cards.some((c) => c.mesh === o)) return;
    if (on) { o.userData.xr0 = o.material; o.userData.xv0 = o.visible; if (o.userData.keepXr) return; if (o === sky || o.userData.sky || o.userData.ndSkip || (o.material && o.material.transparent && !o.material.map) || (o.material && o.material.blending === THREE.AdditiveBlending)) { o.visible = false; return; } o.material = xrMat; }
    else { if (o.userData.xr0) o.material = o.userData.xr0; if (o.userData.xv0 !== undefined) o.visible = o.userData.xv0; delete o.userData.xr0; delete o.userData.xv0; } });
  renderer.shadowMap.enabled = !on;
}
if (LOOK === 'mini') {
  const conv = new Map();
  scene.traverse((o) => { if (!o.isMesh) return; const m = o.material; if (!m || !m.isMeshToonMaterial) return;
    if (!conv.has(m)) { const n = new THREE.MeshStandardMaterial({ map: m.map, color: m.color, roughness: 0.62, metalness: 0.0, side: m.side, transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite, alphaTest: m.alphaTest, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity });
      for (const k of ['bumpMap', 'bumpScale', 'normalMap', 'clippingPlanes', 'clipShadows', 'stencilWrite', 'stencilRef', 'stencilFunc', 'stencilFail', 'stencilZFail', 'stencilZPass', 'emissiveMap', 'alphaMap']) if (m[k] !== undefined && m[k] !== null) n[k] = m[k];
      conv.set(m, n); }
    o.material = conv.get(m); });
}
const annMat = new THREE.MeshBasicMaterial({ map: null, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }); let annT = null;
const annScene = fs(annMat);
window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f); setXray(W_.xray || 0);
  // speed: only lights that are on and near the camera enter the shaders (39 sets share one scene)
  if (!window.__LTS) { window.__LTS = []; scene.traverse((o) => { if (o.isPointLight || o.isSpotLight) window.__LTS.push(o); }); }
  for (const l of window.__LTS) { l.getWorldPosition(tmpV); l.visible = l.intensity > 0.001 && tmpV.distanceTo(camera.position) < 22; }
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  for (const c of clouds) { c.quaternion.copy(camera.quaternion); c.visible = !L.noClouds; }
  renderer.setRenderTarget(rtColor); renderer.setClearColor(XR.on ? 0x000000 : 0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  const D = dofAt(f);
  inkU.px.value = (L.ink ?? 2.5) * RS; inkU.flash.value = C.flash || 0; inkU.vig.value = L.vig ?? 0.22; inkU.xray.value = W_.xray || 0; inkU.fz.value = W_.freeze || 0; inkU.tm.value = f; inkU.con.value = L.con ?? 1;
  dofU.tilt.value = (D.tilt || 0) * RS; dofU.tiltC.value = D.tiltC ?? 0.5; dofU.tiltW.value = D.tiltW ?? 0.12;
  window.CAMPOS = [camera.position.x, camera.position.y, camera.position.z]; window.PROJ = (x, y, z) => { tmpV.set(x, y, z).project(camera); return [(tmpV.x + 1) / 2 * 1080, (1 - tmpV.y) / 2 * 1920, tmpV.z]; };
  const bS = window.BLOOM_OFF ? 0 : (W_.bloom ?? L.bloom ?? 0.5); inkU.bStr.value = bS; if (bS > 0) runBloom(L.bthr ?? 1.0);
  inkU.rimStr.value = window.BLOOM_OFF ? 0 : (L.rim ?? 0.16); inkU.rimCol.value.set(L.rimCol || '#ffe0b8'); inkU.rimDir.value.set(...(L.rimDir || [-0.7, 0.7])); inkU.aoStr.value = L.ao ?? 0.22; inkU.haze.value = W_.haze || 0;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf * RS; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  // ---- hand-drawn annotations (labels / arrows / red circles) on top, crisp and camera-tracked ----
  const AN = typeof STORY.annotAt === 'function' ? STORY.annotAt(f) : null;
  if (AN && AN.length && drawAnnotations(AN, window.PROJ, W, H, RS)) { if (!annT) { annT = new THREE.CanvasTexture(AnnCanvas()); annT.colorSpace = THREE.SRGBColorSpace; annMat.map = annT; annMat.needsUpdate = true; } annT.needsUpdate = true;
    renderer.autoClear = false; renderer.render(annScene, fsCam); renderer.autoClear = true; }
  if (window.overlay) window.overlay(f);
  return true;
};
window.TOTAL = TOTAL;
await fontReady;
window.ready = true;
