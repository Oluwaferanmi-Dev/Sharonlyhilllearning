import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function AdminStaffPage() {
  const supabase = createAdminClient();

  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: staffProfiles, error: staffError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "staff")
    .order("created_at", { ascending: false });

  let allAssessments: any[] = [];

  if (staffProfiles && staffProfiles.length > 0) {
    const staffIds = staffProfiles.map((p) => p.id);

    const { data: assessmentsData } = await supabase
      .from("user_assessments")
      .select("*")
      .in("user_id", staffIds);

    allAssessments = assessmentsData || [];
  }

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Staff Management
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            View and manage all registered staff members
          </p>
        </div>
        <Link href="/admin" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto bg-transparent text-sm sm:text-base"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            All Staff Members
          </CardTitle>
          <CardDescription>
            Total: {staffProfiles?.length || 0} staff members registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 font-semibold text-slate-900">
                    Name
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 font-semibold text-slate-900">
                    Department
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 font-semibold text-slate-900">
                    Topics
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 font-semibold text-slate-900">
                    Joined
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffProfiles?.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No staff members have registered yet. Staff can register
                      at the registration page.
                    </td>
                  </tr>
                )}
                {staffProfiles?.map((staff) => {
                  const staffAssessments =
                    allAssessments?.filter((a) => a.user_id === staff.id) || [];
                  const completed = staffAssessments.filter(
                    (a) => a.status === "completed"
                  ).length;

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900">
                        {staff.first_name} {staff.last_name}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">
                        {staff.email}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">
                        {staff.department}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">
                        {completed}/{staffAssessments.length} completed
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <Link href={`/admin/staff/${staff.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-transparent text-xs sm:text-sm"
                          >
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {staffProfiles?.length === 0 && (
              <p className="text-center text-slate-500 py-8 text-sm">
                No staff members have registered yet. Staff can register at the
                registration page.
              </p>
            )}
            {staffProfiles?.map((staff) => {
              const staffAssessments =
                allAssessments?.filter((a) => a.user_id === staff.id) || [];
              const completed = staffAssessments.filter(
                (a) => a.status === "completed"
              ).length;

              return (
                <Link key={staff.id} href={`/admin/staff/${staff.id}`}>
                  <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm">
                          {staff.first_name} {staff.last_name}
                        </h3>
                        <p className="text-xs text-slate-600 truncate">
                          {staff.email}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Department:</span>
                        <span className="font-medium text-slate-900">
                          {staff.department}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Topics:</span>
                        <span className="font-medium text-slate-900">
                          {completed}/{staffAssessments.length} completed
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Joined:</span>
                        <span className="font-medium text-slate-900">
                          {new Date(staff.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
