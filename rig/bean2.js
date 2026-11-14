// bean2.js: reference-style 2D characters: peanut body, big flat face, thick ink, noodle limbs, soft sun gradient.
// drawBean(g, spec, pose, opt): origin at the ground between the feet, ~600 px tall.
const INK = "#15110f";
const rad = (d) => (d * Math.PI) / 180;
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => "#" + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");

let RS = 7; const rnd = () => { RS = (RS * 16807) % 2147483647; return RS / 2147483647; };
function fabric(g, path, bb, base) {
  g.save(); g.clip(path);
  g.globalAlpha = 0.07; g.strokeStyle = "#000"; g.lineWidth = 1.5;
  for (let x = bb.x - bb.h; x < bb.x + bb.w + bb.h; x += 5) { g.beginPath(); g.moveTo(x, bb.y); g.lineTo(x + bb.h * 0.6, bb.y + bb.h); g.stroke(); }
  g.globalAlpha = 0.05; g.strokeStyle = "#fff";
  for (let x = bb.x - bb.h; x < bb.x + bb.w + bb.h; x += 5) { g.beginPath(); g.moveTo(x, bb.y + bb.h); g.lineTo(x + bb.h * 0.6, bb.y); g.stroke(); }
  g.globalAlpha = 1;
  for (let i = 0; i < 260; i++) { const x = bb.x + rnd() * bb.w, y = bb.y + rnd() * bb.h; g.fillStyle = rnd() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"; g.fillRect(x, y, 3, 3); }
  const cx = bb.x + bb.w / 2;   // soft cloth folds
  g.strokeStyle = "rgba(20,16,24,0.22)"; g.lineWidth = 4; g.lineCap = "round";
  for (const [dx, y0, y1, bend] of [[-0.3, 0.55, 0.85, -12], [0.28, 0.5, 0.82, 14], [-0.05, 0.12, 0.3, 8]]) { g.beginPath(); g.moveTo(cx + dx * bb.w, bb.y + y0 * bb.h); g.quadraticCurveTo(cx + dx * bb.w + bend, bb.y + (y0 + y1) / 2 * bb.h, cx + dx * bb.w - bend * 0.3, bb.y + y1 * bb.h); g.stroke(); }
  g.restore();
}
function hairStrands(g, path, bb, col) {
  g.save(); g.clip(path); g.lineCap = "round";
  const n = Math.round(bb.w / 3.2);
  for (let i = 0; i < n; i++) { const t = i / n, x = bb.x + t * bb.w + (rnd() - 0.5) * 6, dark = rnd() < 0.4;
    g.strokeStyle = dark ? mix(col, "#000000", 0.45) : mix(col, "#ffffff", 0.3); g.globalAlpha = dark ? 0.5 : 0.35; g.lineWidth = dark ? 2.6 : 1.8;
    g.beginPath(); g.moveTo(bb.x + bb.w * 0.5 + (t - 0.5) * bb.w * 0.3, bb.y - 4); g.quadraticCurveTo(x, bb.y + bb.h * 0.35, x + (t - 0.5) * bb.w * 0.35 + (rnd() - 0.5) * 8, bb.y + bb.h + 6); g.stroke(); }
  g.globalAlpha = 1; g.restore();
}
function fillLit(g, path, base, sun, bb, o = {}) {
  const lx = Math.cos(sun.a), ly = Math.sin(sun.a), cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2, R = Math.max(bb.w, bb.h) * 0.62;
  g.save(); g.fillStyle = base; g.fill(path); g.clip(path);
  const gr = g.createLinearGradient(cx + lx * R, cy + ly * R, cx - lx * R, cy - ly * R);
  gr.addColorStop(0, mix(base, "#fff1cc", 0.42 * sun.k)); gr.addColorStop(0.42, mix(base, "#fff1cc", 0.08 * sun.k)); gr.addColorStop(0.7, base); gr.addColorStop(1, mix(base, "#25305e", 0.32 * sun.k));
  g.fillStyle = gr; g.fillRect(bb.x - 40, bb.y - 40, bb.w + 80, bb.h + 80);
  const bo = g.createLinearGradient(0, bb.y + bb.h, 0, bb.y + bb.h * 0.55);   // cool bounce light + occlusion at the bottom
  bo.addColorStop(0, "rgba(40,50,90,0.22)"); bo.addColorStop(0.35, "rgba(150,180,230,0.10)"); bo.addColorStop(1, "rgba(150,180,230,0)");
  g.fillStyle = bo; g.fillRect(bb.x - 40, bb.y, bb.w + 80, bb.h + 40);
  if (o.sheen !== false) { // soft vertical sheen like the reference bodies
    const sh = g.createLinearGradient(cx - bb.w * 0.5, 0, cx + bb.w * 0.5, 0);
    sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.28, "rgba(255,255,255,0.16)"); sh.addColorStop(0.4, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(0,0,0,0.06)");
    g.fillStyle = sh; g.fillRect(bb.x, bb.y, bb.w, bb.h);
  }
  if (sun.shaft) { // the yellow sun shaft crossing the character
    g.fillStyle = "rgba(255,214,60,0.32)"; g.beginPath(); g.moveTo(sun.shaft[0], -2000); g.lineTo(sun.shaft[0] + sun.shaft[1], -2000); g.lineTo(sun.shaft[0] + sun.shaft[1] - 900, 400); g.lineTo(sun.shaft[0] - 900, 400); g.fill();
  }
  g.translate(-lx * 6, -ly * 6); g.lineWidth = 12; g.strokeStyle = `rgba(255,240,200,${0.5 * sun.k})`; g.stroke(path);
  g.restore();
  g.lineWidth = o.ol ?? 9; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(path);
  if ((o.ol ?? 9) > 4) { g.save(); g.translate(1.6, 1.2); g.lineWidth = (o.ol ?? 9) * 0.55; g.strokeStyle = "rgba(21,17,15,0.55)"; g.stroke(path); g.restore(); }
}
const P = () => new Path2D();
const ellP = (x, y, rx, ry, r = 0) => { const p = P(); p.ellipse(x, y, rx, ry, r, 0, Math.PI * 2); return p; };
const smooth = (pts) => { const p = P(), n = pts.length; p.moveTo(...pts[0]); for (let i = 0; i < n; i++) { const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n], d = pts[(i + 2) % n]; p.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]); } p.closePath(); return p; };
// noodle limb: smooth curve through 3 points, ink stroke with a thin coloured core (sleeve) at the top
function noodle(g, a, b, c, w = 8) {
  g.save(); g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = INK; g.lineWidth = w;
  g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(b[0] * 2 - (a[0] + c[0]) / 2, b[1] * 2 - (a[1] + c[1]) / 2, ...c); g.stroke(); g.restore();
}
const fk = (o, ang, len) => [o[0] + Math.sin(rad(ang)) * len, o[1] + Math.cos(rad(ang)) * len];

