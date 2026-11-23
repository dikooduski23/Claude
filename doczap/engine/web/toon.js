export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
const SH_SKIN = [
    0.96,
    0.86,
    0.84
];
const SH_CLOTH = [
    0.64,
    0.66,
    0.74
];
const SH_FELT = [
    0.62,
    0.62,
    0.7
];
const rad = (d)=>d * Math.PI / 180;
const clamp = (x, a, b)=>Math.max(a, Math.min(b, x));
export const mul = (c, m)=>{
    const n = parseInt(c.slice(1), 16);
    const ch = (v, k)=>Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
    return `#${ch(n >> 16 & 255, m[0])}${ch(n >> 8 & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c, k)=>mul(c, [
        k,
        k,
        k
    ]);
export const mix = (a, b, t)=>{
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    const ch = (s)=>Math.round((A >> s & 255) * (1 - t) + (B >> s & 255) * t).toString(16).padStart(2, "0");
    return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const rnd = (seed, k)=>{
    const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
};
const rotPts = (pts, a, cx, cy)=>pts.map(([x, y])=>[
            cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a),
            cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)
        ]);
const rotAbout = (q, a, c)=>rotPts([
        q
    ], a, c[0], c[1])[0];
const lerp2 = (a, b, t)=>[
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t
    ];
const curve = (a, k, b, n = 10)=>{
    const c = [
        2 * k[0] - (a[0] + b[0]) / 2,
        2 * k[1] - (a[1] + b[1]) / 2
    ], out = [];
    for(let i = 0; i <= n; i++){
        const t = i / n, s = 1 - t;
        out.push([
            s * s * a[0] + 2 * s * t * c[0] + t * t * b[0],
            s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]
        ]);
    }
    return out;
};
export const RIFLEMAN = {
    jacket: "#357650",
    pants: "#3d4440",
    boots: INK,
    hat: "shako",
    belt: "#f1efe6",
    buttons: "#d9dde0",
    rifle: true
};
export const OFFICER = {
    ...RIFLEMAN,
    hat: "shako_tall",
    buttons: "#e8c45a",
    sash: "#c0353a",
    sword: true,
    moustache: "#4a3020",
    rifle: false,
    belt: null,
    build: "stout"
};
export const KID = {
    jacket: "#f08a2c",
    pants: "#3b5b9a",
    boots: "#f4f1ea",
    hat: "cap",
    cap: "#e2453c",
    build: "kid"
};
export const PARENT = {
    jacket: "#7b5ac9",
    pants: "#3b3f52",
    boots: "#5a3b2a",
    hat: "hair",
    hair: "#5a3b2a"
};
export const SKINS = [
    SKIN,
    "#f5c9a0",
    "#ecd0b6",
    "#c99067"
];
export const soldier = (v = 0, extra = {})=>{
    const o = {
        ...RIFLEMAN,
        skin: SKINS[v % 4]
    };
    if (v % 4 === 1) o.moustache = "#4a3426";
    if (v % 4 === 3) o.moustache = "#2a201a";
    return {
        ...o,
        ...extra
    };
};
export const townsfolk = (v = 0)=>{
    const coats = [
        "#3f6fb5",
        "#8c3b4a",
        "#5d7a3a",
        "#b5653f",
        "#2f5f6a",
        "#7b5ac9"
    ];
    const o = {
        jacket: coats[v % 6],
        pants: "#3b3f52",
        boots: "#4a3426",
        skin: SKINS[v % 4]
    };
    return v % 2 ? {
        ...o,
        hat: "bonnet",
        dress: [
            "#d9a441",
            "#c25a7a",
            "#5a8fc2"
        ][v % 3]
    } : {
        ...o,
        hat: "tophat"
    };
};
export class Pen {
    g;
    ol = 12;
    rot = null;
    constructor(g){
        this.g = g;
    }
    P(x, y) {
        if (!this.rot) return [
            x,
            y
        ];
        const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
        return [
            cx + (x - cx) * c - (y - cy) * s + dx,
            cy + (x - cx) * s + (y - cy) * c + dy
        ];
    }
    path(pts, close) {
        const g = this.g;
        g.beginPath();
        pts.forEach((p, i)=>{
            const [x, y] = this.P(p[0], p[1]);
            if (i) g.lineTo(x, y);
            else g.moveTo(x, y);
        });
        if (close) g.closePath();
    }
    poly(pts, fill, ol) {
        const g = this.g, w = ol ?? this.ol;
        this.path(pts, true);
        if (fill) {
            g.fillStyle = fill;
            g.fill();
        }
        if (w) {
            g.lineWidth = w;
            g.strokeStyle = INK;
            g.lineJoin = "round";
            g.stroke();
        }
    }
    ell(cx, cy, rx, ry, fill, ol, a0 = 0, a1 = 360, rot = 0) {
        this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
    }
    line(pts, fill, w, ink = true) {
        const g = this.g;
        g.lineCap = "round";
        g.lineJoin = "round";
        if (ink) {
            this.path(pts, false);
            g.strokeStyle = INK;
            g.lineWidth = w + 2 * this.ol * 0.9;
            g.stroke();
        }
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
    }
    stroke(pts, w, fill = INK) {
        const g = this.g;
        g.lineCap = "round";
        g.lineJoin = "round";
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
    }
    arc(cx, cy, rx, ry, a0, a1, w, fill = INK) {
        const pts = [];
        for(let i = 0; i <= 24; i++)pts.push([
            cx + rx * Math.cos(rad(a0 + (a1 - a0) * i / 24)),
            cy + ry * Math.sin(rad(a0 + (a1 - a0) * i / 24))
        ]);
        this.stroke(pts, w, fill);
    }
    dot(cx, cy, r, fill = INK) {
        const [x, y] = this.P(cx, cy);
        this.g.beginPath();
        this.g.arc(x, y, r, 0, Math.PI * 2);
        this.g.fillStyle = fill;
        this.g.fill();
    }
    clip(pts, fn) {
        const g = this.g;
        g.save();
        this.path(pts, true);
        g.clip();
        fn();
        g.restore();
    }
    shadedFill(pts, base, shadow, light, R, shift = 0.45, r0 = 1.05, r1 = 1.25) {
        const g = this.g, n = pts.length;
        let cx = 0, cy = 0;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
        }
        const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
        const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
        gr.addColorStop(0, base);
        gr.addColorStop(r0 / r1, base);
        gr.addColorStop(1, shadow);
        this.path(pts, true);
        g.fillStyle = gr;
        g.fill();
    }
    gradFill(pts, base, shadow, light, flat = 0.22) {
        const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
        let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
            const d = x * dx + y * dy;
            lo = Math.min(lo, d);
            hi = Math.max(hi, d);
        }
        const dc = cx * dx + cy * dy;
        const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
        const gr = g.createLinearGradient(ax, ay, bx, by);
        gr.addColorStop(0, base);
        gr.addColorStop(flat, base);
        gr.addColorStop(1, shadow);
        this.path(pts, true);
        g.fillStyle = gr;
        g.fill();
    }
    inkRing(pts, w0, thick, k = 0.45, col = INK) {
        const n = pts.length;
        let cx = 0, cy = 0;
        for (const [x, y] of pts){
            cx += x / n;
            cy += y / n;
        }
        const out = [], inn = [];
        pts.forEach((q, i)=>{
            const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
            let nx = b[1] - a[1], ny = a[0] - b[0];
            const l = Math.hypot(nx, ny) || 1;
            nx /= l;
            ny /= l;
            const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
            out.push([
                q[0] + nx * h,
                q[1] + ny * h
            ]);
            inn.push([
                q[0] - nx * h,
                q[1] - ny * h
            ]);
        });
        const g = this.g;
        const trace = (r)=>{
            r.forEach(([x0, y0], i)=>{
                const [x, y] = this.P(x0, y0);
                if (i) g.lineTo(x, y);
                else g.moveTo(x, y);
            });
            g.closePath();
        };
        g.beginPath();
        trace(out);
        trace(inn.reverse());
        g.fillStyle = col;
        g.fill("evenodd");
    }
    band(pts, fill, w, rim, cap = "butt") {
        const g = this.g;
        g.lineCap = cap;
        g.lineJoin = "round";
        this.path(pts, false);
        g.strokeStyle = INK;
        g.lineWidth = w + 2 * rim;
        g.stroke();
        this.path(pts, false);
        g.strokeStyle = fill;
        g.lineWidth = w;
        g.stroke();
        g.lineCap = "round";
    }
}
const ellPts = (cx, cy, rx, ry, a0 = 0, a1 = 360, rot = 0, n = 48)=>{
    const r = rad(rot), pts = [];
    for(let i = 0; i <= n; i++){
        const a = rad(a0 + (a1 - a0) * i / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
        pts.push([
            cx + x * Math.cos(r) - y * Math.sin(r),
            cy + x * Math.sin(r) + y * Math.cos(r)
        ]);
    }
    return pts;
};
const rrect = (x0, y0, x1, y1, r, n = 8)=>{
    const pts = [];
    for (const [cx, cy, a] of [
        [
            x1 - r,
            y0 + r,
            -90
        ],
        [
            x1 - r,
            y1 - r,
            0
        ],
        [
            x0 + r,
            y1 - r,
            90
        ],
        [
            x0 + r,
            y0 + r,
            180
        ]
    ])for(let i = 0; i <= n; i++)pts.push([
        cx + r * Math.cos(rad(a + 90 * i / n)),
        cy + r * Math.sin(rad(a + 90 * i / n))
    ]);
    return pts;
};
const taper = (p, a, b, wa, wb, col = INK)=>{
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    p.poly([
        [
            a[0] + nx * wa / 2,
            a[1] + ny * wa / 2
        ],
        [
            b[0] + nx * wb / 2,
            b[1] + ny * wb / 2
        ],
        [
            b[0] - nx * wb / 2,
            b[1] - ny * wb / 2
        ],
        [
            a[0] - nx * wa / 2,
            a[1] - ny * wa / 2
        ]
    ], col, 0);
    p.dot(a[0], a[1], wa / 2, col);
    p.dot(b[0], b[1], wb / 2, col);
};
export const blobPts = (cx, cy, B, n = 72)=>{
    const ph = [
        rnd(B.seed, 11),
        rnd(B.seed, 12),
        rnd(B.seed, 13)
    ].map((v)=>v * Math.PI * 2);
    const pts = [];
    for(let i = 0; i < n; i++){
        const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
        let X = Math.sign(c) * Math.abs(c) ** e;
        const Y = Math.sign(s) * Math.abs(s) ** e;
        X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
        const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
        const x = B.a * X * r, y = B.b * Y * r;
        pts.push([
            cx + x * Math.cos(B.rot) - y * Math.sin(B.rot),
            cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)
        ]);
    }
    return pts;
};
export const headBlob = (seed, a = 118, facing = 0)=>({
        a,
        b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
        nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5),
        nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
        egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
        asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
        rot: rad(8 * (rnd(seed, 7) - 0.5)),
        noise: 0.008,
        seed
    });
export const thickAngle = (light)=>Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);
const FACE = {
    neutral: {
        eye: [
            "lid",
            "lid"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "dash"
    },
    stern: {
        eye: [
            "lid",
            "lid"
        ],
        brow: [
            3,
            -2
        ],
        mouth: "frown"
    },
    grin: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -3,
            -3
        ],
        mouth: "grin"
    },
    laugh: {
        eye: [
            "squeeze",
            "squeeze"
        ],
        brow: [
            -4,
            -4
        ],
        mouth: "laugh"
    },
    whistle: {
        eye: [
            "dash",
            "dash"
        ],
        brow: [
            -2,
            -4
        ],
        mouth: "o"
    },
    nervous: {
        eye: [
            "small",
            "small"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "wave"
    },
    shock: {
        eye: [
            "shock",
            "shock"
        ],
        brow: [
            -7,
            -6
        ],
        mouth: "O"
    },
    relief: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -2,
            1
        ],
        mouth: "smileWide"
    },
    relief_open: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            -2,
            1
        ],
        mouth: "grin"
    },
    dazed: {
        eye: [
            "spiral",
            "spiral"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "wave"
    },
    pained: {
        eye: [
            "squeeze",
            "lid"
        ],
        brow: [
            -3,
            2
        ],
        mouth: "teeth"
    },
    smile: {
        eye: [
            "dot",
            "dot"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "smirk"
    },
    smile_closed: {
        eye: [
            "happy",
            "happy"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "smile"
    },
    lick: {
        eye: [
            "dot",
            "dot"
        ],
        brow: [
            0,
            -1
        ],
        mouth: "lick"
    }
};
const halfLid = (k)=>k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k;
const eyeKind = (k, lid)=>lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b)=>b === true ? 1 : Number(b) || 0;
const eye = (p, kind, x, ey, u, side, look, skin)=>{
    const lx = x + look * 3 * u, lw = 3.8 * u;
    switch(kind){
        case "dot":
            p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0);
            break;
        case "small":
            p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0);
            break;
        case "lid":
            p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180);
            p.stroke([
                [
                    x - 9 * u,
                    ey - u
                ],
                [
                    x + 9 * u,
                    ey - u
                ]
            ], lw);
            break;
        case "slit":
            p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180);
            p.stroke([
                [
                    x - 9 * u,
                    ey
                ],
                [
                    x + 9 * u,
                    ey
                ]
            ], lw);
            break;
        case "happy":
            p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw);
            break;
        case "dash":
            p.stroke([
                [
                    x - 8.5 * u,
                    ey
                ],
                [
                    x + 8.5 * u,
                    ey
                ]
            ], lw);
            break;
        case "squeeze":
            p.stroke([
                [
                    x + 6 * u * side,
                    ey - 5 * u
                ],
                [
                    x - 6 * u * side,
                    ey
                ],
                [
                    x + 6 * u * side,
                    ey + 5 * u
                ]
            ], lw);
            break;
        case "shock":
        case "shockHalf":
            p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u);
            p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
            if (kind === "shockHalf") {
                p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360);
                p.stroke([
                    [
                        x - 11 * u,
                        ey
                    ],
                    [
                        x + 11 * u,
                        ey
                    ]
                ], 2.6 * u);
            }
            break;
        default:
            {
                const s = [];
                for(let t = 1; t < 15; t++)s.push([
                    x + Math.cos(t * 0.9) * t * 0.55 * u,
                    ey + Math.sin(t * 0.9) * t * 0.55 * u
                ]);
                p.stroke(s, 2.4 * u);
            }
            break;
        // ---- engine kit eyes (Nov 2026): angry, tiny (scared), cry, sleepy, side (smug side-eye) ----
        case "angry": {
            p.clip([[x - side * 10 * u, ey - 0.4 * u], [x + side * 10 * u, ey - 7.4 * u], [x + side * 10 * u, ey + 12 * u], [x - side * 10 * u, ey + 12 * u]], ()=>p.ell(lx, ey + 1.2 * u, 4.6 * u, 5.8 * u, INK, 0));
            p.stroke([[x - side * 7.5 * u, ey - 0.2 * u], [x + side * 7.5 * u, ey - 5.6 * u]], 3.2 * u);
            break; }
        case "tiny":
            p.ell(x, ey, 10.5 * u, 11.5 * u, WHITE, 2.6 * u);
            p.dot(lx, ey + 0.5 * u, 2 * u);
            break;
        case "cry": {
            p.arc(x, ey - 1 * u, 8 * u, 5.5 * u, 20, 160, lw);
            const tx = x + side * 4 * u, top = ey + 4 * u, bot = ey + 34 * u, sw = 3.4 * u;
            p.poly([[tx - sw, top], [tx + sw, top], [tx + side * 3 * u + sw * 1.2, bot], [tx + side * 3 * u - sw * 1.2, bot]], "#8fd0ff", 1.4 * u);
            p.stroke([[tx - sw * 0.3, top + 3 * u], [tx + side * 1.5 * u - sw * 0.3, bot - 6 * u]], 1.2 * u, "#ffffff");
            p.ell(tx + side * 3 * u, bot + 2 * u, 4.5 * u, 4 * u, "#8fd0ff", 1.4 * u);
            break; }
        case "sleepy":
            p.ell(lx, ey + 1.5 * u, 6.2 * u, 4.2 * u, INK, 0, 0, 180);
            p.stroke([[x - 9 * u, ey + 0.8 * u], [x + 9 * u, ey + 1.6 * u]], lw);
            p.arc(x, ey + 3 * u, 6 * u, 3 * u, 30, 150, 1.6 * u);
            break;
        case "side": {
            const sd = look === 0 ? 1 : Math.sign(look);
            p.ell(x + sd * 4.2 * u, ey - 1.5 * u, 5.4 * u, 5.4 * u, INK, 0, 0, 180);
            p.stroke([[x - 9.5 * u, ey - 1.6 * u], [x + 9.5 * u, ey - 1.6 * u]], lw);
            p.stroke([[x - 6 * u, ey + 5.5 * u], [x + 6 * u, ey + 5.5 * u]], 1.8 * u);
            break; }
    }
};
// talking mouth: open = 0..1 (from motion.talkAt), mood picks the shape family
const talkMouth = (p, mood, open, mx, my, u, fallback)=>{
    if (open < 0.12) return fallback();
    if (mood === "mad") {
        const gap = (1.2 + 9 * open) * u, w = 14 * u;
        p.poly([[mx - w - 2 * u, my - 4 * u], [mx + w + 2 * u, my - 4 * u], [mx + w, my + gap + 4 * u], [mx - w, my + gap + 4 * u]], MOUTH, 3 * u);
        p.poly([[mx - w, my - 3.5 * u], [mx + w, my - 3.5 * u], [mx + w - 0.5 * u, my + 0.5 * u], [mx - w + 0.5 * u, my + 0.5 * u]], WHITE, 1.4 * u);
        p.poly([[mx - w + 0.5 * u, my + gap - 0.5 * u], [mx + w - 0.5 * u, my + gap - 0.5 * u], [mx + w - 1 * u, my + gap + 3.5 * u], [mx - w + 1 * u, my + gap + 3.5 * u]], WHITE, 1.4 * u);
        for (const j of [-2, -1, 0, 1, 2]) { p.stroke([[mx + j * 5.5 * u, my - 3.5 * u], [mx + j * 5.5 * u, my + 0.5 * u]], 1.1 * u); p.stroke([[mx + j * 5.5 * u, my + gap - 0.5 * u], [mx + j * 5.5 * u, my + gap + 3.5 * u]], 1.1 * u); }
        return;
    }
    if (mood === "happy") { dmouth(p, mx, my - u, (10 + 3 * open) * u, (4 + 8 * open) * u, u, open > 0.5); return; }
    const rx = (mood === "scared" ? 5 : 6.5) * u + 5.5 * u * open, ry = (2 + 8.5 * open) * u, cy = my + ry * 0.35;
    p.ell(mx, cy, rx, ry, MOUTH, 0);
    if (open > 0.35) p.clip(ellPts(mx, cy, rx, ry), ()=>p.ell(mx, cy - ry, rx * 0.95, 0.42 * ry, WHITE, 0));
    if (open > 0.55) p.clip(ellPts(mx, cy, rx, ry), ()=>p.ell(mx + u, cy + ry * 0.75, rx * 0.6, ry * 0.4, TONGUE, 0));
    p.ell(mx, cy, rx, ry, null, 3 * u);
};
const moodOf = (expr)=>["angry", "furious", "stern", "stubborn"].includes(expr) ? "mad" : ["grin", "laugh", "eureka", "smile_closed", "relief", "relief_open", "wink"].includes(expr) ? "happy" : ["scared", "nervous", "shock", "gulp"].includes(expr) ? "scared" : "plain";
// moustache styles: default (taper), pencil, chevron, handlebar, walrus
const drawStache = (p, style, col, mx, cy, u, stout)=>{
    if (style === "pencil") { for (const s of [-1, 1]) taper(p, [mx + s * 1.5 * u, cy + 13.5 * u], [mx + s * 13 * u, cy + 14.5 * u], 2.6 * u, 1 * u, col); return; }
    if (style === "chevron") { p.poly([[mx - 15 * u, cy + 16 * u], [mx - 13 * u, cy + 10 * u], [mx, cy + 9 * u], [mx + 13 * u, cy + 10 * u], [mx + 15 * u, cy + 16 * u], [mx, cy + 14 * u]], col, 2.2 * u); return; }
    if (style === "handlebar") { for (const s of [-1, 1]) { taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * 17 * u, cy + 13.5 * u], 5 * u, 2.4 * u, col); const c = []; for (let i = 0; i <= 12; i++) { const a = 2.16 - 4.2 * i / 12, r = 3.6 * u * (1 - 0.35 * i / 12); c.push([mx + s * (19 * u + Math.cos(a) * r), cy + 10.5 * u + Math.sin(a) * r]); } p.stroke(c, 3.2 * u, INK); p.stroke(c, 1.6 * u, col); } return; }
    if (style === "walrus") { const pts = [[mx - 4 * u, cy + 9 * u], [mx + 4 * u, cy + 9 * u], [mx + 16 * u, cy + 13 * u], [mx + 19 * u, cy + 25 * u], [mx + 12 * u, cy + 21 * u], [mx + 6 * u, cy + 24 * u], [mx, cy + 20 * u], [mx - 6 * u, cy + 24 * u], [mx - 12 * u, cy + 21 * u], [mx - 19 * u, cy + 25 * u], [mx - 16 * u, cy + 13 * u]]; p.poly(pts, col, 2.4 * u); for (const j of [-2, -1, 1, 2]) p.stroke([[mx + j * 4 * u, cy + 13 * u], [mx + j * 5 * u, cy + 20 * u]], 1 * u, "rgba(0,0,0,.25)"); return; }
    for (const s of [-1, 1]) taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, col);
};
const dmouth =(p, mx, y, rx, ry, u, tongue = false)=>{
    p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
    p.clip([
        [
            mx - rx,
            y
        ],
        [
            mx + rx,
            y
        ],
        [
            mx + rx,
            y + 3 * u
        ],
        [
            mx - rx,
            y + 3 * u
        ]
    ], ()=>p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
    if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
    p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};
const mouth = (p, kind, mx, my, u, k = 1)=>{
    const mw = 4 * u;
    switch(kind){
        case "dash":
            p.stroke([
                [
                    mx - 5.5 * u * k,
                    my
                ],
                [
                    mx + 5.5 * u * k,
                    my - 0.8 * u
                ]
            ], mw);
            break;
        case "smug":
            p.stroke([[mx - 11 * u * k, my - 1 * u], [mx - 3 * u * k, my + 2.5 * u], [mx + 6 * u * k, my + 1.5 * u], [mx + 13 * u * k, my - 5 * u]], mw);
            p.stroke([[mx + 12 * u * k, my - 8 * u], [mx + 15 * u * k, my - 3.5 * u]], 2.6 * u);
            break;
        case "frown":
            p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw);
            break;
        case "smirk":
            p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw);
            break;
        case "smile":
            p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
            break;
        case "smileWide":
            p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw);
            break;
        case "grin":
            dmouth(p, mx, my - u, 12 * u * k, 8 * u, u);
            break;
        case "laugh":
            dmouth(p, mx, my, 16 * u * k, 11 * u, u, true);
            break;
        case "o":
            p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u);
            break;
        case "O":
            p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u);
            break;
        case "wave":
            {
                const s = [];
                for(let i = 0; i <= 12; i++)s.push([
                    mx - 9 * u * k + i * 1.5 * u * k,
                    my + 1.5 * u * Math.sin(i * 1.3)
                ]);
                p.stroke(s, 3 * u);
                break;
            }
        case "teeth":
            p.poly([
                [
                    mx - 12 * u * k,
                    my - 4 * u
                ],
                [
                    mx + 12 * u * k,
                    my - 4 * u
                ],
                [
                    mx + 11 * u * k,
                    my + 4 * u
                ],
                [
                    mx - 11 * u * k,
                    my + 4 * u
                ]
            ], WHITE, 3 * u);
            for (const j of [
                -1,
                0,
                1
            ])p.stroke([
                [
                    mx + j * 6 * u * k,
                    my - 4 * u
                ],
                [
                    mx + j * 6 * u * k,
                    my + 4 * u
                ]
            ], 1.5 * u);
            break;
        case "lick":
            p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
            p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u);
            break;
        // ---- engine kit mouths (Nov 2026) ----
        case "snarl": { // toothy anger: clenched teeth, corners pulled down
            const w = 15 * u * k, pts = [];
            for (let i = 0; i <= 10; i++) { const t = i / 10 * 2 - 1; pts.push([mx + t * w, my - 5.5 * u + 4 * u * t * t]); }
            for (let i = 10; i >= 0; i--) { const t = i / 10 * 2 - 1; pts.push([mx + t * w * 0.9, my + 6 * u + 1.5 * u * t * t]); }
            p.poly(pts, WHITE, 3 * u);
            p.clip(pts, ()=>{ p.stroke([[mx - w, my + 0.5 * u], [mx + w, my + 0.5 * u]], 1.6 * u); for (const j of [-2, -1, 0, 1, 2]) p.stroke([[mx + j * 5.2 * u * k, my - 8 * u], [mx + j * 5.2 * u * k, my + 8 * u]], 1.3 * u); });
            break; }
        case "roar": { // furious open shout, both teeth rows
            const w = 16 * u * k, top = my - 6 * u, bot = my + 15 * u;
            const pts = [[mx - w, top], [mx + w, top], [mx + w * 0.75, bot], [mx - w * 0.75, bot]];
            p.poly(pts, MOUTH, 0);
            p.clip(pts, ()=>{ p.poly([[mx - w, top], [mx + w, top], [mx + w, top + 4.5 * u], [mx - w, top + 4.5 * u]], WHITE, 0); p.poly([[mx - w, bot - 4 * u], [mx + w, bot - 4 * u], [mx + w, bot], [mx - w, bot]], WHITE, 0);
                for (const j of [-2, -1, 0, 1, 2]) { p.stroke([[mx + j * 5.6 * u, top], [mx + j * 5.6 * u, top + 4.5 * u]], 1.2 * u); p.stroke([[mx + j * 5 * u, bot - 4 * u], [mx + j * 5 * u, bot]], 1.2 * u); }
                p.ell(mx + 2 * u, bot - 3 * u, 8 * u, 3.5 * u, TONGUE, 0); });
            p.poly(pts, null, 3.2 * u);
            break; }
        case "wail": { // crying: open, wobbly, corners down
            const pts = [];
            for (let i = 0; i <= 12; i++) { const t = i / 12 * 2 - 1; pts.push([mx + t * 12 * u * k, my - 2 * u + 3.5 * u * t * t + 1.2 * u * Math.sin(i * 1.9)]); }
            for (let i = 12; i >= 0; i--) { const t = i / 12 * 2 - 1; pts.push([mx + t * 10 * u * k, my + 11 * u - 3 * u * t * t]); }
            p.poly(pts, MOUTH, 3 * u);
            p.clip(pts, ()=>p.ell(mx, my + 10 * u, 6 * u, 3 * u, TONGUE, 0));
            break; }
        case "chatter": { // scared: gritted teeth with a zig-zag bite
            const pts = [[mx - 11 * u * k, my - 4.5 * u], [mx + 11 * u * k, my - 4.5 * u], [mx + 10 * u * k, my + 4.5 * u], [mx - 10 * u * k, my + 4.5 * u]];
            p.poly(pts, WHITE, 2.8 * u);
            const z = []; for (let i = 0; i <= 8; i++) z.push([mx - 10.5 * u * k + i * 2.62 * u * k, my + (i % 2 ? 1.6 : -1.6) * u]);
            p.clip(pts, ()=>p.stroke(z, 1.4 * u));
            break; }
        case "yawn":
            p.ell(mx, my + 3 * u, 7 * u * k, 11 * u, MOUTH, 3 * u);
            p.clip(ellPts(mx, my + 3 * u, 7 * u * k, 11 * u), ()=>p.ell(mx, my + 11 * u, 5 * u, 4 * u, TONGUE, 0));
            break;
        case "flat":
            p.stroke([[mx - 9 * u * k, my], [mx + 9 * u * k, my]], mw);
            break;
    }
};
const faceFront = (p, cx, cy, W, expr, facing, look, lid, brim, skin, moustache, stout = false, X = {})=>{
    const u = W / 100, F0 = FACE[expr] || FACE.neutral, F = X.brow ? { ...F0, brow: X.brow } : F0, fx = cx + 7 * u * facing;
    const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
    for (const side of [
        -1,
        1
    ]){
        const x = fx + side * ex;
        const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
        eye(p, kind, x, ey, u, side, look, skin);
        const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
        if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
        else taper(p, [
            x - side * 8.5 * u,
            by + dI * u
        ], [
            x + side * 8.5 * u,
            by + dO * u
        ], 5 * u, 2.5 * u);
    }
    const mx = cx + 8 * u * facing, my = cy + 20 * u;
    if (X.talk != null && X.talk >= 0) talkMouth(p, moodOf(expr), X.talk, mx, my, u, ()=>mouth(p, F.mouth, mx, my, u));
    else mouth(p, F.mouth, mx, my, u);
    if (moustache && X.stache !== "none") drawStache(p, X.stache, moustache, mx, cy, u, stout);
    if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
const faceSide = (p, hx, hy, W, expr, lid, brim, skin, moustache, stout = false)=>{
    const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
    const kind = eyeKind(F.eye[1], lid);
    eye(p, kind, ex, ey, u, 1, 0.6, skin);
    const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
    if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [
        ex + 8 * u,
        by + dI * u
    ], [
        ex - 7 * u,
        by - u + dO * u
    ], 5 * u, 2.5 * u);
    p.stroke([
        [
            hx + 44 * u,
            hy + 4 * u
        ],
        [
            hx + 47.5 * u,
            hy + 9 * u
        ],
        [
            hx + 43 * u,
            hy + 10 * u
        ]
    ], 3 * u);
    mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
    if (moustache) taper(p, [
        hx + 41 * u,
        hy + 13.5 * u
    ], [
        hx + 25 * u,
        hy + (stout ? 11.5 : 16) * u
    ], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
const hatBehind = (p, o, H, cx, hc, light, thick, ow, side)=>{
    if (o.hat !== "bonnet") return;
    const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, {
        ...H,
        a: H.a * 1.17,
        b: H.b * 1.13,
        asym: 0,
        egg: 0.04,
        seed: H.seed + 3
    });
    p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
    p.inkRing(bb, ow * 0.85, thick);
};
const hatOn = (p, o, hp, H, cx, hc, light, seed, facing, side)=>{
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
    const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5));
    const R = (pts)=>rotPts(pts, a, cx, hc);
    const sag = (yb, wb)=>{
        const base = [];
        for(let i = 0; i <= 12; i++){
            const t = i / 12;
            base.push([
                cx + wb * (2 * t - 1),
                yb + 3 * u * (1 - (2 * t - 1) ** 2)
            ]);
        }
        return base;
    };
    if (o.hat === "shako" || o.hat === "shako_tall") {
        const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
        const body = R([
            ...sag(yb, wb).reverse(),
            [
                cx - wt,
                yb - ht
            ],
            [
                cx + wt,
                yb - ht
            ]
        ]);
        p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
        if (tall) p.clip(body, ()=>p.band(R([
                [
                    cx - wt - 5 * u,
                    yb - ht + 0.07 * HH
                ],
                [
                    cx + wt + 5 * u,
                    yb - ht + 0.07 * HH
                ]
            ]), "#e8c45a", 0.06 * HH, 1.5 * u));
        p.poly(body, null, ow);
        const deg = a * 180 / Math.PI;
        if (side) {
            p.poly(R([
                [
                    cx + 36 * u,
                    yb - 1 * u
                ],
                [
                    cx + 60 * u,
                    yb + 8 * u
                ],
                [
                    cx + 34 * u,
                    yb + 6 * u
                ]
            ]), "#16171b", 2.5 * u);
            const [tx, ty] = R([
                [
                    cx + 24 * u,
                    yb - ht - 6 * u
                ]
            ])[0];
            p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
        } else {
            const [px, py] = R([
                [
                    cx + 3 * u * facing,
                    yb + 3 * u
                ]
            ])[0];
            p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg);
            const [bx, by] = R([
                [
                    cx,
                    yb - 0.45 * ht
                ]
            ])[0];
            p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg);
            p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
            const [tx, ty] = R([
                [
                    cx,
                    yb - ht - 6 * u
                ]
            ])[0];
            p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
        }
    } else if (o.hat === "cap" || o.hat === "hair") {
        const cut = crown + (o.hat === "cap" ? 0.3 : 0.3) * HH;
        const keep = (x, y)=>y < cut || side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b;
        const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i)=>keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
        const arc = [
            ...hp.slice(startIdx),
            ...hp.slice(0, startIdx)
        ].filter(([x, y])=>keep(x, y)).map(([x, y])=>[
                cx + (x - cx) * 1.03,
                hc + (y - hc) * 1.03
            ]);
        if (arc.length < 3) return;
        if (o.hat === "hair") {
            const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
            for(let i = 1; i < 6; i++)arc.push([
                x0 + (x1 - x0) * i / 6,
                y0 + (y1 - y0) * i / 6 + (i % 2 ? 4 * u : 0)
            ]);
        }
        const col = o.hat === "cap" ? o.cap : o.hair;
        p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
        p.poly(arc, null, ow);
        if (o.hat === "hair") {
            const s = side ? -1 : facing || 1;
            p.stroke([
                [
                    cx + s * 10 * u,
                    cut - 30 * u
                ],
                [
                    cx + s * 2 * u,
                    cut - 12 * u
                ]
            ], 1.2 * u);
        }
        if (o.hat === "cap") {
            const deg = a * 180 / Math.PI;
            if (side) p.poly(R([
                [
                    cx + 40 * u,
                    cut - 2 * u
                ],
                [
                    cx + 74 * u,
                    cut + 4 * u
                ],
                [
                    cx + 40 * u,
                    cut + 6 * u
                ]
            ]), shade(col, 0.8), ow);
            else {
                const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([
                    [
                        cx + s * 4 * u,
                        cut + 1.5 * u
                    ]
                ])[0];
                p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
            }
        }
    } else if (o.hat === "tophat") {
        const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
        const body = R([
            ...sag(yb, wb).reverse(),
            [
                cx - wt,
                yb - ht
            ],
            [
                cx + wt,
                yb - ht
            ]
        ]);
        p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
        p.clip(body, ()=>p.band(R([
                [
                    cx - wt - 4 * u,
                    yb - 0.13 * HH
                ],
                [
                    cx + wt + 4 * u,
                    yb - 0.13 * HH
                ]
            ]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
        p.poly(body, null, ow);
        const [bx, by] = R([
            [
                cx,
                yb + 1 * u
            ]
        ])[0];
        p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, a * 180 / Math.PI);
    } else if (o.hat === "bonnet") {
        const [bx, by] = R([
            [
                cx + (side ? 6 * u : 0),
                crown + 0.16 * HH
            ]
        ])[0];
        p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
        p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
        const cy = hc + H.b * 0.98;
        p.stroke([
            [
                cx - 14 * u,
                cy - 4 * u
            ],
            [
                cx,
                cy + 2 * u
            ],
            [
                cx + 14 * u,
                cy - 4 * u
            ]
        ], 2 * u, BONNET_BRIM);
    }
};
const BUILD = {
    adult: {
        a: 118,
        torso: 1.1,
        legs: 1.4,
        tw: 0.8
    },
    stout: {
        a: 118,
        torso: 1.15,
        legs: 1.32,
        tw: 0.92
    },
    kid: {
        a: 112,
        torso: 0.85,
        legs: 1.0,
        tw: 0.72
    }
};
const footStroke = (p, a, b, w, col)=>{
    if (col !== INK) p.stroke([
        a,
        b
    ], w + 3, INK);
    p.stroke([
        a,
        b
    ], w, col);
};
export const bodyFront = (p, o, opts)=>{
    const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave, light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
    const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
    const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
    const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
    const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
    const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
    const thick = thickAngle(light), ow = 5 * u;
    const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
    const legW = 5.8 * u, footW = 7.5 * u;
    p.rot = null;
    if (mode === "sit") {
        for (const side of [
            -1,
            1
        ]){
            const h = [
                300 + side * 15 * u,
                hipY
            ], k = [
                300 + side * 36 * u,
                hipY + 0.2 * HH
            ], f = [
                300 + side * 44 * u,
                sole - 8 * u
            ];
            p.stroke(curve(h, k, f), legW, legCol);
            footStroke(p, [
                f[0] - side * 2 * u,
                f[1]
            ], [
                f[0] + side * 12 * u,
                f[1] - 5 * u
            ], footW, footCol);
        }
    } else if (mode === "fall") {
        const legs = [
            [
                [
                    300 - 15 * u,
                    hipY
                ],
                [
                    300 - 46 * u,
                    hipY + 0.5 * HH
                ],
                [
                    300 - 70 * u,
                    hipY + 0.72 * HH
                ]
            ],
            [
                [
                    300 + 15 * u,
                    hipY
                ],
                [
                    300 + 50 * u,
                    hipY + 0.45 * HH
                ],
                [
                    300 + 76 * u,
                    hipY + 0.22 * HH
                ]
            ]
        ];
        legs.forEach(([h, k, f], i)=>{
            p.stroke(curve(h, k, f), legW, legCol);
            footStroke(p, f, [
                f[0] + (i ? 14 : -14) * u,
                f[1] + (i ? -6 : 4) * u
            ], footW, footCol);
        });
    } else if (o.dress) {
        for (const side of [
            -1,
            1
        ]){
            const fx = 300 + side * 12 * u, fy = sole - 4 * u;
            p.stroke([
                [
                    fx,
                    sole - 0.4 * HH
                ],
                [
                    fx + side * u,
                    fy
                ]
            ], legW, legCol);
            footStroke(p, [
                fx - side * 3 * u,
                fy
            ], [
                fx + side * 12 * u,
                fy + u
            ], footW, footCol);
        }
    } else {
        const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
        for (const [side, ph] of [
            [
                -1,
                0
            ],
            [
                1,
                0.5
            ]
        ]){
            const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
            const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
            const k = [
                (hx + fx) / 2 + side * (1.5 * u + up * 0.16),
                (hipY + fy) / 2 - up * 0.08
            ];
            p.stroke(curve([
                hx,
                hipY
            ], k, [
                fx,
                fy
            ]), legW, legCol);
            footStroke(p, [
                fx - side * 3 * u,
                fy
            ], [
                fx + side * 13 * u,
                fy + 0.5 * u
            ], footW, footCol);
        }
    }
    const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
    const A = tilt + sway;
    p.rot = A ? [
        rad(A),
        300,
        hipY
    ] : null;
    const dress = !!o.dress && mode !== "sit" && mode !== "fall";
    const T = {
        a: Bd.tw / 2 * W / 1.06,
        b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
        nTop: 2.2,
        nBot: 2.6,
        egg: o.build === "stout" ? 0.17 : 0.12,
        asym: 0.04 * facing,
        rot: 0,
        noise: 0.006,
        seed: seed + 7
    };
    const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const sh = (side)=>[
            tcx + side * 0.85 * T.a,
            chin + 0.12 * HH
        ];
    const hang = (side, fwd)=>{
        const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
        const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
        return [
            S,
            [
                ex,
                S[1] + 0.48 * HH
            ],
            [
                hx,
                chin + 1.04 * HH - Math.abs(fwd) * 9 * u
            ]
        ];
    };
    const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
    const R0 = [
        300 + 47 * u,
        torsoBot + 0.12 * HH
    ], R1 = [
        300 + 64 * u,
        crown - 0.32 * HH
    ];
    const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
    const arms = [];
    if (mode === "sit") for (const side of [
        -1,
        1
    ])arms.push({
        pts: [
            sh(side),
            [
                tcx + side * (1.1 * T.a + 6 * u),
                sh(side)[1] + 0.4 * HH
            ],
            [
                tcx + side * (1.2 * T.a + 10 * u),
                torsoBot + 0.04 * HH
            ]
        ],
        front: false
    });
    else if (mode === "fall") for (const side of [
        -1,
        1
    ])arms.push({
        pts: [
            sh(side),
            [
                tcx + side * (1.15 * T.a + 12 * u),
                sh(side)[1] - 0.25 * HH
            ],
            [
                tcx + side * (1.3 * T.a + 24 * u),
                sh(side)[1] - 0.68 * HH
            ]
        ],
        front: false
    });
    else {
        arms.push({
            pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw),
            front: false
        });
        if (rifle) {
            const G = lerp2(R0, R1, 0.1);
            arms.push({
                pts: [
                    sh(1),
                    [
                        tcx + 1.12 * T.a + 5 * u,
                        sh(1)[1] + 0.45 * HH
                    ],
                    G
                ],
                front: false
            });
        } else if (wave !== undefined) {
            const S = sh(1);
            arms.push({
                pts: [
                    S,
                    [
                        tcx + 1.1 * T.a + 10 * u + 3 * u * wave,
                        S[1] - 0.22 * HH
                    ],
                    [
                        tcx + 1.18 * T.a + 16 * u + 12 * u * wave,
                        S[1] - 0.6 * HH
                    ]
                ],
                front: false
            });
        } else if (prop === "icecream") {
            const S = sh(1);
            arms.push({
                pts: [
                    S,
                    [
                        tcx + 1.05 * T.a + 4 * u,
                        S[1] + 0.45 * HH
                    ],
                    [
                        tcx + 0.5 * T.a,
                        S[1] + 0.4 * HH
                    ]
                ],
                front: true
            });
        } else if (Array.isArray(prop)) {
            const S = sh(1), k = clamp(prop[1], 0, 1);
            const E = lerp2([
                tcx + 1.1 * T.a + 10 * u,
                S[1] - 0.15 * HH
            ], [
                tcx + 1.2 * T.a + 10 * u,
                S[1] + 0.3 * HH
            ], k);
            const Hd = lerp2([
                tcx + 1.15 * T.a + 14 * u,
                S[1] - 0.55 * HH
            ], [
                tcx + 1.45 * T.a + 22 * u,
                S[1] + 0.35 * HH
            ], k);
            arms.push({
                pts: [
                    S,
                    E,
                    Hd
                ],
                front: true
            });
        } else arms.push({
            pts: hang(1, sw),
            front: false
        });
    }
    const drawArm = (a)=>{
        p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
        p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u);
    };
    if (rifle) {
        p.band([
            R0,
            R1
        ], "#7a4b2a", 5 * u, 1.5 * u, "round");
        p.band([
            lerp2(R0, R1, 0.6),
            R1
        ], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    if (o.sword && mode !== "sit") {
        const s0 = [
            tcx - 0.75 * T.a,
            torsoBot - 0.2 * HH
        ];
        p.band([
            s0,
            [
                s0[0] - Math.sin(rad(25)) * 0.8 * HH,
                s0[1] + Math.cos(rad(25)) * 0.8 * HH
            ]
        ], "#c9ccd2", 3 * u, 1.2 * u, "round");
    }
    for (const a of arms)if (!a.front) drawArm(a);
    if (dress) {
        const D = {
            a: 0.5 * W * 0.98,
            b: 0.5 * (sole - 0.35 * HH - (chin - 0.2 * HH)),
            nTop: 2.0,
            nBot: 3.0,
            egg: 0.35,
            asym: 0.03 * facing,
            rot: 0,
            noise: 0.006,
            seed: seed + 9
        };
        const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
        p.gradFill(dp, o.dress, mul(o.dress, SH_CLOTH), light);
        p.inkRing(dp, ow, thick);
        const Sw = {
            a: 0.37 * W,
            b: 0.3 * HH,
            nTop: 2.2,
            nBot: 2.4,
            egg: 0.1,
            asym: 0,
            rot: 0,
            noise: 0.006,
            seed: seed + 8
        };
        const sp = blobPts(300, chin + 0.12 * HH, Sw);
        p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.inkRing(sp, ow * 0.9, thick);
    } else {
        p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.clip(tp, ()=>{
            if (o.belt) {
                for (const s of [
                    -1,
                    1
                ])p.band([
                    [
                        tcx - s * 0.75 * T.a,
                        chin - 0.05 * HH
                    ],
                    [
                        tcx + s * 0.8 * T.a,
                        torsoBot - 0.1 * HH
                    ]
                ], o.belt, 5.5 * u, 1.8 * u);
                const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
                p.poly([
                    [
                        xc - 3.5 * u,
                        yc - 3.5 * u
                    ],
                    [
                        xc + 3.5 * u,
                        yc - 3.5 * u
                    ],
                    [
                        xc + 3.5 * u,
                        yc + 3.5 * u
                    ],
                    [
                        xc - 3.5 * u,
                        yc + 3.5 * u
                    ]
                ], "#d9dde0", 1.5 * u);
            }
            if (o.sash) p.band([
                [
                    tcx - 1.3 * T.a,
                    torsoBot - 0.32 * HH
                ],
                [
                    tcx + 1.3 * T.a,
                    torsoBot - 0.32 * HH
                ]
            ], o.sash, 0.13 * HH, 1.8 * u);
            for(let i = 0; i < 4; i++){
                const y = chin + 0.12 * HH + i * 0.2 * HH;
                if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
                p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK);
                p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
            }
        });
        if (o.sash) {
            const s = facing || 1;
            p.poly([
                [
                    tcx + s * 0.55 * T.a,
                    torsoBot - 0.3 * HH
                ],
                [
                    tcx + s * 0.75 * T.a,
                    torsoBot + 0.05 * HH
                ],
                [
                    tcx + s * 0.45 * T.a,
                    torsoBot + 0.02 * HH
                ]
            ], o.sash, 1.6 * u);
        }
        p.inkRing(tp, ow, thick);
    }
    for (const a of arms)if (a.front) {
        drawArm(a);
        const [hx, hy] = a.pts[2];
        if (prop === "icecream") {
            p.poly([
                [
                    hx - 8 * u,
                    hy - 12 * u
                ],
                [
                    hx + 8 * u,
                    hy - 12 * u
                ],
                [
                    hx,
                    hy + 7 * u
                ]
            ], "#e0a35a", 1.8 * u);
            p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
            p.dot(hx, hy, 5.5 * u);
        } else if (Array.isArray(prop)) {
            const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
            const Rh = (pts)=>rotPts(pts, ang, hx, hy);
            p.band(Rh([
                [
                    hx,
                    hy + 12 * u
                ],
                [
                    hx,
                    hy - 44 * u
                ]
            ]), "#8a5a34", 5 * u, 1.5 * u, "round");
            p.poly(Rh([
                [
                    hx - 12 * u,
                    hy - 58 * u
                ],
                [
                    hx + 20 * u,
                    hy - 58 * u
                ],
                [
                    hx + 20 * u,
                    hy - 42 * u
                ],
                [
                    hx - 12 * u,
                    hy - 42 * u
                ]
            ]), "#7d848c", 2.2 * u);
            p.dot(hx, hy, 5.5 * u);
        }
    }
    if (prop === "shako") {
        const [hx, hy] = arms[0].pts[2];
        p.poly([
            [
                hx - 14 * u,
                hy + 3 * u
            ],
            [
                hx + 14 * u,
                hy + 3 * u
            ],
            [
                hx + 16 * u,
                hy + 30 * u
            ],
            [
                hx - 16 * u,
                hy + 30 * u
            ]
        ], "#3a3d47", 2.2 * u);
        p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
        p.dot(hx, hy, 5.5 * u);
    }
    const Ah = A + headTilt, [cpx, cpy] = rotAbout([
        300,
        chin
    ], rad(A), [
        300,
        hipY
    ]);
    p.rot = Ah ? [
        rad(Ah),
        300,
        chin,
        cpx - 300,
        cpy - chin
    ] : null;
    hatBehind(p, o, H, 300, hc, light, thick, ow, false);
    const hp = blobPts(300, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
};
const ik = (hip, ank, l1, l2)=>{
    const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
    return [
        hip[0] + l1 * Math.cos(k),
        hip[1] + l1 * Math.sin(k)
    ];
};
const SWING_HIP = 733;
export const bodySide = (p, o, opts)=>{
    const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
    const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const H = {
        ...headBlob(seed, Bd.a, 1),
        asym: 0.12,
        rot: rad(3 + 3 * (rnd(seed, 7) - 0.5))
    };
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
    const thick = thickAngle(light), ow = 5 * u;
    const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
    const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
    const legs = [];
    let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
    if (mode === "march") {
        const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
        const st = (ph)=>{
            const c = ((phase + ph) % 1 + 1) % 1;
            if (c < 0.5) {
                const s = c / 0.5;
                return {
                    x: S / 2 - S * s,
                    h: 0,
                    stance: true,
                    s
                };
            }
            const s = (c - 0.5) / 0.5;
            return {
                x: -S / 2 + S * s - S / Math.PI * Math.sin(2 * Math.PI * s),
                h: liftH * Math.sin(Math.PI * s),
                stance: false,
                s
            };
        };
        const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
        const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
        hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
        for (const [L, near] of [
            [
                fL,
                false
            ],
            [
                nL,
                true
            ]
        ])legs.push({
            ank: [
                300 + L.x,
                ankY - L.h
            ],
            pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)),
            near
        });
        lean = 4 + 3 * Math.cos(2 * two * phase);
        nearFwd = nL.x / (S / 2);
    } else if (mode === "push") {
        hipY = ankY - 0.87 * legLen;
        legs.push({
            ank: [
                300 - 0.5 * legLen,
                ankY
            ],
            pitch: rad(-8),
            near: false
        }, {
            ank: [
                300 + 0.32 * legLen,
                ankY
            ],
            pitch: 0,
            near: true
        });
        lean = 14 * pose;
    } else if (mode === "swing") {
        hipY = SWING_HIP;
        const a = rad(60 * pose);
        for (const [dx, near] of [
            [
                -6,
                false
            ],
            [
                0,
                true
            ]
        ]){
            const knee = [
                300 + l1 * 0.98 + dx * u,
                hipY + 6 * u
            ];
            legs.push({
                ank: [
                    knee[0] + l2 * Math.sin(a),
                    knee[1] + l2 * Math.cos(a)
                ],
                pitch: -a * 0.5,
                near
            });
        }
    } else {
        legs.push({
            ank: [
                300 - 4 * u,
                ankY
            ],
            pitch: 0,
            near: false
        }, {
            ank: [
                300 + 4 * u,
                ankY
            ],
            pitch: 0,
            near: true
        });
    }
    const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip = [
        300,
        hipY
    ];
    p.rot = null;
    for (const L of legs){
        const knee = mode === "swing" ? [
            300 + l1 * 0.98 + (L.near ? 0 : -6 * u),
            hipY + 6 * u
        ] : ik(hip, L.ank, l1, l2);
        const hp0 = [
            300 + (L.near ? 0 : -5 * u),
            hipY
        ];
        p.stroke([
            hp0,
            knee,
            L.ank
        ], 5.8 * u, L.near ? nearCol : farCol);
        const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
        footStroke(p, [
            L.ank[0] - 3 * u * c,
            L.ank[1] - 3 * u * s
        ], [
            L.ank[0] + 13 * u * c,
            L.ank[1] + 13 * u * s + 0.5 * u
        ], 7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
    }
    p.rot = lean ? [
        rad(lean),
        300,
        hipY
    ] : null;
    const T = {
        a: (o.build === "stout" ? 0.36 : 0.31) * W,
        b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
        nTop: 2.2,
        nBot: 2.5,
        egg: 0.1,
        asym: 0.06,
        rot: 0,
        noise: 0.006,
        seed: seed + 7
    };
    const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
    const S = [
        tcx + 0.05 * T.a,
        chin + 0.14 * HH
    ], aLen = 0.95 * HH;
    const swingArm = (ang)=>{
        const e = [
            S[0] + Math.sin(ang) * aLen * 0.5,
            S[1] + Math.cos(ang) * aLen * 0.5
        ], a2 = ang + rad(16) * Math.sign(ang || 1);
        return [
            S,
            e,
            [
                e[0] + Math.sin(a2) * aLen * 0.5,
                e[1] + Math.cos(a2) * aLen * 0.5
            ]
        ];
    };
    const rifle = !!o.rifle && (mode === "march" || mode === "stand");
    const B0 = [
        tcx + 0.72 * T.a,
        chin + 0.58 * HH
    ], B1 = [
        tcx - 0.95 * T.a - 22 * u,
        crown - 0.4 * HH
    ];
    let near, far;
    if (mode === "swing") {
        near = [
            S,
            [
                S[0] + 12 * u,
                S[1] - 0.16 * HH
            ],
            [
                300 + 6 * u,
                chin - 0.3 * HH
            ]
        ];
        far = [
            S,
            [
                S[0] + 8 * u,
                S[1] - 0.18 * HH
            ],
            [
                300 + 2 * u,
                chin - 0.36 * HH
            ]
        ];
    } else if (mode === "push") {
        const reach = 0.55 * HH + 0.45 * HH * pose;
        let hN = [
            S[0] + reach,
            S[1] + 0.06 * HH
        ];
        if (opts.hand) {
            const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
            const tg = [
                300 + dx * Math.cos(th) - dy * Math.sin(th),
                hipY + dx * Math.sin(th) + dy * Math.cos(th)
            ];
            hN = [
                hN[0] + (tg[0] - hN[0]) * pose,
                hN[1] + (tg[1] - hN[1]) * pose
            ];
        }
        near = [
            S,
            [
                (S[0] + hN[0]) / 2,
                (S[1] + hN[1]) / 2 + 0.06 * HH
            ],
            hN
        ];
        far = [
            S,
            [
                (S[0] + hN[0]) / 2 - 4 * u,
                (S[1] + hN[1]) / 2 - 0.02 * HH
            ],
            [
                hN[0] - 6 * u,
                hN[1] - 0.08 * HH
            ]
        ];
    } else if (rifle) {
        near = [
            S,
            [
                S[0] - 4 * u,
                S[1] + 0.42 * HH
            ],
            B0
        ];
        far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0);
    } else {
        near = swingArm(rad(-30) * nearFwd);
        far = mode === "march" ? swingArm(rad(30) * nearFwd) : null;
    }
    if (far) {
        p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm);
        p.dot(far[2][0], far[2][1], 5.5 * u);
    }
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, ()=>{
        if (o.belt) p.band([
            [
                tcx - 0.65 * T.a,
                chin - 0.05 * HH
            ],
            [
                tcx + 0.75 * T.a,
                torsoBot - 0.1 * HH
            ]
        ], o.belt, 5.5 * u, 1.8 * u);
        if (o.sash) p.band([
            [
                tcx - 1.3 * T.a,
                torsoBot - 0.32 * HH
            ],
            [
                tcx + 1.3 * T.a,
                torsoBot - 0.32 * HH
            ]
        ], o.sash, 0.13 * HH, 1.8 * u);
        if (!o.dress) for(let i = 0; i < 3; i++){
            const y = chin + 0.16 * HH + i * 0.24 * HH;
            p.dot(tcx + 0.8 * T.a, y, 3 * u, INK);
            p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
        }
    });
    p.inkRing(tp, ow, thick);
    if (rifle) {
        p.band([
            B0,
            B1
        ], "#7a4b2a", 5 * u, 1.5 * u, "round");
        p.band([
            lerp2(B0, B1, 0.6),
            B1
        ], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol);
    p.dot(near[2][0], near[2][1], 5.5 * u);
    const hx = 300 + 4 * u;
    hatBehind(p, o, H, hx, hc, light, thick, ow, true);
    const hp = blobPts(hx, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
};
export const swingKid = (p, o, kick, expr, light = DEF_LIGHT, blink = 0)=>{
    const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
    const seat = rope + 18, x0 = 150, x1 = 550;
    p.line([
        [
            350,
            20
        ],
        [
            x0 + 16,
            seat + 4
        ]
    ], "#a07a4c", 10);
    p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
    const g = p.g;
    g.save();
    g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
    g.scale(k, k);
    bodySide(new Pen(g), o, {
        expr,
        mode: "swing",
        pose: kick,
        light,
        seed: 5,
        blink
    });
    g.restore();
    p.line([
        [
            350,
            20
        ],
        [
            x1 - 16,
            seat + 4
        ]
    ], "#a07a4c", 10);
};
export const fxNote = (p, kind, col = "#1f2a44")=>{
    p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
    p.stroke([
        [
            110,
            190
        ],
        [
            110,
            40
        ]
    ], 14);
    if (kind === 0) p.poly([
        [
            110,
            40
        ],
        [
            170,
            70
        ],
        [
            170,
            110
        ],
        [
            110,
            82
        ]
    ], col, 8);
    else {
        p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
        p.stroke([
            [
                186,
                160
            ],
            [
                186,
                20
            ]
        ], 14);
        p.poly([
            [
                110,
                40
            ],
            [
                186,
                20
            ],
            [
                186,
                50
            ],
            [
                110,
                70
            ]
        ], col, 8);
    }
};
export const fxBurst = (p, t, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230)=>{
    const c = 250, e = 1 - (1 - t) ** 3;
    for(let i = 0; i < rays; i++){
        const a = rad(i * 360 / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
        p.poly([
            [
                c + r0 * 0.5 * Math.cos(a + 0.18),
                c + r0 * 0.5 * Math.sin(a + 0.18)
            ],
            [
                c + ra * Math.cos(a),
                c + ra * Math.sin(a)
            ],
            [
                c + r0 * 0.5 * Math.cos(a - 0.18),
                c + r0 * 0.5 * Math.sin(a - 0.18)
            ]
        ], col, Math.max(3, 8 * (1 - t)));
    }
    if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};
export const fxSplash = (p, t)=>{
    const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
    const blue = "#bfe8ff", deep = "#6cc0f0";
    if (rise > 0.02) {
        const pts = [];
        for(let i = 0; i < 19; i++){
            const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
            pts.push([
                c - 330 + 660 * i / 18,
                size - 120 - h
            ]);
        }
        p.poly([
            ...pts,
            [
                c + 330,
                size - 90
            ],
            [
                c - 330,
                size - 90
            ]
        ], blue, 10);
        p.ell(c, size - 100, 360, 46, deep, 10);
    }
    for(let i = 0; i < 8; i++){
        const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
        if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
    }
};
export const fxPuff = (p, t)=>{
    for(let i = 0; i < 5; i++){
        const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
        p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
    }
};
export const fxStars = (p, t)=>{
    for(let i = 0; i < 4; i++){
        const a = t * Math.PI * 2 + i * Math.PI / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts = [];
        for(let k = 0; k < 10; k++){
            const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90);
            pts.push([
                x + r * Math.cos(b),
                y + r * Math.sin(b)
            ]);
        }
        p.poly(pts, "#ffd84a", 6);
    }
};
export const fxCreak = (p, t)=>{
    const j = 6 * Math.sin(t * 40);
    for (const a of [
        -30,
        0,
        30
    ]){
        const b = rad(a - 90);
        p.stroke([
            [
                150 + 70 * Math.cos(b) + j,
                230 + 70 * Math.sin(b)
            ],
            [
                150 + 100 * Math.cos(b) + 10 + j,
                230 + 100 * Math.sin(b)
            ],
            [
                150 + 130 * Math.cos(b) + j,
                230 + 130 * Math.sin(b)
            ]
        ], 10);
    }
};
export const fxRing = (p, t)=>{
    const g = p.g;
    for(let k = 0; k < 3; k++){
        const u = t - k * 0.22;
        if (u <= 0 || u >= 1) continue;
        g.beginPath();
        g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
        g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa";
        g.lineWidth = 9 * (1 - u) + 3;
        g.stroke();
    }
};
export const fxSign = (p)=>{
    const g = p.g, RED = "#d42f2f";
    p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
    p.poly(rrect(14, 14, 686, 506, 40), null, 14);
    p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
    g.beginPath();
    g.moveTo(112, 470);
    g.quadraticCurveTo(350, 300, 588, 470);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.stroke();
    for (const x of [
        88,
        612
    ])p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
    for (const x of [
        150,
        278,
        406,
        534
    ]){
        p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);
        p.stroke([
            [
                x - 8,
                210
            ],
            [
                x + 34,
                262
            ],
            [
                x + 46,
                338
            ]
        ], 15, INK);
        p.stroke([
            [
                x + 6,
                210
            ],
            [
                x - 12,
                274
            ],
            [
                x - 36,
                336
            ]
        ], 15, INK);
        p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);
        p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
    }
    for (const [a, b] of [
        [
            [
                96,
                70
            ],
            [
                604,
                452
            ]
        ],
        [
            [
                604,
                70
            ],
            [
                96,
                452
            ]
        ]
    ]){
        p.stroke([
            a,
            b
        ], 58, "#ffffff");
        p.stroke([
            a,
            b
        ], 42, RED);
    }
};
export const fxCloud = (p, seed)=>{
    const blobs = [
        [
            150,
            190,
            80
        ],
        [
            250,
            150,
            105
        ],
        [
            360,
            160,
            95
        ],
        [
            450,
            195,
            70
        ],
        [
            300,
            210,
            90
        ]
    ];
    for (const [x, y, r] of blobs)p.ell(x + seed * 37 % 20 - 10, y, r, r * 0.8, "#ffffff", 0);
    p.ell(300, 235, 230, 40, "#ffffff", 0);
};
export const fxShadow = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 256);
    g.save();
    g.filter = "blur(9px)";
    const lg = g.createLinearGradient(0, 205, 0, 22);
    lg.addColorStop(0, mix(col, WHITE, 0.08));
    lg.addColorStop(0.55, mix(col, WHITE, 0.3));
    lg.addColorStop(1, mix(col, WHITE, 0.85));
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(40, 205);
    g.bezierCurveTo(36, 120, 46, 50, 64, 30);
    g.bezierCurveTo(82, 50, 92, 120, 88, 205);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
};
export const fxContact = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [
        [
            0,
            0
        ],
        [
            0.32,
            0.02
        ],
        [
            0.5,
            0.22
        ],
        [
            0.66,
            0.58
        ],
        [
            0.82,
            0.88
        ],
        [
            1,
            1
        ]
    ])gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
};
export const fxPlank = (p)=>{
    p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
    p.line([
        [
            40,
            46
        ],
        [
            150,
            44
        ],
        [
            270,
            50
        ]
    ], "#7d5234", 4);
    p.line([
        [
            60,
            62
        ],
        [
            200,
            64
        ],
        [
            284,
            60
        ]
    ], "#7d5234", 4);
    p.dot(36, 54, 5, INK);
    p.dot(284, 54, 5, INK);
};
export const fxDrum = (p)=>{
    p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
    p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
    p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
    p.line([
        [
            52,
            88
        ],
        [
            82,
            172
        ],
        [
            112,
            88
        ],
        [
            142,
            172
        ],
        [
            172,
            88
        ],
        [
            202,
            172
        ]
    ], INK, 6);
    p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};
export const fxBlob = (p, col)=>{
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [
        [
            0,
            0
        ],
        [
            0.5,
            0.04
        ],
        [
            0.64,
            0.18
        ],
        [
            0.76,
            0.42
        ],
        [
            0.87,
            0.72
        ],
        [
            0.95,
            0.92
        ],
        [
            1,
            1
        ]
    ])gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
};
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
const HATCOL = { crown: "#f2c230", helmet: "#a9b0b8", cowboy: "#9a6434", tophat: "#2a2630", hood: "#5a4a8a", turban: "#f0ece0", soldier: "#3a5a8a" };
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
    case "cowboy": { const bw = 74 * u, cw = 31 * u, ch = 38 * u;
      const brim = [...curve((t) => [cx + bw * t, by - 2 * u + 3 * u * (1 - t * t) - 9 * u * Math.pow(Math.abs(t), 3)]), ...curve((t) => [cx + bw * 0.96 * t, by + 5 * u + 4 * u * (1 - t * t) - 9 * u * Math.pow(Math.abs(t), 3)]).reverse()];
      const crownP = [[cx - cw, by + 1 * u], [cx + cw, by + 1 * u], [cx + cw * 0.86, by - ch], [cx + cw * 0.3, by - ch - 4 * u], [cx, by - ch + 4 * u], [cx - cw * 0.3, by - ch - 4 * u], [cx - cw * 0.86, by - ch]];
      shade(crownP, col, cw); p.clip(crownP, () => p.band([[cx - cw, by - 6 * u], [cx + cw, by - 6 * u]], band || "#3a2418", 6 * u, 0));
      p.stroke([[cx - cw, by - 9 * u], [cx + cw, by - 9 * u]], 1.4 * u); p.stroke([[cx - cw, by - 3 * u], [cx + cw, by - 3 * u]], 1.4 * u);
      shade(brim, mul(col, [0.95, 0.95, 0.95]), bw);
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
  const hatK = opts.hat ?? O.hat; // engine kit hats: crown helmet cowboy tophat hood turban soldier
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300; const lerpN = (a, b, t) => a + (b - a) * t;
  const legCol = O.stick ? INK : mix(O.tunic, INK, 0.62), armCol = O.stick ? INK : mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
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
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
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
