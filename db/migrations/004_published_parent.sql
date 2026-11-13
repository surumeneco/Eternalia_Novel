-- Preserve the published category even while the Tip draft is reassigned.
-- Existing published rows start with their original membership. New snapshots
-- store their parent at the moment of explicit publication.
ALTER TABLE published_snapshots
  ADD COLUMN parent_id UUID NULL REFERENCES content_nodes(id) DEFERRABLE INITIALLY DEFERRED;

UPDATE published_snapshots AS p
  SET parent_id = n.parent_id
  FROM content_nodes AS n
  WHERE p.node_id = n.id;
