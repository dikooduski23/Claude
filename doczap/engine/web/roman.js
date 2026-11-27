FACE.smug = { eye: ["lid", "lid"], brow: [-2, 3], mouth: "smug" };
FACE.wink = { eye: ["squeeze", "happy"], brow: [-3, -2], mouth: "grin" };
FACE.eureka = { eye: ["shock", "shock"], brow: [-4, -4], mouth: "O" };
FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };
FACE.disgust = { eye: ["squeeze", "slit"], brow: [4, -3], mouth: "wave" };
FACE.gulp = { eye: ["shock", "shock"], brow: [-2, -3], mouth: "O" };
FACE.sly = { eye: ["slit", "slit"], brow: [-2, 3], mouth: "smirk" };
FACE.sick = { eye: ["lid", "lid"], brow: [-3, 2], mouth: "frown" };
// ---- engine kit expressions (Nov 2026; see docs/ENGINE.md) ----
FACE.angry = { eye: ["angry", "angry"], brow: [7, -4], mouth: "snarl" };      // toothy anger
FACE.furious = { eye: ["angry", "angry"], brow: [9, -6], mouth: "roar" };     // + face floods red/purple (flush) + veins
FACE.cry = { eye: ["cry", "cry"], brow: [-4, 4], mouth: "wail" };
FACE.sleepy = { eye: ["sleepy", "sleepy"], brow: [1, 2], mouth: "o" };
FACE.yawn = { eye: ["dash", "dash"], brow: [-3, 1], mouth: "yawn" };
FACE.sideeye = { eye: ["side", "side"], brow: [1, -3], mouth: "smug" };     // smug side-eye (pupils follow opts.look sign)
FACE.scared = { eye: ["tiny", "tiny"], brow: [-6, 3], mouth: "chatter" };
FACE.unimpressed = { eye: ["lid", "lid"], brow: [1, 1], mouth: "flat" };

// ---------------- engine kit: hats, beards, outfit patterns, face flush ----------------
const ringFill = (p, outer, inner, fill, ow) => { const g = p.g, tr = (r) => r.forEach(([x0, y0], i) => { const [x, y] = p.P(x0, y0); i ? g.lineTo(x, y) : g.moveTo(x, y); }) || g.closePath();
  g.beginPath(); tr(outer); tr([...inner].reverse()); g.fillStyle = fill; g.fill("evenodd"); if (ow) { g.lineWidth = ow; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); } };
