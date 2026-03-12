import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users from protected routes
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user) {
    // Resolve the user's role from the profiles table so profiles.role
    // is the single source of truth for authorization decisions.
    let role: string | null = null
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    role = profile?.role ?? null

    // If admin is on a dashboard route, send to admin
    if (role === "admin" && pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    // If staff/user is on an admin route, send to dashboard
    if (role !== "admin" && pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // If on landing page and logged in, redirect to appropriate home
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = role === "admin" ? "/admin" : "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  console.log("[v0] Middleware - Path:", request.nextUrl.pathname, "User:", user?.id || "none")

  return supabaseResponse
}
