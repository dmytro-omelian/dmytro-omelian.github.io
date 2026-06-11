const fs = require('fs/promises');
const path = require('path');
const vm = require('vm');

const ROOT_DIRECTORY = path.resolve(__dirname, '..');
const SOURCE_FILES = {
  posts: path.join(ROOT_DIRECTORY, 'src', 'components', 'posts', 'Posts.js'),
  experience: path.join(ROOT_DIRECTORY, 'src', 'components', 'experience', 'Experience.js'),
  news: path.join(ROOT_DIRECTORY, 'src', 'components', 'news', 'News.js'),
  achievements: path.join(ROOT_DIRECTORY, 'src', 'components', 'achievements', 'Achievements.js'),
  activities: path.join(ROOT_DIRECTORY, 'src', 'components', 'others', 'Others.js'),
};
const DEFAULT_AUTHOR = 'Dmytro Omelian';
const monthMap = {
  Jan: 0,
  January: 0,
  Feb: 1,
  February: 1,
  Mar: 2,
  March: 2,
  Apr: 3,
  April: 3,
  May: 4,
  Jun: 5,
  June: 5,
  Jul: 6,
  July: 6,
  Aug: 7,
  August: 7,
  Sep: 8,
  September: 8,
  Oct: 9,
  October: 9,
  Nov: 10,
  November: 10,
  Dec: 11,
  December: 11,
};
const parsedValueCache = new Map();

function toIsoDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

async function readCachedFile(filePath) {
  const stats = await fs.stat(filePath);
  const cachedEntry = parsedValueCache.get(filePath);

  if (cachedEntry && cachedEntry.mtimeMs === stats.mtimeMs) {
    return cachedEntry.source;
  }

  const source = await fs.readFile(filePath, 'utf8');
  parsedValueCache.set(filePath, { mtimeMs: stats.mtimeMs, source });
  return source;
}

function extractLiteral(source, startMarker, endMarker, label) {
  const startIndex = source.indexOf(startMarker);

  if (startIndex === -1) {
    throw new Error(`[site-content] Could not find start marker for ${label}.`);
  }

  const literalStart = startIndex + startMarker.length;
  const endIndex = source.indexOf(endMarker, literalStart);

  if (endIndex === -1) {
    throw new Error(`[site-content] Could not find end marker for ${label}.`);
  }

  return source.slice(literalStart, endIndex).trim();
}

function evaluateLiteral(literal, label) {
  try {
    return vm.runInNewContext(`(${literal})`, Object.create(null), {
      timeout: 1000,
    });
  } catch (error) {
    throw new Error(`[site-content] Failed to parse ${label}: ${error.message}`);
  }
}

async function parseArrayFromSource(filePath, startMarker, endMarker, label) {
  const source = await readCachedFile(filePath);
  const literal = extractLiteral(source, startMarker, endMarker, label);
  const value = evaluateLiteral(literal, label);

  if (!Array.isArray(value)) {
    throw new Error(`[site-content] Parsed ${label}, but it was not an array.`);
  }

  return value;
}

function parseMonthYear(dateValue) {
  const [monthName, yearValue] = String(dateValue || '').trim().split(/\s+/);
  const monthIndex = monthMap[monthName];
  const year = Number(yearValue);

  if (monthIndex === undefined || !Number.isFinite(year)) {
    return null;
  }

  return new Date(Date.UTC(year, monthIndex, 1));
}

function normalizePostContentItem(item) {
  if (typeof item === 'string') {
    return item;
  }

  if (item && typeof item === 'object') {
    return {
      ...item,
      type: String(item.type || '').trim(),
    };
  }

  return String(item || '');
}

function normalizeExternalStats(stats) {
  if (!stats || typeof stats !== 'object') {
    return null;
  }

  return {
    views: typeof stats.views === 'string' ? stats.views.trim() : Number(stats.views),
    likes: Number(stats.likes),
    comments: Number(stats.comments),
  };
}

