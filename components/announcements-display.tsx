"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

interface AnnouncementsDisplayProps {
  announcements: Announcement[];
}

export function AnnouncementsDisplay({
  announcements,
}: AnnouncementsDisplayProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.has(a.id),
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }
  const handleDismiss = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from("dismissed_announcements")
        .insert({ announcement_id: id });
    } catch (err) {
      // Fail silently — local dismiss still works for this session
      console.error("[v0] Failed to persist announcement dismissal:", err);
    }

    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
  };

  return (
    <div className="space-y-3">
      {visibleAnnouncements.map((announcement) => (
        <Alert key={announcement.id} className="border-blue-200 bg-blue-50">
          <Bell className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold ml-2">
            {announcement.title}
          </AlertTitle>
          <AlertDescription className="text-blue-800 ml-6 mt-2">
            {announcement.message}
          </AlertDescription>
          <button
            onClick={() => handleDismiss(announcement.id)}
            className="absolute top-4 right-4 text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      ))}
    </div>
  );
}
