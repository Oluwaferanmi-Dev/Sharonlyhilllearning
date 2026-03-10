-- Migration 014: Enforce single-attempt policy
-- Adds a UNIQUE constraint to prevent duplicate completed assessments
-- Adds started_at timestamp tracking

-- Add started_at if not already present (may have been added in previous migrations)
ALTER TABLE public.user_assessments
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add UNIQUE constraint to enforce single completed attempt per user/topic
-- This prevents a user from submitting multiple completed attempts for the same topic
ALTER TABLE public.user_assessments
ADD CONSTRAINT unique_completed_attempt_per_topic UNIQUE (user_id, topic_id) NULLS NOT DISTINCT;

-- Index to optimize checking for existing completed attempts
CREATE INDEX IF NOT EXISTS idx_user_assessments_completed 
  ON public.user_assessments(user_id, topic_id, status) 
  WHERE status = 'completed';

-- Index for progress calculation queries
CREATE INDEX IF NOT EXISTS idx_user_assessments_status_by_level 
  ON public.user_assessments(level_id, status);

DO $$ BEGIN
  RAISE NOTICE 'Migration 014 complete: single-attempt policy enforced with unique constraint on (user_id, topic_id) for completed assessments.';
END $$;
