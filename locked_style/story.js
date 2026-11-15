// Staging for "The Shortest War" (Zanzibar, 1896). Shot boundaries come from the voiceover (timing.js).
import { clamp, lin, smooth, smoother, easeOut, easeIn, easeInOut, back, spring, lerp, lerp3, add3, camKeys, kick, blinkAt, idle, q } from "./motion.js";
import { NORTON, NORTON_CIV, EDITOR, CONGRESS, TOWNS } from "./castdefs.js";
import { PH, WD, END } from "./timing.js";
import { CAST17 } from "./bean2.js";

export const FPS = 30, TOTAL = END, CROWD_K = 10;
const PI = Math.PI;
const hsh = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
export const TOWN = { trees: [] };
const DAY = { az: 350, el: 36, sun: [1.4, 1.25, 1.02], amb: [0.44, 0.47, 0.56], gnd: [0.34, 0.36, 0.26], top: "#3a82de", mid: "#98c6f0", hor: "#e4eff4", fog: [420, 3800], sat: 1.14, lift: [0.02, 0.025, 0.04], gain: [1.03, 1.0, 0.95], card: [1.03, 1.0, 0.95], cloud: [1, 1, 1], disc: 0.004, glow: 0.34, warm: [1, 0.95, 0.84], key: 0.16, bloom: 0.62, bth: 0.72, ao: 0.6 };
const LP = { e: DAY, w: { ...DAY, az: 170 }, golden: DAY, day: DAY };

// ---------------- helpers ----------------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dist = (a, b) => Math.hypot(...sub(a, b));
const camRight = (c) => norm(cross(sub(c.look, c.pos), [0, 1, 0]));
const camUp = (c) => norm(cross(camRight(c), sub(c.look, c.pos)));
const lightAng = (c, L) => {
  const d = [Math.cos(L.el * Math.PI / 180) * Math.cos(L.az * Math.PI / 180), Math.sin(L.el * Math.PI / 180), Math.cos(L.el * Math.PI / 180) * Math.sin(L.az * Math.PI / 180)];
  const r = camRight(c), u = camUp(c);
  return q(Math.atan2(-Math.max(0.25, d[0] * u[0] + d[1] * u[1] + d[2] * u[2]), d[0] * r[0] + d[1] * r[1] + d[2] * r[2]), 0.35);
};
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], add2 = (a, b) => [a[0] + b[0], a[1] + b[1]], dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const stand = (id, outfit, pos, f, o = {}) => {
  const { chop, expr = "smile", arms = ["hang", "hang"], seed = 1, light = -2.1, scale = 1, extra = {}, y = 0, lift = 0, look = 0, tilt = 0, headTilt = 0, prop = null, outfitKey = "" } = o;
  const i = idle(f, seed);
  return { id, kind: "folk", outfit, outfitKey, pos, y, lift, scale, sy: 1 + 0.01 * Math.sin(f * 0.11 + seed * 1.7), blob: y === 0,
    opts: { expr, armL: arms[0], armR: arms[1], prop, tilt: q(i.tilt * 0.6 + tilt, 0.5), headTilt: q(i.head * 0.6 + headTilt, 1), look: q(look, 0.3), blink: blinkAt(f, seed), seed, light, chop, t: q((f / 20) % 1, 0.1), ...extra } };
};
const pop = (f, f0, n = 8) => (f < f0 ? 0 : f >= f0 + n ? 1 : back((f - f0) / n));
const folk = (id, o, pos, f, cam, L, x = {}) => stand(id, o, pos, f, { light: lightAng(cam, L), ...x });
// a 2D character that behaves like 3D: it turns to a side view when it faces across the camera, mirrors by direction, and turns its head
const act = (id, sp, pos, f, cam, L, o = {}) => {
  const fw = norm([cam.look[0] - cam.pos[0], 0, cam.look[2] - cam.pos[2]]), rt = [-fw[2], fw[0]];
  const face = o.face || [-fw[0], -fw[2]], fl = Math.hypot(face[0], face[1]) || 1, dr = (face[0] * rt[0] + face[1] * rt[1]) / fl, side = Math.abs(dr) > 0.6;
  const a = stand(id, sp, pos, f, { light: lightAng(cam, L), ...o, outfitKey: sp.name, look: side ? 0 : dr * 0.9, extra: { side, d: o.d ?? null, run: o.run ?? null, carry: !!o.carry } });
  a.mirror = side && dr < 0; return a;
};
const K2 = (f, a, b, p0, l0, v0, p1, l1, v1, ease = smoother) => { const k = 1.9, P1 = p1.map((v, i) => p0[i] + (v - p0[i]) * k), L1 = l1.map((v, i) => l0[i] + (v - l0[i]) * k); return camKeys([{ f: a, pos: p0, look: l0, fov: v0 }, { f: b, pos: P1, look: L1, fov: v1 + (v1 - v0) * (k - 1), ease: (t) => t }], f); };

