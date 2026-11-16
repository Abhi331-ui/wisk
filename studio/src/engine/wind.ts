// One global wind field drives grass, trees, hair, strands, smoke, cloth. Deterministic in time.
export type Wind = {dir: [number, number]; strength: number; gust: number};
export const WIND: Wind = {dir: [0.8, 0.6], strength: 0.5, gust: 0.35};
const n1 = (x: number) => Math.sin(x) * 0.6 + Math.sin(x * 2.17 + 1.3) * 0.3 + Math.sin(x * 4.31 + 0.7) * 0.1;
/** scalar gust strength at time t (s) and world xz */
export const windAt = (t: number, x = 0, z = 0, w: Wind = WIND) =>
  w.strength * (0.65 + 0.35 * n1(t * 0.9 + (x * w.dir[0] + z * w.dir[1]) * 0.15)) + w.gust * Math.max(0, n1(t * 0.37 + x * 0.05));
/** GLSL snippet with the same field (uniforms uT, uWindDir, uWindS, uWindG) */
export const WIND_GLSL = `
uniform float uT; uniform vec2 uWindDir; uniform float uWindS; uniform float uWindG;
float n1(float x){ return sin(x)*0.6 + sin(x*2.17+1.3)*0.3 + sin(x*4.31+0.7)*0.1; }
float windAt(vec2 p){ return uWindS*(0.65+0.35*n1(uT*0.9+dot(p,uWindDir)*0.15)) + uWindG*max(0.0,n1(uT*0.37+p.x*0.05)); }
`;
/** damped spring follower for hair/cloth: returns lagged value of a driven signal, evaluated deterministically */
export const springLag = (sig: (t: number) => number, t: number, k = 9, damp = 0.35, steps = 45, dt = 1 / 60) => {
  let x = sig(t - steps * dt), v = 0;
  for (let i = steps; i > 0; i--) { const target = sig(t - i * dt); const a = k * k * (target - x) - 2 * damp * k * v; v += a * dt; x += v * dt; }
  return x;
};
