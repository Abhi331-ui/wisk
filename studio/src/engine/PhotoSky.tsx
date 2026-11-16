// Photographic world backdrop from the HDRI's 8k tonemapped photo, optionally ground-projected so the photographed
// ground has real parallax under the camera. The photo is "un-tonemapped" (inverse of our ACES fit) so that after the
// final tone map it shows exactly as photographed, consistent with the 3D foreground.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {GroundedSkybox} from 'three/examples/jsm/objects/GroundedSkybox.js';
import {loadBG, useAsset} from './assets';

export const INV_ACES = `
vec3 invAces(vec3 y){ y = clamp(y, 0.0, 0.985);
  vec3 a = 2.43*y - 2.51, b = 0.59*y - 0.03, c = 0.14*y;
  return (-b - sqrt(max(b*b - 4.0*a*c, 0.0))) / (2.0*a); }`;
export const PhotoSky: React.FC<{name: string; grounded?: number; radius?: number; rotation?: number; intensity?: number; tint?: string}> =
  ({name, grounded, radius = 400, rotation = 0, intensity = 1, tint = '#ffffff'}) => {
  const tex = useAsset('bg:' + name, () => loadBG(name));
  const mesh = useMemo(() => {
    if (!tex) return null;
    // same orientation convention as three's equirect environment lookup (GroundedSkybox already uses it)
    const m = grounded ? new GroundedSkybox(tex, grounded, radius, 128) : new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 64).scale(1, 1, -1), new THREE.MeshBasicMaterial({map: tex}));
    const mat = m.material as THREE.MeshBasicMaterial;
    if (!grounded) { tex.mapping = THREE.UVMapping; }
    mat.fog = false; mat.depthWrite = false; mat.toneMapped = false;
    mat.onBeforeCompile = (s) => {
      s.uniforms.uK = {value: intensity}; s.uniforms.uTint = {value: new THREE.Color(tint)};
      s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uK; uniform vec3 uTint;' + INV_ACES)
        .replace('#include <opaque_fragment>', 'outgoingLight = invAces(outgoingLight) * uK * uTint;\n#include <opaque_fragment>');
    };
    m.renderOrder = -10;
    return m;
  }, [tex]);
  if (!mesh) return null;
  return <primitive object={mesh} rotation={[0, rotation, 0]} position={grounded ? [0, grounded, 0] : [0, 0, 0]} />;
};