// ---------------- cast and places ----------------
const SUL = CAST17.sultan, SUL2 = { ...CAST17.sultan, name: "Sultan2", colors: { ...CAST17.sultan.colors, sash: "#2a4aa8", hair: "#3a2a20", gem: "#c8202a" } }, GUA = CAST17.guard, ADM = CAST17.admiral, SAI = CAST17.sailor, ENV = CAST17.envoy;
TOWN.ships = [[-110, 170, 70], [-30, 150, 80], [50, 165, 70], [130, 185, 65], [200, 210, 60]]; TOWN.yacht = [40, 70, 40];
const DECK = 2.7, ADMP = [-12, 146], LPZ = { ...DAY, az: 60, el: 40 }; LP.z = LPZ;
const F9 = PH[16], CR = PH[17], YS = PH[18], FLAG = PH[21];
const WS = (f) => ({ damage: f < PH[1] ? 0.45 : smooth(lin(CR - 10, PH[19], f)) * 0.75 + (f >= PH[1] && f < F9 ? 0 : 0), gate: f < PH[1] ? 1 : smooth(lin(PH[10], PH[10] + 20, f)), flag: f < PH[4] ? 1 : f < PH[5] ? 0.55 : f < FLAG ? 1 : 1 - smooth(lin(FLAG, FLAG + 24, f)), yacht: smooth(lin(YS + 6, PH[19] - 4, f)), aim: f >= F9 && f < PH[22], t: f });
const hitsAt = (f) => (f < PH[1] ? f >= 40 : f >= F9 + 8 && f < PH[22]);
const GUNS = TOWN.ships.flatMap(([x, z, len]) => [[x + len * 0.36, 3.6, z - len * 0.08 - 0.6], [x - len * 0.42, 3.6, z - len * 0.08 - 0.6]]);
const firing = (f, out) => { if (!hitsAt(f)) return; GUNS.forEach((p, k) => { const per = 28 + (k % 4) * 5, ph = (f + k * 11) % per; if (ph < 8) out.push({ id: "mf" + k, kind: "burst", pos: p, size: 4.5, t: q((ph + 1) / 8, 0.12), col: "#ffd27a" }); if (ph < 22) out.push({ id: "gs" + k, kind: "smoke", pos: [p[0], p[1] + 1 + ph * 0.12, p[2] - 1], size: 7 + ph * 0.3, t: q(ph / 22, 0.05), alpha: 0.7 }); }); };
const hits = (f, out, big = 1) => { if (!hitsAt(f)) return; for (let k = 0; k < 7; k++) { const per = 23 + k * 3, ph = (f + k * 17) % per, p = [-18 + k * 6, 4 + (k % 3) * 4.5, 3]; if (ph < 14) out.push({ id: "hit" + k, kind: "puff", pos: p, size: 7 * big, t: q(ph / 14, 0.07), alpha: 0.8 }); if (ph < 6) out.push({ id: "hb" + k, kind: "burst", pos: p, size: 5 * big, t: q((ph + 1) / 6, 0.15), col: "#ffb060" }); } };
const sign = (id, f, f0, pos, size, lines, board = "#2a3a6a") => { const s = pop(f, f0, 7); return s > 0 ? [{ id, kind: "sign", pos, size: size * s, lines, board }] : []; };
const guards = (f, cam, L, o = {}) => [[-3.4, 12.6], [3.4, 12.6], [-6.8, 11.4], [6.8, 11.4], [-10, 10.2], [10, 10.2]].map((p, k) => act("g" + k, GUA, p, f, cam, L, { expr: o.expr || "smile", arms: o.arms || ["hang", "hold"], prop: "musket", seed: 40 + k, face: o.face }));
const deck = (f, cam, L, o = {}) => [act("adm", ADM, ADMP, f, cam, L, { y: DECK, expr: o.expr || "smug", arms: ["hang", o.tea === false ? "point" : "hold"], prop: o.tea === false ? null : "tea", seed: 3 }), act("sai", SAI, [-7.5, 147.5], f, cam, L, { y: DECK, expr: o.sexpr || "grin", arms: ["hang", "hang"], seed: 9 })];
const SH = { c: [0, 0, 6], r: 30 }, DS = { c: [-12, 0, 146], r: 16 };

