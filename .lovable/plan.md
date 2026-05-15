## Problem

On `/test-swap`, the two "Find a swap match" CTAs (hero + bottom card) and the homepage banner all link to `/courses` (instructor search). There is no learner-facing page to actually register interest in a test swap, so visitors get dumped into the lesson booking flow instead.

## Plan

### 1. New page: `/test-swap/register`

A public, unauthenticated registration form for learners who want to join the swap pool. Captures the minimum needed to match two learners:

- Full name
- Email + mobile
- Current DVSA test centre (autocomplete from existing `test_centres` table)
- Current test date + time (date/time pickers; optional if they don't have one yet — toggle "I don't have a test booked yet, notify me of matches")
- Earliest acceptable new date + latest acceptable new date
- Optional: preferred alternate centres (multi-select), notes
- Consent checkbox (privacy + contact permission)

Wrapped in `MainLayout`, Drive365 styling, success state showing "We'll email you as soon as we find a match" and a link back to `/test-swap`.

### 2. Repoint all swap CTAs

Update three links from `/courses` → `/test-swap/register`:
- `src/pages/TestSwap.tsx` hero CTA (line ~60)
- `src/pages/TestSwap.tsx` bottom card CTA (line ~128)
- Keep the homepage banner on `/drive365` pointing at `/test-swap` (it already opens the info page, which is correct — the new register page is reached from there)

The "How it works" button stays pointing at `/faqs`.

### 3. Database: new `public_test_swap_signups` table

Existing `test_requests` requires an `instructor_id` and an authenticated user, so it can't accept public signups. Add a separate intake table:

```text
public_test_swap_signups
  id uuid pk
  full_name text
  email text
  phone text
  current_centre_id uuid → test_centres(id) nullable
  current_centre_name text
  current_test_date date nullable
  current_test_time time nullable
  has_test_booked boolean
  earliest_new_date date
  latest_new_date date
  alternate_centre_ids uuid[] default '{}'
  notes text
  consent_given boolean not null
  status text default 'pending'   -- pending | matched | cancelled
  created_at timestamptz default now()
```

RLS:
- INSERT: allow anonymous (`anon` role) so the public form works without login.
- SELECT/UPDATE/DELETE: admins only via `has_role(auth.uid(),'admin')`.

Indexes on `current_centre_id`, `status`, `created_at`.

### 4. Admin visibility (light touch)

Out of scope for this task: building a full admin matching UI. The signups land in the table; an admin can review them via the existing backend. Mention this in the plan but do not build it unless you confirm you want it.

## Out of scope

- Admin matching dashboard / matching algorithm.
- Email notifications when a match is found (can be added later via an edge function).
- Linking signups to authenticated pupil accounts.

## Questions before building

1. Is a brand-new public intake table the right approach, or do you want this to flow into the existing `test_requests` table somehow (which currently requires an instructor)?
2. Should we send a confirmation email on signup now, or just store the record and add email later?
