-- HandSpeak Phase 3: Multi-turn conversation chain sessions
-- Run in the Supabase SQL editor once. Idempotent (safe to re-run).
--
-- conversation_chain_sessions stores one row per multi-turn chain a user
-- starts. Turn results accumulate in the `transcript` JSONB array.
-- The `summary` column is filled with coherence scores on completion.

CREATE TABLE IF NOT EXISTS conversation_chain_sessions (
    id              BIGSERIAL   PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    island_id       TEXT        NOT NULL,
    chain_id        TEXT        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'in_progress',
    current_turn    INT         NOT NULL DEFAULT 0,
    turns_snapshot  JSONB       NOT NULL DEFAULT '[]'::jsonb,
    transcript      JSONB       NOT NULL DEFAULT '[]'::jsonb,
    summary         JSONB       NOT NULL DEFAULT '{}'::jsonb,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    CONSTRAINT chain_sessions_status_chk
        CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE INDEX IF NOT EXISTS chain_sessions_user_idx
    ON conversation_chain_sessions (user_id);

CREATE INDEX IF NOT EXISTS chain_sessions_user_island_idx
    ON conversation_chain_sessions (user_id, island_id);
