// Bundle once, render stills. usage: node scripts/still.mjs <Comp> <out-prefix> <frames comma> [scale]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
process.env.TMPDIR = process.env.TEMP = process.env.TMP = '/home/user/rtmp';
const [comp, prefix, frames = '0', scale = '0.5'] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const opts = {serveUrl, id: comp, chromiumOptions: {gl: 'swiftshader'}, timeoutInMilliseconds: 900000};
const c = await selectComposition(opts);
for (const f of frames.split(',').map(Number)) {
  const t0 = Date.now();
  await renderStill({...opts, composition: c, frame: f, output: `${prefix}${String(f).padStart(4, '0')}.png`, scale: Number(scale)});
  console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
