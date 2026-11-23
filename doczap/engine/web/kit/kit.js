// Doc Zap world kit (Nov 2026): textured materials, a prop library, motivated warm lights (torch/candle/lantern) with flicker,
// window light (moon/sun beams), glass, cross-sections, 3D arrows/rings. Built for the reference style in docs/STYLE.md.
// Usage (in an episode story.js):   export const sets = (K) => { const R = K.room({...}); K.prop.torch(R, {...}); ... return { update(W, f) {} }; };
// Everything returns THREE.Group/Mesh objects you can position; origins sit on the floor, fronts face +z.
import * as THREE from '../lib/three.module.js';
import * as P from '../paint.js';

const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const cvs = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
/** deterministic flicker noise in [-1, 1] (f = 60-fps frame) */
export const flick = (f, seed = 1) => 0.5 * Math.sin(f * 0.37 + seed * 1.7) + 0.3 * Math.sin(f * 0.91 + seed * 2.9) + 0.2 * Math.sin(f * 1.73 + seed * 4.3);

// =====================================================================================================================
// Painted textures: each returns { map, bump } canvases (512 px, tileable where it matters)
// =====================================================================================================================
const pair = (w, h, fn) => { const m = document.createElement('canvas'), b = document.createElement('canvas'); m.width = b.width = w; m.height = b.height = h; fn(m.getContext('2d'), b.getContext('2d'), w, h); return { map: m, bump: b }; };
const noiseDots = (g, w, h, r, n, col, s0 = 1, s1 = 3) => { for (let i = 0; i < n; i++) { g.fillStyle = typeof col === 'function' ? col(r) : col; g.beginPath(); g.ellipse(r() * w, r() * h, s0 + r() * s1, s0 + r() * s1 * 0.7, r() * 3, 0, 7); g.fill(); } };
export const TEX = {
  stone: ({ seed = 4, hue = 32, sat = 7, lig = 60, moss = 0 } = {}) => pair(512, 512, (g, b, W, H) => {
    const r = P.rng(seed); g.fillStyle = hsl(hue, sat, lig - 30); g.fillRect(0, 0, W, H); b.fillStyle = '#202020'; b.fillRect(0, 0, W, H);
    const rows = [0, 88, 168, 262, 344, 430, 512];
    for (let k = 0; k < rows.length - 1; k++) { let x = -r() * 80; const y0 = rows[k], hh = rows[k + 1] - y0;
      while (x < W) { const w = 90 + r() * 110, L = lig - 8 + r() * 16, hu = hue + r() * 10 - 5;
        for (const dx of [0, W]) { const X = x - dx; if (X + w < 0 || X > W) continue;
          g.fillStyle = hsl(hu, sat, L); g.beginPath(); g.roundRect(X + 4, y0 + 4, w - 8, hh - 8, 10); g.fill();
          g.fillStyle = hsl(hu, sat, L + 9, 0.7); g.beginPath(); g.roundRect(X + 8, y0 + 6, w - 18, 7, 4); g.fill();
          g.fillStyle = hsl(hu, sat + 4, L - 14, 0.6); g.beginPath(); g.roundRect(X + 8, y0 + hh - 14, w - 14, 8, 4); g.fill();
          noiseDots(g, 0, 0, r, 0, '#000'); for (let i = 0; i < 26; i++) { g.fillStyle = hsl(hu, sat, L + (r() - 0.5) * 18, 0.5); g.beginPath(); g.ellipse(X + 8 + r() * (w - 16), y0 + 8 + r() * (hh - 16), 2 + r() * 6, 1.5 + r() * 4, r() * 3, 0, 7); g.fill(); }
          if (r() < 0.35) { g.strokeStyle = hsl(hu, sat, L - 22, 0.8); g.lineWidth = 2; g.beginPath(); let cx = X + 10 + r() * (w - 20), cy = y0 + 6; g.moveTo(cx, cy); for (let s = 0; s < 4; s++) { cx += r() * 16 - 8; cy += hh / 5; g.lineTo(cx, cy); } g.stroke(); }
          const bg = b.createLinearGradient(0, y0, 0, y0 + hh); bg.addColorStop(0, '#f0f0f0'); bg.addColorStop(1, '#a8a8a8'); b.fillStyle = bg; b.beginPath(); b.roundRect(X + 4, y0 + 4, w - 8, hh - 8, 12); b.fill();
          for (let i = 0; i < 14; i++) { b.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.2})`; b.beginPath(); b.ellipse(X + 10 + r() * (w - 20), y0 + 10 + r() * (hh - 20), 2 + r() * 7, 2 + r() * 5, 0, 0, 7); b.fill(); } }
        x += w; } }
    if (moss) for (let i = 0; i < 260 * moss; i++) { g.fillStyle = hsl(90 + r() * 25, 38, 28 + r() * 14, 0.75); g.beginPath(); g.ellipse(r() * W, H * (0.55 + 0.45 * Math.pow(r(), 0.5)), 3 + r() * 9, 2 + r() * 5, 0, 0, 7); g.fill(); }
  }),
  brick: ({ seed = 7, hue = 12, sat = 48, lig = 42, mortar = '#c8bca8' } = {}) => pair(512, 512, (g, b, W, H) => {
    const r = P.rng(seed), bw = 128, bh = 52, m = 8; g.fillStyle = mortar; g.fillRect(0, 0, W, H); noiseDots(g, W, H, r, 900, 'rgba(0,0,0,.08)', 1, 2); b.fillStyle = '#383838'; b.fillRect(0, 0, W, H);
    for (let row = 0; row * bh < H; row++) for (let col = -1; col * bw < W + bw; col++) {
      const x = col * bw + (row % 2) * bw / 2, y = row * bh, burnt = r() < 0.12, L = lig + (r() - 0.5) * 12 - (burnt ? 12 : 0), hu = hue + (r() - 0.5) * 8;
      g.fillStyle = hsl(hu, sat, L); g.beginPath(); g.roundRect(x + m / 2, y + m / 2, bw - m, bh - m, 5); g.fill();
      g.fillStyle = hsl(hu, sat, L + 10, 0.6); g.fillRect(x + m, y + m / 2 + 2, bw - 2 * m, 4); g.fillStyle = hsl(hu, sat, L - 12, 0.6); g.fillRect(x + m, y + bh - m / 2 - 6, bw - 2 * m, 4);
      for (let i = 0; i < 18; i++) { g.fillStyle = hsl(hu + 5, sat - 10, L + (r() - 0.5) * 20, 0.45); g.fillRect(x + m + r() * (bw - 2 * m), y + m + r() * (bh - 2 * m), 2 + r() * 4, 2 + r() * 3); }
      if (r() < 0.2) { g.fillStyle = hsl(hu, sat - 20, L - 20, 0.5); g.beginPath(); g.ellipse(x + r() * bw, y + bh / 2, 8 + r() * 10, 5, 0, 0, 7); g.fill(); }
      b.fillStyle = `rgb(${200 + r() * 40 | 0},${200 + r() * 40 | 0},${200 + r() * 40 | 0})`; b.beginPath(); b.roundRect(x + m / 2, y + m / 2, bw - m, bh - m, 6); b.fill(); }
  }),
  planks: ({ seed = 1, hue = 28, sat = 40, lig = 40, n = 6 } = {}) => pair(512, 512, (g, b, W, H) => {
    const r = P.rng(seed), w = W / n; b.fillStyle = '#d0d0d0'; b.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) { const L = lig - 4 + r() * 10, hu = hue + r() * 6 - 3, x0 = i * w;
      g.fillStyle = hsl(hu, sat, L); g.fillRect(x0, 0, w, H);
      for (let k = 0; k < 18; k++) { g.strokeStyle = hsl(hu - 3, sat, L - 8 - r() * 9, 0.55); g.lineWidth = 1 + r() * 2.4; g.beginPath(); const x = x0 + 3 + r() * (w - 6); g.moveTo(x, 0); g.bezierCurveTo(x + r() * 8 - 4, H * 0.33, x + r() * 8 - 4, H * 0.66, x + r() * 6 - 3, H); g.stroke(); }
      g.fillStyle = hsl(hu, sat, L + 7, 0.35); g.fillRect(x0 + 4, 0, 5, H);
      if (r() < 0.6) { const ky = r() * H; g.fillStyle = hsl(hu, sat, L - 18, 0.85); g.beginPath(); g.ellipse(x0 + w / 2, ky, 6, 11, 0, 0, 7); g.fill(); g.strokeStyle = hsl(hu, sat, L - 12, 0.6); g.lineWidth = 2; g.beginPath(); g.ellipse(x0 + w / 2, ky, 11, 19, 0, 0, 7); g.stroke(); }
      const cut = r() * H; g.fillStyle = 'rgba(25,14,8,.9)'; g.fillRect(x0, cut, w, 3); b.fillStyle = '#202020'; b.fillRect(x0, cut, w, 4);
      for (const y of [cut - 16, cut + 16, 22, H - 22]) { g.fillStyle = '#26221e'; g.beginPath(); g.arc(x0 + w * 0.28, y, 3, 0, 7); g.arc(x0 + w * 0.72, y, 3, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(20,12,6,.95)'; g.fillRect(x0, 0, 3, H); b.fillStyle = '#101010'; b.fillRect(x0, 0, 4, H);
      for (let k = 0; k < 10; k++) { b.strokeStyle = `rgba(0,0,0,${0.12 + r() * 0.15})`; b.lineWidth = 2; b.beginPath(); const x = x0 + 6 + r() * (w - 12); b.moveTo(x, 0); b.lineTo(x + r() * 6 - 3, H); b.stroke(); } }
  }),
  plaster: ({ seed = 8, col = [40, 30, 78], bricks = 0.6, stains = 1 } = {}) => pair(512, 512, (g, b, W, H) => {
    const r = P.rng(seed), [h, s, l] = col; g.fillStyle = hsl(h, s, l); g.fillRect(0, 0, W, H); b.fillStyle = '#c8c8c8'; b.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { g.fillStyle = hsl(h + r() * 8 - 4, s, l + (r() - 0.5) * 10, 0.25); g.beginPath(); g.ellipse(r() * W, r() * H, 20 + r() * 60, 14 + r() * 40, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 4 * stains; i++) { const x = r() * W; const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, hsl(h, s, l - 20, 0.0)); gr.addColorStop(0.3, hsl(h - 5, s, l - 22, 0.18)); gr.addColorStop(1, hsl(h, s, l - 10, 0)); g.fillStyle = gr; g.fillRect(x, 0, 20 + r() * 40, H * (0.4 + r() * 0.6)); }
    for (let i = 0; i < 5; i++) { g.strokeStyle = hsl(h, s, l - 30, 0.7); g.lineWidth = 1.5; g.beginPath(); let x = r() * W, y = r() * H; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r() * 30 - 15; y += 10 + r() * 20; g.lineTo(x, y); } g.stroke(); }
    if (r() < bricks || bricks >= 1) { const x0 = 60 + r() * 260, y0 = 80 + r() * 260, pw = 110 + r() * 80, ph = 70 + r() * 60; g.save(); g.beginPath(); g.ellipse(x0, y0, pw / 2, ph / 2, 0.2, 0, 7); g.clip();
      g.fillStyle = '#b8aa94'; g.fillRect(0, 0, W, H); for (let yy = y0 - ph; yy < y0 + ph; yy += 24) for (let xx = x0 - pw - ((yy / 24) % 2) * 26; xx < x0 + pw; xx += 52) { g.fillStyle = hsl(12 + r() * 8, 45, 40 + r() * 10); g.fillRect(xx + 3, yy + 3, 46, 18); } g.restore();
      g.strokeStyle = hsl(h, s, l - 18); g.lineWidth = 4; g.beginPath(); g.ellipse(x0, y0, pw / 2, ph / 2, 0.2, 0, 7); g.stroke(); b.fillStyle = '#606060'; b.beginPath(); b.ellipse(x0, y0, pw / 2, ph / 2, 0.2, 0, 7); b.fill(); }
    for (let i = 0; i < 1600; i++) { b.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},.08)`; b.fillRect(r() * W, r() * H, 3, 3); }
  }),
  dirt: ({ seed = 9, hue = 30, sat = 30, lig = 36 } = {}) => pair(512, 512, (g, b, W, H) => {
    const r = P.rng(seed); g.fillStyle = hsl(hue, sat, lig); g.fillRect(0, 0, W, H); b.fillStyle = '#909090'; b.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { g.fillStyle = hsl(hue + r() * 10 - 5, sat, lig + (r() - 0.5) * 14, 0.35); g.beginPath(); g.ellipse(r() * W, r() * H, 15 + r() * 45, 10 + r() * 30, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H, s = 2 + r() * 7, L = lig + 10 + r() * 20; g.fillStyle = hsl(hue + 5, sat - 12, L); g.beginPath(); g.ellipse(x, y, s, s * 0.75, r() * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + s * 0.3, y + s * 0.4, s * 0.8, s * 0.4, 0, 0, 7); g.fill();
      b.fillStyle = '#e8e8e8'; b.beginPath(); b.ellipse(x, y, s, s * 0.75, 0, 0, 7); b.fill(); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = hsl(48, 50, 62, 0.7); g.lineWidth = 1.6; g.beginPath(); const x = r() * W, y = r() * H, a = r() * 6; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16); g.stroke(); }
  }),
  snow: ({ seed = 10 } = {}) => pair(512, 512, (g, b, W, H) => {
    const r = P.rng(seed); g.fillStyle = '#eef3fa'; g.fillRect(0, 0, W, H); b.fillStyle = '#c0c0c0'; b.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, rr = 30 + r() * 70; const gr = g.createRadialGradient(x, y - rr * 0.3, 2, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(170,195,230,.0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
      const bg = b.createRadialGradient(x, y, 2, x, y, rr); bg.addColorStop(0, 'rgba(255,255,255,.6)'); bg.addColorStop(1, 'rgba(255,255,255,0)'); b.fillStyle = bg; b.beginPath(); b.arc(x, y, rr, 0, 7); b.fill(); }
    for (let i = 0; i < 50; i++) { g.fillStyle = 'rgba(150,180,225,.25)'; g.beginPath(); g.ellipse(r() * W, r() * H, 20 + r() * 40, 5 + r() * 8, r() * 0.4 - 0.2, 0, 7); g.fill(); }
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(255,255,255,1)'; g.fillRect(r() * W, r() * H, 1.6, 1.6); }
  }),
  cobble: ({ seed = 11, hue = 30, sat = 8, lig = 52 } = {}) => pair(512, 512, (g, b, W, H) => {
    const r = P.rng(seed); g.fillStyle = hsl(hue, sat, lig - 30); g.fillRect(0, 0, W, H); b.fillStyle = '#202020'; b.fillRect(0, 0, W, H);
    for (let row = 0; row < 11; row++) for (let col = 0; col < 9; col++) { const x = col * 58 + (row % 2) * 29 + r() * 8, y = row * 48 + r() * 6, L = lig + (r() - 0.5) * 16, w = 24 + r() * 5, h = 19 + r() * 4;
      for (const [dx, dy] of [[0, 0], [-W, 0], [0, -H], [W, 0], [0, H]]) { g.fillStyle = hsl(hue + r() * 10, sat, L); g.beginPath(); g.ellipse(x + dx, y + dy, w, h, r() * 0.5, 0, 7); g.fill(); g.fillStyle = hsl(hue, sat, L + 12, 0.6); g.beginPath(); g.ellipse(x + dx - 5, y + dy - 6, w * 0.5, h * 0.3, 0, 0, 7); g.fill();
        const bg = b.createRadialGradient(x + dx, y + dy, 2, x + dx, y + dy, w); bg.addColorStop(0, '#fff'); bg.addColorStop(1, '#707070'); b.fillStyle = bg; b.beginPath(); b.ellipse(x + dx, y + dy, w, h, 0, 0, 7); b.fill(); } }
  }),
  woodGrain: ({ seed = 12, hue = 26, sat = 42, lig = 38, staves = 0 } = {}) => pair(256, 256, (g, b, W, H) => {
    const r = P.rng(seed); g.fillStyle = hsl(hue, sat, lig); g.fillRect(0, 0, W, H); b.fillStyle = '#c0c0c0'; b.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) { g.strokeStyle = hsl(hue - 3, sat, lig - 6 - r() * 10, 0.5); g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * W; g.moveTo(x, 0); g.bezierCurveTo(x + 6, H / 3, x - 6, 2 * H / 3, x + r() * 6 - 3, H); g.stroke(); }
    if (staves) for (let i = 0; i < staves; i++) { const x = i * W / staves; g.fillStyle = 'rgba(20,10,4,.8)'; g.fillRect(x, 0, 2.5, H); g.fillStyle = hsl(hue, sat, lig + 8, 0.3); g.fillRect(x + 3, 0, 4, H); b.fillStyle = '#303030'; b.fillRect(x, 0, 3, H); }
  }),
};
/** patterned rug canvas: persian | kilim | stripes | checker | round ; cols = [field, border, accent, light] */
export const rugCanvas = ({ pattern = 'persian', cols = ['#9a2530', '#1f3a6a', '#e0b050', '#f0e2c0'], seed = 3, w = 512, h = 768, fringe = true } = {}) => cvs(w, h, (g, W, H) => {
  const r = P.rng(seed), fr = fringe ? 28 : 0, [F, B, A, L] = cols;
  if (fringe) { g.strokeStyle = L; g.lineWidth = 3; for (let x = 10; x < W - 10; x += 8) for (const [y0, y1] of [[0, fr + 4], [H - fr - 4, H]]) { g.beginPath(); g.moveTo(x, y0 + (y0 ? 0 : r() * 6)); g.lineTo(x + r() * 3 - 1.5, y1 - (y0 ? r() * 6 : 0)); g.stroke(); } }
  const x0 = 0, y0 = fr, X1 = W, Y1 = H - fr;
  g.fillStyle = B; g.fillRect(x0, y0, X1 - x0, Y1 - y0);
  const bd = 44; g.fillStyle = F; g.fillRect(x0 + bd, y0 + bd, X1 - x0 - 2 * bd, Y1 - y0 - 2 * bd);
  g.strokeStyle = A; g.lineWidth = 6; g.strokeRect(x0 + 12, y0 + 12, X1 - x0 - 24, Y1 - y0 - 24); g.strokeRect(x0 + bd - 6, y0 + bd - 6, X1 - x0 - 2 * bd + 12, Y1 - y0 - 2 * bd + 12);
  // border motif: little diamonds
  g.fillStyle = A; for (let x = x0 + 30; x < X1 - 20; x += 34) for (const y of [y0 + 28, Y1 - 28]) { g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 7, y); g.lineTo(x, y + 7); g.lineTo(x - 7, y); g.fill(); }
  for (let y = y0 + 60; y < Y1 - 50; y += 34) for (const x of [x0 + 28, X1 - 28]) { g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 7, y); g.lineTo(x, y + 7); g.lineTo(x - 7, y); g.fill(); }
  const cx = W / 2, cy = H / 2, fw = X1 - x0 - 2 * bd, fh = Y1 - y0 - 2 * bd;
  g.save(); g.beginPath(); g.rect(x0 + bd, y0 + bd, fw, fh); g.clip();
  if (pattern === 'persian') { g.strokeStyle = 'rgba(255,240,200,.18)'; g.lineWidth = 3; for (let k = -12; k < 12; k++) { g.beginPath(); g.moveTo(cx + k * 40 - fh, y0); g.lineTo(cx + k * 40 + fh, Y1); g.stroke(); g.beginPath(); g.moveTo(cx + k * 40 + fh, y0); g.lineTo(cx + k * 40 - fh, Y1); g.stroke(); }
    for (const [rx, ry, c] of [[150, 210, B], [118, 170, A], [88, 130, L], [56, 86, F], [26, 40, A]]) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, k = i % 2 ? 0.82 : 1; g.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); } g.closePath(); g.fill(); }
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.fillStyle = B; g.beginPath(); g.ellipse(cx + sx * fw / 2, cy + sy * fh / 2, 90, 110, 0, 0, 7); g.fill(); g.fillStyle = A; g.beginPath(); g.ellipse(cx + sx * fw / 2, cy + sy * fh / 2, 60, 74, 0, 0, 7); g.fill(); } }
  else if (pattern === 'kilim') { for (let y = y0 + bd, j = 0; y < Y1; y += 92, j++) for (let x = x0 + bd + (j % 2) * 50, i = 0; x < X1; x += 100, i++) { const c = [A, L, B][(i + j) % 3]; g.fillStyle = c; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y + 46); g.lineTo(x, y + 92); g.lineTo(x - 40, y + 46); g.fill(); g.fillStyle = F; g.beginPath(); g.moveTo(x, y + 26); g.lineTo(x + 18, y + 46); g.lineTo(x, y + 66); g.lineTo(x - 18, y + 46); g.fill(); } }
  else if (pattern === 'stripes') { const cs = [A, L, B, F]; for (let y = y0, i = 0; y < Y1; y += 30, i++) { g.fillStyle = cs[i % 4]; g.fillRect(x0, y, W, 18 + (i % 3) * 6); } }
  else if (pattern === 'checker') { for (let y = y0 + bd, j = 0; y < Y1; y += 56, j++) for (let x = x0 + bd, i = 0; x < X1; x += 56, i++) if ((i + j) % 2) { g.fillStyle = A; g.fillRect(x, y, 56, 56); } }
  g.restore();
  // wear & weave noise
  for (let i = 0; i < 3500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},.06)`; g.fillRect(r() * W, fr + r() * (H - 2 * fr), 2, 2); }
});
/** sky panes for windows */
export const skyCanvas = (kind = 'moon', w = 256, h = 384) => cvs(w, h, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H);
  if (kind === 'moon') { gr.addColorStop(0, '#0a1438'); gr.addColorStop(1, '#2c4486'); }
  else if (kind === 'sunset') { gr.addColorStop(0, '#5a3a8a'); gr.addColorStop(0.55, '#ff8a5a'); gr.addColorStop(1, '#ffd08a'); }
  else { gr.addColorStop(0, '#4a9aff'); gr.addColorStop(1, '#d8f0ff'); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H); const r = P.rng(5);
  if (kind === 'moon') { for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,240,${0.4 + r() * 0.6})`; g.fillRect(r() * W, r() * H * 0.8, 1.5 + r(), 1.5 + r()); }
    const mx = W * 0.62, my = H * 0.28, mr = W * 0.16, gl = g.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3); gl.addColorStop(0, 'rgba(220,230,255,.55)'); gl.addColorStop(1, 'rgba(220,230,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill(); g.fillStyle = 'rgba(200,190,160,.5)'; for (const [dx, dy, s] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.4, 0.12]]) { g.beginPath(); g.arc(mx + dx * mr, my + dy * mr, s * mr, 0, 7); g.fill(); } }
  else { g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 4; i++) { const x = r() * W, y = H * (0.2 + r() * 0.5); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + k * 16 - 30, y + Math.sin(k * 2) * 6, 14 + r() * 10, 0, 7); g.fill(); } } }
  // distant silhouette (hills/rooftops)
  g.fillStyle = kind === 'moon' ? '#0a1028' : kind === 'sunset' ? '#5a2a4a' : '#6a9a6a'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 16) g.lineTo(x, H * 0.82 - Math.sin(x * 0.05) * 14 - (x % 48 < 20 ? 18 : 0)); g.lineTo(W, H); g.fill();
});
const flameCanvas = cvs(128, 256, (g, W, H) => {
  const outer = g.createRadialGradient(W / 2, H * 0.72, 4, W / 2, H * 0.62, H * 0.5); outer.addColorStop(0, 'rgba(255,250,220,1)'); outer.addColorStop(0.25, 'rgba(255,214,110,1)'); outer.addColorStop(0.55, 'rgba(255,128,30,.95)'); outer.addColorStop(0.85, 'rgba(220,50,10,.4)'); outer.addColorStop(1, 'rgba(160,20,0,0)');
  g.fillStyle = outer; g.beginPath(); g.moveTo(W / 2, 6); g.bezierCurveTo(W * 0.78, H * 0.38, W * 0.98, H * 0.66, W * 0.82, H * 0.86); g.quadraticCurveTo(W / 2, H * 1.0, W * 0.18, H * 0.86); g.bezierCurveTo(W * 0.02, H * 0.66, W * 0.22, H * 0.38, W / 2, 6); g.fill();
  const core = g.createRadialGradient(W / 2, H * 0.78, 2, W / 2, H * 0.74, H * 0.2); core.addColorStop(0, 'rgba(255,255,255,1)'); core.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = core; g.beginPath(); g.ellipse(W / 2, H * 0.74, W * 0.2, H * 0.2, 0, 0, 7); g.fill();
});
const haloCanvas = cvs(128, 128, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.25, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
const beamCanvas = cvs(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const sd = g.createLinearGradient(0, 0, 64, 0); sd.addColorStop(0, 'rgba(0,0,0,1)'); sd.addColorStop(0.3, 'rgba(0,0,0,0)'); sd.addColorStop(0.7, 'rgba(0,0,0,0)'); sd.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = sd; g.fillRect(0, 0, 64, 256); });
const hatchCanvas = (col = '#e8d8b8', line = 'rgba(120,40,30,.55)') => cvs(128, 128, (g, W, H) => { g.fillStyle = col; g.fillRect(0, 0, W, H); g.strokeStyle = line; g.lineWidth = 5; for (let k = -W; k < W * 2; k += 22) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.stroke(); } });

