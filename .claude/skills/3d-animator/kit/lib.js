// Small helpers. Every frame is a pure function of t (seconds): no clocks, no Math.random(), no state carried between frames.
export const W = 1920, H = 1080, FPS = 30;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));              // 0 before a, 1 after b
export const smooth = (k) => k * k * (3 - 2 * k);
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
// overshoot then settle (squash, pops, landings): k 0..1
export const backOut = (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
// damped spring for a hit at time a: 0 before, wobbles, settles at 0
export const spring = (t, a, freq = 7, decay = 6) => (t < a ? 0 : Math.sin((t - a) * freq * Math.PI * 2) * Math.exp(-(t - a) * decay));
// low-discrepancy sequence: spreads the sub-frame samples evenly (motion blur, lens, soft light)
export const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
// seeded "random": same input, same number, every render
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
