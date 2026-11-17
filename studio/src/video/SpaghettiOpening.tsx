// Video 1 (spaghetti), the opening: beats 0-7 (0 → 12.11 s) in the approved worlds — the 1957 front room with the TV
// and the family, and London from above. Camera follows the words (data/spaghetti.beats.json), whips between worlds,
// characters in shot → background blurred.
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig, Audio, staticFile} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {Env} from '../engine/Env';
import {PhotoSky} from '../engine/PhotoSky';
import {Post} from '../engine/Post';
import {ANIME_POST, shiny} from '../engine/look';
import {mergeByMaterial} from '../engine/kit';
import {loadPBR, loadTex, useAsset} from '../engine/assets';
import {Card} from '../engine/Card';
import {bodyFront} from '../engine/toon';
import {springLag} from '../engine/wind';
import {cameraAt, applyCam, BeatCam, Beat, Pose, V3} from '../engine/camera';
import {buildRoom, RD, RW} from '../design/room';
import {buildTV} from '../design/tv';
import {buildHouse, houseMats} from '../design/house';
import {buildCity, rowsAround} from '../design/city';
import BEATS from '../../data/spaghetti.beats.json';
import {makeBroadcast} from './broadcast';
RectAreaLightUniformsLib.init();

const beats = (BEATS as any).beats as Beat[];
export const OPENING_END = beats[8].t; // 12.11 s
const SKY_ROT = 1.396 + 0.6;
const SUN = new THREE.Vector3(0.877, 0.18, 0.445).applyAxisAngle(new THREE.Vector3(0, 1, 0), SKY_ROT).toArray() as [number, number, number];
// TV placement in the room (as approved) and its screen in world space
const TV_POS = new THREE.Vector3(-1.12, 0, -1.6), TV_ROT = Math.PI - 0.65;
const SCREEN = new THREE.Vector3(-0.02, 0.74, -0.24).applyAxisAngle(new THREE.Vector3(0, 1, 0), TV_ROT).add(TV_POS);
const NORMAL = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), TV_ROT);
const fromScreen = (d: number, side = 0, up = 0, fov = 40, lookUp = 0): Pose => {
  const right = new THREE.Vector3(0, 1, 0).cross(NORMAL).normalize();
  const p = SCREEN.clone().addScaledVector(NORMAL, d).addScaledVector(right, side).add(new THREE.Vector3(0, up, 0));
  return {pos: p.toArray() as V3, look: SCREEN.clone().add(new THREE.Vector3(0, lookUp, 0)).toArray() as V3, fov, focus: d};
};
const SOFA = new THREE.Vector3(RW / 2 - 0.5, 0, 0.35);
const CAMS: Record<number, BeatCam> = {
  0: {set: 'room', a: {pos: [0.7, 1.08, 1.75], look: [-1.1, 0.85, -1.35], fov: 58, focus: 3}, b: fromScreen(0.9, 0.25, 0.12, 46)},
  1: {set: 'city', a: {pos: [2, 7.5, 3], look: [-25, 8, -45], fov: 60, focus: 30}, b: {pos: [5, 34, 30], look: [25, 4, -650], fov: 56, focus: 80}},
  2: {set: 'room', a: fromScreen(0.75, -0.12, 0.05, 42), b: fromScreen(0.5, -0.05, 0.02, 40)},
  3: {set: 'room', a: fromScreen(0.46, 0.0, 0.0, 40), b: fromScreen(0.3, 0.03, 0.0, 38)},
  4: {set: 'roomB', a: {pos: [-1.25, 1.05, -1.05], look: [0.58, 0.8, 0.25], fov: 58, focus: 2.25}, b: {pos: [-1.0, 1.02, -0.75], look: [0.58, 0.78, 0.3], fov: 55, focus: 1.9}},
  5: {set: 'city', a: {pos: [4, 80, 150], look: [30, 0, -820], fov: 52, focus: 300}, b: {pos: [12, 64, 90], look: [40, 0, -820], fov: 50, focus: 300}},
  6: {set: 'room', a: fromScreen(0.95, 0.3, 0.1, 44), b: fromScreen(0.62, 0.12, 0.05, 42)},
  7: {set: 'room', a: fromScreen(0.55, 0.06, 0.03, 40, 0.02), b: fromScreen(0.36, 0.0, 0.03, 38, 0.03)},
  8: {set: 'room', a: fromScreen(0.34, 0, 0.03, 38), b: fromScreen(0.31, 0, 0.03, 37)},
};
const SHOW: Record<number, 'narrator' | 'tree'> = {0: 'narrator', 1: 'narrator', 2: 'tree', 3: 'tree', 4: 'tree', 5: 'narrator', 6: 'narrator', 7: 'narrator', 8: 'narrator'};

