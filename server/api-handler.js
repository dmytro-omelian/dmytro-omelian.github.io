require('./loadEnv');

const {
  createBlogComment,
  createBookshelfEntry,
  createHttpError,
  createQuestion,
  createQuestionLog,
  createReadingListEntry,
  deleteBlogComment,
  deleteBookshelfEntry,
  deleteQuestionLog,
  deleteReadingListEntry,
  ensureDatabase,
  getAdminBlogComments,
  getAdminQuestions,
  getBlogCommentCounts,
  getBlogCommentsBySlug,
  getBookshelfEntries,
  getBookshelfTags,
  getAllPostViews,
  getPostViewCount,
  getQuestionById,
  getQuestionLogs,
  getQuestions,
  getReadingListEntries,
  incrementPostView,
  updateBookshelfEntry,
  updateQuestion,
  updateQuestionLog,
  updateReadingListEntry,
} = require('./db');
const { handleMcpRequest } = require('./mcp-handler');
const { getStaticSiteContent } = require('./site-content');
const { sendCommentNotification } = require('./resend');

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

function createJsonPayload(statusCode, payload) {
  return {
    statusCode,
    payload,
  };
}

function createTextPayload(statusCode, body, { contentType = 'text/plain; charset=utf-8', headers = {} } = {}) {
  return {
    statusCode,
    body,
    headers: {
      'Content-Type': contentType,
      ...headers,
    },
  };
}

function normalizeResponse(response) {
  if (Object.prototype.hasOwnProperty.call(response, 'payload')) {
    return {
      statusCode: response.statusCode,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...(response.headers || {}),
      },
      body: JSON.stringify(response.payload),
    };
  }

  return {
    statusCode: response.statusCode,
    headers: {
      'Cache-Control': 'no-store',
      ...(response.headers || {}),
    },
    body: response.body || '',
  };
}

function sendNodeResponse(res, response) {
  const normalizedResponse = normalizeResponse(response);
  res.writeHead(normalizedResponse.statusCode, normalizedResponse.headers);
  res.end(normalizedResponse.body);
}

function createWebResponse(response) {
  const normalizedResponse = normalizeResponse(response);

  return new Response(normalizedResponse.body, {
    status: normalizedResponse.statusCode,
    headers: normalizedResponse.headers,
  });
}