// ---------------- shots ----------------
const SHOTS = [], NOWHIP = [];
const shot = (id, a, b, fn, via = null) => SHOTS.push({ id, a, b, fn, via });
const sh = (id, loc, a, b, fn) => { shot(id, a, b, fn); SHOTS[SHOTS.length - 1].loc = loc; NOWHIP.push(id); };

// HOOK: out of the sky in half a second, onto the admiral sipping tea while the guns roar at the palace
sh("fly", "deck", 0, PH[1], (f) => { const cam = camKeys([{ f: 0, pos: [-200, 260, 600], look: [-12, 2, 120], fov: 56 }, { f: 16, pos: [-15.5, 4.6, 150.6], look: [-12, 3.9, 146], fov: 42, ease: (t) => 1 - Math.pow(1 - t, 4) }, { f: PH[1], pos: [-14.4, 4.4, 149.4], look: [-12, 3.9, 146], fov: 38, ease: (t) => t }], f), L = LPZ, fx = []; firing(f, fx); hits(f, fx, 3);
  return { cam, L, actors: deck(f, cam, L), crowd: null, fx, world: WS(f), dof: { focus: dist(cam.pos, [-12, 3.9, 146]), cInf: 5 * lin(14, 26, f) }, shadow: DS }; });
sh("aug", "air", PH[1], PH[3], (f) => { const cam = K2(f, PH[1], PH[3], [-140, 80, 140], [0, 0, -40], 50, [-90, 60, 110], [0, 0, -40], 48), L = LPZ;
  return { cam, L, actors: [], crowd: null, fx: [...sign("cal", f, PH[1] + 6, [-60, 52, 60], 12, ["AUGUST", "1896"], "#7a2a2a")], world: WS(f), dof: { focus: 120, cInf: 0 }, shadow: { c: [0, 0, 0], r: 120 } }; });
sh("island", "air", PH[3], PH[4], (f) => { const cam = K2(f, PH[3], PH[4], [60, 26, 60], [-20, 8, -30], 52, [30, 22, 50], [-20, 8, -30], 50), L = LPZ;
  return { cam, L, actors: [], crowd: null, fx: [...sign("zz", f, PH[3] + 4, [8, 20, 18], 6, ["ZANZIBAR"], "#1f5a3a")], world: WS(f), dof: { focus: 60, cInf: 0 }, shadow: { c: [0, 0, 0], r: 70 } }; });
sh("died", "palace", PH[4], PH[5], (f) => { const cam = K2(f, PH[4], PH[5], [0, 2.2, 26], [0, 18, -2], 46, [0, 2.3, 23], [0, 20, -2], 44), L = LPZ;
  return { cam, L, actors: guards(f, cam, L, { expr: "sad", arms: ["hang", "hang"] }), crowd: null, fx: [], world: WS(f), dof: { focus: 14, cInf: 2 }, shadow: SH }; });
sh("took", "palace", PH[5], PH[6], (f) => { const t = clamp(lin(PH[5], PH[6] - 20, f), 0, 1), p = [0, lerp(20, 8, t)], cam = K2(f, PH[5], PH[6], [4.5, 1.5, 26], [0, 1.4, 12], 44, [3.6, 1.5, 22.5], [0, 1.4, 8], 42), L = LPZ;
  return { cam, L, actors: [...guards(f, cam, L, { expr: "grin", arms: ["cheer", "hold"] }), act("sul", SUL, p, f, cam, L, { expr: "smug", d: t < 1 ? q((12 * t / 0.96) % 1, 1 / 24) : null, face: [0, -1], arms: ["hip", "hang"], seed: 5 })], crowd: null, fx: [], world: WS(f), dof: { focus: dist(cam.pos, [0, 1.4, p[1]]), cInf: 4 }, shadow: SH }; });
