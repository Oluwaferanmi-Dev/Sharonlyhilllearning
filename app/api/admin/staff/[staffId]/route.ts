import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * Get detailed assessment information for a specific staff member.
 * Admin-only endpoint.
 *
 * GET /api/admin/staff/[staffId]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ staffId: string }> }) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const { staffId } = await params
    const supabase = createAdminClient()

    // Get staff profile using admin client
    const { data: staffProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", staffId)
      .single()

    if (profileError || !staffProfile) {
      console.error("[v0] Profile error:", profileError)
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Get all assessments for this staff member with topic and level details
    const { data: assessments, error: assessmentsError } = await supabase
      .from("user_assessments")
      .select(
        `
        *,
        assessment_topics(name, id),
        assessment_levels(name, id, order_index)
      `,
      )
      .eq("user_id", staffId)
      .order("created_at", { ascending: false })

    if (assessmentsError) {
      console.error("[v0] Assessments query error:", assessmentsError)
      throw assessmentsError
    }

    // Group assessments by level
    const assessmentsByLevel: Record<
      string,
      {
        levelName: string
        orderIndex: number
        topics: any[]
      }
    > = {}

    assessments?.forEach((assessment: any) => {
      const levelName = assessment.assessment_levels?.name || "Unknown"
      const levelId = assessment.level_id

      if (!assessmentsByLevel[levelId]) {
        assessmentsByLevel[levelId] = {
          levelName,
          orderIndex: assessment.assessment_levels?.order_index || 999,
          topics: [],
        }
      }

      assessmentsByLevel[levelId].topics.push({
        topicId: assessment.topic_id,
        topicName: assessment.assessment_topics?.name || "Unknown Topic",
        status: assessment.status,
        score: assessment.score,
        passed: assessment.passed,
        completedAt: assessment.completed_at,
      })
    })

    // Sort levels by order index
    const sortedLevels = Object.entries(assessmentsByLevel)
      .sort(([, a], [, b]) => a.orderIndex - b.orderIndex)
      .map(([levelId, data]) => ({
        levelId,
        levelName: data.levelName,
        topics: data.topics,
      }))

    return NextResponse.json(
      {
        staff: staffProfile,
        assessmentsByLevel: sortedLevels,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Staff details fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch staff details" }, { status: 500 })
  }
}
