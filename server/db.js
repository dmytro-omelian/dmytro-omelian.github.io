require('./loadEnv');

const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const seedViews = require('../src/data/postViewsSeed.json');

const SCHEMA_FILE_PATH = path.join(process.cwd(), 'server', 'schema.sql');

let pool = null;
let initializationPromise = null;
const QUESTION_PRIORITIES = ['none', 'low', 'medium', 'high'];
const QUESTION_PRIORITY_SORT_SQL = `
  CASE q.priority
    WHEN 'high' THEN 0
    WHEN 'medium' THEN 1
    WHEN 'low' THEN 2
    ELSE 3
  END
`;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

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

function getDatabaseConfig() {
  const rawDatabaseUrl = (process.env.DATABASE_URL || '').trim();

  if (!rawDatabaseUrl) {
    throw createHttpError(500, 'DATABASE_URL is not configured. Add it to .env.local before starting the API server.');
  }

  const parsedUrl = new URL(rawDatabaseUrl);
  const sslMode = parsedUrl.searchParams.get('sslmode');

  parsedUrl.searchParams.delete('channel_binding');
  parsedUrl.searchParams.delete('sslmode');

  return {
    connectionString: parsedUrl.toString(),
    ssl: sslMode === 'require' ? { rejectUnauthorized: false } : undefined,
  };
}

function getPool() {
  if (!pool) {
    pool = new Pool(getDatabaseConfig());
  }

  return pool;
}

async function query(text, params = []) {
  return getPool().query(text, params);
}

async function closePool() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}

function sanitizeRequiredText(value, fieldName) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw createHttpError(400, `${fieldName} is required.`);
  }

  return normalizedValue;
}

function sanitizeOptionalText(value, { maxLength } = {}) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    return null;
  }

  if (maxLength && normalizedValue.length > maxLength) {
    throw createHttpError(400, `Value must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
}

function normalizeOptionalStoredText(value) {
  const normalizedValue = String(value ?? '').trim();
  return normalizedValue || null;
}

function sanitizeRequiredTextWithLimit(value, fieldName, maxLength) {
  const normalizedValue = sanitizeRequiredText(value, fieldName);

  if (maxLength && normalizedValue.length > maxLength) {
    throw createHttpError(400, `${fieldName} must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
}

function sanitizeSlug(value, fieldName = 'slug') {
  return sanitizeRequiredTextWithLimit(value, fieldName, 160);
}

function sanitizeOptionalEmail(value) {
  const normalizedValue = sanitizeOptionalText(value, { maxLength: 254 });

  if (!normalizedValue) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    throw createHttpError(400, 'authorEmail must be a valid email address.');
  }

  return normalizedValue;
}

function normalizeOptionalBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  return fallback;
}

function normalizeQuestionPriority(value, fallback = 'none') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (!QUESTION_PRIORITIES.includes(normalizedValue)) {
    throw createHttpError(400, `priority must be one of ${QUESTION_PRIORITIES.join(', ')}.`);
  }

  return normalizedValue;
}

function normalizeSortOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw createHttpError(400, 'sortOrder must be a number.');
  }

  return Math.trunc(numericValue);
}

function normalizeDateInput(value) {
  const normalizedValue = String(value ?? '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw createHttpError(400, 'loggedAt must use YYYY-MM-DD format.');
  }

  return normalizedValue;
}

