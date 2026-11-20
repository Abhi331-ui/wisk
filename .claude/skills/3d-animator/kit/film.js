// STARTER FILM (6 s): a retro computer on a desk in a warm room. Sun through blinds, a desk lamp that switches on,
// a typed prompt, a mug that hops when the render is done, dust in the light, one slow camera push.
// Replace the scene with your own, but keep the contract the renderer relies on:
//   window.total             length in seconds
//   window.renderAt(t, n)    draws the frame at time t with n sub-frames into <canvas id="stage">
// RULE: everything is a pure function of t. No clocks, no Math.random(), nothing carried over from the last frame,
// so any frame can be rendered alone, in any order, and always looks the same.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { W, H, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, halton, hash } from './lib.js';
import { setStyle } from './styles.js';

export const total = 6;
const SHUTTER = 0.5 / 30;          // 180-degree shutter: each frame blurs over half a frame of time
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- renderer: render in linear HDR, grade once at the end ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });

// ---------- set ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05040a);
const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function add(geo, material, x, y, z, parent = scene) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);

const wall = add(new THREE.PlaneGeometry(8, 4), mat(0xcdb8a0, 0.92), 0, 1.0, -0.9);
add(boxG(2.6, 0.05, 1.1), mat(0x7a4a2a, 0.55), 0, -0.025, 0);                     // desk top (y = 0 is the desk surface)
add(new THREE.PlaneGeometry(8, 6), mat(0x2a201a, 0.9), 0, -0.75, 0).rotation.x = -Math.PI / 2;

// retro computer: body, bezel, screen with a live canvas texture
const beige = mat(0xd8ccb2, 0.62);
const pc = new THREE.Group(); pc.name = 'computer'; pc.position.set(-0.08, 0, -0.05); scene.add(pc);
add(boxG(0.46, 0.07, 0.42), beige, 0, 0.035, 0, pc);                              // base unit
add(boxG(0.44, 0.36, 0.40), beige, 0, 0.25, -0.01, pc);                           // monitor
add(boxG(0.36, 0.27, 0.02), mat(0x16130f, 0.4), 0, 0.26, 0.19, pc);               // bezel
const screenCanvas = Object.assign(document.createElement('canvas'), { width: 640, height: 480 });
const sctx = screenCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(1.7, 1.7, 1.7) });   // > 1 = it glows (bloom)
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), screenMat); screen.position.set(0, 0.26, 0.2015); pc.add(screen);
add(boxG(0.08, 0.012, 0.004), mat(0x8a1f1a, 0.5), 0.12, 0.09, 0.19, pc);          // floppy slot
const SCREEN_CENTER = V(-0.08, 0.26, 0.15);

// keyboard: one instanced mesh for the keys, so 48 keys cost one draw call
add(boxG(0.42, 0.022, 0.15), beige, -0.08, 0.011, 0.34);
const keys = new THREE.InstancedMesh(boxG(0.026, 0.014, 0.026), mat(0xe9e1cf, 0.5), 48); keys.castShadow = keys.receiveShadow = true; scene.add(keys);
{ const m = new THREE.Matrix4(); for (let i = 0; i < 48; i++) { const c = i % 12, r = Math.floor(i / 12); m.makeTranslation(-0.08 - 0.165 + c * 0.03, 0.028, 0.29 + r * 0.032); keys.setMatrixAt(i, m); } }

// mug (it hops when the render finishes)
const mug = new THREE.Group(); mug.name = 'mug'; mug.position.set(0.38, 0, 0.16); scene.add(mug);
const mugBody = add(new THREE.CylinderGeometry(0.042, 0.038, 0.095, 40), mat(0x2f5d73, 0.35), 0, 0.0475, 0, mug);
mugBody.userData.heat = 0.85;   // hot coffee: the thermal look reads this (0 = cold, 1 = white hot)
add(new THREE.TorusGeometry(0.025, 0.007, 12, 24, Math.PI), mat(0x2f5d73, 0.35), 0.045, 0.05, 0, mug).rotation.z = -Math.PI / 2;

