// PAGE 1 (1990s look): Milo finishes his route, the last street lamp flickers, his shadow is gone, it grins and runs.
// 90s rules: glossy white panels on black gutters, slanted panel borders, airbrush gradients, glows and lens flares,
// coloured rim light on every figure, airbrushed form shading + cross-hatching on the shadow side, heavy spotted blacks,
// dark gradient caption boxes with white italic lettering, chunky extruded gradient SFX. Compositions vary every panel.
import { PAGE, INK, panelRect, balloon, bike, fence, tuft, bush, tree, house2, spot, speed, brushGround, hatch,
  panel90, grad, glow, flare, xhatch, card90, caption90, sfx90, page90 } from './comic.js';
import { CAST, drawFront, drawSide, drawShadow, drawShadowSide } from './cast/cast.js';
const M = CAST.milo;

// airbrushed form shading on a card: a soft dark ramp on the side away from the light, cross-hatched where it is darkest
function shaded(k, lightFrom = -1, tone = 'rgba(30,10,60,0.5)') {
  const o = Object.assign(document.createElement('canvas'), { width: 600, height: 1000 }), g = o.getContext('2d');
  g.drawImage(k, 0, 0); g.globalCompositeOperation = 'source-atop';
  const r = g.createLinearGradient(lightFrom < 0 ? 200 : 400, 0, lightFrom < 0 ? 420 : 180, 0); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, tone); g.fillStyle = r; g.fillRect(0, 0, 600, 1000);
  g.save(); g.beginPath(); g.rect(lightFrom < 0 ? 395 : 0, 0, 205, 1000); g.clip();   // hatch only the far edge of the form
  g.strokeStyle = 'rgba(20,10,30,0.45)'; g.lineWidth = 1.6; for (let i = 0; i < 140; i++) { g.beginPath(); g.moveTo(-200 + i * 8, 200); g.lineTo(i * 8, 1000); g.stroke(); }
  g.restore();
  return o;
}
// 90s shapes: slanted gutters between neighbours (corner nudges, page px, clockwise from top-left)
const NUDGE = [
  [[0, 0], [12, 0], [-12, 4], [0, -10]], [[12, 0], [0, 0], [0, 18], [-12, 4]],
  [[0, -10], [-14, 4], [14, 0], [0, 0]], [[-14, 4], [0, 18], [0, 0], [14, 0]],
  [[0, 0], [14, 0], [-14, 0], [0, 0]], [[14, 0], [0, 0], [0, 0], [-14, 0]],
];

