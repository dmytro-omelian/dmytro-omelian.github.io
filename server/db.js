require('./loadEnv');

const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const seedViews = require('../src/data/postViewsSeed.json');

const SCHEMA_FILE_PATH = path.join(process.cwd(), 'server', 'schema.sql');

let pool = null;
let initializationPromise = null;

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

function mapQuestionRow(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    isArchived: Boolean(row.is_archived),
    sortOrder: Number(row.sort_order),
    logCount: Number(row.log_count || 0),
    latestLogDate: formatDateValue(row.latest_log_date),
  };
}

function mapLogRow(row) {
  return {
    id: Number(row.id),
    questionId: Number(row.question_id),
    noteMarkdown: row.note_markdown,
    loggedAt: formatDateValue(row.logged_at),
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

async function getQuestionById(questionId) {
  await ensureDatabase();

  const result = await query(`
    SELECT
      q.id,
      q.slug,
      q.title,
      q.is_archived,
      q.sort_order,
      COUNT(l.id)::int AS log_count,
      MAX(l.logged_at) AS latest_log_date
    FROM open_questions q
    LEFT JOIN open_question_logs l ON l.question_id = q.id
    WHERE q.id = $1
    GROUP BY q.id
  `, [questionId]);

  if (result.rowCount === 0) {
    return null;
  }

  return mapQuestionRow(result.rows[0]);
}

async function getQuestions({ archived = false } = {}) {
  await ensureDatabase();

  const result = await query(`
    SELECT
      q.id,
      q.slug,
      q.title,
      q.is_archived,
      q.sort_order,
      COUNT(l.id)::int AS log_count,
      MAX(l.logged_at) AS latest_log_date
    FROM open_questions q
    LEFT JOIN open_question_logs l ON l.question_id = q.id
    WHERE q.is_archived = $1
    GROUP BY q.id
    ORDER BY q.sort_order ASC, q.updated_at DESC, q.id ASC
  `, [Boolean(archived)]);

  return result.rows.map(mapQuestionRow);
}

async function getAdminQuestions() {
  await ensureDatabase();

  const result = await query(`
    SELECT
      q.id,
      q.slug,
      q.title,
      q.is_archived,
      q.sort_order,
      COUNT(l.id)::int AS log_count,
      MAX(l.logged_at) AS latest_log_date
    FROM open_questions q
    LEFT JOIN open_question_logs l ON l.question_id = q.id
    GROUP BY q.id
    ORDER BY q.is_archived ASC, q.sort_order ASC, q.updated_at DESC, q.id ASC
  `);

  return result.rows.map(mapQuestionRow);
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
  const slug = await buildUniqueQuestionSlug(title);

  const result = await query(`
    INSERT INTO open_questions (slug, title, sort_order, is_archived)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [slug, title, sortOrder, isArchived]);

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
  const nextSlug = nextTitle !== existingQuestion.title
    ? await buildUniqueQuestionSlug(nextTitle, questionId)
    : existingQuestion.slug;

  await query(`
    UPDATE open_questions
    SET slug = $1, title = $2, sort_order = $3, is_archived = $4, updated_at = NOW()
    WHERE id = $5
  `, [nextSlug, nextTitle, nextSortOrder, nextArchived, questionId]);

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
};