sh("unhappy", "beach", PH[6], PH[7], (f) => { const cam = K2(f, PH[6], PH[7], [29.7, 1.6, 26.8], [29.6, 1.3, 19.2], 46, [29.6, 1.6, 26.2], [29.6, 1.3, 19.2], 44), L = LPZ;
  return { cam, L, actors: [act("env", ENV, [28.4, 19.2], f, cam, L, { expr: "angry", arms: ["hip", "point"], face: [1, 0], seed: 21 }), act("adm", ADM, [30.8, 19.4], f, cam, L, { expr: "angry", arms: ["hip", "hip"], face: [-1, 0], seed: 3 })], crowd: null, fx: [], world: WS(f), dof: { focus: 4.5, cInf: 6 }, shadow: { c: [30, 0, 19], r: 12 } }; });
const M1 = PH[7] + 50;
sh("ships", "air", PH[7], M1, (f) => { const cam = K2(f, PH[7], M1, [-10, 9, 60], [40, 4, 175], 50, [10, 10, 70], [40, 4, 175], 48), L = LPZ;
  return { cam, L, actors: [], crowd: null, fx: [], world: WS(f), dof: { focus: 100, cInf: 0 }, shadow: { c: [40, 0, 170], r: 120 } }; });
sh("message", "beach", M1, PH[8], (f) => { const cam = K2(f, M1, PH[8], [29.2, 1.5, 23.4], [28.4, 1.3, 19.2], 42, [29.0, 1.5, 22.6], [28.4, 1.3, 19.2], 40), L = LPZ;
  return { cam, L, actors: [act("env", ENV, [28.4, 19.2], f, cam, L, { expr: "smug", arms: ["hang", "hold"], prop: "letter", seed: 21 })], crowd: null, fx: [], world: WS(f), dof: { focus: 3, cInf: 7 }, shadow: { c: [28, 0, 19], r: 10 } }; });
sh("leave", "beach", PH[8], PH[9], (f) => { const cam = K2(f, PH[8], PH[9], [28.8, 1.6, 23.2], [28.4, 1.5, 19.2], 44, [28.7, 1.6, 22.4], [28.4, 1.5, 19.2], 42), L = LPZ;
  return { cam, L, actors: [act("env", ENV, [28.4, 19.2], f, cam, L, { expr: "angry", arms: ["point", "hold"], prop: "letter", seed: 21 })], crowd: null, fx: [...sign("lv", f, PH[8] + 6, [28.4, 2.25, 20.2], 0.9, ["LEAVE THE PALACE", "BY 9 O'CLOCK"], "#7a2a2a")], world: WS(f), dof: { focus: 2.4, cInf: 7 }, shadow: { c: [28, 0, 19], r: 10 } }; });
sh("no", "palace", PH[9], PH[10], (f) => { const cam = K2(f, PH[9], PH[10], [0.4, 1.4, 11.2], [0, 1.6, 8], 40, [0.2, 1.4, 10.7], [0, 1.6, 8], 38), L = LPZ;
  return { cam, L, actors: [act("sul", SUL, [0, 8], f, cam, L, { expr: "angry", arms: ["hip", "hip"], seed: 5, look: 0.9 * Math.sin((f - PH[9]) * 0.35) })], crowd: null, fx: [], world: WS(f), dof: { focus: 3, cInf: 7 }, shadow: SH }; });
sh("gates", "palace", PH[10], PH[11], (f) => { const cam = K2(f, PH[10], PH[11], [0, 1.8, 3.5], [0, 2.0, 15], 50, [0, 1.8, 5.0], [0, 2.0, 15], 48), L = LPZ;
  return { cam, L, actors: [act("g0", GUA, [-1.9, 13.6], f, cam, L, { expr: "angry", arms: ["reach", "reach"], face: [1, 0], seed: 40 }), act("g1", GUA, [1.9, 13.6], f, cam, L, { expr: "angry", arms: ["reach", "reach"], face: [-1, 0], seed: 41 })], crowd: null, fx: [], world: WS(f), dof: { focus: 6, cInf: 3 }, shadow: SH }; });
sh("guards", "palace", PH[11], PH[12], (f) => { const cam = K2(f, PH[11], PH[12], [-12, 0.7, 13.5], [4, 1.8, 10.5], 50, [-11, 0.8, 12.2], [5, 1.8, 10.5], 48), L = LPZ;
  return { cam, L, actors: [...guards(f, cam, L, { expr: "angry", arms: ["hang", "hold"] }), act("sul", SUL, [0, 8], f, cam, L, { expr: "smug", arms: ["hip", "point"], seed: 5 })], crowd: null, fx: [], world: WS(f), dof: { focus: 10, cInf: 3 }, shadow: SH }; });
