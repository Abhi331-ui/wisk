// Design review still for element 3: our terraced house (No. 9) with its neighbours, at sunset, house style look.
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Env} from '../engine/Env';
import {PhotoSky} from '../engine/PhotoSky';
import {Post} from '../engine/Post';
import {ANIME_POST, shiny} from '../engine/look';
import {loadPBR, loadTex, pbrMaterial, useAsset} from '../engine/assets';
import {buildHouse, houseMats, HW} from './house';

const SKY_ROT = 1.396 + 0.6; // the circled v1 dusk look (user)
const SUN = new THREE.Vector3(0.877, 0.18, 0.445).applyAxisAngle(new THREE.Vector3(0, 1, 0), SKY_ROT).toArray() as [number, number, number];
const VIEWS: [[number, number, number], [number, number, number], number][] = [
  [[3.2, 1.05, 8.2], [-0.3, 2.9, 0], 62],     // 0 from the pavement, waist height, looking up at No. 9
  [[2.6, 1.0, 2.2], [1.4, 0.9, -0.2], 52],    // 1 close on the doorstep: door, milk bottles, tiles
];
const Cam: React.FC<{v: number}> = ({v}) => { const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera; const [p, l, f] = VIEWS[v]; c.position.set(...p); c.lookAt(...l); c.fov = f; c.updateProjectionMatrix(); return null; };
/** Victorian cast-iron gas lamp post: fluted column, ladder bar, glass lantern with a glowing mantle */
function lampPost(x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const iron = new THREE.MeshPhysicalMaterial({color: '#1d2a24', roughness: 0.3, clearcoat: 0.8});
  const m = (geo: THREE.BufferGeometry, mat: THREE.Material, y: number) => { const o = new THREE.Mesh(geo, mat); o.position.y = y; o.castShadow = true; g.add(o); return o; };
  m(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 16), iron, 0.25); m(new THREE.CylinderGeometry(0.09, 0.14, 0.8, 16), iron, 0.85);
  m(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 16), iron, 2.4); m(new THREE.TorusGeometry(0.08, 0.02, 8, 16).rotateX(Math.PI / 2), iron, 3.6);
  const bar = m(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8).rotateZ(Math.PI / 2), iron, 3.3); void bar;
  m(new THREE.CylinderGeometry(0.22, 0.12, 0.45, 4, 1, true).rotateY(Math.PI / 4), new THREE.MeshPhysicalMaterial({color: '#fff3d6', emissive: '#ffcf80', emissiveIntensity: 2.2, transparent: true, opacity: 0.85, roughness: 0.1}), 3.95);
  m(new THREE.ConeGeometry(0.28, 0.25, 4).rotateY(Math.PI / 4), iron, 4.3); m(new THREE.SphereGeometry(0.05, 10, 8), iron, 4.45);
  const l = new THREE.PointLight('#ffc070', 6, 9, 2); l.position.y = 3.95; g.add(l);
  return g;
}
/** red cast-iron pillar box (no lettering): cylinder, domed cap, posting slot, plinth */
function pillarBox(x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = 0.4;
  const red = new THREE.MeshPhysicalMaterial({color: '#c4161c', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05}), black = new THREE.MeshPhysicalMaterial({color: '#111', roughness: 0.4});
  const m = (geo: THREE.BufferGeometry, mat: THREE.Material, y: number, zz = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(0, y, zz); o.castShadow = true; g.add(o); return o; };
  m(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 32), black, 0.06); m(new THREE.CylinderGeometry(0.27, 0.27, 1.2, 40), red, 0.72);
  m(new THREE.CylinderGeometry(0.31, 0.29, 0.08, 40), red, 1.34); m(new THREE.SphereGeometry(0.29, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1), red, 1.38);
  m(new THREE.BoxGeometry(0.26, 0.04, 0.04), black, 1.15, 0.27); m(new THREE.BoxGeometry(0.2, 0.26, 0.02), red, 0.82, 0.27);
  return g;
}
const Scene: React.FC = () => {
  const res = useAsset('housedesign', () => Promise.all([loadPBR('brick_wall_10'), loadPBR('roof_slates_02'), loadPBR('concrete_floor'), loadPBR('worn_asphalt'),
    loadTex('assets/own/path_tiles.png', true), loadTex('assets/own/privet.png', true)]));
  const world = useMemo(() => {
    if (!res) return null;
    const [brick, slate, stone, asphalt, tiles, privet] = res as any;
    const g = new THREE.Group(), doors = ['#1f4a34', '#7a1f26', '#21345a', '#3b2a1e', '#5a5a24'];
    for (let i = -2; i <= 2; i++) {
      const h = buildHouse(houseMats({brick, slate, stone, tiles, privet}, doors[(i + 2) % 5]), {lights: [i % 2 === 0, i !== 1, i === -1]});
      h.position.x = i * HW; if (i % 2) h.scale.x = -1; g.add(h); // mirrored pairs, as real terraces are built
    }
    const pave = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.2), pbrMaterial(stone, 20, 1.1, {color: '#cfc8bb'})); pave.rotation.x = -Math.PI / 2; pave.position.set(0, 0.01, 4.3); g.add(pave);
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(40, 0.14, 0.22), new THREE.MeshPhysicalMaterial({color: '#bfb8ac', roughness: 0.5})); kerb.position.set(0, 0.07, 5.45); g.add(kerb);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), pbrMaterial(asphalt, 13, 4)); road.rotation.x = -Math.PI / 2; road.position.set(0, -0.05, 11.5); g.add(road);
    g.add(lampPost(0.55, 4.75), pillarBox(2.75, 4.55));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 9, 12), new THREE.MeshPhysicalMaterial({color: '#5a4636', roughness: 0.8})); pole.position.set(-7, 4.5, 4.9); g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), pole.material); arm.position.set(-7, 8.5, 4.9); g.add(arm);
    const wireM = new THREE.MeshStandardMaterial({color: '#1a1a1a'});
    for (const [a, b, sag] of [[new THREE.Vector3(-7, 8.55, 4.9), new THREE.Vector3(1.9, 5.7, 0.12), 0.4], [new THREE.Vector3(-7.5, 8.55, 4.9), new THREE.Vector3(-30, 8.55, 4.9), 0.6], [new THREE.Vector3(-6.5, 8.55, 4.9), new THREE.Vector3(20, 8.55, 4.9), 0.6]] as [THREE.Vector3, THREE.Vector3, number][]) {
      const pts = Array.from({length: 17}, (_, i) => { const u = i / 16; return a.clone().lerp(b, u).add(new THREE.Vector3(0, -sag * 4 * u * (1 - u), 0)); });
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.008, 4), wireM));
    }
    g.traverse((o: any) => { if (o.isMesh) { o.receiveShadow = true; if (o.castShadow === false) return; o.castShadow = true; } });
    shiny(g);
    return g;
  }, [res]);
  return world ? <primitive object={world} /> : null;
};
export const HouseDesign: React.FC = () => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame();
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.05, far: 6000}}>
      <Cam v={Math.min(1, f)} />
      <Env hdri="belfast_sunset_puresky" bg={false} envIntensity={1.1} rotation={SKY_ROT} sun={{dir: SUN, intensity: 3.8, color: '#ffb46e', area: 14, shadow: 4096}} />
      <PhotoSky name="belfast_sunset_puresky" radius={5000} rotation={SKY_ROT} intensity={1.05} />
      <Scene />
      <Post focus={7} bokeh={0.8} whip={0} bloom={0.8} vignette={0.18} ao={{radius: 0.5, intensity: 1.6}} exposure={1.25} anime={ANIME_POST} />
    </ThreeCanvas>
  );
};
