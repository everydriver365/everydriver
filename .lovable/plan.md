

# Why No Courses Show on Drive365

## Root Cause

The `instructors` table has a restrictive SELECT RLS policy that only allows authenticated users who are either the instructor themselves or an admin to read rows:

```sql
-- Current policy (authenticated role only):
"Instructors can view own profile" → auth_user_id = auth.uid() OR has_role(auth.uid(), 'admin')
```

When an unauthenticated visitor lands on Drive365 (the learner site), the `useFeaturedCourses` hook queries the `instructors` table with the anon key. RLS blocks all rows, so featured courses come back empty.

## Fix

Add a **public SELECT policy** on the `instructors` table that exposes only active instructors with limited columns. Since the table is already queried with `.select("*")` in the hook, the policy itself just needs to allow reading active instructors — sensitive fields like `auth_user_id` are the concern, but RLS policies control row access, not column access.

**Two options:**

### Option A — Simple public read policy (recommended)
Add a SELECT policy for the `anon` role that only returns active instructors:

```sql
CREATE POLICY "Active instructors publicly viewable"
ON public.instructors FOR SELECT TO anon
USING (is_active = true);
```

This is safe because the `instructors` table contains business-facing data (name, hourly rate, car type, profile image) that is already exposed via the `public-courses` edge function. No passwords or truly sensitive PII is stored there.

### Option B — View-based approach
Create a view excluding `auth_user_id` and grant access through that. More complex but hides the auth column.

**Recommendation:** Option A is sufficient. The `auth_user_id` column is a UUID reference — not sensitive on its own — and this data is already publicly served by the `public-courses` edge function.

## Implementation

1. **Database migration**: Add the public SELECT policy for anon users on `instructors`
2. **No code changes needed** — the `useFeaturedCourses` hook and `Index.tsx` rendering logic already handle the data correctly; they just can't access it due to RLS

## Files Changed
- 1 database migration only

