import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

interface LevelUnlock {
  level_id: string;
  is_unlocked: boolean;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileData?.role === "admin") {
    redirect("/admin");
  }

  // Fetch user profile
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id);
  const profile = profiles?.[0];

  const { data: levelUnlocks } = await supabase
    .from("level_unlocks")
    .select("level_id, is_unlocked");

  const unlockedLevelIds = new Set(
    (levelUnlocks || [])
      .filter((u: LevelUnlock) => u.is_unlocked)
      .map((u: LevelUnlock) => u.level_id)
  );

  // Fetch assessment levels
  const { data: levels } = await supabase
    .from("assessment_levels")
    .select("*")
    .order("order_index");

  // Fetch user assessments
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

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
          Welcome, {profile?.first_name || "Student"}
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Continue your learning journey with our comprehensive assessments
        </p>
      </div>

      {/* Progress Overview */}
      <AssessmentProgress assessmentsByLevel={assessmentsByLevel} />

      {/* Assessment Levels */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Assessment Levels
            </CardTitle>
            <CardDescription>
              Progress through each level to complete your training
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
          <Link href="/dashboard/assessments" className="w-full">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
              size="lg"
            >
              View All Assessments
            </Button>
          </Link>
          <Link href="/profile" className="w-full">
            <Button
              variant="outline"
              className="w-full bg-transparent text-sm sm:text-base"
              size="lg"
            >
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
