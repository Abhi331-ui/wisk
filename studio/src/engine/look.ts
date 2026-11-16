// The approved house style (user, element 2): shiny hard surfaces + bright painted anime-background post (Post anime prop).
import * as THREE from 'three';
export const ANIME_POST = {ink: 1.0, sat: 1.4};
/** lower roughness, lacquer coat, softer normals on everything except fabrics (sheen > 0) */
export function shiny(root: THREE.Object3D) {
  root.traverse((o: any) => {
    if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m && 'roughness' in m && !(m.sheen > 0) && !m.userData.matte) {
      m.roughness = Math.max(0.06, m.roughness * 0.55); if (m.roughnessMap) m.roughnessMap = null;
      if ('clearcoat' in m) { m.clearcoat = Math.max(m.clearcoat, 0.6); m.clearcoatRoughness = 0.05; }
      if (m.normalScale) m.normalScale.multiplyScalar(0.35);
      m.envMapIntensity = 1.6; m.needsUpdate = true;
    }
  });
}
