

## Plan: Fix Schedule Mobile App - Squashed Buttons and Entry Save Issues

### Summary
There are two distinct issues on the Schedule mobile page:
1. The view toggle buttons (List/Schedule/Calendar) appear squashed on mobile screens
2. Lessons added via the "Add Lesson" sheet are not saving to the database

---

### Issue 1: Squashed View Toggle Buttons

**Root Cause**: The header section has the page title and toggle buttons in a `flex items-center justify-between` layout. On narrow mobile screens, the three toggle buttons compete for space with the title section.

**Solution**: Make the header layout more mobile-friendly by:
- Stacking the title and buttons vertically on very small screens
- Reducing button padding and size on mobile
- Using a more compact button group design

**Changes**:
- **File**: `src/pages/InstructorSchedule.tsx`
  - Wrap header in responsive layout that stacks on narrow screens
  - Reduce toggle button padding on mobile
  - Use `flex-wrap` to allow buttons to flow naturally

---

### Issue 2: Entries Not Saving

**Root Cause**: The `AddLessonSheet.tsx` component inserts lessons with `payment_status: 'unpaid'`, but the database only accepts these values:
- `not_paid` (127 records)
- `paid` (9 records)  
- `pending` (7 records)

The value `'unpaid'` is invalid and causes a database constraint error, which is caught but results in no data being saved.

**Solution**: Change the payment_status value from `'unpaid'` to `'not_paid'` to match the valid database values.

**Changes**:
- **File**: `src/components/instructor/AddLessonSheet.tsx`
  - Line 131: Change `payment_status: 'unpaid'` to `payment_status: 'not_paid'`
  - Line 149: Change `payment_status: 'unpaid'` to `payment_status: 'not_paid'`
  - Line 215: Change `payment_status: 'unpaid'` to `payment_status: 'not_paid'`

---

### Technical Details

#### Button Layout Fix (InstructorSchedule.tsx)
```text
Current structure:
  <div className="flex items-center justify-between">
    <title section>
    <button group>  ← Gets squashed

Proposed structure:
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <title section>
    <button group with smaller size on mobile>
```

#### Payment Status Fix (AddLessonSheet.tsx)
```text
// Before (3 locations)
payment_status: 'unpaid'

// After (3 locations)
payment_status: 'not_paid'
```

---

### Files to Modify
1. `src/pages/InstructorSchedule.tsx` - Header layout improvements
2. `src/components/instructor/AddLessonSheet.tsx` - Fix payment_status values

