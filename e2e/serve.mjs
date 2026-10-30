import http from 'http'; import fs from 'fs'; import path from 'path';
const root = new URL('../public/', import.meta.url).pathname, T = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/api/health') { r.setHeader('Content-Type', 'application/json'); return r.end(JSON.stringify({ ok: true, youcamKeyConfigured: false })); }
  if (u === '/api/analyze') { r.setHeader('Content-Type', 'application/json'); return r.end(JSON.stringify({ demo: true, reason: 'no_key' })); }
  const f = path.join(root, u === '/' ? 'index.html' : u); if (!f.startsWith(root) || !fs.existsSync(f)) { r.statusCode = 404; return r.end('nf'); }
  r.setHeader('Content-Type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r);
}).listen(+process.env.PORT || 8790, () => console.log('SunSkin preview on http://localhost:' + (process.env.PORT || 8790)));
