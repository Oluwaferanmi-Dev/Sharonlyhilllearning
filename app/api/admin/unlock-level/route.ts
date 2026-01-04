import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Unlock an assessment level for all staff
 * Validates promo code and processes payment
 * NOTE: Only Beginner and Intermediate levels can be unlocked via this endpoint
 *
 * POST /api/admin/unlock-level
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { levelId, staffCount, promoCode } = body;

    console.log("[v0] Unlock request:", { levelId, staffCount, promoCode });

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get level details
    const { data: level, error: levelError } = await supabase
      .from("assessment_levels")
      .select("*")
      .eq("id", levelId)
      .single();

    if (levelError || !level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    if (level.name !== "Beginner" && level.name !== "Intermediate") {
      return NextResponse.json(
        {
          error: `${level.name} level cannot be unlocked. Only Beginner and Intermediate levels are available for purchase.`,
        },
        { status: 403 }
      );
    }

    // Calculate payment
    const pricePerStaff = level.price;
    let totalAmount = staffCount * pricePerStaff;
    let discount = 0;

    if (promoCode && promoCode.toLowerCase() === "sharonlyhill") {
      discount = totalAmount; // 100% discount
      totalAmount = 0;
    }

    console.log("[v0] Payment calculation:", {
      pricePerStaff,
      staffCount,
      totalAmount,
      discount,
    });

    const { error: unlockError } = await supabase.from("level_unlocks").upsert(
      {
        level_id: levelId,
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: "level_id" }
    );

    if (unlockError) {
      console.error("[v0] Error unlocking level:", unlockError);
      return NextResponse.json(
        { error: "Failed to unlock level" },
        { status: 500 }
      );
    }

    console.log("[v0] Level unlocked successfully for all staff");

    return NextResponse.json(
      {
        success: true,
        payment: {
          pricePerStaff,
          staffCount,
          discount,
          totalAmount,
          promoCodeApplied: !!promoCode,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[v0] Unlock level error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unlock level" },
      { status: 500 }
    );
  }
}
