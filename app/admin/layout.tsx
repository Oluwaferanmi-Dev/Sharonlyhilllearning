import type React from "react"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // TEMP: Role checks disabled for client demo
  // TODO: Re-enable role check after demo using createAdminClient() query on profiles table

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // TEMP: Skipping profiles.role check — any authenticated user can access /admin for demo
  // RESTORE: const adminClient = createAdminClient()
  // RESTORE: const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user!.id).single()
  // RESTORE: if (!profile || profile.role !== "admin") { redirect("/dashboard") }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user!} />
      <div className="max-w-7xl mx-auto p-4">{children}</div>
    </div>
  )
}
