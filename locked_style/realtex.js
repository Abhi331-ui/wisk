// Realistic procedural textures (canvas). Every function returns a canvas; seeds keep them stable.
const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cv = (w, h = w) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const rgba = (c, a = 1, k = 1) => { const [r, g, b] = hex(c); return `rgba(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0},${a})`; };
/** tileable value noise layer drawn with soft blobs */
const blobs = (g, W, H, r, n, rad, colFn) => { for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, R = rad * (0.4 + r()); for (const [dx, dy] of [[0, 0], [W, 0], [-W, 0], [0, H], [0, -H]]) { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, R); const c = colFn(); gr.addColorStop(0, c); gr.addColorStop(1, c.replace(/[\d.]+\)$/, "0)")); g.fillStyle = gr; g.fillRect(x + dx - R, y + dy - R, 2 * R, 2 * R); } } };
const grain = (g, W, H, r, amt = 18) => { const d = g.getImageData(0, 0, W, H), p = d.data; for (let i = 0; i < p.length; i += 4) { const n = (r() - 0.5) * amt; p[i] += n; p[i + 1] += n; p[i + 2] += n; } g.putImageData(d, 0, 0); };

/** vertical board-and-batten siding: painted boards with grain, knots, chipped paint showing grey wood, nail heads */
export const barnBoards = (seed = 1, paint = "#a8382c", S = 1024, boards = 6) => {
  const c = cv(S), g = c.getContext("2d"), r = rng(seed), bw = S / boards;
  for (let b = 0; b < boards; b++) {
    const x0 = b * bw, k = 0.88 + r() * 0.2;
    g.fillStyle = rgba(paint, 1, k); g.fillRect(x0, 0, bw, S);
    for (let i = 0; i < 70; i++) { const x = x0 + r() * bw, w = 0.6 + r() * 2.2; g.strokeStyle = rgba(paint, 0.25 + r() * 0.3, 0.7 + r() * 0.5); g.lineWidth = w; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= S; y += 32) g.lineTo(x + Math.sin(y * 0.01 + i) * 2.5, y); g.stroke(); }
    for (let i = 0; i < 2; i++) { const x = x0 + bw * (0.25 + r() * 0.5), y = r() * S; g.fillStyle = rgba(paint, 0.8, 0.55); g.beginPath(); g.ellipse(x, y, 5 + r() * 6, 12 + r() * 10, 0, 0, 7); g.fill(); g.strokeStyle = rgba(paint, 0.5, 0.65); g.lineWidth = 2; for (let k2 = 1; k2 < 4; k2++) { g.beginPath(); g.ellipse(x, y, 5 + k2 * 6, 14 + k2 * 12, 0, 0, 7); g.stroke(); } }
    for (let i = 0; i < 3; i++) { const x = x0 + r() * bw, y = r() * S, w = 3 + r() * 10, h = 4 + r() * 18; g.fillStyle = `rgba(${150 + r() * 30 | 0},${140 + r() * 25 | 0},${128 + r() * 20 | 0},0.55)`; g.beginPath(); g.moveTo(x, y); for (let a = 0; a < 6.28; a += 0.6) g.lineTo(x + Math.cos(a) * w * (0.5 + r() * 0.5), y + Math.sin(a) * h * (0.5 + r() * 0.5)); g.fill(); }
    const gap = g.createLinearGradient(x0, 0, x0 + 8, 0); gap.addColorStop(0, "rgba(20,8,6,0.85)"); gap.addColorStop(1, "rgba(20,8,6,0)"); g.fillStyle = gap; g.fillRect(x0, 0, 8, S);
    const hl = g.createLinearGradient(x0 + bw - 6, 0, x0 + bw, 0); hl.addColorStop(0, "rgba(255,230,210,0)"); hl.addColorStop(1, "rgba(255,230,210,0.18)"); g.fillStyle = hl; g.fillRect(x0 + bw - 6, 0, 6, S);
    for (const y of [S * 0.12, S * 0.62]) for (const dx of [0.3, 0.7]) { g.fillStyle = "rgba(60,50,45,0.9)"; g.beginPath(); g.arc(x0 + bw * dx, y, 3.2, 0, 7); g.fill(); g.fillStyle = "rgba(90,40,25,0.35)"; g.fillRect(x0 + bw * dx - 1.5, y, 3, 18 + r() * 30); }
  }
  blobs(g, S, S, r, 40, 120, () => `rgba(${40 + r() * 30 | 0},${25 | 0},${20},${0.06 + r() * 0.08})`);
  const dirt = g.createLinearGradient(0, S * 0.75, 0, S); dirt.addColorStop(0, "rgba(80,55,35,0)"); dirt.addColorStop(1, "rgba(80,55,35,0.0)"); g.fillStyle = dirt; g.fillRect(0, 0, S, S);
  grain(g, S, S, r, 14); return c;
};
/** dry farmyard dirt: multi-scale soil, pebbles with shadow + highlight, straw bits, footprints-ish scuffs; no tiling cells */
export const dirtReal = (seed = 2, base = "#a88462", S = 1024) => {
  const c = cv(S), g = c.getContext("2d"), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  blobs(g, S, S, r, 90, 160, () => (r() < 0.5 ? `rgba(70,48,30,${0.08 + r() * 0.1})` : `rgba(210,180,140,${0.06 + r() * 0.1})`));
  blobs(g, S, S, r, 400, 40, () => (r() < 0.5 ? `rgba(60,40,25,${0.08 + r() * 0.1})` : `rgba(220,195,160,${0.06 + r() * 0.08})`));
  for (let i = 0; i < 900; i++) { const x = r() * S, y = r() * S, R = 1.5 + r() * r() * 9; const t = 120 + r() * 80;
    g.fillStyle = "rgba(40,28,18,0.35)"; g.beginPath(); g.ellipse(x + R * 0.35, y + R * 0.45, R, R * 0.75, 0, 0, 7); g.fill();
    g.fillStyle = `rgb(${t + 20 | 0},${t | 0},${t - 25 | 0})`; g.beginPath(); g.ellipse(x, y, R, R * 0.75, r() * 3, 0, 7); g.fill();
    g.fillStyle = "rgba(255,245,225,0.35)"; g.beginPath(); g.ellipse(x - R * 0.3, y - R * 0.3, R * 0.4, R * 0.3, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 160; i++) { const x = r() * S, y = r() * S, a = r() * 6.28, L = 8 + r() * 26; g.strokeStyle = `rgba(${200 + r() * 40 | 0},${170 + r() * 40 | 0},${90 + r() * 40 | 0},0.7)`; g.lineWidth = 1 + r() * 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  grain(g, S, S, r, 22); return c;
};
/** meadow ground seen from above: thousands of short blades in mixed greens and straw, dark soil showing through */
export const grassReal = (seed = 3, S = 1024) => {
  const c = cv(S), g = c.getContext("2d"), r = rng(seed);
  g.fillStyle = "#5e7334"; g.fillRect(0, 0, S, S);
  blobs(g, S, S, r, 120, 140, () => (r() < 0.5 ? `rgba(40,55,20,${0.15 + r() * 0.1})` : `rgba(170,170,80,${0.1 + r() * 0.1})`));
  for (let i = 0; i < 26000; i++) { const x = r() * S, y = r() * S, a = -1.57 + (r() - 0.5) * 1.4, L = 5 + r() * 14, h = r();
    g.strokeStyle = h < 0.15 ? `rgba(${190 + r() * 40 | 0},${170 + r() * 30 | 0},${90 + r() * 30 | 0},0.8)` : `rgba(${60 + r() * 70 | 0},${95 + r() * 70 | 0},${30 + r() * 30 | 0},0.85)`;
    g.lineWidth = 0.8 + r() * 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  grain(g, S, S, r, 16); return c;
};
/** cedar shingle roof: staggered rows, each shingle with grain and a shadowed lower edge, moss patches */
export const shingles = (seed = 4, base = "#5c4a42", S = 1024, rows = 12, cols = 9) => {
  const c = cv(S), g = c.getContext("2d"), r = rng(seed), rh = S / rows, cw = S / cols;
  g.fillStyle = rgba(base, 1, 0.5); g.fillRect(0, 0, S, S);
  for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) { const x = i * cw + (j % 2) * cw * 0.5 + (r() - 0.5) * 6, w = cw * (0.85 + r() * 0.3), k = 0.75 + r() * 0.45;
    g.fillStyle = rgba(base, 1, k); g.fillRect(x + 2, j * rh, w - 4, rh * 1.05);
    for (let s = 0; s < 6; s++) { g.strokeStyle = rgba(base, 0.4, k * 0.75); g.lineWidth = 1; const xx = x + 4 + r() * (w - 8); g.beginPath(); g.moveTo(xx, j * rh); g.lineTo(xx + (r() - 0.5) * 3, j * rh + rh); g.stroke(); }
    const sh = g.createLinearGradient(0, j * rh + rh * 0.78, 0, j * rh + rh * 1.05); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(10,6,5,0.6)"); g.fillStyle = sh; g.fillRect(x + 2, j * rh, w - 4, rh * 1.05); }
  blobs(g, S, S, r, 30, 70, () => `rgba(${80 + r() * 40 | 0},${100 + r() * 30 | 0},${50},${0.15 + r() * 0.15})`);
  grain(g, S, S, r, 14); return c;
};
/** fieldstone footing: rounded stones with mortar */
export const stoneReal = (seed = 5, S = 512) => {
  const c = cv(S), g = c.getContext("2d"), r = rng(seed);
  g.fillStyle = "#8a8278"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, w = 22 + r() * 40, h = 16 + r() * 26, t = 120 + r() * 60;
    g.fillStyle = "rgba(40,35,30,0.5)"; g.beginPath(); g.ellipse(x + 3, y + 4, w, h, r(), 0, 7); g.fill();
    const gr = g.createRadialGradient(x - w * 0.3, y - h * 0.4, 2, x, y, w); gr.addColorStop(0, `rgb(${t + 40 | 0},${t + 35 | 0},${t + 30 | 0})`); gr.addColorStop(1, `rgb(${t - 30 | 0},${t - 32 | 0},${t - 35 | 0})`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, w, h, r(), 0, 7); g.fill(); }
  grain(g, S, S, r, 18); return c;
};
/** weathered grey-brown wood (posts, rails, stumps, planks) */
export const woodReal = (seed = 6, base = "#8a6a4a", S = 512, vertical = true) => {
  const c = cv(S), g = c.getContext("2d"), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) { const p = r() * S, w = 0.6 + r() * 2.4; g.strokeStyle = rgba(base, 0.25 + r() * 0.4, 0.6 + r() * 0.65); g.lineWidth = w; g.beginPath(); for (let q = 0; q <= S; q += 16) { const o = Math.sin(q * 0.012 + i * 1.7) * 3 + Math.sin(q * 0.05 + i) * 0.8; vertical ? g.lineTo(p + o, q) : g.lineTo(q, p + o); } g.stroke(); }
  for (let i = 0; i < 3; i++) { const x = r() * S, y = r() * S; g.fillStyle = rgba(base, 0.9, 0.45); g.beginPath(); g.ellipse(x, y, vertical ? 6 : 14, vertical ? 14 : 6, 0, 0, 7); g.fill(); }
  blobs(g, S, S, r, 20, 90, () => `rgba(${120 + r() * 40 | 0},${120 + r() * 30 | 0},${115},${0.08 + r() * 0.08})`);
  grain(g, S, S, r, 16); return c;
};
/** cracked rock strata for distant mesas (horizontal bands) */
export const strata = (seed = 7, S = 1024) => {
  const c = cv(S), g = c.getContext("2d"), r = rng(seed);
  let y = 0; while (y < S) { const h = 10 + r() * 60, t = r(); g.fillStyle = `rgb(${190 + t * 50 | 0},${95 + t * 50 | 0},${60 + t * 40 | 0})`; g.fillRect(0, y, S, h + 1); y += h; }
  for (let i = 0; i < 200; i++) { const x = r() * S, y0 = r() * S, L = 20 + r() * 120; g.strokeStyle = `rgba(80,35,20,${0.2 + r() * 0.3})`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (r() - 0.5) * 20, y0 + L); g.stroke(); }
  blobs(g, S, S, r, 50, 140, () => `rgba(${60},${30},${20},${0.08 + r() * 0.1})`);
  grain(g, S, S, r, 18); return c;
};
/** alpha grass clump card 256x256: dense tapered blades */
export const grassCard = (seed = 8) => {
  const c = cv(256), g = c.getContext("2d"), r = rng(seed);
  for (let i = 0; i < 90; i++) { const x = 30 + r() * 196, h = 80 + r() * 170, lean = (r() - 0.5) * 80, w = 3 + r() * 5, t = r();
    g.fillStyle = t < 0.12 ? `rgb(${190 + r() * 40 | 0},${175 + r() * 30 | 0},${100 + r() * 30 | 0})` : `rgb(${55 + t * 70 | 0},${90 + t * 80 | 0},${28 + t * 30 | 0})`;
    g.beginPath(); g.moveTo(x - w, 256); g.quadraticCurveTo(x + lean * 0.4, 256 - h * 0.6, x + lean, 256 - h); g.quadraticCurveTo(x + lean * 0.4 + w * 0.3, 256 - h * 0.6, x + w, 256); g.fill(); }
  const sh = g.createLinearGradient(0, 160, 0, 256); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(10,20,5,0.55)"); g.globalCompositeOperation = "source-atop"; g.fillStyle = sh; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = "source-over";
  return c;
};
/** alpha leaf cluster card 256x256 for tree foliage */
export const leafCard = (seed = 9, base = [70, 110, 45]) => {
  const c = cv(256), g = c.getContext("2d"), r = rng(seed);
  for (let i = 0; i < 260; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 110, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d * 0.9, L = 9 + r() * 10, W = 4 + r() * 4, rot = r() * 6.28;
    const lit = 0.6 + 0.6 * (1 - (y / 256)) + (r() - 0.5) * 0.3; g.fillStyle = `rgb(${base[0] * lit | 0},${base[1] * lit | 0},${base[2] * lit | 0})`;
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, L, W, 0, 0, 7); g.fill(); g.restore(); }
  return c;
};
/** bark for trunks */
export const bark = (seed = 10, S = 512) => {
  const c = cv(S), g = c.getContext("2d"), r = rng(seed);
  g.fillStyle = "#6e6050"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 120; i++) { const x = r() * S; g.strokeStyle = `rgba(${30 + r() * 30 | 0},${25 + r() * 20 | 0},${20},${0.4 + r() * 0.4})`; g.lineWidth = 2 + r() * 5; g.beginPath(); for (let y = 0; y <= S; y += 20) g.lineTo(x + Math.sin(y * 0.03 + i) * 6, y); g.stroke(); }
  for (let i = 0; i < 80; i++) { const x = r() * S; g.strokeStyle = `rgba(170,160,145,${0.2 + r() * 0.3})`; g.lineWidth = 1 + r() * 2; g.beginPath(); for (let y = 0; y <= S; y += 24) g.lineTo(x + Math.sin(y * 0.02 + i) * 4, y); g.stroke(); }
  grain(g, S, S, r, 20); return c;
};
/** paper grain overlay for character cards (256, tile) */
export const paperGrain = (seed = 11) => { const c = cv(256), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256); blobs(g, 256, 256, r, 60, 30, () => (r() < 0.5 ? `rgba(60,60,60,0.12)` : `rgba(200,200,200,0.12)`)); grain(g, 256, 256, r, 40); return c; };
/** hewn log end + side for cabin logs (horizontal grain with checks) */
export const logSide = (seed = 12, S = 512) => woodReal(seed, "#7a5e44", S, false);
/** white-grey chinking (mortar between logs) */
export const chink = (seed = 13, S = 256) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#d8d0c0"; g.fillRect(0, 0, S, S); blobs(g, S, S, r, 60, 30, () => `rgba(${120 + r() * 40 | 0},${110 + r() * 30 | 0},${95},${0.15 + r() * 0.15})`); grain(g, S, S, r, 26); return c; };
/** rough fieldstone chimney (bigger stones) */
export const chimneyStone = (seed = 14, S = 512) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#6e665e"; g.fillRect(0, 0, S, S);
  let y = 0; while (y < S) { const h = 30 + r() * 26; let x = -r() * 40; while (x < S) { const w = 40 + r() * 60, t = 110 + r() * 70; g.fillStyle = `rgb(${t + 10 | 0},${t | 0},${t - 12 | 0})`; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 - 3, h / 2 - 3, 0, 0, 7); g.fill(); g.fillStyle = "rgba(255,250,240,0.18)"; g.beginPath(); g.ellipse(x + w / 2 - 6, y + h / 2 - 5, w / 3, h / 4, 0, 0, 7); g.fill(); x += w; } y += h; }
  grain(g, S, S, r, 20); return c; };
