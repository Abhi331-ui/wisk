// PAGE 1: Milo finishes his route, the last street lamp flickers, his shadow is gone, it grins from behind a fence and runs.
import { PAGE, INK, panelRect, paper, age, panel, caption, balloon, sfx, card, ground, sky, bike, house, lamp, fence, pageNumber } from './comic.js';
import { CAST, drawFront, drawSide, drawShadow, drawShadowSide } from './cast/cast.js';
const M = CAST.milo;

export const PANELS = [
  // 1 (wide): establishing. Dusk on Maple Street, Milo walking his bike past the houses
  (c, x, y, w, h, u) => {
    sky(c, x, y, w, h, '#f0a868', '#f7d9a0');
    c.fillStyle = '#e9b46a'; c.beginPath(); c.arc(x + w * 0.82, y + h * 0.42, 60 * u, 0, 6.283); c.fill();
    c.fillStyle = '#7d9a5a'; c.beginPath(); c.moveTo(x, y + h * 0.62); c.quadraticCurveTo(x + w * 0.4, y + h * 0.5, x + w, y + h * 0.6); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill();
    house(c, x + w * 0.05, y + h * 0.68, 150 * u, 110 * u, u, '#d9c7a0', '#9a4a3a');
    house(c, x + w * 0.32, y + h * 0.66, 170 * u, 120 * u, u, '#a9c4c8', '#5a4a6a');
    house(c, x + w * 0.6, y + h * 0.67, 150 * u, 105 * u, u, '#e3d6b4', '#7a5a3a', false);
    ground(c, x, y, w, h, y + h * 0.76, '#b7a07a'); c.fillStyle = '#8f7a58'; c.fillRect(x, y + h * 0.76, w, 6 * u);
    bike(c, x + w * 0.66, y + h * 0.95, 34 * u, u);
    card(c, drawSide(M, { mode: 'march', phase: 0.25, expr: 'smile' }), x + w * 0.5, y + h * 0.95, 170 * u);
    caption(c, ['ONE FALL EVENING, IN THE SLEEPY', 'TOWN OF HOLLOW CREEK, PAPER BOY', 'MILO PARK FINISHES HIS ROUTE...'], x, y, w, h, u);
    balloon(c, ['LAST HOUSE ON MAPLE', 'STREET... THEN HOME', 'FOR SUPPER!'], x + w * 0.24, y + h * 0.5, x + w * 0.45, y + h * 0.66, u, 'think');
  },
  // 2: the throw. A porch, the paper flying, FWIP!
  (c, x, y, w, h, u) => {
    sky(c, x, y, w, h, '#9cc3e0', '#d5e6ef'); ground(c, x, y, w, h, y + h * 0.78, '#9bb36a');
    c.fillStyle = '#e8d8b0'; c.fillRect(x + w * 0.55, y + h * 0.25, w * 0.5, h * 0.55); c.lineWidth = 4 * u; c.strokeStyle = INK; c.strokeRect(x + w * 0.55, y + h * 0.25, w * 0.5, h * 0.55);
    c.fillStyle = '#7a3a2a'; c.fillRect(x + w * 0.7, y + h * 0.42, w * 0.13, h * 0.38); c.strokeRect(x + w * 0.7, y + h * 0.42, w * 0.13, h * 0.38);
    c.fillStyle = '#c8b48a'; c.fillRect(x + w * 0.52, y + h * 0.76, w * 0.5, h * 0.05); c.strokeRect(x + w * 0.52, y + h * 0.76, w * 0.5, h * 0.05);
    card(c, drawSide(M, { mode: 'stand', expr: 'grin' }), x + w * 0.22, y + h * 0.96, 300 * u);
    c.save(); c.translate(x + w * 0.62, y + h * 0.5); c.rotate(0.4); c.fillStyle = '#f4f1ea'; c.fillRect(-36 * u, -14 * u, 72 * u, 28 * u); c.lineWidth = 3.5 * u; c.strokeRect(-36 * u, -14 * u, 72 * u, 28 * u); c.restore();
    c.lineWidth = 3 * u; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + w * 0.38, y + h * (0.42 + i * 0.04)); c.lineTo(x + w * 0.56, y + h * (0.47 + i * 0.03)); c.stroke(); }
    sfx(c, 'FWIP!', x + w * 0.62, y + h * 0.3, 70 * u, '#f04a2a');
    caption(c, ['...AND AS ALWAYS, RIGHT', 'ON THE DOORSTEP!'], x, y, w, h, u, 'tl', 0.8);
    balloon(c, ['NAILED IT!'], x + w * 0.3, y + h * 0.42, x + w * 0.25, y + h * 0.56, u);
  },
  // 3 (narrow): the last street lamp flickers
  (c, x, y, w, h, u) => {
    sky(c, x, y, w, h, '#2c2a5a', '#5a4a7a');
    const g = c.createRadialGradient(x + w * 0.5, y + h * 0.35, 10, x + w * 0.5, y + h * 0.35, w * 0.6); g.addColorStop(0, 'rgba(255,236,150,0.85)'); g.addColorStop(1, 'rgba(255,236,150,0)'); c.fillStyle = g; c.fillRect(x, y, w, h);
    lamp(c, x + w * 0.5, y + h * 1.05, h * 0.7, u * 1.6);
    c.lineWidth = 4 * u; c.strokeStyle = '#fff0a0'; for (const [a, b] of [[-1, -0.6], [1, -0.6], [-1.2, 0], [1.2, 0]]) { c.beginPath(); c.moveTo(x + w * 0.5 + a * 70 * u, y + h * 0.33 + b * 50 * u); c.lineTo(x + w * 0.5 + a * 110 * u, y + h * 0.33 + b * 80 * u); c.stroke(); }
    sfx(c, 'BZZT!', x + w * 0.28, y + h * 0.6, 64 * u, '#fff27a', -0.2);
    sfx(c, 'BZZT!', x + w * 0.72, y + h * 0.75, 52 * u, '#fff27a', 0.15);
    caption(c, ['BUT AS HE PASSES THE', 'LAST STREET LAMP', 'ON THE BLOCK...'], x, y, w, h, u, 'tl', 0.9);
  },
  // 4 (wide): the missing shadow. Milo in the lamp pool, nothing on the ground behind him
  (c, x, y, w, h, u) => {
    sky(c, x, y, w, h, '#26244e', '#3e3466'); ground(c, x, y, w, h, y + h * 0.7, '#4a4258');
    const g = c.createRadialGradient(x + w * 0.42, y + h * 0.86, 10, x + w * 0.42, y + h * 0.86, w * 0.36); g.addColorStop(0, 'rgba(255,226,140,0.9)'); g.addColorStop(1, 'rgba(255,226,140,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(x + w * 0.42, y + h * 0.86, w * 0.38, h * 0.13, 0, 0, 6.283); c.fill();
    lamp(c, x + w * 0.16, y + h * 0.96, h * 0.82, u * 1.2);
    bike(c, x + w * 0.78, y + h * 0.9, 40 * u, u);
    card(c, drawFront(M, { expr: 'shock', look: -1 }), x + w * 0.45, y + h * 0.92, 340 * u);
    c.setLineDash([10 * u, 10 * u]); c.lineWidth = 3 * u; c.strokeStyle = '#fff6c0'; c.beginPath(); c.ellipse(x + w * 0.58, y + h * 0.93, 90 * u, 16 * u, 0, 0, 6.283); c.stroke(); c.setLineDash([]);   // where the shadow should be
    caption(c, ['...SOMETHING IS MISSING!'], x, y, w, h, u, 'tl');
    balloon(c, ['HUH?! MY... MY SHADOW!', "WHERE'D IT GO?!"], x + w * 0.73, y + h * 0.3, x + w * 0.52, y + h * 0.42, u, 'shout');
  },
  // 5: behind the picket fence, the Shadow peeks and grins
  (c, x, y, w, h, u) => {
    sky(c, x, y, w, h, '#1e1c40', '#34305e');
    c.fillStyle = '#e8ecff'; c.beginPath(); c.arc(x + w * 0.8, y + h * 0.22, 46 * u, 0, 6.283); c.fill();
    card(c, drawShadow(), x + w * 0.42, y + h * 0.98, 460 * u);
    fence(c, x - 10 * u, x + w + 10 * u, y + h, h * 0.42, u);
    caption(c, ['MEANWHILE, FROM BEHIND', 'THE NEAREST FENCE...'], x, y, w, h, u, 'tl', 0.8);
    balloon(c, ['HEE HEE HEE...'], x + w * 0.76, y + h * 0.46, x + w * 0.56, y + h * 0.52, u);
  },
  // 6: the chase begins. The Shadow runs off screen-right, Milo shouts after it
  (c, x, y, w, h, u) => {
    sky(c, x, y, w, h, '#2a2852', '#463c6e'); ground(c, x, y, w, h, y + h * 0.74, '#544a62');
    const gl = c.createRadialGradient(x + w * 0.75, y + h * 0.7, 10, x + w * 0.75, y + h * 0.7, w * 0.4); gl.addColorStop(0, 'rgba(200,190,255,0.55)'); gl.addColorStop(1, 'rgba(200,190,255,0)'); c.fillStyle = gl; c.fillRect(x, y, w, h);
    c.lineWidth = 4 * u; c.strokeStyle = '#c8c0e8'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + w * 0.5, y + h * (0.6 + i * 0.07)); c.lineTo(x + w * 0.62, y + h * (0.6 + i * 0.07)); c.stroke(); }
    c.save(); c.shadowColor = 'rgba(230,225,255,0.9)'; c.shadowBlur = 18 * u; card(c, drawShadowSide({ phase: 0.3 }), x + w * 0.74, y + h * 0.95, 330 * u); c.restore();
    card(c, drawFront(M, { expr: 'pained', look: 1 }), x + w * 0.24, y + h * 0.96, 330 * u);
    sfx(c, 'ZIP!', x + w * 0.88, y + h * 0.5, 60 * u, '#c9f07a', 0.1);
    caption(c, ['AND SO BEGINS THE STRANGEST', 'NIGHT IN HOLLOW CREEK HISTORY!'], x, y, w, h, u, 'br', 0.9);
    balloon(c, ['HEY! YOU COME', 'BACK HERE!'], x + w * 0.32, y + h * 0.22, x + w * 0.27, y + h * 0.42, u, 'shout');
  },
];
// one panel at any size (used for the hi-res plane the camera pushes into)
export function drawPanel(i, c, x, y, w, h) { panel(c, x, y, w, h, w / panelRect(i).w, PANELS[i]); }
export function drawPage(c, W = PAGE.W, H = PAGE.H) {
  paper(c, W, H);
  PANELS.forEach((_, i) => { const r = panelRect(i); drawPanel(i, c, r.x, r.y, r.w, r.h); });
  pageNumber(c, 1, W, H); age(c, W, H);
}
