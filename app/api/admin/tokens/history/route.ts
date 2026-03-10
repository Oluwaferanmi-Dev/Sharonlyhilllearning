import { createAdminClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'

/**
 * Get token usage history
 * Shows which tokens were redeemed by which users
 *
 * GET /api/admin/tokens/history?levelId=xxx&limit=50&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const { searchParams } = request.nextUrl
    const levelId = searchParams.get('levelId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

    const adminClient = createAdminClient()

    // Build query
    let query = adminClient
      .from('access_tokens')
      .select(
        `
        id,
        token_code,
        status,
        redeemed_at,
        redeemed_by_user_id,
        created_at
      `
      )
      .order('redeemed_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (levelId) {
      query = query.eq('level_id', levelId)
    }

    const { data: tokens, error: tokensError, count } = await query

    if (tokensError) {
      console.error('[v0] Token history error:', tokensError)
      return NextResponse.json({ error: 'Failed to fetch token history' }, { status: 500 })
    }

    // Get user info for redeemed tokens
    const userIds = tokens
      ?.filter((t) => t.redeemed_by_user_id)
      .map((t) => t.redeemed_by_user_id)
      .filter((id, index, arr) => arr.indexOf(id) === index)

    const { data: users } = userIds && userIds.length > 0
      ? await adminClient
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds)
      : { data: [] }

    const userMap = new Map()
    users?.forEach((u) => {
      userMap.set(u.id, {
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
      })
    })

    // Enrich token data with user info
    const enrichedTokens = tokens?.map((t) => ({
      ...t,
      redeemed_by_user:
        t.redeemed_by_user_id && userMap.has(t.redeemed_by_user_id)
          ? userMap.get(t.redeemed_by_user_id)
          : null,
    }))

    return NextResponse.json(
      {
        tokens: enrichedTokens || [],
        total_count: count,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Token history fatal error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