// =====================================================================================================================
// the kit
// =====================================================================================================================
export function makeKit(ctx) {
  const { scene, grad } = ctx;
  const toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
  const FL = [], LT = [], BB = [], UPD = [];
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const grp = (parent = scene, x = 0, y = 0, z = 0, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; };
  const noInk = (m) => { m.userData.ndSkip = true; return m; };
  /** box with world-scaled UVs: one texture tile per `t` metres on every face */
  const tbox = (w, h, d, t = 2) => { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); } return g; };
  const tplane = (w, h, t = 2) => { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / t, uv.getY(i) * h / t); return g; };
  // ---------------- materials ----------------
  const cache = new Map();
  const texPair = (name, o = {}) => { const k = name + JSON.stringify(o); if (!cache.has(k)) { const pr = TEX[name](o); cache.set(k, { map: P.tex(pr.map), bump: P.tex(pr.bump) }); } return cache.get(k); };
  /** K.mat(name, opts): textured toon material. names: stone brick planks plaster dirt snow cobble woodGrain. opts: seed, tint, bump, + painter options */
  const mat = (name, o = {}) => { const { tint = '#ffffff', bump = 0.6, ...po } = o; const t = texPair(name, po);
    const m = toon({ map: t.map, color: tint }); m.bumpMap = t.bump; m.bumpScale = bump * 2.2; m.userData.kit = name; return m; };
  const M = { iron: toon({ color: '#4a4a50' }), ironL: toon({ color: '#6a6c72' }), brass: toon({ color: '#c89a3a' }), wax: toon({ color: '#f4ead2' }), cloth: toon({ color: '#c8b088' }), rope: toon({ color: '#b89a6a' }),
    wood: mat('woodGrain'), woodD: mat('woodGrain', { lig: 26, seed: 13 }), stave: mat('woodGrain', { staves: 6, seed: 14 }), plank: mat('planks', { seed: 5 }), timber: toon({ color: '#5a3a22' }) };
  const materials = { stone: (o) => mat('stone', o), brick: (o) => mat('brick', o), planks: (o) => mat('planks', o), plaster: (o) => mat('plaster', o), dirt: (o) => mat('dirt', o), snow: (o) => mat('snow', o), cobble: (o) => mat('cobble', o), wood: (o) => mat('woodGrain', o),
    rug: (o = {}) => { const t = P.tex(rugCanvas(o)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return toon({ map: t, transparent: true, alphaTest: 0.35 }); } };
  // ---------------- flames & lights ----------------
  const flameTex = P.tex(flameCanvas), haloTex = P.tex(haloCanvas); flameTex.wrapS = flameTex.wrapT = haloTex.wrapS = haloTex.wrapT = THREE.ClampToEdgeWrapping;
  /** a camera-facing flame (HDR so it blooms) + soft halo; size in metres */
  const flame = (parent, x, y, z, size = 0.12, o = {}) => {
    const g = grp(parent, x, y, z), fm = new THREE.MeshBasicMaterial({ map: flameTex, transparent: true, depthWrite: false, fog: false }); fm.color.setRGB(2.4, 2.1, 1.7);
    const f = noInk(add(new THREE.PlaneGeometry(size * 0.55, size * 1.1), fm, 0, size * 0.42, 0, g, false)); f.renderOrder = 8;
    let h = null; if (o.halo !== false) { const hm = new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }); hm.color.set(o.haloCol || '#ff9a40').multiplyScalar(o.haloK ?? 0.55);
      h = noInk(add(new THREE.PlaneGeometry(size * 5.5, size * 5.5), hm, 0, size * 0.4, 0, g, false)); h.renderOrder = 9; }
    const rec = { g, f, h, size, seed: o.seed ?? FL.length * 1.37 + 0.5, on: true }; FL.push(rec); return rec;
  };
  /** warm point light with flicker; shadow: true for the 1-2 key lights of a shot (costly) */
  const warmLight = (parent, x, y, z, o = {}) => {
    const l = new THREE.PointLight(o.col || '#ff9440', o.i ?? 2.4, o.dist ?? 7, o.decay ?? 1.5); l.position.set(x, y, z); parent.add(l);
    if (o.shadow) { l.castShadow = true; l.shadow.mapSize.set(o.map || 512, o.map || 512); l.shadow.bias = -0.003; l.shadow.normalBias = 0.03; l.shadow.radius = 4; l.shadow.camera.near = 0.08; l.shadow.camera.far = o.dist ?? 7; }
    const rec = { l, base: l.intensity, k: o.flicker ?? 0.16, seed: o.seed ?? LT.length * 2.11 + 0.3, p0: l.position.clone() }; LT.push(rec); return rec;
  };
  // ---------------- billboards (camera-facing helpers) ----------------
  const billboard = (m) => { BB.push(m); return m; };
  const beamTex = P.tex(beamCanvas); beamTex.wrapS = beamTex.wrapT = THREE.ClampToEdgeWrapping;
  /** a volumetric light shaft (sunbeam/moonbeam/torch haze): additive cone from `from` to `to` (world or parent-local) */
  const beam = (parent, from, to, r0 = 0.3, r1 = 0.8, col = '#fff2d0', op = 0.35) => {
    const A = new THREE.Vector3(...from), B = new THREE.Vector3(...to), L = A.distanceTo(B);
    const geo = new THREE.CylinderGeometry(r0, r1, L, 24, 1, true); geo.translate(0, -L / 2, 0);
    const m = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: op, fog: false }); m.color.set(col);
    const mesh = noInk(add(geo, m, A.x, A.y, A.z, parent, false)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), B.clone().sub(A).normalize()); mesh.renderOrder = 7; mesh.userData.beam = true; return mesh;
  };

  // =====================================================================================================================
  // PROPS
  // =====================================================================================================================
  const prop = {};
  /** barrel; hollow:true makes a closed thick-walled shell (open top) so K.section() shows a cut wall and the contents */
  prop.barrel = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, r = 0.32, h = 0.86, y = 0, hollow = false, wall = 0.035 } = o, lid = o.lid ?? !hollow, g = grp(parent, x, y, z, ry);
    const R = (t) => r * (0.84 + 0.16 * Math.sin(Math.PI * t)), pts = [];
    if (hollow) { pts.push(new THREE.Vector2(0.0001, 0)); for (let i = 0; i <= 16; i++) pts.push(new THREE.Vector2(R(i / 16), i / 16 * h)); const tb = 0.06;
      for (let i = 16; i >= 0; i--) { const t = i / 16, yy = Math.max(tb, t * h); pts.push(new THREE.Vector2(R(t) - wall, yy)); if (yy === tb) break; } pts.push(new THREE.Vector2(0.0001, tb)); }
    else for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector2(R(t), t * h)); }
    const body = add(new THREE.LatheGeometry(pts, 32), M.stave, 0, 0, 0, g); body.material = hollow ? M.stave.clone() : M.stave; if (hollow) body.material.side = THREE.DoubleSide; g.userData.body = body;
    for (const t of [0.1, 0.32, 0.68, 0.9]) { const rr = r * (0.84 + 0.16 * Math.sin(Math.PI * t)) + 0.008; const hp = add(new THREE.TorusGeometry(rr, 0.014, 6, 32), M.iron, 0, t * h, 0, g); hp.rotation.x = Math.PI / 2; }
    if (lid) { const l = add(new THREE.CircleGeometry(r * 0.86, 28), M.plank, 0, h - 0.02, 0, g); l.rotation.x = -Math.PI / 2; }
    return g; };
  prop.crate = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, s = 0.6, y = 0 } = o, g = grp(parent, x, y, z, ry);
    add(tbox(s, s, s, 0.6), M.plank, 0, s / 2, 0, g); const e = 0.06, fr = M.woodD;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(e, s + 0.01, e), fr, sx * (s / 2 - e / 2 + 0.006), s / 2, sz * (s / 2 - e / 2 + 0.006), g);
    for (const yy of [e / 2, s - e / 2]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(s + 0.012, e, e), fr, 0, yy, sz * (s / 2 - e / 2 + 0.008), g);
    for (const sz of [-1, 1]) { const d = add(new THREE.BoxGeometry(s * 1.25, e * 0.9, e * 0.6), fr, 0, s / 2, sz * (s / 2 + 0.01), g); d.rotation.z = Math.PI / 4 * sz; }
    return g; };
  prop.table = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, w = 1.6, d = 0.9, h = 0.78 } = o, g = grp(parent, x, 0, z, ry);
    add(tbox(w, 0.07, d, 0.9), M.plank, 0, h - 0.035, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.08, h - 0.07, 0.08), M.woodD, sx * (w / 2 - 0.09), (h - 0.07) / 2, sz * (d / 2 - 0.09), g);
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(w - 0.2, 0.06, 0.04), M.woodD, 0, 0.18, sz * (d / 2 - 0.09), g); g.userData.top = h; return g; };
  prop.chair = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, h = 0.46, back = 0.5 } = o, g = grp(parent, x, 0, z, ry), s = 0.44;
    add(tbox(s, 0.05, s, 0.6), M.plank, 0, h, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.045, h, 0.045), M.woodD, sx * (s / 2 - 0.03), h / 2, sz * (s / 2 - 0.03), g);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.045, back, 0.045), M.woodD, sx * (s / 2 - 0.03), h + back / 2, -s / 2 + 0.03, g);
    for (const yy of [0.18, 0.36]) add(new THREE.BoxGeometry(s - 0.04, 0.07, 0.03), M.wood, 0, h + yy, -s / 2 + 0.03, g); return g; };
  prop.bench = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, w = 1.6 } = o, g = grp(parent, x, 0, z, ry); add(tbox(w, 0.07, 0.36, 0.8), M.plank, 0, 0.44, 0, g); for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.07, 0.44, 0.3), M.woodD, sx * (w / 2 - 0.12), 0.22, 0, g); return g; };
  const BOOKC = ['#a83232', '#2f5aa8', '#3a8a5a', '#c89a3a', '#6a3a8a', '#2a6a7a', '#a8603a', '#3a3a5a'];
  prop.shelf = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, w = 1.4, h = 1.9, d = 0.34, rows = 4, seed = 3, items = true } = o, g = grp(parent, x, 0, z, ry), r = P.rng(seed);
    for (const sx of [-1, 1]) add(tbox(0.05, h, d, 0.8), M.plank, sx * (w / 2 - 0.025), h / 2, 0, g); add(tbox(w, h, 0.03, 0.8), M.woodD, 0, h / 2, -d / 2 + 0.015, g);
    for (let i = 0; i <= rows; i++) { const yy = 0.06 + i * (h - 0.1) / rows; add(tbox(w - 0.06, 0.04, d, 0.8), M.plank, 0, yy, 0, g);
      if (!items || i === rows) continue; let xx = -w / 2 + 0.08; const top = (h - 0.1) / rows - 0.06;
      while (xx < w / 2 - 0.12) { const k = r();
        if (k < 0.55) { const bw = 0.04 + r() * 0.04, bh = top * (0.6 + r() * 0.35); const b = add(new THREE.BoxGeometry(bw, bh, d * 0.75), toon({ color: BOOKC[(r() * 8) | 0] }), xx + bw / 2, yy + 0.02 + bh / 2, 0.02, g); if (r() < 0.15) { b.rotation.z = 0.25; b.position.x += 0.03; } xx += bw + 0.005; }
        else if (k < 0.8) { const jr = 0.05 + r() * 0.03, jh = 0.1 + r() * 0.1; add(new THREE.CylinderGeometry(jr, jr * 1.05, jh, 14), toon({ color: ['#6a8a5a', '#a87a4a', '#c8c0a8', '#5a6a8a'][(r() * 4) | 0] }), xx + jr, yy + 0.02 + jh / 2, 0.02, g); add(new THREE.CylinderGeometry(jr * 0.8, jr * 0.8, 0.02, 12), M.timber, xx + jr, yy + 0.03 + jh, 0.02, g, false); xx += jr * 2 + 0.03; }
        else if (k < 0.92) { const sc = add(new THREE.CylinderGeometry(0.035, 0.035, d * 0.7, 10), toon({ color: '#ecdcb4' }), xx + 0.04, yy + 0.055, 0.02, g); sc.rotation.x = Math.PI / 2; xx += 0.09; }
        else xx += 0.08 + r() * 0.1; } }
    return g; };
  /** door: style 'plank' with iron straps + ring; open = 0..1 swings inward around the left hinge */
  prop.door = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, w = 1.0, h = 2.1, open = 0, frame = true, arch = true } = o, g = grp(parent, x, 0, z, ry);
    if (frame) { for (const sx of [-1, 1]) add(tbox(0.14, h + 0.1, 0.2, 0.8), M.woodD, sx * (w / 2 + 0.07), (h + 0.1) / 2, 0, g); add(tbox(w + 0.28, 0.16, 0.2, 0.8), M.woodD, 0, h + 0.08, 0, g); }
    const hinge = grp(g, -w / 2, 0, 0); hinge.rotation.y = -open * 1.6; const leaf = add(tbox(w, h, 0.06, 0.7), M.plank, w / 2, h / 2, 0, hinge);
    for (const yy of [0.35, h - 0.35]) add(new THREE.BoxGeometry(w * 0.8, 0.06, 0.02), M.iron, w * 0.42, yy, 0.04, hinge);
    const ring = add(new THREE.TorusGeometry(0.06, 0.012, 6, 16), M.iron, w * 0.82, h * 0.48, 0.05, hinge); add(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), M.iron, w * 0.82, h * 0.54, 0.04, hinge).rotation.x = Math.PI / 2;
    if (arch) { const a = add(new THREE.CylinderGeometry(w / 2 + 0.14, w / 2 + 0.14, 0.2, 20, 1, false, -Math.PI / 2, Math.PI), M.woodD, 0, h + 0.16, 0, g); a.rotation.x = Math.PI / 2; a.scale.y = 1; a.rotation.z = 0; a.scale.set(1, 1, 0.55); }
    g.userData.hinge = hinge; g.userData.leaf = leaf; return g; };
  /** window with a sky pane (moon | sun | sunset), mullions, sill, optional light beam + matching light pouring into the room (+z) */
  prop.window = (parent, o = {}) => { const { x = 0, y = 1.4, z = 0, ry = 0, w = 0.9, h = 1.3, kind = 'moon', beam: bm = true, light = true, beamTo = null, depth = 0.3 } = o, g = grp(parent, x, 0, z, ry);
    const ht = h + w / 2, sc = skyCanvas(kind, 256, Math.round(256 * ht / w)), arch = cvs(sc.width, sc.height, (gg, W2, H2) => { gg.beginPath(); gg.moveTo(0, H2); gg.lineTo(0, W2 / 2); gg.arc(W2 / 2, W2 / 2, W2 / 2, Math.PI, 0); gg.lineTo(W2, H2); gg.closePath(); gg.clip(); gg.drawImage(sc, 0, 0); });
    const sky = new THREE.MeshBasicMaterial({ map: P.tex(arch), fog: false, transparent: true, alphaTest: 0.5 }); sky.color.setScalar(kind === 'moon' ? 1.25 : 1.6);
    const pane = noInk(add(new THREE.PlaneGeometry(w, ht), sky, 0, y + w / 4, -depth / 2, g, false));
    const fr = M.woodD; for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.06, h, 0.06), fr, sx * w / 2, y, -depth / 2 + 0.03, g); add(new THREE.BoxGeometry(0.04, h + w / 2, 0.05), fr, 0, y + w / 4, -depth / 2 + 0.03, g); add(new THREE.BoxGeometry(w, 0.04, 0.05), fr, 0, y + 0.1, -depth / 2 + 0.03, g);
    add(new THREE.BoxGeometry(w + 0.2, 0.08, depth + 0.12), mat('stone', { seed: 21 }), 0, y - h / 2 - 0.04, 0.02, g);
    for (const sx of [-1, 1]) add(tbox(0.12, h + w / 2, depth, 1), mat('stone', { seed: 22 }), sx * (w / 2 + 0.06), y + w / 4, 0, g);
    const col = kind === 'moon' ? '#9ab8ff' : kind === 'sunset' ? '#ffb070' : '#fff0c8';
    const to = beamTo ? new THREE.Vector3(...beamTo) : new THREE.Vector3(0, 0, 2.4);
    if (bm) beam(g, [0, y + 0.1, -depth / 2], [to.x, to.y, to.z], w * 0.42, w * 1.05, col, o.beamOp ?? (kind === 'moon' ? 0.14 : 0.22));
    let sl = null; if (light) { sl = new THREE.SpotLight(col, o.i ?? (kind === 'moon' ? 6 : 10), 9, 0.55, 0.7, 1.2); sl.position.set(0, y + 0.2, -depth); sl.target.position.copy(to); g.add(sl); g.add(sl.target);
      sl.castShadow = !!o.shadow; if (o.shadow) { sl.shadow.mapSize.set(1024, 1024); sl.shadow.bias = -0.002; sl.shadow.radius = 3; }
      const pool = noInk(add(new THREE.PlaneGeometry(w * 1.4, h * 1.1), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: kind === 'moon' ? 0.22 : 0.35, color: col, fog: false }), to.x, 0.012, to.z, g, false)); pool.rotation.x = -Math.PI / 2; }
    g.userData.light = sl; g.userData.pane = pane; return g; };
  prop.stairs = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, n = 8, w = 1.1, rise = 0.2, run = 0.28, m = M.plank, side = 'stone' } = o, g = grp(parent, x, 0, z, ry);
    for (let i = 0; i < n; i++) { add(tbox(w, rise, run + 0.02, 0.9), m, 0, rise * (i + 0.5), -run * (i + 0.5), g); add(new THREE.BoxGeometry(w + 0.01, 0.025, 0.04), M.woodD, 0, rise * (i + 1) - 0.012, -run * i - 0.01, g); }
    if (side) { const sm = mat(side, { seed: 31 }); const shp = new THREE.Shape(); shp.moveTo(0, 0); for (let i = 0; i < n; i++) { shp.lineTo(-run * i, rise * (i + 1)); shp.lineTo(-run * (i + 1), rise * (i + 1)); } shp.lineTo(-run * n, 0); shp.closePath();
      for (const sx of [-1, 1]) { const sg = new THREE.ExtrudeGeometry(shp, { depth: 0.12, bevelEnabled: false }); const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * 0.5); const s = add(sg, sm, sx * (w / 2 + 0.06), 0, 0, g); s.rotation.y = -Math.PI / 2; s.position.x += sx > 0 ? 0.06 : 0.06; } }
    return g; };
  prop.tent = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, w = 2.2, d = 2.6, h = 1.9, col = '#e8dcc0', col2 = '#b8323a', open = 0.6 } = o, g = grp(parent, x, 0, z, ry);
    const c = cvs(256, 256, (gg, W, H) => { gg.fillStyle = col; gg.fillRect(0, 0, W, H); gg.fillStyle = col2; for (let i = 0; i < 8; i += 2) gg.fillRect(i * W / 8, 0, W / 8, H); gg.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 300; i++) gg.fillRect(Math.random() * W, Math.random() * H, 2, 2); });
    const cm = toon({ map: P.tex(c, 2, 1), side: THREE.DoubleSide });
    for (const sx of [-1, 1]) { const L = Math.hypot(w / 2, h), r = add(new THREE.PlaneGeometry(L, d), cm, sx * w / 4, h / 2, 0, g);
      const X = new THREE.Vector3(sx * w / 2, -h, 0).normalize(), Y = new THREE.Vector3(0, 0, 1), Z = new THREE.Vector3().crossVectors(X, Y); r.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); }
    const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, h); tri.closePath(); add(new THREE.ShapeGeometry(tri), cm, 0, 0, -d / 2, g);
    for (const sx of [-1, 1]) { const flap = new THREE.Shape(); flap.moveTo(0, 0); flap.lineTo(sx * w / 2 * (1 - open * 0.7), 0); flap.lineTo(0, h); flap.closePath(); add(new THREE.ShapeGeometry(flap), cm, 0, 0, d / 2, g); }
    const dark = toon({ color: '#2a2018', side: THREE.DoubleSide }); const inT = new THREE.Shape(); inT.moveTo(-w / 2 * open * 0.7, 0); inT.lineTo(w / 2 * open * 0.7, 0); inT.lineTo(0, h * 0.85); inT.closePath(); add(new THREE.ShapeGeometry(inT), dark, 0, 0, d / 2 - 0.3, g);
    add(new THREE.CylinderGeometry(0.03, 0.03, h + 0.3, 6), M.timber, 0, (h + 0.3) / 2, d / 2 + 0.02, g); add(new THREE.CylinderGeometry(0.03, 0.03, d, 6), M.timber, 0, h, 0, g).rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) { const rp = add(new THREE.CylinderGeometry(0.008, 0.008, 1.6, 4), M.rope, sx * (w / 2 + 0.5), h * 0.45, d / 2 + 0.3, g, false); rp.rotation.z = sx * 0.95; }
    return g; };
  /** sign: painted text board, hanging from a bracket (hang) or standing on a post */
  prop.sign = (parent, o = {}) => { const { x = 0, y = 2.0, z = 0, ry = 0, text = 'INN', w = 0.9, h = 0.45, hang = true, bg = '#6a4428', fg = '#f4e2b0', font = '900 120px Georgia, serif' } = o, g = grp(parent, x, 0, z, ry);
    const c = cvs(512, Math.round(512 * h / w), (gg, W, H) => { const pr = TEX.planks({ seed: 41, n: 4, lig: 34 }).map; gg.save(); gg.translate(W, 0); gg.rotate(Math.PI / 2); gg.drawImage(pr, 0, 0, H, W); gg.restore(); gg.fillStyle = 'rgba(0,0,0,.15)'; gg.fillRect(0, 0, W, H);
      gg.strokeStyle = '#2a1a0e'; gg.lineWidth = 14; gg.strokeRect(7, 7, W - 14, H - 14); gg.font = font; let s = 1; while (gg.measureText(text).width > W * 0.82 && s > 0.3) { s -= 0.05; gg.font = font.replace(/(\d+)px/, (m, n) => `${Math.round(n * s)}px`); }
      gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.lineWidth = 10; gg.strokeStyle = '#2a1a0e'; gg.strokeText(text, W / 2, H / 2 + 6); gg.fillStyle = fg; gg.fillText(text, W / 2, H / 2 + 6); });
    const bm = toon({ map: P.tex(c) }); const board = add(new THREE.BoxGeometry(w, h, 0.05), [M.woodD, M.woodD, M.woodD, M.woodD, bm, bm], 0, y, 0, g);
    if (hang) { add(new THREE.BoxGeometry(w + 0.35, 0.05, 0.05), M.iron, 0.12, y + h / 2 + 0.22, 0, g); for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4), M.iron, sx * w * 0.38, y + h / 2 + 0.11, 0, g, false); }
    else add(new THREE.BoxGeometry(0.08, y, 0.08), M.woodD, 0, y / 2 - h / 2, -0.05, g);
    return g; };
  /** torch: wall bracket (wall:true) or standing; flame + flickering warm light that lights nearby surfaces */
  prop.torch = (parent, o = {}) => { const { x = 0, y = 1.75, z = 0, ry = 0, wall = true, i = 2.6, dist = 7, shadow = false, col = '#ffa256', size = 0.2 } = o, g = grp(parent, x, 0, z, ry);
    const stick = add(new THREE.CylinderGeometry(0.03, 0.022, 0.5, 8), M.woodD, 0, y, wall ? 0.16 : 0, g); stick.rotation.x = wall ? 0.32 : 0;
    const top = new THREE.Vector3(0, y + 0.24, wall ? 0.24 : 0);
    add(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 10), M.cloth, top.x, top.y - 0.04, top.z, g).rotation.x = wall ? 0.32 : 0;
    if (wall) { add(new THREE.BoxGeometry(0.08, 0.2, 0.03), M.iron, 0, y - 0.05, 0.015, g); add(new THREE.TorusGeometry(0.045, 0.012, 6, 14), M.iron, 0, y - 0.02, 0.15, g).rotation.x = Math.PI / 2 + 0.32; add(new THREE.BoxGeometry(0.025, 0.025, 0.16), M.iron, 0, y - 0.05, 0.08, g); }
    else add(new THREE.CylinderGeometry(0.04, 0.06, y - 0.2, 8), M.iron, 0, (y - 0.2) / 2, 0, g);
    const fl = flame(g, top.x, top.y + 0.02, top.z, size, { haloK: 0.6 }); const lr = warmLight(g, top.x, top.y + 0.18, top.z + 0.12, { col, i, dist, shadow });
    g.userData.flame = fl; g.userData.light = lr; return g; };
  prop.candle = (parent, o = {}) => { const { x = 0, y = 0, z = 0, h = 0.16, r = 0.022, lit = true, light = 0, holder = 'brass', seed } = o, g = grp(parent, x, y, z);
    let base = 0; if (holder === 'brass') { add(new THREE.CylinderGeometry(0.06, 0.075, 0.02, 14), M.brass, 0, 0.01, 0, g); add(new THREE.CylinderGeometry(0.03, 0.035, 0.035, 12), M.brass, 0, 0.035, 0, g); base = 0.05; }
    else if (holder === 'stick') { add(new THREE.CylinderGeometry(0.05, 0.08, 0.03, 12), M.iron, 0, 0.015, 0, g); add(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), M.iron, 0, 0.13, 0, g); add(new THREE.CylinderGeometry(0.035, 0.03, 0.03, 10), M.iron, 0, 0.25, 0, g); base = 0.26; }
    add(new THREE.CylinderGeometry(r, r * 1.04, h, 12), M.wax, 0, base + h / 2, 0, g); for (let k = 0; k < 3; k++) { const d = add(new THREE.CapsuleGeometry(r * 0.22, h * 0.25, 2, 6), M.wax, Math.cos(k * 2.2) * r, base + h * 0.8, Math.sin(k * 2.2) * r, g, false); d.scale.y = 0.8; }
    add(new THREE.CylinderGeometry(0.002, 0.002, 0.02, 4), M.iron, 0, base + h + 0.008, 0, g, false);
    let fl = null, lr = null; if (lit) { fl = flame(g, 0, base + h + 0.006, 0, 0.055, { haloK: 0.35, seed }); if (light > 0) lr = warmLight(g, 0, base + h + 0.12, 0, { col: '#ffa850', i: light, dist: o.dist ?? 3.2, decay: 1.6, flicker: 0.1, shadow: o.shadow }); }
    g.userData.flame = fl; g.userData.light = lr; g.userData.top = base + h; return g; };
  prop.lantern = (parent, o = {}) => { const { x = 0, y = 0, z = 0, light = 1.6, hang = false, s = 1 } = o, g = grp(parent, x, y, z); g.scale.setScalar(s);
    add(new THREE.CylinderGeometry(0.11, 0.12, 0.03, 8), M.iron, 0, 0.015, 0, g); add(new THREE.ConeGeometry(0.12, 0.09, 8), M.iron, 0, 0.33, 0, g); add(new THREE.TorusGeometry(0.04, 0.008, 6, 14), M.iron, 0, 0.4, 0, g);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; add(new THREE.BoxGeometry(0.012, 0.27, 0.012), M.iron, Math.cos(a) * 0.1, 0.16, Math.sin(a) * 0.1, g); }
    const gl = glass(new THREE.CylinderGeometry(0.095, 0.095, 0.26, 8, 1, true), { tint: '#ffe8b0', opacity: 0.08 }); gl.position.y = 0.16; g.add(gl);
    const c = prop.candle(g, { y: 0.03, h: 0.1, r: 0.02, holder: 'none' }); let lr = null; if (light > 0) lr = warmLight(g, 0, 0.2, 0, { col: '#ffb060', i: light, dist: o.dist ?? 4.5, flicker: 0.1, shadow: o.shadow });
    if (hang) add(new THREE.CylinderGeometry(0.006, 0.006, hang, 4), M.iron, 0, 0.4 + hang / 2, 0, g, false);
    g.userData.light = lr; return g; };
  prop.rug = (parent, o = {}) => { const { x = 0, z = 0, ry = 0, w = 2.4, d = 1.6, y = 0.006 } = o; const m = materials.rug({ ...o, w: 512, h: Math.round(512 * d / w) });
    const r = add(new THREE.PlaneGeometry(w, d), m, x, y, z, parent, false); r.rotation.set(-Math.PI / 2, 0, ry); return r; };
  prop.jar = (parent, o = {}) => { const { x = 0, y = 0, z = 0, r = 0.08, h = 0.2, col = '#a87a4a' } = o; const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(r * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, t * 1.15))) * (t > 0.85 ? 0.6 : 1), t * h)); }
    return add(new THREE.LatheGeometry(pts, 18), toon({ color: col }), x, y, z, parent); };
  prop.banner = (parent, o = {}) => { const { x = 0, y = 2.6, z = 0, ry = 0, w = 0.7, h = 1.4, col = '#a8202e', emblem = '#e8c040' } = o, g = grp(parent, x, 0, z, ry);
    const c = cvs(256, 512, (gg, W, H) => { gg.fillStyle = col; gg.beginPath(); gg.moveTo(0, 0); gg.lineTo(W, 0); gg.lineTo(W, H); gg.lineTo(W / 2, H * 0.86); gg.lineTo(0, H); gg.fill(); gg.strokeStyle = emblem; gg.lineWidth = 10; gg.strokeRect(14, 14, W - 28, H * 0.7); gg.fillStyle = emblem; gg.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 26 : 62; gg.lineTo(W / 2 + Math.cos(a) * rr, H * 0.36 + Math.sin(a) * rr); } gg.fill(); });
    const m = toon({ map: P.tex(c), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }); add(new THREE.PlaneGeometry(w, h), m, 0, y - h / 2, 0.03, g); add(new THREE.CylinderGeometry(0.02, 0.02, w + 0.2, 8), M.woodD, 0, y + 0.02, 0.03, g).rotation.z = Math.PI / 2; return g; };

  // =====================================================================================================================
  // ROOM builder: floor + 3 walls (front open) + optional ceiling beams. Returns a Group; children named floor/back/left/right
  // =====================================================================================================================
  const room = (o = {}) => { const { x = 0, y = 0, z = 0, w = 7, d = 6, h = 3.6, floor = 'planks', wall = 'stone', ceil = 'beams', open = ['front'], wallOpts = {}, floorOpts = {}, t = 0.3, tile = 2 } = o, g = grp(scene, x, y, z);
    const fm = typeof floor === 'string' ? mat(floor, floorOpts) : floor, wm = typeof wall === 'string' ? mat(wall, wallOpts) : wall;
    const f = add(tplane(w, d, tile), fm, 0, 0, 0, g, false); f.rotation.x = -Math.PI / 2; f.name = 'floor';
    const W = (name, ww, hh, dd, px, py, pz) => { if (open.includes(name)) return null; const m = add(tbox(ww, hh, dd, tile), wm, px, py, pz, g); m.name = name; return m; };
    W('back', w + 2 * t, h, t, 0, h / 2, -d / 2 - t / 2); W('left', t, h, d, -w / 2 - t / 2, h / 2, 0); W('right', t, h, d, w / 2 + t / 2, h / 2, 0); W('front', w + 2 * t, h, t, 0, h / 2, d / 2 + t / 2);
    if (ceil === 'beams' || ceil === 'flat') { const c = add(tplane(w, d, tile), mat('planks', { seed: 17, lig: 28 }), 0, h, 0, g, false); c.rotation.x = Math.PI / 2; c.name = 'ceiling';
      if (ceil === 'beams') for (let k = 0; k < Math.floor(w / 1.4); k++) add(tbox(0.22, 0.26, d, 1), M.woodD, -w / 2 + 0.7 + k * 1.4, h - 0.13, 0, g); }
    // skirting stones where floor meets walls (grounds the set)
    if (!open.includes('back')) add(tbox(w, 0.12, 0.1, 1), mat('stone', { seed: 19, lig: 44 }), 0, 0.06, -d / 2 + 0.05, g);
    g.userData = { w, d, h }; return g; };

  // =====================================================================================================================
  // GLASS: fresnel glass (clear middle, bright rim, specular streak). Ink comes from a rim-only normal/depth pass,
  // so objects INSIDE the glass keep their own outlines and focus.
  // =====================================================================================================================
  const glassVS = `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
  const glassMat = (o = {}) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: o.side ?? THREE.FrontSide,
    uniforms: { tint: { value: new THREE.Color(o.tint || '#d8f0ff') }, op: { value: o.opacity ?? 0.1 }, rimK: { value: o.rim ?? 0.75 }, glow: { value: o.glow ?? 0 } },
    vertexShader: glassVS,
    fragmentShader: `uniform vec3 tint; uniform float op, rimK, glow; varying vec3 vN; varying vec3 vV; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; float ndv = abs(dot(n, normalize(vV)));
      float f = pow(1. - ndv, 2.4); float s = n.x*.62 + n.y*.78; float streak = smoothstep(.5,.56,s)*(1.-smoothstep(.66,.72,s)) + .6*smoothstep(.2,.24,s)*(1.-smoothstep(.27,.31,s));
      vec3 c = mix(tint, vec3(1.), f*.75) + vec3(streak)*1.2 + tint*glow; float a = op + f*rimK + streak*.55; gl_FragColor = vec4(c, clamp(a, 0., .95)); }` });
  const glassNd = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: `varying vec3 vN; varying vec3 vV; varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; if (abs(dot(n, normalize(vV))) > .28) discard; gl_FragColor = vec4(n*.5+.5, vD); }` });
  /** K.glass(geometry, {tint, opacity, rim, glow}) -> Group (back faces + front faces + rim ink) */
  const glass = (geo, o = {}) => { const g = new THREE.Group();
    const back = new THREE.Mesh(geo, glassMat({ ...o, side: THREE.BackSide, opacity: (o.opacity ?? 0.1) * 0.6 })); back.renderOrder = 3; back.userData.ndSkip = true; back.castShadow = false;
    const front = new THREE.Mesh(geo, glassMat(o)); front.renderOrder = 4; front.castShadow = false; front.userData.nd = glassNd; front.userData.keepXr = true;
    g.add(back, front); g.userData.glass = true; return g; };

  // =====================================================================================================================
  // CROSS-SECTION: cut any mesh/group with a world plane and cap the cut with a hatched face (stencil caps).
  // K.section(object, { normal:[x,y,z], point:[x,y,z], cap:'#e8d8b8', hatch:'rgba(...)' }) -> { plane, set(offset) }
  // The kept side is the side the normal points to.
  // =====================================================================================================================
  const ndBase = new THREE.ShaderMaterial({ side: THREE.DoubleSide, clipping: true,
    vertexShader: `#include <clipping_planes_pars_vertex>
