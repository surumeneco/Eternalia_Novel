-- Keep deleted content for audit without introducing a fourth publication state.
ALTER TABLE content_nodes ADD COLUMN deleted_at TIMESTAMPTZ NULL;
