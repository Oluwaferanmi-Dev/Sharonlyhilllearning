import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * Get admin dashboard metrics
 * Returns aggregated data about all staff assessments and completion rates
 *
 * GET /api/admin/metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const adminClient = createAdminClient()

    const { data: staffProfiles, error: staffError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, email, department, created_at")
      .eq("role", "staff")

    if (staffError) {
      console.error("[v0] Staff query error details:", staffError)
      // Service role should bypass RLS, so log detailed error
      throw staffError
    }

    const staffUserIds = staffProfiles?.map((p) => p.id) || []
    const totalStaff = staffProfiles?.length || 0

    // Get assessment metrics
    let topicsStarted = 0
    let topicsCompleted = 0
    let topicsPassed = 0
    let averageScore = 0

    if (staffUserIds.length > 0) {
      const { data: assessments, error: assessmentError } = await adminClient
        .from("user_assessments")
        .select("id, status, passed, score")
        .in("user_id", staffUserIds)

      if (assessmentError) {
        console.error("[v0] Assessment query error:", assessmentError)
      } else {
        topicsStarted = assessments?.filter((a) => a.status === "in_progress").length || 0
        topicsCompleted = assessments?.filter((a) => a.status === "completed").length || 0
        topicsPassed = assessments?.filter((a) => a.passed === true).length || 0

        const completedWithScores = assessments?.filter((a) => a.status === "completed" && a.score !== null) || []
        averageScore =
          completedWithScores.length > 0
            ? Math.round(completedWithScores.reduce((sum, a) => sum + (a.score || 0), 0) / completedWithScores.length)
            : 0
      }
    }

    // Get recent staff registrations (last 5)
    const recentStaff = (staffProfiles || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((staff) => ({
        id: staff.id,
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        department: staff.department,
        created_at: staff.created_at,
      }))

    return NextResponse.json(
      {
        metrics: {
          totalStaff,
          topicsStarted,
          topicsCompleted,
          topicsPassed,
          averageScore,
        },
        recentStaff,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Metrics fetch error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch metrics",
        metrics: {
          totalStaff: 0,
          topicsStarted: 0,
          topicsCompleted: 0,
          topicsPassed: 0,
          averageScore: 0,
        },
        recentStaff: [],
      },
      { status: 500 },
    )
  }
}
