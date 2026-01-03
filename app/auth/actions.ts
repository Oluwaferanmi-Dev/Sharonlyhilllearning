"use server"

import { createClient } from "@/lib/supabase/server"

export async function createUserProfile(
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  nin: string,
  department: string,
  role: "staff" | "admin" = "staff",
) {
  const supabase = await createClient()

  try {
    console.log("[v0] Creating profile for user:", userId)

    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (existingProfile) {
      console.log("[v0] Profile already exists for user:", userId)
      return { success: true, data: existingProfile }
    }

    // Insert profile into database
    const { data, error } = await supabase.from("profiles").insert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email,
      nin,
      department,
      role, // Now uses the role parameter instead of hardcoded 'staff'
    })

    if (error) {
      console.log("[v0] Profile creation error:", error)
      throw new Error(error.message)
    }

    console.log("[v0] Profile created successfully")
    return { success: true, data }
  } catch (error) {
    console.log("[v0] Profile creation failed:", error)
    throw error
  }
}
