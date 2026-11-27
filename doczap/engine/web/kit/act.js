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

// ---------------- v2 acting layer (Nov 27 2026, Diyar: "make the characters movement real") ----------------
// Every value below changes on EVERY frame (no holds, no stepping), so nobody ever freezes.
const r1 = (x) => Math.round(x * 10) / 10, r3 = (x) => Math.round(x * 1000) / 1000;
const wob = (f, seed, a, b) => Math.sin(f * a + seed * b);
/** the life layer: breathing (card sx/sy), weight shift (dx metres), body + head sway, drifting hands. e = energy 0..1.5 */
export const alive = (f, seed = 1, e = 1) => ({
  tilt: r1(e * (1.4 * wob(f, seed, 0.029, 1.7) + 0.5 * wob(f, seed, 0.081, 3.1))),
  headTilt: r1(e * (2.4 * wob(f, seed, 0.041, 2.3) + 0.9 * wob(f, seed, 0.107, 0.7))),
  bob: r3(0.005 * e * wob(f, seed, 0.052, 1.1)),
  sy: r3(1 + 0.014 * wob(f, seed, 0.027, 0.4)), sx: r3(1 - 0.007 * wob(f, seed, 0.027, 0.4)),
  dx: r3(0.012 * e * wob(f, seed, 0.019, 2.9)),
  Ld: [r3(0.035 * e * wob(f, seed, 0.047, 1.3)), r3(0.045 * e * wob(f, seed, 0.033, 2.1))],
  Rd: [r3(0.035 * e * wob(f, seed, 0.051, 4.2)), r3(0.045 * e * wob(f, seed, 0.036, 0.9))],
});
/** tool blows (trowel, hammer): slow wind-up (anticipation), fast strike, rebound. Returns slam amount sk, body tilt and the hit frames. */
export const strike = (f, t0, period = 30, n = 6) => {
  const hits = Array.from({ length: n }, (_, i) => t0 + i * period + Math.round(0.72 * period)), d = f - t0;
  if (d < 0) return { sk: 0.9, tilt: 0, hits };
  const i = Math.floor(d / period); if (i >= n) return { sk: 1, tilt: 0, hits };
  const ph = (d % period) / period; let sk, tilt;
  if (ph < 0.6) { const k = smooth(ph / 0.6); sk = 1 - 1.25 * k; tilt = -5 * k; }
  else if (ph < 0.72) { const k = ((ph - 0.6) / 0.12) ** 2; sk = -0.25 + 1.45 * k; tilt = -5 + 13 * k; }
  else { const k = smooth((ph - 0.72) / 0.28); sk = 1.2 - 0.2 * k; tilt = 8 * (1 - k); }
  return { sk: r3(sk), tilt: r1(tilt), hits };
};
/** cold shiver: fast small sideways shake (metres) + tilt jitter */
export const shiver = (f, seed = 1, amp = 1) => ({ dx: r3(amp * (0.006 * Math.sin(f * 2.3 + seed) + 0.003 * Math.sin(f * 3.7 + seed * 2))), tilt: r1(amp * 1.6 * Math.sin(f * 1.9 + seed * 3)) });
/** coughs at frames ts: body doubles forward, squashes, hand flies to the mouth (mk 0..1) */
export const cough = (f, ts) => { let o = { tilt: 0, sy: 1, sx: 1, mk: 0, on: false };
  for (const t of ts) { const d = f - t; if (d < -6 || d > 26) continue; const up = smooth(clamp01((d + 6) / 6)), down = 1 - smooth(clamp01((d - 14) / 12)), m = Math.min(up, down);
    const jerk = d >= 0 && d < 14 ? Math.exp(-((d % 5) / 1.6)) : 0;   // 3 little barks
    o = { tilt: r1(-9 * jerk * m), sy: r3(1 - 0.06 * jerk * m), sx: r3(1 + 0.035 * jerk * m), mk: r3(m), on: m > 0.05 }; }
  return o; };
/** 2D eased target, e.g. a hand position [out, down] between keyframes */
export const ease2 = (f, keys, dur = 12) => [ease(f, keys.map(([t, v]) => [t, v[0]]), dur), ease(f, keys.map(([t, v]) => [t, v[1]]), dur)].map(r3);
/** head shake "no" starting at t for n frames (look offset) */
export const shake = (f, t, n = 40, amp = 0.35) => { const d = f - t; if (d < 0 || d > n) return 0; return r3(amp * Math.sin(d * 0.55) * Math.sin(Math.PI * d / n)); };
/** nod "yes" (head tilt degrees) */
export const nod = (f, t, n = 30, amp = 5) => { const d = f - t; if (d < 0 || d > n) return 0; return r1(amp * Math.sin(d * 0.5) * Math.sin(Math.PI * d / n)); };

