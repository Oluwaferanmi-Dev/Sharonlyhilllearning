import { createAdminClient } from "@/lib/supabase/server";
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
  const supabase = createAdminClient();

  const { data: allAssessments, error } = await supabase
    .from("user_assessments")
    .select(
      `
      *,
      profiles(id, first_name, last_name, email),
      assessment_levels(id, name)
    `
    )
    .order("updated_at", { ascending: false });

  console.log("[v0] Assessments Query - Error:", error);
  console.log(
    "[v0] Assessments Query - Data:",
    allAssessments?.length,
    "records"
  );
  if (allAssessments && allAssessments.length > 0) {
    console.log("[v0] First Assessment:", allAssessments[0]);
  }

  // Map the data (already enriched from Supabase joins)
  const enrichedAssessments = allAssessments || [];

  const completedAssessments =
    enrichedAssessments.filter((a) => a.status === "completed") || [];
  const inProgressAssessments =
    enrichedAssessments.filter((a) => a.status === "in_progress") || [];

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
          {/* Desktop Table */}
          <div className="hidden lg:block rounded-lg border border-slate-200 overflow-hidden">
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {enrichedAssessments?.slice(0, 10).map((assessment: any) => (
              <div
                key={assessment.id}
                className="border border-slate-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {assessment.profiles?.first_name}{" "}
                      {assessment.profiles?.last_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {assessment.assessment_levels?.name}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
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
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-600">Score:</span>
                  <span className="font-semibold text-slate-900">
                    {assessment.score ? `${assessment.score}%` : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Updated:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(assessment.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
