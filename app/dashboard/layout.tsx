import type React from "react"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch profile server-side using admin client to avoid RLS issues
  const adminClient = createAdminClient()
  const { data: profileData } = await adminClient
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", data.user.id)
    .single()

  // Admin users should not use the staff dashboard; send them to /admin.
  if (profileData?.role === "admin") {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav user={data.user} profile={profileData} />
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  )
}
