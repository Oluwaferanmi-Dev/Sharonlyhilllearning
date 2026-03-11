import { createClient, createAdminClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import { isValidTokenCode } from '@/lib/tokens/token-manager'

/**
 * Redeem a token code to grant user access to an assessment level.
 * Staff members use this to unlock a level they purchased a token for.
 *
 * POST /api/tokens/redeem
 * Body: { token_code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token_code } = body

    // Validate input
    if (!token_code || typeof token_code !== 'string') {
      return NextResponse.json({ error: 'Token code is required' }, { status: 400 })
    }

    const cleanCode = token_code.trim().toUpperCase()
    if (!isValidTokenCode(cleanCode)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Look up the token
    const { data: token, error: tokenError } = await adminClient
      .from('access_tokens')
      .select('id, status, level_id, redeemed_by_user_id, expires_at')
      .eq('token_code', cleanCode)
      .maybeSingle()

    if (tokenError) {
      console.error('[v0] Token lookup error:', tokenError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!token) {
      return NextResponse.json(
        {
          error: 'INVALID_TOKEN',
          message: 'Token not found. Please check the code and try again.',
        },
        { status: 404 }
      )
    }

    // Check token expiration
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return NextResponse.json(
        {
          error: 'EXPIRED_TOKEN',
          message: 'This token has expired. Please contact your administrator.',
        },
        { status: 410 }
      )
    }

    // Check if already used
    if (token.status === 'used') {
      if (token.redeemed_by_user_id === user.id) {
        // User already redeemed this token themselves
        return NextResponse.json(
          {
            error: 'ALREADY_REDEEMED_BY_YOU',
            message: 'You have already redeemed a token for this level.',
          },
          { status: 409 }
        )
      } else {
        // Token used by someone else
        return NextResponse.json(
          {
            error: 'ALREADY_USED',
            message: 'This token has already been used by another staff member.',
          },
          { status: 409 }
        )
      }
    }

    // Check if user already has access to this level
    const { data: existingAccess } = await adminClient
      .from('user_level_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('level_id', token.level_id)
      .maybeSingle()

    if (existingAccess) {
      return NextResponse.json(
        {
          error: 'ALREADY_HAS_ACCESS',
          message: 'You already have access to this assessment level.',
        },
        { status: 409 }
      )
    }

    // Redeem the token (mark as used + link to user)
    const { error: redeemError } = await adminClient
      .from('access_tokens')
      .update({
        status: 'used',
        redeemed_by_user_id: user.id,
        redeemed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', token.id)

    if (redeemError) {
      console.error('[v0] Token redemption error:', redeemError)
      return NextResponse.json({ error: 'Failed to redeem token' }, { status: 500 })
    }

    // Grant user access to level
    const { error: accessError } = await adminClient.from('user_level_access').insert({
      user_id: user.id,
      level_id: token.level_id,
      token_id: token.id,
    })

    if (accessError) {
      console.error('[v0] Access grant error:', accessError)
      return NextResponse.json(
        { error: 'Failed to grant access. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Token redeemed successfully! You now have access to the assessment level.',
        level_id: token.level_id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Token redemption fatal error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
