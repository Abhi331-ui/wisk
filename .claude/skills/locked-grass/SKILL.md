---
name: locked-grass
description: The user's locked grass look for three.js scenes (dense instanced curved blades, dark root to light tip, straw-yellow accents). Use whenever a video, scene or world has open ground, lawns, fields or hills.
---

# Locked grass

The user picked this grass on video 15. Use it on every piece of open ground. Don't redesign it; only change where it goes.

## Use
1. Copy `grass.js` from this folder into the project's `web/` folder.
2. In the world code:
   ```js
   import { addGrass } from "./grass.js";
   addGrass(THREE, scene, {
     zones: [[cx, cz, width, depth, count], ...], // 20k-60k blades per zone, densest around the action
     skip: (x, z) => onPath(x, z),                // keep paths, roads and buildings clear
     heightAt: (x, z) => hAt(x, z),               // terrain height
     seed: 5,
   });
   ```
3. Put a ground plane with a real grass texture (`RT.grassReal`, triplanar) under the blades so no gaps show.

## The look (keep these values)
- **Blade:** 4 segments, 0.012 m wide tapering to the tip, 0.32 m tall, t² forward bend.
- **Colour:** vertex colour from a dark root to a light tip; per-blade green tint RGB(0.36-0.54, 0.55-0.77, 0.20-0.30); about 8% straw-yellow blades RGB(0.95, 0.85, 0.5).
- **Placement:** random yaw, tilt ±0.25 rad, height scale 0.6-1.5.
- **Material:** MeshStandardMaterial, double-sided, roughness 0.8, envMapIntensity 0.5, receives shadows, no frustum culling.
- **Density:** about 330 blades per m² on lawns near the camera. Cover the whole visible ground, not just the area right in front of the camera.
