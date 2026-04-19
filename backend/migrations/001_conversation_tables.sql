-- HandSpeak Phase 1: Conversation loop tables
-- Run this in the Supabase SQL editor once. Idempotent (safe to re-run).
--
-- What it creates:
--   1. conversation_sessions — one row per Reply Quest session a user starts.
--   2. conversation_attempts — one row per scored prompt within a session.
--
-- Progress for conversation practice is stored in the existing
-- `study_progress.progress` JSONB column under a new `conversation` key,
-- so no migration is required for that table.

CREATE TABLE IF NOT EXISTS conversation_sessions (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT      NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    island_id    TEXT        NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'in_progress',
    prompt_ids   JSONB       NOT NULL DEFAULT '[]'::jsonb,
    summary      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT conversation_sessions_status_chk
        CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE INDEX IF NOT EXISTS conversation_sessions_user_idx
    ON conversation_sessions (user_id);

CREATE INDEX IF NOT EXISTS conversation_sessions_user_island_idx
    ON conversation_sessions (user_id, island_id);


CREATE TABLE IF NOT EXISTS conversation_attempts (
    id            BIGSERIAL PRIMARY KEY,
    session_id    BIGINT      NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    user_id       BIGINT      REFERENCES app_users(id) ON DELETE SET NULL,
    prompt_id     TEXT        NOT NULL,
    expected_word TEXT        NOT NULL,
    matched_word  TEXT,
    is_correct    BOOLEAN     NOT NULL,
    confidence    NUMERIC(8, 6),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversation_attempts_session_idx
    ON conversation_attempts (session_id);

CREATE INDEX IF NOT EXISTS conversation_attempts_user_idx
    ON conversation_attempts (user_id);
