# Light

## Pipeline
- `renderer.toneMapping = NoToneMapping`, `outputColorSpace = LinearSRGBColorSpace`, render targets `HalfFloatType`. Light values above 1 survive until the grade.
- Sub-frames are added with weight 1/n into an accumulation target. Then: bloom (strength 0.15–0.25, threshold about 0.9) → one grade shader: chromatic fringe at the edges (tiny), ACES curve, vignette (to about 0.6 at the corners), sRGB encode, grain (about 3 %, less in highlights), captions on top.
- Canvas textures (screens, labels) need `texture.colorSpace = SRGBColorSpace`.

## The setup that makes a room look real
| Light | three.js | Settings that worked | Why |
|---|---|---|---|
| Key (sun) | `DirectionalLight` warm (#ffc285), intensity 4–6 | shadow map 2048, bias -0.0004, jitter position ±0.09 m per sub-frame | soft-edged sun shadows |
| Light shapes | slats/window frame between sun and room, out of frame | 12–16 slats, 4–5 cm, gaps about 5 cm | stripes on wall + desk = instant "cinematic" |
| Sky fill | `DirectionalLight` cool (#9db8ff), intensity 0.4–0.6, castShadow | new cosine-weighted position on the upper hemisphere per sub-frame | adds up to soft sky light with contact shadows (cheap AO) |
| Practical | `SpotLight` warm (#ffb36b) in a lamp head, decay 2 | penumbra 0.6, jitter ±1–2 cm | a pool of light where the action is |
| Ambient | `AmbientLight` | 0.1–0.2 | only so blacks are not dead |

Cosine-weighted sky sample per sub-frame k:
```js
const h1 = halton(k + 1, 19), h2 = halton(k + 1, 23), phi = h2 * Math.PI * 2;
sky.position.set(Math.cos(phi) * Math.sqrt(1 - h1) * 4, Math.sqrt(h1) * 4 + 0.3, Math.sin(phi) * Math.sqrt(1 - h1) * 4 + 1);
```

## Materials
- `MeshStandardMaterial` everywhere. Roughness does more than colour: wood 0.5–0.6, matte plastic 0.6–0.7, painted wall 0.9, ceramic glaze 0.3–0.4, metal lamp 0.35 with metalness 0.6.
- Slightly warm off-white instead of pure white (#d8ccb2 for 90s plastic). Pure white and pure black look CG.
- Emissive look for screens and bulbs: `MeshBasicMaterial` with colour above 1 (1.5–6). It glows through bloom, and it lights nothing, so add a real light next to it if it should light the room.

## Dust and air
- 200–400 points, positions from `hash(i)`, drift as small sines of t, `AdditiveBlending`, `depthWrite: false`.
- Brighter inside the sun beam (compute per point whether it is in the beam, or place most of them in the beam's volume).
- Keep dust away from the lens (a speck 10 cm from the camera becomes a big blurry blob).

## Lighting changes over time
- A lamp switching on: flicker for 3–4 frames, a short dip, then ease up over 0.15 s. Bulb colour and light intensity driven by the same function, plus a click sound on the first frame.
- Changing the key light over a scene: animate intensity/colour with `smooth(seg(t, a, b))`, never a hard jump unless it is a cut.

## Problems seen and fixes
- A prop right in a light's beam glows at any colour: lower that light's contribution on that material (a per-material factor), do not change the light.
- Shadows flicker between frames: the shadow camera is too big for its map, so tighten its left/right/top/bottom around the set.
- Shadow acne (stripes on every surface): raise the bias a little (-0.0004 to -0.001).
- Everything looks grey and flat: there is too much fill. Lower the sky and ambient light and let the corners go dark.
- Looks like a toy: aperture too big, or the props too clean. Add bevels, small variations and a bit of grain.

## A view through the window (stencil portal)
A blank or white window makes a room look like a set. Put a street or a sky outside it without building a whole city:
1. The glass writes stencil 1 (`colorWrite: false`, `depthWrite: false`, `stencilWrite: true`, `stencilRef: 1`, `stencilZPass: THREE.ReplaceStencilOp`).
2. A full-screen pass inside the stencil resets depth to the far plane (`gl_FragDepth = 1.0`), so a wall behind the glass can't black the window out.
3. Draw the outside (a building facade 8–10 m away, a hazy roofline, a sky dome) only where the stencil equals 1 (`stencilFunc: THREE.EqualStencilFunc`).
- The accumulation render target needs `stencilBuffer: true`.
- Keep everything inside the camera's far plane (raise `camera.far` to about 40).
- Run the outside at about 0.8 of the room's brightness, a little hazy, so it reads as distance and doesn't steal focus.
- Dust drift: 12–40 mm/s, a third of the motes sinking and the rest rising, plus a slow sway per mote. At 2–6 mm/s it looks frozen.
