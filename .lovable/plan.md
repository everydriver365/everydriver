## Plain-English answer

You don't need to learn the table names. Here's what's actually wrong: every place in the app that asks "what days does Ken work?" expects the answer to be saved using one set of day numbers (where Sunday = 0). Ken's record is saved using a **different numbering** (where Sunday = 7). So whenever the booking engine asks for Sunday, it gets nothing, and one of his rows (the stray "day 7") is junk the engine ignores.

That alone shouldn't kill June — most of the codepaths *should* still find his weekdays. But Drive365 (the public course search) is more strict than the other pages, so it's the first surface where the mis-numbering becomes visible. We need to inspect it on the actual page to be 100% sure that's the root cause — there's a small chance Drive365 is also filtering on something else (instructor radius, course visibility, postcode coverage) that's hiding him independently.

## Plan

### Step 1 — Confirm the actual Drive365 cause (read-only)
Before changing anything else, inspect Drive365 with Ken in scope:

- Open the published `/courses` page (or course search) with Ken's instructor id in URL/postcode scope.
- Capture what's rendered for his 5 courses for the June window — is it "no availability", is the card hidden entirely, or does it show a "first available" date that's wrong?
- Check `useFeaturedCourses.findFirstAvailableDate` output for him: with today = 16 May and `available_from = 1 Jun 2026`, it should return Mon 1 Jun (his Monday hours match). If it returns `null`, that's the day-numbering bug confirmed for this surface. If it returns a date but the UI still says "no availability", a different filter is hiding him — likely course visibility, search radius, or the `public_instructors` view filtering on something.

This step is essential so we don't "fix" the wrong thing.

### Step 2 — Fix Ken's data
Rewrite his two weekly-hours tables into the conventions the rest of the codebase actually uses. End-state we want for Ken:

| Day | Working hours |
|---|---|
| Mon | 10:30–16:00 |
| Tue | 10:30–16:00 |
| Wed | 10:30–16:00 |
| Thu | 10:30–16:00 |
| Fri | 10:30–16:00 |
| Sat | 07:00–12:00 |
| Sun | 07:00–12:00 |

Do this via a one-off insert/update that deletes his existing rows in both tables and re-inserts them with the correct day numbers. Keep his `available_from = 2026-06-01` as-is.

After the rewrite, re-verify by running the same Drive365 check from Step 1.

### Step 3 — Catch this for everyone else
The admin **Availability Sync Health** dashboard we just shipped only catches *drift* between the two tables — it does **not** flag when both tables are using the wrong numbering. Add a third check: any row in the weekly-hours tables whose day number is outside the expected range for that table → flag as **"Wrong day numbering"** with a one-click repair that rewrites the row using the correct convention (inferring the intended day from the working hours pattern).

Then run that check across all 5,803 instructors so anyone else affected by the same bad backfill is fixed too.

### Step 4 — Prevent it ever returning
The dual-write helpers and the editors already enforce the correct convention going forward, but the bug came from an old backfill or manual write. Add a `CHECK` constraint to each weekly-hours table so the DB itself rejects rows outside the valid day range. New mis-numbered rows can never be inserted again.

## Out of scope
- Mobile layouts
- Booking engine logic, scheduler clash rules
- The legacy two-table design itself (separate refactor — every consumer in the codebase reads one or both directly; tracked separately)

## Order of work
1. Step 1 — Drive365 inspection (read-only, 5 min)
2. Step 2 — Ken's data rewrite (1 min after Step 1 confirms)
3. Step 3 — Convention check in the admin dashboard + bulk repair pass
4. Step 4 — DB `CHECK` constraints

Want me to start with Step 1 only, then come back with what I find before doing Steps 2–4? Or run 1 + 2 together, then 3 + 4 as a follow-up?
