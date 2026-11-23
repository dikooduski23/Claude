// Doc Zap — "He won the lottery 14 times… legally" (Stefan Mandel, Virginia 1992) — REBUILT in the reference style (Nov 23 2026).
// Close, always-moving camera, macro opener, whip-pans, expressive faces, in-world cutaway. 60 fps; timed in 30-fps units (u = f/2).
// Voice cut after "…do it again." -> 41.9 s = 2514 frames (1257 u). The last shot returns to the opening so it loops.
import { M as E, clamp, lerp, lerp3, ramp, idle, blinkAt, q } from './motion.js';
export const FPS = 60, TOTAL = 2514, DECK = 0, LOOK = 'mini';
const SH = [
  ['macro', 0, 96, 'warm'], ['close', 97, 148, 'warm'], ['desk', 149, 232, 'night'], ['scale', 233, 299, 'night'], ['scale2', 300, 378, 'night'],
  ['studio', 379, 449, 'tvs'], ['host', 450, 519, 'tvs'], ['tower', 520, 609, 'warm'], ['print', 610, 686, 'warm'], ['race', 687, 735, 'gas'],
  ['clock', 736, 752, 'gas'], ['shut', 753, 771, 'gas'], ['left', 772, 860, 'gas'], ['find', 861, 940, 'warm'], ['win', 941, 1018, 'warm'],
  ['fbi', 1019, 1137, 'off'], ['rules', 1138, 1190, 'off'], ['loop', 1191, 1256, 'warm']];