function formatDateValue(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return null;
  }

  const leadingIsoDateMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);

  if (leadingIsoDateMatch) {
    return leadingIsoDateMatch[1];
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function slugify(input) {
  const normalizedValue = String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return normalizedValue || `question-${Date.now()}`;
}

async function questionSlugExists(slug, excludeId) {
  const params = [slug];
  let queryText = 'SELECT 1 FROM open_questions WHERE slug = $1';

  if (excludeId) {
    params.push(excludeId);
    queryText += ' AND id <> $2';
  }

  const result = await query(queryText, params);
  return result.rowCount > 0;
}

async function buildUniqueQuestionSlug(title, excludeId) {
  const baseSlug = slugify(title);
  let candidateSlug = baseSlug;
  let suffix = 2;

  while (await questionSlugExists(candidateSlug, excludeId)) {
    candidateSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidateSlug;
}

function mapQuestionRow(row, { includeAdminFields = false } = {}) {
  const question = {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    isArchived: Boolean(row.is_archived),
    sortOrder: Number(row.sort_order),
    logCount: Number(row.log_count || 0),
    latestLogDate: formatDateValue(row.latest_log_date),
  };

  if (includeAdminFields) {
    question.isHidden = Boolean(row.is_hidden);
    question.priority = normalizeQuestionPriority(row.priority, 'none');
  }

  return question;
}

function mapLogRow(row) {
  return {
    id: Number(row.id),
    questionId: Number(row.question_id),
    noteMarkdown: row.note_markdown,
    loggedAt: formatDateValue(row.logged_at),
  };
}

function mapBlogCommentRow(row, { includeAdminFields = false } = {}) {
  const authorName = normalizeOptionalStoredText(row.author_name);

  return {
    id: Number(row.id),
    postSlug: row.post_slug,
    authorName,
    displayName: authorName || 'Anonymous',
    body: row.body,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    ...(includeAdminFields ? { authorEmail: normalizeOptionalStoredText(row.author_email) } : {}),
  };
}

async function seedDefaultPostViews() {
  const normalizedSeedViews = normalizeViews(seedViews);
  const entries = Object.entries(normalizedSeedViews);

  if (entries.length === 0) {
    return;
  }

  const values = [];
  const params = [];

  entries.forEach(([slug, views], index) => {
    const baseIndex = index * 2;
    values.push(`($${baseIndex + 1}, $${baseIndex + 2})`);
    params.push(slug, views);
  });

  await query(`
    INSERT INTO blog_post_views (slug, views)
    VALUES ${values.join(', ')}
    ON CONFLICT (slug) DO NOTHING
  `, params);
}

async function ensureDatabase() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const schemaSql = await fs.readFile(SCHEMA_FILE_PATH, 'utf8');
    await query(schemaSql);
    await seedDefaultPostViews();
  })().catch((error) => {
    initializationPromise = null;
    throw error;
  });

  return initializationPromise;
}

async function getAllPostViews() {
  await ensureDatabase();

  const result = await query('SELECT slug, views FROM blog_post_views ORDER BY slug ASC');
  return normalizeViews(Object.fromEntries(result.rows.map((row) => [row.slug, row.views])));
}

async function getPostViewCount(slug) {
  await ensureDatabase();

  const normalizedSlug = sanitizeRequiredText(slug, 'slug');
  const result = await query(`
    SELECT views
    FROM blog_post_views
    WHERE slug = $1
    LIMIT 1
  `, [normalizedSlug]);

  return Number(result.rows[0]?.views || 0);
}

async function getBlogCommentCounts(postSlugs = []) {
  await ensureDatabase();

  const normalizedPostSlugs = Array.isArray(postSlugs)
    ? [...new Set(postSlugs.map((postSlug) => sanitizeSlug(postSlug, 'postSlug')))]
    : [];

  const result = normalizedPostSlugs.length > 0
    ? await query(`
      SELECT post_slug, COUNT(*)::int AS count
      FROM blog_post_comments
      WHERE post_slug = ANY($1::text[])
      GROUP BY post_slug
      ORDER BY post_slug ASC
    `, [normalizedPostSlugs])
    : await query(`
      SELECT post_slug, COUNT(*)::int AS count
      FROM blog_post_comments
      GROUP BY post_slug
      ORDER BY post_slug ASC
    `);

  const counts = Object.fromEntries(
    result.rows.map((row) => [row.post_slug, Number(row.count || 0)]),
  );

  normalizedPostSlugs.forEach((postSlug) => {
    if (!Object.prototype.hasOwnProperty.call(counts, postSlug)) {
      counts[postSlug] = 0;
    }
  });

  return counts;
}

async function getBlogCommentsBySlug(postSlug) {
  await ensureDatabase();

  const normalizedPostSlug = sanitizeSlug(postSlug, 'postSlug');
  const result = await query(`
    SELECT id, post_slug, author_name, author_email, body, created_at
    FROM blog_post_comments
    WHERE post_slug = $1
    ORDER BY created_at DESC, id DESC
  `, [normalizedPostSlug]);

  return result.rows.map((row) => mapBlogCommentRow(row));
}

async function createBlogComment(postSlug, payload) {
  await ensureDatabase();

  const normalizedPostSlug = sanitizeSlug(postSlug, 'postSlug');
  const authorName = sanitizeOptionalText(payload.authorName, { maxLength: 80 });
  const authorEmail = sanitizeOptionalEmail(payload.authorEmail);
  const body = sanitizeRequiredTextWithLimit(payload.body, 'body', 5000);

  const result = await query(`
    INSERT INTO blog_post_comments (post_slug, author_name, author_email, body)
    VALUES ($1, $2, $3, $4)
    RETURNING id, post_slug, author_name, author_email, body, created_at
  `, [normalizedPostSlug, authorName, authorEmail, body]);

  return mapBlogCommentRow(result.rows[0], { includeAdminFields: true });
}

