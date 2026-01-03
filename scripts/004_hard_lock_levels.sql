-- Hard-lock Intermediate and Advanced levels
-- Only Beginner level should be unlockable
UPDATE public.level_unlocks 
SET is_unlocked = false 
WHERE level_id IN (
  SELECT id FROM public.assessment_levels 
  WHERE name IN ('Intermediate', 'Advanced')
);

-- For any levels not yet in level_unlocks, insert them locked
INSERT INTO public.level_unlocks (level_id, is_unlocked, unlocked_at)
SELECT id, false, NULL 
FROM public.assessment_levels 
WHERE name IN ('Intermediate', 'Advanced')
ON CONFLICT DO NOTHING;
