import type React from "react"

import { createClient } from "@/lib/supabase/server"
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

  // Check admin role from user_metadata (set during account creation)
  // This avoids RLS policy issues that occur when querying the profiles table
  const userRole = user?.user_metadata?.role

  if (userRole !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={user} />
      <div className="max-w-7xl mx-auto p-4">{children}</div>
    </div>
  )
}
