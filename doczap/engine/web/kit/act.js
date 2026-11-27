// Doc Zap character acting kit (Nov 27 2026, after Diyar: "the character movement").
// Cards used to swap poses and faces in one frame. These helpers make them move like animated characters:
//   arms(f, keys)       eased arm-pose changes with a little overshoot     -> { L, L2, Lk } / { R, R2, Rk }
//   react(f, t, k)      squash-and-stretch bounce + optional hop on a reaction -> { sx, sy, y }
//   ease(f, keys)       any number (look, tilt, headTilt) eased between keyframes
//   walk(f, path)       position along a path with a stepping walk cycle   -> { p:[x,y,z], step, bob }
//   pick(f, keys)       the value of the last key reached (expressions)
// All pure functions of the frame number, so renders stay deterministic and resumable.
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => x * x * (3 - 2 * x);
const backOut = (x, s = 1.6) => { const t = x - 1; return 1 + (s + 1) * t * t * t + s * t * t; };   // overshoots ~10 %, then settles

/** keys: [[frame, value], ...] sorted. Returns the last value reached at frame f. */
export const pick = (f, keys) => { let v = keys[0][1]; for (const [t, x] of keys) if (f >= t) v = x; return v; };

/** eased number between keyframes; each change takes `dur` frames starting at its key. */
export const ease = (f, keys, dur = 10) => { let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [t, x] = keys[i]; if (f < t) break; v = v + (x - v) * smooth(clamp01((f - t) / dur)); }
  return v; };

/** arm pose keys for one side: [[frame, 'pose'], ...]. Blends over `dur` frames with overshoot. side: 'L' | 'R' */
export const arms = (f, keys, side = 'R', dur = 9) => {
  let prev = keys[0][1], cur = keys[0][1], t0 = -1e9;
  for (let i = 1; i < keys.length; i++) { if (f >= keys[i][0]) { prev = cur; cur = keys[i][1]; t0 = keys[i][0]; } }
  const k = clamp01((f - t0) / dur);
  if (k >= 1 || prev === cur) return { [side]: cur };
  return { [side]: prev, [side + '2']: cur, [side + 'k']: Math.round(backOut(k) * 20) / 20 };
};

/** reaction at frame t (e.g. an expression change): squash then stretch then settle. k = strength, hop = jump height (m). */
export const react = (f, t, k = 1, hop = 0) => { const d = f - t; if (d < 0 || d > 24) return { sx: 1, sy: 1, y: 0 };
  const sq = d < 4 ? -0.08 * k * (d / 4) : 0.08 * k * Math.exp(-(d - 4) / 5) * Math.cos((d - 4) / 2.2) * 1.0 - 0.0;
  const sy = Math.round((1 + sq) * 100) / 100, sx = Math.round((1 - sq * 0.6) * 100) / 100;
  const y = hop && d >= 3 && d <= 15 ? Math.round(hop * Math.sin(Math.PI * (d - 3) / 12) * 1000) / 1000 : 0;
  return { sx, sy, y };
};

/** many reactions: pass all reaction frames, the latest one that is still playing wins */
export const reacts = (f, ts, k = 1, hop = 0) => { let r = { sx: 1, sy: 1, y: 0 }; for (const t of ts) if (f >= t && f - t <= 24) r = react(f, t, k, hop); return r; };

/** walk along path [[frame, [x,y,z]], ...] (linear between points, eased at both ends); step cycle while moving. */
export const walk = (f, path, stride = 26) => {
  if (f <= path[0][0]) return { p: path[0][1], step: 0, bob: 0, moving: false };
  for (let i = 1; i < path.length; i++) { const [t1, p1] = path[i], [t0, p0] = path[i - 1];
    if (f <= t1) { const k = smooth(clamp01((f - t0) / Math.max(1, t1 - t0))), moving = p0.some((v, j) => v !== p1[j]);
      return { p: p0.map((v, j) => v + (p1[j] - v) * k), step: moving ? Math.round(((f - t0) / stride) % 1 * 8) / 8 : 0, bob: moving ? Math.round(Math.abs(Math.sin((f - t0) / stride * Math.PI * 2)) * 0.03 * 1000) / 1000 : 0, moving }; } }
  return { p: path[path.length - 1][1], step: 0, bob: 0, moving: false };
};

/** a small idle weight shift so nobody stands frozen: tilt degrees */
export const sway = (f, seed = 1, amp = 1.5) => Math.round(amp * Math.sin(f / 47 + seed * 1.7) * 10) / 10;
