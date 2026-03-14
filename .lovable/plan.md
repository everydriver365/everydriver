

## Fix: Pupils Not Appearing in Payment Dropdown

### Root Cause
The query in `InstructorTakePayment.tsx` filters with `.eq("is_active", true)`, but the `pupils` table has no `is_active` column. It uses `deleted_at` (soft delete) and a `status` column instead. The query silently returns empty results.

### Fix

**File: `src/pages/InstructorTakePayment.tsx`**

Replace:
```typescript
.eq("is_active", true)
```
With:
```typescript
.is("deleted_at", null)
```

This matches the pattern used elsewhere in the codebase (e.g., `TestRequestForm.tsx`, `DormantPupilsCard.tsx`, `AdminInstructorProfile.tsx`).

