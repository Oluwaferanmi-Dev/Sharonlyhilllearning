-- LMS Course structure: courses -> course_modules -> lessons
-- Quizzes reuse assessment_levels (with course_id) + assessment_topics (with course_module_id) + quiz_questions

-- 1. Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  welcome_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Course modules (e.g. Orientation, Module 1, ...)
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  overview_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);

-- 3. Lessons (pages within a module: overview, reading, video, quiz link, etc.)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  content TEXT,
  lesson_type TEXT NOT NULL DEFAULT 'page' CHECK (lesson_type IN ('overview', 'video', 'reading', 'assignment', 'discussion', 'quiz', 'summary', 'page')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);

-- 4. Link assessment_levels to course (for course quizzes - one level per course)
ALTER TABLE assessment_levels ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_levels_course_id ON assessment_levels(course_id);

-- 5. Link assessment_topics to course_module (so we know which module a quiz belongs to)
ALTER TABLE assessment_topics ADD COLUMN IF NOT EXISTS course_module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_topics_course_module_id ON assessment_topics(course_module_id);

-- RLS (optional - enable if you use RLS on these tables)
-- For now, rely on app-level auth; service role can read/write all.

COMMENT ON TABLE courses IS 'LMS courses (e.g. Quality and Patient Safety)';
COMMENT ON TABLE course_modules IS 'Modules within a course (e.g. Orientation, Module 1)';
COMMENT ON TABLE lessons IS 'Lesson pages within a module (overview, readings, quiz link, etc.)';
COMMENT ON COLUMN assessment_levels.course_id IS 'If set, this level holds quizzes for this course; access allowed for any enrolled/logged-in user';
COMMENT ON COLUMN assessment_topics.course_module_id IS 'If set, this topic is the quiz for this course module';
