## Admin Dashboard Blank & Role Display Bug - Diagnostic Guide

### Debug Logging Added

Added console logging to trace the exact flow when an admin user logs in:

1. **Admin Setup API** (`/app/api/admin/setup/route.ts`)
   - Logs when profile role needs updating
   - Logs confirmation that admin setup is complete

2. **Dashboard Page** (`/app/dashboard/page.tsx`)
   - Logs user ID and profile data fetched
   - Logs when admin is detected and redirect to /admin happens

3. **Admin Layout** (`/app/admin/layout.tsx`)
   - Logs user ID, profile data, and any errors
   - Logs when role check fails or passes

4. **DashboardNav Component** (`/components/dashboard-nav.tsx`)
   - Logs user ID before fetching profile
   - Logs profile fetch result
   - Logs any fetch errors

### How to Test

1. **Create Admin Account**
   - Go through admin setup flow
   - Watch console for "[v0]" logs
   - Check browser DevTools Console (F12) for client-side logs

2. **Login as Admin**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Login with admin account
   - Watch for logs in this order:
     ```
     Dashboard page - user: [ID] profileData: {...} role: admin
     Admin detected in dashboard - redirecting to /admin
     Admin layout - user: [ID] profile: {role: "admin"}
     Fetching profile for user: [ID]
     Profile fetched: {role: "admin", ...}
     ```

3. **Check Server Logs**
   - If using Vercel preview, check the preview terminal
   - Look for `[v0]` prefix logs
   - Should show admin setup completion and role verification

### If Dashboard Stays Blank

1. Check console for these error patterns:
   - `Admin layout - profile: null` → Profile not found
   - `Failed to update admin role: [error]` → Role update failed
   - Profile fetch error in DashboardNav

2. Possible issues:
   - Profile wasn't created after auth user creation (trigger issue)
   - Role was set to something other than "admin"
   - RLS policy preventing profile access
   - Database lag between auth user creation and profile availability

### If Mobile Menu Shows "Staff Member"

1. Check if profile fetch is completing:
   - Look for "Profile fetched:" log
   - If missing, profile fetch is failing silently

2. Verify role value:
   - Log shows role is being fetched correctly
   - If role is "staff", database has wrong value
   - If profile is null, RLS or timing issue

### Next Steps After Testing

Once we see the logs, we can:
1. Identify exact point of failure
2. Add specific fixes based on where the issue occurs
3. Remove debug logging when fixed
