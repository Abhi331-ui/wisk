// STYLES: one call re-dresses the whole scene in another look, without touching the scene code.
//   lit        the film as you built it (default)
//   clay       every surface one matte ivory clay under the same light: a sculpted maquette
//   paper      paper cutout: construction paper in three flat bands, a paper grain, a darker cut line round every shape
//   shadow     shadow puppet: every object a black cut-out in front of a glowing amber screen
//   blueprint  navy body, white construction lines on every edge, a grid on the walls and the floor
//   toon       cel shading in three hard bands, bolder colours, black ink outlines
//   voxel      every object rebuilt from small cubes, under the same light
//   thermal    a heat camera: cold blue to white hot. Screens, bulbs and anything with userData.heat glow
//   synth      synthwave: dark purple shapes with glowing cyan edges, a neon grid floor, a striped sunset on the wall
//   chrome     liquid chrome: every object polished metal reflecting a pastel studio
//   neon       the same room at night: cold moonlight, a coral neon tube on the wall, strong glow
//   mix        a different style per object (blueprint computer, paper plant, voxel mug...)
// Screens (MeshBasicMaterial) stay screens in every look, so text on them still reads (thermal turns them into heat).
//
// Use (film.js does this already):
//   setStyle('toon', { scene, key: sun, fill: sky, bloom, renderer, grade: grade.material.uniforms, neonAt, mix })
// Pick it from the URL: index.html?style=toon   or render with   node render.mjs --style=toon ...
// Rule 1 still holds: materials are made once and cached, so to flip looks inside one film you can call
// setStyle(styleAt(t), ...) at the top of renderAt. The picture still depends only on t.
//
// How the kit sorts your meshes (set it yourself with mesh.userData.kind = 'screen' | 'back' | 'obj' | 'big'):
//   screen  MeshBasicMaterial (screens, bulbs, neon tubes)
//   back    walls, floors, the desk top: planes, and big flat boxes. They become the glowing screen (shadow), the grid
//           (blueprint, synth floor), the sunset (synth wall)
//   big     big solid things (bigger than LOOK.big in every direction you care about): kept as they are in voxel
//   obj     everything else: the props the looks are about
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const STYLES = ['lit', 'clay', 'paper', 'shadow', 'blueprint', 'toon', 'voxel', 'thermal', 'synth', 'chrome', 'neon', 'mix'];

const hex = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);   // '#rrggbb' (sRGB) -> linear, k > 1 = it glows
// Tuning in one place. Light values are multipliers on your own key / fill, so they work in any scene.
// Sizes (big, voxel.size, grid cells) are in scene units: the starter film is in metres.
export const LOOK = {
  big: 1.2,
  lit: { bloom: null },
  clay: { color: [0.92, 0.89, 0.83], rough: 0.88, key: 0.62, keyColor: [1.0, 0.88, 0.74], fill: 1.5, bloom: 0.12, dust: false },
  paper: { key: 0.8, fill: 1.5, sat: 0.62, light: 1.1, edge: 0.42, outline: 0.0034, grain: 2, bloom: 0.06, dust: false },   // edge = how dark the cut line is
  shadow: { glow: [hex('#FFD27E', 1.25), hex('#FFB65A'), hex('#D9802F', 0.8), hex('#3A1808', 0.5)], ink: hex('#0A0709'),
    bg: hex('#140804'), wall: 0.8, floor: 0.45, bloom: 0.15, dust: false, graphic: true },
  blueprint: { body: hex('#0B2A66'), line: hex('#DCEBFF', 1.3), grid: hex('#3D64B8'), base: hex('#0A2457'), bg: hex('#071A45'),
    cell: 0.1, crease: 25, outline: 0.0016, bloom: 0.2, dust: false, graphic: true },
  toon: { key: 0.42, keyColor: [1.0, 0.95, 0.86], fill: 2.2, sat: 1.5, light: 1.1, ink: [0.012, 0.011, 0.016], outline: 0.0028, bloom: 0, dust: false },
  voxel: { size: 0.012, jitter: 0.07, rough: 0.75, bloom: null, dust: true },
  thermal: { stops: [[0, '#080020'], [0.15, '#201078'], [0.35, '#2855FF'], [0.5, '#D025CE'], [0.65, '#FF3438'], [0.8, '#FFAD18'], [0.92, '#FFF34A'], [1, '#FFFFFF']],
    wall: 0.04, floor: 0.12, rim: 0.07, bg: hex('#080020'), bloom: 0.2, dust: false, graphic: true },
  synth: { body: hex('#2A1458'), line: hex('#36EFFF', 2.2), grid: hex('#FF43DB', 2.2), base: hex('#16072D'), sky: [hex('#16072D'), hex('#64206D')],
    sun: [hex('#FFD36A', 1.4), hex('#FF487D', 1.4)], cell: 0.08, crease: 25, outline: 0.0018, key: 0.35, keyColor: [1.0, 0.3, 0.64],
    fill: 0.4, fillColor: [0.39, 0.21, 0.78], bg: hex('#16072D'), bloom: 0.45, dust: false, graphic: true },
  chrome: { tint: hex('#F2F0FF'), keep: 0.15, rough: 0.12, wall: hex('#DCD3F6'), floor: hex('#BDB0E6'), key: 0.22, keyColor: [0.85, 0.96, 1.0],
    fill: 0.5, bloom: 0.1, dust: false },   // a low key: a flat mirror face catching the sun goes white
  neon: { key: 0.1, keyColor: [0.42, 0.55, 1.0], fill: 0.35, fillColor: [0.2, 0.26, 0.6], bg: [0.006, 0.008, 0.02],
    coral: [1.0, 0.34, 0.27], tube: [3.2, 0.9, 0.62], glow: 0.35, wallGlow: 0.12, bloom: 0.5, dust: true },
  mix: { bloom: null, dust: true },
};
// the default mix when you don't pass one: the three biggest objects get these looks, the room stays lit
export const MIX_DEFAULT = ['blueprint', 'paper', 'voxel'];

