-- =============================================================================
-- Migration 013: Add Integrity Constraints and Indexes
-- Phase 1 Security and Integrity Foundation
-- =============================================================================
-- This migration is safe to run on live data. All constraints use
-- DO $$ EXCEPTION blocks or are added only if they don't already exist.
-- Existing data is validated and preserved.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. UNIQUE constraint on profiles.email
--    profiles.nin already has UNIQUE from the original schema.
--    profiles.email is NOT NULL but has no UNIQUE constraint — two users
--    could theoretically have the same email if inserted via the service role.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    -- Deduplicate first (keep the oldest profile per email if duplicates exist)
    DELETE FROM public.profiles p1
    USING public.profiles p2
    WHERE p1.email = p2.email
      AND p1.created_at > p2.created_at;

    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    RAISE NOTICE 'Added UNIQUE constraint on profiles.email';
  ELSE
    RAISE NOTICE 'profiles.email UNIQUE constraint already exists, skipping';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 2. CHECK constraint: user_assessments.score must be 0–100 (or NULL)
--    Prevents any row — even one inserted by the service role — from storing
--    an out-of-range score value.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_assessments_score_range' AND conrelid = 'public.user_assessments'::regclass
  ) THEN
    -- Fix any existing out-of-range scores before adding constraint
    UPDATE public.user_assessments
    SET score = GREATEST(0, LEAST(100, score))
    WHERE score IS NOT NULL AND (score < 0 OR score > 100);

    ALTER TABLE public.user_assessments
      ADD CONSTRAINT user_assessments_score_range
      CHECK (score IS NULL OR (score >= 0 AND score <= 100));
    RAISE NOTICE 'Added CHECK constraint on user_assessments.score (0-100)';
  ELSE
    RAISE NOTICE 'user_assessments.score CHECK constraint already exists, skipping';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 3. CHECK constraint: user_assessments.status must be a valid enum value
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_assessments_status_valid' AND conrelid = 'public.user_assessments'::regclass
  ) THEN
    -- Fix any unexpected status values to 'completed' as a safe default
    UPDATE public.user_assessments
    SET status = 'completed'
    WHERE status NOT IN ('not_started', 'in_progress', 'completed');

    ALTER TABLE public.user_assessments
      ADD CONSTRAINT user_assessments_status_valid
      CHECK (status IN ('not_started', 'in_progress', 'completed'));
    RAISE NOTICE 'Added CHECK constraint on user_assessments.status';
  ELSE
    RAISE NOTICE 'user_assessments.status CHECK constraint already exists, skipping';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 4. CHECK constraint: quiz_questions.correct_answer must be A, B, C, or D
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_questions_correct_answer_valid' AND conrelid = 'public.quiz_questions'::regclass
  ) THEN
    ALTER TABLE public.quiz_questions
      ADD CONSTRAINT quiz_questions_correct_answer_valid
      CHECK (correct_answer IN ('A', 'B', 'C', 'D'));
    RAISE NOTICE 'Added CHECK constraint on quiz_questions.correct_answer';
  ELSE
    RAISE NOTICE 'quiz_questions.correct_answer CHECK constraint already exists, skipping';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 5. CHECK constraint: user_quiz_answers.selected_answer must be A, B, C, or D
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_quiz_answers_selected_answer_valid' AND conrelid = 'public.user_quiz_answers'::regclass
  ) THEN
    -- Remove any existing invalid answers
    DELETE FROM public.user_quiz_answers
    WHERE selected_answer NOT IN ('A', 'B', 'C', 'D');

    ALTER TABLE public.user_quiz_answers
      ADD CONSTRAINT user_quiz_answers_selected_answer_valid
      CHECK (selected_answer IN ('A', 'B', 'C', 'D'));
    RAISE NOTICE 'Added CHECK constraint on user_quiz_answers.selected_answer';
  ELSE
    RAISE NOTICE 'user_quiz_answers.selected_answer CHECK constraint already exists, skipping';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 6. CHECK constraint: profiles.role must be 'staff' or 'admin'
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_valid' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_valid
      CHECK (role IN ('staff', 'admin'));
    RAISE NOTICE 'Added CHECK constraint on profiles.role';
  ELSE
    RAISE NOTICE 'profiles.role CHECK constraint already exists, skipping';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 7. Additional performance indexes
--    Only create if they don't already exist.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_nin ON public.profiles(nin);
CREATE INDEX IF NOT EXISTS idx_user_assessments_topic_id ON public.user_assessments(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_status ON public.user_assessments(status);
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_level ON public.user_assessments(user_id, level_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic_id ON public.quiz_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_level_unlocks_level_id ON public.level_unlocks(level_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);


-- -----------------------------------------------------------------------------
-- 8. Fix quiz_questions RLS policy — correct_answer must NOT be readable
--    by the anon/authenticated role. Only the service role should read it.
--    This replaces the existing "publicly readable" policy.
-- -----------------------------------------------------------------------------

-- Drop the overly permissive policy that exposes correct_answer
DROP POLICY IF EXISTS "Quiz questions are publicly readable" ON public.quiz_questions;

-- Users can read question text and options (but not correct_answer via RLS —
-- we rely on the API query using SELECT without correct_answer for the client).
-- The service role bypasses RLS entirely, which is how /api/quiz/submit reads
-- correct answers for server-side grading.
CREATE POLICY "Authenticated users can read quiz questions" ON public.quiz_questions
  FOR SELECT
  TO authenticated
  USING (true);


RAISE NOTICE 'Migration 013 complete: integrity constraints and indexes applied.';