function isMcpPath(pathname) {
  return (
    pathname === '/mcp'
    || pathname === '/mcp/'
    || pathname === '/api/mcp'
    || pathname === '/api/mcp/'
  );
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

function getParsedHeaderUrl(headers, headerName) {
  const headerValue = getHeaderValue(headers, headerName);

  if (!headerValue) {
    return null;
  }

  try {
    return new URL(headerValue);
  } catch (error) {
    return null;
  }
}

function acceptsMarkdown(headers) {
  const acceptHeader = getHeaderValue(headers, 'accept').toLowerCase();
  return acceptHeader.includes('text/markdown') || acceptHeader.includes('text/x-markdown');
}

function normalizeHostname(hostname) {
  return String(hostname || '').trim().toLowerCase().replace(/^\[(.*)\]$/, '$1');
}

function isLocalHostname(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  return (
    normalizedHostname === 'localhost'
    || normalizedHostname === '127.0.0.1'
    || normalizedHostname === '::1'
    || normalizedHostname.endsWith('.localhost')
  );
}

function shouldCountPostView({ requestUrl, headers }) {
  if (isLocalHostname(requestUrl.hostname)) {
    return false;
  }

  const originUrl = getParsedHeaderUrl(headers, 'origin');

  if (originUrl && isLocalHostname(originUrl.hostname)) {
    return false;
  }

  const refererUrl = getParsedHeaderUrl(headers, 'referer');

  if (refererUrl && isLocalHostname(refererUrl.hostname)) {
    return false;
  }

  return true;
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

async function getProjectStatsSafe() {
  try {
    const [activeProjects, archivedProjects] = await Promise.all([
      getQuestions({ archived: false }),
      getQuestions({ archived: true }),
    ]);

    return {
      active: activeProjects.length,
      archived: archivedProjects.length,
    };
  } catch (error) {
    return {
      active: null,
      archived: null,
    };
  }
}

async function buildAgentOverviewMarkdown(requestUrl) {
  const staticContent = await getStaticSiteContent();
  const about = staticContent.about;
  const projectStats = await getProjectStatsSafe();
  const recentPosts = staticContent.blogPosts.slice(0, 5);
  const statsLine = projectStats.active === null
    ? '- Projects: unavailable in this response'
    : `- Projects: ${projectStats.active} active, ${projectStats.archived} archived`;

  return [
    '# Dmytro Omelian',
    '',
    'Personal website data for humans and AI agents.',
    '',
    `- Name: ${about.name}`,
    `- Role: ${about.role}`,
    `- Location: ${about.location}`,
    statsLine,
    `- Blog posts: ${staticContent.blogPosts.length}`,
    `- News items: ${staticContent.news.length}`,
    '',
    '## Preferred Machine Endpoints',
    '',
    `- MCP endpoint: ${requestUrl.origin}/mcp`,
    `- Agent markdown: ${requestUrl.origin}/agent.md`,
    `- Discovery file: ${requestUrl.origin}/llms.txt`,
    '',
    '## Site Sections',
    '',
    `- About: ${requestUrl.origin}/`,
    `- Experience: ${requestUrl.origin}/experience`,
    `- Projects: ${requestUrl.origin}/projects`,
    `- Blog index: ${requestUrl.origin}/blog`,
    '',
    '## Recent Posts',
    '',
    ...(recentPosts.length > 0
      ? recentPosts.map((post) => `- ${post.date}: [${post.title}](${requestUrl.origin}/blog/${post.slug})`)
      : ['- No public posts found.']),
    '',
    '## Guidance For Agents',
    '',
    '- Prefer `/mcp` for structured and up-to-date retrieval.',
    '- Treat this website as public read-only content.',
    '- If a detail is missing, state that explicitly instead of guessing.',
  ].join('\n');
}

async function buildLlmsText(requestUrl) {
  return [
    '# llms.txt',
    '',
    `site: ${requestUrl.origin}`,
    'name: Dmytro Omelian',
    'description: Personal website with public profile, projects, and blog.',
    '',
    'endpoints:',
    `- mcp: ${requestUrl.origin}/mcp`,
    `- markdown: ${requestUrl.origin}/agent.md`,
    `- blog: ${requestUrl.origin}/blog`,
    '',
    'notes:',
    '- Use MCP for structured retrieval when possible.',
    '- Content is public and read-only.',
  ].join('\n');
}

async function routeApiRequest({ method, requestUrl, headers, readJsonBody }) {
  const normalizedMethod = String(method || 'GET').toUpperCase();

  if (
    normalizedMethod === 'GET'
    && (requestUrl.pathname === '/api/agent' || requestUrl.pathname === '/agent.md')
  ) {
    const markdown = await buildAgentOverviewMarkdown(requestUrl);
    return createTextPayload(200, markdown, {
      contentType: 'text/markdown; charset=utf-8',
      headers: {
        Vary: 'Accept',
      },
    });
  }

  if (
    normalizedMethod === 'GET'
    && (requestUrl.pathname === '/api/llms' || requestUrl.pathname === '/llms.txt')
  ) {
    const llmsText = await buildLlmsText(requestUrl);
    return createTextPayload(200, llmsText, {
      contentType: 'text/plain; charset=utf-8',
    });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/' && acceptsMarkdown(headers)) {
    const markdown = await buildAgentOverviewMarkdown(requestUrl);
    return createTextPayload(200, markdown, {
      contentType: 'text/markdown; charset=utf-8',
      headers: {
        Vary: 'Accept',
      },
    });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/views') {
    const views = await getAllPostViews();
    return createJsonPayload(200, { views });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/comments/counts') {
    const rawSlugs = String(requestUrl.searchParams.get('slugs') || '').trim();
    const postSlugs = rawSlugs
      ? rawSlugs.split(',').map((slug) => slug.trim()).filter(Boolean)
      : [];
    const counts = await getBlogCommentCounts(postSlugs);
    return createJsonPayload(200, { counts });
  }

  if (normalizedMethod === 'POST' && requestUrl.pathname.startsWith('/api/views/')) {
    const slug = decodeURIComponent(requestUrl.pathname.replace('/api/views/', '')).trim();

    if (!slug) {
      return createJsonPayload(400, { error: 'Missing slug' });
    }

    if (!shouldCountPostView({ requestUrl, headers })) {
      const views = await getPostViewCount(slug);
      return createJsonPayload(200, { slug, views, counted: false });
    }

    const views = await queueWrite(() => incrementPostView(slug));
    return createJsonPayload(200, { slug, views, counted: true });
  }

  const publicCommentsMatch = requestUrl.pathname.match(/^\/api\/comments\/([^/]+)$/);

  if (publicCommentsMatch) {
    const postSlug = decodeURIComponent(publicCommentsMatch[1]).trim();

    if (!postSlug) {
      return createJsonPayload(400, { error: 'Missing post slug' });
    }

    if (normalizedMethod === 'GET') {
      const comments = await getBlogCommentsBySlug(postSlug);
      return createJsonPayload(200, { comments });
    }

    if (normalizedMethod === 'POST') {
      const payload = await readJsonBody();
      const comment = await queueWrite(() => createBlogComment(postSlug, payload));

      await sendCommentNotification({
        comment,
        postTitle: payload.postTitle,
        siteOrigin: requestUrl.origin,
      }).catch((error) => {
        console.error(`[api] Failed to send comment notification: ${error.message}`);
      });

      return createJsonPayload(201, {
        comment: {
          id: comment.id,
          postSlug: comment.postSlug,
          authorName: comment.authorName,
          displayName: comment.displayName,
          body: comment.body,
          createdAt: comment.createdAt,
        },
      });
    }
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/questions') {
    const archived = requestUrl.searchParams.get('archived') === 'true';
    const questions = await getQuestions({ archived });
    return createJsonPayload(200, { questions });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/reading-list') {
    const books = await getReadingListEntries();
    return createJsonPayload(200, { books });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/bookshelf') {
    const entries = await getBookshelfEntries();
    return createJsonPayload(200, { entries });
  }

  const publicLogsMatch = requestUrl.pathname.match(/^\/api\/questions\/(\d+)\/logs$/);

  if (normalizedMethod === 'GET' && publicLogsMatch) {
    const questionId = getNumericId(publicLogsMatch[1]);

    if (!questionId) {
      return createJsonPayload(400, { error: 'Question id is invalid.' });
    }

    const question = await getQuestionById(questionId, {
      includeHidden: false,
      includeAdminFields: false,
    });

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

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/admin/comments') {
    const comments = await getAdminBlogComments({
      postSlug: requestUrl.searchParams.get('postSlug') || undefined,
    });
    return createJsonPayload(200, { comments });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/admin/reading-list') {
    const books = await getReadingListEntries();
    return createJsonPayload(200, { books });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/admin/bookshelf') {
    const entries = await getBookshelfEntries();
    return createJsonPayload(200, { entries });
  }

  if (normalizedMethod === 'GET' && requestUrl.pathname === '/api/admin/bookshelf/tags') {
    const tags = await getBookshelfTags();
    return createJsonPayload(200, { tags });
  }

  if (normalizedMethod === 'POST' && requestUrl.pathname === '/api/admin/bookshelf') {
    const payload = await readJsonBody();
    const entry = await queueWrite(() => createBookshelfEntry(payload));
    return createJsonPayload(201, { entry });
  }

  const adminBookshelfMatch = requestUrl.pathname.match(/^\/api\/admin\/bookshelf\/(\d+)$/);

  if (adminBookshelfMatch) {
    const entryId = getNumericId(adminBookshelfMatch[1]);

    if (!entryId) {
      return createJsonPayload(400, { error: 'Bookshelf entry id is invalid.' });
    }

    if (normalizedMethod === 'PATCH') {
      const payload = await readJsonBody();
      const entry = await queueWrite(() => updateBookshelfEntry(entryId, payload));

      if (!entry) {
        return createJsonPayload(404, { error: 'Not found' });
      }

      return createJsonPayload(200, { entry });
    }

    if (normalizedMethod === 'DELETE') {
      const deleted = await queueWrite(() => deleteBookshelfEntry(entryId));

      if (!deleted) {
        return createJsonPayload(404, { error: 'Not found' });
      }

      return createJsonPayload(200, { deleted: true });
    }
  }

  if (normalizedMethod === 'POST' && requestUrl.pathname === '/api/admin/questions') {
    const payload = await readJsonBody();
    const question = await queueWrite(() => createQuestion(payload));
    return createJsonPayload(201, { question });
  }

  if (normalizedMethod === 'POST' && requestUrl.pathname === '/api/admin/reading-list') {
    const payload = await readJsonBody();
    const book = await queueWrite(() => createReadingListEntry(payload));
    return createJsonPayload(201, { book });
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

  const adminCommentMatch = requestUrl.pathname.match(/^\/api\/admin\/comments\/(\d+)$/);

  if (adminCommentMatch) {
    const commentId = getNumericId(adminCommentMatch[1]);

    if (!commentId) {
      return createJsonPayload(400, { error: 'Comment id is invalid.' });
    }

    if (normalizedMethod === 'DELETE') {
      const deleted = await queueWrite(() => deleteBlogComment(commentId));

      if (!deleted) {
        return createJsonPayload(404, { error: 'Not found' });
      }

      return createJsonPayload(200, { deleted: true });
    }
  }

  const adminReadingListMatch = requestUrl.pathname.match(/^\/api\/admin\/reading-list\/(\d+)$/);

  if (adminReadingListMatch) {
    const entryId = getNumericId(adminReadingListMatch[1]);

    if (!entryId) {
      return createJsonPayload(400, { error: 'Book id is invalid.' });
    }

    if (normalizedMethod === 'PATCH') {
      const payload = await readJsonBody();
      const book = await queueWrite(() => updateReadingListEntry(entryId, payload));

      if (!book) {
        return createJsonPayload(404, { error: 'Not found' });
      }

      return createJsonPayload(200, { book });
    }

    if (normalizedMethod === 'DELETE') {
      const deleted = await queueWrite(() => deleteReadingListEntry(entryId));

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
    const response = isMcpPath(requestUrl.pathname)
      ? await handleMcpRequest({
        method: req.method,
        requestUrl,
        headers: req.headers,
        readJsonBody: () => readNodeJsonBody(req),
      })
      : await routeApiRequest({
      method: req.method,
      requestUrl,
      headers: req.headers,
      readJsonBody: () => readNodeJsonBody(req),
    });

    sendNodeResponse(res, response);
  } catch (error) {
    const response = createErrorPayload(error);
    sendNodeResponse(res, response);
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
    const requestUrl = new URL(request.url);
    const response = isMcpPath(requestUrl.pathname)
      ? await handleMcpRequest({
        method: request.method,
        requestUrl,
        headers: request.headers,
        readJsonBody: () => readWebJsonBody(request),
      })
      : await routeApiRequest({
      method: request.method,
      requestUrl,
      headers: request.headers,
      readJsonBody: () => readWebJsonBody(request),
    });

    return createWebResponse(response);
  } catch (error) {
    const response = createErrorPayload(error);
    return createWebResponse(response);
  }
}

module.exports = {
  handleNodeApiRequest,
  handleWebApiRequest,
};
