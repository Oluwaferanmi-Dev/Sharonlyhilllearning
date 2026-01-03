import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default async function AdminStaffPage() {
  const supabase = createAdminClient()

  const authSupabase = await createClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  console.log("[v0] Fetching all staff profiles with admin client")

  const { data: staffProfiles, error: staffError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "staff")
    .order("created_at", { ascending: false })

  console.log("[v0] Staff profiles fetched:", staffProfiles?.length || 0, "Error:", staffError)

  let allAssessments: any[] = []

  if (staffProfiles && staffProfiles.length > 0) {
    const staffIds = staffProfiles.map((p) => p.id)

    const { data: assessmentsData } = await supabase.from("user_assessments").select("*").in("user_id", staffIds)

    allAssessments = assessmentsData || []
  }

  return (
    <div className="px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-600 mt-2">View and manage all registered staff members</p>
        </div>
        <Link href="/admin">
          <Button variant="outline" className="bg-transparent">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
          <CardDescription>Total: {staffProfiles?.length || 0} staff members registered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Department</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Topics</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Joined</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffProfiles?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No staff members have registered yet. Staff can register at the registration page.
                    </td>
                  </tr>
                )}
                {staffProfiles?.map((staff) => {
                  const staffAssessments = allAssessments?.filter((a) => a.user_id === staff.id) || []
                  const completed = staffAssessments.filter((a) => a.status === "completed").length

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {staff.first_name} {staff.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{staff.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{staff.department}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {completed}/{staffAssessments.length} completed
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/staff/${staff.id}`}>
                          <Button variant="ghost" size="sm" className="bg-transparent">
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
