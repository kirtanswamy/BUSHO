import http from 'node:http';
import { extname, normalize } from 'node:path';
import { readFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const port = Number(process.env.PORT) || 4173;

// Only public demo assets are served. Server code, tests, docs, package files
// and dotfiles (.git, .env) are never exposed by this local server.
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const requested = normalize(pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
    const unsafe = requested.split(/[\\/]/).some(part => part === '..' || part.startsWith('.'));
    const type = mime[extname(requested).toLowerCase()];
    if (unsafe || !type) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const data = await readFile(new URL(requested, root));
    res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`BUSHO demo running at http://127.0.0.1:${port}`);
});