async function getAdminBlogComments({ postSlug } = {}) {
  await ensureDatabase();

  const hasPostSlugFilter = postSlug !== undefined && postSlug !== null && String(postSlug).trim() !== '';
  const normalizedPostSlug = hasPostSlugFilter ? sanitizeSlug(postSlug, 'postSlug') : null;
  const result = await query(`
    SELECT id, post_slug, author_name, author_email, body, created_at
    FROM blog_post_comments
    ${hasPostSlugFilter ? 'WHERE post_slug = $1' : ''}
    ORDER BY created_at DESC, id DESC
  `, hasPostSlugFilter ? [normalizedPostSlug] : []);

  return result.rows.map((row) => mapBlogCommentRow(row, { includeAdminFields: true }));
}

async function deleteBlogComment(commentId) {
  await ensureDatabase();

  const result = await query(`
    DELETE FROM blog_post_comments
    WHERE id = $1
    RETURNING id
  `, [commentId]);

  return result.rowCount > 0;
}

async function incrementPostView(slug) {
  await ensureDatabase();

  const normalizedSlug = sanitizeRequiredText(slug, 'slug');
  const result = await query(`
    INSERT INTO blog_post_views (slug, views)
    VALUES ($1, 1)
    ON CONFLICT (slug)
    DO UPDATE SET views = blog_post_views.views + 1, updated_at = NOW()
    RETURNING views
  `, [normalizedSlug]);

  return Number(result.rows[0]?.views || 0);
}

async function getQuestionById(
  questionId,
  { includeHidden = true, includeAdminFields = true } = {},
) {
  await ensureDatabase();

  const queryText = `
    SELECT
      q.id,
      q.slug,
      q.title,
      q.is_archived,
      q.is_hidden,
      q.priority,
      q.sort_order,
      COUNT(l.id)::int AS log_count,
      MAX(l.logged_at) AS latest_log_date
    FROM open_questions q
    LEFT JOIN open_question_logs l ON l.question_id = q.id
    WHERE q.id = $1
    ${includeHidden ? '' : 'AND q.is_hidden = FALSE'}
    GROUP BY q.id
  `;

  const result = await query(queryText, [questionId]);

  if (result.rowCount === 0) {
    return null;
  }

  return mapQuestionRow(result.rows[0], { includeAdminFields });
}

async function getQuestions({ archived = false } = {}) {
  await ensureDatabase();

  const result = await query(`
    SELECT
      q.id,
      q.slug,
      q.title,
      q.is_archived,
      q.is_hidden,
      q.priority,
      q.sort_order,
      COUNT(l.id)::int AS log_count,
      MAX(l.logged_at) AS latest_log_date
    FROM open_questions q
    LEFT JOIN open_question_logs l ON l.question_id = q.id
    WHERE q.is_archived = $1 AND q.is_hidden = FALSE
    GROUP BY q.id
    ORDER BY q.sort_order ASC, q.updated_at DESC, q.id ASC
  `, [Boolean(archived)]);

  return result.rows.map((row) => mapQuestionRow(row));
}

async function getAdminQuestions() {
  await ensureDatabase();

  const result = await query(`
    SELECT
      q.id,
      q.slug,
      q.title,
      q.is_archived,
      q.is_hidden,
      q.priority,
      q.sort_order,
      COUNT(l.id)::int AS log_count,
      MAX(l.logged_at) AS latest_log_date
    FROM open_questions q
    LEFT JOIN open_question_logs l ON l.question_id = q.id
    GROUP BY q.id
    ORDER BY
      q.is_archived ASC,
      q.is_hidden ASC,
      ${QUESTION_PRIORITY_SORT_SQL} ASC,
      q.sort_order ASC,
      q.updated_at DESC,
      q.id ASC
  `);

  return result.rows.map((row) => mapQuestionRow(row, { includeAdminFields: true }));
}

async function getQuestionLogs(questionId) {
  await ensureDatabase();

  const result = await query(`
    SELECT id, question_id, note_markdown, logged_at
    FROM open_question_logs
    WHERE question_id = $1
    ORDER BY logged_at DESC, id DESC
  `, [questionId]);

  return result.rows.map(mapLogRow);
}

