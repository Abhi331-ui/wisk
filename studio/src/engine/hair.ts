// Hair library for the 2D cast. Back layer (under the head) + front layer (fringe/crown cap over it), 2-3 tones of the
// hair colour, a few strand lines, plum ink. `sway` (-1..1) swings loose hair (ponytail, long, braids, curls) about the crown.
import {Blob, INK, Pen, P2, blobPts, mul, SH_FELT, mix, shade, rnd} from './toon';
export type HairStyle = 'crop' | 'sidepart' | 'curly' | 'bun' | 'ponytail' | 'long' | 'braids' | 'bald' | 'wavy' | 'pompadour';

const tone = (c: string) => ({base: c, dark: mul(c, SH_FELT), light: mix(c, '#ffffff', 0.18)});
const strands = (p: Pen, pts: P2[][], col: string, w: number) => pts.forEach((s) => p.stroke(s, w, col));
/** quadratic swing: a point hanging from (ax, ay) at length L, angle from vertical = sway */
const hang = (ax: number, ay: number, L: number, sway: number, k = 1): P2 => [ax + Math.sin(sway * k) * L, ay + Math.cos(sway * k) * L];

export const hairBack = (p: Pen, st: HairStyle, col: string, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, sway: number, facing: number) => {
  const T = tone(col), u = H.a / 50, a = H.a, b = H.b;
  if (st === 'long' || st === 'wavy') {
    // a curtain of hair behind the head down to the shoulders, hem swinging with sway
    const top = hc - b * 0.85, hemY = hc + b * (st === 'long' ? 1.55 : 1.2), sw = sway * 22 * u;
    const pts: P2[] = [[cx - a * 1.05, top + b * 0.4], [cx - a * 1.12 + sw * 0.4, hc + b * 0.5], [cx - a * 1.0 + sw, hemY],
      [cx - a * 0.5 + sw, hemY + 6 * u], [cx + sw * 0.9, hemY - 4 * u], [cx + a * 0.5 + sw, hemY + 6 * u], [cx + a * 1.0 + sw, hemY],
      [cx + a * 1.12 + sw * 0.4, hc + b * 0.5], [cx + a * 1.05, top + b * 0.4], [cx, top - b * 0.25]];
    if (st === 'wavy') for (let i = 2; i < 7; i++) pts[i] = [pts[i][0], pts[i][1] + Math.sin(i * 1.7) * 5 * u];
    p.shadedFill(pts, T.dark, mul(T.dark, [0.8, 0.8, 0.86]), light, a * 1.2, 0.3);
    p.inkRing(pts, ow * 0.85, thick);
    strands(p, [[[cx - a * 0.7, hc + b * 0.2], [cx - a * 0.8 + sw * 0.6, hemY - 10 * u]], [[cx + a * 0.7, hc + b * 0.2], [cx + a * 0.8 + sw * 0.6, hemY - 10 * u]]], INK, 1.3 * u);
  }
  if (st === 'ponytail') {
    const ax = cx - facing * a * 0.2, ay = hc - b * 0.75, s = sway * 0.9 + 0.15;
    const m = hang(ax - a * 0.95, ay + b * 0.2, b * 0.7, s), e = hang(ax - a * 0.95, ay + b * 0.2, b * 1.45, s * 1.6);
    const pts: P2[] = [[ax - a * 0.55, ay], [m[0] - 14 * u, m[1]], [e[0] - 4 * u, e[1]], [e[0] + 6 * u, e[1] - 6 * u], [m[0] + 10 * u, m[1]], [ax - a * 0.3, ay + 10 * u]];
    p.poly(pts, T.base, ow * 0.85);
    p.ell(ax - a * 0.6, ay + 4 * u, 8 * u, 7 * u, '#c0353a', ow * 0.5);
  }
  if (st === 'braids') for (const side of [-1, 1]) {
    const ax = cx + side * a * 0.92, ay = hc + b * 0.15;
    let prev: P2 = [ax, ay];
    for (let i = 0; i < 5; i++) {
      const q = hang(ax, ay, (i + 1) * b * 0.24, sway * (0.6 + i * 0.15));
      p.ell(q[0], q[1], 12 * u, 14 * u, i % 2 ? T.dark : T.base, ow * 0.6); prev = q;
    }
    p.ell(prev[0], prev[1] + 14 * u, 8 * u, 5 * u, '#3f6fb5', ow * 0.5);
  }
  if (st === 'bun') {
    const bx = cx - facing * a * 0.15, by = hc - b * 1.05;
    p.ell(bx, by, a * 0.42, b * 0.36, T.base, ow * 0.85);
    p.arc(bx, by, a * 0.25, b * 0.18, 200, 340, 1.4 * u);
  }
  if (st === 'curly') { // volume behind the head: a ring of curls
    for (let i = 0; i < 14; i++) {
      const t = Math.PI * (1.05 + (i / 13) * 0.9), r = 1.08 + 0.05 * Math.sin(i * 2.3);
      const x = cx + Math.cos(t) * a * r + sway * 4 * u * Math.sin(i), y = hc + Math.sin(t) * b * r * 1.02;
      p.ell(x, y, 17 * u, 16 * u, i % 3 ? T.base : T.dark, ow * 0.7);
    }
  }
};