/** raw red meat with fat marbling */
export const meatTex = (seed = 15, S = 256) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#7a1a1c"; g.fillRect(0, 0, S, S);
  blobs(g, S, S, r, 50, 40, () => (r() < 0.6 ? `rgba(70,8,12,${0.35 + r() * 0.3})` : `rgba(170,50,50,${0.2 + r() * 0.2})`));
  for (let i = 0; i < 9; i++) { g.strokeStyle = `rgba(240,205,195,${0.3 + r() * 0.2})`; g.lineWidth = 3 + r() * 5; g.beginPath(); let x = r() * S, y = r() * S; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  return c; };
/** distant tree billboard (deciduous, early spring green) 256 */
export const farTree = (seed = 16, base = [74, 104, 52]) => { const c = cv(256), g = c.getContext("2d"), r = rng(seed);
  g.fillStyle = "#4a3a2c"; g.fillRect(122, 170, 12, 86);
  for (let i = 0; i < 180; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 95, x = 128 + Math.cos(a) * d, y = 110 + Math.sin(a) * d * 0.85, R = 10 + r() * 16, lit = 0.65 + 0.55 * (1 - y / 220) + (r() - 0.5) * 0.25;
    g.fillStyle = `rgb(${base[0] * lit | 0},${base[1] * lit | 0},${base[2] * lit | 0})`; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); }
  return c; };
