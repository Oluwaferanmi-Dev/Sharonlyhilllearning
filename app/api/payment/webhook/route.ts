import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, stripeAmountToPrice } from '@/lib/stripe/client'
import { generateTokenCode } from '@/lib/tokens/token-manager'
import type Stripe from 'stripe'

/**
 * Stripe Webhook Handler
 * POST /api/payment/webhook
 *
 * Listens for checkout.session.completed events and:
 * 1. Creates token_purchases record
 * 2. Generates access tokens
 * 3. Prevents duplicate processing via stripe_session_id uniqueness
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('[v0] Missing Stripe signature')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured')
    }

    event = verifyWebhookSignature(body, signature, secret)
    console.log('[v0] Webhook verified:', event.type)
  } catch (error) {
    console.error('[v0] Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      return await handleCheckoutSessionCompleted(session)
    } catch (error) {
      console.error('[v0] Error handling checkout completion:', error)
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
  }

  // Acknowledge webhook receipt for other event types
  return NextResponse.json({ received: true }, { status: 200 })
}

/**
 * Handle checkout.session.completed event
 * Creates token purchase and generates access tokens
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const adminClient = createAdminClient()

  // Extract metadata
  const levelId = session.metadata?.levelId
  const quantity = parseInt(session.metadata?.quantity || '0', 10)
  const adminUserId = session.metadata?.adminUserId
  const sessionId = session.id

  console.log('[v0] Processing checkout completion:', {
    sessionId,
    levelId,
    quantity,
    adminUserId,
  })

  // Validate metadata
  if (!levelId || !quantity || quantity <= 0 || !adminUserId) {
    console.error('[v0] Invalid session metadata')
    return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 })
  }

  // Check if this session has already been processed (prevent duplicates)
  const { data: existingPurchase } = await adminClient
    .from('token_purchases')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (existingPurchase) {
    console.log('[v0] Session already processed:', sessionId)
    return NextResponse.json({ received: true, alreadyProcessed: true }, { status: 200 })
  }

  // Get level details
  const { data: level, error: levelError } = await adminClient
    .from('assessment_levels')
    .select('id, price_per_token')
    .eq('id', levelId)
    .maybeSingle()

  if (levelError || !level) {
    console.error('[v0] Level not found:', levelId)
    return NextResponse.json({ error: 'Level not found' }, { status: 404 })
  }

  // Calculate amount from Stripe session
  const amountPaid = session.amount_total ? stripeAmountToPrice(session.amount_total) : 0

  // Create token purchase record
  const { data: purchase, error: purchaseError } = await adminClient
    .from('token_purchases')
    .insert({
      admin_user_id: adminUserId,
      level_id: levelId,
      quantity,
      amount_paid: amountPaid,
      payment_status: 'completed',
      stripe_session_id: sessionId,
    })
    .select()
    .single()

  if (purchaseError || !purchase) {
    console.error('[v0] Failed to create purchase record:', purchaseError)
    throw new Error(`Failed to create purchase: ${purchaseError?.message}`)
  }

  console.log('[v0] Purchase created:', {
    purchaseId: purchase.id,
    quantity,
    levelId,
  })

  // Generate access tokens
  const tokens: Array<{ level_id: string; token_code: string; purchase_id: string }> = []

  for (let i = 0; i < quantity; i++) {
    let tokenCode: string
    let attempts = 0
    const maxAttempts = 10

    // Generate unique token code with collision retry
    do {
      tokenCode = generateTokenCode()
      const { data: existing } = await adminClient
        .from('access_tokens')
        .select('id')
        .eq('token_code', tokenCode)
        .maybeSingle()

      if (!existing) break

      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      console.error('[v0] Failed to generate unique token after 10 attempts')
      throw new Error('Failed to generate unique token code')
    }

    tokens.push({
      level_id: levelId,
      token_code: tokenCode,
      purchase_id: purchase.id,
    })
  }

  // Batch insert tokens
  const { error: tokenError } = await adminClient
    .from('access_tokens')
    .insert(
      tokens.map((t) => ({
        purchase_id: t.purchase_id,
        level_id: t.level_id,
        token_code: t.token_code,
        status: 'unused',
      }))
    )

  if (tokenError) {
    console.error('[v0] Failed to create access tokens:', tokenError)
    throw new Error(`Failed to create tokens: ${tokenError.message}`)
  }

  console.log('[v0] Tokens generated:', {
    count: quantity,
    purchaseId: purchase.id,
    sessionId,
  })

  return NextResponse.json(
    {
      received: true,
      purchaseId: purchase.id,
      tokensGenerated: quantity,
    },
    { status: 200 }
  )
}