async function createQuestion(payload) {
  await ensureDatabase();

  const title = sanitizeRequiredText(payload.title, 'title');
  const sortOrder = normalizeSortOrder(payload.sortOrder, 0);
  const isArchived = normalizeOptionalBoolean(payload.isArchived, false);
  const isHidden = normalizeOptionalBoolean(payload.isHidden, false);
  const priority = normalizeQuestionPriority(payload.priority, 'none');
  const slug = await buildUniqueQuestionSlug(title);

  const result = await query(`
    INSERT INTO open_questions (slug, title, sort_order, is_archived, is_hidden, priority)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [slug, title, sortOrder, isArchived, isHidden, priority]);

  return getQuestionById(result.rows[0].id);
}

async function updateQuestion(questionId, payload) {
  await ensureDatabase();

  const existingQuestion = await getQuestionById(questionId);

  if (!existingQuestion) {
    return null;
  }

  const nextTitle = payload.title !== undefined
    ? sanitizeRequiredText(payload.title, 'title')
    : existingQuestion.title;
  const nextSortOrder = normalizeSortOrder(payload.sortOrder, existingQuestion.sortOrder);
  const nextArchived = payload.isArchived !== undefined
    ? normalizeOptionalBoolean(payload.isArchived, existingQuestion.isArchived)
    : existingQuestion.isArchived;
  const nextHidden = payload.isHidden !== undefined
    ? normalizeOptionalBoolean(payload.isHidden, existingQuestion.isHidden)
    : existingQuestion.isHidden;
  const nextPriority = payload.priority !== undefined
    ? normalizeQuestionPriority(payload.priority, existingQuestion.priority)
    : existingQuestion.priority;
  const nextSlug = nextTitle !== existingQuestion.title
    ? await buildUniqueQuestionSlug(nextTitle, questionId)
    : existingQuestion.slug;

  await query(`
    UPDATE open_questions
    SET slug = $1, title = $2, sort_order = $3, is_archived = $4, is_hidden = $5, priority = $6, updated_at = NOW()
    WHERE id = $7
  `, [nextSlug, nextTitle, nextSortOrder, nextArchived, nextHidden, nextPriority, questionId]);

  return getQuestionById(questionId);
}

async function createQuestionLog(questionId, payload) {
  await ensureDatabase();

  const question = await getQuestionById(questionId);

  if (!question) {
    throw createHttpError(404, 'Question not found.');
  }

  const noteMarkdown = sanitizeRequiredText(payload.noteMarkdown, 'noteMarkdown');
  const loggedAt = normalizeDateInput(payload.loggedAt || new Date().toISOString().slice(0, 10));

  const result = await query(`
    INSERT INTO open_question_logs (question_id, note_markdown, logged_at)
    VALUES ($1, $2, $3)
    RETURNING id, question_id, note_markdown, logged_at
  `, [questionId, noteMarkdown, loggedAt]);

  await query('UPDATE open_questions SET updated_at = NOW() WHERE id = $1', [questionId]);
  return mapLogRow(result.rows[0]);
}

async function updateQuestionLog(logId, payload) {
  await ensureDatabase();

  const existingLogResult = await query(`
    SELECT id, question_id, note_markdown, logged_at
    FROM open_question_logs
    WHERE id = $1
  `, [logId]);

  if (existingLogResult.rowCount === 0) {
    return null;
  }

  const existingLog = existingLogResult.rows[0];
  const nextNoteMarkdown = payload.noteMarkdown !== undefined
    ? sanitizeRequiredText(payload.noteMarkdown, 'noteMarkdown')
    : existingLog.note_markdown;
  const nextLoggedAt = payload.loggedAt !== undefined
    ? normalizeDateInput(payload.loggedAt)
    : String(existingLog.logged_at).slice(0, 10);

  const result = await query(`
    UPDATE open_question_logs
    SET note_markdown = $1, logged_at = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING id, question_id, note_markdown, logged_at
  `, [nextNoteMarkdown, nextLoggedAt, logId]);

  await query('UPDATE open_questions SET updated_at = NOW() WHERE id = $1', [existingLog.question_id]);
  return mapLogRow(result.rows[0]);
}

async function deleteQuestionLog(logId) {
  await ensureDatabase();

  const result = await query(`
    DELETE FROM open_question_logs
    WHERE id = $1
    RETURNING id, question_id
  `, [logId]);

  if (result.rowCount === 0) {
    return false;
  }

  await query('UPDATE open_questions SET updated_at = NOW() WHERE id = $1', [result.rows[0].question_id]);
  return true;
}

module.exports = {
  closePool,
  createBlogComment,
  createHttpError,
  createQuestion,
  createQuestionLog,
  deleteBlogComment,
  deleteQuestionLog,
  ensureDatabase,
  getAdminBlogComments,
  getAdminQuestions,
  getBlogCommentCounts,
  getBlogCommentsBySlug,
  getAllPostViews,
  getPostViewCount,
  getQuestionById,
  getQuestionLogs,
  getQuestions,
  incrementPostView,
  updateQuestion,
  updateQuestionLog,
};
