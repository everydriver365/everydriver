# RLS Audit Report

Service role bypasses RLS on every table — all "can the service role always write?" answers are **yes** by definition (edge functions using the service key are unaffected). Below is the per-table breakdown for end-user roles.

---

## scheduled_lessons — RLS: ✅ enabled
- **SELECT** — `Instructors view own non-deleted scheduled lessons` (`instructor_id = get_instructor_id_for_user(auth.uid()) AND deleted_at IS NULL`); `Admins view all (incl deleted)`.
- **INSERT** — `Instructors manage own scheduled lessons` (instructor or admin).
- **UPDATE** — `Instructors update own scheduled lessons` (instructor or admin).
- **DELETE** — `Instructors delete own scheduled lessons` (instructor or admin).

**Findings**
- ✅ Logged-in instructor CAN read their own lessons via `get_instructor_id_for_user(auth.uid())`. No conflicting restrictive policy.
- ⚠️ **No SELECT policy for pupils.** A pupil cannot read their own lesson rows. If the pupil app/diary needs to read `scheduled_lessons` directly, every query has to go through an edge function. Likely intentional, but worth confirming.
- ⚠️ Instructor SELECT hides `deleted_at IS NOT NULL`. The "stuck lessons" hotfix earlier today relied on this — soft-deleted rows are invisible to instructors, which is the intended behaviour but means any cleanup must happen server-side.

---

## payment_history — RLS: ✅ enabled
- **ALL** — `Instructors access own payment history` (instructor or admin).
- **SELECT** — `Instructors can view their own payment history` (duplicate, narrower; `authenticated` only).

**Findings**
- ✅ Instructors can read their own records.
- ❌ **No pupil-facing policy.** Pupils cannot read `payment_history` at all. If "pupil reads own balance" is meant to come from this table, it's blocked. (If balance is read from `pupils.account_balance` instead, this is fine — please confirm which source the pupil portal uses.)
- ⚠️ Two overlapping policies (`ALL` + `SELECT`) — harmless but redundant; the `ALL` policy already covers SELECT.

---

## pupils — RLS: ✅ enabled
- **SELECT** — `Instructors view own non-deleted pupils`, `Instructors view own archived pupils`, `Pupils view their own non-deleted row`, `Admins view all pupils incl deleted`.
- **INSERT** — `Instructors insert own pupils` (instructor or admin).
- **UPDATE** — `Instructors update own pupils`, `Pupils can update their own row`.
- **DELETE** — no explicit policy (only admins via implicit? — actually **none**, so non-admin deletes are blocked).

**Findings**
- ✅ Instructor read + update of own pupils works (non-deleted and archived split into two policies — both present, no gap).
- ✅ Pupils can read/update their own row.
- ⚠️ **No DELETE policy** — instructors cannot hard-delete pupils via the Data API. Soft-delete via `deleted_at` UPDATE works. Probably intentional.
- ✅ No silent-empty risk: `get_instructor_id_for_user` is `SECURITY DEFINER` and returns the instructor id for the auth user.

---

## instructor_working_hours — RLS: ✅ enabled
- **SELECT** — `Working hours publicly viewable for booking` (`USING (true)`, role `public`).
- **INSERT/UPDATE/DELETE** — own-row by instructor or admin.

**Findings**
- ✅ Instructors can read and write their own hours.
- ⚠️ **SELECT is fully public (anon + authenticated).** Intended for the public booking pages. Confirm this is acceptable — every instructor's weekly schedule is world-readable.

---

## instructor_date_overrides — RLS: ✅ enabled
- Same shape as `instructor_working_hours`: public SELECT, own-row write.

**Findings**
- ✅ Instructor read/write works.
- ⚠️ Same public-read note as above.

---

## slot_offers — RLS: ✅ enabled
- **ALL** — `Instructors can manage slot offers` (own instructor_id).
- **SELECT** — `Instructors can view slot offers` (own instructor_id, duplicates the ALL).
- **SELECT** — `Pupils can view offers they are invited to` (joined via `slot_offer_recipients`).

**Findings**
- ✅ Instructors can read/manage their own offers.
- ✅ Pupils can read offers they were invited to.
- ⚠️ Redundant instructor SELECT alongside ALL — harmless.

---

## slot_offer_recipients — RLS: ✅ enabled
- **ALL** — `slot_recipients instructor full` (own instructor_id).
- **SELECT** — `slot_recipients pupil read` (own pupil_id).
- **UPDATE** — `slot_recipients pupil viewed update` (own pupil_id).

**Findings**
- ✅ Both sides covered. Pupil can mark viewed; instructor has full management.

---

## instructor_notifications — RLS: ✅ enabled
- **SELECT** — instructor own rows.
- **INSERT** — admins only.
- **UPDATE** — instructor own rows.
- **DELETE** — **no policy**.

**Findings**
- ✅ Instructors can read and mark-as-read their own notifications.
- ⚠️ **No DELETE policy** — instructors cannot delete/dismiss notifications via Data API (would need edge function or soft-delete column).
- ⚠️ INSERT is admin-only — fine because edge functions use service role; but a self-serve client insert would fail. Likely intentional.

---

## payment_intents — RLS: ✅ enabled
- **ALL** — `Admins can manage payment intents` (admin only).

**Findings**
- ❌ **No instructor or pupil policy at all.** Neither party can read or write `payment_intents` from the client. If the pupil checkout or instructor portal is expected to read intent status directly, every call must go via an edge function. If the intent here is "service-role only + admin", this is correct; if any client UI reads `payment_intents`, it is silently returning empty.

---

# Summary of likely real gaps

| # | Table | Gap | Severity |
|---|---|---|---|
| 1 | `payment_intents` | No instructor/pupil read policy. Any direct client read returns empty. | High — confirm whether client code queries this table |
| 2 | `payment_history` | No pupil read policy. Pupils cannot see their own payments. | Medium — depends on whether pupil balance UI reads this table |
| 3 | `scheduled_lessons` | No pupil read policy. Pupils cannot read their own lessons directly. | Medium — likely intentional if pupil diary uses an edge function/view |
| 4 | `instructor_notifications` | No DELETE policy. | Low |
| 5 | `pupils` | No DELETE policy. | Low (soft-delete via UPDATE works) |
| 6 | `instructor_working_hours` / `instructor_date_overrides` | `SELECT USING (true)` — fully public. | Informational — intended for public booking pages |

No changes have been made. Tell me which of the above you'd like fixed (1 and 2 are the most likely to be causing visible bugs) and I'll write the migration.
