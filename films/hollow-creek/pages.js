// The printed comic: every page is a 2D canvas, drawn once. 90s newsprint look: cream paper, flat inks, halftone, wear.
// Fonts: Bangers (titles, SFX) and Comic Neue Bold (lettering), loaded before __ready.
const INK = '#141014';
const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export async function loadFonts() {
  for (const [name, url] of [['Bangers', './fonts/bangers.woff2'], ['ComicNeue', './fonts/comicneue.woff2']]) {
    const f = new FontFace(name, `url(${url})`); await f.load(); document.fonts.add(f);
  }
}
export const canvas = (w, hh) => Object.assign(document.createElement('canvas'), { width: w, height: hh });

// ---------- paper, print and wear ----------
function paper(c, W, H, base = '#f3e9d2') {
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {                                 // fibre speckle
    c.fillStyle = h(i) > 0.5 ? 'rgba(120,90,40,0.05)' : 'rgba(255,255,255,0.06)';
    c.fillRect(h(i + 1) * W, h(i + 2) * H, 2 + h(i + 3) * 5, 1 + h(i + 4) * 2);
  }
}
function halftone(c, x, y, w, hh, color, step = 9, max = 0.5, dir = 1) {   // dot screen that grows along the shape (shading)
  c.save(); c.beginPath(); c.rect(x, y, w, hh); c.clip(); c.fillStyle = color;
  for (let j = 0; j < hh; j += step) for (let i = (j / step) % 2 ? step / 2 : 0; i < w; i += step) {
    const k = dir > 0 ? j / hh : 1 - j / hh, r = step * max * k;
    if (r > 0.4) { c.beginPath(); c.arc(x + i, y + j, r, 0, 6.283); c.fill(); }
  }
  c.restore();
}
function age(c, W, H, k = 1) {                                     // yellowed edges, scuffs, a soft crease
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(160,110,40,0)'); g.addColorStop(1, `rgba(150,100,35,${0.28 * k})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70 * k; i++) {
    const e = Math.floor(h(i + 50) * 4), t = h(i + 51), x = e === 0 ? t * W : e === 1 ? W - 4 : e === 2 ? t * W : 4, y = e === 0 ? 4 : e === 1 ? t * H : e === 2 ? H - 4 : t * H;
    c.fillStyle = `rgba(255,250,235,${0.35 + 0.4 * h(i + 52)})`; c.beginPath(); c.arc(x, y, 3 + h(i + 53) * 10, 0, 6.283); c.fill();
  }
  c.strokeStyle = `rgba(255,255,255,${0.12 * k})`; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.08, H * 0.92); c.quadraticCurveTo(W * 0.3, H * 0.8, W * 0.22, H * 0.6); c.stroke();
}
function stroke(c, w = 8) { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function text(c, s, x, y, size, font = 'ComicNeue', color = INK, align = 'center') { c.font = `${size}px ${font}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); }
function outlined(c, s, x, y, size, fill, line, lw, font = 'Bangers') {
  c.font = `${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = lw; c.strokeStyle = line; c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y);
}
function caption(c, lines, x, y, w, size) {                        // the yellow narration box
  const lh = size * 1.18, hh = lines.length * lh + size * 0.7;
  c.fillStyle = '#ffe36a'; c.fillRect(x, y, w, hh); c.lineWidth = size * 0.12; c.strokeStyle = INK; c.strokeRect(x, y, w, hh);
  lines.forEach((l, i) => text(c, l, x + size * 0.45, y + size * 0.35 + lh * (i + 0.5), size, 'ComicNeue', INK, 'left'));
}
function balloon(c, lines, x, y, w, size, tx, ty, shout = false) {   // speech balloon with a tail to (tx, ty)
  const lh = size * 1.15, hh = lines.length * lh + size, cx = x + w / 2, cy = y + hh / 2;
  c.beginPath();
  if (shout) { for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.283, r = i % 2 ? 1 : 1.16; c.lineTo(cx + Math.cos(a) * w * 0.56 * r, cy + Math.sin(a) * hh * 0.62 * r); } }
  else c.ellipse(cx, cy, w * 0.56, hh * 0.62, 0, 0, 6.283);
  c.fillStyle = '#fffdf5'; c.fill(); stroke(c, size * 0.12);
  c.beginPath(); c.moveTo(cx - w * 0.08, cy + hh * 0.45); c.lineTo(tx, ty); c.lineTo(cx + w * 0.06, cy + hh * 0.5); c.fill(); stroke(c, size * 0.12);
  c.fillStyle = '#fffdf5'; c.fillRect(cx - w * 0.07, cy + hh * 0.38, w * 0.12, size * 0.25);
  lines.forEach((l, i) => text(c, l, cx, y + size * 0.5 + lh * (i + 0.5), size));
}
function panelFrame(c, x, y, w, hh, lw) { c.lineWidth = lw; c.strokeStyle = INK; c.strokeRect(x, y, w, hh); }

