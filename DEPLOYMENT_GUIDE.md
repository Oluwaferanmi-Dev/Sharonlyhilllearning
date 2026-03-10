# Healthcare Regulation Platform - Deployment Guide

Complete guide to deploy the Cherith Training Healthcare Regulation Platform to your own Vercel and Supabase accounts.

---

## Prerequisites

Before you begin, ensure you have:

- A [Supabase account](https://supabase.com) (free tier works)
- A [Vercel account](https://vercel.com) (free tier works)
- [Node.js](https://nodejs.org) 18+ installed
- [Git](https://git-scm.com) installed
- The project code downloaded from v0

---

## Part 1: Supabase Setup

### Step 1: Create New Supabase Project

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `cherith-training-healthcare` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to provision

### Step 2: Get Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API** in the left sidebar
2. Copy and save these values (you'll need them later):
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJh...`)
   - **service_role key** (starts with `eyJh...`) - Keep this SECRET!

3. Go to **Settings** → **Database**
4. Scroll down to **Connection String** section
5. Copy the **URI** connection string (select "Use connection pooling")
6. Replace `[YOUR-PASSWORD]` in the string with your database password
7. Save this connection string

### Step 3: Run Database Migrations

You need to run SQL scripts in the **exact order below** to create all tables and setup the database properly.

**IMPORTANT**: Run these scripts one at a time in this specific order to avoid conflicts.

#### Script Execution Order:

**1. Create Profile Trigger (000_create_profile_trigger.sql)**
```sql
-- This creates the function that automatically creates a profile when a user signs up
-- Run this first before schema creation
```

**2. Initialize Schema (001_init_schema.sql)**
```sql
-- Creates all tables, RLS policies, and indexes
-- This is the main schema file
```

**3. Update Trigger Metadata (012_update_trigger_metadata.sql)**
```sql
-- Enhances the profile creation trigger with better metadata handling
```

**4. Seed Assessment Levels (002_seed_assessments.sql)**
```sql
-- Creates 3 levels: Beginner, Intermediate, Advanced
-- WARNING: Only creates 5 topics for testing - will be replaced in next steps
```

**5. Fix Level Unlocks RLS (003_fix_level_unlocks_rls.sql)**
```sql
-- Disables RLS on level_unlocks table
-- Seeds level_unlocks with only Beginner unlocked by default
```

**6. Remove Duplicate Topics (006_remove_duplicate_topics.sql)**
```sql
-- Cleans up any duplicate topics from previous seeding
-- Prepares for fresh 14-topic insert
```

**7. Insert All 14 Beginner Topics (007_insert_all_14_beginner_topics.sql)**
```sql
-- Inserts all 14 Cherith Training topics with 5 questions each (70 total questions)
-- Topics: APR, CTS, EC, EM, HRM, IC, IM, LD, LS, MM, NPSG, PI, RC, RI, WT
```

**8. Fix Profiles RLS (008_fix_profiles_rls.sql)**
```sql
-- Updates RLS policies on profiles table
-- Ensures admins can view all staff using service role key
```

**9. Add Admin Assessment Access (009_add_admin_assessment_access.sql)**
```sql
-- Adds RLS policies for admins to view all assessments and answers
-- Required for admin review feature
```

#### How to Run Scripts:

**Option A: Using Supabase SQL Editor (Recommended)**

1. In Supabase Dashboard, go to **SQL Editor** in left sidebar
2. Click **"New query"**
3. Open the first script (`scripts/000_create_profile_trigger.sql`)
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** (or press Ctrl/Cmd + Enter)
6. Wait for "Success" message
7. **Repeat for each script in the order listed above**

**Option B: Using psql Command Line**

```bash
# Set your connection string as an environment variable
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run all scripts in order
psql $DATABASE_URL < scripts/000_create_profile_trigger.sql
psql $DATABASE_URL < scripts/001_init_schema.sql
psql $DATABASE_URL < scripts/012_update_trigger_metadata.sql
psql $DATABASE_URL < scripts/002_seed_assessments.sql
psql $DATABASE_URL < scripts/003_fix_level_unlocks_rls.sql
psql $DATABASE_URL < scripts/006_remove_duplicate_topics.sql
psql $DATABASE_URL < scripts/007_insert_all_14_beginner_topics.sql
psql $DATABASE_URL < scripts/008_fix_profiles_rls.sql
psql $DATABASE_URL < scripts/009_add_admin_assessment_access.sql
```

#### Verification After Running Scripts:

Run this SQL to verify everything is set up correctly:

```sql
-- Check that all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should show: assessment_levels, assessment_topics, level_unlocks, profiles, 
-- quiz_questions, user_assessments, user_quiz_answers

-- Check assessment levels
SELECT name, order_index, price FROM assessment_levels ORDER BY order_index;
-- Should show: Beginner (1, $100), Intermediate (2, $150), Advanced (3, $200)

-- Check beginner topics count
SELECT COUNT(*) as topic_count 
FROM assessment_topics 
WHERE level_id = (SELECT id FROM assessment_levels WHERE name = 'Beginner');
-- Should show: 14 topics

-- Check beginner questions count
SELECT COUNT(*) as question_count 
FROM quiz_questions 
WHERE topic_id IN (
  SELECT id FROM assessment_topics 
  WHERE level_id = (SELECT id FROM assessment_levels WHERE name = 'Beginner')
);
-- Should show: 70 questions (5 per topic × 14 topics)

-- Check level unlocks status
SELECT l.name, lu.is_unlocked 
FROM level_unlocks lu
JOIN assessment_levels l ON l.id = lu.level_id
ORDER BY l.order_index;
-- Should show: Beginner (true), Intermediate (false), Advanced (false)
```

**Expected Results:**
- ✅ 7 tables created
- ✅ 3 assessment levels (Beginner, Intermediate, Advanced)
- ✅ 14 topics for Beginner level
- ✅ 70 questions total (5 per topic)
- ✅ Only Beginner level is unlocked
- ✅ Intermediate and Advanced are hard-locked

### Step 4: Verify RLS Policies

Run this to check RLS status:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Important**: The `level_unlocks` table should have `rowsecurity = false` (RLS disabled).

### Step 5: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the **Confirm signup** email template if desired
3. Update **Redirect URL** in template to your domain

### Step 6: Configure Supabase Authentication

1. Go to **Authentication** → **Providers** in left sidebar
2. Make sure **Email** provider is enabled (it should be by default)
3. Go to **Authentication** → **URL Configuration**
4. Add your site URL to **Redirect URLs** (you'll update this after Vercel deployment)
   - For now, add: `http://localhost:3000/**`
   - After deployment, add: `https://your-domain.vercel.app/**`

---

## Part 2: Vercel Deployment

### Step 1: Prepare Your Code

1. Download your project from v0 (click three dots → **Download ZIP**)
2. Extract the ZIP file to a folder
3. Open terminal and navigate to the project folder:

```bash
cd path/to/your-project
```

4. Initialize a git repository (if not already):

```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Push to GitHub (Recommended)

1. Create a new repository on [GitHub](https://github.com/new)
2. **Do NOT initialize with README, .gitignore, or license**
3. Copy the repository URL
4. Push your code:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

**Option A: Deploy via Vercel Dashboard (Recommended)**

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (leave as default)
   - **Output Directory**: `.next` (leave as default)

**Option B: Deploy via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

### Step 4: Add Environment Variables in Vercel

In the Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables (use the values from Supabase Step 2):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Database Connection (for direct queries)
POSTGRES_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true

# Auth Redirect (for local development)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Admin Seed Secret (optional - for creating first admin)
ADMIN_SEED_SECRET=your-secure-random-string-here
```

**Important Notes:**
- Make sure all environment variables are added for **Production**, **Preview**, and **Development** environments
- The `ADMIN_SEED_SECRET` should be a long random string (at least 32 characters)
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret - never expose it client-side

3. Click **"Save"**
4. Redeploy the project for changes to take effect:
   - Go to **Deployments** tab
   - Click three dots on latest deployment → **"Redeploy"**

### Step 5: Update Supabase Redirect URLs

1. Copy your Vercel deployment URL (e.g., `https://your-project.vercel.app`)
2. Go back to Supabase Dashboard → **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Redirect URLs**:
   - `https://your-project.vercel.app/**`
4. Set **Site URL** to: `https://your-project.vercel.app`

---

## Part 3: Create First Admin User

You have two options to create the first admin account:

### Option A: Using the Admin Setup Page (Recommended)

1. Visit: `https://your-domain.vercel.app/setup/admin`
2. Enter admin details:
    - **Email**: admin@cherithtraining.com (or your preferred email)
   - **Password**: Choose a strong password
   - **First Name**: Your first name
   - **Last Name**: Your last name
   - **Admin Secret**: The value you set for `ADMIN_SEED_SECRET`
3. Click **"Create Admin Account"**
4. Check your email for confirmation link
5. Click the confirmation link
6. You can now log in at `/auth/login`

### Option B: Using Supabase SQL Editor

If the admin setup page doesn't work, create admin directly in database:

```sql
-- First, create the auth user in Supabase Dashboard → Authentication → Users
-- Click "Add user" → Email: admin@cherithtraining.com, Password: (your-password)
-- Copy the user ID from the user list

-- Then run this SQL (replace USER_ID with the actual ID):
INSERT INTO profiles (id, email, first_name, last_name, role)
VALUES (
  'USER_ID',  -- Replace with actual user ID from auth.users
  'admin@cherithtraining.com',
  'Admin',
  'User',
  'admin'
);
```

---

## Part 4: Verification & Testing

### Step 1: Test Authentication

1. Visit your site: `https://your-domain.vercel.app`
2. Click **"Admin Setup"** or go to `/auth/login`
3. Log in with your admin credentials
4. You should be redirected to the admin dashboard

### Step 2: Test Admin Dashboard

1. Verify the admin dashboard shows:
   - Total staff count (should be 0 initially)
   - Three assessment levels (all locked)
   - Recent staff registrations section
2. Click **"Manage Staff"** to verify staff page loads
3. Click **"Assessments"** to verify assessments page loads

### Step 3: Register Test Staff Member

1. Log out of admin account
2. Click **"Register"** on the login page
3. Create a staff account:
   - Email: `test-staff@cherithtraining.com`
   - Password: Choose a password
   - First Name: Test
   - Last Name: Staff
4. Check email for confirmation link
5. Confirm the account
6. Log in as the staff member

### Step 4: Verify Staff Dashboard

1. As staff, you should see:
   - Dashboard showing all three assessment levels
   - All levels showing "Locked" status
   - Message: "Admin payment required"
2. You should NOT be able to access locked levels

### Step 5: Test Level Unlock Flow

1. Log out and log back in as admin
2. Go to admin dashboard
3. On Level 1, click **"Unlock Level"**
4. Payment dialog should open showing:
   - Green promo code reminder: "sharonlyhill"
   - Staff count: 1
   - Total amount calculation
5. Enter promo code: `sharonlyhill`
6. Total should become $0
7. Click **"Complete Payment"**
8. Level 1 should now show as "Unlocked"
9. Log in as staff - Level 1 should now be accessible

### Step 6: Test Assessment Taking

1. As staff, click on unlocked Level 1
2. Click on any topic (e.g., "Regulatory Framework")
3. Click **"Start Assessment"**
4. Answer the questions
5. Submit the assessment
6. View results page
7. Go back to dashboard - progress should be updated

---

## Part 5: Troubleshooting

### Issue: "No organization found" errors

**Solution**: This should be resolved as we removed organization tables. If you still see this error, check that you ran the `scripts/005_remove_organizations.sql` migration or manually drop these tables:

```sql
DROP TABLE IF EXISTS organization_payments CASCADE;
DROP TABLE IF EXISTS organization_level_unlocks CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
```

### Issue: "Row-level security policy" error when unlocking levels

**Solution**: Run this SQL command:

```sql
ALTER TABLE level_unlocks DISABLE ROW LEVEL SECURITY;
```

### Issue: Staff count shows 0 in admin dashboard

**Solution**: Verify that:
1. Staff members have confirmed their email addresses
2. Staff profiles have `role = 'staff'` in the profiles table
3. Check the API route `/api/admin/metrics` is working

### Issue: Cannot log in after registration

**Solution**: 
1. Check Supabase email settings - emails might be disabled or sent to spam
2. In Supabase Dashboard → Authentication → Users, find the user and click "..." → "Confirm email"
3. Update Supabase email templates with your actual domain

### Issue: Assessment images not loading

**Solution**: Images are stored as placeholder URLs. To use real images:
1. Upload images to Supabase Storage or another CDN
2. Update the image URLs in `scripts/002_seed_assessments.sql`
3. Re-run the seed script

### Issue: 404 errors on deployment

**Solution**:
1. Verify all environment variables are set correctly in Vercel
2. Check build logs for errors
3. Ensure Next.js version is compatible (should be 15+)

### Issue: Database connection timeouts

**Solution**:
1. Use the connection pooling URL (port 6543) instead of direct connection (port 5432)
2. Verify your IP is not blocked by Supabase
3. Check database is not paused (Supabase free tier pauses after inactivity)

### Issue: Wrong number of topics or questions

**Symptoms:**
- More than 14 topics showing in Beginner level
- Duplicate topics (e.g., two CTS or two EM)
- Question count not exactly 70

**Solution:**
You likely ran scripts 002 and 005 in addition to 007. To fix:

```sql
-- Clear all beginner content
DELETE FROM quiz_questions 
WHERE topic_id IN (
  SELECT id FROM assessment_topics 
  WHERE level_id = (SELECT id FROM assessment_levels WHERE name = 'Beginner')
);

DELETE FROM assessment_topics 
WHERE level_id = (SELECT id FROM assessment_levels WHERE name = 'Beginner');

-- Then re-run only script 007
-- Copy and paste contents of scripts/007_insert_all_14_beginner_topics.sql
```

### Issue: Cannot unlock Intermediate or Advanced levels

**Symptoms:**
- Unlock button works but levels stay locked
- Error: "This level is not available for unlock"

**Expected Behavior:**
- Intermediate and Advanced levels are **intentionally hard-locked**
- Only Beginner level can be unlocked via the payment flow
- This is by design for the current phase of the project

**Solution:**
If you need to unlock Intermediate or Advanced for testing:

```sql
-- Temporarily allow unlock (not recommended for production)
UPDATE level_unlocks 
SET is_unlocked = true, unlocked_at = NOW()
WHERE level_id IN (
  SELECT id FROM assessment_levels 
  WHERE name IN ('Intermediate', 'Advanced')
);
```

### Issue: "Infinite recursion detected in policy" error

**Symptoms:**
- Error when logging in or accessing profiles
- Database query failures with recursion message

**Solution:**
Run the 008_fix_profiles_rls.sql script which removes recursive checks:

```sql
-- This is already in the script, but if you encounter issues:
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
```

### Issue: Admin cannot see staff list or metrics show 0

**Symptoms:**
- Admin dashboard shows 0 staff even though staff registered
- Staff management page shows "No staff members found"
- Metrics API returns empty data

**Root Cause:**
The API is using regular client instead of admin client, hitting RLS restrictions.

**Solution:**
This should be fixed in the codebase. Verify these files use `createAdminClient()`:
- `/app/api/admin/metrics/route.ts`
- `/app/api/admin/staff/[staffId]/route.ts`
- `/app/admin/staff/page.tsx`

---

## Part 6: Post-Deployment Configuration

### Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `healthcare.cherithtraining.com`)
3. Follow Vercel's DNS configuration instructions
4. Update Supabase redirect URLs with your custom domain

### Set Up Email Provider (Optional)

By default, Supabase uses their SMTP. For production, set up your own:

1. In Supabase Dashboard → **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure with your email provider (SendGrid, Mailgun, AWS SES, etc.)

### Enable Analytics (Optional)

1. In Vercel Dashboard → **Analytics**
2. Enable Web Analytics to track user behavior
3. View metrics in the Analytics tab

### Set Up Monitoring (Optional)

1. Configure error tracking (Sentry, LogRocket, etc.)
2. Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
3. Enable Vercel logs for debugging

---

## Part 7: Maintenance & Updates

### Database Backups

Supabase automatically backs up your database daily on paid plans. For free tier:

1. Go to **Database** → **Backups**
2. Manually create backups before major changes
3. Consider upgrading to Pro plan for automated backups

### Updating the Application

When you make changes to your code:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically detect the push and redeploy.

### Managing Staff

As admin, you can:
- View all staff from **Manage Staff** page
- Click on any staff member to see their assessment progress
- Unlock additional levels as needed using the promo code

### Updating Assessment Content

To modify questions or add new assessments:

1. Create a new SQL script in the `scripts/` folder
2. Insert/update questions in the appropriate tables
3. Run the script in Supabase SQL Editor

---

## Support & Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Security Checklist

Before going to production:

- [ ] Change default admin password to a strong password
- [ ] Enable 2FA on Supabase account
- [ ] Enable 2FA on Vercel account
- [ ] Review and update Supabase RLS policies if needed
- [ ] Set up database backups
- [ ] Configure custom email provider
- [ ] Set up error monitoring
- [ ] Test all user flows (register, login, take assessment, etc.)
- [ ] Review environment variables - ensure no secrets are exposed
- [ ] Set up rate limiting for API routes (optional)
- [ ] Configure CORS policies if needed

---

## Conclusion

Your Healthcare Regulation Platform is now deployed and ready for use! Staff members can register, take assessments, and track their progress. Admins can manage staff, unlock assessment levels, and monitor overall compliance.

For any issues or questions, refer to the troubleshooting section above.

**Next Steps:**
1. Invite your team members to register
2. Unlock the first assessment level using promo code: `sharonlyhill`
3. Monitor staff progress from the admin dashboard
4. Customize assessment content as needed

Good luck with your Cherith Training healthcare regulation training platform!