// plant: a rosette of flattened spheres in a pot, built from primitives
const plant = new THREE.Group(); plant.name = 'plant'; plant.position.set(-0.62, 0, -0.32); scene.add(plant);
add(new THREE.CylinderGeometry(0.07, 0.055, 0.11, 32), mat(0xb5643a, 0.8), 0, 0.055, 0, plant);
const leafMat = mat(0x4d7a36, 0.6), leaves = [];
for (let i = 0; i < 11; i++) {
  const pivot = new THREE.Group(); pivot.position.y = 0.1; pivot.rotation.y = i * 2.4; plant.add(pivot);
  const leaf = add(new THREE.SphereGeometry(1, 16, 10), leafMat, 0, 0, 0.07, pivot); leaf.scale.set(0.022, 0.006, 0.075);
  pivot.userData.tilt = 0.5 + 0.35 * hash(i); leaves.push(pivot);
}

// desk lamp: base, two arm rods, a head with a bulb inside (rod() points a cylinder from a to b)
function rod(a, b, r, material, parent) { const d = b.clone().sub(a), m = add(new THREE.CylinderGeometry(r, r, d.length(), 12), material, 0, 0, 0, parent); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m; }
const lampMat = mat(0x1d1d22, 0.35, 0.6), lamp = new THREE.Group(); lamp.position.set(0.8, 0, -0.32); scene.add(lamp);
const ELBOW = V(0.07, 0.31, -0.03), HEAD = V(-0.15, 0.45, 0.12);
add(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 32), lampMat, 0, 0.01, 0, lamp);
rod(V(0, 0.02, 0), ELBOW, 0.008, lampMat, lamp); rod(ELBOW, HEAD, 0.008, lampMat, lamp);
const head = add(new THREE.ConeGeometry(0.06, 0.1, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x1d1d22, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide }), HEAD.x, HEAD.y, HEAD.z, lamp);
head.rotation.set(-0.35, 0, -0.65);                                                // opening faces down, toward the mug
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff }), bulb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), bulbMat); bulb.position.set(0, -0.035, 0); head.add(bulb);

// blinds: slats between the sun and the room, out of frame, so the sun paints stripes on the wall
const SUN_POS = V(-3.2, 2.3, 1.4), SUN_AT = V(0.1, 0.35, -0.9);
const blinds = new THREE.Group(); blinds.position.copy(SUN_AT).lerp(SUN_POS, 0.5); blinds.lookAt(SUN_AT); scene.add(blinds);
for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(boxG(2.4, 0.045, 0.01), mat(0xffffff)); s.position.y = (i - 7.5) * 0.095; s.castShadow = true; blinds.add(s); }

// dust: deterministic points, drifting as a function of t
const DUST = 260, dustPos = new Float32Array(DUST * 3), dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.25, 0.9), size: 0.0028, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(dust);

// ---------- lights ----------
const sun = new THREE.DirectionalLight(0xffc285, 5.5); sun.target.position.copy(SUN_AT); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 0.5, far: 9 }); sun.shadow.bias = -0.0004;
const sky = new THREE.DirectionalLight(0x9db8ff, 0.55); sky.target.position.set(0, 0.2, 0); scene.add(sky, sky.target);  // one sky sample per sub-frame
sky.castShadow = true; sky.shadow.mapSize.set(1024, 1024); Object.assign(sky.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 10 }); sky.shadow.bias = -0.0006;
const lampLight = new THREE.SpotLight(0xffb36b, 0, 3, 0.75, 0.6, 2); scene.add(lampLight, lampLight.target);
lampLight.castShadow = true; lampLight.shadow.mapSize.set(1024, 1024); lampLight.shadow.bias = -0.0005;
scene.add(new THREE.AmbientLight(0x30303a, 0.15));

// ---------- the screen: a 2D canvas redrawn from t ----------
const PROMPT = '> make it cinematic';
function drawScreen(t) {
  const c = sctx; c.fillStyle = '#0b1a12'; c.fillRect(0, 0, 640, 480);
  c.font = 'bold 34px Menlo, Consolas, monospace'; c.fillStyle = '#b9ffd1';
  const typed = PROMPT.slice(0, Math.floor(seg(t, 1.9, 3.0) * PROMPT.length + 1e-6));
  c.fillText(typed + (Math.floor(t * 2.5) % 2 === 0 && t < 3.4 ? '_' : ''), 40, 90);
  const p = seg(t, 3.4, 4.6);
  if (t > 3.4) {
    c.fillText(p < 1 ? 'RENDERING' + '.'.repeat(1 + Math.floor(t * 4) % 3) : 'DONE', 40, 170);
    c.strokeStyle = '#b9ffd1'; c.lineWidth = 3; c.strokeRect(40, 200, 560, 34); c.fillRect(46, 206, 548 * easeOut(p), 22);
  }
  for (let y = 0; y < 480; y += 4) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, y, 640, 2); }   // scanlines
  screenTex.needsUpdate = true;
}

