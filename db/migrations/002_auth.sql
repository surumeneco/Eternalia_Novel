-- Ephemeral OAuth state and opaque hashed author sessions. No Discord tokens stored.
CREATE TABLE IF NOT EXISTS oauth_states (
  state_digest CHAR(64) PRIMARY KEY,
  code_verifier VARCHAR(128) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS author_sessions (
  session_digest CHAR(64) PRIMARY KEY,
  discord_user_id VARCHAR(32) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS oauth_states_expiry_idx ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS author_sessions_expiry_idx ON author_sessions(expires_at);
