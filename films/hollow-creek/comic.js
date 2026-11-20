// Silver-age comic page kit: the reference layout (3 rows, alternating wide/narrow panels), yellow caption boxes flush in
// the panel corner, white balloons with thin tails, thought balloons, outlined SFX, flat colours, thin borders, newsprint.
// Pages are 1600 x 2448 canvases. Panel art is drawn in page pixels times u, so a panel can be redrawn at any resolution.
export const INK = '#1a1418';
export const PAGE = { W: 1600, H: 2448, m: 56, g: 30 };
// row heights (fractions) and the left panel's width share per row, as in the reference page
const ROWS = [[0.315, 0.55], [0.355, 0.43], [0.33, 0.46]];
export function panelRect(i) {
  const { W, H, m, g } = PAGE, iw = W - 2 * m, ih = H - 2 * m - 2 * g - 70;   // 70 px at the bottom for the page number
  const r = Math.floor(i / 2), [rh, left] = ROWS[r];
  let y = m; for (let k = 0; k < r; k++) y += ROWS[k][0] * ih + g;
  const lw = (iw - g) * left, x = i % 2 ? m + lw + g : m, w = i % 2 ? iw - g - lw : lw;
  return { x, y, w, h: rh * ih };
}
const hh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export function paper(c, W, H) {
  c.fillStyle = '#f6efdc'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 1500; i++) { c.fillStyle = hh(i) > 0.5 ? 'rgba(120,90,40,0.045)' : 'rgba(255,255,255,0.06)'; c.fillRect(hh(i + 1) * W, hh(i + 2) * H, 2 + hh(i + 3) * 5, 1 + hh(i + 4) * 2); }
}
export function age(c, W, H) {
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(170,120,50,0)'); g.addColorStop(1, 'rgba(160,110,40,0.22)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(250,236,205,0.35)'; c.fillRect(0, 0, W, H); c.restore();
}
// run fn(c, x, y, w, h, u) clipped to the panel, then ink the border
export function panel(c, x, y, w, h, u, fn) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(c, x, y, w, h, u); c.restore();
  c.lineWidth = 5 * u; c.strokeStyle = INK; c.strokeRect(x, y, w, h);
}
const font = (size, italic) => `${italic ? 'italic ' : ''}${size}px ComicNeue`;
function wrap(c, lines) { return lines.map((s) => [s, c.measureText(s).width]); }
// yellow narration box flush in a corner ('tl' or 'br'); text is italic capitals like the reference
export function caption(c, lines, x, y, w, h, u, corner = 'tl', maxW = 0.62) {
  const size = 27 * u, lh = size * 1.18; c.font = font(size, true);
  const ws = wrap(c, lines), bw = Math.min(w * maxW, Math.max(...ws.map((a) => a[1])) + size * 1.1), bh = lines.length * lh + size * 0.55;
  const bx = corner === 'tl' ? x : x + w - bw, by = corner === 'tl' ? y : y + h - bh;
  c.fillStyle = '#f9dc4a'; c.fillRect(bx, by, bw, bh); c.lineWidth = 4 * u; c.strokeStyle = INK; c.strokeRect(bx, by, bw, bh);
  c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'middle'; lines.forEach((s, i) => c.fillText(s, bx + size * 0.5, by + size * 0.3 + lh * (i + 0.5)));
}
// speech balloon centred at (cx, cy) with a tail to (tx, ty). kind: 'say' | 'think' | 'shout'
export function balloon(c, lines, cx, cy, tx, ty, u, kind = 'say') {
  const size = 27 * u, lh = size * 1.15; c.font = font(size); const ws = wrap(c, lines), tw = Math.max(...ws.map((a) => a[1]));
  const rx = tw * 0.62 + size * 0.9, ry = lines.length * lh * 0.62 + size * 0.75;
  c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.fillStyle = '#ffffff';
  if (kind === 'think') { for (let i = 1; i <= 3; i++) { const k = i / 4; c.beginPath(); c.arc(tx + (cx - tx) * k * 0.7, ty + (cy - ty) * k * 0.7, size * (0.18 + 0.12 * i), 0, 6.283); c.fill(); c.stroke(); } }
  else { const a = Math.atan2(ty - cy, tx - cx), s0 = a + 0.18, s1 = a - 0.18;
    c.beginPath(); c.moveTo(cx + Math.cos(s0) * rx * 0.85, cy + Math.sin(s0) * ry * 0.85); c.quadraticCurveTo((cx + tx) / 2, (cy + ty) / 2, tx, ty); c.lineTo(cx + Math.cos(s1) * rx * 0.85, cy + Math.sin(s1) * ry * 0.85); c.closePath(); c.fill(); c.stroke(); }
  c.beginPath();
  if (kind === 'shout') for (let i = 0; i <= 36; i++) { const a = i / 36 * 6.283, r = i % 2 ? 1 : 1.13; c.lineTo(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); }
  else if (kind === 'think') for (let i = 0; i <= 10; i++) { const a = i / 10 * 6.283; c.arc(cx + Math.cos(a) * rx * 0.86, cy + Math.sin(a) * ry * 0.82, size * 0.62, a - 1.4, a + 1.4); }
  else c.ellipse(cx, cy, rx, ry, 0, 0, 6.283);
  c.closePath(); c.fill(); c.stroke();
  if (kind !== 'think') { const a = Math.atan2(ty - cy, tx - cx); c.beginPath(); c.moveTo(cx + Math.cos(a + 0.18) * rx * 0.84, cy + Math.sin(a + 0.18) * ry * 0.84); c.lineTo(cx + Math.cos(a - 0.18) * rx * 0.84, cy + Math.sin(a - 0.18) * ry * 0.84); c.lineWidth = 6 * u; c.strokeStyle = '#ffffff'; c.stroke(); }
  c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; lines.forEach((s, i) => c.fillText(s, cx, cy + (i - (lines.length - 1) / 2) * lh));
}
// outlined sound effect, Bangers, tilted
export function sfx(c, s, x, y, size, fill, rot = -0.15, line = INK) {
  c.save(); c.translate(x, y); c.rotate(rot); c.font = `${size}px Bangers`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = size * 0.16; c.strokeStyle = line; c.strokeText(s, 0, 0); c.fillStyle = fill; c.fillText(s, 0, 0); c.restore();
}
// a character card (600x1000 design, soles at 975, body about 680 tall) placed with its feet at (x, footY), `tall` px high
export function card(c, k, x, footY, tall, flip = false) {
  const s = tall / 680; c.save(); c.translate(x, footY); if (flip) c.scale(-1, 1);
  c.drawImage(k, -300 * s, -975 * s, 600 * s, 1000 * s); c.restore();
}
export function ground(c, x, y, w, h, top, col) { c.fillStyle = col; c.fillRect(x, top, w, y + h - top); }
export function sky(c, x, y, w, h, a, b) { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(x, y, w, h); }
export function bike(c, x, gy, r, u, col = '#2f6fd0') {   // side view, facing right, wheel radius r
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const wx of [x - r * 1.4, x + r * 1.4]) { c.beginPath(); c.arc(wx, gy - r, r, 0, 6.283); c.lineWidth = 7 * u; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(wx, gy - r, r * 0.12, 0, 6.283); c.fillStyle = INK; c.fill(); }
  const P = (a, b) => [x + a * r, gy - b * r];
  const pts = [[P(-1.4, 1), P(-0.2, 1)], [P(-0.2, 1), P(0.9, 2.05)], [P(-0.2, 1), P(-0.55, 2.1)], [P(-0.55, 2.1), P(0.9, 2.05)], [P(0.9, 2.05), P(1.4, 1)], [P(-1.4, 1), P(-0.55, 2.1)]];
  for (const [a, b] of pts) { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineWidth = 10 * u; c.strokeStyle = INK; c.stroke(); c.lineWidth = 6 * u; c.strokeStyle = col; c.stroke(); }
  c.beginPath(); c.moveTo(...P(0.9, 2.05)); c.lineTo(...P(0.8, 2.5)); c.lineTo(...P(1.15, 2.55)); c.lineWidth = 6 * u; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.ellipse(...P(-0.6, 2.2), r * 0.3, r * 0.1, 0, 0, 6.283); c.fillStyle = INK; c.fill();
  c.fillStyle = '#c9a36a'; c.fillRect(...P(0.75, 2.2), r * 0.7, r * 0.35); c.strokeStyle = INK; c.lineWidth = 3 * u; c.strokeRect(...P(0.75, 2.2), r * 0.7, r * 0.35);   // front basket
}
export function house(c, x, gy, w, h, u, wall, roof, lit = true) {
  c.fillStyle = wall; c.fillRect(x, gy - h, w, h); c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.strokeRect(x, gy - h, w, h);
  c.beginPath(); c.moveTo(x - w * 0.08, gy - h); c.lineTo(x + w / 2, gy - h - h * 0.55); c.lineTo(x + w * 1.08, gy - h); c.closePath(); c.fillStyle = roof; c.fill(); c.stroke();
  for (const f of [0.18, 0.62]) { c.fillStyle = lit ? '#ffd860' : '#3a3550'; c.fillRect(x + w * f, gy - h * 0.72, w * 0.2, h * 0.24); c.strokeRect(x + w * f, gy - h * 0.72, w * 0.2, h * 0.24); }
  c.fillStyle = '#6a3a26'; c.fillRect(x + w * 0.42, gy - h * 0.42, w * 0.16, h * 0.42); c.strokeRect(x + w * 0.42, gy - h * 0.42, w * 0.16, h * 0.42);
}
export function lamp(c, x, gy, h, u, on = 1) {
  c.fillStyle = INK; c.fillRect(x - 6 * u, gy - h, 12 * u, h);
  c.beginPath(); c.moveTo(x - 30 * u, gy - h); c.lineTo(x + 30 * u, gy - h); c.lineTo(x + 18 * u, gy - h - 40 * u); c.lineTo(x - 18 * u, gy - h - 40 * u); c.closePath();
  c.fillStyle = on ? '#fff0a0' : '#5a5560'; c.fill(); c.lineWidth = 4 * u; c.strokeStyle = INK; c.stroke();
}
export function fence(c, x0, x1, gy, h, u, col = '#efe4c8') {
  const pw = 34 * u, gap = 14 * u; c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 3.5 * u;
  c.fillRect(x0, gy - h * 0.72, x1 - x0, 12 * u); c.strokeRect(x0, gy - h * 0.72, x1 - x0, 12 * u);
  for (let x = x0; x < x1; x += pw + gap) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x, gy - h + 16 * u); c.lineTo(x + pw / 2, gy - h); c.lineTo(x + pw, gy - h + 16 * u); c.lineTo(x + pw, gy); c.closePath(); c.fill(); c.stroke(); }
}
export function pageNumber(c, n, W, H) {
  const s = 64; c.fillStyle = '#fff'; c.fillRect(W - PAGE.m - s, H - PAGE.m - s + 10, s, s); c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(W - PAGE.m - s, H - PAGE.m - s + 10, s, s);
  c.font = '40px Bangers'; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), W - PAGE.m - s / 2, H - PAGE.m - s / 2 + 12);
}