// ---------- animation (pose the world at time t) ----------
const lampOn = (t) => (t < 1.2 ? 0 : t < 1.32 ? (Math.floor(t * 60) % 2) * 0.6 : t < 1.4 ? 0.2 : smooth(seg(t, 1.4, 1.55)));   // flicker, then on
function pose(t) {
  const on = lampOn(t);
  lampLight.intensity = 6 * on; bulbMat.color.setScalar(0.15 + 6 * on);
  // mug: anticipation (squash), hop, land with a damped spring
  const hop = seg(t, 4.75, 5.05), air = Math.sin(Math.PI * hop) * 0.045;
  const squash = -0.12 * Math.exp(-((t - 4.7) ** 2) / 0.002) + 0.10 * spring(t, 5.05, 6, 9);
  mug.position.y = air; mugBody.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);
  for (let i = 0; i < leaves.length; i++) leaves[i].rotation.x = -leaves[i].userData.tilt - 0.03 * Math.sin(t * 1.1 + i);
  for (let i = 0; i < DUST; i++) {
    const a = hash(i) * 6.28, s = 0.15 + 0.2 * hash(i + 99);
    dustPos[i * 3] = -0.9 + 1.8 * hash(i + 1) + 0.03 * Math.sin(t * s + a);
    // 12-36 mm/s, a third of the motes sinking: slower than about 10 mm/s looks frozen on a phone
    const dir = hash(i + 5) < 0.33 ? -1 : 1;
    dustPos[i * 3 + 1] = 0.05 + 1.1 * hash(i + 2) + ((dir * t * 0.024 * (0.5 + hash(i + 3))) % 0.4);
    dustPos[i * 3 + 2] = -0.85 + 1.2 * hash(i + 4) + 0.03 * Math.cos(t * s * 0.8 + a);
  }
  dustGeo.attributes.position.needsUpdate = true;
}

