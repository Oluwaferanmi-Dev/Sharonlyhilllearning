import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * Unlock an assessment level.
 * Only admins can perform this action.
 * Note: Payment validation is a future phase (Stripe integration).
 *
 * POST /api/admin/unlock-level
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

    const { error: unlockError } = await adminClient
      .from("level_unlocks")
      .upsert(
        {
          level_id: levelId,
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
        },
        { onConflict: "level_id" }
      )

    if (unlockError) {
      return NextResponse.json({ error: "Failed to unlock level" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Level unlocked successfully" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to unlock level" }, { status: 500 })
  }
}
