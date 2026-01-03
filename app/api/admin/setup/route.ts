import { createAdminClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Setup endpoint to create an initial admin user
 * This should be called ONLY once during setup
 *
 * POST /api/admin/setup
 * Body: { email, password, firstName, lastName, nin }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, nin } = body;

    console.log("[v0] Admin setup starting for email:", email);

    if (!email || !password || !firstName || !lastName || !nin) {
      const missing = [];
      if (!email) missing.push("email");
      if (!password) missing.push("password");
      if (!firstName) missing.push("firstName");
      if (!lastName) missing.push("lastName");
      if (!nin) missing.push("nin");

      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    const { data: existingAdmins, error: adminCountError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminCountError) {
      console.error("[v0] Error checking admin count:", adminCountError);
      return NextResponse.json(
        { error: "Database error while checking admin count" },
        { status: 500 }
      );
    }

    if ((existingAdmins?.length || 0) >= 5) {
      console.log("[v0] Admin limit reached (5 maximum)");
      return NextResponse.json(
        {
          error:
            "Maximum number of admins (5) has been reached. No more admins can be created.",
        },
        { status: 409 }
      );
    }

    // Check if admin already exists
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (adminCheckError) {
      console.error("[v0] Error checking for existing admin:", adminCheckError);
      return NextResponse.json(
        { error: "Database error while checking existing admin" },
        { status: 500 }
      );
    }

    const { data: emailInUse, error: emailCheckError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (emailCheckError) {
      console.error("[v0] Error checking email:", emailCheckError);
      return NextResponse.json(
        { error: "Database error while checking email" },
        { status: 500 }
      );
    }

    if (emailInUse) {
      console.log("[v0] Email already registered with role:", emailInUse.role);
      return NextResponse.json(
        {
          error: `This email is already registered as a ${emailInUse.role}. Each email can only be used for one role.`,
        },
        { status: 409 }
      );
    }

    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some((u) => u.email === email);

    if (emailExists) {
      console.log("[v0] Email already registered:", email);
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

    console.log("[v0] Creating auth user...");
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          nin,
          department: "Administration",
          role: "admin",
        },
      });

    if (authError) {
      console.error("[v0] Auth user creation error:", authError.message);
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error("[v0] No auth user returned from creation");
      return NextResponse.json(
        { error: "Failed to create auth user" },
        { status: 500 }
      );
    }

    console.log("[v0] Auth user created:", authData.user.id);

    console.log("[v0] Waiting for profile creation trigger...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileCheckError) {
      console.error("[v0] Error checking profile:", profileCheckError);
    }

    if (!profile) {
      console.log("[v0] Profile not found after trigger, creating manually...");
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        nin,
        department: "Administration",
        role: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error(
          "[v0] Manual profile creation error:",
          profileError.message
        );
        console.error("[v0] Full error details:", profileError);
        if (profileError.message?.includes("organizations")) {
          console.log("[v0] Schema mismatch detected - attempting cleanup...");
          // The issue is a stale reference in the database
          return NextResponse.json(
            {
              error: `Schema mismatch: ${profileError.message}. Please run the migration scripts in your Supabase SQL editor.`,
            },
            { status: 500 }
          );
        }
        // Clean up auth user if profile creation fails for other reasons
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: `Profile creation failed: ${profileError.message}` },
          { status: 500 }
        );
      }
      console.log("[v0] Profile created manually");
    } else {
      console.log("[v0] Profile created successfully by trigger");
    }

    console.log("[v0] ✓ Admin setup completed successfully");

    return NextResponse.json(
      {
        message: "Admin user created successfully",
        admin: {
          id: authData.user.id,
          email: authData.user.email,
          firstName,
          lastName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[v0] Admin setup fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error occurred" },
      { status: 500 }
    );
  }
}
