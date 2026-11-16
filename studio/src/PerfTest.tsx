import React, {useEffect, useMemo, useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {useThree} from '@react-three/fiber';

const Env: React.FC = () => {
  const {scene, gl} = useThree();
  const [h] = useState(() => delayRender('hdri'));
  useEffect(() => {
    new RGBELoader().load(staticFile('assets/hdri/test.hdr'), (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = tex; scene.background = tex;
      continueRender(h);
    });
  }, []);
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  return null;
};

const Grass: React.FC<{t: number}> = ({t}) => {
  const N = 200000;
  const mesh = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.04, 0.35, 1, 3); g.translate(0, 0.175, 0);
    const m = new THREE.MeshStandardMaterial({color: '#5d8a2f', side: THREE.DoubleSide, roughness: 0.8});
    m.onBeforeCompile = (s) => {
      s.uniforms.uT = {value: 0}; (m as any).userData.s = s;
      s.vertexShader = 'uniform float uT;\n' + s.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 wp = instanceMatrix * vec4(0.,0.,0.,1.);
         float sway = sin(uT*1.7 + wp.x*0.6 + wp.z*0.4)*0.12 + sin(uT*3.1 + wp.x*1.7)*0.04;
         transformed.x += sway * position.y * position.y * 6.0;`);
    };
    const im = new THREE.InstancedMesh(g, m, N);
    const d = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const r = Math.sqrt(Math.random()) * 30, a = Math.random() * Math.PI * 2;
      d.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      d.rotation.y = Math.random() * Math.PI; d.scale.setScalar(0.6 + Math.random() * 0.8);
      d.updateMatrix(); im.setMatrixAt(i, d.matrix);
      im.setColorAt(i, new THREE.Color().setHSL(0.22 + Math.random() * 0.06, 0.5, 0.25 + Math.random() * 0.15));
    }
    im.castShadow = false; im.receiveShadow = true;
    return im;
  }, []);
  const s = (mesh.material as any).userData.s; if (s) s.uniforms.uT.value = t;
  return <primitive object={mesh} />;
};

export const PerfTest: React.FC = () => {
  const f = useCurrentFrame(); const {width, height} = useVideoConfig(); const t = f / 30;
  return (
    <ThreeCanvas width={width} height={height} shadows gl={{antialias: true}}
      camera={{fov: 40, position: [Math.sin(t * 0.1) * 6, 1.0, 8 - t * 0.3], near: 0.05, far: 2000}}>
      <Env />
      <directionalLight position={[10, 15, 5]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#4a5e2a" roughness={1} /></mesh>
      <Grass t={t} />
    </ThreeCanvas>
  );
};
