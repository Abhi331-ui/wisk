// The live black-and-white BBC broadcast on the 1957 TV: the narrator at his desk, or the Swiss spaghetti-tree footage.
import * as THREE from 'three';
import {Pen, bodyFront} from '../engine/toon';
export type Show = 'narrator' | 'tree';
export function makeBroadcast() {
  const c = document.createElement('canvas'); c.width = 600; c.height = 450;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (show: Show, t: number, nod = 0) => {
    const g = c.getContext('2d')!; g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none';
    if (show === 'narrator') {
      const gr = g.createLinearGradient(0, 0, 0, 450); gr.addColorStop(0, '#a8a8a8'); gr.addColorStop(1, '#505050'); g.fillStyle = gr; g.fillRect(0, 0, 600, 450);
      g.fillStyle = '#787878'; for (let i = 0; i < 6; i++) g.fillRect(30 + i * 95, 50, 60, 220);
      g.save(); g.setTransform(0.62, 0, 0, 0.62, 114, 18);
      bodyFront(new Pen(g), {jacket: '#3a3a3a', pants: '#333', boots: '#222', hairStyle: 'sidepart', hairColor: '#2b2b2b', buttons: '#cfcfcf'}, {mode: 'stand', expr: 'neutral', seed: 3, headTilt: nod, blink: (t % 3.1) < 0.12});
      g.restore(); g.fillStyle = '#2c2c2c'; g.fillRect(0, 330, 600, 120); g.fillStyle = '#404040'; g.fillRect(0, 330, 600, 12);
    } else {
      // Swiss orchard footage: sky, distant hills, a tree hung with spaghetti, a woman picking strands into a basket
      const sky = g.createLinearGradient(0, 0, 0, 300); sky.addColorStop(0, '#d8d8d8'); sky.addColorStop(1, '#9a9a9a'); g.fillStyle = sky; g.fillRect(0, 0, 600, 450);
      g.fillStyle = '#7a7a7a'; g.beginPath(); g.moveTo(0, 250); for (let x = 0; x <= 600; x += 20) g.lineTo(x, 200 + 30 * Math.sin(x / 70) + 15 * Math.sin(x / 23)); g.lineTo(600, 450); g.lineTo(0, 450); g.fill();
      g.fillStyle = '#5c5c5c'; g.fillRect(0, 330, 600, 120);
      g.fillStyle = '#3a3a3a'; g.beginPath(); g.moveTo(285, 340); g.lineTo(300, 160); g.lineTo(320, 160); g.lineTo(330, 340); g.fill();
      for (const [x, y, r] of [[230, 140, 70], [310, 110, 85], [390, 145, 70], [270, 190, 60], [360, 195, 60]]) { g.fillStyle = '#4a4a4a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#5e5e5e'; g.beginPath(); g.arc(x - r * 0.2, y - r * 0.25, r * 0.6, 0, 7); g.fill(); }
      g.strokeStyle = '#efefef'; g.lineWidth = 1.6;
      for (let k = 0; k < 70; k++) { const x0 = 180 + (k * 37) % 260, y0 = 170 + ((k * 53) % 70), L = 40 + (k * 29) % 60, sw = Math.sin(t * 2 + k) * 4;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + sw, y0 + L * 0.6, x0 + sw * 1.5, y0 + L); g.stroke(); }
      g.save(); g.setTransform(0.3, 0, 0, 0.3, 380, 190);
      bodyFront(new Pen(g), {jacket: '#666', pants: '#444', boots: '#333', dress: '#888', hairStyle: 'bun', hairColor: '#333'}, {mode: 'stand', expr: 'smile', seed: 8, facing: -1, wave: Math.sin(t * 3) * 0.5});
      g.restore();
      g.fillStyle = '#6a6a6a'; g.beginPath(); g.ellipse(470, 420, 40, 18, 0, 0, 7); g.fill();
    }
    // grayscale, slight blur, scanlines, vignette, flicker
    const d = g.getImageData(0, 0, 600, 450), a = d.data, fl = 0.94 + 0.06 * Math.sin(t * 47);
    for (let i = 0; i < a.length; i += 4) { const y = (0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]) * fl; a[i] = a[i + 1] = a[i + 2] = y; }
    g.putImageData(d, 0, 0);
    g.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < 450; y += 3) g.fillRect(0, y, 600, 1);
    const vg = g.createRadialGradient(300, 225, 150, 300, 225, 360); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, 600, 450);
    tex.needsUpdate = true;
  };
  return {tex, draw};
}
