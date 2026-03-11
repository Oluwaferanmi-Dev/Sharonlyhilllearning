import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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
      "id, first_name, last_name, email, role, department, created_at, profile_picture_url"
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
    (userLevelAccess || []).map((a: any) => a.level_id)
  );

  const { data: levels } = await supabase
    .from("assessment_levels")
    .select("*")
    .order("order_index");

  const { data: userAssessments } = await supabase
    .from("user_assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const assessmentsByLevel = (levels || []).map((level: AssessmentLevel) => {
    const assessments = (userAssessments || []).filter(
      (a: UserAssessment) => a.level_id === level.id
    );
    const completed = assessments.filter(
      (a: UserAssessment) => a.status === "completed"
    ).length;
    const passed = assessments.filter((a: UserAssessment) => a.passed).length;
    const isLocked = !unlockedLevelIds.has(level.id);

    const total =
      assessments.length > 0 ? Math.max(assessments.length, 14) : 14;

    return {
      level,
      total,
      completed,
      passed,
      inProgress: assessments.find(
        (a: UserAssessment) => a.status === "in_progress"
      ),
      isLocked,
    };
  });

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, message, created_at")
    .eq("is_active", true)
    .not(
      "id",
      "in",
      `(${
        (
          await supabase
            .from("dismissed_announcements")
            .select("announcement_id")
            .eq("user_id", user.id)
        ).data
          ?.map((d) => d.announcement_id)
          .join(",") || ""
      })`
    )
    .order("created_at", { ascending: false });

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

        {/* Header text */}
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
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {/* <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/dashboard/assessments">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
              View All Assessments
            </Button>
          </Link>
          <Link href="/profile">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              size="lg"
            >
              Edit Profile
            </Button>
          </Link>
        </div>
      </div> */}
    </div>
  );
}
