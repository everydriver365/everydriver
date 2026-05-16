## Why Ken is showing in May

In the previous round I cleared Ken's `available_from` date as part of the "unblock him" fix — but that 1 June 2026 date was correct and intentional, not a mistake. With the date cleared, the booking engine has nothing stopping May slots from appearing.

## Fix

### 1. Restore Ken's data
Set `available_from = 2026-06-01` back on his `instructors` row.

After this the booking engine (`courseAvailability.ts` lines 303 + 446 and every other surface that respects `available_from`) will hide him from every pupil-facing page until 1 Jun 2026. The diagnostic panel we just shipped will display "Hidden until 1 Jun 2026" on his own Availability page so he can see exactly what's happening.

### 2. Remove the 14-day warning
Pupils can book up to 365 days in advance, so an instructor legitimately picking a date 1–12 months out is normal — Ken's case is exactly that. The popup confirmation we added in `AvailableFromCard.tsx` is noise.

Remove the `daysOut > 14` confirmation block in `src/components/instructor/AvailableFromCard.tsx` (`save` function). Keep the date picker, the "Available now" / cleared state, and the toast. The diagnostic card already explains the consequence clearly.

### 3. Soften the diagnostic copy
In `src/components/instructor/AvailabilityDiagnostic.tsx`, the "future available_from" case is currently rendered as a red **error** with copy "Pupils won't see any slots until then. Clear it above if this was a mistake." That assumes it was an accident. Change to:

- Status: `warn` (amber) instead of `error` (red)
- Title: `Hidden until {date}` (unchanged)
- Detail: `Pupils won't see any slots until {date} ({N days} away). This is fine if you're on a long break — clear the date above if you didn't mean to set it.`

### Out of scope
- The dual-write sync, the backfill, and the diagnostic panel framework all stay exactly as they are — they were the right fixes.
- No changes to booking engine logic, mobile layouts, or other instructors.

## Technical summary

| Change | File / action |
|---|---|
| Restore Ken | `UPDATE instructors SET available_from = '2026-06-01' WHERE id = <ken>` via supabase--insert |
| Drop 14-day confirm | Edit `AvailableFromCard.tsx` `save()` — remove the `if (next) { … daysOut > 14 … }` block |
| Re-tone diagnostic | Edit `AvailabilityDiagnostic.tsx` — switch the future-`available_from` branch from `status: "error"` to `status: "warn"` and update the detail string |

Verification: re-query `instructors.available_from` for Ken and re-run the next-14-days slot check — expect zero slots until 1 Jun, then his normal Mon–Fri 10:30–16:00 / Sat–Sun 07:00–12:00 pattern resuming.
