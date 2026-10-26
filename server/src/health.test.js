import { afterEach, describe, expect, it } from 'vitest';
import { createHealthServer, parsePort } from './health.js';

let server;

afterEach(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.closeAllConnections();
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

async function startServer() {
  server = createHealthServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

describe('health server', () => {
  it('serves GET /health as JSON without caching', async () => {
    const baseUrl = await startServer();
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('serves HEAD /health without a body', async () => {
    const baseUrl = await startServer();
    const response = await fetch(`${baseUrl}/health`, { method: 'HEAD' });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('rejects unsupported health methods', async () => {
    const baseUrl = await startServer();
    const response = await fetch(`${baseUrl}/health`, { method: 'POST' });
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET, HEAD');
  });

  it('does not serve unknown routes as health checks', async () => {
    const baseUrl = await startServer();
    expect((await fetch(`${baseUrl}/unknown`)).status).toBe(404);
  });

  it('accepts a query string on the health route', async () => {
    const baseUrl = await startServer();
    expect((await fetch(`${baseUrl}/health?probe=1`)).status).toBe(200);
  });
});

describe('PORT configuration', () => {
  it('defaults to 3001 and accepts valid numeric ports', () => {
    expect(parsePort(undefined)).toBe(3001);
    expect(parsePort('8080')).toBe(8080);
    expect(parsePort('65535')).toBe(65535);
  });

  it.each(['', '0', '-1', '65536', '3.5', 'NaN', '3001abc'])(
    'rejects invalid port %j',
    (value) => {
      expect(() => parsePort(value)).toThrow(
        'PORT must be an integer between 1 and 65535',
      );
    },
  );
});
