import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const { courseId, moduleId, lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .single();
  if (!course) notFound();

  const { data: module_ } = await supabase
    .from("course_modules")
    .select("id, title")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .single();
  if (!module_) notFound();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, content, lesson_type")
    .eq("id", lessonId)
    .eq("module_id", moduleId)
    .single();
  if (lessonError || !lesson) notFound();

  // If this lesson is a quiz, we could redirect to the quiz or show a link (handled in module page)
  const { data: level } = await supabase
    .from("assessment_levels")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();
  const { data: quizTopic } = level
    ? await supabase
        .from("assessment_topics")
        .select("id")
        .eq("course_module_id", moduleId)
        .eq("level_id", level.id)
        .maybeSingle()
    : { data: null };

  const isQuizLesson = lesson.lesson_type === "quiz";

  return (
    <div className="px-6 py-12 space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/dashboard/courses" className="hover:text-slate-900">Courses</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/courses/${courseId}`} className="hover:text-slate-900">{course.title}</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}`} className="hover:text-slate-900">{module_.title}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{lesson.title}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>

      {isQuizLesson && quizTopic && level && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-slate-700 mb-3">Complete the graded quiz for this module.</p>
          <Link href={`/dashboard/assessments/${level.id}/${quizTopic.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700">Take Quiz</Button>
          </Link>
        </div>
      )}

      {lesson.content && (
        <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
          {lesson.content}
        </div>
      )}
    </div>
  );
}