const HATCOL = { tricorn: "#1e1e26", brim17: "#2a2420", crown: "#f2c230", helmet: "#a9b0b8", cowboy: "#9a6434", tophat: "#2a2630", hood: "#5a4a8a", turban: "#f0ece0", soldier: "#3a5a8a", hardhat: "#f2c230" };
/** parts of a hat drawn BEHIND the head (hood cowl, crown velvet) */
const hatBack = (p, kind, O, H, cx, hc, u, light, thick, ow) => {
  const col = O.hatCol || HATCOL[kind];
  if (kind === "hood") { const hb = blobPts(cx, hc - 2 * u, { ...H, a: H.a * 1.24, b: H.b * 1.2, egg: 0.06, asym: 0, noise: 0.01, seed: H.seed + 31 });
    const drape = [[cx - 1.18 * H.a, hc + 0.3 * H.b], [cx + 1.18 * H.a, hc + 0.3 * H.b], [cx + 1.05 * H.a, hc + 1.55 * H.b], [cx - 1.05 * H.a, hc + 1.55 * H.b]];
    p.gradFill(drape, mul(col, [0.8, 0.8, 0.85]), mul(col, [0.55, 0.55, 0.65]), light); p.poly(drape, null, ow * 0.8);
    p.shadedFill(hb, col, mul(col, [0.6, 0.6, 0.7]), light, H.a * 1.2); p.inkRing(hb, ow, thick); }
};
/** hats drawn in FRONT, always seated above the brows (brim line = hc - 29u; brows live at hc-14u..hc-26u) */
const hatFront = (p, kind, O, H, cx, hc, u, light, thick, ow) => {
  const col = O.hatCol || HATCOL[kind], band = O.hatBand, by = hc - 29 * u, sag = (y, w, d = 3) => (t) => [cx + w * t, y + d * u * (1 - t * t)];
  const curve = (f, n = 14) => { const r = []; for (let i = 0; i <= n; i++) r.push(f(i / n * 2 - 1)); return r; };
  const shade = (pts, c, R) => { p.shadedFill(pts, c, mul(c, [0.62, 0.62, 0.72]), light, R, 0.4); p.inkRing(pts, ow * 0.9, thick); };
  switch (kind) {
    case "crown": { const w = 40 * u, h = 34 * u, tips = 5, top = [];
      const vel = ellPts(cx, by - 18 * u, 32 * u, 16 * u, 180, 360, 0, 24); p.poly([...vel, [cx + 32 * u, by - 6 * u], [cx - 32 * u, by - 6 * u]], O.hatBand || "#b8202e", ow * 0.7);
      for (let i = 0; i <= tips * 2; i++) { const t = i / (tips * 2) * 2 - 1, up = i % 2 === 0; top.push([cx + t * w * (up ? 1.04 : 1), by - 9 * u - (up ? h - 9 * u - 3 * u * Math.abs(t) : 2 * u) + 2 * u * t * t]); }
      const pts = [...curve(sag(by, w, 3)).reverse(), ...top]; shade(pts, col, w);
      p.band(curve(sag(by - 5 * u, w * 0.99, 3)), mul(col, [1.05, 0.95, 0.8]), 2.4 * u, 1 * u);
      for (let i = 0; i <= tips * 2; i += 2) p.ell(top[i][0], top[i][1] - 2.5 * u, 3.4 * u, 3.4 * u, "#fff6d8", 1.4 * u);
      [["#d0283a", 0], ["#2a6ad0", -0.55], ["#2aa05a", 0.55]].forEach(([c, t]) => p.ell(cx + t * w, by - 4 * u + 3 * u * (1 - t * t), 4 * u, 3.4 * u, c, 1.4 * u));
      break; }
    case "helmet": { const top = hc - H.b - 6 * u, w = 47 * u;
      const dome = [...curve(sag(by + 1 * u, w, 3)).reverse(), ...ellPts(cx, by, w, by - top, 180, 360, 0, 30)];
      shade(dome, col, w); p.clip(dome, () => { p.stroke(ellPts(cx - 14 * u, by - 22 * u, 12 * u, 10 * u, 200, 290, 0, 12), 4 * u, "rgba(255,255,255,.55)"); p.stroke([[cx, top + 2 * u], [cx, by]], 2.4 * u, mul(col, [0.7, 0.7, 0.75])); });
      const rim = [...curve(sag(by - 3 * u, w * 1.12, 3)), ...curve(sag(by + 4 * u, w * 1.12, 3.5)).reverse()]; p.poly(rim, mul(col, [0.85, 0.85, 0.9]), ow * 0.85);
      for (let i = -3; i <= 3; i++) { const t = i / 3.5; p.dot(cx + t * w, by - 7 * u + 3 * u * (1 - t * t), 1.9 * u, "#5a6068"); }
      if (O.plume) { const pl = [[cx - 3 * u, top + 2 * u], [cx + 3 * u, top + 2 * u], [cx + 26 * u, top - 22 * u], [cx + 4 * u, top - 34 * u], [cx - 10 * u, top - 18 * u]]; p.poly(pl, O.plume, ow * 0.7); }
      break; }
    case "hardhat": { const top = hc - H.b - 4 * u, w = 44 * u; // construction hard hat: dome, centre ridge, full brim with a peak
      const dome = [...curve(sag(by + 1 * u, w, 3)).reverse(), ...ellPts(cx, by, w, by - top, 180, 360, 0, 30)];
      shade(dome, col, w); p.clip(dome, () => { p.band([[cx, top - 2 * u], [cx, by + 2 * u]], mul(col, [0.82, 0.8, 0.7]), 7 * u, 0); p.stroke(ellPts(cx - 15 * u, by - 20 * u, 11 * u, 9 * u, 200, 290, 0, 12), 4 * u, "rgba(255,255,255,.6)"); });
      const brim = [...curve((t) => [cx + w * 1.22 * t, by - 4 * u + 3 * u * (1 - t * t)]), ...curve((t) => [cx + w * 1.22 * t, by + 3 * u + 6 * u * (1 - t * t)]).reverse()];
      shade(brim, mul(col, [0.92, 0.9, 0.82]), w);
      break; }
    case "cowboy": { const bw = 74 * u, cw = 31 * u, ch = 38 * u;
      const brim = [...curve((t) => [cx + bw * t, by - 2 * u + 3 * u * (1 - t * t) - 9 * u * Math.pow(Math.abs(t), 3)]), ...curve((t) => [cx + bw * 0.96 * t, by + 5 * u + 4 * u * (1 - t * t) - 9 * u * Math.pow(Math.abs(t), 3)]).reverse()];
      const crownP = [[cx - cw, by + 1 * u], [cx + cw, by + 1 * u], [cx + cw * 0.86, by - ch], [cx + cw * 0.3, by - ch - 4 * u], [cx, by - ch + 4 * u], [cx - cw * 0.3, by - ch - 4 * u], [cx - cw * 0.86, by - ch]];
      shade(crownP, col, cw); p.clip(crownP, () => p.band([[cx - cw, by - 6 * u], [cx + cw, by - 6 * u]], band || "#3a2418", 6 * u, 0));
      p.stroke([[cx - cw, by - 9 * u], [cx + cw, by - 9 * u]], 1.4 * u); p.stroke([[cx - cw, by - 3 * u], [cx + cw, by - 3 * u]], 1.4 * u);
      shade(brim, mul(col, [0.95, 0.95, 0.95]), bw);
      break; }
    case "brim17": { // 17th-century wide-brimmed felt hat: flat broad brim, rounded crown, band, optional ostrich plume
      const bw = 80 * u, cw = 32 * u, ch = 36 * u;
      const crownP = [[cx - cw, by + 1 * u], [cx + cw, by + 1 * u], [cx + cw * 0.92, by - ch * 0.7], ...ellPts(cx, by - ch * 0.7, cw * 0.92, ch * 0.42, 0, -180, 0, 16).slice(1, -1), [cx - cw * 0.92, by - ch * 0.7]];
      shade(crownP, col, cw); p.clip(crownP, () => p.band([[cx - cw, by - 6 * u], [cx + cw, by - 6 * u]], band || "#3a2418", 7 * u, 0));
      if (O.plume) { const pl = [[cx + cw * 0.5, by - 8 * u], [cx + cw * 0.95, by - ch * 0.9], [cx + cw * 1.9, by - ch * 1.05], [cx + cw * 2.5, by - ch * 0.55], [cx + cw * 2.1, by - ch * 0.2], [cx + cw * 1.5, by - ch * 0.55], [cx + cw * 0.85, by - 12 * u]];
        p.shadedFill(pl, O.plume, mul(O.plume, [0.8, 0.8, 0.85]), light, cw, 0.3); p.inkRing(pl, ow * 0.7, thick); }
      const brim = [...curve((t) => [cx + bw * t, by - 1 * u + 4 * u * (1 - t * t) - 4 * u * Math.pow(Math.abs(t), 4)]), ...curve((t) => [cx + bw * 0.97 * t, by + 6 * u + 5 * u * (1 - t * t) - 4 * u * Math.pow(Math.abs(t), 4)]).reverse()];
      shade(brim, mul(col, [1.08, 1.08, 1.08]), bw);
      break; }
    case "tricorn": { // 18th-century naval tricorne: low dome crown, brim cocked up into a wide triangle, point at the front, gold edge lace
      const cw = 30 * u, ch = 26 * u;
      const crownP = [[cx - cw, by - 4 * u], [cx + cw, by - 4 * u], ...ellPts(cx, by - 8 * u, cw, ch, 0, -180, 0, 18).slice(1, -1)];
      shade(crownP, mul(col, [0.85, 0.85, 0.9]), cw);
      const brim = [[cx - 66 * u, by - 30 * u], [cx - 34 * u, by - 18 * u], [cx, by - 22 * u], [cx + 34 * u, by - 18 * u], [cx + 66 * u, by - 30 * u],
        [cx + 50 * u, by - 6 * u], [cx + 18 * u, by + 4 * u], [cx, by + 9 * u], [cx - 18 * u, by + 4 * u], [cx - 50 * u, by - 6 * u]];
      shade(brim, col, 60 * u);
      if (band) p.stroke([[cx - 50 * u, by - 6 * u], [cx - 18 * u, by + 4 * u], [cx, by + 9 * u], [cx + 18 * u, by + 4 * u], [cx + 50 * u, by - 6 * u]], 3.2 * u, band);
      if (O.cockade) { p.ell(cx - 26 * u, by - 12 * u, 7 * u, 7 * u, O.cockade, ow * 0.6); }
      break; }
    case "tophat": { const bw = 50 * u, cw = 33 * u, ch = 62 * u;
      const cyl = [[cx - cw, by], [cx + cw, by], [cx + cw * 1.04, by - ch], [cx - cw * 1.04, by - ch]];
      shade(cyl, col, cw); p.clip(cyl, () => { p.band([[cx - cw * 1.1, by - 8 * u], [cx + cw * 1.1, by - 8 * u]], band || "#9a2030", 9 * u, 0); p.stroke([[cx - cw * 0.6, by - 14 * u], [cx - cw * 0.55, by - ch + 4 * u]], 4 * u, "rgba(255,255,255,.22)"); });
      p.stroke([[cx - cw, by - 12.5 * u], [cx + cw, by - 12.5 * u]], 1.4 * u); p.ell(cx, by - ch, cw * 1.04, 5 * u, mul(col, [1.3, 1.3, 1.3]), ow * 0.8);
      p.poly([...curve(sag(by - 3 * u, bw, 3)), ...curve(sag(by + 3 * u, bw * 0.97, 4)).reverse()], mul(col, [1.15, 1.15, 1.15]), ow * 0.85);
      break; }
    case "hood": { // the face opening frames brows-to-chin; everything outside it is cloth
      const outer = blobPts(cx, hc - 2 * u, { ...H, a: H.a * 1.24, b: H.b * 1.2, egg: 0.06, asym: 0, noise: 0.01, seed: H.seed + 31 });
      const inner = ellPts(cx, hc + 5 * u, 0.9 * H.a, 37 * u, 0, 360, 0, 48);
      ringFill(p, outer, inner, col, 0); p.inkRing(outer, ow, thick); p.poly(inner, null, ow * 0.85);
      p.clip(outer, () => p.stroke(ellPts(cx, hc + 5 * u, 0.9 * H.a + 7 * u, 44 * u, 200, 340, 0, 20), 3 * u, mul(col, [0.72, 0.72, 0.8])));
      break; }
    case "turban": { const w = 46 * u, top = hc - H.b - 18 * u;
      const dome = [...curve(sag(by + 1 * u, w, 4)).reverse(), ...ellPts(cx, by - 2 * u, w * 1.04, by - top, 180, 360, 0, 30)];
      shade(dome, col, w);
      p.clip(dome, () => { for (let i = 0; i < 5; i++) { const y = by - 3 * u - i * 9 * u; p.stroke(curve((t) => [cx + w * 1.1 * t, y - 7 * u * t - 2 * u * (1 - t * t)], 10), 1.8 * u, mul(col, [0.7, 0.68, 0.66])); } });
      p.ell(cx, by - 10 * u, 6 * u, 7 * u, band || "#d0283a", 1.8 * u); p.ell(cx - 1.5 * u, by - 12 * u, 1.8 * u, 2 * u, "#ffffff", 0);
      p.poly([[cx - 1.5 * u, by - 16 * u], [cx + 1.5 * u, by - 16 * u], [cx + 7 * u, by - 34 * u], [cx - 3 * u, by - 30 * u]], "#f6f2e6", 1.4 * u);
      break; }
    case "soldier": { const cw = 40 * u, ch = 24 * u;
      const body = [[cx - cw, by + 1 * u], [cx + cw, by + 1 * u], [cx + cw * 1.08, by - ch], [cx - cw * 1.08, by - ch]];
      shade(body, col, cw); p.clip(body, () => p.band([[cx - cw * 1.2, by - 4 * u], [cx + cw * 1.2, by - 4 * u]], band || "#b8202e", 7 * u, 0));
      p.ell(cx, by - ch, cw * 1.08, 6 * u, mul(col, [1.15, 1.15, 1.15]), ow * 0.8);
      p.poly([[cx - 30 * u, by], [cx + 30 * u, by], [cx + 24 * u, by + 7 * u], [cx - 24 * u, by + 7 * u]], "#1e1e24", ow * 0.7);
      p.ell(cx, by - 13 * u, 5 * u, 5 * u, "#e8c45a", 1.6 * u);
      break; }
  }
};
/** beards: full (default), stubble, short, long, goatee. Mouth is drawn over the beard afterwards. */
const drawBeard = (p, style, col, H, cx, hc, u, light, thick, ow, facing, seed, skin = "#f7f4ee") => {
  const lip = () => p.ell(mx, hc + 21 * u, 13 * u, 7.5 * u, skin, ow * 0.35);
  const mx = cx + 8 * u * facing, strands = (pts, y0, y1) => p.clip(pts, () => { for (let i = -4; i <= 4; i++) p.stroke([[mx + i * 9 * u, y0], [mx + i * 7 * u, y1]], 1.2 * u, "rgba(0,0,0,.18)"); });
  if (style === "stubble") { const r = (k) => { const x = Math.sin(seed * 31.7 + k * 12.9898) * 43758.5; return x - Math.floor(x); };
    const g = p.g; g.save(); g.globalAlpha = 0.5; for (let i = 0; i < 260; i++) { const a = Math.PI * (0.08 + 0.84 * r(i)), rr = 0.62 + 0.36 * r(i + 99); const x = cx + Math.cos(a) * H.a * rr * 0.95, y = hc + 0.2 * H.b + Math.sin(a) * H.b * rr * 0.85; if (Math.abs(x - mx) < 15 * u && Math.abs(y - (hc + 20 * u)) < 9 * u) continue; p.dot(x, y, 0.95 * u, col); } g.restore(); return; }
  if (style === "goatee") { const gb = blobPts(mx, hc + 0.82 * H.b, { a: 0.2 * H.a, b: 0.3 * H.b, nTop: 2.2, nBot: 1.5, egg: -0.4, asym: 0, rot: 0, noise: 0.02, seed: seed + 5 });
    p.shadedFill(gb, col, mul(col, [0.82, 0.82, 0.9]), light, 0.2 * H.a, 0.3); p.inkRing(gb, ow * 0.7, thick); return; }
  if (style === "short") { const sb = blobPts(cx + 4 * u * facing, hc + 0.74 * H.b, { a: 0.97 * H.a, b: 0.5 * H.b, nTop: 3.2, nBot: 2.0, egg: -0.12, asym: 0, rot: 0, noise: 0.012, seed: seed + 6 });
    const hb2 = blobPts(cx, hc, { ...H, a: H.a * 1.0, b: H.b * 1.0 });
    p.clip(hb2, () => { p.poly(sb, col, 0); p.poly(sb, null, ow * 0.6); }); strands(sb, hc + 0.35 * H.b, hc + H.b); lip(); return; }
  const long = style === "long", bd = blobPts(cx + 6 * u * facing, hc + (long ? 1.35 : 0.85) * H.b, { a: (long ? 0.72 : 0.62) * H.a, b: (long ? 1.35 : 0.75) * H.b, nTop: 2.4, nBot: long ? 1.3 : 1.6, egg: long ? -0.55 : -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
  p.shadedFill(bd, col, mul(col, [0.82, 0.82, 0.9]), light, 0.6 * H.a, 0.3); strands(bd, hc + 0.45 * H.b, hc + (long ? 2.6 : 1.35) * H.b); p.inkRing(bd, ow * 0.8, thick); lip();
};
/** cloth patterns clipped into a torso/dress: stripes, vstripes, plaid, checks, dots, diamonds, patches, stars */
const drawPattern = (p, P_, x0, y0, x1, y1, u) => {
  const c = P_.col || "rgba(255,255,255,.85)", c2 = P_.col2 || "rgba(0,0,0,.2)", s = (P_.scale || 1) * u;
  const R = (x, y, w, h, col) => p.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], col, 0);
  switch (P_.type) {
    case "stripes": for (let y = y0, i = 0; y < y1; y += 16 * s, i++) R(x0, y, x1 - x0, 7 * s, c); break;
    case "vstripes": for (let x = x0; x < x1; x += 14 * s) R(x, y0, 6 * s, y1 - y0, c); break;
    case "plaid": for (let x = x0; x < x1; x += 24 * s) { R(x, y0, 9 * s, y1 - y0, c2); p.stroke([[x + 16 * s, y0], [x + 16 * s, y1]], 1.4 * s, c); }
      for (let y = y0; y < y1; y += 24 * s) { R(x0, y, x1 - x0, 9 * s, c2); p.stroke([[x0, y + 16 * s], [x1, y + 16 * s]], 1.4 * s, c); } break;
    case "checks": for (let y = y0, j = 0; y < y1; y += 14 * s, j++) for (let x = x0, i = 0; x < x1; x += 14 * s, i++) if ((i + j) % 2) R(x, y, 14 * s, 14 * s, c); break;
    case "dots": for (let y = y0, j = 0; y < y1; y += 15 * s, j++) for (let x = x0 + (j % 2) * 7.5 * s; x < x1; x += 15 * s) p.ell(x, y, 3.4 * s, 3.4 * s, c, 0); break;
    case "diamonds": for (let y = y0, j = 0; y < y1; y += 18 * s, j++) for (let x = x0 + (j % 2) * 10 * s; x < x1; x += 20 * s) p.poly([[x, y - 9 * s], [x + 10 * s, y], [x, y + 9 * s], [x - 10 * s, y]], (j + Math.round(x / s)) % 2 ? c : c2, 0); break;
    case "patches": [[0.4, 0.33, "#c8a060"], [0.6, 0.58, "#6a8aa0"], [0.44, 0.8, "#a05a4a"]].forEach(([fx, fy, pc]) => { const x = x0 + (x1 - x0) * fx, y = y0 + (y1 - y0) * fy; p.poly([[x - 9 * s, y - 8 * s], [x + 10 * s, y - 9 * s], [x + 9 * s, y + 9 * s], [x - 10 * s, y + 8 * s]], P_.col || pc, 1.6 * s);
      for (let k = -2; k <= 2; k++) p.stroke([[x + k * 4 * s, y - 11 * s], [x + k * 4 * s, y - 7 * s]], 1 * s); }); break;
    case "stars": for (let y = y0, j = 0; y < y1; y += 22 * s, j++) for (let x = x0 + (j % 2) * 11 * s; x < x1; x += 22 * s) { const st = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2.4 * s : 5.6 * s; st.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } p.poly(st, c, 0); } break;
  }
};
/** face flush: colour floods up from the chin (level 0..1); 'red' | 'purple' | any css colour */
const flushHex = (c) => c === "purple" ? "#8a3aa8" : (!c || c === "red") ? "#e2323c" : c;
const drawFlush = (p, hp, H, hc, u, level, colName) => {
  const col = flushHex(colName), top = hc + H.b - level * 2.25 * H.b, g = p.g;
  p.clip(hp, () => { g.save(); g.globalAlpha = 0.07; for (let i = 0; i < 10; i++) { const y = top + (i - 9) * 1.5 * u; p.poly([[0, y], [600, y], [600, 1000], [0, 1000]], col, 0); }
    g.globalAlpha = 0.48; p.poly([[0, top + 2 * u], [600, top + 2 * u], [600, 1000], [0, 1000]], col, 0); g.restore();
    g.save(); g.globalAlpha = 0.25; p.poly([[0, hc + 0.55 * H.b], [600, hc + 0.55 * H.b], [600, 1000], [0, 1000]], mul(col, [0.6, 0.55, 0.65]), 0); g.restore(); });
};
const drawVeins = (p, cx, hc, H, u, k = 1) => { for (const [sx, sy, r] of [[0.55, -0.62, 1], [-0.62, -0.5, 0.8]]) { const x = cx + sx * H.a, y = hc + sy * H.b, s = 7 * u * r * k;
  for (const [a, b] of [[[-1, -0.25], [-0.25, -0.25]], [[-0.25, -0.25], [-0.25, -1]], [[1, 0.25], [0.25, 0.25]], [[0.25, 0.25], [0.25, 1]], [[-1, 0.25], [-0.25, 0.25]], [[-0.25, 0.25], [-0.25, 1]], [[1, -0.25], [0.25, -0.25]], [[0.25, -0.25], [0.25, -1]]])
    p.stroke([[x + a[0] * s, y + a[1] * s], [x + b[0] * s, y + b[1] * s]], 2.6 * u * r, "#b8102a"); } };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a" },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
  jurine: { tunic: "#2f6a4a", stick: true, skin: "#f7f4ee", hair: "#d8d8d8" },
  griffin: { tunic: "#8a6a44", stick: true, skin: "#f7f4ee", hair: "#3a2a20" },
  pierce: { tunic: "#4a4a5a", stick: true, skin: "#f7f4ee", hair: "#d0d0d0", moustache: "#a0a0a0" },
  kish: { tunic: "#2a7ad0", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  forss: { tunic: "#eef4fa", stick: true, skin: "#f7f4ee", hair: "#2a1e16", tie: "#c0303a" },
  nurse: { tunic: "#2f6fd0", dress: "#2f6fd0", apron: "#ffffff", stick: true, skin: "#f7f4ee", hair: "#8a4a26" },
  kane: { tunic: "#eef3f6", stick: true, skin: "#f7f4ee", hair: "#3a2a20", moustache: "#4a3424" },
  kaneOld: { tunic: "#eef3f6", stick: true, skin: "#f7f4ee", hair: "#d8d8d8", moustache: "#c8c8c8" },
  nurse2: { tunic: "#d0506a", dress: "#d0506a", apron: "#ffffff", stick: true, skin: "#f7f4ee", hair: "#3a2a20" },
  asst: { tunic: "#4aa070", stick: true, skin: "#f7f4ee", hair: "#c8862a" },
  patient: { tunic: "#e0c070", stick: true, skin: "#f7f4ee", hair: "#5a3a2a" },
  rep1: { tunic: "#7a5a3a", stick: true, skin: "#f7f4ee", hair: "#2b211c", cap: "#5a4030", tie: "#c0303a" },
  rep2: { tunic: "#3a4a7a", stick: true, skin: "#f7f4ee", hair: "#9a5228", cap: "#2a3050", tie: "#e0b04a" },
  bier: { tunic: "#2c3448", stick: true, skin: "#f7f4ee", hair: "#3a2a20", moustache: "#3a2a20", apron: "#f4f4ee" },
  hilde: { tunic: "#eef3f6", stick: true, skin: "#f7f4ee", hair: "#e0b850", tie: "#3a6ad0" },
  mom: { tunic: "#8ad0e0", stick: true, skin: "#f7f4ee", hair: "#6a3a22" },
  anest: { tunic: "#2a9a90", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  eng1: { tunic: "#e8e4d8", stick: true, skin: "#f7f4ee", hair: "#3a2a1c", tie: "#2a3a6a" },
  eng2: { tunic: "#3a5a8a", stick: true, skin: "#f7f4ee", hair: "#c8862a", tie: "#c0303a" },
  eng3: { tunic: "#6a5a4a", stick: true, skin: "#f7f4ee", hair: "#d8d8d8", moustache: "#bdbdbd", tie: "#2a2a30" },
  eng4: { tunic: "#2f8a6a", stick: true, skin: "#f7f4ee", hair: "#1e1714" },
  pass1: { tunic: "#ff8a3a", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  pass2: { tunic: "#8a5ad0", dress: "#8a5ad0", stick: true, skin: "#f7f4ee", hair: "#9a5228" },
  pass3: { tunic: "#2ab0c0", stick: true, skin: "#f7f4ee", hair: "#e0b850" },
  blagden: { tunic: "#f3e6dc", stick: true, skin: "#f7f4ee", hair: "#6a4228", shirtless: true },
  blagdenc: { tunic: "#4a3a7a", stick: true, skin: "#f7f4ee", hair: "#6a4228", collar: "#ffffff" },
  banks: { tunic: "#2a5a8a", stick: true, skin: "#f7f4ee", wig: "#e8e2d4", collar: "#ffffff" },
  solander: { tunic: "#7a2a2a", stick: true, skin: "#f7f4ee", wig: "#d8ccb4", collar: "#ffffff", stout: true },
  sauna: { tunic: "#f3e6dc", dress: "#ffffff", stick: true, skin: "#f7f4ee", hair: "#2b211c", shirtless: true },
  stapp: { tunic: "#7a8a5a", stick: true, skin: "#f7f4ee", hair: "#3a2a1c", moustache: "#3a2a1c", flyhelmet: true, harness: true },
  stappdoc: { tunic: "#f4f4f0", stick: true, skin: "#f7f4ee", hair: "#3a2a1c", moustache: "#3a2a1c", tie: "#2a3a6a" },
  stappw: { tunic: "#7a8a5a", stick: true, skin: "#f7f4ee", hair: "#3a2a1c", moustache: "#3a2a1c" },
  crew1: { tunic: "#3a5a9a", stick: true, skin: "#f7f4ee", hair: "#c8862a" },
  crew2: { tunic: "#3a5a9a", stick: true, skin: "#f7f4ee", hair: "#1e1714", stout: true },
  officer: { tunic: "#2a3a6a", stick: true, skin: "#f7f4ee", hair: "#d8d8d8", tie: "#c0303a", moustache: "#bdbdbd" },
  dummy: { tunic: "#f2c230", stick: true, skin: "#f2c230", target: true },
  medic: { tunic: "#ffffff", stick: true, skin: "#f7f4ee", hair: "#9a5228", dress: "#ffffff" },
  driver2: { tunic: "#ff6a3a", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  rupert: { tunic: "#b8202e", stick: true, skin: "#f7f4ee", wig: "#2a1a14", collar: "#ffffff", moustache: "#2a1a14", brows: "#2a1a14" },
  king: { tunic: "#4a2a7a", cape: "#c0283a", stick: true, skin: "#f7f4ee", wig: "#14100e", crown: true, collar: "#ffffff", moustache: "#14100e" },
  sci1: { tunic: "#2a2a34", stick: true, skin: "#f7f4ee", wig: "#8a5a32", collar: "#ffffff" },
  sci2: { tunic: "#3a4a2a", stick: true, skin: "#f7f4ee", hair: "#c8c8c8", collar: "#ffffff" },
  sci3: { tunic: "#5a2a2a", stick: true, skin: "#f7f4ee", wig: "#d8c8a0", collar: "#ffffff", stout: true },
  sci4: { tunic: "#2a3a5a", stick: true, skin: "#f7f4ee", hair: "#1e1714", collar: "#ffffff" },
  glassm: { tunic: "#7a5a3a", apron: "#d8c8a8", stick: true, skin: "#f7f4ee", hair: "#3a2a1c" },
  driver: { tunic: "#2ab0c0", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  laennec: { tunic: "#2a3a5a", stick: true, skin: "#f7f4ee", hair: "#3a2a1c", tie: "#ffffff" },
  madame: { tunic: "#f0c8d0", dress: "#f0c8d0", stick: true, skin: "#f7f4ee", hair: "#7a4a26" },
  olddoc: { tunic: "#6a4a2a", stick: true, skin: "#f7f4ee", hair: "#e8e8e8", tie: "#ffffff" },
  oldman: { tunic: "#e8e0cc", stick: true, skin: "#f7f4ee", hair: "#b8b8b8", moustache: "#b8b8b8" },
  docA: { tunic: "#5a2a3a", stick: true, skin: "#f7f4ee", hair: "#d8d8d8", tie: "#ffffff" },
  docB: { tunic: "#2a5a3a", stick: true, skin: "#f7f4ee", hair: "#4a3020", tie: "#ffffff", moustache: "#4a3020" },
  docC: { tunic: "#4a4a6a", stick: true, skin: "#f7f4ee", hair: "#8a5a2a", tie: "#ffffff" },
  mdoc1: { tunic: "#f4f8fa", stick: true, skin: "#f7f4ee", hair: "#2b211c", steth: true, tie: "#3a8ab0" },
  mdoc2: { tunic: "#3aa0b8", stick: true, skin: "#f7f4ee", hair: "#c8862a", steth: true },
  mdoc3: { tunic: "#6a5ad0", stick: true, skin: "#f7f4ee", hair: "#5a3020", steth: true },
  mdoc4: { tunic: "#4ab07a", stick: true, skin: "#f7f4ee", hair: "#1a1a1a", steth: true },
  boss: { tunic: "#3a3f4a", stick: true, skin: "#f7f4ee", hair: "#e6e6e6", moustache: "#bdbdbd", tie: "#2a2a30" },
  spall: { tunic: "#2b3150", stick: true, skin: "#f7f4ee", hair: "#8e8e9c" },
  brother: { tunic: "#9a6234", stick: true, skin: "#f7f4ee", hair: "#3a2a20" },
  sch1: { tunic: "#c0343e", stick: true, skin: "#f7f4ee", hair: "#f2f2f2", moustache: "#9a9a9a" },
  sch2: { tunic: "#2f6ad0", stick: true, skin: "#f7f4ee", hair: "#f2f2f2" },
  sch3: { tunic: "#2f9a5c", stick: true, skin: "#f7f4ee", hair: "#f2f2f2" },
  stud1: { tunic: "#ffb12e", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  stud2: { tunic: "#e0463c", stick: true, skin: "#f7f4ee", hair: "#9a5228", dress: "#e0463c" },
  hennig: { tunic: "#7a46c8", stick: true, skin: "#f7f4ee", hair: "#3b2a20" },
  wife: { tunic: "#e0463c", stick: true, skin: "#f7f4ee", hair: "#9a5228", dress: "#e0463c" },
  nb1: { tunic: "#2f9a5c", stick: true, skin: "#f7f4ee", cap: "#2f5aa8", moustache: "#3a2a20" },
  nb2: { tunic: "#ffb12e", stick: true, skin: "#f7f4ee", hair: "#2b211c", dress: "#3f7fd8" },
  farmer: { tunic: "#3a7fd0", stick: true, skin: "#f7f4ee", cap: "#f2c84a", moustache: "#6a4020" },
  modern: { tunic: "#ff6b3a", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  ringer: { tunic: "#c0392b", stick: true, skin: "#f7f4ee", cap: "#5a3b2a", moustache: "#4a3020" },
  priest: { tunic: "#2a2632", skin: "#f3d6bb", hair: "#9a9a9a", stout: true },
  fischer: { tunic: "#33507a", skin: "#f5d0b0", hair: "#efe9dd" },
  civD: { tunic: "#b8604a", skin: "#f2c8a4", hair: "#7a4a2a", dress: "#5a7ab0" },
  stratton: { tunic: "#8a5a32", stick: true, skin: "#f7f4ee", hair: "#3a2618", moustache: "#3a2618", collar: "#ffffff", tie: "#2a3a6a" },
  strattonN: { tunic: "#f2f0ea", stick: true, skin: "#f7f4ee", hair: "#3a2618", moustache: "#3a2618" },
  asstS: { tunic: "#2f8a6a", stick: true, skin: "#f7f4ee", hair: "#c8862a", tie: "#f2c230" },
  gold: { tunic: "#34405e", stick: true, skin: "#f7f4ee", hair: "#c8562a", collar: "#ffffff", tie: "#a02a2a" },
  nurseG: { tunic: "#6aa0d8", dress: "#6aa0d8", apron: "#ffffff", stick: true, skin: "#f7f4ee", hair: "#5a3a22" },
  volA: { tunic: "#7a4a2a", stick: true, skin: "#f7f4ee", hair: "#2b211c", collar: "#ffffff", tie: "#2a3a6a", moustache: "#2b211c" },
  volB: { tunic: "#2f6a5a", stick: true, skin: "#f7f4ee", hair: "#d8d8d8", collar: "#ffffff", tie: "#e0b04a" },
  volC: { tunic: "#6a3a6a", stick: true, skin: "#f7f4ee", hair: "#9a5228", collar: "#ffffff", tie: "#ffffff" },
  crop: { tunic: "#4f7fb8", stick: true, skin: "#f7f4ee", hair: "#3a2a1c", apron: "#3a5a8a" },
  cropW: { tunic: "#d88a5a", dress: "#d88a5a", apron: "#f2ead8", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  patG: { tunic: "#f2f0ea", stick: true, skin: "#f7f4ee", hair: "#5a3a2a" },
  david: { tunic: "#2ab0a0", stick: true, skin: "#f7f4ee", hair: "#6a4426", collar: "#ffffff", glasses: true },
  mandel: { tunic: "#3a4a6a", stick: true, skin: "#f7f4ee", hair: "#2b211c", collar: "#ffffff", tie: "#d0402a" },
  workA: { tunic: "#f2c230", stick: true, skin: "#f7f4ee", hair: "#9a5228" },
  workB: { tunic: "#5ab06a", stick: true, skin: "#f7f4ee", hair: "#2b211c" },
  courA: { tunic: "#e0463c", stick: true, skin: "#f7f4ee", hair: "#3a2a1c", collar: "#ffffff", tie: "#2a3a6a" },
  courB: { tunic: "#3a8ad0", stick: true, skin: "#f7f4ee", hair: "#c8862a", collar: "#ffffff", tie: "#f2c230" },
  hostT: { tunic: "#8a3ad0", stick: true, skin: "#f7f4ee", hair: "#f2d070", collar: "#ffffff", tie: "#ffd23f" },
  agentA: { tunic: "#1e2028", stick: true, skin: "#f7f4ee", hair: "#2b211c", collar: "#ffffff", tie: "#1e2028", shades: true },
  agentB: { tunic: "#1e2028", stick: true, skin: "#f7f4ee", hair: "#9a9a9a", collar: "#ffffff", tie: "#1e2028", shades: true },
  offc: { tunic: "#6a6a72", stick: true, skin: "#f7f4ee", hair: "#d8d8d8", collar: "#ffffff", tie: "#2a5ab0", glasses: true },
  clerkA: { tunic: "#f4f4f0", stick: true, skin: "#f7f4ee", hair: "#c8862a", apron: "#e0463c" },
  clerkB: { tunic: "#3a5a8a", stick: true, skin: "#f7f4ee", hair: "#2b211c", apron: "#e0463c" },
  volR1: { tunic: "#f2c230", stick: true, skin: "#f7f4ee", hair: "#3a2a1c", apron: "#d0402a" },
  volR2: { tunic: "#5ab06a", stick: true, skin: "#f7f4ee", hair: "#d8d8d8", apron: "#d0402a" },
  volR3: { tunic: "#9a5ad0", stick: true, skin: "#f7f4ee", hair: "#c8562a", apron: "#d0402a" },
  volR4: { tunic: "#3a8ad0", stick: true, skin: "#f7f4ee", hair: "#2b211c", apron: "#d0402a" },
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
export const romanFront = (p, key, opts = {}) => {
  const O0 = typeof key === "string" ? OUTFITS[key] : key, O = opts.over ? { ...O0, ...opts.over } : O0;
  const hatK = opts.hat ?? O.hat; // engine kit hats: crown helmet cowboy tophat hood turban soldier hardhat
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300; const lerpN = (a, b, t) => a + (b - a) * t;
  const legCol = O.stick ? INK : mix(O.tunic, INK, 0.62), armCol = O.stick ? INK : mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  // ---- physical rig v3 (Nov 27 2026): pelvis shift px (design px), crouch 0..1 (pelvis drops, knees bend, feet stay planted),
  // feet offsets fL/fR [dx, lift] (design px) for planted / stepping feet, chest 0..1 (spine curls: shoulders + head drop), shrug 0..1, headDrop (head heights)
  const PX = opts.px || 0, CR = Math.max(0, opts.crouch || 0), CH_ = opts.chest || 0, SHR = opts.shrug || 0;
  const LEG0 = Math.hypot(6 * u, sole - 4 * u - (torsoBot - 0.12 * HH)), SITK = opts.sit || 0;
  // balance: if a foot is placed further than the leg can reach, the pelvis lowers (knees bend) instead of the leg stretching
  let reachDrop = 0; for (const sd of [-1, 1]) { const fo = (sd < 0 ? opts.fL : opts.fR) || [0, 0], ddx = (cx + sd * 22 * u + (fo[0] || 0)) - (cx + sd * 16 * u + (opts.px || 0)), ddy = sole - 4 * u - (fo[1] || 0) - hipY;
    const need = Math.sqrt(Math.max(0, (LEG0 * 0.985) ** 2 - ddx * ddx)); reachDrop = Math.max(reachDrop, ddy - need); }
  const DROP = CR * 0.2 * HH + SITK * 0.45 * LEG0 + Math.max(0, reachDrop), UPY = DROP + CH_ * 0.07 * HH;
  p.rot = null;
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  const LEG = Math.hypot(6 * u, sole - 4 * u - hipY);   // rest leg length; thigh = shin = LEG/2 (constant bone lengths)
  for (const side of [-1, 1]) {
    const fo = (side < 0 ? opts.fL : opts.fR) || [0, 0];
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0) + (fo[1] || 0);
    const hx = cx + side * 16 * u + PX, hy = hipY + DROP, fx = cx + side * 22 * u + (fo[0] || 0), fy = sole - 4 * u - up;
    // two-bone IK: the knee pushes outward and forward as the hip-to-foot distance shortens (no reversed knees, no stretching)
    const dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), LEG * 0.999), bend = Math.sqrt(Math.max(0, (LEG / 2) ** 2 - (d / 2) ** 2));
    const nx = -dy / (d || 1), ny = dx / (d || 1);
    let kx = (hx + fx) / 2 + side * Math.abs(nx) * bend * 0.4 + side * 2 * u, ky = (hy + fy) / 2 - Math.abs(ny) * bend * 0.15;   // knees travel mostly toward camera (foreshortened), a little outward
    const SIT = SITK; if (SIT > 0) { kx = lerpN(kx, hx + side * 9 * u, SIT); ky = lerpN(ky, hy + 0.06 * HH, SIT); }   // seated: knee comes toward camera (thigh foreshortened), shin down to the planted foot
    if (opts.rigOut) { (opts.rigOut.legs = opts.rigOut.legs || {})[side] = { hip: [hx, hy], knee: [kx, ky], foot: [fx, fy], LEG }; }
    p.stroke(bend > 2 * u || SIT > 0 ? [[hx, hy], [kx, ky], [fx, fy]] : curve([hx, hy], [(hx + fx) / 2 + side * 2 * u, (hy + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body (moves with the pelvis) ----
  p.g.save(); p.g.translate(PX, UPY);
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a * (1 - 0.1 * CH_), chin + 0.12 * HH - SHR * 0.09 * HH + CH_ * 0.03 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "grab": { const gx = opts.gx ?? 1, gy = opts.gy ?? 0.3; return { pts: [s, [X(14 + 20 * gx), s[1] + (0.15 + gy * 0.4) * HH], [X(24 + 46 * gx), s[1] + gy * HH]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      case "mouth": { const m = opts.mk ?? 1; return { pts: [s, [X(22), s[1] + (0.42 - 0.2 * m) * HH], [lerpN(X(30), cx + side * 9 * u, m), lerpN(s[1] + 0.35 * HH, hc + 0.3 * H.b, m)]], front: true }; }
      case "inj": { const el = [tcx - (T.a * 1.1 + 28 * u), s[1] - 0.02 * HH]; return { pts: [s, [tcx + 0.1 * T.a, s[1] + 0.42 * HH], [el[0] + 40 * u, el[1] + 2 * u]], front: true }; }
      case "tray": return { pts: [s, [X(10), s[1] + 0.45 * HH], [tcx + side * 0.55 * T.a, s[1] + 0.48 * HH]], front: true };
      case "slam": { const k = opts.sk ?? 1; return { pts: [s, [X(18), s[1] + (0.1 + 0.3 * k) * HH], [X(26), s[1] + (-0.1 + 0.62 * k) * HH]], front: true }; }
      // free arm (Nov 27 2026): opts.Lh / opts.Rh = [out, down] hand target from the shoulder (out in torso half-widths, down in head heights); elbow solved with a natural bend
      // free arm, true two-bone IK with constant bone lengths (Motion Engine v1). Target either opts.LhD/RhD = [x, y] in card design px
      // (absolute, e.g. a world contact point converted by the engine), or legacy opts.Lh/Rh = [out, down] relative to the shoulder.
      case "ik": { const D_ = side < 0 ? opts.LhD : opts.RhD; let hx, hy;
        if (D_) { const lx = D_[0] - PX, ly = D_[1] - UPY, a_ = -rad(tilt), c_ = Math.cos(a_), s_ = Math.sin(a_); hx = cx + (lx - cx) * c_ - (ly - hipY) * s_; hy = hipY + (lx - cx) * s_ + (ly - hipY) * c_; }
        else { const t = (side < 0 ? opts.Lh : opts.Rh) || [0.3, 0.9]; hx = tcx + side * T.a * (0.85 + t[0]); hy = s[1] + t[1] * HH; }
        const ARM = 0.95 * HH, half = ARM / 2; let dx = hx - s[0], dy = hy - s[1], L = Math.hypot(dx, dy) || 1;
        if (L > ARM * 0.999) { dx *= ARM * 0.999 / L; dy *= ARM * 0.999 / L; L = ARM * 0.999; } if (L < ARM * 0.18) { dx *= ARM * 0.18 / L; dy *= ARM * 0.18 / L; L = ARM * 0.18; }
        const h = Math.sqrt(Math.max(0, half * half - (L / 2) ** 2)); let px_ = -dy / L, py_ = dx / L; if (px_ * side < 0 || (Math.abs(px_) < 0.2 && py_ < 0)) { px_ = -px_; py_ = -py_; }   // elbow bends outward/down only
        const ex = s[0] + dx / 2 + px_ * h, ey = s[1] + dy / 2 + py_ * h;
        const fr = (side < 0 ? opts.LhFront : opts.RhFront) ?? (D_ ? true : (((side < 0 ? opts.Lh : opts.Rh) || [])[2] || 0) > 0);
        return { pts: [s, [ex, ey], [s[0] + dx, s[1] + dy]], front: !!fr }; }
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  // pose blending (kit/act.js, Nov 27 2026): L2/R2 = the pose being moved to, Lk/Rk = 0..1 (values a little over 1 = overshoot)
  const armB = (side, pose, pose2, k) => { const a = arm(side, pose); if (!pose2 || !k) return a; const b = arm(side, pose2);
    const pts = a.pts.map((q, i) => [q[0] + (b.pts[i][0] - q[0]) * k, q[1] + (b.pts[i][1] - q[1]) * k]); return { ...(k > 0.5 ? b : a), pts }; };
  // arm drift (Nov 27 2026): opts.Ld / opts.Rd = [dx, dy] in head heights added to ANY pose (hand fully, elbow half) so arms never freeze
  const drift = (a, d) => { if (!d) return a; const ox = d[0] * HH, oy = d[1] * HH; return { ...a, pts: [a.pts[0], [a.pts[1][0] + ox * 0.5, a.pts[1][1] + oy * 0.5], [a.pts[2][0] + ox, a.pts[2][1] + oy]] }; };
  const bone = (a, side) => { const ARM = 0.95 * HH, half = ARM / 2, [s0, e0, h0] = a.pts; let dx = h0[0] - s0[0], dy = h0[1] - s0[1], Ld = Math.hypot(dx, dy) || 1;
    const cl = Math.min(Math.max(Ld, ARM * 0.18), ARM * 0.999); dx *= cl / Ld; dy *= cl / Ld; const hgt = Math.sqrt(Math.max(0, half * half - (cl / 2) ** 2));
    let pxn = -dy / cl, pyn = dx / cl; const mx = s0[0] + dx / 2, my = s0[1] + dy / 2; if ((e0[0] - mx) * pxn + (e0[1] - my) * pyn < 0) { pxn = -pxn; pyn = -pyn; }   // keep the preset's elbow side
    return { ...a, pts: [s0, [mx + pxn * hgt, my + pyn * hgt], [s0[0] + dx, s0[1] + dy]] }; };
  const arms = [bone(drift(armB(-1, L, opts.L2, opts.Lk || 0), opts.Ld && [-opts.Ld[0], opts.Ld[1]]), -1), bone(drift(armB(1, R, opts.R2, opts.Rk || 0), opts.Rd), 1)];
  if (opts.rigOut) { const a_ = rad(tilt), c_ = Math.cos(a_), s_ = Math.sin(a_), ab = ([x, y]) => [cx + (x - cx) * c_ - (y - hipY) * s_ + PX, hipY + (x - cx) * s_ + (y - hipY) * c_ + UPY];
    opts.rigOut.arms = arms.map((a) => a.pts.map(ab)); opts.rigOut.ARM = 0.95 * HH; opts.rigOut.HH = HH; opts.rigOut.u = u; }
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, 70];
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso
  if (dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); if (O.pattern) p.clip(dp, () => drawPattern(p, O.pattern, cx - W, chin, cx + W, sole, u)); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (!dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    p.gradFill(sk, O.tunic, mul(O.tunic, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.pattern) drawPattern(p, O.pattern, tcx - 1.6 * T.a, chin - 0.3 * HH, tcx + 1.6 * T.a, torsoBot + 0.4 * HH, u);
    if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], LEATHER, 0.08 * HH, 1.5 * u);
      for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else {
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.apron ? "#5a3b2a" : "#e2c27a", 0.05 * HH, 1.2 * u);
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
      if (O.tie) p.poly([[tcx - 5 * u, chin + 0.08 * HH], [tcx + 5 * u, chin + 0.08 * HH], [tcx + 8 * u, chin + 0.62 * HH], [tcx, chin + 0.72 * HH], [tcx - 8 * u, chin + 0.62 * HH]], O.tie, 1.8 * u);
      if (O.steth) { p.stroke([[tcx - 0.42 * T.a, chin + 0.0 * HH], [tcx - 0.46 * T.a, chin + 0.45 * HH], [tcx - 0.3 * T.a, chin + 0.75 * HH]], 4.5 * u, '#3a3f48'); p.stroke([[tcx + 0.42 * T.a, chin + 0.0 * HH], [tcx + 0.46 * T.a, chin + 0.45 * HH], [tcx + 0.3 * T.a, chin + 0.62 * HH]], 4.5 * u, '#3a3f48');
        p.stroke([[tcx - 0.42 * T.a, chin], [tcx, chin - 0.04 * HH], [tcx + 0.42 * T.a, chin]], 4.5 * u, '#3a3f48'); p.ell(tcx - 0.3 * T.a, chin + 0.8 * HH, 9 * u, 9 * u, '#c8d0d8', 2.4 * u); }
      if (O.tie) for (const sd of [-1, 1]) p.stroke([[tcx + sd * 0.18 * T.a, chin + 0.02 * HH], [tcx + sd * 0.42 * T.a, chin + 0.7 * HH]], 2.2 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front) drawArm(a);
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    p.gradFill(sp, "#c0302c", "#7d1d22", light);
    p.clip(sp, () => {
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
  }
  // hand-held tools (right hand)
  const drawTool = () => {
  if (opts.tool) { const [hx, hy] = arms[1].pts[2]; const g = p.g; g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    if (opts.tool === 'scalpel') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.5); g.fillStyle = '#5a3a20'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-4 * u, -2 * u, 8 * u, 26 * u, 3 * u); g.fill(); g.stroke();
      g.fillStyle = '#e8eef4'; g.beginPath(); g.moveTo(-4 * u, -2 * u); g.lineTo(4 * u, -2 * u); g.lineTo(3 * u, -26 * u); g.quadraticCurveTo(-6 * u, -16 * u, -4 * u, -2 * u); g.fill(); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 1.5 * u; g.beginPath(); g.moveTo(1 * u, -6 * u); g.lineTo(1.5 * u, -20 * u); g.stroke(); }
    if (opts.tool === 'syringe') { g.translate(hx, hy); g.rotate(opts.toolRot ?? 1.9); g.fillStyle = 'rgba(220,240,255,.9)'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-5 * u, -10 * u, 10 * u, 34 * u, 2 * u); g.fill(); g.stroke();
      g.fillStyle = '#ffd23f'; g.fillRect(-3.5 * u, 4 * u, 7 * u, 18 * u); g.beginPath(); g.moveTo(0, 24 * u); g.lineTo(0, 40 * u); g.lineWidth = 1.6 * u; g.stroke(); g.lineWidth = 2.4 * u; g.beginPath(); g.moveTo(-8 * u, -10 * u); g.lineTo(8 * u, -10 * u); g.moveTo(0, -10 * u); g.lineTo(0, -20 * u); g.moveTo(-6 * u, -20 * u); g.lineTo(6 * u, -20 * u); g.stroke(); }
    if (opts.tool === 'paper') { g.translate(hx, hy); g.rotate(opts.toolRot ?? 0); g.fillStyle = '#f6f2e6'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-8 * u, -30 * u, 16 * u, 60 * u, 4 * u); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-8 * u, -10 * u); g.lineTo(8 * u, -6 * u); g.stroke(); }
    if (opts.tool === 'sheet') { g.translate(hx, hy - 10 * u); g.rotate(opts.toolRot ?? -0.15); g.fillStyle = '#f6f2e6'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.rect(-24 * u, -32 * u, 48 * u, 62 * u); g.fill(); g.stroke(); g.strokeStyle = 'rgba(40,40,60,.35)'; g.lineWidth = 1.5 * u; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-18 * u, (-22 + k * 9) * u); g.lineTo(18 * u, (-22 + k * 9) * u); g.stroke(); } }
    if (opts.tool === 'woodtube') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.3); g.fillStyle = '#c08a4a'; g.strokeStyle = INK; g.lineWidth = 2.6 * u; g.beginPath(); g.moveTo(-7 * u, -44 * u); g.lineTo(7 * u, -44 * u); g.lineTo(9 * u, 30 * u); g.lineTo(16 * u, 40 * u); g.lineTo(-16 * u, 40 * u); g.lineTo(-9 * u, 30 * u); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-4 * u, -40 * u, 3 * u, 66 * u); }
    if (opts.tool === 'hammer') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.4); g.fillStyle = '#8a5a30'; g.strokeStyle = INK; g.lineWidth = 2.6 * u; g.beginPath(); g.roundRect(-4 * u, -50 * u, 8 * u, 62 * u, 3 * u); g.fill(); g.stroke();
      g.fillStyle = '#5a6068'; g.beginPath(); g.roundRect(-20 * u, -64 * u, 40 * u, 18 * u, 3 * u); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-16 * u, -61 * u, 30 * u, 3 * u); }
    if (opts.tool === 'trowel') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.6); g.strokeStyle = INK; g.lineWidth = 2.6 * u; g.fillStyle = '#8a5a30'; g.beginPath(); g.roundRect(-5 * u, -6 * u, 10 * u, 26 * u, 4 * u); g.fill(); g.stroke();
      g.strokeStyle = INK; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(0, -6 * u); g.lineTo(0, -16 * u); g.stroke();
      g.fillStyle = '#b8bec6'; g.beginPath(); g.moveTo(0, -14 * u); g.lineTo(-17 * u, -24 * u); g.lineTo(0, -66 * u); g.lineTo(17 * u, -24 * u); g.closePath(); g.fill(); g.lineWidth = 2.4 * u; g.stroke(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(-2 * u, -22 * u); g.lineTo(-10 * u, -26 * u); g.lineTo(-2 * u, -54 * u); g.closePath(); g.fill(); }
    if (opts.tool === 'quill') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.5); g.strokeStyle = INK; g.lineWidth = 2 * u; g.fillStyle = '#f4f0e6'; g.beginPath(); g.moveTo(0, 10 * u); g.quadraticCurveTo(-12 * u, -30 * u, 2 * u, -70 * u); g.quadraticCurveTo(12 * u, -30 * u, 0, 10 * u); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, 12 * u); g.lineTo(1 * u, -64 * u); g.stroke(); }
    if (opts.tool === 'shovel') { g.translate(hx, hy); g.rotate(opts.toolRot ?? 0.5); g.strokeStyle = INK; g.lineWidth = 2.6 * u; g.fillStyle = '#9a6a40'; g.beginPath(); g.roundRect(-3.5 * u, -70 * u, 7 * u, 90 * u, 3 * u); g.fill(); g.stroke();
      g.fillStyle = '#5a6068'; g.beginPath(); g.moveTo(-16 * u, 20 * u); g.lineTo(16 * u, 20 * u); g.lineTo(13 * u, 48 * u); g.quadraticCurveTo(0, 56 * u, -13 * u, 48 * u); g.closePath(); g.fill(); g.stroke();
      if (opts.coal) { g.fillStyle = '#1a1a1e'; for (const [x, y] of [[-6, 30], [3, 28], [8, 34], [-2, 36]]) { g.beginPath(); g.arc(x * u, y * u, 4.5 * u, 0, 7); g.fill(); } } }
    if (opts.tool === 'cast') { g.translate(hx, hy); g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 2.6 * u; g.beginPath(); g.roundRect(-12 * u, -22 * u, 24 * u, 34 * u, 8 * u); g.fill(); g.stroke(); g.strokeStyle = '#c8c8c8'; g.lineWidth = 1.6 * u; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(-11 * u, k * 8 * u - 6 * u); g.lineTo(11 * u, k * 8 * u - 2 * u); g.stroke(); } }
    if (opts.tool === 'sledge') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.4); g.fillStyle = '#8a5a30'; g.strokeStyle = INK; g.lineWidth = 2.8 * u; g.beginPath(); g.roundRect(-5 * u, -86 * u, 10 * u, 104 * u, 4 * u); g.fill(); g.stroke();
      g.fillStyle = '#4a5058'; g.beginPath(); g.roundRect(-34 * u, -108 * u, 68 * u, 30 * u, 5 * u); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-28 * u, -104 * u, 52 * u, 4 * u); }
    if (opts.tool === 'box') { g.translate(hx - 14 * u, hy - 4 * u); g.rotate(opts.toolRot ?? 0); g.fillStyle = '#7a1a3a'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-20 * u, -12 * u, 40 * u, 22 * u, 4 * u); g.fill(); g.stroke(); g.fillStyle = '#f2c230'; g.fillRect(-3 * u, -12 * u, 6 * u, 22 * u); g.strokeRect(-3 * u, -12 * u, 6 * u, 22 * u); }
    if (opts.tool === 'rod') { g.translate(hx, hy); g.rotate(opts.toolRot ?? 1.15); g.strokeStyle = INK; g.lineWidth = 9 * u; g.beginPath(); g.moveTo(0, 20 * u); g.lineTo(0, -110 * u); g.stroke(); g.strokeStyle = '#6a6e74'; g.lineWidth = 5 * u; g.stroke();
      const gr = g.createRadialGradient(0, -116 * u, 2 * u, 0, -116 * u, 22 * u); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.5, '#ffb030'); gr.addColorStop(1, '#ff5a10'); g.fillStyle = gr; g.lineWidth = 2.4 * u; g.strokeStyle = '#7a2a08'; g.beginPath(); g.ellipse(0, -118 * u, 13 * u, 15 * u, 0, 0, 7); g.fill(); g.stroke(); }
    if (opts.tool === 'pliers') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.6); g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.fillStyle = '#c0303a'; for (const sd of [-1, 1]) { g.beginPath(); g.roundRect(sd * 4 * u - 3 * u, -6 * u, 6 * u, 34 * u, 3 * u); g.fill(); g.stroke(); }
      g.fillStyle = '#8a9098'; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 1 * u, -6 * u); g.lineTo(sd * 7 * u, -6 * u); g.lineTo(sd * 2 * u, -34 * u); g.closePath(); g.fill(); g.stroke(); } }
    if (opts.tool === 'wine') { g.translate(hx, hy - 6 * u); g.fillStyle = 'rgba(230,240,255,.9)'; g.strokeStyle = INK; g.lineWidth = 2.2 * u; g.beginPath(); g.moveTo(-10 * u, -26 * u); g.lineTo(10 * u, -26 * u); g.quadraticCurveTo(10 * u, -6 * u, 0, -4 * u); g.quadraticCurveTo(-10 * u, -6 * u, -10 * u, -26 * u); g.fill(); g.stroke();
      g.fillStyle = '#a01830'; g.beginPath(); g.moveTo(-8.5 * u, -18 * u); g.lineTo(8.5 * u, -18 * u); g.quadraticCurveTo(8 * u, -7 * u, 0, -5.5 * u); g.quadraticCurveTo(-8 * u, -7 * u, -8.5 * u, -18 * u); g.fill(); g.beginPath(); g.moveTo(0, -4 * u); g.lineTo(0, 8 * u); g.moveTo(-7 * u, 8 * u); g.lineTo(7 * u, 8 * u); g.stroke(); }
    if (opts.tool === 'cigar') { g.translate(hx, hy); g.rotate(-0.3); g.fillStyle = '#7a4a26'; g.strokeStyle = INK; g.lineWidth = 2.2 * u; g.beginPath(); g.roundRect(-2 * u, -6 * u, 34 * u, 9 * u, 4 * u); g.fill(); g.stroke(); g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(32 * u, -1.5 * u, 4 * u, 0, 7); g.fill(); }
    if (opts.tool === 'baby') { g.translate(hx - 30 * u, hy - 8 * u); g.fillStyle = '#f8f4ec'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.ellipse(0, 0, 34 * u, 18 * u, -0.2, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-26 * u, -6 * u, 13 * u, 0, 7); g.fill(); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(-30 * u, -8 * u, 1.6 * u, 0, 7); g.arc(-23 * u, -8 * u, 1.6 * u, 0, 7); g.fill(); g.beginPath(); g.arc(-26.5 * u, -3 * u, 3 * u, 0.2, Math.PI - 0.2); g.stroke(); }
    if (opts.tool === 'camera') { g.translate(hx - 10 * u, hy - 12 * u); g.fillStyle = '#2a2a30'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-18 * u, -14 * u, 36 * u, 26 * u, 3 * u); g.fill(); g.stroke();
      g.fillStyle = '#9ab8d8'; g.beginPath(); g.arc(0, 0, 8 * u, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#c8c8c8'; g.beginPath(); g.moveTo(10 * u, -14 * u); g.lineTo(20 * u, -34 * u); g.lineTo(30 * u, -30 * u); g.lineTo(18 * u, -12 * u); g.fill(); g.stroke();
      if (opts.flashOn) { g.fillStyle = '#ffffff'; g.shadowColor = '#fffbe0'; g.shadowBlur = 60 * u; g.beginPath(); g.arc(25 * u, -32 * u, 16 * u, 0, 7); g.fill(); } }
    if (opts.tool === 'cup') { g.translate(hx, hy - 4 * u); g.fillStyle = '#f6f4ee'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.moveTo(-11 * u, -14 * u); g.lineTo(11 * u, -14 * u); g.lineTo(8 * u, 6 * u); g.lineTo(-8 * u, 6 * u); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#3a8ad0'; g.fillRect(-9 * u, -12 * u, 18 * u, 4 * u); g.beginPath(); g.arc(13 * u, -5 * u, 5 * u, -1.4, 1.4); g.stroke(); }
    if (opts.tool === 'ball') { g.translate(hx, hy - 6 * u); g.fillStyle = '#e8463c'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.arc(0, 0, 11 * u, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-4 * u, -4 * u, 3 * u, 0, 7); g.fill(); }
    if (opts.tool === 'boxT') { g.translate(hx - 26 * u * Math.sign(hx - cx || 1), hy - 8 * u); g.fillStyle = '#c89a6a'; g.strokeStyle = INK; g.lineWidth = 2.6 * u; g.beginPath(); g.rect(-30 * u, -22 * u, 60 * u, 40 * u); g.fill(); g.stroke(); g.fillStyle = '#fbf6ec'; for (let i = 0; i < 5; i++) { g.save(); g.translate((-20 + i * 10) * u, -24 * u); g.rotate((i - 2) * 0.2); g.fillRect(-4 * u, -6 * u, 8 * u, 10 * u); g.strokeRect(-4 * u, -6 * u, 8 * u, 10 * u); g.restore(); } g.strokeStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(-30 * u, -8 * u); g.lineTo(30 * u, -8 * u); g.stroke(); }
    if (opts.tool === 'mag') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.5); g.strokeStyle = INK; g.lineWidth = 3 * u; g.fillStyle = '#8a5a32'; g.beginPath(); g.roundRect(-3 * u, 0, 6 * u, 22 * u, 2 * u); g.fill(); g.stroke(); g.fillStyle = 'rgba(200,235,255,.55)'; g.beginPath(); g.arc(0, -14 * u, 14 * u, 0, 7); g.fill(); g.lineWidth = 4 * u; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-5 * u, -19 * u, 4 * u, 2.5 * u, -0.6, 0, 7); g.fill(); }
    if (opts.tool === 'tick') { g.translate(hx, hy - 10 * u); g.rotate(-0.2); g.fillStyle = '#fbf6ec'; g.strokeStyle = INK; g.lineWidth = 2 * u; g.beginPath(); g.rect(-12 * u, -8 * u, 24 * u, 15 * u); g.fill(); g.stroke(); g.fillStyle = '#e04a6a'; g.fillRect(-12 * u, -8 * u, 24 * u, 3.5 * u); g.fillStyle = '#1e1e28'; for (let i = 0; i < 6; i++) g.fillRect((-10 + i * 3.6) * u, -1 * u, 2.4 * u, 3 * u); if (opts.glowT) { g.shadowColor = '#ffd23f'; g.shadowBlur = 20 * u; g.strokeStyle = '#ffd23f'; g.lineWidth = 2.5 * u; g.strokeRect(-14 * u, -10 * u, 28 * u, 19 * u); } }
    if (opts.tool === 'scis') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.6); const op = opts.open ?? 0.3; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.fillStyle = '#d8dce4';
      for (const s of [-1, 1]) { g.save(); g.rotate(s * op * 0.5); g.beginPath(); g.moveTo(0, 0); g.lineTo(3 * u * s, -30 * u); g.lineTo(-1 * u * s, -30 * u); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e0463c'; g.beginPath(); g.ellipse(4 * u * s, 8 * u, 5 * u, 6.5 * u, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#d8dce4'; g.restore(); } }
    if (opts.tool === 'bstrip') { g.translate(hx - 6 * u, hy - 4 * u); g.rotate(-0.15); g.fillStyle = '#f4ecd8'; g.strokeStyle = INK; g.lineWidth = 2 * u; g.beginPath(); g.rect(-16 * u, -9 * u, 32 * u, 18 * u); g.fill(); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(-12 * u, -6 * u, 24 * u, 12 * u); g.fillStyle = '#111'; for (let i = 0; i < 9; i++) g.fillRect((-11 + i * 2.6) * u, -5 * u, (i % 3 ? 1 : 1.8) * u, 10 * u); }
    if (opts.tool === 'suitcase') { g.translate(hx, hy + 2 * u); g.fillStyle = '#d0402a'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-20 * u, 4 * u, 40 * u, 30 * u, 4 * u); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-6 * u, 4 * u); g.lineTo(-6 * u, -2 * u); g.lineTo(6 * u, -2 * u); g.lineTo(6 * u, 4 * u); g.stroke(); g.fillStyle = '#f2c230'; g.fillRect(-20 * u, 16 * u, 40 * u, 4 * u); }
    if (opts.tool === 'cup1') { g.translate(hx, hy - 6 * u); g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 2.2 * u; g.beginPath(); g.moveTo(-9 * u, -8 * u); g.lineTo(9 * u, -8 * u); g.lineTo(7 * u, 8 * u); g.lineTo(-7 * u, 8 * u); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#6a3a1a'; g.fillRect(-8 * u, -3 * u, 16 * u, 6 * u); g.fillStyle = '#d8dce4'; g.beginPath(); g.ellipse(0, -8 * u, 10 * u, 2.6 * u, 0, 0, 7); g.fill(); g.stroke(); }
    if (opts.tool === 'pill') { g.translate(hx, hy - 7 * u); g.fillStyle = '#ead6a6'; g.strokeStyle = INK; g.lineWidth = 2.2 * u; g.beginPath(); g.ellipse(0, 0, 8.5 * u, 6.5 * u, 0.3, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.75)'; for (const [x, y] of [[-3, -2], [2, -3], [3, 2]]) { g.beginPath(); g.arc(x * u, y * u, 1.2 * u, 0, 7); g.fill(); } g.fillStyle = 'rgba(120,70,40,.55)'; g.beginPath(); g.arc(-1 * u, 2 * u, 1.4 * u, 0, 7); g.fill(); }
    if (opts.tool === 'syrR') { g.translate(hx, hy); g.rotate(opts.toolRot ?? 1.57); g.fillStyle = 'rgba(230,244,255,.92)'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-5.5 * u, -8 * u, 11 * u, 34 * u, 2 * u); g.fill(); g.stroke();
      g.fillStyle = '#b01828'; const fl = opts.fill ?? 1; g.fillRect(-4 * u, 6 * u + (1 - fl) * 18 * u, 8 * u, 18 * u * fl); g.lineWidth = 1.6 * u; g.beginPath(); g.moveTo(0, 26 * u); g.lineTo(0, 44 * u); g.stroke(); g.lineWidth = 2.4 * u;
      g.beginPath(); g.moveTo(-9 * u, -8 * u); g.lineTo(9 * u, -8 * u); g.moveTo(0, -8 * u); g.lineTo(0, -20 * u + (1 - fl) * 0); g.moveTo(-6 * u, -20 * u); g.lineTo(6 * u, -20 * u); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(-3.5 * u, -5 * u, 2 * u, 26 * u); }
    if (opts.tool === 'traypills') { g.translate(hx - 30 * u * Math.sign(hx - cx || 1), hy - 2 * u); g.fillStyle = '#f8f8f4'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-34 * u, -4 * u, 68 * u, 8 * u, 2 * u); g.fill(); g.stroke(); g.strokeStyle = '#2a5aa0'; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(-32 * u, -3 * u); g.lineTo(32 * u, -3 * u); g.stroke();
      g.fillStyle = '#ead6a6'; g.strokeStyle = INK; g.lineWidth = 1.6 * u; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse((-25 + i * 10) * u, -8 * u, 4.6 * u, 3.6 * u, 0.2, 0, 7); g.fill(); g.stroke(); } }
    if (opts.tool === 'tubeh') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.2); g.fillStyle = '#d9a845'; g.strokeStyle = INK; g.lineWidth = 2.4 * u; g.beginPath(); g.roundRect(-7 * u, -34 * u, 14 * u, 40 * u, 3 * u); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-4 * u, -31 * u, 3 * u, 32 * u); g.fillStyle = '#9fc8e8'; g.beginPath(); g.ellipse(0, -34 * u, 7 * u, 3 * u, 0, 0, 7); g.fill(); g.stroke(); }
    if (opts.tool === 'jar') { g.translate(hx, hy - 16 * u); g.rotate(opts.toolRot ?? 0); g.strokeStyle = INK; g.lineWidth = 2.6 * u; const gr = g.createLinearGradient(-16 * u, 0, 16 * u, 0); gr.addColorStop(0, '#e08a52'); gr.addColorStop(0.6, '#c8642e'); gr.addColorStop(1, '#8a3e1a'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(-6 * u, -26 * u); g.lineTo(6 * u, -26 * u); g.quadraticCurveTo(8 * u, -18 * u, 15 * u, -10 * u); g.quadraticCurveTo(22 * u, 6 * u, 10 * u, 20 * u); g.lineTo(-10 * u, 20 * u); g.quadraticCurveTo(-22 * u, 6 * u, -15 * u, -10 * u); g.quadraticCurveTo(-8 * u, -18 * u, -6 * u, -26 * u); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#d8a83a'; g.beginPath(); g.ellipse(0, -26 * u, 7.5 * u, 2.6 * u, 0, 0, 7); g.fill(); g.stroke(); g.strokeStyle = '#2a1a10'; g.lineWidth = 1.8 * u; for (const yy of [-4, 2]) { g.beginPath(); g.moveTo(-16 * u, yy * u); g.quadraticCurveTo(0, (yy + 3) * u, 16 * u, yy * u); g.stroke(); } }
    if (opts.tool === 'snakestick') { g.translate(hx, hy); g.rotate(opts.toolRot ?? -0.35); g.strokeStyle = INK; g.lineWidth = 2.6 * u; g.fillStyle = '#8a5a30'; g.beginPath(); g.roundRect(-3 * u, -64 * u, 6 * u, 84 * u, 3 * u); g.fill(); g.stroke();
      for (const s2 of [-1, 1]) { g.save(); g.translate(0, -62 * u); g.rotate(s2 * 0.45); g.beginPath(); g.roundRect(-2.5 * u, -18 * u, 5 * u, 20 * u, 2 * u); g.fill(); g.stroke(); g.restore(); }
      const ph = opts.wig ?? 0, pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push([Math.sin(t * 9 + ph) * 9 * u * (0.3 + t), -70 * u + t * 70 * u]); }
      g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 9 * u; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.strokeStyle = '#5aa83a'; g.lineWidth = 5.4 * u; g.stroke();
      g.strokeStyle = '#e8d040'; g.lineWidth = 1.6 * u; g.setLineDash([3 * u, 5 * u]); g.stroke(); g.setLineDash([]); g.fillStyle = '#5aa83a'; g.strokeStyle = INK; g.lineWidth = 2.2 * u; g.beginPath(); g.ellipse(pts[0][0], -72 * u, 6 * u, 4.5 * u, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(pts[0][0] - 2 * u, -73 * u, 1.6 * u, 0, 7); g.fill(); g.strokeStyle = '#d02a3a'; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(pts[0][0], -68 * u); g.lineTo(pts[0][0] + 2 * u, -62 * u); g.stroke(); }
    g.restore(); }
  };
  if (R !== 'mouth') drawTool();
  // rubber tube coming out of the left elbow (Forssmann)
  if (opts.tube) { const e = arms[0].pts[1], hnd = arms[0].pts[2]; const L_ = opts.tube; const tp_ = curve([e[0], e[1]], [e[0] - 30 * u, e[1] + 0.5 * HH * L_], [hnd[0] + 18 * u, Math.min(sole - 10 * u, e[1] + 1.0 * HH * L_)]);
    p.stroke(tp_, 6.5 * u, INK); p.stroke(tp_, 3.8 * u, "#d0703a"); p.ell(e[0], e[1], 7 * u, 5 * u, "#ffffff", 1.6 * u); }
  if (opts.blanket) { p.poly([[cx - 0.66 * W, chin + 0.9 * HH], [cx + 0.66 * W, chin + 0.9 * HH], [cx + 0.7 * W, sole + 6 * u], [cx - 0.7 * W, sole + 6 * u]], opts.blanket, 2.4 * u); p.stroke([[cx - 0.6 * W, chin + 1.05 * HH], [cx + 0.6 * W, chin + 1.05 * HH]], 2 * u, 'rgba(255,255,255,.7)'); }
  if (opts.straps) for (const yy of [chin + 0.45 * HH, sole - 0.75 * HH]) { p.poly([[cx - 0.62 * W, yy - 9 * u], [cx + 0.62 * W, yy - 9 * u], [cx + 0.62 * W, yy + 9 * u], [cx - 0.62 * W, yy + 9 * u]], "#7a4a2a", 2.2 * u); p.poly([[cx - 8 * u, yy - 11 * u], [cx + 8 * u, yy - 11 * u], [cx + 8 * u, yy + 11 * u], [cx - 8 * u, yy + 11 * u]], "#d9a845", 1.6 * u); }
  if (O.harness || opts.harness) { const top = chin + 0.12 * HH, bot = torsoBot - 0.05 * HH; for (const sd of [-1, 1]) p.poly([[cx + sd * 0.5 * W, top], [cx + sd * 0.5 * W + sd * 9 * u, top + 4 * u], [cx - sd * 0.12 * W + sd * 9 * u, bot], [cx - sd * 0.12 * W, bot - 4 * u]], '#e8c030', 2.2 * u); p.poly([[cx - 0.6 * W, bot - 10 * u], [cx + 0.6 * W, bot - 10 * u], [cx + 0.6 * W, bot + 4 * u], [cx - 0.6 * W, bot + 4 * u]], '#e8c030', 2.2 * u); p.ell(cx, bot - 3 * u, 9 * u, 8 * u, '#c8ccd2', 2 * u); }
  if (opts.belt > 0) { const b = Math.min(1, opts.belt), x0 = cx + 0.45 * W, y0 = chin + 0.15 * HH, x1 = cx - 0.42 * W, y1 = torsoBot - 0.1 * HH, xe = x0 + (x1 - x0) * b, ye = y0 + (y1 - y0) * b; p.poly([[x0, y0 - 5 * u], [x0 + 4 * u, y0 + 6 * u], [xe + 4 * u, ye + 6 * u], [xe, ye - 5 * u]], '#2a2a30', 2 * u); if (b >= 1) p.poly([[x1 - 9 * u, y1 - 6 * u], [x1 + 7 * u, y1 - 6 * u], [x1 + 7 * u, y1 + 8 * u], [x1 - 9 * u, y1 + 8 * u]], '#c8ccd2', 2 * u); }
  if (O.target) { const ty = chin + 0.45 * HH; p.ell(cx, ty, 14 * u, 14 * u, '#ffffff', 2.4 * u); p.poly([[cx, ty], [cx + 14 * u, ty], [cx + 13.5 * u, ty + 4 * u], [cx + 10 * u, ty + 10 * u], [cx + 4 * u, ty + 13.5 * u], [cx, ty + 14 * u]], '#14141a', 0); p.poly([[cx, ty], [cx - 14 * u, ty], [cx - 13.5 * u, ty - 4 * u], [cx - 10 * u, ty - 10 * u], [cx - 4 * u, ty - 13.5 * u], [cx, ty - 14 * u]], '#14141a', 0); }
  // ---- head ----
  p.g.translate(0, ((opts.headDrop || 0) + CH_ * 0.06 + SHR * 0.05) * HH);
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  const hp = blobPts(cx, hc, H);
  if (hatK) hatBack(p, hatK, O, H, cx, hc, u, light, thick, ow);
  if (O.hair && !helmet && !hatK) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 }); p.poly(hb, O.hair, 0); }
  if (O.wig) { // long 17th-century curls falling to the shoulders, drawn behind the head
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const yy = hc - 0.35 * H.b + i * 0.3 * H.b, xx = cx + sd * (0.92 * H.a + (i % 2) * 0.12 * H.a); p.ell(xx, yy, 0.3 * H.a, 0.24 * H.b, O.wig, ow * 0.7); p.stroke(ellPts(xx - sd * 3 * u, yy, 0.16 * H.a, 0.12 * H.b, 200, 340, 0, 10), 1.6 * u, '#00000055'); }
    const wb = blobPts(cx, hc - 0.08 * HH, { ...H, a: H.a * 1.14, b: H.b * 1.08 }); p.poly(wb, O.wig, ow * 0.8); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  const flush = opts.flush ?? (expr === "furious" ? 1 : 0);
  if (flush > 0) drawFlush(p, hp, H, hc, u, flush, opts.flushCol);
  p.inkRing(hp, ow, thick);
  if (hatK && hatK !== "hood" && (O.hair || O.cap)) for (const s of [-1, 1]) { // hair tufts peeking out under the hat
    const tf = [[cx + s * 0.78 * H.a, hc - 0.62 * H.b], [cx + s * 1.02 * H.a, hc - 0.5 * H.b], [cx + s * 1.0 * H.a, hc - 0.05 * H.b], [cx + s * 0.88 * H.a, hc + 0.12 * H.b], [cx + s * 0.86 * H.a, hc - 0.3 * H.b]];
    p.poly(tf, O.hair || O.cap, ow * 0.7); }
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (hatK) { /* engine kit hat drawn after the face */ }
  else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) hatOn(p, { hat: "hair", hair: O.hair, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.collar && O.beard) { const cy0 = chin - 2 * u; p.poly([[cx - 26 * u, cy0], [cx + 26 * u, cy0], [cx + 18 * u, cy0 + 26 * u], [cx, cy0 + 20 * u], [cx - 18 * u, cy0 + 26 * u]], O.collar, 2.2 * u); }
  if (O.beard && O.beardStyle) drawBeard(p, O.beardStyle, O.beard, H, cx, hc, u, light, thick, ow, facing, seed, flush > 0 ? mix(skin, flushHex(opts.flushCol), Math.min(1, flush) * 0.55) : skin);
  else if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.85 * H.b, { a: 0.62 * H.a, b: 0.75 * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.45 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  if (O.wig) { // fringe of curls over the forehead
    for (let i = -3; i <= 3; i++) p.ell(cx + i * 0.27 * H.a, hc - 0.82 * H.b + Math.abs(i) * 0.05 * H.b, 0.17 * H.a, 0.14 * H.b, O.wig, ow * 0.6); }
  if (O.collar && !O.beard) { const cy0 = chin - 2 * u; p.poly([[cx - 26 * u, cy0], [cx + 26 * u, cy0], [cx + 18 * u, cy0 + 26 * u], [cx, cy0 + 20 * u], [cx - 18 * u, cy0 + 26 * u]], O.collar, 2.2 * u); }
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet, skin, O.moustache ? O.moustache : O.beard, !!O.stout, { talk: opts.talk === true ? 0.6 : opts.talk, stache: O.stache, brow: opts.brow });
  if (expr === "furious" || opts.veins) drawVeins(p, cx, hc, H, u, opts.veins ?? 1);
  if (opts.flipper) { // Stratton's inverting tube over his right eye + a patch over the left, on a leather strap
    const fx2 = cx + 7 * u * facing, ey = hc - 1 * u;
    p.band([[cx - H.a * 1.0, ey - 3 * u], [cx + H.a * 1.0, ey - 3 * u]], '#4a2e1c', 4.5 * u, 1.4 * u, 'round');
    p.ell(fx2 + 13 * u, ey, 11 * u, 9.5 * u, '#1e1a1c', 2 * u); p.ell(fx2 + 10 * u, ey - 3 * u, 3 * u, 1.6 * u, '#4a4448', 0);
    p.ell(fx2 - 13 * u, ey + 2 * u, 15 * u, 15 * u, '#a87a28', 2.4 * u); p.ell(fx2 - 13 * u, ey, 15 * u, 15 * u, '#d9a845', 2.6 * u); p.ell(fx2 - 13 * u, ey, 10 * u, 10 * u, '#24344e', 2 * u);
    p.ell(fx2 - 16 * u, ey - 3.5 * u, 3.4 * u, 2.4 * u, '#d8ecff', 0); p.ell(fx2 - 9 * u, ey + 4 * u, 1.6 * u, 1.2 * u, '#8ab0d0', 0); }
  if (O.shades) { const fx2 = cx + 7 * u * facing, ey = hc - 1 * u, g = p.g; g.save(); g.fillStyle = '#14141a'; g.strokeStyle = INK; g.lineWidth = 3 * u;
    for (const sd of [-1, 1]) { g.beginPath(); g.roundRect(fx2 + sd * 14 * u - 12 * u, ey - 8 * u, 24 * u, 16 * u, 5 * u); g.fill(); g.stroke(); } g.beginPath(); g.moveTo(fx2 - 2.5 * u, ey - 2 * u); g.lineTo(fx2 + 2.5 * u, ey - 2 * u); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)'; for (const sd of [-1, 1]) g.fillRect(fx2 + sd * 14 * u - 8 * u, ey - 6 * u, 5 * u, 3 * u); g.restore(); }
  if ((O.glasses || opts.glasses) && !O.shades) { const fx2 = cx + 7 * u * facing, ey = hc - 1 * u, g = p.g; g.save(); g.strokeStyle = INK; g.lineWidth = 3.2 * u;
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(fx2 + sd * 14 * u, ey, 12 * u, 10.5 * u, 0, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(fx2 - 2.5 * u, ey - 1 * u); g.quadraticCurveTo(fx2, ey - 4 * u, fx2 + 2.5 * u, ey - 1 * u); g.stroke();
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(fx2 + sd * 26 * u, ey - 2 * u); g.lineTo(cx + sd * H.a * 0.98, ey - 4 * u); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.35)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(fx2 + sd * 14 * u - 5 * u, ey - 4 * u, 3 * u, 2 * u, -0.5, 0, 7); g.fill(); } g.restore(); }
  if (opts.rash) { const g = p.g; g.save(); g.globalAlpha = 0.55 * opts.rash; for (const sd of [-1, 1]) { p.ell(cx + sd * 0.5 * H.a, hc + 0.32 * H.b, 0.26 * H.a, 0.16 * H.b, '#d8504a', 0); p.ell(cx + sd * 0.62 * H.a, hc + 0.18 * H.b, 0.1 * H.a, 0.08 * H.b, '#b83a34', 0); } g.restore(); }
  if (opts.blindfold) { p.band([[cx - H.a * 1.03, hc - 1 * u], [cx + H.a * 1.03, hc - 1 * u]], '#2c2c48', 16 * u, 2.2 * u, 'round'); p.stroke([[cx - H.a * 0.7, hc - 5 * u], [cx + H.a * 0.7, hc - 5 * u]], 1.4 * u, 'rgba(255,255,255,.25)'); }
  if (opts.sweat > 0) { const dropAt = (x, y, sc) => { const r = 6 * u * sc; p.poly([[x, y - 2.2 * r], [x + r * 0.95, y - 0.2 * r], [x + r * 0.7, y + 0.7 * r], [x, y + r], [x - r * 0.7, y + 0.7 * r], [x - r * 0.95, y - 0.2 * r]], '#bfe8ff', 1.6 * u); p.ell(x - r * 0.3, y - 0.1 * r, r * 0.22, r * 0.3, '#ffffff', 0); };
    const spots = [[-0.62, -0.55, 1], [0.66, -0.45, 0.9], [-0.78, 0.15, 0.8], [0.8, 0.25, 1], [0.15, -0.78, 0.7], [-0.35, -0.85, 0.75]], n = Math.round(opts.sweat * spots.length), ph = opts.sweatT || 0;
    spots.slice(0, n).forEach(([dx, dy, sc], i) => dropAt(cx + dx * H.a, hc + dy * H.b + ((ph * 0.6 + i * 0.37) % 1) * 0.25 * H.b, sc));
    if (O.shirtless) for (let i = 0; i < n; i++) { const yy = chin + (0.25 + 0.12 * i) * HH + ((ph * 0.5 + i * 0.29) % 1) * 0.12 * HH; dropAt(cx + (i % 2 ? 0.28 : -0.24) * W, yy, 0.7); } }
  if (O.flyhelmet) { const cb = hc - 0.2 * H.b; const pts = []; for (let k = 0; k <= 24; k++) { const an = Math.PI + k / 24 * Math.PI; pts.push([cx + Math.cos(an) * H.a * 1.1, cb + Math.sin(an) * H.b * 1.08]); } pts.push([cx + H.a * 1.1, cb + 0.12 * H.b]); pts.push([cx - H.a * 1.1, cb + 0.12 * H.b]);
    p.shadedFill(pts, '#f6f6f2', '#b8bcc4', light, H.a); p.inkRing(pts, ow * 0.85, thick); p.poly([[cx - H.a * 0.9, cb - 0.38 * H.b], [cx + H.a * 0.9, cb - 0.38 * H.b], [cx + H.a * 0.8, cb - 0.2 * H.b], [cx - H.a * 0.8, cb - 0.2 * H.b]], '#5a6a7a', 2 * u);
    p.ell(cx - H.a * 1.06, cb + 0.05 * H.b, 0.16 * H.a, 0.22 * H.b, '#d8dce2', 2 * u); p.ell(cx + H.a * 1.06, cb + 0.05 * H.b, 0.16 * H.a, 0.22 * H.b, '#d8dce2', 2 * u); }
  if (hatK) hatFront(p, hatK, O, H, cx, hc, u, light, thick, ow);
  if (O.crown && !hatK) { const cb = hc - 0.88 * H.b, cw = 0.62 * H.a, ch = 0.5 * H.b; const pts = [[cx - cw, cb], [cx - cw, cb - ch * 0.55], [cx - cw * 0.6, cb - ch * 0.25], [cx - cw * 0.3, cb - ch], [cx, cb - ch * 0.3], [cx + cw * 0.3, cb - ch], [cx + cw * 0.6, cb - ch * 0.25], [cx + cw, cb - ch * 0.55], [cx + cw, cb]];
    p.shadedFill(pts, '#f2c230', '#b07a10', light, cw); p.inkRing(pts, ow * 0.8, thick); for (const xx of [-0.3, 0.3]) p.ell(cx + xx * cw, cb - ch, 3.6 * u, 3.6 * u, '#f4f1ea', 1.4 * u); p.ell(cx, cb - ch * 0.12, 5 * u, 4 * u, '#d0283a', 1.4 * u); }
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  p.rot = null;
  if (R === 'mouth') { drawArm(arms[1]); drawTool(); }
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
  p.g.restore();
  // props held or placed by the Motion Engine (absolute design coords): { kind: 'box', x, y, w, h, col } drawn last, hands redrawn on top when gripping
  for (const pr of opts.props || []) {
    if (pr.kind === 'box') { const bx = [[pr.x - pr.w / 2, pr.y - pr.h], [pr.x + pr.w / 2, pr.y - pr.h], [pr.x + pr.w / 2, pr.y], [pr.x - pr.w / 2, pr.y]];
      p.gradFill(bx, pr.col || '#b07a44', mul(pr.col || '#b07a44', SH_CLOTH), light); p.inkRing(bx, ow, thick);
      p.stroke([[pr.x - pr.w / 2 + 6 * u, pr.y - pr.h * 0.5], [pr.x + pr.w / 2 - 6 * u, pr.y - pr.h * 0.5]], 2.4 * u, '#7a4a24');
      p.stroke([[pr.x, pr.y - pr.h + 4 * u], [pr.x, pr.y - 4 * u]], 2.4 * u, '#d8b070');
      if (pr.grip) for (const hp of pr.grip) p.dot(hp[0], hp[1], 5.5 * u); }
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };
