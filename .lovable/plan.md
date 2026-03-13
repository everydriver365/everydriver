

## Add Parent Portal Access Toggle for 18+ Pupils

### Overview
Pupils aged 18 or over will see a toggle in their profile to control whether their parent/guardian can access the Parent Portal. By default, parent access remains enabled (backward compatible). When disabled, the parent OTP flow will reject access for that pupil.

### Database Change
Add a `parent_portal_enabled` column to the `pupils` table:
```sql
ALTER TABLE public.pupils 
ADD COLUMN parent_portal_enabled boolean NOT NULL DEFAULT true;
```

### Files to Modify

| File | Change |
|------|--------|
| `src/components/pupil-portal/PupilPortalProfileEdit.tsx` | Add a "Parent Portal Access" section at the bottom. Calculate age from `date_of_birth`; if ≥18, show a Switch toggle bound to `parent_portal_enabled`. Toggling calls `update_pupil_profile` RPC. Only visible when DOB is set and age ≥ 18. |
| `supabase/functions/send-parent-otp/index.ts` | Filter the pupils query to also check `parent_portal_enabled = true`. If all matched pupils have it disabled, return an error ("Access has been restricted by the learner"). |

### UI in Profile (18+ only)

```text
── Parent / Guardian ──────────────
  Parent Portal Access     [toggle]
  Allow your parent to view
  your progress and lessons
```

- Hidden entirely if pupil is under 18 or DOB not set
- Uses the existing `Switch` component
- Appears after the Pick-up Address section

### Data Flow
- Toggle updates `pupils.parent_portal_enabled` via the existing `update_pupil_profile` RPC
- `send-parent-otp` filters `parent_portal_enabled != false` so disabled pupils are excluded from the parent's child list
- If a parent has multiple children and only one disables access, they still see the other children

