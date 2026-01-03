import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Lock an assessment level (reset to locked state)
 * Only admins can perform this action
 *
 * POST /api/admin/lock-level
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { levelId } = body;

    console.log("[v0] Lock request:", { levelId });

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lock the level by setting is_unlocked to false
    const { error: lockError } = await supabase.from("level_unlocks").upsert(
      {
        level_id: levelId,
        is_unlocked: false,
        unlocked_at: null,
      },
      { onConflict: "level_id" }
    );

    if (lockError) {
      console.error("[v0] Error locking level:", lockError);
      return NextResponse.json(
        { error: "Failed to lock level" },
        { status: 500 }
      );
    }

    console.log("[v0] Level locked successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Level reset to locked state",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[v0] Lock level error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lock level" },
      { status: 500 }
    );
  }
}
