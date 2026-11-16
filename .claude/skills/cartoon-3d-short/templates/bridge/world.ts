// The whole place as one three.js scene: sky, river, banks, town, the chain bridge (deck, rails, hangers, chains,
// backstays, anchors, bunting, flags) deformed every frame from the story physics, the park swing, smoke, clouds
// and the cast. update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, Strand, boxGeo, V, lam, buildTown, flagTex, Kit, Ray, kitClone } from "./build";
import { beam, bed, rep, ctex, planksHD, beamHD, stoneHD, cobbleHD, grassHD, chainHD, waterNear, waterFar, cloudHD } from "./paint";
import { Pen, fxSign } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage, snapFx, splashFx, creakFx, SIGN_AT, SU_SWING } from "./cast";
import { FPS, D0, SHOTS, PARK, ANCHOR, SNAP, camAt, bridgeState, deckY, dropW, shapeZ, snapEnd, front, BridgeState, V3, smooth, FOREGROUND, ShotDef } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lily_large", "lantern", "cart", "stall-red",
  "stall-green", "stall-bench", "banner-red", "banner-green", "windmill", "canoe"];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

// ---------------- bridge geometry constants ----------------
const NZ = 121; // deck samples every 0.5 m from z = -30 to 30
const ZS = Array.from({ length: NZ }, (_, j) => -30 + j * 0.5);
const POSTS = Array.from({ length: 41 }, (_, k) => -30 + k * 1.5);
const HANG = Array.from({ length: 35 }, (_, k) => -25.5 + k * 1.5);
const CZ = Array.from({ length: 73 }, (_, k) => -27 + k * 0.75);
const FLAGS = Array.from({ length: 47 }, (_, k) => -25.3 + k * 1.1);
const catY = (z: number) => 8.5 + 8.1 * (z / 27) ** 2; // lowest link 2.5 m over the planks, clear of the faces
export const chainY = (z: number, b: BridgeState) => {
  const intact = catY(z) + b.bounce * shapeZ(z) * 0.85, k = b.drop * dropW(z);
  return intact + (deckY(z, b) + 0.3 - intact) * k;
};
export const BOLT: V3 = [ANCHOR[0], ANCHOR[1] + 0.24, ANCHOR[2]];
const TOP = 16.6;

const beamBetween = (a: THREE.Vector3, b: THREE.Vector3, th: number) => {
  const g = new THREE.BoxGeometry(th, a.distanceTo(b), th);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1));
  return g.applyMatrix4(m);
};
/** sun disc (solid, soft rim) and the flat golden halo (lighting.md 6 / depth.md 6.4: r50 13-26 % of the frame width) */
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** per-shot sun override (lighting.md 9.1 notes: front-light the town wide); story.ts ShotDef sunAz/sunEl win if present */
// shot 12: the park is ringed by trees and houses, so a low sun ahead-right puts the whole lawn in their shadow
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 2: { az: 120 }, 11: { az: -70, el: 8 }, 12: { az: -30, el: 18 } };
const smokeTex = () => ctex("smoke", 256, 256, (g) => {
  const p = new Pen(g);
  for (const [x, y, r, c] of [[90, 150, 60, "#8f8d96"], [150, 120, 70, "#a3a1aa"], [170, 165, 55, "#8f8d96"], [120, 100, 50, "#b4b2ba"]] as const) p.ell(x, y, r, r * 0.85, c, 0);
});

