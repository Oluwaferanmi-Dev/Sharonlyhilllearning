import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Verifies that the calling user is an authenticated admin.
 *
 * Returns { user, error } where error is a ready-to-return NextResponse
 * with status 401 or 403 if the check fails, or null if the user is confirmed admin.
 *
 * Usage in an API route:
 *   const { user, error } = await requireAdmin()
 *   if (error) return error
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email?: string }; error: null }
  | { user: null; error: NextResponse }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  // Verify role against the database using the service-role client
  // so RLS policies do not interfere.
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { user: { id: user.id, email: user.email }, error: null }
}
