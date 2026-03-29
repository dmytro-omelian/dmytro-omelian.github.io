import seedViews from '../../data/postViewsSeed.json';
import { buildApiUrl, requestJson } from '../../api/siteData';

const DEFAULT_VIEWS_ENDPOINT = '/api/views';
const CONFIGURED_VIEWS_ENDPOINT = (process.env.REACT_APP_VIEWS_ENDPOINT || '').trim();
const VIEWS_ENDPOINT = CONFIGURED_VIEWS_ENDPOINT
  ? buildApiUrl(CONFIGURED_VIEWS_ENDPOINT)
  : buildApiUrl(DEFAULT_VIEWS_ENDPOINT);
const SESSION_VIEW_PREFIX = 'blog_post_viewed_v2_';
const LOCAL_VIEWS_STORAGE_KEY = 'blog_post_views_v1';
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

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

const STATIC_FALLBACK_VIEWS = normalizeViews(seedViews);
const HAS_VIEWS_ENDPOINT = Boolean(VIEWS_ENDPOINT);
const pendingIncrementBySlug = new Map();
let endpointIsUnavailable = !HAS_VIEWS_ENDPOINT;

function readLocalViews() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_VIEWS_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    return normalizeViews(JSON.parse(raw));
  } catch (error) {
    return {};
  }
}

let localViews = readLocalViews();
let cachedViews = withFallbackViews(localViews);

function persistLocalViews(views) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_VIEWS_STORAGE_KEY, JSON.stringify(normalizeViews(views)));
  } catch (error) {
    // Ignore local storage write issues.
  }
}

function markEndpointUnavailable() {
  endpointIsUnavailable = true;
}

function canUseRemoteEndpoint() {
  return HAS_VIEWS_ENDPOINT && !endpointIsUnavailable;
}

function updateCache(views) {
  cachedViews = withFallbackViews(views);
  localViews = normalizeViews(cachedViews);
  persistLocalViews(localViews);
}

function mergeRemoteAndLocalViews(remoteInput) {
  const remoteViews = withFallbackViews(remoteInput);
  const mergedViews = { ...remoteViews };

  Object.entries(localViews).forEach(([slug, value]) => {
    const remoteValue = mergedViews[slug] || 0;
    mergedViews[slug] = Math.max(remoteValue, value);
  });

  return mergedViews;
}

function incrementLocalViewCount(slug) {
  const nextViews = (cachedViews[slug] || 0) + 1;
  updateCache({
    ...cachedViews,
    [slug]: nextViews,
  });
  return nextViews;
}

function withFallbackViews(input) {
  return {
    ...STATIC_FALLBACK_VIEWS,
    ...normalizeViews(input),
  };
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

function isLocalhostRuntime() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = String(window.location.hostname || '').trim().toLowerCase();
  return LOCALHOST_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost');
}

export async function getAllPostViews(forceRefresh = false) {
  if (!forceRefresh) {
    return cachedViews;
  }

  if (pendingIncrementBySlug.size > 0) {
    await Promise.allSettled([...pendingIncrementBySlug.values()]);
  }

  if (!canUseRemoteEndpoint()) {
    return cachedViews;
  }

  try {
    const payload = await requestJson(VIEWS_ENDPOINT);
    const mergedViews = mergeRemoteAndLocalViews(payload.views || payload);
    updateCache(mergedViews);
    return cachedViews;
  } catch (error) {
    markEndpointUnavailable();
    return cachedViews;
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

  if (isLocalhostRuntime()) {
    if (canUseRemoteEndpoint()) {
      const views = await getAllPostViews(true);
      return views[slug] || 0;
    }

    return getPostViewsForSlug(slug);
  }

  const pendingIncrement = pendingIncrementBySlug.get(slug);
  if (pendingIncrement) {
    return pendingIncrement;
  }

  if (isAlreadyCountedInSession(slug)) {
    if (!canUseRemoteEndpoint()) {
      return getPostViewsForSlug(slug);
    }

    const views = await getAllPostViews(true);
    return views[slug] || 0;
  }

  // Mark early to avoid duplicate increments from React StrictMode double effects in dev.
  markAsCountedInSession(slug);

  const incrementTask = (async () => {
    if (!canUseRemoteEndpoint()) {
      return incrementLocalViewCount(slug);
    }

    try {
      const payload = await requestJson(`${VIEWS_ENDPOINT}/${encodeURIComponent(slug)}`, {
        method: 'POST',
      });
      const nextViews = Number(payload.views);
      const safeViews = Number.isFinite(nextViews) && nextViews >= 0 ? Math.floor(nextViews) : 0;
      const mergedViews = Math.max(safeViews, cachedViews[slug] || 0);

      updateCache({
        ...cachedViews,
        [slug]: mergedViews,
      });

      return mergedViews;
    } catch (error) {
      markEndpointUnavailable();
      const nextViews = incrementLocalViewCount(slug);
      // eslint-disable-next-line no-console
      console.error('Failed to increment post views remotely, using local fallback:', error);
      return nextViews;
    } finally {
      pendingIncrementBySlug.delete(slug);
    }
  })();

  pendingIncrementBySlug.set(slug, incrementTask);
  return incrementTask;
}
