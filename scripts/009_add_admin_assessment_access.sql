-- Add RLS policies to allow admins to view all user assessments and quiz answers

-- Allow admins to view all user assessments
CREATE POLICY "Admins can view all assessments" ON public.user_assessments
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to view all quiz answers
CREATE POLICY "Admins can view all quiz answers" ON public.user_quiz_answers
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
