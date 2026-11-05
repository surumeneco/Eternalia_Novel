-- Private author notes are not publication nodes and must never be read by public APIs.
-- No trash, permanent delete, or recovery contract is assumed by this migration.
CREATE TABLE IF NOT EXISTS author_memos (
  id UUID PRIMARY KEY,
  title VARCHAR(150) NOT NULL CHECK (char_length(trim(title)) > 0),
  body TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(tags) = 'array'),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS author_memos_updated_idx ON author_memos (updated_at DESC, id);
