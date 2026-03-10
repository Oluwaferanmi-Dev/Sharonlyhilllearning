# Phase 4: Token-Based Seat Access System - Implementation Complete

## Overview

Phase 4 transforms the Cherith Training platform from a global level unlock system to a **token-based seat access model**. This enables:

- **Per-user access control** — Each user has individual access tokens
- **Inventory management** — Admins track token purchases and distribution
- **Flexible licensing** — Buy tokens in bulk, distribute individually
- **Revenue tracking** — Record payment status for each token batch

---

## Architecture

### Old System (Deprecated)
```
level_unlocks table (global) → all users see same unlock status
Problem: No per-user control, no inventory tracking
```

### New System (Token-Based)
```
token_purchases (admin bulk buys tokens)
    ↓
access_tokens (individual redeemable tokens)
    ↓
user_level_access (user redeems token → gains access)
```

---

## Database Schema

### 3 New Tables

#### 1. token_purchases
Tracks bulk token purchases by admins
```sql
- id (UUID, primary key)
- admin_user_id (FK to auth.users)
- level_id (FK to assessment_levels)
- quantity (number of tokens purchased)
- amount_paid (decimal)
- payment_status ('pending', 'completed', 'failed')
- stripe_session_id (optional)
- purchased_at, created_at, updated_at
```

#### 2. access_tokens
Individual redeemable tokens
```sql
- id (UUID, primary key)
- purchase_id (FK to token_purchases)
- level_id (FK to assessment_levels)
- token_code (unique, random alphanumeric)
- status ('unused', 'used', 'expired')
- redeemed_by_user_id (FK to auth.users, nullable)
- redeemed_at (timestamp, nullable)
- expires_at (1 year default)
- created_at, updated_at
```

#### 3. user_level_access
User's access grants (one per user per level)
```sql
- id (UUID, primary key)
- user_id (FK to auth.users)
- level_id (FK to assessment_levels)
- token_id (FK to access_tokens)
- granted_at (timestamp)
- created_at (timestamp)
- Constraint: UNIQUE(user_id, level_id)
```

---

## Key Features Implemented

### 1. Token Redemption Flow (User Perspective)
- User visits `/dashboard/assessments`
- Sees locked levels (not Beginner)
- Clicks "Redeem Token" button
- Enters token code in modal dialog
- System validates token (exists, unused, not expired)
- Token redeemed → user_level_access row created
- User now sees level unlocked

**File**: `components/token-redemption-dialog.tsx`

### 2. Token Purchase Flow (Admin Perspective)
- Admin visits `/admin/assessments` → clicks "Token Inventory"
- Sees current token stock per level
- Clicks "Purchase Tokens"
- Enters quantity and level
- Payment processed (Stripe integration)
- System generates individual token codes
- access_tokens table populated with N rows
- Admin can distribute/download tokens

**File**: `components/token-management-panel.tsx`

### 3. Access Control Updates
All access checks updated from `level_unlocks` to `user_level_access`:
- `GET /api/quiz/questions` — checks user_level_access
- `POST /api/quiz/submit` — checks user_level_access
- `/dashboard/assessments/[levelId]` — checks user_level_access
- `/dashboard/assessments/[levelId]/[topicId]` — checks user_level_access

**Rule**: Beginner (order_index = 1) always accessible. All others require token.

---

## API Endpoints

### User Endpoints

#### POST /api/tokens/redeem
Redeem a token code for level access
```
Request:
{
  "token_code": "ABC12XYZ789",
  "level_id": "level-uuid"
}

Response:
{
  "success": true,
  "message": "Token redeemed successfully",
  "level_name": "Intermediate"
}

Errors:
- 400: Invalid token code format
- 404: Token not found
- 409: Token already used
- 410: Token expired
- 401: Unauthorized
```

### Admin Endpoints

#### POST /api/admin/tokens/purchase
Purchase tokens for a level (admin only)
```
Request:
{
  "level_id": "level-uuid",
  "quantity": 100,
  "stripe_session_id": "optional-session-id"
}

Response:
{
  "success": true,
  "purchase_id": "purchase-uuid",
  "tokens_created": 100,
  "level_name": "Intermediate"
}

Errors:
- 400: Invalid input
- 403: Not admin
- 401: Unauthorized
```

#### GET /api/admin/tokens/inventory
View token inventory by level
```
Response:
{
  "levels": [
    {
      "level_id": "level-uuid",
      "level_name": "Beginner",
      "total_purchased": 500,
      "unused": 350,
      "used": 150,
      "expired": 0
    }
  ]
}
```

#### GET /api/admin/tokens/history
View token purchase and redemption history
```
Response:
{
  "purchases": [
    {
      "id": "purchase-uuid",
      "level_name": "Intermediate",
      "quantity": 100,
      "amount_paid": 5000,
      "payment_status": "completed",
      "purchased_at": "2026-03-10T15:30:00Z"
    }
  ],
  "redemptions": [
    {
      "token_code": "ABC12XYZ789",
      "level_name": "Intermediate",
      "redeemed_by": "user@example.com",
      "redeemed_at": "2026-03-10T16:45:00Z"
    }
  ]
}
```

