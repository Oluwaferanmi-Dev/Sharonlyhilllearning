-- Migration 014: Enforce single-attempt policy
-- Adds a partial unique index to prevent duplicate completed assessments
-- Adds started_at timestamp tracking

-- Add started_at if not already present (may have been added in previous migrations)
ALTER TABLE public.user_assessments
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Use a partial unique index instead of constraint for PostgreSQL compatibility
-- This ensures only ONE completed attempt per user per topic (status must equal 'completed')
-- Earlier in_progress attempts don't violate the constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_completed_attempt_per_topic 
ON public.user_assessments(user_id, topic_id) 
WHERE status = 'completed';

-- Index to optimize checking for existing completed attempts
CREATE INDEX IF NOT EXISTS idx_user_assessments_completed 
  ON public.user_assessments(user_id, topic_id, status) 
  WHERE status = 'completed';

-- Index for progress calculation queries
CREATE INDEX IF NOT EXISTS idx_user_assessments_status_by_level 
  ON public.user_assessments(level_id, status);

DO $$ BEGIN
  RAISE NOTICE 'Migration 014 complete: single-attempt policy enforced with partial unique index on (user_id, topic_id) WHERE status = completed.';
END $$;
