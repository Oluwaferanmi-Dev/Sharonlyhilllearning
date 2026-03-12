import { createAdminClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import StaffFiltersAndTable from "@/components/staff-filters-and-table";

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  created_at: string;
  role: string;
  profile_picture_url?: string;
}

interface Assessment {
  user_id: string;
  status: string;
}

export default async function AdminStaffPage() {
  const adminClient = createAdminClient();

  const { data: staffProfiles, error: staffError } = await adminClient
    .from("profiles")
    .select(
      "id, first_name, last_name, email, department, created_at, role, profile_picture_url"
    )
    .eq("role", "staff")
    .order("created_at", { ascending: false });

  const { data: allAssessments } = await adminClient
    .from("user_assessments")
    .select("*");

  const staff = (staffProfiles || []) as StaffMember[];
  const assessments = (allAssessments || []) as Assessment[];

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Staff Management
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">
            View and manage all registered staff members
          </p>
        </div>
        <Link href="/admin" className="w-full sm:w-auto">
          <Button variant="outline" className="bg-transparent w-full sm:w-auto">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            All Staff Members
          </CardTitle>
          <CardDescription className="text-sm">
            Total: {staff.length} staff members registered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StaffFiltersAndTable
            staffProfiles={staff}
            allAssessments={assessments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
