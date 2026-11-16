// Design review still for element 2: the 1957 front room (evening: lamp, fire, TV glow, dusk at the window).
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {Env} from '../engine/Env';
import {Post} from '../engine/Post';
import {loadPBR, loadTex, useAsset} from '../engine/assets';
import {buildTV} from './tv';
import {buildRoom, RD, RW} from './room';
RectAreaLightUniformsLib.init();

const VIEWS: [[number, number, number], [number, number, number], number][] = [
  [[0.55, 1.15, 1.9], [-0.95, 0.85, -1.2], 66],   // 0 from the doorway corner: fire, TV, window, armchairs
  [[0.45, 1.2, -1.8], [1.0, 0.75, 0.9], 64],      // 1 toward the sofa, lamp and ducks
];
const Cam: React.FC<{v: number}> = ({v}) => { const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera; const [p, l, f] = VIEWS[v]; c.position.set(...p); c.lookAt(...l); c.fov = f; c.updateProjectionMatrix(); return null; };
function duskWindow() {
  // placeholder view through the window until element 4 (the street) is designed: dusk sky + houses opposite with lit windows
  const W = 1024, H = 768, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 0, H * 0.55); sky.addColorStop(0, '#4d5f8c'); sky.addColorStop(1, '#e9a777'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = '#3a2a26'; g.fillRect(0, H * 0.4, W, H * 0.6);
  g.fillStyle = '#2a2120'; for (let x = 0; x < W; x += 170) { g.fillRect(x + 20, H * 0.32, 40, H * 0.1); }
  for (let x = 30; x < W; x += 85) for (const y of [0.5, 0.72]) { g.fillStyle = Math.random() < 0.5 ? '#ffc27a' : '#1d1b1e'; g.fillRect(x, H * y, 34, H * 0.12); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const Scene: React.FC<{t: number}> = ({t}) => {
  const res = useAsset('roomdesign', () => Promise.all([loadPBR('rosewood_veneer1'), loadPBR('fabric_pattern_05'), loadPBR('old_wood_floor'), loadPBR('painted_plaster_wall'), loadPBR('fabric_pattern_07'),
    loadTex('assets/own/wallpaper_1957.png', true), loadTex('assets/own/moquette.png', true), loadTex('assets/own/chintz.png', true), loadTex('assets/own/tiles_fire.png', true), loadTex('assets/own/rug_1950s.png', true), loadTex('assets/own/tv_broadcast.png', true)]));
  const world = useMemo(() => {
    if (!res) return null;
    const [walnut, fabricN, floor, plaster, rugN, wallpaper, moquette, chintz, tiles, rug, bc] = res as any;
    const g = buildRoom({floor, walnut, fabricN, plaster, wallpaper, moquette, chintz, tiles, rug, rugN});
    const tv = buildTV({walnut, cloth: fabricN}, bc); tv.position.set(-1.12, 0, -1.6); tv.rotation.y = Math.PI - 0.65; g.add(tv);
    const view = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.75), new THREE.MeshBasicMaterial({map: duskWindow(), toneMapped: false})); view.position.set(0, 1.6, -RD / 2 - 3.5); g.add(view);
    g.traverse((o: any) => { if (o.isMesh && o.castShadow === undefined) o.castShadow = true; });
    return g;
  }, [res]);
  if (!world) return null;
  const fl = 0.85 + 0.15 * Math.sin(t * 9.1) * Math.sin(t * 3.7 + 1);
  return (
    <group>
      <primitive object={world} />
      <pointLight position={[RW / 2 - 0.35, 1.5, -0.65]} color="#ffae60" intensity={5.2} distance={9} decay={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.003} shadow-radius={4} />
      <pointLight position={[-RW / 2 + 0.55, 0.3, 0.05]} color="#ff6a28" intensity={2.6 * fl} distance={5} decay={2} />
      <pointLight position={[-0.75, 0.95, -1.15]} color="#b9c8ff" intensity={0.9} distance={4} decay={2} />
      <rectAreaLight position={[0, 1.58, -RD / 2 + 0.02]} color="#8ea4e8" intensity={4.2} width={1.6} height={1.55} rotation={[0, 0, 0]} onUpdate={(l: any) => l.lookAt(0, 1.2, 0)} />
    </group>
  );
};
export const RoomDesign: React.FC = () => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame();
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.02, far: 60}}>
      <Cam v={Math.min(1, f)} />
      <Env hdri="lythwood_room" bg={false} envIntensity={0.22} />
      <color attach="background" args={['#000']} />
      <Scene t={f / 30} />
      <Post focus={2.8} bokeh={1.2} whip={0} bloom={0.45} vignette={0.4} ao={{radius: 0.45, intensity: 2.8}} exposure={1.05} />
    </ThreeCanvas>
  );
};
