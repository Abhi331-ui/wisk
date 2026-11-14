// rig2d.js: hand-drawn 2D characters with a skeleton, sun-driven soft shading, and motion cycles.
// Draw with: drawChar(ctx, spec, pose, {sun}) where pose comes from POSES / motion functions.
// Units: character is ~620 px tall, origin at the ground point between the feet.

const rad = (d) => (d * Math.PI) / 180;
const mixHex = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const INK = "#1d1418";

// ---------------------------------------------------------------- shading: base fill, sun gradient, warm rim, outline
function shadePath(g, path, base, sun, opts = {}) {
  const { ol = 6, rim = 1, bb } = opts;
  const lx = Math.cos(sun.a), ly = Math.sin(sun.a);             // direction light comes FROM (screen space)
  g.save();
  g.fillStyle = base; g.fill(path);
  g.clip(path);
  const b = bb || { x: -400, y: -800, w: 800, h: 900 }, cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.max(b.w, b.h) * 0.6;
  const gr = g.createLinearGradient(cx + lx * R, cy + ly * R, cx - lx * R, cy - ly * R);
  gr.addColorStop(0, mixHex(base, "#fff0cf", 0.42 * sun.k));     // sunlit side: warm, soft
  gr.addColorStop(0.45, base);
  gr.addColorStop(1, mixHex(base, "#2c3768", 0.34 * sun.k));     // shadow side: cool
  g.fillStyle = gr; g.fillRect(b.x - 50, b.y - 50, b.w + 100, b.h + 100);
  if (rim) { // warm rim light on the sun-facing edge
    g.translate(-lx * 7, -ly * 7); g.lineWidth = 14; g.strokeStyle = "rgba(255,236,190," + (0.55 * sun.k) + ")"; g.stroke(path);
  }
  g.restore();
  if (ol) { g.lineWidth = ol; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(path); g.save(); g.translate(1.5, 1.1); g.lineWidth = ol * 0.45; g.strokeStyle = "rgba(29,20,24,0.5)"; g.stroke(path); g.restore(); }
}
// cloth texture + fold lines inside a clipped garment
function cloth(g, path, bb, col, folds = []) {
  g.save(); g.clip(path); g.globalAlpha = 0.09; g.strokeStyle = col; g.lineWidth = 2;
  for (let x = bb.x - bb.h; x < bb.x + bb.w; x += 7) { g.beginPath(); g.moveTo(x, bb.y); g.lineTo(x + bb.h, bb.y + bb.h); g.stroke(); }
  g.globalAlpha = 0.45; g.strokeStyle = "#1d1418"; g.lineWidth = 3.5; g.lineCap = "round";
  for (const f of folds) { g.beginPath(); g.moveTo(...f[0]); g.quadraticCurveTo(...f[1], ...f[2]); g.stroke(); }
  g.restore();
}
const bbOf = (pts, pad = 20) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad; return { x, y, w: Math.max(...xs) - x + pad, h: Math.max(...ys) - y + pad }; };

