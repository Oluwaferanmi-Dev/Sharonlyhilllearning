"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"

const DEPARTMENTS = [
  "Clinical Services",
  "Administration",
  "Nursing",
  "Emergency Management",
  "Quality Assurance",
  "Infection Control",
  "Human Resources",
  "Finance",
  "Other",
]

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [nin, setNin] = useState("")
  const [department, setDepartment] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      console.log("[v0] Registration starting for email:", email)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            nin: nin,
            department: department,
            role: "staff",
          },
        },
      })

      if (authError) throw authError
      if (!authData.user?.id) throw new Error("No user ID returned from signup")

      console.log("[v0] Auth user created:", authData.user.id)

      // The error occurred because the trigger was already creating the profile with defaults,
      // and this manual insert was conflicting (duplicate key).

      console.log("[v0] Profile created successfully via trigger, redirecting...")
      router.push("/auth/register-success")
    } catch (error: unknown) {
      console.log("[v0] Registration error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 relative">
              <Image
                src="/cherith-logo.png"
                alt="Cherith Training Academy"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-slate-900">Cherith Training Academy</span>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Register to begin your healthcare compliance assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-sm">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">
                Work Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@hospital.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="nin" className="text-sm">
                National Identification Number
              </Label>
              <Input
                id="nin"
                placeholder="Enter your NIN"
                required
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="department" className="text-sm">
                Department / Unit
              </Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-sm"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
