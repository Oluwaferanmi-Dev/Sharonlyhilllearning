-- Users & Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  nin TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'staff' or 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment Levels
CREATE TABLE public.assessment_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced'
  order_index INTEGER NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  requires_payment BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment Topics
CREATE TABLE public.assessment_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.assessment_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Care Treatment & Services', 'Emergency Management', etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.assessment_topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Assessment Progress
CREATE TABLE public.user_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.assessment_levels(id),
  topic_id UUID REFERENCES public.assessment_topics(id),
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Answers to Quiz Questions
CREATE TABLE public.user_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.user_assessments(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Level Unlocks Table
CREATE TABLE public.level_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.assessment_levels(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(level_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_unlocks ENABLE ROW LEVEL SECURITY;

-- Updated RLS policies to prevent infinite recursion and conflicts
-- RLS Policies for profiles
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_assessments
CREATE POLICY "Users can view their own assessments" ON public.user_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments" ON public.user_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments" ON public.user_assessments
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_quiz_answers
CREATE POLICY "Users can view their own quiz answers" ON public.user_quiz_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz answers" ON public.user_quiz_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for assessment_levels (public read)
CREATE POLICY "Public read access for assessment levels" ON public.assessment_levels
  FOR SELECT USING (true);

-- RLS Policies for assessment_topics (public read)
CREATE POLICY "Assessment topics are publicly readable" ON public.assessment_topics
  FOR SELECT USING (true);

-- RLS Policies for quiz_questions (public read)
CREATE POLICY "Quiz questions are publicly readable" ON public.quiz_questions
  FOR SELECT USING (true);

-- RLS Policies for level_unlocks (admins can manage)
CREATE POLICY "Admins can view level unlocks" ON public.level_unlocks
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can insert level unlocks" ON public.level_unlocks
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update level unlocks" ON public.level_unlocks
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Indexes for performance
CREATE INDEX idx_user_assessments_user_id ON public.user_assessments(user_id);
CREATE INDEX idx_user_assessments_level_id ON public.user_assessments(level_id);
CREATE INDEX idx_user_quiz_answers_user_id ON public.user_quiz_answers(user_id);
CREATE INDEX idx_user_quiz_answers_assessment_id ON public.user_quiz_answers(assessment_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
