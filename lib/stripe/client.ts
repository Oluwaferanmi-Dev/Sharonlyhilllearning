import Stripe from 'stripe'

/**
 * Initialize Stripe with secret key for server-side operations
 */
export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-15',
  })
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
  }

  return Stripe.webhooks.constructEvent(body, signature, secret)
}

/**
 * Convert USD amount to Stripe's smallest currency unit (cents)
 */
export function priceToStripeAmount(priceUsd: number): number {
  return Math.round(priceUsd * 100)
}

/**
 * Convert Stripe amount (cents) back to USD
 */
export function stripeAmountToPrice(amountCents: number): number {
  return amountCents / 100
}
