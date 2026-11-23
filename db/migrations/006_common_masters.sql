-- Pre-release schema: Tag and Div are independent site-wide master catalogs.
-- No migration of the older string-tag representation is required.
CREATE TABLE common_master_tags (
  id UUID PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL CHECK (length(btrim(group_name)) > 0),
  name VARCHAR(100) NOT NULL CHECK (length(btrim(name)) > 0),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_name, name)
);
CREATE INDEX common_master_tags_order_idx ON common_master_tags (group_name, sort_order, id);

CREATE TABLE common_master_divisions (
  id UUID PRIMARY KEY,
  kind VARCHAR(100) NOT NULL CHECK (length(btrim(kind)) > 0),
  name VARCHAR(100) NOT NULL CHECK (length(btrim(name)) > 0),
  value VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, name)
);
CREATE INDEX common_master_divisions_order_idx ON common_master_divisions (kind, sort_order, id);