const isScreen = (m) => m.isMeshBasicMaterial;                 // screens and bulbs: leave them alone
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const first = (m) => (Array.isArray(m) ? m[0] : m);
const HIDDEN = new THREE.MeshBasicMaterial({ visible: false });
const WHITE = (() => { const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); t.needsUpdate = true; return t; })();

// ---------- what each mesh is (see the top of the file) ----------
const box = new THREE.Box3(), size = new THREE.Vector3();
function kindOf(o) {
  if (o.userData.kind) return o.userData.kind;
  let k = 'obj';
  if (isScreen(first(o.userData.lit ?? o.material))) k = 'screen';
  else if (o.geometry.type === 'PlaneGeometry' || o.userData.backdrop) k = 'back';
  else {
    box.setFromObject(o).getSize(size); const mx = Math.max(size.x, size.y, size.z), mn = Math.min(size.x, size.y, size.z);
    if (mx > LOOK.big) k = mn < 0.1 * mx ? 'back' : 'big';
  }
  return (o.userData.kind = k);
}
// a backdrop's facing: the thinnest axis of its world box. 'floor' = facing up or down, 'wall' = everything else
function faceOf(o) {
  if (o.userData.face) return o.userData.face;
  box.setFromObject(o).getSize(size);
  const ax = size.x < size.y && size.x < size.z ? 'x' : size.y <= size.z ? 'y' : 'z';
  return (o.userData.face = { axis: ax, floor: ax === 'y', normal: new THREE.Vector3(ax === 'x' ? 1 : 0, ax === 'y' ? 1 : 0, ax === 'z' ? 1 : 0) });
}
// the props' centre and size, for the glow (shadow) and the sun (synth)
let props = null;
function propsOf(scene) {
  if (props) return props;
  const b = new THREE.Box3();
  scene.traverse((o) => { if (o.isMesh && !o.userData.styleAux && o.visible && kindOf(o) === 'obj') b.union(box.setFromObject(o)); });
  if (b.isEmpty()) b.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 0.5, 0.5));
  const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
  return (props = { center: c, ext: Math.max(s.x, s.y, s.z), bottom: b.min.y });
}

// ---------- clay ----------
function clayOf(lit) {
  if (isScreen(lit)) return lit;
  const L = LOOK.clay, c = lit.color ?? new THREE.Color(1, 1, 1);
  const col = new THREE.Color().setRGB(...L.color, THREE.SRGBColorSpace).multiplyScalar(0.88 + 0.12 * Math.min(1, Math.sqrt(lum(c))));   // a hint of the old values so objects still part
  return new THREE.MeshStandardMaterial({ color: col, roughness: L.rough, metalness: 0, side: lit.side, transparent: lit.transparent, opacity: lit.opacity });
}

