-- Eternalia_Novel PostgreSQL α storage draft.
-- Initial alpha migration. Do not apply to a production database without review.
-- Public API queries must only project published_snapshots, never draft_content.

CREATE TABLE IF NOT EXISTS content_nodes (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN (
    'series','volume','part','chapter','category','tip','tipSection',
    'language','word','grammar','periodization','event'
  )),
  parent_id UUID NULL REFERENCES content_nodes(id) DEFERRABLE INITIALLY DEFERRED,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  draft_content JSONB NOT NULL,
  draft_revision INTEGER NOT NULL CHECK (draft_revision >= 1),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  public_since TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT series_has_no_parent CHECK (kind <> 'series' OR parent_id IS NULL)
);

CREATE TABLE IF NOT EXISTS published_snapshots (
  node_id UUID PRIMARY KEY REFERENCES content_nodes(id) ON DELETE RESTRICT,
  source_draft_revision INTEGER NOT NULL CHECK (source_draft_revision >= 1),
  snapshot JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS content_nodes_parent_order_idx
  ON content_nodes (parent_id, sort_order, id);

CREATE INDEX IF NOT EXISTS content_nodes_public_idx
  ON content_nodes (is_public, public_since);

CREATE INDEX IF NOT EXISTS content_nodes_kind_idx
  ON content_nodes (kind, parent_id);
