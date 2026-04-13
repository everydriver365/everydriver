

## Plan: Add BNPL Section to School Manager

### Overview
Add a "Buy Now, Pay Later" menu item under the Financials group in the school sidebar, linking to a new section where schools can configure their Klarna and Clearpay accounts for use on their booking pages.

### Database Migration
Add two columns to the `schools` table:
- `klarna_enabled` (boolean, default false)
- `clearpay_enabled` (boolean, default false)

With RLS allowing school owners to update their own record (already covered by existing policies).

### Files to Create

**`src/components/school/SchoolBNPLSection.tsx`**
- Shows two branded cards (Klarna pink, Clearpay green) using the existing SVG logos (`klarna-logo.svg`, `clearpay-logo.svg`)
- Each card has a toggle switch to enable/disable, status indicator, and info about fees
- For the live portal: reads/writes `klarna_enabled` and `clearpay_enabled` on the `schools` table
- For demo mode: local state toggles with toast feedback
- Informational notes about how BNPL appears on the school's public booking page

### Files to Modify

1. **`src/components/school/SchoolLayout.tsx`**
   - Add `{ key: "bnpl", label: "Buy Now, Pay Later", icon: CreditCard }` to the Financials sidebar group
   - Add `bnpl` to `sectionMeta`

2. **`src/pages/SchoolPortal.tsx`**
   - Add `case "bnpl"` returning `<SchoolBNPLSection school={school} onRefresh={refetch} />`

3. **`src/pages/DemoSchoolPortal.tsx`**
   - Add `case "bnpl"` returning `<SchoolBNPLSection school={school} onRefresh={noop} />`

### Technical Details
- Reuses existing `klarna-logo.svg` and `clearpay-logo.svg` assets already in the project
- Follows the same pattern as `PaymentOptionsSettings.tsx` (the instructor-level BNPL toggle) but adapted for school-level control
- No new edge functions needed — simple boolean flags on the schools table

