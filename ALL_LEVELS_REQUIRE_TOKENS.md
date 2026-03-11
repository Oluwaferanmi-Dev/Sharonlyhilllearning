## All Levels Now Require Tokens

Updated Phase 4 to enforce token-based access for **ALL assessment levels**, including Beginner.

### Changes Made

**1. Level Page Access** (`app/dashboard/assessments/[levelId]/page.tsx`)
- Removed `order_index > 1` check
- All levels now require `user_level_access` record
- Unauthenticated users redirected to `/dashboard/assessments`

**2. Topic Page Access** (`app/dashboard/assessments/[levelId]/[topicId]/page.tsx`)
- Removed `order_index > 1` check
- All levels now require `user_level_access` record
- Unauthenticated users redirected to `/dashboard/assessments`

**3. Quiz Questions API** (`app/api/quiz/questions/route.ts`)
- Removed `order_index > 1` check
- All levels now require `user_level_access` record
- Removed old `level_unlocks` fallback logic
- Returns 403 Forbidden if user lacks access

**4. Quiz Submit API** (`app/api/quiz/submit/route.ts`)
- Removed `order_index > 1` check
- All levels now require `user_level_access` record
- Returns 403 Forbidden if user lacks access

**5. Assessments Dashboard** (`app/dashboard/assessments/page.tsx`)
- Updated access logic: `hasAccess = userAccess[level.id]` (removed Beginner exception)
- All levels show as locked until token redeemed
- Token redemption dialog available for all levels

### Behavior

**Before Update:**
- Beginner level always accessible
- Intermediate/Advanced required unlock or payment

**After Update:**
- NO levels accessible without token
- All users must redeem token code for any level
- Admin grants access by purchasing tokens and distributing codes

### Testing Checklist

- [ ] New user sees all levels as locked
- [ ] User can click "Redeem Token" on any level
- [ ] User redeems token → gains access to that level
- [ ] User can then start assessments on that level
- [ ] Non-existent token code rejected
- [ ] Already-used token code rejected
- [ ] Admin can purchase tokens for all levels
- [ ] Token inventory shows correctly

### Database

No changes to database schema. Existing `user_level_access` table works as-is.

### Deployment

1. Build: `npm run build` (should succeed)
2. Deploy: `git push` to trigger Vercel build
3. Test: Try accessing any level without redeeming token (should redirect to /dashboard/assessments)
