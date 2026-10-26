import { createServer } from 'node:http';

export function parsePort(value) {
  if (value === undefined) return 3001;
  if (!/^\d+$/.test(value)) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

export function createHealthServer() {
  return createServer((request, response) => {
    const path = request.url.split('?')[0];
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');

    if (path !== '/health') {
      response.writeHead(404);
      response.end(JSON.stringify({ error: 'not_found' }));
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end(JSON.stringify({ error: 'method_not_allowed' }));
      return;
    }
    response.writeHead(200);
    response.end(
      request.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok' }),
    );
  });
}
