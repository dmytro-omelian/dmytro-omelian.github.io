const VIEWS_ENDPOINT = '/api/views';
const SESSION_VIEW_PREFIX = 'blog_post_viewed_v2_';

let cachedViews = null;

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

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function isAlreadyCountedInSession(slug) {
  if (!slug || typeof window === 'undefined') {
    return false;
  }

  try {
    return window.sessionStorage.getItem(`${SESSION_VIEW_PREFIX}${slug}`) === '1';
  } catch (error) {
    return false;
  }
}

function markAsCountedInSession(slug) {
  if (!slug || typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(`${SESSION_VIEW_PREFIX}${slug}`, '1');
  } catch (error) {
    // Ignore session storage write issues.
  }
}

function clearCountedInSession(slug) {
  if (!slug || typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(`${SESSION_VIEW_PREFIX}${slug}`);
  } catch (error) {
    // Ignore session storage write issues.
  }
}

export async function getAllPostViews(forceRefresh = false) {
  if (cachedViews && !forceRefresh) {
    return cachedViews;
  }

  try {
    const payload = await requestJson(VIEWS_ENDPOINT);
    const views = normalizeViews(payload.views || payload);
    cachedViews = views;
    return views;
  } catch (error) {
    return cachedViews || {};
  }
}

export async function getPostViewsForSlug(slug) {
  if (!slug) {
    return 0;
  }

  const views = await getAllPostViews();
  return views[slug] || 0;
}

export async function incrementPostView(slug) {
  if (!slug) {
    return 0;
  }

  if (isAlreadyCountedInSession(slug)) {
    return getPostViewsForSlug(slug);
  }

  // Mark early to avoid duplicate increments from React StrictMode double effects in dev.
  markAsCountedInSession(slug);

  try {
    const payload = await requestJson(`${VIEWS_ENDPOINT}/${encodeURIComponent(slug)}`, {
      method: 'POST',
    });
    const nextViews = Number(payload.views);
    const safeViews = Number.isFinite(nextViews) && nextViews >= 0 ? Math.floor(nextViews) : 0;

    cachedViews = {
      ...(cachedViews || {}),
      [slug]: safeViews,
    };

    return safeViews;
  } catch (error) {
    clearCountedInSession(slug);
    // eslint-disable-next-line no-console
    console.error('Failed to increment post views:', error);
    return getPostViewsForSlug(slug);
  }
}