// ---------- MILO: round head, thick outline, red cap, yellow raincoat, newspaper bag. s = head radius ----------
export function milo(c, x, y, s, { look = 1, mood = 'calm', arm = 0, bike = false, noShadow = false } = {}) {
  const lw = s * 0.16; c.save();
  if (!noShadow) { c.fillStyle = 'rgba(20,10,30,0.35)'; c.beginPath(); c.ellipse(x - look * s * 1.4, y + s * 3.25, s * 2.1, s * 0.32, 0, 0, 6.283); c.fill(); }
  if (bike) {                                                     // wheels, frame
    c.beginPath(); c.arc(x - s * 1.5, y + s * 2.6, s * 0.9, 0, 6.283); stroke(c, lw); c.beginPath(); c.arc(x + s * 1.6, y + s * 2.6, s * 0.9, 0, 6.283); stroke(c, lw);
    c.beginPath(); c.moveTo(x - s * 1.5, y + s * 2.6); c.lineTo(x, y + s * 2.2); c.lineTo(x + s * 1.6, y + s * 2.6); c.moveTo(x, y + s * 2.2); c.lineTo(x + s * 1.2, y + s * 1.2); c.strokeStyle = '#2f6fd0'; c.lineWidth = lw * 1.1; c.stroke();
  }
  c.beginPath(); c.moveTo(x - s * 0.3, y + s * 1.9); c.lineTo(x - s * 0.5, y + s * (bike ? 2.4 : 3.1)); c.moveTo(x + s * 0.3, y + s * 1.9); c.lineTo(x + s * 0.45, y + s * (bike ? 2.3 : 3.1)); stroke(c, lw * 1.4);   // legs
  c.beginPath(); c.moveTo(x - s * 0.75, y + s * 0.85); c.quadraticCurveTo(x - s * 0.9, y + s * 2.1, x - s * 0.7, y + s * 2.1); c.lineTo(x + s * 0.7, y + s * 2.1); c.quadraticCurveTo(x + s * 0.9, y + s * 2.1, x + s * 0.75, y + s * 0.85); c.closePath();
  c.fillStyle = '#ffc928'; c.fill(); stroke(c, lw);               // raincoat
  c.beginPath(); c.moveTo(x - s * 0.7, y + s * 0.9); c.lineTo(x + s * 0.8, y + s * 1.9); stroke(c, lw * 0.8);   // bag strap
  c.beginPath(); c.roundRect(x + s * 0.55, y + s * 1.45, s * 0.7, s * 0.6, s * 0.1); c.fillStyle = '#8a5a34'; c.fill(); stroke(c, lw * 0.8);
  c.beginPath(); c.moveTo(x + look * s * 0.6, y + s * 1.1); c.lineTo(x + look * s * (1.1 + 0.2 * arm), y + s * (1.5 - 1.4 * arm)); stroke(c, lw * 1.3);   // arm
  c.beginPath(); c.arc(x, y, s, 0, 6.283); c.fillStyle = '#f6d2b0'; c.fill(); stroke(c, lw);   // head
  c.beginPath(); c.arc(x, y - s * 0.1, s * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fillStyle = '#d8322b'; c.fill(); stroke(c, lw);   // cap
  c.beginPath(); c.ellipse(x + look * s * 0.9, y - s * 0.28, s * 0.55, s * 0.14, 0, 0, 6.283); c.fill(); stroke(c, lw * 0.8);   // brim
  const ex = x + look * s * 0.3, er = mood === 'shock' ? s * 0.2 : s * 0.11;
  for (const d of [-0.32, 0.22]) { c.beginPath(); c.arc(ex + d * s, y + s * 0.05, er, 0, 6.283); c.fillStyle = mood === 'shock' ? '#fff' : INK; c.fill(); if (mood === 'shock') { stroke(c, lw * 0.6); c.beginPath(); c.arc(ex + d * s, y + s * 0.05, er * 0.4, 0, 6.283); c.fillStyle = INK; c.fill(); } }
  c.beginPath();                                                   // brows and mouth carry the mood
  if (mood === 'shock') { c.moveTo(ex - s * 0.5, y - s * 0.32); c.lineTo(ex - s * 0.15, y - s * 0.4); c.moveTo(ex + s * 0.05, y - s * 0.4); c.lineTo(ex + s * 0.4, y - s * 0.32); stroke(c, lw * 0.7); c.beginPath(); c.ellipse(ex, y + s * 0.5, s * 0.16, s * 0.24, 0, 0, 6.283); c.fillStyle = INK; c.fill(); }
  else if (mood === 'shout') { c.moveTo(ex - s * 0.5, y - s * 0.4); c.lineTo(ex - s * 0.12, y - s * 0.22); c.moveTo(ex + s * 0.05, y - s * 0.22); c.lineTo(ex + s * 0.42, y - s * 0.4); stroke(c, lw * 0.7); c.beginPath(); c.moveTo(ex - s * 0.25, y + s * 0.38); c.lineTo(ex + s * 0.25, y + s * 0.38); c.lineTo(ex, y + s * 0.72); c.closePath(); c.fillStyle = INK; c.fill(); }
  else { c.arc(ex, y + s * 0.38, s * 0.2, 0.2, Math.PI - 0.2); stroke(c, lw * 0.6); }
  c.restore();
}
// THE SHADOW: Milo's silhouette in flat violet-black, with two white crescent eyes and a grin. It is the mischief.
export function shadowKid(c, x, y, s, { grin = true } = {}) {
  c.save(); c.fillStyle = '#1c1030';
  c.beginPath(); c.arc(x, y, s, 0, 6.283); c.fill();
  c.beginPath(); c.arc(x, y - s * 0.1, s * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.fill(); c.beginPath(); c.ellipse(x + s * 0.9, y - s * 0.28, s * 0.55, s * 0.14, 0, 0, 6.283); c.fill();
  c.beginPath(); c.moveTo(x - s * 0.75, y + s * 0.85); c.lineTo(x - s * 0.8, y + s * 2.1); c.lineTo(x + s * 0.8, y + s * 2.1); c.lineTo(x + s * 0.75, y + s * 0.85); c.fill();
  c.lineWidth = s * 0.3; c.strokeStyle = '#1c1030'; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s * 0.3, y + s * 2); c.lineTo(x - s * 0.5, y + s * 3.1); c.moveTo(x + s * 0.3, y + s * 2); c.lineTo(x + s * 0.5, y + s * 3.1); c.moveTo(x - s * 0.7, y + s); c.lineTo(x - s * 1.3, y + s * 0.3); c.stroke();
  c.fillStyle = '#f4f0ff';
  for (const d of [-0.35, 0.25]) { c.beginPath(); c.ellipse(x + d * s, y, s * 0.18, s * 0.09, d < 0 ? 0.3 : -0.3, 0, 6.283); c.fill(); }
  if (grin) { c.beginPath(); c.arc(x - s * 0.05, y + s * 0.3, s * 0.35, 0.15, Math.PI - 0.15); c.lineTo(x - s * 0.05, y + s * 0.42); c.closePath(); c.fill(); }
  c.restore();
}
function town(c, x, y, w, hh, dusk = true) {                       // sky, hills, houses, the water tower
  const g = c.createLinearGradient(0, y, 0, y + hh);
  g.addColorStop(0, dusk ? '#2a2468' : '#151436'); g.addColorStop(0.6, dusk ? '#c0577a' : '#3a2a6a'); g.addColorStop(1, dusk ? '#f2a35a' : '#4c3a72');
  c.fillStyle = g; c.fillRect(x, y, w, hh);
  c.fillStyle = '#fff4c4'; c.beginPath(); c.arc(x + w * 0.78, y + hh * 0.22, hh * 0.09, 0, 6.283); c.fill();
  for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x + h(i + 7) * w, y + h(i + 8) * hh * 0.4, 3, 3); }
  c.fillStyle = '#3c2a5a'; c.beginPath(); c.moveTo(x, y + hh * 0.7); for (let i = 0; i <= 10; i++) c.lineTo(x + w * i / 10, y + hh * (0.62 + 0.07 * Math.sin(i * 1.7))); c.lineTo(x + w, y + hh); c.lineTo(x, y + hh); c.fill();
  const tx = x + w * 0.22, ty = y + hh * 0.38;                    // water tower
  c.fillStyle = '#2a1c3e'; c.fillRect(tx - w * 0.005, ty, w * 0.01, hh * 0.3); c.fillRect(tx + w * 0.07, ty, w * 0.01, hh * 0.3);
  c.beginPath(); c.roundRect(tx - w * 0.02, ty - hh * 0.1, w * 0.12, hh * 0.13, hh * 0.02); c.fill(); stroke(c, hh * 0.008);
  for (let i = 0; i < 9; i++) {                                    // houses with lit windows
    const hx = x + w * (0.05 + i * 0.105), hw = w * 0.085, hy = y + hh * (0.74 + 0.04 * h(i + 20)), hhh = hh * 0.2;
    c.fillStyle = ['#5b3a6e', '#6e3f5a', '#4a3a72'][i % 3]; c.fillRect(hx, hy, hw, hhh);
    c.beginPath(); c.moveTo(hx - hw * 0.1, hy); c.lineTo(hx + hw / 2, hy - hhh * 0.45); c.lineTo(hx + hw * 1.1, hy); c.closePath(); c.fillStyle = '#2a1c3e'; c.fill(); stroke(c, hh * 0.006);
    c.fillStyle = h(i + 30) > 0.3 ? '#ffd860' : '#2a1c3e'; c.fillRect(hx + hw * 0.3, hy + hhh * 0.3, hw * 0.35, hhh * 0.3);
  }
}

