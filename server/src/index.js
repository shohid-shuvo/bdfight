import { createHealthServer, parsePort } from './health.js';

const port = parsePort(process.env.PORT);
const host = process.env.HOST ?? '127.0.0.1';
const server = createHealthServer();

server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.info(`Health server listening on http://${host}:${port}`);
});

function shutdown() {
  server.close(() => {
    process.exitCode = 0;
  });
  server.closeIdleConnections();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