export const SHOTS = SH.map(([id, a, b, light]) => ({ id, a: a * 2, b: b * 2 + 1, light }));
export const CUTS = [];
// whip-pans happen at these shot starts (in u); direction alternates
export const WHIPS = [149, 379, 520, 772, 861, 1019, 1191];
export const WHIP_FRAMES = WHIPS.map((a) => [2 * (a - 7), 2 * (a + 9)]);
const shot30 = (u) => { const s = SH.find((s) => u >= s[1] && u < s[2] + 1) || SH[SH.length - 1]; return { id: s[0], a: s[1], b: s[2], light: s[3] }; };
export const shotAt = (f) => { const s = shot30(f / 2); return { id: s.id, a: s.a * 2, b: s.b * 2 + 1, light: s.light }; };
const BASE = { az: 135, el: 50, sky: '#cfe2ff', ground: '#b09a78', hemi: 1.1, sun: '#fff3dc', sunI: 0, fog: '#d4e6ff', fogNear: 80, fogFar: 900, skyTop: '#2f7ce0', skyHor: '#bfe0ff', sat: 1.08, vig: 0.18, shadowExt: 6, noClouds: true };
export const LIGHTS = {
  warm: { ...BASE, sky: '#fff1dc', ground: '#7a6450', hemi: 1.1, sun: '#ffe2b8', sunI: 1.0, az: 120, el: 55, fog: '#c09a78', fogNear: 5, fogFar: 26, sat: 1.22, vig: 0.3, ink: 1.15, con: 1.08, gain: '#fff4e6', bloom: 0.62, bthr: 0.92, rim: 0.3, rimCol: '#ffc878', rimDir: [-0.8, 0.5], ao: 0.28 },
  night: { ...BASE, sky: '#4a5a9a', ground: '#2a2220', hemi: 0.42, sun: '#9ab0ff', sunI: 0.25, az: 60, el: 40, fog: '#141a30', fogNear: 4, fogFar: 16, skyTop: '#0a1030', skyHor: '#2a3a7a', sat: 1.2, vig: 0.38, ink: 1.15, con: 1.1, gain: '#fff0dc', bloom: 0.72, bthr: 0.85, rim: 0.34, rimCol: '#8aa8ff', rimDir: [0.8, 0.5], ao: 0.3, shadowExt: 4 },
  tvs: { ...BASE, sky: '#c8b8ff', ground: '#3a2a5a', hemi: 0.9, sun: '#fff0d8', sunI: 0.9, az: 150, el: 55, fog: '#2a1a4a', fogNear: 8, fogFar: 30, sat: 1.22, vig: 0.3, ink: 1.15, con: 1.08, gain: '#fff4ff', bloom: 0.68, bthr: 0.9, rim: 0.3, rimCol: '#b08aff', rimDir: [0.8, 0.5], ao: 0.26 },
  gas: { ...BASE, sky: '#4a5a9a', ground: '#2a2a34', hemi: 0.55, sun: '#9ab0ff', sunI: 0.5, az: 220, el: 40, fog: '#1a2240', fogNear: 10, fogFar: 50, skyTop: '#0a1030', skyHor: '#2a3a7a', sat: 1.2, vig: 0.34, ink: 1.15, con: 1.1, gain: '#f4f2ff', bloom: 0.72, bthr: 0.88, rim: 0.32, rimCol: '#ff6a8a', rimDir: [0.8, 0.5], ao: 0.26, shadowExt: 8 },
  off: { ...BASE, sky: '#fff0d8', ground: '#7a6a5a', hemi: 1.0, sun: '#ffe8c0', sunI: 1.0, az: 100, el: 30, fog: '#c8a888', fogNear: 6, fogFar: 26, sat: 1.18, vig: 0.3, ink: 1.15, con: 1.08, gain: '#fff8ee', bloom: 0.55, bthr: 0.95, rim: 0.26, rimCol: '#ffd8a0', rimDir: [-0.8, 0.5], ao: 0.28 },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
const X1 = 17000, X2 = 17400, X3 = 17800, X4 = 18200;
const MP = [X1 + 0.0, 1.36, -1.55];             // Mandel on top of the ticket mountain
const HEAD = [X1, 2.74, -1.55];                 // his face up there
const DP = [X1 - 4.2, 0, 0.55], DHEAD = [X1 - 4.2, 1.27, 0.55];   // at his desk (night)
const SP = [X1 - 5.95, 0, 0.2];                 // beside the scale
const SB = [X1 - 5.45, 1.33, 0.43];             // scale beam pivot (world)
const HOST = [X2 - 0.7, 0.25, -1.35];
const TP = [X1 - 1.7, 0, -2.9];                 // Mandel in front of the box tower
const FP = [X1 + 0.6, 0, -0.15];                // Mandel searching the mound
const yawLook = (pos, look, deg) => { const a = deg * Math.PI / 180, dx = look[0] - pos[0], dz = look[2] - pos[2]; return [pos[0] + dx * Math.cos(a) - dz * Math.sin(a), look[1], pos[2] + dx * Math.sin(a) + dz * Math.cos(a)]; };
const orbit = (c, ang, d, y) => [c[0] + Math.sin(ang * Math.PI / 180) * d, y, c[2] + Math.cos(ang * Math.PI / 180) * d];
// the hero ticket flutters down in front of the lens (local to the warehouse); negative u = still above frame (used by the loop shot)
const heroAt = (u) => { const t = Math.min(1, u / 72); return [0.1 + 0.04 * Math.sin(u * 0.19), 2.78 - 0.62 * t - 0.5 * Math.max(0, t - 0.75) ** 2, 0.72 + 0.03 * Math.sin(u * 0.13), Math.PI / 2 + 0.45 * Math.sin(u * 0.15), 0.35 * Math.sin(u * 0.09), 0.3 * Math.sin(u * 0.12 + 1)]; };
const MACRO0 = (k) => ({ pos: lerp3([X1 + 0.2, 2.56, 1.25], [X1 + 0.12, 2.56, 0.6], k), look: [X1 + 0.06, 2.72, -1.55], fov: 40 });
// courier run path at the gas station
const runAt = (u, off) => { const t = ramp(u, 687, 735); return [lerp(X3 - 3.4 + off, X3 - 0.4 + off, t), 0, lerp(1.6 + off * 0.4, -1.0 + off * 0.4, t)]; };
const cam30 = (u) => {
  const S = shot30(u), v = (u - S.a) / Math.max(1, S.b - S.a), sv = E.smooth(v); let c;
  switch (S.id) {
    case 'macro': { const k = E.smooth(ramp(u, 72, 96)); const m = MACRO0(k); c = { ...m, look: lerp3(m.look, [X1, 2.66, -1.55], E.smooth(ramp(u, 40, 90))) }; break; }
    case 'close': { const d = lerp(1.95, 1.6, sv); c = { pos: orbit(HEAD, lerp(18, 6, sv), d, 2.6), look: [HEAD[0], 2.66, HEAD[2]], fov: 40 }; break; }
    case 'desk': c = { pos: lerp3([X1 - 3.62, 1.04, 2.4], [X1 - 3.8, 1.1, 2.24], sv), look: [DHEAD[0], 1.3, DHEAD[2]], fov: lerp(44, 40, sv) }; break;
    case 'scale': c = { pos: lerp3([X1 - 4.9, 1.45, 2.15], [X1 - 5.0, 1.38, 1.9], sv), look: [X1 - 5.62, 1.12, 0.43], fov: 44 }; break;
    case 'scale2': c = { pos: orbit(SB, lerp(-38, -26, sv), lerp(2.0, 1.75, sv), 1.12), look: [SB[0], 1.12, SB[2]], fov: 46 }; break;
    case 'studio': c = { pos: lerp3([X2 + 1.3, 1.5, 1.2], [X2 + 0.6, 1.45, 0.5], sv), look: lerp3([X2 - 0.6, 1.7, -2.4], [X2 - 0.9, 1.6, -2.0], sv), fov: 46 }; break;
    case 'host': c = { pos: orbit([HOST[0], 0, HOST[2]], lerp(-24, -10, sv), lerp(1.9, 1.6, sv), 1.15), look: [HOST[0] - 0.25, 1.75, HOST[2] - 0.4], fov: 44 }; break;
    case 'tower': { const k = E.smooth(ramp(u, 545, 600)); c = { pos: lerp3([X1 - 1.45, 1.05, -1.35], [X1 - 1.4, 0.75, -1.05], sv), look: lerp3([TP[0], 1.15, TP[2]], [TP[0] - 0.3, 3.2, -4.9], k), fov: 44 }; break; }
    case 'print': { const p = lerp3([X1 - 3.2, 1.3, -5.0], [X1 - 3.3, 1.25, -1.8], sv); c = { pos: p, look: [X1 - 5.3, 1.0, p[2] - 0.9], fov: 46 }; break; }
    case 'race': { const m = runAt(u, 0); c = { pos: lerp3([X3 + 1.6, 0.9, 3.4], [X3 + 1.9, 0.9, 2.2], sv), look: [m[0] - 0.2, 0.95, m[2]], fov: 44 }; break; }
    case 'clock': c = { pos: lerp3([X3 - 1.4, 2.6, -1.95], [X3 - 1.45, 2.62, -2.2], sv), look: [X3 - 1.5, 2.65, -3.14], fov: 40 }; break;
    case 'shut': c = { pos: lerp3([X3 - 0.15, 1.1, -0.95], [X3 - 0.2, 1.1, -1.15], sv), look: [X3 - 0.3, 1.2, -2.6], fov: 44 }; break;
    case 'left': c = { pos: lerp3([X3 + 1.55, 1.15, 1.6], [X3 + 1.2, 1.75, 2.6], sv), look: lerp3([X3 + 1.85, 0.95, 0.5], [X3 + 2.2, 0.6, 0.3], sv), fov: 44 }; break;
    case 'find': c = { pos: lerp3([X1 + 1.55, 1.35, 1.45], [X1 + 1.3, 1.3, 1.15], sv), look: [FP[0] - 0.05, 0.95, FP[2] - 0.1], fov: 44 }; break;
    case 'win': c = { pos: orbit([FP[0], 0, FP[2]], lerp(28, 8, sv), lerp(1.9, 1.6, sv), 0.75), look: [FP[0], 1.25, FP[2]], fov: 46 }; break;
    case 'fbi': c = { pos: lerp3([X4 - 2.05, 1.38, 1.15], [X4 - 2.3, 1.32, 0.7], sv), look: lerp3([X4 - 2.5, 1.2, -1.5], [X4 - 2.25, 1.2, -1.5], sv), fov: 46 }; break;
    case 'rules': { const k = E.smooth(ramp(u, 1172, 1188)); c = { pos: lerp3([X4 + 2.95, 1.25, 0.05], [X4 + 2.75, 1.3, 0.55], k), look: lerp3([X4 + 2.45, 0.92, -0.9], [X4 + 2.4, 1.3, -1.6], k), fov: 44 }; break; }
    case 'loop': { const k = E.smooth(ramp(u, 1196, 1256)); c = { pos: lerp3([X1 + 0.4, 2.45, 1.7], MACRO0(0).pos, k), look: lerp3([X1, 2.62, -1.55], MACRO0(0).look, k), fov: 40 }; break; }
  }
  // whip-pans out of / into shots
  const wi = WHIPS.indexOf(S.b + 1), wo = WHIPS.indexOf(S.a);
  if (wi >= 0 && u > S.b - 7) c.look = yawLook(c.pos, c.look, (wi % 2 ? -55 : 55) * E.easeIn(ramp(u, S.b - 7, S.b + 1)));
  if (wo >= 0 && u < S.a + 9) c.look = yawLook(c.pos, c.look, -(wo % 2 ? -55 : 55) * (1 - E.easeOut(ramp(u, S.a, S.a + 9))));
  c.shadowAt = c.look; return c;
};
export const camAt = (f) => cam30(f / 2);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const u = f / 2, S = shot30(u), C = cam30(u), at = (p, k) => ({ focus: dist(C.pos, p), cinf: k });
  switch (S.id) {
    case 'macro': { const h0 = heroAt(u), h = [h0[0] + X1, h0[1], h0[2]], k = E.smooth(ramp(u, 44, 62)); return { focus: lerp(dist(C.pos, h), dist(C.pos, HEAD), k), cinf: lerp(34, 12, k) }; }
    case 'close': return at(HEAD, 13);
    case 'desk': return at(DHEAD, 11);
    case 'scale': return at([SB[0], 1.2, SB[2]], 12);
    case 'scale2': return at([SB[0], 1.2, SB[2]], 16);
    case 'studio': return at([HOST[0], 1.4, HOST[2]], 10);
    case 'host': return at([HOST[0], 1.6, HOST[2]], 12);
    case 'tower': return at([TP[0], 1.2, TP[2]], 9);
    case 'print': return at([X1 - 5.05, 1.0, lerp(-5.0, -1.8, E.smooth((u - 610) / 76)) - 0.9], 12);
    case 'race': { const m = runAt(u, 0); return at([m[0], 1.0, m[2]], 10); }
    case 'clock': return at([X3 - 1.5, 2.65, -3.14], 14);
    case 'shut': return at([X3 - 0.3, 1.25, -2.5], 12);
    case 'left': return at([X3 + 1.85, 0.9, 0.6], 10);
    case 'find': return at([FP[0], 1.0, FP[2]], 13);
    case 'win': return at([FP[0], 1.3, FP[2]], 12);
    case 'fbi': return at([lerp(X4 - 2.8, X4 - 2.2, (u - 1019) / 118), 1.2, -1.5], 11);
    case 'rules': return at([X4 + 2.45, 1.0, -1.0], 12);
    case 'loop': return at(HEAD, 12);
  }
  return { focus: 10, cinf: 0 }; };
