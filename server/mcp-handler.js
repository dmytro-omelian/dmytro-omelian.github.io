require('./loadEnv');

const packageJson = require('../package.json');
const {
  createReadingListEntry,
  createHttpError,
  getAllPostViews,
  getBookshelfEntries,
  getBlogCommentCounts,
  getReadingListEntries,
} = require('./db');
const {
  createExcerpt,
  getStaticSiteContent,
  renderAboutMarkdown,
  renderBlogIndexMarkdown,
  renderBlogPostMarkdown,
  renderExperienceMarkdown,
  renderNewsMarkdown,
  renderSimpleTimelineMarkdown,
} = require('./site-content');

const SERVER_NAME = 'dmytro_website';
const SERVER_TITLE = 'Dmytro Omelian Website MCP';
const SERVER_DESCRIPTION = "Public MCP server for Dmytro Omelian\u2019s profile, timeline, blog, bookshelf, and reading list. Private notes and writes require an admin API key.";
const RESOURCE_SCHEME = 'portfolio';
const DEFAULT_PROTOCOL_VERSION = '2025-03-26';
const LATEST_PROTOCOL_VERSION = '2025-11-25';
const SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, DEFAULT_PROTOCOL_VERSION];
const JSON_RPC_VERSION = '2.0';
const JSON_RPC_INVALID_REQUEST = -32600;
const JSON_RPC_METHOD_NOT_FOUND = -32601;
const JSON_RPC_INVALID_PARAMS = -32602;
const JSON_RPC_INTERNAL_ERROR = -32603;
const MCP_RESOURCE_NOT_FOUND = -32002;
const MCP_TOOL_EXECUTION_ERROR = -32010;

const RESOURCE_DEFINITIONS = [
  {
    uri: `${RESOURCE_SCHEME}://rules`,
    name: 'rules',
    title: 'Usage rules',
    description: 'Ground rules for consuming this public profile server.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://about`,
    name: 'about',
    title: 'About Dmytro Omelian',
    description: 'Core profile facts and public links.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://experience`,
    name: 'experience',
    title: 'Experience timeline',
    description: 'Education, work experience, and internships.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://news`,
    name: 'news',
    title: 'Recent updates',
    description: 'Chronological public updates about work, writing, and milestones.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://achievements`,
    name: 'achievements',
    title: 'Achievements',
    description: 'Selected public achievements and competitions.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://activities`,
    name: 'activities',
    title: 'Activities',
    description: 'Community activities and side involvement.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://blog/index`,
    name: 'blog_index',
    title: 'Blog index',
    description: 'List of published blog posts with previews and public stats.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://bookshelf`,
    name: 'bookshelf',
    title: 'Bookshelf',
    description: 'Personal bookshelf with books grouped by status (active, want to read, backlog) and tagged by topic.',
    mimeType: 'text/markdown',
  },
];

const RESOURCE_TEMPLATE_DEFINITIONS = [
  {
    name: 'blog_post',
    title: 'Blog post',
    uriTemplate: `${RESOURCE_SCHEME}://blog/{slug}`,
    description: 'Read a specific blog post by slug.',
    mimeType: 'text/markdown',
  },
];

const PROMPT_DEFINITIONS = [
  {
    name: 'site_rules',
    title: 'Website usage rules',
    description: 'Ground rules for using this portfolio MCP server as context.',
    arguments: [],
  },
  {
    name: 'introduce_dmytro',
    title: 'Introduce Dmytro',
    description: 'Compose an introduction using the profile and experience context.',
    arguments: [
      {
        name: 'audience',
        description: 'Target audience such as employer, collaborator, founder, or event organizer.',
        required: false,
      },
    ],
  },
];

