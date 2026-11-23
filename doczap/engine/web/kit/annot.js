// Doc Zap hand-drawn annotations (Nov 2026): Caveat labels, wobbly arrows and red circles anchored to 3D points.
// They are drawn after depth of field (always crisp), follow the moving camera, and "draw on" over a few frames.
// In story.js:  export const annotAt = (f) => [ { type: 'label', text: 'the key', at: [x, y, z], dx: -220, dy: -260, age: f - 300 },
//                                                { type: 'circle', at: [x, y, z], rw: 0.12, age: f - 310 } ];
// Items (age = frames since it appears, 60 fps; nothing is drawn while age < 0):
//   label : text, at (world point the arrow tip touches), dx/dy (text centre offset in px, 1080x1920 space), arrow (default true),
//           size (px, default 92), bend (arrow curvature, default 0.35), col (text fill, default white)
//   circle: at, r (px radius) or rw (world radius), squash (default 0.78), col (default red), w (stroke px)
//   arrow : from (world) or fromPx [x,y], to (world), col, bend
//   fade  : optional frames over which everything fades out at the end -> give `out` = frames until it disappears
const FONT = new FontFace('Caveat', 'url(fonts/caveat-latin-700-normal.woff)', { weight: '700' });
export const fontReady = FONT.load().then((f) => { document.fonts.add(f); return true; }).catch((e) => { console.log('ERR caveat font ' + e.message); return false; });
const INK = '#141418', RED = '#f0302a';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const back = (t, s = 2.2) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
const wob = (seed, i) => Math.sin(seed * 91.7 + i * 1.93) * 0.6 + Math.sin(seed * 37.1 + i * 0.71) * 0.4;
let cvs = null, g = null;
export const canvas = () => cvs;
function stroke2(pts, w, col) { // dark outline then colour, like the reference labels
  for (const [ww, c] of [[w + 7, INK], [w, col]]) { g.lineWidth = ww; g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
}
function arrowPath(a, b, bend, seed, k) { // quadratic curve a->b, drawn up to fraction k, with a hand wobble
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const cx = mx - dy / L * L * bend * 0.5, cy = my + dx / L * L * bend * 0.5, pts = [], n = 36;
  for (let i = 0; i <= n * k; i++) { const t = i / n, w = wob(seed, i) * 2.2 * Math.sin(Math.PI * t); pts.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * cx + t * t * b[0] - dy / L * w, (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * cy + t * t * b[1] + dx / L * w]); }
  return pts;
}
function head(pts, col, s = 1) { if (pts.length < 4) return; const [x1, y1] = pts[pts.length - 1], [x0, y0] = pts[pts.length - 4], a = Math.atan2(y1 - y0, x1 - x0), L = 38 * s;
  stroke2([[x1 - L * Math.cos(a + 0.5), y1 - L * Math.sin(a + 0.5)], [x1, y1], [x1 - L * Math.cos(a - 0.5), y1 - L * Math.sin(a - 0.5)]], 9, col); }
/** draw the list onto the 2D annotation canvas; proj(x,y,z) -> [px, py, ndcZ] in 1080x1920 space. Returns false if nothing drawn. */
export function drawAnnotations(list, proj, W, H, RS = 1) {
  if (!cvs) { cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H; g = cvs.getContext('2d'); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(RS, 0, 0, RS, 0, 0);
  let any = false;
  for (const it of list) { const age = it.age ?? 0; if (age < 0) continue; const seed = hash((it.text || '') + it.type + (it.at || it.to || []).join());
    const fade = it.out != null ? clamp(it.out / 10) : 1; if (fade <= 0) continue; g.globalAlpha = fade; any = true;
    const P = (w) => proj(w[0], w[1], w[2]);
    if (it.type === 'label') { const tip = P(it.at); if (tip[2] > 1) continue; const tx = tip[0] + (it.dx ?? -200), ty = tip[1] + (it.dy ?? -240), size = it.size ?? 92;
      const ks = back(age / 12), ka = smooth((age - 5) / 14);
      if ((it.arrow ?? true) && ka > 0) { const a = [tx + (it.ax ?? 0), ty + size * 0.55], b = [tip[0], tip[1]], pts = arrowPath(a, b, it.bend ?? 0.35, seed, ka); stroke2(pts, 9, it.col || '#ffffff'); if (ka >= 1) head(pts, it.col || '#ffffff'); }
      if (ks > 0) { g.save(); g.translate(tx, ty); g.rotate((it.rot ?? -0.04) + wob(seed, 3) * 0.02); g.scale(ks, ks); g.font = `700 ${size}px Caveat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
        g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14; g.lineWidth = 12; g.strokeStyle = INK; g.strokeText(it.text, 0, 0); g.shadowBlur = 0; g.fillStyle = it.col || '#ffffff'; g.fillText(it.text, 0, 0); g.restore(); } }
    else if (it.type === 'circle') { const c = P(it.at); if (c[2] > 1) continue; let r = it.r ?? 90;
      if (it.rw) { const e = proj(it.at[0] + it.rw, it.at[1], it.at[2]), e2 = proj(it.at[0], it.at[1] + it.rw, it.at[2]); r = Math.max(Math.hypot(e[0] - c[0], e[1] - c[1]), Math.hypot(e2[0] - c[0], e2[1] - c[1])); }
      const k = smooth(age / 16), sq = it.squash ?? 0.78, turns = 1.12, n = 64, pts = [];
      for (let i = 0; i <= n * k; i++) { const t = i / n, a = -2.2 + t * Math.PI * 2 * turns, rr = r * (1 + 0.06 * Math.sin(t * 9 + seed * 10) + 0.08 * t); pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * sq]); }
      if (pts.length > 1) stroke2(pts, it.w ?? 10, it.col || RED); }
    else if (it.type === 'arrow') { const b = P(it.to), a = it.fromPx || P(it.from); if (b[2] > 1) continue; const k = smooth(age / 14), pts = arrowPath(a, b, it.bend ?? 0.3, seed, k); stroke2(pts, it.w ?? 9, it.col || '#ffffff'); if (k >= 1) head(pts, it.col || '#ffffff'); }
  }
  g.globalAlpha = 1; return any;
}
