import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { NextResponse } from "next/server";
import { seedQualitySafetyCourse } from "@/lib/seed/quality-safety-course";

/**
 * Seed the "Quality and Patient Safety in Low-Resource Health Settings" course.
 * Admin only. Run once after applying the LMS course migration.
 * POST /api/seed-course
 */
export async function POST() {
  const { error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

    // Check if course already exists (idempotent: skip if already seeded)
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", "quality-patient-safety-low-resource")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "Course already seeded. Skipping.", courseId: existing.id },
        { status: 200 }
      );
    }

    const result = await seedQualitySafetyCourse(supabase);

    return NextResponse.json(
      {
        message: "Course seeded successfully",
        courseId: result.courseId,
        moduleCount: result.moduleIds.length,
        levelId: result.levelId,
        topicIds: result.topicIds,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[seed-course] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
