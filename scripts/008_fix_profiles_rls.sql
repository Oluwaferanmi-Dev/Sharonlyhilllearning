-- Drop existing policies using DO block to handle errors
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow profile updates for own profile" ON public.profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Updated policy that only allows users to view their own profile
-- Admin access relies on service role key bypassing RLS
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Recreate the other necessary policies
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow profile updates for own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
