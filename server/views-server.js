require('./loadEnv');

const http = require('http');
const {
  closePool,
  createHttpError,
  createQuestion,
  createQuestionLog,
  deleteQuestionLog,
  ensureDatabase,
  getAdminQuestions,
  getAllPostViews,
  getQuestionById,
  getQuestionLogs,
  getQuestions,
  incrementPostView,
  updateQuestion,
  updateQuestionLog,
} = require('./db');

const PORT = Number(process.env.VIEWS_PORT) || 4001;
const ADMIN_API_KEY = (process.env.ADMIN_API_KEY || '').trim();

let writeQueue = Promise.resolve();

function queueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    throw createHttpError(400, 'Request body must be valid JSON.');
  }
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

function getNumericId(value) {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

function ensureAdminAccess(req) {
  if (!ADMIN_API_KEY) {
    throw createHttpError(503, 'ADMIN_API_KEY is not configured.');
  }

  const requestKey = String(req.headers['x-admin-key'] || '').trim();

  if (!requestKey || requestKey !== ADMIN_API_KEY) {
    throw createHttpError(401, 'Admin key is invalid.');
  }
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && requestUrl.pathname === '/api/views') {
    const views = await getAllPostViews();
    sendJson(res, 200, { views });
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname.startsWith('/api/views/')) {
    const slug = decodeURIComponent(requestUrl.pathname.replace('/api/views/', '')).trim();

    if (!slug) {
      sendJson(res, 400, { error: 'Missing slug' });
      return;
    }

    const views = await queueWrite(() => incrementPostView(slug));

    console.log(`[views-server] ${slug} -> ${views}`);
    sendJson(res, 200, { slug, views });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/questions') {
    const archived = requestUrl.searchParams.get('archived') === 'true';
    const questions = await getQuestions({ archived });
    sendJson(res, 200, { questions });
    return;
  }

  const publicLogsMatch = requestUrl.pathname.match(/^\/api\/questions\/(\d+)\/logs$/);

  if (req.method === 'GET' && publicLogsMatch) {
    const questionId = getNumericId(publicLogsMatch[1]);

    if (!questionId) {
      sendJson(res, 400, { error: 'Question id is invalid.' });
      return;
    }

    const question = await getQuestionById(questionId);

    if (!question) {
      sendNotFound(res);
      return;
    }

    const logs = await getQuestionLogs(questionId);
    sendJson(res, 200, { question, logs });
    return;
  }

  if (requestUrl.pathname.startsWith('/api/admin/')) {
    ensureAdminAccess(req);
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/admin/questions') {
    const questions = await getAdminQuestions();
    sendJson(res, 200, { questions });
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/admin/questions') {
    const payload = await readJsonBody(req);
    const question = await queueWrite(() => createQuestion(payload));
    sendJson(res, 201, { question });
    return;
  }

  const adminQuestionMatch = requestUrl.pathname.match(/^\/api\/admin\/questions\/(\d+)$/);

  if (req.method === 'PATCH' && adminQuestionMatch) {
    const questionId = getNumericId(adminQuestionMatch[1]);

    if (!questionId) {
      sendJson(res, 400, { error: 'Question id is invalid.' });
      return;
    }

    const payload = await readJsonBody(req);
    const question = await queueWrite(() => updateQuestion(questionId, payload));

    if (!question) {
      sendNotFound(res);
      return;
    }

    sendJson(res, 200, { question });
    return;
  }

  const adminQuestionLogsMatch = requestUrl.pathname.match(/^\/api\/admin\/questions\/(\d+)\/logs$/);

  if (adminQuestionLogsMatch) {
    const questionId = getNumericId(adminQuestionLogsMatch[1]);

    if (!questionId) {
      sendJson(res, 400, { error: 'Question id is invalid.' });
      return;
    }

    if (req.method === 'GET') {
      const question = await getQuestionById(questionId);

      if (!question) {
        sendNotFound(res);
        return;
      }

      const logs = await getQuestionLogs(questionId);
      sendJson(res, 200, { question, logs });
      return;
    }

    if (req.method === 'POST') {
      const payload = await readJsonBody(req);
      const log = await queueWrite(() => createQuestionLog(questionId, payload));
      sendJson(res, 201, { log });
      return;
    }
  }

  const adminLogMatch = requestUrl.pathname.match(/^\/api\/admin\/logs\/(\d+)$/);

  if (adminLogMatch) {
    const logId = getNumericId(adminLogMatch[1]);

    if (!logId) {
      sendJson(res, 400, { error: 'Log id is invalid.' });
      return;
    }

    if (req.method === 'PATCH') {
      const payload = await readJsonBody(req);
      const log = await queueWrite(() => updateQuestionLog(logId, payload));

      if (!log) {
        sendNotFound(res);
        return;
      }

      sendJson(res, 200, { log });
      return;
    }

    if (req.method === 'DELETE') {
      const deleted = await queueWrite(() => deleteQuestionLog(logId));

      if (!deleted) {
        sendNotFound(res);
        return;
      }

      sendJson(res, 200, { deleted: true });
      return;
    }
  }

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    await ensureDatabase();
    sendJson(res, 200, { ok: true });
    return;
  }

  sendNotFound(res);
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    const statusCode = error?.statusCode || 500;

    if (statusCode >= 500) {
      console.error(`[views-server] ${error.message}`);
    }

    sendJson(res, statusCode, {
      error: statusCode >= 500 ? 'Internal server error' : error.message,
    });
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
