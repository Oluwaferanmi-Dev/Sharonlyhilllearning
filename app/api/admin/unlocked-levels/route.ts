import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Get all assessment levels with their unlock status
 *
 * GET /api/admin/unlocked-levels
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: unlockedLevels, error: levelsError } = await supabase
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
