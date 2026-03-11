import { createAdminClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { generateTokenCode, PAYMENT_STATUS } from '@/lib/tokens/token-manager'

/**
 * Create a token purchase and generate individual tokens.
 * Admin-only endpoint for creating token inventory.
 *
 * POST /api/admin/tokens/purchase
 * Body: {
 *   level_id: string (UUID)
 *   quantity: number
 *   amount_paid: number
 *   payment_status?: 'pending' | 'completed' | 'failed'
 *   stripe_session_id?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const adminClient = createAdminClient()
    const body = await request.json()
    const { level_id, quantity, amount_paid, payment_status = PAYMENT_STATUS.COMPLETED, stripe_session_id } = body

    // Validate inputs
    if (!level_id || !quantity || amount_paid === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: level_id, quantity, amount_paid' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 10000) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer (1-10000)' },
        { status: 400 }
      )
    }

    if (typeof amount_paid !== 'number' || amount_paid < 0) {
      return NextResponse.json({ error: 'Amount paid must be a non-negative number' }, { status: 400 })
    }

    // Verify level exists and get its price
    const { data: level, error: levelError } = await adminClient
      .from('assessment_levels')
      .select('id, price_per_token')
      .eq('id', level_id)
      .maybeSingle()

    if (levelError || !level) {
      return NextResponse.json({ error: 'Assessment level not found' }, { status: 404 })
    }

    // Calculate expected total from database price
    const levelPrice = level.price_per_token || 0
    const expectedTotal = quantity * levelPrice

    // Validate amount paid matches expected total (with some tolerance for rounding)
    const priceDifference = Math.abs(amount_paid - expectedTotal)
    if (priceDifference > 1) {
      // Allow 1 unit of currency difference due to rounding
      console.warn(
        `[v0] Price mismatch: expected ${expectedTotal}, got ${amount_paid}, difference: ${priceDifference}`
      )
      // We could reject here or allow with warning - for now allow but log
    }

    // Get admin user ID from JWT
    const adminUserId = request.headers
      .get('x-admin-user-id') // Could be passed in header, but safer to get from JWT
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    // For now, we'll need to get the user from Supabase auth
    const supabaseAdminClient = createAdminClient()
    const {
      data: { user: adminUser },
    } = await supabaseAdminClient.auth.getUser(token || '')

    if (!adminUser?.id) {
      return NextResponse.json({ error: 'Cannot identify admin user' }, { status: 400 })
    }

    // Create the purchase record
    const { data: purchase, error: purchaseError } = await adminClient
      .from('token_purchases')
      .insert({
        admin_user_id: adminUser.id,
        level_id,
        quantity,
        amount_paid,
        payment_status,
        stripe_session_id,
      })
      .select()
      .single()

    if (purchaseError || !purchase) {
      console.error('[v0] Purchase creation error:', purchaseError)
      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
    }

    // Generate individual tokens for this purchase
    const tokens = []
    for (let i = 0; i < quantity; i++) {
      tokens.push({
        purchase_id: purchase.id,
        level_id,
        token_code: generateTokenCode(),
        status: 'unused',
      })
    }

    const { data: createdTokens, error: tokensError } = await adminClient
      .from('access_tokens')
      .insert(tokens)
      .select('token_code')

    if (tokensError || !createdTokens) {
      console.error('[v0] Token generation error:', tokensError)
      // Optionally: delete the purchase record if token generation fails
      return NextResponse.json({ error: 'Failed to generate tokens' }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully created ${quantity} tokens`,
        purchase_id: purchase.id,
        token_count: createdTokens.length,
        price_per_token: levelPrice,
        total_price: expectedTotal,
        currency: 'USD',
        tokens: createdTokens,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[v0] Token purchase fatal error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
