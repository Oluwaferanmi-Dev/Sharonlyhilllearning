# Phase 5: Stripe Checkout Integration for Token Purchases

## Overview

Phase 5 implements real Stripe payment processing for token purchases. Admins can now purchase training tokens using Stripe Checkout, and tokens are automatically generated upon successful payment.

## Architecture

```
Admin Dashboard
    ↓
[Click "Purchase Tokens"]
    ↓
POST /api/payment/create-checkout-session
    ├─ Verify admin authentication
    ├─ Fetch level and price from database
    ├─ Create Stripe checkout session
    └─ Return checkout URL
    ↓
[Redirect to Stripe Checkout]
    ↓
[Payment Processing]
    ↓
Stripe Webhook
    ↓
POST /api/payment/webhook
    ├─ Verify webhook signature
    ├─ Check for duplicate processing
    ├─ Create token_purchases record
    ├─ Generate access tokens (with collision detection)
    └─ Return webhook confirmation
    ↓
[Admin Returns to Dashboard]
    ↓
Token Inventory Updated
```

## Files Added

### 1. **lib/stripe/client.ts** — Stripe utility functions
   - `getStripeClient()` — Initialize Stripe SDK
   - `verifyWebhookSignature()` — Verify webhook authenticity
   - `priceToStripeAmount()` — Convert USD to cents for Stripe
   - `stripeAmountToPrice()` — Convert cents back to USD

### 2. **app/api/payment/create-checkout-session/route.ts** — Checkout session creation
   - Endpoint: `POST /api/payment/create-checkout-session`
   - Creates Stripe checkout session with metadata
   - Includes level ID, quantity, and admin user ID in metadata
   - Returns Stripe checkout URL

### 3. **app/api/payment/webhook/route.ts** — Webhook handler
   - Endpoint: `POST /api/payment/webhook`
   - Listens for `checkout.session.completed` events
   - Creates token purchase records
   - Generates access tokens with collision detection
   - Prevents duplicate processing via stripe_session_id

### 4. **components/stripe-checkout-button.tsx** — UI component
   - Button component for initiating checkout
   - Handles redirect to Stripe Checkout
   - Shows loading state during processing

### 5. **lib/tokens/token-manager.ts** — Updated
   - Enhanced `generateTokenCode()` with better entropy
   - New format: `CHR-XXXX-XXXX-XXXX`
   - 60 bits of entropy (secure against brute force)
   - Updated validation pattern

## Security Features

### 1. Webhook Signature Verification
All webhooks are verified using Stripe's signature validation before processing:
```typescript
const event = verifyWebhookSignature(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
```

### 2. Idempotency via stripe_session_id
Prevents duplicate token generation if webhook is retried:
```sql
UNIQUE(stripe_session_id) in token_purchases table
```

### 3. Admin Authentication
Checkout session creation requires admin authentication:
```typescript
const { error: adminError } = await requireAdmin()
if (adminError) return adminError
```

### 4. Cryptographically Secure Token Generation
Uses `crypto.getRandomValues()` for secure random generation:
```typescript
const randomBytes = crypto.getRandomValues(new Uint8Array(totalChars))
```

### 5. Token Code Collision Detection
Webhook handler retries up to 10 times if collision occurs:
```typescript
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
```

## Environment Variables Required

Add these to your `.env.local`:

```env
# Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Token Generation Flow

### Token Code Format
```
CHR-XXXX-XXXX-XXXX

Example: CHR-A3K9-X2L7-M9P5
```

### Generation Process
1. Generate 12 cryptographically secure random bytes
2. Map each byte to alphanumeric character set (36 chars)
3. Format as `CHR-XXXX-XXXX-XXXX`
4. Check for collision in database
5. If collision detected, retry (max 10 attempts)

### Entropy Analysis
- 36^12 possible combinations ≈ 2^60 entropy
- Brute force attack would require ~10^18 attempts on average
- Extremely low collision probability

## Webhook Security

### Signature Verification
Every webhook is verified using Stripe's signed headers:
1. Extract signature from `stripe-signature` header
2. Construct event using `Stripe.webhooks.constructEvent()`
3. If verification fails, reject the webhook (400 response)
4. Only process if signature is valid

### Idempotency
Duplicate webhook deliveries are handled gracefully:
1. Store `stripe_session_id` in database
2. Before processing, check if session was already processed
3. If yes, return success (200) without duplicate generation
4. Stripe will consider the webhook delivery successful

## Admin Dashboard Integration

### Add Checkout Button to Assessment Level Card

```tsx
import { StripeCheckoutButton } from '@/components/stripe-checkout-button'

// In your level card:
<StripeCheckoutButton
  levelId={level.id}
  levelName={level.name}
  quantity={selectedQuantity}
/>
```

### Handle Success/Cancellation

After Stripe Checkout, users are redirected back to the dashboard:
- Success: `/admin/assessments?checkout=success`
- Cancelled: `/admin/assessments?checkout=cancelled`

Add query parameter handling to show toast notifications:
```tsx
const searchParams = useSearchParams()
const checkoutStatus = searchParams.get('checkout')

