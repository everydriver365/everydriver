**Do I know what the issue is?** Yes.

**What is actually happening**
- The auth request succeeds: the backend returns `200` and a valid session token.
- The instructor account is linked correctly and has an active subscription.
- The app then hangs after auth because `onAuthStateChange` starts backend/RPC profile loading inside the auth callback.
- Supabase auth has a known deadlock pattern here: backend calls made from `onAuthStateChange` can cause later auth/backend calls to never return.
- The live browser confirms this: `SIGNED_IN` fires, then initial session check and instructor profile fetch time out, and no session bundle completion appears.

**Files isolated**
- `src/context/InstructorAuthContext.tsx` — root cause.
- `src/pages/instructor-app/InstructorLogin.tsx` — mostly OK; it is waiting for `signIn()` to resolve.
- `src/pages/InstructorPortal.tsx` — guard is OK once auth state is reliable.

**Implementation plan**
1. **Make `onAuthStateChange` auth-only**
   - Only update `session`, `user`, and basic loading state inside the callback.
   - Do not call `loadInstructorProfile`, `loadInstructorSessionBundle`, RPCs, table reads, or sign-out from inside the callback.

2. **Defer all post-auth backend loading outside the callback**
   - Use a single scheduled hydration function, triggered with `window.setTimeout(..., 0)` after auth callback returns.
   - Hydration will then call `get_my_instructor_session` and background profile fetch safely.

3. **Deduplicate profile/session hydration**
   - Add an in-flight/session-key guard so `getSession()`, `SIGNED_IN`, refresh recovery, and manual `signIn()` cannot start overlapping profile loads.
   - Newer auth state wins; stale scheduled work exits without changing state.

4. **Keep password sign-in thin and deterministic**
   - `signInWithPassword` remains the only blocking auth call.
   - After it succeeds, run the same safe hydration path outside the auth callback.
   - Preserve real backend errors; no fake “login service busy” mapping.

5. **Keep logout local and reliable**
   - Clear local app/auth state immediately.
   - Avoid backend profile calls during logout/auth callback.
   - Navigate to `/instructor-app/login` only after local state is cleared.

6. **Validate end-to-end**
   - Test login from a clean browser session.
   - Refresh `/instructor` and confirm it stays logged in.
   - Logout and confirm it returns to login without hanging.
   - Login again after logout.
   - Confirm console no longer shows repeated initial-session checks, profile timeouts, or auth loops.

**Scalability note for 6,000 users**
- This fix removes the auth deadlock first.
- Separate from login, the backend is showing heavy non-auth query pressure (`tile_health_checks`, public instructor searches, and broad instructor scans). After login is stable, those should be handled as a separate scaling pass so auth isn’t competing with noisy dashboard/health queries.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>