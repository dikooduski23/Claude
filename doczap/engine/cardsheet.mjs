// usage: node cardsheet.mjs <out.png> [faces|hats|beards|patterns|talk]
// Renders a character sheet (2D cards only, no 3D) so faces/hats can be checked in seconds.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [,, out = 'cards.png', grid = 'faces'] = process.argv;
const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': ({ js: 'text/javascript', woff: 'font/woff', woff2: 'font/woff2', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', css: 'text/css' })[p.split('.').pop()] || 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 1000 } });
pg.on('pageerror', (e) => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/cardsheet.html?grid=${grid}`);
await pg.waitForFunction(() => window.ready, null, { timeout: 60000 });
const d = await pg.evaluate(() => document.getElementById('s').toDataURL('image/png'));
fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); console.log('wrote', out);
await b.close(); srv.close();
