const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = Number(process.env.VIEWS_PORT) || 4001;
const DATA_FILE_PATH = path.resolve(__dirname, '../data/postViews.json');
const SEED_FILE_PATH = path.resolve(__dirname, '../src/data/postViewsSeed.json');

let writeQueue = Promise.resolve();

function normalizeViews(input) {
  if (!input || typeof input !== 'object') {
    return {};
  }

  return Object.entries(input).reduce((accumulator, [slug, rawValue]) => {
    const numericValue = Number(rawValue);
    accumulator[slug] = Number.isFinite(numericValue) && numericValue >= 0 ? Math.floor(numericValue) : 0;
    return accumulator;
  }, {});
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });

  if (await fileExists(DATA_FILE_PATH)) {
    return;
  }

  let initialViews = {};

  if (await fileExists(SEED_FILE_PATH)) {
    try {
      const seedRaw = await fs.readFile(SEED_FILE_PATH, 'utf8');
      initialViews = normalizeViews(JSON.parse(seedRaw));
    } catch (error) {
      initialViews = {};
    }
  }

  await fs.writeFile(DATA_FILE_PATH, `${JSON.stringify(initialViews, null, 2)}\n`, 'utf8');
}

async function readViewsFromFile() {
  await ensureDataFile();

  try {
    const rawData = await fs.readFile(DATA_FILE_PATH, 'utf8');
    return normalizeViews(JSON.parse(rawData));
  } catch (error) {
    return {};
  }
}

async function writeViewsToFile(viewsBySlug) {
  const normalized = normalizeViews(viewsBySlug);
  await fs.writeFile(DATA_FILE_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
}

function queueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function sendNotFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && requestUrl.pathname === '/api/views') {
    const views = await readViewsFromFile();
    sendJson(res, 200, { views });
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname.startsWith('/api/views/')) {
    const slug = decodeURIComponent(requestUrl.pathname.replace('/api/views/', '')).trim();

    if (!slug) {
      sendJson(res, 400, { error: 'Missing slug' });
      return;
    }

    const views = await queueWrite(async () => {
      const currentViews = await readViewsFromFile();
      currentViews[slug] = (currentViews[slug] || 0) + 1;
      await writeViewsToFile(currentViews);
      return currentViews[slug];
    });

    console.log(`[views-server] ${slug} -> ${views}`);
    sendJson(res, 200, { slug, views });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  sendNotFound(res);
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(() => {
    sendJson(res, 500, { error: 'Internal server error' });
  });
});

server.on('error', (error) => {
  console.error(`[views-server] Failed to start: ${error.message}`);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[views-server] Running on http://127.0.0.1:${PORT}`);
  console.log(`[views-server] Data file: ${DATA_FILE_PATH}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
