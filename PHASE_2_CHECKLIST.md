# Phase 2 Implementation Checklist

## Quick Start

### 1. Run Database Migration (Required)
- [ ] Go to your Supabase dashboard → SQL Editor
- [ ] Copy the contents of `scripts/014_add_single_attempt_policy.sql`
- [ ] Paste and execute in SQL Editor
- [ ] Verify: No errors, migration runs successfully

**What it does**: Adds UNIQUE constraint on (user_id, topic_id) to enforce single attempts

### 2. Test Locally
```bash
npm run dev
```

#### Test Single-Attempt Enforcement
- [ ] Log in as a staff user
- [ ] Go to Beginner level → first topic (e.g., "Care Treatment & Services")
- [ ] Click "Start Topic"
- [ ] Answer all 5 questions and submit
- [ ] See results page with score
- [ ] Click "Back to Level" or refresh the page
- [ ] Verify button now says "No Retakes Allowed" and is disabled
- [ ] Try clicking the button → nothing happens (disabled)
- [ ] If you somehow get to quiz page via URL:
  - Quiz shows "Assessment Already Completed" message
  - Shows buttons to "Go Back" or "View Level Results"
  - No quiz UI is rendered

#### Test Normal Progress
- [ ] Complete a different topic (e.g., "Environment of Care")
- [ ] See it appears as "Completed" with score
- [ ] Check dashboard progress indicator includes both completed topics
- [ ] Verify other topics on the same level still show "Start Topic"

#### Test In-Progress State
- [ ] Start a topic but don't complete it
- [ ] Answer 2-3 questions, then close the page
- [ ] Go back to level page
- [ ] Verify button shows "Continue Topic"
- [ ] Click "Continue Topic"
- [ ] Verify it resumes from where you left off (questions you answered are filled in)

### 3. Build & Verify No Errors
```bash
npm run build
```
- [ ] Build succeeds with no TypeScript errors
- [ ] No "Cannot find module" errors for new files

### 4. Visual Verification
- [ ] Completed topics show green badge "Completed" with score
- [ ] In-progress topics show yellow badge "In Progress"
- [ ] Not-started topics show no badge
- [ ] Button text matches state (Start/Continue/No Retakes)
- [ ] Completed button is visually disabled (grayed out)

---

## Files to Review

### Core Changes
1. **`scripts/014_add_single_attempt_policy.sql`** — Database migration
   - Creates UNIQUE constraint
   - Creates performance indexes

2. **`app/api/quiz/questions/route.ts`** — Questions API
   - Lines 30-47: Added completion check
   - Returns 403 if already completed

3. **`app/api/quiz/submit/route.ts`** — Submit API
   - Lines 142-165: Added duplicate submission prevention
   - Lines 167-213: Updated attempt record handling

4. **`components/quiz-client.tsx`** — Quiz UI
   - Line 51: Added `isAlreadyCompleted` state
   - Lines 70-79: Detects ALREADY_COMPLETED error
   - Lines 131-166: New "Assessment Already Completed" UI state

5. **`components/assessment-level-topics.tsx`** — Topic list
   - Added completion/in-progress state badges
   - Disabled button when completed
   - Shows "No Retakes Allowed" when completed

### Cleanup
- **`app/dashboard/page.tsx`** — Removed debug console.log statements

---

## Common Issues & Fixes

### Issue: "UNIQUE constraint violation"
- **Cause**: Migration not yet run OR attempted to run twice
- **Fix**: Check if migration was already applied in SQL Editor
- **Verify**: Query `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'user_assessments';`

### Issue: Button still allows clicks when completed
- **Cause**: Browser cache or client-side state not updated
- **Fix**: Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
- **Verify**: Check Network tab — button click should not send request

### Issue: "Already Completed" message doesn't show
- **Cause**: Questions API error not reaching client properly
- **Fix**: Check browser DevTools Network tab — look for 403 response
- **Verify**: Response body should have `{ error: "ALREADY_COMPLETED", message: "..." }`

### Issue: Build fails with "Cannot find module"
- **Cause**: Typo in import path
- **Fix**: Check file paths in:
  - `app/api/quiz/questions/route.ts` (line 3)
  - `app/api/quiz/submit/route.ts` (line 3)
- **Verify**: Both should import from `@/lib/rate-limit`

### Issue: Test user can still complete same topic twice
- **Cause**: Migration didn't run successfully
- **Fix**: Re-run migration and verify no errors
- **Verify**: Try submitting answers twice; second should fail with HTTP 409

---

## What Happens Behind the Scenes

### User Completes Assessment
1. Answers all questions
2. Clicks "Submit Quiz"
3. `/api/quiz/submit` called with answers
4. Server checks: "Is there a completed attempt?" → No
5. Server calculates score
6. Server creates/updates `user_assessments` record with status='completed'
7. Database enforces: Only one such record per (user_id, topic_id)
8. Returns score to client
9. Client shows results

### User Tries to Complete Same Topic Again
1. Clicks "Start Topic" (now showing "No Retakes Allowed")
2. Button is disabled; click does nothing
3. If user somehow reaches quiz page via URL:
   - `/api/quiz/questions` checks database
   - Finds completed record
   - Returns 403 "ALREADY_COMPLETED"
   - Client renders "Assessment Already Completed" UI

### User Starts But Doesn't Complete
1. Opens quiz, answers 2 questions
2. Closes browser
3. Returns later
4. `/api/quiz/questions` called
5. Finds in_progress record (status='in_progress')
6. Returns 200 OK with questions
7. Client loads quiz with previous answers filled in
8. User can continue and submit

---

## Security Notes

✅ **All checks are server-side**
- Client UI can be bypassed with dev tools
- Database constraint cannot be bypassed
- Even if user modifies request, submission is rejected

✅ **Rate limiting still active**
- 20 quiz submissions per hour per IP
- Prevents brute-force attempts

✅ **Authentication verified**
- Quiz questions and submit both verify `user` from session
- Impossible to submit for another user

---

## Next Phase (Phase 3)

After Phase 2 is stable (1-2 weeks):
- [ ] Add retake logic (e.g., "2 attempts allowed, best score counts")
- [ ] Add time limits (e.g., "30 minutes per attempt")
- [ ] Add attempt history (e.g., "Show all attempts, best score highlighted")
- [ ] Add admin controls (e.g., "Reset user attempt", "Extend time limit")

---

## Rollback Plan (If Issues Found)

If Phase 2 breaks something critical:

1. **Remove UNIQUE constraint** (database-level rollback):
```sql
ALTER TABLE user_assessments DROP CONSTRAINT unique_completed_attempt_per_topic;
```

2. **Revert API changes** (code-level rollback):
   - Remove completion checks from `/api/quiz/questions`
   - Remove duplicate submission prevention from `/api/quiz/submit`
   - Revert `quiz-client.tsx` to before Phase 2

3. **Expected downtime**: ~5 minutes
4. **Data loss**: None (constraint removal doesn't delete records)

---

## Questions?

See `PHASE_2_IMPLEMENTATION.md` for detailed documentation.