sh("waited", "palace", PH[12], PH[13], (f) => { const cam = K2(f, PH[12], PH[13], [0.8, 1.2, 12.2], [0, 1.4, 8], 42, [0.5, 1.25, 11.4], [0, 1.4, 8], 40), L = LPZ;
  return { cam, L, actors: [act("sul", SUL, [0, 8], f, cam, L, { expr: "smug", arms: ["hip", "hip"], seed: 5, tilt: 3 * Math.sin(f * 0.4) })], crowd: null, fx: [], world: WS(f), dof: { focus: 4, cInf: 6 }, shadow: SH }; });
sh("nine", "deck", PH[13], PH[15], (f) => { const cam = K2(f, PH[13], PH[15], [-13.2, 4.0, 149.8], [-12, 3.9, 146], 40, [-12.9, 4.0, 149.2], [-12, 3.9, 146], 38), L = LPZ;
  return { cam, L, actors: deck(f, cam, L, { expr: "smug", sexpr: "smile" }), crowd: null, fx: [...sign("c9", f, PH[13] + 4, [-10.4, 5.6, 146], 1.3, ["9:00"], "#1f2a52")], world: WS(f), dof: { focus: 3.8, cInf: 7 }, shadow: DS }; });
sh("ninetwo", "deck", PH[15], PH[16], (f) => { const cam = K2(f, PH[15], PH[16], [-15.5, 4.2, 152], [-12, 3.9, 146], 46, [-16.5, 4.4, 153], [-12, 3.9, 146], 48), L = LPZ;
  return { cam, L, actors: deck(f, cam, L, { tea: false, expr: "angry", sexpr: "shock" }), crowd: null, fx: [...sign("c92", f, PH[15] + 4, [-13.6, 5.6, 148.6], 0.9, ["9:02"], "#1f2a52")], world: WS(f), dof: { focus: 6, cInf: 5 }, shadow: DS }; });
sh("fire", "air", PH[16], PH[17], (f) => { const cam = K2(f, PH[16], PH[17], [-60, 7, 120], [0, 6, 0], 46, [-40, 9, 110], [0, 6, 0], 44), L = LPZ, fx = []; firing(f, fx);
  return { cam, L, actors: [], crowd: null, fx, world: WS(f), dof: { focus: 40, cInf: 0 }, shadow: { c: [-30, 0, 150], r: 80 } }; });
sh("crumble", "palace", PH[17], PH[18], (f) => { const cam = K2(f, PH[17], PH[18], [6, 3, 40], [0, 9, 0], 48, [4, 2.6, 34], [0, 9, 0], 46), L = LPZ, fx = []; hits(f, fx);
  return { cam, L, actors: guards(f, cam, L, { expr: "shock", arms: ["scared", "scared"] }), crowd: null, fx, world: WS(f), dof: { focus: 30, cInf: 0 }, shadow: SH }; });
sh("yacht", "sea", PH[18], PH[19], (f) => { const cam = K2(f, PH[18], PH[19], [60, 3, 46], [40, 1, 70], 46, [56, 2.6, 50], [40, 0, 70], 44), L = LPZ;
  return { cam, L, actors: [], crowd: null, fx: [{ id: "ys", kind: "puff", pos: [40, 2, 70], size: 14, t: q(((f - PH[18]) % 30) / 30, 0.05), alpha: 0.5 }], world: WS(f), dof: { focus: 30, cInf: 0 }, shadow: { c: [40, 0, 70], r: 40 } }; });
sh("run", "back", PH[19], PH[20], (f) => { const t = clamp(lin(PH[19] + 6, PH[20], f), 0, 1), p = [lerp(0, -12, t), lerp(-14, -26, t)], cam = { pos: [p[0] + 5, 1.6, p[1] - 3.5], look: [p[0], 1.1, p[1]], fov: 46 }, L = LPZ;
  return { cam, L, actors: [act("sul", SUL, p, f, cam, L, { expr: "shock", run: t > 0 ? q((dist2([0, -14], p) / 2.0) % 1, 1 / 24) : null, face: [-1, -1], seed: 5 })], crowd: null, fx: [], world: WS(f), dof: { focus: 6, cInf: 4 }, shadow: { c: [p[0], 0, p[1]], r: 14 } }; });