// poses: degrees from straight down, positive = toward facing direction
export const MOVES = {
  stand: () => ({ hipL: 4, kneeL: 0, hipR: -4, kneeR: 0, shL: 14, elL: -10, shR: -14, elR: -10, lean: 0, bob: 0 }),
  walk: (t) => { const s = Math.sin(t * 6.283), c = Math.cos(t * 6.283); return { hipL: 28 * s, kneeL: -Math.max(0, -c) * 45, hipR: -28 * s, kneeR: -Math.max(0, c) * 45, shL: -30 * s, elL: -20, shR: 30 * s, elR: -20, lean: 3, bob: -Math.abs(c) * 12 }; },
  run: (t) => { const s = Math.sin(t * 6.283), c = Math.cos(t * 6.283); return { hipL: 50 * s, kneeL: -Math.max(0, -c) * 100 - 10, hipR: -50 * s, kneeR: -Math.max(0, c) * 100 - 10, shL: -65 * s, elL: -90, shR: 65 * s, elR: -90, lean: 14, bob: -Math.abs(s) * 30 + 12 }; },
  sit: () => ({ hipL: 90, kneeL: -90, hipR: 86, kneeR: -88, shL: 40, elL: -60, shR: 30, elR: -50, lean: -4, bob: 0, seat: true }),
  feetUp: () => ({ hipL: 100, kneeL: -10, hipR: 96, kneeR: -14, shL: 150, elL: -120, shR: 60, elR: -90, lean: -18, bob: 0, seat: true }),
  sleep: () => ({ hipL: 6, kneeL: -12, hipR: 12, kneeR: -20, shL: 20, elL: -40, shR: 150, elR: -60, lean: 0, bob: 0, lie: true }),
  wave: (t) => ({ hipL: 4, kneeL: 0, hipR: -4, kneeR: 0, shL: 14, elL: -10, shR: 155 + 10 * Math.sin(t * 12.6), elR: -40 + 40 * Math.sin(t * 12.6), lean: 0, bob: 0 }),
  point: () => ({ hipL: 6, kneeL: 0, hipR: -6, kneeR: 0, shL: 14, elL: -10, shR: 92, elR: 0, lean: 3, bob: 0 }),
  cheer: () => ({ hipL: 6, kneeL: 0, hipR: -6, kneeR: 0, shL: 170, elL: -20, shR: 168, elR: -20, lean: -2, bob: -10 }),
  scared: () => ({ hipL: -12, kneeL: -25, hipR: 20, kneeR: -10, shL: 130, elL: -100, shR: 135, elR: -95, lean: -12, bob: 0 }),
  shrug: () => ({ hipL: 4, kneeL: 0, hipR: -4, kneeR: 0, shL: 50, elL: -120, shR: 50, elR: -120, lean: 0, bob: 0 }),
  hold: () => ({ hipL: 4, kneeL: 0, hipR: -4, kneeR: 0, shL: 40, elL: -100, shR: 40, elR: -100, lean: 0, bob: 0 }),
};

