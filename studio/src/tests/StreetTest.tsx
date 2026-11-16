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
  [[-10, 26, -22], [6, 4, 14], 50],              // 2 aerial over the rooftops
  [[0.8, 1.2, 13.2], [2.0, 1.1, 13.4], 50],      // 3 kitchen pantry
];
const Cam: React.FC<{v: number}> = ({v}) => { const {camera} = useThree(); const [p, l, f] = VIEWS[v]; camera.position.set(...(p as [number, number, number])); camera.lookAt(...(l as [number, number, number])); (camera as THREE.PerspectiveCamera).fov = f; (camera as THREE.PerspectiveCamera).updateProjectionMatrix(); return null; };
export const StreetTest: React.FC = () => {
  const f = useCurrentFrame(), {width, height} = useVideoConfig(), t = 12 + f / 30;
  return (
    <ThreeCanvas width={width} height={height} shadows gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.05, far: 6000}}>
      <Cam v={Math.min(3, f)} />
      <Env hdri="rooftop_night" bg={false} envIntensity={0.55} fog={{color: '#5d5a78', near: 60, far: 1500}}
        sun={{dir: [-0.6, 0.35, 0.4], intensity: 0.35, color: '#c9b8ff', area: 40}} />
      <PhotoSky name="rooftop_night" radius={5000} intensity={0.9} />
      <Street1957 t={t} tvDraw={(p) => bodyFront(p, {jacket: '#333', pants: '#333', boots: '#222', hairStyle: 'sidepart', hairColor: '#333'}, {mode: 'stand', expr: 'stern', seed: 3})} />
      <Post focus={4} bokeh={1.5} whip={0} />
    </ThreeCanvas>
  );
};