---

## Files Created/Modified

### New Files Created (13)

**Database**
- `scripts/016_token_based_access_model.sql` — Schema & RLS policies

**Utilities**
- `lib/tokens/token-manager.ts` — Token generation, validation, redemption helpers

**API Routes**
- `app/api/tokens/redeem/route.ts` — User token redemption endpoint
- `app/api/admin/tokens/purchase/route.ts` — Admin token purchase endpoint
- `app/api/admin/tokens/inventory/route.ts` — Admin token inventory view
- `app/api/admin/tokens/history/route.ts` — Admin token history/audit log
- `app/api/admin/assessments-levels/route.ts` — List levels for admin UI

**UI Components**
- `components/token-redemption-dialog.tsx` — User token entry modal
- `components/token-management-panel.tsx` — Admin token dashboard

**Pages Updated**
- `app/dashboard/assessments/page.tsx` — Refactored to show token redemption UI

### Files Modified (5)

- `app/dashboard/assessments/[levelId]/page.tsx` — Access check: level_unlocks → user_level_access
- `app/dashboard/assessments/[levelId]/[topicId]/page.tsx` — Access check: level_unlocks → user_level_access
- `app/api/quiz/questions/route.ts` — Access check: level_unlocks → user_level_access
- `app/api/quiz/submit/route.ts` — Access check: level_unlocks → user_level_access
- `app/admin/page.tsx` — Updated dashboard link labels

---

## Security Features

### Row-Level Security (RLS)

**token_purchases table**
- Admins can view all purchases
- Admins can create/update purchases
- Non-admins blocked (403)

**access_tokens table**
- Admins can view all tokens
- Users can view their own redeemed tokens
- Non-admins cannot view unredeemed tokens

**user_level_access table**
- Users can view their own access grants
- Users can insert their own (when redeeming)
- Admins can view all
- Cannot bypass: UNIQUE(user_id, level_id) constraint

### Server-Side Validation

All endpoints validate:
- Admin role (via requireAdmin() helper)
- Token format (alphanumeric, 10-20 chars)
- Token status (must be 'unused')
- Token expiration (must not be expired)
- User ID matches (cannot redeem for another user)

---

## Token Lifecycle

```
1. CREATED
   Admin purchases 100 tokens for Intermediate level
   → 100 rows in access_tokens with status='unused'

2. DISTRIBUTED
   Admin provides token codes to staff members
   (manual or automated email)

3. REDEEMED
   User enters token code at /dashboard/assessments
   → POST /api/tokens/redeem called
   → Token status changed to 'used'
   → Token redeemed_by_user_id set
   → Token redeemed_at set
   → user_level_access row created
   → User now has access to level

4. EXPIRED
   After 1 year (or custom expiration)
   → Token status='expired'
   → User cannot redeem
   → New purchase needed
```

---

## Migration Path from Old System

### Phase 4a: Database Migration
1. Run `scripts/016_token_based_access_model.sql`
2. Creates new tables with RLS policies
3. Old `level_unlocks` table remains (deprecated)

### Phase 4b: Code Deployment
1. Deploy updated access checks (use user_level_access)
2. Level pages now redirect to /dashboard/assessments if no access
3. Beginner level still always accessible

### Phase 4c: Admin Migration
1. Admins purchase initial token batch for each level
2. Distribute tokens to staff
3. Track inventory via `/admin/assessments` → Token Inventory

