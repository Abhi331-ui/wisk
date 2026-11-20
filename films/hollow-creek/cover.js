// The cover: HOLLOW CREEK TALES #1, a 1994 newsstand cover. Giant grinning Shadow looming over a tiny terrified Milo
// under a street lamp; chunky extruded logo, corner box, collector's banner, blurb burst, barcode, wear.
import { CAST, drawFront, drawShadow } from './cast/cast.js';
const INK = '#141014';
const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function txt(c, s, x, y, size, font = 'Bangers', col = INK, align = 'center') { c.font = `${size}px ${font}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); }
// 90s logo: deep black extrusion, a gradient face, a white hot rim and a thick outline
function logo(c, s, x, y, size, skew = -0.12) {
  c.save(); c.translate(x, y); c.transform(1, 0, skew, 1, 0, 0); c.font = `${size}px Bangers`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for (let i = 18; i > 0; i--) { c.fillStyle = i > 2 ? '#3a0a12' : INK; c.fillText(s, i * 1.4, i * 1.8); }       // extrusion down-right
  c.lineWidth = size * 0.11; c.strokeStyle = INK; c.strokeText(s, 0, 0);
  const g = c.createLinearGradient(0, -size * 0.45, 0, size * 0.45); g.addColorStop(0, '#fff6a8'); g.addColorStop(0.45, '#ffc21a'); g.addColorStop(0.55, '#f07a12'); g.addColorStop(1, '#c8261a');
  c.fillStyle = g; c.fillText(s, 0, 0);
  c.lineWidth = size * 0.025; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.save(); c.translate(-size * 0.02, -size * 0.025); c.strokeText(s, 0, 0); c.restore();
  c.restore();
}
function burst(c, x, y, r0, r1, n, fill, rot = 0) { c.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = rot + i / (n * 2) * 6.283, r = i % 2 ? r0 : r1; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fillStyle = fill; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); }
function dots(c, x, y, w, hh, col, step, k0, k1) {      // halftone shading that grows from k0 to k1 down the box
  c.fillStyle = col; for (let j = 0; j < hh; j += step) { const r = step * 0.5 * (k0 + (k1 - k0) * j / hh); if (r < 0.5) continue; for (let i = (j / step) % 2 ? step / 2 : 0; i < w; i += step) { c.beginPath(); c.arc(x + i, y + j, r, 0, 6.283); c.fill(); } }
}

export function drawCover(c, W, H) {
  // ---- art: night sky with a sickly green-violet glow behind the Shadow ----
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d0a2a'); g.addColorStop(0.5, '#2a1458'); g.addColorStop(1, '#130a24'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W * 0.5, H * 0.45, 50, W * 0.5, H * 0.45, W * 0.75); glow.addColorStop(0, 'rgba(160,255,120,0.55)'); glow.addColorStop(0.4, 'rgba(120,60,200,0.35)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = glow; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = 0.22; for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283; c.beginPath(); c.moveTo(W * 0.5, H * 0.45); c.lineTo(W * 0.5 + Math.cos(a) * W * 1.4, H * 0.45 + Math.sin(a) * W * 1.4); c.lineTo(W * 0.5 + Math.cos(a + 0.05) * W * 1.4, H * 0.45 + Math.sin(a + 0.05) * W * 1.4); c.fillStyle = '#d8ffb0'; c.fill(); } c.restore();
  // the GIANT Shadow, cropped by the frame edges, leaning in
  c.save(); c.translate(W * 0.52, H * 1.02); c.rotate(-0.06); const sh = drawShadow(); c.shadowColor = 'rgba(190,255,150,0.9)'; c.shadowBlur = 60; c.drawImage(sh, -300 * 3.4, -1000 * 3.4, 600 * 3.4, 1000 * 3.4); c.restore();
  // town at its feet: rooftops and the water tower, tiny against it
  c.fillStyle = '#0a0616'; c.beginPath(); c.moveTo(0, H * 0.8); for (let i = 0; i <= 16; i++) { const x = W * i / 16, y = H * (0.78 + 0.02 * h(i + 3)); c.lineTo(x, y); c.lineTo(x + W / 32, y - H * 0.025); c.lineTo(x + W / 16, y); } c.lineTo(W, H); c.lineTo(0, H); c.fill();
  for (let i = 0; i < 14; i++) if (h(i + 9) > 0.35) { c.fillStyle = '#ffd04a'; c.fillRect(W * (0.03 + i * 0.07), H * (0.81 + 0.01 * h(i)), W * 0.018, H * 0.012); }
  c.fillStyle = '#0a0616'; c.fillRect(W * 0.835, H * 0.665, 9, H * 0.13); c.fillRect(W * 0.915, H * 0.665, 9, H * 0.13); c.fillRect(W * 0.83, H * 0.72, W * 0.095, 7);   // water tower: legs, brace, tank, cone roof
  c.beginPath(); c.ellipse(W * 0.877, H * 0.645, W * 0.07, H * 0.026, 0, 0, 6.283); c.fill(); c.fillRect(W * 0.807, H * 0.62, W * 0.14, H * 0.026);
  c.beginPath(); c.moveTo(W * 0.8, H * 0.622); c.lineTo(W * 0.877, H * 0.595); c.lineTo(W * 0.954, H * 0.622); c.fill();
  // street, lamp pool, and tiny Milo with no shadow under him
  c.fillStyle = '#1a1230'; c.fillRect(0, H * 0.86, W, H * 0.14);
  const pool = c.createRadialGradient(W * 0.3, H * 0.92, 10, W * 0.3, H * 0.92, W * 0.32); pool.addColorStop(0, 'rgba(255,214,120,0.75)'); pool.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = pool; c.fillRect(0, H * 0.7, W, H * 0.3);
  c.fillStyle = INK; c.fillRect(W * 0.12, H * 0.6, 14, H * 0.32); c.beginPath(); c.moveTo(W * 0.12, H * 0.6); c.quadraticCurveTo(W * 0.14, H * 0.57, W * 0.2, H * 0.585); c.lineWidth = 14; c.strokeStyle = INK; c.stroke();
  c.fillStyle = '#fff2b0'; c.beginPath(); c.ellipse(W * 0.2, H * 0.597, 34, 18, 0, 0, 6.283); c.fill();
  const milo = drawFront(CAST.milo, { expr: 'shock', look: 1 }); c.drawImage(milo, W * 0.3 - 300 * 0.62, H * 0.955 - 1000 * 0.62, 600 * 0.62, 1000 * 0.62);
  c.save(); c.translate(W * 0.36, H * 0.69); c.rotate(-0.2); txt(c, 'GULP!', 0, 0, W * 0.06, 'Bangers', '#ffffff'); c.restore();
  dots(c, 0, H * 0.55, W, H * 0.45, 'rgba(10,4,24,0.25)', 16, 0, 0.7);   // print shading on the lower half
  // ---- trade dress ----
  c.fillStyle = '#d8322b'; c.fillRect(0, 0, W, H * 0.025); c.fillStyle = '#ffe14a'; c.fillRect(0, H * 0.025, W, H * 0.006);
  txt(c, 'COLLECTOR\'S EDITION  ★  FIRST ISSUE!', W * 0.62, H * 0.0135, W * 0.03, 'Bangers', '#ffffff');
  logo(c, 'HOLLOW', W * 0.6, H * 0.085, W * 0.2); logo(c, 'CREEK', W * 0.66, H * 0.16, W * 0.2);
  c.save(); c.translate(W * 0.84, H * 0.215); c.rotate(-0.04); c.fillStyle = '#ffffff'; c.fillRect(-W * 0.13, -H * 0.018, W * 0.26, H * 0.036); c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(-W * 0.13, -H * 0.018, W * 0.26, H * 0.036); txt(c, 'T A L E S', 0, 2, W * 0.05, 'Bangers', '#d8322b'); c.restore();
  // corner box: issue, price, date, Milo's head
  const bx = W * 0.03, by = H * 0.04, bw = W * 0.2, bh = H * 0.17; c.fillStyle = '#ffffff'; c.fillRect(bx, by, bw, bh); c.lineWidth = 8; c.strokeStyle = INK; c.strokeRect(bx, by, bw, bh);
  c.save(); c.beginPath(); c.rect(bx, by + bh * 0.42, bw, bh * 0.58); c.clip(); c.fillStyle = '#ffe14a'; c.fillRect(bx, by + bh * 0.42, bw, bh * 0.58); c.drawImage(drawFront(CAST.milo, { expr: 'grin' }), 140, 290, 320, 320, bx + bw * 0.08, by + bh * 0.43, bw * 0.84, bw * 0.84); c.restore(); c.strokeRect(bx, by + bh * 0.42, bw, bh * 0.58);
  txt(c, 'No. 1', bx + bw / 2, by + bh * 0.11, W * 0.05, 'Bangers', '#d8322b'); txt(c, '$1.95 US', bx + bw / 2, by + bh * 0.24, W * 0.03, 'Bangers'); txt(c, 'NOV 1994', bx + bw / 2, by + bh * 0.34, W * 0.026, 'Bangers');
  // blurb burst and the cover line
  burst(c, W * 0.83, H * 0.33, W * 0.1, W * 0.135, 14, '#ffe14a', 0.2);
  c.save(); c.translate(W * 0.83, H * 0.33); c.rotate(0.15); txt(c, 'EVERY', 0, -W * 0.05, W * 0.042, 'Bangers', '#d8322b'); txt(c, 'SHADOW', 0, 0, W * 0.05, 'Bangers', '#d8322b'); txt(c, 'IS LYING!', 0, W * 0.05, W * 0.042, 'Bangers', '#d8322b'); c.restore();
  c.save(); c.translate(W * 0.5, H * 0.53); c.rotate(-0.04); c.font = `${W * 0.085}px Bangers`; c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = 22; c.strokeStyle = INK;
  for (const [s, y] of [['THE NIGHT MY', 0], ['SHADOW RAN AWAY!', W * 0.095]]) { c.strokeText(s, 0, y); c.fillStyle = '#ffffff'; c.fillText(s, 0, y); } c.restore();
  // UPC box and the publisher bug
  const ux = W * 0.04, uy = H * 0.88, uw = W * 0.17, uh = H * 0.095; c.fillStyle = '#fff'; c.fillRect(ux, uy, uw, uh); c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(ux, uy, uw, uh);
  for (let i = 0; i < 34; i++) { c.fillStyle = INK; c.fillRect(ux + uw * 0.08 + i * uw * 0.025, uy + uh * 0.1, uw * (h(i + 70) > 0.5 ? 0.014 : 0.007), uh * 0.62); }
  txt(c, '0  71486  02358  1', ux + uw / 2, uy + uh * 0.85, W * 0.018, 'ComicNeue');
  c.beginPath(); c.arc(W * 0.9, H * 0.93, W * 0.055, 0, 6.283); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 6; c.stroke(); txt(c, 'LAMP-', W * 0.9, H * 0.922, W * 0.024); txt(c, 'LIGHT', W * 0.9, H * 0.94, W * 0.024); txt(c, 'COMICS', W * 0.9, H * 0.956, W * 0.014, 'ComicNeue');
  // ---- wear: newsstand-handled, slightly yellowed, spine creases ----
  const wg = c.createRadialGradient(W / 2, H / 2, W * 0.45, W / 2, H / 2, W * 1.0); wg.addColorStop(0, 'rgba(160,110,40,0)'); wg.addColorStop(1, 'rgba(150,100,35,0.3)'); c.fillStyle = wg; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) { c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 3; const y = H * (0.1 + 0.1 * i + 0.03 * h(i)); c.beginPath(); c.moveTo(0, y); c.lineTo(W * (0.02 + 0.03 * h(i + 2)), y + 12); c.stroke(); }
  for (let i = 0; i < 80; i++) { const e = Math.floor(h(i + 50) * 4), t = h(i + 51), x = e === 0 ? t * W : e === 1 ? W - 3 : e === 2 ? t * W : 3, y = e === 0 ? 3 : e === 1 ? t * H : e === 2 ? H - 3 : t * H;
    c.fillStyle = `rgba(250,244,225,${0.4 + 0.4 * h(i + 52)})`; c.beginPath(); c.arc(x, y, 3 + h(i + 53) * 9, 0, 6.283); c.fill(); }
}
