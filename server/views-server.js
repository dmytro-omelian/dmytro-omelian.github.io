const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.VIEWS_PORT) || 4001;
const DB_FILE_PATH = path.resolve(__dirname, process.env.VIEWS_DB_PATH || '../data/postViews.sqlite');
const LEGACY_DATA_FILE_PATH = path.resolve(__dirname, '../data/postViews.json');
const SEED_FILE_PATH = path.resolve(__dirname, '../src/data/postViewsSeed.json');

let initializationPromise = null;
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

async function readJsonViews(filePath) {
  if (!(await fileExists(filePath))) {
    return {};
  }

  try {
    const rawData = await fs.readFile(filePath, 'utf8');
    return normalizeViews(JSON.parse(rawData));
  } catch (error) {
    return {};
  }
}

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}

async function runSql(sql, { json = false } = {}) {
  const args = [];

  if (json) {
    args.push('-json');
  }

  args.push(DB_FILE_PATH, sql);

  const { stdout } = await execFileAsync('sqlite3', args);

  if (!json) {
    return stdout.trim();
  }

  const trimmedOutput = stdout.trim();
  return JSON.parse(trimmedOutput || '[]');
}

async function writeInitialViews(viewsBySlug) {
  const entries = Object.entries(normalizeViews(viewsBySlug));

  if (entries.length === 0) {
    return;
  }

  const values = entries
    .map(([slug, views]) => `('${escapeSqlString(slug)}', ${views})`)
    .join(', ');

  await runSql(`
    INSERT INTO post_views (slug, views)
    VALUES ${values}
    ON CONFLICT(slug) DO UPDATE SET views = excluded.views;
  `);
}

async function ensureDatabase() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });

    await runSql(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS post_views (
        slug TEXT PRIMARY KEY,
        views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0)
      );
    `);

    const [{ count = 0 } = {}] = await runSql('SELECT COUNT(*) AS count FROM post_views;', { json: true });

    if (Number(count) > 0) {
      return;
    }

    const [seedViews, legacyViews] = await Promise.all([
      readJsonViews(SEED_FILE_PATH),
      readJsonViews(LEGACY_DATA_FILE_PATH),
    ]);

    await writeInitialViews({
      ...seedViews,
      ...legacyViews,
    });
  })().catch((error) => {
    initializationPromise = null;
    throw error;
  });

  return initializationPromise;
}

async function readViewsFromDatabase() {
  await ensureDatabase();

  const rows = await runSql('SELECT slug, views FROM post_views ORDER BY slug;', { json: true });
  return normalizeViews(Object.fromEntries(rows.map((row) => [row.slug, row.views])));
}

async function incrementViewCount(slug) {
  await ensureDatabase();

  const safeSlug = escapeSqlString(slug);
  const rows = await runSql(`
    INSERT INTO post_views (slug, views)
    VALUES ('${safeSlug}', 1)
    ON CONFLICT(slug) DO UPDATE SET views = post_views.views + 1
    RETURNING views;
  `, { json: true });

  const nextViews = Number(rows[0]?.views);
  return Number.isFinite(nextViews) && nextViews >= 0 ? Math.floor(nextViews) : 0;
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
    const views = await readViewsFromDatabase();
    sendJson(res, 200, { views });
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname.startsWith('/api/views/')) {
    const slug = decodeURIComponent(requestUrl.pathname.replace('/api/views/', '')).trim();

    if (!slug) {
      sendJson(res, 400, { error: 'Missing slug' });
      return;
    }

    const views = await queueWrite(() => incrementViewCount(slug));

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
  ensureDatabase()
    .then(() => {
      console.log(`[views-server] Running on http://127.0.0.1:${PORT}`);
      console.log(`[views-server] Database file: ${DB_FILE_PATH}`);
    })
    .catch((error) => {
      console.error(`[views-server] Failed to initialize database: ${error.message}`);
      process.exit(1);
    });
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
