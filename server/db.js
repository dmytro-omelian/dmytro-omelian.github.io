require('./loadEnv');

const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const seedViews = require('../src/data/postViewsSeed.json');
const { legacyReadingListEntries } = require('./reading-list-seed');

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

async function withTransaction(task) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await task(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback failures and surface the original error.
    }

    throw error;
  } finally {
    client.release();
  }
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

function sanitizeOptionalSlug(value, fieldName = 'slug') {
  const normalizedValue = sanitizeOptionalText(value, { maxLength: 160 });

  if (!normalizedValue) {
    return null;
  }

  const normalizedSlug = slugify(normalizedValue);

  if (!normalizedSlug) {
    throw createHttpError(400, `${fieldName} is invalid.`);
  }

  return normalizedSlug;
}

function sanitizeRequiredReadingListSlug(value, fieldName = 'slug') {
  const normalizedValue = sanitizeRequiredTextWithLimit(value, fieldName, 160);
  const normalizedSlug = slugifyReadingListValue(normalizedValue);

  if (!normalizedSlug) {
    throw createHttpError(400, `${fieldName} must include letters or numbers.`);
  }

  return normalizedSlug;
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

function normalizeRequiredInteger(value, fieldName, { min, max } = {}) {
  if (value === undefined || value === null || value === '') {
    throw createHttpError(400, `${fieldName} is required.`);
  }

  const numericValue = Number(value);

  if (!Number.isInteger(numericValue)) {
    throw createHttpError(400, `${fieldName} must be an integer.`);
  }

  if (min !== undefined && numericValue < min) {
    throw createHttpError(400, `${fieldName} must be at least ${min}.`);
  }

  if (max !== undefined && numericValue > max) {
    throw createHttpError(400, `${fieldName} must be at most ${max}.`);
  }

  return numericValue;
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

function slugifyReadingListValue(input) {
  return String(input ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
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

function mapReadingListRow(row) {
  return {
    id: Number(row.id),
    year: Number(row.year),
    title: row.title,
    author: row.author,
    slug: normalizeOptionalStoredText(row.slug),
    summaryMarkdown: normalizeOptionalStoredText(row.summary_markdown),
    relatedPostSlug: normalizeOptionalStoredText(row.related_post_slug),
    relatedPostLabel: normalizeOptionalStoredText(row.related_post_label),
    sortOrder: Number(row.sort_order),
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

async function seedReadingListEntries() {
  const existingCountResult = await query('SELECT COUNT(*)::int AS count FROM reading_list_entries');
  const existingCount = Number(existingCountResult.rows[0]?.count || 0);

  if (existingCount > 0 || legacyReadingListEntries.length === 0) {
    return;
  }

  const values = [];
  const params = [];

  legacyReadingListEntries.forEach((entry, index) => {
    const baseIndex = index * 8;
    values.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`,
    );
    params.push(
      entry.year,
      entry.title,
      entry.author,
      entry.slug,
      entry.summaryMarkdown,
      entry.relatedPostSlug,
      entry.relatedPostLabel,
      entry.sortOrder,
    );
  });

  await query(`
    INSERT INTO reading_list_entries (
      year,
      title,
      author,
      slug,
      summary_markdown,
      related_post_slug,
      related_post_label,
      sort_order
    )
    VALUES ${values.join(', ')}
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
    await seedReadingListEntries();
    await backfillReadingListSlugs();
    await normalizeReadingListSortOrders();
    await ensureReadingListSortOrderUniqueIndex();
    await enforceReadingListSlugConstraint();
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

async function getReadingListEntryById(entryId) {
  await ensureDatabase();

  const result = await query(`
    SELECT
      id,
      year,
      title,
      author,
      slug,
      summary_markdown,
      related_post_slug,
      related_post_label,
      sort_order
    FROM reading_list_entries
    WHERE id = $1
    LIMIT 1
  `, [entryId]);

  if (result.rowCount === 0) {
    return null;
  }

  return mapReadingListRow(result.rows[0]);
}

async function getReadingListEntryByIdWithDb(entryId, db) {
  const result = await db.query(`
    SELECT
      id,
      year,
      title,
      author,
      slug,
      summary_markdown,
      related_post_slug,
      related_post_label,
      sort_order
    FROM reading_list_entries
    WHERE id = $1
    LIMIT 1
  `, [entryId]);

  if (result.rowCount === 0) {
    return null;
  }

  return mapReadingListRow(result.rows[0]);
}

async function getReadingListEntries() {
  await ensureDatabase();

  const result = await query(`
    SELECT
      id,
      year,
      title,
      author,
      slug,
      summary_markdown,
      related_post_slug,
      related_post_label,
      sort_order
    FROM reading_list_entries
    ORDER BY year DESC, sort_order DESC, updated_at DESC, id ASC
  `);

  return result.rows.map(mapReadingListRow);
}

async function getNextReadingListSortOrder(year, db) {
  const result = await db.query(`
    SELECT COALESCE(MAX(sort_order), -1)::int AS max_sort_order
    FROM reading_list_entries
    WHERE year = $1
  `, [year]);

  return Number(result.rows[0]?.max_sort_order ?? -1) + 1;
}

async function buildUniqueReadingListSlug(title, excludeId, db = getPool()) {
  const baseSlug = slugifyReadingListValue(title) || 'book';
  let candidateSlug = baseSlug;
  let suffix = 2;

  while (await readingListSlugExists(candidateSlug, excludeId, db)) {
    candidateSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidateSlug;
}

async function readingListSlugExists(slug, excludeId, db = getPool()) {
  const params = [slug];
  let queryText = 'SELECT 1 FROM reading_list_entries WHERE slug = $1';

  if (excludeId) {
    params.push(excludeId);
    queryText += ' AND id <> $2';
  }

  const result = await db.query(queryText, params);
  return result.rowCount > 0;
}

async function assertReadingListSlugIsAvailable(slug, excludeId, db = getPool()) {
  if (!slug) {
    return;
  }

  if (await readingListSlugExists(slug, excludeId, db)) {
    throw createHttpError(400, 'slug is already in use.');
  }
}

async function getReadingListSortOffset(year, db) {
  const result = await db.query(`
    SELECT COALESCE(MAX(ABS(sort_order)), 0)::int AS max_abs_sort_order
    FROM reading_list_entries
    WHERE year = $1
  `, [year]);

  return Number(result.rows[0]?.max_abs_sort_order || 0) + 1000;
}

async function getReadingListTemporarySortOrder(year, entryId, db) {
  const offset = await getReadingListSortOffset(year, db);
  return -(offset + Number(entryId || 0));
}

async function listReadingListEntryIds(queryText, params, db) {
  const result = await db.query(queryText, params);
  return result.rows.map((row) => Number(row.id));
}

async function shiftReadingListEntryIds(year, entryIds, delta, db) {
  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    return;
  }

  const offset = await getReadingListSortOffset(year, db);

  await db.query(`
    UPDATE reading_list_entries
    SET sort_order = sort_order + $1, updated_at = NOW()
    WHERE id = ANY($2::bigint[])
  `, [offset, entryIds]);

  await db.query(`
    UPDATE reading_list_entries
    SET sort_order = sort_order - $1 + $2, updated_at = NOW()
    WHERE id = ANY($3::bigint[])
  `, [offset, delta, entryIds]);
}

async function backfillReadingListSlugs() {
  await withTransaction(async (db) => {
    const result = await db.query(`
      SELECT id, title
      FROM reading_list_entries
      WHERE slug IS NULL OR BTRIM(slug) = ''
      ORDER BY id ASC
    `);

    for (const row of result.rows) {
      const entryId = Number(row.id);
      const slug = await buildUniqueReadingListSlug(row.title, entryId, db);

      await db.query(`
        UPDATE reading_list_entries
        SET slug = $1, updated_at = NOW()
        WHERE id = $2
      `, [slug, entryId]);
    }
  });
}

async function normalizeReadingListSortOrders() {
  await withTransaction(async (db) => {
    await db.query(`
      WITH ordered AS (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY year ORDER BY sort_order ASC, id ASC) - 1 AS new_sort_order
        FROM reading_list_entries
      )
      UPDATE reading_list_entries
      SET sort_order = ordered.new_sort_order,
          updated_at = NOW()
      FROM ordered
      WHERE reading_list_entries.id = ordered.id
        AND reading_list_entries.sort_order <> ordered.new_sort_order
    `);
  });
}

async function ensureReadingListSortOrderUniqueIndex() {
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS reading_list_entries_year_sort_unique_idx
      ON reading_list_entries (year, sort_order)
  `);
}

async function enforceReadingListSlugConstraint() {
  await query(`
    ALTER TABLE reading_list_entries
    ALTER COLUMN slug SET NOT NULL
  `);
}

async function createReadingListEntry(payload) {
  await ensureDatabase();

  const year = normalizeRequiredInteger(payload.year, 'year', { min: 1 });
  const title = sanitizeRequiredTextWithLimit(payload.title, 'title', 200);
  const author = sanitizeRequiredTextWithLimit(payload.author, 'author', 200);
  const hasSortOrder = payload.sortOrder !== undefined && payload.sortOrder !== null && payload.sortOrder !== '';
  const sortOrder = hasSortOrder ? normalizeRequiredInteger(payload.sortOrder, 'sortOrder') : null;
  const slug = sanitizeRequiredReadingListSlug(payload.slug, 'slug');
  const summaryMarkdown = sanitizeOptionalText(payload.summaryMarkdown, { maxLength: 20000 });
  const relatedPostSlug = sanitizeOptionalSlug(payload.relatedPostSlug, 'relatedPostSlug');
  const relatedPostLabel = sanitizeOptionalText(payload.relatedPostLabel, { maxLength: 120 });

  const createdEntryId = await withTransaction(async (db) => {
    await assertReadingListSlugIsAvailable(slug, undefined, db);

    const nextSortOrder = hasSortOrder ? sortOrder : await getNextReadingListSortOrder(year, db);

    const shiftedEntryIds = await listReadingListEntryIds(`
      SELECT id
      FROM reading_list_entries
      WHERE year = $1 AND sort_order >= $2
      ORDER BY sort_order ASC, id ASC
    `, [year, nextSortOrder], db);

    await shiftReadingListEntryIds(year, shiftedEntryIds, 1, db);

    const result = await db.query(`
      INSERT INTO reading_list_entries (
        year,
        title,
        author,
        slug,
        summary_markdown,
        related_post_slug,
        related_post_label,
        sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [year, title, author, slug, summaryMarkdown, relatedPostSlug, relatedPostLabel, nextSortOrder]);

    return Number(result.rows[0].id);
  });

  return getReadingListEntryById(createdEntryId);
}

async function updateReadingListEntry(entryId, payload) {
  await ensureDatabase();

  const updatedEntryId = await withTransaction(async (db) => {
    const existingEntry = await getReadingListEntryByIdWithDb(entryId, db);

    if (!existingEntry) {
      return null;
    }

    const nextYear = payload.year !== undefined
      ? normalizeRequiredInteger(payload.year, 'year', { min: 1 })
      : existingEntry.year;
    const nextTitle = payload.title !== undefined
      ? sanitizeRequiredTextWithLimit(payload.title, 'title', 200)
      : existingEntry.title;
    const nextAuthor = payload.author !== undefined
      ? sanitizeRequiredTextWithLimit(payload.author, 'author', 200)
      : existingEntry.author;
    const nextSortOrder = payload.sortOrder !== undefined
      ? normalizeRequiredInteger(payload.sortOrder, 'sortOrder')
      : existingEntry.sortOrder;
    const nextSlug = sanitizeRequiredReadingListSlug(
      payload.slug !== undefined ? payload.slug : existingEntry.slug,
      'slug',
    );
    const nextSummaryMarkdown = payload.summaryMarkdown !== undefined
      ? sanitizeOptionalText(payload.summaryMarkdown, { maxLength: 20000 })
      : existingEntry.summaryMarkdown;
    const nextRelatedPostSlug = payload.relatedPostSlug !== undefined
      ? sanitizeOptionalSlug(payload.relatedPostSlug, 'relatedPostSlug')
      : existingEntry.relatedPostSlug;
    const nextRelatedPostLabel = payload.relatedPostLabel !== undefined
      ? sanitizeOptionalText(payload.relatedPostLabel, { maxLength: 120 })
      : existingEntry.relatedPostLabel;

    await assertReadingListSlugIsAvailable(nextSlug, entryId, db);

    if (nextYear !== existingEntry.year || nextSortOrder !== existingEntry.sortOrder) {
      const temporarySortOrder = await getReadingListTemporarySortOrder(existingEntry.year, entryId, db);

      await db.query(`
        UPDATE reading_list_entries
        SET sort_order = $1, updated_at = NOW()
        WHERE id = $2
      `, [temporarySortOrder, entryId]);

      if (nextYear === existingEntry.year) {
        if (nextSortOrder < existingEntry.sortOrder) {
          const shiftedEntryIds = await listReadingListEntryIds(`
            SELECT id
            FROM reading_list_entries
            WHERE year = $1
              AND sort_order >= $2
              AND sort_order < $3
            ORDER BY sort_order ASC, id ASC
          `, [nextYear, nextSortOrder, existingEntry.sortOrder], db);

          await shiftReadingListEntryIds(nextYear, shiftedEntryIds, 1, db);
        } else if (nextSortOrder > existingEntry.sortOrder) {
          const shiftedEntryIds = await listReadingListEntryIds(`
            SELECT id
            FROM reading_list_entries
            WHERE year = $1
              AND sort_order <= $2
              AND sort_order > $3
            ORDER BY sort_order ASC, id ASC
          `, [nextYear, nextSortOrder, existingEntry.sortOrder], db);

          await shiftReadingListEntryIds(nextYear, shiftedEntryIds, -1, db);
        }
      } else {
        const oldYearShiftedEntryIds = await listReadingListEntryIds(`
          SELECT id
          FROM reading_list_entries
          WHERE year = $1
            AND sort_order > $2
          ORDER BY sort_order ASC, id ASC
        `, [existingEntry.year, existingEntry.sortOrder], db);

        const newYearShiftedEntryIds = await listReadingListEntryIds(`
          SELECT id
          FROM reading_list_entries
          WHERE year = $1
            AND sort_order >= $2
          ORDER BY sort_order ASC, id ASC
        `, [nextYear, nextSortOrder], db);

        await shiftReadingListEntryIds(existingEntry.year, oldYearShiftedEntryIds, -1, db);
        await shiftReadingListEntryIds(nextYear, newYearShiftedEntryIds, 1, db);
      }
    }

    await db.query(`
      UPDATE reading_list_entries
      SET
        year = $1,
        title = $2,
        author = $3,
        slug = $4,
        summary_markdown = $5,
        related_post_slug = $6,
        related_post_label = $7,
        sort_order = $8,
        updated_at = NOW()
      WHERE id = $9
    `, [
      nextYear,
      nextTitle,
      nextAuthor,
      nextSlug,
      nextSummaryMarkdown,
      nextRelatedPostSlug,
      nextRelatedPostLabel,
      nextSortOrder,
      entryId,
    ]);

    return entryId;
  });

  if (!updatedEntryId) {
    return null;
  }

  return getReadingListEntryById(updatedEntryId);
}

async function deleteReadingListEntry(entryId) {
  await ensureDatabase();

  const result = await query(`
    DELETE FROM reading_list_entries
    WHERE id = $1
    RETURNING id
  `, [entryId]);

  return result.rowCount > 0;
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

async function getQuestionBySlug(
  slug,
  { includeHidden = false, includeAdminFields = false } = {},
) {
  await ensureDatabase();

  const normalizedSlug = sanitizeSlug(slug, 'slug');
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
    WHERE q.slug = $1
    ${includeHidden ? '' : 'AND q.is_hidden = FALSE'}
    GROUP BY q.id
  `;

  const result = await query(queryText, [normalizedSlug]);

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
  createReadingListEntry,
  deleteBlogComment,
  deleteQuestionLog,
  deleteReadingListEntry,
  ensureDatabase,
  getAdminBlogComments,
  getAdminQuestions,
  getBlogCommentCounts,
  getBlogCommentsBySlug,
  getAllPostViews,
  getPostViewCount,
  getQuestionById,
  getQuestionBySlug,
  getQuestionLogs,
  getQuestions,
  getReadingListEntries,
  incrementPostView,
  updateQuestion,
  updateQuestionLog,
  updateReadingListEntry,
};
