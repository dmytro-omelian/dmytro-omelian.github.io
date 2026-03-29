CREATE TABLE IF NOT EXISTS blog_post_views (
  slug TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_post_comments (
  id BIGSERIAL PRIMARY KEY,
  post_slug TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE blog_post_comments
  ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE blog_post_comments
  ADD COLUMN IF NOT EXISTS author_email TEXT;

CREATE INDEX IF NOT EXISTS blog_post_comments_post_slug_created_idx
  ON blog_post_comments (post_slug, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS blog_post_comments_created_idx
  ON blog_post_comments (created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS open_questions (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE open_questions
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE open_questions
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS open_questions_visibility_sort_idx
  ON open_questions (is_archived, sort_order, updated_at DESC);

CREATE INDEX IF NOT EXISTS open_questions_public_visibility_sort_idx
  ON open_questions (is_archived, is_hidden, sort_order, updated_at DESC);

CREATE TABLE IF NOT EXISTS open_question_logs (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES open_questions(id) ON DELETE CASCADE,
  note_markdown TEXT NOT NULL,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS open_question_logs_question_logged_idx
  ON open_question_logs (question_id, logged_at DESC, id DESC);
