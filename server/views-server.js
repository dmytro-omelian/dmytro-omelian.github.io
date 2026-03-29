require('./loadEnv');

const http = require('http');
const { closePool, ensureDatabase } = require('./db');
const { handleNodeApiRequest } = require('./api-handler');

const PORT = Number(process.env.VIEWS_PORT) || 4001;
const server = http.createServer(handleNodeApiRequest);

server.on('error', (error) => {
  console.error(`[views-server] Failed to start: ${error.message}`);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  ensureDatabase()
    .then(() => {
      console.log(`[views-server] Running on http://127.0.0.1:${PORT}`);
      console.log('[views-server] Postgres schema is ready');
    })
    .catch((error) => {
      console.error(`[views-server] Failed to initialize database: ${error.message}`);
      process.exit(1);
    });
});

function shutdown() {
  server.close(() => {
    closePool()
      .catch(() => {})
      .finally(() => {
        process.exit(0);
      });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
