-- HandSpeak Phase 2: Response type tracking on conversation_attempts
-- Run this in the Supabase SQL editor once. Idempotent (safe to re-run).
--
-- Adds three columns to conversation_attempts so every scored prompt records
-- what response type was expected, what the user actually produced, and
-- whether the type was correct (independent of the exact word match).

ALTER TABLE conversation_attempts
    ADD COLUMN IF NOT EXISTS response_type_expected TEXT;

ALTER TABLE conversation_attempts
    ADD COLUMN IF NOT EXISTS response_type_actual TEXT;

ALTER TABLE conversation_attempts
    ADD COLUMN IF NOT EXISTS type_correct BOOLEAN;
