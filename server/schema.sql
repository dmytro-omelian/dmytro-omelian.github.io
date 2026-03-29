CREATE TABLE IF NOT EXISTS blog_post_views (
  slug TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS open_questions (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS open_questions_visibility_sort_idx
  ON open_questions (is_archived, sort_order, updated_at DESC);

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
