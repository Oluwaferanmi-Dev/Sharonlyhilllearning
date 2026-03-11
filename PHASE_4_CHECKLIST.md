# Phase 4: Token-Based Access - Testing & Deployment Checklist

## Pre-Deployment Checklist

### Database Setup (Phase 4a)
- [ ] **Read** `scripts/016_token_based_access_model.sql` to understand schema
- [ ] **Execute** migration in Supabase SQL Editor
- [ ] **Verify** migration completed (check for success message)
- [ ] **Query** `SELECT COUNT(*) FROM token_purchases` → Should return 0
- [ ] **Query** `SELECT COUNT(*) FROM access_tokens` → Should return 0
- [ ] **Query** `SELECT COUNT(*) FROM user_level_access` → Should return 0
- [ ] **Check RLS** `SELECT tableoid::regclass FROM pg_policy` → Should list RLS policies

### Code Deployment (Phase 4b)
- [ ] **Build** `npm run build` → Should complete without errors
- [ ] **Run locally** `npm run dev`
- [ ] **Check imports** — No TypeScript errors in console
- [ ] **Verify files** — All new files created (see list below)

### New Files Verification
Create files should exist:
- [ ] `scripts/016_token_based_access_model.sql`
- [ ] `lib/tokens/token-manager.ts`
- [ ] `app/api/tokens/redeem/route.ts`
- [ ] `app/api/admin/tokens/purchase/route.ts`
- [ ] `app/api/admin/tokens/inventory/route.ts`
- [ ] `app/api/admin/tokens/history/route.ts`
- [ ] `app/api/admin/assessments-levels/route.ts`
- [ ] `components/token-redemption-dialog.tsx`
- [ ] `components/token-management-panel.tsx`

Modified files should be updated:
- [ ] `app/dashboard/assessments/page.tsx` — Uses token-redemption-dialog
- [ ] `app/dashboard/assessments/[levelId]/page.tsx` — Checks user_level_access
- [ ] `app/dashboard/assessments/[levelId]/[topicId]/page.tsx` — Checks user_level_access
- [ ] `app/api/quiz/questions/route.ts` — Checks user_level_access
- [ ] `app/api/quiz/submit/route.ts` — Checks user_level_access

---

## Functional Testing

### Test 1: Beginner Level Still Always Accessible

**Setup:**
1. Register new user (no tokens)
2. Visit `/dashboard/assessments`

**Expected:**
- Beginner level shows "Start Assessment" button (not locked)
- Can click and access level

**Verification:**
```bash
# Terminal
console logs should show user has access to Beginner
Level check: order_index=1, always accessible
```

---

### Test 2: Intermediate/Advanced Locked Without Token

**Setup:**
1. Same user from Test 1
2. Try accessing `/dashboard/assessments/intermediate-level-id`

**Expected:**
- Page redirects to `/dashboard/assessments`
- Level shows locked with "Redeem Token" button
- Lock icon animates

**Verification:**
```bash
Browser console: No JavaScript errors
Network tab: Should see redirect in response headers
```

---

### Test 3: Token Redemption Dialog

**Setup:**
1. User from Test 1 on assessments page
2. Click "Redeem Token" button

**Expected:**
- Modal dialog opens
- Title: "Redeem Access Token"
- Input field for token code
- "Redeem" button (disabled until input valid)

**Verification:**
```bash
No TypeScript errors in console
Dialog renders correctly
Input validation works (button enables when text entered)
```

---

### Test 4: Admin Can Purchase Tokens

**Setup:**
1. Admin user logs in
2. Visit `/admin/assessments`

**Expected:**
- See assessment levels listed
- "Token Inventory" button visible (or similar)
- Can click to open token management panel

**Verification:**
```bash
Console: No errors
API call to GET /api/admin/tokens/inventory
Should return empty or existing token inventory
```

---

### Test 5: Token Validation (Invalid Token Code)

**Setup:**
1. Non-admin user on assessments page
2. Click "Redeem Token"
3. Enter: `INVALID-CODE-12345`

**Expected:**
- Click "Redeem"
- Error: "Token not found"
- Dialog stays open (can try another code)

