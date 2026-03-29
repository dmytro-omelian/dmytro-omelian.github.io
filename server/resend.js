require('./loadEnv');

const DEFAULT_RESEND_ENDPOINT = 'https://api.resend.com/emails';

function getOptionalEnvValue(key) {
  return String(process.env[key] || '').trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCommentTimestamp(createdAt) {
  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown time';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

async function sendCommentNotification({ comment, postTitle, siteOrigin }) {
  const resendApiKey = getOptionalEnvValue('RESEND_API_KEY');
  const fromEmail = getOptionalEnvValue('RESEND_FROM_EMAIL');
  const toEmail = getOptionalEnvValue('RESEND_TO_EMAIL');

  if (!resendApiKey || !fromEmail || !toEmail) {
    return { skipped: true };
  }

  const commentUrl = `${String(siteOrigin || '').replace(/\/+$/, '')}/blog/${encodeURIComponent(comment.postSlug)}#discussion`;
  const safePostTitle = escapeHtml(postTitle || comment.postSlug);
  const safeDisplayName = escapeHtml(comment.displayName || 'Anonymous');
  const safeReplyEmail = comment.authorEmail ? escapeHtml(comment.authorEmail) : 'Not provided';
  const safeBody = escapeHtml(comment.body).replace(/\r?\n/g, '<br />');
  const safePostSlug = escapeHtml(comment.postSlug);
  const safeCreatedAt = escapeHtml(formatCommentTimestamp(comment.createdAt));

  const payload = {
    from: fromEmail,
    to: [toEmail],
    subject: `New blog comment on ${postTitle || comment.postSlug}`,
    html: `
      <div style="font-family: Georgia, serif; padding: 24px; color: #1f2937;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280;">New comment</p>
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 500;">${safePostTitle}</h1>
        <p style="margin: 0 0 6px;"><strong>Post slug:</strong> ${safePostSlug}</p>
        <p style="margin: 0 0 6px;"><strong>Name:</strong> ${safeDisplayName}</p>
        <p style="margin: 0 0 6px;"><strong>Email:</strong> ${safeReplyEmail}</p>
        <p style="margin: 0 0 18px;"><strong>Sent:</strong> ${safeCreatedAt}</p>
        <div style="padding: 16px; border: 1px solid #e5e7eb; background: #f9fafb; line-height: 1.7;">
          ${safeBody}
        </div>
        <p style="margin: 18px 0 0;">
          <a href="${escapeHtml(commentUrl)}" style="color: #0f766e; text-decoration: none;">Open discussion</a>
        </p>
      </div>
    `,
  };

  if (comment.authorEmail) {
    payload.reply_to = comment.authorEmail;
  }

  const response = await fetch(DEFAULT_RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    throw new Error(`Resend request failed with status ${response.status}${responseText ? `: ${responseText}` : ''}`);
  }

  return { skipped: false };
}

module.exports = {
  sendCommentNotification,
};
