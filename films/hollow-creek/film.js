// HOLLOW CREEK TALES, Part 1, opening (test, 17.5 s): far push to a 90s comic on a table, the cover opens to the white
// title page, the page turns (camera eases back), push to page 1, hold, fast push into panel 1, slow push inside it.
// Contract: window.total, window.renderAt(t, n). Everything is a pure function of t.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { W, H, lerp, seg, smooth, easeInOut, halton, hash } from './lib.js';
import { drawCover } from './cover.js';
import { loadFonts, canvas, drawTitle, drawCredits, drawPage1, drawPanel1, PAGE, panelRect } from './pages.js';

await loadFonts();
export const total = 17.5;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- renderer ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
const maxAniso = renderer.capabilities.getMaxAnisotropy();

// ---------- set: a night desk. Units are metres, the table top is y = 0 ----------
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030308);
const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function add(geo, material, x, y, z, parent = scene) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
function tex(cv, mirror = false) { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; if (mirror) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; } return t; }

const wood = canvas(1024, 1024); { const c = wood.getContext('2d'); c.fillStyle = '#4a2c1a'; c.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 220; i++) { const y = hash(i) * 1024; c.strokeStyle = `rgba(${hash(i + 1) > 0.5 ? '30,15,8' : '110,70,40'},${0.15 + 0.25 * hash(i + 2)})`; c.lineWidth = 1 + hash(i + 3) * 4;
    c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) c.lineTo(x, y + 10 * Math.sin(x * 0.006 + i)); c.stroke(); } }
