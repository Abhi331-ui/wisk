// Shared material library (PBR sets + procedural) loaded once per tab.
import * as THREE from 'three';
import {loadPBR, pbrMaterial} from './assets';

export type Mats = Record<string, THREE.Material>;
export const wallpaperTex = (base = '#e9dcc2', ink = '#b4867a', leaf = '#8f9a72', seed = 3) => {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!;
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(120,90,60,${0.02 + 0.02 * Math.random()})`; g.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
  // 1950s rose sprig repeat in a half-drop
  const sprig = (x: number, y: number, r: number) => {
    g.strokeStyle = leaf; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y + r * 2.2); g.quadraticCurveTo(x + r, y + r, x, y); g.stroke();
    for (const [dx, dy, a] of [[-r * 0.9, r * 1.3, -0.6], [r * 0.9, r * 0.8, 0.6]]) { g.fillStyle = leaf; g.beginPath(); g.ellipse(x + dx, y + dy, r * 0.55, r * 0.25, a, 0, 7); g.fill(); }
    for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? ink : '#c99a8c'; g.beginPath(); g.arc(x + Math.cos(k * 1.3) * r * 0.35, y + Math.sin(k * 1.3) * r * 0.35, r * (0.62 - k * 0.09), 0, 7); g.fill(); }
  };
  for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) sprig(xx * 256 + 128 + (yy % 2) * 64, yy * 256 + 90, 26);
  for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(160,130,100,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(k * 128 + 64, 0); g.lineTo(k * 128 + 64, S); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
};
export async function loadMats(spec: Record<string, [string, number?, THREE.MeshStandardMaterialParameters?]>) {
  const out: Mats = {};
  await Promise.all(Object.entries(spec).map(async ([k, [id, tile = 1, extra = {}]]) => { const p = await loadPBR(id); out[k] = pbrMaterial(p, 1 / tile, 1 / tile, extra); void tile; }));
  return out;
}
