# Phase 3: Assessment Content Management for Admins

## Overview

Phase 3 provides a complete admin interface for managing assessment content without requiring database access. Admins can now:

- View all assessment levels and topics in an organized hierarchy
- Manage questions for any topic (create, edit, delete)
- Manage topics within levels (create, edit, delete)
- See real-time question previews with correct answer highlighted
- Ensure data integrity with validation and constraints

This phase transforms the platform from static content into a dynamic, admin-friendly CMS.

---

## Architecture

### Admin Interface Pages

#### 1. Assessment Management Overview (`/admin/assessments`)
- **Role**: Client-side rendered page showing all levels and topics
- **Features**:
  - Expandable level cards showing all topics within each level
  - Click "Manage" to edit questions for a topic
  - Hierarchical view: Level → Topics → Questions
  - Responsive design for mobile and desktop

#### 2. Topic Question Manager (`/admin/assessments/[topicId]`)
- **Role**: Manage all questions in a specific topic
- **Features**:
  - List all questions with options and correct answer highlighted
  - Inline question editing via modal/form
  - Add new questions
  - Delete questions (with integrity checks)
  - Question preview with all options visible

### API Routes

#### Question Management

**POST `/api/admin/questions`**
- Create a new question in a topic
- Validates all inputs server-side
- Assigns automatic `order_index`
- Returns created question

```json
{
  "topic_id": "uuid",
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_answer": "A",
  "explanation": "..." // optional
}
```

**PUT `/api/admin/questions/[questionId]`**
- Update an existing question
- Supports partial updates (can update just the question text, for example)
- Validates correct_answer matches one of the options
- Returns updated question

```json
{
  "question_text": "...", // optional
  "option_a": "...", // optional
  "correct_answer": "B", // optional
  "explanation": "..." // optional
}
```

**DELETE `/api/admin/questions/[questionId]`**
- Delete a question
- **Safety Check**: Prevents deletion if topic has only 1 question
- Cascading deletes remove user answers
- Returns success message or error

---

#### Topic Management

**POST `/api/admin/topics`**
- Create a new topic in a level
- Assigns automatic `order_index`
- Validates topic name and level existence

```json
{
  "level_id": "uuid",
  "name": "Topic Name",
  "description": "..." // optional
}
```

**PUT `/api/admin/topics/[topicId]`**
- Update topic name or description
- Supports partial updates

```json
{
  "name": "New Name", // optional
  "description": "New description" // optional
}
```

**DELETE `/api/admin/topics/[topicId]`**
- Delete a topic and all its questions
- **Safety Check**: Prevents deletion if any user has started the assessment
- Returns error message if integrity would be broken

**PUT `/api/admin/topics/reorder`**
- Reorder topics within a level
- Accepts array of {id, order_index} pairs

```json
{
  "topics": [
    { "id": "uuid1", "order_index": 1 },
    { "id": "uuid2", "order_index": 2 },
    { "id": "uuid3", "order_index": 3 }
  ]
}
```

---

## Data Safety & Integrity

### Validation Layers

#### 1. Schema Validation (`lib/schemas/assessment.ts`)
Uses Zod schemas to validate:
- Question text: 10-1000 characters
- Options: 2-200 characters each
- Correct answer: Must be A, B, C, or D
- Topic name: 3-100 characters
- Description: 5-500 characters
- All IDs are valid UUIDs

#### 2. Server-Side Business Logic
- Verify topic exists before adding questions
- Verify level exists before adding topics
- Ensure correct_answer matches provided options
- Prevent deleting last question in a topic
- Prevent deleting topics with user assessment records

#### 3. Admin Role Verification
- All content management endpoints require `requireAdmin()` check
- Blocks non-admin users with 403 Forbidden
- Uses service-role client for verification (bypasses RLS)

### Preventing Data Corruption

**Single Question Per Topic Prevention**
- DELETE endpoint checks question count
- Returns 409 Conflict if only 1 question exists
- Users see clear message: "Topics must have at least 1 question"

**User Assessment Protection**
- Cannot delete topics that have user assessment records
- Prevents breaking historical data or in-progress assessments
- Returns 409 Conflict with explanation

**Automatic Order Index**
- New questions get order_index = (max + 1)
- New topics get order_index = (max + 1)
- Prevents duplicate ordering and gaps

---

## UI Components

### `QuestionForm` (`components/admin/question-form.tsx`)
- Create or edit a question
- Form fields for all question data
- Visual button selection for correct answer
- Optional explanation field
- Success/error toasts

### `QuestionList` (`components/admin/question-list.tsx`)
- Display all questions for a topic
- Show question text + all options
- Highlight correct answer in green
- Edit and delete buttons for each question
- Inline answer preview

