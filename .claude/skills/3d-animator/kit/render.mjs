// Renders the film frame by frame in headless Chrome and pipes each PNG straight into ffmpeg.
// Nothing plays in real time, so a heavy frame is never dropped: frame 120 is always exactly renderAt(120 / fps).
//
//   node render.mjs --stills=0.5,2.5,4.5 [--n=16] [--style=toon] [--out=stills]   PNG stills to check a look (styles.js: lit clay paper shadow blueprint toon voxel thermal synth chrome neon mix)
//   node render.mjs --video [--from=0 --to=6] [--fps=30] [--n=48] [--crf=16] [--audio=sound/mix.wav] [--out=out/final.mp4]
//
// --n = sub-frames per frame (motion blur + soft shadows + lens blur + anti-aliasing). 4 = fast preview, 16 = stills, 48 = final.
// Set CHROME_PATH to use your own Chrome instead of the one puppeteer downloaded.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const ROOT = path.resolve('.');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const angle = process.platform === 'darwin' ? ['--use-angle=metal'] : process.platform === 'win32' ? ['--use-angle=d3d11'] : [];
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--run-all-compositor-stages-before-draw', ...angle] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
page.on('console', (m) => { if (['error', 'warning', 'warn'].includes(m.type())) console.log('[page]', m.type(), m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('response', (r) => { if (r.status() >= 400) console.log('[missing]', r.url()); });
await page.goto(`http://127.0.0.1:${port}/index.html?render=1${args.style ? `&style=${args.style}` : ''}`, { waitUntil: 'load' });   // --style=<name> (styles.js)
await page.waitForFunction('window.__ready === true', { timeout: 120000 });

const gpu = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const x = gl && gl.getExtension('WEBGL_debug_renderer_info'); return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
console.log('GPU:', gpu, /swiftshader|llvmpipe|software/i.test(gpu) ? '<- software rendering: it works, but slowly. Use --n=4 for previews.' : '');

const total = await page.evaluate('window.total');
const N = +(args.n || 16);
const grab = async (t) => Buffer.from(await page.evaluate((tt, n) => { window.renderAt(tt, n); return document.getElementById('stage').toDataURL('image/png').split(',')[1]; }, t, N), 'base64');

if (args.stills) {
  const out = args.out || 'stills'; fs.mkdirSync(out, { recursive: true });
  for (const s of String(args.stills).split(',')) { const t = parseFloat(s), t0 = Date.now(); const f = `${out}/t${t.toFixed(3).padStart(7, '0')}.png`; fs.writeFileSync(f, await grab(t)); console.log('still ->', f, `${((Date.now() - t0) / 1000).toFixed(1)} s`); }
} else if (args.video) {
  const fps = +(args.fps || 30), from = +(args.from || 0), to = +(args.to || total), n = Math.round((to - from) * fps);
  const outFile = args.out || 'out/final.mp4'; fs.mkdirSync(path.dirname(outFile) || '.', { recursive: true });
  const audio = args.audio ? ['-ss', String(from), '-i', String(args.audio)] : [];
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', ...audio,
    '-map', '0:v', ...(args.audio ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-shortest'] : []),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.crf || 16), '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await grab(from + i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 30 === 0 && i) { const s = (Date.now() - t0) / 1000; console.log(`frame ${i}/${n}  ${s.toFixed(0)} s, about ${((n - i) * s / i).toFixed(0)} s left`); }
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log('video ->', outFile, `${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
} else console.log('Nothing to do. Use --stills=1,2,3 or --video');
// Chrome can take 30-40 s to shut down after a long render: give it 8 s, then end it.
server.closeAllConnections?.(); server.close();
await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 8000))]);
try { browser.process()?.kill('SIGKILL'); } catch {}
process.exit(0);
