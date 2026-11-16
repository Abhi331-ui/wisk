import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Env} from '../engine/Env';
import {PhotoSky} from '../engine/PhotoSky';
import {Post} from '../engine/Post';
import {Street1957} from '../worlds/Street1957';
import {bodyFront} from '../engine/toon';

const VIEWS: [number[], number[], number][] = [
  [[0.2, 1.05, 10.6], [-1.6, 0.95, 8.4], 45],     // 0 front room toward the TV
  [[-6, 1.1, -1.5], [8, 2.5, 6], 42],            // 1 street, waist height
  [[-30, 24, 30], [40, 6, -30], 55],              // 2 aerial over the rooftops
  [[0.8, 1.2, 13.2], [2.0, 1.1, 13.4], 50],      // 3 kitchen pantry
];
const SKY_ROT = 1.396;
const SUN = new THREE.Vector3(0.877, 0.18, 0.445).applyAxisAngle(new THREE.Vector3(0, 1, 0), SKY_ROT).toArray() as [number, number, number];
const Cam: React.FC<{v: number}> = ({v}) => { const {camera} = useThree(); const [p, l, f] = VIEWS[v]; camera.position.set(...(p as [number, number, number])); camera.lookAt(...(l as [number, number, number])); (camera as THREE.PerspectiveCamera).fov = f; (camera as THREE.PerspectiveCamera).updateProjectionMatrix(); return null; };
export const StreetTest: React.FC = () => {
  const f = useCurrentFrame(), {width, height} = useVideoConfig(), t = 12 + f / 30;
  return (
    <ThreeCanvas width={width} height={height} shadows gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.05, far: 6000}}>
      <Cam v={Math.min(3, f)} />
      <Env hdri="belfast_sunset_puresky" bg={false} envIntensity={1.0} rotation={SKY_ROT} fog={{color: '#a3949c', near: 80, far: 2200}}
        sun={{dir: SUN, intensity: 3.6, color: '#ffb36e', area: 45, shadow: 4096}} />
      <PhotoSky name="belfast_sunset_puresky" radius={5000} rotation={SKY_ROT} intensity={1.0} />
      <Street1957 t={t} tvDraw={(p) => bodyFront(p, {jacket: '#333', pants: '#333', boots: '#222', hairStyle: 'sidepart', hairColor: '#333'}, {mode: 'stand', expr: 'stern', seed: 3})} />
      <Post focus={4} bokeh={1.5} whip={0} />
    </ThreeCanvas>
  );
};