export const worldAt = (f) => {
  const u = f / 2, S = shot30(u), W = { candles: 0, labFill: 0, bags: 0, hot: 0, hr: false, stu: false, sau: false };
  W.ware = S.light === 'warm' || S.light === 'night'; W.tvs = S.light === 'tvs'; W.gas = S.light === 'gas'; W.off = S.light === 'off'; W.ft = u; W.winK = 1; W.drum = q(u / 30, 3);
  if (['macro', 'close', 'loop'].includes(S.id)) { W.rain = q(u / 30, 3); W.glow = 1; }
  if (S.id === 'macro' && u < 74) W.hero = heroAt(u).map((x) => q(x, 4));
  if (S.id === 'loop' && u > 1200) W.hero = heroAt(u - 1257).map((x) => q(x, 4));
  if (S.light === 'night') W.lnight = 1;
  if (S.id === 'scale' || S.id === 'scale2') { const bs = q(E.easeIn(ramp(u, 256, 265)), 3); W.bag = bs; const k = ramp(u, 265, 296); const el = k <= 0 ? 0 : 1 - Math.cos(k * 9) * Math.exp(-k * 4.5);
    W.tip = q(lerp(-0.25, 1.0, el), 3); }
  if (S.id === 'host') W.rack = q(6 * ramp(u, 452, 505), 2); else if (S.id === 'studio') W.rack = 0;
  if (S.id === 'tower') W.tower = 1;
  if (S.id === 'print') W.noBoxes = 1;
  if (S.id === 'race') { W.clock = 0.8; W.noPumps = true; }
  if (S.id === 'clock') W.clock = q(0.86 + 0.14 * E.smooth(ramp(u, 737, 750)), 3);
  if (S.id === 'shut') { W.clock = 1; W.shut = q(E.easeIn(ramp(u, 755, 764)), 3); }
  if (S.id === 'left') { W.left = 1; W.shut = 1; W.noPumps = true; }
  if (S.id === 'rules') { const up = ramp(u, 1150, 1170), dn = ramp(u, 1170, 1176); W.bookY = q(0.24 * E.easeOut(up) * (1 - dn), 3); }
  return W;
};
// ---------------- cast ----------------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o) + (extra.roll || 0), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
export const actorsAt = (f, T) => {
  const u = f / 2, S = shot30(u), out = [], uq = Math.floor(u);
  const I = (seed) => { const i = idle(uq, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const who = (k, o, pos, seed, extra) => out.push(R(T, k, { seed, blink: blinkAt(uq, seed), ...I(seed), ...o }, pos, extra));
  const man = (o, pos = [MP[0], MP[1], MP[2]], extra = {}) => who('mandel', { L: 'hang', R: 'hang', expr: 'neutral', look: 0, ...o }, pos, 23, { s: 0.92, ground: pos[1], ...extra });
  const pers = (k, seed, o, pos, s = 0.88, extra = {}) => who(k, { L: 'hang', R: 'hang', expr: 'neutral', look: 0, ...o }, pos, seed, { s, ground: pos[1], ...extra });
  switch (S.id) {
    case 'macro': man({ L: 'up', R: 'up', expr: 'laugh', look: 0.1, tool: 'tick' }); break;
    case 'close': { const w = u >= 131 && u < 143; man({ L: 'hip', R: 'up', tool: 'tick', expr: w ? 'wink' : u < 118 ? 'laugh' : 'smug', look: u < 118 ? 0.1 : 0.45, blink: w ? 0 : blinkAt(uq, 23) }); break; }
    case 'desk': { const e = u >= 172; man({ L: 'hip', R: e ? 'up' : 'hang', expr: e ? 'eureka' : 'squint', look: e ? 0 : -0.35, blink: e ? 0 : blinkAt(uq, 23) }, DP, { ground: 0 }); break; }
    case 'studio': case 'host': pers('hostT', 91, { L: u < 470 ? 'hip' : 'up', R: u < 470 ? 'point' : 'up', expr: u < 470 ? 'grin' : 'laugh', look: 0.5 }, HOST, 0.9); break;
    case 'tower': man({ L: 'hip', R: 'cheek', expr: u < 560 ? 'squint' : 'nervous', look: -0.2 }, TP, { ground: 0 }); break;
    case 'print': pers('workA', 93, { L: 'grab', R: 'grab', gx: 0.35, gy: 0.3, expr: 'grin', look: 0.6 }, [X1 - 5.05, 0, -3.9]); pers('workB', 95, { L: 'hip', R: 'tray', expr: 'smile', look: 0.5 }, [X1 - 5.0, 0, -2.75]); break;
    case 'race': pers('courA', 97, { L: 'grab', R: 'grab', gx: 0.2, gy: 0.35, tool: 'boxT', expr: 'nervous', look: 0.4, step: q((u * 0.16) % 1, 2) }, runAt(u, 0));
      pers('courB', 99, { L: 'grab', R: 'grab', gx: 0.2, gy: 0.35, tool: 'boxT', expr: 'nervous', look: 0.4, step: q((u * 0.16 + 0.5) % 1, 2) }, runAt(u - 6, -0.9)); break;
    case 'clock': break;
    case 'shut': pers('courA', 97, { L: 'grab', R: 'grab', gx: 0.2, gy: 0.35, tool: 'boxT', expr: u > 762 ? 'shock' : 'nervous', look: 0.0 }, [X3 - 0.3, 0, -2.5]); break;
    case 'left': pers('courB', 99, { L: 'belly', R: 'cheek', expr: 'sick', look: -0.3, tilt: -5 }, [X3 + 1.75, 0, 0.6]); break;
    case 'find': { const got = u >= 925; man({ L: 'hip', R: 'grab', gx: 0.3, gy: 0.2, tool: got ? 'tick' : 'mag', glowT: got, expr: got ? 'eureka' : 'squint', look: -0.3 }, FP, { ground: 0 }); break; }
    case 'win': man({ L: 'up', R: 'up', tool: 'tick', glowT: true, expr: 'laugh', look: 0 }, FP, { ground: 0, y: 0.18 * Math.max(0, Math.sin(clamp((u - 975) / 14, 0, 1) * Math.PI)) }); break;
    case 'fbi': { const shrug = u > 1108; pers('agentA', 101, { L: shrug ? 'up' : 'hip', R: shrug ? 'up' : 'grab', gx: 0.3, gy: 0.2, tool: shrug ? undefined : 'mag', expr: shrug ? 'nervous' : 'stern', look: 0.4 }, [X4 - 2.8, 0, -1.5], 0.9);
      pers('agentB', 103, { L: shrug ? 'up' : 'cross', R: shrug ? 'up' : 'cross', expr: shrug ? 'nervous' : 'stern', look: -0.4 }, [X4 - 1.8, 0, -1.55], 0.9); break; }
    case 'rules': { const sk = q(ramp(u, 1164, 1176), 2); pers('offc', 105, { L: 'hip', R: u < 1150 ? 'hang' : 'slam', sk, expr: u < 1176 ? 'stern' : 'sly', look: 0.2 }, [X4 + 2.4, 0, -1.6], 0.9); break; }
    case 'loop': man({ L: u < 1232 ? 'hip' : 'up', R: 'up', tool: 'tick', expr: u < 1232 ? 'smug' : 'laugh', look: u < 1232 ? 0.4 : 0.1 }); break;
  }
  return out;
};
// ---------------- fx ----------------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const FXc = (key, draw, pos, s, extra = {}) => FX(key, draw, [pos[0], pos[1] - 1.125 * s, pos[2]], s, extra);
const pop = (t) => q(t < 6 ? E.easeOut(t / 6) * 1.18 : 1 + 0.18 * Math.max(0, 1 - (t - 6) / 6) * Math.cos((t - 6) * 0.9), 3);
// lightbulb emote
const bulb = (k, t) => (p) => { const g = p.g; g.save(); g.translate(300, 520); g.scale(k, k); g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = '#ffe27a'; g.shadowBlur = 50; g.fillStyle = '#ffe680'; g.beginPath(); g.arc(0, -40, 105, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#fff6c0'; g.beginPath(); g.ellipse(-35, -80, 26, 38, -0.5, 0, 7); g.fill();
  g.strokeStyle = '#1e1e24'; g.lineWidth = 12; g.beginPath(); g.arc(0, -40, 105, 0.75, Math.PI - 0.75, true); g.lineTo(-48, 95); g.lineTo(48, 95); g.closePath(); g.stroke();
  g.fillStyle = '#9aa0aa'; g.fillRect(-50, 95, 100, 52); g.strokeRect(-50, 95, 100, 52); g.beginPath(); g.moveTo(-50, 112); g.lineTo(50, 112); g.moveTo(-50, 130); g.lineTo(50, 130); g.stroke();
  g.strokeStyle = '#ffb020'; g.lineWidth = 9; g.beginPath(); g.moveTo(-28, 40); g.lineTo(-14, -10); g.lineTo(0, 30); g.lineTo(14, -10); g.lineTo(28, 40); g.stroke();
  g.strokeStyle = '#ffd23f'; g.lineWidth = 14; const L = 40 + 14 * Math.sin(t * 0.6); for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.08 + 0.84 * i / 6); g.beginPath(); g.moveTo(Math.cos(a) * 140, -40 + Math.sin(a) * 140); g.lineTo(Math.cos(a) * (140 + L), -40 + Math.sin(a) * (140 + L)); g.stroke(); }
  g.restore(); };
// "?" / "!" emote marks (bold cartoon glyph with ink outline)
const mark = (ch, col, k, rot) => (p) => { const g = p.g; g.save(); g.translate(300, 500); g.rotate(rot); g.scale(k, k); g.font = '900 300px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = '#1e1e24'; g.strokeText(ch, 0, 0); g.fillStyle = col; g.fillText(ch, 0, 0); g.restore(); };
const confetti = (k) => (p) => { const g = p.g; g.save(); const cols = ['#ff4a5a', '#ffd23f', '#3ab0ff', '#5adf6a', '#ff8a2a', '#c86aff']; for (let i = 0; i < 70; i++) { const r1 = (i * 0.618) % 1, r2 = (i * 0.383) % 1; const x = 300 + (r1 - 0.5) * 560 * (0.4 + k), y = 120 + (k * 1.2 + r2) % 1 * 820; g.save(); g.translate(x, y); g.rotate(k * 9 + i); g.fillStyle = cols[i % 6]; g.fillRect(-9, -5, 18, 10); g.restore(); } g.restore(); };
export const fxAt = (f, T) => { const u = f / 2, S = shot30(u), out = [];
  if (S.id === 'desk' && u >= 174) { const t = u - 174, k = pop(t); out.push(FXc('bulb' + k + Math.round(t), bulb(k, t), [DHEAD[0] + 0.02, DHEAD[1] + 0.45, DHEAD[2] + 0.05], 0.28, { order: 7 })); }
  if (S.id === 'shut' && u >= 763) { const t = u - 763, k = pop(t); out.push(FXc('ex' + k, mark('!', '#ff4a4a', k, 0.12), [X3 - 0.58, 1.45, -2.42], 0.2, { order: 7 })); }
  if (S.id === 'fbi' && u >= 1110) { const t = u - 1110; out.push(FXc('qa' + pop(t), mark('?', '#ffd23f', pop(t), -0.15), [X4 - 2.8, 1.72, -1.45], 0.22, { order: 7 }));
    if (t >= 4) out.push(FXc('qb' + pop(t - 4), mark('?', '#ffd23f', pop(t - 4), 0.15), [X4 - 1.8, 1.72, -1.5], 0.22, { order: 7 })); }
  if (S.id === 'win' && u > 945) { const k = q(ramp(u, 945, 1015), 3); out.push(FXc('cf' + k, confetti(k), [FP[0], 1.5, FP[2] + 0.4], 0.6, { order: 7 })); }
  return out; };
export const anchorsAt = () => ({});
export const overlayInfo = (f) => ({ rain: 0, shot: shotAt(f).id, cuts: CUTS, callouts: [], pill: null, freeze: 0 });
