// Design review stills for element 5: London rooftops from above at dusk (no characters → sharp).
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Env} from '../engine/Env';
import {PhotoSky} from '../engine/PhotoSky';
import {Post} from '../engine/Post';
import {ANIME_POST, shiny} from '../engine/look';
import {mergeByMaterial} from '../engine/kit';
import {loadPBR, loadTex, useAsset} from '../engine/assets';
import {buildHouse, houseMats} from './house';
import {buildCity, rowsAround, HW} from './city';

const SKY_ROT = 1.396 + 0.6;
const SUN = new THREE.Vector3(0.877, 0.18, 0.445).applyAxisAngle(new THREE.Vector3(0, 1, 0), SKY_ROT).toArray() as [number, number, number];
const VIEWS: [[number, number, number], [number, number, number], number][] = [
  [[6, 42, 60], [40, 6, -700], 55],        // 0 aerial over the rooftops toward the river, Battersea and St Paul's
  [[3, 12.5, 4.5], [-30, 8, -40], 62],     // 1 crane up just over our row's roofs: chimneys, pots and aerials in the foreground
];
const Cam: React.FC<{v: number}> = ({v}) => { const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera; const [p, l, f] = VIEWS[v]; c.position.set(...p); c.lookAt(...l); c.fov = f; c.far = 9000; c.updateProjectionMatrix(); return null; };
const Scene: React.FC = () => {
  const res = useAsset('citydesign', () => Promise.all([loadPBR('brick_wall_10'), loadPBR('roof_slates_02'), loadPBR('concrete_floor'), loadPBR('worn_asphalt'), loadPBR('leafy_grass'),
    loadTex('assets/own/path_tiles.png', true), loadTex('assets/own/privet.png', true)]));
  const world = useMemo(() => {
    if (!res) return null;
    const [brick, slate, stone, asphalt, lawn, tiles, privet] = res as any;
    const g = new THREE.Group(), focus = new THREE.Vector3(0, 0, 0), NEAR = 70;
    const doors = ['#21345a', '#1f4a34', '#7a1f26', '#3b2a1e', '#5a5a24', '#2a2a2a'];
    const variants = doors.map((d, k) => { const h = buildHouse(houseMats({brick, slate, stone, tiles, privet}, d), {lights: [k % 2 === 0, k % 3 !== 1, k === 2 || k === 5]}); shiny(h); return mergeByMaterial(h); });
    for (const h of rowsAround(focus.x, focus.z, NEAR)) { const v = variants[Math.floor(Math.abs(Math.sin(h.x * 1.7 + h.z)) * 6)].clone(); v.position.set(h.x, 0, h.z); v.rotation.y = h.face > 0 ? 0 : Math.PI; g.add(v); }
    const city = buildCity({brick, slate, stone, lawn, asphalt}, focus, {mid: 420, far: 2600, skip: NEAR}); shiny(city); g.add(city);
    return g;
  }, [res]);
  return world ? <primitive object={world} /> : null;
};
export const CityDesign: React.FC = () => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame();
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.1, far: 9000}}>
      <Cam v={Math.min(1, f)} />
      <Env hdri="belfast_sunset_puresky" bg={false} envIntensity={1.0} rotation={SKY_ROT} fog={{color: '#8f86a4', near: 250, far: 3200}} sun={{dir: SUN, intensity: 3.2, color: '#ffb46e', area: 120, shadow: 4096}} />
      <PhotoSky name="belfast_sunset_puresky" radius={8000} rotation={SKY_ROT} intensity={1.0} />
      <Scene />
      <Post focus={60} bokeh={0} whip={0} bloom={0.5} vignette={0.22} ao={{radius: 1.2, intensity: 1.4}} exposure={1.0} anime={ANIME_POST} />
    </ThreeCanvas>
  );
};
