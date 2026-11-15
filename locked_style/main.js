// Engine: toon world + ink + grade + lens blur, canvas-drawn character cards. Exposes window.renderFrame(f).
import * as THREE from "three";
import * as T from "./toon.js";
import * as P from "./paint.js";
import * as RT from "./realtex.js";
import { folk18, bunnyCard, horseCard } from "./folk18.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { frameState, sheetState, bgState, shotAt, TOTAL, TOWN, CROWD_K } from "./story.js";
const groundAt = () => 0;

const W = window.RW || 1440, H = window.RH || 2560, PX = W / 1080;
const NOINK = 1;
const canvas = document.createElement("canvas");
canvas.width = W; canvas.height = H;
document.body.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 3000);
camera.layers.enableAll();
scene.fog = new THREE.Fog(0xb8d0ec, 80, 900);

// ---------- toon materials ----------
const grad = (() => { const d = new Uint8Array([0, 0, 255, 255]); const t = new THREE.DataTexture(d, 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const ctex = (c0, rep = true) => { let c = c0; if (rep && c0.width >= 256) { c = document.createElement("canvas"); c.width = c0.width; c.height = c0.height; const x = c.getContext("2d"); x.filter = "blur(1.4px)"; x.drawImage(c0, 0, 0); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
const toon = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0, envMapIntensity: 0.55, ...opts });
/** triplanar toon: world-space projected texture (scale = metres per tile) */
const triToon = (tex, scale, color = 0xffffff, extra = {}, bump = 1.6) => {
  const m = toon({ color, ...extra });
  m.customProgramCacheKey = () => "tri";
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tTri = { value: tex };
    sh.uniforms.triS = { value: 1 / scale };
    sh.uniforms.bumpK = { value: bump * 0.3 };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vTP; varying vec3 vTN;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n vTP = (modelMatrix * vec4(transformed, 1.0)).xyz; vTN = normalize(mat3(modelMatrix) * objectNormal);");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D tTri; uniform float triS; uniform float bumpK; varying vec3 vTP; varying vec3 vTN; float tLum = 0.0;")
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      { vec2 dH = vec2(dFdx(tLum), dFdy(tLum)) * bumpK; vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition); vec3 r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1);
        normal = normalize(abs(det) * normal - sign(det) * (dH.x * r1 + dH.y * r2)); }`)
      .replace("#include <map_fragment>", `{
        vec3 bw = pow(abs(vTN), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
        vec3 tc = texture2D(tTri, vTP.zy * triS).rgb * bw.x + texture2D(tTri, vTP.xz * triS).rgb * bw.y + texture2D(tTri, vTP.xy * triS).rgb * bw.z;
        vec3 ta = textureLod(tTri, vec2(0.5), 12.0).rgb;
        tc = mix(tc, ta, smoothstep(70.0, 320.0, distance(vTP, cameraPosition)) * 0.85);
        vec3 mac = texture2D(tTri, vTP.xz * triS * 0.071).rgb * bw.y + texture2D(tTri, vTP.zy * triS * 0.071).rgb * bw.x + texture2D(tTri, vTP.xy * triS * 0.071).rgb * bw.z;
        tc *= mix(vec3(1.0), mac / max(0.05, dot(ta, vec3(0.333))), 0.45);
        tLum = dot(tc, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb *= tc; }`);
  };
  return m;
};

const TEX = {
  dirt: ctex(P.dirtTex(2, 1024, "#c8845a")), road: ctex(P.dirtTex(12, 1024, "#d9a070")), planks: ctex(P.woodTex(7, 512, "#a07a50")), boards: ctex(P.woodTex(57, 512, "#e8dcc4")),
  wheat: ctex(P.grassTex(41, 1024, "#e0b850")), leaf: ctex(P.leafTex(8, 512, "#7a8a50")), leaf2: ctex(P.leafTex(18, 512, "#8a9a5a")), mud: ctex(P.mudTex(4, 512, "#9a6a44")),
};
const MAT = {
  dirt: triToon(TEX.dirt, 10), road: triToon(TEX.road, 8), planks: triToon(TEX.planks, 2.6), boards: triToon(TEX.boards, 2.4), wheat: triToon(TEX.wheat, 9), wheatT: toon({ color: 0xe6c060 }),
  mud: triToon(TEX.mud, 5), water: toon({ color: 0x5a8aa8 }), bush: triToon(TEX.leaf, 3), gum: triToon(TEX.leaf, 3), gum2: triToon(TEX.leaf2, 3), gumBark: toon({ color: 0xd8d0c4 }),
  iron: toon({ color: 0xb8bcc4, side: THREE.DoubleSide }), ironT: toon({ color: 0xc8ccd2 }), ironD: toon({ color: 0x6a6e78 }), stump: toon({ color: 0x8a6a48 }),
  trim: toon({ color: 0xf4efe4 }), door: triToon(ctex(RT.barnBoards(77, "#3f6a4a", 512, 4)), 1.2, 0xffffff, {}, 1.0), glass: toon({ color: 0x3a4a68 }), wood: toon({ color: 0x8a6a48 }),
  olive: toon({ color: 0x5d6a3a }), gun: toon({ color: 0x2a2a30 }), gunD: toon({ color: 0x3a3a40 }), tyre: toon({ color: 0x1f1f24 }), ammo: toon({ color: 0x6a7040 }), hill: toon({ color: 0xb08a78 }),
};
const world = []; // meshes that get inked
const addW = (mesh, cast = true, recv = true) => { mesh.castShadow = cast; mesh.receiveShadow = recv; mesh.layers.set(0); mesh.userData.inked = true; scene.add(mesh); world.push(mesh); return mesh; };
const addG = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.inked = true; world.push(o); } }); scene.add(g); return g; };

// ---------- world ----------
{ const g = new THREE.PlaneGeometry(1600, 1600); g.rotateX(-Math.PI / 2); addW(new THREE.Mesh(g, MAT.dirt), false, true); }
const GROUND = world[0];
const rnd = P.rng(77);
const B = (g, w, h, d, x, y, z, mat, rz = 0) => { const bv = Math.min(0.035, Math.min(w, h, d) * 0.3); const m = new THREE.Mesh(bv > 0.004 ? new RoundedBoxGeometry(w, h, d, 2, bv) : new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.z = rz; g.add(m); return m; };
const roofGeo = (w, d, rise, over) => {
  const hw = w / 2 + over, hd = d / 2 + over, g = new THREE.BufferGeometry();
  const v = [-hw, 0, hd, hw, 0, hd, hw, rise, 0, -hw, rise, 0, -hw, rise, 0, hw, rise, 0, hw, 0, -hd, -hw, 0, -hd];
  const sl = Math.hypot(hd, rise), uv = [0, 0, w / 2.2, 0, w / 2.2, sl / 1.6, 0, sl / 1.6, 0, sl / 1.6, w / 2.2, sl / 1.6, w / 2.2, 0, 0, 0];
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]); g.computeVertexNormals();
  return g;
};
const prism = (span, rise, len, mat) => new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]), { depth: len, bevelEnabled: false }), mat);
// ===== Zanzibar Stone Town, 27 August 1896: palace, seafront, town, harbour with warships =====
const lerpN = (a, b, t) => a + (b - a) * t;
const animators = [];
const SMS = THREE.MathUtils.smoothstep;
const plasterTex = (seed, base) => { const S = 1024, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"), r = P.rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let k = 0; k < 70; k++) { const x = r() * S, y = r() * S, rr = 40 + r() * 220, gr = g.createRadialGradient(x, y, 0, x, y, rr), d = r() < 0.5; gr.addColorStop(0, d ? "rgba(120,100,70,0.10)" : "rgba(255,255,250,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (let k = 0; k < 40; k++) { const x = r() * S, w = 6 + r() * 26, h = 120 + r() * 420, gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(90,80,60,0.16)"); gr.addColorStop(1, "rgba(90,80,60,0)"); g.fillStyle = gr; g.fillRect(x, 0, w, h); }
  g.strokeStyle = "rgba(90,70,50,0.18)"; g.lineWidth = 1.2; for (let k = 0; k < 14; k++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 8; j++) { x += (r() - 0.5) * 40; y += 10 + r() * 30; g.lineTo(x, y); } g.stroke(); }
  return c; };
const MW = {
  sand: triToon(ctex(RT.dirtReal(22, "#d8c8a4")), 3.0, 0xffffff, {}, 0.6), lane: triToon(ctex(RT.dirtReal(23, "#b8a48a")), 2.4, 0xffffff, {}, 0.6),
  stucco: triToon(ctex(plasterTex(11, "#efe8dc")), 7, 0xffffff, {}, 0.2), stuccoY: triToon(ctex(plasterTex(12, "#e6d2a8")), 7, 0xffffff, {}, 0.2), stuccoP: triToon(ctex(plasterTex(13, "#e8c4b0")), 7, 0xffffff, {}, 0.2),
  trim: toon({ color: 0xf6f2e8, roughness: 0.7 }), wood: triToon(ctex(RT.woodReal(44, "#6a4a30", 512, false)), 1.0), door: toon({ color: 0x5a3a24, roughness: 0.6 }),
  glass: toon({ color: 0x1e2a36, roughness: 0.1, metalness: 0.3 }), iron: toon({ color: 0x2a2c30, roughness: 0.45, metalness: 0.5 }), red: toon({ color: 0xc8202a, roughness: 0.7, side: THREE.DoubleSide }),
  hull: toon({ color: 0x5c6670, roughness: 0.5, metalness: 0.2 }), hullD: toon({ color: 0x2a2e34, roughness: 0.5 }), deck: triToon(ctex(RT.deckBoards(68)), 1.2), buff: toon({ color: 0xd8b878, roughness: 0.5 }),
  white: toon({ color: 0xf4f2ec, roughness: 0.4 }), black: toon({ color: 0x18161a, roughness: 0.6 }), gold: toon({ color: 0xd8a83c, roughness: 0.3, metalness: 0.8 }),
  palm: toon({ color: 0x3f7a34, roughness: 0.8, side: THREE.DoubleSide }), trunk: triToon(ctex(RT.bark(43)), 1.0), far: new THREE.MeshBasicMaterial({ color: 0x9fb8c8 }), farG: toon({ color: 0x5f8a50 }),
  water: (() => { const n = new THREE.CanvasTexture(RT.waveNormal()); n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(40, 40); n.anisotropy = 8; const mat = new THREE.MeshStandardMaterial({ color: 0x1f6a86, roughness: 0.12, metalness: 0.0, envMapIntensity: 1.2, normalMap: n, normalScale: new THREE.Vector2(0.2, 0.2) }); mat.userData.n = n; return mat; })(),
};
TEX.leaf = ctex(RT.leafReal(30, [66, 104, 44]));
export const hAt = (x, z) => { if (z > 24) return -1.2 - Math.min(6, (z - 24) * 0.08); if (z > 16) return lerpN(0.3, -1.2, (z - 16) / 8); return 0.3 + Math.max(0, -z - 70) * 0.06 + 0.4 * Math.sin(x * 0.05) * SMS(-z, 40, 120); };
{ const g = new THREE.PlaneGeometry(2400, 2400, 240, 240); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hAt(p.getX(i), p.getZ(i)));
  g.computeVertexNormals(); GROUND.geometry.dispose(); GROUND.geometry = g; GROUND.material = MW.sand; }
const flat = (x, z, w, d, mat, y = 0.03, ry = 0) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = ry; addW(m, false, true); return m; };
flat(0, 1200, 4000, 2400, MW.water, -0.6); flat(0, -600, 4000, 1, MW.water, -50);
animators.push((f) => MW.water.userData.n.offset.set(f * 0.0011, f * 0.0007));
const R17 = P.rng(17);
// the palace: arcaded wedding-cake front with real arches, columns, balustrades, shuttered doors; ornate clock tower with an open belvedere and dome; walled courtyard with pilasters, merlons and a paved yard
const palace = { parts: [], flag: null, doors: [] };
const archShape = (w, h, ow, spring, seg = 20) => { const s = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, h), new THREE.Vector2(-w / 2, h)]); const r = ow / 2, hole = new THREE.Path(); hole.moveTo(-r, 0); hole.lineTo(-r, spring); for (let i = 0; i <= seg; i++) { const a = Math.PI - (i / seg) * Math.PI; hole.lineTo(Math.cos(a) * r, spring + Math.sin(a) * r); } hole.lineTo(r, 0); hole.lineTo(-r, 0); s.holes.push(hole); return s; };
const archGeo = (w, h, ow, spring, d) => { const g = new THREE.ExtrudeGeometry(archShape(w, h, ow, spring), { depth: d, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 20 }); g.translate(0, 0, -d / 2); return g; };
const lathe = (pts, seg = 12) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const COL = lathe([[0.42, 0], [0.42, 0.22], [0.32, 0.3], [0.3, 0.45], [0.27, 3.0], [0.33, 3.1], [0.44, 3.25], [0.46, 3.4]], 16);
const BAL = lathe([[0.09, 0], [0.09, 0.08], [0.06, 0.14], [0.11, 0.38], [0.05, 0.62], [0.08, 0.7], [0.09, 0.8]], 10);
const ARCH = archGeo(3.3, 4.3, 2.4, 2.1, 0.5), FAN = new THREE.CircleGeometry(0.62, 20, 0, Math.PI), SHUT = toon({ color: 0x2f6a5a, roughness: 0.55 });
const clockTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d"); g.fillStyle = "#f6f1e4"; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill(); g.strokeStyle = "#2a2420"; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 236, 0, 7); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(256, 256, 190, 0, 7); g.stroke();
  g.fillStyle = "#2a2420"; g.font = "bold 46px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"].forEach((n, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; g.fillText(n, 256 + Math.cos(a) * 158, 256 + Math.sin(a) * 158); });
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; g.lineWidth = i % 5 ? 2 : 6; g.beginPath(); g.moveTo(256 + Math.cos(a) * 214, 256 + Math.sin(a) * 214); g.lineTo(256 + Math.cos(a) * 230, 256 + Math.sin(a) * 230); g.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
const paverTex = (() => { const S = 1024, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"), r = P.rng(91); g.fillStyle = "#8a7a66"; g.fillRect(0, 0, S, S); const n = 8, s = S / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n * 2; i++) { const off = (j % 2) * s * 0.5, x = (i * s * 0.5 + off) % S, y = j * s, w = s * 0.5 - 6, h = s - 6, v = 0.86 + r() * 0.2, tone = r(); g.fillStyle = `rgb(${(214 + tone * 20) * v | 0},${(196 + tone * 14) * v | 0},${(164 + tone * 8) * v | 0})`;
    g.beginPath(); g.roundRect(x + 3, y + 3, w, h, 10); g.fill(); const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, "rgba(255,255,250,0.10)"); gr.addColorStop(1, "rgba(60,40,20,0.10)"); g.fillStyle = gr; g.fill(); }
  const b = document.createElement("canvas"); b.width = b.height = S; const bg = b.getContext("2d"); bg.filter = "blur(1.5px)"; bg.drawImage(c, 0, 0); const t = new THREE.CanvasTexture(b); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
MW.pavers = triToon(paverTex, 6, 0xffffff, {}, 0.5);
{ const g = new THREE.Group(), M = (geo, mat, x, y, z, p = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); p.add(m); return m; };
  B(g, 44, 15, 14, 0, 7.5, -6, MW.stucco);
  for (let fl = 0; fl < 3; fl++) for (let k = 0; k < 13; k++) { const x = -19.8 + k * 3.3, a = new THREE.Group();
    M(COL, MW.trim, 0, 0, 0, a).scale.set(1, fl === 2 ? 1.12 : 1.18, 1); if (fl > 0) B(a, 1.0, 0.3, 1.0, 0, 0.15, 0, MW.trim);
    if (k < 12) { const ar = M(ARCH, MW.trim, 1.65, 0.3, 0.05, a); ar.scale.set(1, fl === 2 ? 0.96 : 1, 1); B(a, 2.0, 0.22, 0.3, 1.65, 4.25, 0.32, MW.trim);
      for (let q = 0; q < 3; q++) B(a, 0.22, 0.22, 0.12, 1.25 + q * 0.4, 3.95, 0.32, MW.trim);
      B(a, 1.4, 2.8, 0.1, 1.65, 1.7, -1.32, MW.glass); M(FAN, MW.glass, 1.65, 3.1, -1.32, a); B(a, 1.6, 0.12, 0.14, 1.65, 3.1, -1.28, MW.trim); B(a, 0.08, 2.8, 0.14, 1.65, 1.7, -1.26, MW.trim);
      for (const s of [-1, 1]) { const sh = B(a, 0.72, 2.7, 0.06, 1.65 + s * 1.12, 1.65, -1.2, SHUT); sh.rotation.y = s * 0.5; for (let q = 0; q < 9; q++) B(a, 0.66, 0.05, 0.04, 1.65 + s * 1.12, 0.5 + q * 0.28, -1.15, SHUT).rotation.y = s * 0.5; }
      if (fl > 0) { B(a, 3.2, 0.14, 0.34, 1.65, 1.15, 0.25, MW.trim); B(a, 3.2, 0.1, 0.3, 1.65, 0.36, 0.25, MW.trim); for (let q = 0; q < 9; q++) M(BAL, MW.trim, 0.3 + q * 0.34, 0.38, 0.25, a); } }
    a.position.set(x, fl * 4.6, 2.65); g.add(a); palace.parts.push(a); }
  for (const y of [4.6, 9.2, 13.8]) { B(g, 46, 0.42, 3.4, 0, y, 1.6, MW.trim); B(g, 46.4, 0.16, 3.6, 0, y + 0.28, 1.6, MW.trim); }
  B(g, 46, 0.6, 15, 0, 15.3, -6, MW.trim); for (let q = 0; q < 60; q++) M(BAL, MW.trim, -22.4 + q * 0.76, 15.6, 3.0); B(g, 46, 0.16, 0.36, 0, 16.5, 3.0, MW.trim);
  for (const s of [-1, 1]) for (let q = 0; q < 4; q++) M(new THREE.SphereGeometry(0.32, 12, 8), MW.trim, s * (22.8 - q * 0.0), 16.9, 3.0 - q * 4.5);
  // tower: pilasters, bands, arched windows, clock faces on three sides, open belvedere with dome and finial
  B(g, 9, 30, 9, 0, 15, -6, MW.stucco); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 1.1, 30, 1.1, sx * 4.3, 15, -6 + sz * 4.3, MW.trim);
  for (const y of [15.4, 21, 29.4]) { B(g, 9.8, 0.4, 9.8, 0, y, -6, MW.trim); B(g, 10.2, 0.18, 10.2, 0, y + 0.3, -6, MW.trim); }
  const AW = archGeo(2.6, 4.0, 1.6, 2.2, 0.35);
  for (let side = 0; side < 4; side++) { const gg = new THREE.Group(); gg.rotation.y = (side * Math.PI) / 2; gg.position.set(0, 0, -6); g.add(gg);
    for (const [y, sx] of [[16.4, -1.8], [16.4, 1.8]]) { M(AW, MW.trim, sx, y, 4.6, gg); B(gg, 1.6, 3.2, 0.08, sx, y + 1.8, 4.42, MW.glass); for (let q = 0; q < 7; q++) B(gg, 1.5, 0.08, 0.06, sx, y + 0.5 + q * 0.42, 4.47, SHUT); }
    if (side !== 2) { const cf = M(new THREE.CylinderGeometry(2.3, 2.3, 0.3, 40), new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.5 }), 0, 25.2, 4.6, gg); cf.rotation.x = Math.PI / 2; cf.rotation.y = Math.PI / 2; const rim = M(new THREE.TorusGeometry(2.35, 0.14, 8, 40), MW.gold, 0, 25.2, 4.75, gg);
      for (const [l, ang] of [[1.6, 0.4], [1.1, 2.2]]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.14, l, 0.06), MW.black); h.geometry.translate(0, l / 2, 0); h.rotation.z = -ang; h.position.set(0, 25.2, 4.8); gg.add(h); } } }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 1.0, 4.0, 1.0, sx * 2.6, 32, -6 + sz * 2.6, MW.trim);
  const AB = archGeo(4.2, 4.0, 3.0, 1.6, 0.3); for (let side = 0; side < 4; side++) { const gg = new THREE.Group(); gg.rotation.y = (side * Math.PI) / 2; gg.position.set(0, 30, -6); g.add(gg); M(AB, MW.trim, 0, 0, 2.6, gg); for (let q = 0; q < 6; q++) M(BAL, MW.trim, -1.0 + q * 0.4, 0.0, 2.6, gg); }
  B(g, 6.6, 0.4, 6.6, 0, 34.2, -6, MW.trim); M(new THREE.CylinderGeometry(2.6, 2.8, 0.8, 24), MW.trim, 0, 34.8, -6); M(new THREE.SphereGeometry(2.6, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), MW.stucco, 0, 35.2, -6).scale.y = 1.15;
  M(new THREE.SphereGeometry(0.35, 12, 8), MW.gold, 0, 38.3, -6);
  B(g, 0.2, 9, 0.2, 0, 41, -6, MW.iron); const fl = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2, 8, 1), MW.red); fl.position.set(1.8, 44, -6); g.add(fl); palace.flag = fl;
  B(g, 1.4, 2.8, 0.2, 0, 1.7, -13.1, MW.door);
  // courtyard walls with pilasters, coping and stepped merlons; gate piers with lanterns and a crowning arch
  const wall = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0), w = new THREE.Group(); w.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); w.rotation.y = ry; g.add(w);
    B(w, L, 3.2, 0.8, 0, 1.9, 0, MW.stucco); B(w, L + 0.2, 0.22, 1.0, 0, 3.6, 0, MW.trim); B(w, L, 0.35, 0.95, 0, 0.45, 0, MW.trim);
    for (let q = 0; q <= Math.floor(L / 3); q++) { const px = -L / 2 + q * (L / Math.floor(L / 3)); B(w, 0.6, 3.4, 1.05, px, 1.9, 0, MW.trim); }
    for (let q = 0; q < Math.floor(L / 1.5); q++) { const px = -L / 2 + 0.75 + q * 1.5; B(w, 0.7, 0.5, 0.6, px, 3.95, 0, MW.stucco); B(w, 0.36, 0.4, 0.5, px, 4.35, 0, MW.stucco); } };
  wall(-24, -2, -24, 15); wall(24, -2, 24, 15); wall(-24, 15, -7.6, 15); wall(7.6, 15, 24, 15);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffb860, emissiveIntensity: 0.6 });
  for (const s of [-1, 1]) { B(g, 1.9, 6.0, 1.9, s * 6.6, 3.0, 15, MW.stucco); B(g, 2.3, 0.3, 2.3, s * 6.6, 6.1, 15, MW.trim); B(g, 2.1, 0.5, 2.1, s * 6.6, 0.25, 15, MW.trim); M(new THREE.SphereGeometry(0.75, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), MW.stucco, s * 6.6, 6.25, 15); M(new THREE.SphereGeometry(0.16, 8, 6), MW.gold, s * 6.6, 7.1, 15);
    B(g, 0.1, 0.7, 0.5, s * 6.6, 4.4, 16.0, MW.iron); M(new THREE.CylinderGeometry(0.22, 0.16, 0.6, 8), lampMat, s * 6.6, 4.1, 16.3); M(new THREE.ConeGeometry(0.28, 0.3, 8), MW.iron, s * 6.6, 4.55, 16.3);
    const d = new THREE.Group(); B(d, 5.6, 3.6, 0.25, -s * 2.8, 1.8, 0, MW.door); for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) B(d, 0.2, 0.2, 0.32, -s * (0.4 + k * 0.75), 0.8 + r * 1.1, 0, MW.gold); for (let k = 0; k < 4; k++) B(d, 0.1, 3.3, 0.3, -s * (0.7 + k * 1.4), 1.8, 0, MW.wood); d.position.set(s * 5.6, 0.3, 15); g.add(d); palace.doors.push([d, s]); }
  g.position.y = 0.3; addG(g); palace.g = g; }
{ const pv = new THREE.Mesh(new THREE.PlaneGeometry(47, 16).rotateX(-Math.PI / 2), MW.pavers); pv.position.set(0, 0.34, 7); pv.receiveShadow = true; scene.add(pv); const pv2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 6).rotateX(-Math.PI / 2), MW.pavers); pv2.position.set(0, 0.33, 17.5); pv2.receiveShadow = true; scene.add(pv2); }
// Stone Town: every house assembled from parts (stepped massing, cornice, crenellated parapet, framed windows with shutters, carved doors with steps, balconies with rails, rooftop rooms and domes)
{ const buckets = new Map(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), BX = new THREE.BoxGeometry(1, 1, 1), DOME = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), CYL = new THREE.CylinderGeometry(1, 1, 1, 10);
  const add = (mat, geo, x, y, z, sx, sy, sz, ry = 0, ox = 0, oz = 0) => { const c = Math.cos(ry), s = Math.sin(ry); Q.setFromAxisAngle(Y, ry); M4.compose(new THREE.Vector3(x + ox * c + oz * s, y, z - ox * s + oz * c), Q, new THREE.Vector3(sx, sy, sz)); const g = geo.clone().applyMatrix4(M4); g.deleteAttribute("uv"); if (!buckets.has(mat)) buckets.set(mat, []); buckets.get(mat).push(g); };
  const SH = [toon({ color: 0x2f6a5a, roughness: 0.6 }), toon({ color: 0x2e4f86, roughness: 0.6 }), toon({ color: 0x7a3a2a, roughness: 0.6 })], WALL = [MW.stucco, MW.stuccoY, MW.stucco, MW.stuccoP];
  const house = (x, z, ry, seed) => { const r = P.rng(seed), w = 7 + r() * 7, d = 7 + r() * 6, fl = 2 + Math.floor(r() * 3), fh = 3.3, h = fl * fh, y = hAt(x, z) - 0.4, wall = WALL[Math.floor(r() * 4)], sh = SH[Math.floor(r() * 3)], A = (m, g, ox, oy, oz, sx, sy, sz) => add(m, g, x, y + oy, z, sx, sy, sz, ry, ox, oz);
    A(wall, BX, 0, h / 2, 0, w, h, d); A(MW.trim, BX, 0, 0.35, d / 2 + 0.05, w + 0.1, 0.7, 0.12);
    for (let f = 1; f < fl; f++) A(MW.trim, BX, 0, f * fh, d / 2 + 0.08, w + 0.15, 0.18, 0.2);
    A(MW.trim, BX, 0, h + 0.15, 0, w + 0.5, 0.3, d + 0.5);
    const nm = Math.floor(w / 1.1); for (let k = 0; k < nm; k++) if (k % 2 === 0) A(wall, BX, -w / 2 + 0.55 + k * (w - 1.1) / (nm - 1), h + 0.65, d / 2 + 0.05, 0.6, 0.7, 0.35);
    const nw = Math.max(2, Math.floor(w / 2.6)); for (let f = 0; f < fl; f++) for (let k = 0; k < nw; k++) { const ox = -w / 2 + (k + 0.5) * (w / nw); if (f === 0 && k === Math.floor(nw / 2)) continue; const wy = f * fh + 1.6;
      A(MW.trim, BX, ox, wy, d / 2 + 0.06, 1.25, 1.75, 0.12); A(MW.glass, BX, ox, wy, d / 2 + 0.1, 0.95, 1.45, 0.1); A(MW.trim, BX, ox, wy + 1.0, d / 2 + 0.16, 1.45, 0.16, 0.3);
      if ((seed + k + f) % 3 !== 0) for (const s of [-1, 1]) A(sh, BX, ox + s * 0.95, wy, d / 2 + 0.14, 0.55, 1.5, 0.06); }
    const dx = -w / 2 + (Math.floor(nw / 2) + 0.5) * (w / nw); A(MW.trim, BX, dx, 1.35, d / 2 + 0.06, 1.9, 2.9, 0.16); A(MW.door, BX, dx, 1.2, d / 2 + 0.14, 1.4, 2.5, 0.12); A(MW.gold, BX, dx, 1.3, d / 2 + 0.22, 0.08, 2.3, 0.05); A(MW.trim, BX, dx, 0.1, d / 2 + 0.6, 2.2, 0.2, 0.9);
    for (let k = 0; k < 6; k++) A(MW.gold, BX, dx + (k % 2 ? 0.35 : -0.35), 0.5 + Math.floor(k / 2) * 0.8, d / 2 + 0.22, 0.09, 0.09, 0.06);
    if (fl > 1 && r() < 0.6) { const bw = Math.min(w * 0.6, 5), by = fh + 0.1; A(MW.wood, BX, 0, by, d / 2 + 0.75, bw, 0.18, 1.5); A(MW.wood, BX, 0, by + 0.95, d / 2 + 1.45, bw, 0.1, 0.1); for (let k = 0; k <= 8; k++) A(MW.wood, BX, -bw / 2 + (k * bw) / 8, by + 0.5, d / 2 + 1.45, 0.07, 0.9, 0.07); for (const s of [-1, 1]) A(MW.wood, BX, s * bw * 0.45, by - 0.5, d / 2 + 1.2, 0.12, 1.0, 0.12); }
    if (r() < 0.35) { const rw = w * 0.4; A(wall, BX, -w * 0.2, h + 1.3, -d * 0.15, rw, 2.6, d * 0.4); A(MW.trim, BX, -w * 0.2, h + 2.65, -d * 0.15, rw + 0.3, 0.2, d * 0.4 + 0.3); }
    if (r() < 0.12) A(wall, DOME, w * 0.15, h + 0.3, 0, 2.2, 1.8, 2.2);
    if (r() < 0.25) { A(MW.iron, CYL, w * 0.3, h + 0.6, -d * 0.3, 0.5, 1.2, 0.5); } };
  let k = 0; for (let gx = -250; gx < 260; gx += 17) for (let gz = -40; gz > -330; gz -= 16) { const x = gx + (P.rng(k + 3)() - 0.5) * 4, z = gz + (P.rng(k + 7)() - 0.5) * 3; k++; if (Math.abs(x) < 32 && z > -48) continue; if (Math.hypot(x + 70, z + 10) < 30) continue; house(x, z, (P.rng(k)() - 0.5) * 0.08 + (gz % 32 === 0 ? 0 : Math.PI * 0 ), k * 13); }
  for (const [x, z, ry] of [[-38, 6, 0.3], [-46, -4, 0.2], [40, 6, -0.3], [48, -4, -0.2], [-34, -24, 0], [36, -24, 0]]) house(x, z, ry, Math.round(x * 7 + z));
  for (const [mat, gs] of buckets) { const m = new THREE.Mesh(mergeGeometries(gs), mat); m.castShadow = m.receiveShadow = true; m.userData.inked = true; scene.add(m); world.push(m); } }
// foreground and street life: bougainvillea and shrubs, potted plants, rocks, crates, barrels, rope coils, lanterns
{ const bush = new THREE.MeshStandardMaterial({ color: 0x3f6a2e, roughness: 0.8 }), pink = toon({ color: 0xd8307a, roughness: 0.6 }), pot = toon({ color: 0xa8553a, roughness: 0.85 }), rock = toon({ color: 0x8a8070, roughness: 0.9 }), R = P.rng(171);
  const blob = (x, y, z, s, mat) => { const g = new THREE.IcosahedronGeometry(1, 5), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), n = 1 + 0.18 * Math.sin(v.x * 5 + seedN) * Math.cos(v.y * 4 + v.z * 3); p.setXYZ(i, v.x * n, v.y * n * 0.8, v.z * n); } g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.scale.setScalar(s); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  let seedN = 0;
  for (let i = 0; i < 70; i++) { const x = -60 + R() * 120, z = 16 + R() * 3; if (Math.abs(x) < 7) continue; seedN = i; blob(x, hAt(x, z) + 0.5, z, 0.7 + R() * 0.5, bush); for (let k = 0; k < 9; k++) blob(x + (R() - 0.5) * 1.4, hAt(x, z) + 0.6 + R() * 0.7, z + (R() - 0.5) * 1, 0.13, pink); }
  for (const [x, z] of [[-8.5, 16.6], [8.5, 16.6], [-3, 3.6], [3, 3.6], [-14, 3.6], [14, 3.6]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.8, 18), pot); p.position.set(x, 0.7, z); p.castShadow = true; scene.add(p); seedN = x; blob(x, 1.5, z, 0.55, bush); }
  for (let i = 0; i < 40; i++) { const x = -80 + R() * 160, z = 19 + R() * 5; seedN = i * 3; blob(x, hAt(x, z) + 0.1, z, 0.2 + R() * 0.5, rock); }
  const wood = MW.wood; for (const [x, z, n] of [[24, 18, 3], [33, 18.6, 2], [-26, 18.2, 3]]) for (let k = 0; k < n; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), wood); c.position.set(x + k * 0.85, hAt(x, z) + 0.35 + (k === 2 ? 0.7 : 0), z); c.rotation.y = R() * 0.4; c.castShadow = true; scene.add(c);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.36, 0.9, 14), wood); b.position.set(x - 1.2, hAt(x, z) + 0.45, z + 0.6 * k); b.castShadow = true; scene.add(b); } }
// grass: instanced curved blades with base-to-tip colour, in beds and along the town edges
{ const bl = (() => { const g = new THREE.BufferGeometry(), P0 = [], C = [], I = []; const segs = 4; for (let i = 0; i <= segs; i++) { const t = i / segs, w = 0.022 * (1 - t * 0.92), z = t * t * 0.12; P0.push(-w, t, z, w, t, z); const k = 0.35 + 0.65 * t; C.push(0.30 * k, 0.48 * k, 0.16 * k, 0.30 * k, 0.48 * k, 0.16 * k); if (i < segs) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    g.setAttribute("position", new THREE.Float32BufferAttribute(P0, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals(); return g; })();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75, envMapIntensity: 0.4 });
  const beds = [[-21, 0, 14, 4, 12000], [21, 0, 14, 4, 12000], [-16, 13, 6, 2.6, 3000], [16, 13, 6, 2.6, 3000], [-60, 15, 40, 2.5, 12000], [60, 15, 40, 2.5, 12000], [0, -45, 60, 6, 15000], [-70, 14, 60, 3, 9000], [75, 14, 60, 3, 9000]];
  const N = beds.reduce((s, b) => s + b[4], 0), im = new THREE.InstancedMesh(bl, mat, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), r = P.rng(612), cc = new THREE.Color(); let n = 0;
  for (const [cx, cz, hw, hd, cnt] of beds) for (let i = 0; i < cnt; i++) { const x = cx + (r() - 0.5) * 2 * hw, z = cz + (r() - 0.5) * 2 * hd, h = 0.25 + r() * 0.45; e.set((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, hAt(x, z) + 0.02, z), q, new THREE.Vector3(1 + r() * 0.6, h, 1)); im.setMatrixAt(n, m4); cc.setHSL(0.22 + r() * 0.08, 0.45 + r() * 0.2, 0.62 + r() * 0.5); im.setColorAt(n, cc); n++; }
  im.receiveShadow = true; im.castShadow = false; scene.add(im);
  const soil = new THREE.MeshStandardMaterial({ color: 0x5e6a34, roughness: 0.95 }); for (const [cx, cz, hw, hd] of beds) { const p = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hd * 2).rotateX(-Math.PI / 2), soil); p.position.set(cx, hAt(cx, cz) + 0.04, cz); p.receiveShadow = true; scene.add(p); } }
// broadleaf shade trees (mango, flame trees): branching tube trunk, leaf-cluster cards around a lumpy crown, flowers on some
{ const leafT = (base, flower) => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), r = P.rng(base[0] * 3 + (flower ? 9 : 1));
    for (let i = 0; i < 320; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 112, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d * 0.92, L = 8 + r() * 9, W = 3.5 + r() * 3.5, lit = 0.55 + 0.7 * (1 - y / 256) + (r() - 0.5) * 0.25;
      g.fillStyle = flower && r() < 0.28 ? `rgb(${230 * lit | 0},${70 * lit | 0},${40 * lit | 0})` : `rgb(${base[0] * lit | 0},${base[1] * lit | 0},${base[2] * lit | 0})`; g.save(); g.translate(x, y); g.rotate(r() * 6.28); g.beginPath(); g.ellipse(0, 0, L, W, 0, 0, 7); g.fill(); g.restore(); }
    const b = document.createElement("canvas"); b.width = b.height = 256; const bx = b.getContext("2d"); bx.filter = "blur(0.8px)"; bx.drawImage(c, 0, 0); const t = new THREE.CanvasTexture(b); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const mats = [[60, 104, 40, false], [52, 92, 36, false], [78, 116, 48, false]].map(([a, b, c, f]) => new THREE.MeshStandardMaterial({ map: leafT([a, b, c], f), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.7, envMapIntensity: 0.5 }));
  const tree = (x, z, s, kind) => { const g = new THREE.Group(), r = P.rng(Math.round(x * 31 + z * 17)), H = 5.5 * s, top = new THREE.Vector3(0, H, 0);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.3, 0), new THREE.Vector3((r() - 0.5) * 0.6, H * 0.5, 0), top]), 12, 0.32 * s, 8), MW.trunk));
    const crowns = [top.clone().add(new THREE.Vector3(0, 2.2 * s, 0))];
    for (let b = 0; b < 5; b++) { const a = (b / 5) * 6.28 + r(), L = (2.5 + r() * 1.6) * s, end = top.clone().add(new THREE.Vector3(Math.cos(a) * L, (1.2 + r() * 1.6) * s, Math.sin(a) * L)); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([top.clone().add(new THREE.Vector3(0, -0.4, 0)), top.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.5, 0)), end]), 8, 0.14 * s, 6), MW.trunk)); crowns.push(end); }
    const card = new THREE.PlaneGeometry(1, 1); for (const c of crowns) for (let k = 0; k < 26; k++) { const v = new THREE.Vector3(r() - 0.5, (r() - 0.35) * 0.8, r() - 0.5).normalize().multiplyScalar((1.2 + r() * 1.3) * s), m = new THREE.Mesh(card, mats[kind]); m.position.copy(c).add(v); m.scale.setScalar((1.5 + r() * 1.0) * s); m.rotation.set(r() * 6.28, r() * 6.28, r() * 6.28); g.add(m); }
    g.position.set(x, hAt(x, z), z); g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(g); };
  const TR = P.rng(733); for (const [x, z, k] of [[-30, 10, 2], [30, 10, 0], [-31, -6, 1], [31, -6, 2], [-52, 17, 0], [52, 17, 1], [-20, -36, 0], [22, -38, 2], [-95, 12, 1], [95, 12, 0], [-40, -60, 0], [45, -70, 1]]) tree(x, z, 0.9 + TR() * 0.4, k);
  for (let k = 0; k < 30; k++) tree(-240 + TR() * 480, -60 - TR() * 250, 1.0 + TR() * 0.5, k % 3); }
// sea birds: white gulls with grey-tipped wings that flap and wheel over the palace and harbour
const birds = []; { const body = new THREE.SphereGeometry(0.16, 10, 8); body.scale(1, 0.8, 2.4); const wingG = (() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.18, 0.75, 0, -0.06, 0.75, 0, 0.18, 0, 0, 0.22], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; })(), tipG = (() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.06, 0.7, 0, 0.12, 0, 0, 0.18], 3)); g.setIndex([0, 1, 2]); g.computeVertexNormals(); return g; })();
  const wm = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6, side: THREE.DoubleSide }), tm = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.6, side: THREE.DoubleSide }), r = P.rng(404);
  for (let i = 0; i < 26; i++) { const g = new THREE.Group(); g.add(new THREE.Mesh(body, wm)); const wings = []; for (const s of [-1, 1]) { const w = new THREE.Group(); w.scale.x = s; const inner = new THREE.Mesh(wingG, wm), o = new THREE.Group(); o.position.x = 0.75; o.add(new THREE.Mesh(tipG, tm)); w.add(inner, o); g.add(w); wings.push([w, o]); }
    g.scale.setScalar(1.6 + r() * 0.6); g.traverse((q) => q.isMesh && (q.castShadow = true)); scene.add(g); birds.push({ g, wings, c: i < 14 ? [0, 30, -4] : [10, 18, 60], R: 18 + r() * 26, h: (i < 14 ? 26 : 10) + r() * 14, w: (0.012 + r() * 0.01) * (r() < 0.5 ? -1 : 1), ph: r() * 6.28, fl: 0.32 + r() * 0.1 }); } }
animators.push((f) => { for (const b of birds) { const a = b.ph + f * b.w, x = b.c[0] + Math.cos(a) * b.R, z = b.c[2] + Math.sin(a) * b.R * 0.7, y = b.h + Math.sin(f * 0.03 + b.ph) * 2; b.g.position.set(x, y, z); b.g.rotation.set(0, -a + (b.w > 0 ? 0 : Math.PI), (b.w > 0 ? -1 : 1) * 0.35, "YXZ");
  const fl = Math.sin(f * b.fl + b.ph), glide = (Math.sin(f * 0.02 + b.ph * 3) > 0.3) ? 0.15 : 1; b.wings.forEach(([w, o]) => { w.rotation.z = (0.15 + fl * 0.55 * glide); o.rotation.z = (fl * 0.4 * glide) - 0.1; }); } });
// minarets and an old fort
for (const [x, z] of [[-70, -60], [95, -110], [-160, -150]]) { const g = new THREE.Group(); B(g, 3, 20, 3, 0, 10, 0, MW.stucco); B(g, 4, 1, 4, 0, 20.5, 0, MW.trim); const c = new THREE.Mesh(new THREE.ConeGeometry(2, 4, 8), MW.stucco); c.position.y = 23; g.add(c); g.position.set(x, hAt(x, z) - 0.3, z); addG(g); }
{ const g = new THREE.Group(); for (const [x, z, w, d] of [[0, 0, 30, 2], [0, 20, 30, 2], [-15, 10, 2, 20], [15, 10, 2, 20]]) B(g, w, 9, d, x, 4.5, z, MW.stuccoY); for (const [x, z] of [[-15, 0], [15, 0], [-15, 20], [15, 20]]) B(g, 5, 12, 5, x, 6, z, MW.stuccoY); g.position.set(-70, 0.2, -10); addG(g); }
// coconut palms along the seafront and through the town
const frondTex = (() => { const c = document.createElement("canvas"); c.width = 128; c.height = 512; const g = c.getContext("2d");
  for (let k = 0; k < 60; k++) { const t = k / 60, y = 20 + t * 480, L = 60 * Math.sin(Math.PI * (0.15 + 0.85 * t)) + 6; for (const s of [-1, 1]) { g.strokeStyle = `hsl(${100 + (k % 5) * 3}, ${45 + (k % 3) * 5}%, ${26 + (k % 4) * 4}%)`; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.moveTo(64, y); g.quadraticCurveTo(64 + s * L * 0.6, y + 6, 64 + s * L, y + 26); g.stroke(); } }
  g.strokeStyle = "#5a6a2a"; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 10); g.lineTo(64, 505); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
const frondMat = new THREE.MeshStandardMaterial({ map: frondTex, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.75, envMapIntensity: 0.5 });
const frondGeo = (() => { const g = new THREE.PlaneGeometry(1.6, 5.4, 1, 10); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + 2.7) / 5.4; p.setY(i, v * 5.0); p.setZ(i, -Math.pow(v, 2) * 2.6); p.setX(i, p.getX(i) * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, v * 1.1)))); } g.computeVertexNormals(); return g; })();
const palm = (x, z, s) => { const g = new THREE.Group(), lean = (R17() - 0.5) * 0.5, H = 12 * s;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 1.2, H * 0.5, 0), new THREE.Vector3(lean * 3.2, H, 0)]);
  const tr = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.24 * s, 8), MW.trunk); g.add(tr); const top = curve.getPoint(1);
  for (let k = 0; k < 14; k++) { const f = new THREE.Mesh(frondGeo, frondMat); f.scale.setScalar(s * (0.85 + R17() * 0.3)); f.position.copy(top); f.rotation.set(-0.35 - (k % 2) * 0.5, (k / 14) * Math.PI * 2 + R17() * 0.3, 0, "YXZ"); g.add(f); }
  for (let k = 0; k < 5; k++) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 8, 6), MW.wood); n.position.set(top.x + Math.cos(k) * 0.35 * s, top.y - 0.3 * s, Math.sin(k) * 0.35 * s); g.add(n); }
  g.position.set(x, hAt(x, z), z); g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(g); };
for (let k = 0; k < 26; k++) palm(-120 + k * 9.5 + R17() * 3, 18 + R17() * 3, 0.85 + R17() * 0.3);
for (let k = 0; k < 40; k++) palm(-260 + R17() * 520, -40 - R17() * 280, 0.9 + R17() * 0.4);
// distant islands and the mainland coast
for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), k < 4 ? MW.farG : MW.far); m.scale.set(60 + R17() * 140, 10 + R17() * 18, 30 + R17() * 50); m.position.set(-900 + k * 230 + R17() * 80, -3, 700 + R17() * 500); scene.add(m); }
// the harbour: five grey steam warships, the white royal yacht, and dhows
const ships = [];
const shipG = (len, hull, white = false) => { const g = new THREE.Group(), w = len * 0.13, fr = len * 0.5;
  B(g, len, 4.2, w, 0, 1.0, 0, hull); B(g, len * 1.01, 0.5, w * 1.02, 0, -0.9, 0, MW.hullD);
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 4.2, 3, 1), hull); bow.rotation.y = Math.PI / 2; bow.scale.set(1, 1, 1.8); bow.position.set(fr + w * 0.35, 1.0, 0); g.add(bow);
  B(g, len * 0.98, 0.15, w * 0.96, 0, 3.15, 0, MW.deck); for (const s of [-1, 1]) B(g, len * 0.95, 0.7, 0.08, 0, 3.6, s * w * 0.48, white ? MW.white : MW.iron);
  B(g, len * 0.3, 2.4, w * 0.6, -len * 0.05, 4.4, 0, white ? MW.white : hull); B(g, len * 0.12, 1.4, w * 0.5, -len * 0.05, 6.3, 0, white ? MW.white : MW.white);
  const nf = white ? 1 : 2; for (let k = 0; k < nf; k++) { const fu = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.13, w * 0.13, 7, 16), white ? MW.buff : MW.buff); fu.position.set(-len * 0.12 + k * len * 0.12, 8.2, 0); g.add(fu); B(g, w * 0.27, 0.8, w * 0.27, -len * 0.12 + k * len * 0.12, 11.9, 0, MW.black); }
  for (const x of [len * 0.32, -len * 0.38]) { B(g, 0.3, 18, 0.3, x, 12, 0, MW.wood); B(g, 0.15, 0.15, w * 1.1, x, 17, 0, MW.wood); }
  const guns = []; if (!white) for (const x of [len * 0.36, -len * 0.42]) { const t = new THREE.Group(); const tb = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.2, w * 0.22, 1.4, 16), hull); tb.position.y = 0.7; t.add(tb); const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, w * 0.55, 10), MW.iron); bar.rotation.x = Math.PI / 2; bar.position.set(0, 0.9, -w * 0.3); t.add(bar); t.position.set(x, 3.2, 0); g.add(t); guns.push(t); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); addG(g); g.userData.guns = guns; return g; };
for (const [x, z, len] of TOWN.ships) { const s = shipG(len, MW.hull); s.position.set(x, -0.6, z); ships.push(s); }
const yacht = shipG(TOWN.yacht[2], MW.white, true); yacht.position.set(TOWN.yacht[0], -0.6, TOWN.yacht[1]);
for (let k = 0; k < 7; k++) { const g = new THREE.Group(); B(g, 7, 1.2, 2, 0, 0.3, 0, MW.wood); B(g, 0.15, 7, 0.15, 0.5, 4, 0, MW.wood); const sl = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), MW.white); sl.position.set(1.5, 4.5, 0.2); sl.rotation.z = 0.6; g.add(sl); g.position.set(-150 + k * 50 + R17() * 20, -0.6, 40 + R17() * 40); g.rotation.y = R17() * 3; addG(g); }
// rubble that falls out of the palace front as it is hit
const rubble = []; for (let k = 0; k < 40; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6 + R17(), 0.4 + R17() * 0.6, 0.6 + R17()), k % 3 ? MW.stucco : MW.trim); m.position.set(-20 + R17() * 40, 0.4, 3 + R17() * 9); m.rotation.set(R17(), R17(), R17()); m.castShadow = true; scene.add(m); m.visible = false; rubble.push([m, R17()]); }
animators.push(() => { const W = window.W18 || {}, dmg = W.damage || 0, gate = W.gate ?? 0, fl = W.flag ?? 1, ys = W.yacht || 0;
  palace.parts.forEach((a, i) => { const th = ((i * 7919) % 100) / 100, t = clamp01((dmg - th * 0.85) * 6); a.position.y = a.userData.y0 ?? (a.userData.y0 = a.position.y); a.position.y = a.userData.y0 - t * (a.userData.y0 + 1.2); a.rotation.z = t * (i % 2 ? 0.8 : -0.8); a.visible = t < 1; });
  rubble.forEach(([m, th]) => (m.visible = dmg > th * 0.9));
  palace.doors.forEach(([d, s]) => (d.rotation.y = s * (1 - gate) * 1.6));
  palace.flag.position.y = 39 + 5 * fl; palace.flag.visible = fl > 0.02; palace.flag.rotation.y = 0.15 * Math.sin((W.t || 0) * 0.2);
  yacht.position.y = -0.6 - ys * 6; yacht.rotation.x = ys * 0.35; yacht.rotation.z = ys * 0.12;
  ships.forEach((s, k) => s.userData.guns.forEach((t, j) => (t.rotation.y = W.aim ? Math.sin(k + j) * 0.2 : 0))); });
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const cable = new THREE.Group(), soapbox = new THREE.Group(), funeral = new THREE.Group(), bayBridge = new THREE.Group(), lampHeads = [];
// stubs the frame loop still references
const placeMeat = () => {}; const lab = new THREE.Group(); scene.add(lab);
const truck = (() => { const g = new THREE.Group(); g.userData = { gun: new THREE.Group(), wheels: [] }; scene.add(g); return g; })();
const tripodGun = (() => { const g = new THREE.Group(); g.userData = { gun: new THREE.Group() }; scene.add(g); return g; })();
const ammoStack = (() => { const g = new THREE.Group(); scene.add(g); return g; })();
const millHead = null;
const rays = (() => { const grp = new THREE.Group(); scene.add(grp); grp.visible = false; return grp; })();
// ---------- sky + clouds ----------
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } },
  vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }",
  fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunSize; varying vec3 vD;
  void main(){ float h = clamp(vD.y, 0.0, 1.0); vec3 c = mix(mix(hor, mid, smoothstep(0.0, 0.22, h)), top, smoothstep(0.18, 0.85, h));
    float s = max(dot(normalize(vD), sunDir), 0.0); float hb = exp(-abs(vD.y) * 9.0); c += sunCol * (pow(s, 6.0) * 0.45 * (0.4 + hb) + pow(s, 48.0) * 0.9 + smoothstep(1.0 - sunSize, 1.0 - sunSize * 0.7, s) * 3.0); c = mix(c, c * vec3(1.06, 0.98, 0.92), hb * 0.5);
    gl_FragColor = vec4(c, 1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), skyMat);
sky.layers.set(NOINK); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
/** soft volumetric-looking cloud: many feathered puffs, lit top, cooler shaded base, no outline (1024 x 512) */
const softCloud = (seed) => {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const g = c.getContext("2d"), r = P.rng(seed * 7 + 1);
  const puffs = []; for (let k = 0; k < 110; k++) { const t = r(), hump = Math.pow(Math.sin(t * Math.PI), 0.8), x = 120 + t * 784 + (r() - 0.5) * 50; const R = (26 + r() * 46) * (0.6 + hump * 0.8); puffs.push([x, 360 - hump * (60 + r() * 170) + r() * 30, R]); }
  for (let k = 0; k < 40; k++) puffs.push([110 + r() * 800, 360 + (r() - 0.5) * 30, 30 + r() * 30]);
  const L = document.createElement("canvas"); L.width = 1024; L.height = 512; const l = L.getContext("2d");
  for (const [x, y, R] of puffs) { const gr = g.createRadialGradient(x, y, R * 0.2, x, y, R); gr.addColorStop(0, "rgba(176,186,206,1)"); gr.addColorStop(0.7, "rgba(184,193,212,0.9)"); gr.addColorStop(1, "rgba(190,198,215,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); }
  puffs.sort((a, b) => b[1] - a[1]);
  for (const [x, y, R] of puffs) { const hx = x - R * 0.28, hy = y - R * 0.38, k = Math.min(1, Math.max(0, (380 - y) / 220)), gr = l.createRadialGradient(hx, hy, 0, hx, hy, R * 0.92);
    gr.addColorStop(0, `rgba(255,253,248,${0.75 + 0.25 * k})`); gr.addColorStop(0.5, `rgba(246,246,250,${0.55 + 0.3 * k})`); gr.addColorStop(1, "rgba(235,238,245,0)"); l.fillStyle = gr; l.beginPath(); l.arc(hx, hy, R * 0.92, 0, 7); l.fill(); }
  g.globalCompositeOperation = "source-atop"; g.drawImage(L, 0, 0); g.globalCompositeOperation = "source-over";
  const out = document.createElement("canvas"); out.width = 1024; out.height = 512; const o = out.getContext("2d"); o.filter = "blur(2.5px)"; o.drawImage(c, 0, 0); o.filter = "none";
  const fade = o.createLinearGradient(0, 380, 0, 470); fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,1)"); o.globalCompositeOperation = "destination-out"; o.fillStyle = fade; o.fillRect(0, 380, 1024, 132);
  return out;
};
const clouds = [];
for (let i = 0; i < 10; i++) {
  const t = ctex(softCloud(i + 3), false);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  const a = (i / 10) * Math.PI * 2 + 0.3, r = 850 + (i % 3) * 120;
  m.userData.base = [Math.cos(a) * r, 160 + (i % 4) * 45, Math.sin(a) * r - 100]; m.scale.setScalar(260 + (i % 3) * 90);
  m.layers.set(NOINK); scene.add(m); clouds.push(m);
}
for (let i = 0; i < 7; i++) { const t = ctex(softCloud(i + 41), false); const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false })); const a = (i / 7) * Math.PI * 2 + 0.6, r = 900; m.userData.base = [Math.cos(a) * r, 110 + (i % 3) * 30, Math.sin(a) * r]; m.scale.set(560 + (i % 3) * 120, 340 + (i % 2) * 80, 1); m.layers.set(NOINK); scene.add(m); clouds.push(m); }
for (let i = 0; i < 12; i++) { const t = ctex(softCloud(i + 21), false); const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.42), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false })); const a = (i / 12) * Math.PI * 2 + 0.1, r = 620 + (i % 3) * 90; m.userData.base = [Math.cos(a) * r, 45 + (i % 4) * 22, Math.sin(a) * r]; m.scale.set(200 + (i % 3) * 80, 120 + (i % 2) * 40, 1); m.layers.set(NOINK); scene.add(m); clouds.push(m); }

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.radius = 3;
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);
const lamps = []; for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffc080, 0, 8, 2); l.visible = false; scene.add(l); lamps.push(l); }

// ---------- cards ----------
const SC = 0.00225; // metres per design unit
const cards = new Map();
const drawFn = {
  folk: (p, a) => folk18(p, a), bunny: (p, a) => bunnyCard(p, null, a.opts), horse: (p, a) => horseCard(p, a),
  front: (p, a) => T.bodyFrontX(p, a.outfit, a.opts),
  emu: (p, a) => T.bodyEmu(p, a.outfit, a.opts),
  chicken: (p, a) => T.bodyChicken(p, a.outfit, a.opts),
  vulture: (p, a) => T.bodyVulture(p, a.outfit, a.opts),
};
const blobTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; T.fxBlob(new T.Pen(c.getContext("2d")), "#55566a"); return ctex(c, false); })();
const multiply = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, fog: false, polygonOffset: true, polygonOffsetFactor: -2 });
const ndCardMat = (map, pullU) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map }, uPull: pullU }, side: THREE.DoubleSide,
  vertexShader: "uniform float uPull; varying vec2 vUv; varying float vZ; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); float d = length(mv.xyz); mv.xyz *= max(0.15, (d - uPull) / d); vZ = -mv.z; gl_Position = projectionMatrix * mv; }",
  fragmentShader: "uniform sampler2D map; varying vec2 vUv; varying float vZ; void main(){ if (texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(0.0, 0.0, 0.0, vZ); }",
});
const getCard = (id, DW, DH) => {
  let c = cards.get(id);
  if (c && c.DW === DW && c.DH === DH) return c;
  if (c) { scene.remove(c.mesh); scene.remove(c.blob); }
  const sc = 1.3;
  const cv = document.createElement("canvas"); cv.width = Math.round(DW * sc); cv.height = Math.round(DH * sc);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(DW * SC, DH * SC); geo.translate(0, (DH * SC) / 2 - 25 * SC, 0);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const pullU = { value: 0.3 };
  mat.customProgramCacheKey = () => "cardpull";
  const keyU = { value: 0.0 }, edgeU = { value: 0.13 }, sunU = { value: new THREE.Vector4(0, 0.5, 0, 1) }, fillU = { value: -0.5 };
  mat.onBeforeCompile = (sh) => { sh.uniforms.uPull = pullU; sh.uniforms.uKey = keyU; sh.uniforms.uEdge = edgeU; sh.uniforms.uSun = sunU; sh.uniforms.uFill = fillU;
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uKey; uniform float uEdge; uniform vec4 uSun; uniform float uFill;").replace("#include <map_fragment>", `#include <map_fragment>
    { vec2 tx = 7.0 / vec2(textureSize(map, 0)); float m = 1.0;
      for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; m = min(m, texture2D(map, vMapUv + vec2(cos(a), sin(a)) * tx).a); }
      float m2 = min(min(texture2D(map, vMapUv + vec2(tx.x * 2.2, 0.0)).a, texture2D(map, vMapUv - vec2(tx.x * 2.2, 0.0)).a), min(texture2D(map, vMapUv + vec2(0.0, tx.y * 2.2)).a, texture2D(map, vMapUv - vec2(0.0, tx.y * 2.2)).a));
      float e = 1.0 - 0.5 * (m + m2);
      // uSun: x = sun side in card space (-1 left .. 1 right), y = sun height (0..1), z = how much the sun is behind the character (0..1), w = strength
      float sx = uSun.x, sy = uSun.y, sb = uSun.z, sk = uSun.w;
      float kd = sx >= 0.0 ? 1.0 : -1.0, side = clamp(abs(sx), 0.0, 1.0), ux = vMapUv.x - 0.5;
      float near = clamp(kd * ux * 2.2, 0.0, 1.0), far = clamp(-kd * ux * 2.2, 0.0, 1.0);
      float aOut = texture2D(map, vMapUv + vec2(kd * tx.x * 3.2, tx.y * 0.8 * sy)).a, lum = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15));
      float inner = 1.0 - clamp(1.0 - texture2D(map, vMapUv + vec2(kd * tx.x * 1.1, 0.0)).a, 0.0, 1.0);
      float rim = clamp(1.0 - aOut, 0.0, 1.0) * smoothstep(0.22, 0.45, lum) * inner;
      float topRim = clamp(1.0 - texture2D(map, vMapUv + vec2(0.0, tx.y * 3.0)).a, 0.0, 1.0) * smoothstep(0.22, 0.45, lum) * (1.0 - clamp(1.0 - texture2D(map, vMapUv + vec2(0.0, tx.y * 1.1)).a, 0.0, 1.0));
      float keep = 1.0 - 0.3 * smoothstep(0.75, 0.97, lum);
      diffuseColor.rgb *= (1.0 - uEdge * e) * (1.0 + sk * side * (0.45 * near * keep - 0.55 * far)) * (1.0 + sk * sy * 0.14 * keep * smoothstep(0.35, 0.95, vMapUv.y));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.9, 1.06), far * side * sk * 0.9);
      diffuseColor.rgb += sk * vec3(1.0, 0.86, 0.66) * (rim * (side * 1.1 + sb * 1.4) + topRim * sy * 0.6 + near * side * 0.08 * keep);
      // the extra soft light on the picture's left: gentle wrap + soft edge glow
      float fs = uFill >= 0.0 ? 1.0 : -1.0, fa = abs(uFill), fnear = clamp(fs * ux * 2.0, 0.0, 1.0);
      float fOut = texture2D(map, vMapUv + vec2(fs * tx.x * 3.0, 0.0)).a, fin = 1.0 - clamp(1.0 - texture2D(map, vMapUv + vec2(fs * tx.x * 1.1, 0.0)).a, 0.0, 1.0);
      diffuseColor.rgb *= 1.0 + 0.16 * keep + fa * 0.18 * fnear * keep;
      diffuseColor.rgb += fa * vec3(0.95, 0.96, 1.0) * (fnear * 0.16 * keep + clamp(1.0 - fOut, 0.0, 1.0) * smoothstep(0.22, 0.45, lum) * fin * 0.7);
      // 3D volume: a rounded normal from the blurred silhouette (two scales), lit by the real sun direction, warm light and cool sky shade, soft sheen
      { vec2 t4 = 18.0 / vec2(textureSize(map, 0)), t2 = 6.0 / vec2(textureSize(map, 0));
        float gx = textureLod(map, vMapUv + vec2(t4.x, 0.0), 4.5).a - textureLod(map, vMapUv - vec2(t4.x, 0.0), 4.5).a, gy = textureLod(map, vMapUv + vec2(0.0, t4.y), 4.5).a - textureLod(map, vMapUv - vec2(0.0, t4.y), 4.5).a;
        float hx = textureLod(map, vMapUv + vec2(t2.x, 0.0), 2.5).a - textureLod(map, vMapUv - vec2(t2.x, 0.0), 2.5).a, hy = textureLod(map, vMapUv + vec2(0.0, t2.y), 2.5).a - textureLod(map, vMapUv - vec2(0.0, t2.y), 2.5).a;
        vec3 N = normalize(vec3(-(gx * 1.6 + hx * 0.7), -(gy * 1.6 + hy * 0.7), 0.55));
        vec3 Ld = normalize(vec3(sx * 1.2, 0.35 + sy * 0.9, 0.75 - sb * 0.9));
        float nl = dot(N, Ld), lit = smoothstep(-0.45, 0.85, nl), vk = sk * 0.62;
        vec3 sunC = vec3(1.10, 1.0, 0.84), skyC = vec3(0.80, 0.86, 1.0);
        diffuseColor.rgb *= mix(vec3(1.0), mix(skyC * 0.80, sunC * 1.10, lit), vk);
        float spec = pow(max(dot(reflect(-Ld, N), vec3(0.0, 0.0, 1.0)), 0.0), 18.0);
        diffuseColor.rgb += vec3(1.0, 0.96, 0.86) * spec * 0.16 * vk * smoothstep(0.25, 0.6, lum);
        float bounce = clamp(-N.y, 0.0, 1.0) * (1.0 - vMapUv.y);
        diffuseColor.rgb += vec3(0.20, 0.17, 0.12) * bounce * 0.18 * vk; } }`);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uPull;").replace("#include <project_vertex>", "#include <project_vertex>\n{ float d = length(mvPosition.xyz); mvPosition.xyz *= max(0.15, (d - uPull) / d); gl_Position = projectionMatrix * mvPosition; }"); };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.order = "YXZ"; mesh.castShadow = true; mesh.layers.set(NOINK);
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
  mesh.userData.nd = ndCardMat(tex, pullU);
  const bg = new THREE.PlaneGeometry(1.25, 0.62); bg.rotateX(-Math.PI / 2);
  const blob = new THREE.Mesh(bg, multiply(blobTex)); blob.layers.set(NOINK);
  scene.add(mesh); scene.add(blob);
  c = { id, DW, DH, sc, cv, g: cv.getContext("2d"), tex, mesh, blob, key: "", pullU, keyU, edgeU, sunU, fillU };
  cards.set(id, c);
  return c;
};
const GRAIN = (() => { const c = RT.paperGrain(11); return c; })();
/** paper grain + soft light falloff baked into a card, kept inside the drawing's alpha */
const paperize = (g, cv) => { return;
  const tmp = document.createElement("canvas"); tmp.width = cv.width; tmp.height = cv.height; tmp.getContext("2d").drawImage(cv, 0, 0);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "soft-light"; g.globalAlpha = 0.55; g.fillStyle = g.createPattern(GRAIN, "repeat"); g.fillRect(0, 0, cv.width, cv.height);
  g.globalAlpha = 1; g.globalCompositeOperation = "destination-in"; g.drawImage(tmp, 0, 0); g.restore();
};
const fxCards = new Map();
const fxDraw = {
  burst: (p, s) => T.fxBurst(p, s.t, s.col || "#fff3b0"), puff: (p, s) => T.fxPuff(p, s.t), chips: (p, s) => T.fxChips(p, s.t, s.seed || 1),
  shards: (p, s) => T.fxShards(p, s.seed || 1), pot: (p) => T.fxPot(p), bird: (p, s) => T.fxBird(p, s.t), smoke: (p, s) => T.fxSmoke(p, s.t),
  glow: (p) => T.fxGlow(p), note: (p, s) => T.fxNoteX(p, s), confetti: (p, s) => T.fxConfetti(p, s.t, s.seed || 1),
  token: (p, s) => T.fxToken(p, s.side || 0), thought: (p, s) => T.fxThought(p, s), beard: (p, s) => T.fxBeardFly(p, s), coins: (p, s) => T.fxCoins(p, s.t, s.seed || 1), tear: (p) => T.fxTear(p),
  sign: (p, s) => T.fxBoard(p, s), paper: (p, s) => T.fxPaper(p, s), diagram: (p, s) => T.fxDiagram(p, s), cal: (p, s) => T.fxCal(p, s), bunting: (p) => T.fxBunting(p), icon: (p, s) => T.fxIcon(p, s), label: (p, s) => T.fxLabel(p, s), letter: (p, s) => T.fxLetter(p, s),
};
const FXSIZE = { burst: [500, 500], puff: [300, 300], chips: [400, 400], shards: [400, 200], pot: [300, 300], bird: [200, 100], smoke: [300, 600], glow: [256, 256], note: [200, 200], confetti: [400, 400], token: [512, 512], thought: [700, 560], beard: [300, 300], coins: [400, 400], tear: [100, 100], sign: [800, 400], paper: [600, 800], diagram: [700, 700], cal: [400, 500], bunting: [1200, 120], icon: [500, 500], label: [400, 160], letter: [600, 800] };
const getFx = (id, kind) => {
  let c = fxCards.get(id);
  if (c && c.kind === kind) return c;
  const [w, h] = FXSIZE[kind];
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, h / w), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: kind !== "glow" && kind !== "token" && kind !== "thought", blending: kind === "glow" ? THREE.AdditiveBlending : THREE.NormalBlending }));
  mesh.layers.set(NOINK); scene.add(mesh);
  c = { id, kind, cv, g: cv.getContext("2d"), tex, mesh, key: "" };
  fxCards.set(id, c);
  return c;
};

// ---------- crowd (many dancers sharing a few small canvases) ----------
const CSC = 0.6, crowdVar = [], crowdPool = [];
for (let k = 0; k < CROWD_K; k++) {
  const cv = document.createElement("canvas"); cv.width = 600 * CSC; cv.height = 1000 * CSC;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  crowdVar.push({ cv, g: cv.getContext("2d"), tex, key: "", mat: new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
    nd: ndCardMat(tex, { value: 0 }), depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide }) });
}
const crowdGeo = new THREE.PlaneGeometry(600 * SC, 1000 * SC); crowdGeo.translate(0, (1000 * SC) / 2 - 25 * SC, 0);
const crowdMesh = (i) => {
  while (crowdPool.length <= i) {
    const v = crowdVar[crowdPool.length % CROWD_K], m = new THREE.Mesh(crowdGeo, v.mat);
    m.castShadow = true; m.customDepthMaterial = v.depth; m.userData.nd = v.nd; m.layers.set(NOINK); m.visible = false; scene.add(m); crowdPool.push(m);
  }
  return crowdPool[i];
};
// ---------- post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const rtND = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtPost = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const rtPaint = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const BW = Math.round(W / 4), BH = Math.round(H / 4);
const rtB1 = new THREE.WebGLRenderTarget(BW, BH, { type: THREE.HalfFloatType }), rtB2 = new THREE.WebGLRenderTarget(BW, BH, { type: THREE.HalfFloatType });
const bloomU = { k: { value: 0.55 }, th: { value: 0.72 } };
const ndWorld = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  vertexShader: "varying vec3 vN; varying float vZ; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }",
  fragmentShader: "varying vec3 vN; varying float vZ; void main(){ vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0); gl_FragColor = vec4(n, vZ); }",
});
const FSV = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const fsScene = new THREE.Scene(), fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); fsQuad.frustumCulled = false; fsScene.add(fsQuad);
const inkMat = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: rtColor.texture }, tND: { value: rtND.texture }, texel: { value: new THREE.Vector2(1 / W, 1 / H) }, px: { value: PX },
    inkCol: { value: new THREE.Color(0x2a1c18) }, fogCol: { value: new THREE.Color() }, sat: { value: 1.08 }, expo: { value: 1 },
    lift: { value: new THREE.Vector3(0.02, 0.025, 0.05) }, gain: { value: new THREE.Vector3(1, 1, 1) }, vign: { value: 0.18 }, flash: { value: 0 }, inkK: { value: 0 }, dbg: { value: 0 }, ao: { value: 0.5 }, co: { value: 0 },
  },
  vertexShader: FSV,
  fragmentShader: `uniform sampler2D tColor; uniform sampler2D tND; uniform vec2 texel; uniform float px; uniform vec3 inkCol; uniform vec3 fogCol;
  uniform float sat; uniform float expo; uniform vec3 lift; uniform vec3 gain; uniform float vign; uniform float flash; uniform float inkK; uniform float dbg; uniform float ao; uniform float co; varying vec2 vUv;
  vec3 shoulder(vec3 x){ return mix(x, 0.78 + 0.3 * (1.0 - exp(-(x - 0.78) / 0.3)), step(0.78, x)); }
  void main(){
    vec3 c = texture2D(tColor, vUv).rgb * expo * 1.18;
    vec4 nd = texture2D(tND, vUv); float zc = nd.a > 0.0 ? nd.a : 1e5; vec3 nc = nd.xyz;
    float ink = 0.0;
    if (ao > 0.0 && zc < 400.0) {
      float occ = 0.0; float rr = 26.0 * px * clamp(6.0 / zc, 0.25, 1.6);
      for (int i = 0; i < 10; i++) { float fi = float(i) + 0.5, r = sqrt(fi / 10.0) * rr, a = fi * 2.39996;
        float zs = texture2D(tND, vUv + vec2(cos(a), sin(a)) * r * texel).a; zs = zs > 0.0 ? zs : 1e5;
        float dz = zc - zs; occ += smoothstep(0.02 * zc, 0.08 * zc, dz) * (1.0 - smoothstep(0.25 * zc, 0.6 * zc, dz)); }
      c *= 1.0 - ao * 0.7 * occ / 10.0;
    }
    if (inkK > 0.0 && dot(nc, nc) > 0.25 && zc < 4000.0) {
      float w = mix(5.0, 3.2, smoothstep(1.8, 4.5, log(zc))) * px;
      float bD = 99.0, bC = 99.0;
      for (int d = 0; d < 4; d++) {
        vec2 st = d == 0 ? vec2(1.0, 0.0) : d == 1 ? vec2(0.0, 1.0) : d == 2 ? vec2(0.7071, 0.7071) : vec2(0.7071, -0.7071);
        for (int s = 1; s <= 6; s++) {
          float fs = float(s);
          float fl = fs * (d > 1 ? 1.4142 : 1.0);
          if (fl > w + 1.0) break;
          vec2 o = st * texel * fs;
          vec4 a = texture2D(tND, vUv + o), b = texture2D(tND, vUv - o);
          if (a.a <= 0.0) a.a = 1e5; if (b.a <= 0.0) b.a = 1e5;
          float k = 2.0 - zc / a.a - zc / b.a;
          if (k > 0.02) bD = min(bD, fl);
          if (dot(a.xyz, a.xyz) > 0.25 && abs(a.a - zc) < zc * 0.03 && dot(a.xyz, nc) < 0.7) bC = min(bC, fl);
          if (dot(b.xyz, b.xyz) > 0.25 && abs(b.a - zc) < zc * 0.03 && dot(b.xyz, nc) < 0.7) bC = min(bC, fl);
        }
      }
      float iD = 1.0 - smoothstep(w - 0.6, w + 0.4, bD);
      float iC = (1.0 - smoothstep(w * 0.7 - 0.6, w * 0.7 + 0.4, bC)) * 0.85;
      ink = max(iD, iC) * (1.0 - smoothstep(170.0, 560.0, zc)) * inkK;
    }
    vec3 ic = mix(inkCol, fogCol * 0.55, 0.3 * smoothstep(60.0, 400.0, zc));
    c = mix(c, ic, ink);
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, sat);
    c = c * gain + lift * (1.0 - clamp(c, 0.0, 1.0));
    c = clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0) * 1.0;
    vec2 q = (vUv - 0.5) * vec2(0.75, 1.0);
    c *= 1.0 - vign * smoothstep(0.25, 0.75, length(q));
    c = mix(c, vec3(1.0), flash);
    if (dbg > 0.5) c = vec3(ink, zc / 60.0, dot(nc, nc));
    if (co > 0.5) { vec3 r0 = texture2D(tColor, vUv).rgb; if (r0.r < 0.03 && r0.b < 0.03 && r0.g > 0.97) c = vec3(0.0, 1.0, 0.0); }
    gl_FragColor = vec4(c, 1.0);
  }`,
});
const brightMat = new THREE.ShaderMaterial({ uniforms: { tColor: { value: null }, texel: { value: new THREE.Vector2(1 / W, 1 / H) }, th: bloomU.th }, vertexShader: FSV,
  fragmentShader: `uniform sampler2D tColor; uniform vec2 texel; uniform float th; varying vec2 vUv;
  void main(){ vec3 c = vec3(0.0); for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) c += texture2D(tColor, vUv + vec2(float(x), float(y)) * texel * 1.5).rgb; c /= 9.0;
    float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th + 0.35, l), 1.0); }` });
const blurMat = new THREE.ShaderMaterial({ uniforms: { tColor: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: FSV,
  fragmentShader: `uniform sampler2D tColor; uniform vec2 dir; varying vec2 vUv;
  void main(){ vec3 c = texture2D(tColor, vUv).rgb * 0.1585; float w[8]; w[0]=0.1465; w[1]=0.1156; w[2]=0.0783; w[3]=0.0455; w[4]=0.0227; w[5]=0.0097; w[6]=0.0036; w[7]=0.0011;
    for (int i = 0; i < 8; i++) { vec2 o = dir * (float(i) + 1.0) * 1.6; c += (texture2D(tColor, vUv + o).rgb + texture2D(tColor, vUv - o).rgb) * w[i]; }
    gl_FragColor = vec4(c, 1.0); }` });
const paintMat = new THREE.ShaderMaterial({ uniforms: { tColor: { value: rtPost.texture }, tND: { value: rtND.texture }, texel: { value: new THREE.Vector2(1 / W, 1 / H) }, rad: { value: 6.0 * PX } }, vertexShader: FSV,
  fragmentShader: `uniform sampler2D tColor; uniform sampler2D tND; uniform vec2 texel; uniform float rad; varying vec2 vUv;
  void main(){ vec3 c0 = texture2D(tColor, vUv).rgb; vec4 nd = texture2D(tND, vUv);
    if (dot(nd.xyz, nd.xyz) < 0.25) { gl_FragColor = vec4(c0, 1.0); return; }
    float r = rad * clamp(12.0 / max(nd.a, 0.5), 0.5, 1.0);
    vec3 m[4]; vec3 s[4]; for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); }
    for (int j = -4; j <= 4; j++) for (int i = -4; i <= 4; i++) { vec2 o = vec2(float(i), float(j)) / 4.0 * r; vec3 c = texture2D(tColor, vUv + o * texel).rgb;
      if (i <= 0 && j <= 0) { m[0] += c; s[0] += c * c; } if (i >= 0 && j <= 0) { m[1] += c; s[1] += c * c; } if (i <= 0 && j >= 0) { m[2] += c; s[2] += c * c; } if (i >= 0 && j >= 0) { m[3] += c; s[3] += c * c; } }
    float best = 1e9; vec3 outc = c0; for (int k = 0; k < 4; k++) { vec3 mu = m[k] / 25.0; vec3 v = s[k] / 25.0 - mu * mu; float sg = v.r + v.g + v.b; if (sg < best) { best = sg; outc = mu; } }
    gl_FragColor = vec4(mix(c0, outc, 0.55), 1.0); }` });
const dofMat = new THREE.ShaderMaterial({
  uniforms: { tColor: { value: rtPaint.texture }, tND: { value: rtND.texture }, tBloom: { value: rtB1.texture }, bk: bloomU.k, texel: { value: new THREE.Vector2(1 / W, 1 / H) }, focus: { value: 10 }, cInf: { value: 0 }, cMax: { value: 18 * PX }, uFar: { value: 1 } },
  vertexShader: FSV,
  fragmentShader: `uniform sampler2D tColor; uniform sampler2D tND; uniform sampler2D tBloom; uniform float bk; uniform vec2 texel; uniform float focus; uniform float cInf; uniform float cMax; uniform float uFar; varying vec2 vUv;
  float coc(float z){ z = z > 0.0 ? z : 1e5; float k = 1.0 - focus / max(z, 0.05); return min(cMax, cInf * abs(k) * (k > 0.0 ? uFar : 1.0)); }
  vec3 enc(vec3 c){ c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
  void main(){
    vec3 c0 = texture2D(tColor, vUv).rgb;
    float cc = coc(texture2D(tND, vUv).a);
    vec3 bl = texture2D(tBloom, vUv).rgb * bk;
    if (cInf < 0.3 || cc < 0.6) { gl_FragColor = vec4(enc(c0 + bl), 1.0); return; }
    vec3 acc = c0; float ws = 1.0;
    for (int i = 0; i < 48; i++) {
      float fi = float(i) + 0.5, r = sqrt(fi / 48.0) * cc, a = fi * 2.39996;
      vec2 uv = vUv + vec2(cos(a), sin(a)) * r * texel;
      float cq = coc(texture2D(tND, uv).a);
      float w = clamp(cq - r + 1.0, 0.0, 1.0);
      acc += texture2D(tColor, uv).rgb * w; ws += w;
    }
    gl_FragColor = vec4(enc(acc / ws + bl), 1.0);
  }`,
});

// ---------- sky environment (PMREM) ----------
const pmrem = new THREE.PMREMGenerator(renderer); const envScene = new THREE.Scene(); const envCache = new Map();
const envFor = (L) => {
  const key = [L.top, L.mid, L.hor].join(); if (envCache.has(key)) return envCache.get(key);
  envScene.clear(); const m = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat.clone()); m.material.uniforms = THREE.UniformsUtils.clone(skyMat.uniforms); envScene.add(m);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(L.gnd[0], L.gnd[1], L.gnd[2]).multiplyScalar(1.4) })); gnd.position.y = -1; envScene.add(gnd);
  const rt = pmrem.fromScene(envScene, 0.02); if (envCache.size > 24) { const k0 = envCache.keys().next().value; envCache.get(k0).dispose(); envCache.delete(k0); } envCache.set(key, rt.texture); return rt.texture;
};
// ---------- per-frame ----------
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const col = (c) => new THREE.Color(c);
const applyLight = (L, S) => {
  const d = new THREE.Vector3(Math.cos(L.el * Math.PI / 180) * Math.cos(L.az * Math.PI / 180), Math.sin(L.el * Math.PI / 180), Math.cos(L.el * Math.PI / 180) * Math.sin(L.az * Math.PI / 180)).normalize();
  sun.color.setRGB(L.sun[0], L.sun[1], L.sun[2]); sun.intensity = Math.PI * 1.62;
  hemi.color.setRGB(L.amb[0], L.amb[1], L.amb[2]); hemi.groundColor.setRGB(L.gnd[0], L.gnd[1], L.gnd[2]); hemi.intensity = Math.PI * 0.5;
  const c = v3(S.shadow.c), r = S.shadow.r;
  sun.position.copy(c).addScaledVector(d, 200); sun.target.position.copy(c);
  const sc = sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = 420; sc.updateProjectionMatrix();
  skyMat.uniforms.top.value.copy(col(L.top)).convertSRGBToLinear(); skyMat.uniforms.hor.value.copy(col(L.hor)).convertSRGBToLinear(); skyMat.uniforms.mid.value.copy(col(L.mid)).convertSRGBToLinear();
  skyMat.uniforms.sunDir.value.copy(d); skyMat.uniforms.sunCol.value.setRGB(L.sun[0] * 0.6, L.sun[1] * 0.5, L.sun[2] * 0.4); skyMat.uniforms.sunSize.value = L.disc || 0;
  scene.fog.color.copy(col(L.hor)).lerp(col(L.mid), 0.45).convertSRGBToLinear(); scene.fog.near = L.fog[0] * 0.3; scene.fog.far = L.fog[1] * 0.42;
  scene.environment = envFor(L);
  inkMat.uniforms.fogCol.value.copy(scene.fog.color);
  inkMat.uniforms.sat.value = L.sat * 1.12; inkMat.uniforms.expo.value = L.expo ?? 1;
  inkMat.uniforms.lift.value.set(L.lift[0] * 0.35, L.lift[1] * 0.35, L.lift[2] * 0.35); inkMat.uniforms.gain.value.set(L.gain[0], L.gain[1], L.gain[2]);
  const LL = S.lamps || [];
  lamps.forEach((l, i) => { const q = LL[i]; l.visible = !!q; if (q) { l.position.set(...q.pos); l.color.setRGB(...(q.col || [1, 0.72, 0.42])); l.intensity = (q.int ?? 6) * Math.PI; l.distance = q.dist ?? 9; l.decay = 2; } });
  inkMat.uniforms.inkK.value = L.ink ?? 0.1; inkMat.uniforms.ao.value = 1.0;
  bloomU.k.value = (L.bloom ?? 0.55) * 0.56; bloomU.th.value = Math.max(0.76, L.bth ?? 0.72);
  return d;
};

const camRightOf = () => { const r = new THREE.Vector3(); camera.matrixWorld.extractBasis(r, new THREE.Vector3(), new THREE.Vector3()); return r; };
const easeOutC = (t) => 1 - (1 - t) ** 3;
window.renderFrame = (f) => {
  let S = window.BG ? bgState(f) : window.SHEET ? sheetState(f) : frameState(f);
  // composite mode: shots listed in window.COMP render characters only on green with a locked camera
  const CO = !!(window.COMP && window.COMP.includes(S.shot));
  if (CO) { const sh = shotAt(f), mid = Math.round(sh.a + (sh.b - sh.a) * 0.6); S = { ...S, cam: frameState(mid).cam, vign: 0, flash: 0 }; }
  // camera
  camera.position.set(...S.cam.pos); camera.up.set(0, 1, 0); camera.lookAt(...S.cam.look);
  camera.fov = S.cam.fov; camera.updateProjectionMatrix();
  if (S.cam.roll) camera.rotateZ((S.cam.roll * Math.PI) / 180);
  camera.updateMatrixWorld();
  applyLight(S.light, S);
  // set pieces
  const W0 = S.world; window.W18 = W0;
  if (millHead) millHead.rotation.z = -f * 0.12;
  truck.visible = !!W0.truck;
  if (W0.truck) { truck.position.set(...W0.truck.pos); truck.rotation.y = W0.truck.ry || 0; truck.userData.wheels.forEach((w) => (w.rotation.x = (W0.truck.roll || 0))); truck.userData.gun.rotation.y = W0.truck.aim || 0; truck.userData.gun.rotation.x = W0.truck.tip || 0; }
  tripodGun.visible = !!W0.tripod;
  if (W0.tripod) { tripodGun.position.set(...W0.tripod.pos); tripodGun.rotation.y = W0.tripod.ry || 0; tripodGun.userData.gun.rotation.x = W0.tripod.tip || 0; }
  ammoStack.visible = !!W0.ammo;
  if (W0.ammo) { ammoStack.position.set(...W0.ammo.pos); ammoStack.rotation.y = W0.ammo.ry || 0; ammoStack.children.forEach((b) => (b.visible = b.userData.k < W0.ammo.n)); }
  animators.forEach((fn) => fn(f, camera));
  cable.visible = !!W0.cable; if (W0.cable) { cable.position.set(W0.cable.x, 0.05, W0.cable.z ?? 0); cable.rotation.y = W0.cable.ry ?? Math.PI / 2; }
  soapbox.visible = !!W0.box; soapbox.position.set(20, 0.04, -0.6);
  funeral.visible = !!W0.funeral; if (W0.funeral) funeral.position.set(...W0.funeral);
  bayBridge.visible = W0.bridge !== false; bayBridge.position.y = W0.bridgeY ?? 0;
  lampHeads.forEach((l) => l.material.color.setRGB(...(W0.lampsOn ? [1, 0.85, 0.55] : [0.8, 0.78, 0.7])));
  placeMeat(W0.meat || null); lab.visible = !!W0.lab; if (W0.lab) { lab.position.set(...W0.lab.pos); lab.rotation.y = W0.lab.ry || 0; }
  rays.visible = false; if (false)
  if (false && W0.rays) { const R = W0.rays; rays.position.set(...R.pos); rays.rotation.set(R.rx || 0, R.ry || 0, 0); rays.scale.set(R.w || 4, R.len || 9, 1); rays.children.forEach((m) => (m.material.opacity = R.alpha ?? 0.5)); }
  // cards
  const seen = new Set();
  for (const a of S.actors) {
    const c = getCard(a.id, 600, 1000); seen.add(a.id);
    const key = a.kind + JSON.stringify(a.opts) + (a.outfitKey || "");
    if (key !== c.key) {
      c.key = key;
      c.g.setTransform(1, 0, 0, 1, 0, 0); c.g.clearRect(0, 0, c.cv.width, c.cv.height);
      c.g.setTransform(c.sc, 0, 0, c.sc, 0, 0);
      drawFn[a.kind](new T.Pen(c.g), a);
      paperize(c.g, c.cv);
      c.tex.needsUpdate = true;
    }
    const y = a.y ?? 0, s = a.scale || 1;
    c.mesh.position.set(a.pos[0], y + (a.lift || 0), a.pos[1]);
    c.mesh.scale.set(s * (a.mirror ? -1 : 1) * (a.sx ?? 1), s * (a.sy ?? 1), s);
    if (a.bill) { c.mesh.quaternion.copy(camera.quaternion); if (a.roll) c.mesh.rotateZ((a.roll * Math.PI) / 180); } else c.mesh.rotation.set(0, Math.atan2(camera.position.x - a.pos[0], camera.position.z - a.pos[1]), ((a.roll || 0) * Math.PI) / 180);
    { const G = (S.light.glow ?? 0.32) * 0.75, tc = S.light.card, wm = S.light.warm || [1, 1, 1]; c.mesh.material.color.setRGB(tc[0] * (1 - G) + G * wm[0], tc[1] * (1 - G) + G * wm[1], tc[2] * (1 - G) + G * wm[2]); }
    { const sd = sun.position.clone().sub(sun.target.position).normalize(), rr = camRightOf(), fw = new THREE.Vector3(); camera.getWorldDirection(fw); const mir = a.mirror ? -1 : 1;
      const sx = sd.dot(rr), sy = Math.max(0, sd.y), sb = Math.max(0, sd.dot(fw)), lum = Math.min(1.3, (S.light.sun[0] + S.light.sun[1] + S.light.sun[2]) / 3);
      c.sunU.value.set(Math.max(-1, Math.min(1, sx * 1.6)) * mir, sy, sb, 1.3 * lum); c.fillU.value = 0.0; c.keyU.value = 0; } c.edgeU.value = a.edge ?? 0.13;
    c.pullU.value = a.pull ?? 0.3;
    c.mesh.visible = a.visible !== false;
    c.blob.visible = a.visible !== false && a.blob !== false;
    c.blob.position.set(a.pos[0], y + 0.03, a.pos[1]);
    c.blob.scale.setScalar(s * Math.max(0.5, 1 - (a.lift || 0) * 2));
    c.blob.rotation.y = c.mesh.rotation.y;
  }
  for (const [id, c] of cards) if (!seen.has(id)) { c.mesh.visible = false; c.blob.visible = false; }
  // crowd
  const C = S.crowd;
  if (C) C.variants.forEach((v, k) => {
    const cvr = crowdVar[k], key = JSON.stringify(v.opts);
    if (key !== cvr.key) { cvr.key = key; cvr.g.setTransform(1, 0, 0, 1, 0, 0); cvr.g.clearRect(0, 0, cvr.cv.width, cvr.cv.height); cvr.g.setTransform(CSC, 0, 0, CSC, 0, 0); (v.kind === "bunny" ? bunnyCard : v.kind === "emu" ? T.bodyEmu : v.kind === "chicken" ? T.bodyChicken : v.kind === "vulture" ? T.bodyVulture : T.bodyFolk)(new T.Pen(cvr.g), v.outfit, v.opts); cvr.tex.needsUpdate = true; }
    { const G = (S.light.glow ?? 0.32) * 0.3, tc = S.light.card, wm = S.light.warm || [1, 1, 1]; cvr.mat.color.setRGB(tc[0] * (1 - G) + G * wm[0], tc[1] * (1 - G) + G * wm[1], tc[2] * (1 - G) + G * wm[2]); }
  });
  let used = new Set();
  if (C) for (const pr of C.people) {
    const m = crowdMesh(pr.i); used.add(pr.i);
    m.position.set(pr.x, pr.lift || 0, pr.z); const s = pr.s || 1;
    m.scale.set(s * ((pr.m ?? (pr.i >> 2) % 2) ? -1 : 1), s, s);
    m.rotation.set(0, Math.atan2(camera.position.x - pr.x, camera.position.z - pr.z), ((pr.roll || 0) * Math.PI) / 180);
    m.visible = true;
  }
  crowdPool.forEach((m, i) => { if (!used.has(i)) m.visible = false; });
  // fx
  const seenFx = new Set();
  for (const e of (window.NOFX ? [] : S.fx)) {
    const c = getFx(e.id, e.kind); seenFx.add(e.id);
    const key = JSON.stringify([e.t, e.seed, e.col, e.side, e.lines, e.head, e.big, e.mag, e.icon, e.text, e.title, e.pic, e.lines && e.lines.join()]);
    if (key !== c.key) {
      c.key = key; c.g.setTransform(1, 0, 0, 1, 0, 0); c.g.clearRect(0, 0, c.cv.width, c.cv.height);
      fxDraw[e.kind](new T.Pen(c.g), e); c.tex.needsUpdate = true;
    }
    c.mesh.position.set(...e.pos);
    if (e.flat) { c.mesh.rotation.set(-Math.PI / 2, 0, e.rot || 0); }
    else if (e.ry !== undefined) { const qf = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, e.ry, e.rot || 0)); c.mesh.quaternion.copy(camera.quaternion).slerp(qf, e.stick ?? 1); }
    else { c.mesh.quaternion.copy(camera.quaternion); if (e.rot) c.mesh.rotateZ(e.rot); }
    c.mesh.scale.set(e.size * (e.mirror ? -1 : 1) * (e.sx ?? 1), e.size, e.size);
    c.mesh.material.opacity = e.alpha ?? 1;
    c.mesh.material.color.setRGB(...(e.kind === "glow" ? [1, 1, 1] : S.light.card));
    c.mesh.visible = true;
  }
  for (const [id, c] of fxCards) if (!seenFx.has(id)) c.mesh.visible = false;
  for (const [i, m] of clouds.entries()) { m.visible = true; const b = m.userData.base; m.position.set(b[0] + f * 0.25 * (1 + (i % 3) * 0.3), b[1], b[2]); m.quaternion.copy(camera.quaternion); m.material.color.setRGB(...S.light.cloud); }
  sky.position.copy(camera.position);

  // pass 1: colour
  const coHidden = [];
  if (CO) { const keep = new Set(); for (const [, c] of cards) keep.add(c.mesh); for (const [, c] of fxCards) keep.add(c.mesh); for (const p of crowdPool) keep.add(p);
    scene.traverse((o) => { if ((o.isMesh || o.isLine || o.isPoints) && o.visible && !keep.has(o)) { coHidden.push(o); o.visible = false; } }); bloomU.k.value = 0; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.needsUpdate = true;
  renderer.setRenderTarget(rtColor); renderer.setClearColor(CO ? 0x00ff00 : 0x000000, 1); renderer.clear();
  renderer.render(scene, camera);
  // pass 2: normal + depth (world inked, cards = depth only, everything else hidden)
  const hidden = [], swapped = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    if (o.userData.nd) { swapped.push([o, o.material]); o.material = o.userData.nd; }
    else if (o.userData.inked) { swapped.push([o, o.material]); o.material = ndWorld; }
    else { hidden.push(o); o.visible = false; }
  });
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(rtND); renderer.setClearColor(0x000000, 0); renderer.clear();
  renderer.render(scene, camera);
  scene.fog = fog;
  for (const [o, m] of swapped) o.material = m;
  for (const o of hidden) o.visible = true;
  // pass 3: ink + grade
  inkMat.uniforms.dbg.value = window.INKDBG ? 1 : 0;
  inkMat.uniforms.co.value = CO ? 1 : 0; inkMat.uniforms.flash.value = S.flash || 0; inkMat.uniforms.vign.value = S.vign ?? 0.18;
  fsQuad.material = inkMat; renderer.setRenderTarget(rtPost); renderer.render(fsScene, fsCam);
  // pass 3a: painterly world
  fsQuad.material = paintMat; renderer.setRenderTarget(rtPaint); renderer.render(fsScene, fsCam);
  // pass 3b: bloom (quarter res, two blur rounds)
  brightMat.uniforms.tColor.value = rtPaint.texture; fsQuad.material = brightMat; renderer.setRenderTarget(rtB1); renderer.render(fsScene, fsCam);
  for (let k = 0; k < 2; k++) {
    blurMat.uniforms.tColor.value = rtB1.texture; blurMat.uniforms.dir.value.set((1 + k) / BW, 0); fsQuad.material = blurMat; renderer.setRenderTarget(rtB2); renderer.render(fsScene, fsCam);
    blurMat.uniforms.tColor.value = rtB2.texture; blurMat.uniforms.dir.value.set(0, (1 + k) / BH); renderer.setRenderTarget(rtB1); renderer.render(fsScene, fsCam);
  }
  // pass 4: lens blur -> screen
  dofMat.uniforms.focus.value = S.dof.focus; dofMat.uniforms.uFar.value = S.dof.far ?? 1; dofMat.uniforms.cInf.value = window.NODOF ? 0 : S.dof.cInf * PX;
  if (CO) dofMat.uniforms.cInf.value = 0;
  fsQuad.material = dofMat; renderer.setRenderTarget(null); renderer.render(fsScene, fsCam);
  for (const o of coHidden) o.visible = true;
  return CO ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.95);
};
window.TOTAL = TOTAL;
window.dbgND = () => { const out = []; const buf = new Float32Array(4); for (const [x, y] of [[540, 1700], [540, 1200], [540, 900], [540, 700], [300, 300], [800, 1500]]) { renderer.readRenderTargetPixels(rtND, x, y, 1, 1, buf); out.push([x, y, ...Array.from(buf).map((v) => +v.toFixed(3))]); } return JSON.stringify(out); };
window.exportRegion = async (b) => { // [x0, x1, z0, z1]: every world mesh in the box (instances expanded), plus a ground patch
  const { GLTFExporter } = await import("./node_modules/three/examples/jsm/exporters/GLTFExporter.js");
  const names = new Map(Object.entries(MW).filter(([, v]) => v && v.isMaterial).map(([k, v]) => [v, k]));
  const inB = (p) => p.x >= b[0] && p.x <= b[1] && p.z >= b[2] && p.z <= b[3], grp = new THREE.Group(), V = new THREE.Vector3(), M = new THREE.Matrix4(), WM = new THREE.Matrix4();
  const add = (geo, mat, mtx, tag) => { const nm = names.get(mat); if (!nm || nm === "water" || nm === "far") return; const g = geo.clone().applyMatrix4(mtx); const ms = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ name: nm })); ms.name = tag + ":" + nm; grp.add(ms); };
  scene.updateMatrixWorld(true);
  scene.traverse((o) => { if (!o.isMesh || !o.visible) return;
    if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); WM.multiplyMatrices(o.matrixWorld, M); V.setFromMatrixPosition(WM); if (inB(V)) add(o.geometry, o.material, WM, "i"); } return; }
    o.getWorldPosition(V); if (inB(V)) { add(o.geometry, o.material, o.matrixWorld, "m"); o.userData.region = true; } });
  const pg = new THREE.PlaneGeometry(b[1] - b[0], b[3] - b[2], 80, 80); pg.rotateX(-Math.PI / 2); pg.translate((b[0] + b[1]) / 2, 0, (b[2] + b[3]) / 2); const pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) pp.setY(i, hAt(pp.getX(i), pp.getZ(i)) + 0.02);
  const fl = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ name: "sand" })); fl.name = "floor:sand"; grp.add(fl);
  const buf = await new Promise((res, rej) => new GLTFExporter().parse(grp, res, rej, { binary: true }));
  let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { n: grp.children.length, b64: btoa(s) };
};
const BAKEB = [-62, 62, -46, 34], MWSET = new Set(Object.values(MW).filter((v) => v && v.isMaterial));
(async () => {
  if (!window.NOBAKE) { try {
    const { GLTFLoader } = await import("./node_modules/three/examples/jsm/loaders/GLTFLoader.js"); const gl = await new GLTFLoader().loadAsync("baked/region.glb");
    const V = new THREE.Vector3(), inB = (p) => p.x >= BAKEB[0] && p.x <= BAKEB[1] && p.z >= BAKEB[2] && p.z <= BAKEB[3];
    scene.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || o === GROUND) return; const nm = o.material && o.material.name; o.getWorldPosition(V); if (inB(V) && MWSET.has(o.material) && o.material !== MW.water && o.material !== MW.red && o.material !== MW.glass) { o.material = new THREE.MeshBasicMaterial({ visible: false }); } });
    for (const im of scene.children.filter((o) => o.isInstancedMesh && o.material !== MW.water)) { const M = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, M); V.setFromMatrixPosition(M); if (inB(V)) { M.scale(new THREE.Vector3(0, 0, 0)); im.setMatrixAt(i, M); } } im.instanceMatrix.needsUpdate = true; }
    gl.scene.traverse((o) => { if (!o.isMesh) return; const map = o.material.map; if (map) { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; } o.material = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide }); o.userData.inked = true; o.receiveShadow = true; });
    scene.add(gl.scene);
  } catch (e) { console.warn("no bake", e.message); } }
  window.ready = true;
})();