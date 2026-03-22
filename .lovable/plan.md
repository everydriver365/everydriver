

## Plan: Admin Fee Split Slider for Instructors

### Concept
Replace the binary "Pupil Pays / Instructor Pays" toggle with a **slider (0–100%)** representing how much of the admin fee the **pupil** pays. The instructor absorbs the remainder. E.g. slider at 75% means pupil pays 75% of the fee, instructor absorbs 25%.

### Database Change
Add a new column to the `instructors` table:

```sql
ALTER TABLE instructors ADD COLUMN commission_split_percent INTEGER NOT NULL DEFAULT 100;
-- 100 = pupil pays all (current "pupil" behaviour)
-- 0 = instructor pays all (current "instructor" behaviour)
-- 50 = split 50/50
```

Keep `commission_payer` as-is for backward compatibility — the slider value takes precedence.

### Files Changed

| File | Change |
|------|--------|
| **Migration** | Add `commission_split_percent` column (default 100) |
| `src/components/instructor/CommissionPayerSettings.tsx` | Replace two buttons with a Slider (0–100). Show live preview: "Pupil pays X%, you pay Y%". Quick presets: 0%, 50%, 100%. Save to `commission_split_percent`. Also update `commission_payer` for backward compat ("instructor" if 0, "pupil" if 100, "split" otherwise). |
| `src/components/admin/AdminInstructorProfile.tsx` | Replace the Select dropdown (lines 644–654) with same slider UI or a compact version |
| `src/hooks/useAdminFee.ts` | Accept `commissionSplitPercent` (default 100). Calculate full fee, then return `pupilFee = fee × split%`, `instructorFee = fee × (100 - split%)`. Update return type to include both portions. |
| `src/components/payments/AdminFeeBreakdown.tsx` | Show the split if partial — "Admin fee: £X (you pay £Y, instructor absorbs £Z)" |
| `src/context/InstructorAuthContext.tsx` | Add `commission_split_percent` to instructor type and select query |
| `src/pages/InstructorSettings.tsx` | Add `commission_split_percent` to profile type and select query |
| Edge functions using commission logic | Use `commission_split_percent` to calculate pupil's portion of fee |

### UI Behaviour

**Instructor Settings** — Slider with:
- Labels: "You pay 100%" on left, "Pupil pays 100%" on right
- Live example: "On a £40 lesson: Admin fee £1.20 → Pupil pays £0.60, you absorb £0.60" (at 50%)
- Quick preset buttons: "I pay all", "Split 50/50", "Pupil pays all"

**Admin Panel** — Same slider inline on the instructor profile page

### Fee Calculation Logic
```
fullFee = baseAmount × rate% + fixedPence
pupilFee = fullFee × (splitPercent / 100)
totalCharge = baseAmount + pupilFee
instructorAbsorbs = fullFee - pupilFee
```

