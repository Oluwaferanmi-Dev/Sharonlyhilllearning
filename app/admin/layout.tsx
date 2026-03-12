import type React from "react"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Use the cookie-based SSR client to get the authenticated session user
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Secondary server-side role check against the database.
  // The middleware handles the first layer via app_metadata; this is a
  // belt-and-suspenders check at the layout level using the service role.
  const adminClient = await createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  console.log("[v0-admin-layout] Checking admin access for user:", user.id)
  console.log("[v0-admin-layout] Profile query result:", profile)
  console.log("[v0-admin-layout] Profile error:", profileError)

  if (!profile || profile?.role !== "admin") {
    console.log("[v0-admin-layout] DENIED - redirecting to /dashboard. Profile:", profile, "Role:", profile?.role)
    redirect("/dashboard")
  }
  console.log("[v0-admin-layout] GRANTED - admin access allowed")

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user} />
      <div className="max-w-7xl mx-auto p-4">{children}</div>
    </div>
  )
}
