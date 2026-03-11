# Phase 5: Stripe Checkout Integration - Implementation Checklist

## Environment Setup

- [ ] Get Stripe test API keys from https://dashboard.stripe.com/apikeys (enable test mode)
- [ ] Add `STRIPE_SECRET_KEY` to `.env.local`
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
- [ ] Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local` (optional for client-side, not used yet)
- [ ] Verify package.json has `stripe` dependency (already installed)

## Backend Implementation

### Stripe Utilities
- [x] Created `lib/stripe/client.ts`
  - [x] `getStripeClient()` function
  - [x] `verifyWebhookSignature()` function
  - [x] `priceToStripeAmount()` function
  - [x] `stripeAmountToPrice()` function

### Checkout Session API
- [x] Created `app/api/payment/create-checkout-session/route.ts`
  - [x] Admin authentication check
  - [x] Input validation (levelId, quantity, URLs)
  - [x] Fetch level and pricing from database
  - [x] Create Stripe session with metadata
  - [x] Return checkout URL to client
  - [x] Error handling for missing levels/prices

### Webhook Handler
- [x] Created `app/api/payment/webhook/route.ts`
  - [x] Webhook signature verification
  - [x] Extract metadata from session
  - [x] Check for duplicate processing (idempotency)
  - [x] Create token_purchases record
  - [x] Generate access tokens with collision detection
  - [x] Batch insert tokens
  - [x] Proper error handling and logging

### Token Generation
- [x] Updated `lib/tokens/token-manager.ts`
  - [x] Enhanced `generateTokenCode()` with new format: CHR-XXXX-XXXX-XXXX
  - [x] Use cryptographically secure random generation
  - [x] Updated `isValidTokenCode()` regex pattern
  - [x] Added entropy documentation

### UI Components
- [x] Created `components/stripe-checkout-button.tsx`
  - [x] Button component for initiating checkout
  - [x] Calls `/api/payment/create-checkout-session`
  - [x] Redirects to Stripe Checkout URL
  - [x] Loading state during processing
  - [x] Error toast notifications

## Frontend Integration

### Admin Dashboard
- [ ] Update `/admin/assessments/page.tsx` to include StripeCheckoutButton
- [ ] Add state for selected quantity per level
- [ ] Import and use `StripeCheckoutButton` in level card
- [ ] Handle success/cancelled query parameters
- [ ] Show toast notifications on return from checkout
- [ ] Refresh token inventory after successful purchase

### Webhook Return URLs
- [ ] Success redirect: `/admin/assessments?checkout=success`
- [ ] Cancel redirect: `/admin/assessments?checkout=cancelled`

## Testing

### Unit Tests
- [ ] Test `generateTokenCode()` generates valid format
- [ ] Test `isValidTokenCode()` with valid and invalid formats
- [ ] Test collision detection in token generation

### Integration Tests - Manual

#### Test Card: Successful Payment
1. [ ] Click "Purchase Tokens" button
2. [ ] Select level and quantity
3. [ ] Use test card: `4242 4242 4242 4242`
4. [ ] Fill in future expiry date and any CVC
5. [ ] Verify redirect back to dashboard with `?checkout=success`
6. [ ] Verify success toast notification appears
7. [ ] Verify token_purchases record created in database
8. [ ] Verify access_tokens created (quantity matches)
9. [ ] Verify token_code format: `CHR-XXXX-XXXX-XXXX`

#### Test Card: Payment Declined
1. [ ] Use test card: `4000 0000 0000 0002`
2. [ ] Verify error message displays
3. [ ] Verify no database records created
4. [ ] Verify user stays on Stripe Checkout

#### Test Card: Requires Authentication
1. [ ] Use test card: `4000 0025 0000 3155`
2. [ ] Verify authentication challenge appears
3. [ ] Complete 3D Secure flow
4. [ ] Verify tokens generated after authentication

### Webhook Testing - Local

Using Stripe CLI:
1. [ ] `stripe listen --forward-to localhost:3000/api/payment/webhook`
2. [ ] Verify webhook endpoint connected
3. [ ] `stripe trigger checkout.session.completed`
4. [ ] Check application logs for "Webhook verified"
5. [ ] Verify token_purchases record created
6. [ ] Verify access_tokens created

Using Stripe Dashboard:
1. [ ] Go to Webhooks in test mode
2. [ ] Create endpoint pointing to your webhook URL
3. [ ] Use "Send test event" for checkout.session.completed
4. [ ] Monitor delivery logs in dashboard

### Webhook Testing - Duplicate Handling
1. [ ] Trigger webhook for same session twice
2. [ ] Verify first delivery creates tokens
3. [ ] Verify second delivery returns 200 but doesn't duplicate tokens
4. [ ] Check logs for "Session already processed"

## Database Verification

After successful test payment:

```sql
-- Verify purchase created
SELECT * FROM token_purchases 
WHERE stripe_session_id = 'cs_test_...'
ORDER BY created_at DESC LIMIT 1;