// tapered limb from a -> b -> c (two segments) as one closed outline path
function limbPath(pts, w0, w1) {
  const p = new Path2D(), n = pts.length, L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2, nx = -dy / l * w, ny = dx / l * w;
    L.push([pts[i][0] + nx, pts[i][1] + ny]); Rr.push([pts[i][0] - nx, pts[i][1] - ny]);
  }
  p.moveTo(...L[0]); for (let i = 1; i < n; i++) p.lineTo(...L[i]);
  const e = pts[n - 1], ew = w1 / 2, ang = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]);
  p.arc(e[0], e[1], ew, ang - Math.PI / 2, ang + Math.PI / 2);
  for (let i = n - 1; i >= 0; i--) p.lineTo(...Rr[i]);
  const s = pts[0], sw = w0 / 2, a0 = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
  p.arc(s[0], s[1], sw, a0 + Math.PI / 2, a0 + Math.PI * 1.5);
  p.closePath(); return p;
}
let JS = 1; const jit = () => { JS = (JS * 16807) % 2147483647; return (JS / 2147483647 - 0.5) * 2; };
const ell = (x, y, rx, ry, rot = 0) => { const pts = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, c = Math.cos(rot), s = Math.sin(rot), u = Math.cos(a) * rx, v = Math.sin(a) * ry; pts.push([x + u * c - v * s, y + u * s + v * c]); } return smoothPoly(pts); };
const circ = (x, y, r) => ell(x, y, r, r);
const poly = (pts, close = true) => { const p = new Path2D(); p.moveTo(...pts[0]); for (const q of pts.slice(1)) p.lineTo(...q); if (close) p.closePath(); return p; };
const smoothPoly = (pts0) => { // closed Catmull-Rom outline with a slight hand-drawn wobble
  const pts = pts0.map((q) => [q[0] + jit() * 1.8, q[1] + jit() * 1.8]);
  const p = new Path2D(), n = pts.length; p.moveTo(...pts[0]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  p.closePath(); return p;
};

// ---------------------------------------------------------------- skeleton
// proportions (cartoon-human: big head, slim limbs)
const B = { thigh: 118, shin: 118, upper: 98, fore: 92, torso: 175, neck: 18, head: 92, hipW: 30, shW: 56 };
// pose: angles in degrees measured from straight down (positive = forward, toward facing direction)
export const POSES = {
  stand: () => ({ lean: 0, hipL: 2, kneeL: 0, hipR: -2, kneeR: 0, shL: 6, elL: -8, shR: -6, elR: -8, head: 0, bob: 0 }),
  walk: (t) => { const s = Math.sin(t * Math.PI * 2), c = Math.cos(t * Math.PI * 2);
    return { lean: 4, hipL: 26 * s, kneeL: -Math.max(0, -c) * 38 - 6, hipR: -26 * s, kneeR: -Math.max(0, c) * 38 - 6, shL: -24 * s, elL: -18, shR: 24 * s, elR: -18, head: 2, bob: -Math.abs(c) * 10 }; },
  run: (t) => { const s = Math.sin(t * Math.PI * 2), c = Math.cos(t * Math.PI * 2);
    return { lean: 14, hipL: 48 * s, kneeL: -Math.max(0, -c) * 95 - 15, hipR: -48 * s, kneeR: -Math.max(0, c) * 95 - 15, shL: -55 * s, elL: -85, shR: 55 * s, elR: -85, head: 6, bob: -Math.abs(s) * 26 + 10 }; },
  sit: () => ({ lean: -4, hipL: 88, kneeL: -88, hipR: 84, kneeR: -86, shL: 30, elL: -60, shR: 20, elR: -55, head: 2, bob: 0, seat: true }),
  sleep: () => ({ lean: 0, hipL: 4, kneeL: -10, hipR: 10, kneeR: -18, shL: 10, elL: -30, shR: 160, elR: -40, head: -6, bob: 0, lie: true, eyes: "closed" }),
  wave: (t) => ({ lean: 0, hipL: 2, kneeL: 0, hipR: -2, kneeR: 0, shL: 6, elL: -8, shR: 160 + 8 * Math.sin(t * Math.PI * 4), elR: -40 + 35 * Math.sin(t * Math.PI * 4), head: -3, bob: 0 }),
  point: () => ({ lean: 2, hipL: 6, kneeL: 0, hipR: -6, kneeR: 0, shL: 4, elL: -10, shR: 88, elR: -4, head: -2, bob: 0 }),
  shrug: () => ({ lean: 0, hipL: 2, kneeL: 0, hipR: -2, kneeR: 0, shL: 40, elL: -110, shR: 40, elR: -110, head: 6, bob: 0 }),
  cheer: () => ({ lean: -3, hipL: 4, kneeL: 0, hipR: -4, kneeR: 0, shL: 165, elL: -15, shR: 170, elR: -10, head: -8, bob: -6 }),
  scared: () => ({ lean: -10, hipL: -10, kneeL: -20, hipR: 18, kneeR: -10, shL: 120, elL: -90, shR: 130, elR: -80, head: -10, bob: 0 }),
};

function fk(o, ang, len) { const a = rad(ang); return [o[0] + Math.sin(a) * len, o[1] + Math.cos(a) * len]; }

// ---------------------------------------------------------------- the character
// view: "side" (facing right) or "front"
export function drawChar(g, sp, pose, opt = {}) {
  const sun = { a: rad(opt.sunDeg ?? 215), k: opt.sunK ?? 1 };          // sun from upper-left by default
  const view = opt.view || "side", F = view === "front";
  g.save();
  if (pose.lie) { g.translate(0, -42); g.rotate(-Math.PI / 2); g.translate(0, 0); }
  // hips placement
  const legLen = B.thigh + B.shin;
  let hipY = -legLen * Math.max(Math.cos(rad(pose.hipL)), Math.cos(rad(pose.hipR))) + (pose.bob || 0);
  if (pose.seat) hipY = -B.shin - 8;
  if (pose.lie) hipY = -legLen;
  const lean = rad(pose.lean || 0), hip = [0, hipY];
  const neck = [hip[0] + Math.sin(lean) * B.torso, hip[1] - Math.cos(lean) * B.torso];
  const headC = [neck[0] + Math.sin(lean + rad(pose.head || 0)) * (B.neck + B.head * 0.85), neck[1] - Math.cos(lean) * (B.neck + B.head * 0.85)];
  const shoulder = (side) => F ? [neck[0] + side * B.shW, neck[1] + 26] : [neck[0] + side * 6, neck[1] + 24];
  const hipJ = (side) => F ? [hip[0] + side * B.hipW, hip[1]] : [hip[0] + side * 4, hip[1]];
  const leg = (side, ha, ka) => { const h = hipJ(side), aH = F ? ha * 0.15 * side + side * 3 : ha, k = fk(h, aH, B.thigh), f = fk(k, (F ? aH : ha + ka), B.shin); return [h, k, f]; };
  const arm = (side, sa, ea) => { const s = shoulder(side), aS = F ? side * (12 + Math.max(0, sa) * 0.9) : sa, e = fk(s, aS, B.upper), w = fk(e, F ? aS + side * -ea * 0.6 : sa + ea * -1 * -1 + ea * 0, B.fore); return [s, e, w]; };
  // side view: far side = left limbs (drawn first, darker)
  const Lleg = leg(F ? -1 : 1, pose.hipL, pose.kneeL), Rleg = leg(1, pose.hipR, pose.kneeR);
  const armPts = (side, sa, ea) => { const s = shoulder(F ? side : 1); if (F) { const aS = side * (10 + Math.abs(sa) * 0.75); const e = fk(s, aS, B.upper); const w = fk(e, aS + side * Math.min(0, ea) * -0.5, B.fore); return [s, e, w]; }
    const e = fk(s, sa, B.upper), w = fk(e, sa - ea, B.fore); return [s, e, w]; };
  const Larm = armPts(-1, pose.shL, pose.elL), Rarm = armPts(1, pose.shR, pose.elR);
  const C = sp.colors, dim = (c) => mixHex(c, "#20243a", 0.22);
  const drawLeg = (pts, far) => {
    const pc = far && !F ? dim(C.pants) : C.pants;
    const lp = limbPath(pts, 46, 36); shadePath(g, lp, pc, sun, { bb: bbOf(pts) });
    const k = pts[1]; cloth(g, lp, bbOf(pts), "#000000", [[[k[0] - 14, k[1] - 6], [k[0], k[1] + 4], [k[0] + 12, k[1] - 8]], [[k[0] - 10, k[1] + 14], [k[0] + 2, k[1] + 20], [k[0] + 12, k[1] + 10]], [[pts[0][0] + 4, pts[0][1] + 20], [(pts[0][0] + k[0]) / 2 + 6, (pts[0][1] + k[1]) / 2], [k[0] + 4, k[1] - 16]]]);
    const f = pts[2], dir = F ? 0 : 1;
    if (sp.boots) { const bp = limbPath([[f[0], f[1] - 62], [f[0], f[1] - 8]], 36, 36); shadePath(g, bp, far && !F ? dim(C.boots) : C.boots, sun, { bb: bbOf([[f[0] - 30, f[1] - 70], [f[0] + 30, f[1]]]) }); }
    const shoe = F ? smoothPoly([[f[0] - 26, f[1] + 12], [f[0] - 24, f[1] - 10], [f[0], f[1] - 16], [f[0] + 24, f[1] - 10], [f[0] + 28, f[1] + 12]]) : smoothPoly([[f[0] - 20, f[1] + 12], [f[0] - 18, f[1] - 14], [f[0] + 12, f[1] - 12], [f[0] + 44, f[1] - 2], [f[0] + 50, f[1] + 12]]);
    shadePath(g, shoe, far && !F ? dim(C.boots) : C.boots, sun, { bb: bbOf([[f[0] - 40, f[1] - 20], [f[0] + 50, f[1] + 20]]) });
  };
  const drawArm = (pts, far) => {
    const cc = far && !F ? dim(C.coat) : C.coat;
    const ap = limbPath(pts, 40, 32); shadePath(g, ap, cc, sun, { bb: bbOf(pts) });
    const e = pts[1]; cloth(g, ap, bbOf(pts), "#000000", [[[e[0] - 12, e[1] - 4], [e[0], e[1] + 6], [e[0] + 12, e[1] - 4]], [[e[0] - 8, e[1] + 12], [e[0] + 2, e[1] + 16], [e[0] + 10, e[1] + 10]]]);
    if (sp.shirt) shadePath(g, circ(pts[2][0], pts[2][1], 17), "#f4f2ec", sun, { bb: bbOf([pts[2]], 30), rim: 0, ol: 5 });
    if (sp.cuffs) shadePath(g, circ(pts[2][0], pts[2][1], 16), C.cuffs, sun, { bb: bbOf([pts[2]], 30), rim: 0, ol: 5 });
    shadePath(g, circ(pts[2][0] + (F ? 0 : 6), pts[2][1] + 6, 19), sp.gloves || C.skin, sun, { bb: bbOf([pts[2]], 30), ol: 5 });
  };
  // torso outline (coat), slightly pear shaped
  const torsoPts = () => {
    const up = [Math.sin(lean), -Math.cos(lean)], rt = [Math.cos(lean), Math.sin(lean)], w0 = F ? 78 : 56, w1 = F ? 68 : 50, hem = sp.longCoat ? 60 : 22;
    const P = (u, v) => [hip[0] + up[0] * v + rt[0] * u, hip[1] + up[1] * v + rt[1] * u];
    return F ? [P(-w0, -hem), P(-w0 - 6, 40), P(-w1 - 4, B.torso - 30), P(-w1 + 18, B.torso + 4), P(w1 - 18, B.torso + 4), P(w1 + 4, B.torso - 30), P(w0 + 6, 40), P(w0, -hem), P(0, -hem - 8)]
      : [P(-w0 + 8, -hem), P(-w0, 50), P(-w1 + 6, B.torso - 20), P(-w1 + 26, B.torso + 4), P(w1 - 6, B.torso), P(w1 + 6, B.torso - 34), P(w0 + 10, 40), P(w0 + 4, -hem), P(0, -hem - 6)];
  };
  // ---- draw order
  if (!F) { drawArm(Larm, true); drawLeg(Lleg, true); }
  else { drawLeg(Lleg, false); drawLeg(Rleg, false); }
  if (!F) drawLeg(Rleg, false);
  const tp = torsoPts(), tpath = smoothPoly(tp);
  if (sp.dress) { const sk = smoothPoly([[hip[0] - 110, hip[1] + 110], [hip[0] - 62, hip[1] - 30], [hip[0] + 62, hip[1] - 30], [hip[0] + 110, hip[1] + 110], [hip[0], hip[1] + 122]]); shadePath(g, sk, C.dress, sun, { bb: bbOf(tp) }); cloth(g, sk, bbOf(tp), "#000000", [[[hip[0] - 30, hip[1] - 10], [hip[0] - 50, hip[1] + 50], [hip[0] - 60, hip[1] + 110]], [[hip[0] + 30, hip[1] - 10], [hip[0] + 46, hip[1] + 50], [hip[0] + 64, hip[1] + 110]]]); }
  shadePath(g, tpath, C.coat, sun, { bb: bbOf(tp) });
  cloth(g, tpath, bbOf(tp), "#000000", [[[hip[0] - 40, hip[1] - 10], [hip[0] - 20, hip[1] - 40], [hip[0] - 34, hip[1] - 70]], [[hip[0] + 36, hip[1] - 14], [hip[0] + 22, hip[1] - 50], [hip[0] + 40, hip[1] - 80]]]);
  // coat details: lapels / vest / buttons / belt / sash
  g.save(); g.clip(tpath);
  const nx = F ? neck[0] : neck[0] + 30, ny = neck[1];
  if (sp.shirt) { const sv = poly([[nx - (F ? 40 : 14), ny + 18], [nx + (F ? 40 : 26), ny + 18], [nx + (F ? 0 : 8), ny + 120]]); shadePath(g, sv, "#f4f2ec", sun, { bb: bbOf(tp), ol: 4, rim: 0 }); }
  if (sp.tie) { const tt = smoothPoly([[nx - 10, ny + 26], [nx + 10, ny + 26], [nx + 16, ny + 120], [nx, ny + 140], [nx - 16, ny + 120]]); shadePath(g, tt, C.tie, sun, { bb: bbOf(tp), ol: 4, rim: 0 }); }
  if (sp.lapels) for (const s2 of (F ? [-1, 1] : [1])) { const lp2 = poly([[nx + s2 * (F ? 6 : 0), ny + 14], [nx + s2 * (F ? 56 : 30), ny + 22], [nx + s2 * (F ? 10 : 12), ny + 150]]); shadePath(g, lp2, mixHex(C.coat, "#000000", 0.18), sun, { bb: bbOf(tp), ol: 4, rim: 0 }); }
  if (sp.pockets) for (const s2 of (F ? [-1, 1] : [1])) { const px0 = hip[0] + (F ? s2 * 40 : 26), py0 = hip[1] - 50; g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.moveTo(px0 - 24, py0); g.lineTo(px0 + 24, py0); g.stroke(); if (sp.pen && s2 > 0) { g.fillStyle = "#2a3a7a"; g.fillRect(px0 + 8, ny + 50, 6, 30); } }
  const up = [Math.sin(lean), -Math.cos(lean)];
  if (sp.vest) { const vx = F ? 0 : 30; const vp = smoothPoly([[hip[0] + vx - (F ? 34 : 18), hip[1] + 10], [neck[0] + vx - (F ? 26 : 12), neck[1] + 20], [neck[0] + vx + (F ? 26 : 22), neck[1] + 20], [hip[0] + vx + (F ? 34 : 26), hip[1] + 10]]); shadePath(g, vp, C.vest, sun, { bb: bbOf(tp), ol: 4, rim: 0 }); }
  if (sp.sash) { g.lineWidth = 26; g.strokeStyle = C.sash; g.beginPath(); g.moveTo(neck[0] - 60, neck[1] + 30); g.lineTo(hip[0] + 70, hip[1] - 10); g.stroke(); }
  if (sp.belt) { g.fillStyle = C.belt; g.fillRect(hip[0] - 100, hip[1] - 30 + up[1] * 0, 200, 22); }
  if (sp.buttons) for (let k = 0; k < 5; k++) { const bx = hip[0] + up[0] * (30 + k * 30) + (F ? 0 : 38), by = hip[1] + up[1] * (30 + k * 30); for (const s of (F ? [-22, 22] : [0])) { g.beginPath(); g.arc(bx + s, by, 7, 0, 7); g.fillStyle = C.buttons; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); } }
  g.restore();
  if (sp.epaulettes) for (const side of (F ? [-1, 1] : [1])) { const s = shoulder(F ? side : 1); const ep = ell(s[0] + (F ? side * 8 : 0), s[1] - 10, F ? 34 : 28, 14); shadePath(g, ep, C.gold, sun, { bb: bbOf([s], 40), ol: 5 }); for (let k = -3; k <= 3; k++) { g.lineWidth = 4; g.strokeStyle = C.gold; g.beginPath(); g.moveTo(s[0] + (F ? side * 8 : 0) + k * 8, s[1] - 2); g.lineTo(s[0] + (F ? side * 8 : 0) + k * 8, s[1] + 16); g.stroke(); } }
  if (F) { drawArm(Larm, false); drawArm(Rarm, false); }
  // ---- head
  drawHead(g, sp, headC, sun, F, pose, opt);
  if (!F) drawArm(Rarm, false);
  if (pose.lie && opt.zzz !== false) { g.save(); g.rotate(Math.PI / 2); g.restore(); }
  g.restore();
  if (pose.lie && opt.zzz !== false) { g.save(); g.font = "bold 64px Arial"; g.fillStyle = "#ffffff"; g.strokeStyle = INK; g.lineWidth = 8; for (const [i, z] of ["z", "Z", "Z"].entries()) { g.strokeText(z, -560 + i * 46, -150 - i * 58); g.fillText(z, -560 + i * 46, -150 - i * 58); } g.restore(); }
}