// ---------- the cover ----------
export function drawCover(c, W, H) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16144a'); g.addColorStop(0.55, '#3b2a7a'); g.addColorStop(1, '#6a2f6e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(W * 0.58, H * 0.45, W * 0.3, 0, 6.283); c.fill();   // huge moon
  halftone(c, 0, H * 0.2, W, H * 0.8, 'rgba(20,10,40,0.35)', 14, 0.45);
  c.fillStyle = '#1a1030'; c.beginPath(); c.moveTo(0, H * 0.78); for (let i = 0; i <= 12; i++) c.lineTo(W * i / 12, H * (0.74 + 0.03 * Math.sin(i * 2.1)) - (i % 3 === 1 ? H * 0.06 : 0)); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  c.fillStyle = '#2b1d48'; c.fillRect(0, H * 0.83, W, H * 0.17);   // road
  milo(c, W * 0.34, H * 0.66, W * 0.07, { bike: true, look: -1, mood: 'shock', noShadow: true });
  shadowKid(c, W * 0.74, H * 0.72, W * 0.06);                      // the shadow running the other way
  c.fillStyle = 'rgba(28,16,48,0.6)'; c.beginPath(); c.moveTo(W * 0.4, H * 0.83); c.quadraticCurveTo(W * 0.6, H * 0.9, W * 0.71, H * 0.85); c.lineTo(W * 0.73, H * 0.87); c.quadraticCurveTo(W * 0.58, H * 0.94, W * 0.38, H * 0.86); c.fill();
  // masthead
  c.fillStyle = '#d8322b'; c.fillRect(0, 0, W, H * 0.2); c.fillStyle = '#ffd23a'; c.fillRect(0, H * 0.2, W, H * 0.012);
  outlined(c, 'HOLLOW CREEK', W * 0.55, H * 0.085, W * 0.15, '#ffe14a', INK, W * 0.022);
  outlined(c, 'T A L E S', W * 0.62, H * 0.165, W * 0.06, '#ffffff', INK, W * 0.012);
  c.fillStyle = '#fff'; c.fillRect(W * 0.03, H * 0.022, W * 0.13, H * 0.155); c.lineWidth = W * 0.006; c.strokeStyle = INK; c.strokeRect(W * 0.03, H * 0.022, W * 0.13, H * 0.155);   // corner box
  text(c, 'No.', W * 0.095, H * 0.045, W * 0.03, 'Bangers'); text(c, '1', W * 0.095, H * 0.095, W * 0.09, 'Bangers', '#d8322b'); text(c, '75¢', W * 0.095, H * 0.152, W * 0.04, 'Bangers');
  // burst + tagline
  c.save(); c.translate(W * 0.83, H * 0.3); c.rotate(0.18); c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.283, r = (i % 2 ? 0.1 : 0.14) * W; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fillStyle = '#ffe14a'; c.fill(); stroke(c, W * 0.006);
  text(c, 'FIRST', 0, -W * 0.025, W * 0.045, 'Bangers', '#d8322b'); text(c, 'ISSUE!', 0, W * 0.025, W * 0.045, 'Bangers', '#d8322b'); c.restore();
  c.save(); c.translate(W * 0.36, H * 0.31); c.rotate(-0.06); outlined(c, 'THE NIGHT MY', 0, 0, W * 0.085, '#ffffff', INK, W * 0.014); outlined(c, 'SHADOW RAN AWAY!', W * 0.06, H * 0.05, W * 0.085, '#ffffff', INK, W * 0.014); c.restore();
  c.fillStyle = '#fff'; c.fillRect(W * 0.05, H * 0.9, W * 0.12, H * 0.07); for (let i = 0; i < 22; i++) { c.fillStyle = INK; c.fillRect(W * (0.06 + i * 0.0045), H * 0.91, W * (h(i) > 0.5 ? 0.003 : 0.0015), H * 0.045); }   // barcode
  age(c, W, H, 1.2);
}
// ---------- inside: the white title page and the inside-cover credits ----------
export function drawTitle(c, W, H) {
  paper(c, W, H, '#f7f1e2');
  text(c, 'HOLLOW CREEK TALES', W / 2, H * 0.2, W * 0.055, 'Bangers', '#d8322b');
  c.fillStyle = INK; c.fillRect(W * 0.3, H * 0.235, W * 0.4, 4);
  outlined(c, 'THE NIGHT', W / 2, H * 0.38, W * 0.15, '#1c1030', INK, 1);
  outlined(c, 'MY SHADOW', W / 2, H * 0.47, W * 0.15, '#1c1030', INK, 1);
  outlined(c, 'RAN AWAY', W / 2, H * 0.56, W * 0.15, '#1c1030', INK, 1);
  c.beginPath(); c.arc(W / 2, H * 0.72, W * 0.11, 0, 6.283); c.fillStyle = '#ffd23a'; c.fill(); stroke(c, W * 0.008);
  text(c, 'PART', W / 2, H * 0.695, W * 0.045, 'Bangers'); text(c, '1', W / 2, H * 0.745, W * 0.09, 'Bangers', '#d8322b');
  text(c, 'STORY & ART: THE HOLLOW CREEK GANG', W / 2, H * 0.9, W * 0.028);
  age(c, W, H, 0.5);
}
export function drawCredits(c, W, H) {                             // drawn mirrored by the texture (it is a back face)
  paper(c, W, H, '#efe4ca');
  text(c, 'IN THIS ISSUE...', W / 2, H * 0.1, W * 0.08, 'Bangers', '#d8322b');
  ['A paper route.', 'A street lamp.', 'A shadow with ideas', 'of its own.'].forEach((l, i) => text(c, l, W / 2, H * (0.18 + i * 0.045), W * 0.045));
  c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(W * 0.1, H * 0.42, W * 0.8, H * 0.48);   // a 90s mail-order ad (made up)
  outlined(c, 'GENUINE X-RAY', W / 2, H * 0.48, W * 0.09, '#ffe14a', INK, 8); outlined(c, 'SPECS!', W / 2, H * 0.55, W * 0.12, '#ffe14a', INK, 9);
  milo(c, W / 2, H * 0.67, W * 0.06, { mood: 'shock', noShadow: true });
  text(c, 'SEE THROUGH ANYTHING!*', W / 2, H * 0.8, W * 0.045); text(c, 'ONLY 25¢', W / 2, H * 0.85, W * 0.07, 'Bangers', '#d8322b');
  text(c, '*not anything', W * 0.75, H * 0.885, W * 0.025);
  age(c, W, H, 0.7);
}

