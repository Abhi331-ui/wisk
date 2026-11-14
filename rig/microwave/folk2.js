// adapter: draws story actors with the bold hand-drawn bean2 characters on the existing card canvas
import { drawBean, MOVES, MW } from "./bean2.js";
import * as CD from "./castdefs.js";
const OUT = new Map([[CD.PERCY, MW.percy], [CD.PERCY_KID, MW.kid], [CD.ENG_1, MW.eng1], [CD.ENG_2, MW.eng2], [CD.ENG_3, MW.eng3], [CD.ENG_W, MW.engw], [CD.BOSS, MW.boss], [CD.KID_2, MW.girl], [CD.MOM, MW.mom]]);
const EXPR = { cheer: "laugh", eureka: "shock", focus: "smile", grief: "sad", neutral: "smile", proud: "smug", smile: "smile", smug: "smug", squint: "smug", shock: "shock", alarm: "shock", glee: "laugh", laugh: "laugh", sad: "sad", grin: "grin" };
const ARM = { hang: [14, -10], flop: [22, -8], hold: [40, -100], point: [92, 0], up: [165, -20], cheer: [165, -20], wave: [155, -40], hip: [30, -125], reach: [70, -20], lift: [120, -60], belly: [30, -110], shrug: [50, -120], cross: [35, -130], thumb: [60, -100] };
const INK = "#2a1620";
export function folk2(p, a) {
  const g = p.g, o = a.opts || {}, sp = OUT.get(a.outfit) || MW.eng1;
  let pose = o.d !== null && o.d !== undefined ? MOVES.walk(o.d) : MOVES.stand();
  pose = { ...pose };
  const sw = Math.sin((o.seed || 1) * 1.3 + (o.d || 0)) * 3;
  if (o.d === null || o.d === undefined) {
    const L = ARM[o.armL] || ARM.hang, R = ARM[o.armR] || ARM.hang;
    pose.shL = L[0] + sw; pose.elL = L[1]; pose.shR = R[0] - sw; pose.elR = R[1];
  }
  const sunDeg = o.light !== undefined ? ((o.light * 180) / Math.PI + 360) % 360 : 215;
  const opt = { expr: EXPR[o.expr] || "smile", sunDeg, view: o.side ? "side" : undefined };
  if (o.blink) opt.expr = "sleep";
  g.save(); g.translate(300, 975); g.scale(1.0, 1.0);
  drawBean(g, sp, pose, opt);
  const h = opt.hands && opt.hands.R;
  if (h && o.prop) prop(g, o.prop, h);
  g.restore();
}
function prop(g, kind, [x, y]) {
  g.save(); g.lineJoin = "round"; g.lineWidth = 7; g.strokeStyle = INK;
  const box = (w, h, c, dx = 0, dy = 0) => { g.fillStyle = c; g.beginPath(); g.roundRect(x - w / 2 + dx, y - h / 2 + dy, w, h, 6); g.fill(); g.stroke(); };
  if (kind === "goo") { box(110, 40, "#6a3a1e"); g.fillStyle = "#c8323a"; g.fillRect(x - 55, y - 20, 44, 40); g.fillStyle = "#5a2e14"; for (const [dx, l] of [[-25, 50], [5, 80], [32, 40]]) { g.beginPath(); g.moveTo(dx + x - 9, y + 18); g.quadraticCurveTo(dx + x, y + 18 + l, dx + x + 9, y + 18); g.fill(); } }
  else if (kind === "kernels") { box(70, 60, "#f2e6c8", 0, -10); g.fillStyle = "#f6d04a"; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x - 20 + (k % 3) * 20, y - 44 + Math.floor(k / 3) * 12, 8, 0, 7); g.fill(); g.lineWidth = 3; g.stroke(); } }
  else if (kind === "wrench") { g.lineWidth = 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 70, y - 70); g.stroke(); g.strokeStyle = "#9aa0a8"; g.lineWidth = 8; g.stroke(); g.beginPath(); g.arc(x + 78, y - 78, 16, 0.3, 5.6); g.lineWidth = 8; g.stroke(); }
  else if (kind === "bag") { box(80, 70, "#8a6a3a", 0, 30); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 5); g.stroke(); }
  else if (kind === "blueprint") { box(120, 80, "#3a6ab8", 30, -20); g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x - 20, y - 45 + k * 16); g.lineTo(x + 80, y - 45 + k * 16); g.stroke(); } }
  else if (kind === "gadget") { box(90, 60, "#5a6070"); g.fillStyle = "#ffb24a"; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
  else if (kind === "stamp") { box(40, 60, "#6a4426", 0, -20); box(70, 22, "#2a2a2a", 0, 18); }
  g.restore();
}
