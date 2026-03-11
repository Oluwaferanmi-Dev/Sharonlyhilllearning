import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export const STRIPE_CURRENCY = 'usd'

/**
 * Convert price from dollars to cents for Stripe
 * Stripe amounts are always in the smallest currency unit (cents for USD)
 * @param priceInDollars - Price in dollars (e.g., 100)
 * @returns Price in cents (e.g., 10000)
 */
export function convertToStripeAmount(priceInDollars: number): number {
  return Math.round(priceInDollars * 100)
}

/**
 * Create a Stripe checkout session for token purchases
 * @param levelName - Name of the assessment level
 * @param quantity - Number of tokens
 * @param pricePerToken - Price per token in USD
 * @param successUrl - Redirect URL on success
 * @param cancelUrl - Redirect URL on cancel
 * @returns Stripe checkout session
 */
export async function createTokenCheckoutSession(
  levelName: string,
  quantity: number,
  pricePerToken: number,
  successUrl: string,
  cancelUrl: string
) {
  const totalInDollars = quantity * pricePerToken
  const totalInCents = convertToStripeAmount(totalInDollars)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    currency: STRIPE_CURRENCY,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        price_data: {
          currency: STRIPE_CURRENCY,
          product_data: {
            name: `${levelName} Assessment Tokens`,
            description: `${quantity} token${quantity !== 1 ? 's' : ''} for ${levelName} level assessments`,
          },
          unit_amount: convertToStripeAmount(pricePerToken),
        },
        quantity,
      },
    ],
  })

  return session
}

/**
 * Validate Stripe webhook signature
 * @param body - Raw request body
 * @param signature - Stripe-Signature header value
 * @returns Parsed event or null if invalid
 */
export function validateWebhookSignature(body: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('[v0] Webhook signature validation error:', error)
    return null
  }
}
