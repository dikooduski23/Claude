// Doc Zap 2D overlay: rain, text hook + signs, karaoke captions, badge, progress bar, yes/no CTA.
import { WORDS, HOOK } from './overlay_data.js';
import { overlayInfo, TOTAL } from './story.js';
const W = 1080, H = 1920, INK = '#0d0b12';
const RS = +(new URLSearchParams(location.search).get('rs') || 1);
const o = document.createElement('canvas'); o.id = 'o'; o.width = Math.round(W * RS); o.height = Math.round(H * RS); o.style.display = 'none'; document.body.appendChild(o);
const g = o.getContext('2d');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const back = (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
const lerp = (a, b, t) => a + (b - a) * t;
const popIn = (t, t0) => t < t0 ? 0 : back(prog(t, t0, t0 + 0.28));
const KEY = new Set(['storm', 'church', 'tower', 'bell', 'lightning', 'killing', 'hundreds', 'break', 'carved', 'black', 'rope', 'pulled', 'towers', 'dying', 'thirtythree', 'killed', 'hundred', 'three', 'scientist', 'johann', 'fischer', 'deaths', 'truth', 'tallest', 'wet', 'straight', 'hit', 'rode', 'hands', 'scaring', 'calling', 'paris', 'banned', 'rods', 'job', 'climbed', 'follow', 'comment', 'yes', 'no']);
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function txt(s, x, y, size, col, stroke, sw) { g.font = `900 ${size}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; if (stroke) { g.lineWidth = sw || 10; g.strokeStyle = stroke; g.strokeText(s, x, y); } g.fillStyle = col; g.fillText(s, x, y); }
function sign(t, t0, t1, y, lines, bg, fg, size, rot = -0.025) {
  if (t < t0 || (t1 != null && t > t1)) return;
  const s = popIn(t, t0) * (t1 != null ? 1 - back(prog(t, t1 - 0.18, t1)) * 0 : 1);
  g.font = `900 ${size}px Inter`; const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 70, h = lines.length * size * 1.15 + 44;
  g.save(); g.translate(W / 2, y); g.scale(s, s); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24; g.shadowOffsetY = 10;
  rr(-w / 2, -h / 2, w, h, 26); g.fillStyle = bg; g.fill(); g.shadowColor = 'transparent'; g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  lines.forEach((l, i) => txt(l, 0, -h / 2 + 22 + size * 0.58 + i * size * 1.15, size, Array.isArray(fg) ? fg[i] : fg));
  g.restore();
}
// Rick's Clips style: 1-2 words at a time, big white text, thick black outline, pop-in bounce, keywords yellow
function capChunks() { const C = []; let cur = []; for (const w of WORDS) { cur.push(w); const end = /[.,!?:…"]$/.test(w.w) || cur.length >= 2; if (end) { C.push(cur); cur = []; } } if (cur.length) C.push(cur); return C; }
const CAPCH = capChunks();
function captions(t) {
  let C = null, nextS = 1e9;
  for (let i = 0; i < CAPCH.length; i++) { const c = CAPCH[i], ns = i + 1 < CAPCH.length ? CAPCH[i + 1][0].s : 1e9; if (t >= c[0].s && t < Math.min(ns, c[c.length - 1].e + 0.35)) { C = c; nextS = ns; } }
  if (!C) return;
  const words = C.map((x) => x.w.replace(/\.\.\.$/, '').replace(/[,:;]$/, '').replace(/^"|"$/g, '').replace(/\."$/, '.').replace(/\.$/, ''));
  const txtS = words.join(' ');
  const RK = true; let fsz = RK ? 70 : 84; g.font = `${RK ? 800 : 900} ${fsz}px Inter`;
  while (g.measureText(txtS).width > 900) { fsz -= 4; g.font = `${RK ? 800 : 900} ${fsz}px Inter`; }
  const p0 = prog(t, C[0].s - 0.03, C[0].s + 0.16), sc = lerp(0.55, 1, back(p0, 2.6));
  const shot = overlayInfo(Math.round(t * 30)).shot, y = RK ? (overlayInfo(Math.round(t * 30)).capY || 1390) : (shot === 'nap' || shot === 'cta') ? 1560 : shot === 'fischer' ? 1480 : 1060;
  g.save(); g.translate(W / 2, y); g.scale(sc, sc); g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
  const sp = g.measureText(' ').width, ws = words.map((w) => g.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let x = -tot / 2;
  words.forEach((w, i) => {
    const kw = KEY.has(w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (RK) { g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 14; g.shadowOffsetY = 4; g.lineWidth = fsz * 0.12; } else { g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 0; g.shadowOffsetY = 9; g.lineWidth = fsz * 0.2; } g.strokeStyle = '#000'; g.strokeText(w, x, 0);
    g.shadowColor = 'transparent'; g.fillStyle = '#ffffff'; g.fillText(w, x, 0);
    x += ws[i] + sp;
  });
  g.restore();
}
function rain(f, a) {
  g.save(); g.globalAlpha = 0.5 * a; g.strokeStyle = '#cfe0ff'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < 140; i++) { const sx = (i * 137.5) % W, sp = 70 + (i % 7) * 12, y = ((f * sp + i * 311) % (H + 300)) - 150, x = sx + y * 0.18; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10, y - 46); g.stroke(); }
  g.restore();
}
function badge() { g.save(); g.globalAlpha = 0.9; rr(40, 44, 318, 64, 32); g.fillStyle = 'rgba(10,8,16,.55)'; g.fill(); g.beginPath(); g.arc(80, 76, 16, 0, 7); g.fillStyle = '#7ae6ff'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#ffd23f'; g.stroke(); txt('DOC ZAP · EP.13', 218, 77, 30, '#ffffff'); g.restore(); }
function yesno(t, ty, tn) { for (const [x, t0, lab, col] of [[300, ty, 'YES', '#2a9d5a'], [780, tn, 'NO', '#c62828']]) { const s = popIn(t, t0); if (s <= 0) continue; g.save(); g.translate(x, 760); g.scale(s, s); rr(-130, -64, 260, 128, 64); g.fillStyle = col; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); txt(lab, 0, 4, 64, '#fff'); g.restore(); } }
// glossy bloom: isolate highlights at 1/4 res, blur twice (tight + wide), screen back over the frame
const BW = 270, BH = 480;
const bA = document.createElement('canvas'); bA.width = BW; bA.height = BH; const ga = bA.getContext('2d');
const bB = document.createElement('canvas'); bB.width = BW; bB.height = BH; const gb = bB.getContext('2d');
function bloom(src) {
  const B = window.BLOOM || { thr: 'brightness(0.92) contrast(3.2) saturate(1.6)', tight: 3, wide: 16, a1: 0.1, a2: 0.3, glow: 0.1 };
  ga.filter = B.thr; ga.clearRect(0, 0, BW, BH); ga.drawImage(src, 0, 0, BW, BH); ga.filter = 'none';
  g.save(); g.globalCompositeOperation = 'screen';
  gb.filter = `blur(${B.tight}px)`; gb.clearRect(0, 0, BW, BH); gb.drawImage(bA, 0, 0); gb.filter = 'none';
  g.globalAlpha = B.a1; g.drawImage(bB, 0, 0, W, H);
  gb.filter = `blur(${B.wide}px)`; gb.clearRect(0, 0, BW, BH); gb.drawImage(bA, 0, 0); gb.filter = 'none';
  g.globalAlpha = B.a2; g.drawImage(bB, 0, 0, W, H);
  // soft overall glow (glossy sheen on everything, not just highlights)
  gb.filter = 'blur(10px) saturate(1.3)'; gb.clearRect(0, 0, BW, BH); gb.drawImage(src, 0, 0, BW, BH); gb.filter = 'none';
  g.globalAlpha = B.glow; g.drawImage(bB, 0, 0, W, H);
  g.restore();
}
window.overlay = (f) => {
  if (window.NOOV) return; const t = f / 30, src = window.SRC || document.getElementById('c'), info = overlayInfo(f);
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(src, 0, 0, o.width, o.height); g.setTransform(RS, 0, 0, RS, 0, 0);
  if (!window.NOBLOOM) bloom(src, info);
  if (info.rain) rain(f, info.rain);

  if (window.STYLE !== 'rick') { zapLayer(f, t, info); return; }
  if (window.STYLE === 'rick') { // clean frame like Rick's Clips: no cards, no badge, no bar — captions + small handle watermark only
    if (HOOK && t < 2.4) { // full-sentence text hook, frame 1 only, then the frame stays clean
      const a = t < 2.1 ? 1 : 1 - (t - 2.1) / 0.3; g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      let hs = 74; g.font = `900 ${hs}px Inter`; while (Math.max(...HOOK.map((l) => g.measureText(l).width)) > 960) { hs -= 2; g.font = `900 ${hs}px Inter`; }
      HOOK.forEach((l, i) => { g.font = `900 ${hs}px Inter`; g.lineWidth = 14; g.strokeStyle = '#000'; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 6; g.strokeText(l, W / 2, 300 + i * hs * 1.22); g.shadowColor = 'transparent'; g.fillStyle = i ? '#ffd23f' : '#ffffff'; g.fillText(l, W / 2, 300 + i * hs * 1.22); });
      g.restore(); }
    if (!window.NOCAP) captions(t);
    if (window.WATERMARK) { g.save(); g.globalAlpha = 0.85; g.strokeStyle = '#fff'; g.lineWidth = 5; rr(904, 470, 52, 52, 15); g.stroke(); g.beginPath(); g.arc(930, 496, 12, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(946, 480, 3.5, 0, 7); g.fill();
    g.font = '600 22px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 6; g.fillText('@DOCZAPSTORIES', 930, 552); g.restore(); }
    return;
  }
  // text hook (frame 1) + story signs
  sign(t, -0.3, 4.95, 360, ['HE RANG THE BELL', 'TO STOP LIGHTNING…'], '#c62828', ['#ffffff', '#ffd23f'], 70);
  sign(t, 197 / 30, 227 / 30, 360, ['…AND IT WAS KILLING HIM'], '#1d1a26', '#ffffff', 52, 0.02);
  sign(t, 315 / 30, 350 / 30, 360, ['BELLS BREAK STORMS?'], '#ffd23f', '#1d1a26', 58);
  sign(t, 418 / 30, 453 / 30, 1560, ['“I BREAK THE LIGHTNING”'], '#f4ead2', '#1d1a26', 50, 0.02);
  sign(t, 469 / 30, 583 / 30, 360, ['STORM = RING THE BELL'], '#1d1a26', '#ffffff', 52);
  sign(t, 600 / 30, 659 / 30, 360, ['TOWERS KEPT GETTING HIT'], '#c62828', '#ffffff', 54);
  sign(t, 666 / 30, 689 / 30, 360, ['RINGERS KEPT DYING'], '#1d1a26', '#ffffff', 56);
  if (t >= 702 / 30 && t < 786 / 30) { const n = Math.round(lerp(0, 103, clamp(prog(t, 753 / 30, 772 / 30)))); const s = popIn(t, 702 / 30); g.save(); g.translate(W / 2, 470); g.scale(s, s); rr(-300, -190, 600, 380, 30); g.fillStyle = '#f4ead2'; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke(); txt(t < 753 / 30 ? '33 YEARS' : String(n), 0, -30, t < 753 / 30 ? 96 : 170, '#c62828'); txt('BELL RINGERS KILLED', 0, 120, 42, INK); g.restore(); }
  sign(t, 820 / 30, 878 / 30, 360, ['JOHANN FISCHER · 1784'], '#bfe6ff', '#1d1a26', 54);
  sign(t, 880 / 30, 910 / 30, 360, ['HE FOUND THE TRUTH'], '#ffd23f', '#1d1a26', 58);
  sign(t, 916 / 30, 975 / 30, 360, ['TALLEST THING IN TOWN'], '#1d1a26', '#ffffff', 54);
  sign(t, 1006 / 30, 1062 / 30, 360, ['WET ROPE = WIRE'], '#2e5aa8', '#ffffff', 58);
  sign(t, 1113 / 30, 1149 / 30, 360, ['IT RODE THE ROPE…'], '#1d1a26', '#ffffff', 56);
  sign(t, 1150 / 30, 1182 / 30, 360, ['…INTO HIS HANDS'], '#c62828', '#ffffff', 62);
  sign(t, 1244 / 30, 1267 / 30, 380, ['IT WAS CALLING IT.'], '#ffd23f', '#1d1a26', 70);
  if (t >= 1271 / 30 && t < 1358 / 30) { const s = popIn(t, 1271 / 30); g.save(); g.translate(W / 2, 520); g.scale(s, s); g.rotate(-0.03); rr(-330, -230, 660, 460, 14); g.fillStyle = '#efe2c0'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#5a4020'; g.stroke(); txt('PARIS · 1786', 0, -140, 60, '#5a2a14'); txt('STORM RINGING', 0, -20, 66, INK); txt('BANNED', 0, 70, 96, '#c62828'); g.beginPath(); g.arc(210, 160, 46, 0, 7); g.fillStyle = '#b8322f'; g.fill(); g.restore(); }
  sign(t, 1365 / 30, 1396 / 30, 360, ['LIGHTNING ROD ⚡'], '#ffd23f', '#1d1a26', 58);
  sign(t, 1404 / 30, 1441 / 30, 360, ['RINGER: RETIRED'], '#2a9d5a', '#ffffff', 56);
  if (t >= 1443 / 30 && t < 1486 / 30) sign(t, 1443 / 30, null, 760, ['WOULD YOU?'], '#ffd23f', '#1d1a26', 90);
  if (t >= 1486 / 30 && t < 1544 / 30) { sign(t, 1486 / 30, null, 420, ['+ FOLLOW', 'COMMENT ↓'], '#1d1a26', ['#ffd23f', '#ffffff'], 56); yesno(t, 1516 / 30, 1528 / 30); }
  if (t >= 1544 / 30) sign(t, 1544 / 30, null, 360, ['HE RANG THE BELL', 'TO STOP LIGHTNING…'], '#c62828', ['#ffffff', '#ffd23f'], 70);
  if (!window.NOCAP) captions(t);
  // no episode number on screen (Diyar, Nov 15)
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, H - 14, W, 14); g.fillStyle = '#ffd23f'; g.fillRect(0, H - 14, W * f / (TOTAL - 1), 14);
};

// ================= ZAP CUT editing layer =================
function srnd(a) { let x = Math.sin(a * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function bolt(x0, y0, x1, y1, seed, w, col, a) {
  const pts = [[x0, y0]]; const n = 9; for (let i = 1; i < n; i++) { const u = i / n; const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1; const off = (srnd(seed + i) - 0.5) * 160;
    pts.push([lerp(x0, x1, u) + nx / L * off, lerp(y0, y1, u) + ny / L * off]); } pts.push([x1, y1]);
  g.save(); g.globalAlpha = a; g.lineJoin = 'round'; g.lineCap = 'round';
  g.shadowColor = col; g.shadowBlur = 40; g.strokeStyle = col; g.lineWidth = w * 2.4; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
  g.shadowBlur = 0; g.strokeStyle = '#ffffff'; g.lineWidth = w; g.stroke();
  // branches
  for (let b = 0; b < 3; b++) { const k = 2 + Math.floor(srnd(seed + 40 + b) * (n - 3)); const [bx, by] = pts[k]; const ex = bx + (srnd(seed + 50 + b) - 0.5) * 420, ey = by + (srnd(seed + 60 + b) - 0.3) * 300;
    g.strokeStyle = col; g.lineWidth = w * 0.6; g.shadowColor = col; g.shadowBlur = 20; g.beginPath(); g.moveTo(bx, by); g.lineTo((bx + ex) / 2 + (srnd(seed + 70 + b) - 0.5) * 80, (by + ey) / 2); g.lineTo(ex, ey); g.stroke(); }
  g.restore();
}
function pillTag(text) {
  const xr = text === 'ZAP VISION';
  g.save(); g.font = '800 34px Inter'; const w = g.measureText(text).width + 96, x = W / 2 - w / 2, y = 120;
  rr(x, y, w, 64, 32); g.fillStyle = xr ? 'rgba(20,150,210,.9)' : 'rgba(12,14,22,.62)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke();
  g.beginPath(); g.arc(x + 36, y + 32, 9, 0, 7); g.fillStyle = xr ? '#ffffff' : '#5fe0ff'; g.shadowColor = '#5fe0ff'; g.shadowBlur = 14; g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, x + 60, y + 34); g.restore();
}
function cardPt(cd) { const C = window.CAMPOS; const ry = Math.atan2(C[0] - cd.p[0], C[2] - cd.p[2]); const lx = (cd.u - 300) / 600 * 1.35 * cd.s, ly = 2.25 * (0.975 - cd.v / 1000) * cd.s;
  const x2 = lx * Math.cos(cd.roll) - ly * Math.sin(cd.roll), y2 = lx * Math.sin(cd.roll) + ly * Math.cos(cd.roll); return [cd.p[0] + x2 * Math.cos(ry), cd.p[1] + y2, cd.p[2] - x2 * Math.sin(ry)]; }
function callout(c) {
  if (!window.PROJ) return; const [ax, ay] = window.PROJ(...(c.card ? cardPt(c.card) : c.at)); const age = c.f - c.t0; const grow = clamp(age / 6), pop = back(clamp((age - 4) / 7), 2.2);
  const lx = ax + c.side * 170, ly = ay + (c.up ?? -240); const col = c.col || '#ffffff';
  g.save(); g.lineCap = 'round';
  g.beginPath(); g.arc(ax, ay, 11 * clamp(age / 3), 0, 7); g.fillStyle = col; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8; g.fill();
  g.beginPath(); g.arc(ax, ay, 22 + 6 * Math.sin(age * 0.4), 0, 7); g.lineWidth = 3; g.strokeStyle = col; g.globalAlpha = 0.7; g.stroke(); g.globalAlpha = 1;
  g.lineWidth = 5; g.strokeStyle = col; g.beginPath(); g.moveTo(ax, ay); g.lineTo(lerp(ax, lx, grow), lerp(ay, ly, grow)); g.stroke();
  if (pop > 0.01) { if (c.count && !c.fixed) c.text = Math.round(lerp(0, c.count, clamp((c.f - c.t0) / 30))).toLocaleString('en-US') + c.suffix; g.font = '800 40px Inter'; const tw = g.measureText(c.text).width + 44; g.translate(lx, ly); g.scale(pop, pop);
    let bx = c.side > 0 ? 0 : -tw; bx = Math.max(40 - lx, Math.min(W - 40 - lx - tw, bx)); rr(bx, -34, tw, 68, 14); g.fillStyle = col; g.fill(); g.shadowBlur = 0;
    g.fillStyle = '#0a0c12'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(c.text, bx + 22, 2); }
  g.restore();
}
function zapLayer(f, t, info) {
  // rewind: horizontal streaks + ◀◀
  if (info.rewind != null) { const a = Math.sin(clamp(info.rewind) * Math.PI) * 0.9 + 0.1; g.save(); g.globalAlpha = a * 0.55;
    for (let i = 0; i < 26; i++) { const y = srnd(i * 13 + f) * H, len = 200 + srnd(i * 7 + f) * 600, x = srnd(i * 3 + f * 2) * W; g.fillStyle = i % 3 ? 'rgba(255,255,255,.7)' : 'rgba(95,224,255,.9)'; g.fillRect(x, y, len, 3 + srnd(i) * 5); }
    g.globalAlpha = a; g.font = '900 150px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.shadowColor = '#5fe0ff'; g.shadowBlur = 40; g.fillText('◀◀', W / 2, 760); g.restore(); }
  // hook text (first 2.3 s)
  if (HOOK && t < 2.4) { const a = t < 2.1 ? 1 : 1 - (t - 2.1) / 0.3; g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    let hs = 70; g.font = `900 ${hs}px Inter`; while (Math.max(...HOOK.map((l) => g.measureText(l).width)) > 940) { hs -= 2; g.font = `900 ${hs}px Inter`; }
    const typed = Math.floor(clamp(t / 0.75) * HOOK.join('').length); let left = typed;
    HOOK.map((l) => { const k = Math.max(0, Math.min(l.length, left)); left -= l.length; return l.slice(0, k); }).forEach((l, i) => { if (!l) return; g.lineWidth = 13; g.strokeStyle = '#000'; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 6; g.strokeText(l, W / 2, 330 + i * hs * 1.22); g.shadowColor = 'transparent'; g.fillStyle = i ? '#ffd23f' : '#ffffff'; g.fillText(l, W / 2, 330 + i * hs * 1.22); });
    g.restore(); }
  if (info.pill) pillTag(info.pill);
  (info.callouts || []).forEach(callout);
  // zap cuts: lightning across the frame around every cut
  for (const k of info.cuts || []) { const d = f - k; if (d < -2 || d > 3) continue; const a = d <= 0 ? 0.6 + 0.2 * (d + 2) : 1 - d / 4;
    for (let b = 0; b < 3; b++) { const s = k * 31 + b * 17 + (d > 0 ? 5 : 0); bolt(srnd(s) * W, -40, srnd(s + 9) * W, H * (0.45 + srnd(s + 3) * 0.6), s, 7, '#5fe0ff', a); } }
  if (!window.NOCAP) captions(t);
}