// ---------- toon ----------
const bands = (v) => { const t = new THREE.DataTexture(new Uint8Array(v.flatMap((x) => [x, x, x, 255])), v.length, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; };
const TOON_BANDS = bands([70, 160, 255]);                       // three hard bands: shadow, mid, light
function toonOf(lit) {
  if (isScreen(lit)) return lit;
  const L = LOOK.toon, col = (lit.color ?? new THREE.Color(1, 1, 1)).clone(), hsl = {};
  col.getHSL(hsl, THREE.SRGBColorSpace);
  col.setHSL(hsl.h, Math.min(1, hsl.s * L.sat + 0.08), Math.min(0.85, hsl.l * L.light + 0.04), THREE.SRGBColorSpace);
  return new THREE.MeshToonMaterial({ color: col, gradientMap: TOON_BANDS, side: lit.side, transparent: lit.transparent, opacity: lit.opacity });
}

// ---------- paper: construction paper. Three cel bands, muted colour, a broad paper mottle with fibres ----------
const PAPER_BANDS = bands([133, 199, 255]);
let grainTex = null;
function grain() {
  if (grainTex) return grainTex;
  const N = 512, c = Object.assign(document.createElement('canvas'), { width: N, height: N }), g = c.getContext('2d'), d = g.createImageData(N, N);
  const h = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };   // fixed noise: the same grain every frame
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {      // a broad mottle (4 octaves), about 7 % of the brightness
    let v = 0, a = 0.5; for (let o = 1; o <= 8; o *= 2) { v += a * h(Math.floor(x * o / 32) * 31.7 + Math.floor(y * o / 32) * 97.3 + o * 13.1); a *= 0.5; }
    const i = (y * N + x) * 4, l = 255 * (0.93 + 0.07 * v); d.data[i] = l; d.data[i + 1] = l * 0.995; d.data[i + 2] = l * 0.98; d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  for (let i = 0; i < 1300; i++) {                               // fibres: short pale and dark hairs
    const x = h(i * 1.31) * N, y = h(i * 2.77) * N, a = h(i * 3.9) * 6.28, l = 3 + h(i * 5.1) * 9;
    g.strokeStyle = h(i * 7.3) > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  grainTex = new THREE.CanvasTexture(c); grainTex.colorSpace = THREE.SRGBColorSpace; grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping; grainTex.anisotropy = 8;
  grainTex.repeat.set(LOOK.paper.grain, LOOK.paper.grain); return grainTex;
}
function paperOf(lit) {
  if (isScreen(lit)) return lit;
  const L = LOOK.paper, col = (lit.color ?? new THREE.Color(1, 1, 1)).clone(), hsl = {};
  col.getHSL(hsl, THREE.SRGBColorSpace);
  col.setHSL(hsl.h, hsl.s * L.sat, Math.min(0.88, hsl.l * L.light + 0.06), THREE.SRGBColorSpace);
  return new THREE.MeshToonMaterial({ color: col, map: grain(), gradientMap: PAPER_BANDS, side: lit.side, transparent: lit.transparent, opacity: lit.opacity });
}

// ---------- outlines = the "inverted hull": a copy of each mesh, back faces only, pushed out along smoothed normals by a
// constant width on screen. Works with InstancedMesh, needs no extra pass. One per look (toon ink, paper edge, blueprint line).
const hullGeo = new Map();
function smoothCopy(g) {
  if (hullGeo.has(g)) return hullGeo.get(g);
  let h = g.clone(); for (const k of Object.keys(h.attributes)) if (k !== 'position') h.deleteAttribute(k);
  h = mergeVertices(h, 1e-4); h.computeVertexNormals(); hullGeo.set(g, h); return h;   // averaged normals: no gaps at box corners
}
const inkMat = (color, width) => new THREE.ShaderMaterial({
  uniforms: { width: { value: width }, ink: { value: color.clone() } },
  vertexShader: `uniform float width;
    void main() {
      mat4 im = mat4(1.0);
      #ifdef USE_INSTANCING
        im = instanceMatrix;
      #endif
      vec4 mv = modelViewMatrix * im * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * (mat3(im) * normal));
      mv.xyz += n * width * -mv.z;                                // the same width in pixels near and far
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader: 'uniform vec3 ink; void main() { gl_FragColor = vec4(ink, 1.0); }',
  side: THREE.BackSide,
});
function aux(o, look, make) {                                    // extra meshes a look hangs on a mesh, made once, shown per look
  o.userData.aux ??= {};
  if (!(look in o.userData.aux)) {
    const a = make(); if (a) { a.userData.styleAux = true; a.castShadow = a.receiveShadow = false; a.frustumCulled = false; a.visible = false; o.add(a); }
    o.userData.aux[look] = a;
  }
  return o.userData.aux[look];
}
function outline(o, look, color, width) {
  if (o.geometry.type === 'PlaneGeometry' || o.userData.noOutline || kindOf(o) !== 'obj') return null;
  return aux(o, look + ':hull', () => {
    const h = o.isInstancedMesh ? new THREE.InstancedMesh(smoothCopy(o.geometry), inkMat(color, width), o.count) : new THREE.Mesh(smoothCopy(o.geometry), inkMat(color, width));
    if (o.isInstancedMesh) h.instanceMatrix = o.instanceMatrix;  // shares the instances, follows every change
    return h;
  });
}
// crease lines (EdgesGeometry): hard edges only, the hull draws the silhouette. On an InstancedMesh the lines are built from
// the instances as they are when the look is first set.
function edges(o, look, color, crease) {
  if (o.userData.noOutline || kindOf(o) !== 'obj') return null;
  return aux(o, look + ':edges', () => {
    let g = new THREE.EdgesGeometry(o.geometry, crease);
    if (o.isInstancedMesh) {
      const p = g.attributes.position.array, out = new Float32Array(p.length * o.count), m = new THREE.Matrix4(), v = new THREE.Vector3();
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); for (let j = 0; j < p.length; j += 3) { v.set(p[j], p[j + 1], p[j + 2]).applyMatrix4(m); out.set([v.x, v.y, v.z], i * p.length + j); } }
      g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3));
    }
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: color.clone() }));
  });
}

// ---------- backdrops drawn in world space (any size of wall or floor): glow pool, grid, sunset ----------
const WORLD_VS = `varying vec3 wp; void main() { vec4 w = modelMatrix * vec4(position, 1.0); wp = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
function glowMat(o, scene) {                                     // shadow puppet: a hot centre behind / under the props, falling off to dark
  const L = LOOK.shadow, f = faceOf(o), P = propsOf(scene), c = P.center.clone();
  if (!f.floor) c.y = P.bottom + 0.45 * P.ext;                    // on a wall: the hot spot sits a little above the props
  return new THREE.ShaderMaterial({ uniforms: { c0: { value: L.glow[0] }, c1: { value: L.glow[1] }, c2: { value: L.glow[2] }, c3: { value: L.glow[3] },
    center: { value: c }, normal: { value: f.normal }, radius: { value: P.ext * (f.floor ? L.floor : L.wall) } }, vertexShader: WORLD_VS,
    fragmentShader: `uniform vec3 c0, c1, c2, c3, center, normal; uniform float radius; varying vec3 wp;
      void main() { vec3 d = wp - center; d -= normal * dot(d, normal); float r = length(d) / radius;
        vec3 col = mix(c0, c1, smoothstep(0.0, 0.35, r)); col = mix(col, c2, smoothstep(0.35, 0.75, r)); col = mix(col, c3, smoothstep(0.75, 1.4, r));
        gl_FragColor = vec4(col, 1.0); }`, side: THREE.DoubleSide });
}
function gridMat(o, base, line, cell) {                          // blueprint paper / synthwave floor: lines every `cell`, a heavier one every 5
  const f = faceOf(o), mask = new THREE.Vector3(f.axis === 'x' ? 0 : 1, f.axis === 'y' ? 0 : 1, f.axis === 'z' ? 0 : 1);
  return new THREE.ShaderMaterial({ uniforms: { base: { value: base }, line: { value: line }, cell: { value: cell }, mask: { value: mask } }, vertexShader: WORLD_VS,
    fragmentShader: `uniform vec3 base, line, mask; uniform float cell; varying vec3 wp;
      float grid(float s, float w) { vec3 q = wp / s, g = abs(fract(q - 0.5) - 0.5) / fwidth(q); g = g + (1.0 - mask) * 1e4;
        return 1.0 - clamp(min(min(g.x, g.y), g.z) / w, 0.0, 1.0); }
      void main() { float a = max(0.55 * grid(cell, 1.0), grid(cell * 5.0, 1.6)); gl_FragColor = vec4(mix(base, line, a), 1.0); }`,
    side: THREE.DoubleSide, extensions: { derivatives: true } });
}
function sunsetMat(o, scene) {                                   // synthwave wall: sky gradient, a sun with slots in its lower half
  const L = LOOK.synth, f = faceOf(o), P = propsOf(scene), sun = P.center.clone(); sun.y = P.bottom + 0.62 * P.ext;
  return new THREE.ShaderMaterial({ uniforms: { s0: { value: L.sky[0] }, s1: { value: L.sky[1] }, u0: { value: L.sun[0] }, u1: { value: L.sun[1] },
    sun: { value: sun }, normal: { value: f.normal }, R: { value: 0.3 * P.ext }, horizon: { value: P.bottom }, ext: { value: P.ext } }, vertexShader: WORLD_VS,
    fragmentShader: `uniform vec3 s0, s1, u0, u1, sun, normal; uniform float R, horizon, ext; varying vec3 wp;
      void main() { float h = clamp((wp.y - horizon) / ext, 0.0, 1.0); vec3 col = mix(s1, s0, smoothstep(0.0, 0.9, h));
        vec3 d = wp - sun; d -= normal * dot(d, normal); float r = length(d) / R, y = (wp.y - sun.y) / R;
        float slot = y < 0.0 ? step(fract(y * 4.0), 0.12 + 0.5 * -y) : 0.0;   // the gaps grow towards the bottom
        float disc = (1.0 - smoothstep(0.98, 1.0, r)) * (1.0 - slot);
        col = mix(col, mix(u1, u0, clamp(y * 0.5 + 0.5, 0.0, 1.0)), disc);
        col += u1 * 0.18 * (1.0 - smoothstep(1.0, 2.2, r));          // a soft halo
        gl_FragColor = vec4(col, 1.0); }`, side: THREE.DoubleSide });
}

// ---------- shadow puppet ----------
const shadowInk = () => new THREE.MeshBasicMaterial({ color: LOOK.shadow.ink });
function shadowScreen(lit) {                                     // screens keep their picture, warmed to the lamp's colour
  const m = lit.clone(); m.color = lit.color.clone().multiply(hex('#FFC98A')); return m;
}

// ---------- blueprint / synth fills ----------
const flat = (color, lit) => new THREE.MeshBasicMaterial({ color, side: lit.side });
function synthOf(lit) {
  const L = LOOK.synth, c = L.body.clone().multiplyScalar(0.7 + 0.6 * Math.min(1, Math.sqrt(lum(lit.color ?? new THREE.Color(1, 1, 1)))));
  return new THREE.MeshToonMaterial({ color: c, gradientMap: TOON_BANDS, side: lit.side });
}

// ---------- thermal: one shader, heat from userData.heat or the colour; screens and bulbs are hot ----------
let LUT = null;
function thermalOf(lit, o) {
  const L = LOOK.thermal, k = kindOf(o);
  LUT ??= { c: L.stops.map(([, h]) => hex(h)), p: L.stops.map(([p]) => p) };
  const scr = isScreen(lit), useMap = scr && lit.map ? 1 : 0, useSrc = scr && !lit.map ? 1 : 0;
  const T0 = o.userData.heat ?? (k === 'back' ? (faceOf(o).floor ? L.floor : L.wall) : 0.18 + 0.3 * Math.sqrt(lum(lit.color ?? new THREE.Color(0.5, 0.5, 0.5))));
  return new THREE.ShaderMaterial({
    uniforms: { T0: { value: T0 }, useMap: { value: useMap }, useSrc: { value: useSrc }, map: { value: (scr && lit.map) || WHITE },
      src: { value: scr ? lit.color : new THREE.Color(0, 0, 0) }, S: { value: LUT.c }, P: { value: LUT.p }, rim: { value: L.rim } },   // src = the bulb's own colour object: it follows a lamp switching on
    vertexShader: `varying vec3 vN, vV; varying vec2 vUv;
      void main() { mat4 im = mat4(1.0);
        #ifdef USE_INSTANCING
          im = instanceMatrix;
        #endif
        vec4 w = modelMatrix * im * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * mat3(im) * normal);
        vV = normalize(cameraPosition - w.xyz); vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float T0, useMap, useSrc, rim; uniform sampler2D map; uniform vec3 src; uniform vec3 S[8]; uniform float P[8];
      varying vec3 vN, vV; varying vec2 vUv;
      vec3 lut(float t) { t = clamp(t, 0.0, 1.0); vec3 c = S[0]; for (int i = 1; i < 8; i++) c = mix(c, S[i], smoothstep(P[i - 1], P[i], t)); return c; }
      void main() { const vec3 Y = vec3(0.2126, 0.7152, 0.0722); float t = T0;
        if (useMap > 0.5) t = 0.55 + 0.45 * dot(texture2D(map, vUv).rgb, Y);
        else if (useSrc > 0.5) t = 0.3 + 0.7 * clamp(dot(src, Y), 0.0, 1.0);
        vec3 n = normalize(vN); t += 0.05 * n.y - rim * (1.0 - abs(dot(n, normalize(vV))));   // tops warmer, grazing edges cooler
        gl_FragColor = vec4(lut(t) * (1.0 + 1.5 * smoothstep(0.9, 1.15, t)), 1.0); }`,   // white hot blooms
    side: lit.side,
  });
}

// ---------- liquid chrome: polished metal in a pastel studio (needs the renderer for the reflections) ----------
let chromeEnv = null;
function envOf(renderer) {
  if (chromeEnv || !renderer) return chromeEnv;
  const s = new THREE.Scene(), B = (h, k = 1) => new THREE.MeshBasicMaterial({ color: hex(h, k), side: THREE.DoubleSide });
  s.add(new THREE.Mesh(new THREE.BoxGeometry(12, 8, 12), new THREE.MeshBasicMaterial({ color: hex('#9C8CD0'), side: THREE.BackSide })));
  const card = (w, h, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  [['#FFFFFF', 2], ['#000000', 1], ['#FF7BC8', 1.6], ['#000000', 1], ['#6FF4FF', 1.6], ['#000000', 1], ['#FFFFFF', 2]]
    .forEach(([h, k], i) => card(10, 0.55, B(h, k), 0, 3.9, -3 + i));                    // ceiling bands: the long reflections
  card(3, 2.2, B('#6FF4FF', 1.6), -2.6, 0.6, 5.5); card(3, 2.2, B('#FF7BC8', 1.6), 2.6, 0.6, 5.5);   // behind the camera
  card(0.35, 5, B('#FFFFFF', 3), 0, 0.5, 5.8); card(0.25, 5, B('#000000'), -1.1, 0.5, 5.8);
  for (let i = 0; i < 6; i++) card(0.5, 6, B(i % 2 ? '#000000' : '#FFFFFF', i % 2 ? 1 : 2.4), -2.5 + i, 0.5, -5.8);   // far wall stripes
  card(10, 6, B('#FF9AD5', 0.7), -5.8, 0, 0); card(10, 6, B('#9AF4FF', 0.7), 5.8, 0, 0);          // pink left, cyan right
  card(12, 12, B('#6A5A9A'), 0, -3.9, 0);
  const pm = new THREE.PMREMGenerator(renderer); chromeEnv = pm.fromScene(s, 0.02).texture; pm.dispose(); return chromeEnv;
}
function chromeOf(lit, o, renderer) {
  const L = LOOK.chrome, env = envOf(renderer), k = kindOf(o);
  if (k === 'back') return new THREE.MeshStandardMaterial({ color: faceOf(o).floor ? L.floor : L.wall, roughness: 0.55, metalness: 0, envMap: env, envMapIntensity: 0.6, side: lit.side });
  const c = L.tint.clone().lerp(lit.color ?? L.tint, L.keep);
  return new THREE.MeshStandardMaterial({ color: c, roughness: L.rough, metalness: 1, envMap: env, side: lit.side });
}

// ---------- voxel: each object rebuilt from cubes on a world grid. The cubes ride with the object when it moves. ----------
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let voxSeed = 1;
function voxelize(o, scene) {
  const L = LOOK.voxel, s = L.size, g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, p = g.attributes.position;
  o.updateWorldMatrix(true, false);
  const mats = [], m = new THREE.Matrix4();
  if (o.isInstancedMesh) for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); mats.push(o.matrixWorld.clone().multiply(m)); } else mats.push(o.matrixWorld.clone());
  const cells = new Map(), A = new THREE.Vector3(), Bv = new THREE.Vector3(), C = new THREE.Vector3(), Q = new THREE.Vector3(), r = rng(voxSeed++);
  for (const M of mats) for (let i = 0; i < p.count; i += 3) {
    A.fromBufferAttribute(p, i).applyMatrix4(M); Bv.fromBufferAttribute(p, i + 1).applyMatrix4(M); C.fromBufferAttribute(p, i + 2).applyMatrix4(M);
    const area = Q.copy(Bv).sub(A).cross(C.clone().sub(A)).length() / 2, n = Math.min(4000, 1 + Math.ceil(3 * area / (s * s)));
    for (let k = 0; k < n && cells.size < 120000; k++) {
      let u = r(), v = r(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
      Q.copy(A).addScaledVector(Bv.clone().sub(A), u).addScaledVector(C.clone().sub(A), v);
      const key = `${Math.floor(Q.x / s)},${Math.floor(Q.y / s)},${Math.floor(Q.z / s)}`; if (!cells.has(key)) cells.set(key, cells.size);
    }
  }
  const holes = [];                                               // flat screens: no cubes in front of or just behind them
  scene?.traverse((q) => {
    if (!q.isMesh || q.userData.styleAux || kindOf(q) !== 'screen') return;
    const b = new THREE.Box3().setFromObject(q), z = b.getSize(new THREE.Vector3()), mx = Math.max(z.x, z.y, z.z), mn = Math.min(z.x, z.y, z.z);
    if (mn > 0.1 * mx) return;                                    // a bulb, not a screen
    const ax = mn === z.x ? 'x' : mn === z.y ? 'y' : 'z'; b.min[ax] -= 2.5 * s; b.max[ax] += 2.5 * s; holes.push(b);
  });
  const H = new THREE.Vector3();
  for (const key of [...cells.keys()]) {
    const [x, y, z] = key.split(',').map(Number); H.set((x + 0.5) * s, (y + 0.5) * s, (z + 0.5) * s);
    if (holes.some((b) => b.containsPoint(H))) cells.delete(key);
  }
  const lit = first(o.userData.lit), base = (lit.color ?? new THREE.Color(0.8, 0.8, 0.8)).clone();
  const cube = new THREE.BoxGeometry(s * 0.97, s * 0.97, s * 0.97);
  const inst = new THREE.InstancedMesh(cube, new THREE.MeshStandardMaterial({ roughness: L.rough, metalness: 0 }), cells.size);
  const inv = mats.length ? o.matrixWorld.clone().invert() : new THREE.Matrix4(), T = new THREE.Matrix4(), col = new THREE.Color();
  let i = 0;
  for (const key of cells.keys()) {
    const [x, y, z] = key.split(',').map(Number), h = Math.sin((x * 73.1 + y * 19.7 + z * 41.3)) * 43758.5453;
    inst.setMatrixAt(i, T.makeTranslation((x + 0.5) * s, (y + 0.5) * s, (z + 0.5) * s));
    inst.setColorAt(i++, col.copy(base).multiplyScalar(1 + L.jitter * 2 * (h - Math.floor(h) - 0.5)));   // a little shade per cube
  }
  inst.matrixAutoUpdate = false; inst.matrix.copy(inv);              // world cubes, as a child: matrixWorld = the object now x the object then^-1
  return inst;
}

// ---------- neon rig (night look) ----------
let neonRig = null;
function buildNeon(scene, at) {
  const L = LOOK.neon, g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 48; i++) { const u = i / 48; pts.push(new THREE.Vector3(u * 0.42 - 0.21, 0.03 * Math.sin(u * Math.PI * 3), 0)); }
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.005, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(...L.tube) }));
  tube.userData.styleAux = true; g.add(tube);
  const wall = new THREE.PointLight(new THREE.Color(...L.coral), L.wallGlow, 0, 2); wall.position.set(0, 0, 0.06); g.add(wall);   // lights the wall around the tube
  const room = new THREE.PointLight(new THREE.Color(...L.coral), L.glow, 0, 2); room.position.set(0, -0.25, 0.7); g.add(room);   // spills onto the desk
  g.position.copy(at); g.visible = false; scene.add(g); return g;
}

// ---------- one mesh in one look ----------
function dress(o, look, ctx) {
  const lit = o.userData.lit, k = kindOf(o), each = (f) => (Array.isArray(lit) ? lit.map(f) : f(lit)), show = [];
  const cache = (name, f) => each((m) => (m.userData[name] ??= f(m)));
  let mat = lit;
  switch (look) {
    case 'clay': mat = cache('clay', clayOf); break;
    case 'toon': mat = cache('toon', toonOf); show.push(outline(o, 'toon', new THREE.Color(...LOOK.toon.ink), LOOK.toon.outline)); break;
    case 'paper': mat = cache('paper', paperOf); show.push(outline(o, 'paper', (first(mat).color ?? new THREE.Color(0.5, 0.5, 0.5)).clone().multiplyScalar(LOOK.paper.edge), LOOK.paper.outline)); break;
    case 'shadow':
      mat = k === 'screen' ? cache('shadow', shadowScreen) : k === 'back' ? (o.userData.mShadow ??= glowMat(o, ctx.scene)) : each((m) => (m.userData.shadowInk ??= shadowInk()));
      break;
    case 'blueprint': {
      const L = LOOK.blueprint;
      if (k === 'back') mat = o.userData.mBlue ??= gridMat(o, L.base, L.grid, L.cell);
      else if (k !== 'screen') { mat = each((m) => (m.userData.blue ??= flat(L.body, m))); show.push(outline(o, 'blueprint', L.line, L.outline), edges(o, 'blueprint', L.line, L.crease)); }
      break;
    }
    case 'synth': {
      const L = LOOK.synth;
      if (k === 'back') mat = faceOf(o).floor ? (o.userData.mGrid ??= gridMat(o, L.base, L.grid, L.cell)) : (o.userData.mSun ??= sunsetMat(o, ctx.scene));
      else if (k !== 'screen') { mat = cache('synth', synthOf); show.push(outline(o, 'synth', L.line, L.outline), edges(o, 'synth', L.line, L.crease)); }
      break;
    }
    case 'thermal': mat = each((m) => (m.userData['thermal' + (o.userData.heat ?? '')] ??= thermalOf(m, o))); break;
    case 'chrome': if (k !== 'screen') mat = o.userData.mChrome ??= each((m) => chromeOf(m, o, ctx.renderer)); break;
    case 'voxel': if (k === 'obj') { mat = HIDDEN; show.push(aux(o, 'voxel', () => voxelize(o, ctx.scene))); } break;
  }
  o.material = mat;
  for (const a of Object.values(o.userData.aux ?? {})) if (a) a.visible = show.includes(a);
}

// mix: { objectName: look } (the first named ancestor wins) or a function (mesh) => look. Default: MIX_DEFAULT on the 3 biggest objects.
function mixPicker(mix, scene) {
  if (typeof mix === 'function') return mix;
  if (!mix) {
    const tops = scene.children.map((c) => { const b = new THREE.Box3(); c.traverse((o) => { if (o.isMesh && !o.userData.styleAux && kindOf(o) === 'obj') b.union(box.setFromObject(o)); });
      return { c, v: b.isEmpty() ? 0 : b.getSize(size).x * size.y * size.z }; }).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
    mix = new Map(tops.slice(0, MIX_DEFAULT.length).map((x, i) => [x.c, MIX_DEFAULT[i]]));
    return (o) => { for (let p = o; p; p = p.parent) if (mix.has(p)) return mix.get(p); return 'lit'; };
  }
  return (o) => { for (let p = o; p; p = p.parent) if (p.name && mix[p.name]) return mix[p.name]; return 'lit'; };
}

const saved = { done: false };
let pickers = new Map();
export function setStyle(name = 'lit', { scene, key, fill, bloom, renderer, grade, neonAt, mix } = {}) {
  if (!STYLES.includes(name)) { console.warn(`unknown style "${name}", using lit. Styles: ${STYLES.join(', ')}`); name = 'lit'; }
  if (name === 'chrome' && !renderer) console.warn('chrome needs setStyle(..., { renderer }) for its reflections');
  if (!saved.done) {                                            // remember the film as built, once
    saved.done = true; saved.bg = scene.background?.clone?.() ?? scene.background; saved.bloom = bloom?.strength;
    if (key) saved.key = { c: key.color.clone(), i: key.intensity };
    if (fill) saved.fill = { c: fill.color.clone(), i: fill.intensity };
  }
  scene.updateMatrixWorld(true);
  const L = LOOK[name], ctx = { scene, renderer };
  const pick = name === 'mix' ? (pickers.get(mix) ?? pickers.set(mix, mixPicker(mix, scene)).get(mix)) : () => name;
  const meshes = []; scene.traverse((o) => { if (o.isMesh && !o.userData.styleAux) meshes.push(o); else if (o.isPoints) o.visible = !!(name === 'lit' || L.dust); });
  for (const o of meshes) { o.userData.lit ??= o.material; dress(o, pick(o), ctx); }   // dust reads as specks in most looks
  if (name === 'neon' && !neonRig) neonRig = buildNeon(scene, neonAt ?? new THREE.Vector3(0, 0.6, -0.85));
  if (neonRig) neonRig.visible = name === 'neon';
  scene.background = L.bg ? (L.bg.isColor ? L.bg : new THREE.Color(...L.bg)) : saved.bg;
  if (key && saved.key) { key.color.copy(L.keyColor ? new THREE.Color(...L.keyColor) : saved.key.c); key.intensity = saved.key.i * (L.key ?? 1); }
  if (fill && saved.fill) { fill.color.copy(L.fillColor ? new THREE.Color(...L.fillColor) : saved.fill.c); fill.intensity = saved.fill.i * (typeof L.fill === 'number' ? L.fill : 1); }
  if (bloom) bloom.strength = L.bloom ?? saved.bloom;
  if (grade?.graphic) grade.graphic.value = L.graphic ? 1 : 0;   // flat graphic looks skip the film tone curve (keeps their colours exact)
  return name;
}
