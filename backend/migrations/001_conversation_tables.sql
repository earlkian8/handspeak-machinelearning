-- HandSpeak fresh migration for Supabase Postgres
-- Run this in the Supabase SQL editor or your SQL client.
-- This acts like migrate:fresh + seed for the current backend schema.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS conversation_attempts CASCADE;
DROP TABLE IF EXISTS conversation_sessions CASCADE;
DROP TABLE IF EXISTS gesture_verifications CASCADE;
DROP TABLE IF EXISTS study_progress CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    nickname TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE study_progress (
    user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    progress JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gesture_verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    target_word TEXT,
    model_type TEXT NOT NULL,
    threshold NUMERIC(5, 3),
    is_match BOOLEAN NOT NULL,
    similarity NUMERIC(8, 6),
    target_similarity NUMERIC(8, 6),
    top_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
    frames JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_data TEXT,
    request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    island_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    prompt_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT conversation_sessions_status_chk
        CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE INDEX conversation_sessions_user_idx
    ON conversation_sessions (user_id);

CREATE INDEX conversation_sessions_user_island_idx
    ON conversation_sessions (user_id, island_id);

CREATE TABLE conversation_attempts (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    prompt_id TEXT NOT NULL,
    expected_word TEXT NOT NULL,
    matched_word TEXT,
    is_correct BOOLEAN NOT NULL,
    confidence NUMERIC(8, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conversation_attempts_session_idx
    ON conversation_attempts (session_id);

CREATE INDEX conversation_attempts_user_idx
    ON conversation_attempts (user_id);

INSERT INTO app_users (email, password_hash)
VALUES (
    'earlkian8@gmail.com',
    crypt('Password-12345', gen_salt('bf', 12))
);

INSERT INTO study_progress (user_id, progress)
SELECT id, '{}'::jsonb
FROM app_users
WHERE email = 'earlkian8@gmail.com';

COMMIT;
