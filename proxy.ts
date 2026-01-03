// Next.js 16 backwards compatibility - both middleware.ts and proxy.ts work
// This file ensures middleware runs even if the system looks for the old name
import { updateSession } from "@/lib/supabase/proxy"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
