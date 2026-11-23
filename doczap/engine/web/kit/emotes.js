// Doc Zap pop-in emotes (Nov 2026): ? ! !? lightbulb heart Zzz sweat anger-vein dollar — all bounce in, then idle-animate.
// In story.js fxAt:   import { emote } from './kit/emotes.js';   out.push(emote('?', f - f0, [x, y, z], { s: 0.22 }));
// age = frames since the pop (60 fps). pos = emote centre in world space (put it ~0.35 m above/beside the head).
const INK = '#1e1e24';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
/** bounce: overshoot to 1.22, wobble down to 1 (age in 60-fps frames) */
export const pop = (age) => { const t = age / 2; return t < 0 ? 0 : t < 6 ? easeOut(t / 6) * 1.22 : 1 + 0.22 * Math.max(0, 1 - (t - 6) / 9) * Math.cos((t - 6) * 0.95); };
const q = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;
const glyph = (ch, col, k, rot, dy = 0) => (p) => { const g = p.g; g.save(); g.translate(300, 500 + dy); g.rotate(rot); g.scale(k, k); g.font = '900 300px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 30; g.strokeStyle = INK; g.strokeText(ch, 0, 0); g.fillStyle = col; g.fillText(ch, 0, 0); g.fillStyle = 'rgba(255,255,255,.45)'; g.save(); g.beginPath(); g.rect(-200, -160, 400, 90); g.clip(); g.fillText(ch, 0, 0); g.restore(); g.restore(); };
const bulb = (k, t) => (p) => { const g = p.g; g.save(); g.translate(300, 520); g.scale(k, k); g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = '#ffe27a'; g.shadowBlur = 50; g.fillStyle = '#ffe680'; g.beginPath(); g.arc(0, -40, 105, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#fff6c0'; g.beginPath(); g.ellipse(-35, -80, 26, 38, -0.5, 0, 7); g.fill();
  g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.arc(0, -40, 105, 0.75, Math.PI - 0.75, true); g.lineTo(-48, 95); g.lineTo(48, 95); g.closePath(); g.stroke();
  g.fillStyle = '#9aa0aa'; g.fillRect(-50, 95, 100, 52); g.strokeRect(-50, 95, 100, 52); g.beginPath(); g.moveTo(-50, 112); g.lineTo(50, 112); g.moveTo(-50, 130); g.lineTo(50, 130); g.stroke();
  g.strokeStyle = '#ffb020'; g.lineWidth = 9; g.beginPath(); g.moveTo(-28, 40); g.lineTo(-14, -10); g.lineTo(0, 30); g.lineTo(14, -10); g.lineTo(28, 40); g.stroke();
  g.strokeStyle = '#ffd23f'; g.lineWidth = 14; const L = 40 + 14 * Math.sin(t * 0.3); for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.08 + 0.84 * i / 6); g.beginPath(); g.moveTo(Math.cos(a) * 140, -40 + Math.sin(a) * 140); g.lineTo(Math.cos(a) * (140 + L), -40 + Math.sin(a) * (140 + L)); g.stroke(); }
  g.restore(); };
const heart = (k, beat) => (p) => { const g = p.g; g.save(); g.translate(300, 500); g.scale(k * beat, k * beat); g.beginPath(); g.moveTo(0, 120); g.bezierCurveTo(-210, -10, -150, -190, 0, -80); g.bezierCurveTo(150, -190, 210, -10, 0, 120); g.closePath();
  g.fillStyle = '#ff3d5a'; g.fill(); g.lineWidth = 24; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-70, -70, 30, 20, -0.6, 0, 7); g.fill(); g.restore(); };
const zzz = (age) => (p) => { const g = p.g; g.save(); g.font = '900 170px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (let i = 0; i < 3; i++) { const ph = ((age / 60) * 0.55 + i / 3) % 1, x = 230 + ph * 170 + Math.sin(ph * 6 + i) * 20, y = 760 - ph * 520, s = 0.45 + ph * 0.7, a = ph < 0.15 ? ph / 0.15 : ph > 0.8 ? (1 - ph) / 0.2 : 1;
    g.save(); g.globalAlpha = clamp(a); g.translate(x, y); g.rotate(-0.25 + ph * 0.3); g.scale(s, s); g.lineWidth = 26; g.strokeStyle = INK; g.strokeText('Z', 0, 0); g.fillStyle = '#9ad8ff'; g.fillText('Z', 0, 0); g.restore(); } g.restore(); };
