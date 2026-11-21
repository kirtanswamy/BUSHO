import http from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const publicRoot = resolve(fileURLToPath(new URL('./', import.meta.url)));
const actualPublicRoot = await realpath(publicRoot);
const port = Number(process.env.PORT) || 4173;
const privateDirectories = new Set(['tests', 'scripts', 'docs', '.github', '.git']);
const cleanRoutes = new Map([
  ['/','index.html'],['/signin','signin.html'],['/worker','worker.html'],
  ['/supervisor','supervisor.html'],['/storekeeper','storekeeper.html'],
  ['/terms','terms.html'],['/privacy','privacy.html'],['/accessibility','accessibility.html'],
  ['/admin','admin.html'],['/set-password','set-password.html']
]);
const legacyRoutes = new Map([...cleanRoutes.entries()].filter(([route])=>route!=='/').map(([route,file])=>['/'+file,route]));
legacyRoutes.set('/index.html','/');

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
    const requestUrl = new URL(req.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname.length > 1 && pathname.endsWith('/')) {
      res.writeHead(308, { Location: pathname.slice(0, -1) + requestUrl.search });
      res.end();
      return;
    }
    const legacy = legacyRoutes.get(pathname);
    if (legacy) {
      res.writeHead(308, { Location: legacy + requestUrl.search });
      res.end();
      return;
    }
    const relativePath = cleanRoutes.get(pathname) || (pathname === '/' ? 'index.html' : (pathname.startsWith('/') ? pathname.slice(1) : pathname));
    const requestedPath = resolve(publicRoot, relativePath);
    const insidePublicRoot = requestedPath === publicRoot || requestedPath.startsWith(`${publicRoot}${sep}`);
    const pathParts = relativePath.split(/[\\/]/);
    const hasHiddenPart = pathParts.some(part => part === '..' || part.startsWith('.'));
    const hasPrivateDirectory = pathParts.some(part => privateDirectories.has(part.toLowerCase()));
    const type = mime[extname(requestedPath).toLowerCase()];
    if (!insidePublicRoot || hasHiddenPart || hasPrivateDirectory || relativePath.includes('\\') || !type) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const actualRequestedPath = await realpath(requestedPath);
    const insideActualPublicRoot = actualRequestedPath === actualPublicRoot
      || actualRequestedPath.startsWith(`${actualPublicRoot}${sep}`);
    if (!insideActualPublicRoot) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const data = await readFile(actualRequestedPath);
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