function normalizePost(post) {
  return {
    id: Number(post.id),
    slug: String(post.slug || '').trim(),
    title: String(post.title || '').trim(),
    author: String(post.author || DEFAULT_AUTHOR).trim() || DEFAULT_AUTHOR,
    date: String(post.date || '').trim(),
    preview: String(post.preview || '').trim(),
    externalUrl: String(post.externalUrl || '').trim(),
    image: post.image && typeof post.image === 'object'
      ? {
        src: String(post.image.src || '').trim(),
        alt: String(post.image.alt || '').trim(),
      }
      : null,
    externalStats: normalizeExternalStats(post.externalStats),
    content: Array.isArray(post.content)
      ? post.content.map(normalizePostContentItem)
      : [],
  };
}

function normalizeExperienceEntry(entry) {
  return {
    title: String(entry.title || '').trim(),
    company: String(entry.company || '').trim(),
    city: entry.city ? String(entry.city).trim() : null,
    dates: String(entry.dates || '').trim(),
    descriptions: Array.isArray(entry.descriptions)
      ? entry.descriptions.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
    tags: Array.isArray(entry.tags)
      ? entry.tags.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
  };
}

function normalizeLinkedItem(item) {
  return {
    date: String(item.date || '').trim(),
    description: String(item.description || '').trim(),
    suffix: item.suffix ? String(item.suffix).trim() : '',
    link: item.link
      ? {
        text: String(item.link.text || '').trim(),
        url: String(item.link.url || '').trim(),
      }
      : null,
    links: Array.isArray(item.links)
      ? item.links.map((link) => ({
        text: String(link.text || '').trim(),
        url: String(link.url || '').trim(),
      }))
      : [],
  };
}

async function getBlogPosts() {
  const posts = await parseArrayFromSource(
    SOURCE_FILES.posts,
    'const posts = ',
    ';\n\nconst DEFAULT_AUTHOR =',
    'blog posts',
  );

  return posts.map(normalizePost);
}

async function getExperienceContent() {
  const [experiences, internships] = await Promise.all([
    parseArrayFromSource(
      SOURCE_FILES.experience,
      'const experiences = ',
      ';\n\n    const internships = [',
      'experience entries',
    ),
    parseArrayFromSource(
      SOURCE_FILES.experience,
      'const internships = ',
      ';\n\n    return (',
      'internship entries',
    ),
  ]);

  return {
    education: [
      {
        institution: 'Kyiv Polytechnic Institute',
        field: 'Software Engineering',
        dates: '2020-2024',
      },
    ],
    experiences: experiences.map(normalizeExperienceEntry),
    internships: internships.map(normalizeExperienceEntry),
  };
}

async function getNewsItems() {
  const newsItems = await parseArrayFromSource(
    SOURCE_FILES.news,
    'const newsItems = ',
    ';\n\nconst monthMap = {',
    'news items',
  );

  return newsItems
    .map(normalizeLinkedItem)
    .sort((left, right) => {
      const leftDate = parseMonthYear(left.date);
      const rightDate = parseMonthYear(right.date);
      return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
    });
}

async function getAchievements() {
  const items = await parseArrayFromSource(
    SOURCE_FILES.achievements,
    'const achievementItems = ',
    ';\n\nconst Achievements = () => {',
    'achievement items',
  );

  return items.map((item) => ({
    date: String(item.date || '').trim(),
    description: String(item.description || '').trim(),
  }));
}

async function getActivities() {
  const items = await parseArrayFromSource(
    SOURCE_FILES.activities,
    'const othersItems = ',
    ';\n\nconst Others = () => {',
    'activity items',
  );

  return items.map((item) => ({
    date: String(item.date || '').trim(),
    description: String(item.description || '').trim(),
  }));
}

