-- Migration 015: Add content management fields and indexes
-- Adds order_index to assessment_topics and quiz_questions tables
-- Adds explanation field to quiz_questions

-- Add order_index to assessment_topics if not already present
ALTER TABLE public.assessment_topics
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1;

-- Add explanation and order_index to quiz_questions if not already present
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1;

-- Create indexes for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_assessment_topics_level_order
  ON public.assessment_topics(level_id, order_index);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic_order
  ON public.quiz_questions(topic_id, order_index);

DO $$ BEGIN
  RAISE NOTICE 'Migration 015 complete: content management fields added (order_index, explanation).';
END $$;
