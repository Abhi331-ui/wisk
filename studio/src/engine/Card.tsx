// A 2D cartoon character card standing in the 3D world: drawn with Pen on a canvas, camera-facing about Y, lit by the
// set's light tint, lit by a key light + rim falling on the body (no outer halo by default) and a contact shadow + real cast shadow.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Pen} from './toon';

export const SU = 0.0018; // metres per design unit (1000 units ≈ 1.8 m)
type Draw = (p: Pen) => void;
const canvases = new Map<string, {c: HTMLCanvasElement; glow: HTMLCanvasElement; tex: THREE.CanvasTexture; gtex: THREE.CanvasTexture}>();

/** Light falling ON the character (user rule: "glow" = lit body, not an outer halo): a soft key-light wash from one side,
 *  a bright rim along the lit edge, both clipped to the character's own silhouette. side −1 = light from the left. */
export type Lit = {side: -1 | 1; color?: string; k?: number; rim?: number; top?: number};
let _L: HTMLCanvasElement | null = null;
function lightUp(c: HTMLCanvasElement, scale: number, lit: Lit) {
  const W = c.width, H = c.height, col = new THREE.Color(lit.color ?? '#fff1d6');
  const rgb = (a: number) => `rgba(${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)},${a})`;
  if (!_L || _L.width !== W || _L.height !== H) { _L = document.createElement('canvas'); _L.width = W; _L.height = H; }
  const L = _L.getContext('2d')!, g = c.getContext('2d')!; const k = lit.k ?? 0.5;
  L.setTransform(1, 0, 0, 1, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); L.filter = 'none';
  // 1) key light = the body brightened by itself (c·(1+k·falloff)), strongest on the lit side/top — keeps colours rich
  L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H); L.drawImage(c, 0, 0);
  const x0 = lit.side < 0 ? 0 : W, g1 = L.createLinearGradient(x0, H * 0.15, W - x0, H * 0.7);
  g1.addColorStop(0, `rgba(0,0,0,${k})`); g1.addColorStop(0.6, `rgba(0,0,0,${k * 0.3})`); g1.addColorStop(1, 'rgba(0,0,0,0)');
  L.globalCompositeOperation = 'destination-in'; L.fillStyle = g1; L.fillRect(0, 0, W, H);
  L.globalCompositeOperation = 'source-atop'; L.globalAlpha = 0.35; L.fillStyle = rgb(1); L.fillRect(0, 0, W, H); L.globalAlpha = 1; // light colour
  g.globalCompositeOperation = 'source-atop'; g.globalCompositeOperation = 'lighter'; g.drawImage(_L, 0, 0);
  // 2) rim: a band just inside the ink line on the lit side (eroded silhouette minus more-eroded), soft, light-coloured
  const dx = lit.side, dy = -0.45, o1 = 12 * scale, o2 = 24 * scale;
  L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H); L.drawImage(c, -dx * o1, -dy * o1);
  L.globalCompositeOperation = 'destination-in'; L.drawImage(c, 0, 0);
  L.globalCompositeOperation = 'destination-out'; L.drawImage(c, -dx * o2, -dy * o2);
  L.globalCompositeOperation = 'source-in'; L.fillStyle = rgb(1); L.fillRect(0, 0, W, H);
  L.globalCompositeOperation = 'source-over'; L.filter = `blur(${4 * scale}px)`; L.drawImage(_L, 0, 0); L.filter = 'none';
  L.globalCompositeOperation = 'destination-in'; L.drawImage(c, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = lit.rim ?? 0.8; g.drawImage(_L, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

function paint(key: string, draw: Draw, scale: number, glowPx: number, lit?: Lit) {
  let e = canvases.get(key);
  const W = 600 * scale, H = 1000 * scale;
  if (!e) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const glow = document.createElement('canvas'); glow.width = W; glow.height = H;
    const tex = new THREE.CanvasTexture(c), gtex = new THREE.CanvasTexture(glow);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; gtex.colorSpace = THREE.SRGBColorSpace;
    e = {c, glow, tex, gtex}; canvases.set(key, e);
  }
  const g = e.c.getContext('2d')!; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(scale, 0, 0, scale, 0, 0);
  draw(new Pen(g));
  if (lit) lightUp(e.c, scale, lit);
  const gg = e.glow.getContext('2d')!; gg.setTransform(1, 0, 0, 1, 0, 0); gg.clearRect(0, 0, W, H);
  gg.filter = `blur(${glowPx}px)`; gg.drawImage(e.c, 0, 0); gg.drawImage(e.c, 0, 0); gg.filter = 'none';
  gg.globalCompositeOperation = 'source-in'; gg.fillStyle = '#ffffff'; gg.fillRect(0, 0, W, H); gg.globalCompositeOperation = 'source-over';
  e.tex.needsUpdate = true; e.gtex.needsUpdate = true;
  return e;
}

export type CardProps = {
  id: string; draw: Draw; at: [number, number, number]; height?: number; scale?: number;
  /** light tint multiplied into the card (set lighting); glow colour/strength */
  tint?: string; glow?: string; glowK?: number; lit?: Lit; /** HDR self-brightness (>1 makes the whites bloom softly) */ bright?: number; shadow?: boolean; face?: 'camera' | number; flip?: boolean;
};
export const Card: React.FC<CardProps> = ({id, draw, at, height = 1.8, scale = 1.4, tint = '#ffffff', glow = '#fff4dc', glowK = 0.45, lit, bright = 1, shadow = true, face = 'camera', flip}) => {
  const {camera} = useThree();
  const e = paint(id, draw, scale, 16 * scale, lit);
  const k = height / 1000; // design units → metres
  const w = 600 * k, h = 1000 * k, solesY = 975 * k;
  const yaw = face === 'camera' ? Math.atan2(camera.position.x - at[0], camera.position.z - at[2]) : face;
  const mats = useMemo(() => ({
    card: new THREE.MeshBasicMaterial({map: e.tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false}),
    glow: new THREE.MeshBasicMaterial({map: e.gtex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}),
    blob: new THREE.MeshBasicMaterial({color: '#000000', transparent: true, opacity: 0.45, depthWrite: false, map: blobTex()}),
  }), [id]);
  mats.card.color.set(tint).multiplyScalar(bright); mats.glow.color.set(glow).multiplyScalar(glowK);
  const sx = flip ? -1 : 1;
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      {glowK > 0 && <mesh material={mats.glow} position={[0, solesY - h / 2, -0.02]} scale={[sx * 1.06, 1.03, 1]} renderOrder={1}>
        <planeGeometry args={[w, h]} />
      </mesh>}
      <mesh material={mats.card} position={[0, solesY - h / 2, 0]} scale={[sx, 1, 1]} castShadow={shadow} renderOrder={2}
        customDepthMaterial={new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: e.tex, alphaTest: 0.5})}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {shadow && <mesh material={mats.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><planeGeometry args={[w * 0.75, w * 0.32]} /></mesh>}
    </group>
  );
};
let _blob: THREE.CanvasTexture | null = null;
function blobTex() {
  if (_blob) return _blob;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); _blob = new THREE.CanvasTexture(c); return _blob;
}