function getAboutProfile() {
  return {
    name: 'Dmytro Omelian',
    role: 'Early engineer at AiSDR',
    location: 'Warsaw, Poland',
    nationality: 'Ukrainian',
    summary: 'Ukrainian early engineer and product-minded builder living in Warsaw, spending most of his time at the intersection of startup execution, writing in public, and small software experiments.',
    focusAreas: [
      'startup execution',
      'writing in public',
      'small software experiments',
      'product-minded engineering',
    ],
    socials: [
      {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/dmytro-omelian/',
      },
      {
        label: 'X',
        url: 'https://twitter.com/intent/user?screen_name=dmytroomelian',
      },
      {
        label: 'Substack',
        url: 'https://domelian.substack.com/',
      },
    ],
    updatedAt: toIsoDateTime(new Date()),
  };
}

async function getStaticSiteContent() {
  const [blogPosts, experience, news, achievements, activities] = await Promise.all([
    getBlogPosts(),
    getExperienceContent(),
    getNewsItems(),
    getAchievements(),
    getActivities(),
  ]);

  return {
    about: getAboutProfile(),
    experience,
    news,
    achievements,
    activities,
    blogPosts,
  };
}

function renderInlineLinks(item) {
  const linkSegments = [];

  if (item.links.length > 0) {
    linkSegments.push(item.links.map((link) => `[${link.text}](${link.url})`).join(', '));
  }

  if (item.link) {
    linkSegments.push(`[${item.link.text}](${item.link.url})`);
  }

  return linkSegments.length > 0 ? ` ${linkSegments.join(' ')}` : '';
}

function renderAboutMarkdown(about) {
  const focusAreas = about.focusAreas.map((item) => `- ${item}`).join('\n');
  const socials = about.socials.map((item) => `- [${item.label}](${item.url})`).join('\n');

  return [
    '# About Dmytro Omelian',
    '',
    `- Name: ${about.name}`,
    `- Role: ${about.role}`,
    `- Location: ${about.location}`,
    `- Nationality: ${about.nationality}`,
    '',
    about.summary,
    '',
    '## Focus areas',
    focusAreas,
    '',
    '## Links',
    socials,
  ].join('\n');
}

function renderExperienceEntry(entry) {
  const details = [
    `### ${entry.title}`,
    '',
    `- Company: ${entry.company}${entry.city ? ` (${entry.city})` : ''}`,
    `- Dates: ${entry.dates}`,
  ];

  if (entry.descriptions.length > 0) {
    details.push('', ...entry.descriptions.map((item) => `- ${item}`));
  }

  if (entry.tags.length > 0) {
    details.push('', `- Tags: ${entry.tags.join(', ')}`);
  }

  return details.join('\n');
}

function renderExperienceMarkdown(experience) {
  return [
    '# Experience',
    '',
    '## Education',
    ...experience.education.map((item) => `- ${item.dates}: ${item.institution} (${item.field})`),
    '',
    '## Work',
    ...experience.experiences.map((entry) => renderExperienceEntry(entry)),
    '',
    '## Courses and internships',
    ...experience.internships.map((entry) => renderExperienceEntry(entry)),
  ].join('\n');
}

function renderNewsMarkdown(newsItems) {
  return [
    '# News',
    '',
    ...newsItems.map((item) => `- ${item.date}: ${item.description}${renderInlineLinks(item)}${item.suffix ? ` ${item.suffix}` : ''}`),
  ].join('\n');
}

function renderSimpleTimelineMarkdown(title, items) {
  return [
    `# ${title}`,
    '',
    ...items.map((item) => `- ${item.date}: ${item.description}`),
  ].join('\n');
}

function renderPostContentItem(item) {
  if (typeof item === 'string') {
    return item;
  }

  if (!item || typeof item !== 'object') {
    return String(item || '');
  }

  if (item.type === 'heading') {
    return `## ${item.text}`;
  }

  if (item.type === 'link') {
    const prefix = item.prefix ? String(item.prefix) : '';
    return `${prefix}[${item.text}](${item.url})`;
  }

  return normalizeWhitespace(JSON.stringify(item));
}

