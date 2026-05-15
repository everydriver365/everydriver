## Public Test Swap — Match Browse & Request Flow

After someone registers on `/test-swap/register`, take them to a results page that lists other registered swappers whose details could fit them, lets them pick one, and emails the owner of that slot to propose the swap.

### 1. Compatibility rule

A row in `public_test_swap_signups` (status = `pending`, `has_test_booked = true`) is shown to the current user when **both directions work**:

- **Their test fits my window**: their `current_test_date` is between my `earliest_new_date` and `latest_new_date`.
- **My test fits their window** (only if I also have a test booked): my `current_test_date` is between their `earliest_new_date` and `latest_new_date`. If I haven't booked one yet, this side is skipped — they're shown as "potential match, you don't have a test yet".
- Exclude my own row (match by email).
- Do not require the same test centre — show centre on the card so the user can judge distance. Sort by closest date difference, then most recent.

### 2. New page `/test-swap/matches/:signupId`

After a successful registration, redirect from `/test-swap/register` to `/test-swap/matches/<new id>` instead of the current "we'll email you" success state. The page also remains shareable (e.g. from a future "view matches" link in a confirmation email).

Layout:
- Header: "Hi {name}, here are people who could swap with you".
- Summary chip row: my test (centre, date, time) and my window.
- List of match cards. Each card: masked first name + initial, current centre, current test date/time, their available window, "Looks like a good swap" / "Possible swap (you have no test booked)" badge, **Request swap** button.
- Empty state: "No matches yet — we'll email you the moment one appears."
- Refresh button + auto-refetch on focus.

Privacy: never expose other people's email, phone, or full surname on the client. The list view returns only safe fields via a SECURITY DEFINER RPC.

### 3. Requesting a swap

Clicking **Request swap** opens a confirm dialog ("We'll share your name, phone and email with this person so they can arrange the swap. Continue?"). On confirm:

1. Insert a row into a new `test_swap_match_requests` table (`requester_signup_id`, `target_signup_id`, `status` default `pending`, `created_at`). Unique on (requester, target) so the same pair can't be spammed.
2. Invoke a new edge function `notify-public-test-swap-request` which:
   - Loads both signup rows server-side using the service role.
   - Re-checks compatibility (defence in depth).
   - Sends a transactional email to the **target** owner with the requester's name, phone, email, current test (centre/date/time) and window.
   - Sends a confirmation email to the requester ("We've passed your details to {firstName}").
3. Show a toast + replace the card's button with "Request sent".

### 4. Email delivery

Use Lovable's built-in email infrastructure. Two new transactional templates:
- `test-swap-match-request` (to the slot owner)
- `test-swap-request-sent` (to the requester)

Both styled to match Drive365 / DSM branding already used by other transactional templates. No marketing content, no unsubscribe link in body (system appends it). If the email domain / infra isn't yet provisioned, the scaffold steps run first.

### 5. Database changes

Migration adds:
- `test_swap_match_requests` table with RLS:
  - `anon` + `authenticated` can `INSERT` only via the RPC (the RPC bypasses RLS); direct insert blocked.
  - Admin-only `SELECT/UPDATE/DELETE` (`has_role(auth.uid(),'admin')`).
- SECURITY DEFINER RPCs:
  - `get_test_swap_matches(p_signup_id uuid)` — returns safe match rows for that signup id, applying the compatibility rule. Callable by `anon` + `authenticated`.
  - `request_test_swap(p_requester_signup_id uuid, p_target_signup_id uuid)` — re-validates compatibility, inserts the request row, returns the new id. Callable by `anon` + `authenticated`. The signup id is treated as a capability token (UUIDv4, unguessable) so the page works without auth, mirroring the existing public registration flow.

### 6. Files touched

- New: `src/pages/TestSwapMatches.tsx`
- Edited: `src/pages/TestSwapRegister.tsx` (redirect to matches page on success, return inserted id)
- Edited: `src/routes/publicRoutes.tsx`, `src/routes/everydriverRoutes.tsx` (add `/test-swap/matches/:id`)
- New migration: `test_swap_match_requests` + RPCs
- New edge function: `supabase/functions/notify-public-test-swap-request/`
- New email templates: `supabase/functions/_shared/transactional-email-templates/test-swap-match-request.tsx` and `test-swap-request-sent.tsx` + registry update
- If transactional email infra not yet set up: run the email infra + scaffold steps first

### Out of scope

- Two-way "accept/decline" handshake on the platform (this version just emails the owner — they reply by phone/email outside the app).
- Distance/centre-radius matching.
- Authenticated logged-in account for swappers.

### Open question

When someone clicks **Request swap**, do you want the slot owner's email **also** revealed back to the requester (so both sides have each other's contact), or only one-way (owner gets requester's details)? Default in this plan: one-way — owner emails the requester back if interested.