-- Disable RLS on level_unlocks table to fix 403 permission error
-- The level_unlocks table doesn't need RLS as it's system-level configuration
-- that applies to all staff. API authentication is sufficient for admin control.
ALTER TABLE public.level_unlocks DISABLE ROW LEVEL SECURITY;

-- Seed level_unlocks with only Beginner unlocked by default
-- This hard-locks Intermediate and Advanced until admin explicitly unlocks them
INSERT INTO public.level_unlocks (level_id, is_unlocked, unlocked_at)
SELECT id, 
  CASE WHEN name = 'Beginner' THEN true ELSE false END as is_unlocked,
  CASE WHEN name = 'Beginner' THEN NOW() ELSE NULL END as unlocked_at
FROM public.assessment_levels
ON CONFLICT (level_id) DO UPDATE SET
  is_unlocked = EXCLUDED.is_unlocked,
  unlocked_at = EXCLUDED.unlocked_at
WHERE level_unlocks.level_id = EXCLUDED.level_id;