**Verification:**
```bash
Network: POST /api/tokens/redeem returns 404
Response body: { error: "Token not found" }
No page redirect
```

---

### Test 6: Admin-Only Access Check

**Setup:**
1. Non-admin user
2. Try POST to `/api/admin/tokens/purchase`

**Expected:**
- Request rejected with 403 Forbidden
- Response: { error: "Unauthorized: Admin access required" }

**Verification:**
```bash
curl -X POST http://localhost:3000/api/admin/tokens/purchase \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"level_id":"...","quantity":10}'
# Should return 403
```

---

### Test 7: Access Check in Quiz Endpoints

**Setup:**
1. Non-token user tries accessing Intermediate quiz
2. Browser tries `GET /api/quiz/questions?levelId=intermediate&topicId=topic1`

**Expected:**
- Request rejected with 403 Forbidden
- Response: { error: "Unauthorized: You do not have access..." }
- Quiz doesn't load

**Verification:**
```bash
Network tab: Status code 403
Response body contains "Unauthorized"
Quiz page shows error or redirect
```

---

### Test 8: Token Code Format Validation

**Setup:**
1. User on token redemption dialog
2. Enter various invalid codes

**Test cases:**
- Empty: `""` → "Please enter a token code"
- Too short: `ABC` → "Token code must be 10-20 characters"
- Special chars: `ABC@#$%!*` → "Token code must be alphanumeric"
- Too long: `ABCDEFGHIJKLMNOPQRSTUVWXYZ` → "Token code must be 10-20 characters"

**Expected:**
- Client-side validation prevents submission
- Server-side validation for safety

---

### Test 9: Rate Limiting (If Implemented)

**Setup:**
1. User tries redeeming same invalid code 5 times

**Expected:**
- After 5 attempts in 1 minute: "Too many attempts, try again later"
- Or IP-based rate limit: "Rate limited, try again in 5 minutes"

**Verification:**
```bash
Check rate-limit.ts was applied to /api/tokens/redeem
Monitor server logs for rate limit hits
```

---

### Test 10: Database Constraints (Single Access Per User Per Level)

**Setup:**
1. Admin manually inserts two `user_level_access` rows for same user + level

**Expected:**
- Second insert fails with UNIQUE constraint error
- Error: "duplicate key value violates unique constraint"

**Verification:**
```sql
-- In Supabase SQL Editor:
INSERT INTO user_level_access 
  (user_id, level_id, token_id) 
VALUES 
  ('user-id', 'level-id', 'token-1');

-- Try again with same user/level:
INSERT INTO user_level_access 
  (user_id, level_id, token_id) 
VALUES 
  ('user-id', 'level-id', 'token-2');

-- Should fail with UNIQUE constraint error
```

---

## Error Scenarios

### Error 1: Migration Fails

**If:** `scripts/016_token_based_access_model.sql` errors

**Troubleshoot:**
1. Check Supabase is connected
2. Copy/paste one CREATE TABLE at a time
3. Check syntax: `CREATE TABLE IF NOT EXISTS public.token_purchases (...)`
4. Check UUIDs generated with `gen_random_uuid()`
5. Verify auth.users table exists

**Resolution:**
- Fix SQL errors and retry
- Or create tables manually from PHASE_4_IMPLEMENTATION.md

---

### Error 2: API 500 Error on Token Redemption

**If:** `/api/tokens/redeem` returns 500

**Troubleshoot:**
1. Check server logs for error message
2. Verify `access_tokens` table exists: `SELECT COUNT(*) FROM access_tokens`
3. Verify RLS policy exists: `SELECT polname FROM pg_policy WHERE tablename='access_tokens'`
4. Check token manager imports in route.ts
5. Add console.log statements to debug

**Resolution:**
```typescript
// Add debug logging:
console.log("[v0] Token code:", tokenCode);
console.log("[v0] Query params:", { levelId });
console.log("[v0] Query result:", tokenRow);
```

---

### Error 3: User Can Access Locked Level (Security Issue)

**If:** Non-token user can view Intermediate level page