export function drawBean(g, sp, pose, opt = {}) {
  const sun = { a: rad(opt.sunDeg ?? 215), k: opt.sunK ?? 1, shaft: opt.shaft }, side = opt.view === "side", C = sp.colors;
  const W = sp.wide ?? 1.0, legL = 150 * (sp.legs ?? 1), bodyH = 330 * (sp.tall ?? 1), bodyW = 82 * W, headR = 128 * (sp.head ?? 1);
  g.save(); if (pose.lie) { g.translate(0, -60); g.rotate(-Math.PI / 2); }
  let hipY = -legL * Math.max(Math.cos(rad(pose.hipL)), Math.cos(rad(pose.hipR))) * 1.85 + (pose.bob || 0);
  if (pose.seat) hipY = -legL * 0.95; if (pose.lie) hipY = -legL * 1.85;
  const lean = rad(pose.lean || 0), hip = [0, hipY];
  const up = [Math.sin(lean), -Math.cos(lean)];
  const at = (u, v) => [hip[0] + up[0] * v + Math.cos(lean) * u, hip[1] + up[1] * v + Math.sin(lean) * u];
  // legs: noodles to shoes
  const leg = (s, ha, ka) => { const h = at(side ? s * 6 : s * 28, 26), k = fk(h, side ? ha : s * 4 + ha * 0.2, legL * 0.95), f = fk(k, side ? ha + ka : s * 4, legL * 0.95); return [h, k, f]; };
  const shoe = (f, far) => { const p = side ? ellP(f[0] + 14, f[1] - 2, 26, 13) : ellP(f[0], f[1] - 4, 20, 13); fillLit(g, p, far ? mix(C.shoes, "#000000", 0.2) : C.shoes, sun, { x: f[0] - 40, y: f[1] - 25, w: 90, h: 30 }, { ol: 7, sheen: false }); };
  const L = leg(side ? 1 : -1, pose.hipL, pose.kneeL), R = leg(1, pose.hipR, pose.kneeR);
  const sh = (s) => at(side ? 10 : s * bodyW * 0.86, bodyH * 0.66);
  const arm = (s, sa, ea) => { const o = sh(s), aa = side ? sa : s * (10 + Math.abs(sa) * 0.85), e = fk(o, aa, 82), w = fk(e, side ? sa - ea : aa + s * -Math.min(0, ea) * 0.6, 78); return [o, e, w]; };
  const AL = arm(-1, pose.shL, pose.elL), AR = arm(1, pose.shR, pose.elR);
  const hand = (p) => { g.fillStyle = INK; g.beginPath(); g.ellipse(p[0], p[1], 11, 12, 0, 0, 7); g.fill(); };
  if (side) { noodle(g, ...AL); hand(AL[2]); }
  noodle(g, ...L, 8); shoe(L[2], side); noodle(g, ...R, 8); shoe(R[2], false);
  // peanut body: wider hips, slight waist, rounded shoulders
  const bw = side ? bodyW * 0.72 : bodyW;
  const body = smooth([at(-bw * 0.92, 14), at(-bw * 1.0, bodyH * 0.3), at(-bw * 0.9, bodyH * 0.62), at(-bw * 0.72, bodyH * 0.9), at(0, bodyH * 1.0), at(bw * 0.72, bodyH * 0.9), at(bw * 0.9, bodyH * 0.62), at(bw * 1.0, bodyH * 0.3), at(bw * 0.92, 14), at(0, -10)]);
  const bb = { x: hip[0] - bw * 1.1, y: hip[1] - bodyH * 1.05, w: bw * 2.2, h: bodyH * 1.1 };
  fillLit(g, body, C.coat, sun, bb);
  fabric(g, body, bb, C.coat);
  { g.save(); g.clip(body); const hc0 = at(side ? 10 : 0, bodyH * 0.92 + headR * 0.78), ao = g.createRadialGradient(hc0[0] + 10, hc0[1] + headR * 0.7, headR * 0.3, hc0[0] + 10, hc0[1] + headR * 0.7, headR * 1.3); ao.addColorStop(0, "rgba(20,16,30,0.38)"); ao.addColorStop(1, "rgba(20,16,30,0)"); g.fillStyle = ao; g.fillRect(bb.x - 50, bb.y - 50, bb.w + 100, bb.h + 100); g.restore(); }
  if (sp.dress) { const sk = smooth([at(-bw * 1.25, 0), at(-bw * 0.95, bodyH * 0.42), at(bw * 0.95, bodyH * 0.42), at(bw * 1.25, 0), at(0, -12)]); fillLit(g, sk, C.dress, sun, bb, { ol: 8 }); }
  // coat details
  g.save(); g.clip(body);
  const fx = side ? bw * 0.35 : 0;
  if (sp.shirt) { const v = new Path2D(); const t0 = at(fx - bw * 0.42, bodyH * 1.02), t1 = at(fx + bw * 0.42, bodyH * 1.02), t2 = at(fx, bodyH * 0.55); v.moveTo(...t0); v.lineTo(...t1); v.lineTo(...t2); v.closePath(); g.fillStyle = "#f4f4f2"; g.fill(v); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(v); }
  if (sp.lapels) for (const s of (side ? [1] : [-1, 1])) { const lp = new Path2D(); const a0 = at(fx + s * bw * 0.05, bodyH * 0.95), a1 = at(fx + s * bw * 0.55, bodyH * 0.9), a2 = at(fx + s * bw * 0.1, bodyH * 0.45); lp.moveTo(...a0); lp.lineTo(...a1); lp.lineTo(...a2); lp.closePath(); g.fillStyle = mix(C.coat, "#000000", 0.25); g.fill(lp); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(lp); }
  if (sp.vest) { const v = smooth([at(fx - bw * 0.34, 18), at(fx - bw * 0.3, bodyH * 0.75), at(fx, bodyH * 0.9), at(fx + bw * 0.3, bodyH * 0.75), at(fx + bw * 0.34, 18)]); fillLit(g, v, C.vest, sun, bb, { ol: 5, sheen: false }); }
  if (sp.tie) { const t = smooth([at(fx - 9, bodyH * 0.8), at(fx + 9, bodyH * 0.8), at(fx + 14, bodyH * 0.36), at(fx, bodyH * 0.28), at(fx - 14, bodyH * 0.36)]); fillLit(g, t, C.tie, sun, bb, { ol: 4, sheen: false }); }
  if (sp.sash) { g.lineWidth = 30; g.strokeStyle = C.sash; g.beginPath(); g.moveTo(...at(-bw, bodyH * 0.85)); g.lineTo(...at(bw, bodyH * 0.2)); g.stroke(); g.lineWidth = 4; g.strokeStyle = INK; }
  if (sp.belt) { g.fillStyle = C.belt; const b0 = at(-bw * 1.2, bodyH * 0.3); g.save(); g.translate(...b0); g.rotate(lean); g.fillRect(0, -14, bw * 2.4, 28); g.restore(); }
  if (sp.buttons) for (let k = 0; k < 4; k++) for (const s of (side ? [0] : sp.vest ? [-1, 1] : [0])) { const p = at(fx + s * bw * 0.44, bodyH * (0.24 + k * 0.15)); g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.fillStyle = C.buttons; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); }
  if (sp.badge) { const p = at(fx + bw * 0.36, bodyH * 0.42); g.lineWidth = 3; g.strokeStyle = "#2a3a7a"; g.beginPath(); g.moveTo(...at(fx + bw * 0.1, bodyH * 0.92)); g.lineTo(p[0], p[1] - 16); g.stroke(); g.fillStyle = "#ffffff"; g.fillRect(p[0] - 12, p[1] - 16, 24, 32); g.lineWidth = 3; g.strokeStyle = INK; g.strokeRect(p[0] - 12, p[1] - 16, 24, 32); }
  g.restore();
  if (sp.epaulettes) for (const s of (side ? [1] : [-1, 1])) { const p = sh(s); fillLit(g, ellP(p[0] + (side ? 0 : s * 6), p[1] - 4, 30, 12), C.gold, sun, { x: p[0] - 30, y: p[1] - 16, w: 60, h: 24 }, { ol: 5, sheen: false }); }
  if (!side) { noodle(g, ...AL); hand(AL[2]); }
  // head: big flat face circle sitting on the shoulders
  const hc = at(side ? 10 : 0, bodyH * 0.92 + headR * 0.78);
  drawHead(g, sp, hc, headR, sun, side, pose, opt);
  noodle(g, ...AR); hand(AR[2]);
  if (opt.prop === "musket") { g.save(); g.lineCap = "round"; g.lineWidth = 16; g.strokeStyle = INK; const w = AR[2]; g.beginPath(); g.moveTo(w[0] - 40, w[1] + 120); g.lineTo(w[0] + 60, w[1] - 260); g.stroke(); g.lineWidth = 9; g.strokeStyle = "#6a4426"; g.stroke(); g.restore(); }
  g.restore();
  if (pose.lie) { g.save(); g.font = "bold 70px Arial"; g.lineWidth = 9; g.strokeStyle = INK; g.fillStyle = "#fff"; ["z", "Z", "Z"].forEach((z, i) => { g.strokeText(z, -560 + i * 50, -170 - i * 62); g.fillText(z, -560 + i * 50, -170 - i * 62); }); g.restore(); }
}

