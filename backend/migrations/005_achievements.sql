-- Migration 005: User Achievements
-- Run with: python migrate.py

CREATE TABLE IF NOT EXISTS user_achievements (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    achievement_id  TEXT    NOT NULL,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_achievements_unique UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS user_achievements_user_idx
    ON user_achievements (user_id);
