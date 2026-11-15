// Enfield Haunting — deterministic 3D-ish canvas engine (2D figures, 3D sets)
(function () {
  const W = 1080, H = 1920;
  const cv = document.getElementById('cv'), c = cv.getContext('2d');
  const cam = { x: 0, y: 1.5, z: 0, f: 1500, roll: 0, ox: 0, oy: 0 };
  // ---------- utils ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function hash(i, j) { let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263); h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rgb = (a, k = 1, al = 1) => `rgba(${clamp(a[0] * k, 0, 255) | 0},${clamp(a[1] * k, 0, 255) | 0},${clamp(a[2] * k, 0, 255) | 0},${al})`;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pulse = (T, arr, dec) => arr.reduce((m, k) => T >= k ? Math.max(m, Math.exp(-(T - k) / dec)) : m, 0);
  // ---------- projection ----------
  function P(x, y, z) { let d = z - cam.z; if (d < 0.06) d = 0.06; return [W / 2 + cam.ox + cam.f * (x - cam.x) / d, H / 2 + cam.oy - cam.f * (y - cam.y) / d, d]; }
  function poly(pts, fill, stroke, lw) { c.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1], p[2]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } }
  function line3(a, b, col, wM) { const p = P(...a), q = P(...b); c.strokeStyle = col; c.lineWidth = Math.max(.6, cam.f * wM / ((p[2] + q[2]) / 2)); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
  // ---------- textures ----------
  function tex(w, h, fn) { const t = document.createElement('canvas'); t.width = w; t.height = h; fn(t.getContext('2d'), w, h); return t; }
  function noiseTex(w, h, seed, alpha, scale) {
    return tex(w, h, (g) => {
      const r = mulberry(seed), id = g.createImageData(w, h);
      // value-noise fBm (tileable-ish)
      const gs = 64, grid = [...Array(gs * gs)].map(() => r());
      const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const a = grid[(yi % gs + gs) % gs * gs + (xi % gs + gs) % gs], b = grid[(yi % gs + gs) % gs * gs + ((xi + 1) % gs + gs) % gs], cc = grid[((yi + 1) % gs + gs) % gs * gs + (xi % gs + gs) % gs], d = grid[((yi + 1) % gs + gs) % gs * gs + ((xi + 1) % gs + gs) % gs]; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(a, b, u), lerp(cc, d, u), v); };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let n = 0, amp = .5, fr = scale; for (let o = 0; o < 4; o++) { n += amp * vn(x * fr, y * fr); amp *= .5; fr *= 2; } const i = (y * w + x) * 4; const v = n * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = alpha; }
      g.putImageData(id, 0, 0);
    });
  }
  const NOISE = noiseTex(256, 256, 5, 255, 1 / 16);
  const GRAINS = [0, 1, 2, 3, 4, 5].map(s => tex(540, 960, g => { const r = mulberry(100 + s), id = g.createImageData(540, 960); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - .5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }));
  function wallpaper(base, stripe, motif, seed) {
    return tex(200, 200, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.fillStyle = stripe; g.fillRect(0, 0, 14, h); g.fillRect(22, 0, 4, h); g.fillRect(100, 0, 14, h); g.fillRect(122, 0, 4, h);
      g.fillStyle = motif;
      for (const [cx, cy] of [[60, 50], [160, 150]]) { for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.beginPath(); g.ellipse(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 9, 5, a, 0, 7); g.fill(); } g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill(); g.fillRect(cx - 1.5, cy + 14, 3, 26); g.beginPath(); g.ellipse(cx + 7, cy + 30, 7, 3, -.6, 0, 7); g.fill(); }
      g.globalAlpha = .35; g.globalCompositeOperation = 'multiply'; g.drawImage(NOISE, 0, 0, w, h); g.drawImage(NOISE, -50, -80, w * 2, h * 2);
    });
  }
  const PAPER = { bed: wallpaper('#b89a84', '#a3826d', '#8f6e5e'), living: wallpaper('#a7a073', '#938a5e', '#7b7448'), hall: wallpaper('#bdb39a', '#b0a68c', '#a1977d') };
  const BRICK = tex(240, 160, (g, w, h) => { g.fillStyle = '#5e5650'; g.fillRect(0, 0, w, h); const r = mulberry(9); for (let row = 0; row < 8; row++) for (let k = -1; k < 5; k++) { const x = k * 60 + (row % 2) * 30, y = row * 20; const t = .75 + r() * .45; g.fillStyle = `rgb(${120 * t | 0},${62 * t | 0},${48 * t | 0})`; g.fillRect(x + 2, y + 2, 56, 16); } g.globalAlpha = .45; g.globalCompositeOperation = 'multiply'; g.drawImage(NOISE, 0, 0, w, h); });
  const pats = {};
  function pat(name, img) { return pats[name] || (pats[name] = c.createPattern(img, 'repeat')); }
  function wallPattern(img, name, wx0, wy1, z, tileM) { // pattern aligned to a wall plane parallel to screen
    const p = P(wx0, wy1, z), s = cam.f / p[2] * tileM / img.width; const pt = pat(name, img); pt.setTransform(new DOMMatrix([s, 0, 0, s, p[0], p[1]])); return pt;
  }
  // ---------- boxes ----------
  function rot(v, rx, ry, rz) { let [x, y, z] = v; let t; if (rx) { t = y * Math.cos(rx) - z * Math.sin(rx); z = y * Math.sin(rx) + z * Math.cos(rx); y = t; } if (ry) { t = x * Math.cos(ry) + z * Math.sin(ry); z = -x * Math.sin(ry) + z * Math.cos(ry); x = t; } if (rz) { t = x * Math.cos(rz) - y * Math.sin(rz); y = x * Math.sin(rz) + y * Math.cos(rz); x = t; } return [x, y, z]; }
  const FACES = [[[0, 1, 2, 3], [0, 0, -1]], [[5, 4, 7, 6], [0, 0, 1]], [[4, 0, 3, 7], [-1, 0, 0]], [[1, 5, 6, 2], [1, 0, 0]], [[3, 2, 6, 7], [0, 1, 0]], [[4, 5, 1, 0], [0, -1, 0]]];
  let LIGHT = [0, 2.4, 2];
  function box(cx, cy, cz, sx, sy, sz, col, o = {}) {
    const col3 = typeof col === 'string' ? hex(col) : col;
    const loc = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(v => { const r = rot([v[0] * sx / 2, v[1] * sy / 2, v[2] * sz / 2], o.rx || 0, o.ry || 0, o.rz || 0); return [r[0] + cx, r[1] + cy, r[2] + cz]; });
    for (const [idx, n0] of FACES) {
      const n = rot(n0, o.rx || 0, o.ry || 0, o.rz || 0);
      const fc = idx.reduce((a, i) => [a[0] + loc[i][0] / 4, a[1] + loc[i][1] / 4, a[2] + loc[i][2] / 4], [0, 0, 0]);
      const vd = [fc[0] - cam.x, fc[1] - cam.y, fc[2] - cam.z];
      if (n[0] * vd[0] + n[1] * vd[1] + n[2] * vd[2] >= 0) continue;
      const L = [LIGHT[0] - fc[0], LIGHT[1] - fc[1], LIGHT[2] - fc[2]], ll = Math.hypot(...L) || 1;
      const k = .45 + .75 * Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / ll) + (n[1] > .5 ? .1 : 0);
      poly(idx.map(i => loc[i]), rgb(col3, k * (o.k || 1)), o.edge ? rgb(col3, k * 1.25) : null, 1);
    }
    return loc;
  }
  function softShadow(x, z, rx, rz, a = .55, y = 0.005) {
    const p = P(x, y, z), q = P(x + rx, y, z), r = P(x, y, z + rz); const sx = Math.abs(q[0] - p[0]), sy = Math.max(2, Math.abs(r[1] - p[1]));
    c.save(); c.filter = `blur(${Math.max(2, sx * .18)}px)`; c.fillStyle = `rgba(0,0,0,${a})`; c.beginPath(); c.ellipse(p[0], p[1], sx, sy, 0, 0, 7); c.fill(); c.restore();
  }
  // ---------- room ----------
  function room(R) {
    const { w, h, zb } = R, zf = cam.z - 0.5, x0 = -w / 2, x1 = w / 2;
    const floor3 = hex(R.floor || '#6b4a30'), wall3 = hex(R.side || '#a08a72');
    // ceiling
    poly([[x0, h, zf], [x1, h, zf], [x1, h, zb], [x0, h, zb]], rgb(hex(R.ceil || '#8f877a')));
    // back wall
    const p0 = P(x0, h, zb), p1 = P(x1, 0, zb); c.fillStyle = wallPattern(R.paper, R.paperName, x0, h, zb, .5); c.fillRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
    // side walls with stripes
    for (const sx of [x0, x1]) {
      poly([[sx, 0, zf], [sx, h, zf], [sx, h, zb], [sx, 0, zb]], rgb(wall3, .82));
      for (let z = Math.ceil(zf / .25) * .25; z < zb; z += .25) { line3([sx, 0, z], [sx, h, z], rgb(wall3, .7), .035); line3([sx, 0, z + .055], [sx, h, z + .055], rgb(wall3, .72), .01); }
    }
    // stains / age
    const r = mulberry(R.seed || 3);
    for (let i = 0; i < 5; i++) { const sx = lerp(x0, x1, r()), sy = lerp(h * .55, h, r()), q = P(sx, sy, zb); const rr = cam.f * (.2 + r() * .5) / q[2]; const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); g.addColorStop(0, 'rgba(60,45,25,.22)'); g.addColorStop(1, 'rgba(60,45,25,0)'); c.fillStyle = g; c.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2); }
    // floor boards
    const bw = .13; let bi = 0;
    for (let x = x0; x < x1 - 1e-6; x += bw, bi++) {
      let z = zf - hash(bi, 1) * 1.5;
      for (let s = 0; z < zb; s++) { const len = .9 + hash(bi, s + 7) * 1.6; const z2 = Math.min(zb, z + len); const t = .78 + hash(bi, s) * .4;
        poly([[x, 0, Math.max(z, zf)], [x + bw, 0, Math.max(z, zf)], [x + bw, 0, z2], [x, 0, z2]], rgb(floor3, t), 'rgba(0,0,0,.55)', 1);
        line3([x + bw * .35, 0.001, Math.max(z, zf)], [x + bw * .4, 0.001, z2], rgb(floor3, t * .82), .006);
        z = z2; }
    }
    if (R.rug) { const [ux0, ux1, uz0, uz1] = R.rug; poly([[ux0, .006, uz0], [ux1, .006, uz0], [ux1, .006, uz1], [ux0, .006, uz1]], '#5a1f1c'); poly([[ux0 + .08, .007, uz0 + .08], [ux1 - .08, .007, uz0 + .08], [ux1 - .08, .007, uz1 - .08], [ux0 + .08, .007, uz1 - .08]], null, '#b08a45', 2); poly([[ux0 + .2, .007, uz0 + .2], [ux1 - .2, .007, uz0 + .2], [ux1 - .2, .007, uz1 - .2], [ux0 + .2, .007, uz1 - .2]], '#3e2a40', '#9a7a3a', 1.5); }
    // skirting + cornice
    const sk = '#cfc6b0';
    poly([[x0, 0, zb], [x1, 0, zb], [x1, .14, zb], [x0, .14, zb]], sk);
    for (const sx of [x0, x1]) { poly([[sx, 0, zf], [sx, .14, zf], [sx, .14, zb], [sx, 0, zb]], rgb(hex(sk), .8)); poly([[sx, h - .1, zf], [sx, h, zf], [sx, h, zb], [sx, h - .1, zb]], rgb(hex(sk), .75)); }
    poly([[x0, h - .1, zb], [x1, h - .1, zb], [x1, h, zb], [x0, h, zb]], sk);
    // ambient occlusion along seams
    aoLine([x0, 0, zb], [x1, 0, zb], .25); aoLine([x0, 0, zf], [x0, 0, zb], .2); aoLine([x1, 0, zf], [x1, 0, zb], .2); aoLine([x0, h, zb], [x1, h, zb], .2);
    aoLine([x0, 0, zb], [x0, h, zb], .25); aoLine([x1, 0, zb], [x1, h, zb], .25);
  }
  function aoLine(a, b, wM) { const p = P(...a), q = P(...b); c.save(); c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = Math.max(4, cam.f * wM / ((p[2] + q[2]) / 2)); c.filter = `blur(${c.lineWidth * .5}px)`; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); c.restore(); }
  function windowBack(x0, x1, y0, y1, z, T, o = {}) {
    poly([[x0 - .1, y0 - .1, z], [x1 + .1, y0 - .1, z], [x1 + .1, y1 + .1, z], [x0 - .1, y1 + .1, z]], '#d9d2c0');
    const p = P(x0, y1, z), q = P(x1, y0, z); const g = c.createLinearGradient(0, p[1], 0, q[1]); g.addColorStop(0, '#1c2a44'); g.addColorStop(1, '#0b1220'); c.fillStyle = g; c.fillRect(p[0], p[1], q[0] - p[0], q[1] - p[1]);
    if (o.moon) { const m = [lerp(p[0], q[0], .7), lerp(p[1], q[1], .25)], rr = (q[0] - p[0]) * .09; const mg = c.createRadialGradient(m[0], m[1], 0, m[0], m[1], rr * 5); mg.addColorStop(0, 'rgba(220,230,255,.9)'); mg.addColorStop(.2, 'rgba(160,180,220,.35)'); mg.addColorStop(1, 'rgba(160,180,220,0)'); c.fillStyle = mg; c.fillRect(m[0] - rr * 5, m[1] - rr * 5, rr * 10, rr * 10); }
    if (o.fig) { c.save(); c.globalAlpha = o.fig; figure('man', (x0 + x1) / 2, y0 - .9, z + .3, 1.75, { fill: '#000' }); c.restore(); }
    const bar = '#e3dccb'; line3([(x0 + x1) / 2, y0, z], [(x0 + x1) / 2, y1, z], bar, .05); line3([x0, (y0 + y1) / 2, z], [x1, (y0 + y1) / 2, z], bar, .06);
    // net curtain
    c.fillStyle = 'rgba(220,225,235,.12)'; c.fillRect(p[0], p[1], q[0] - p[0], q[1] - p[1]);
    for (let k = 0; k < 14; k++) { const xx = lerp(x0, x1, k / 14); line3([xx, y0, z - .01], [xx + .01 * Math.sin(T + k), y1, z - .01], 'rgba(230,235,245,.08)', .03); }
    // heavy curtains
    for (const [a, b] of [[x0 - .45, x0 + .05], [x1 - .05, x1 + .45]]) { for (let k = 0; k < 8; k++) { const xa = lerp(a, b, k / 8), xb = lerp(a, b, (k + 1) / 8); poly([[xa, y0 - .5, z - .05], [xb, y0 - .5, z - .05], [xb, y1 + .25, z - .05], [xa, y1 + .25, z - .05]], rgb([110, 40, 38], k % 2 ? .6 : .9)); } }
  }
  // ---------- figures (2D silhouettes, unit height, y up) ----------
  const FIG = {
    girl(g) { g.ellipse(0, .885, .075, .088, 0, 0, 7); g.moveTo(-.078, .9); g.bezierCurveTo(-.095, .8, -.105, .7, -.11, .6); g.lineTo(.11, .6); g.bezierCurveTo(.105, .7, .095, .8, .078, .9); g.closePath();
      g.moveTo(-.05, .79); g.bezierCurveTo(-.13, .78, -.155, .745, -.16, .68); g.bezierCurveTo(-.17, .55, -.165, .4, -.2, .09); g.lineTo(.2, .09); g.bezierCurveTo(.165, .4, .17, .55, .16, .68); g.bezierCurveTo(.155, .745, .13, .78, .05, .79); g.closePath();
      g.moveTo(-.16, .68); g.bezierCurveTo(-.195, .55, -.2, .45, -.19, .37); g.lineTo(-.163, .37); g.bezierCurveTo(-.17, .48, -.16, .58, -.14, .66); g.closePath();
      g.moveTo(.16, .68); g.bezierCurveTo(.195, .55, .2, .45, .19, .37); g.lineTo(.163, .37); g.bezierCurveTo(.17, .48, .16, .58, .14, .66); g.closePath();
      g.rect(-.085, 0, .045, .1); g.rect(.04, 0, .045, .1); },
    man(g) { g.ellipse(.015, .9, .07, .085, 0, 0, 7); g.ellipse(-.058, .89, .016, .026, 0, 0, 7); g.ellipse(.088, .89, .016, .026, 0, 0, 7); g.rect(-.035, .78, .08, .06);
      g.moveTo(-.05, .815); g.bezierCurveTo(-.16, .805, -.225, .765, -.235, .68); g.bezierCurveTo(-.245, .6, -.225, .5, -.205, .42); g.lineTo(.205, .42); g.bezierCurveTo(.225, .5, .245, .6, .235, .68); g.bezierCurveTo(.225, .765, .16, .805, .05, .815); g.closePath();
      g.moveTo(-.235, .68); g.bezierCurveTo(-.265, .55, -.265, .45, -.245, .36); g.lineTo(-.205, .35); g.bezierCurveTo(-.215, .45, -.205, .55, -.195, .62); g.closePath();
      g.moveTo(.235, .68); g.bezierCurveTo(.265, .55, .265, .45, .245, .36); g.lineTo(.205, .35); g.bezierCurveTo(.215, .45, .205, .55, .195, .62); g.closePath();
      g.ellipse(-.228, .335, .025, .035, 0, 0, 7); g.ellipse(.228, .335, .025, .035, 0, 0, 7);
      g.moveTo(-.155, .43); g.lineTo(-.135, .02); g.lineTo(-.03, .02); g.lineTo(-.008, .37); g.lineTo(.008, .37); g.lineTo(.03, .02); g.lineTo(.135, .02); g.lineTo(.155, .43); g.closePath();
      g.ellipse(-.085, .015, .065, .02, 0, 0, 7); g.ellipse(.085, .015, .065, .02, 0, 0, 7); },
    manSit(g) { g.ellipse(.0, .9, .07, .085, 0, 0, 7); g.ellipse(-.07, .89, .016, .026, 0, 0, 7); g.ellipse(.07, .89, .016, .026, 0, 0, 7); g.rect(-.04, .78, .08, .06);
      g.moveTo(-.05, .815); g.bezierCurveTo(-.17, .8, -.24, .76, -.25, .67); g.bezierCurveTo(-.26, .6, -.25, .52, -.24, .47); g.lineTo(.24, .47); g.bezierCurveTo(.25, .52, .26, .6, .25, .67); g.bezierCurveTo(.24, .76, .17, .8, .05, .815); g.closePath();
      g.ellipse(-.11, .46, .11, .07, 0, 0, 7); g.ellipse(.11, .46, .11, .07, 0, 0, 7); g.rect(-.19, .03, .09, .42); g.rect(.1, .03, .09, .42); g.ellipse(-.15, .02, .07, .025, 0, 0, 7); g.ellipse(.15, .02, .07, .025, 0, 0, 7);
      g.ellipse(-.27, .5, .04, .1, .2, 0, 7); g.ellipse(.27, .5, .04, .1, -.2, 0, 7); },
    wpc(g) { g.ellipse(0, .955, .058, .042, 0, 0, 7); g.rect(-.085, .922, .17, .016); g.ellipse(0, .885, .06, .074, 0, 0, 7); g.rect(-.03, .79, .06, .05);
      g.moveTo(-.05, .815); g.bezierCurveTo(-.14, .805, -.17, .77, -.18, .7); g.bezierCurveTo(-.19, .62, -.15, .56, -.148, .5); g.bezierCurveTo(-.158, .46, -.17, .43, -.172, .4); g.lineTo(.172, .4); g.bezierCurveTo(.17, .43, .158, .46, .148, .5); g.bezierCurveTo(.15, .56, .19, .62, .18, .7); g.bezierCurveTo(.17, .77, .14, .805, .05, .815); g.closePath();
      g.moveTo(-.15, .41); g.lineTo(-.162, .23); g.lineTo(.162, .23); g.lineTo(.15, .41); g.closePath(); g.rect(-.08, .02, .036, .22); g.rect(.044, .02, .036, .22); g.ellipse(-.062, .015, .04, .016, 0, 0, 7); g.ellipse(.062, .015, .04, .016, 0, 0, 7);
      g.moveTo(-.18, .7); g.bezierCurveTo(-.205, .58, -.2, .47, -.19, .4); g.lineTo(-.16, .4); g.bezierCurveTo(-.17, .5, -.165, .6, -.15, .67); g.closePath(); g.moveTo(.18, .7); g.bezierCurveTo(.205, .58, .2, .47, .19, .4); g.lineTo(.16, .4); g.bezierCurveTo(.17, .5, .165, .6, .15, .67); g.closePath(); g.rect(.1, .74, .05, .07); },
    sitProfile(g) { g.ellipse(.06, .9, .068, .078, 0, 0, 7); g.moveTo(.12, .9); g.lineTo(.145, .875); g.lineTo(.12, .86); g.moveTo(0, .83); g.bezierCurveTo(-.09, .8, -.11, .62, -.09, .45); g.lineTo(.1, .45); g.bezierCurveTo(.12, .6, .12, .75, .07, .83); g.closePath(); g.rect(-.06, .38, .36, .09); g.rect(.22, .03, .085, .4); g.ellipse(.29, .02, .07, .022, 0, 0, 7);
      g.moveTo(.04, .76); g.lineTo(.1, .76); g.lineTo(.12, .58); g.lineTo(.32, .6); g.lineTo(.32, .55); g.lineTo(.07, .53); g.closePath(); }
  };
  function figure(type, x, y, z, hM, o = {}) {
    const p = P(x, y, z); const s = cam.f * hM / p[2];
    c.save(); c.translate(p[0], p[1]); c.scale(o.flip ? -s : s, -s);
    if (o.rim) { c.save(); c.translate(o.rim[0] / s, -o.rim[1] / s); c.beginPath(); FIG[type](c); c.fillStyle = o.rim[2]; c.fill(); c.restore(); }
    c.beginPath(); FIG[type](c); c.fillStyle = o.fill || '#050505'; c.fill(); c.restore();
  }
  function wallShadow(type, x, y, z, hM, alpha, blur) { const p = P(x, y, z); const s = cam.f * hM / p[2]; c.save(); c.filter = `blur(${blur || s * .012}px)`; c.globalAlpha = alpha; c.translate(p[0], p[1]); c.scale(s, -s); c.beginPath(); FIG[type](c); c.fillStyle = '#000'; c.fill(); c.restore(); }
  // profile head close-up (screen space), facing right
  function profileHead(x, y, s, o = {}) {
    const path = g => { g.moveTo(30, 0); g.bezierCurveTo(55, -5, 75, 5, 80, 25); g.lineTo(82, 38); g.lineTo(80, 43); g.bezierCurveTo(84, 48, 90, 56, 92, 61); g.lineTo(85, 64); g.lineTo(84, 67); g.bezierCurveTo(87, 69, 88, 71, 85, 72.5); g.bezierCurveTo(83, 73, 85, 75, 86, 77); g.bezierCurveTo(84, 79, 82, 80, 82, 82); g.bezierCurveTo(85, 86, 82, 92, 76, 93); g.bezierCurveTo(70, 95, 68, 100, 68, 112); g.bezierCurveTo(68, 125, 74, 135, 90, 150); g.lineTo(-30, 150); g.bezierCurveTo(-20, 120, -12, 90, -8, 60); g.bezierCurveTo(-5, 25, 5, 3, 30, 0); g.closePath(); };
    c.save(); c.translate(x, y); c.scale(s, s);
    if (o.rim) { c.save(); c.translate(o.rim[0], o.rim[1]); c.beginPath(); path(c); c.fillStyle = o.rim[2]; c.fill(); c.restore(); }
    c.beginPath(); path(c); c.fillStyle = '#040404'; c.fill();
    // stray hair strands
    c.strokeStyle = 'rgba(0,0,0,.9)'; c.lineWidth = .6; for (let k = 0; k < 18; k++) { c.beginPath(); c.moveTo(10 + k * 2, 2 + k * .3); c.quadraticCurveTo(-10 - k * 1.5, 60 + k * 3, -25 - k, 140 + k * 2); c.stroke(); }
    c.restore();
  }
  // ---------- furniture ----------
  function bed(x, z, j = 0, o = {}) { // headboard at z+1, foot toward camera; x = centre
    const X = x + j; softShadow(X, z + .5, .7, .9, .6);
    box(X - .48, .2, z - .45, .06, .4, .06, '#4b3424'); box(X + .48, .2, z - .45, .06, .4, .06, '#4b3424');
    box(X, .3, z + .5, 1.02, .2, 2.0, '#4b3424');
    box(X, .47, z + .5, .96, .16, 1.94, '#cfc8bb');
    box(X, .565, z + .25, 1.0, .05, 1.5, o.blanket || '#7a4b3d', { rx: 0 });
    box(X - .505, .43, z + .25, .02, .23, 1.5, o.blanket || '#7a4b3d');
    box(X + .505, .43, z + .25, .02, .23, 1.5, o.blanket || '#7a4b3d');
    box(X, .62, z + 1.25, .7, .1, .35, '#e6e0d4');
    box(X, .62, z + 1.52, 1.08, 1.24, .06, '#4b3424');
    for (let k = -2; k <= 2; k++) box(X + k * .17, .78, z + 1.48, .04, .5, .03, '#5d4330');
  }
  function chair(x, z, ry = 0, o = {}) {
    const col = o.col || '#6e4b2e'; softShadow(x, z, .3, .3, .5);
    const R = (dx, dz) => { const r = rot([dx, 0, dz], 0, ry, 0); return [x + r[0], z + r[2]]; };
    for (const [dx, dz] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) { const [a, b] = R(dx, dz); box(a, .22, b, .04, .44, .04, col, { ry }); }
    const [sx, sz] = R(0, 0); box(sx, .46, sz, .46, .04, .46, col, { ry });
    for (const dx of [-.2, .2]) { const [a, b] = R(dx, .21); box(a, .72, b, .04, .52, .04, col, { ry }); }
    for (const yy of [.62, .78, .94]) { const [a, b] = R(0, .21); box(a, yy, b, .42, .06, .025, col, { ry }); }
  }
  function dresser(x, z, open = [0, 0, 0]) { // against right wall, front faces -x
    softShadow(x, z, .35, .6, .5);
    box(x + .1, .5, z, .45, 1.0, 1.1, '#5a3d27');
    for (let d = 0; d < 3; d++) { const y = .2 + d * .3; box(x - .13 - open[d], y, z, .05 + open[d] * 2 * 0 + .02, .26, 1.0, '#6b4a30'); box(x - .16 - open[d], y, z, .03, .04, .16, '#c9a35a'); }
    box(x + .1, 1.02, z, .5, .04, 1.16, '#4a3020');
  }
  function lampTable(x, z, on, sw = 0) {
    box(x, .3, z, .45, .6, .45, '#4e3523'); box(x, .63, z, .06, .06, .06, '#8d7a5c');
    box(x, .74, z, .03, .22, .03, '#a08a62');
    const top = .98, bot = .82, rT = .11, rB = .19; const ptsB = [], ptsT = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI * 2; ptsB.push([x + Math.cos(a) * rB, bot, z + Math.sin(a) * rB]); ptsT.push([x + Math.cos(a) * rT, top, z + Math.sin(a) * rT]); }
    const sp = ptsB.map(p => P(...p)), tp = ptsT.map(p => P(...p)); const minX = Math.min(...sp.map(p => p[0])), maxX = Math.max(...sp.map(p => p[0]));
    c.beginPath(); c.moveTo(Math.min(...tp.map(p => p[0])), tp[0][1]); c.lineTo(Math.max(...tp.map(p => p[0])), tp[0][1]); c.lineTo(maxX, sp[0][1]); c.lineTo(minX, sp[0][1]); c.closePath();
    const g = c.createLinearGradient(minX, 0, maxX, 0); g.addColorStop(0, on ? '#c9a15f' : '#6e604c'); g.addColorStop(.5, on ? '#ffe2a8' : '#8d7c62'); g.addColorStop(1, on ? '#b88e4e' : '#5f523f'); c.fillStyle = g; c.fill();
  }
  function armchair(x, z, ry = 0, col = '#6a2f26') {
    softShadow(x, z, .55, .5, .6);
    box(x, .25, z, .9, .3, .85, col); box(x, .44, z - .02, .7, .12, .7, rgb(hex(col), 1.1));
    box(x, .75, z + .36, .9, .75, .18, col, { k: .95 }); box(x - .4, .5, z, .14, .35, .85, col, { k: 1.05 }); box(x + .4, .5, z, .14, .35, .85, col, { k: 1.05 });
    box(x - .38, .05, z - .35, .06, .1, .06, '#2a1a10'); box(x + .38, .05, z - .35, .06, .1, .06, '#2a1a10');
    // button tufts
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const q = P(x - .25 + i * .25, .6 + j * .25, z + .265); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(q[0], q[1], cam.f * .012 / q[2], 0, 7); c.fill(); }
  }
  function recorder(x, y, z, T, spin = 1) {
    box(x, y + .06, z, .6, .12, .4, '#3a3632'); box(x, y + .125, z, .56, .01, .36, '#1e1c1a');
    for (const dx of [-.15, .15]) { const ctr = [x + dx, y + .14, z + .03]; const pts = []; for (let k = 0; k <= 24; k++) { const a = k / 24 * 6.283; pts.push([ctr[0] + Math.cos(a) * .12, ctr[1], ctr[2] + Math.sin(a) * .12]); } poly(pts, '#151413', '#555', 1); for (let s = 0; s < 3; s++) { const a = T * 4 * spin + s * 2.094; line3(ctr, [ctr[0] + Math.cos(a) * .1, ctr[1] + .001, ctr[2] + Math.sin(a) * .1], '#8a857c', .012); } const cp = P(...ctr); c.fillStyle = '#bbb'; c.beginPath(); c.arc(cp[0], cp[1], cam.f * .015 / cp[2], 0, 7); c.fill(); }
    line3([x - .15, y + .141, z - .09], [x + .15, y + .141, z - .09], '#5a3a20', .006);
    for (let b = 0; b < 5; b++) box(x - .2 + b * .1, y + .02, z - .2, .07, .03, .02, '#7a756c');
    const lamp = P(x + .24, y + .1, z - .2); c.fillStyle = Math.sin(T * 6) > 0 ? '#ff3a2a' : '#5a1210'; c.beginPath(); c.arc(lamp[0], lamp[1], cam.f * .01 / lamp[2], 0, 7); c.fill();
  }
  // ---------- exterior ----------
  function skyNight(T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1222'); g.addColorStop(.55, '#1c2a40'); g.addColorStop(1, '#0b0f18'); c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400);
    const m = [W * .74, H * .16]; const mg = c.createRadialGradient(...m, 0, ...m, 420); mg.addColorStop(0, 'rgba(200,215,240,.5)'); mg.addColorStop(.12, 'rgba(160,180,215,.2)'); mg.addColorStop(1, 'rgba(160,180,215,0)'); c.fillStyle = mg; c.fillRect(0, 0, W, H); c.fillStyle = '#e4e9f2'; c.beginPath(); c.arc(...m, 46, 0, 7); c.fill();
    // moving clouds (noise texture)
    c.save(); c.globalAlpha = .55; c.globalCompositeOperation = 'multiply'; const pt = pat('cloud', NOISE); pt.setTransform(new DOMMatrix([5, 0, 0, 2.2, -T * 30, 0])); c.fillStyle = pt; c.fillRect(0, 0, W, H * .6); c.restore();
    c.save(); c.globalAlpha = .18; c.globalCompositeOperation = 'screen'; const pt2 = pat('cloud2', NOISE); pt2.setTransform(new DOMMatrix([7, 0, 0, 3, -T * 18 + 300, 100])); c.fillStyle = pt2; c.fillRect(0, 0, W, H * .6); c.restore(); }
  function houseFront(x, z, o = {}, T = 0) { // semi-detached pair facing camera, centre x, facade plane z; width 9.6
    const w = 4.8;
    for (const side of [-1, 1]) {
      const hx = x + side * w / 2, xl = hx - w / 2, xr = hx + w / 2;
      const p0 = P(xl, 5.4, z), p1 = P(xr, 0, z); c.fillStyle = wallPattern(BRICK, 'brick', xl, 5.4, z, 1.2); c.fillRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
      // pebble-dash upper band
      poly([[xl, 2.9, z - .01], [xr, 2.9, z - .01], [xr, 5.4, z - .01], [xl, 5.4, z - .01]], 'rgba(170,165,150,.55)');
      // roof (hip) and chimney
      poly([[xl - .3, 5.4, z - .3], [xr + .3, 5.4, z - .3], [xr - .6, 7.6, z + 2.5], [xl + .6, 7.6, z + 2.5]], '#262a31');
      for (let k = 1; k < 10; k++) { const yy = 5.4 + k * .22, zz = z - .3 + k * .28; line3([xl - .3 + k * .09, yy, zz], [xr + .3 - k * .09, yy, zz], 'rgba(0,0,0,.35)', .02); }
      box(hx + side * 1.6, 7.6, z + 2.0, .7, 1.6, .6, '#5a3328'); box(hx + side * 1.6, 8.45, z + 2.0, .8, .1, .7, '#4a2a20');
      // bay window ground floor
      const bx = hx - side * .9; box(bx, 1.35, z - .45, 1.9, 2.3, .9, '#5c3a2e', { k: .9 });
      const bp0 = P(bx - .75, 2.2, z - .91), bp1 = P(bx + .75, .7, z - .91); const lit0 = o.litDown || 0; c.fillStyle = lit0 ? rgb([230, 160, 80], .7 * lit0 + .2) : '#121a28'; c.fillRect(bp0[0], bp0[1], bp1[0] - bp0[0], bp1[1] - bp0[1]);
      line3([bx, .7, z - .92], [bx, 2.2, z - .92], '#ddd6c6', .05); line3([bx - .75, 1.85, z - .92], [bx + .75, 1.85, z - .92], '#ddd6c6', .04);
      // door with porch
      const dx = hx + side * 1.3; poly([[dx - .45, 0, z - .02], [dx + .45, 0, z - .02], [dx + .45, 2.1, z - .02], [dx - .45, 2.1, z - .02]], '#20252c'); poly([[dx - .4, .05, z - .03], [dx + .4, .05, z - .03], [dx + .4, 2.05, z - .03], [dx - .4, 2.05, z - .03]], side < 0 ? '#3d1d1a' : '#1c2a22'); box(dx, 2.3, z - .35, 1.3, .1, .7, '#c9c2b2');
      const fan = P(dx, 1.85, z - .04); c.fillStyle = 'rgba(230,170,90,.35)'; c.beginPath(); c.arc(fan[0], fan[1], cam.f * .25 / fan[2], Math.PI, 0); c.fill();
      // upstairs windows
      for (const [wx, ww] of [[hx - side * .9, 1.6], [hx + side * 1.3, .7]]) { const isHero = side < 0 && ww > 1; const lit = isHero ? (o.lit || 0) : 0; const q0 = P(wx - ww / 2, 4.6, z - .02), q1 = P(wx + ww / 2, 3.3, z - .02);
        c.fillStyle = '#d6cfbf'; c.fillRect(q0[0] - 8, q0[1] - 8, q1[0] - q0[0] + 16, q1[1] - q0[1] + 16);
        if (lit > 0) { const fl = lit * (.85 + .15 * Math.sin(T * 21) * Math.sin(T * 7.7)); const g = c.createLinearGradient(0, q0[1], 0, q1[1]); g.addColorStop(0, rgb([255, 196, 110], fl)); g.addColorStop(1, rgb([190, 100, 45], fl)); c.fillStyle = g; } else c.fillStyle = '#0f1724';
        c.fillRect(q0[0], q0[1], q1[0] - q0[0], q1[1] - q0[1]);
        if (isHero && lit > 0) { c.save(); c.beginPath(); c.rect(q0[0], q0[1], q1[0] - q0[0], q1[1] - q0[1]); c.clip(); if (o.kids) { figure('girl', wx - .3 + Math.sin(T * 9) * .03, 3.0, z + .5, 1.3, { fill: 'rgba(10,6,4,.92)' }); figure('girl', wx + .35 + Math.sin(T * 8 + 1) * .03, 3.0, z + .6, 1.45, { fill: 'rgba(10,6,4,.92)' }); } if (o.fig) { c.globalAlpha = o.fig; figure('man', wx, 2.75, z + .4, 1.8, { fill: '#000' }); } c.restore(); }
        line3([wx, 3.3, z - .03], [wx, 4.6, z - .03], '#e0d9c9', .05); line3([wx - ww / 2, 4.15, z - .03], [wx + ww / 2, 4.15, z - .03], '#e0d9c9', .04); }
    }
    // party line + garden wall + hedge + path
    line3([x, 0, z - .03], [x, 5.4, z - .03], 'rgba(0,0,0,.4)', .05);
    box(x - 2.6, .35, z - 4, 4.4, .7, .25, '#4a3a33'); box(x + 2.6, .35, z - 4, 4.4, .7, .25, '#4a3a33');
    const r = mulberry(4); for (let i = 0; i < 60; i++) { const hx = x - 4.8 + r() * 9.6; if (Math.abs(hx - x + 1.3) < .6 || Math.abs(hx - x - 1.3) < .6) continue; const q = P(hx, .9 + r() * .3, z - 3.7); c.fillStyle = `rgba(${12 + r() * 10 | 0},${22 + r() * 14 | 0},${16 + r() * 8 | 0},.95)`; c.beginPath(); c.arc(q[0], q[1], cam.f * (.18 + r() * .15) / q[2], 0, 7); c.fill(); }
  }
  function streetGround(zFar) { poly([[-30, 0, cam.z + .3], [30, 0, cam.z + .3], [30, 0, zFar], [-30, 0, zFar]], '#14171c'); poly([[-30, .12, cam.z + .3], [-4, .12, cam.z + .3], [-4, .12, zFar], [-30, .12, zFar]], '#262a30'); poly([[4, .12, cam.z + .3], [30, .12, cam.z + .3], [30, .12, zFar], [4, .12, zFar]], '#262a30'); for (let z = Math.ceil(cam.z); z < zFar; z += 3) line3([0, .01, z], [0, .01, z + 1.4], 'rgba(200,200,190,.25)', .1); }
  function streetLamp(x, z, T) { box(x, 3, z, .12, 6, .12, '#1a1c20'); box(x - (x > 0 ? .4 : -.4), 6, z, .9, .08, .1, '#1a1c20'); }
  function lampGlow(x, y, z, col, s = 1, a = 1) { const q = P(x, y, z); const rr = cam.f * 1.2 * s / q[2]; const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); g.addColorStop(0, rgb(col, 1, .95 * a)); g.addColorStop(.06, rgb(col, 1, .55 * a)); g.addColorStop(.35, rgb(col, 1, .12 * a)); g.addColorStop(1, rgb(col, 1, 0)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2); c.restore(); }
  function puddleReflect(x, y, z, col, a = .35) { const q = P(x, 0, z), top = P(x, y, z); const len = Math.abs(top[1] - q[1]) * .9; const wd = cam.f * .18 / q[2]; const g = c.createLinearGradient(0, q[1], 0, q[1] + len); g.addColorStop(0, rgb(col, 1, a)); g.addColorStop(1, rgb(col, 1, 0)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(q[0] - wd / 2, q[1], wd, len); c.restore(); }
  const RAIN = [...Array(700)].map((_, i) => [hash(i, 1) * 16 - 8, hash(i, 2) * 10, hash(i, 3) * 22 + .6, hash(i, 4)]);
  function rain(T, a = 1) { c.save(); c.globalCompositeOperation = 'lighter'; for (const r of RAIN) { const z = cam.z + r[2]; const y = ((r[1] - T * 9 - r[3] * 3) % 10 + 10) % 10 - 1 + cam.y - 4; const x = r[0] + cam.x; const p = P(x, y, z), q = P(x - .02, y + .32, z); c.strokeStyle = `rgba(190,205,230,${a * clamp(.5 - r[2] / 50)})`; c.lineWidth = Math.max(.7, 9 / r[2]); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); } c.restore(); }
  const FOGB = [...Array(30)].map((_, i) => [hash(i, 11) * 30 - 15, hash(i, 12) * 2, hash(i, 13) * 30 + 3, hash(i, 14) * 3 + 2]);
  function fog(T, a = 1, col = [140, 155, 180]) { for (const f of FOGB) { const x = ((f[0] + T * .4 + 15) % 30) - 15; const q = P(x, f[1], cam.z + f[2]); const rr = cam.f * f[3] / q[2]; const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); g.addColorStop(0, rgb(col, 1, .09 * a)); g.addColorStop(1, rgb(col, 1, 0)); c.fillStyle = g; c.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2); } }
  const DUST = [...Array(160)].map((_, i) => [hash(i, 21) * 4 - 2, hash(i, 22) * 2.6, hash(i, 23) * 5 + .5, hash(i, 24)]);
  function dust(T, a = 1) { c.save(); c.globalCompositeOperation = 'lighter'; for (const d of DUST) { const x = d[0] + Math.sin(T * .3 + d[3] * 9) * .2, y = (d[1] + T * .03 * (d[3] - .5) + 2.6) % 2.6, z = d[2] + cam.z * 0; const q = P(x, y, z); if (q[2] < .2) continue; const rr = Math.max(.8, cam.f * .004 / q[2]); c.fillStyle = `rgba(255,235,200,${a * .28 * (.4 + .6 * Math.sin(T * 2 + d[3] * 20) ** 2)})`; c.beginPath(); c.arc(q[0], q[1], rr, 0, 7); c.fill(); } c.restore(); }
  // ---------- lighting ----------
  const LM = document.createElement('canvas'); LM.width = 270; LM.height = 480; const lg = LM.getContext('2d');
  function lightPass(amb, lights) {
    lg.globalCompositeOperation = 'source-over'; lg.fillStyle = rgb(amb); lg.fillRect(0, 0, 270, 480); lg.globalCompositeOperation = 'lighter';
    for (const L of lights) { const q = P(L.x, L.y, L.z); const rr = L.r * cam.f / Math.max(q[2], .6) / 4; const x = q[0] / 4, y = q[1] / 4; const g = lg.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, rgb(L.col, L.i)); g.addColorStop(.35, rgb(L.col, L.i * .55)); g.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = g; lg.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(LM, 0, 0, W, H); c.restore();
  }
  function shaft(win, floor, a = .12) { // win: 4 world pts, floor: 4 world pts
    const ws = win.map(p => P(...p)), fs = floor.map(p => P(...p)); c.save(); c.globalCompositeOperation = 'lighter'; c.filter = 'blur(18px)';
    const g = c.createLinearGradient(ws[0][0], ws[0][1], fs[2][0], fs[2][1]); g.addColorStop(0, `rgba(150,175,225,${a})`); g.addColorStop(1, `rgba(150,175,225,${a * .25})`); c.fillStyle = g;
    for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0]]) { c.beginPath(); c.moveTo(...ws[i].slice(0, 2)); c.lineTo(...ws[j].slice(0, 2)); c.lineTo(...fs[j].slice(0, 2)); c.lineTo(...fs[i].slice(0, 2)); c.closePath(); c.fill(); }
    c.fillStyle = `rgba(150,175,225,${a * 1.6})`; c.beginPath(); fs.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.fill(); c.restore();
  }
  // ---------- post ----------
  const BL = document.createElement('canvas'); BL.width = 135; BL.height = 240; const bg = BL.getContext('2d');
  function post(T, fr, o) {
    // bloom
    bg.filter = 'none'; bg.globalCompositeOperation = 'source-over'; bg.clearRect(0, 0, 135, 240); bg.drawImage(cv, 0, 0, 135, 240);
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = .55; c.filter = 'blur(10px)'; c.drawImage(BL, 0, 0, W, H); c.restore();
    // grade: teal shadows
    c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(20,55,75,.55)'; c.fillRect(0, 0, W, H); c.restore();
    // vignette
    const vg = c.createRadialGradient(W / 2, H * .46, H * .22, W / 2, H * .5, H * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.9)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // flicker
    const fl = hash(fr, 7); c.fillStyle = `rgba(0,0,0,${fl < .05 ? .3 : fl * .06})`; c.fillRect(0, 0, W, H);
    // grain
    c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .35; c.drawImage(GRAINS[fr % 6], 0, 0, W, H); c.restore();
    if (hash(fr, 9) < .25) { c.fillStyle = 'rgba(230,225,210,.10)'; c.fillRect(hash(fr, 10) * W, 0, 1.5, H); }
  }
  window.ENG = { W, H, c, cam, P, poly, box, line3, room, windowBack, figure, wallShadow, profileHead, bed, chair, dresser, lampTable, armchair, recorder, skyNight, houseFront, streetGround, streetLamp, lampGlow, puddleReflect, rain, fog, dust, lightPass, shaft, post, softShadow, PAPER, clamp, lerp, ease, hash, pulse, rgb, hex, setLight: l => { LIGHT = l; } };
})();
