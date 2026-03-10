/**
 * Lightweight in-memory rate limiter for Next.js API routes.
 *
 * Uses a sliding-window counter keyed by IP address.
 * Appropriate for single-region Vercel deployments.
 *
 * Usage:
 *   const { allowed, remaining } = rateLimit(request, { max: 5, windowMs: 60_000 })
 *   if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Module-level map — persists across requests within the same serverless instance
const store = new Map<string, RateLimitEntry>()

// Prune expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key)
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  max: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

function getClientIp(request: Request): string {
  // Vercel forwards real IP in x-forwarded-for
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return "unknown"
}

export function rateLimit(
  request: Request,
  options: RateLimitOptions,
  /** Optional key suffix to namespace limiters per route */
  keyPrefix = "default"
): RateLimitResult {
  const ip = getClientIp(request)
  const key = `${keyPrefix}:${ip}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    // First request in this window (or window has expired)
    const resetAt = now + options.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.max - 1, resetAt }
  }

  if (entry.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: options.max - entry.count, resetAt: entry.resetAt }
}