export const hairFront = (p: Pen, st: HairStyle, col: string, hp: P2[], H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, sway: number, facing: number) => {
  const T = tone(col), u = H.a / 50, a = H.a, b = H.b, crown = hc - b;
  // cap of hair over the crown: the head contour above a cut line, with a styled lower edge
  const cut = crown + b * ({crop: 0.48, sidepart: 0.55, curly: 0.6, bun: 0.55, ponytail: 0.55, long: 0.6, braids: 0.55, bald: 0, wavy: 0.6, pompadour: 0.5} as any)[st];
  if (st === 'bald') { // horseshoe of hair round the sides only
    for (const side of [-1, 1]) {
      const pts: P2[] = [[cx + side * a * 1.02, hc - b * 0.25], [cx + side * a * 1.07, hc + b * 0.05], [cx + side * a * 0.93, hc + b * 0.3], [cx + side * a * 0.86, hc - b * 0.2]];
      p.poly(pts, T.base, ow * 0.6);
    }
    return;
  }
  const arc = hp.filter(([, y]) => y < cut).map(([x, y]) => [cx + (x - cx) * 1.04, hc + (y - hc) * 1.05] as P2);
  if (arc.length < 3) return;
  // order the kept points left→right over the top
  arc.sort((A, B) => Math.atan2(A[1] - hc, A[0] - cx) - Math.atan2(B[1] - hc, B[0] - cx));
  const L = arc[0], R = arc[arc.length - 1], edge: P2[] = [];
  const side = facing || (rnd(H.seed, 30) < 0.5 ? -1 : 1);
  for (let i = 1; i < 10; i++) {
    const t = i / 10, x = R[0] + (L[0] - R[0]) * t;
    let y = R[1] + (L[1] - R[1]) * t;
    if (st === 'sidepart') y += (t < 0.65 ? 10 * u * Math.sin(t / 0.65 * Math.PI) : -6 * u);
    else if (st === 'crop') y += (i % 2 ? 3 * u : -1 * u);
    else if (st === 'curly') y += 6 * u * Math.abs(Math.sin(t * Math.PI * 4));
    else if (st === 'wavy' || st === 'long') y += 8 * u * Math.sin(t * Math.PI) + 3 * u * Math.sin(t * 9);
    else if (st === 'pompadour') y -= 4 * u * Math.sin(t * Math.PI);
    else y += 4 * u * Math.sin(t * Math.PI);
    edge.push([side > 0 ? x : 2 * cx - x, y]);
  }
  const cap: P2[] = [...arc, ...(side > 0 ? edge : edge.reverse())];
  if (st === 'pompadour') cap.push([cx + side * a * 0.2, crown - b * 0.25], [cx - side * a * 0.3, crown - b * 0.15]);
  p.shadedFill(cap, T.base, T.dark, light, a, 0.35);
  // highlight sheen + strand lines that follow the part
  p.clip(cap, () => {
    p.arc(cx - side * a * 0.1, crown + b * 0.28, a * 0.55, b * 0.16, 200, 300, 6 * u, T.light);
    // glossy shine (reference look): a wide soft sheen band + a bright specular streak along the crown
    p.arc(cx - side * a * 0.05, crown + b * 0.42, a * 0.62, b * 0.24, 205, 300, 10 * u, mix(col, '#ffffff', 0.45));
    p.arc(cx - side * a * 0.05, crown + b * 0.42, a * 0.62, b * 0.24, 215, 285, 4 * u, mix(col, '#ffffff', 0.85));
    for (let k = -2; k <= 2; k++) p.stroke([[cx + side * (k * 14 - 10) * u, crown + b * 0.08], [cx + side * (k * 18 + 6) * u + sway * 3 * u, cut - 10 * u]], 1.3 * u, mul(T.dark, [0.8, 0.8, 0.85]));
  });
  p.poly(cap, null, ow * 0.9);
  if (st === 'curly') for (let i = 0; i < 7; i++) {
    const t = Math.PI * (1.15 + (i / 6) * 0.7);
    p.ell(cx + Math.cos(t) * a * 0.8, hc + Math.sin(t) * b * 0.92, 14 * u, 12 * u, i % 2 ? T.base : T.light, ow * 0.55);
  }
  if (st === 'long' || st === 'wavy') for (const sd of [-1, 1]) { // locks falling in front of the shoulders
    const top: P2 = [cx + sd * a * 0.95, hc - b * 0.1], end = hang(top[0], top[1], b * 1.2, sway * 0.8);
    p.poly([[top[0] - sd * 10 * u, top[1]], [top[0] + sd * 12 * u, top[1] + 6 * u], [end[0] + sd * 6 * u, end[1]], [end[0] - sd * 8 * u, end[1] - 6 * u]], T.base, ow * 0.7);
  }
};

export const beardOn = (p: Pen, col: string, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, facing: number) => {
  const u = H.a / 50, a = H.a, b = H.b, fx = cx + 7 * u * facing;
  const pts: P2[] = [[cx - a * 0.92, hc + b * 0.05], [cx - a * 0.75, hc + b * 0.75], [fx, hc + b * 1.22], [cx + a * 0.75, hc + b * 0.75], [cx + a * 0.92, hc + b * 0.05],
    [cx + a * 0.6, hc + b * 0.35], [fx + 16 * u, hc + b * 0.42], [fx, hc + b * 0.5], [fx - 16 * u, hc + b * 0.42], [cx - a * 0.6, hc + b * 0.35]];
  p.shadedFill(pts, col, mul(col, SH_FELT), light, a, 0.3);
  p.inkRing(pts, ow * 0.7, thick);
};

export const glassesOn = (p: Pen, H: Blob, cx: number, hc: number, facing: number) => {
  const u = H.a / 50, fx = cx + 7 * u * facing;
  for (const s of [-1, 1]) p.ell(fx + s * 13 * u, hc, 10 * u, 9 * u, null, 2.4 * u);
  p.stroke([[fx - 3 * u, hc - u], [fx + 3 * u, hc - u]], 2.2 * u);
};
