# Fix: edits on Admin Instructor Detail don't persist

## What's happening
`persistField` in `src/pages/admin/AdminInstructorDetail.tsx` runs:
```ts
await supabase.from("instructors").update({ [field]: value }).eq("id", id);
```
Postgres + Supabase RLS rule on `public.instructors` for UPDATE is:
```
has_role(auth.uid(), 'admin')
```
If RLS filters out the row, the update affects **0 rows** but Supabase **returns no error**. The current code then shows a "Saved" toast, reloads, and you see the old value — exactly matching "I changed values and nothing saved".

Same silent-success path exists in:
- `persistField` (every section row edit)
- `handleSaveProfile` (Edit profile modal)
- `handleSuspend`
- `handleRemove`
- Hero card inline edits (if any go through the same client)

## Root cause candidates (the fix covers all three)
1. The current admin session's `auth.uid()` is **not** in `user_roles` with `role='admin'` (e.g. logged in via the old custom admin layer, or a different account), so RLS blocks the write silently.
2. A genuine column error (wrong type, constraint) — currently surfaced, but only when Postgres returns an error.
3. Date / number parsing converting valid input to `null` and "saving" no-op values.

## Plan

### 1. Make every write **verify it actually changed a row**
Change the four writers in `AdminInstructorDetail.tsx` to:
```ts
const { data, error } = await supabase
  .from("instructors")
  .update({ [field]: value })
  .eq("id", id)
  .select("id");           // returns updated rows
if (error) { …toast error… throw error; }
if (!data || data.length === 0) {
  toast({
    title: "Not saved",
    description: "Permission denied by database (admin role required). Sign out and back in as an admin account.",
    variant: "destructive",
  });
  throw new Error("RLS blocked update");
}
```
Apply the same `.select("id")` + zero-row check to `handleSaveProfile`, `handleSuspend`, `handleRemove`.

### 2. Surface admin-state in the UI
At the top of the page, when `!loading && !isAdmin`, render a small amber banner:
> "You are viewing this page without an admin role — edits will not save."
Uses the existing `useAdminAuth()` value. No new auth logic.

### 3. Show the real DB error in toast
Today `persistField`'s error toast is fine; keep it but also log `{ field, value, error }` to `console.error` so failures are debuggable from the browser console.

### 4. Diagnose your specific session (one-time check, no code)
After the fix is live, attempt one edit:
- If you see **"Not saved — Permission denied"**, the logged-in user lacks the admin role; we then add the missing `user_roles` row for your account.
- If you see **"Save failed: <postgres message>"**, we fix that specific column/constraint.
- If you see **"Saved"** and the value sticks on reload, the original bug was masked by the silent-success path and is now resolved.

## Files to touch
- `src/pages/admin/AdminInstructorDetail.tsx` — add `.select("id")` + zero-row guard to `persistField`, `handleSaveProfile`, `handleSuspend`, `handleRemove`; add console.error; render the non-admin banner.

## Non-goals
- No RLS changes (policy is correct — admins can update).
- No mobile layout changes.
- No new tables or columns.
- No changes to the drawers or hero card read paths.
