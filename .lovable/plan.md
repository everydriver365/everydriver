

## Plan: School Franchise Fees Section (Admin Portal)

### Overview
Add a "Franchise Fees" section within the Admin Portal's Schools group. This lets admin view and manage per-instructor franchise fee records for each school — tracking status (paid, late, not paid, free), amounts, and due dates. The data model supports future GoCardless integration for automated collection.

### Database Migration

**New table: `school_franchise_fees`**
```sql
CREATE TABLE public.school_franchise_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_paid', -- paid, late, not_paid, free
  payment_method TEXT, -- manual, gocardless, etc.
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.school_franchise_fees ENABLE ROW LEVEL SECURITY;
-- Admin full access
CREATE POLICY "Admins manage franchise fees"
  ON public.school_franchise_fees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- School owners can view their own
CREATE POLICY "School owners view franchise fees"
  ON public.school_franchise_fees FOR SELECT TO authenticated
  USING (public.is_school_owner(school_id));
```

**New column on `schools` table:**
- `franchise_fee_amount` (NUMERIC, default 0) — the standard per-instructor fee for this school

### Files to Create

**`src/components/admin/AdminSchoolFranchiseFees.tsx`**
- School selector dropdown (fetches all schools)
- Summary cards: total due, total collected, overdue count
- Table of fees per instructor per period showing: instructor name, period, amount, status badge (paid=green, late=amber, not_paid=red, free=grey), paid date, payment method
- Actions: Mark as Paid, Mark as Free, Add Fee (dialog with instructor picker, period, amount)
- Filter by status and date range
- Button to bulk-generate fees for all instructors in a school for a given month

### Files to Modify

1. **`src/pages/AdminPortal.tsx`**
   - Add `"school-fees"` to sectionMeta under "Schools" group
   - Add case rendering `<AdminSchoolFranchiseFees />`
   - Import the new component

2. **`src/components/admin/AdminLayout.tsx`** + **`AdminDesktopSidebar.tsx`**
   - Add `{ key: "school-fees", label: "Franchise Fees", icon: PoundSterling }` to the Schools sidebar group

3. **`src/components/school/SchoolLayout.tsx`**
   - Add `{ key: "franchise-fees", label: "Franchise Fees", icon: PoundSterling }` to the Financials group (read-only view for school managers)

4. **`src/components/school/SchoolFranchiseFeesSection.tsx`** (new)
   - School-side read-only view of their own franchise fees, scoped by `school_id`
   - Shows status per instructor per period

5. **`src/pages/SchoolPortal.tsx`** + **`DemoSchoolPortal.tsx`**
   - Add `case "franchise-fees"` routing

### Technical Notes
- Status values: `paid`, `late`, `not_paid`, `free`
- `franchise_fee_amount` on schools table provides the default amount when bulk-generating
- GoCardless integration placeholder: `payment_method` column will store `"gocardless"` when wired up later
- School managers see fees read-only; only admin can create/update fee records