const TOOL_DEFINITIONS = [
  {
    name: 'get_profile_overview',
    title: 'Get profile overview',
    description: 'Return the high-level profile, recent updates, achievements, and public links.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_experience_timeline',
    title: 'Get experience timeline',
    description: 'Return education, work experience, and internships.',
    inputSchema: {
      type: 'object',
      properties: {
        includeInternships: {
          type: 'boolean',
          description: 'Whether to include courses and internships.',
          default: true,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'list_blog_posts',
    title: 'List blog posts',
    description: 'List blog posts with previews and public stats.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Maximum number of posts to return.',
          minimum: 1,
          maximum: 50,
          default: 20,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_blog_post',
    title: 'Get blog post',
    description: 'Return a specific blog post by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Blog post slug.',
        },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_bookshelf',
    title: 'Get bookshelf',
    description: 'Return books from the personal bookshelf. Can filter by status (active, want_to_read, backlog) and/or tag.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status. One of: active, want_to_read, backlog.',
          enum: ['active', 'want_to_read', 'backlog'],
        },
        tag: {
          type: 'string',
          description: 'Filter by tag name (case-insensitive).',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of books to return.',
          minimum: 1,
          maximum: 500,
          default: 100,
        },
        includePrivateNotes: {
          type: 'boolean',
          description: 'Include private bookshelf notes. Requires x-admin-key or Authorization: Bearer <key>.',
          default: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'add_missing_reading_list_books',
    title: 'Add missing reading-list books',
    description: 'Create reading-list entries for books that are not already present by title+author or slug. Requires x-admin-key or Authorization: Bearer <key>.',
    inputSchema: {
      type: 'object',
      properties: {
        books: {
          type: 'array',
          description: 'Books to add if missing.',
          minItems: 1,
          maxItems: 50,
          items: {
            type: 'object',
            properties: {
              year: {
                type: 'integer',
                description: 'Reading-list year.',
                minimum: 1,
              },
              title: {
                type: 'string',
                description: 'Book title in the visible/original language of the edition.',
                minLength: 1,
                maxLength: 200,
              },
              author: {
                type: 'string',
                description: 'Book author in the visible/original language of the edition.',
                minLength: 1,
                maxLength: 200,
              },
              slug: {
                type: 'string',
                description: 'Optional URL slug. If omitted, a unique slug is generated from the title.',
                maxLength: 160,
              },
              summaryMarkdown: {
                type: 'string',
                description: 'Optional reading summary in Markdown.',
                maxLength: 20000,
              },
              relatedPostSlug: {
                type: 'string',
                description: 'Optional related blog slug, /blog/... path, or URL.',
                maxLength: 2048,
              },
              relatedPostLabel: {
                type: 'string',
                description: 'Optional label for the related blog post link.',
                maxLength: 120,
              },
              finishedOn: {
                type: 'string',
                description: 'Optional finish date, preferably YYYY-MM-DD.',
              },
              score: {
                type: 'number',
                description: 'Optional score from 0 to 5.',
                minimum: 0,
                maximum: 5,
              },
              sortOrder: {
                type: 'integer',
                description: 'Optional year-local sort order. Defaults to the end of the year.',
              },
            },
            required: ['year', 'title', 'author'],
            additionalProperties: false,
          },
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview which books would be created without writing to the database.',
          default: false,
        },
      },
      required: ['books'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_site_content',
    title: 'Search site content',
    description: 'Search across about, experience, news, blog, and bookshelf content.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query.',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of matches to return.',
          minimum: 1,
          maximum: 25,
          default: 8,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
];

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

function getAdminKeyFromHeaders(headers) {
  const directKey = getHeaderValue(headers, 'x-admin-key');

  if (directKey) {
    return directKey;
  }

  const authorization = getHeaderValue(headers, 'authorization');
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);

  return bearerMatch ? bearerMatch[1].trim() : '';
}

function hasPrivateMcpAccess(headers) {
  const adminApiKey = (process.env.ADMIN_API_KEY || '').trim();

  if (!adminApiKey) {
    return false;
  }

  return getAdminKeyFromHeaders(headers) === adminApiKey;
}

function ensurePrivateMcpAccess(headers) {
  if (!hasPrivateMcpAccess(headers)) {
    throw createHttpError(401, 'Private MCP access requires a valid admin API key.');
  }
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

function validateOrigin(headers, requestUrl) {
  const rawOrigin = getHeaderValue(headers, 'origin');

  if (!rawOrigin) {
    return;
  }

  let originUrl;

  try {
    originUrl = new URL(rawOrigin);
  } catch (error) {
    throw createHttpError(403, 'Origin header is invalid.');
  }

  const requestHostname = normalizeHostname(requestUrl.hostname);
  const originHostname = normalizeHostname(originUrl.hostname);

  if (originHostname === requestHostname) {
    return;
  }

  if (isLocalHostname(originHostname) && isLocalHostname(requestHostname)) {
    return;
  }

  throw createHttpError(403, 'Origin header is not allowed.');
}

function normalizeBoolean(value, fallback = false) {
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

function normalizeLimit(value, fallback, { min = 1, max = 50 } = {}) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw createHttpError(400, 'limit must be a number.');
  }

  return Math.max(min, Math.min(max, Math.trunc(numericValue)));
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

function normalizeOptionalInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return normalizeRequiredInteger(value, fieldName);
}

function normalizeRequiredText(value, fieldName, { maxLength } = {}) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw createHttpError(400, `${fieldName} is required.`);
  }

  if (maxLength && normalizedValue.length > maxLength) {
    throw createHttpError(400, `${fieldName} must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value, fieldName, { maxLength } = {}) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (maxLength && normalizedValue.length > maxLength) {
    throw createHttpError(400, `${fieldName} must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
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

function normalizeReadingListDuplicatePart(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function getReadingListDuplicateKey(book) {
  return [
    normalizeReadingListDuplicatePart(book.title),
    normalizeReadingListDuplicatePart(book.author),
  ].join('::');
}

function getUniqueReadingListSlug(book, usedSlugs) {
  const explicitSlug = normalizeOptionalText(book.slug, 'slug', { maxLength: 160 });
  const baseSlug = slugifyReadingListValue(explicitSlug || book.title) || 'book';
  const authorSlug = slugifyReadingListValue(book.author);
  let candidate = baseSlug;

  if (!explicitSlug && usedSlugs.has(candidate) && authorSlug) {
    candidate = `${baseSlug}-${authorSlug}`.slice(0, 150).replace(/-+$/g, '');
  }

  let uniqueSlug = candidate;
  let suffix = 2;

  while (usedSlugs.has(uniqueSlug)) {
    const suffixText = `-${suffix}`;
    uniqueSlug = `${candidate.slice(0, 160 - suffixText.length).replace(/-+$/g, '')}${suffixText}`;
    suffix += 1;
  }

  return uniqueSlug;
}

function normalizeReadingListBookPayload(book, index, usedSlugs) {
  if (!book || typeof book !== 'object' || Array.isArray(book)) {
    throw createHttpError(400, `books[${index}] must be an object.`);
  }

  const payload = {
    year: normalizeRequiredInteger(book.year, `books[${index}].year`, { min: 1 }),
    title: normalizeRequiredText(book.title, `books[${index}].title`, { maxLength: 200 }),
    author: normalizeRequiredText(book.author, `books[${index}].author`, { maxLength: 200 }),
  };

  payload.slug = getUniqueReadingListSlug({
    ...book,
    title: payload.title,
    author: payload.author,
  }, usedSlugs);

  const summaryMarkdown = normalizeOptionalText(book.summaryMarkdown, `books[${index}].summaryMarkdown`, { maxLength: 20000 });
  const relatedPostSlug = normalizeOptionalText(book.relatedPostSlug, `books[${index}].relatedPostSlug`, { maxLength: 2048 });
  const relatedPostLabel = normalizeOptionalText(book.relatedPostLabel, `books[${index}].relatedPostLabel`, { maxLength: 120 });
  const finishedOn = normalizeOptionalText(book.finishedOn, `books[${index}].finishedOn`);
  const score = book.score === undefined || book.score === null || book.score === ''
    ? undefined
    : Number(book.score);
  const sortOrder = normalizeOptionalInteger(book.sortOrder, `books[${index}].sortOrder`);

  if (score !== undefined && (!Number.isFinite(score) || score < 0 || score > 5)) {
    throw createHttpError(400, `books[${index}].score must be between 0 and 5.`);
  }

  if (summaryMarkdown !== undefined) payload.summaryMarkdown = summaryMarkdown;
  if (relatedPostSlug !== undefined) payload.relatedPostSlug = relatedPostSlug;
  if (relatedPostLabel !== undefined) payload.relatedPostLabel = relatedPostLabel;
  if (finishedOn !== undefined) payload.finishedOn = finishedOn;
  if (score !== undefined) payload.score = score;
  if (sortOrder !== undefined) payload.sortOrder = sortOrder;

  return payload;
}

function toMarkdownList(title, items, formatter) {
  return [
    `# ${title}`,
    '',
    ...(items.length > 0 ? items.map(formatter) : ['No items found.']),
  ].join('\n');
}

function createTextContent(text) {
  return {
    type: 'text',
    text,
  };
}

function createTextResource(uri, text, mimeType = 'text/markdown') {
  return {
    uri,
    mimeType,
    text,
  };
}

function createResourceLink(uri, name, title, description, mimeType = 'text/markdown') {
  return {
    type: 'resource_link',
    uri,
    name,
    title,
    description,
    mimeType,
  };
}

function createEmbeddedResource(uri, text, mimeType = 'text/markdown') {
  return {
    type: 'resource',
    resource: createTextResource(uri, text, mimeType),
  };
}

function createToolResult({ text, structuredContent, resourceLinks = [], isError = false }) {
  return {
    content: [
      createTextContent(text),
      ...resourceLinks,
    ],
    structuredContent,
    ...(isError ? { isError: true } : {}),
  };
}

function createJsonRpcSuccess(id, result) {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    result,
  };
}

function createJsonRpcError(id, code, message, data) {
  return {
    jsonrpc: JSON_RPC_VERSION,
    ...(id !== undefined ? { id } : {}),
    error: {
      code,
      message,
      ...(data !== undefined ? { data } : {}),
    },
  };
}

function createResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
    body,
  };
}

function createJsonResponse(statusCode, payload, headers = {}) {
  return createResponse(
    statusCode,
    JSON.stringify(payload),
    {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  );
}

function createEmptyResponse(statusCode, headers = {}) {
  return createResponse(statusCode, '', headers);
}

function getResponseProtocolVersion(headers) {
  const requestedVersion = getHeaderValue(headers, 'MCP-Protocol-Version');

  if (!requestedVersion) {
    return DEFAULT_PROTOCOL_VERSION;
  }

  if (!SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)) {
    throw createHttpError(400, 'Unsupported MCP-Protocol-Version header.');
  }

  return requestedVersion;
}

function negotiateProtocolVersion(requestedVersion) {
  const normalizedRequestedVersion = String(requestedVersion || '').trim();

  if (!normalizedRequestedVersion) {
    return LATEST_PROTOCOL_VERSION;
  }

  if (SUPPORTED_PROTOCOL_VERSIONS.includes(normalizedRequestedVersion)) {
    return normalizedRequestedVersion;
  }

  return LATEST_PROTOCOL_VERSION;
}

function getServerInstructions() {
  return [
    'Use this server as public context about Dmytro Omelian.',
    'Private bookshelf notes and reading-list write tools are available only when the request includes a valid admin API key.',
    'Prefer exact dates and distinguish between blog posts, reading notes, and career timeline items.',
    'If information is not present in the resources or tool results, say so instead of guessing.',
  ].join(' ');
}

function buildRulesMarkdown() {
  return [
    '# Usage rules',
    '',
    '- Public resources and tools are read-only.',
    '- Private MCP writes require a valid admin API key.',
    '- Prefer exact dates when summarizing experience, updates, or blog posts.',
    '- If information is missing from the provided resources or tool results, say so explicitly.',
    '- When possible, cite the resource URI or tool result you used.',
  ].join('\n');
}

const BOOKSHELF_STATUS_LABELS = {
  active: 'Active',
  want_to_read: 'Want to Read',
  backlog: 'Backlog',
};

const BOOKSHELF_STATUS_ORDER = ['active', 'want_to_read', 'backlog'];

function renderBookshelfMarkdown(entries, { statusFilter, tagFilter, includePrivateNotes = false } = {}) {
  if (entries.length === 0) {
    const filters = [statusFilter, tagFilter].filter(Boolean).join(', ');
    return filters
      ? `# Bookshelf\n\nNo books found matching: ${filters}.`
      : '# Bookshelf\n\nNo books on the shelf yet.';
  }

  const grouped = {};

  for (const status of BOOKSHELF_STATUS_ORDER) {
    grouped[status] = [];
  }

  for (const entry of entries) {
    const status = grouped[entry.status] ? entry.status : 'backlog';
    grouped[status].push(entry);
  }

  const sections = BOOKSHELF_STATUS_ORDER
    .filter((status) => grouped[status].length > 0)
    .map((status) => {
      const label = BOOKSHELF_STATUS_LABELS[status];
      const lines = grouped[status].map((e) => {
        const tags = (e.tags || []).length > 0 ? ` [${e.tags.join(', ')}]` : '';
        const online = e.isOnline ? ' (online)' : '';
        const privateNotes = includePrivateNotes && e.internalNotes
          ? `\n  - Private notes: ${e.internalNotes.replace(/\n+/g, '\n    ')}`
          : '';
        return `- **${e.title}** — ${e.author}${online}${tags}${privateNotes}`;
      });
      return `## ${label} (${grouped[status].length})\n\n${lines.join('\n')}`;
    });

  const title = statusFilter || tagFilter
    ? `# Bookshelf (filtered: ${[statusFilter, tagFilter].filter(Boolean).join(', ')})`
    : `# Bookshelf (${entries.length} books)`;

  return [title, '', ...sections].join('\n\n');
}

async function getBlogStats(posts) {
  const slugs = posts.map((post) => post.slug);

  const [viewCounts, commentCounts] = await Promise.all([
    getAllPostViews().catch(() => ({})),
    getBlogCommentCounts(slugs).catch(() => ({})),
  ]);

  return {
    viewCounts,
    commentCounts,
  };
}

async function getStaticContext() {
  const siteContent = await getStaticSiteContent();
  const blogStats = await getBlogStats(siteContent.blogPosts);
  return {
    ...siteContent,
    ...blogStats,
  };
}

async function readResource(uri) {
  const staticContext = await getStaticContext();

  if (uri === `${RESOURCE_SCHEME}://rules`) {
    return createTextResource(uri, buildRulesMarkdown());
  }

  if (uri === `${RESOURCE_SCHEME}://about`) {
    return createTextResource(uri, renderAboutMarkdown(staticContext.about));
  }

  if (uri === `${RESOURCE_SCHEME}://experience`) {
    return createTextResource(uri, renderExperienceMarkdown(staticContext.experience));
  }

  if (uri === `${RESOURCE_SCHEME}://news`) {
    return createTextResource(uri, renderNewsMarkdown(staticContext.news));
  }

  if (uri === `${RESOURCE_SCHEME}://achievements`) {
    return createTextResource(
      uri,
      renderSimpleTimelineMarkdown('Achievements', staticContext.achievements),
    );
  }

  if (uri === `${RESOURCE_SCHEME}://activities`) {
    return createTextResource(
      uri,
      renderSimpleTimelineMarkdown('Activities', staticContext.activities),
    );
  }

  if (uri === `${RESOURCE_SCHEME}://blog/index`) {
    return createTextResource(
      uri,
      renderBlogIndexMarkdown(staticContext.blogPosts, {
        viewCounts: staticContext.viewCounts,
        commentCounts: staticContext.commentCounts,
      }),
    );
  }

  if (uri === `${RESOURCE_SCHEME}://bookshelf`) {
    const allEntries = await getBookshelfEntries();
    return createTextResource(uri, renderBookshelfMarkdown(allEntries));
  }

  let parsedUri;

  try {
    parsedUri = new URL(uri);
  } catch (error) {
    throw createHttpError(404, `Resource "${uri}" was not found.`);
  }

  if (parsedUri.protocol !== `${RESOURCE_SCHEME}:`) {
    throw createHttpError(404, `Resource "${uri}" was not found.`);
  }

  if (parsedUri.hostname === 'blog') {
    const slug = parsedUri.pathname.replace(/^\/+/, '').trim();
    const post = staticContext.blogPosts.find((item) => item.slug === slug);

    if (!post) {
      throw createHttpError(404, `Blog post "${slug}" was not found.`);
    }

    return createTextResource(
      uri,
      renderBlogPostMarkdown(post, {
        viewCount: staticContext.viewCounts[post.slug],
        commentCount: staticContext.commentCounts[post.slug],
      }),
    );
  }

  throw createHttpError(404, `Resource "${uri}" was not found.`);
}

async function getPrompt(name, args = {}) {
  const staticContext = await getStaticContext();

  if (name === 'site_rules') {
    return {
      description: 'Ground rules for using the website MCP server.',
      messages: [
        {
          role: 'user',
          content: createTextContent('Use these rules when working with Dmytro Omelian website data.'),
        },
        {
          role: 'user',
          content: createEmbeddedResource(`${RESOURCE_SCHEME}://rules`, buildRulesMarkdown()),
        },
      ],
    };
  }

  if (name === 'introduce_dmytro') {
    const audience = String(args.audience || '').trim() || 'a collaborator';
    const aboutMarkdown = renderAboutMarkdown(staticContext.about);
    const experienceMarkdown = renderExperienceMarkdown(staticContext.experience);

    return {
      description: 'A reusable prompt for creating a tailored introduction.',
      messages: [
        {
          role: 'user',
          content: createTextContent(
            `Write a concise introduction of Dmytro Omelian for ${audience}. Prefer exact dates, current role, and active work. If something is missing, say so.`,
          ),
        },
        {
          role: 'user',
          content: createEmbeddedResource(`${RESOURCE_SCHEME}://about`, aboutMarkdown),
        },
        {
          role: 'user',
          content: createEmbeddedResource(`${RESOURCE_SCHEME}://experience`, experienceMarkdown),
        },
      ],
    };
  }

  throw createHttpError(404, `Prompt "${name}" was not found.`);
}

function scoreText(value, query, tokens) {
  const haystack = String(value || '').toLowerCase();

  if (!haystack) {
    return 0;
  }

  let score = haystack.includes(query) ? query.length + 3 : 0;

  tokens.forEach((token) => {
    if (haystack.includes(token)) {
      score += token.length > 3 ? 2 : 1;
    }
  });

  return score;
}

async function searchSiteContent({ query, limit }) {
  const normalizedQuery = String(query || '').trim().toLowerCase();

  if (!normalizedQuery) {
    throw createHttpError(400, 'query is required.');
  }

  const tokens = [...new Set(normalizedQuery.split(/\s+/).filter(Boolean))];
  const staticContext = await getStaticContext();
  const searchCandidates = [];

  searchCandidates.push({
    type: 'about',
    title: 'About Dmytro Omelian',
    uri: `${RESOURCE_SCHEME}://about`,
    body: [
      staticContext.about.summary,
      staticContext.about.role,
      staticContext.about.location,
      staticContext.about.focusAreas.join(' '),
    ].join(' '),
  });

  staticContext.experience.experiences.forEach((entry) => {
    searchCandidates.push({
      type: 'experience',
      title: `${entry.title} @ ${entry.company}`,
      uri: `${RESOURCE_SCHEME}://experience`,
      body: [entry.dates, entry.title, entry.company, entry.city, ...entry.descriptions].join(' '),
    });
  });

  staticContext.experience.internships.forEach((entry) => {
    searchCandidates.push({
      type: 'experience',
      title: `${entry.title} @ ${entry.company}`,
      uri: `${RESOURCE_SCHEME}://experience`,
      body: [entry.dates, entry.title, entry.company, entry.city, ...entry.descriptions].join(' '),
    });
  });

  staticContext.news.forEach((item) => {
    searchCandidates.push({
      type: 'news',
      title: item.date,
      uri: `${RESOURCE_SCHEME}://news`,
      body: [item.date, item.description, item.suffix].join(' '),
    });
  });

  staticContext.blogPosts.forEach((post) => {
    searchCandidates.push({
      type: 'blog',
      title: post.title,
      uri: post.externalUrl || `${RESOURCE_SCHEME}://blog/${post.slug}`,
      body: [
        post.date,
        post.title,
        post.preview,
        post.externalUrl,
        post.externalStats ? JSON.stringify(post.externalStats) : '',
        ...post.content.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))),
      ].join(' '),
    });
  });

  const bookshelfEntries = await getBookshelfEntries().catch(() => []);

  bookshelfEntries.forEach((entry) => {
    searchCandidates.push({
      type: 'bookshelf',
      title: `${entry.title} — ${entry.author}`,
      uri: `${RESOURCE_SCHEME}://bookshelf`,
      body: [entry.title, entry.author, entry.status, ...(entry.tags || [])].join(' '),
    });
  });

  return searchCandidates
    .map((candidate) => ({
      ...candidate,
      score: scoreText(candidate.body, normalizedQuery, tokens),
      excerpt: createExcerpt(candidate.body, normalizedQuery),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, limit);
}

function createReadingListBookReference(book) {
  return {
    id: book.id ?? null,
    year: book.year,
    title: book.title,
    author: book.author,
    slug: book.slug,
  };
}

function formatReadingListBookLine(book) {
  return `- ${book.year}: **${book.title}** — ${book.author} (${book.slug})`;
}

async function addMissingReadingListBooks(args = {}, context = {}) {
  ensurePrivateMcpAccess(context.headers);

  if (!Array.isArray(args.books)) {
    throw createHttpError(400, 'books must be an array.');
  }

  if (args.books.length === 0) {
    throw createHttpError(400, 'books must include at least one book.');
  }

  if (args.books.length > 50) {
    throw createHttpError(400, 'books can include at most 50 books.');
  }

  const dryRun = normalizeBoolean(args.dryRun, false);
  const existingBooks = await getReadingListEntries();
  const duplicateBooksByKey = new Map();
  const usedSlugs = new Set();

  existingBooks.forEach((book) => {
    duplicateBooksByKey.set(getReadingListDuplicateKey(book), book);
    if (book.slug) {
      usedSlugs.add(String(book.slug));
    }
  });

  const skipped = [];
  const candidates = [];

  args.books.forEach((book, index) => {
    if (!book || typeof book !== 'object' || Array.isArray(book)) {
      throw createHttpError(400, `books[${index}] must be an object.`);
    }

    const title = normalizeRequiredText(book.title, `books[${index}].title`, { maxLength: 200 });
    const author = normalizeRequiredText(book.author, `books[${index}].author`, { maxLength: 200 });
    const duplicateKey = getReadingListDuplicateKey({ title, author });
    const explicitSlug = normalizeOptionalText(book.slug, `books[${index}].slug`, { maxLength: 160 });
    const normalizedExplicitSlug = explicitSlug ? slugifyReadingListValue(explicitSlug) : '';

    if (duplicateBooksByKey.has(duplicateKey)) {
      skipped.push({
        index,
        reason: 'title_author_match',
        input: { title, author },
        existingBook: createReadingListBookReference(duplicateBooksByKey.get(duplicateKey)),
      });
      return;
    }

    if (normalizedExplicitSlug && usedSlugs.has(normalizedExplicitSlug)) {
      const existingBook = existingBooks.find((candidate) => candidate.slug === normalizedExplicitSlug) || null;
      skipped.push({
        index,
        reason: 'slug_match',
        input: { title, author, slug: normalizedExplicitSlug },
        ...(existingBook ? { existingBook: createReadingListBookReference(existingBook) } : {}),
      });
      return;
    }

    const payload = normalizeReadingListBookPayload(book, index, usedSlugs);
    candidates.push({ index, payload });
    duplicateBooksByKey.set(getReadingListDuplicateKey(payload), payload);
    usedSlugs.add(payload.slug);
  });

  const created = [];
  const failed = [];

  if (!dryRun) {
    for (const candidate of candidates) {
      try {
        const book = await createReadingListEntry(candidate.payload);
        created.push({
          index: candidate.index,
          book: createReadingListBookReference(book),
        });
      } catch (error) {
        failed.push({
          index: candidate.index,
          input: candidate.payload,
          error: error.message,
        });
      }
    }
  }

  const wouldCreate = candidates.map((candidate) => ({
    index: candidate.index,
    book: createReadingListBookReference(candidate.payload),
  }));

  const summaryLines = [
    dryRun ? '# Reading list dry run' : '# Reading list update',
    '',
    dryRun
      ? `Would create ${wouldCreate.length} missing book(s); skipped ${skipped.length}.`
      : `Created ${created.length} missing book(s); skipped ${skipped.length}; failed ${failed.length}.`,
  ];

  const visibleCreated = dryRun ? wouldCreate : created;

  if (visibleCreated.length > 0) {
    summaryLines.push(
      '',
      dryRun ? '## Would create' : '## Created',
      '',
      ...visibleCreated.map((item) => formatReadingListBookLine(item.book)),
    );
  }

  if (skipped.length > 0) {
    summaryLines.push(
      '',
      '## Skipped',
      '',
      ...skipped.map((item) => {
        const inputTitle = item.input?.title || item.existingBook?.title || 'Unknown title';
        const inputAuthor = item.input?.author || item.existingBook?.author || 'Unknown author';
        return `- ${inputTitle} — ${inputAuthor}: ${item.reason}`;
      }),
    );
  }

  if (failed.length > 0) {
    summaryLines.push(
      '',
      '## Failed',
      '',
      ...failed.map((item) => `- ${item.input.title} — ${item.input.author}: ${item.error}`),
    );
  }

  return createToolResult({
    text: summaryLines.join('\n'),
    structuredContent: {
      dryRun,
      requestedCount: args.books.length,
      createdCount: created.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      wouldCreate: dryRun ? wouldCreate : [],
      created,
      skipped,
      failed,
    },
  });
}

async function callTool(name, args = {}, context = {}) {
  if (name === 'add_missing_reading_list_books') {
    return addMissingReadingListBooks(args, context);
  }

  const staticContext = await getStaticContext();

  if (name === 'get_profile_overview') {
    const overviewText = [
      renderAboutMarkdown(staticContext.about),
      '',
      renderNewsMarkdown(staticContext.news.slice(0, 8)),
      '',
      renderSimpleTimelineMarkdown('Achievements', staticContext.achievements),
      '',
      renderSimpleTimelineMarkdown('Activities', staticContext.activities),
    ].join('\n');

    return createToolResult({
      text: overviewText,
      structuredContent: {
        about: staticContext.about,
        recentNews: staticContext.news.slice(0, 8),
        achievements: staticContext.achievements,
        activities: staticContext.activities,
      },
      resourceLinks: [
        createResourceLink(`${RESOURCE_SCHEME}://about`, 'about', 'About Dmytro Omelian', 'Core profile facts'),
        createResourceLink(`${RESOURCE_SCHEME}://experience`, 'experience', 'Experience timeline', 'Career timeline and education'),
        createResourceLink(`${RESOURCE_SCHEME}://news`, 'news', 'Recent updates', 'Public timeline updates'),
      ],
    });
  }

  if (name === 'get_experience_timeline') {
    const includeInternships = normalizeBoolean(args.includeInternships, true);
    const sections = [
      '# Experience timeline',
      '',
      renderExperienceMarkdown({
        ...staticContext.experience,
        internships: includeInternships ? staticContext.experience.internships : [],
      }),
    ].join('\n');

    return createToolResult({
      text: sections,
      structuredContent: {
        education: staticContext.experience.education,
        experiences: staticContext.experience.experiences,
        internships: includeInternships ? staticContext.experience.internships : [],
      },
      resourceLinks: [
        createResourceLink(`${RESOURCE_SCHEME}://experience`, 'experience', 'Experience timeline', 'Career timeline and education'),
      ],
    });
  }

  if (name === 'list_blog_posts') {
    const limit = normalizeLimit(args.limit, 20, { min: 1, max: 50 });
    const posts = staticContext.blogPosts.slice(0, limit);

    return createToolResult({
      text: renderBlogIndexMarkdown(posts, {
        viewCounts: staticContext.viewCounts,
        commentCounts: staticContext.commentCounts,
      }),
      structuredContent: {
        posts: posts.map((post) => ({
          ...post,
          viewCount: staticContext.viewCounts[post.slug] || 0,
          commentCount: staticContext.commentCounts[post.slug] || 0,
        })),
      },
      resourceLinks: [
        createResourceLink(`${RESOURCE_SCHEME}://blog/index`, 'blog_index', 'Blog index', 'Published blog posts'),
      ],
    });
  }

  if (name === 'get_blog_post') {
    const slug = String(args.slug || '').trim();

    if (!slug) {
      throw createHttpError(400, 'slug is required.');
    }

    const post = staticContext.blogPosts.find((item) => item.slug === slug);

    if (!post) {
      throw createHttpError(404, `Blog post "${slug}" was not found.`);
    }

    return createToolResult({
      text: renderBlogPostMarkdown(post, {
        viewCount: staticContext.viewCounts[post.slug],
        commentCount: staticContext.commentCounts[post.slug],
      }),
      structuredContent: {
        post: {
          ...post,
          viewCount: staticContext.viewCounts[post.slug] || 0,
          commentCount: staticContext.commentCounts[post.slug] || 0,
        },
      },
      resourceLinks: [
        createResourceLink(
          `${RESOURCE_SCHEME}://blog/${post.slug}`,
          'blog_post',
          post.title,
          'Full blog post resource',
        ),
      ],
    });
  }

  if (name === 'get_bookshelf') {
    const limit = normalizeLimit(args.limit, 100, { min: 1, max: 500 });
    const statusFilter = args.status || null;
    const tagFilter = args.tag ? String(args.tag).trim().toLowerCase() : null;
    const includePrivateNotes = normalizeBoolean(args.includePrivateNotes, false);

    if (includePrivateNotes) {
      ensurePrivateMcpAccess(context.headers);
    }

    let allEntries = await getBookshelfEntries({ includeInternalNotes: includePrivateNotes });

    if (statusFilter) {
      allEntries = allEntries.filter((e) => e.status === statusFilter);
    }

    if (tagFilter) {
      allEntries = allEntries.filter((e) =>
        (e.tags || []).some((t) => t.toLowerCase() === tagFilter)
      );
    }

    const entries = allEntries.slice(0, limit);

    return createToolResult({
      text: renderBookshelfMarkdown(entries, { statusFilter, tagFilter, includePrivateNotes }),
      structuredContent: {
        totalCount: allEntries.length,
        returnedCount: entries.length,
        statusFilter,
        tagFilter,
        includePrivateNotes,
        entries: entries.map((e) => ({
          id: e.id,
          title: e.title,
          author: e.author,
          status: e.status,
          isOnline: e.isOnline,
          tags: e.tags || [],
          ...(includePrivateNotes ? { internalNotes: e.internalNotes || '' } : {}),
        })),
      },
      resourceLinks: [
        createResourceLink(`${RESOURCE_SCHEME}://bookshelf`, 'bookshelf', 'Bookshelf', 'Personal bookshelf'),
      ],
    });
  }

  if (name === 'search_site_content') {
    const query = String(args.query || '').trim();
    const limit = normalizeLimit(args.limit, 8, { min: 1, max: 25 });
    const matches = await searchSiteContent({ query, limit });

    return createToolResult({
      text: toMarkdownList('Search results', matches, (match) => `- [${match.title}](${match.uri}) [${match.type}]\n  ${match.excerpt}`),
      structuredContent: {
        query,
        matches,
      },
      resourceLinks: matches.slice(0, 5).map((match) => createResourceLink(
        match.uri,
        `${match.type}_match`,
        match.title,
        `${match.type} match`,
      )),
    });
  }

  const error = createHttpError(404, `Tool "${name}" was not found.`);
  error.isToolLookupError = true;
  throw error;
}

function createInitializeResult(protocolVersion, requestUrl) {
  return {
    protocolVersion,
    capabilities: {
      prompts: {},
      resources: {},
      tools: {},
    },
    serverInfo: {
      name: SERVER_NAME,
      title: SERVER_TITLE,
      version: packageJson.version,
      description: SERVER_DESCRIPTION,
      websiteUrl: requestUrl.origin,
    },
    instructions: getServerInstructions(),
  };
}

function buildDocsPayload(requestUrl) {
  return {
    name: SERVER_NAME,
    title: SERVER_TITLE,
    description: SERVER_DESCRIPTION,
    endpoint: `${requestUrl.origin}/mcp`,
    transport: {
      type: 'streamable-http',
      sse: false,
      sessions: false,
      notes: 'Use HTTP POST for JSON-RPC requests. This endpoint returns JSON responses and does not expose SSE streams.',
    },
    authentication: {
      requiredForPublicContent: false,
      privateNotes: {
        required: true,
        headers: ['x-admin-key', 'Authorization: Bearer <admin-key>'],
        toolCall: {
          name: 'get_bookshelf',
          arguments: {
            includePrivateNotes: true,
          },
        },
      },
      privateWrites: {
        required: true,
        headers: ['x-admin-key', 'Authorization: Bearer <admin-key>'],
        toolCalls: [
          {
            name: 'add_missing_reading_list_books',
            arguments: {
              books: [
                {
                  year: new Date().getFullYear(),
                  title: 'The Art of Learning',
                  author: 'Josh Waitzkin',
                },
              ],
            },
          },
        ],
      },
    },
    supportedProtocolVersions: SUPPORTED_PROTOCOL_VERSIONS,
    capabilities: {
      prompts: true,
      resources: true,
      resourceTemplates: true,
      tools: true,
    },
    rules: getServerInstructions().split('. ').filter(Boolean).map((item) => item.replace(/\.$/, '')),
    resources: RESOURCE_DEFINITIONS,
    resourceTemplates: RESOURCE_TEMPLATE_DEFINITIONS,
    prompts: PROMPT_DEFINITIONS,
    tools: TOOL_DEFINITIONS,
    examples: {
      initialize: {
        jsonrpc: JSON_RPC_VERSION,
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: LATEST_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: {
            name: 'example-client',
            version: '1.0.0',
          },
        },
      },
      listTools: {
        jsonrpc: JSON_RPC_VERSION,
        id: 2,
        method: 'tools/list',
      },
      getBlogPost: {
        jsonrpc: JSON_RPC_VERSION,
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_blog_post',
          arguments: {
            slug: 'read-this-before-your-next-long-project',
          },
        },
      },
      getBookshelfWithPrivateNotes: {
        jsonrpc: JSON_RPC_VERSION,
        id: 4,
        method: 'tools/call',
        params: {
          name: 'get_bookshelf',
          arguments: {
            includePrivateNotes: true,
          },
        },
      },
      addMissingReadingListBooks: {
        jsonrpc: JSON_RPC_VERSION,
        id: 5,
        method: 'tools/call',
        params: {
          name: 'add_missing_reading_list_books',
          arguments: {
            books: [
              {
                year: new Date().getFullYear(),
                title: 'The Art of Learning',
                author: 'Josh Waitzkin',
              },
            ],
          },
        },
      },
    },
  };
}

