# Add Compliance & docs section to instructor detail

## Goal
Make every compliance-related column on `instructors` editable from `/admin/instructors/:id` so the hero's read-only ADI/DBS/Insurance badges have a matching edit path.

## Change
Add a new **Compliance & docs** section card to column 3 of `defaultSections.ts` (between Loyalty points and Complaints & flags). All columns already exist on `instructors` — no schema change.

Rows (all wired to DB via existing `persistField`):

| Label | Column | Type |
|---|---|---|
| ADI badge no. | `adi_badge_number` | text |
| ADI badge expiry | `adi_badge_expiry` | date |
| ADI grade | `adi_grade` | text |
| Years exp (ADI) | `years_experience_adi` | number |
| DBS issued | `dbs_certificate_issued` | date |
| DBS expiry | `dbs_certificate_expiry` | date |
| DBS cert URL | `dbs_certificate_url` | text |
| Licence no. | `driving_licence_number` | text |
| Licence expiry | `driving_licence_expiry` | date |
| Insurance provider | `insurance_provider` | text |
| Insurance policy no. | `insurance_policy_number` | text |
| Standards check | `standards_check_at` | date |
| Standards result | `standards_check_result` | text |

## Notes
- Read-only mirroring of `adi_badge_expiry` / `dbs_certificate_expiry` in the hero badges continues to work — they re-read from the refreshed row after save.
- No backend, RLS, or route changes. Single-file edit to `defaultSections.ts`.
