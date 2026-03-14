import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileText, Video, BookOpen, ClipboardList, MessageSquare, HelpCircle, CheckCircle } from "lucide-react";

const lessonTypeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: HelpCircle,
  video: Video,
  reading: BookOpen,
  assignment: ClipboardList,
  discussion: MessageSquare,
  quiz: CheckCircle,
  summary: FileText,
  page: FileText,
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;
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

  const { data: module_, error: modError } = await supabase
    .from("course_modules")
    .select("id, title, order_index, overview_content")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .single();
  if (modError || !module_) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, lesson_type")
    .eq("module_id", moduleId)
    .order("order_index");

  // Resolve quiz topic for this module (for "Take Quiz" link)
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

  return (
    <div className="px-6 py-12 space-y-8">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/dashboard/courses" className="hover:text-slate-900">Courses</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/courses/${courseId}`} className="hover:text-slate-900">{course.title}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{module_.title}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{module_.title}</h1>
        {module_.overview_content && (
          <p className="mt-2 text-slate-600 whitespace-pre-wrap">{module_.overview_content}</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Lessons</h2>
        <div className="space-y-2">
          {(lessons || []).map((lesson) => {
            const Icon = lessonTypeIcon[lesson.lesson_type] || FileText;
            const isQuiz = lesson.lesson_type === "quiz" && quizTopic;
            return (
              <Card key={lesson.id} className="border-slate-200">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-medium">
                          {isQuiz ? (
                            <Link
                              href={`/dashboard/assessments/${level?.id}/${quizTopic.id}`}
                              className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            >
                              {lesson.title} – Take quiz
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
                              className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            >
                              {lesson.title}
                            </Link>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    {isQuiz ? (
                      <Link href={`/dashboard/assessments/${level?.id}/${quizTopic.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Take Quiz</Button>
                      </Link>
                    ) : (
                      <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}>
                        <Button variant="ghost" size="sm">Open</Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
