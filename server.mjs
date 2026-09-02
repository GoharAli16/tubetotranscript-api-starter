import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));

async function loadLocalEnvironment() {
  try {
    const contents = await readFile(join(rootDirectory, '.env'), 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // Missing .env is not fatal here; the missing-key check below reports it clearly.
  }
}

await loadLocalEnvironment();

const port = Number(process.env.PORT || 3001);
const apiKey = process.env.TUBETOTRANSCRIPT_API_KEY;
const apiBaseUrl = 'https://www.tubetotranscript.com/api/v1/transcript';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

function isYouTubeUrl(value) {
  try {
    const url = new URL(value);
    return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname);
  } catch {
    return false;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function serveStatic(request, response) {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const filePath = pathname === '/' ? 'index.html' : pathname.slice(1);

  if (filePath.includes('..')) {
    response.writeHead(400).end('Invalid path');
    return;
  }

  try {
    const body = await readFile(join(rootDirectory, 'public', filePath));
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'GET' && requestUrl.pathname === '/api/transcript') {
    const youtubeUrl = requestUrl.searchParams.get('url');

    if (!youtubeUrl || !isYouTubeUrl(youtubeUrl)) {
      sendJson(response, 400, { error: 'Provide a valid YouTube or youtu.be URL.' });
      return;
    }

    if (!apiKey) {
      sendJson(response, 500, {
        error: 'Set TUBETOTRANSCRIPT_API_KEY in .env — the v1 API requires a key. Create a free one at https://www.tubetotranscript.com/signup'
      });
      return;
    }

    try {
      const upstream = await fetch(`${apiBaseUrl}?url=${encodeURIComponent(youtubeUrl)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const body = await upstream.text();
      response.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8'
      });
      response.end(body);
    } catch {
      sendJson(response, 502, { error: 'Unable to reach the TubeToTranscript API.' });
    }
    return;
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  await serveStatic(request, response);
});

server.listen(port, () => {
  console.log(`TubeToTranscript API starter running at http://localhost:${port}`);
});