useEffect(() => {
  if (checkoutStatus === 'success') {
    toast({
      title: 'Payment Successful',
      description: 'Tokens have been generated',
    })
  }
}, [checkoutStatus, toast])
```

## Testing with Stripe Sandbox Mode

### 1. Get Test API Keys
- Go to https://dashboard.stripe.com/apikeys (enable test mode)
- Copy `Secret key` and `Webhook signing secret`
- Add to `.env.local`

### 2. Test Cards
Stripe provides test cards for different scenarios:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

**Payment Requires Authentication:**
- Card: `4000 0025 0000 3155`

**Payment Declined:**
- Card: `4000 0000 0000 0002`

### 3. Test Webhook Delivery

#### Option A: Using Stripe Dashboard
1. Go to https://dashboard.stripe.com/webhooks (test mode)
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/payment/webhook`
4. Select events: `checkout.session.completed`
5. Click "Add endpoint"
6. Use "Send test event" to trigger webhook manually

#### Option B: Using Stripe CLI (Local Testing)
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/payment/webhook

# In another terminal, run your app:
npm run dev

# Trigger a test payment:
stripe trigger checkout.session.completed
```

### 4. Verify Token Generation

After successful checkout:
1. Check `token_purchases` table for new record
2. Check `access_tokens` table for generated tokens
3. Verify `stripe_session_id` is stored
4. Confirm token codes follow pattern: `CHR-XXXX-XXXX-XXXX`

## Database Schema

### token_purchases
```sql
id UUID PRIMARY KEY
admin_user_id UUID (FOREIGN KEY users)
level_id UUID (FOREIGN KEY assessment_levels)
quantity INTEGER
amount_paid DECIMAL(10,2)
payment_status TEXT ('pending', 'completed', 'failed')
stripe_session_id TEXT UNIQUE
purchased_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

### access_tokens
```sql
id UUID PRIMARY KEY
purchase_id UUID (FOREIGN KEY token_purchases)
level_id UUID (FOREIGN KEY assessment_levels)
token_code TEXT UNIQUE
status TEXT ('unused', 'used', 'expired')
redeemed_by_user_id UUID (NULLABLE)
redeemed_at TIMESTAMP (NULLABLE)
expires_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Error Handling

### Checkout Creation Failures
- Invalid level ID → 404 response
- Missing price → 400 response
- Admin not authenticated → 401 response
- Stripe API error → 500 response

### Webhook Failures
- Invalid signature → 400 response
- Duplicate session → 200 (idempotent, no-op)
- Missing metadata → 400 response
- Database error → 500 response

## Monitoring & Debugging

### Key Log Points
1. **Checkout Creation**
   ```
   [v0] Checkout session created: { sessionId, levelId, quantity, ... }
   ```

2. **Webhook Processing**
   ```
   [v0] Webhook verified: checkout.session.completed
   [v0] Processing checkout completion: { sessionId, levelId, ... }
   ```

3. **Token Generation**
   ```
   [v0] Tokens generated: { count, purchaseId, sessionId }
   ```

4. **Duplicate Detection**
   ```
   [v0] Session already processed: sessionId
   ```

### Debugging Webhook Issues
- Enable webhook forwarding: `stripe listen --forward-to localhost:3000/api/payment/webhook`
- Check webhook delivery logs in Stripe Dashboard → Webhooks → View logs
- Verify signature secret matches `STRIPE_WEBHOOK_SECRET`
- Check application logs for processing errors

## Pricing Configuration

Prices are stored in the database (`assessment_levels.price_per_token` in USD):

```sql
-- View current prices
SELECT id, name, price_per_token, price_currency FROM assessment_levels;

-- Update price (as admin)
UPDATE assessment_levels SET price_per_token = 150 WHERE name = 'Intermediate';
```

Admins can modify prices via the admin dashboard assessments page.

## Future Enhancements

1. **Automatic Refunds** — Process refunds when students return unused tokens
2. **Partial Payments** — Allow payment plans for bulk token purchases
3. **Usage Analytics** — Track token redemption rates per level
4. **Discount Codes** — Support coupon/promo codes at checkout
5. **Multi-Currency** — Support payments in different currencies
6. **Invoice Generation** — Automatically generate invoices for purchases

## Troubleshooting

### "STRIPE_SECRET_KEY environment variable is required"
- Add `STRIPE_SECRET_KEY` to `.env.local`
- Restart the development server

### Webhook not being triggered
- Verify endpoint URL is publicly accessible
- Check webhook signing secret matches `STRIPE_WEBHOOK_SECRET`
- Use Stripe CLI to test locally
- Check Stripe Dashboard for failed delivery attempts

### Tokens not being generated
- Check webhook delivery logs in Stripe Dashboard
- Verify database has write permissions
- Check application logs for errors
- Ensure level ID exists in database

### Checkout redirects don't work
- Verify `successUrl` and `cancelUrl` are valid URLs
- Check browser console for redirect errors
- Ensure session ID is being returned correctly

## References

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe API Reference](https://stripe.com/docs/api)