const woodTex = tex(wood); woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2, 1);
add(new THREE.BoxGeometry(2.4, 0.05, 1.3), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.5 }), 0, -0.025, -0.1);
// far wall with a window (built from 4 blocks around the hole), blinds in it, Hollow Creek at night outside
const WALL_Z = -1.0, WIN = { x0: -0.85, x1: 0.35, y0: 0.22, y1: 1.2 }, wallMat = mat(0x3a3046, 0.95);
add(new THREE.BoxGeometry(10, 3, 0.08), wallMat, 0, WIN.y1 + 1.5, WALL_Z - 0.04);
add(new THREE.BoxGeometry(10, 1.2, 0.08), wallMat, 0, WIN.y0 - 0.6, WALL_Z - 0.04);
add(new THREE.BoxGeometry(5, WIN.y1 - WIN.y0, 0.08), wallMat, WIN.x0 - 2.5, (WIN.y0 + WIN.y1) / 2, WALL_Z - 0.04);
add(new THREE.BoxGeometry(5, WIN.y1 - WIN.y0, 0.08), wallMat, WIN.x1 + 2.5, (WIN.y0 + WIN.y1) / 2, WALL_Z - 0.04);
const frameMat = mat(0xd9cdb4, 0.6);
add(new THREE.BoxGeometry(WIN.x1 - WIN.x0 + 0.06, 0.03, 0.1), frameMat, (WIN.x0 + WIN.x1) / 2, WIN.y0 - 0.015, WALL_Z);   // sill
add(new THREE.BoxGeometry(0.025, WIN.y1 - WIN.y0, 0.04), frameMat, (WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, WALL_Z - 0.05);   // mullion
for (let i = 0; i < 15; i++) {                                    // blinds: half-open slats, they paint the moonlight in stripes
  const sl = add(new THREE.BoxGeometry(WIN.x1 - WIN.x0, 0.035, 0.003), mat(0xe8e0d0, 0.7), (WIN.x0 + WIN.x1) / 2, WIN.y1 - 0.04 - i * 0.065, WALL_Z + 0.02);
  sl.rotation.x = 0.75; sl.receiveShadow = false;
}
const out = canvas(2048, 900); { const c = out.getContext('2d');   // the town outside: sky, moon, hills, houses, the water tower
  const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#070a24'); g.addColorStop(0.65, '#1b2350'); g.addColorStop(1, '#2c2a55'); c.fillStyle = g; c.fillRect(0, 0, 2048, 900);
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.6 * hash(i + 400)})`; c.fillRect(hash(i + 401) * 2048, hash(i + 402) * 520, 2, 2); }
  const mg = c.createRadialGradient(820, 210, 30, 820, 210, 260); mg.addColorStop(0, 'rgba(220,230,255,0.5)'); mg.addColorStop(1, 'rgba(220,230,255,0)'); c.fillStyle = mg; c.fillRect(0, 0, 2048, 900);
  c.fillStyle = '#eef0ff'; c.beginPath(); c.arc(820, 210, 52, 0, 6.283); c.fill();
  c.fillStyle = '#141633'; c.beginPath(); c.moveTo(0, 640); for (let x = 0; x <= 2048; x += 64) c.lineTo(x, 600 + 40 * Math.sin(x * 0.004) + 20 * Math.sin(x * 0.013)); c.lineTo(2048, 900); c.lineTo(0, 900); c.fill();
  c.fillStyle = '#0d0e24'; c.fillRect(1280, 430, 10, 220); c.fillRect(1360, 430, 10, 220); c.beginPath(); c.roundRect(1250, 360, 150, 85, 14); c.fill();
  for (let i = 0; i < 26; i++) { const x = i * 80 + 20 * hash(i + 500), w = 60 + 20 * hash(i + 501), hh = 60 + 70 * hash(i + 502), y = 900 - 160 - hh * 0.3;
    c.fillStyle = '#0b0c1e'; c.fillRect(x, y, w, hh + 200); c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + w / 2, y - 30); c.lineTo(x + w + 6, y); c.fill();
    if (hash(i + 503) > 0.35) { c.fillStyle = '#ffcf6a'; c.fillRect(x + w * 0.3, y + 18, w * 0.25, 16); } } }
const outside = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.95), new THREE.MeshBasicMaterial({ map: tex(out), color: new THREE.Color(0.75, 0.75, 0.8) }));
outside.position.set(-0.3, 1.0, -5.5); scene.add(outside);   // about 0.8 of the room's brightness: it reads as distance, never steals focus
add(new THREE.PlaneGeometry(10, 8), mat(0x120e14, 0.9), 0, -0.75, 0).rotation.x = -Math.PI / 2;   // floor

// props that give the table scale: a desk lamp (the key light lives in it), a mug of pencils
const lampMat = mat(0x2a6a5a, 0.4, 0.3), lamp = new THREE.Group(); lamp.position.set(-0.42, 0, -0.36); scene.add(lamp);
add(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 32), lampMat, 0, 0.01, 0, lamp);
add(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 12), lampMat, 0, 0.22, 0, lamp);
const shade = add(new THREE.ConeGeometry(0.09, 0.12, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a6a5a, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide }), 0.08, 0.43, 0.06, lamp);
shade.rotation.set(0.5, 0, -0.75); shade.castShadow = false;
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.6, 3) })); bulb.position.set(0, -0.04, 0); shade.add(bulb);
const mug = new THREE.Group(); mug.position.set(0.36, 0, -0.22); scene.add(mug);
add(new THREE.CylinderGeometry(0.04, 0.036, 0.1, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xb8402e, roughness: 0.4, side: THREE.DoubleSide }), 0, 0.05, 0, mug);
for (let i = 0; i < 4; i++) { const p = add(new THREE.CylinderGeometry(0.004, 0.004, 0.17, 6), mat([0xf2c230, 0x3a7ad8, 0xf2c230, 0x2a2a2a][i], 0.5), 0.012 * Math.cos(i * 1.7), 0.1, 0.012 * Math.sin(i * 1.7), mug); p.rotation.set(0.15 * Math.sin(i * 2.3), 0, 0.15 * Math.cos(i * 2.3)); }

// ---------- the comic: spine on x = 0, pages run +x, height along z (top of the page = -z) ----------
const BW = 0.17, BH = 0.26, R_TOP = 0.005;
const pageTex = { cover: canvas(1600, 2448), title: canvas(1600, 2448), credits: canvas(1024, 1566), page1: canvas(PAGE.W, PAGE.H), inCover: canvas(256, 392) };
drawCover(pageTex.cover.getContext('2d'), 1600, 2448); drawTitle(pageTex.title.getContext('2d'), 1600, 2448);
drawCredits(pageTex.credits.getContext('2d'), 1024, 1566); drawPage1(pageTex.page1.getContext('2d'), PAGE.W, PAGE.H);
{ const c = pageTex.inCover.getContext('2d'); c.fillStyle = '#e9dcbc'; c.fillRect(0, 0, 256, 392); }
const paperSide = mat(0xe8dcc0, 0.9);
const rightBlock = add(new THREE.BoxGeometry(BW, R_TOP, BH), paperSide, BW / 2, R_TOP / 2, 0);   // the page stack under page 1
const leftBlock = add(new THREE.BoxGeometry(BW, 1, BH), paperSide, -BW / 2, 0, 0);               // grows as the cover lands
const page1 = add(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: tex(pageTex.page1), roughness: 0.85 }), BW / 2, R_TOP + 0.0002, 0);
page1.rotation.x = -Math.PI / 2;
// panel 1 again at high resolution, laid on the page, so the push-in stays sharp
const P1 = panelRect(0), P1C = V((P1.x + P1.w / 2) / PAGE.W * BW, R_TOP + 0.0003, -BH / 2 + (P1.y + P1.h / 2) / PAGE.H * BH);
const hiCv = canvas(1800, Math.round(1800 * P1.h / P1.w)); drawPanel1(hiCv.getContext('2d'), 0, 0, hiCv.width, hiCv.height);
const panel1 = add(new THREE.PlaneGeometry(P1.w / PAGE.W * BW, P1.h / PAGE.H * BH), new THREE.MeshStandardMaterial({ map: tex(hiCv), roughness: 0.85 }), P1C.x, P1C.y, P1C.z);
panel1.rotation.x = -Math.PI / 2; panel1.castShadow = false;

// a bendable sheet: N columns from the spine (u = 0) to the edge (u = 1); front and back are two meshes on one geometry
function sheet(front, back, N = 64) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 2 * 3), uv = new Float32Array((N + 1) * 2 * 2), idx = [];
  for (let j = 0; j <= N; j++) for (let v = 0; v < 2; v++) { const k = j * 2 + v; uv[k * 2] = j / N; uv[k * 2 + 1] = 1 - v; }
  for (let j = 0; j < N; j++) { const a = j * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
  g.setIndex(idx); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const f = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex(front), roughness: 0.8, side: THREE.FrontSide }));
  const bk = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex(back, true), roughness: 0.85, side: THREE.BackSide }));
  for (const m of [f, bk]) { m.castShadow = m.receiveShadow = true; scene.add(m); }
  return { g, N, f, bk };
}
// p = 0 flat on the right, 1 flat on the left. curl > 0: the spine leads and the edge trails (paper); small curl = stiff board
function bend(s, p, curl, pivotY) {
  const a = s.g.attributes.position.array, du = BW / s.N; let x = 0, y = pivotY;
  for (let j = 0; j <= s.N; j++) {
    const u = j / s.N, th = Math.PI * smooth(Math.min(1, Math.max(0, p * (1 + curl) - curl * u)));
    if (j > 0) { x += du * Math.cos(th); y += du * Math.sin(th); }
    for (let v = 0; v < 2; v++) { const k = (j * 2 + v) * 3; a[k] = x; a[k + 1] = y; a[k + 2] = (v - 0.5) * BH; }
  }
  s.g.attributes.position.needsUpdate = true; s.g.computeVertexNormals(); s.g.computeBoundingSphere();
}
const titleSheet = sheet(pageTex.title, pageTex.credits);
const coverSheet = sheet(pageTex.cover, pageTex.inCover, 32);

// ---------- light: one warm lamp key, a cold moonlight fill from the right, a little ambient ----------
const key = new THREE.SpotLight(0xffd2a0, 2.2, 3, 0.6, 0.7, 1.6); scene.add(key, key.target);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.camera.near = 0.05;
const MOON_POS = V(-0.75, 2.3, -3.2);   // moonlight from outside, through the blinds: stripes across the table and the book
const moon = new THREE.DirectionalLight(0x9fb2ff, 1.6); moon.target.position.set(0.0, 0, 0.05); scene.add(moon, moon.target);
moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -1, right: 1, top: 1, bottom: -1, near: 0.5, far: 7 }); moon.shadow.bias = -0.0005;
const sky = new THREE.DirectionalLight(0x8090c0, 0.35); sky.target.position.set(0, 0, 0); scene.add(sky, sky.target);   // soft fill: a new point on the sky every sub-frame
sky.castShadow = true; sky.shadow.mapSize.set(1024, 1024); Object.assign(sky.shadow.camera, { left: -1, right: 1, top: 1, bottom: -1, near: 0.5, far: 8 }); sky.shadow.bias = -0.0006;
scene.add(new THREE.AmbientLight(0x2a2440, 0.15));
const spill = new THREE.PointLight(0xffb070, 0.35, 0, 1.2); scene.add(spill);   // the lamp's spill on the wall and table (no shadow)

// dust in the lamp beam
const DUST = 220, dustPos = new Float32Array(DUST * 3), dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.25, 0.9), size: 0.0009, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));

// ---------- timeline (seconds) ----------
const T = { coverOpen: [6.5, 8.5], turn: [10.5, 12.5], lampOn: 0.6 };   // lamp click at 0.6 s = frame 18 (sound cue)
const lampOn = (t) => { const a = T.lampOn; return t < a ? 0 : t < a + 0.12 ? (Math.floor(t * 60) % 2) * 0.6 : t < a + 0.2 ? 0.15 : smooth(seg(t, a + 0.2, a + 0.35)); };
const bulbOn = new THREE.Color(6, 4.6, 3), bulbOff = new THREE.Color(0.05, 0.04, 0.03);
function pose(t) {
  const on = lampOn(t); key.intensity = 2.2 * on; spill.intensity = 0.35 * on; bulb.material.color.copy(bulbOff).lerp(bulbOn, on);
  const pc = seg(t, ...T.coverOpen), pt = seg(t, ...T.turn);
  bend(coverSheet, pc, 0.12, R_TOP + 0.0016);
  bend(titleSheet, pt, 0.55, lerp(R_TOP + 0.0009, R_TOP + 0.0024, pt));   // its spine lifts so it lands on top of the cover
  const lh = Math.max(0.0001, (R_TOP - 0.0002) * smooth(seg(pc, 0.55, 1)));
  leftBlock.scale.y = lh; leftBlock.position.y = lh / 2; leftBlock.visible = pc > 0.55;
  for (let i = 0; i < DUST; i++) {
    const a = hash(i) * 6.28, s = 0.15 + 0.2 * hash(i + 99), dir = hash(i + 5) < 0.33 ? -1 : 1;
    dustPos[i * 3] = -0.36 + 0.5 * hash(i + 1) + 0.03 * Math.sin(t * s + a);
    dustPos[i * 3 + 1] = 0.05 + 0.32 * hash(i + 2) + ((dir * t * 0.024 * (0.5 + hash(i + 3))) % 0.2);
    dustPos[i * 3 + 2] = -0.36 + 0.4 * hash(i + 4) + 0.03 * Math.cos(t * s * 0.8 + a);
  }
  dustGeo.attributes.position.needsUpdate = true;
}

// ---------- camera: one 40-degree lens. Each move = one Bezier rail + one eased value; holds in between ----------
const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 20);
const COVER = V(BW / 2, R_TOP, 0), SPREAD = V(0, R_TOP, 0);
const E_A = V(BW / 2, 0.50, 0.17), E_B = V(0, 0.68, 0.23), E_C = V(BW / 2, 0.37, 0.12);
const E_D = V(P1C.x, R_TOP + 0.135, P1C.z + 0.038), E_E = V(P1C.x, R_TOP + 0.108, P1C.z + 0.03);
const bez = (a, b, c, d) => new THREE.CubicBezierCurve3(a, b, c, d);
const MOVES = [   // [start, end, rail, lookFrom, lookTo, shutter, lens (aperture radius m), easing]
  [0.4, 5.0, bez(V(0.42, 0.78, 2.3), V(0.36, 0.66, 1.4), V(0.14, 0.56, 0.55), E_A), V(-0.12, 0.2, -0.3), COVER, 0.5, 0.008, easeInOut],   // far approach
  [10.3, 12.7, bez(E_A, E_A.clone().lerp(E_B, 0.33).setY(0.6), E_A.clone().lerp(E_B, 0.75).setY(0.68), E_B), COVER, SPREAD, 0.5, 0.004, easeInOut], // eases back during the turn
  [13.0, 14.2, bez(E_B, E_B.clone().lerp(E_C, 0.4), E_B.clone().lerp(E_C, 0.8), E_C), SPREAD, COVER, 0.5, 0.004, easeInOut],                   // settles on page 1
  [15.0, 15.6, bez(E_C, E_C.clone().lerp(E_D, 0.25), E_C.clone().lerp(E_D, 0.85), E_D), COVER, P1C, 0.8, 0.002, easeInOut],                    // fast push into panel 1
  [15.6, total, bez(E_D, E_D.clone().lerp(E_E, 0.33), E_D.clone().lerp(E_E, 0.66), E_E), P1C, P1C, 0.5, 0.0015, (k) => smooth(k) * 0.6 + k * 0.4], // slow push inside the panel
];
const eye = V(0, 0, 0), look = V(0, 0, 0), right = V(0, 0, 0), up = V(0, 0, 0);
let shutterNow = 0.5, lensNow = 0.004;
function moveAt(t) { let m = MOVES[0]; for (const x of MOVES) if (t >= x[0]) m = x; return m; }
function shoot(t, k, n) {
  const m = moveAt(t), p = m[7](seg(t, m[0], m[1]));
  m[2].getPoint(p, eye); look.copy(m[3]).lerp(m[4], p); shutterNow = m[5]; lensNow = m[6];
  camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  if (n === 1) return;
  const F = eye.distanceTo(look), a = Math.sqrt(halton(k + 1, 2)) * lensNow, b = halton(k + 1, 3) * Math.PI * 2, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
  right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
  camera.position.addScaledVector(right, lx).addScaledVector(up, ly); camera.updateMatrixWorld();
  const e = camera.projectionMatrix.elements;
  e[8] += -e[0] * lx / F + 2 * (halton(k + 1, 5) - 0.5) / W; e[9] += -e[5] * ly / F + 2 * (halton(k + 1, 7) - 0.5) / H;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
function jitterLights(k, n) {
  const j = n > 1 ? 0.03 : 0;
  bulb.getWorldPosition(key.position); key.position.x += (halton(k + 1, 11) - 0.5) * j; key.position.z += (halton(k + 1, 13) - 0.5) * j;
  key.target.position.set(0.02, 0, 0.0); bulb.getWorldPosition(spill.position); spill.position.y += 0.05;
  const s = n > 1 ? 0.12 : 0; moon.position.set(MOON_POS.x + (halton(k + 1, 17) - 0.5) * s, MOON_POS.y + (halton(k + 1, 19) - 0.5) * s, MOON_POS.z);
  const h1 = n > 1 ? halton(k + 1, 23) : 0.5, h2 = n > 1 ? halton(k + 1, 29) : 0.3, phi = h2 * Math.PI * 2;   // cosine-weighted sky sample
  sky.position.set(Math.cos(phi) * Math.sqrt(1 - h1) * 4, Math.sqrt(h1) * 4 + 0.3, Math.sin(phi) * Math.sqrt(1 - h1) * 4 + 1.0);
}

// ---------- post: sub-frames -> bloom -> one grade ----------
const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.22, 0.4, 0.9);
const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, seed: { value: 0 }, exposure: { value: 1 } }, vertexShader: vert,
  fragmentShader: `uniform sampler2D tex; uniform float seed, exposure; varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() {
      vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.008;
      vec3 c = vec3(texture2D(tex, vUv + d * ca).r, texture2D(tex, vUv).g, texture2D(tex, vUv - d * ca).b) * exposure;
      c = aces(c); c *= mix(1.0, 0.55, smoothstep(0.35, 0.95, length(d * vec2(1.0, 0.8)) * 1.45));
      c = srgb(c); c += (h(vUv * 1000.0) - 0.5) * 0.03 * (1.0 - 0.55 * dot(c, vec3(0.33)));
      gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false }));

export function renderAt(t, n = 1) {
  renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear();
  for (let k = 0; k < n; k++) {
    shoot(t, 0, 1); const sh = shutterNow / 30;
    const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * sh;
    pose(ts); shoot(ts, k, n); jitterLights(k, n);
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true;
  }
  bloom.render(renderer, accum, accum, 0, false);
  grade.material.uniforms.seed.value = (t * 30) % 97;
  grade.material.uniforms.exposure.value = 1.0 * smooth(seg(t, 0, 0.5));
  renderer.setRenderTarget(null); grade.render(renderer);
}
window.renderAt = renderAt; window.total = total;
