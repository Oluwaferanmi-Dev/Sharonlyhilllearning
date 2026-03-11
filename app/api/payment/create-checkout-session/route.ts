import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient, priceToStripeAmount } from '@/lib/stripe/client'
import { requireAdmin } from '@/lib/auth/require-admin'

/**
 * Create a Stripe checkout session for token purchase
 * POST /api/payment/create-checkout-session
 *
 * Request body:
 * {
 *   levelId: string (UUID)
 *   quantity: number
 *   successUrl: string (redirect after success)
 *   cancelUrl: string (redirect on cancel)
 * }
 *
 * Response:
 * {
 *   sessionId: string (Stripe session ID)
 *   checkoutUrl: string (Stripe Checkout URL)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const body = await request.json()
    const { levelId, quantity, successUrl, cancelUrl } = body

    // Validate inputs
    if (!levelId || !quantity || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: levelId, quantity, successUrl, cancelUrl' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 10000) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer (1-10000)' },
        { status: 400 }
      )
    }

    // Get admin user from request
    const supabase = await createClient()
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch level and price from database
    const adminClient = createAdminClient()
    const { data: level, error: levelError } = await adminClient
      .from('assessment_levels')
      .select('id, name, price_per_token')
      .eq('id', levelId)
      .maybeSingle()

    if (levelError || !level) {
      return NextResponse.json({ error: 'Assessment level not found' }, { status: 404 })
    }

    if (!level.price_per_token || level.price_per_token <= 0) {
      return NextResponse.json(
        { error: 'This level does not have a valid price configured' },
        { status: 400 }
      )
    }

    // Calculate total price
    const unitPrice = level.price_per_token
    const totalPrice = unitPrice * quantity
    const stripeCents = priceToStripeAmount(totalPrice)

    // Initialize Stripe
    const stripe = getStripeClient()

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: priceToStripeAmount(unitPrice),
            product_data: {
              name: `${level.name} Level - Training Tokens`,
              description: `${quantity} token${quantity !== 1 ? 's' : ''} for ${level.name} assessment level`,
            },
          },
          quantity,
        },
      ],
      metadata: {
        levelId,
        quantity: quantity.toString(),
        adminUserId: adminUser.id,
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    console.log('[v0] Checkout session created:', {
      sessionId: session.id,
      levelId,
      quantity,
      totalPrice,
      adminUserId: adminUser.id,
    })

    return NextResponse.json(
      {
        sessionId: session.id,
        checkoutUrl: session.url,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