// ================= Motion Engine v1 — physical layer (Nov 27 2026) =================
// Channels understood by the rig (roman.js): px (pelvis shift, design px), crouch (knees bend, feet planted), chest (spine curl),
// shrug, headDrop, sit, fL/fR (foot offsets [dx, lift] design px), LhD/RhD (hand targets, design px), Lh/Rh (hand targets rel. shoulder).
// Card-level x/y/sx/sy are NOT used for acting any more: moving the whole card slides the feet and stretching it is rubbery.
export const DPX = 0.00225;                                  // metres per design px at card scale 1
const hsh = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** smooth irregular value noise in -1..1 (not a sine: no visible repetition) */
export const vnoise = (t, seed = 0) => { const i = Math.floor(t), fr = t - i, k = fr * fr * (3 - 2 * fr); return 2 * (hsh(i + seed * 57.3) * (1 - k) + hsh(i + 1 + seed * 57.3) * k) - 1; };
const fbm = (t, seed) => 0.7 * vnoise(t, seed) + 0.3 * vnoise(t * 2.3, seed + 9);
/** irregular blinking: intervals 1.5-5 s, sometimes a double blink */
export const blinkV = (f, seed) => { let t = Math.floor(hsh(seed) * 90); for (let k = 0; k < 400 && t <= f; k++) { const d = f - t; if (d < 5) return d < 2 ? 0.5 : d < 4 ? 1 : 0.5; if (hsh(seed * 3 + k) < 0.15 && d >= 9 && d < 14) return d < 11 ? 0.5 : 1; t += 90 + Math.floor(hsh(seed + k * 7.7) * 210); } return 0; };
/** idle v3: breathing (shoulders), irregular weight transfers through the pelvis, posture corrections, relaxed hands. calm 0..1 lowers it in key moments */
export const idle3 = (f, seed = 1, e = 1) => { const t = f / 60, br = Math.sin(t * (1.45 + 0.2 * hsh(seed)) * Math.PI + seed);
  return { shrug: r3(0.06 * (0.5 + 0.5 * br) * e), px: r3(e * 7 * fbm(t * 0.35, seed)), tilt: r1(e * 1.2 * fbm(t * 0.5, seed + 3)), headTilt: r1(e * 2.4 * fbm(t * 0.6, seed + 5)),
    crouch: r3(e * 0.02 * (0.5 + 0.5 * fbm(t * 0.4, seed + 7))), Ld: [r3(0.025 * e * fbm(t * 0.7, seed + 11)), r3(0.03 * e * fbm(t * 0.55, seed + 13))], Rd: [r3(0.025 * e * fbm(t * 0.75, seed + 17)), r3(0.03 * e * fbm(t * 0.5, seed + 19))] }; };
/** whole-body strike (hammer / trowel), 10 phases: plant, weight back, pelvis + torso wind-up, arm prep, accelerate, contact (hand locked), force, reaction, recoil absorbed by the knees, recover */
export const strike3 = (f, t0, period = 30, n = 5, power = 1) => {
  const hits = Array.from({ length: n }, (_, i) => t0 + i * period + Math.round(0.62 * period)), d = f - t0;
  const rest = { sk: 0.95, tilt: 0, px: 0, crouch: 0, contact: false, hits };
  if (d < 0 || d >= n * period) return rest;
  const ph = (d % period) / period; let sk, tilt, px, crouch;
  if (ph < 0.5) { const k = smooth(ph / 0.5); sk = 0.95 - 1.2 * k; tilt = -6 * k * power; px = -9 * k * power; crouch = 0.04 * k; }                       // weight back, wind up
  else if (ph < 0.62) { const k = ((ph - 0.5) / 0.12) ** 2; sk = -0.25 + 1.4 * k; tilt = -6 * power + 15 * k * power; px = (-9 + 21 * k) * power; crouch = 0.04 + 0.05 * k; }   // accelerate
  else if (ph < 0.7) { sk = 1.15; tilt = 9 * power; px = 12 * power; crouch = 0.09 + 0.06 * power * Math.sin(Math.PI * (ph - 0.62) / 0.08); }          // contact: hand locked, knees absorb
  else { const k = smooth((ph - 0.7) / 0.3); sk = 1.15 - 0.2 * k; tilt = 9 * power * (1 - k); px = 12 * power * (1 - k); crouch = 0.09 * (1 - k); }  // recover
  return { sk: r3(sk), tilt: r1(tilt), px: r1(px), crouch: r3(crouch), contact: ph >= 0.62 && ph < 0.7, hits };
};
/** cough v3: chest contracts, shoulders forward, spine bends, head down, hand to mouth; then inhale, straighten, recover. reps barks */
export const cough3 = (f, t0, reps = 3, gap = 9) => { const d = f - t0, len = reps * gap + 22; if (d < -8 || d > len) return { chest: 0, headDrop: 0, mk: 0, tilt: 0, shrug: 0, on: false };
  const env = smooth(clamp01((d + 8) / 8)) * (1 - smooth(clamp01((d - reps * gap - 6) / 16)));
  let bark = 0; for (let i = 0; i < reps; i++) { const b = d - i * gap; if (b >= 0 && b < gap) bark = Math.max(bark, b < 3 ? (b + 1) / 4 : Math.exp(-(b - 3) / 3.5)); }
  const inhale = d > reps * gap ? Math.sin(Math.PI * clamp01((d - reps * gap) / 16)) : 0;
  return { chest: r3(env * (0.35 + 0.6 * bark) - 0.25 * inhale), headDrop: r3(env * 0.05 * (0.5 + bark)), mk: r3(env), tilt: r1(env * -3 * bark), shrug: r3(0.25 * inhale + 0.2 * bark * env), on: env > 0.05 }; };