function addExternalStats(metadata, externalStats) {
  if (!externalStats) {
    return;
  }

  if (typeof externalStats.views === 'string' && externalStats.views.trim()) {
    metadata.push(`- Substack views: ${externalStats.views.trim()}`);
  } else if (Number.isFinite(externalStats.views)) {
    metadata.push(`- Substack views: ${externalStats.views}`);
  }

  if (Number.isFinite(externalStats.likes)) {
    metadata.push(`- Substack likes: ${externalStats.likes}`);
  }

  if (Number.isFinite(externalStats.comments)) {
    metadata.push(`- Substack comments: ${externalStats.comments}`);
  }
}

function renderBlogPostMarkdown(post, { viewCount, commentCount } = {}) {
  const metadata = [
    `- Author: ${post.author}`,
    `- Published: ${post.date}`,
  ];

  if (post.externalUrl) {
    metadata.push(`- External URL: ${post.externalUrl}`);
    addExternalStats(metadata, post.externalStats);
  }

  if (typeof viewCount === 'number') {
    metadata.push(`- Views: ${viewCount}`);
  }

  if (typeof commentCount === 'number') {
    metadata.push(`- Comments: ${commentCount}`);
  }

  const body = post.content.length > 0
    ? post.content.map(renderPostContentItem)
    : [post.preview].filter(Boolean);

  return [
    `# ${post.title}`,
    '',
    ...metadata,
    '',
    ...body,
  ].join('\n');
}

function renderBlogIndexMarkdown(posts, { viewCounts = {}, commentCounts = {} } = {}) {
  return [
    '# Blog index',
    '',
    ...posts.map((post) => {
      const stats = [];

      if (post.externalStats) {
        if (typeof post.externalStats.views === 'string' && post.externalStats.views.trim()) {
          stats.push(`${post.externalStats.views.trim()} views`);
        } else if (Number.isFinite(post.externalStats.views)) {
          stats.push(`${post.externalStats.views} views`);
        }

        if (Number.isFinite(post.externalStats.likes)) {
          stats.push(`${post.externalStats.likes} likes`);
        }

        if (Number.isFinite(post.externalStats.comments)) {
          stats.push(`${post.externalStats.comments} comments`);
        }
      } else {
        if (typeof viewCounts[post.slug] === 'number') {
          stats.push(`${viewCounts[post.slug]} views`);
        }

        if (typeof commentCounts[post.slug] === 'number') {
          stats.push(`${commentCounts[post.slug]} comments`);
        }
      }

      const href = post.externalUrl || `portfolio://blog/${post.slug}`;
      const statsText = stats.length > 0 ? ` (${stats.join(', ')})` : '';
      return `- ${post.date}: [${post.title}](${href})${statsText}\n  ${post.preview}`;
    }),
  ].join('\n');
}

function createExcerpt(value, query) {
  const normalizedValue = normalizeWhitespace(value);

  if (!normalizedValue) {
    return '';
  }

  if (!query) {
    return normalizedValue.slice(0, 180);
  }

  const lowerValue = normalizedValue.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerValue.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return normalizedValue.slice(0, 180);
  }

  const start = Math.max(0, matchIndex - 70);
  const end = Math.min(normalizedValue.length, matchIndex + lowerQuery.length + 90);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < normalizedValue.length ? '...' : '';
  return `${prefix}${normalizedValue.slice(start, end)}${suffix}`;
}

module.exports = {
  DEFAULT_AUTHOR,
  createExcerpt,
  getStaticSiteContent,
  renderAboutMarkdown,
  renderBlogIndexMarkdown,
  renderBlogPostMarkdown,
  renderExperienceMarkdown,
  renderNewsMarkdown,
  renderSimpleTimelineMarkdown,
};
