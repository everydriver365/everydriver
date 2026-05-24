# Unified Login — Investigation Report

No code changes. Findings only, followed by architecture options.

## 1. Current auth flows

### Instructor (`src/pages/Drive365Login.tsx`)
- `supabase.auth.signInWithPassword({ email, password })` (line 64).
- Also supports Google OAuth via `GoogleSignInButton` and biometric replay (`src/lib/biometricAuth.ts`) which re-runs `signInWithPassword`.
- Session managed by `InstructorAuthContext` + Supabase session in `localStorage`.
- MFA enforced globally by `src/components/auth/MFAGate.tsx` (TOTP via `supabase.auth.mfa`).

### Pupil (`src/pages/PupilLogin.tsx`)
- Same path: `supabase.auth.signInWithPassword` (line 177). Real Supabase user.
- Pupils are linked via `pupils.auth_user_id` (column exists in `types.ts`) and matched on `email`.
- After login, `RoleRedirect.resolvePupilPath()` looks up `pupils` by email and routes to `/p/:slug` or `/pupil`.

### Parent (`src/pages/ParentPortal.tsx`)
- **No Supabase auth session.** Confirmed.
- Flow: `send-parent-otp` edge function → SMS code stored in `parent_otp_codes` table → `verify-parent-otp` → on success, `localStorage.setItem('parent_phone_verified', phone)`.
- Identity = phone number matched against `pupils.parent_phone` (substring match, last 9 digits).
- There is no `parents` table and no `auth.users` row for a parent.

### Admin / School
- Same `signInWithPassword` flow, gated by `user_roles` row (`AdminAuthContext`, `SchoolAuthContext`).
- Admin additionally forced into TOTP enrolment by `MFAGate`.

## 2. Role detection

- Canonical store: `public.user_roles` table with `app_role` enum (`admin`, `school_manager`, `instructor`, `pupil`, `moderator`, `user`) — checked via `has_role()` security-definer fn.
- Identity links on domain tables: `instructors.auth_user_id`, `pupils.auth_user_id`, and one more table (3 `auth_user_id` columns in generated types — likely `schools`/`school_managers`).
- `RoleRedirect` (`/auth/redirect`) already implements: read `user_roles` → if 1 role auto-route, if multiple show picker, if none fall back to email→pupils lookup.
- Priority: admin > school_manager > instructor > pupil > moderator > user.
- **Parents are not in `user_roles`** and not in any `auth_user_id` table.

## 3. Existing unified-login work

- `RoleRedirect.tsx` is the only piece — a post-login router, mounted at `/auth/redirect` in both `publicRoutes` and `everydriverRoutes`.
- No `UnifiedLogin` / `LoginRouter` component exists.
- Login screens are still per-portal: `Drive365Login`, `InstructorPortalLogin`, `PupilLogin`, `SchoolLogin`, `AdminLogin`, `RemoteSigning`.

## 4. Routing entry point (`src/App.tsx`)

- `BrowserRouter` mounts portal route bundles. `/` → `ConditionalHome`. Host-conditional swap between `publicRoutes` and `everydriverRoutes` via `isEveryDriverHost()`.
- No central role-aware gate at `/`; each portal owns its own login URL.

## 5. Despia wrapper

- `useIsNativeWrapper.ts` only detects `window.Despia` / Capacitor / RN UA. No Despia-specific auth or routing hooks anywhere in `src/`.
- Native session persistence is handled by `sessionPersistence.ts` + biometric replay — same Supabase session model.

## 6. Session persistence — the core asymmetry

| User | Session storage | Identity primitive |
|---|---|---|
| Instructor / Pupil / Admin / School | Supabase JWT in `localStorage` (auto-refresh), MFA via Supabase | `auth.users.id` |
| Parent | `localStorage.parent_phone_verified` + DB row in `parent_otp_codes` | phone number on `pupils.parent_phone` |

These are fundamentally different session models. RLS for instructors/pupils relies on `auth.uid()`; parent flows currently call edge functions that resolve by phone (no `auth.uid()`).

## 7. Options for parents in a unified login

**Option A — Promote parents to real Supabase users**
- Create `parents` table with `auth_user_id`, `phone`, link `pupils.parent_user_id` (in addition to / instead of `parent_phone`).
- Auth via Supabase phone OTP (`supabase.auth.signInWithOtp({ phone })`) — native Supabase, no custom edge functions.
- Add `parent` to `app_role` enum and `user_roles`.
- Pro: one session model, RLS by `auth.uid()`, MFA-compatible, no `localStorage` identity.
- Con: requires SMS provider on Supabase Auth (Twilio/Messagebird), data migration (link existing `parent_phone` rows to new `auth.users` rows on first login), rewrite of `send-parent-otp`/`verify-parent-otp` and `parent-get-syllabus` to use `auth.uid()` instead of phone.

**Option B — Keep phone OTP, unify the UI only**
- Single login screen with three tabs / a method picker (Email+password, Phone OTP, Google).
- Phone OTP path keeps the existing `send-parent-otp`/`verify-parent-otp` + `localStorage` flag.
- Router treats `parent_phone_verified` as a pseudo-session and routes to `/parent` when present, else falls through to `RoleRedirect`.
- Pro: zero schema change, fast to ship.
- Con: two session models persist forever; harder RLS story; parent flows stay edge-function-mediated; biometric/MFA never apply to parents.

**Recommendation:** Option A is the right long-term answer (it removes the asymmetry that's already a tripwire — see `mem://constraints/no-hardcoded-fallbacks-live-data-only` and the RLS gaps doc). Option B is acceptable only as an interim if SMS provider config is blocked.

## 8. Architecture for the unified screen (regardless of A or B)

```text
/login (new)
  ├─ Method picker: [Email + password] [Phone (parents)] [Google]
  ├─ On success → navigate("/auth/redirect")
  └─ /auth/redirect (existing RoleRedirect, extended)
        ├─ if parent session detected → /parent
        ├─ else read user_roles → priority routing
        └─ multi-role → picker
```

Changes needed in `RoleRedirect` for parents:
- **Option A:** add `parent` to ROLE_MAP/PRIORITY, route to `/parent`.
- **Option B:** before `getUser()`, check `localStorage.parent_phone_verified` → if set, route to `/parent`.

Per-portal login URLs can stay as deep-links (instructor app, admin) but `/login` becomes the canonical public entry.

## 9. Open questions before building

1. Option **A or B** for parents? (drives schema + SMS provider work)
2. Should `/login` **replace** the per-portal login pages (Drive365Login, PupilLogin, InstructorPortalLogin), or live alongside them as the unified public entry while portal-specific URLs continue to deep-link? Recommend: keep portal URLs as aliases that redirect to `/login?portal=…` so existing bookmarks/marketing keep working.
3. Should admin/school logins remain isolated (security posture: hide they exist) or also be reachable from `/login`? Current code hides admin behind `/admin/login`.
4. For Option A, do we need a one-time migration UX: "We've upgraded parent accounts — verify your phone to claim your login"?

Awaiting answers to 1–4 before producing an implementation plan.