// ---------- page 1: six panels, 2 columns x 3 rows ----------
export const PAGE = { W: 1600, H: 2448, m: 70, g: 40 };
export function panelRect(i) {                                     // i = 0..5, reading order: left-right, top-bottom
  const { W, H, m, g } = PAGE, pw = (W - 2 * m - g) / 2, ph = (H - 2 * m - 2 * g) / 3, col = i % 2, row = Math.floor(i / 2);
  return { x: m + col * (pw + g), y: m + row * (ph + g), w: pw, h: ph };
}
// panel 1 at any resolution (the page draws it small, a separate hi-res plane draws it big for the push-in)
export function drawPanel1(c, x, y, w, hh) {
  c.save(); c.beginPath(); c.rect(x, y, w, hh); c.clip();
  town(c, x, y, w, hh, true);
  halftone(c, x, y + hh * 0.55, w, hh * 0.45, 'rgba(30,10,40,0.25)', w * 0.012, 0.5);
  milo(c, x + w * 0.62, y + hh * 0.79, w * 0.03, { bike: true, look: 1 });
  caption(c, ['HOLLOW CREEK. POP. 2,413.', 'NOTHING EVER HAPPENS HERE.'], x + w * 0.04, y + hh * 0.04, w * 0.72, w * 0.042);
  c.restore(); panelFrame(c, x, y, w, hh, w * 0.012);
}
export function drawPage1(c, W, H) {
  paper(c, W, H, '#f4ead3');
  const r = [0, 1, 2, 3, 4, 5].map(panelRect);
  drawPanel1(c, r[0].x, r[0].y, r[0].w, r[0].h);
  { const p = r[1]; c.save(); c.beginPath(); c.rect(p.x, p.y, p.w, p.h); c.clip();   // 2: Milo throws a paper
    c.fillStyle = '#8fb6e8'; c.fillRect(p.x, p.y, p.w, p.h); c.fillStyle = '#e8d6b0'; c.fillRect(p.x, p.y + p.h * 0.75, p.w, p.h * 0.25);
    c.fillStyle = '#c96a4a'; c.fillRect(p.x + p.w * 0.55, p.y + p.h * 0.3, p.w * 0.4, p.h * 0.45); c.fillStyle = '#5b3a2a'; c.fillRect(p.x + p.w * 0.7, p.y + p.h * 0.5, p.w * 0.1, p.h * 0.25);
    milo(c, p.x + p.w * 0.3, p.y + p.h * 0.5, p.w * 0.08, { bike: true, arm: 1, look: 1 });
    c.save(); c.translate(p.x + p.w * 0.55, p.y + p.h * 0.28); c.rotate(0.5); c.fillStyle = '#fff'; c.fillRect(-25, -10, 50, 20); c.lineWidth = 5; c.strokeStyle = INK; c.strokeRect(-25, -10, 50, 20); c.restore();
    text(c, 'FWIP!', p.x + p.w * 0.6, p.y + p.h * 0.17, p.w * 0.1, 'Bangers', '#d8322b');
    caption(c, ['MILO PARK, 12. PAPER BOY.', 'PROFESSIONAL WORRIER.'], p.x + p.w * 0.04, p.y + p.h * 0.83, p.w * 0.8, p.w * 0.042); c.restore(); panelFrame(c, p.x, p.y, p.w, p.h, 18); }
  { const p = r[2]; c.save(); c.beginPath(); c.rect(p.x, p.y, p.w, p.h); c.clip();   // 3: the street lamp
    c.fillStyle = '#1e1a40'; c.fillRect(p.x, p.y, p.w, p.h);
    const lg = c.createRadialGradient(p.x + p.w * 0.5, p.y + p.h * 0.85, 10, p.x + p.w * 0.5, p.y + p.h * 0.85, p.w * 0.5); lg.addColorStop(0, 'rgba(255,220,120,0.8)'); lg.addColorStop(1, 'rgba(255,220,120,0)');
    c.fillStyle = lg; c.fillRect(p.x, p.y, p.w, p.h); c.fillStyle = '#2a2050'; c.fillRect(p.x + p.w * 0.48, p.y + p.h * 0.1, p.w * 0.04, p.h * 0.8); c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(p.x + p.w * 0.5, p.y + p.h * 0.12, p.w * 0.05, 0, 6.283); c.fill();
    milo(c, p.x + p.w * 0.3, p.y + p.h * 0.62, p.w * 0.06, { look: 1 });
    caption(c, ['EVERY NIGHT. SAME ROUTE.', 'SAME STREET LAMP.'], p.x + p.w * 0.04, p.y + p.h * 0.04, p.w * 0.7, p.w * 0.042); c.restore(); panelFrame(c, p.x, p.y, p.w, p.h, 18); }
  { const p = r[3]; c.save(); c.beginPath(); c.rect(p.x, p.y, p.w, p.h); c.clip();   // 4: no shadow
    c.fillStyle = '#e8c87a'; c.fillRect(p.x, p.y, p.w, p.h); halftone(c, p.x, p.y, p.w, p.h, 'rgba(160,90,30,0.35)', 16, 0.4, -1);
    milo(c, p.x + p.w * 0.5, p.y + p.h * 0.4, p.w * 0.13, { mood: 'shock', noShadow: true });
    caption(c, ['UNTIL TONIGHT.'], p.x + p.w * 0.04, p.y + p.h * 0.85, p.w * 0.5, p.w * 0.042); c.restore(); panelFrame(c, p.x, p.y, p.w, p.h, 18); }
  { const p = r[4]; c.save(); c.beginPath(); c.rect(p.x, p.y, p.w, p.h); c.clip();   // 5: the shadow behind a fence
    c.fillStyle = '#2c2456'; c.fillRect(p.x, p.y, p.w, p.h); shadowKid(c, p.x + p.w * 0.55, p.y + p.h * 0.45, p.w * 0.09);
    c.fillStyle = '#efe0c0'; for (let i = 0; i < 8; i++) { c.fillRect(p.x + i * p.w * 0.13, p.y + p.h * 0.55, p.w * 0.1, p.h * 0.45); c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(p.x + i * p.w * 0.13, p.y + p.h * 0.55, p.w * 0.1, p.h * 0.45); }
    text(c, 'hee hee', p.x + p.w * 0.8, p.y + p.h * 0.2, p.w * 0.08, 'Bangers', '#f4f0ff'); c.restore(); panelFrame(c, p.x, p.y, p.w, p.h, 18); }
  { const p = r[5]; c.save(); c.beginPath(); c.rect(p.x, p.y, p.w, p.h); c.clip();   // 6: the shout
    c.fillStyle = '#f04a3a'; c.fillRect(p.x, p.y, p.w, p.h); for (let i = 0; i < 30; i++) { c.strokeStyle = 'rgba(255,230,120,0.6)'; c.lineWidth = 10; c.beginPath(); const a = i / 30 * 6.283; c.moveTo(p.x + p.w / 2, p.y + p.h * 0.6); c.lineTo(p.x + p.w / 2 + Math.cos(a) * p.w, p.y + p.h * 0.6 + Math.sin(a) * p.w); c.stroke(); }
    milo(c, p.x + p.w * 0.5, p.y + p.h * 0.62, p.w * 0.1, { mood: 'shout', arm: 1, noShadow: true });
    balloon(c, ['HEY! GET BACK', 'HERE!'], p.x + p.w * 0.12, p.y + p.h * 0.06, p.w * 0.76, p.w * 0.07, p.x + p.w * 0.48, p.y + p.h * 0.45, true); c.restore(); panelFrame(c, p.x, p.y, p.w, p.h, 18); }
  text(c, '1', W / 2, H - 30, 34);
  age(c, W, H, 0.4);
}
