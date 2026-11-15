// adapter: story actors drawn with the bold hand-drawn bean2 characters, plus bunny and horse cards
import { drawBean, drawBunny, MOVES } from "./bean2.js";
const INK = "#2a1620";
const ARM = { hang: [14, -10], hold: [40, -100], point: [92, 0], up: [165, -20], cheer: [165, -20], wave: [150, -45], hip: [30, -125], shrug: [50, -120], scared: [130, -100], reach: [70, -20] };
export function folk18(p, a) {
  const g = p.g, o = a.opts || {}, sp = a.outfit, t = o.t || 0;
  let pose = { ...(o.run != null ? MOVES.run(o.run) : o.d != null ? MOVES.walk(o.d) : MOVES.stand()) };
  if (o.run == null && o.d == null) { const sw = Math.sin(t * 6.283) * 3, L = ARM[o.armL] || ARM.hang, R = ARM[o.armR] || ARM.hang;
    pose.shL = L[0] + sw + (o.armL === "wave" ? 16 * Math.cos(t * 12.566) : 0); pose.elL = L[1]; pose.shR = R[0] - sw + (o.armR === "wave" ? 16 * Math.sin(t * 12.566) : 0); pose.elR = R[1]; pose.lean = (o.tilt || 0) * 0.6; }
  else if (o.carry) { pose.shR = 40; pose.elR = -100; pose.shL = 40; pose.elL = -100; }
  const sunDeg = o.light !== undefined ? ((o.light * 180) / Math.PI + 360) % 360 : 215;
  let expr = o.expr || "smile"; if (o.blink && expr !== "shock" && expr !== "laugh") expr = "sleep";
  const opt = { expr, sunDeg, view: o.side ? "side" : undefined, look: o.look || 0, prop: o.prop === "musket" ? "musket" : null };
  const oc = (folk18.oc && folk18.oc.width === g.canvas.width && folk18.oc.height === g.canvas.height) ? folk18.oc : (folk18.oc = Object.assign(document.createElement("canvas"), { width: g.canvas.width, height: g.canvas.height })); const og = oc.getContext("2d"); og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, oc.width, oc.height); og.setTransform(g.getTransform());
  og.save(); og.translate(300, 975); drawBean(og, sp, pose, opt);
  const h = opt.hands && opt.hands.R; if (h && o.prop && o.prop !== "musket") prop(og, o.prop, h);
  og.restore();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.shadowBlur = 20; g.shadowColor = "rgba(255,238,200,0.55)"; g.drawImage(oc, 0, 0);
  g.globalCompositeOperation = "source-atop"; g.shadowBlur = 0; const W = g.canvas.width, H = g.canvas.height, gl = g.createRadialGradient(W * 0.25, H * 0.3, 0, W * 0.25, H * 0.3, W * 0.9); gl.addColorStop(0, "rgba(255,240,205,0.16)"); gl.addColorStop(0.55, "rgba(255,236,200,0.05)"); gl.addColorStop(1, "rgba(255,236,200,0)"); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.restore();
}
function prop(g, kind, [x, y]) {
  g.save(); g.lineJoin = "round"; g.lineCap = "round"; g.lineWidth = 7; g.strokeStyle = INK;
  const box = (w, h, c, dx = 0, dy = 0) => { g.fillStyle = c; g.beginPath(); g.roundRect(x - w / 2 + dx, y - h / 2 + dy, w, h, 6); g.fill(); g.stroke(); };
  const lines = (n, x0, y0, w, dy) => { g.save(); g.strokeStyle = "rgba(40,30,30,0.5)"; g.lineWidth = 3; for (let k = 0; k < n; k++) { g.beginPath(); g.moveTo(x0, y0 + k * dy); g.lineTo(x0 + w - (k % 3) * 14, y0 + k * dy); g.stroke(); } g.restore(); };
  if (kind === "treaty") { box(150, 190, "#f4ecd6", 40, -70); g.fillStyle = "#2a2020"; g.font = "bold 24px Georgia"; g.textAlign = "center"; g.fillText("TREATY", x + 40, y - 130); lines(6, x - 20, y - 108, 120, 16); g.fillStyle = "#c0303a"; g.beginPath(); g.arc(x + 84, y + 2, 16, 0, 7); g.fill(); g.stroke(); }
  else if (kind === "list") { box(120, 160, "#f4ecd6", 30, -50); for (let k = 0; k < 5; k++) { g.strokeStyle = "#2f7a3a"; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 18, y - 106 + k * 24); g.lineTo(x - 10, y - 98 + k * 24); g.lineTo(x + 2, y - 114 + k * 24); g.stroke(); } lines(5, x + 12, y - 106, 66, 24); }
  else if (kind === "cage") { box(170, 120, "#b88a54", 30, 20); g.fillStyle = "#3a2a1e"; g.fillRect(x - 44, y - 26, 150, 92); const bx = x + 30, by = y + 62; g.save(); g.translate(bx - 20, by); g.scale(0.26, 0.26); drawBunny(g, "#ffffff", {}); g.restore(); g.strokeStyle = INK; g.lineWidth = 5; for (let k = 0; k <= 6; k++) { g.beginPath(); g.moveTo(x - 44 + k * 25, y - 26); g.lineTo(x - 44 + k * 25, y + 66); g.stroke(); } }
  else if (kind === "tea") { g.fillStyle = "#f6f2ea"; g.beginPath(); g.ellipse(x + 8, y - 4, 44, 10, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - 22, y - 50); g.lineTo(x + 38, y - 50); g.lineTo(x + 30, y - 8); g.lineTo(x - 14, y - 8); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(x + 42, y - 32, 12, -1.4, 1.4); g.stroke(); g.fillStyle = "#8a5a2a"; g.beginPath(); g.ellipse(x + 8, y - 48, 28, 5, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 5; for (const d of [-8, 10, 26]) { g.beginPath(); g.moveTo(x + d, y - 60); g.quadraticCurveTo(x + d - 10, y - 80, x + d, y - 100); g.stroke(); } }
  else if (kind === "letter") { box(130, 170, "#f4ecd6", 40, -60); lines(7, x - 12, y - 128, 104, 18); g.fillStyle = "#c0303a"; g.beginPath(); g.arc(x + 86, y + 8, 14, 0, 7); g.fill(); g.stroke(); }
  else if (kind === "carrot") { g.fillStyle = "#f08a2a"; g.beginPath(); g.moveTo(x - 16, y - 40); g.lineTo(x + 18, y - 40); g.lineTo(x + 2, y + 70); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#4f9a3a"; for (const d of [-16, 0, 16]) { g.beginPath(); g.ellipse(x + d, y - 62, 9, 26, d * 0.02, 0, 7); g.fill(); g.stroke(); } }
  g.restore();
}
export function bunnyCard(p, _o, opts = {}) { const g = p.g; g.save(); g.translate(270, 975); g.scale(1.75, 1.75); drawBunny(g, opts.col || "#ffffff", { sunDeg: 215 }); g.restore(); }
export function horseCard(p, a) {
  const g = p.g, ph = (a.opts || {}).gal, body = "#8a5a34", dk = "#5e3c20"; g.save(); g.translate(270, 975); g.lineJoin = "round"; g.lineCap = "round";
  g.translate(0, ph == null ? 0 : -Math.abs(Math.sin(ph * 6.283)) * 26);
  const leg = (x, sw, far) => { const a2 = ph == null ? 0 : Math.sin(ph * 6.283 + sw) * 0.7; g.save(); g.translate(x, -330); g.rotate(a2); g.fillStyle = far ? dk : body; g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.roundRect(-20, 0, 40, 322, 16); g.fill(); g.stroke(); g.fillStyle = "#1a1416"; g.beginPath(); g.roundRect(-23, 288, 46, 36, 8); g.fill(); g.restore(); };
  leg(-140, 0.6, true); leg(110, 3.7, true);
  g.strokeStyle = "#2a1a12"; g.lineWidth = 34; g.beginPath(); g.moveTo(-215, -470); g.quadraticCurveTo(-268, -400, -250, -250); g.stroke();
  g.fillStyle = body; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.ellipse(-30, -430, 205, 118, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(90, -520); g.lineTo(150, -700); g.quadraticCurveTo(200, -760, 262, -700); g.lineTo(290, -640); g.quadraticCurveTo(280, -600, 230, -615); g.lineTo(190, -560); g.lineTo(170, -420); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#2a1a12"; g.beginPath(); g.moveTo(140, -710); g.quadraticCurveTo(80, -640, 84, -520); g.lineTo(118, -530); g.quadraticCurveTo(120, -640, 168, -712); g.closePath(); g.fill();
  g.fillStyle = INK; g.beginPath(); g.arc(232, -680, 9, 0, 7); g.fill(); g.fillStyle = body; g.beginPath(); g.moveTo(168, -735); g.lineTo(182, -790); g.lineTo(204, -742); g.closePath(); g.fill(); g.stroke();
  leg(-170, 2.2, false); leg(80, 5.3, false);
  g.restore();
}
