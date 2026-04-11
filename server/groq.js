const Groq = require('groq-sdk');
const { createHttpError } = require('./db');

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = (process.env.GROQ_API_KEY || '').trim();

    if (!apiKey) {
      throw createHttpError(503, 'Groq API key is not configured.');
    }

    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

async function suggestBookTags(title, author, existingTagNames) {
  const client = getGroqClient();

  const existingList = existingTagNames.length > 0
    ? existingTagNames.join(', ')
    : '(none yet)';

  const completion = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content: [
          'You are a book categorization assistant. Given a book title and author, suggest the 3-4 most important topic tags that best describe the book.',
          '',
          `Existing tags in the library: ${existingList}`,
          '',
          'Rules:',
          '- Return only the 3-4 most relevant tags. Prioritize the ones that best capture what the book is about.',
          '- Prefer reusing tags from the existing list above.',
          '- You may suggest up to 1 new tag only if the book clearly fits a category not represented.',
          '- All tags must be lowercase.',
          '- Return ONLY a JSON array of strings. No explanation, no markdown, no extra text.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Title: "${title}"\nAuthor: "${author}"`,
      },
    ],
  });

  const raw = (completion.choices[0]?.message?.content || '').trim();

  let tags;

  try {
    tags = JSON.parse(raw);
  } catch {
    const matches = raw.match(/"([^"]+)"/g);

    if (matches && matches.length > 0) {
      tags = matches.map((m) => m.replace(/"/g, ''));
    } else {
      throw createHttpError(502, `Groq returned unparseable response: ${raw}`);
    }
  }

  if (!Array.isArray(tags)) {
    throw createHttpError(502, `Groq returned non-array response: ${raw}`);
  }

  const seen = new Set();
  const normalized = [];

  for (const tag of tags) {
    const t = String(tag).trim().toLowerCase();

    if (t && !seen.has(t)) {
      seen.add(t);
      normalized.push(t);
    }
  }

  return normalized;
}

module.exports = { suggestBookTags };