**Troubleshoot:**
1. Check access control in `[levelId]/page.tsx`
2. Verify query: `SELECT * FROM user_level_access WHERE user_id=? AND level_id=?`
3. Check redirect logic: `if (!userAccess) { redirect(...) }`
4. Verify RLS not bypassed

**Resolution:**
- Ensure `redirect()` is called before rendering
- Clear browser cache
- Check JWT contains correct user_id

---

### Error 4: Token Can Be Redeemed Twice

**If:** Same user redeems same token twice

**Troubleshoot:**
1. Check redemption validation: `WHERE status = 'unused'`
2. Check token status update: `UPDATE access_tokens SET status = 'used'`
3. Verify UNIQUE constraint on `(user_id, level_id)`
4. Check for transaction issues

**Resolution:**
```sql
-- Check token status:
SELECT status FROM access_tokens WHERE token_code = 'ABC123';
-- Should show 'used' after first redemption

-- Check access record:
SELECT * FROM user_level_access WHERE user_id=? AND level_id=?;
-- Should have one row
```

---

## Performance Testing

### Test 1: Load 1,000 Tokens

**Setup:**
1. Admin dashboard with 1,000 unused tokens
2. Visit `/api/admin/tokens/inventory`

**Expected:**
- Response time < 1 second
- All token counts accurate
- No timeout errors

**Verification:**
```bash
time curl http://localhost:3000/api/admin/tokens/inventory
# Should see response in <1s
```

---

### Test 2: Redeem Token Under Load

**Setup:**
1. 100 concurrent users trying to redeem tokens
2. Monitor server response time

**Expected:**
- No race conditions (each token redeemed only once)
- Response time < 500ms per request
- No database locks

**Verification:**
```bash
# Use Apache Bench or similar:
ab -n 100 -c 10 http://localhost:3000/api/tokens/redeem \
  -p data.json \
  -T application/json

# Watch database for locks:
SELECT * FROM pg_locks;
```

---

## Deployment Checklist

### Before Deploying

- [ ] All tests above pass locally
- [ ] No TypeScript errors: `npm run build`
- [ ] No console errors in browser DevTools
- [ ] Database migration executed in Supabase
- [ ] Environment variables set (if any)

### Deployment Steps

1. **Commit code**
   ```bash
   git add .
   git commit -m "Phase 4: Token-based seat access system"
   ```

2. **Push to GitHub**
   ```bash
   git push origin main
   ```

3. **Vercel auto-deploys**
   - Check: https://vercel.com/dashboard
   - Wait for build to complete (should take 2-3 min)

4. **Verify Deployment**
   ```bash
   # Visit production URL
   https://your-app.vercel.app/dashboard/assessments
   # Should load without errors
   ```

### Post-Deployment

- [ ] Visit production assessments page
- [ ] Try redeeming a (dummy) token
- [ ] Check admin token inventory page
- [ ] Monitor error logs (if configured)
- [ ] Notify admins about token system

---

## Rollback Plan

If Phase 4 breaks production:

1. **Revert deployment** in Vercel dashboard
2. **Keep database** — token tables won't hurt
3. **Old code** will ignore new tables
4. **Users** unaffected (Beginner level still works)

---

## Sign-Off

- [ ] All functional tests pass
- [ ] No security issues found
- [ ] Performance acceptable
- [ ] Deployment successful
- [ ] Users can redeem tokens
- [ ] Admins can purchase tokens
- [ ] Ready for production

---

## Notes

- **Token code format:** Random alphanumeric, 10-20 chars (e.g., `INT-ABC-123XYZ`)
- **Token expiration:** 1 year from creation (can customize in schema)
- **No automatic cleanup:** Expired tokens remain in DB (for audit)
- **Admin deletion:** Admins cannot delete tokens (only mark as expired in future)
- **Beginner always free:** No token needed for Beginner level (design choice)

---

## Support

If issues during testing, check:
1. **PHASE_4_IMPLEMENTATION.md** — Full technical docs
2. **Token manager validation** — `lib/tokens/token-manager.ts`
3. **API endpoints** — Compare to spec in docs
4. **Database schema** — Run queries in Supabase SQL Editor
5. **RLS policies** — Verify with `SELECT * FROM pg_policy`

Good luck!