async function handleJsonRpcMessage(message, { headers, requestUrl }) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return {
      protocolVersion: getResponseProtocolVersion(headers),
      payload: createJsonRpcError(null, JSON_RPC_INVALID_REQUEST, 'Request body must be a single JSON-RPC object.'),
    };
  }

  if (message.jsonrpc !== JSON_RPC_VERSION) {
    return {
      protocolVersion: getResponseProtocolVersion(headers),
      payload: createJsonRpcError(message.id ?? null, JSON_RPC_INVALID_REQUEST, 'jsonrpc must be "2.0".'),
    };
  }

  if (typeof message.method !== 'string' || !message.method.trim()) {
    return {
      protocolVersion: getResponseProtocolVersion(headers),
      payload: createJsonRpcError(message.id ?? null, JSON_RPC_INVALID_REQUEST, 'method is required.'),
    };
  }

  const isRequest = Object.prototype.hasOwnProperty.call(message, 'id');

  if (!isRequest) {
    if (message.method === 'notifications/initialized') {
      return {
        protocolVersion: getResponseProtocolVersion(headers),
        acceptedNotification: true,
      };
    }

    return {
      protocolVersion: getResponseProtocolVersion(headers),
      acceptedNotification: true,
    };
  }

  if (message.method === 'initialize') {
    const protocolVersion = negotiateProtocolVersion(message.params?.protocolVersion);
    return {
      protocolVersion,
      payload: createJsonRpcSuccess(
        message.id,
        createInitializeResult(protocolVersion, requestUrl),
      ),
    };
  }

  const protocolVersion = getResponseProtocolVersion(headers);

  try {
    switch (message.method) {
      case 'ping':
        return {
          protocolVersion,
          payload: createJsonRpcSuccess(message.id, {}),
        };
      case 'prompts/list':
        return {
          protocolVersion,
          payload: createJsonRpcSuccess(message.id, {
            prompts: PROMPT_DEFINITIONS,
          }),
        };
      case 'prompts/get':
        return {
          protocolVersion,
          payload: createJsonRpcSuccess(
            message.id,
            await getPrompt(message.params?.name, message.params?.arguments),
          ),
        };
      case 'resources/list':
        return {
          protocolVersion,
          payload: createJsonRpcSuccess(message.id, {
            resources: RESOURCE_DEFINITIONS,
          }),
        };
      case 'resources/templates/list':
        return {
          protocolVersion,
          payload: createJsonRpcSuccess(message.id, {
            resourceTemplates: RESOURCE_TEMPLATE_DEFINITIONS,
          }),
        };
      case 'resources/read':
        return {
          protocolVersion,
          payload: createJsonRpcSuccess(message.id, {
            contents: [await readResource(String(message.params?.uri || '').trim())],
          }),
        };
      case 'tools/list':
        return {
          protocolVersion,
          payload: createJsonRpcSuccess(message.id, {
            tools: TOOL_DEFINITIONS,
          }),
        };
      case 'tools/call':
        return {
          protocolVersion,
          payload: createJsonRpcSuccess(
            message.id,
            await callTool(
              String(message.params?.name || '').trim(),
              message.params?.arguments || {},
              { headers, requestUrl },
            ),
          ),
        };
      default:
        return {
          protocolVersion,
          payload: createJsonRpcError(
            message.id,
            JSON_RPC_METHOD_NOT_FOUND,
            `Method "${message.method}" was not found.`,
          ),
        };
    }
  } catch (error) {
    if (message.method === 'tools/call' && !error.isToolLookupError) {
      return {
        protocolVersion,
        payload: createJsonRpcSuccess(
          message.id,
          createToolResult({
            text: error.message,
            structuredContent: {
              error: error.message,
            },
            isError: true,
          }),
        ),
      };
    }

    const errorCode = error.statusCode === 404
      ? (message.method === 'resources/read' ? MCP_RESOURCE_NOT_FOUND : JSON_RPC_METHOD_NOT_FOUND)
      : error.statusCode === 400
        ? JSON_RPC_INVALID_PARAMS
        : error.statusCode >= 500
          ? JSON_RPC_INTERNAL_ERROR
          : MCP_TOOL_EXECUTION_ERROR;

    return {
      protocolVersion,
      payload: createJsonRpcError(message.id, errorCode, error.message),
    };
  }
}