varying vec3 vN; varying float vD; void main(){ vec4 p = vec4(position,1.); vN = normalize(normalMatrix*normal); vec4 mvPosition = modelViewMatrix*p; vD = -mvPosition.z; gl_Position = projectionMatrix*mvPosition;
#include <clipping_planes_vertex>
}`,
    fragmentShader: `#include <clipping_planes_pars_fragment>
varying vec3 vN; varying float vD; void main(){
#include <clipping_planes_fragment>
vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }` });
  const section = (obj, o = {}) => {
    obj.updateMatrixWorld(true);
    const n = new THREE.Vector3(...(o.normal || [0, 0, 1])).normalize(), pt = new THREE.Vector3(...(o.point || [0, 0, 0]));
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, pt), planes = [plane];
    const capTex = P.tex(hatchCanvas(o.cap || '#e8d8b8', o.hatch || 'rgba(140,50,36,.55)'), 3, 3);
    const ro = o.order ?? 1;
    const stencilMat = (side, op) => new THREE.MeshBasicMaterial({ depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, side, clippingPlanes: planes, stencilFail: op, stencilZFail: op, stencilZPass: op });
    const meshes = []; obj.traverse((m) => { if (m.isMesh && !m.userData.ndSkip && !m.userData.kitStencil) meshes.push(m); });
    for (const m of meshes) {
      const src = Array.isArray(m.material) ? m.material : [m.material];
      const cl = src.map((s) => { const c = s.clone(); c.clippingPlanes = planes; c.clipShadows = true; c.side = THREE.DoubleSide; return c; }); m.material = Array.isArray(m.material) ? cl : cl[0];
      const nd = ndBase.clone(); nd.clippingPlanes = planes; m.userData.nd = nd;
      for (const [side, op] of [[THREE.BackSide, THREE.IncrementWrapStencilOp], [THREE.FrontSide, THREE.DecrementWrapStencilOp]]) { const sm = new THREE.Mesh(m.geometry, stencilMat(side, op)); sm.renderOrder = ro; sm.castShadow = false; sm.userData.kitStencil = true; sm.userData.nd = sm.material; m.add(sm); }
    }
    const capM = new THREE.MeshToonMaterial({ gradientMap: grad, map: capTex, color: '#ffffff', stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp });
    const capNd = ndBase.clone(); Object.assign(capNd, { stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp });
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(o.capSize || 8, o.capSize || 8), capM); cap.renderOrder = ro + 0.1; cap.castShadow = false; cap.receiveShadow = true; cap.userData.nd = capNd; cap.userData.kitCap = true;
    cap.onAfterRender = (r) => r.clearStencil(); scene.add(cap);
    const place = () => { plane.coplanarPoint(cap.position); cap.lookAt(cap.position.clone().sub(plane.normal)); };
    place(); obj.renderOrder = ro + 0.2; meshes.forEach((m) => { m.renderOrder = ro + 0.2; });
    const h = { plane, cap, set: (off) => { plane.setFromNormalAndCoplanarPoint(n, pt.clone().addScaledVector(n, off)); place(); }, visible: (v) => { cap.visible = v; } }; return h; };

  // =====================================================================================================================
  // ARROWS & RINGS in 3D (ink-outlined, for in-world mechanism diagrams). Hand-drawn 2D labels live in kit/annot.js.
  // =====================================================================================================================
  const arrow3d = (parent, from, to, o = {}) => { const { col = '#e8302a', r = 0.02, bend = 0.25, head = 0.08, up = [0, 1, 0] } = o;
    const A = new THREE.Vector3(...from), B = new THREE.Vector3(...to), mid = A.clone().lerp(B, 0.5).add(new THREE.Vector3(...up).multiplyScalar(bend * A.distanceTo(B)));
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B), m = toon({ color: col, emissive: col, emissiveIntensity: 0.25 }), g = new THREE.Group(); parent.add(g);
    const tEnd = 1 - head / curve.getLength(); const sub = new THREE.CurvePath(); const pts = curve.getPoints(40).filter((_, i) => i / 40 <= tEnd); const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 8, false);
    add(tube, m, 0, 0, 0, g, false); const tip = add(new THREE.ConeGeometry(r * 2.8, head, 12), m, B.x, B.y, B.z, g, false); const dir = curve.getTangent(1); tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); tip.position.addScaledVector(dir, -head / 2);
    g.userData.curve = curve; return g; };
  const ring3d = (parent, center, radius = 0.2, o = {}) => { const { col = '#e8302a', r = 0.012, normal = [0, 0, 1] } = o; const m = add(new THREE.TorusGeometry(radius, r, 8, 48), toon({ color: col, emissive: col, emissiveIntensity: 0.25 }), center[0], center[1], center[2], parent, false);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...normal).normalize()); return m; };

  // =====================================================================================================================
  // per-frame update: flame billboards + flicker, light flicker, camera-facing helpers, set callbacks
  // =====================================================================================================================
  const _q = new THREE.Quaternion(), _e = new THREE.Euler();
  const update = (f, camera) => {
    for (const r of FL) { if (!r.g.visible) continue; r.f.quaternion.copy(camera.quaternion); const n1 = flick(f, r.seed), n2 = flick(f * 1.3, r.seed + 7);
      r.f.scale.set(1 + 0.08 * n2, 1 + 0.16 * n1, 1); r.f.rotateZ(0.06 * n2); if (r.h) { r.h.quaternion.copy(camera.quaternion); r.h.scale.setScalar(1 + 0.08 * n1); } }
    for (const r of LT) { const n = flick(f, r.seed); r.l.intensity = r.base * (1 + r.k * n); r.l.position.set(r.p0.x + 0.015 * flick(f * 0.7, r.seed + 3), r.p0.y + 0.01 * n, r.p0.z + 0.015 * flick(f * 0.8, r.seed + 5)); }
    for (const m of BB) m.quaternion.copy(camera.quaternion);
    for (const u of UPD) u(f, camera);
  };
  const onUpdate = (fn) => UPD.push(fn);

  return { THREE, scene, toon, add, grp, tbox, tplane, noInk, mat, materials, M, TEX, flame, warmLight, beam, billboard, prop, room, glass, glassMat, section, arrow3d, ring3d, update, onUpdate, flick, lights: LT, flames: FL };
}