/** log end grain: growth rings, radial checks, bark rim (256) */
export const endGrain = (seed = 17, S = 256) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed), cx = S / 2 + (r() - 0.5) * 20, cy = S / 2 + (r() - 0.5) * 20;
  g.fillStyle = "#4a3626"; g.fillRect(0, 0, S, S); g.fillStyle = "#c8a070"; g.beginPath(); g.arc(S / 2, S / 2, S * 0.46, 0, 7); g.fill();
  for (let k = 1; k < 18; k++) { g.strokeStyle = `rgba(120,80,45,${0.3 + r() * 0.3})`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.ellipse(cx, cy, k * 6.2 + r() * 2, k * 6.0 + r() * 2, r(), 0, 7); g.stroke(); }
  for (let k = 0; k < 4; k++) { const a = r() * 6.28; g.strokeStyle = "rgba(50,30,20,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20); g.lineTo(cx + Math.cos(a) * 110, cy + Math.sin(a) * 110); g.stroke(); }
  grain(g, S, S, r, 18); return c; };
/** sooty cast iron (512) */
export const ironSoot = (seed = 18, S = 512) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#2a2826"; g.fillRect(0, 0, S, S);
  blobs(g, S, S, r, 120, 50, () => (r() < 0.5 ? `rgba(10,8,8,${0.3 + r() * 0.3})` : `rgba(90,70,55,${0.12 + r() * 0.12})`)); grain(g, S, S, r, 22); return c; };