/** every lens position of the film looking at its subject: centre, sides and top of frame (houses there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

type Mats = Record<string, THREE.Material>;

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private swing: Actor;
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private deckTop: THREE.BufferGeometry; private deckSide: THREE.BufferGeometry;
  private posts: THREE.InstancedMesh; private hangers: THREE.InstancedMesh; private ribs: THREE.InstancedMesh; private bunting: THREE.InstancedMesh;
  private rails: Strand[] = []; private chains: Strand[] = []; private stays: Strand[] = [];
  private boltA: THREE.Mesh; private boltB: THREE.Mesh; private eye: THREE.Mesh;
  private flags: THREE.Mesh[] = [];
  private smoke: { m: THREE.Mesh; mat: THREE.MeshLambertMaterial; top: V3; k: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private sign = new THREE.Group();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
    // ---- sky + light ----
    // sky: 5 colour stops by elevation (textures.md 5.2 #5 + depth.md 2/6.5), written as tone-map-inverted linear values
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- ground, river, quays (static batch) ----
    const b = new Batch();
    // HD painted textures (textures.md 5.1/5.2); every material is two-tone via lam() (shade.ts)
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.wall = lam("wallHD", () => ({ map: stoneHD("wallHD", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
    M.cope = lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    M.tower = lam("towerHD", () => ({ map: stoneHD("towerHD") }));
    // iron: a coloured dark (navy, L* 16-22 in shade, never black) with one soft metal highlight (lighting.md 9.3)
    M.iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 60 }), 0.15);
    M.steel = twoTone(new THREE.MeshPhongMaterial({ color: "#7d8088", specular: "#b0b0b0", shininess: 45 }), 0.15); // bolts + eyes
    M.wood = lam("wood", () => ({ map: beam() }));
    M.bed = lam("bed", () => ({ map: bed() }));
    M.sand = lam("sand", () => ({ color: "#e2c992" }));
    for (const s of [-1, 1]) {
      const zn = s * 30, zf = s * 900;
      b.add(s < 0 ? quadUp(-900, 900, zf, zn, 450, 217.5) : quadUp(-900, 900, zn, zf, 450, 217.5), M.grass);
      b.add(s < 0 ? quadUp(-160, 160, -36.5, -30, 80, 1.625, 0.012) : quadUp(-160, 160, 30, 36.5, 80, 1.625, 0.012), M.cobble);
      b.add(s < 0 ? quadUp(-6, 6, -170, -36.5, 3, 33.375, 0.012) : quadUp(-6, 6, 36.5, 170, 3, 33.375, 0.012), M.cobble);
      // embankment wall facing the river, parapet with a gap for the bridge
      b.add(s < 0 ? wallQuad(-900, 900, -30, 1) : wallQuad(900, -900, 30, -1), M.wall);
      for (const [x0, x1] of [[-600, -4.6], [4.6, 600]]) b.add(boxGeo(V(x0, D0, s < 0 ? -30.5 : 30), V(x1, D0 + 0.75, s < 0 ? -30 : 30.5), 2), M.cope);
      b.add(boxGeo(V(-600, D0 - 0.05, s < 0 ? -30.6 : 29.4), V(600, D0 + 0.02, s < 0 ? -29.4 : 30.6), 2), M.cope);
    }
    b.add(quadUp(-900, 900, -30, 30, 225, 7.5, -0.6 - D0), M.bed);
    // towers: twin stone columns on plinths, lintel, cornice, pyramid caps, iron saddles; flag poles
    for (const zc of [-27, 27]) {
      for (const xc of [-3.35, 3.35]) {
        b.add(boxGeo(V(xc - 0.7, -0.6, zc - 0.8), V(xc + 0.7, 15.6, zc + 0.8), 2), M.tower);
        b.add(boxGeo(V(xc - 0.95, -0.6, zc - 1.05), V(xc + 0.95, 1.1, zc + 1.05), 2), M.tower);
        // string course nearly flush (1 cm): an 8 cm ledge top aliased into a lit dashed line in the low golden sun (f1350)
        b.add(boxGeo(V(xc - 0.71, D0 + 3.0, zc - 0.81), V(xc + 0.71, D0 + 3.45, zc + 0.81), 2), M.cope);
        const cap = new THREE.ConeGeometry(0.98, 1.5, 4); cap.rotateY(Math.PI / 4);
        b.add(cap, M.tower, new THREE.Matrix4().makeTranslation(xc, 17.9 + 0.75, zc));
      }
      b.add(boxGeo(V(-4.05, 15.6, zc - 0.8), V(4.05, 17.4, zc + 0.8), 2, true), M.tower);
      b.add(boxGeo(V(-4.3, 17.4, zc - 1.0), V(4.3, 17.9, zc + 1.0), 2, true), M.cope);
      for (const x of [-2.7, 2.7]) b.add(boxGeo(V(x - 0.22, 16.25, zc - 0.92), V(x + 0.22, 16.95, zc + 0.92), 0, true), M.iron);
      b.add(boxGeo(V(-0.07, 17.9, zc - 0.07), V(0.07, 21.4, zc + 0.07)), M.wood);
      // anchorages on the bank behind each tower
      for (const x of [-2.7, 2.7]) {
        const za = Math.sign(zc) * 37;
        b.add(boxGeo(V(x - 1.0, D0 - 0.4, za - 1.3), V(x + 1.0, D0 + 0.5, za + 1.3), 2), M.cope);
        b.add(boxGeo(V(x - 0.45, D0 + 0.5, za - 0.6), V(x + 0.45, D0 + 0.58, za + 0.6)), M.iron);
        for (const s of [-1, 1]) b.add(boxGeo(V(x + s * 0.15 - 0.045, D0 + 0.58, za - 0.22), V(x + s * 0.15 + 0.045, D0 + 1.02, za + 0.22)), M.iron);
        if (!(x < 0 && za < 0)) {
          const bolt = new THREE.CylinderGeometry(0.075, 0.075, 0.62, 10); bolt.rotateZ(Math.PI / 2);
          b.add(bolt, M.steel, new THREE.Matrix4().makeTranslation(x, D0 + 0.86, za));
          const eye = new THREE.TorusGeometry(0.17, 0.05, 8, 18); eye.rotateY(Math.PI / 2);
          b.add(eye, M.steel, new THREE.Matrix4().makeTranslation(x, D0 + 0.86, za));
        }
      }
    }
    // park swing set (frame only; the swing itself is a sprite hanging from the bar at PARK, travelling in x):
    // top bar along z, one A-frame at each end (legs spread in x, wide enough that the arc stays inside both A's
    // on screen), the seat midway between them
    // (A's at z +-2.2 with legs +-3.0: the near A is close enough to the lens that the parent and the arc stay inside it)
    for (const zz of [-2.2, 2.2]) for (const s of [-1, 1])
      b.add(beamBetween(V(PARK[0], D0 + 3.0, PARK[2] + zz), V(PARK[0] + s * 3.0, D0, PARK[2] + zz), 0.15), M.wood);
    b.add(beamBetween(V(PARK[0], D0 + 3.0, PARK[2] - 2.35), V(PARK[0], D0 + 3.0, PARK[2] + 2.35), 0.17), M.wood);
    const sandG = new THREE.CircleGeometry(3.4, 32); sandG.rotateX(-Math.PI / 2);
    b.add(sandG, M.sand, new THREE.Matrix4().makeTranslation(PARK[0], D0 + 0.012, PARK[2]));
    b.build(R);
    buildTown(R, kit, sightLines());

    // water: its own mesh so the ripples can drift
    // river: depression-angle gradient + sparse marks (textures.md 5.2 #4), sun visibility captured for the bridge shadow
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "river1";
    const wm = new THREE.Mesh(quadUp(-900, 900, -30, 30, 1, 1, -D0), waterM);
    wm.receiveShadow = true;
    R.add(wm);

    // ---- bridge (dynamic) ----
    this.deckTop = new THREE.BufferGeometry();
    this.deckTop.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NZ * 2 * 3), 3));
    this.deckTop.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(NZ * 2 * 3), 3));
    this.deckTop.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(ZS.flatMap((z) => [0, z / 2, 2.5, z / 2])), 2));
    const ti: number[] = [];
    for (let j = 0; j < NZ - 1; j++) { const a = j * 2, c = j * 2 + 1, d = (j + 1) * 2, e = (j + 1) * 2 + 1; ti.push(a, d, e, a, e, c); }
    this.deckTop.setIndex(ti);
    this.deckSide = new THREE.BufferGeometry();
    this.deckSide.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NZ * 6 * 3), 3));
    const sn: number[] = [], su: number[] = [], si: number[] = [];
    ZS.forEach((z) => { sn.push(-1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, -1, 0, 0, -1, 0); su.push(z / 3, 0, z / 3, 0.3, z / 3, 0, z / 3, 0.3, z / 3, 0, z / 3, 1.2); });
    for (let j = 0; j < NZ - 1; j++) {
      const A = (k: number) => j * 6 + k, B = (k: number) => (j + 1) * 6 + k;
      si.push(A(0), A(1), B(1), A(0), B(1), B(0), A(2), B(2), B(3), A(2), B(3), A(3), A(4), A(5), B(5), A(4), B(5), B(4));
    }
    this.deckSide.setAttribute("normal", new THREE.Float32BufferAttribute(sn, 3));
    this.deckSide.setAttribute("uv", new THREE.Float32BufferAttribute(su, 2));
    this.deckSide.setIndex(si);
    const deckM = lam("planksHD", () => ({ map: planksHD() })), sideM = lam("deckSide", () => ({ map: beamHD() }));
    for (const mm of [deckM, sideM]) if (mm.map) { mm.map.anisotropy = 16; mm.map.needsUpdate = true; }
    for (const [g, m] of [[this.deckTop, deckM], [this.deckSide, sideM]] as const) {
      const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
    }
    const inst = (g: THREE.BufferGeometry, m: THREE.Material, n: number) => {
      const im = new THREE.InstancedMesh(g, m, n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; R.add(im); return im;
    };
    this.posts = inst(new THREE.BoxGeometry(0.11, 1.12, 0.11).translate(0, 0.56, 0), M.wood, POSTS.length * 2);
    this.ribs = inst(new THREE.BoxGeometry(5.7, 0.26, 0.24), M.wood, POSTS.length);
    const chainM = twoTone(lam("chainHD", () => ({ map: rep(chainHD(), 1, 1), side: THREE.DoubleSide })) as THREE.MeshLambertMaterial, 0.15);
    chainM.color.set("#8c847c"); // dark iron: darker, warm-greyed multiplier on the painted links
    this.hangers = inst(new THREE.CylinderGeometry(0.035, 0.035, 1, 5).translate(0, 0.5, 0), M.iron, HANG.length * 2);
    const pen = new THREE.BufferGeometry();
    pen.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.17, 0, 0, 0.17, 0, -0.42, 0], 3));
    pen.computeVertexNormals();
    this.bunting = inst(pen, lam("pennant", () => ({ side: THREE.DoubleSide })), FLAGS.length * 2);
    const cols = ["#d23b3b", "#f3d35a", "#3f6fb5", "#f7f1e1", "#2f8a4f"].map((c) => new THREE.Color(c));
    for (let i = 0; i < FLAGS.length * 2; i++) this.bunting.setColorAt(i, cols[i % 5]);
    for (const [w, h] of [[0.1, 0.1], [0.07, 0.07], [0.1, 0.1], [0.07, 0.07]]) { const s = new Strand(NZ, w, h, M.wood, 3); this.rails.push(s); R.add(s.mesh); }
    for (let i = 0; i < 2; i++) { const s = new Strand(CZ.length, 0.14, 0.3, chainM, 2); this.chains.push(s); R.add(s.mesh); }
    for (let i = 0; i < 4; i++) { const s = new Strand(18, 0.14, 0.3, chainM, 2); this.stays.push(s); R.add(s.mesh); }
    const half = new THREE.CylinderGeometry(0.075, 0.075, 0.31, 10); half.rotateZ(Math.PI / 2);
    this.boltA = new THREE.Mesh(half, M.steel); this.boltB = new THREE.Mesh(half, M.steel);
    const eyeG = new THREE.TorusGeometry(0.17, 0.05, 8, 18); eyeG.rotateY(Math.PI / 2);
    this.eye = new THREE.Mesh(eyeG, M.steel);
    for (const m of [this.boltA, this.boltB, this.eye]) { m.castShadow = true; R.add(m); }
    const flagM = lam("flagM", () => ({ map: flagTex(), side: THREE.DoubleSide }));
    for (const zc of [-27, 27]) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0, 12, 1), flagM);
      f.position.set(0, 20.75, zc); f.castShadow = true; f.frustumCulled = false;
      this.flags.push(f); R.add(f);
    }
    // chimney smoke
    const smokeT = smokeTex();
    for (const [top, n] of [[[-22, D0 + 30.6, -77], 7], [[-80, D0 + 24.6, 93], 6]] as const)
      for (let k = 0; k < n; k++) {
        const mat = new THREE.MeshLambertMaterial({ map: smokeT, transparent: true, depthWrite: false });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        m.layers.set(NOINK);
        this.smoke.push({ m, mat, top: top as unknown as V3, k: k / n }); R.add(m);
      }
    // the new rule's sign (shots 14-15)
    // unlit painted face: lit by the side sun it went grey-blue and the pictogram could not be read
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.04), new THREE.MeshBasicMaterial({ map: ctex("sign", 700, 520, (g) => fxSign(new Pen(g))), alphaTest: 0.5, color: 0xe6e6e6 }));
    board.layers.set(NOINK);
    board.position.set(SIGN_AT[0], D0 + 1.62, SIGN_AT[2] - 0.04); board.rotation.y = Math.PI;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.46, 1.1, 0.06), M.wood); back.position.set(SIGN_AT[0], D0 + 1.62, SIGN_AT[2] + 0.0);
    this.sign.add(board, back);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.15, 0.12), M.wood); p.position.set(SIGN_AT[0] + s * 0.52, D0 + 1.07, SIGN_AT[2] + 0.07); this.sign.add(p); }
    this.sign.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    R.add(this.sign);
    this.swing = new Actor(R, swingGeo);
    // the CAM agent's near framing objects: built once, never passed through the sight-line filter, toggled per frame
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const ss = s as ShotDef & { sunAz?: number; sunEl?: number };
    const az = THREE.MathUtils.degToRad(ss.sunAz ?? SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(ss.sunEl ?? SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], tau = s.tau(t), b = bridgeState(id, t), L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK); // sky, clouds, smoke and sun sprites live on the no-ink layer but are still rendered
    // ---- light rig (lighting.md 9.4): camera-relative sun frozen per shot, two-tone uniforms, shadow fit ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30); // el 7: 2 m cards throw ~16 m shadows, houses much longer
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0; // not used by the two-tone shading
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog (colour = horizon colour, linear fogNear -> fogFar), sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- river colours (on-screen targets, tone-map-inverted) ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // ---- foreground framing objects: inside their frames AND their own shot (so a crossfade layer never shows them) ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- bridge ----
    this.poseBridge(b, t, tau, id);
    this.sign.visible = id >= 14;
    for (const sm of this.smoke) {
      const u = (t * 0.11 + sm.k) % 1, sz = 3 + u * 9;
      sm.m.position.set(sm.top[0] - u * 18, sm.top[1] + u * 13 + u * u * 4, sm.top[2] + u * 3);
      sm.m.scale.set(sz, sz, 1); sm.m.quaternion.copy(cam.quaternion);
      sm.mat.opacity = 0.85 * (1 - u) ** 1.2;
    }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, b, { pos: cam.position, right });
    if (id === 8) {
      snapFx(tau, BOLT, st); splashFx(tau, st);
      if (tau > 33.1 && tau < SNAP) creakFx(t, [[BOLT[0] + 0.3, BOLT[1] + 0.14, BOLT[2] - 0.12], [BOLT[0] - 0.32, BOLT[1] + 0.08, BOLT[2] - 0.12]], st, 0.3);
    }
    if (id === 7 && t > 28.9) {
      const F = front(tau);
      creakFx(t, [3, 5.5, 8].map((dz) => [-2.7, chainY(F + dz, b) + 0.35, F + dz] as V3), st);
    }
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (p.geo !== "swing" && !this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = p.geo === "swing" ? this.swing : this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint); // legacy emissive card until the CHAR agent's cardShade lands
      a.mesh.castShadow = p.geo === "swing" ? true : L.actorShadow; // day: soft contact blobs instead (CHAR agent)
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    if (!used.includes(this.swing)) this.swing.mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }

  private poseBridge(b: BridgeState, t: number, tau: number, id: number) {
    const dy = ZS.map((z) => deckY(z, b));
    const top = this.deckTop.attributes.position.array as Float32Array, tn = this.deckTop.attributes.normal.array as Float32Array;
    const side = this.deckSide.attributes.position.array as Float32Array;
    for (let j = 0; j < NZ; j++) {
      const z = ZS[j], y = dy[j], slope = (dy[Math.min(NZ - 1, j + 1)] - dy[Math.max(0, j - 1)]) / ((Math.min(NZ - 1, j + 1) - Math.max(0, j - 1)) * 0.5);
      const nl = Math.hypot(1, slope);
      top.set([-2.5, y, z, 2.5, y, z], j * 6);
      tn.set([0, 1 / nl, -slope / nl, 0, 1 / nl, -slope / nl], j * 6);
      side.set([-2.5, y, z, -2.5, y - 0.45, z, 2.5, y, z, 2.5, y - 0.45, z, -2.5, y - 0.45, z, 2.5, y - 0.45, z], j * 18);
    }
    this.deckTop.attributes.position.needsUpdate = true; this.deckTop.attributes.normal.needsUpdate = true;
    this.deckSide.attributes.position.needsUpdate = true;
    const q = new THREE.Quaternion(), one = V(1, 1, 1), pos = V(0, 0, 0), scl = V(1, 1, 1);
    POSTS.forEach((z, k) => {
      const y = deckY(z, b);
      for (const [i, x] of [[0, -2.42], [1, 2.42]] as const) this.posts.setMatrixAt(k * 2 + i, this.m4.compose(pos.set(x, y, z), q, one));
      this.ribs.setMatrixAt(k, this.m4.compose(pos.set(0, y - 0.58, z), q, one));
    });
    this.posts.instanceMatrix.needsUpdate = true; this.ribs.instanceMatrix.needsUpdate = true;
    [[-2.42, 1.08], [-2.42, 0.6], [2.42, 1.08], [2.42, 0.6]].forEach(([x, h], i) => this.rails[i].set(ZS.map((z, j) => V(x, dy[j] + h, z))));
    [-2.7, 2.7].forEach((x, i) => this.chains[i].set(CZ.map((z) => V(x, chainY(z, b), z))));
    HANG.forEach((z, k) => {
      const base = deckY(z, b), up = Math.max(0.01, chainY(z, b) - base);
      for (const [i, x] of [[0, -2.62], [1, 2.62]] as const) this.hangers.setMatrixAt(k * 2 + i, this.m4.compose(pos.set(x, base, z), q, scl.set(1, up, 1)));
    });
    this.hangers.instanceMatrix.needsUpdate = true;
    // no pennants where the intact chain hangs below 3.3 m over the planks (mid-span): from the side cameras they
    // cover the shakos. Decided on the intact catenary so none pop in or out while the chain falls.
    FLAGS.forEach((z, k) => {
      const s = catY(z) - D0 > 3.3 ? 1 : 0;
      for (const [i, x] of [[0, -2.78], [1, 2.78]] as const) this.bunting.setMatrixAt(k * 2 + i, this.m4.compose(pos.set(x, chainY(z, b) - 0.1, z), q, scl.set(s, s, s)));
    });
    this.bunting.instanceMatrix.needsUpdate = true;
    // backstays: far pair intact; near pair drapes over the wall when the end drops; near-left one snaps first
    const sag = (a: THREE.Vector3, e: THREE.Vector3, n: number, dip: number) =>
      Array.from({ length: n }, (_, i) => { const u = i / (n - 1); return a.clone().lerp(e, u).add(V(0, -dip * 4 * u * (1 - u), 0)); });
    const drape = (a: THREE.Vector3, x: number, e: THREE.Vector3, n: number) => {
      const w = V(x, D0 + 0.12, -30.1), h = Math.floor(n / 2);
      return Array.from({ length: n }, (_, i) => {
        if (i < h) { const u = i / h; return V(a.x + (w.x - a.x) * u, a.y + (w.y - a.y) * u * u, a.z + (w.z - a.z) * u); }
        const u = (i - h) / (n - 1 - h);
        return V(w.x + (e.x - w.x) * u, D0 + 0.12 + (e.y - D0 - 0.12) * u ** 3, w.z + (e.z - w.z) * u);
      });
    };
    const blend = (a: THREE.Vector3[], c: THREE.Vector3[], k: number) => a.map((p, i) => p.clone().lerp(c[i], k));
    const n = 18, kd = smooth(b.drop);
    this.stays[2].set(sag(V(-2.7, TOP, 27), V(-2.7, D0 + 0.86, 37), n, 0.5));
    this.stays[3].set(sag(V(2.7, TOP, 27), V(2.7, D0 + 0.86, 37), n, 0.5));
    const endR = V(2.7, D0 + 0.86, -37);
    this.stays[1].set(blend(sag(V(2.7, TOP, -27), endR, n, 0.5), drape(V(2.7, chainY(-27, b), -27), 2.7, endR, n), kd));
    const jerk = id === 8 && b.snap === 0 ? 0.06 * b.bounce : 0; // the bolt jerks with every footfall before it goes
    const e = V(...snapEnd(b.snap)).add(V(0, 0.24 + 0.4 * jerk, jerk));
    const whip = sag(V(-2.7, TOP, -27), e, n, b.snap > 0 ? 0.25 + 0.6 * Math.sin(Math.min(1, b.snap) * Math.PI) : 0.5);
    const fallenEnd = e.clone().lerp(V(-3.3, D0 + 0.12, -33.2), kd);
    this.stays[0].set(blend(whip, drape(V(-2.7, chainY(-27, b), -27), -2.9, fallenEnd, n), kd));
    this.eye.position.copy(b.drop > 0 ? fallenEnd : e);
    // the bolt: whole until it snaps, then two halves fly off and land on the bank
    const ts = id === 15 || b.snap === 0 ? -1 : Math.max(0, (id >= 9 ? 9 : tau - SNAP));
    if (ts < 0) {
      this.boltA.position.set(BOLT[0] - 0.155, BOLT[1] + 0.4 * jerk, BOLT[2] + jerk); this.boltB.position.set(BOLT[0] + 0.155, BOLT[1] + 0.4 * jerk, BOLT[2] + jerk);
      this.boltA.rotation.set(0, 0, 0); this.boltB.rotation.set(0, 0, 0);
      this.eye.position.copy(e);
    } else {
      for (const [m, vx, vy, vz, sp] of [[this.boltA, -2.4, 4.4, 1.1, 17], [this.boltB, 2.1, 3.7, -0.9, -14]] as const) {
        const tl = Math.min(ts, (vy + Math.sqrt(vy * vy + 2 * 9.8 * (BOLT[1] - D0 - 0.08))) / 9.8);
        m.position.set(BOLT[0] + vx * tl + (vx > 0 ? 0.155 : -0.155), BOLT[1] + vy * tl - 4.9 * tl * tl, BOLT[2] + vz * tl);
        m.rotation.set(sp * tl * 0.4, sp * tl, 0);
      }
    }
    // tower flags waving
    for (const fl of this.flags) {
      const p = fl.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = (i % 13) / 12, y = i < 13 ? 0.5 : -0.5;
        p.setXYZ(i, -u * 1.7, y + 0.05 * u * Math.sin(t * 4 - u * 3), 0.24 * u * Math.sin(t * 5.5 - u * 5 + fl.position.z));
      }
      p.needsUpdate = true;
    }
  }
}

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);           // slow river along +x
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

const swingGeo = (() => { const g = new THREE.PlaneGeometry(700 * SU_SWING, 2300 * SU_SWING); g.translate(0, -(1150 - 20) * SU_SWING, 0); return g; })();
/** horizontal quad facing up at height D0 + dy covering x0..x1, z0..z1 (z0 < z1) */
function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, dy = 0) {
  const y = D0 + dy, g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
/** embankment wall from the river bed to the bank top at z, facing +z (dir 1) or -z (dir -1) */
function wallQuad(x0: number, x1: number, z: number, dir: number) {
  const g = new THREE.BufferGeometry(), y0 = -0.6, y1 = D0;
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 0, dir]).flat(), 3));
  const u = Math.abs(x1 - x0) / 4, v = (y1 - y0) / 4;
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
