/**
 * Seed data for: Quality and Patient Safety in Low-Resource Health Settings
 * Course + 11 modules + lessons + 1 quiz level + 3 quiz topics + Module 1 quiz questions.
 * Run via POST /api/seed-course (admin only) after applying migration.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const COURSE_SLUG = "quality-patient-safety-low-resource";

export interface SeedResult {
  courseId: string;
  moduleIds: string[];
  levelId: string;
  topicIds: { module1: string; module3: string; module5: string };
}

/** Module titles in order (Orientation + Module 1–10) */
export const MODULE_TITLES = [
  "Orientation",
  "Module 1 – Why Quality and Safety Matter",
  "Module 2 – Systems Thinking and Safety Culture",
  "Module 3 – Introduction to QI and Model for Improvement",
  "Module 4 – Process Mapping and Bottlenecks",
  "Module 5 – Measurement for Improvement",
  "Module 6 – Incident Reporting and Root Cause Analysis",
  "Module 7 – Practical Safety Bundles",
  "Module 8 – Governance and Integration",
  "Module 9 – Capstone Project Charter",
  "Module 10 – Presentations and Reflection",
];

/** Lesson type for each module: overview, video, reading, discussion, quiz (1,3,5), assignment, summary */
function getLessonsForModule(moduleIndex: number): { title: string; lesson_type: string; content: string }[] {
  const hasQuiz = [1, 3, 5].includes(moduleIndex); // Module 1, 3, 5 have graded quizzes
  const base = [
    { title: "Module Overview", lesson_type: "overview" as const, content: "Overview and learning objectives for this module." },
    { title: "Lecture Video", lesson_type: "video" as const, content: "Watch the lecture video for this week (8–12 minutes)." },
    { title: "Required Readings", lesson_type: "reading" as const, content: "Complete the required readings linked in this section." },
    { title: "Discussion", lesson_type: "discussion" as const, content: "Participate in the weekly discussion forum." },
  ];
  if (hasQuiz) {
    base.push({ title: "Quiz", lesson_type: "quiz" as const, content: "Complete the graded quiz for this module." });
  }
  base.push(
    { title: "Assignment", lesson_type: "assignment" as const, content: "Complete and submit the weekly assignment." },
    { title: "Module Summary", lesson_type: "summary" as const, content: "Summary of key points and preview of next week." }
  );
  return base;
}

/** Orientation has different lesson set */
function getOrientationLessons(): { title: string; lesson_type: string; content: string }[] {
  return [
    { title: "Welcome and Getting Started", lesson_type: "overview", content: "Welcome to the course. Review course goals and structure." },
    { title: "How to Navigate This Course", lesson_type: "page", content: "Learn how to complete each week: overview, lecture, readings, discussion, assignment/quiz." },
    { title: "Course Syllabus and Grading Policy", lesson_type: "page", content: "Course description, learning outcomes, assessment and grading policy, passing grade 70%." },
    { title: "Baseline Self-Assessment (Optional)", lesson_type: "page", content: "Optional non-graded survey to help tailor content to your level." },
    { title: "FAQ and Support", lesson_type: "page", content: "Frequently asked questions and how to get help." },
    { title: "Course Calendar and Deadlines", lesson_type: "page", content: "Weekly schedule and assignment deadlines." },
  ];
}