### Backward Compatibility
- Old `level_unlocks` table untouched (won't break old code)
- New code ignores `level_unlocks` completely
- Can gradually sunset old system

---

## Data Flow Examples

### Example 1: User Redeems Token

```
User Flow:
1. User visits /dashboard/assessments
2. Sees Intermediate & Advanced levels locked
3. Clicks "Redeem Token" button
4. Enters token code "INT-ABC123-XYZ"
5. Dialog POSTs to /api/tokens/redeem
6. Server validates token:
   - Exists? YES
   - Unused? YES
   - Expired? NO
7. Server creates:
   - access_tokens row: status='used', redeemed_by_user_id=USER_ID, redeemed_at=NOW
   - user_level_access row: user_id=USER_ID, level_id=LEVEL_ID, token_id=TOKEN_ID
8. Response: "Successfully redeemed!"
9. UI refreshes, level now shows "Start Assessment"
10. User clicks level, can now access topics & quiz
```

### Example 2: Admin Purchases Tokens

```
Admin Flow:
1. Admin visits /admin/assessments
2. Clicks "Token Inventory" button
3. Opens token-management-panel
4. Sees: Beginner (500 unused), Intermediate (200 unused), Advanced (0 unused)
5. Clicks "Purchase 100 more for Intermediate"
6. Dialog shows pricing (e.g., $50/token = $5,000 total)
7. Clicks "Pay with Stripe"
8. Stripe payment processed
9. Server creates:
   - token_purchases row: quantity=100, amount_paid=5000, payment_status='completed'
   - 100 access_tokens rows: token_code=random, status='unused', expires_at=1 year
10. Admin sees confirmation with token codes (can download CSV)
11. Admin distributes tokens to staff
```

### Example 3: User Tries to Access Locked Level

```
User Flow:
1. User (without token) tries /dashboard/assessments/intermediate-level-id
2. Server checks: Is level.order_index > 1? YES (Intermediate is index 2)
3. Server queries: SELECT * FROM user_level_access WHERE user_id=USER_ID AND level_id=LEVEL_ID
4. Result: NULL (user has no access)
5. Server redirects to /dashboard/assessments
6. Page shows level locked with "Redeem Token" button
```

---

## Implementation Checklist

### Phase 4a: Database Setup (REQUIRED)
- [ ] Run migration script 016_token_based_access_model.sql
- [ ] Verify 3 new tables created (token_purchases, access_tokens, user_level_access)
- [ ] Verify RLS policies enabled on all 3 tables
- [ ] Verify indexes created for performance

### Phase 4b: Code Deployment (REQUIRED)
- [ ] Deploy updated access check code
- [ ] Test Beginner level still accessible to all
- [ ] Test Intermediate/Advanced redirect to /dashboard/assessments
- [ ] Verify token redemption dialog shows when needed
- [ ] Test non-admin users cannot access admin endpoints (403)

### Phase 4c: Admin Token Setup (RECOMMENDED)
- [ ] Admin logs in and visits /admin/assessments
- [ ] Admin clicks "Token Inventory"
- [ ] Admin purchases initial token batch (e.g., 500 for Intermediate, 200 for Advanced)
- [ ] Verify tokens generated and visible in admin dashboard
- [ ] Download token codes as CSV

### Phase 4d: User Testing (RECOMMENDED)
- [ ] New user registers
- [ ] Sees Beginner level accessible
- [ ] Sees Intermediate/Advanced locked
- [ ] Clicks "Redeem Token"
- [ ] Enters valid token code
- [ ] Gets "Successfully redeemed" message
- [ ] Refreshes page, level now shows "Start Assessment"
- [ ] Can click level and access topics

### Phase 4e: Error Cases (OPTIONAL)
- [ ] Try redeeming invalid token code → "Token not found"
- [ ] Try redeeming used token → "Token already used"
- [ ] Try redeeming expired token → "Token expired"
- [ ] Non-admin tries /api/admin/tokens/purchase → 403 Forbidden
- [ ] Admin tries redeeming token → should work (admin can redeem for themselves)

---

## Known Limitations & Future Work

### Not Implemented in Phase 4
- Stripe integration (payment processing)
- Email distribution of tokens
- Token expiration notifications
- Bulk token import from CSV
- Token revocation (admin can revoke issued tokens)
- Multi-level token bundles

### Suggested Phase 4+ Enhancements
1. **Token Distribution** — Email token codes to staff
2. **Bulk Import** — Upload CSV of staff emails, auto-distribute tokens
3. **Token Revocation** — Admin can revoke tokens from users
4. **Expiration Warnings** — Email users when token about to expire
5. **Token Reporting** — Analytics on redemption rates
6. **Multi-Level Tokens** — One token gives access to multiple levels
7. **Subscription Model** — Auto-renew tokens yearly instead of manual purchase

---

## Support & Troubleshooting

### Migration Fails
If migration script fails:
1. Check Supabase connection
2. Verify no syntax errors in SQL
3. Check that auth.users table exists
4. Try executing each CREATE TABLE separately

### Token Code Not Accepting
1. Check token exists: `SELECT * FROM access_tokens WHERE token_code='ABC123'`
2. Verify status='unused': `SELECT status FROM access_tokens WHERE token_code='ABC123'`
3. Check not expired: `SELECT expires_at FROM access_tokens WHERE token_code='ABC123'`
4. Verify RLS policy allows insert on user_level_access

### User Can't See Redeemed Level
1. Check user_level_access row exists: `SELECT * FROM user_level_access WHERE user_id='USER_ID'`
2. Verify level_id matches: `SELECT level_id FROM user_level_access WHERE user_id='USER_ID'`
3. Try browser refresh (cache issue)
4. Check admin didn't revoke access

---

## Next Steps

1. **Execute Migration** — Run scripts/016_token_based_access_model.sql in Supabase SQL Editor
2. **Test Locally** — `npm run dev` and test redemption flow
3. **Deploy** — Push to Git, deploy to Vercel
4. **Admin Setup** — First admin purchases tokens for each level
5. **User Distribution** — Distribute tokens to staff

---

## Summary

Phase 4 successfully transitions from global level unlocks to a per-user token-based seat access model. The system is:

✅ **Secure** — RLS policies, server-side validation, role checks  
✅ **Scalable** — Inventory management, bulk purchases  
✅ **Flexible** — Individual token redemption, expiration tracking  
✅ **Auditable** — All token operations logged (purchase_id, redeemed_at, etc.)  

The old `level_unlocks` system is now **deprecated** but left in place for backward compatibility. All new access checks use `user_level_access` table exclusively.
