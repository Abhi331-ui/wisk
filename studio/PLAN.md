# Studio production plan (source of truth across sessions)
Renders the shorts in `../shorts/` with the cartoon-3d-short skill rules (see ../.claude/skills/cartoon-3d-short/SKILL.md).
Voice: `../shorts/voice/takeN_final.wav` (silence trimmed, 1.12x). Word timings: `takeN_final.words.json`.
Beats (camera plan): `../shorts/preview/beats.py` → `data/<video>.beats.json` via `scripts/build_beats.py` (final timings).

## Engine (src/engine)
- Remotion + @remotion/three (R3F 8, three 0.170). Render on CPU: `--gl=swiftshader`. TEMP=/home/user/rtmp.
- Look: ACES tone mapping, HDRI image-based light (Poly Haven), PBR textures (Poly Haven/ambientCG), glTF props (Poly Haven).
- Camera: per-beat keys (start pose → end pose), centripetal Catmull-Rom through all keys of one set; never static;
  waist height by default; set changes = whip transition (fast pan + directional blur), ≤ 2 hard cuts per video.
- Characters: 2D cards drawn with toon.ts Pen (+ hair library + soft glow halo), billboards lit by the scene.
- Assets: `public/assets/{hdri,tex,models}` (gitignored), fetched by `scripts/fetch_assets.py` from a manifest.

## Video 1: spaghetti (take1). Sets
living1957, terraces (dusk street + aerial), tvscreen, orchard (Ticino lake), hallway, switchboard, kitchen, mast, windowsill, garden.

## Status log
- [x] Voice trimmed + 1.12x, words.json
- [x] Perf test: swiftshader renders 1080x1920 (~2-3 s/frame simple scene)
- [ ] Engine core (camera, env, card, post)
- [ ] Spaghetti sets
- [ ] Spaghetti stills review → full render → sound mix → QA
- [ ] Sandwich, Roomba, Croissant (reuse engine)
- [ ] Bloop (waiting for voice-over)
