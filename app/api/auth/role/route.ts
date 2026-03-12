import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Returns the role of the currently authenticated user by querying the
// profiles table with the service role client (bypasses all RLS).
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ role: null }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ role: null }, { status: 200 })
  }

  return NextResponse.json({ role: profile.role }, { status: 200 })
}
