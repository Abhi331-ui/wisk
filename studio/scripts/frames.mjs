// Resumable chunked frame renderer. usage: node scripts/frames.mjs <Comp> <outDir> <from> <to> [step=2] [chunk=20]
// Renders frames from..to (inclusive) every <step> frames as JPEG (q95) into outDir/f_NNNN.jpg, skipping existing files.
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import path from 'path'; import fs from 'fs';
process.env.TMPDIR = process.env.TEMP = process.env.TMP = '/home/user/rtmp';
const [comp, outDir, from, to, step = '2', chunk = '20'] = process.argv.slice(2);
const S = Number(step), C = Number(chunk); fs.mkdirSync(outDir, {recursive: true});
const want = []; for (let f = Number(from); f <= Number(to); f += S) want.push(f);
const todo = want.filter((f) => !fs.existsSync(path.join(outDir, `f_${String(f).padStart(4, '0')}.jpg`)));
console.log(`${want.length} frames wanted, ${todo.length} to render`); if (!todo.length) process.exit(0);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const opts = {serveUrl, id: comp, chromiumOptions: {gl: 'swiftshader'}, timeoutInMilliseconds: 1800000};
const composition = await selectComposition(opts);
for (let i = 0; i < todo.length; i += C) {
  const part = todo.slice(i, i + C), tmp = path.join(outDir, '_tmp'); fs.rmSync(tmp, {recursive: true, force: true}); fs.mkdirSync(tmp);
  const t0 = Date.now();
  // render the span covering this part at the wanted step (everyNthFrame keeps the cadence)
  await renderFrames({...opts, composition, frameRange: [part[0], part[part.length - 1]], everyNthFrame: S, outputDir: tmp, imageFormat: 'jpeg', jpegQuality: 95,
    concurrency: 1, onStart: () => {}, onFrameUpdate: () => {}});
  const files = fs.readdirSync(tmp).filter((f) => f.endsWith('.jpeg') || f.endsWith('.jpg')).sort();
  files.forEach((f, k) => fs.renameSync(path.join(tmp, f), path.join(outDir, `f_${String(part[0] + k * S).padStart(4, '0')}.jpg`)));
  console.log(new Date().toISOString(), 'chunk', part[0], '-', part[part.length - 1], files.length, 'frames', ((Date.now() - t0) / 1000 / files.length).toFixed(1) + 's/frame');
}
fs.rmSync(serveUrl, {recursive: true, force: true});
console.log('done');
