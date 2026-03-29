const RAW_API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').trim();
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/') ? RAW_API_BASE_URL.slice(0, -1) : RAW_API_BASE_URL;

export function buildApiUrl(path) {
  if (!path) {
    return API_BASE_URL || '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export async function requestJson(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const isJsonResponse = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJsonResponse ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with status ${response.status}.`);
  }

  return payload;
}

function createAdminHeaders(adminKey) {
  return {
    'x-admin-key': adminKey,
  };
}

export async function getPublicQuestions(archived = false) {
  const payload = await requestJson(`/api/questions?archived=${archived ? 'true' : 'false'}`);
  return payload.questions || [];
}

export async function getPublicQuestionLogs(questionId) {
  return requestJson(`/api/questions/${questionId}/logs`);
}

export async function getCommentCounts(postSlugs = []) {
  const normalizedPostSlugs = Array.isArray(postSlugs)
    ? postSlugs.map((postSlug) => String(postSlug || '').trim()).filter(Boolean)
    : [];
  const search = normalizedPostSlugs.length > 0
    ? `?slugs=${encodeURIComponent(normalizedPostSlugs.join(','))}`
    : '';
  const payload = await requestJson(`/api/comments/counts${search}`);
  return payload.counts || {};
}

export async function getPublicComments(postSlug) {
  const payload = await requestJson(`/api/comments/${encodeURIComponent(postSlug)}`);
  return payload.comments || [];
}

export async function createPublicComment(postSlug, comment) {
  return requestJson(`/api/comments/${encodeURIComponent(postSlug)}`, {
    method: 'POST',
    body: JSON.stringify(comment),
  });
}

export async function getAdminQuestions(adminKey) {
  const payload = await requestJson('/api/admin/questions', {
    headers: createAdminHeaders(adminKey),
  });

  return payload.questions || [];
}

export async function getAdminComments(adminKey, postSlug) {
  const search = postSlug ? `?postSlug=${encodeURIComponent(postSlug)}` : '';
  const payload = await requestJson(`/api/admin/comments${search}`, {
    headers: createAdminHeaders(adminKey),
  });

  return payload.comments || [];
}

export async function createAdminQuestion(adminKey, question) {
  return requestJson('/api/admin/questions', {
    method: 'POST',
    headers: createAdminHeaders(adminKey),
    body: JSON.stringify(question),
  });
}

export async function updateAdminQuestion(adminKey, questionId, question) {
  return requestJson(`/api/admin/questions/${questionId}`, {
    method: 'PATCH',
    headers: createAdminHeaders(adminKey),
    body: JSON.stringify(question),
  });
}

export async function getAdminQuestionLogs(adminKey, questionId) {
  return requestJson(`/api/admin/questions/${questionId}/logs`, {
    headers: createAdminHeaders(adminKey),
  });
}

export async function createAdminQuestionLog(adminKey, questionId, log) {
  return requestJson(`/api/admin/questions/${questionId}/logs`, {
    method: 'POST',
    headers: createAdminHeaders(adminKey),
    body: JSON.stringify(log),
  });
}

export async function updateAdminQuestionLog(adminKey, logId, log) {
  return requestJson(`/api/admin/logs/${logId}`, {
    method: 'PATCH',
    headers: createAdminHeaders(adminKey),
    body: JSON.stringify(log),
  });
}

export async function deleteAdminQuestionLog(adminKey, logId) {
  return requestJson(`/api/admin/logs/${logId}`, {
    method: 'DELETE',
    headers: createAdminHeaders(adminKey),
  });
}

export async function deleteAdminComment(adminKey, commentId) {
  return requestJson(`/api/admin/comments/${commentId}`, {
    method: 'DELETE',
    headers: createAdminHeaders(adminKey),
  });
}