export const PANELS = [
  // 1. OVER-THE-SHOULDER ESTABLISHING at sunset: magenta-to-gold sky, sun flare, Milo huge in the foreground, rim-lit orange
  (c, x, y, w, h, u) => {
    grad(c, x, y, w, h * 0.62, ['#3a1a6a', '#c2407a', '#f28a3a', '#ffd27a']);
    flare(c, x + w * 0.22, y + h * 0.52, 120 * u, u);
    const hz = y + h * 0.6;
    grad(c, x, hz, w, h - (hz - y), ['#5a7a3a', '#2a3a1e']);
    for (let i = 0; i < 5; i++) house2(c, x + w * (0.04 + i * 0.13), hz + 18 * u + i * 6 * u, (70 + i * 12) * u, (52 + i * 9) * u, u, ['#e8b890', '#b0a0c0', '#e0a880', '#c890a8', '#e8c090'][i], ['#6a2a3a', '#3a2a5a', '#5a3a2a', '#3a3a5a', '#6a2a2a'][i], 1, true);
    tree(c, x + w * 0.66, hz + 40 * u, 150 * u, u, '#2e4a22', 3);
    c.beginPath(); c.moveTo(x + w * 0.48, hz + 30 * u); c.lineTo(x + w * 0.58, hz + 30 * u); c.lineTo(x + w * 0.95, y + h); c.lineTo(x + w * 0.05, y + h); c.closePath();
    const rg = c.createLinearGradient(0, hz, 0, y + h); rg.addColorStop(0, '#f0b070'); rg.addColorStop(1, '#6a4a3a'); c.fillStyle = rg; c.fill(); c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.stroke();
    brushGround(c, x + w * 0.1, hz + 40 * u, w * 0.8, y + h, u, 11, 'rgba(40,20,20,0.6)');
    for (let i = 0; i < 7; i++) tuft(c, x + w * (0.02 + i * 0.06), y + h * (0.8 + 0.03 * (i % 3)), 1 + (i % 2), u);
    bush(c, x + w * 0.06, y + h * 1.0, 90 * u, u, '#24381a', 5);
    card90(c, shaded(drawSide(M, { mode: 'stand', expr: 'smile' }), -1), x + w * 0.86, y + h * 1.42, 980 * u, true, 'rgba(255,150,60,0.95)', 22);
    caption90(c, ['ONE FALL EVENING, IN THE SLEEPY', 'TOWN OF HOLLOW CREEK, PAPER BOY', 'MILO PARK FINISHES HIS ROUTE...'], x, y, w, h, u);
    balloon(c, ['LAST HOUSE ON MAPLE', 'STREET... THEN HOME', 'FOR SUPPER!'], x + w * 0.42, y + h * 0.38, x + w * 0.7, y + h * 0.5, u, 'think');
  },
  // 2. MEDIUM ACTION: the throw. Hot afternoon blue, porch in airbrushed shade, motion streaks, chunky FWIP!
  (c, x, y, w, h, u) => {
    grad(c, x, y, w, h * 0.7, ['#2a6ac8', '#7ec0f0', '#d8f0ff']);
    grad(c, x, y + h * 0.66, w, h * 0.34, ['#6ab04a', '#2a5a22']); brushGround(c, x, y + h * 0.68, w, y + h, u, 5, 'rgba(10,40,10,0.6)');
    const px = x + w * 0.58;
    grad(c, px, y + h * 0.14, w * 0.5, h * 0.56, ['#f4ead0', '#c8b48a'], true); c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.strokeRect(px, y + h * 0.14, w * 0.5, h * 0.56);
    c.save(); c.beginPath(); c.rect(px, y + h * 0.14, w * 0.5, h * 0.56); c.clip(); c.lineWidth = 1.5 * u; for (let i = 1; i < 14; i++) { c.beginPath(); c.moveTo(px, y + h * 0.14 + i * h * 0.04); c.lineTo(px + w * 0.5, y + h * 0.14 + i * h * 0.04); c.stroke(); }
    c.fillStyle = 'rgba(20,10,40,0.55)'; c.fillRect(px, y + h * 0.14, w * 0.5, h * 0.1); c.restore();   // the porch roof's shadow band
    grad(c, px + w * 0.13, y + h * 0.34, w * 0.14, h * 0.36, ['#8a3a26', '#3a140c']); c.strokeRect(px + w * 0.13, y + h * 0.34, w * 0.14, h * 0.36);
    c.fillStyle = INK; c.fillRect(px - w * 0.04, y + h * 0.1, w * 0.6, h * 0.05);
    for (const f of [0, 0.36]) { grad(c, px + w * f, y + h * 0.15, 14 * u, h * 0.55, ['#ffffff', '#b8b0a0'], true); c.strokeRect(px + w * f, y + h * 0.15, 14 * u, h * 0.55); }
    for (let i = 0; i < 3; i++) { grad(c, px - w * 0.06 + i * 8 * u, y + h * (0.7 + i * 0.035), w * 0.6, h * 0.035, ['#e0cc9a', '#9a8460']); c.strokeRect(px - w * 0.06 + i * 8 * u, y + h * (0.7 + i * 0.035), w * 0.6, h * 0.035); }
    spot(c, x + w * 0.28, y + h * 0.97, 90 * u, 14 * u);
    card90(c, shaded(drawSide(M, { mode: 'march', phase: 0.1, expr: 'grin' }), -1), x + w * 0.28, y + h * 0.97, 420 * u, false, 'rgba(255,255,255,0.95)', 14);
    speed(c, x + w * 0.4, y + h * 0.52, x + w * 0.6, y + h * 0.55, 5, 10, u);
    c.save(); c.translate(x + w * 0.66, y + h * 0.56); c.rotate(0.55); c.shadowColor = 'rgba(255,255,255,0.9)'; c.shadowBlur = 12 * u; c.fillStyle = '#f4f1ea'; c.fillRect(-40 * u, -15 * u, 80 * u, 30 * u); c.shadowBlur = 0; c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.strokeRect(-40 * u, -15 * u, 80 * u, 30 * u); c.restore();
    bush(c, x + w * 0.02, y + h * 1.02, 110 * u, u, '#24481a', 8); bush(c, x + w * 0.96, y + h * 1.04, 80 * u, u, '#24481a', 13);
    sfx90(c, 'FWIP!', x + w * 0.74, y + h * 0.34, 84 * u, '#fff27a', '#f04a2a', -0.2);
    caption90(c, ['...AND AS ALWAYS, RIGHT', 'ON THE DOORSTEP!'], x, y, w, h, u, 'tl', 0.8);
    balloon(c, ['NAILED IT!'], x + w * 0.2, y + h * 0.32, x + w * 0.27, y + h * 0.46, u);
  },
  // 3. LOW ANGLE: up the lamp post into a blinding flare; violet night, light shafts, moths, black tree silhouettes
  (c, x, y, w, h, u) => {
    grad(c, x, y, w, h, ['#0a0a2a', '#2a1a5a', '#4a2a7a']);
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const a = 1.2 + i * 0.12; c.beginPath(); c.moveTo(x + w * 0.62, y + h * 0.26); c.lineTo(x + w * 0.62 + Math.cos(a) * h * 1.2 - 30 * u, y + h * 0.26 + Math.sin(a) * h * 1.2); c.lineTo(x + w * 0.62 + Math.cos(a) * h * 1.2 + 30 * u, y + h * 0.26 + Math.sin(a) * h * 1.2); c.closePath(); c.fillStyle = 'rgba(255,230,150,0.06)'; c.fill(); } c.restore();
    c.save(); c.translate(x + w * 0.6, y + h * 1.1); c.rotate(0.06);
    c.beginPath(); c.moveTo(-26 * u, 0); c.lineTo(-9 * u, -h * 0.78); c.lineTo(9 * u, -h * 0.78); c.lineTo(26 * u, 0); c.closePath(); c.fillStyle = INK; c.fill();
    c.strokeStyle = 'rgba(255,220,140,0.8)'; c.lineWidth = 3 * u; c.beginPath(); c.moveTo(-20 * u, 0); c.lineTo(-7 * u, -h * 0.76); c.stroke();   // rim light on the post
    c.beginPath(); c.moveTo(-70 * u, -h * 0.78); c.lineTo(70 * u, -h * 0.78); c.lineTo(46 * u, -h * 0.9); c.lineTo(-46 * u, -h * 0.9); c.closePath(); c.fillStyle = '#fff3b0'; c.fill(); c.lineWidth = 5 * u; c.strokeStyle = INK; c.stroke();
    c.fillStyle = INK; c.fillRect(-50 * u, -h * 0.93, 100 * u, 18 * u); c.restore();
    flare(c, x + w * 0.62, y + h * 0.27, 150 * u, u);
    for (let i = 0; i < 7; i++) { const mx = x + w * (0.3 + 0.08 * i + 0.05 * Math.sin(i * 2.1)), my = y + h * (0.1 + 0.12 * Math.abs(Math.cos(i * 1.7))); c.strokeStyle = INK; c.lineWidth = 2.5 * u; c.beginPath(); c.moveTo(mx - 8 * u, my - 5 * u); c.lineTo(mx, my); c.lineTo(mx + 8 * u, my - 5 * u); c.stroke(); }
    tree(c, x - w * 0.02, y + h * 1.0, h * 0.95, u, INK, 21, true);
    sfx90(c, 'BZZT!', x + w * 0.3, y + h * 0.62, 74 * u, '#ffffff', '#ffd23a', -0.25);
    sfx90(c, 'BZZT!', x + w * 0.8, y + h * 0.5, 52 * u, '#ffffff', '#ffd23a', 0.2);
    caption90(c, ['BUT AS HE PASSES THE', 'LAST STREET LAMP', 'ON THE BLOCK...'], x, y, w, h, u, 'tl', 0.9);
  },
  // 4. CLOSE-UP, THE REVEAL: radial burst behind Milo, lamp-gold rim light, heavy hatched shadows, the empty pool
  (c, x, y, w, h, u) => {
    grad(c, x, y, w, h, ['#140c34', '#2a1a5a']);
    c.save(); for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283; c.beginPath(); c.moveTo(x + w * 0.42, y + h * 0.42); c.lineTo(x + w * 0.42 + Math.cos(a) * w, y + h * 0.42 + Math.sin(a) * w); c.lineTo(x + w * 0.42 + Math.cos(a + 0.06) * w, y + h * 0.42 + Math.sin(a + 0.06) * w); c.closePath(); c.fillStyle = i % 2 ? 'rgba(120,80,220,0.35)' : 'rgba(40,20,90,0.2)'; c.fill(); } c.restore();
    for (let i = 0; i < 4; i++) house2(c, x + w * (0.02 + i * 0.25), y + h * 0.56, 110 * u, 80 * u, u, '#2a3458', '#10152a', 1, i === 1, true);
    grad(c, x, y + h * 0.56, w, h * 0.44, ['#2a2440', '#0c0a18']); brushGround(c, x, y + h * 0.58, w, y + h, u, 21, 'rgba(0,0,0,0.6)');
    c.save(); c.beginPath(); c.ellipse(x + w * 0.55, y + h * 0.84, w * 0.5, h * 0.15, 0, 0, 6.283); c.clip(); glow(c, x + w * 0.55, y + h * 0.84, w * 0.5, 'rgba(255,214,110,A)', 0.95); c.restore();
    c.fillStyle = INK; c.fillRect(x + w * 0.06, y, 22 * u, h); c.strokeStyle = 'rgba(255,214,110,0.8)'; c.lineWidth = 3 * u; c.beginPath(); c.moveTo(x + w * 0.06 + 20 * u, y); c.lineTo(x + w * 0.06 + 20 * u, y + h); c.stroke();
    bike(c, x + w * 0.85, y + h * 0.92, 44 * u, u);
    c.save(); c.setLineDash([12 * u, 9 * u]); c.lineWidth = 4 * u; c.strokeStyle = '#fff3b0'; c.beginPath(); c.ellipse(x + w * 0.66, y + h * 0.9, 120 * u, 20 * u, 0, 0, 6.283); c.stroke(); c.restore();
    card90(c, shaded(drawFront(M, { expr: 'shock', look: 1 }), -1, 'rgba(30,10,70,0.6)'), x + w * 0.42, y + h * 1.25, 900 * u, false, 'rgba(255,214,110,0.95)', 26);
    xhatch(c, [[x + w * 0.62, y + h * 0.6], [x + w, y + h * 0.6], [x + w, y + h], [x + w * 0.62, y + h]], u, 9);
    caption90(c, ['...SOMETHING IS MISSING!'], x, y, w, h, u, 'tl', 0.62, ['#7a1020', '#2a0610']);
    balloon(c, ['HUH?! MY... MY SHADOW!', "WHERE'D IT GO?!"], x + w * 0.74, y + h * 0.18, x + w * 0.58, y + h * 0.3, u, 'shout');
  },
  // 5. FOREGROUND FRAME: the Shadow behind the pickets, glowing sick green; moon halo; pickets airbrushed and hatched
  (c, x, y, w, h, u) => {
    grad(c, x, y, w, h, ['#0a0a24', '#24184a', '#3a2a5a']);
    glow(c, x + w * 0.78, y + h * 0.24, 200 * u, 'rgba(220,230,255,A)', 0.5); c.fillStyle = '#f4f0e0'; c.beginPath(); c.arc(x + w * 0.78, y + h * 0.24, 56 * u, 0, 6.283); c.fill();
    tree(c, x + w * 0.9, y + h * 0.7, h * 0.7, u, INK, 30, true); bush(c, x + w * 0.2, y + h * 0.72, 120 * u, u, INK, 31);
    glow(c, x + w * 0.42, y + h * 0.42, 260 * u, 'rgba(150,255,120,A)', 0.35);
    card90(c, drawShadow(), x + w * 0.42, y + h * 0.98, 600 * u, false, 'rgba(170,255,140,0.95)', 30);
    fence(c, x - 20 * u, x + w + 20 * u, y + h * 1.04, h * 0.5, u * 2.1, '#d8d0e8');
    c.save(); c.globalCompositeOperation = 'multiply'; grad(c, x, y + h * 0.5, w, h * 0.55, ['rgba(255,255,255,1)', 'rgba(60,40,110,1)']); c.restore();
    xhatch(c, [[x, y + h * 0.82], [x + w, y + h * 0.82], [x + w, y + h], [x, y + h]], u, 10);
    caption90(c, ['MEANWHILE, FROM BEHIND', 'THE NEAREST FENCE...'], x, y, w, h, u, 'tl', 0.8);
    balloon(c, ['HEE HEE HEE...'], x + w * 0.72, y + h * 0.5, x + w * 0.6, y + h * 0.42, u);
  },
  // 6. DEEP STREET, THE CHASE: the Shadow streaks away with ghost trails and speed lines; Milo foreground, violet rim
  (c, x, y, w, h, u) => {
    grad(c, x, y, w, h * 0.55, ['#0a0a24', '#3a2470']);
    const vx = x + w * 0.72, vy = y + h * 0.5;
    glow(c, vx, vy, 300 * u, 'rgba(180,140,255,A)', 0.45);
    for (let i = 0; i < 3; i++) house2(c, x + w * (0.42 + i * 0.16), vy + 6 * u, (110 - i * 25) * u, (80 - i * 18) * u, u, '#2a3458', '#10152a', -1, i === 0, true);
    c.beginPath(); c.moveTo(vx - 10 * u, vy); c.lineTo(vx + 10 * u, vy); c.lineTo(x + w * 1.2, y + h); c.lineTo(x - w * 0.2, y + h); c.closePath();
    const rg = c.createLinearGradient(0, vy, 0, y + h); rg.addColorStop(0, '#4a3a7a'); rg.addColorStop(1, '#0c0a18'); c.fillStyle = rg; c.fill();
    grad(c, x, vy, w * 0.3, h * 0.5, ['#1e2a2a', '#0a0e0e']); brushGround(c, x, vy + 10 * u, w, y + h, u, 41, 'rgba(0,0,0,0.6)');
    c.strokeStyle = '#ffd86a'; c.lineWidth = 6 * u; c.setLineDash([30 * u, 26 * u]); c.beginPath(); c.moveTo(vx, vy); c.lineTo(x + w * 0.5, y + h); c.stroke(); c.setLineDash([]);
    speed(c, x + w * 0.42, y + h * 0.64, x + w * 0.66, y + h * 0.68, 8, 12, u);
    const sk = drawShadowSide({ phase: 0.3 });
    for (let i = 3; i > 0; i--) { c.save(); c.globalAlpha = 0.18 * (4 - i) / 3; c.filter = 'none'; card(c, sk, x + w * 0.73 - i * 40 * u, y + h * 0.78, 250 * u); c.restore(); }   // ghost trails
    spot(c, x + w * 0.72, y + h * 0.78, 50 * u, 8 * u);
    card90(c, sk, x + w * 0.73, y + h * 0.78, 250 * u, false, 'rgba(170,255,140,0.95)', 20);
    card90(c, shaded(drawFront(M, { expr: 'pained', look: 1 }), 1), x + w * 0.2, y + h * 1.22, 820 * u, false, 'rgba(190,150,255,0.95)', 22);
    sfx90(c, 'ZIP!', x + w * 0.88, y + h * 0.56, 72 * u, '#e8ffa0', '#3ac04a', 0.1);
    caption90(c, ['AND SO BEGINS THE STRANGEST', 'NIGHT IN HOLLOW CREEK HISTORY!'], x, y, w, h, u, 'br', 0.9);
    balloon(c, ['HEY! YOU COME', 'BACK HERE!'], x + w * 0.58, y + h * 0.2, x + w * 0.34, y + h * 0.3, u, 'shout');
  },
];
function card(c, k, x, footY, tall) { const s = tall / 680; c.drawImage(k, x - 300 * s, footY - 975 * s, 600 * s, 1000 * s); }
// one panel at any size (used for the hi-res plane the camera pushes into)
export function drawPanel(i, c, x, y, w, h) { const u = w / panelRect(i).w; panel90(c, x, y, w, h, u, NUDGE[i], PANELS[i]); }
export function drawPage(c, W = PAGE.W, H = PAGE.H) {
  page90(c, W, H);
  PANELS.forEach((_, i) => { const r = panelRect(i); drawPanel(i, c, r.x, r.y, r.w, r.h); });
  c.font = '44px Bangers'; c.fillStyle = '#ffffff'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText('1', W - PAGE.m, H - PAGE.m + 4);
  c.font = 'italic 18px ComicNeue'; c.textAlign = 'left'; c.fillStyle = '#8a80a8'; c.fillText('HOLLOW CREEK TALES #1', PAGE.m, H - PAGE.m + 4);
}
