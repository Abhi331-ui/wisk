// The 1957 broadcast frame on the TV: the narrator (our character) at a studio desk, black and white.
import React, {useEffect, useRef} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {Pen, bodyFront} from '../engine/toon';
export const narratorDraw = (p: Pen) => bodyFront(p, {jacket: '#3a3a3a', pants: '#333', boots: '#222', hairStyle: 'sidepart', hairColor: '#2b2b2b', buttons: '#cfcfcf'}, {mode: 'stand', expr: 'neutral', seed: 3, facing: 0});
export const TVFrame: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = React.useState(() => delayRender());
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!;
    const gr = g.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(1, '#4a4a4a'); g.fillStyle = gr; g.fillRect(0, 0, 1200, 900);
    g.fillStyle = '#6d6d6d'; for (let i = 0; i < 6; i++) g.fillRect(80 + i * 180, 120, 120, 380); // studio flats
    g.save(); g.setTransform(1.15, 0, 0, 1.15, 255, 40); narratorDraw(new Pen(g)); g.restore();
    g.fillStyle = '#2c2c2c'; g.fillRect(0, 660, 1200, 240); g.fillStyle = '#3d3d3d'; g.fillRect(0, 660, 1200, 22); // desk
    const d = g.getImageData(0, 0, 1200, 900), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const y = 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]; a[i] = a[i + 1] = a[i + 2] = y; }
    g.putImageData(d, 0, 0); continueRender(h);
  }, []);
  return <AbsoluteFill style={{background: '#000'}}><canvas ref={ref} width={1200} height={900} /></AbsoluteFill>;
};
