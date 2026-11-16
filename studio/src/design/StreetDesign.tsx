// Design review still for element 4: the London terraced street at dusk (approved house + the dusk sky the user liked).
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Env} from '../engine/Env';
import {PhotoSky} from '../engine/PhotoSky';
import {Post} from '../engine/Post';
import {ANIME_POST, shiny} from '../engine/look';
import {mergeByMaterial, hash} from '../engine/kit';
import {loadPBR, loadTex, pbrMaterial, useAsset} from '../engine/assets';
import {buildHouse, houseMats, HW} from './house';
import {lampPost, pillarBox, telePole, wire, car1950s, smoke} from './streetProps';

const SKY_ROT = 1.396 + 0.6; // approved dusk sky
const SUN = new THREE.Vector3(0.877, 0.18, 0.445).applyAxisAngle(new THREE.Vector3(0, 1, 0), SKY_ROT).toArray() as [number, number, number];
const FZ = 8.2, N = 18; // facade distance from the street centre; houses per side each way
const VIEWS: [[number, number, number], [number, number, number], number][] = [
  [[0.6, 1.1, 1.0], [-18, 2.6, -1.2], 60],      // 0 hero: waist height in the road, down the street to the vanishing point
  [[-3.2, 1.0, -3.8], [-14, 2.2, -7.4], 64],      // 1 on the pavement: houses, the parked car, a lamp
];
const Cam: React.FC<{v: number}> = ({v}) => { const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera; const [p, l, f] = VIEWS[v]; c.position.set(...p); c.lookAt(...l); c.fov = f; c.updateProjectionMatrix(); return null; };
const Scene: React.FC = () => {
  const res = useAsset('streetdesign', () => Promise.all([loadPBR('brick_wall_10'), loadPBR('roof_slates_02'), loadPBR('concrete_floor'), loadPBR('worn_asphalt'),
    loadTex('assets/own/path_tiles.png', true), loadTex('assets/own/privet.png', true)]));
  const world = useMemo(() => {
    if (!res) return null;
    const [brick, slate, stone, asphalt, tiles, privet] = res as any;
    const g = new THREE.Group(), doors = ['#21345a', '#1f4a34', '#7a1f26', '#3b2a1e', '#5a5a24', '#2a2a2a'];
    // build a few house variants once (merged), then place clones down both sides; mirrored pairs as real terraces
    const variants = Array.from({length: 6}, (_, k) => { const h = buildHouse(houseMats({brick, slate, stone, tiles, privet}, doors[k]), {lights: [k % 2 === 0, k % 3 !== 1, k === 2 || k === 5]}); shiny(h); return mergeByMaterial(h); });
    for (const side of [-1, 1]) for (let i = -N; i <= N; i++) {
      const v = variants[Math.floor(hash(i, side) * 6)].clone();
      v.position.set(i * HW, 0, side * FZ); v.rotation.y = side > 0 ? Math.PI : 0; if (i % 2) v.scale.x = -1; g.add(v);
    }
    const pave = pbrMaterial(stone, 70, 1.0, {color: '#cfc8bb'});
    for (const s of [-1, 1]) {
      const pv = new THREE.Mesh(new THREE.PlaneGeometry(HW * (2 * N + 1), 1.9), pave); pv.rotation.x = -Math.PI / 2; pv.position.set(0, 0.12, s * 4.15); g.add(pv);
      const kb = new THREE.Mesh(new THREE.BoxGeometry(HW * (2 * N + 1), 0.13, 0.22), new THREE.MeshPhysicalMaterial({color: '#bdb6aa', roughness: 0.45})); kb.position.set(0, 0.065, s * 3.2); g.add(kb);
    }
    const road = new THREE.Mesh(new THREE.PlaneGeometry(HW * (2 * N + 1), 6.4), pbrMaterial(asphalt, 45, 2.2)); road.rotation.x = -Math.PI / 2; g.add(road);
    // lamps alternating sides, telephone poles along the north pavement with wires across + along
    for (let i = -N; i <= N; i += 4) { const l = lampPost(Math.abs(i) < 9); l.position.set(i * HW + 1.2, 0.12, (i / 4) % 2 ? 4.6 : -4.6); g.add(l); }
    const wm = new THREE.MeshStandardMaterial({color: '#1a1a1a'}); let prev: THREE.Vector3[] | null = null;
    for (let i = -N; i <= N; i += 5) {
      const p = telePole(); p.position.set(i * HW - 1.4, 0.12, -4.85); g.add(p); const tops = (p.userData.tops as THREE.Vector3[]).map((v) => v.clone().add(p.position));
      if (prev) for (let k = 0; k < 8; k++) g.add(wire(prev[k], tops[k], 0.5 + 0.04 * k, wm));
      g.add(wire(tops[1 + (Math.abs(i) % 3)], new THREE.Vector3(i * HW + 1.9, 5.7, FZ - 0.2), 0.45, wm));      // drop across to the far side
      g.add(wire(tops[2], new THREE.Vector3(i * HW - 0.5, 5.7, -FZ + 0.2), 0.3, wm));                        // drop to this side
      prev = tops;
    }
    const pb = pillarBox(); pb.position.set(9.6, 0.12, -4.55); pb.rotation.y = 0.5; g.add(pb);
    const c1 = car1950s('#2f4a3a'); c1.position.set(-9.5, 0, -2.35); c1.rotation.y = -Math.PI / 2; g.add(c1);
    const c2 = car1950s('#c9c2a8'); c2.position.set(-21, 0, 2.35); c2.rotation.y = Math.PI / 2; g.add(c2);
    // the far end: a T-junction with a terrace across it, and a stone church tower with a spire beyond
    const xEnd = -(N + 0.5) * HW - 9.5;
    for (let k = -6; k <= 6; k++) { const v = variants[Math.abs(k) % 6].clone(); v.position.set(xEnd, 0, k * HW); v.rotation.y = Math.PI / 2; if (k % 2) v.scale.x = -1; g.add(v); }
    const xroad = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 70), pbrMaterial(asphalt, 3, 22)); xroad.rotation.x = -Math.PI / 2; xroad.position.set(xEnd + 4.6, 0, 0); g.add(xroad);
    const churchStone = pbrMaterial(stone, 3, 8, {color: '#b9ad98'});
    const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 24, 6), churchStone); tower.position.set(xEnd - 32, 12, -9); g.add(tower);
    const belfry = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1, 6.6), churchStone); belfry.position.set(xEnd - 32, 24.3, -9); g.add(belfry);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(3.4, 22, 8), new THREE.MeshPhysicalMaterial({color: '#6c7f86', roughness: 0.35, metalness: 0.4})); spire.position.set(xEnd - 32, 35.8, -9); g.add(spire);
    for (const zz of [-1, 1]) { const lou = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 1.4), new THREE.MeshPhysicalMaterial({color: '#2a2a2a'})); lou.position.set(xEnd - 28.9, 20.5, -9 + zz * 1.4); g.add(lou); }
    // chimney smoke from a handful of stacks
    for (let k = 0; k < 9; k++) { const i = Math.floor((hash(k, 3) - 0.5) * 2 * N), side = hash(k, 7) < 0.5 ? -1 : 1, sm = smoke(10, k); sm.position.set(i * HW - HW / 2, 10.3, side * (FZ + 3.8)); g.add(sm); }
    g.traverse((o: any) => { if (o.isMesh) o.receiveShadow = true; });
    shiny(g);
    return g;
  }, [res]);
  return world ? <primitive object={world} /> : null;
};
export const StreetDesign: React.FC = () => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame();
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.05, far: 6000}}>
      <Cam v={Math.min(1, f)} />
      <Env hdri="belfast_sunset_puresky" bg={false} envIntensity={1.1} rotation={SKY_ROT} fog={{color: '#9e95b0', near: 60, far: 260}} sun={{dir: SUN, intensity: 3.8, color: '#ffb46e', area: 40, shadow: 4096}} />
      <PhotoSky name="belfast_sunset_puresky" radius={5000} rotation={SKY_ROT} intensity={1.05} />
      <Scene />
      <Post focus={9} bokeh={0.6} whip={0} bloom={0.8} vignette={0.18} ao={{radius: 0.6, intensity: 1.6}} exposure={1.25} anime={ANIME_POST} />
    </ThreeCanvas>
  );
};
