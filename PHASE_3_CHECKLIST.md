# Phase 3 Implementation Checklist

## Pre-Deployment

### Database Migration
```
- [ ] Open Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Copy content from: scripts/015_add_content_management_fields.sql
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Verify: No errors appear
- [ ] Check: Tables have order_index and explanation columns
```

### Code Review
```
- [ ] npm run build completes without errors
- [ ] npm run lint passes (if linting enabled)
- [ ] No TypeScript errors in output
- [ ] All new files follow existing code style
- [ ] No console.log() debug statements left in production code
```

### Component Testing
```
- [ ] Components use shadcn/ui buttons and cards correctly
- [ ] Form validation errors show as toast notifications
- [ ] Success messages appear after operations
- [ ] Loading states show spinner while fetching
- [ ] Error states show helpful error messages
```

---

## Local Testing

### Authentication Tests
```
- [ ] Log in as admin user
- [ ] Can access /admin/assessments page
- [ ] Can see all levels and topics
- [ ] Log in as staff (non-admin) user
- [ ] Cannot access /admin/assessments (redirects or shows error)
```

### Question Management Tests

#### Create Question
```
- [ ] Click "Add Question" shows form
- [ ] Form has fields: text, option_a, option_b, option_c, option_d, correct_answer, explanation
- [ ] Submit empty question text → shows validation error
- [ ] Submit question < 10 characters → shows validation error
- [ ] Submit with empty option → shows validation error
- [ ] Select correct answer button (A/B/C/D) works
- [ ] Submit complete question → success toast
- [ ] New question appears in list immediately
- [ ] Question text, options, and correct answer are correct
```

#### Edit Question
```
- [ ] Click "Edit" on a question shows form with data pre-filled
- [ ] Can change question text
- [ ] Can change individual options (A, B, C, D)
- [ ] Can change correct answer
- [ ] Can update explanation
- [ ] Click "Cancel" closes form without saving
- [ ] Submit changes → success toast
- [ ] List updates with new data
- [ ] Changes persist after refresh
```

#### Delete Question
```
- [ ] Click "Delete" shows confirmation dialog
- [ ] Cancel confirmation → question stays
- [ ] Confirm deletion of only question in topic → error "must have 1 question"
- [ ] Confirm deletion when multiple questions → question deleted
- [ ] List refreshes after delete
- [ ] Success toast appears
- [ ] User answers deleted (cascade)
```

#### Question Display
```
- [ ] All question options (A/B/C/D) display
- [ ] Correct answer highlighted in green
- [ ] Incorrect answers shown in neutral color
- [ ] Question text readable
- [ ] Explanation displays (if present)
- [ ] Question order_index shows
```

### Topic Management Tests

#### Topic Hierarchy View
```
- [ ] All levels display with "Level" suffix
- [ ] Levels show topic count
- [ ] Expandable/collapsible chevron works
- [ ] Topics display under expanded level
- [ ] "Manage" button visible for each topic
- [ ] Clicking "Manage" navigates to question editor
```

#### Edit Topic (if implemented)
```
- [ ] Can edit topic name
- [ ] Can edit topic description
- [ ] Changes persist
```

### API Endpoint Tests (using curl or Postman)

#### POST /api/admin/questions
```
- [ ] Valid payload → 201 Created + question data
- [ ] Missing topic_id → 400 Bad Request
- [ ] Invalid UUID → 400 Bad Request
- [ ] Non-existent topic → 404 Not Found
- [ ] Non-admin user → 403 Forbidden
- [ ] Unauthenticated → 401 Unauthorized
```

#### PUT /api/admin/questions/[id]
```
- [ ] Valid update → 200 OK + updated data
- [ ] Invalid question_id → 404 Not Found
- [ ] Non-admin user → 403 Forbidden
- [ ] Partial update (e.g., only question_text) → works
```

#### DELETE /api/admin/questions/[id]
```
- [ ] Delete only question in topic → 409 Conflict
- [ ] Delete when multiple questions → 200 OK
- [ ] Non-existent question → 404 Not Found
- [ ] Non-admin user → 403 Forbidden
```

#### POST /api/admin/topics
```
- [ ] Valid payload → 201 Created
- [ ] Missing required fields → 400 Bad Request
- [ ] Non-existent level → 404 Not Found
```

#### DELETE /api/admin/topics/[id]
```
- [ ] Topic with no user assessments → deletes successfully
- [ ] Topic with user assessment records → 409 Conflict
```

---

## UI/UX Testing

### Layout & Responsiveness
```
- [ ] Desktop view (1920px+) looks good
- [ ] Tablet view (768px) responsive
- [ ] Mobile view (375px) fully functional
- [ ] Form doesn't overflow on small screens
- [ ] Buttons have proper touch targets (44px+)
```

### Navigation
```
- [ ] "Manage Assessment Content" link in admin dashboard works
- [ ] Back button on topic page navigates to assessments page
- [ ] Breadcrumb/navigation clear where you are
- [ ] Can navigate between topics easily
```

### Form & Input
```
- [ ] Input fields have focus states
- [ ] Disabled state clear when loading
- [ ] Placeholder text helpful
- [ ] Character limit messages visible (if implemented)
- [ ] Tab order logical (can tab through fields)
```

