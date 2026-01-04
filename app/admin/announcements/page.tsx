"use client"
import { AnnouncementForm } from "@/components/announcement-form"
import { AnnouncementsList } from "@/components/announcements-list"
import { useState } from "react"
import { motion } from "framer-motion"
import { Megaphone } from "lucide-react"

export default function AnnouncementsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAnnouncementCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="px-6 py-12 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">Announcements</h1>
        </div>
        <p className="text-slate-600">Send important messages to all staff members</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <AnnouncementForm onSuccess={handleAnnouncementCreated} />
        </motion.div>

        {/* Announcements List Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <AnnouncementsList key={refreshKey} onAnnouncementDeleted={handleAnnouncementCreated} />
        </motion.div>
      </div>
    </div>
  )
}
