"use client"

import type { User } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export function DashboardNav({ user }: { user: User }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-16 h-16 relative">
              <Image
                src="/cherith-logo.png"
                alt="Cherith Training Academy"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-slate-900">EdoHerma</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/dashboard/assessments" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Assessments
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user.email}</p>
            <p className="text-xs text-slate-600">Staff Member</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </nav>
  )
}
