"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Loader2 } from "lucide-react"

interface Announcement {
  id: string
  title: string
  message: string
  is_active: boolean
  created_at: string
}

interface AnnouncementsListProps {
  onAnnouncementDeleted?: () => void
}

export function AnnouncementsList({ onAnnouncementDeleted }: AnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch announcements")
      }

      const data = await response.json()
      setAnnouncements(data.announcements || [])
    } catch (error) {
      console.error("[v0] Error fetching announcements:", error)
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleDelete = async (id: string) => {
    setDeletingId(id)

    try {
      const response = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete announcement")
      }

      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      })

      setAnnouncements(announcements.filter((a) => a.id !== id))
      onAnnouncementDeleted?.()
    } catch (error) {
      console.error("[v0] Error deleting announcement:", error)
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-500">Loading announcements...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Announcements</CardTitle>
        <CardDescription>Manage announcements sent to all staff members</CardDescription>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="text-slate-500 text-sm">No announcements yet</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                    <p className="text-sm text-slate-600 mt-2">{announcement.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(announcement.id)}
                    disabled={deletingId === announcement.id}
                    className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === announcement.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(announcement.created_at).toLocaleDateString()} at{" "}
                  {new Date(announcement.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