async function handleMcpRequest({ method, requestUrl, headers, readJsonBody }) {
  validateOrigin(headers, requestUrl);

  const normalizedMethod = String(method || 'GET').toUpperCase();

  if (normalizedMethod === 'GET') {
    const acceptHeader = getHeaderValue(headers, 'accept').toLowerCase();

    if (acceptHeader.includes('text/event-stream')) {
      return createJsonResponse(
        405,
        {
          error: 'This endpoint does not provide an SSE stream. Use HTTP POST for JSON-RPC calls.',
        },
        {
          Allow: 'GET, POST',
          'MCP-Protocol-Version': DEFAULT_PROTOCOL_VERSION,
        },
      );
    }

    return createJsonResponse(200, buildDocsPayload(requestUrl), {
      'MCP-Protocol-Version': DEFAULT_PROTOCOL_VERSION,
    });
  }

  if (normalizedMethod === 'DELETE') {
    return createJsonResponse(405, { error: 'Sessions are not enabled on this MCP endpoint.' }, {
      Allow: 'GET, POST',
      'MCP-Protocol-Version': DEFAULT_PROTOCOL_VERSION,
    });
  }

  if (normalizedMethod !== 'POST') {
    return createJsonResponse(405, { error: 'Method not allowed.' }, {
      Allow: 'GET, POST',
      'MCP-Protocol-Version': DEFAULT_PROTOCOL_VERSION,
    });
  }

  try {
    const message = await readJsonBody();
    const result = await handleJsonRpcMessage(message, {
      headers,
      requestUrl,
    });

    if (result.acceptedNotification) {
      return createEmptyResponse(202, {
        'MCP-Protocol-Version': result.protocolVersion,
      });
    }

    return createJsonResponse(200, result.payload, {
      'MCP-Protocol-Version': result.protocolVersion,
    });
  } catch (error) {
    if (error.statusCode) {
      return createJsonResponse(
        error.statusCode,
        createJsonRpcError(undefined, JSON_RPC_INVALID_REQUEST, error.message),
        {
          'MCP-Protocol-Version': DEFAULT_PROTOCOL_VERSION,
        },
      );
    }

    console.error(`[mcp] ${error.message}`);
    return createJsonResponse(
      500,
      createJsonRpcError(undefined, JSON_RPC_INTERNAL_ERROR, 'Internal server error'),
      {
        'MCP-Protocol-Version': DEFAULT_PROTOCOL_VERSION,
      },
    );
  }
}

module.exports = {
  handleMcpRequest,
};
