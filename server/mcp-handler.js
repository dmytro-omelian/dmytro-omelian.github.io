require('./loadEnv');

const packageJson = require('../package.json');
const {
  createHttpError,
  getAllPostViews,
  getBlogCommentCounts,
  getQuestionBySlug,
  getQuestionLogs,
  getQuestions,
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
const SERVER_DESCRIPTION = 'Public, read-only MCP server for Dmytro Omelian’s profile, projects, logs, timeline, and blog.';
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
    description: 'Chronological public updates about work, projects, and milestones.',
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
    uri: `${RESOURCE_SCHEME}://projects/active`,
    name: 'active_projects',
    title: 'Active projects',
    description: 'Publicly visible active projects with latest log dates.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://projects/archive`,
    name: 'archived_projects',
    title: 'Archived projects',
    description: 'Publicly visible archived projects with latest log dates.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${RESOURCE_SCHEME}://blog/index`,
    name: 'blog_index',
    title: 'Blog index',
    description: 'List of published blog posts with previews and public stats.',
    mimeType: 'text/markdown',
  },
];

const RESOURCE_TEMPLATE_DEFINITIONS = [
  {
    name: 'project',
    title: 'Project dossier',
    uriTemplate: `${RESOURCE_SCHEME}://projects/{slug}`,
    description: 'Read a specific public project and its logs by slug.',
    mimeType: 'text/markdown',
  },
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
    description: 'Compose an introduction using the profile, experience, and active project context.',
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
    name: 'list_projects',
    title: 'List projects',
    description: 'List public projects from the logs system.',
    inputSchema: {
      type: 'object',
      properties: {
        archived: {
          type: 'boolean',
          description: 'Whether to return archived projects. Defaults to false.',
          default: false,
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of projects to return.',
          minimum: 1,
          maximum: 50,
          default: 20,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_project',
    title: 'Get project',
    description: 'Return a specific public project with its logs.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Project slug from the logs system.',
        },
        includeLogs: {
          type: 'boolean',
          description: 'Whether to include the full project logs.',
          default: true,
        },
      },
      required: ['slug'],
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
    name: 'search_site_content',
    title: 'Search site content',
    description: 'Search across about, experience, news, projects, and blog content.',
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
    'Use this server as public, read-only context about Dmytro Omelian.',
    'Prefer exact dates and distinguish between active projects, archived projects, blog posts, and career timeline items.',
    'If information is not present in the resources or tool results, say so instead of guessing.',
  ].join(' ');
}

function buildRulesMarkdown() {
  return [
    '# Usage rules',
    '',
    '- This server is public and read-only.',
    '- Prefer exact dates when summarizing experience, updates, or blog posts.',
    '- Treat active projects and archived projects as separate collections.',
    '- If information is missing from the provided resources or tool results, say so explicitly.',
    '- When possible, cite the resource URI or tool result you used.',
  ].join('\n');
}

function buildProjectMarkdown(project, logs) {
  const header = [
    `# ${project.title}`,
    '',
    `- Slug: ${project.slug}`,
    `- Status: ${project.isArchived ? 'archived' : 'active'}`,
    `- Log count: ${project.logCount}`,
    `- Latest log date: ${project.latestLogDate || 'unknown'}`,
  ];

  if (logs.length === 0) {
    header.push('', '## Logs', '', 'No public logs yet.');
    return header.join('\n');
  }

  const renderedLogs = logs.flatMap((log) => [
    '',
    `## ${log.loggedAt}`,
    '',
    log.noteMarkdown,
  ]);

  return [...header, '', '## Logs', ...renderedLogs].join('\n');
}

