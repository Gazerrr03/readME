import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT ?? 4174);
const PROJECT_BASE = '/readME';
const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/rss+xml; charset=utf-8'],
  ['.wav', 'audio/wav'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
]);

function send(response, status, body = '') {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(body);
}

function resolveRequestPath(requestUrl) {
  const pathname = new URL(requestUrl, `http://${HOST}:${PORT}`).pathname;
  const decoded = decodeURIComponent(pathname);
  const sitePath = decoded === PROJECT_BASE
    ? '/'
    : decoded.startsWith(`${PROJECT_BASE}/`)
      ? decoded.slice(PROJECT_BASE.length)
      : decoded;
  const candidate = resolve(ROOT, `.${sitePath}`);
  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${sep}`)) return null;
  return candidate;
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    send(response, 405, 'Method not allowed');
    return;
  }

  let filePath;
  try {
    filePath = resolveRequestPath(request.url ?? '/');
  } catch {
    send(response, 400, 'Bad request');
    return;
  }
  if (!filePath) {
    send(response, 403, 'Forbidden');
    return;
  }

  try {
    const details = await stat(filePath);
    if (details.isDirectory()) filePath = resolve(filePath, 'index.html');
    const fileDetails = details.isDirectory() ? await stat(filePath) : details;
    if (!fileDetails.isFile()) throw new Error('Not a file');

    response.writeHead(200, {
      'Content-Length': fileDetails.size,
      'Content-Type': MIME_TYPES.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    send(response, 404, 'Not found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Static server listening at http://${HOST}:${PORT}`);
});
