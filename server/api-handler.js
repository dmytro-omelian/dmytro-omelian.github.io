require('./loadEnv');

const {
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

let writeQueue = Promise.resolve();

function queueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

async function readNodeJsonBody(req) {
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

function createJsonPayload(statusCode, payload) {
  return {
    statusCode,
    payload,
  };
}

function createJsonResponse(statusCode, payload) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function getNumericId(value) {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

function getHeaderValue(headers, headerName) {
  if (!headers) {
    return '';
  }

  if (typeof headers.get === 'function') {
    return String(headers.get(headerName) || '').trim();
  }

  const matchingKey = Object.keys(headers).find(
    (key) => key.toLowerCase() === headerName.toLowerCase(),
  );
  const headerValue = matchingKey ? headers[matchingKey] : '';
  const normalizedValue = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  return String(normalizedValue || '').trim();
}

function ensureAdminAccess(headers) {
  const adminApiKey = (process.env.ADMIN_API_KEY || '').trim();

  if (!adminApiKey) {
    throw createHttpError(503, 'ADMIN_API_KEY is not configured.');
  }

  const requestKey = getHeaderValue(headers, 'x-admin-key');

  if (!requestKey || requestKey !== adminApiKey) {
    throw createHttpError(401, 'Admin key is invalid.');
  }
}

async function routeApiRequest({ method, requestUrl, headers, readJsonBody }) {
  const normalizedMethod = String(method || 'GET').toUpperCase();

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/views') {
    const views = await getAllPostViews();
    return createJsonPayload(200, { views });
  }

  if (normalizedMethod === 'POST' && requestUrl.pathname.startsWith('/api/views/')) {
    const slug = decodeURIComponent(requestUrl.pathname.replace('/api/views/', '')).trim();

    if (!slug) {
      return createJsonPayload(400, { error: 'Missing slug' });
    }

    const views = await queueWrite(() => incrementPostView(slug));
    return createJsonPayload(200, { slug, views });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/questions') {
    const archived = requestUrl.searchParams.get('archived') === 'true';
    const questions = await getQuestions({ archived });
    return createJsonPayload(200, { questions });
  }

  const publicLogsMatch = requestUrl.pathname.match(/^\/api\/questions\/(\d+)\/logs$/);

  if (normalizedMethod === 'GET' && publicLogsMatch) {
    const questionId = getNumericId(publicLogsMatch[1]);

    if (!questionId) {
      return createJsonPayload(400, { error: 'Question id is invalid.' });
    }

    const question = await getQuestionById(questionId);

    if (!question) {
      return createJsonPayload(404, { error: 'Not found' });
    }

    const logs = await getQuestionLogs(questionId);
    return createJsonPayload(200, { question, logs });
  }

  if (requestUrl.pathname.startsWith('/api/admin/')) {
    ensureAdminAccess(headers);
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/admin/questions') {
    const questions = await getAdminQuestions();
    return createJsonPayload(200, { questions });
  }

  if (normalizedMethod === 'POST' && requestUrl.pathname === '/api/admin/questions') {
    const payload = await readJsonBody();
    const question = await queueWrite(() => createQuestion(payload));
    return createJsonPayload(201, { question });
  }

  const adminQuestionMatch = requestUrl.pathname.match(/^\/api\/admin\/questions\/(\d+)$/);

  if (normalizedMethod === 'PATCH' && adminQuestionMatch) {
    const questionId = getNumericId(adminQuestionMatch[1]);

    if (!questionId) {
      return createJsonPayload(400, { error: 'Question id is invalid.' });
    }

    const payload = await readJsonBody();
    const question = await queueWrite(() => updateQuestion(questionId, payload));

    if (!question) {
      return createJsonPayload(404, { error: 'Not found' });
    }

    return createJsonPayload(200, { question });
  }

  const adminQuestionLogsMatch = requestUrl.pathname.match(/^\/api\/admin\/questions\/(\d+)\/logs$/);

  if (adminQuestionLogsMatch) {
    const questionId = getNumericId(adminQuestionLogsMatch[1]);

    if (!questionId) {
      return createJsonPayload(400, { error: 'Question id is invalid.' });
    }

    if (normalizedMethod === 'GET') {
      const question = await getQuestionById(questionId);

      if (!question) {
        return createJsonPayload(404, { error: 'Not found' });
      }

      const logs = await getQuestionLogs(questionId);
      return createJsonPayload(200, { question, logs });
    }

    if (normalizedMethod === 'POST') {
      const payload = await readJsonBody();
      const log = await queueWrite(() => createQuestionLog(questionId, payload));
      return createJsonPayload(201, { log });
    }
  }

  const adminLogMatch = requestUrl.pathname.match(/^\/api\/admin\/logs\/(\d+)$/);

  if (adminLogMatch) {
    const logId = getNumericId(adminLogMatch[1]);

    if (!logId) {
      return createJsonPayload(400, { error: 'Log id is invalid.' });
    }

    if (normalizedMethod === 'PATCH') {
      const payload = await readJsonBody();
      const log = await queueWrite(() => updateQuestionLog(logId, payload));

      if (!log) {
        return createJsonPayload(404, { error: 'Not found' });
      }

      return createJsonPayload(200, { log });
    }

    if (normalizedMethod === 'DELETE') {
      const deleted = await queueWrite(() => deleteQuestionLog(logId));

      if (!deleted) {
        return createJsonPayload(404, { error: 'Not found' });
      }

      return createJsonPayload(200, { deleted: true });
    }
  }

  if (
    normalizedMethod === 'GET'
    && (requestUrl.pathname === '/health' || requestUrl.pathname === '/api/health')
  ) {
    await ensureDatabase();
    return createJsonPayload(200, { ok: true });
  }

  return createJsonPayload(404, { error: 'Not found' });
}

function createErrorPayload(error) {
  try {
    const statusCode = error?.statusCode || 500;

    if (statusCode >= 500) {
      console.error(`[api] ${error.message}`);
    }

    return createJsonPayload(statusCode, {
      error: statusCode >= 500 ? 'Internal server error' : error.message,
    });
  } catch (error) {
    return createJsonPayload(500, { error: 'Internal server error' });
  }
}

async function handleNodeApiRequest(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    const response = await routeApiRequest({
      method: req.method,
      requestUrl,
      headers: req.headers,
      readJsonBody: () => readNodeJsonBody(req),
    });

    sendJson(res, response.statusCode, response.payload);
  } catch (error) {
    const response = createErrorPayload(error);
    sendJson(res, response.statusCode, response.payload);
  }
}

async function readWebJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw createHttpError(400, 'Request body must be valid JSON.');
  }
}

async function handleWebApiRequest(request) {
  try {
    const response = await routeApiRequest({
      method: request.method,
      requestUrl: new URL(request.url),
      headers: request.headers,
      readJsonBody: () => readWebJsonBody(request),
    });

    return createJsonResponse(response.statusCode, response.payload);
  } catch (error) {
    const response = createErrorPayload(error);
    return createJsonResponse(response.statusCode, response.payload);
  }
}

module.exports = {
  handleNodeApiRequest,
  handleWebApiRequest,
};