sh("flag", "palace", PH[20], PH[23], (f) => { const cam = K2(f, PH[20], PH[23], [-7, 3, 30], [0, 36, -6], 46, [-6, 3.4, 26], [0, 38, -6], 44), L = LPZ, fx = []; if (f < PH[22]) hits(f, fx, 0.8);
  return { cam, L, actors: [], crowd: null, fx: [...fx, ...sign("c940", f, PH[20] + 3, [-9, 24, -2], 4.5, ["9:40"], "#1f2a52")], world: WS(f), dof: { focus: 40, cInf: 0 }, shadow: SH }; });
sh("lunch", "palace", PH[23], PH[24], (f) => { const cam = K2(f, PH[23], PH[24], [1.2, 1.3, 15.5], [0, 1.6, 8], 42, [0.8, 1.35, 13.8], [0, 1.6, 8], 40), L = LPZ;
  return { cam, L, actors: [act("sul2", SUL2, [0, 8], f, cam, L, { expr: "grin", arms: ["wave", "hip"], seed: 6 }), act("env", ENV, [-3, 9], f, cam, L, { expr: "grin", arms: ["cheer", "hang"], seed: 21 }), act("adm", ADM, [3, 9], f, cam, L, { expr: "smug", arms: ["hip", "hold"], prop: "tea", seed: 3 })], crowd: null, fx: [...sign("lunch", f, PH[23] + 6, [0, 4.2, 9], 1.2, ["12:00", "LUNCHTIME"], "#7a2a2a")], world: WS(f), dof: { focus: 6, cInf: 4 }, shadow: SH }; });
sh("thirtyeight", "air", PH[24], PH[25], (f) => { const cam = K2(f, PH[24], PH[25], [-80, 40, 110], [0, 5, 0], 48, [-60, 34, 95], [0, 5, 0], 46), L = LPZ;
  return { cam, L, actors: [], crowd: null, fx: [...sign("38", f, PH[24] + 4, [-46, 30, 76], 9, ["38 MINUTES"], "#7a2a2a")], world: WS(f), dof: { focus: 90, cInf: 0 }, shadow: { c: [0, 0, 40], r: 100 } }; });
sh("breakfast", "deck", PH[25], END, (f) => { const cam = K2(f, PH[25], END, [-13.6, 4.3, 149.6], [-12, 3.9, 146], 40, [-13.2, 4.2, 148.9], [-12, 3.9, 146], 36), L = LPZ;
  return { cam, L, actors: deck(f, cam, L, { expr: "smug", sexpr: "laugh" }), crowd: null, fx: [], world: WS(f), dof: { focus: 3.4, cInf: 7 }, shadow: DS }; });