function drawHead(g, sp, c, r, sun, side, pose, opt) {
  const C = sp.colors, [x, y] = c, face = sp.face || "#f1f2f6";
  if (sp.hair && !side) { const hb = ellP(x, y - r * 0.06, r * 1.03, r * 1.0); fillLit(g, hb, C.hair, sun, { x: x - r, y: y - r, w: 2 * r, h: 2 * r }, { ol: 9 }); hairStrands(g, hb, { x: x - r * 1.05, y: y - r * 1.06, w: r * 2.1, h: r * 2.0 }, C.hair); }
  const fp = side ? smooth([[x - r * 0.98, y], [x - r * 0.7, y - r * 0.72], [x, y - r * 1.0], [x + r * 0.78, y - r * 0.68], [x + r * 1.02, y + r * 0.02], [x + r * 0.76, y + r * 0.7], [x, y + r * 0.98], [x - r * 0.72, y + r * 0.7]]) : ellP(x, y, r, r * 0.97);
  fillLit(g, fp, face, { a: sun.a, k: sun.k * 0.55, shaft: sun.shaft }, { x: x - r, y: y - r, w: 2 * r, h: 2 * r }, { ol: 9, sheen: false });
  g.save(); g.clip(fp); const sp0 = g.createRadialGradient(x - r * 0.35, y - r * 0.45, 2, x - r * 0.35, y - r * 0.45, r * 0.45); sp0.addColorStop(0, "rgba(255,255,255,0.35)"); sp0.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = sp0; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
  g.save(); g.clip(fp); const rg = g.createRadialGradient(x - r * 0.25, y - r * 0.2, r * 0.3, x, y, r * 1.05); rg.addColorStop(0, "rgba(255,255,255,0)"); rg.addColorStop(1, "rgba(150,165,200,0.30)"); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  for (const s of (side ? [1] : [-1, 1])) { g.fillStyle = "rgba(240,130,130,0.10)"; g.beginPath(); g.ellipse(x + (side ? r * 0.35 : s * r * 0.52), y + r * 0.3, r * 0.16, r * 0.09, 0, 0, 7); g.fill(); }
  g.restore();
  // hair cap with grey streak highlights (reference style)
  if (sp.hair) {
    const hp = side ? smooth([[x - r * 1.0, y + r * 0.25], [x - r * 0.92, y - r * 0.62], [x - r * 0.3, y - r * 1.03], [x + r * 0.45, y - r * 0.95], [x + r * 0.82, y - r * 0.62], [x + r * 0.55, y - r * 0.5], [x + r * 0.05, y - r * 0.58], [x - r * 0.35, y - r * 0.3], [x - r * 0.6, y + r * 0.1]])
      : smooth([[x - r * 1.02, y - r * 0.2], [x - r * 0.8, y - r * 0.82], [x, y - r * 1.05], [x + r * 0.8, y - r * 0.82], [x + r * 1.02, y - r * 0.2], [x + r * 0.7, y - r * 0.55], [x, y - r * 0.64], [x - r * 0.7, y - r * 0.55]]);
    fillLit(g, hp, C.hair, sun, { x: x - r, y: y - r, w: 2 * r, h: r }, { ol: 9 });
    hairStrands(g, hp, { x: x - r * 1.05, y: y - r * 1.06, w: r * 2.1, h: r * 1.0 }, C.hair);
    g.save(); g.clip(hp); g.strokeStyle = "rgba(255,255,255,0.3)"; g.lineWidth = r * 0.1; g.lineCap = "round";
    g.beginPath(); g.arc(x - r * 0.05, y - r * 0.15, r * 0.78, 1.18 * Math.PI, 1.62 * Math.PI); g.stroke();
    g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 5; g.beginPath(); g.moveTo(x + r * 0.28, y - r * 1.0); g.quadraticCurveTo(x + r * 0.22, y - r * 0.7, x + r * 0.3, y - r * 0.46); g.stroke();
    g.restore();
  }
  if (sp.longHair && !side) { for (const s of [-1, 1]) { const lh = smooth([[x + s * r * 0.85, y - r * 0.5], [x + s * r * 1.12, y + r * 0.2], [x + s * r * 1.0, y + r * 0.95], [x + s * r * 0.72, y + r * 0.85], [x + s * r * 0.8, y + r * 0.1]]); fillLit(g, lh, C.hair, sun, { x: x - r, y: y - r, w: 2 * r, h: 2 * r }, { ol: 7 }); hairStrands(g, lh, { x: x + Math.min(s * r * 0.7, s * r * 1.15), y: y - r * 0.55, w: r * 0.45, h: r * 1.55 }, C.hair); } }
  // face: dot eyes, small brows, mouth (reference: simple, bold)
  const e = opt.expr || sp.expr || "smile", eyes = side ? [x + r * 0.45] : [x - r * 0.3, x + r * 0.3], ey = y - r * 0.02;
  g.lineCap = "round"; g.strokeStyle = INK; g.fillStyle = INK;
  for (const ex of eyes) {
    if (pose.lie || e === "sleep") { g.lineWidth = 7; g.beginPath(); g.arc(ex, ey, 14, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    else if (e === "laugh") { g.lineWidth = 9; g.beginPath(); g.arc(ex, ey + 10, 18, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
    else if (e === "shock") { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(ex, ey, 20, 24, 0, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(ex, ey, 8, 0, 7); g.fill(); }
    else { g.beginPath(); g.ellipse(ex, ey, 11, 16, 0, 0, 7); g.fill(); }
    g.lineWidth = 8; g.beginPath();
    if (e === "angry" || e === "smug") { g.moveTo(ex - 22, ey - 44); g.lineTo(ex + 20, ey - 32); } else if (e === "shock") { g.arc(ex, ey - 30, 20, 1.2 * Math.PI, 1.8 * Math.PI); } else { g.moveTo(ex - 18, ey - 40); g.quadraticCurveTo(ex, ey - 47, ex + 18, ey - 40); }
    g.stroke();
  }
  if (sp.glasses) { g.lineWidth = 6; g.strokeStyle = INK; for (const ex of eyes) { g.beginPath(); g.arc(ex, ey, 30, 0, 7); g.stroke(); g.fillStyle = "rgba(200,225,255,0.18)"; g.fill(); } if (!side) { g.beginPath(); g.moveTo(eyes[0] + 30, ey - 4); g.quadraticCurveTo(x, ey - 14, eyes[1] - 30, ey - 4); g.stroke(); } }
  const mx = side ? x + r * 0.55 : x, my = y + r * 0.42;
  g.lineWidth = 8;
  if (e === "grin" || e === "laugh") { const w = 52; g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(mx - w, my - 10); g.quadraticCurveTo(mx, my + 46, mx + w, my - 10); g.closePath(); g.fill(); g.stroke(); g.lineWidth = 4; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(mx + k * 18, my - 6); g.lineTo(mx + k * 18, my + 8); g.stroke(); } g.beginPath(); g.moveTo(mx - w + 8, my + 4); g.quadraticCurveTo(mx, my + 12, mx + w - 8, my + 4); g.stroke(); }
  else if (e === "shock") { g.fillStyle = "#5a1a20"; g.beginPath(); g.ellipse(mx, my + 8, 18, 24, 0, 0, 7); g.fill(); g.stroke(); }
  else if (e === "angry") { g.beginPath(); g.arc(mx, my + 22, 22, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
  else if (e === "smug") { g.beginPath(); g.moveTo(mx - 22, my + 2); g.quadraticCurveTo(mx + 6, my + 12, mx + 24, my - 6); g.stroke(); }
  else { g.beginPath(); g.arc(mx, my - 14, 24, 0.22 * Math.PI, 0.78 * Math.PI); g.stroke(); }
  if (sp.stache) { g.fillStyle = C.hair; for (const s of (side ? [1] : [-1, 1])) { const p = smooth([[mx, my - 16], [mx + s * 38, my - 22], [mx + s * 52, my - 6], [mx + s * 14, my - 4]]); g.fill(p); g.lineWidth = 4; g.stroke(p); } }
  // hats
  const hat = sp.hat;
  if (hat === "bicorne") {
    const hp = side ? smooth([[x - r * 0.95, y - r * 0.6], [x - r * 0.42, y - r * 1.78], [x + r * 0.38, y - r * 1.75], [x + r * 0.92, y - r * 0.6], [x, y - r * 0.82]]) : smooth([[x - r * 1.5, y - r * 0.58], [x - r * 0.62, y - r * 1.58], [x, y - r * 1.66], [x + r * 0.62, y - r * 1.58], [x + r * 1.5, y - r * 0.58], [x, y - r * 0.86]]);
    fillLit(g, hp, C.hat, sun, { x: x - r * 1.5, y: y - r * 1.8, w: r * 3, h: r * 1.3 }, { ol: 9 });
    g.lineWidth = 8; g.strokeStyle = C.gold; g.beginPath(); if (side) { g.moveTo(x - r * 0.84, y - r * 0.64); g.quadraticCurveTo(x, y - r * 0.9, x + r * 0.82, y - r * 0.64); } else { g.moveTo(x - r * 1.36, y - r * 0.64); g.quadraticCurveTo(x, y - r * 0.96, x + r * 1.36, y - r * 0.64); } g.stroke();
    const ck = side ? [x, y - r * 1.18] : [x + r * 0.6, y - r * 1.15];
    for (const [rr, col] of [[24, "#2848b0"], [16, "#f6f2ea"], [8, "#d02a2e"]]) { g.beginPath(); g.arc(ck[0], ck[1], rr, 0, 7); g.fillStyle = col; g.fill(); }
    g.lineWidth = 5; g.strokeStyle = INK; g.beginPath(); g.arc(ck[0], ck[1], 24, 0, 7); g.stroke();
    if (sp.plume) fillLit(g, smooth([[x - 12, y - r * 1.62], [x + 34, y - r * 2.25], [x + 80, y - r * 2.2], [x + 28, y - r * 1.64]]), "#f6f2ea", sun, { x: x - 20, y: y - r * 2.3, w: 120, h: 90 }, { ol: 6, sheen: false });
  } else if (hat === "tricorne") {
    const hp = smooth([[x - r * 1.2, y - r * 0.62], [x - r * 0.6, y - r * 1.5], [x + r * 0.6, y - r * 1.5], [x + r * 1.2, y - r * 0.62], [x, y - r * 0.9]]);
    fillLit(g, hp, C.hat, sun, { x: x - r * 1.2, y: y - r * 1.5, w: r * 2.4, h: r }, { ol: 9 }); g.lineWidth = 7; g.strokeStyle = "#d8b45a"; g.stroke(hp); g.lineWidth = 9; g.strokeStyle = INK;
  } else if (hat === "cap") {
    const hp = smooth([[x - r * 1.0, y - r * 0.38], [x - r * 0.78, y - r * 1.08], [x + r * 0.2, y - r * 1.16], [x + r * 0.96, y - r * 0.76], [x + r * (side ? 1.5 : 1.0), y - r * 0.4]]);
    fillLit(g, hp, C.hat, sun, { x: x - r, y: y - r * 1.2, w: r * 2.5, h: r }, { ol: 9 });
  } else if (hat === "bearskin") {
    fillLit(g, ellP(x, y - r * 1.15, r * 0.98, r * 1.05), C.hat, sun, { x: x - r, y: y - r * 2.2, w: r * 2, h: r * 2.1 }, { ol: 9 });
  }
}

export function drawBunny(g, col, opt = {}) {
  const sun = { a: rad(opt.sunDeg ?? 215), k: 1, shaft: opt.shaft }, t = opt.t || 0, hop = opt.hop ? Math.abs(Math.sin(t * 6.283)) * 70 : 0;
  g.save(); g.translate(0, -hop); if (opt.flip) g.scale(-1, 1);
  const bb = { x: -130, y: -330, w: 300, h: 330 };
  fillLit(g, ellP(-40, -12, 50, 18), col, sun, bb, { ol: 7, sheen: false });
  fillLit(g, smooth([[-110, -70], [-80, -150], [10, -170], [80, -120], [85, -40], [30, -6], [-70, -6]]), col, sun, bb, { ol: 9 });
  fillLit(g, ellP(-112, -90, 26, 26), "#ffffff", sun, bb, { ol: 7, sheen: false });
  for (const [dx, rot] of [[60, -0.3], [92, -0.05]]) { const ep = ellP(dx, -280, 22, 72, rot); fillLit(g, ep, col, sun, bb, { ol: 8, sheen: false }); g.save(); g.clip(ep); g.fillStyle = "#f4a6b4"; g.beginPath(); g.ellipse(dx + 2, -274, 9, 50, rot, 0, 7); g.fill(); g.restore(); }
  fillLit(g, smooth([[30, -170], [66, -226], [126, -232], [166, -186], [164, -140], [120, -112], [52, -120]]), col, sun, bb, { ol: 9, sheen: false });
  g.fillStyle = INK; g.beginPath(); g.ellipse(120, -180, 12, 17, 0, 0, 7); g.fill();
  g.fillStyle = "#ff8fa4"; g.beginPath(); g.ellipse(164, -154, 9, 7, 0, 0, 7); g.fill();
  g.lineWidth = 5; g.strokeStyle = INK; g.beginPath(); g.arc(150, -138, 10, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
  fillLit(g, ellP(40, -8, 46, 16), col, sun, bb, { ol: 7, sheen: false });
  g.restore();
}

export const CAST = {
  napoleon: { name: "Napoleon", hat: "bicorne", hair: true, vest: true, buttons: true, epaulettes: true, head: 1.02, legs: 0.92, expr: "smug",
    colors: { coat: "#2f4fa8", vest: "#f6f2ea", shoes: "#1a1616", hair: "#1d1a1c", hat: "#1a171b", gold: "#f0c040", buttons: "#f0c040" } },
  berthier: { name: "Berthier", hat: "bicorne", plume: true, hair: true, vest: true, buttons: true, epaulettes: true, sash: true, stache: true, expr: "grin",
    colors: { coat: "#2f4fa8", vest: "#f6f2ea", shoes: "#1a1616", hair: "#6a5a52", hat: "#1a171b", gold: "#f0c040", buttons: "#f0c040", sash: "#d6333a" } },
  hunter: { name: "Hunter", hat: "tricorne", hair: true, buttons: true, belt: true, expr: "smile",
    colors: { coat: "#2f9a6a", shoes: "#3a2418", hair: "#5a3a26", hat: "#1e1a18", buttons: "#f0c040", belt: "#4a2e1c" } },
  farmer: { name: "Farmer", hat: "cap", hair: true, buttons: true, stache: true, wide: 1.12, expr: "grin",
    colors: { coat: "#c07a3a", shoes: "#4a3020", hair: "#8a6a44", hat: "#6a5236", buttons: "#5a3a22" } },
  grenadier: { name: "Grenadier", hat: "bearskin", hair: true, vest: true, buttons: true, sash: true, stache: true, tall: 1.06, expr: "smile",
    colors: { coat: "#2f4fa8", vest: "#f6f2ea", shoes: "#1a1616", hair: "#2a2020", hat: "#121012", buttons: "#f0c040", sash: "#f6f2ea" } },
};

export const OFFICE = {
  worker: { name: "Office worker", hair: true, shirt: true, lapels: true, tie: true, badge: true, expr: "smile",
    colors: { coat: "#5f9ee8", tie: "#2b4aa0", shoes: "#1a1616", hair: "#141214" } },
  manager: { name: "Manager", hair: true, shirt: true, lapels: true, tie: true, expr: "grin", wide: 1.08,
    colors: { coat: "#283a66", tie: "#c8323a", shoes: "#1a1616", hair: "#8e8e94" } },
  casual: { name: "Colleague", hair: true, expr: "smile", buttons: false,
    colors: { coat: "#2fae86", shoes: "#3a2a20", hair: "#5a3a26" } },
};

export const MW = {
  percy: { name: "Percy", hair: true, glasses: true, shirt: true, lapels: true, tie: true, expr: "smile", face: "#f6e4d2",
    colors: { coat: "#5b6070", tie: "#a8323a", shoes: "#1a1616", hair: "#9a948c" } },
  kid: { name: "Young Percy", hat: "cap", hair: true, buttons: true, belt: true, expr: "sad", tall: 0.72, legs: 0.7, head: 0.95, face: "#fbe8d6",
    colors: { coat: "#6b7a8a", shoes: "#3a2a1a", hair: "#6a4a2a", hat: "#5a4a3a", buttons: "#3a2a1a", belt: "#3a2618" } },
  eng1: { name: "Engineer", hair: true, shirt: true, lapels: true, tie: true, stache: true, expr: "smile", face: "#f6e2cc",
    colors: { coat: "#f4f3ef", tie: "#2f4f8a", shoes: "#1a1616", hair: "#3a2a20" } },
  eng2: { name: "Engineer", hair: true, shirt: true, lapels: true, glasses: true, expr: "grin", face: "#eed6bc",
    colors: { coat: "#f4f3ef", tie: "#3a6a3a", shoes: "#1a1616", hair: "#8a5a34" } },
  eng3: { name: "Engineer", hair: true, shirt: true, lapels: true, tie: true, stache: true, expr: "smile", face: "#c99067",
    colors: { coat: "#f4f3ef", tie: "#8a3a2a", shoes: "#1a1616", hair: "#1a1412" } },
  engw: { name: "Engineer", hair: true, longHair: true, dress: true, lapels: true, expr: "laugh", face: "#f6e2cc",
    colors: { coat: "#f4f3ef", dress: "#3f6fb5", shoes: "#1a1616", hair: "#7a4a26" } },
  boss: { name: "Company boss", hair: true, shirt: true, lapels: true, tie: true, stache: true, wide: 1.25, expr: "smug", face: "#f8e6d6",
    colors: { coat: "#2a2c3e", tie: "#2f4f8a", shoes: "#1a1616", hair: "#e2ded6" } },
  mom: { name: "Mom", hair: true, longHair: true, dress: true, expr: "smile", face: "#c99067",
    colors: { coat: "#f0e6d0", dress: "#3f8a6a", shoes: "#3a2a1a", hair: "#3a2418" } },
  girl: { name: "Kid", hair: true, longHair: true, dress: true, expr: "laugh", tall: 0.72, legs: 0.7, face: "#fbe8d6",
    colors: { coat: "#f0e6d0", dress: "#c8402e", shoes: "#3a2a1a", hair: "#c9a04a" } },
};
