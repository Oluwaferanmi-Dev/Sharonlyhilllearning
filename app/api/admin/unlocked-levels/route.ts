import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * Get all assessment levels with their unlock status.
 * Admin-only endpoint.
 *
 * GET /api/admin/unlocked-levels
 */
export async function GET(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const adminClient = createAdminClient()

    const { data: unlockedLevels, error: levelsError } = await adminClient
      .from("level_unlocks")
      .select("level_id, is_unlocked")
      .order("level_id", { ascending: true })

    if (levelsError) {
      console.error("[v0] Error fetching level unlocks:", levelsError)
      return NextResponse.json({ error: "Failed to fetch levels" }, { status: 500 })
    }

    return NextResponse.json({ unlockedLevels: unlockedLevels || [] }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Get levels error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch levels" }, { status: 500 })
  }
}