const drops = (k, age) => (p) => { const g = p.g; g.save(); const d = (x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, -70); g.bezierCurveTo(30, -20, 48, 10, 46, 30); g.arc(0, 30, 46, 0, Math.PI); g.bezierCurveTo(-48, 10, -30, -20, 0, -70); g.closePath();
  g.fillStyle = '#9fdcff'; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-14, 18, 10, 16, -0.3, 0, 7); g.fill(); g.restore(); };
  for (let i = 0; i < 3; i++) { const ph = ((age / 60) * 0.9 + i * 0.33) % 1; d(220 + i * 80, 380 + ph * 260 + i * 30, k * (0.8 - i * 0.12) * (ph > 0.85 ? (1 - ph) / 0.15 : 1)); } g.restore(); };
const vein = (k, age) => (p) => { const g = p.g, pulse = 1 + 0.12 * Math.sin(age * 0.5); g.save(); g.translate(300, 500); g.scale(k * pulse, k * pulse); g.lineCap = 'round'; g.lineJoin = 'round';
  const arm = (r) => { g.save(); g.rotate(r); g.beginPath(); g.moveTo(-34, -120); g.quadraticCurveTo(-28, -40, -110, -34); g.moveTo(34, -120); g.quadraticCurveTo(28, -40, 110, -34); g.restore(); };
  for (const [w, c] of [[64, INK], [36, '#e8283a']]) { g.lineWidth = w; g.strokeStyle = c; for (let i = 0; i < 4; i++) { arm(i * Math.PI / 2); g.stroke(); } } g.restore(); };
const dollar = (k, age) => (p) => { const g = p.g, spin = Math.cos(age * 0.12); g.save(); g.translate(300, 500); g.scale(k * (0.25 + 0.75 * Math.abs(spin)), k); g.beginPath(); g.arc(0, 0, 150, 0, 7); g.fillStyle = '#ffcf3a'; g.fill(); g.lineWidth = 22; g.strokeStyle = INK; g.stroke();
  g.lineWidth = 10; g.strokeStyle = '#e0a020'; g.beginPath(); g.arc(0, 0, 115, 0, 7); g.stroke(); g.font = '900 210px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = spin > 0 ? '#3a8a2a' : '#2a6a1a'; g.lineWidth = 14; g.strokeStyle = INK; g.strokeText('$', 0, 8); g.fillText('$', 0, 8); g.restore(); };
const note = (k, age) => (p) => { const g = p.g; g.save(); g.translate(300, 500 + Math.sin(age * 0.1) * 30); g.rotate(Math.sin(age * 0.07) * 0.2); g.scale(k, k); g.lineWidth = 22; g.strokeStyle = INK; g.fillStyle = '#c86aff';
  g.beginPath(); g.ellipse(-60, 90, 60, 44, -0.4, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-6, 80); g.lineTo(-6, -150); g.quadraticCurveTo(70, -110, 110, -40); g.stroke(); g.restore(); };
/**
 * emote(kind, age, pos, opts) -> FX entry for fxAt. kinds: '?', '!', '!?', 'bulb', 'heart', 'zzz', 'sweat', 'vein', 'dollar', 'note'.
 * opts: s (size, default 0.22), rot, key (extra cache key), order.
 */
export const emote = (kind, age, pos, o = {}) => {
  const s = o.s ?? 0.22, k = q(pop(age)), a = Math.round(age);
  let draw, key;
  switch (kind) {
    case '?': draw = glyph('?', '#ffd23f', k, o.rot ?? -0.15); key = '?' + k; break;
    case '!': draw = glyph('!', '#ff4a4a', k, o.rot ?? 0.12); key = '!' + k; break;
    case '!?': draw = glyph('!?', '#ff8a3a', k * 0.8, o.rot ?? 0.08); key = '!?' + k; break;
    case 'bulb': draw = bulb(k, a / 2); key = 'b' + k + (a >> 1); break;
    case 'heart': { const beat = q(1 + 0.1 * Math.max(0, Math.sin(age * 0.2)) ** 4); draw = heart(k, beat); key = 'h' + k + beat; break; }
    case 'zzz': draw = zzz(a); key = 'z' + a; break;
    case 'sweat': draw = drops(k, a); key = 's' + k + a; break;
    case 'vein': draw = vein(k, a); key = 'v' + k + a; break;
    case 'dollar': draw = dollar(k, a); key = '$' + k + a; break;
    case 'note': draw = note(k, a); key = 'n' + k + a; break;
    default: throw new Error('unknown emote ' + kind);
  }
  return { key: kind + key + (o.key || ''), draw, x: pos[0], y: pos[1] - 1.125 * s, z: pos[2], s, blob: false, shadow: false, order: o.order ?? 7, ground: -99 };
};
