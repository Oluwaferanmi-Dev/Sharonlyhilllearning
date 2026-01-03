import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"

export default async function StaffAssessmentsPage({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params
  const supabase = createAdminClient()

  // Get staff profile
  const { data: staff } = await supabase.from("profiles").select("*").eq("id", staffId).single()

  if (!staff) {
    redirect("/admin/staff")
  }

  // Get all assessments for this staff member
  const { data: assessments } = await supabase
    .from("user_assessments")
    .select(
      `
      *,
      assessment_topics(id, name),
      assessment_levels(id, name)
    `,
    )
    .eq("user_id", staffId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  // Calculate overall performance
  const totalAssessments = assessments?.length || 0
  const passedAssessments = assessments?.filter((a) => a.passed).length || 0
  const averageScore =
    totalAssessments > 0 ? Math.round(assessments!.reduce((sum, a) => sum + (a.score || 0), 0) / totalAssessments) : 0

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/staff/${staffId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {staff.first_name} {staff.last_name}
          </h1>
          <p className="text-slate-600">Assessment History</p>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Assessments</CardDescription>
            <CardTitle className="text-3xl">{totalAssessments}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Passed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{passedAssessments}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{averageScore}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Assessments List */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>View detailed results for each assessment attempt</CardDescription>
        </CardHeader>
        <CardContent>
          {!assessments || assessments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No completed assessments yet</div>
          ) : (
            <div className="space-y-3">
              {assessments.map((assessment: any) => (
                <Link
                  key={assessment.id}
                  href={`/admin/staff/${staffId}/assessments/${assessment.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${assessment.passed ? "bg-green-100" : "bg-orange-100"}`}>
                        {assessment.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{assessment.assessment_topics?.name}</p>
                        <p className="text-sm text-slate-600">{assessment.assessment_levels?.name} Level</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${assessment.passed ? "text-green-600" : "text-orange-600"}`}>
                          {assessment.score}%
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(assessment.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