function drawHead(g, sp, c, sun, F, pose, opt) {
  const C = sp.colors, r = B.head, x = c[0], y = c[1];
  // hair back
  if (sp.longHair && F) { const lh = smoothPoly([[x - r * 1.0, y - r * 0.6], [x + r * 1.0, y - r * 0.6], [x + r * 1.12, y + r * 0.6], [x + r * 0.9, y + r * 1.25], [x - r * 0.9, y + r * 1.25], [x - r * 1.12, y + r * 0.6]]); shadePath(g, lh, C.hair, sun, { bb: { x: x - r, y: y - r, w: 2 * r, h: 2.3 * r } }); }
  if (sp.hair && sp.hair !== "bald") shadePath(g, F ? ell(x, y - 6, r + 8, r + 4) : ell(x - 8, y - 6, r + 6, r + 4), C.hair, sun, { bb: { x: x - r - 20, y: y - r - 20, w: 2 * r + 40, h: 2 * r + 40 } });
  // ear (side)
  if (!F) shadePath(g, ell(x - 14, y + 6, 18, 24), C.skin, sun, { bb: { x: x - 40, y: y - 30, w: 60, h: 70 }, ol: 5 });
  // face
  if (F) { for (const s2 of [-1, 1]) shadePath(g, ell(x + s2 * r * 0.86, y + 8, 16, 24), C.skin, sun, { bb: { x: x - r, y: y - r, w: 2 * r, h: 2 * r }, ol: 5 }); }
  const face = F ? smoothPoly([[x, y - r * 1.02], [x + r * 0.62, y - r * 0.86], [x + r * 0.86, y - r * 0.3], [x + r * 0.84, y + r * 0.3], [x + r * 0.6, y + r * 0.8], [x + r * 0.2, y + r * 1.06], [x - r * 0.2, y + r * 1.06], [x - r * 0.6, y + r * 0.8], [x - r * 0.84, y + r * 0.3], [x - r * 0.86, y - r * 0.3], [x - r * 0.62, y - r * 0.86]]) : smoothPoly([[x - r, y - 10], [x - r * 0.7, y - r * 0.8], [x + r * 0.25, y - r * 0.98], [x + r * 0.95, y - r * 0.35], [x + r * 1.04, y + r * 0.15], [x + r * 0.8, y + r * 0.7], [x + r * 0.1, y + r * 0.98], [x - r * 0.75, y + r * 0.7]]);
  shadePath(g, face, C.skin, { a: sun.a, k: sun.k * 0.8 }, { bb: { x: x - r, y: y - r, w: 2 * r, h: 2 * r } });
  // soft bounce light under the chin side and blush
  g.save(); g.clip(face);
  const fx = F ? x : x + 30;
  for (const s of (F ? [-1, 1] : [1])) { g.fillStyle = "rgba(240,140,130,0.28)"; g.beginPath(); g.ellipse(fx + s * 46, y + 26, 20, 11, 0, 0, 7); g.fill(); }
  g.restore();
  if (F) { g.lineWidth = 4.5; g.strokeStyle = mixHex(C.skin, "#6a3a2a", 0.55); g.lineCap = "round"; g.beginPath(); g.moveTo(x - 2, y + 4); g.quadraticCurveTo(x + 9, y + 20, x - 4, y + 24); g.stroke(); }
  // eyes, brows, mouth
  const ex = F ? [x - 32, x + 32] : [x + 36], ey = y - 6, closed = pose.eyes === "closed" || opt.eyes === "closed", ex2 = opt.expr || sp.expr || "neutral";
  g.lineCap = "round";
  for (const e of ex) {
    if (closed) { g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.arc(e, ey, 13, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    else if (ex2 === "happy") { g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.arc(e, ey + 8, 13, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
    else if (ex2 === "shock") { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(e, ey, 15, 19, 0, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(e + (F ? 0 : 3), ey + 2, 6, 0, 7); g.fill(); }
    else { g.fillStyle = INK; g.beginPath(); g.ellipse(e, ey, 9, 13, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(e + 3, ey - 5, 3.5, 0, 7); g.fill(); }
    // brows
    g.lineWidth = 9; g.strokeStyle = sp.browCol || INK; g.beginPath();
    if (ex2 === "angry") { g.moveTo(e - 16, ey - 30); g.lineTo(e + 14, ey - 20); } else if (ex2 === "shock") { g.arc(e, ey - 18, 16, 1.2 * Math.PI, 1.8 * Math.PI); } else { g.moveTo(e - 16, ey - 28); g.quadraticCurveTo(e, ey - 34, e + 16, ey - 27); }
    g.stroke();
  }
  // nose (side)
  if (!F) { g.lineWidth = 5; g.strokeStyle = mixHex(C.skin, "#7a4a3a", 0.55); g.beginPath(); g.moveTo(x + r * 0.86, y + 2); g.quadraticCurveTo(x + r * 0.97, y + 16, x + r * 0.84, y + 24); g.stroke(); }
  const mx = F ? x : x + 46, my = y + 44;
  g.lineWidth = 7; g.strokeStyle = INK;
  if (ex2 === "happy" || ex2 === "laugh") { g.fillStyle = "#8a2a32"; g.beginPath(); g.moveTo(mx - 24, my - 4); g.quadraticCurveTo(mx, my + 34, mx + 24, my - 4); g.closePath(); g.fill(); g.stroke(); }
  else if (ex2 === "shock" || pose.talkOpen) { g.fillStyle = "#8a2a32"; g.beginPath(); g.ellipse(mx, my + 6, 13, 18, 0, 0, 7); g.fill(); g.stroke(); }
  else if (ex2 === "angry") { g.beginPath(); g.arc(mx, my + 18, 16, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
  else { g.beginPath(); g.arc(mx, my - 8, 18, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
  if (sp.stache) { const sc = C.hair; for (const s of (F ? [-1, 1] : [1])) { const sx = F ? mx : mx - 6; shadePath(g, smoothPoly([[sx, my - 10], [sx + s * 30, my - 14], [sx + s * 40, my - 2], [sx + s * 12, my - 2]]), sc, sun, { bb: { x: sx - 50, y: my - 30, w: 100, h: 40 }, ol: 4, rim: 0 }); } }
  if (sp.glasses) { g.lineWidth = 5; g.strokeStyle = INK; const gx = F ? [x - 32, x + 32] : [x + 36]; for (const e2 of gx) { g.beginPath(); g.arc(e2, y - 6, 24, 0, 7); g.stroke(); } if (F) { g.beginPath(); g.moveTo(x - 8, y - 8); g.lineTo(x + 8, y - 8); g.stroke(); } }
  // hair front / fringe
  if (sp.hair === "fringe") { const hp = F ? smoothPoly([[x - r - 4, y - 10], [x - r * 0.8, y - r * 0.85], [x, y - r - 12], [x + r * 0.8, y - r * 0.85], [x + r + 4, y - 10], [x + r * 0.6, y - r * 0.45], [x + 10, y - r * 0.6], [x - r * 0.4, y - r * 0.4]]) : smoothPoly([[x - r - 2, y + 10], [x - r * 0.85, y - r * 0.8], [x + r * 0.1, y - r - 12], [x + r * 0.85, y - r * 0.6], [x + r * 0.5, y - r * 0.45], [x - r * 0.1, y - r * 0.5], [x - r * 0.45, y - r * 0.1], [x - r * 0.7, y + 18]]);
    shadePath(g, hp, C.hair, sun, { bb: { x: x - r, y: y - r - 20, w: 2 * r, h: r * 1.5 } });
    g.save(); g.clip(hp); g.lineCap = "round";
    for (let k = 0; k < 46; k++) { const t = k / 45, sx = x - r + t * 2 * r + jit() * 6, dark = k % 3 === 0; g.strokeStyle = dark ? mixHex(C.hair, "#000000", 0.4) : mixHex(C.hair, "#ffffff", 0.28); g.globalAlpha = dark ? 0.55 : 0.4; g.lineWidth = dark ? 3 : 2;
      g.beginPath(); g.moveTo(sx + (F ? (t - 0.5) * 30 : -20), y - r - 10); g.quadraticCurveTo(sx + (F ? (t - 0.5) * 60 : 10), y - r * 0.6, sx + (F ? (t - 0.5) * 80 : 30) + jit() * 8, y - r * 0.2); g.stroke(); }
    g.restore(); }
  // hats
  if (sp.hat === "bicorne") {
    const hp = F ? smoothPoly([[x - r * 1.45, y - r * 0.55], [x - r * 0.6, y - r * 1.55], [x, y - r * 1.62], [x + r * 0.6, y - r * 1.55], [x + r * 1.45, y - r * 0.55], [x, y - r * 0.82]])
      : smoothPoly([[x - r * 0.9, y - r * 0.55], [x - r * 0.4, y - r * 1.75], [x + r * 0.35, y - r * 1.72], [x + r * 0.85, y - r * 0.55], [x, y - r * 0.8]]);
    shadePath(g, hp, C.hat, sun, { bb: { x: x - r * 1.5, y: y - r * 1.8, w: r * 3, h: r * 1.4 } });
    g.lineWidth = 7; g.strokeStyle = C.gold; g.beginPath(); if (F) { g.moveTo(x - r * 1.3, y - r * 0.62); g.quadraticCurveTo(x, y - r * 0.92, x + r * 1.3, y - r * 0.62); } else { g.moveTo(x - r * 0.8, y - r * 0.6); g.quadraticCurveTo(x, y - r * 0.86, x + r * 0.78, y - r * 0.6); } g.stroke();
    const ck = F ? [x + r * 0.55, y - r * 1.12] : [x + r * 0.05, y - r * 1.15];
    for (const [rr, col] of [[22, "#2a46a8"], [15, "#f4f0e6"], [8, "#c8262c"]]) { g.beginPath(); g.arc(ck[0], ck[1], rr, 0, 7); g.fillStyle = col; g.fill(); } g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.arc(ck[0], ck[1], 22, 0, 7); g.stroke();
    if (sp.plume) { const pl = smoothPoly([[x - 10, y - r * 1.6], [x + 30, y - r * 2.2], [x + 70, y - r * 2.15], [x + 26, y - r * 1.62]]); shadePath(g, pl, C.plume, sun, { bb: { x: x - 20, y: y - r * 2.3, w: 110, h: 80 }, ol: 5 }); }
  } else if (sp.hat === "tricorne") {
    const hp = smoothPoly([[x - r * 1.15, y - r * 0.6], [x - r * 0.55, y - r * 1.45], [x + r * 0.55, y - r * 1.45], [x + r * 1.15, y - r * 0.6], [x, y - r * 0.85]]);
    shadePath(g, hp, C.hat, sun, { bb: { x: x - r * 1.2, y: y - r * 1.5, w: r * 2.4, h: r } });
    g.lineWidth = 6; g.strokeStyle = C.trim || "#d9b45a"; g.stroke(hp);
  } else if (sp.hat === "cap") {
    const hp = smoothPoly([[x - r * 0.95, y - r * 0.4], [x - r * 0.75, y - r * 1.05], [x + r * 0.2, y - r * 1.15], [x + r * 0.95, y - r * 0.75], [x + r * (F ? 0.95 : 1.4), y - r * 0.42]]);
    shadePath(g, hp, C.hat, sun, { bb: { x: x - r, y: y - r * 1.2, w: r * 2.5, h: r } });
  } else if (sp.hat === "bearskin") {
    shadePath(g, ell(x, y - r * 1.15, r * 0.95, r * 0.95), C.hat, sun, { bb: { x: x - r, y: y - r * 2.1, w: r * 2, h: r * 2 } });
  }
}

// ---------------------------------------------------------------- rabbit
export function drawRabbit(g, col, pose = {}, opt = {}) {
  const sun = { a: rad(opt.sunDeg ?? 215), k: opt.sunK ?? 1 }, t = pose.t || 0, hop = pose.hop ? Math.abs(Math.sin(t * Math.PI * 2)) * 60 : 0;
  g.save(); g.translate(0, -hop); if (pose.flip) g.scale(-1, 1);
  const belly = "#f7f0e4", dk = mixHex(col, "#3a2a20", 0.25);
  shadePath(g, ell(-70, -10, 34, 16), dk, sun, { bb: { x: -110, y: -30, w: 80, h: 40 } });                  // far foot
  shadePath(g, smoothPoly([[-100, -60], [-70, -130], [10, -150], [70, -110], [80, -40], [30, -5], [-60, -5]]), col, sun, { bb: { x: -110, y: -160, w: 200, h: 160 } }); // body
  shadePath(g, ell(-104, -78, 22, 22), belly, sun, { bb: { x: -130, y: -100, w: 50, h: 50 } });                 // tail
  shadePath(g, ell(40, -6, 40, 15), col, sun, { bb: { x: 0, y: -25, w: 85, h: 40 } });                       // near foot
  // ears
  for (const [dx, rot] of [[54, -0.35], [80, -0.1]]) { const ep = ell(dx, -250, 18, 62, rot); shadePath(g, ep, col, sun, { bb: { x: dx - 30, y: -320, w: 60, h: 140 } }); g.save(); g.clip(ep); g.fillStyle = "#f2a8b0"; g.beginPath(); g.ellipse(dx + 2, -246, 8, 44, rot, 0, 7); g.fill(); g.restore(); }
  // head
  const hp = smoothPoly([[30, -150], [60, -200], [110, -205], [150, -165], [150, -125], [110, -100], [50, -105]]);
  shadePath(g, hp, col, sun, { bb: { x: 20, y: -215, w: 140, h: 120 } });
  shadePath(g, ell(126, -126, 22, 16), belly, sun, { bb: { x: 100, y: -145, w: 50, h: 35 }, ol: 0, rim: 0 });
  g.fillStyle = "#1d1418"; g.beginPath(); g.ellipse(108, -160, 11, 14, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(112, -165, 4, 0, 7); g.fill();
  g.fillStyle = "#e88a96"; g.beginPath(); g.ellipse(148, -138, 7, 6, 0, 0, 7); g.fill();
  g.fillStyle = "rgba(240,140,140,0.35)"; g.beginPath(); g.ellipse(118, -128, 12, 7, 0, 0, 7); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- cast for video 18
export const CAST18 = {
  napoleon: { name: "Napoleon", hat: "bicorne", hair: "fringe", vest: true, buttons: true, epaulettes: true, boots: true, cuffs: true, longCoat: true,
    colors: { coat: "#24366f", pants: "#f1ece0", boots: "#17131a", skin: "#f6dcc4", hair: "#2a1c16", hat: "#16131a", gold: "#e0ae3c", vest: "#f4f0e6", buttons: "#e8c04a", cuffs: "#c8262c" }, expr: "neutral" },
  berthier: { name: "Berthier", hat: "bicorne", plume: true, hair: "fringe", vest: true, buttons: true, epaulettes: true, boots: true, sash: true, stache: true, longCoat: true,
    colors: { coat: "#24366f", pants: "#f1ece0", boots: "#17131a", skin: "#f3d6bc", hair: "#6a4a32", hat: "#16131a", gold: "#e0ae3c", vest: "#f4f0e6", buttons: "#e8c04a", sash: "#c8262c", plume: "#f6f2ea" }, expr: "happy" },
  hunter: { name: "Hunter", hat: "tricorne", hair: "fringe", buttons: true, boots: true, belt: true, stache: true, longCoat: true,
    colors: { coat: "#2f6a3a", pants: "#d9ccae", boots: "#3a2618", skin: "#f0cfae", hair: "#7a5232", hat: "#1e1a18", buttons: "#d6b25a", belt: "#4a2e1c", trim: "#d6b25a" }, expr: "happy" },
  farmer: { name: "Farmer", hat: "cap", hair: "fringe", buttons: true, belt: true, stache: true,
    colors: { coat: "#9a6e42", pants: "#5c5040", boots: "#4a3020", skin: "#eec6a0", hair: "#a07a44", hat: "#6a5236", buttons: "#5a3a22", belt: "#3a2a1a" }, expr: "happy" },
  grenadier: { name: "Grenadier", hat: "bearskin", hair: "fringe", vest: true, buttons: true, boots: true, stache: true, sash: true,
    colors: { coat: "#24366f", pants: "#f1ece0", boots: "#17131a", skin: "#f3d4b8", hair: "#2a1c16", hat: "#0f0d0e", vest: "#f4f0e6", buttons: "#e8c04a", sash: "#f4f0e6" }, expr: "neutral" },
};

export const MWC = {
  percy: { name: "Percy", hair: "fringe", glasses: true, shirt: true, tie: true, lapels: true, pockets: true, pen: true, buttons: false, longCoat: true, expr: "neutral",
    colors: { coat: "#5b6170", pants: "#4c515e", boots: "#1a1416", skin: "#f3d1b4", hair: "#a29c94", tie: "#9a2e34", buttons: "#2a2a2a" } },
  kid: { name: "Young Percy", hat: "cap", hair: "fringe", shirt: true, buttons: true, belt: true, expr: "neutral",
    colors: { coat: "#6b7a8a", pants: "#4a5a6a", boots: "#3a2a1a", skin: "#f6dcc2", hair: "#6a4a2a", hat: "#5a4a3a", buttons: "#3a2a1a", belt: "#3a2618" } },
  eng1: { name: "Engineer", hair: "fringe", shirt: true, tie: true, lapels: true, pockets: true, pen: true, longCoat: true, stache: true, expr: "happy",
    colors: { coat: "#f2f1ec", pants: "#4a4e58", boots: "#1a1416", skin: "#f3d6bc", hair: "#3a2a20", tie: "#2f4f8a" } },
  eng2: { name: "Engineer", hair: "fringe", glasses: true, shirt: true, tie: true, lapels: true, pockets: true, longCoat: true, expr: "neutral",
    colors: { coat: "#f2f1ec", pants: "#5a4e44", boots: "#2a1e16", skin: "#e8c6a4", hair: "#8a5a34", tie: "#3a6a3a" } },
  eng3: { name: "Engineer", hair: "fringe", shirt: true, tie: true, lapels: true, pockets: true, longCoat: true, stache: true, expr: "happy",
    colors: { coat: "#f2f1ec", pants: "#3a3e48", boots: "#1a1416", skin: "#b8835e", hair: "#1a1412", tie: "#8a3a2a" } },
  engw: { name: "Engineer", hair: "fringe", longHair: true, dress: true, lapels: true, pockets: true, longCoat: true, expr: "happy",
    colors: { coat: "#f2f1ec", pants: "#f3d6bc", boots: "#1a1416", skin: "#f3d6bc", hair: "#7a4a26", dress: "#3f6fb5" } },
  boss: { name: "Company boss", hair: "fringe", shirt: true, tie: true, lapels: true, pockets: true, longCoat: true, stache: true, expr: "neutral",
    colors: { coat: "#2a2c3e", pants: "#2a2c3e", boots: "#141012", skin: "#f6ddc8", hair: "#e2ded6", tie: "#2f4f8a" } },
  mom: { name: "Mom", hair: "fringe", longHair: true, dress: true, shirt: true, expr: "happy",
    colors: { coat: "#efe4cc", pants: "#b8835e", boots: "#3a2a1a", skin: "#b8835e", hair: "#3a2418", dress: "#3f8a6a" } },
};
