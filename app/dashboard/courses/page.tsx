import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, slug, description")
    .order("title");

  if (error) {
    return (
      <div className="px-6 py-12">
        <p className="text-red-600">Failed to load courses.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
        <p className="text-slate-600 mt-1">
          Browse and continue your learning
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {(courses || []).map((course) => (
          <Card key={course.id} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg">
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      {course.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {course.description || "No description."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/courses/${course.id}`}>
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Open course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!courses || courses.length === 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <p className="text-amber-900">
              No courses available yet. Courses will appear here once they are
              published.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