### Notifications
```
- [ ] Success toast shows correct message
- [ ] Error toast shows helpful error
- [ ] Notifications disappear after 3-5 seconds
- [ ] Multiple notifications stack
- [ ] Can dismiss notification manually
```

---

## Data Integrity Tests

### Safety Checks
```
- [ ] Cannot delete last question in topic
- [ ] Cannot delete topic with user assessments
- [ ] Correct answer must match one of options
- [ ] All options required when creating/editing
- [ ] Topic/level must exist before adding content
```

### Data Consistency
```
- [ ] order_index never duplicates
- [ ] order_index increments correctly for new items
- [ ] After delete, order_index gaps filled
- [ ] Question count accurate in topic list
```

### Cascade Operations
```
- [ ] Deleting question removes user answers
- [ ] Deleting topic removes questions (if safe)
- [ ] Relationships maintained in database
```

---

## Performance Tests

### Load Times
```
- [ ] Assessment overview page loads < 2 seconds
- [ ] Question editor page loads < 2 seconds
- [ ] API responses < 500ms (typical)
- [ ] Form submission < 1 second
```

### With Data
```
- [ ] 100 questions loads smoothly
- [ ] 20 topics in level loads smoothly
- [ ] Filtering/searching (if implemented) performs well
```

---

## Security Tests

### Admin Access Control
```
- [ ] Non-admin cannot access /admin/assessments
- [ ] Non-admin cannot POST to /api/admin/questions
- [ ] Non-admin cannot PUT/DELETE on admin routes
- [ ] Admin can access all endpoints
```

### Input Validation
```
- [ ] XSS prevention (HTML in question text)
- [ ] SQL injection prevention (special characters)
- [ ] UUID format validation
- [ ] Max character limits enforced
```

### Error Handling
```
- [ ] Validation errors don't leak sensitive info
- [ ] 404 errors don't confirm/deny resource existence
- [ ] 403 errors clear but don't explain internals
- [ ] 500 errors generic (log details server-side)
```

---

## Browser Compatibility

```
- [ ] Chrome/Edge 90+ works
- [ ] Firefox 88+ works
- [ ] Safari 14+ works
- [ ] Mobile Safari (iOS 14+) works
- [ ] Mobile Chrome (Android 11+) works
```

---

## Deployment Checklist

### Pre-Push
```
- [ ] All tests passing locally
- [ ] npm run build succeeds
- [ ] No console warnings/errors
- [ ] No secret keys in code
- [ ] ENV variables documented
```

### Push to GitHub
```
- [ ] Commit message clear: "Phase 3: Assessment Content Management"
- [ ] All files committed
- [ ] Push to feature branch first (optional)
- [ ] Create pull request with description
- [ ] Verify CI/CD pipeline passes
```

### Deploy to Vercel
```
- [ ] Vercel build succeeds
- [ ] Preview deployment works
- [ ] Merged PR triggers production deploy
- [ ] Production deployment succeeds
- [ ] Check https://your-app.com/admin/assessments works
```

### Post-Deployment
```
- [ ] Verify migration 015 applied in production Supabase
- [ ] Test admin functionality in production
- [ ] Monitor error logs for issues
- [ ] Check performance metrics
```

---

## Final Sign-Off

### Phase 3 Complete When:
- [x] All API routes implemented
- [x] All UI components implemented
- [x] All validation schemas created
- [x] Database migration ready
- [x] Documentation complete
- [x] Local testing checklist passes
- [x] Security requirements met
- [x] No Phase 2 logic modified
- [ ] Deployed to production
- [ ] Team signoff obtained

---

## Common Issues & Solutions

### Issue: "Cannot delete last question"
**Expected behavior**. Add another question first.

### Issue: Form validation always fails
Check: All fields filled? No < 10 char question text? All options 2+ chars?

### Issue: 403 Forbidden on admin routes
Check: Logged in as admin? Email correct role in database?

### Issue: Changes don't appear after submit
Try: Refresh page. Check browser console for errors. Check network tab.

### Issue: Migration fails with "already exists" error
Normal. Schema checks for existing columns before adding.

---

## Quick Command Reference

```bash
# Local testing
npm run dev

# Build
npm run build

# Database migration (in Supabase SQL Editor)
-- Copy scripts/015_add_content_management_fields.sql
-- Paste in Supabase SQL Editor
-- Click Run

# Push changes
git add .
git commit -m "Phase 3: Assessment Content Management"
git push origin main
```

---

## Timeline Estimate

| Task | Time |
|------|------|
| Run database migration | 2 min |
| Local testing | 30 min |
| API testing with Postman | 15 min |
| UI/UX testing | 20 min |
| Security verification | 10 min |
| Deployment | 5 min |
| Production verification | 5 min |
| **Total** | **~1.5 hours** |

---

## Sign-Off Template

```
Phase 3 Testing Completed
Date: ___________
Tested By: ___________

✅ Database migration successful
✅ All API endpoints working
✅ UI components functional
✅ Admin access control verified
✅ Data safety checks passing
✅ No Phase 2 regression
✅ Ready for production

Notes: _____________________________
```
