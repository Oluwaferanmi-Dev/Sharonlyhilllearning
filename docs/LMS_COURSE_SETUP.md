# LMS Course Setup: Quality and Patient Safety

## 1. Apply the database migration

Run the SQL migration in your Supabase project (SQL Editor or `supabase db push` if using Supabase CLI):

**File:** `supabase/migrations/20260114000000_add_lms_course_schema.sql`

This creates:

- `courses` – course title, slug, description, welcome_content
- `course_modules` – modules within a course (e.g. Orientation, Module 1–10)
- `lessons` – lesson pages (overview, video, reading, quiz, assignment, summary)
- Adds `course_id` to `assessment_levels` (optional; used for course quiz levels)
- Adds `course_module_id` to `assessment_topics` (links a quiz topic to a module)

## 2. Seed the Quality and Patient Safety course

After the migration is applied, seed the course **once** (admin only):

1. Log in as an **admin** user.
2. Call the seed API:

   ```bash
   curl -X POST https://your-app-url/api/seed-course \
     -H "Cookie: <your-admin-session-cookie>"
   ```

   Or from the browser console while logged in as admin:

   ```js
   fetch('/api/seed-course', { method: 'POST', credentials: 'include' }).then(r => r.json()).then(console.log)
   ```

The seed script:

- Inserts one **course**: "Quality and Patient Safety in Low-Resource Health Settings"
- Inserts **11 modules**: Orientation, Module 1 – Why Quality and Safety Matter, … Module 10 – Presentations and Reflection
- Inserts **lessons** per module (overview, video, readings, discussion, quiz where applicable, assignment, summary)
- Creates one **assessment level** for course quizzes (with `course_id` set so any logged-in user can take quizzes without a token)
- Creates **3 assessment topics** (Module 1, 3, 5 quizzes) linked to their modules via `course_module_id`
- Inserts **10 quiz questions** for Module 1 (Quality and Safety Definitions); Module 3 and 5 get one placeholder question each (replace later with full question set)

## 3. Where the course appears

- **Dashboard:** "My Courses" card (if any courses exist) and nav link **Courses**
- **Courses list:** `/dashboard/courses`
- **Course detail:** `/dashboard/courses/[courseId]` – welcome content and list of modules
- **Module:** `/dashboard/courses/[courseId]/modules/[moduleId]` – overview and list of lessons; "Take Quiz" for Module 1, 3, 5 links to the existing quiz flow
- **Lesson:** `/dashboard/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]` – lesson content; quiz lessons show a "Take Quiz" button

Course quizzes use the existing assessment flow (`/dashboard/assessments/[levelId]/[topicId]`). Access to that level is granted for any **logged-in user** when the level has `course_id` set (no token required).

## 4. Tables used

| Table               | Purpose |
|---------------------|--------|
| `courses`           | One row per course (title, slug, welcome content). |
| `course_modules`    | One row per module (title, order_index, overview_content). |
| `lessons`           | One row per lesson (title, order_index, content, lesson_type). |
| `assessment_levels` | Existing; optional `course_id` links a level to a course for quiz access. |
| `assessment_topics` | Existing; optional `course_module_id` links a quiz topic to a module. |
| `quiz_questions`    | Existing; questions for each quiz topic. |

## 5. Adding more courses later

1. Insert into `courses`.
2. Insert into `course_modules` (course_id).
3. Insert into `lessons` (module_id, title, content, lesson_type).
4. Optionally create an `assessment_level` with `course_id` and `assessment_topics` with `course_module_id` for graded quizzes.
