-- Remove the old incomplete topics from script 002
-- Keep only the 14 comprehensive Cherith Training topics from script 005

-- Simplified cleanup to remove all old topics and questions before fresh insert
-- This ensures no duplicates when we run the comprehensive 14-topic script

DELETE FROM public.quiz_questions 
WHERE topic_id IN (
  SELECT id FROM public.assessment_topics 
  WHERE level_id = (SELECT id FROM public.assessment_levels WHERE name = 'Beginner' LIMIT 1)
);

DELETE FROM public.assessment_topics 
WHERE level_id = (SELECT id FROM public.assessment_levels WHERE name = 'Beginner' LIMIT 1);

-- Delete duplicate topics (keep the comprehensive ones from script 005)
-- DELETE FROM public.assessment_topics 
-- WHERE level_id = (SELECT id FROM public.assessment_levels WHERE name = 'Beginner')
-- AND name IN ('Patient Safety Standards', 'Staff Qualifications', 'Infection Control')
-- OR (
--   name IN ('Care Treatment & Services (CTS)', 'Emergency Management (EM)')
--   AND id NOT IN (
--     SELECT MAX(id) FROM public.assessment_topics 
--     WHERE level_id = (SELECT id FROM public.assessment_levels WHERE name = 'Beginner')
--     AND name IN ('Care Treatment & Services (CTS)', 'Emergency Management (EM)')
--     GROUP BY name
--   )
-- );