// ---------- camera: ONE lens, ONE Bezier rail, ONE eased progress value ----------
const camera = new THREE.PerspectiveCamera(38, W / H, 0.02, 30);
const RAIL = new THREE.CubicBezierCurve3(V(0.62, 0.58, 1.85), V(0.5, 0.5, 1.45), V(0.25, 0.36, 1.12), V(0.1, 0.3, 0.95));
const LOOK_A = V(-0.02, 0.2, -0.25), LOOK_B = V(0.03, 0.22, 0.12);   // ends on the screen with the mug in frame
const eye = V(0, 0, 0), look = V(0, 0, 0), right = V(0, 0, 0), up = V(0, 0, 0);
function shoot(t, k, n) {
  const p = easeInOut(seg(t, 0.0, total - 0.7));
  RAIL.getPoint(p, eye); look.copy(LOOK_A).lerp(LOOK_B, p);
  camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  if (n === 1) return;
  // thin lens: move the eye on a small disc and shear the frustum so the focus plane stays still -> real depth of field
  const F = eye.distanceTo(SCREEN_CENTER), lens = lerp(0.009, 0.004, p);
  const a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * Math.PI * 2, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
  right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
  camera.position.addScaledVector(right, lx).addScaledVector(up, ly); camera.updateMatrixWorld();
  const e = camera.projectionMatrix.elements, jx = halton(k + 1, 5) - 0.5, jy = halton(k + 1, 7) - 0.5;   // sub-pixel jitter = anti-aliasing
  e[8] += -e[0] * lx / F + 2 * jx / W; e[9] += -e[5] * ly / F + 2 * jy / H;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
function jitterLights(k, n) {
  const s = n > 1 ? 0.18 : 0;          // a sun that is not a point -> soft shadow edges
  sun.position.set(SUN_POS.x + (halton(k + 1, 11) - 0.5) * s, SUN_POS.y + (halton(k + 1, 13) - 0.5) * s, SUN_POS.z + (halton(k + 1, 17) - 0.5) * s);
  const h1 = n > 1 ? halton(k + 1, 19) : 0.5, h2 = n > 1 ? halton(k + 1, 23) : 0.3, phi = h2 * Math.PI * 2, c = Math.sqrt(h1), r = Math.sqrt(1 - h1);
  sky.position.set(Math.cos(phi) * r * 4, c * 4 + 0.3, Math.sin(phi) * r * 4 + 1.0);   // cosine-weighted sky -> soft contact shadows
  bulb.getWorldPosition(lampLight.position); const j = n > 1 ? 0.025 : 0;
  lampLight.position.x += (halton(k + 1, 29) - 0.5) * j; lampLight.position.z += (halton(k + 1, 31) - 0.5) * j;
  lampLight.target.position.set(0.42, 0, 0.12);
}

// ---------- captions: drawn on a 2D canvas, word by word, from word timings ----------
const CAPTIONS = [['Every', 4.95], ['frame', 5.12], ['in', 5.3], ['code.', 5.42]];   // replace with your voice's word timings
const capCanvas = Object.assign(document.createElement('canvas'), { width: W, height: H }), cg = capCanvas.getContext('2d');
const capTex = new THREE.CanvasTexture(capCanvas); capTex.colorSpace = THREE.SRGBColorSpace;
function drawCaption(t) {
  cg.clearRect(0, 0, W, H); cg.font = '800 64px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif'; cg.textBaseline = 'middle';
  const line = CAPTIONS.map((w) => w[0]).join(' '); let x = W / 2 - cg.measureText(line).width / 2;
  for (const [w, at] of CAPTIONS) {
    const k = seg(t, at - 0.03, at + 0.09);                      // land 1 frame before the word: leading feels sharp, lagging feels broken
    if (k > 0) { cg.globalAlpha = k; cg.shadowColor = 'rgba(0,0,0,.85)'; cg.shadowBlur = 16; cg.fillStyle = '#fff'; cg.fillText(w, x, 940 + 14 * (1 - backOut(k))); }
    x += cg.measureText(w + ' ').width;
  }
  cg.globalAlpha = 1; cg.shadowBlur = 0; capTex.needsUpdate = true;
}

// ---------- post: add the sub-frames, bloom, then ONE grade (lens fringe, ACES, vignette, sRGB, grain, captions) ----------
const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.2, 0.4, 0.9);
const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, cap: { value: capTex }, seed: { value: 0 }, exposure: { value: 1 }, graphic: { value: 0 } }, vertexShader: vert,
  fragmentShader: `uniform sampler2D tex, cap; uniform float seed, exposure, graphic; varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() {
      vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.008;
      vec3 c = vec3(texture2D(tex, vUv + d * ca).r, texture2D(tex, vUv).g, texture2D(tex, vUv - d * ca).b) * exposure;
      c = mix(aces(c), c / max(1.0, max(c.r, max(c.g, c.b))), graphic);   // graphic looks (shadow, blueprint, thermal, synth): exact colours
      c *= mix(1.0, 0.6, smoothstep(0.35, 0.95, length(d * vec2(1.0, 0.8)) * 1.45));
      c = srgb(c);
      c += (h(vUv * 1000.0) - 0.5) * 0.03 * (1.0 - 0.55 * dot(c, vec3(0.33)));
      vec4 k = texture2D(cap, vUv); c = c * (1.0 - k.a) + k.rgb;
      gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false }));

// ---------- style (styles.js): lit, clay, paper, shadow, blueprint, toon, voxel, thermal, synth, chrome, neon or mix ----------
// Pick it with ?style=toon or render.mjs --style=toon. mix = one look per named object.
const MIX = { computer: 'blueprint', plant: 'paper', mug: 'voxel' };
setStyle(new URLSearchParams(location.search).get('style') || 'lit',
  { scene, key: sun, fill: sky, bloom, renderer, grade: grade.material.uniforms, neonAt: V(0.52, 0.5, -0.88), mix: MIX });

export function renderAt(t, n = 1) {
  drawScreen(t); drawCaption(t);
  renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear();
  for (let k = 0; k < n; k++) {
    const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * SHUTTER;   // spread the sub-frames over the shutter -> motion blur
    pose(ts); shoot(ts, k, n); jitterLights(k, n);
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true;
  }
  bloom.render(renderer, accum, accum, 0, false);
  grade.material.uniforms.seed.value = (t * 30) % 97;
  grade.material.uniforms.exposure.value = 0.9 * smooth(seg(t, 0, 0.35)) * (1 - smooth(seg(t, total - 0.25, total)));   // fade in / out
  renderer.setRenderTarget(null); grade.render(renderer);
}
window.renderAt = renderAt; window.total = total;
