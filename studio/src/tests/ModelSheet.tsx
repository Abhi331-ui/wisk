import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Env} from '../engine/Env';
import {loadModel, useAsset} from '../engine/assets';

const M: React.FC<{id: string; at: [number, number, number]}> = ({id, at}) => {
  const src = useAsset('m:' + id, () => loadModel(id));
  const obj = useMemo(() => {
    if (!src) return null; const c = src.clone(true); const b = new THREE.Box3().setFromObject(c), s = b.getSize(new THREE.Vector3());
    const k = 0.9 / Math.max(s.x, s.y, s.z); c.scale.setScalar(k); const b2 = new THREE.Box3().setFromObject(c), ctr = b2.getCenter(new THREE.Vector3());
    c.position.set(at[0] - ctr.x, at[1] - b2.min.y, at[2] - ctr.z); return c;
  }, [src]);
  return obj ? <primitive object={obj} /> : null;
};
const Cam: React.FC = () => { const {camera} = useThree(); camera.position.set(0, 3.2, 9.5); camera.lookAt(0, 3.0, 0); return null; };
export const ModelSheet: React.FC<{ids: string[]}> = ({ids}) => {
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} gl={{preserveDrawingBuffer: true}} camera={{fov: 40, near: 0.1, far: 100}}>
      <Cam />
      <Env hdri="lythwood_room" bg={false} envIntensity={1.2} />
      <color attach="background" args={['#3a3a40']} />
      {ids.map((id, i) => <M key={id} id={id} at={[((i % 4) - 1.5) * 1.15, 5.4 - Math.floor(i / 4) * 1.15, 0]} />)}
    </ThreeCanvas>
  );
};
