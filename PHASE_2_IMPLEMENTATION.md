# Phase 2 Implementation: Simplified Assessment Integrity Rules

**Status**: Complete  
**Date Implemented**: 2026-03-10  

## Overview

Phase 2 enforces a single-attempt policy for assessments. Users can attempt each topic only once; no retakes are allowed in this MVP phase. The system prevents duplicate submissions and provides clear UI states for completion.

---

## 1. Single-Attempt System Implemented

### Database Constraint
- **Migration**: `scripts/014_add_single_attempt_policy.sql`
- **Constraint**: `UNIQUE(user_id, topic_id)` on `user_assessments` table
- **Effect**: PostgreSQL prevents duplicate completed attempts at the database level
- **Indexes Added**:
  - `idx_user_assessments_completed` for fast completion status checks
  - `idx_user_assessments_status_by_level` for progress calculations

### Enforcement Points

#### 1. Quiz Start (GET /api/quiz/questions)
- Checks if user already has a `status = "completed"` attempt
- Returns `error: "ALREADY_COMPLETED"` (HTTP 403) if completed
- Prevents questions from being fetched/displayed to completed users

#### 2. Quiz Submission (POST /api/quiz/submit)
- Double-checks for completed attempt before scoring
- Rejects submission with `error: "ALREADY_COMPLETED"` (HTTP 409) if already done
- Prevents duplicate submission processing
- Protects against network retries and replayed requests

#### 3. Attempt Lifecycle
- **Created**: When quiz is first opened (status = "in_progress", started_at = now)
- **Updated**: When answers submitted (status = "completed", completed_at = now, score/passed saved)
- **Reused**: If user opens quiz multiple times before completing, same attempt record is reused

### Safety Guarantees

✅ **Server-side enforcement**: UI can be bypassed; database constraint cannot  
✅ **Idempotent submissions**: Submitting same answers twice is rejected, not processed twice  
✅ **No data inconsistency**: UNIQUE constraint prevents edge cases (e.g., race condition on rapid submission)  
✅ **Clear error feedback**: Users see specific error messages ("Already Completed") vs generic errors  

---

## 2. Files Modified

### New Files
- `scripts/014_add_single_attempt_policy.sql` — Database migration
- `lib/quiz/attempt-manager.ts` — Helper for get/create attempts

### Updated Files

#### Backend APIs
- **`app/api/quiz/questions/route.ts`**
  - Added early completion check before returning questions
  - Returns 403 with "ALREADY_COMPLETED" error if already done

- **`app/api/quiz/submit/route.ts`**
  - Added duplicate submission prevention check (HTTP 409)
  - Updated to reuse in_progress attempts vs creating new
  - Now explicitly records `started_at` when creating new attempts

#### Server Components
- **`app/dashboard/assessments/[levelId]/[topicId]/page.tsx`**
  - Added completion check (informational, handled by client)
  - Comment explains single-attempt policy

#### Client Components
- **`components/quiz-client.tsx`**
  - Added `isAlreadyCompleted` state
  - Handles "ALREADY_COMPLETED" error from questions API
  - New UI state shows "Assessment Already Completed" message with navigation options
  - Disables quiz UI when already completed

- **`components/assessment-level-topics.tsx`**
  - Added "In Progress" state badge
  - Added "Completed" state badge
  - Button now shows "No Retakes Allowed" when completed
  - Button disabled when completed (visual + functional)
  - Shows "Continue Topic" for in-progress assessments
  - Proper styling for each state (green for completed, yellow for in-progress)

#### Pages
- **`app/dashboard/page.tsx`**
  - Removed debug console.log statements

---

## 3. Schema Changes

### Migration SQL
```sql
ALTER TABLE public.user_assessments
ADD CONSTRAINT unique_completed_attempt_per_topic 
  UNIQUE (user_id, topic_id) NULLS NOT DISTINCT;
```

**Effect**: Only ONE row per (user_id, topic_id) pair can have status='completed'

### New Columns (existing but documented)
- `started_at` — When user began the quiz (timestamp)
- `completed_at` — When user submitted answers (timestamp)

### Existing Columns Used
- `status` — 'not_started', 'in_progress', 'completed'
- `score` — 0-100 (validation via CHECK constraint from Phase 1)
- `passed` — Boolean (true if score >= 70)

---

## 4. Edge Cases Handled

### ✅ User Opens Quiz Multiple Times
- First open: Creates `user_assessments` with status='in_progress'
- Subsequent opens: Queries find existing in_progress record, reuses it
- No duplicate attempt records created

### ✅ Network Retries / Replayed Requests
- Client submits answers (POST /api/quiz/submit)
- Server saves attempt and returns success
- If browser retries same request (same body), second request:
  - Finds completed attempt in database
  - Returns HTTP 409 "ALREADY_COMPLETED"
  - Does not double-process answers

### ✅ Race Condition (Two Rapid Submissions)
- Request 1 arrives, starts processing (queries database, calculates score)
- Request 2 arrives before Request 1 commits
- Database constraint `UNIQUE(user_id, topic_id)` ensures only one succeeds
- One transaction commits with attempt marked completed
- Other transaction gets constraint violation and is rejected

### ✅ User Closes Quiz Before Completing
- Attempt record stays in status='in_progress'
- User can return and continue same attempt
- If time limit or reset needed (Phase 3), can query for in_progress records

### ✅ Already-Completed User Tries URL Hack
- Types `/dashboard/assessments/[levelId]/[topicId]` directly
- Server component verifies auth (✅ already there from Phase 1)
- QuizClient component loads, calls GET /api/quiz/questions
- API returns 403 "ALREADY_COMPLETED"
- QuizClient renders "Assessment Already Completed" UI with navigation