### Assessment Pages
- `/admin/assessments` - Expandable level/topic hierarchy
- `/admin/assessments/[topicId]` - Question editor with form on left, list on right

---

## File Structure

```
/app
  /api
    /admin
      /questions
        route.ts              # POST (create question)
        /[questionId]
          route.ts            # PUT, DELETE (edit/delete question)
      /topics
        route.ts              # POST (create topic), PUT (reorder topics)
        /[topicId]
          route.ts            # PUT, DELETE (edit/delete topic)
  /admin
    /assessments
      page.tsx                # Overview of all levels/topics (NEW)
      /[topicId]
        page.tsx              # Question editor for topic (NEW)

/components
  /admin
    question-form.tsx         # Form for create/edit question (NEW)
    question-list.tsx         # List and preview questions (NEW)

/lib
  /schemas
    assessment.ts             # Zod validation schemas (NEW)
```

---

## Database Schema Changes

### Migration 015: `scripts/015_add_content_management_fields.sql`

Adds:
- `order_index` column to `assessment_topics`
- `order_index` column to `quiz_questions`
- `explanation` column to `quiz_questions`
- Indexes for efficient ordering queries

**Backward Compatible**: Uses `ADD COLUMN IF NOT EXISTS` to avoid errors if columns exist.

---

## How It Works: End-to-End Flow

### Creating a New Question

1. **Admin navigates** to `/admin/assessments`
2. **Expands a level** to see topics
3. **Clicks "Manage"** on a topic
4. **Clicks "Add Question"** in question list
5. **Question form appears** with empty fields
6. **Admin fills in** question, options, and selects correct answer
7. **Clicks "Create Question"**
8. **Form sends POST** to `/api/admin/questions` with validation
9. **Server validates** all fields match schema
10. **Server inserts** question with auto-generated order_index
11. **Component refreshes** question list
12. **Admin sees** new question in the list

### Editing a Question

1. **Admin clicks "Edit"** on a question
2. **Form appears** with existing data pre-filled
3. **Admin changes** question text or options
4. **Clicks "Update Question"**
5. **Form sends PUT** to `/api/admin/questions/[id]`
6. **Server validates** and updates database
7. **List refreshes** with new data

### Deleting a Question

1. **Admin clicks "Delete"** on a question
2. **Confirmation dialog** appears: "Are you sure?"
3. **Admin confirms**
4. **Component sends DELETE** to `/api/admin/questions/[id]`
5. **Server checks** if topic has only 1 question
6. **If only 1 question**: Returns 409 error → user sees "Cannot delete last question"
7. **If multiple questions**: Deletes question → list refreshes

---

## Testing Checklist

### Create Question
- [ ] Form validates empty fields
- [ ] Form rejects question < 10 characters
- [ ] Form rejects options < 2 characters
- [ ] Correct answer button selection works
- [ ] Question appears in list after submit
- [ ] Toast shows success message

### Edit Question
- [ ] Form pre-fills existing data
- [ ] Can update question text
- [ ] Can update individual options
- [ ] Can change correct answer
- [ ] Can add/update explanation
- [ ] Changes saved to database

### Delete Question
- [ ] Cannot delete if it's the last question (403 Conflict)
- [ ] Can delete if multiple questions exist
- [ ] List refreshes after delete
- [ ] Toast shows success/error message

### Admin Access Control
- [ ] Non-admin user gets 403 Forbidden on all admin endpoints
- [ ] Admin user can create/edit/delete without issues
- [ ] Invalid UUIDs return 404 errors

### Data Validation
- [ ] Correct answer must match provided options
- [ ] Question text cannot be empty
- [ ] All options must be filled
- [ ] UUID fields must be valid format

---

## Future Enhancements (Phase 4+)

- Bulk question import from CSV
- Question templates and duplication
- Question difficulty levels
- Analytics on which questions stump users
- Question versioning/history
- Multi-language support for questions
- Media/image support in questions
- Timer per question management
- Randomized question order per user

---

## Security Notes

1. **Admin-Only Access**: All content management routes protected by `requireAdmin()`
2. **Server-Side Validation**: Never trust client input; all data validated server-side
3. **Database Integrity**: Constraints and checks prevent data corruption
4. **Cascade Delete Protection**: Cannot delete topics with user records
5. **Minimum Question Check**: Cannot delete last question in topic
6. **SQL Injection Prevention**: Using parameterized queries via Supabase

---

## Deployment Notes

1. **Run Migration 015** in Supabase SQL Editor before deploying
2. **No breaking changes** - migration is backward compatible
3. **Existing questions preserved** - order_index defaults to 1
4. **No data loss** - all existing data remains intact

---

## Support

For issues or questions about Phase 3, check:
- API response errors (includes details on validation failures)
- Browser console for client-side errors
- Supabase dashboard for database state
- Admin dashboard quick actions for navigation
