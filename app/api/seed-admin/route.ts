import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Emergency seeding endpoint for initial admin
 * This should be removed or secured after use
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const email = "admin@cherithtraining.com";
    const password = "AdminPassword123!";

    console.log("[v0] Emergency seed starting for:", email);

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { message: "Admin already exists" },
        { status: 200 },
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: "System",
          last_name: "Administrator",
          nin: "SEED-ADMIN-001",
          department: "Admin",
          role: "admin",
        },
      });

    if (authError) throw authError;

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: "Sharonlyhill Learning Organization",
        admin_user_id: authData.user.id,
      })
      .select()
      .single();

    if (orgError) throw orgError;

    return NextResponse.json({
      message: "Admin seeded successfully",
      credentials: { email, password },
    });
  } catch (error: any) {
    console.error("[v0] Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