const RoomWorld: React.FC<{t: number; beat: number; visible: boolean; bc: ReturnType<typeof makeBroadcast>}> = ({t, beat, visible, bc}) => {
  const res = useAsset('op:room', () => Promise.all([loadPBR('rosewood_veneer1'), loadPBR('fabric_pattern_05'), loadPBR('old_wood_floor'), loadPBR('painted_plaster_wall'), loadPBR('fabric_pattern_07'),
    loadTex('assets/own/wallpaper_1957.png', true), loadTex('assets/own/moquette.png', true), loadTex('assets/own/chintz.png', true), loadTex('assets/own/tiles_fire.png', true), loadTex('assets/own/rug_1950s.png', true)]));
  const world = useMemo(() => {
    if (!res) return null;
    const [walnut, fabricN, floor, plaster, rugN, wallpaper, moquette, chintz, tiles, rug] = res as any;
    const g = buildRoom({floor, walnut, fabricN, plaster, wallpaper, moquette, chintz, tiles, rug, rugN});
    const tv = buildTV({walnut, cloth: fabricN}, bc.tex); tv.position.copy(TV_POS); tv.rotation.y = TV_ROT; g.add(tv);
    const W = 1024, H = 768, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d')!;
    const sky = x.createLinearGradient(0, 0, 0, H * 0.55); sky.addColorStop(0, '#4d5f8c'); sky.addColorStop(1, '#e9a777'); x.fillStyle = sky; x.fillRect(0, 0, W, H);
    x.fillStyle = '#3a2a26'; x.fillRect(0, H * 0.4, W, H * 0.6); for (let i = 30; i < W; i += 85) for (const y of [0.5, 0.72]) { x.fillStyle = (i * 7 + y * 13) % 3 < 1.4 ? '#ffc27a' : '#1d1b1e'; x.fillRect(i, H * y, 34, H * 0.12); }
    const vt = new THREE.CanvasTexture(c); vt.colorSpace = THREE.SRGBColorSpace;
    const view = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.75), new THREE.MeshBasicMaterial({map: vt, toneMapped: false})); view.position.set(0, 1.6, -RD / 2 - 3.5); g.add(view);
    shiny(g); return g;
  }, [res]);
  if (!world) return null;
  const fl = 0.85 + 0.15 * Math.sin(t * 9.1) * Math.sin(t * 3.7 + 1);
  const sway = springLag((x) => Math.sin(x * 1.3) * 0.15, t);
  const blink = (k: number) => ((t + k * 0.77) % 3.3) < 0.13;
  // the family on the sofa, watching the TV (they face the screen; we see them three-quarter from the TV side)
  const fam = beat === 4;
  return (
    <group visible={visible}>
      <primitive object={world} />
      <pointLight position={[RW / 2 - 0.35, 1.5, -0.65]} color="#ffae60" intensity={visible ? 5.2 : 0} distance={9} decay={2} castShadow={visible} shadow-mapSize={[1024, 1024]} shadow-bias={-0.003} />
      <pointLight position={[-RW / 2 + 0.55, 0.3, 0.05]} color="#ff6a28" intensity={visible ? 2.6 * fl : 0} distance={5} decay={2} />
      <rectAreaLight position={[0, 1.58, -RD / 2 + 0.02]} color="#8ea4e8" intensity={visible ? 4.2 : 0} width={1.6} height={1.55} onUpdate={(l: any) => l.lookAt(0, 1.2, 0)} />
      {fam && visible && <>
        <Card id="dad" at={[SOFA.x - 0.52, 0, SOFA.z - 0.55]} height={1.75} glowK={0} lit={{side: -1, color: "#dfe8ff", k: 0.42 * fl, rim: 0.65}} draw={(p) => bodyFront(p, {jacket: '#6b5a3a', pants: '#3d4440', boots: '#2a201a', moustache: '#4a3020', hairStyle: 'sidepart', hairColor: '#4a3020'}, {mode: 'sit', expr: 'shock', facing: -1, seed: 9, sway, blink: blink(1), look: -0.6})} />
        <Card id="mum" at={[SOFA.x - 0.52, 0, SOFA.z + 0.05]} height={1.65} glowK={0} lit={{side: -1, color: "#dfe8ff", k: 0.42 * fl, rim: 0.65}} draw={(p) => bodyFront(p, {jacket: '#9a3a4a', pants: '#3b3f52', boots: '#5a3b2a', dress: '#b84a5a', hairStyle: 'curly', hairColor: '#6a3a1e'}, {mode: 'sit', expr: 'smile', facing: -1, seed: 4, sway: sway * 1.3, blink: blink(2), look: -0.6})} />
        <Card id="girl" at={[SOFA.x - 0.54, 0, SOFA.z + 0.62]} height={1.2} glowK={0} lit={{side: -1, color: "#dfe8ff", k: 0.42 * fl, rim: 0.65}} draw={(p) => bodyFront(p, {jacket: '#e2453c', pants: '#3b5b9a', boots: '#f4f1ea', dress: '#d9a441', build: 'kid', hairStyle: 'braids', hairColor: '#8a5a2b'}, {mode: 'sit', expr: 'grin', facing: -1, seed: 2, sway: sway * 1.6, blink: blink(3), look: -0.6})} />
      </>}
    </group>
  );
};
const CityWorld: React.FC<{visible: boolean}> = ({visible}) => {
  const res = useAsset('op:city', () => Promise.all([loadPBR('brick_wall_10'), loadPBR('roof_slates_02'), loadPBR('concrete_floor'), loadPBR('worn_asphalt'), loadPBR('leafy_grass'),
    loadTex('assets/own/path_tiles.png', true), loadTex('assets/own/privet.png', true)]));
  const world = useMemo(() => {
    if (!res) return null;
    const [brick, slate, stone, asphalt, lawn, tiles, privet] = res as any;
    const g = new THREE.Group(), NEAR = 70, doors = ['#21345a', '#1f4a34', '#7a1f26', '#3b2a1e', '#5a5a24', '#2a2a2a'];
    const variants = doors.map((d, k) => { const h = buildHouse(houseMats({brick, slate, stone, tiles, privet}, d), {lights: [k % 2 === 0, k % 3 !== 1, k === 2 || k === 5]}); shiny(h); return mergeByMaterial(h); });
    for (const h of rowsAround(0, 0, NEAR)) { const v = variants[Math.floor(Math.abs(Math.sin(h.x * 1.7 + h.z)) * 6)].clone(); v.position.set(h.x, 0, h.z); v.rotation.y = h.face > 0 ? 0 : Math.PI; g.add(v); }
    const city = buildCity({brick, slate, stone, lawn, asphalt}, new THREE.Vector3(), {mid: 420, far: 2600, skip: NEAR}); shiny(city); g.add(city);
    return g;
  }, [res]);
  return world ? <primitive object={world} visible={visible} /> : null;
};
const Rig: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree(); const s = cameraAt(beats.slice(0, 9), CAMS, t); applyCam(camera as THREE.PerspectiveCamera, s); (camera as THREE.PerspectiveCamera).far = 9000; (camera as THREE.PerspectiveCamera).updateProjectionMatrix(); return null;
};
export const SpaghettiOpening: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const s = cameraAt(beats.slice(0, 9), CAMS, t), room = s.set.startsWith('room');
  const bc = useMemo(() => makeBroadcast(), []);
  bc.draw(SHOW[s.beat] ?? 'narrator', t, s.beat === 7 ? Math.sin(Math.max(0, t - beats[7].t) * 2.2) * 0.12 : 0);
  const chars = s.beat === 4;
  return (
    <>
      <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.02, far: 9000}}>
        <Rig t={t} />
        {room ? <Env hdri="lythwood_room" bg={false} envIntensity={0.45} />
              : <Env hdri="belfast_sunset_puresky" bg={false} envIntensity={1.0} rotation={SKY_ROT} fog={{color: '#8f86a4', near: 250, far: 3200}} sun={{dir: SUN, intensity: 3.2, color: '#ffb46e', area: 120, shadow: 4096}} />}
        {!room && <PhotoSky name="belfast_sunset_puresky" radius={8000} rotation={SKY_ROT} intensity={1.0} />}
        {room && <color attach="background" args={['#000']} />}
        <RoomWorld t={t} beat={s.beat} visible={room} bc={bc} />
        <CityWorld visible={!room} />
        <Post focus={s.focus || 2} focusRange={chars ? 1.3 : undefined} bokeh={chars ? 16 : room ? 0.6 : 0} whip={s.whip} bloom={0.5} vignette={0.24}
          ao={chars ? undefined : room ? {radius: 0.4, intensity: 1.6} : {radius: 1.2, intensity: 1.4}} exposure={room ? 1.15 : 1.0} anime={chars ? {...ANIME_POST, ink: 0} : ANIME_POST} />
      </ThreeCanvas>
      <Audio src={staticFile('audio/spaghetti_opening_mix.wav')} />
    </>
  );
};
