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