/** Module 1 Quiz: 10 questions from build sheet (Quality and Safety Definitions) */
export const MODULE_1_QUIZ_QUESTIONS = [
  { question_text: "Which of the following best defines patient safety?", option_a: "Following all hospital protocols and policies", option_b: "Freedom from accidental injury; ensuring care doesn't harm the patient", option_c: "Having the most modern equipment and facilities", option_d: "Ensuring patients are satisfied with their care", correct_answer: "B", explanation: "Patient safety is specifically about freedom from accidental injury caused by medical care." },
  { question_text: "A patient receives 10 mL instead of 5 mL of a medication; the patient experiences temporary nausea that resolves in 2 hours. This is best classified as:", option_a: "An error only (no adverse event occurred)", option_b: "A near miss", option_c: "An adverse event (the injection caused temporary harm)", option_d: "A system failure", correct_answer: "C", explanation: "An adverse event is an injury caused by medical management. Temporary harm still counts." },
  { question_text: "A nurse picks up the wrong vial but notices before administering and selects the correct medication. What do we call this?", option_a: "An adverse event", option_b: "A medication error", option_c: "A near miss", option_d: "A system weakness", correct_answer: "C", explanation: "A near miss is an error that doesn't reach the patient or causes no harm." },
  { question_text: "According to systems thinking, why do most adverse events occur in healthcare?", option_a: "Because healthcare workers are careless", option_b: "Because of a single person's mistake", option_c: "Because of a chain of system failures that line up at the same time", option_d: "Because patients don't follow instructions", correct_answer: "C", explanation: "The Swiss cheese model: multiple system failures lining up." },
  { question_text: "According to Oche & Kolawole (2023) on Nigerian facilities, which is NOT mentioned as a major patient safety challenge?", option_a: "Medication labeling and storage issues", option_b: "Infection control and hand hygiene gaps", option_c: "Excessive documentation burden", option_d: "Communication breakdowns and poor handoffs", correct_answer: "C", explanation: "The article focuses on lack of adequate documentation, not excessive." },
  { question_text: "In this course, quality of care is best defined as:", option_a: "The degree to which health services increase the likelihood of desired outcomes", option_b: "How satisfied patients are with their experience", option_c: "Whether the facility has modern technology", option_d: "Compliance with government regulations", correct_answer: "A", explanation: "Quality focuses on whether services achieve desired results." },
  { question_text: "A health worker writes 500 mg instead of 50 mg; the pharmacist dispenses 50 mg correctly. This is:", option_a: "Not an error", option_b: "An error only (no adverse event)", option_c: "An adverse event", option_d: "A near miss", correct_answer: "B", explanation: "An error occurred but was caught before reaching the patient." },
  { question_text: "In low-resource settings, a realistic approach to patient safety improvement is:", option_a: "Wait until you have all modern equipment and unlimited staffing", option_b: "Identify system weaknesses with available resources and test small improvements", option_c: "Focus only on training individual healthcare workers", option_d: "Accept that adverse events are inevitable without modern infrastructure", correct_answer: "B", explanation: "You can improve safety with limited resources using systems thinking and small tests." },
  { question_text: "A PHC has had three maternal deaths from postpartum hemorrhage. Which approach aligns best with systems thinking?", option_a: "Retrain all midwives on PPH management", option_b: "Map the process of postpartum care, identify breakdowns, analyze if delays or missing protocols contributed", option_c: "Replace the staff member on duty during the deaths", option_d: "Purchase more blood transfusion equipment", correct_answer: "B", explanation: "Systems thinking looks at processes and protocols, not just individual competence." },
  { question_text: "What is the ultimate goal of patient safety work in healthcare?", option_a: "To blame healthcare workers for their mistakes", option_b: "To create perfect care where no errors ever occur", option_c: "To systematically reduce the likelihood of errors reaching patients and causing harm", option_d: "To satisfy patients regardless of outcomes", correct_answer: "C", explanation: "Realistic safety work aims to catch errors before they reach patients and reduce harm." },
];

