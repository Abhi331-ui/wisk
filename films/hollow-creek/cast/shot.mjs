// node cast/shot.mjs <page.html> <out.png> [W] [H]: serve the project folder and screenshot one canvas page
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const [page, out, W = 3200, H = 1800] = process.argv.slice(2), ROOT = path.resolve('.');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, r));
const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: +W, height: +H } });
pg.on('pageerror', (e) => console.log('[pageerror]', e.message)); pg.on('console', (m) => m.type() === 'error' && console.log('[err]', m.text()));
await pg.goto(`http://127.0.0.1:${srv.address().port}/${page}`); await pg.waitForFunction('window.done === true', null, { timeout: 60000 });
await pg.locator('canvas').first().screenshot({ path: out }); await b.close(); srv.close(); console.log('->', out);
