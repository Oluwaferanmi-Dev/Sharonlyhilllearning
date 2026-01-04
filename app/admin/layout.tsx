import type React from "react";

import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createAdminClient();
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();

  // Since we can't get user from createAdminClient, we need to verify differently
  // Get the user from regular client for auth check
  const { createClient } = await import("@/lib/supabase/server");
  const userClient = await createClient();
  const { data } = await userClient.auth.getUser();

  if (!data?.user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  // If user is not an admin, redirect to dashboard
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={data.user} />
      <div className="max-w-7xl mx-auto p-4">{children}</div>
    </div>
  );
}
