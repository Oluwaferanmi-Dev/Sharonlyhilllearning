import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileData?.role === "admin") {
    redirect("/admin");
  }

  // Fetch all active announcements
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, message, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Bell className="w-8 h-8 text-blue-600" />
        <h1 className="text-4xl font-bold text-slate-900">Announcements</h1>
      </div>
      <p className="text-slate-600">
        Stay informed with the latest updates and important messages
      </p>

      {/* Announcements Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6">
        {announcements && announcements.length > 0 ? (
          announcements.map((announcement: Announcement, index: number) => (
            <div
              key={announcement.id}
              className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <CardTitle className="text-blue-900">
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                      {new Date(announcement.created_at).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {announcement.message}
                </p>
              </CardContent>
            </div>
          ))
        ) : (
          <div className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No announcements yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Check back later for updates from the administration
              </p>
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
}
