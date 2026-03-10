# Dynamic Token Pricing Implementation

## Overview

Token prices are now stored in the database and managed by admins through the control panel. This replaces any hardcoded pricing and enables dynamic pricing strategies.

## Database Schema

**Table**: `assessment_levels`

New columns:
- `price_per_token` (DECIMAL 10,2) - Price per token in NGN
- `price_currency` (TEXT) - Currency code (default: 'NGN')
- `price_updated_at` (TIMESTAMP) - When price was last changed
- `price_updated_by` (UUID) - Which admin updated it

**Constraints**:
- CHECK: `price_per_token >= 0` (prices must be non-negative)
- INDEX: `idx_assessment_levels_price` for fast lookups

## Default Prices

Seeds automatically:
- Beginner → 100 NGN
- Intermediate → 150 NGN
- Advanced → 200 NGN

## API Endpoints

### GET /api/admin/levels/[levelId]
Retrieves level details including current price.

```bash
curl https://your-app.com/api/admin/levels/level-uuid
```

Response:
```json
{
  "level": {
    "id": "level-uuid",
    "name": "Beginner",
    "price_per_token": 100,
    "price_currency": "NGN"
  }
}
```

### PUT /api/admin/levels/[levelId]
Updates level price (admin-only).

```bash
curl -X PUT https://your-app.com/api/admin/levels/level-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "price_per_token": 125,
    "description": "Optional: Update description"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Level updated successfully",
  "level": {
    "id": "level-uuid",
    "name": "Beginner",
    "price_per_token": 125,
    "price_updated_at": "2026-03-10T15:30:00Z"
  }
}
```

## Admin UI

**Location**: `/admin/assessments`

Features:
- View all levels with current prices
- Edit prices inline with validation
- Prices update immediately in database
- Audit trail: tracks who changed price and when

**Price Editing**:
1. Click level card to expand
2. See current price (e.g., "100 NGN")
3. Click "Edit" button
4. Enter new price (must be >= 0)
5. Click "Save" - validates and updates

## Token Purchase Flow

When admin purchases tokens:

1. Admin selects level and quantity
2. System fetches `price_per_token` from database
3. Calculates: `total = quantity × price_per_token`
4. Validates amount paid matches calculated total
5. Creates purchase and generates token codes

**Example**:
```
Quantity: 50 tokens
Beginner price: 100 NGN
Total: 50 × 100 = 5,000 NGN
```

## Validation

**Price Validation** (Zod schema):
- Must be a number
- Must be >= 0
- Must be <= 999,999.99
- Must be finite (no Infinity/NaN)

**Example Valid Prices**:
- 0 (free level)
- 100 (standard)
- 99.99 (with decimals)
- 999999.99 (maximum)

**Example Invalid Prices**:
- -10 (negative)
- "100" (string, not number)
- Infinity (not finite)
- NaN (not a number)

## Migration

**Run**: `scripts/017_add_level_pricing.sql`

This migration:
- Adds price columns with constraints
- Renames old `price` to `price_per_token` (if needed)
- Seeds default prices for Beginner/Intermediate/Advanced
- Creates performance index

## Stripe Integration Ready

The system is now ready for Stripe integration:

1. Admin purchases tokens with quantity
2. System calculates price from database
3. Price passed to Stripe Checkout
4. Stripe handles payment
5. On success, tokens are marked as paid

No hardcoded prices anywhere - fully dynamic and auditable.

## Files Modified

- `app/admin/assessments/page.tsx` - Price display and editing UI
- `app/api/admin/tokens/purchase/route.ts` - Fetch and use dynamic pricing
- `app/api/admin/levels/[levelId]/route.ts` - Update and retrieve prices
- `lib/schemas/pricing.ts` - Validation schemas

## Files Created

- `scripts/017_add_level_pricing.sql` - Database migration
- `lib/schemas/pricing.ts` - Zod validation schemas

## Testing Checklist

- [ ] Run migration: `scripts/017_add_level_pricing.sql`
- [ ] Verify prices seeded: Beginner=100, Intermediate=150, Advanced=200
- [ ] Admin can view prices at `/admin/assessments`
- [ ] Admin can edit prices (try changing Beginner to 125)
- [ ] Price update appears immediately
- [ ] Invalid prices rejected (try negative or non-number)
- [ ] Token purchase uses database price (check response)
- [ ] Prices appear in `/api/admin/levels/[levelId]` response

## Security

- Price updates require admin role
- All inputs validated server-side
- Database constraints prevent invalid prices
- Audit trail logs all price changes (price_updated_at, price_updated_by)