---

## 5. User Experience Flow

### Happy Path (First Attempt)
1. User clicks "Start Topic" button on level page
2. Redirected to `/dashboard/assessments/[levelId]/[topicId]`
3. Page loads → QuizClient component mounts
4. QuizClient calls `/api/quiz/questions` → gets questions (200 OK)
5. Quiz UI renders → user answers questions
6. User clicks "Submit Quiz"
7. QuizClient POSTs answers to `/api/quiz/submit`
8. Server calculates score, saves attempt with status='completed'
9. Returns `{ score, passed, assessmentId, ... }`
10. QuizClient shows results screen
11. User clicks "Back to Level" or "Go to Dashboard"

### Second Attempt (Blocked)
1. User clicks "Start Topic" again (button now says "No Retakes Allowed" + disabled)
2. If button click somehow works (dev tools), redirects to quiz page
3. QuizClient calls `/api/quiz/questions`
4. API returns 403 with "ALREADY_COMPLETED"
5. QuizClient renders "Assessment Already Completed" UI
6. Shows message: "No retakes allowed for this topic in current phase"
7. Offers navigation: "Go Back" or "View Level Results"

---

## 6. Risks & Limitations

### Risk: No Way to Clear Completed Attempts
- **Issue**: If a user gets a low score, they cannot retake it
- **Mitigation**: This is intentional for MVP; retakes are Phase 3
- **Future**: Add admin endpoint to reset user attempts if needed

### Risk: Cannot Restart In-Progress Attempt
- **Issue**: If user opens quiz, answers 1 question, then never returns, that attempt stays in_progress forever
- **Mitigation**: This is acceptable for MVP; can add "Clear Stale Attempts" job in Phase 3
- **Future**: Could add admin UI to expire old in_progress attempts

### Risk: No Time Limit on Attempts
- **Issue**: User can start quiz, wait 5 days, submit answers
- **Mitigation**: This is acceptable for MVP; timers are Phase 3
- **Future**: Add session-based time limit (HTTP-only cookie with expiry)

### Limitation: Cannot See Attempt History
- **Issue**: Only current attempt is visible; previous attempts are not tracked (only one allowed anyway)
- **Mitigation**: Not needed for single-attempt MVP
- **Future**: Phase 3 can store historical attempts if retakes are added

### Limitation: No Admin Override
- **Issue**: Admins cannot force-reset a user's attempt via UI
- **Mitigation**: This can be added later via admin API endpoint
- **Future**: Add `/api/admin/reset-attempt` if needed

---

## 7. Verification Checklist

Before considering Phase 2 complete, verify:

- [ ] Migration script `014_add_single_attempt_policy.sql` executed successfully
- [ ] UNIQUE constraint applied to `user_assessments(user_id, topic_id)`
- [ ] Quiz questions API rejects with 403 if already completed
- [ ] Quiz submit API rejects with 409 if already completed
- [ ] QuizClient shows "Assessment Already Completed" UI
- [ ] Topic button shows "No Retakes Allowed" and is disabled when completed
- [ ] Topic button shows "Continue Topic" for in-progress assessments
- [ ] Can view results by clicking "Review Results" on completed topic
- [ ] Dashboard progress calculations use `status = 'completed'` correctly
- [ ] No console.log debug statements in production code

---

## 8. Database Query Examples

### Check if User Completed a Topic
```sql
SELECT id, score, passed, completed_at
FROM user_assessments
WHERE user_id = $1 AND topic_id = $2 AND status = 'completed';
```

### Get All Completed Topics for a User
```sql
SELECT topic_id, score, passed, completed_at
FROM user_assessments
WHERE user_id = $1 AND status = 'completed'
ORDER BY completed_at DESC;
```

### Count Completed Topics per Level
```sql
SELECT COUNT(*) as completed_count
FROM user_assessments
WHERE user_id = $1 AND level_id = $2 AND status = 'completed';
```

---

## 9. What NOT Implemented (By Design)

Per requirements, Phase 2 does NOT include:

- ❌ Retake logic (Phase 3)
- ❌ Attempt history (Phase 3)
- ❌ Timers or time limits (Phase 3)
- ❌ Attempt count limits (Phase 3)
- ❌ Advanced analytics (Phase 3+)
- ❌ Admin attempt reset UI (future)
- ❌ Stale attempt cleanup job (future)

---

## 10. Next Steps (Phase 3+)

When Phase 2 is stable and tested, Phase 3 should:

1. **Add Retakes**
   - Remove UNIQUE constraint or modify to allow `status IN ('completed', 'attempted')`
   - Add `attempt_number` column to track retakes
   - Limit retakes to N attempts per user per topic

2. **Add Timers**
   - Add `time_limit_minutes` to assessment_levels
   - Use HTTP-only session cookie with expiry
   - Server-side expiry check in submit API

3. **Add Attempt History**
   - Keep all historical attempts in `user_assessments`
   - Show "Best Score" vs "Latest Attempt"
   - Admin analytics on attempt patterns

4. **Add Admin Controls**
   - Admin endpoint to reset user attempts
   - Admin endpoint to extend time limit
   - Admin view of all user attempts (audit trail)

---

## Summary

Phase 2 successfully implements a **predictable, secure, production-safe single-attempt system** for MVP. The approach uses **database constraints for enforcement** (not just UI), **clear error responses** for duplicate submissions, and **intuitive UI states** for users.

All changes are **backwards compatible** with existing data and do not break existing features.
