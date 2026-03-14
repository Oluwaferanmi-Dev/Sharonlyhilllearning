import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  created_at: string;
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const adminClient = createAdminClient();
  const { data: profileData, error } = await adminClient
    .from("profiles")
    .select("id, email, first_name, last_name, role, department, created_at")
    .eq("id", user.id)
    .single();

  if (!profileData) {
    redirect("/dashboard");
  }

  const profile: Profile = profileData;
  const roleLabel = profile.role === "admin" ? "Administrator" : "Staff Member";
  const createdDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-1">
          View and manage your account information
        </p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your account details from the Sharonlyhill Learning platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  First Name
                </label>
                <p className="mt-2 text-slate-900">{profile.first_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Last Name
                </label>
                <p className="mt-2 text-slate-900">{profile.last_name}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <p className="mt-2 text-slate-900">{profile.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Department
              </label>
              <p className="mt-2 text-slate-900">
                {profile.department || "Not specified"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your role and account status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Role
                </label>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      profile.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Member Since
                </label>
                <p className="mt-2 text-slate-900">{createdDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
