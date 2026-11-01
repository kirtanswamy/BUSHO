import http from 'node:http';
import { extname, normalize, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const root = resolve('./');
const PORT = process.env.PORT || 4173;

const ALLOWED_EXTENSIONS = new Set([
  '.html', '.css', '.js', '.mjs', '.svg', '.png', '.ico', '.woff2', '.json', '.txt', '.md'
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function isAllowedFile(pathname) {
  const ext = extname(pathname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  const parts = normalize(pathname).split(/[\\/]/);
  return !parts.some(p => p.startsWith('.'));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    let pathname = url.pathname;

    if (pathname === '/') pathname = '/index.html';
    pathname = pathname.replace(/^\/+/, '');
    pathname = normalize(pathname);

    if (!isAllowedFile(pathname)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const filePath = resolve(root, pathname);

    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } else {
      console.error('Server error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
    }
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`BUSHO demo on http://127.0.0.1:${PORT}`);
});