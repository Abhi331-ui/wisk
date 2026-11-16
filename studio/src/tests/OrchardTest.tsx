import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Env} from '../engine/Env';
import {PhotoSky} from '../engine/PhotoSky';
import {Grass} from '../engine/Grass';
import {Post} from '../engine/Post';
import {Card} from '../engine/Card';
import {bodyFront} from '../engine/toon';
import {loadModel, loadPBR, pbrMaterial, useAsset} from '../engine/assets';
import {Strands, hangPoints} from '../engine/Strands';
import {useThree} from '@react-three/fiber';
import {springLag} from '../engine/wind';

const Tree: React.FC<{id: string; at: [number, number, number]; s: number; rot?: number; t: number; strands?: boolean}> = ({id, at, s, rot = 0, t, strands}) => {
  const src = useAsset('m:' + id, () => loadModel(id));
  const obj = useMemo(() => { if (!src) return null; const c = src.clone(true); c.position.set(...at); c.scale.setScalar(s); c.rotation.y = rot; return c; }, [src]);
  const pts = useMemo(() => (obj && strands ? hangPoints(obj, 90, 11) : []), [obj]);
  if (!obj) return null;
  return <group><primitive object={obj} />{strands && pts.length > 0 && <Strands points={pts} t={t} />}</group>;
};
const Ground: React.FC = () => {
  const p = useAsset('pbr:leafy_grass', () => loadPBR('leafy_grass'));
  const mat = useMemo(() => (p ? pbrMaterial(p, 30, 30, {roughness: 1}) : null), [p]);
  if (!mat) return null;
  return <mesh rotation-x={-Math.PI / 2} receiveShadow material={mat}><circleGeometry args={[45, 64]} /></mesh>;
};
const Cam: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  camera.position.set(-1.2 + t * 0.25, 1.05, 6.5 - t * 0.2); camera.lookAt(0.6, 1.5, 0);
  (camera as THREE.PerspectiveCamera).fov = 42; (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};
export const OrchardTest: React.FC<{off?: string[]; g?: any}> = ({off = [], g = {}}) => {
  const on = (k: string) => !off.includes(k);
  const f = useCurrentFrame(), {width, height} = useVideoConfig(), t = f / 30;
  const sway = springLag((x) => Math.sin(x * 2.4) * 0.5, t);
  return (
    <ThreeCanvas width={width} height={height} shadows={on('shadow')} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{near: 0.05, far: 2000}}>
      <Cam t={t} />
      <Env hdri="alps_field" bg={false} envIntensity={1} sun={{dir: [-0.35, 0.45, -0.8], intensity: 3.2, color: '#fff0d8', area: 18}} />
      {on('sky') && <PhotoSky name="alps_field" grounded={1.7} radius={300} />}
      {on('ground') && <Ground />}
      {on('grass') && <Grass center={[0, 2]} size={[22, 22]} count={160000} t={t} eye={[-0.5, 6]} {...g} />}
      {on('trees') && <><Tree id="tree_small_02_lod" at={[1.2, 0, -1.5]} s={1} t={t} strands />
      <Tree id="island_tree_01_lod" at={[-6, 0, -8]} s={1} t={t} strands /></>}
      {on('cards') && <><Card id="grandma" at={[0.2, 0, 1.2]} draw={(p) => bodyFront(p, {jacket: '#6b3f5a', pants: '#3b3f52', boots: '#4a3426', dress: '#3f5f8a', hairStyle: 'bun', hairColor: '#cfcac4'}, {mode: 'stand', expr: 'grin', facing: 1, seed: 4, sway})} height={1.6} />
      <Card id="dad" at={[1.6, 0, 0.6]} draw={(p) => bodyFront(p, {jacket: '#8a5a34', pants: '#3d4440', boots: '#2a201a', moustache: '#4a3020', hairStyle: 'sidepart', hairColor: '#4a3020'}, {mode: 'stand', expr: 'smile', facing: -1, seed: 9, sway})} height={1.8} />
      <Card id="girl" at={[-0.9, 0, 2.2]} draw={(p) => bodyFront(p, {jacket: '#e2453c', pants: '#3b5b9a', boots: '#f4f1ea', dress: '#d9a441', build: 'kid', hairStyle: 'braids', hairColor: '#8a5a2b'}, {mode: 'stand', expr: 'laugh', facing: 1, seed: 2, sway})} height={1.2} /></>}
      {on('post') && <Post focus={5.5} bokeh={4} whip={0} />}
    </ThreeCanvas>
  );
};
