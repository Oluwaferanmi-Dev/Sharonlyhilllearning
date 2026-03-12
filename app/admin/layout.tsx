import type React from "react"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Step 1: Get the authenticated user from the cookie-based session
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Step 2: Use the service role client (bypasses all RLS) to query the
  // profiles table directly. This is the authoritative role check —
  // we do not rely on session metadata or JWT claims.
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user!} />
      <div className="max-w-7xl mx-auto p-4">{children}</div>
    </div>
  )
}
