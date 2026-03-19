import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssessmentProgress } from "@/components/assessment-progress";
import { AssessmentCard } from "@/components/assessment-card";
import { AnnouncementsDisplay } from "@/components/announcements-display";

interface AssessmentLevel {
  id: string;
  name: string;
  description?: string;
}

interface UserAssessment {
  id: string;
  level_id: string;
  status: string;
  passed: boolean;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  created_at: string;
  profile_picture_url: string | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const adminClient = createAdminClient();
  const { data: profileData } = await adminClient
    .from("profiles")
    .select(
      "id, first_name, last_name, email, role, department, created_at, profile_picture_url",
    )
    .eq("id", user.id)
    .single();

  const profile: Profile = profileData || {
    id: user.id,
    first_name: "Student",
    last_name: "",
    email: user.email || "",
    role: "user",
    department: "",
    created_at: new Date().toISOString(),
    profile_picture_url: null,
  };

  // Get user's token-based access to levels
  const { data: userLevelAccess } = await supabase
    .from("user_level_access")
    .select("level_id")
    .eq("user_id", user.id);

  const unlockedLevelIds = new Set(
    (userLevelAccess || []).map((a: any) => a.level_id),
  );

  const { data: levels } = await supabase
    .from("assessment_levels")
    .select("*")
    .order("order_index");

  // BUG FIX: fetch the real topic count per level from the database.
  const topicCountsByLevel: Record<string, number> = {};
  if (levels && levels.length > 0) {
    const { data: topicCounts } = await supabase
      .from("assessment_topics")
      .select("level_id");

    (topicCounts || []).forEach((row: any) => {
      topicCountsByLevel[row.level_id] =
        (topicCountsByLevel[row.level_id] || 0) + 1;
    });
  }

  const { data: userAssessments } = await supabase
    .from("user_assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const assessmentsByLevel = (levels || []).map((level: AssessmentLevel) => {
    const assessments = (userAssessments || []).filter(
      (a: UserAssessment) => a.level_id === level.id,
    );
    const completed = assessments.filter(
      (a: UserAssessment) => a.status === "completed",
    ).length;
    const passed = assessments.filter((a: UserAssessment) => a.passed).length;
    const isLocked = !unlockedLevelIds.has(level.id);

    // BUG FIX: use the real topic count from the DB instead of the hardcoded 14
    const total = topicCountsByLevel[level.id] ?? 0;

    return {
      level,
      total,
      completed,
      passed,
      inProgress: assessments.find(
        (a: UserAssessment) => a.status === "in_progress",
      ),
      isLocked,
    };
  });

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, description")
    .order("title")
    .limit(5);

  // Fixed in bug 3 — two separate queries, filtered in JS
  const { data: dismissedData } = await supabase
    .from("dismissed_announcements")
    .select("announcement_id")
    .eq("user_id", user.id);

  const dismissedIds = (dismissedData || []).map((d: any) => d.announcement_id);

  const { data: allAnnouncements } = await supabase
    .from("announcements")
    .select("id, title, message, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const announcements = (allAnnouncements || []).filter(
    (a: any) => !dismissedIds.includes(a.id),
  );

  return (
    <div className="px-6 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-4">
        {profile?.profile_picture_url && (
          <img
            src={profile.profile_picture_url || "/placeholder.svg"}
            alt={`${profile?.first_name} profile`}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-blue-600 shadow-lg flex-shrink-0"
          />
        )}
        {!profile?.profile_picture_url && (
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-3xl md:text-4xl border-4 border-blue-600 shadow-lg flex-shrink-0">
            {profile?.first_name?.[0]}
            {profile?.last_name?.[0]}
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            Welcome, {profile?.first_name || "Student"}
          </h1>
          <p className="text-slate-600">
            Continue your learning journey with our comprehensive assessments
          </p>
        </div>
      </div>

      {announcements && announcements.length > 0 && (
        <AnnouncementsDisplay announcements={announcements} />
      )}

      {/* Courses */}
      {courses && courses.length > 0 && (
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <CardTitle>My Courses</CardTitle>
                </div>
                <Link href="/dashboard/courses">
                  <Button variant="outline" size="sm">
                    View all
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Continue your learning with structured courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.map(
                  (course: {
                    id: string;
                    title: string;
                    description?: string;
                  }) => (
                    <Link
                      key={course.id}
                      href={`/dashboard/courses/${course.id}`}
                    >
                      <div className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                        <p className="font-medium text-slate-900">
                          {course.title}
                        </p>
                        {course.description && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Overview */}
      <AssessmentProgress assessmentsByLevel={assessmentsByLevel} />

      {/* Assessment Levels */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Assessment Levels</CardTitle>
            <CardDescription>
              Progress through each level to complete your training
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {assessmentsByLevel.map(
                ({ level, total, completed, isLocked }) => (
                  <AssessmentCard
                    key={level.id}
                    levelId={level.id}
                    name={level.name}
                    description={level.description}
                    completedCount={completed}
                    totalTopics={total}
                    isLocked={isLocked}
                  />
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
