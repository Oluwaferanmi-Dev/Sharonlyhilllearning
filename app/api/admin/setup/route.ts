import { createAdminClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Setup endpoint to create an initial admin user
 * This should be called ONLY once during setup
 *
 * POST /api/admin/setup
 * Body: { email, password, firstName, lastName, nin }
 */
export async function POST(request: NextRequest) {
  // 5 attempts per IP per 15 minutes — prevents brute-force admin creation
  const { allowed } = rateLimit(request, { max: 5, windowMs: 15 * 60 * 1000 }, "admin-setup")
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  try {
    const body = await request.json();
    const { email, password, firstName, lastName, nin } = body;

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
      return NextResponse.json(
        { error: "Database error while checking admin count" },
        { status: 500 }
      );
    }

    if ((existingAdmins?.length || 0) >= 5) {
      return NextResponse.json(
        {
          error:
            "Maximum number of admins (5) has been reached. No more admins can be created.",
        },
        { status: 409 }
      );
    }

    const { data: emailInUse, error: emailCheckError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (emailCheckError) {
      return NextResponse.json(
        { error: "Database error while checking email" },
        { status: 500 }
      );
    }

    if (emailInUse) {
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
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

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
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create auth user" },
        { status: 500 }
      );
    }

    // Wait briefly for the DB trigger to create the profile automatically
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (!profile) {
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
        if (profileError.message?.includes("organizations")) {
          return NextResponse.json(
            {
              error: `Schema mismatch: ${profileError.message}. Please run the migration scripts in your Supabase SQL editor.`,
            },
            { status: 500 }
          );
        }
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: `Profile creation failed: ${profileError.message}` },
          { status: 500 }
        );
      }
    }

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
    return NextResponse.json(
      { error: error.message || "Internal server error occurred" },
      { status: 500 }
    );
  }
}
