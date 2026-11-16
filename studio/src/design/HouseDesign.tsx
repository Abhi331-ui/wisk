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

const SKY_ROT = -1.62;
const SUN = new THREE.Vector3(0.877, 0.18, 0.445).applyAxisAngle(new THREE.Vector3(0, 1, 0), SKY_ROT).toArray() as [number, number, number];
const VIEWS: [[number, number, number], [number, number, number], number][] = [
  [[3.2, 1.05, 8.2], [-0.3, 2.9, 0], 62],     // 0 from the pavement, waist height, looking up at No. 9
  [[2.6, 1.0, 2.2], [1.4, 0.9, -0.2], 52],    // 1 close on the doorstep: door, milk bottles, tiles
];
const Cam: React.FC<{v: number}> = ({v}) => { const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera; const [p, l, f] = VIEWS[v]; c.position.set(...p); c.lookAt(...l); c.fov = f; c.updateProjectionMatrix(); return null; };
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
    g.traverse((o: any) => { if (o.isMesh) o.receiveShadow = true; });
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
      <Post focus={7} bokeh={0.8} whip={0} bloom={0.5} vignette={0.18} ao={{radius: 0.5, intensity: 1.6}} exposure={1.25} anime={ANIME_POST} />
    </ThreeCanvas>
  );
};
