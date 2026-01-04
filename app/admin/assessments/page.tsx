import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminAssessmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: allAssessments } = await supabase
    .from("user_assessments")
    .select("*")
    .order("updated_at", { ascending: false });

  // Fetch profiles separately to avoid foreign key issues
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email");

  // Fetch assessment levels separately
  const { data: assessmentLevels } = await supabase
    .from("assessment_levels")
    .select("id, name");

  // Map the data together
  const enrichedAssessments =
    allAssessments?.map((assessment: any) => ({
      ...assessment,
      profiles: profiles?.find((p: any) => p.id === assessment.user_id),
      assessment_levels: assessmentLevels?.find(
        (l: any) => l.id === assessment.level_id
      ),
    })) || [];

  const completedAssessments =
    enrichedAssessments.filter((a) => a.status === "completed") || [];
  const inProgressAssessments =
    enrichedAssessments.filter((a) => a.status === "in_progress") || [];
  console.log(enrichedAssessments);

  return (
    <div className="px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Assessment Monitoring
          </h1>
          <p className="text-slate-600 mt-2">
            Track staff progress across all assessments
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{allAssessments?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {inProgressAssessments.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {completedAssessments.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {completedAssessments.length > 0
                ? Math.round(
                    completedAssessments.reduce(
                      (sum, a) => sum + (a.score || 0),
                      0
                    ) / completedAssessments.length
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assessment Activity</CardTitle>
          <CardDescription>
            Latest assessment submissions and completions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">
                    Staff Member
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">
                    Assessment Level
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">
                    Score
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrichedAssessments?.slice(0, 10).map((assessment: any) => (
                  <tr key={assessment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {assessment.profiles?.first_name}{" "}
                      {assessment.profiles?.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {assessment.assessment_levels?.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          assessment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : assessment.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {assessment.status === "completed"
                          ? "Completed"
                          : assessment.status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {assessment.score ? `${assessment.score}%` : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(assessment.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