-- Verify tokens created
SELECT * FROM access_tokens 
WHERE purchase_id = '...' 
ORDER BY created_at DESC LIMIT 10;

-- Verify token code format
SELECT token_code FROM access_tokens 
WHERE purchase_id = '...'
LIMIT 1;
-- Should match: CHR-XXXX-XXXX-XXXX
```

## Documentation

- [x] Created `PHASE_5_STRIPE_INTEGRATION.md` with:
  - [x] Architecture overview
  - [x] File descriptions
  - [x] Security features explanation
  - [x] Environment variables guide
  - [x] Token generation flow
  - [x] Webhook security details
  - [x] Admin dashboard integration guide
  - [x] Stripe sandbox testing instructions
  - [x] Database schema
  - [x] Error handling guide
  - [x] Monitoring & debugging guide
  - [x] Pricing configuration
  - [x] Troubleshooting section

- [x] Created `PHASE_5_CHECKLIST.md` (this file)

## Deployment Preparation

### Pre-Deployment
- [ ] Test all flows in local Stripe sandbox mode
- [ ] Verify all API endpoints return correct responses
- [ ] Check error handling with various invalid inputs
- [ ] Review security implementations
- [ ] Test webhook with Stripe CLI

### Production Setup
- [ ] Get production Stripe API keys
- [ ] Set `STRIPE_SECRET_KEY` to production key
- [ ] Set `STRIPE_WEBHOOK_SECRET` to production webhook secret
- [ ] Configure webhook endpoint in Stripe Dashboard (production mode)
- [ ] Enable HTTPS (required for Stripe)
- [ ] Test with small payment amount first
- [ ] Monitor webhook delivery logs for first 24 hours
- [ ] Set up alerts for failed webhooks

### Production Testing
- [ ] [ ] Process test payment with Stripe account
- [ ] Verify tokens created in production database
- [ ] Verify webhook deliveries in Stripe Dashboard
- [ ] Test return URLs work correctly
- [ ] Verify success/failure notifications display

## Admin Training

- [ ] Document token purchase process for admins
- [ ] Show where to find generated tokens
- [ ] Explain how students redeem tokens
- [ ] Provide troubleshooting for failed payments

## Monitoring

### Ongoing
- [ ] Monitor webhook delivery logs in Stripe Dashboard
- [ ] Check application logs for payment errors
- [ ] Verify token inventory grows correctly
- [ ] Monitor for duplicate token generation attempts
- [ ] Track payment success/failure rates

### Alerts (Optional)
- [ ] Set up alert for failed webhooks
- [ ] Set up alert for token generation failures
- [ ] Set up alert for high API error rates

## Post-Launch

- [ ] Collect feedback from admins on UX
- [ ] Monitor for any edge cases or issues
- [ ] Track payment volume and trends
- [ ] Optimize webhook retry logic if needed
- [ ] Plan Phase 6 (refunds, analytics, etc.)

## Rollback Plan

If issues occur:
1. Disable "Purchase Tokens" button in admin dashboard
2. Set `STRIPE_SECRET_KEY` to invalid value (disables checkout creation)
3. Stop webhook processing temporarily
4. Rollback to previous code version if needed
5. Investigate root cause before re-enabling

## Completed Files

### Code Files
- [x] `lib/stripe/client.ts` — Stripe utilities
- [x] `app/api/payment/create-checkout-session/route.ts` — Checkout creation
- [x] `app/api/payment/webhook/route.ts` — Webhook handler
- [x] `lib/tokens/token-manager.ts` — Updated token generation
- [x] `components/stripe-checkout-button.tsx` — Checkout button UI

### Documentation Files
- [x] `PHASE_5_STRIPE_INTEGRATION.md` — Full documentation
- [x] `PHASE_5_CHECKLIST.md` — This checklist

## Notes

- All API endpoints require admin authentication
- Webhook is unauthenticated (relies on signature verification)
- Token generation only happens in webhook (never in checkout flow)
- Duplicate prevention via stripe_session_id uniqueness
- Token collision detection with retry (10 attempts)
- USD currency hardcoded (cents conversion for Stripe)
