// HOLLOW CREEK TALES cast, built on the cartoon-audio-short Pen library (toonbase.js = vendor/toon.ts, MIT).
// Every character is drawn on a 600x1000 design canvas, soles at y = 975 (the skill's card contract).
import { Pen, bodyFront, bodySide, INK } from './toonbase.js';

export const CAST = {
  milo:  { name: 'MILO PARK', role: '12. Paper boy. Professional worrier.', o: { jacket: '#f2c230', pants: '#3b5b9a', boots: '#f4f1ea', hat: 'cap', cap: '#d8322b', build: 'kid' }, bag: true },
  june:  { name: 'JUNE RUIZ', role: '12. Has read every horror comic. Believes him.', o: { jacket: '#2f8a7a', pants: '#6b3c8f', boots: '#d8322b', hat: 'hair', hair: '#2b1a14', skin: '#c99067', build: 'kid' }, glasses: true, pony: true },
  grimsby: { name: 'MR. GRIMSBY', role: 'Projectionist of the shut-down Starlight Cinema.', o: { jacket: '#7a2f3a', pants: '#2a2a33', boots: INK, hat: 'hair', hair: '#ece6da', moustache: '#ece6da', skin: '#f3d6bb', buttons: '#e8c45a', build: 'stout' }, bow: true },
};
export const SHADOW = { name: 'THE SHADOW', role: "Milo's own shadow. Mischief first, plans later." };
const VIOLET = '#1c1030';

const cv = () => Object.assign(document.createElement('canvas'), { width: 600, height: 1000 });

// extras the base library doesn't have: Milo's paper bag, June's glasses and ponytail, Grimsby's bow tie
function extras(p, c, side) {
  const g = p.g;
  if (c.bag) {   // canvas satchel on the hip, strap across the chest
    p.stroke([[248, 560], [352, 700]], 9, INK); p.stroke([[248, 560], [352, 700]], 6, '#8a5a34');
    p.poly([[side ? 300 : 330, 680], [side ? 380 : 410, 680], [side ? 376 : 406, 760], [side ? 304 : 334, 760]], '#c9a36a', 6);
    p.poly([[side ? 300 : 330, 680], [side ? 380 : 410, 680], [side ? 372 : 402, 712], [side ? 308 : 338, 712]], '#a8824e', 5);
    g.save(); g.translate(side ? 318 : 348, 668); g.rotate(-0.15); p.poly([[0, 0], [52, -4], [54, 16], [2, 20]], '#f4f1ea', 4); g.restore();   // a rolled newspaper
  }
}
function faceExtras(p, c, hx, hy, side) {
  if (c.glasses) for (const d of side ? [16] : [-30, 26]) p.ell(hx + d, hy, 22, 20, null, 6);
  if (c.glasses && !side) p.stroke([[hx - 8, hy - 2], [hx + 4, hy - 2]], 5);
  if (c.bow) { p.poly([[hx - 30, hy + 150], [hx, hy + 160], [hx - 30, hy + 172]], '#d8322b', 5); p.poly([[hx + 30, hy + 150], [hx, hy + 160], [hx + 30, hy + 172]], '#d8322b', 5); }
}
// head centre on the design canvas: the topmost opaque row of the centre column + the head's half height
function headOf(canvas) {
  const d = canvas.getContext('2d').getImageData(0, 0, 600, 1000).data;
  for (let y = 0; y < 1000; y++) for (let x = 250; x < 350; x += 4) if (d[(y * 600 + x) * 4 + 3] > 200) return [300, y];
  return [300, 300];
}

export function drawFront(c, opts = {}) {
  const k = cv(), p = new Pen(k.getContext('2d'));
  bodyFront(p, c.o, { mode: 'stand', ...opts }); extras(p, c, false);
  const [, top] = headOf(k), g = k.getContext('2d');
  if (c.pony) { g.globalCompositeOperation = 'destination-over'; p.ell(410, top + 150, 34, 82, c.o.hair, 7, 0, 360, -0.5); p.ell(392, top + 88, 16, 14, '#d8322b', 5); g.globalCompositeOperation = 'source-over'; }
  faceExtras(p, c, 300 + (opts.look || 0) * 12, top + 132, false);
  return k;
}
export function drawSide(c, opts = {}) {
  const k = cv(), p = new Pen(k.getContext('2d'));
  bodySide(p, c.o, { mode: 'stand', ...opts }); extras(p, c, true);
  return k;
}
// the Shadow: Milo's silhouette in flat violet-black, white crescent eyes and a grin
export function drawShadow(opts = {}) {
  const k = drawFront(CAST.milo, { expr: 'neutral', ...opts }), g = k.getContext('2d');
  g.globalCompositeOperation = 'source-in'; g.fillStyle = VIOLET; g.fillRect(0, 0, 600, 1000); g.globalCompositeOperation = 'source-over';
  const [, top] = headOf(k), hy = top + 120, p = new Pen(g);
  for (const s of [-1, 1]) { g.save(); g.translate(300 + s * 38, hy); g.rotate(s * -0.25); p.ell(0, 0, 24, 11, '#f4f0ff', 0); g.restore(); }
  g.fillStyle = '#f4f0ff'; g.beginPath(); g.arc(300, hy + 44, 40, 0.15, Math.PI - 0.15); g.lineTo(300, hy + 56); g.closePath(); g.fill();
  return k;
}
