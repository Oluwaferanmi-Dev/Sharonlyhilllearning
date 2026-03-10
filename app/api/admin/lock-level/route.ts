import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * Lock an assessment level (reset to locked state).
 * Only admins can perform this action.
 *
 * POST /api/admin/lock-level
 */
export async function POST(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const body = await request.json()
    const { levelId } = body

    if (!levelId) {
      return NextResponse.json({ error: "Missing levelId" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { error: lockError } = await adminClient
      .from("level_unlocks")
      .upsert(
        { level_id: levelId, is_unlocked: false, unlocked_at: null },
        { onConflict: "level_id" }
      )

    if (lockError) {
      return NextResponse.json({ error: "Failed to lock level" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Level reset to locked state" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to lock level" }, { status: 500 })
  }
}
