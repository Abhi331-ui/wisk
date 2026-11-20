// PAGE 1: Milo finishes his route, the last street lamp flickers, his shadow is gone, it grins from behind a fence and runs.
// Silver-age rules (from the reference): flat colour + Ben-Day tints, no gradients; brush-inked ground, foliage clumps, hatched
// shadow sides and spotted blacks; every panel a different shot (over-shoulder, medium, low angle, close-up, foreground
// frame, deep street); figures big and cropped by the borders; captions flush top-left, balloons tight to the text.
import { PAGE, INK, panelRect, paper, age, panel, caption, balloon, sfx, card, bike, lamp, fence, pageNumber,
  benday, flat, hatch, brushGround, tuft, bush, tree, house2, spot, speed } from './comic.js';
import { CAST, drawFront, drawSide, drawShadow, drawShadowSide } from './cast/cast.js';
const M = CAST.milo;
const NIGHT = '#27355f', NIGHT2 = '#1b2546';

export const PANELS = [
  // 1. OVER-THE-SHOULDER ESTABLISHING: huge Milo in the right foreground, back to us, looking down Maple Street at dusk
  (c, x, y, w, h, u) => {
    flat(c, x, y, w, h * 0.62, '#f2b866'); c.fillStyle = benday(c, '#e0883a', '#f2b866', 8, 2.2); c.fillRect(x, y, w, h * 0.3);   // dusk sky, tinted band
    c.fillStyle = '#fbe08a'; c.beginPath(); c.arc(x + w * 0.2, y + h * 0.5, 46 * u, 0, 6.283); c.fill(); c.lineWidth = 3 * u; c.strokeStyle = INK; c.stroke();
    c.lineWidth = 2.5 * u; for (const [a, b, l] of [[0.05, 0.4, 0.12], [0.5, 0.27, 0.15]]) { c.beginPath(); c.moveTo(x + w * a, y + h * b); c.lineTo(x + w * (a + l), y + h * b); c.stroke(); }   // cloud streaks
    const hz = y + h * 0.6;
    flat(c, x, hz, w, h - (hz - y), '#8fb35a');
    for (let i = 0; i < 5; i++) house2(c, x + w * (0.04 + i * 0.13), hz + 18 * u + i * 6 * u, (70 + i * 12) * u, (52 + i * 9) * u, u, ['#e8d8b0', '#b9d0d0', '#e3c9a0', '#d8c0c8', '#e8e0c0'][i], ['#9a4a3a', '#5a4a6a', '#7a5a3a', '#4a5a7a', '#8a3a3a'][i], 1, i % 2 === 0);
    tree(c, x + w * 0.66, hz + 40 * u, 150 * u, u, '#5f8f3e', 3);
    c.fillStyle = '#c9a46a'; c.beginPath(); c.moveTo(x + w * 0.48, hz + 30 * u); c.lineTo(x + w * 0.58, hz + 30 * u); c.lineTo(x + w * 0.95, y + h); c.lineTo(x + w * 0.05, y + h); c.closePath(); c.fill(); c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.stroke();   // the street running away
    brushGround(c, x + w * 0.1, hz + 40 * u, w * 0.8, y + h, u, 11, '#8a6a3a');
    for (let i = 0; i < 7; i++) tuft(c, x + w * (0.02 + i * 0.06), y + h * (0.8 + 0.03 * (i % 3)), 1 + (i % 2), u);
    bush(c, x + w * 0.06, y + h * 1.0, 90 * u, u, '#4f7f34', 5);
    card(c, drawSide(M, { mode: 'stand', expr: 'smile' }), x + w * 0.86, y + h * 1.42, 980 * u, true);   // cropped at the chest by the border
    caption(c, ['ONE FALL EVENING, IN THE SLEEPY', 'TOWN OF HOLLOW CREEK, PAPER BOY', 'MILO PARK FINISHES HIS ROUTE...'], x, y, w, h, u);
    balloon(c, ['LAST HOUSE ON MAPLE', 'STREET... THEN HOME', 'FOR SUPPER!'], x + w * 0.42, y + h * 0.36, x + w * 0.7, y + h * 0.5, u, 'think');
  },
  // 2. MEDIUM, ACTION: Milo flings the paper across the lawn at a porch drawn in perspective; foreground bushes frame it
  (c, x, y, w, h, u) => {
    flat(c, x, y, w, h, '#a9d4ea'); c.fillStyle = benday(c, '#7fb8dc', '#a9d4ea', 8, 2); c.fillRect(x, y, w, h * 0.25);
    flat(c, x, y + h * 0.66, w, h * 0.34, '#8fb35a'); brushGround(c, x, y + h * 0.68, w, y + h, u, 5, '#4f7f34');
    const px = x + w * 0.58;   // porch: front face, posts, steps, door, a dark open doorway shadow
    c.fillStyle = '#efe2bf'; c.fillRect(px, y + h * 0.14, w * 0.5, h * 0.56); c.lineWidth = 3.5 * u; c.strokeStyle = INK; c.strokeRect(px, y + h * 0.14, w * 0.5, h * 0.56);
    c.save(); c.beginPath(); c.rect(px, y + h * 0.14, w * 0.5, h * 0.56); c.clip(); c.lineWidth = 1.5 * u; for (let i = 1; i < 14; i++) { c.beginPath(); c.moveTo(px, y + h * 0.14 + i * h * 0.04); c.lineTo(px + w * 0.5, y + h * 0.14 + i * h * 0.04); c.stroke(); } c.restore();   // clapboards
    c.fillStyle = '#7a3a26'; c.fillRect(px + w * 0.13, y + h * 0.34, w * 0.14, h * 0.36); c.strokeRect(px + w * 0.13, y + h * 0.34, w * 0.14, h * 0.36); c.fillStyle = '#ffd04a'; c.beginPath(); c.arc(px + w * 0.24, y + h * 0.53, 4 * u, 0, 6.283); c.fill();
    c.fillStyle = INK; c.fillRect(px - w * 0.04, y + h * 0.1, w * 0.6, h * 0.05);   // porch roof edge, black
    for (const f of [0, 0.36]) { c.fillStyle = '#f8f2e0'; c.fillRect(px + w * f, y + h * 0.15, 14 * u, h * 0.55); c.strokeRect(px + w * f, y + h * 0.15, 14 * u, h * 0.55); }
    for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? '#bfa880' : '#d8c49a'; c.fillRect(px - w * 0.06 + i * 8 * u, y + h * (0.7 + i * 0.035), w * 0.6, h * 0.035); c.strokeRect(px - w * 0.06 + i * 8 * u, y + h * (0.7 + i * 0.035), w * 0.6, h * 0.035); }
    spot(c, x + w * 0.28, y + h * 0.97, 90 * u, 14 * u);
    card(c, drawSide(M, { mode: 'march', phase: 0.1, expr: 'grin' }), x + w * 0.28, y + h * 0.97, 420 * u);
    c.save(); c.translate(x + w * 0.66, y + h * 0.56); c.rotate(0.55); c.fillStyle = '#f4f1ea'; c.fillRect(-40 * u, -15 * u, 80 * u, 30 * u); c.lineWidth = 3.5 * u; c.strokeRect(-40 * u, -15 * u, 80 * u, 30 * u); c.lineWidth = 1.5 * u; c.beginPath(); c.moveTo(-30 * u, 0); c.lineTo(30 * u, 0); c.stroke(); c.restore();
    c.lineWidth = 3 * u; c.strokeStyle = INK; c.setLineDash([16 * u, 10 * u]); c.beginPath(); c.moveTo(x + w * 0.4, y + h * 0.5); c.quadraticCurveTo(x + w * 0.52, y + h * 0.38, x + w * 0.62, y + h * 0.52); c.stroke(); c.setLineDash([]);   // motion arc
    bush(c, x + w * 0.02, y + h * 1.02, 110 * u, u, '#4f7f34', 8); bush(c, x + w * 0.96, y + h * 1.04, 80 * u, u, '#4f7f34', 13);
    sfx(c, 'FWIP!', x + w * 0.74, y + h * 0.36, 74 * u, '#f04a2a', -0.2);
    caption(c, ['...AND AS ALWAYS, RIGHT', 'ON THE DOORSTEP!'], x, y, w, h, u, 'tl', 0.8);
    balloon(c, ['NAILED IT!'], x + w * 0.2, y + h * 0.3, x + w * 0.27, y + h * 0.46, u);
  },
  // 3. LOW ANGLE: looking straight up the lamp post at night; moths, flicker strokes, black tree silhouettes framing
  (c, x, y, w, h, u) => {
    flat(c, x, y, w, h, NIGHT); c.fillStyle = benday(c, NIGHT2, NIGHT, 7, 2.4); c.fillRect(x, y, w, h);
    c.fillStyle = benday(c, '#fff3b0', NIGHT, 7, 2.6); c.beginPath(); c.arc(x + w * 0.62, y + h * 0.24, w * 0.42, 0, 6.283); c.fill();   // the glow, as a Ben-Day halo
    c.save(); c.translate(x + w * 0.6, y + h * 1.1); c.rotate(0.06);   // the post converging upward
    c.beginPath(); c.moveTo(-26 * u, 0); c.lineTo(-9 * u, -h * 0.78); c.lineTo(9 * u, -h * 0.78); c.lineTo(26 * u, 0); c.closePath(); c.fillStyle = INK; c.fill();
    c.beginPath(); c.moveTo(-70 * u, -h * 0.78); c.lineTo(70 * u, -h * 0.78); c.lineTo(46 * u, -h * 0.9); c.lineTo(-46 * u, -h * 0.9); c.closePath(); c.fillStyle = '#fff3b0'; c.fill(); c.lineWidth = 5 * u; c.strokeStyle = INK; c.stroke();
    c.fillStyle = INK; c.fillRect(-50 * u, -h * 0.93, 100 * u, 18 * u); c.restore();
    c.strokeStyle = '#fff3b0'; c.lineWidth = 5 * u; for (const [a, l] of [[-2.6, 1], [-2.2, 0.8], [-0.5, 1], [-0.9, 0.8], [-1.57, 0.7]]) { const cx = x + w * 0.62, cy = y + h * 0.24; c.beginPath(); c.moveTo(cx + Math.cos(a) * 90 * u, cy + Math.sin(a) * 60 * u); c.lineTo(cx + Math.cos(a) * (90 + 50 * l) * u, cy + Math.sin(a) * (60 + 40 * l) * u); c.stroke(); }
    for (let i = 0; i < 6; i++) { const mx = x + w * (0.35 + 0.5 * Math.sin(i * 2.1) * 0.5 + 0.25), my = y + h * (0.12 + 0.1 * Math.cos(i * 1.7)); c.strokeStyle = INK; c.lineWidth = 2.5 * u; c.beginPath(); c.moveTo(mx - 8 * u, my - 5 * u); c.lineTo(mx, my); c.lineTo(mx + 8 * u, my - 5 * u); c.stroke(); }   // moths
    tree(c, x - w * 0.02, y + h * 1.0, h * 0.95, u, INK, 21, true);
    sfx(c, 'BZZT!', x + w * 0.3, y + h * 0.6, 66 * u, '#fff27a', -0.25);
    sfx(c, 'BZZT!', x + w * 0.8, y + h * 0.48, 48 * u, '#fff27a', 0.2);
    caption(c, ['BUT AS HE PASSES THE', 'LAST STREET LAMP', 'ON THE BLOCK...'], x, y, w, h, u, 'tl', 0.9);
  },
  // 4. CLOSE-UP, THE REVEAL: Milo big, cropped at the knees, staring down; the lamp pool behind him is empty
  (c, x, y, w, h, u) => {
    flat(c, x, y, w, h, NIGHT); c.fillStyle = benday(c, NIGHT2, NIGHT, 7, 2.4); c.fillRect(x, y, w, h * 0.55);
    for (let i = 0; i < 4; i++) house2(c, x + w * (0.02 + i * 0.25), y + h * 0.56, 110 * u, 80 * u, u, '#2a3458', '#10152a', 1, i === 1, true);
    flat(c, x, y + h * 0.56, w, h * 0.44, '#3a3a5a'); brushGround(c, x, y + h * 0.58, w, y + h, u, 21, '#20203a');
    c.fillStyle = '#f2df90'; c.beginPath(); c.ellipse(x + w * 0.55, y + h * 0.84, w * 0.5, h * 0.15, 0, 0, 6.283); c.fill(); c.lineWidth = 3 * u; c.strokeStyle = INK; c.stroke();   // the lamp pool, flat
    c.fillStyle = INK; c.fillRect(x + w * 0.06, y, 22 * u, h);   // the lamp post, foreground left
    bike(c, x + w * 0.85, y + h * 0.92, 44 * u, u);
    c.save(); c.setLineDash([12 * u, 9 * u]); c.lineWidth = 4 * u; c.strokeStyle = INK; c.beginPath(); c.ellipse(x + w * 0.66, y + h * 0.9, 120 * u, 20 * u, 0, 0, 6.283); c.stroke(); c.restore();   // where his shadow should be
    card(c, drawFront(M, { expr: 'shock', look: 1 }), x + w * 0.42, y + h * 1.25, 900 * u);
    for (let i = 0; i < 3; i++) { c.lineWidth = 4 * u; c.strokeStyle = INK; c.beginPath(); c.moveTo(x + w * (0.22 - i * 0.03), y + h * (0.12 + i * 0.05)); c.lineTo(x + w * (0.18 - i * 0.03), y + h * (0.08 + i * 0.05)); c.stroke(); }   // shock ticks
    caption(c, ['...SOMETHING IS MISSING!'], x, y, w, h, u, 'tl');
    balloon(c, ['HUH?! MY... MY SHADOW!', "WHERE'D IT GO?!"], x + w * 0.74, y + h * 0.18, x + w * 0.58, y + h * 0.3, u, 'shout');
  },
  // 5. FOREGROUND FRAME: big pickets cut the panel; between them, close, the Shadow's grin under a flat moon
  (c, x, y, w, h, u) => {
    flat(c, x, y, w, h, NIGHT); c.fillStyle = benday(c, NIGHT2, NIGHT, 7, 2.4); c.fillRect(x, y, w, h);
    c.fillStyle = '#f4f0d0'; c.beginPath(); c.arc(x + w * 0.78, y + h * 0.24, 56 * u, 0, 6.283); c.fill(); c.lineWidth = 3 * u; c.strokeStyle = INK; c.stroke();
    tree(c, x + w * 0.9, y + h * 0.7, h * 0.7, u, INK, 30, true); bush(c, x + w * 0.2, y + h * 0.72, 120 * u, u, INK, 31);
    card(c, drawShadow(), x + w * 0.42, y + h * 0.98, 600 * u);
    fence(c, x - 20 * u, x + w + 20 * u, y + h * 1.04, h * 0.5, u * 2.1, '#efe4c8');
    caption(c, ['MEANWHILE, FROM BEHIND', 'THE NEAREST FENCE...'], x, y, w, h, u, 'tl', 0.8);
    balloon(c, ['HEE HEE HEE...'], x + w * 0.72, y + h * 0.5, x + w * 0.6, y + h * 0.42, u);
  },
  // 6. DEEP STREET, THE CHASE: Milo shouting in the left foreground, the Shadow racing away down the street with speed lines
  (c, x, y, w, h, u) => {
    flat(c, x, y, w, h, NIGHT); c.fillStyle = benday(c, NIGHT2, NIGHT, 7, 2.4); c.fillRect(x, y, w, h * 0.5);
    const vx = x + w * 0.72, vy = y + h * 0.5;   // vanishing point
    for (let i = 0; i < 3; i++) house2(c, x + w * (0.42 + i * 0.16), vy + 6 * u, (110 - i * 25) * u, (80 - i * 18) * u, u, '#2a3458', '#10152a', -1, i === 0, true);
    c.fillStyle = '#3a3a5a'; c.beginPath(); c.moveTo(vx - 10 * u, vy); c.lineTo(vx + 10 * u, vy); c.lineTo(x + w * 1.2, y + h); c.lineTo(x - w * 0.2, y + h); c.closePath(); c.fill();
    flat(c, x, vy, w * 0.3, h * 0.5, '#2c3c3a'); brushGround(c, x, vy + 10 * u, w, y + h, u, 41, '#20203a');
    c.strokeStyle = '#f2df90'; c.lineWidth = 6 * u; c.setLineDash([30 * u, 26 * u]); c.beginPath(); c.moveTo(vx, vy); c.lineTo(x + w * 0.5, y + h); c.stroke(); c.setLineDash([]);   // centre line
    speed(c, x + w * 0.46, y + h * 0.66, x + w * 0.66, y + h * 0.68, 6, 14, u);
    spot(c, x + w * 0.72, y + h * 0.78, 50 * u, 8 * u);
    card(c, drawShadowSide({ phase: 0.3 }), x + w * 0.73, y + h * 0.78, 250 * u);
    card(c, drawFront(M, { expr: 'pained', look: 1 }), x + w * 0.2, y + h * 1.22, 820 * u);
    sfx(c, 'ZIP!', x + w * 0.88, y + h * 0.56, 62 * u, '#c9f07a', 0.1);
    caption(c, ['AND SO BEGINS THE STRANGEST', 'NIGHT IN HOLLOW CREEK HISTORY!'], x, y, w, h, u, 'br', 0.9);
    balloon(c, ['HEY! YOU COME', 'BACK HERE!'], x + w * 0.58, y + h * 0.2, x + w * 0.34, y + h * 0.3, u, 'shout');
  },
];
// one panel at any size (used for the hi-res plane the camera pushes into)
export function drawPanel(i, c, x, y, w, h) { panel(c, x, y, w, h, w / panelRect(i).w, PANELS[i]); }
export function drawPage(c, W = PAGE.W, H = PAGE.H) {
  paper(c, W, H);
  PANELS.forEach((_, i) => { const r = panelRect(i); drawPanel(i, c, r.x, r.y, r.w, r.h); });
  pageNumber(c, 1, W, H); age(c, W, H);
}