function buildProjectListMarkdown(title, projects) {
  return toMarkdownList(title, projects, (project) => {
    const latestLog = project.latestLogDate ? `, latest log ${project.latestLogDate}` : '';
    return `- [${project.title}](${RESOURCE_SCHEME}://projects/${project.slug})${latestLog}`;
  });
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

async function getProjectCollections() {
  const [activeProjects, archivedProjects] = await Promise.all([
    getQuestions({ archived: false }),
    getQuestions({ archived: true }),
  ]);

  return {
    activeProjects,
    archivedProjects,
    allProjects: [...activeProjects, ...archivedProjects],
  };
}

async function getProjectCollectionsSafe() {
  try {
    return await getProjectCollections();
  } catch (error) {
    return {
      activeProjects: [],
      archivedProjects: [],
      allProjects: [],
    };
  }
}

async function getPublicProjectBySlug(slug) {
  const project = await getQuestionBySlug(slug, {
    includeHidden: false,
    includeAdminFields: false,
  });

  if (!project) {
    throw createHttpError(404, `Project "${slug}" was not found.`);
  }

  const logs = await getQuestionLogs(project.id);
  return {
    project,
    logs,
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

  if (uri === `${RESOURCE_SCHEME}://projects/active`) {
    const { activeProjects } = await getProjectCollections();
    return createTextResource(uri, buildProjectListMarkdown('Active projects', activeProjects));
  }

  if (uri === `${RESOURCE_SCHEME}://projects/archive`) {
    const { archivedProjects } = await getProjectCollections();
    return createTextResource(uri, buildProjectListMarkdown('Archived projects', archivedProjects));
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

  if (parsedUri.hostname === 'projects') {
    const slug = parsedUri.pathname.replace(/^\/+/, '').trim();
    const { project, logs } = await getPublicProjectBySlug(slug);
    return createTextResource(uri, buildProjectMarkdown(project, logs));
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
    const { activeProjects } = await getProjectCollectionsSafe();
    const activeProjectsMarkdown = buildProjectListMarkdown('Active projects', activeProjects);

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
        {
          role: 'user',
          content: createEmbeddedResource(`${RESOURCE_SCHEME}://projects/active`, activeProjectsMarkdown),
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
  const { allProjects } = await getProjectCollectionsSafe();
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
      uri: `${RESOURCE_SCHEME}://blog/${post.slug}`,
      body: [post.date, post.title, post.preview, ...post.content.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))].join(' '),
    });
  });

  const projectsWithLogs = await Promise.all(
    allProjects.map(async (project) => ({
      project,
      logs: await getQuestionLogs(project.id).catch(() => []),
    })),
  );

  projectsWithLogs.forEach(({ project, logs }) => {
    searchCandidates.push({
      type: 'project',
      title: project.title,
      uri: `${RESOURCE_SCHEME}://projects/${project.slug}`,
      body: [
        project.title,
        project.slug,
        project.latestLogDate,
        ...logs.map((log) => `${log.loggedAt} ${log.noteMarkdown}`),
      ].join(' '),
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

async function callTool(name, args = {}) {
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

  if (name === 'list_projects') {
    const archived = normalizeBoolean(args.archived, false);
    const limit = normalizeLimit(args.limit, 20, { min: 1, max: 50 });
    const projects = await getQuestions({ archived });
    const limitedProjects = projects.slice(0, limit);
    const title = archived ? 'Archived projects' : 'Active projects';

    return createToolResult({
      text: buildProjectListMarkdown(title, limitedProjects),
      structuredContent: {
        archived,
        projects: limitedProjects,
      },
      resourceLinks: [
        createResourceLink(
          archived ? `${RESOURCE_SCHEME}://projects/archive` : `${RESOURCE_SCHEME}://projects/active`,
          archived ? 'archived_projects' : 'active_projects',
          title,
          `Public ${title.toLowerCase()} collection`,
        ),
      ],
    });
  }

  if (name === 'get_project') {
    const slug = String(args.slug || '').trim();

    if (!slug) {
      throw createHttpError(400, 'slug is required.');
    }

    const includeLogs = normalizeBoolean(args.includeLogs, true);
    const { project, logs } = await getPublicProjectBySlug(slug);
    const selectedLogs = includeLogs ? logs : [];

    return createToolResult({
      text: buildProjectMarkdown(project, selectedLogs),
      structuredContent: {
        project,
        logs: selectedLogs,
      },
      resourceLinks: [
        createResourceLink(
          `${RESOURCE_SCHEME}://projects/${project.slug}`,
          'project',
          project.title,
          'Project dossier with public logs',
        ),
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
      getProject: {
        jsonrpc: JSON_RPC_VERSION,
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_project',
          arguments: {
            slug: 'example-project-slug',
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
