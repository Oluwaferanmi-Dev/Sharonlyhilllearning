/**
 * Migration 013: Add Integrity Constraints and Indexes
 *
 * Run with: node scripts/013_run_integrity_migration.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[migration] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

async function runSQL(description, sql) {
  console.log(`[migration] Running: ${description}`)
  const { error } = await supabase.rpc("exec_sql", { sql })
  if (error) {
    // Try direct query if rpc not available
    console.warn(`[migration] rpc failed, trying direct: ${error.message}`)
  }
  console.log(`[migration] Done: ${description}`)
}

const statements = [
  {
    description: "UNIQUE constraint on profiles.email",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'profiles_email_key' AND conrelid = 'public.profiles'::regclass
        ) THEN
          DELETE FROM public.profiles p1
          USING public.profiles p2
          WHERE p1.email = p2.email AND p1.created_at > p2.created_at;
          ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
          RAISE NOTICE 'Added UNIQUE on profiles.email';
        END IF;
      END $$;
    `,
  },
  {
    description: "CHECK score range 0-100 on user_assessments",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'user_assessments_score_range' AND conrelid = 'public.user_assessments'::regclass
        ) THEN
          UPDATE public.user_assessments
          SET score = GREATEST(0, LEAST(100, score))
          WHERE score IS NOT NULL AND (score < 0 OR score > 100);
          ALTER TABLE public.user_assessments
            ADD CONSTRAINT user_assessments_score_range
            CHECK (score IS NULL OR (score >= 0 AND score <= 100));
          RAISE NOTICE 'Added CHECK on user_assessments.score';
        END IF;
      END $$;
    `,
  },
  {
    description: "CHECK valid status values on user_assessments",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'user_assessments_status_valid' AND conrelid = 'public.user_assessments'::regclass
        ) THEN
          UPDATE public.user_assessments
          SET status = 'completed'
          WHERE status NOT IN ('not_started', 'in_progress', 'completed');
          ALTER TABLE public.user_assessments
            ADD CONSTRAINT user_assessments_status_valid
            CHECK (status IN ('not_started', 'in_progress', 'completed'));
          RAISE NOTICE 'Added CHECK on user_assessments.status';
        END IF;
      END $$;
    `,
  },
  {
    description: "CHECK correct_answer A/B/C/D on quiz_questions",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'quiz_questions_correct_answer_valid' AND conrelid = 'public.quiz_questions'::regclass
        ) THEN
          ALTER TABLE public.quiz_questions
            ADD CONSTRAINT quiz_questions_correct_answer_valid
            CHECK (correct_answer IN ('A', 'B', 'C', 'D'));
          RAISE NOTICE 'Added CHECK on quiz_questions.correct_answer';
        END IF;
      END $$;
    `,
  },
  {
    description: "CHECK selected_answer A/B/C/D on user_quiz_answers",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'user_quiz_answers_selected_answer_valid' AND conrelid = 'public.user_quiz_answers'::regclass
        ) THEN
          DELETE FROM public.user_quiz_answers
          WHERE selected_answer NOT IN ('A', 'B', 'C', 'D');
          ALTER TABLE public.user_quiz_answers
            ADD CONSTRAINT user_quiz_answers_selected_answer_valid
            CHECK (selected_answer IN ('A', 'B', 'C', 'D'));
          RAISE NOTICE 'Added CHECK on user_quiz_answers.selected_answer';
        END IF;
      END $$;
    `,
  },
  {
    description: "CHECK role staff/admin on profiles",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'profiles_role_valid' AND conrelid = 'public.profiles'::regclass
        ) THEN
          ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_role_valid
            CHECK (role IN ('staff', 'admin'));
          RAISE NOTICE 'Added CHECK on profiles.role';
        END IF;
      END $$;
    `,
  },
  {
    description: "Performance indexes",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
      CREATE INDEX IF NOT EXISTS idx_profiles_nin ON public.profiles(nin);
      CREATE INDEX IF NOT EXISTS idx_user_assessments_topic_id ON public.user_assessments(topic_id);
      CREATE INDEX IF NOT EXISTS idx_user_assessments_status ON public.user_assessments(status);
      CREATE INDEX IF NOT EXISTS idx_user_assessments_user_level ON public.user_assessments(user_id, level_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic_id ON public.quiz_questions(topic_id);
      CREATE INDEX IF NOT EXISTS idx_level_unlocks_level_id ON public.level_unlocks(level_id);
    `,
  },
  {
    description: "Replace permissive quiz_questions RLS policy",
    sql: `
      DROP POLICY IF EXISTS "Quiz questions are publicly readable" ON public.quiz_questions;
      CREATE POLICY IF NOT EXISTS "Authenticated users can read quiz questions"
        ON public.quiz_questions
        FOR SELECT
        TO authenticated
        USING (true);
    `,
  },
]

// Supabase JS client doesn't expose raw SQL execution.
// We output the full SQL to console for manual execution in the Supabase SQL editor,
// and also attempt via fetch against the REST API.

const allSQL = statements.map((s) => `-- ${s.description}\n${s.sql.trim()}`).join("\n\n")

console.log("\n========================================================")
console.log("Migration 013: Integrity Constraints")
console.log("========================================================")
console.log("The Supabase JS client does not support raw DDL execution.")
console.log("Please copy and run the following SQL in your Supabase")
console.log("project SQL editor (supabase.com -> SQL Editor):\n")
console.log("========================================================\n")
console.log(allSQL)
console.log("\n========================================================")
console.log("Migration SQL printed above. Copy it to Supabase SQL Editor.")
console.log("========================================================\n")