export const SHOTLIST = SHOTS.map((s) => ({ id: s.id, a: s.a, b: s.b }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];

// One continuous take: no cuts. Each shot's camera is whipped into from where the previous one ended,
// and the small in-shot moves are exaggerated so the camera is always travelling.
const KX = {};
// close, slightly low framing on the characters (reference: character fills about half the frame, camera at chest height looking up a touch)
const CLOSE = { along: 0.62, name: 0.85, rice: 0.6, "1859": 0.72, office: 0.78, inspect: 0.55, orders: 0.42, ignored: 0.78, different: 0.62, bridgeorder: 0.7, laughed: 0.66 };
const shotCam = (s, f) => {
  const r = s.fn(f), k = KX[s.id] || 1, cam = { ...r.cam, pos: [...r.cam.pos], look: [...r.cam.look] };
  const z = CLOSE[s.id]; if (z) { // full body in frame, camera close + low, tilted up with a slight dutch angle
    const hero = (r.actors || []).find((a) => a.kind === "folk"), base = hero ? (hero.y || 0) : Math.max(0, cam.look[1] - 1.45), dx = cam.pos[0] - cam.look[0], dz = cam.pos[2] - cam.look[2], hl = Math.hypot(dx, dz) || 1, d = 3.0 * (z > 0.8 ? 1.05 : 1);
    const lk = hero ? [hero.pos[0], base + 0.98, hero.pos[1]] : [cam.look[0], base + 0.98, cam.look[2]]; cam.pos = [lk[0] + dx / hl * d, base + 0.95, lk[2] + dz / hl * d]; cam.look = lk; cam.fov = 48; cam.roll = 0; r.dof = { ...r.dof, focus: Math.hypot(d, 0.03), cInf: 8, far: 1 }; }
  if (k !== 1) { const m = s.fn(Math.round((s.a + s.b) / 2)).cam.pos; cam.pos = m.map((v, i) => v + (cam.pos[i] - v) * k); cam.pos[1] = Math.max(0.35, cam.pos[1]); }
  return [r, cam];
};
export const whipLen = (idx) => {
  if (idx <= 0 || NOWHIP.includes(SHOTS[idx].id)) return 0;
  const s = SHOTS[idx], D = dist(shotCam(SHOTS[idx - 1], s.a - 1)[1].pos, shotCam(s, s.a)[1].pos);
  return Math.min(Math.round(clamp(16 + D / 4, 16, 26)), Math.floor((s.b - s.a) * 0.5));
};
// character sheet: three line-ups on the boardwalk in golden light (f = 0, 1, 2)
export const sheetState = (f) => {
  const all = [["norton", NORTON, { expr: "proud", arms: ["hip", "raise"] }], ["civ", NORTON_CIV, { expr: "resolve", arms: ["hang", "hold"], prop: "letter" }], ["ed", EDITOR, { expr: "puzzled", arms: ["hold", "hang"] }],
    ...CONGRESS.map((o, k) => ["c" + k, o, { expr: ["laugh", "mock", "smug"][k], arms: [["belly", "belly"], ["hold", "hang"], ["shrug", "shrug"]][k] }]),
    ...[0, 1, 2, 3, 4, 5].map((k) => ["t" + k, TOWNS[k], { expr: ["glee", "smile", "proud", "warm", "grin", "glee"][k], arms: [["hang", "cheer"], ["hip", "hang"], ["hang", "raise"], ["hip", "hang"], ["hang", "hang"], ["up", "hang"]][k] }])];
  const [id, o, x] = all[Math.floor(f) % all.length];
  const L = LP.golden, cam = { pos: [33.4, 1.45, -2.9], look: [33.4, 1.3, -6.6], fov: 40 };
  return { shot: "sheet", cam, light: L, actors: [folk(id, o, [33.4, -6.6], 40, cam, L, { y: 0.22, seed: 7, ...x })], crowd: null, fx: [], world: { truck: null, tripod: null, ammo: null, rays: null, meat: null, lab: null, cable: null, bridge: false, funeral: null, lampsOn: false }, flash: 0, vign: 0.16, dof: { focus: dist(cam.pos, [33.4, 1.3, -6.6]), cInf: 14 }, shadow: { c: [33.4, 0, -6.6], r: 6 }, lamps: [] };
};
export const frameState0 = (f) => {
  const s = shotAt(f), idx = SHOTS.indexOf(s), [r, cam] = shotCam(s, f);
  const W = whipLen(idx), kicks = [...(r.kicks || [])];
  let dofK = 1;
  if (W) {
    if (f < s.a + W) {
      const pc = shotCam(SHOTS[idx - 1], s.a - 1)[1], e = smoother((f - s.a + 1) / (W + 1)), D = dist(pc.pos, cam.pos), arc = Math.sin(Math.PI * e);
      if (s.via) { const A = lerp3(pc.pos, s.via, e), Bq = lerp3(s.via, cam.pos, e); cam.pos = lerp3(A, Bq, e); const vl = [s.via[0] + (s.via[0] - pc.pos[0]) * 0, s.via[1] - 0.2, s.via[2] + Math.sign(s.via[2] - pc.pos[2]) * 8]; const LA = lerp3(pc.look, vl, e), LB = lerp3(vl, cam.look, e); cam.look = lerp3(LA, LB, e); }
      else { cam.pos = lerp3(pc.pos, cam.pos, e); const lift = clamp(D * 0.22, 0.6, 14) * arc; cam.pos[1] += lift; cam.look = lerp3(pc.look, cam.look, e); cam.look[1] += lift * 0.85; }
      if (!s.via) cam.look = lerp3(pc.look, cam.look, e);
      cam.fov = lerp(pc.fov, cam.fov, e);
      cam.roll = lerp(pc.roll || 0, cam.roll || 0, e);
      dofK = e * e;
    }
  }
  const [kx, ky] = [0, 0]; void kicks;
  if (kx || ky) {
    const d = dist(cam.pos, cam.look), R = camRight(cam), U = camUp(cam);
    cam.look = add3(cam.look, [R[0] * kx * d + U[0] * ky * d, R[1] * kx * d + U[1] * ky * d, R[2] * kx * d + U[2] * ky * d]);
  }
  const world = { truck: null, tripod: null, ammo: null, rays: null, meat: null, lab: null, cable: null, bridge: false, funeral: null, lampsOn: false, ...(r.world || {}) };
  let dof = { ...r.dof }; if (!CLOSE[s.id]) { const hs = (r.actors || []).filter((a) => a.kind === "folk"); if (hs.length) { const near = hs.reduce((b, a) => { const dd = dist(cam.pos, [a.pos[0], (a.y || 0) + 1.1, a.pos[1]]); return dd < b ? dd : b; }, 1e9); dof.focus = near; } dof.far = 0.12; dof.cInf = Math.max(dof.cInf || 0, 5); }
  cam.roll = cam.roll || 0;
  return { shot: s.id, cam, light: r.L, actors: r.actors || [], crowd: r.crowd || null, fx: r.fx || [], world, flash: r.flash || 0, vign: r.vign ?? 0.18, dof: { ...dof, cInf: dof.cInf * dofK * 1.45 }, shadow: r.shadow, lamps: r.lamps || [] };
};
// background showcase (no characters): 0 trees, 1 table/stand, 2 sky, 3 water, 4 road, 5 street houses, 6 hillside houses
export const bgState = (f) => {
  const W = { truck: null, tripod: null, ammo: null, rays: null, meat: null, lab: null, cable: null, bridge: false, funeral: null, lampsOn: false };
  const P = [
    [[-420, 2.2, 104], [-420, 6, 50], 52, {}],
    [[27.2, 1.5, 2.6], [24, 0.7, 0], 46, { funeral: [24, 0.05, 0] }],
    [[128, 1.8, 6], [150, 38, -60], 64, { bridge: true, bridgeY: 0 }],
    [[134, 3.2, 5], [170, -0.5, -40], 56, { bridge: true, bridgeY: 0 }],
    [[42, 1.1, 0.6], [0, 0.5, -0.6], 50, {}],
    [[13, 1.7, 3.2], [22, 3.6, -8], 52, {}],
    [[20, 12, 18], [22, 26, -90], 52, {}],
  ][Math.round(f) % 7];
  const cam = { pos: P[0], look: P[1], fov: P[2], roll: 2 }, L = LP.golden;
  return { shot: "bg", cam, light: L, actors: [], crowd: null, fx: [], world: { ...W, ...P[3] }, flash: 0, vign: 0.16, dof: { focus: dist(P[0], P[1]), cInf: 0, far: 1 }, shadow: { c: [P[1][0], 0, P[1][2]], r: 40 }, lamps: [] };
};

// every shot change is a cut: a soft flash when the place changes, a 3-frame dissolve (in post) when it does not. The camera path is gaussian-smoothed inside each shot.
export const placeCut = (idx) => idx > 0 && SHOTS[idx].loc !== SHOTS[idx - 1].loc;
export const SOFTCUTS = SHOTS.map((s, i) => (i > 0 && !placeCut(i) ? s.a : -1)).filter((v) => v > 0);
export const frameState = (f) => {
  const S = frameState0(f), s = shotAt(f), idx = SHOTS.indexOf(s), K = f < 18 ? 0 : 8, sig = 3, P = [0, 0, 0], Lk = [0, 0, 0]; let fov = 0, W = 0;
  for (let k = -K; k <= K; k++) { const g = Math.min(s.b - 1, Math.max(s.a, f + k)), w = Math.exp(-(k * k) / (2 * sig * sig)), c = k === 0 ? S.cam : frameState0(g).cam;
    for (let i = 0; i < 3; i++) { P[i] += c.pos[i] * w; Lk[i] += c.look[i] * w; } fov += (c.fov || 45) * w; W += w; }
  const cut = placeCut(idx) && f < s.a + 6 ? 0.5 * (1 - (f - s.a) / 6) : 0;
  return { ...S, cam: { ...S.cam, pos: P.map((v) => v / W), look: Lk.map((v) => v / W), fov: fov / W }, flash: Math.min(0.9, Math.max(S.flash || 0, cut)) };
};
