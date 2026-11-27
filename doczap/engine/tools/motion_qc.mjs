// DocZap Motion Engine v1 — automated movement QC (runs in node, no rendering, ~1 min).
// usage: node tools/motion_qc.mjs [web/story.js] [step]
// Evaluates every actor on every frame, runs the real character rig (roman.js) with a recording painter, and checks:
// foot sliding, stretched bones, reversed elbows/knees, sudden position jumps, channel snaps, collisions, floating.
import path from 'node:path';
const storyPath = path.resolve(process.argv[2] || 'web/story.js'), step = +(process.argv[3] || 1);
const S = await import(storyPath), toon = await import(path.join(path.dirname(storyPath), 'toon.js'));
const noop = () => {}; const g = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
const pen = new Proxy({ g, rot: null }, { get: (t, k) => (k in t ? t[k] : k === 'clip' ? (pts, fn) => fn && fn() : noop), set: (t, k, v) => { t[k] = v; return true; } });
const DPX = 0.00225, issues = [], add = (kind, f, id, msg) => issues.push({ kind, f, id, msg });
const prev = new Map(); let evals = 0; const T = { romanFront: toon.romanFront };
const SNAP = { tilt: 7, px: 14, crouch: 0.09, shrug: 0.12, chest: 0.2, look: 0.25, headTilt: 8 };
for (let f = 0; f < S.TOTAL; f += step) {
  const shot = S.shotAt(f).id, acts = S.actorsAt(f, T).filter((a) => a.opts);
  for (const a of acts) {
    evals++; const rig = {}; a.opts.rigOut = rig; a.draw(pen); delete a.opts.rigOut; const K = DPX * a.s, key = a.id + '|' + shot;
    // bones: legs never longer than the rest length; arms keep constant length within 25 % (presets) and exactly for IK arms
    for (const sd of [-1, 1]) { const L = rig.legs?.[sd]; if (!L) continue; const th = Math.hypot(L.knee[0] - L.hip[0], L.knee[1] - L.hip[1]), sn = Math.hypot(L.foot[0] - L.knee[0], L.foot[1] - L.knee[1]);
      if (th > L.LEG * 0.6 || sn > L.LEG * 0.6) add('stretched-leg', f, a.id, `thigh ${th.toFixed(0)} shin ${sn.toFixed(0)} > ${(L.LEG / 2).toFixed(0)}`);
      if ((L.knee[0] - (L.hip[0] + L.foot[0]) / 2) * sd < -2 * rig.u) add('reversed-knee', f, a.id, `side ${sd}`); }
    (rig.arms || []).forEach((pts, i) => { const up = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), lo = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]), half = rig.ARM / 2;
      const ik = (i ? a.opts.R : a.opts.L) === 'ik'; if (ik ? Math.abs(up - half) > half * 0.03 || Math.abs(lo - half) > half * 0.03 : up > half * 1.45 || lo > half * 1.45) add('arm-length', f, a.id, `${i ? 'R' : 'L'} ${up.toFixed(0)}/${lo.toFixed(0)} vs ${half.toFixed(0)}`); });
    // feet: world position of each planted foot
    const feet = [-1, 1].map((sd) => { const L = rig.legs?.[sd]; if (!L) return null; const lifted = L.foot[1] < 975 - 4 * rig.u - 0.5; return { x: a.x + (L.foot[0] - 300) * K, lifted }; });
    const P = prev.get(key);
    if (P && P.f === f - step) {
      feet.forEach((ft, j) => { const pf = P.feet[j]; if (ft && pf && !ft.lifted && !pf.lifted) { const d = Math.abs(ft.x - pf.x); if (d > 0.004 * step) add('foot-slide', f, a.id, `${j ? 'R' : 'L'} foot moved ${(d * 1000).toFixed(1)} mm while planted`); } });
      const dp = Math.hypot(a.x - P.x, a.z - P.z); if (dp > 0.06 * step && !feet.some((x) => x && x.lifted)) add('position-jump', f, a.id, `${(dp * 100).toFixed(1)} cm in one frame`);
      for (const k in SNAP) { const d = Math.abs((a.opts[k] || 0) - (P.o[k] || 0)); if (d > SNAP[k] * step) add('snap', f, a.id, `${k} jumped ${d.toFixed(2)}`); }
    }
    if (a.y > a.ground + 0.002 && !a.opts.sit && !a.hop) add('floating', f, a.id, `${((a.y - a.ground) * 100).toFixed(1)} cm above the floor`);
    prev.set(key, { f, x: a.x, z: a.z, feet, o: { ...a.opts } });
  }
  for (let i = 0; i < acts.length; i++) for (let j = i + 1; j < acts.length; j++) { const d = Math.hypot(acts[i].x - acts[j].x, acts[i].z - acts[j].z); if (d < 0.32 * Math.min(acts[i].s, acts[j].s)) add('collision', f, acts[i].id + '+' + acts[j].id, `${(d * 100).toFixed(0)} cm apart`); }
}
const by = {}; for (const x of issues) (by[x.kind] = by[x.kind] || []).push(x);
console.log(`Motion QC: ${evals} character-frames checked (${S.TOTAL} frames, step ${step}).`);
if (!issues.length) console.log('PASS: no movement defects found.');
for (const k in by) { const l = by[k], ids = [...new Set(l.map((x) => x.id))]; console.log(`FAIL ${k}: ${l.length} frames [${ids.join(', ')}]  e.g. f${l[0].f} ${l[0].id}: ${l[0].msg}` + (l.length > 1 ? ` | f${l[l.length - 1].f} ${l[l.length - 1].msg}` : '')); }
process.exitCode = issues.length ? 1 : 0;