// ======== silver-age inking kit: flat colour, Ben-Day tints, brush texture, spotted blacks (no gradients, no glows) ========
const patCache = new Map();
// Ben-Day tint: dots of `col` on `bg`, a fixed screen like a 1960s colour separation
export function benday(c, col, bg, step = 7, r = 1.6) {
  const key = col + bg + step + r; if (patCache.has(key)) return patCache.get(key);
  const t = Object.assign(document.createElement('canvas'), { width: step * 2, height: step * 2 }), g = t.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, step * 2, step * 2); g.fillStyle = col;
  for (const [x, y] of [[step / 2, step / 2], [step * 1.5, step * 1.5], [step * 1.5, step / 2 - step], [step / 2, step * 1.5]]) { g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
  g.beginPath(); g.arc(step * 1.5, step / 2, r, 0, 6.283); g.fill(); g.beginPath(); g.arc(step / 2, step * 1.5, r, 0, 6.283); g.fill();
  const p = c.createPattern(t, 'repeat'); patCache.set(key, p); return p;
}
export function flat(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
// parallel ink hatching inside a rectangle (shadow sides, skies, dusk)
export function hatch(c, x, y, w, h, u, ang = -0.6, gap = 12, lw = 2) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = INK; c.lineWidth = lw * u; c.lineCap = 'round';
  const d = Math.hypot(w, h), cx = x + w / 2, cy = y + h / 2, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let k = -d; k < d; k += gap * u) { c.beginPath(); c.moveTo(cx - ca * d - sa * k, cy - sa * d + ca * k); c.lineTo(cx + ca * d - sa * k, cy + sa * d + ca * k); c.stroke(); }
  c.restore();
}
// brush dashes on a ground plane, longer and denser towards the viewer: reads as earth/asphalt with perspective
export function brushGround(c, x, y0, w, y1, u, seed = 1, col = INK) {
  c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const k = hh(seed * 31 + i), yy = y0 + (y1 - y0) * Math.pow(hh(seed * 17 + i), 0.7), near = (yy - y0) / (y1 - y0 + 1e-6);
    const len = (10 + 40 * near) * u * (0.5 + k), xx = x + hh(seed * 7 + i) * w; c.lineWidth = (1.2 + 2.2 * near) * u;
    c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + len / 2, yy - 2 * u, xx + len, yy + 1 * u); c.stroke();
  }
}
export function tuft(c, x, y, s, u) { c.strokeStyle = INK; c.lineWidth = 2 * u; c.lineCap = 'round'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 3 * s * u, y); c.quadraticCurveTo(x + i * 4 * s * u, y - 8 * s * u, x + i * 6 * s * u, y - (12 + 4 * (2 - Math.abs(i))) * s * u); c.stroke(); } }
// foliage clump: scalloped ink outline, flat fill, inner flicks, a spotted-black underside
export function bush(c, x, y, r, u, col = '#5f8f3e', seed = 1) {
  const pts = []; for (let i = 0; i <= 18; i++) { const a = Math.PI + i / 18 * Math.PI, rr = r * (0.82 + 0.25 * hh(seed + i)); pts.push([x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr]); }
  c.beginPath(); c.moveTo(x - r * 1.25, y); for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i - 1], [qx, qy] = pts[i]; c.quadraticCurveTo((px + qx) / 2 + (qy - py) * 0.4, (py + qy) / 2 - (qx - px) * 0.4, qx, qy); } c.closePath();
  c.fillStyle = col; c.fill(); c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.stroke();
  c.save(); c.clip(); c.fillStyle = INK; c.beginPath(); c.ellipse(x, y + r * 0.15, r * 1.3, r * 0.38, 0, 0, 6.283); c.fill();
  c.lineWidth = 2 * u; for (let i = 0; i < 9; i++) { const a = Math.PI * (1.1 + 0.8 * hh(seed + 40 + i)), rr = r * (0.3 + 0.5 * hh(seed + 60 + i)); const px = x + Math.cos(a) * rr * 1.2, py = y + Math.sin(a) * rr; c.beginPath(); c.arc(px, py, 6 * u, 0.2, 2.4); c.stroke(); }
  c.restore();
}
export function tree(c, x, gy, h, u, col = '#5f8f3e', seed = 1, night = false) {
  c.fillStyle = night ? INK : '#6a4a2a'; c.fillRect(x - 9 * u, gy - h * 0.45, 18 * u, h * 0.45); c.lineWidth = 3 * u; c.strokeStyle = INK; c.strokeRect(x - 9 * u, gy - h * 0.45, 18 * u, h * 0.45);
  bush(c, x, gy - h * 0.42, h * 0.32, u, night ? INK : col, seed); bush(c, x - h * 0.12, gy - h * 0.62, h * 0.26, u, night ? INK : col, seed + 9); bush(c, x + h * 0.12, gy - h * 0.7, h * 0.22, u, night ? INK : col, seed + 19);
}
// a house in 2-point-ish view: lit front face, hatched side face, shingle lines, flat colour windows
export function house2(c, x, gy, w, h, u, wall, roof, side = 1, lit = true, night = false) {
  const d = w * 0.38 * side, sw = night ? '#1c2440' : wall;
  c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x + (side > 0 ? w : 0), gy); c.lineTo(x + (side > 0 ? w : 0) + d, gy - h * 0.12); c.lineTo(x + (side > 0 ? w : 0) + d, gy - h * 1.05); c.lineTo(x + (side > 0 ? w : 0), gy - h); c.closePath(); c.fillStyle = night ? '#141a30' : wall; c.fill(); c.stroke();
  c.save(); c.clip(); hatch(c, x - w, gy - h * 1.2, w * 3, h * 1.3, u, side > 0 ? 0.9 : -0.9, 9, 1.6); c.restore();
  c.fillStyle = night ? '#2a3458' : wall; c.fillRect(x, gy - h, w, h); c.strokeRect(x, gy - h, w, h);
  c.beginPath(); c.moveTo(x - w * 0.06, gy - h); c.lineTo(x + w / 2, gy - h * 1.62); c.lineTo(x + w * 1.06, gy - h); c.closePath(); c.fillStyle = night ? '#10152a' : roof; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x + w / 2, gy - h * 1.62); c.lineTo(x + w / 2 + d, gy - h * 1.7); c.lineTo(x + (side > 0 ? w * 1.06 : -w * 0.06) + d, gy - h * 1.08); c.lineTo(x + (side > 0 ? w * 1.06 : -w * 0.06), gy - h); c.closePath(); c.fill(); c.stroke();
  c.save(); c.lineWidth = 1.5 * u; for (let i = 1; i < 5; i++) { const yy = gy - h - h * 0.62 * i / 5; c.beginPath(); c.moveTo(x + w / 2 - (w * 0.56) * (1 - i / 5), yy); c.lineTo(x + w / 2 + (w * 0.56) * (1 - i / 5), yy); c.stroke(); } c.restore();
  for (const f of [0.14, 0.64]) { c.fillStyle = lit ? '#ffe36a' : night ? '#0c1022' : '#9cc8e0'; c.fillRect(x + w * f, gy - h * 0.74, w * 0.22, h * 0.26); c.strokeRect(x + w * f, gy - h * 0.74, w * 0.22, h * 0.26); c.beginPath(); c.moveTo(x + w * (f + 0.11), gy - h * 0.74); c.lineTo(x + w * (f + 0.11), gy - h * 0.48); c.stroke(); }
  c.fillStyle = night ? '#0c1022' : '#7a3a26'; c.fillRect(x + w * 0.42, gy - h * 0.44, w * 0.16, h * 0.44); c.strokeRect(x + w * 0.42, gy - h * 0.44, w * 0.16, h * 0.44);
}
// solid black cast shadow under a figure (the silver-age "spot")
export function spot(c, x, y, rx, ry) { c.fillStyle = INK; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.283); c.fill(); }
export function speed(c, x0, y0, x1, y1, n, spread, u) { c.strokeStyle = INK; c.lineCap = 'round'; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * spread * u; c.lineWidth = (1.5 + hh(i) * 2) * u; c.beginPath(); c.moveTo(x0 + hh(i + 3) * 20 * u, y0 + o); c.lineTo(x1, y1 + o); c.stroke(); } }

