#!/usr/bin/env bash
# Creates a new short project:  bash tools/setup.sh <project_dir>
# Needs: node >= 22.6 (type stripping), python3 + numpy, ffmpeg, git, Playwright Chromium (npx playwright install chromium if missing).
set -e
KIT="$(cd "$(dirname "$0")/.." && pwd)"; P="${1:?project dir}"
mkdir -p "$P/web/lib" "$P/work" "$P/stills" "$P/out"
cp "$KIT"/engine/*.js "$KIT"/engine/index.html "$P/web/"
cp "$KIT"/example/soldier/story.js "$P/web/story.js"        # starting point: rewrite for the new story
cp "$KIT"/example/soldier/audio.py "$P/audio.py"            # starting point: rewrite the cue table
cp "$KIT"/tools/*.mjs "$KIT"/tools/*.py "$P/" 2>/dev/null || true
# three.js r160 (module build). npm first, then a sparse git clone (works where only GitHub is reachable).
if [ ! -f "$P/web/lib/three.module.js" ]; then
  ( cd /tmp && rm -rf _three && mkdir _three && cd _three && npm pack three@0.160.0 >/dev/null 2>&1 && tar xzf three-0.160.0.tgz && cp package/build/three.module.js "$P/web/lib/" ) \
  || ( cd /tmp && rm -rf _t3 && git clone -q --depth 1 --filter=blob:none --sparse --branch r160 https://github.com/mrdoob/three.js _t3 && cd _t3 && git sparse-checkout set build && cp build/three.module.js "$P/web/lib/" )
fi
# toon base: the Pen / head / face library from mromidev/claude-animated-shorts, types stripped
if [ ! -f "$KIT/vendor/toon.ts" ]; then mkdir -p "$KIT/vendor"; git clone -q --depth 1 https://github.com/mromidev/claude-animated-shorts /tmp/_cas && cp /tmp/_cas/templates/bridge/toon.ts "$KIT/vendor/toon.ts"; fi
node -e "const m=require('node:module'),fs=require('fs');fs.writeFileSync('$P/web/toonbase.js',m.stripTypeScriptTypes(fs.readFileSync('$KIT/vendor/toon.ts','utf8'),{mode:'transform'}))" 2>/dev/null
cat "$P/web/toonbase.js" "$P/web/roman.js" > "$P/web/toon.js"
# playwright: use a global install if there is one
mkdir -p "$P/node_modules"; [ -e "$P/node_modules/playwright" ] || ln -sf "$(npm root -g)/playwright" "$P/node_modules/playwright"
echo "ready: $P   (after editing cast code run: cat web/toonbase.js web/roman.js > web/toon.js)"
