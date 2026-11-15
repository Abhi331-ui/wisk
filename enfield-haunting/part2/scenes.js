// Scenes + driver (shared by both parts). Needs window.PART = {dur, cues, shots, knocks, slams, booms}
(function () {
  const E = window.ENG, { c, cam, P, W, H, clamp, lerp, ease, hash, pulse, rgb } = E;
  const WARM = [255, 196, 130], MOON = [120, 145, 200], BLUE = [70, 110, 255];
  const flick = (T, k = 1) => 1 - k * (.12 * Math.sin(T * 23) * Math.sin(T * 7.1) + (hash(Math.floor(T * 12), 3) < .06 ? .5 : 0));
  // ---------------- BEDROOM ----------------
  function bedroom(T, lt, o) {
    const zb = 5.5; const j = (o.shake || 0) * Math.sin(T * 47) * .03;
    E.room({ w: 4, h: 2.6, zb, paper: E.PAPER.bed, paperName: 'pbed', floor: '#7a5636', side: '#a88e7a', rug: [-1.1, .9, 1.6, 3.4], seed: 2 });
    E.windowBack(.35, 1.45, 1.0, 2.15, zb - .001, T, { moon: true, fig: o.winFig || 0 });
    if (o.shadow) { const s = o.shadow; E.wallShadow(s.type || 'man', s.x || 0, s.y || 0, zb - .01, s.h || 2.4, s.a || .6, s.blur); }
    const toys = o.toys || 0;
    E.lampTable(-.25, 4.95, o.lamp !== false);
    E.bed(-1.15, 3.55, j, {});
    E.dresser(1.62, 2.7, o.drawers || [0, 0, 0]);
    if (!toys) { E.box(.6, .06, 2.0, .12, .12, .12, '#8a2a22', { ry: .4 }); E.box(.75, .06, 2.15, .12, .12, .12, '#24507a', { ry: -.2 }); }
    if (o.girl === 'stand') E.figure('girl', o.gx ?? -.05, 0, o.gz ?? 3.2, 1.45, { rim: [3, -2, 'rgba(255,200,140,.85)'] });
    if (o.girl === 'bed') { const q = E.P(-1.15, .7, 4.75); c.fillStyle = '#060504'; c.beginPath(); c.ellipse(q[0], q[1], cam.f * .11 / q[2], cam.f * .08 / q[2], 0, 0, 7); c.fill(); }
    if (toys) for (let i = 0; i < 9; i++) { const ph = hash(i, 5) * 6, sp = .7 + hash(i, 6); const x = -1 + hash(i, 7) * 2.4 + Math.sin(T * sp + ph) * .5, y = .6 + hash(i, 8) * 1.4 + Math.sin(T * sp * 1.4 + ph) * .3, z = 2 + hash(i, 9) * 2.5; E.box(x, y, z, .14, .14, .14, ['#8a2a22', '#24507a', '#7a7a26', '#c9c2b2'][i % 4], { rx: T * sp * 2 + ph, ry: T * sp + ph, edge: true }); }
    // lights
    const swing = o.lampSwing ? Math.sin(T * 3.3) * .5 : 0;
    const lamp = o.lamp !== false ? [{ x: -.25 + swing, y: 1.0, z: 4.95, r: 5.5, col: WARM, i: 1.15 * flick(T, o.flicker ?? .6) }] : [];
    const extra = o.front ? [{ x: o.front[0], y: o.front[1], z: o.front[2], r: 7, col: WARM, i: .95 * flick(T, .8) }] : [];
    E.setLight(lamp[0] ? [lamp[0].x, 1.0, 4.95] : [.9, 2.2, 6]);
    E.lightPass([28, 32, 48], [...lamp, ...extra, { x: .9, y: 1.4, z: 5.4, r: 3.2, col: MOON, i: .55 }]);
    E.shaft([[.35, 2.15, zb], [1.45, 2.15, zb], [1.45, 1.0, zb], [.35, 1.0, zb]], [[.75, 0, zb - 2.4], [1.85, 0, zb - 2.4], [1.85, 0, zb - 1.1], [.75, 0, zb - 1.1]], .1);
    if (o.lamp !== false) E.lampGlow(-.25 + swing * 0, .9, 4.95, WARM, .35, flick(T, .6));
    E.dust(T, .8);
  }
  // ---------------- LIVING ROOM ----------------
  function living(T, lt, o) {
    const zb = 6;
    E.room({ w: 4.4, h: 2.6, zb, paper: E.PAPER.living, paperName: 'pliv', floor: '#6a4a30', side: '#9c9470', rug: [-1.6, 1.4, 2.2, 5.0], seed: 7 });
    // fireplace + mantel clock + picture
    E.box(.3, .6, zb - .15, 1.5, 1.2, .3, '#b9ad96'); E.box(.3, .4, zb - .3, .8, .7, .02, '#0b0907'); E.box(.3, 1.23, zb - .2, 1.7, .06, .4, '#8a7d66'); E.box(.3, 1.38, zb - .25, .26, .24, .1, '#4a3322');
    E.box(.3, 1.95, zb - .02, .9, .65, .03, '#3a2a1a'); E.box(.3, 1.95, zb - .04, .78, .53, .01, '#5d6a6a');
    E.armchair(-1.15, 4.4, 0);
    if (o.ghost) { c.save(); c.globalAlpha = o.ghost; E.figure('manSit', -1.15, .05, 4.3, 1.25, { fill: 'rgba(150,180,220,.55)' }); c.restore(); }
    if (o.manChair) E.figure('manSit', -1.15, .05, 4.3, 1.25, { rim: [-3, -2, 'rgba(255,200,140,.7)'] });
    // standard lamp
    E.box(-1.9, .02, 5.4, .3, .04, .3, '#2a2016'); E.box(-1.9, .8, 5.4, .03, 1.6, .03, '#7a6a4a'); E.box(-1.9, 1.7, 5.4, .4, .3, .4, '#d8b882');
    // sliding chair
    const cs = o.chairSlide ?? -1; if (cs >= 0) E.chair(lerp(-.2, 1.2, ease(clamp(cs))), 3.0, -.3 + cs * .2);
    if (o.table) { E.box(.6, .37, 3.1, 1.2, .04, .8, '#5a3c26'); for (const [dx, dz] of [[-.55, -.35], [.55, -.35], [-.55, .35], [.55, .35]]) E.box(.6 + dx, .18, 3.1 + dz, .05, .36, .05, '#4a3020'); E.recorder(.6, .39, 3.05, T, 1);
      E.box(.1, .55, 2.75, .02, .3, .02, '#999'); E.box(.1, .72, 2.75, .05, .08, .05, '#333');
      if (o.men) { E.figure('sitProfile', -.35, 0, 3.15, 1.3, { rim: [-2, -2, 'rgba(255,200,140,.6)'] }); E.figure('sitProfile', 1.55, 0, 3.15, 1.3, { flip: true, rim: [2, -2, 'rgba(255,200,140,.6)'] }); } }
    if (o.wpc) E.figure('wpc', o.wpc[0], 0, o.wpc[1], 1.68, { rim: [-3, -3, 'rgba(255,200,140,.8)'] });
    if (o.girlSit) E.figure('girl', .05, 0, 3.6, 1.45, { rim: [3, -2, 'rgba(255,200,140,.8)'] });
    E.setLight([-1.9, 1.7, 5.4]);
    E.lightPass([26, 28, 40], [{ x: -1.9, y: 1.7, z: 5.4, r: 6.5, col: WARM, i: 1.1 * flick(T, o.flicker ?? .4) }, ...(o.table ? [{ x: .6, y: 1.6, z: 3.1, r: 4, col: WARM, i: .8 }] : [])]);
    E.lampGlow(-1.9, 1.7, 5.4, WARM, .45, flick(T, .4));
    if (o.ghost) E.lampGlow(-1.15, .9, 4.3, [140, 170, 230], .5, o.ghost * .6);
    E.dust(T, .7);
  }
  // ---------------- HALLWAY ----------------
  function hall(T, lt, o) {
    const zb = 5.2;
    E.room({ w: 1.8, h: 2.6, zb, paper: E.PAPER.hall, paperName: 'phall', floor: '#5a3e2a', side: '#a89c80', seed: 4 });
    const op = o.open ?? 1; const dx0 = -.45, dx1 = .45;
    E.poly([[dx0 - .08, 0, zb - .01], [dx1 + .08, 0, zb - .01], [dx1 + .08, 2.12, zb - .01], [dx0 - .08, 2.12, zb - .01]], '#d8d0bc');
    const p0 = P(dx0, 2.05, zb), p1 = P(dx1, 0, zb); const bl = (Math.sin(T * 9) > 0 ? 1 : .25); const g = c.createLinearGradient(0, p0[1], 0, p1[1]); g.addColorStop(0, '#0d1626'); g.addColorStop(1, '#1a2438'); c.fillStyle = g; c.fillRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(BLUE, 1, .35 * bl * op); c.fillRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]); c.restore();
    // door leaf swung in
    const ang = op * 1.3; const hx = dx1, hz = zb - .01; const ex = hx - Math.cos(ang) * .9, ez = hz - Math.sin(ang) * .9;
    E.poly([[hx, 0, hz], [ex, 0, ez], [ex, 2.05, ez], [hx, 2.05, hz]], '#3a1d18', '#1a0c08', 2);
    if (o.wpc !== false) E.figure('wpc', -.05, 0, zb + .35, 1.68, { rim: [0, -3, rgb(BLUE, 1, .9 * bl)] });
    // stairs on left
    for (let i = 0; i < 12; i++) E.box(-.62, i * .2 + .1, 1.6 + i * .26, .52, .2, .26, i % 2 ? '#5a3e2a' : '#634530');
    E.setLight([0, 2.4, 2.5]);
    E.lightPass([22, 26, 38], [{ x: 0, y: 2.4, z: 2.6, r: 4, col: WARM, i: .8 * flick(T, .3) }, { x: 0, y: 1.2, z: zb + .5, r: 5, col: BLUE, i: 1.2 * bl * op }]);
    E.lampGlow(0, 2.45, 2.6, WARM, .3, .8);
    // spill of blue light on the floor
    c.save(); c.globalCompositeOperation = 'lighter'; c.filter = 'blur(20px)'; E.poly([[dx0, .01, zb], [dx1, .01, zb], [.9, .01, zb - 2.6], [-.9, .01, zb - 2.6]], rgb(BLUE, 1, .18 * bl * op)); c.restore();
  }
  // ---------------- WALL CLOSE (knocks) ----------------
  const CRK = [...Array(6)].map((_, k) => { const pts = [[-1.5 + hash(k, 1) * 1.1, 1.3 + hash(k, 2) * 0.9]]; for (let s = 0; s < 9; s++) { const l = pts[pts.length - 1]; pts.push([l[0] + (hash(k, s + 10) - .5) * .25, l[1] + (hash(k, s + 30) - .6) * .2]); } return pts; });
  function wall(T, lt, o) {
    bedroom(T, lt, { ...o, girl: null });
    const n = (o.knocks || []).filter(k => T >= k).length;
    for (let k = 0; k < n; k++) { const age = T - o.knocks[k]; const pts = CRK[k]; const m = Math.min(pts.length, 2 + Math.floor(age * 40)); c.save(); c.strokeStyle = 'rgba(20,12,6,.9)'; c.lineWidth = 2.5; c.beginPath(); pts.slice(0, m).forEach((p, i) => { const q = P(p[0], p[1], 5.49); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke(); c.restore();
      if (age < .8) { for (let d = 0; d < 14; d++) { const q = P(pts[0][0] + (hash(k, d) - .5) * .2 * (1 + age * 3), pts[0][1] - age * age * 1.2 * hash(d, k), 5.45); c.fillStyle = `rgba(210,195,170,${.5 * (1 - age / .8)})`; c.beginPath(); c.arc(q[0], q[1], 2 + hash(d, 3) * 3, 0, 7); c.fill(); } } }
  }
  // ---------------- STREET ----------------
  function street(T, lt, o) {
    E.skyNight(T);
    const zFar = 90;
    E.streetGround(zFar);
    const houses = []; for (let z = 4; z < zFar; z += 9.6) { houses.push([-7, z]); houses.push([7, z + 4.8]); }
    houses.sort((a, b) => b[1] - a[1]);
    for (const [x, z] of houses) { const s = Math.sign(x), xf = x, xb = x + s * 6; const hero = x < 0 && Math.abs(z - 23.2) < .1;
      E.poly([[xf, 0, z], [xf, 0, z + 9.4], [xf, 5.4, z + 9.4], [xf, 5.4, z]], hero ? '#5e3a2e' : '#4a3029');
      E.poly([[xf, 5.4, z], [xf, 5.4, z + 9.4], [xf + s * 2.5, 7.6, z + 8.8], [xf + s * 2.5, 7.6, z + .6]], '#1d2026');
      E.box(xf + s * 2, 8.1, z + 2.5, .6, 1.4, .7, '#4a2a22');
      for (const [wz, wy, lit] of [[z + 1.5, 3.6, hero ? 1 : (hash(z, 2) < .2 ? .6 : 0)], [z + 6, 3.6, 0], [z + 1.5, 1.2, 0], [z + 6, 1.2, hash(z, 5) < .25 ? .5 : 0]]) { E.poly([[xf + s * .01 * -1, wy, wz], [xf - s * .01, wy, wz + 1.6], [xf - s * .01, wy + 1.2, wz + 1.6], [xf - s * .01, wy + 1.2, wz]], lit ? rgb([255, 190, 110], .55 + .45 * lit * flick(T, .5)) : '#0e1522', '#cfc8b8', 1.5); if (lit && hero) E.lampGlow(xf, wy + .6, wz + .8, [255, 180, 100], .9, .8); }
      E.box(xf - s * .2, .4, z + 4.7, .25, .8, 9.4, '#2e2622'); }
    for (let z = 6; z < zFar; z += 18) { E.streetLamp(4.6, z, T); }
    E.lightPass([75, 85, 115], []);
    for (let z = 6; z < zFar; z += 18) { E.lampGlow(4.2, 6, z, [255, 170, 80], 1.2, 1); E.puddleReflect(3.6, 6, z - 1, [255, 160, 70], .3); }
    E.fog(T, 1.4); E.rain(T, 1);
  }
  // ---------------- HOUSE FRONT ----------------
  function house(T, lt, o) {
    E.skyNight(T);
    E.streetGround(40);
    E.houseFront(-2.4, 12, { lit: o.lit ?? 1, kids: o.kids, fig: o.fig || 0, litDown: o.litDown || .0 }, T);
    E.streetLamp(5.5, 7, T);
    E.lightPass([70, 80, 108], []);
    E.lampGlow(5.1, 6, 7, [255, 170, 80], 1.2, 1); E.puddleReflect(4.6, 6, 6, [255, 160, 70], .35);
    if ((o.lit ?? 1) > 0) E.lampGlow(-4.8, 3.95, 11.9, [255, 180, 100], 1.4, .55 * (o.lit ?? 1));
    E.fog(T, 1.3); E.rain(T, 1);
  }
  // ---------------- CLOSE PROFILE ----------------
  function profile(T, lt, o) {
    bedroom(T, lt, { ...o, girl: null });
    c.save(); c.filter = 'blur(6px)'; c.drawImage(c.canvas, 0, 0); c.restore();
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
    const s = o.ps || 6.5, x = o.px ?? 260, y = o.py ?? 640 + Math.sin(T * .7) * 6;
    E.profileHead(x, y, s, { rim: [1.4, -.6, 'rgba(170,195,240,.95)'] });
    if (o.eyes) eyes(o.eyes[0], o.eyes[1], o.eyes[2], o.eyes[3]);
  }
  function eyes(x, y, s, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; for (const d of [-1, 1]) { const g = c.createRadialGradient(x + d * 38 * s, y, 0, x + d * 38 * s, y, 26 * s); g.addColorStop(0, '#fff6e0'); g.addColorStop(.25, 'rgba(240,150,60,.9)'); g.addColorStop(1, 'rgba(240,150,60,0)'); c.fillStyle = g; c.beginPath(); c.arc(x + d * 38 * s, y, 26 * s, 0, 7); c.fill(); } c.restore(); }
  function black(T, lt, o) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); if (o.shadowMan) { c.save(); c.globalAlpha = o.shadowMan; cam.x = 0; cam.y = 1.2; cam.z = 0; cam.f = 1500; E.figure('man', 0, -.5, 3, 1.8, { fill: '#060608', rim: [2, -3, 'rgba(140,165,215,.7)'] }); c.restore(); } if (o.eyes) eyes(540, o.eyes[0], o.eyes[1], o.eyes[2]); E.rain(T, .25); }
  const SCN = { bedroom, living, hall, wall, street, house, profile, black };
  // ---------------- captions ----------------
  const cap = document.getElementById('cap'); let cur = -1, spans = [], wt = [];
  function caption(T) { const C = PART.cues; const ci = C.findIndex(q => T >= q.start - .05 && T < q.end + .12); if (ci !== cur) { cur = ci; cap.innerHTML = ''; spans = []; wt = []; if (ci >= 0) { const q = C[ci], ws = q.text.split(' '), tot = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0; ws.forEach(w => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w + ' '; cap.appendChild(s); spans.push(s); wt.push(q.start + (acc / tot) * (q.end - q.start)); acc += w.length + 1; }); } } spans.forEach((s, i) => { const on = T >= wt[i], hot = on && (i == spans.length - 1 || T < wt[i + 1]); s.className = 'w' + (on ? ' on' : '') + (hot ? ' hot' : ''); }); }
  // ---------------- titles ----------------
  function titles(T) { for (const t of PART.titles || []) { if (T < t.a || T > t.b) continue; const al = clamp((T - t.a) / .4) * clamp((t.b - T) / .3); c.save(); c.globalAlpha = al; c.textAlign = 'center'; c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 24; t.lines.forEach(([txt, size, col, y, wt, sp]) => { c.font = `${wt || 700} ${size}px "DejaVu Serif",Georgia,serif`; c.fillStyle = col; if (sp) c.letterSpacing = sp + 'px'; c.fillText(txt, W / 2, y); c.letterSpacing = '0px'; }); c.restore(); } }
  // ---------------- frame ----------------
  function draw(T) {
    const SH = PART.shots; let si = SH.length - 1; for (let i = 0; i < SH.length; i++) if (T < SH[i].t + 2) { si = i; break; }
    const sh = SH[si], lt = T - sh.t, k = ease(clamp(lt / 2)); const o = typeof sh.o === 'function' ? sh.o(T, lt) : (sh.o || {});
    const fr = Math.floor(T * 30);
    const shake = pulse(T, PART.knocks || [], .12) * 26 + pulse(T, PART.slams || [], .1) * 30 + pulse(T, PART.booms || [], .3) * 14 + (o.shake ? 6 : 0);
    cam.x = lerp(sh.c0[0], sh.c1[0], k); cam.y = lerp(sh.c0[1], sh.c1[1], k); cam.z = lerp(sh.c0[2], sh.c1[2], k); cam.f = lerp(sh.c0[3], sh.c1[3], k);
    cam.ox = (hash(fr, 1) - .5) * shake + Math.sin(T * .9) * 3; cam.oy = (hash(fr, 2) - .5) * shake + Math.sin(T * .7) * 3;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const roll = (sh.roll || 0) * Math.sin(T * .5); c.save(); c.translate(W / 2, H / 2); c.rotate(roll); c.translate(-W / 2, -H / 2);
    SCN[sh.s](T, lt, o); c.restore();
    if (o.flash) { const f = pulse(T, [o.flash], .18); c.fillStyle = `rgba(235,240,255,${f * .6})`; c.fillRect(0, 0, W, H); }
    titles(T);
    E.post(T, fr, o);
    // dip on cuts
    if (lt < .07) { c.fillStyle = `rgba(0,0,0,${(1 - lt / .07) * .8})`; c.fillRect(0, 0, W, H); }
    if (T > PART.dur - .5) { c.fillStyle = `rgba(0,0,0,${clamp((T - PART.dur + .5) / .5)})`; c.fillRect(0, 0, W, H); }
    caption(T);
  }
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true }); const proxy = { t: 0 };
  tl.to(proxy, { t: PART.dur, duration: PART.dur, ease: 'none', onUpdate: () => draw(proxy.t) }, 0);
  window.__timelines['main'] = tl; draw(0); tl.seek(0);
})();
