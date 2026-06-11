## Diagnosis (what's actually wrong)

The backend isn't busy. The two `/auth/v1/token` calls in the network log both returned **200 in ~140 ms**. The "login service is busy" message is generated *inside the app*, in `InstructorAuthContext.signIn`, by a chain of fragile client-side mechanisms:

1. `signInWithTimeout` races `supabase.auth.signInWithPassword` against a 12 s timer, then retries on any "transient" error. Slow profile queries downstream can make the *whole* `signIn()` look timed out.
2. After auth succeeds, `signIn()` still does a **second** round-trip (`instructors.select('deleted_at, scheduled_purge_at').eq('auth_user_id', …)`) before returning. If that one is slow under load, the user sees a failure even though auth worked.
3. `fetchInstructorProfile` selects **~70 columns** from `instructors` (236-column wide table). At 6000 users this is the real bottleneck.
4. Redirect to `/instructor` depends on `onAuthStateChange` firing — when it doesn't, the button spins forever and the user retries (causing those duplicate token calls).
5. Sign-out previously awaited a network call that can hang on a stale refresh token.
6. There are multiple parallel auth providers (Instructor / Admin / School / Pupil) all calling `supabase.auth.getSession()` on every mount → connection thrash.

## Target architecture (built for 6000 concurrent instructors)

```text
Client                          Edge / Postgres
──────                          ──────────────
sign in (Supabase Auth) ─────►  /auth/v1/token   (always direct, never wrapped)
        │
        ▼
AuthSessionContext (one global, app-wide)
  - getSession() once on boot
  - onAuthStateChange is the ONLY writer
  - exposes { session, userId, status }
        │
        ▼
useMyInstructorSession()  ──►   RPC get_my_instructor_session()
  React Query, staleTime 5 min   - SECURITY DEFINER
  enabled: status==='authed'     - returns minimal bundle in 1 round-trip:
                                   { instructor_id, name, app_slug,
                                     is_active, plan_slug, features[],
                                     deletion_pending_until }
        │
        ▼
useInstructorProfileExtended()  ──► thin views per concern
  loaded lazily by the screen that needs it
  (branding, payments, AI flags, MTD, etc.)
```

### What changes

1. **One global auth context** (`AuthSessionContext`) replaces the per-portal providers' duplicate session bootstrapping. Portal-specific contexts subscribe to it instead of calling `getSession()` themselves.
2. **`signIn` does one thing**: call `supabase.auth.signInWithPassword`, return its result. No timeout wrapper, no retry, no extra DB query, no "transient error" reclassification. Real errors surface verbatim.
3. **Single RPC for post-login bundle**: `get_my_instructor_session()` returns the small set of fields actually needed to render the shell (id, name, slug, plan, features, deletion-pending flag). One indexed lookup, ~5 ms.
4. **Lazy column loading**: split the 70-column profile read into focused hooks (`useInstructorBranding`, `usePaymentSettings`, `useAIFlags`, …) each fetching only what its screen needs, cached via React Query.
5. **Deletion-pending check moves server-side** into the RPC, so login never makes a second blocking call.
6. **Indexes & RLS hardening** for 6000 users:
   - `create unique index if not exists instructors_auth_user_id_uidx on public.instructors(auth_user_id) where auth_user_id is not null;`
   - Confirm `has_role(uuid, app_role)` is `STABLE SECURITY DEFINER` with `search_path=public` (it is) and used everywhere instead of inline subqueries.
   - Verify `get_instructor_id_for_user(auth.uid())` is the only identity helper used in policies — replace any ad-hoc joins.
7. **Sign-out becomes synchronous + local-only** (already partially done): clear context state, `supabase.auth.signOut({ scope: 'local' })` fire-and-forget, then navigate. Never awaits network.
8. **Routing**: `/instructor-app/login` redirects to `/instructor` as soon as `status==='authed'` *and* the session RPC resolves. No reliance on `onAuthStateChange` for navigation.
9. **Health surface**: if the session RPC fails or times out (>4 s), show a real error ("Backend is unreachable — try again") instead of pretending login failed.
10. **Capacity guardrails**:
    - All Supabase reads go through React Query with `staleTime` ≥ 30 s and dedup keys, eliminating duplicate requests across portals.
    - `useRealtimeHub` (already memoised) stays the single websocket; per-screen subscribers attach to it.
    - Connection budget instrumentation (`installQueryBudget`) extended to prod-flag noisy callers.

### Why this scales to 6000

- Login becomes 1 auth call + 1 small RPC. No 70-column reads on the hot path.
- A unique index on `auth_user_id` keeps the RPC O(1) regardless of table size.
- One websocket per tab instead of one per provider.
- React Query dedup + staleTime caps DB QPS even with bursty navigation.
- No client-side retry loops that amplify load when the DB *is* slow.

## Files this will touch

- `src/context/InstructorAuthContext.tsx` — strip timeout/retry/extra query, delegate to new context, use RPC.
- New `src/context/AuthSessionContext.tsx` — single source of truth.
- New `src/hooks/useMyInstructorSession.ts` — React Query wrapper for the RPC.
- Existing 70-col profile hook split into `useInstructorBranding`, `usePaymentSettings`, `useAIFlags`, `useComplianceDates`.
- `src/pages/instructor-app/InstructorLogin.tsx` — remove "busy" reclassification; show backend's real error.
- Migration: `get_my_instructor_session()` RPC + `instructors_auth_user_id_uidx`.
- Admin / School / Pupil contexts converted to subscribers of `AuthSessionContext`.

No mobile layout changes. No payment-gateway changes. No schema-naming changes.

## Out of scope

- Rate limiting (no backend primitive yet — known gap).
- Stripe/Elavon/etc. (forbidden).
- Visual redesign of the login screen.