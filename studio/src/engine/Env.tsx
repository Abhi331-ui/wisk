// Image-based light + photographic background from a Poly Haven HDRI, a sun that matches it, optional fog.
import React, {useEffect} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {loadBG, loadHDR, useAsset} from './assets';

export type EnvProps = {
  hdri: string; bg?: boolean | string; envIntensity?: number; bgIntensity?: number; rotation?: number; blur?: number;
  sun?: {dir: [number, number, number]; color?: string; intensity?: number; shadow?: number; area?: number};
  fog?: {color: string; near: number; far: number}; exposure?: number;
};
const pmremCache = new Map<string, THREE.Texture>();
export const Env: React.FC<EnvProps> = ({hdri, bg = true, envIntensity = 1, bgIntensity = 1, rotation = 0, blur = 0, sun, fog, exposure = 1}) => {
  const {scene, gl} = useThree();
  const hdr = useAsset('hdr:' + hdri, () => loadHDR(hdri));
  const bgName = typeof bg === 'string' ? bg : hdri;
  const bgTex = useAsset(bg ? 'bg:' + bgName : 'bg:none', () => (bg ? loadBG(bgName) : Promise.resolve(null)));
  if (hdr) {
    let env = pmremCache.get(hdri);
    if (!env) { const pm = new THREE.PMREMGenerator(gl); env = pm.fromEquirectangular(hdr).texture; pmremCache.set(hdri, env); pm.dispose(); }
    scene.environment = env; scene.environmentIntensity = envIntensity;
    scene.environmentRotation.set(0, rotation, 0);
  }
  scene.background = bg ? (bgTex ?? null) : null;
  scene.backgroundIntensity = bgIntensity; scene.backgroundBlurriness = blur; scene.backgroundRotation.set(0, rotation, 0);
  scene.fog = fog ? new THREE.Fog(fog.color, fog.near, fog.far) : null;
  gl.toneMappingExposure = exposure;
  useEffect(() => () => { scene.environment = null; scene.background = null; scene.fog = null; }, []);
  if (!sun) return null;
  const d = new THREE.Vector3(...sun.dir).normalize().multiplyScalar(60);
  const a = sun.area ?? 25;
  return (
    <directionalLight position={d.toArray()} color={sun.color ?? '#fff3e0'} intensity={sun.intensity ?? 3} castShadow
      shadow-mapSize={[sun.shadow ?? 2048, sun.shadow ?? 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
      shadow-camera-left={-a} shadow-camera-right={a} shadow-camera-top={a} shadow-camera-bottom={-a} shadow-camera-near={1} shadow-camera-far={200} />
  );
};
