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

## Video 1: spaghetti (take1). Worlds (user chose: render HERE, full quality, slow; chunked per beat)
- street1957: London terraced street at dusk, the family house fully built inside (living room + TV close-ups, hallway + phone,
  kitchen + pantry + windowsill), back gardens (imagined rainy garden = rain light preset), city rows to the horizon, Crystal
  Palace transmitter mast on a far hill. Window/crane moves are continuous inside this world.
- orchard: Ticino meadow (alps_field photo sky, ground-projected) + 3D trees with spaghetti, family, drying racks, crew.
- switchboard: BBC switchboard room 1957.
- Render: 1080x1920 native at ~70 s/frame, chunk per beat (out/spaghetti/chunks), upscale to 1440x2560 at the end.
- Look notes from first full still: ground band at grass edge (fix), bokeh too strong on foliage (lower), strands must read as
  pale pasta not catkins. Grass renderer: KEEP AS IS (user). Character glow: KEEP (user).

## Status log
- [x] Voice trimmed + 1.12x, words.json
- [x] Perf (clean, 4 CPU, no GPU): one render uses all 4 cores; post alone ~11 s/frame, grass 160k ~43 s/frame at 1080x1920. Parallel renders do not help. Full scene est. 60-100 s/frame → 36-60 h per video at 1080p. Needs a GPU machine for the full plan.
- [ ] Engine core (camera, env, card, post)
- [ ] Spaghetti sets
- [ ] Spaghetti stills review → full render → sound mix → QA
- [ ] Sandwich, Roomba, Croissant (reuse engine)
- [ ] Bloop (waiting for voice-over)
