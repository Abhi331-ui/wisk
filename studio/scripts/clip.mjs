// Bundle once, render a frame range to mp4/png-sequence with timing. usage: node scripts/clip.mjs <Comp> <out> <from-to> [scale] [props-json] [concurrency]
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
process.env.TMPDIR = process.env.TEMP = process.env.TMP = '/home/user/rtmp';
const [comp, out, range = '0-2', scale = '0.5', props = '{}', conc = '1'] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const inputProps = JSON.parse(props);
const opts = {serveUrl, id: comp, inputProps, chromiumOptions: {gl: process.env.GL || 'swiftshader'}, timeoutInMilliseconds: 1800000, logLevel: process.env.VERBOSE ? 'verbose' : 'info'};
const c = await selectComposition(opts);
const [a, b] = range.split('-').map(Number); const t0 = Date.now(); let last = t0;
await renderMedia({...opts, composition: c, frameRange: [a, b], outputLocation: out, codec: out.endsWith('.png') ? undefined : 'h264',
  imageFormat: 'jpeg', jpegQuality: 92, scale: Number(scale), concurrency: Number(conc), crf: 16,
  onProgress: ({renderedFrames}) => { const n = Date.now(); if (renderedFrames) { console.log('frames', renderedFrames, ((n - last) / 1000).toFixed(1) + 's'); last = n; } }});
console.log('total', ((Date.now() - t0) / 1000).toFixed(1) + 's');
