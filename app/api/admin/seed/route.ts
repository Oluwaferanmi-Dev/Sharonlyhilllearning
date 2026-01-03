import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Emergency admin seeding endpoint
 * This creates an admin user with default credentials
 *
 * POST /api/admin/seed
 * Body: { secret: "your-secret-key" }
 *
 * The secret should be set in your environment variables as ADMIN_SEED_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret } = body

    // Check secret to prevent unauthorized admin creation
    const expectedSecret = process.env.ADMIN_SEED_SECRET || "change-me-in-production"

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 })
    }

    console.log("[v0] Admin seed starting")

    const supabase = await createAdminClient()

    // Check if admin already exists
    const { data: existingAdmin } = await supabase.from("profiles").select("*").eq("role", "admin").limit(1).single()

    if (existingAdmin) {
      console.log("[v0] Admin already exists, seed blocked")
      return NextResponse.json(
        {
          error: "Admin user already exists. Setup has already been completed.",
          existingAdmin: {
            email: existingAdmin.email,
            name: `${existingAdmin.first_name} ${existingAdmin.last_name}`,
          },
        },
        { status: 400 },
      )
    }

    // Default admin credentials
    const adminEmail = "admin@edoherma.com"
    const adminPassword = "Admin@2025" // User should change this immediately
    const firstName = "Admin"
    const lastName = "User"
    const nin = "ADMIN001"

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        nin: nin,
        department: "Admin",
        role: "admin",
      },
    })

    if (authError) {
      console.log("[v0] Auth user creation error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      console.log("[v0] No auth user returned")
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 })
    }

    console.log("[v0] Auth user created:", authData.user.id)

    // Wait for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileCheckError || !profile) {
      console.log("[v0] Profile not found after trigger, creating manually")
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: adminEmail,
        first_name: firstName,
        last_name: lastName,
        nin: nin,
        department: "Admin",
        role: "admin",
      })

      if (profileError) {
        console.log("[v0] Manual profile creation error:", profileError)
        await supabase.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: "EdoHerma Organization",
        admin_user_id: authData.user.id,
      })
      .select()
      .single()

    if (orgError) {
      console.log("[v0] Organization creation error:", orgError)
      return NextResponse.json({ error: orgError.message }, { status: 400 })
    }

    // Create organization payment entry
    const { error: paymentError } = await supabase.from("organization_payments").insert({
      organization_id: org.id,
      total_staff: 0,
      amount_due: 0,
    })

    if (paymentError) {
      console.log("[v0] Payment entry error:", paymentError)
    }

    console.log("[v0] Admin seed completed successfully")

    return NextResponse.json(
      {
        message: "Admin user seeded successfully",
        admin: {
          email: adminEmail,
          password: adminPassword,
          warning: "CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN",
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[v0] Admin seed error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