/** shiver v3: irregular muscular tremor in shoulders and elbows, raised shoulders, slow weight shifts; the body itself is not shaken */
export const shiver3 = (f, seed = 1, amp = 1) => ({ shrug: r3(0.35 * amp + 0.06 * amp * vnoise(f * 0.25, seed)), px: r1(4 * amp * fbm(f / 60 * 0.8, seed + 2)),
  Ld: [r3(0.012 * amp * vnoise(f * 1.7, seed + 4)), r3(0.012 * amp * vnoise(f * 1.9, seed + 5))], Rd: [r3(0.012 * amp * vnoise(f * 1.8, seed + 6)), r3(0.012 * amp * vnoise(f * 2.1, seed + 7))],
  headTilt: r1(1.2 * amp * vnoise(f * 1.3, seed + 8)), crouch: 0.05 * amp });
/** palms in contact, sliding against each other; y = hand height below the shoulder (head heights) */
export const rubHands3 = (f, y = 0.62, speed = 0.4, k = 1) => { const sl = 0.16 * Math.sin(f * speed) * k, v = 0.025 * Math.cos(f * speed) * k;
  return { L: 'ik', R: 'ik', Lh: [-0.85 + 0.13 - sl, y + v, 1], Rh: [-0.85 + 0.13 + sl, y - v, 1], Ld: null, Rd: null, LhFront: true, RhFront: true }; };
/** look with biological sequencing: eyes lead, the head follows (lag), the torso follows last */
export const lookSeq = (f, keys, dur = 14) => ({ look: r3(ease(f, keys, dur)), headTilt: r1(-6 * (ease(f, keys, dur) - ease(f - 6, keys, dur))), tilt: r1(4 * ease(f - 10, keys, dur * 1.5)) });
/** foot-locked walk: planted feet stay fixed in the world while the pelvis travels; heel lifts before toe-off, knees take the weight.
 *  path [[frame, [x,y,z]], ...] world; s = card scale. Returns body position, foot offsets fL/fR (design px), pelvis crouch bob and arm swing. */
export const walk3 = (f, path, s = 0.9, stride = 0.3) => {
  const t0 = path[0][0], t1 = path[path.length - 1][0], P0 = path[0][1], P1 = path[path.length - 1][1];
  const dist = Math.hypot(P1[0] - P0[0], P1[2] - P0[2]), nSteps = Math.max(2, Math.round(dist / stride)), dir = Math.sign(P1[0] - P0[0]) || 1;
  const T = clamp01((f - t0) / Math.max(1, t1 - t0)), K = DPX * s;
  // the pelvis moves at constant speed with eased start/stop (stop: the body carries forward and settles)
  const k = T <= 0 ? 0 : T >= 1 ? 1 : (T < 0.12 ? 0.5 * (T / 0.12) ** 2 * 0.24 : T > 0.88 ? 1 - 0.5 * ((1 - T) / 0.12) ** 2 * 0.24 : 0.12 + (T - 0.12) * (0.76 / 0.76));
  const kk = clamp01(k), pos = [P0[0] + (P1[0] - P0[0]) * kk, P0[1] + (P1[1] - P0[1]) * kk, P0[2] + (P1[2] - P0[2]) * kk];
  const st = kk * nSteps, i = Math.floor(st), ph = st - i;           // step i: foot (i % 2) swings from plant i-1 to plant i+1
  const plant = (j) => j <= 0 ? P0[0] : P0[0] + (P1[0] - P0[0]) * clamp01((j + 0.5) / nSteps);   // stance foot sits half a stride ahead when it lands
  const footX = (side) => { const moving = T > 0 && T < 1, swingSide = i % 2 === 0 ? -1 : 1; let wx, lift = 0;
    if (!moving) { wx = T <= 0 ? P0[0] : P1[0];
      const closer = (nSteps - 1) % 2 === 0 ? 1 : -1, dd = f - t1;     // after arriving, the trailing foot takes a small closing step
      if (T >= 1 && side === closer && dd < 16) { const c = smooth(dd / 16), from = plant(nSteps - 1); wx = from + (P1[0] - from) * c; lift = Math.sin(Math.PI * c) * 10; }
      if (T >= 1 && side !== closer) wx = plant(nSteps); }
    else if (side === swingSide) { const a = plant(i - 1), b = plant(i + 1), sw = smooth(ph); wx = a + (b - a) * sw; lift = Math.sin(Math.PI * ph) * 16; }
    else wx = plant(i);
    return [r1((wx - pos[0]) / K), r1(lift)]; };
  const L = footX(-1), R = footX(1), moving = T > 0 && T < 1;
  return { p: pos, fL: [L[0], L[1]], fR: [R[0], R[1]], crouch: moving ? r3(0.05 + 0.04 * Math.cos(2 * Math.PI * ph)) : 0, swing: moving ? Math.sin(Math.PI * st) : 0, moving, dir };
};