export async function seedQualitySafetyCourse(supabase: SupabaseClient): Promise<SeedResult> {
  const moduleIds: string[] = [];
  let courseId: string;
  let levelId: string;
  const topicIds: { module1: string; module3: string; module5: string } = { module1: "", module3: "", module5: "" };

  // 1. Insert course
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .insert({
      title: "Quality and Patient Safety in Low-Resource Health Settings",
      slug: COURSE_SLUG,
      description: "10-week workforce micro-credential. Practical QI and patient safety tools for Nigerian and similar low-resource health settings.",
      welcome_content: `WELCOME\n\nYou are enrolled in a 10-week workforce micro-credential program focused on practical quality improvement and patient safety in low-resource health settings.\n\nCOURSE GOALS\n- Learn practical tools to identify and solve patient safety problems\n- Apply global best practices (WHO, IHI) to your local context\n- Design and implement a quality improvement project\n- Earn a workforce micro-credential\n\nSTRUCTURE: Orientation + 10 weekly modules (~4-5 hours/week). Total ~50 hours.`,
    })
    .select("id")
    .single();
  if (courseErr || !course) throw new Error(`Course insert failed: ${courseErr?.message}`);
  courseId = course.id;

  // 2. Insert modules and lessons
  for (let i = 0; i < MODULE_TITLES.length; i++) {
    const { data: mod, error: modErr } = await supabase
      .from("course_modules")
      .insert({
        course_id: courseId,
        title: MODULE_TITLES[i],
        order_index: i + 1,
        overview_content: i === 0
          ? "Orientation and Getting Started. Estimated 1-2 hours. Not graded."
          : `Week ${i}: ${MODULE_TITLES[i]}. Estimated 4-5 hours. Complete overview, lecture, readings, discussion, and assignment${[1, 3, 5].includes(i) ? " and quiz" : ""}.`,
      })
      .select("id")
      .single();
    if (modErr || !mod) throw new Error(`Module ${i} insert failed: ${modErr?.message}`);
    moduleIds.push(mod.id);

    const lessons = i === 0 ? getOrientationLessons() : getLessonsForModule(i);
    for (let j = 0; j < lessons.length; j++) {
      const { error: lessonErr } = await supabase.from("lessons").insert({
        module_id: mod.id,
        title: lessons[j].title,
        order_index: j + 1,
        content: lessons[j].content,
        lesson_type: lessons[j].lesson_type,
      });
      if (lessonErr) throw new Error(`Lesson insert failed: ${lessonErr.message}`);
    }
  }

  // 3. Insert assessment level for course quizzes (course_id set => access without token)
  const { data: level, error: levelErr } = await supabase
    .from("assessment_levels")
    .insert({
      name: "Quality and Patient Safety – Quizzes",
      description: "Graded quizzes for the Quality and Patient Safety course (Modules 1, 3, 5).",
      order_index: 0,
      course_id: courseId,
    })
    .select("id")
    .single();
  if (levelErr || !level) throw new Error(`Level insert failed: ${levelErr?.message}`);
  levelId = level.id;

  // 4. Insert 3 quiz topics (Module 1, 3, 5) linked to their course_modules
  const module1Id = moduleIds[1];
  const module3Id = moduleIds[3];
  const module5Id = moduleIds[5];

  const { data: t1, error: t1Err } = await supabase
    .from("assessment_topics")
    .insert({ level_id: levelId, name: "Module 1 – Quiz (Quality and Safety Definitions)", description: "10 MCQs. 70% to pass.", order_index: 1, course_module_id: module1Id })
    .select("id")
    .single();
  if (t1Err || !t1) throw new Error(`Topic 1 insert failed: ${t1Err?.message}`);
  topicIds.module1 = t1.id;

  const { data: t3, error: t3Err } = await supabase
    .from("assessment_topics")
    .insert({ level_id: levelId, name: "Module 3 – Quiz (Model for Improvement)", description: "10 MCQs on QI, PDSA.", order_index: 2, course_module_id: module3Id })
    .select("id")
    .single();
  if (t3Err || !t3) throw new Error(`Topic 3 insert failed: ${t3Err?.message}`);
  topicIds.module3 = t3.id;

  const { data: t5, error: t5Err } = await supabase
    .from("assessment_topics")
    .insert({ level_id: levelId, name: "Module 5 – Quiz (Measurement for Improvement)", description: "10 MCQs on indicators, run charts.", order_index: 3, course_module_id: module5Id })
    .select("id")
    .single();
  if (t5Err || !t5) throw new Error(`Topic 5 insert failed: ${t5Err?.message}`);
  topicIds.module5 = t5.id;

  // 5. Insert Module 1 quiz questions
  for (let q = 0; q < MODULE_1_QUIZ_QUESTIONS.length; q++) {
    const qq = MODULE_1_QUIZ_QUESTIONS[q];
    const { error: qErr } = await supabase.from("quiz_questions").insert({
      topic_id: topicIds.module1,
      question_text: qq.question_text,
      option_a: qq.option_a,
      option_b: qq.option_b,
      option_c: qq.option_c,
      option_d: qq.option_d,
      correct_answer: qq.correct_answer,
      explanation: qq.explanation,
      order_index: q + 1,
    });
    if (qErr) throw new Error(`Quiz question insert failed: ${qErr.message}`);
  }

  // Placeholder questions for Module 3 and 5 (so topic has at least one question; can be replaced later)
  const placeholderQuestion = {
    question_text: "This quiz is being updated with full questions. This is a placeholder.",
    option_a: "Option A",
    option_b: "Option B",
    option_c: "Option C",
    option_d: "Option D",
    correct_answer: "A" as const,
    explanation: "Placeholder.",
  };
  for (const topicId of [topicIds.module3, topicIds.module5]) {
    await supabase.from("quiz_questions").insert({
      topic_id: topicId,
      ...placeholderQuestion,
      order_index: 1,
    });
  }

  return { courseId, moduleIds, levelId, topicIds };
}
