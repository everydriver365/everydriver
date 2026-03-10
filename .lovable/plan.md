

## Soft Delete for Instructors and Pupils in Admin Panel

### Current State
- **Pupils**: Already use soft delete (`deleted_at` column exists, `softDelete()` from `auditLogger.ts` is used in `PupilRecordsManager`). No changes needed for pupils.
- **Instructors**: Use hard delete (`.delete()`) in three places: `AdminInstructorProfile.tsx`, `InstructorManager.tsx`, and `InstructorList.tsx`. The `instructors` table has **no `deleted_at` column**.

### Plan

**1. Add `deleted_at` column to `instructors` table**
- Database migration: `ALTER TABLE public.instructors ADD COLUMN deleted_at timestamptz DEFAULT NULL;`
- Add the table to the `softDelete` function's allowed tables in `auditLogger.ts`.

**2. Convert all instructor deletes to soft delete**
Replace `.delete().eq("id", id)` with `.update({ deleted_at: new Date().toISOString() }).eq("id", id)` in:
- `AdminInstructorProfile.tsx` (line 163)
- `InstructorManager.tsx` (line 184-187)
- `InstructorList.tsx` (line 63-66)

Also log the action via `logAudit` / `logAdminAction` with the old record snapshot.

**3. Filter out soft-deleted instructors from queries**
Add `.is("deleted_at", null)` to instructor list queries in `InstructorManager.tsx` and `InstructorList.tsx` so deleted instructors don't appear in the active list.

**4. Add a "Deleted Instructors" restore section**
Add a small collapsible section or tab in the instructor list showing soft-deleted instructors with a "Restore" button that sets `deleted_at = null`.

**5. Update delete confirmation dialogs**
Change wording from "permanently delete" to "This record will be archived and can be restored later" in all three components.

### Files to change
- **Migration**: Add `deleted_at` column to `instructors`
- **`src/lib/auditLogger.ts`**: Add `"instructors"` to the `softDelete` function's allowed table names
- **`src/components/admin/AdminInstructorProfile.tsx`**: Soft delete + updated dialog text
- **`src/components/admin/InstructorManager.tsx`**: Soft delete + filter deleted + restore UI
- **`src/components/admin/InstructorList.tsx`**: Soft delete + filter deleted + updated dialog text