/** woven cloth: plaid or linen (256) */
export const cloth = (seed = 19, base = "#e8e0d0", stripe = null, S = 256) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, S, S);
  if (stripe) for (let k = 0; k < 8; k++) { g.fillStyle = stripe; g.globalAlpha = 0.45; g.fillRect(k * 32, 0, 10, S); g.fillRect(0, k * 32, S, 10); g.globalAlpha = 1; }
  for (let y = 0; y < S; y += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.04})`; g.fillRect(0, y, S, 1); } for (let x = 0; x < S; x += 2) { g.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.04})`; g.fillRect(x, 0, 1, S); }
  blobs(g, S, S, r, 20, 60, () => `rgba(120,100,80,${0.05 + r() * 0.05})`); return c; };
/** flame sprite (128 x 256), alpha */
export const flame = (seed = 20) => { const c = cv(128, 256), g = c.getContext("2d"), r = rng(seed);
  for (let k = 0; k < 3; k++) { const gr = g.createRadialGradient(64, 200, 4, 64, 170 - k * 20, 90 - k * 22); gr.addColorStop(0, k === 2 ? "rgba(255,250,210,1)" : "rgba(255,200,90,0.95)"); gr.addColorStop(0.5, k === 0 ? "rgba(240,90,20,0.75)" : "rgba(255,150,40,0.7)"); gr.addColorStop(1, "rgba(200,40,0,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(64 - 44 + k * 12, 240); g.bezierCurveTo(20 + k * 10, 160, 50 + r() * 20, 90, 64 + (r() - 0.5) * 16, 20 + k * 30); g.bezierCurveTo(80 + r() * 20, 90, 108 - k * 10, 160, 64 + 44 - k * 12, 240); g.fill(); }
  return c; };
/** rope (128) */
export const rope = (seed = 21, S = 128) => { const c = cv(S), g = c.getContext("2d"); g.fillStyle = "#b09a70"; g.fillRect(0, 0, S, S); g.strokeStyle = "rgba(90,70,40,0.6)"; g.lineWidth = 6; for (let k = -S; k < S * 2; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + S, S); g.stroke(); } return c; };

/** leaf cluster card with real leaf shapes: pointed ovals with midribs, lit top, darker core (256) */
export const leafReal = (seed = 30, base = [72, 110, 46]) => { const c = cv(256), g = c.getContext("2d"), r = rng(seed);
  const leaf = (x, y, L, W, a, k) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`; g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -W, L, 0); g.quadraticCurveTo(0, W, -L, 0); g.fill();
    g.strokeStyle = `rgba(${base[0] * k * 0.6 | 0},${base[1] * k * 0.6 | 0},${base[2] * k * 0.5 | 0},0.6)`; g.lineWidth = 1; g.beginPath(); g.moveTo(-L, 0); g.lineTo(L * 0.9, 0); g.stroke(); g.restore(); };
  for (let i = 0; i < 200; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 112, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d * 0.92, core = d / 112;
    const k = (0.5 + 0.35 * core) * (0.75 + 0.5 * (1 - y / 256)) * (0.85 + r() * 0.3); leaf(x, y, 8 + r() * 7, 4 + r() * 3, r() * 6.28, k); }
  return c; };
/** realistic distant deciduous tree billboard: lobed crown, lit upper-left, shadowed underside, sky gaps, trunk + limbs (256) */
export const farTreeReal = (seed = 31, base = [70, 100, 50]) => { const c = cv(256), g = c.getContext("2d"), r = rng(seed);
  g.strokeStyle = "#3e3226"; g.lineCap = "round"; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 256); g.lineTo(126, 150); g.stroke(); g.lineWidth = 4; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(127, 175 - k * 10); g.lineTo(127 + (k % 2 ? 1 : -1) * (30 + r() * 25), 120 - k * 14); g.stroke(); }
  const lobes = []; for (let k = 0; k < 9; k++) lobes.push([128 + (r() - 0.5) * 130, 100 + (r() - 0.5) * 90, 30 + r() * 26]);
  for (const [x, y, R] of lobes) for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * R, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, lit = 0.55 + 0.6 * Math.max(0, -(Math.cos(a) * 0.6 + Math.sin(a) * 0.8)) * (d / R) + (r() - 0.5) * 0.2 - 0.15 * (py / 256);
    g.fillStyle = `rgb(${base[0] * lit | 0},${base[1] * lit | 0},${base[2] * lit | 0})`; g.beginPath(); g.arc(px, py, 4 + r() * 6, 0, 7); g.fill(); }
  return c; };
/** eastern red cedar billboard (conical dark evergreen) */
export const cedar = (seed = 32) => { const c = cv(256), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#3e3226"; g.fillRect(124, 220, 8, 36);
  for (let i = 0; i < 900; i++) { const t = r(), y = 20 + t * 205, w = t * 62, x = 128 + (r() - 0.5) * 2 * w, lit = 0.7 + 0.5 * (x < 128 ? 1 : 0.5) * (1 - t * 0.4) + (r() - 0.5) * 0.25; g.fillStyle = `rgb(${38 * lit | 0},${70 * lit | 0},${44 * lit | 0})`; g.beginPath(); g.arc(x, y, 3 + r() * 4, 0, 7); g.fill(); }
  return c; };
/** horizontal painted clapboard siding: overlapping boards with shadow lines, paint wear (1024) */
export const clapboard = (seed = 60, paint = "#d8c8a8", S = 1024, rows = 16) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed), h = S / rows;
  for (let k = 0; k < rows; k++) { const y = k * h, kk = 0.92 + r() * 0.12; const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, rgba(paint, 1, kk * 1.05)); gr.addColorStop(0.85, rgba(paint, 1, kk * 0.92)); gr.addColorStop(1, rgba(paint, 1, kk * 0.62)); g.fillStyle = gr; g.fillRect(0, y, S, h);
    for (let i = 0; i < 30; i++) { g.strokeStyle = rgba(paint, 0.2, 0.75); g.lineWidth = 1; const yy = y + r() * h; g.beginPath(); g.moveTo(r() * S, yy); g.lineTo(r() * S, yy + (r() - 0.5) * 2); g.stroke(); }
    g.fillStyle = "rgba(20,14,10,0.55)"; g.fillRect(0, y + h - 3, S, 3); }
  blobs(g, S, S, r, 30, 90, () => `rgba(${70 + r() * 30 | 0},${55},${45},${0.05 + r() * 0.06})`); grain(g, S, S, r, 12); return c; };
/** red brick with mortar and per-brick variation (512) */
export const brickReal = (seed = 61, base = "#9a4a34", S = 512) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed), bh = S / 16, bw = S / 4;
  g.fillStyle = "#b8ab98"; g.fillRect(0, 0, S, S);
  for (let j = 0; j < 16; j++) for (let i = -1; i < 5; i++) { const x = i * bw + (j % 2) * bw / 2, k = 0.8 + r() * 0.35; g.fillStyle = rgba(base, 1, k); g.fillRect(x + 3, j * bh + 3, bw - 6, bh - 6); g.fillStyle = "rgba(255,230,200,0.08)"; g.fillRect(x + 3, j * bh + 3, bw - 6, 3); }
  blobs(g, S, S, r, 30, 60, () => `rgba(40,25,20,${0.05 + r() * 0.08})`); grain(g, S, S, r, 18); return c; };
/** granite cobblestones (1024) */
export const cobbleReal = (seed = 62, S = 1024) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#5a554e"; g.fillRect(0, 0, S, S);
  const rh = 28; for (let y = 0; y < S; y += rh) { let x = -r() * 30; while (x < S) { const w = 26 + r() * 22, t = 105 + r() * 60; const gr = g.createRadialGradient(x + w * 0.4, y + rh * 0.35, 2, x + w / 2, y + rh / 2, w * 0.7); gr.addColorStop(0, `rgb(${t + 25 | 0},${t + 20 | 0},${t + 14 | 0})`); gr.addColorStop(1, `rgb(${t - 30 | 0},${t - 32 | 0},${t - 34 | 0})`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(x + w / 2, y + rh / 2, w / 2 - 2.5, rh / 2 - 2.5, 0, 0, 7); g.fill(); x += w; } }
  blobs(g, S, S, r, 60, 80, () => `rgba(${90 + r() * 30 | 0},${75},${55},${0.06 + r() * 0.08})`); grain(g, S, S, r, 18); return c; };
/** painted shop sign (1024 x 256): dark board, gilt serif letters with shadow, border */
export const shopSign = (text, bg = "#1e2a24", fg = "#e8c870") => { const c = cv(1024, 256), g = c.getContext("2d"); g.fillStyle = bg; g.fillRect(0, 0, 1024, 256); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(14, 14, 996, 228); g.lineWidth = 2; g.strokeRect(28, 28, 968, 200);
  g.font = "900 120px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; let m = g.measureText(text).width; if (m > 900) g.font = `900 ${120 * 900 / m}px Georgia, serif`; g.fillStyle = "rgba(0,0,0,0.5)"; g.fillText(text, 516, 136); g.fillStyle = fg; g.fillText(text, 512, 130); return c; };
/** gunny sack burlap (256) */
export const burlap = (seed = 63, S = 256) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#c8ac7a"; g.fillRect(0, 0, S, S); for (let y = 0; y < S; y += 3) { g.fillStyle = `rgba(90,70,40,${0.12 + r() * 0.1})`; g.fillRect(0, y, S, 1); } for (let x = 0; x < S; x += 3) { g.fillStyle = `rgba(250,235,200,${0.08 + r() * 0.08})`; g.fillRect(x, 0, 1, S); } grain(g, S, S, r, 14); return c; };
/** bay water with ripples (1024) */
export const waterTex = (seed = 64, S = 1024) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#4a7090"; g.fillRect(0, 0, S, S); for (let i = 0; i < 1600; i++) { const x = r() * S, y = r() * S, L = 10 + r() * 40; g.strokeStyle = r() < 0.5 ? `rgba(220,235,245,${0.15 + r() * 0.2})` : `rgba(20,40,60,${0.15 + r() * 0.15})`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (r() - 0.5) * 2); g.stroke(); } return c; };
/** tileable wave normal map (512) from summed sine waves */
export const waveNormal = (S = 512) => { const c = cv(S), g = c.getContext("2d"), d = g.createImageData(S, S), p = d.data;
  const H = (x, y) => { let h = 0; const W = [[3, 1, 0.5, 0], [1, 4, 0.35, 1.3], [7, 3, 0.18, 2.1], [2, 9, 0.12, 0.7], [13, 6, 0.07, 3.3], [5, 15, 0.05, 1.9]]; for (const [kx, ky, a, ph] of W) h += a * Math.sin((kx * x + ky * y) * 2 * Math.PI / S + ph); return h; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1), nx = -dx * 6, ny = -dy * 6, l = Math.hypot(nx, ny, 1), i = (y * S + x) * 4; p[i] = (nx / l * 0.5 + 0.5) * 255; p[i + 1] = (ny / l * 0.5 + 0.5) * 255; p[i + 2] = (1 / l * 0.5 + 0.5) * 255; p[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c; };
/** canvas sail cloth with vertical seams and reinforcing bands (256) */
export const sailCloth = (seed = 66, S = 256) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed); g.fillStyle = "#efe6d2"; g.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 32) { g.fillStyle = "rgba(120,100,70,0.22)"; g.fillRect(x, 0, 2, S); } for (const y of [20, S / 2, S - 24]) { g.fillStyle = "rgba(120,100,70,0.18)"; g.fillRect(0, y, S, 6); }
  blobs(g, S, S, r, 20, 60, () => `rgba(150,130,100,${0.05 + r() * 0.06})`); grain(g, S, S, r, 12); return c; };
/** shop interior seen through a storefront: shelves with jars, boxes, bolts of cloth, warm back wall (512 x 256) */
export const shopInterior = (seed = 67) => { const c = cv(512, 256), g = c.getContext("2d"), r = rng(seed);
  const bg = g.createLinearGradient(0, 0, 0, 256); bg.addColorStop(0, "#3a2a20"); bg.addColorStop(1, "#1e1612"); g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
  for (let k = 0; k < 4; k++) { const y = 40 + k * 52; g.fillStyle = "#5a3e2a"; g.fillRect(0, y + 34, 512, 6);
    let x = 6; while (x < 506) { const w = 10 + r() * 26, h = 12 + r() * 22, t = r(); g.fillStyle = t < 0.3 ? `hsl(${r() * 360},40%,${35 + r() * 25}%)` : t < 0.6 ? `rgba(${180 + r() * 60 | 0},${160 + r() * 60 | 0},${120},0.9)` : `hsl(${20 + r() * 30},45%,${30 + r() * 20}%)`; g.fillRect(x, y + 34 - h, w, h); g.fillStyle = "rgba(255,240,210,0.15)"; g.fillRect(x + 2, y + 34 - h + 2, 2, h - 4); x += w + 2 + r() * 6; } }
  const lamp = g.createRadialGradient(256, 30, 4, 256, 30, 220); lamp.addColorStop(0, "rgba(255,210,140,0.35)"); lamp.addColorStop(1, "rgba(255,210,140,0)"); g.fillStyle = lamp; g.fillRect(0, 0, 512, 256); return c; };
/** weathered wharf deck boards running one way, with gaps and nail rows (512) */
export const deckBoards = (seed = 68, S = 512) => { const c = cv(S), g = c.getContext("2d"), r = rng(seed), n = 8, bw = S / n;
  for (let k = 0; k < n; k++) { const kk = 0.85 + r() * 0.25; g.fillStyle = rgba("#8a7a62", 1, kk); g.fillRect(k * bw, 0, bw, S); for (let i = 0; i < 40; i++) { g.strokeStyle = rgba("#8a7a62", 0.3, 0.7 + r() * 0.5); g.lineWidth = 1; const x = k * bw + r() * bw; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 3, S); g.stroke(); }
    g.fillStyle = "rgba(20,14,10,0.7)"; g.fillRect(k * bw, 0, 3, S); for (const y of [S * 0.25, S * 0.75]) for (const dx of [0.25, 0.75]) { g.fillStyle = "rgba(40,36,34,0.9)"; g.beginPath(); g.arc(k * bw + bw * dx, y, 2.4, 0, 7); g.fill(); } }
  blobs(g, S, S, r, 30, 70, () => `rgba(${60 + r() * 30 | 0},${60},${55},${0.06 + r() * 0.08})`); grain(g, S, S, r, 14); return c; };
