-- HandSpeak Phase 4: Island mastery and unlock logic

BEGIN;

CREATE TABLE IF NOT EXISTS island_mastery (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    island_id TEXT NOT NULL,
    
    -- Four-axis mastery model (Scores out of 100)
    comprehension_score INT NOT NULL DEFAULT 0,
    accuracy_score INT NOT NULL DEFAULT 0,
    timing_score INT NOT NULL DEFAULT 0,
    repair_score INT NOT NULL DEFAULT 0,
    
    -- State and Completion
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, island_id)
);

CREATE INDEX IF NOT EXISTS island_mastery_user_idx ON island_mastery(user_id);

-- Trigger to auto-update `updated_at`
CREATE OR REPLACE FUNCTION update_mastery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mastery
BEFORE UPDATE ON island_mastery
FOR EACH ROW EXECUTE PROCEDURE update_mastery_timestamp();

COMMIT;