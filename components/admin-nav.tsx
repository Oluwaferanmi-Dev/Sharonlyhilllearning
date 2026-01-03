"use client"

import type { User } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export function AdminNav({ user }: { user: User | null }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push("/")
  }

  if (!user) {
    return (
      <nav className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-20 h-20 relative">
              <Image
                src="/cherith-logo.png"
                alt="Cherith Training Academy"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-slate-900">EDOHERMA ADMIN</span>
          </Link>
          <Button onClick={() => router.push("/auth/login")} variant="outline" size="sm">
            Login Required
          </Button>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-16 h-16 relative">
              <Image
                src="/cherith-logo.png"
                alt="Cherith Training Academy"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-slate-900">EDOHERMA ADMIN</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/admin" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/admin/staff" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Staff
            </Link>
            <Link href="/admin/assessments" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Assessments
            </Link>
            <Link href="/admin/payments" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Payments
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user.email}</p>
            <p className="text-xs text-slate-600">Administrator</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </nav>
  )
}
