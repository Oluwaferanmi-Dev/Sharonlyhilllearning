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
import { ChevronRight, BookOpen } from "lucide-react";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, slug, description, welcome_content")
    .eq("id", courseId)
    .single();

  if (courseError || !course) notFound();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, title, order_index, overview_content")
    .eq("course_id", courseId)
    .order("order_index");

  return (
    <div className="px-6 py-12 space-y-8">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/dashboard/courses" className="hover:text-slate-900">
          Courses
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{course.title}</span>
      </div>

      <div className="prose prose-slate max-w-none">
        <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
        {course.description && (
          <p className="text-slate-600 text-lg mt-2">{course.description}</p>
        )}
        {course.welcome_content && (
          <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap text-slate-700">
            {course.welcome_content}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Modules</h2>
        <div className="space-y-3">
          {(modules || []).map((mod) => (
            <Card key={mod.id} className="border-slate-200">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        <Link
                          href={`/dashboard/courses/${courseId}/modules/${mod.id}`}
                          className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                          {mod.title}
                        </Link>
                      </CardTitle>
                      {mod.overview_content && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {mod.overview_content}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/courses/${courseId}/modules/${mod.id}`}
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="sm">
                      Open <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
