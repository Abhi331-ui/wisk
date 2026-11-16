// Design review still for element 1: the 1957 television in the corner of the front room.
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Env} from '../engine/Env';
import {Post} from '../engine/Post';
import {loadPBR, loadTex, pbrMaterial, useAsset} from '../engine/assets';
import {buildTV} from './tv';
RectAreaLightUniformsLib.init();

const Cam: React.FC = () => {
  const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.position.set(0.75, 1.0, 2.25); c.lookAt(-0.17, 0.68, -0.35); c.fov = 2 * Math.atan(12 / 34) * 180 / Math.PI; c.updateProjectionMatrix(); return null;
};
const Scene: React.FC = () => {
  const res = useAsset('tvdesign', () => Promise.all([loadPBR('rosewood_veneer1'), loadPBR('fabric_pattern_05'), loadPBR('old_wood_floor'), loadPBR('fabric_pattern_07'), loadTex('assets/own/rug_1950s.png', true),
    loadTex('assets/own/wallpaper_1957.png', true), loadTex('assets/own/tv_broadcast.png', true)]));
  const g = useMemo(() => {
    if (!res) return null;
    const [walnut, cloth, floor, rug, rugImg, wp, bc] = res;
    const root = new THREE.Group();
    const tv = buildTV({walnut, cloth}, bc); tv.position.set(-0.15, 0, -0.35); tv.rotation.y = Math.PI - 0.15; root.add(tv);
    const wpm = (w: number, h: number) => { const t = wp.clone(); t.repeat.set(w / 0.68, h / 0.68); t.needsUpdate = true; return new THREE.MeshStandardMaterial({map: t, roughness: 0.85}); };
    const back = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.75), wpm(6, 2.75)); back.position.set(0, 1.375, -0.9); root.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.75), wpm(6, 2.75)); left.position.set(-1.1, 1.375, 0); left.rotation.y = Math.PI / 2; root.add(left);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), pbrMaterial(floor, 4.3, 4.3, {roughness: 0.8})); fl.rotation.x = -Math.PI / 2; root.add(fl);
    const paint = new THREE.MeshPhysicalMaterial({color: '#dcd6c6', roughness: 0.32, clearcoat: 0.4});
    const sk1 = new THREE.Mesh(new RoundedBoxGeometry(6, 0.14, 0.025, 2, 0.006), paint); sk1.position.set(0, 0.07, -0.887); root.add(sk1);
    const sk2 = new THREE.Mesh(new RoundedBoxGeometry(0.025, 0.14, 6, 2, 0.006), paint); sk2.position.set(-1.087, 0.07, 0); root.add(sk2);
    const rg = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.012, 1.2, 2, 0.004), (() => { const m = pbrMaterial(rug, 4, 3, {roughness: 1}) as THREE.MeshStandardMaterial; m.map = rugImg; m.map.repeat.set(1, 1); return m; })()); rg.position.set(0.35, 0.006, 0.55); rg.rotation.y = -0.14; root.add(rg);
    root.traverse((o: any) => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = o.castShadow || false; } });
    return root;
  }, [res]);
  if (!g) return null;
  return (
    <group>
      <primitive object={g} />
      {/* warm standard lamp, off-frame right: soft area light + a shadow-casting spot at the same place */}
      <rectAreaLight position={[1.4, 1.55, 1.0]} color="#ffb070" intensity={6} width={0.35} height={0.35} onUpdate={(l: any) => l.lookAt(-0.15, 0.75, -0.35)} />
      <spotLight position={[1.4, 1.55, 1.0]} color="#ffb070" intensity={9} angle={0.7} penumbra={1} distance={8} decay={2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-radius={6}
        onUpdate={(l: any) => { l.target.position.set(-0.15, 0.6, -0.35); l.target.updateMatrixWorld(); }} />
      {/* cool daylight from the window on the left */}
      <rectAreaLight position={[-1.05, 1.5, 1.4]} color="#c4d2ff" intensity={4} width={1.4} height={1.4} onUpdate={(l: any) => l.lookAt(0.2, 0.8, -0.3)} />
      <spotLight position={[-1.05, 1.5, 1.4]} color="#c4d2ff" intensity={5} angle={0.9} penumbra={1} distance={9} decay={2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002}
        onUpdate={(l: any) => { l.target.position.set(0.1, 0.5, -0.4); l.target.updateMatrixWorld(); }} />
    </group>
  );
};
export const TVDesign: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.02, far: 50}}>
      <Cam />
      <Env hdri="lythwood_room" bg={false} envIntensity={0.5} />
      <color attach="background" args={['#000']} />
      <Scene />
      <Post focus={2.45} bokeh={2.2} whip={0} bloom={0.35} vignette={0.38} ao={{radius: 0.35, intensity: 2.2}} />
    </ThreeCanvas>
  );
};