// ======== 1990s kit: glossy Baxter paper, black gutters, slanted panels, airbrush gradients, glows, rim light, ========
// ======== dark caption boxes with white italic lettering, chunky gradient SFX with extrusion, cross-hatching ========
// panel shape = the rect with its 4 corners nudged (page px; scaled by u), clockwise from top-left
export function panel90(c, x, y, w, h, u, nudge, fn) {
  const n = nudge || [[0, 0], [0, 0], [0, 0], [0, 0]], q = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([px, py], i) => [px + n[i][0] * u, py + n[i][1] * u]);
  const path = () => { c.beginPath(); q.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); };
  c.save(); path(); c.clip(); fn(c, x, y, w, h, u); c.restore();
  path(); c.lineJoin = 'miter'; c.lineWidth = 9 * u; c.strokeStyle = '#ffffff'; c.stroke(); c.lineWidth = 4 * u; c.strokeStyle = INK; c.stroke();
}
export function grad(c, x, y, w, h, stops, horizontal = false) {
  const g = horizontal ? c.createLinearGradient(x, 0, x + w, 0) : c.createLinearGradient(0, y, 0, y + h); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); c.fillStyle = g; c.fillRect(x, y, w, h);
}
export function glow(c, x, y, r, col, a = 0.8) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
export function flare(c, x, y, r, u) {   // 90s lens flare: hot core, 4-point star, a few ghost rings
  glow(c, x, y, r, 'rgba(255,240,190,A)', 0.95); c.save(); c.globalCompositeOperation = 'lighter';
  c.fillStyle = 'rgba(255,250,220,0.9)'; for (const a of [0, Math.PI / 2]) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-r * 1.6, 0); c.lineTo(0, -4 * u); c.lineTo(r * 1.6, 0); c.lineTo(0, 4 * u); c.closePath(); c.fill(); c.restore(); }
  for (const [k, rr, col] of [[0.6, 0.18, 'rgba(120,200,255,0.25)'], [1.1, 0.1, 'rgba(255,160,220,0.3)'], [1.5, 0.25, 'rgba(160,255,200,0.15)']]) { c.beginPath(); c.arc(x + r * k, y + r * k * 0.6, r * rr, 0, 6.283); c.fillStyle = col; c.fill(); }
  c.restore();
}
// cross-hatching in shadow areas: two crossed hatch layers, clipped to a polygon
export function xhatch(c, pts, u, gap = 10) {
  c.save(); c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.clip();
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
  hatch(c, x0, y0, w, h, u, -0.7, gap, 1.6); hatch(c, x0, y0, w, h, u, 0.7, gap * 1.4, 1.3); c.restore();
}
// a card with a coloured rim light (90s colourists' trick) and an optional hard black cast shadow
export function card90(c, k, x, footY, tall, flip = false, rim = 'rgba(120,220,255,0.95)', blur = 16) {
  c.save(); c.shadowColor = rim; c.shadowBlur = blur; card(c, k, x, footY, tall, flip); c.restore(); card(c, k, x, footY, tall, flip);
}
// caption box: deep gradient box, coloured keyline, white italic capitals
export function caption90(c, lines, x, y, w, h, u, corner = 'tl', maxW = 0.62, tone = ['#2a1458', '#0b0618'], key = '#ffd23a') {
  const size = 27 * u, lh = size * 1.2; c.font = `italic ${size}px ComicNeue`;
  const bw = Math.min(w * maxW, Math.max(...lines.map((s) => c.measureText(s).width)) + size * 1.2), bh = lines.length * lh + size * 0.6;
  const bx = corner === 'tl' ? x + 14 * u : x + w - bw - 14 * u, by = corner === 'tl' ? y + 14 * u : y + h - bh - 14 * u;
  const g = c.createLinearGradient(bx, by, bx + bw, by + bh); g.addColorStop(0, tone[0]); g.addColorStop(1, tone[1]);
  c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(bx + 6 * u, by + 6 * u, bw, bh); c.fillStyle = g; c.fillRect(bx, by, bw, bh);
  c.lineWidth = 3 * u; c.strokeStyle = key; c.strokeRect(bx, by, bw, bh);
  c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.textBaseline = 'middle'; lines.forEach((s, i) => c.fillText(s, bx + size * 0.6, by + size * 0.3 + lh * (i + 0.5)));
}
// chunky SFX: black extrusion, gradient face, white keyline
export function sfx90(c, s, x, y, size, top, bot, rot = -0.15) {
  c.save(); c.translate(x, y); c.rotate(rot); c.font = `${size}px Bangers`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for (let i = 10; i > 0; i--) { c.fillStyle = INK; c.fillText(s, i * size * 0.008, i * size * 0.01); }
  c.lineWidth = size * 0.14; c.strokeStyle = INK; c.strokeText(s, 0, 0);
  const g = c.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillText(s, 0, 0);
  c.lineWidth = size * 0.025; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.strokeText(s, -size * 0.01, -size * 0.012); c.restore();
}
export function page90(c, W, H) { c.fillStyle = '#0c0a12'; c.fillRect(0, 0, W, H); }   // black gutters
