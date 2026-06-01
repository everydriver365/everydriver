## Goal
On `/instructor/quotes`, the "New quote" dialog disables the Create button with the hint "Pick an instructor to continue." Instructors should never see this — the issuer is always themselves.

## Root cause
`CreateQuoteDialog` requires `issuerInstructorId` for `canSubmit`. In instructor scope it relies on the `instructorId` prop coming from `useInstructorAuth().instructor?.id` in `QuotesPage`. When that context value is briefly null (or unavailable for any reason), the dialog falls into the admin-style "pick an instructor" copy, which is irrelevant on an instructor account.

## Changes (UI only)

**`src/components/quotes/CreateQuoteDialog.tsx`**
1. Treat `scope === "instructor"` as "issuer already known":
   - Resolve `issuerInstructorId` for instructor scope at submit time using `supabase.rpc('get_instructor_id_for_user', { _user_id: (await supabase.auth.getUser()).data.user?.id })` as a fallback when the `instructorId` prop is null. Cache it in local state on dialog open.
2. Adjust `canSubmit`:
   - For `scope === "instructor"`: only require `pupil_name` and `price > 0` (no instructor pick).
   - For `scope === "admin"`: keep the existing instructor requirement.
3. Update the disabled-button hint block:
   - Remove the "Pick an instructor to continue." branch entirely for instructor scope.
   - Keep the pupil-name / price hints.
4. Keep the admin-scope instructor `Select` and its hint unchanged.

**`src/pages/quotes/QuotesPage.tsx`**
- No structural change required; the dialog now self-heals when the auth context hasn't populated `instructor.id` yet.

## Out of scope
- No schema, RLS, or quotes insert logic changes.
- No edits to admin scope behavior.
