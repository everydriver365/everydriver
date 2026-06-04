# Admin Instructor Detail Page

A new read/edit summary page at `/admin/instructors/:id` showing one instructor across a hero card + dynamic section cards. No existing pages, components, or routes are modified.

## Files to add

1. `src/pages/admin/AdminInstructorDetail.tsx` — page shell (top bar, 5‑col grid, data fetch, mutations).
2. `src/components/admin/instructor-detail/InstructorHeroCard.tsx` — avatar, name, stats strip, status/tier/email/phone/ADI/DBS/Insurance rows.
3. `src/components/admin/instructor-detail/ActionsStack.tsx` — three stacked cards (Actions, Admin, Navigate). Admin card hidden unless `useAdminAuth().isAdmin`.
4. `src/components/admin/instructor-detail/SectionCard.tsx` — generic white card with `#0A2B6B` header, field rows with hover edit/✕, "+ Row" footer.
5. `src/components/admin/instructor-detail/SectionColumn.tsx` — vertical stack of SectionCards + dashed "+ Add section" button.
6. `src/components/admin/instructor-detail/Badge.tsx` — 6 colour variants (green/red/blue/amber/purple/grey) per spec.
7. `src/components/admin/instructor-detail/modals/` — `EditProfileModal.tsx`, `AddSectionModal.tsx`, `AddRowModal.tsx`, `EditRowModal.tsx` (shared overlay shell).
8. `src/components/admin/instructor-detail/defaultSections.ts` — builds the 9 default section configs from the instructor record + related counts.

## File to edit

- `src/routes/adminRoutes.tsx` — add one lazy import + one `<Route path="/admin/instructors/:id" …>` wrapped in `ProtectedAdminRoute`. No other edits.

## Data

Single page fetch by `:id`:
- `instructors` row (all fields used by the spec already exist: `adi_badge_number`, `adi_badge_expiry`, `dbs_certificate_expiry`, `car_insurance_expiry`, `car_make/model/...`, `personal_website_url`, `facebook_url`, `instagram_url`, `hourly_rate`, `radius_miles`, `cancellation_policy_*`, `booking_mode`, `booking_advance_days`, `instructor_grade`, `special_skills`, `bonus_earned`, etc.).
- Counts via parallel queries: active pupils (`pupils` where `instructor_id=… AND deleted_at IS NULL`), total pupils all‑time, complaints (if `complaints` table present — otherwise empty‑state), loyalty points (sum from `pupils.reward_points` or fallback empty), passes this year (`test_results` where `result='pass'`).
- Compliance badges computed client‑side: `green` if expiry > 90 days, `amber` if ≤ 90 days, `red` if past.
- Reviews/rating: reuse existing `useInstructorRating` hook if available, else show empty stars.
- Live data only — no hardcoded fallbacks; if a count returns null, show "—".

Mutations:
- Edit Profile modal → `supabase.from('instructors').update({...}).eq('id', id)` then refetch.
- Add/Edit/Remove section + row → local React state only (spec says no persistence yet).

## Layout / styling

- Hard‑coded inline styles per spec (colours, paddings, font‑sizes). No theme token changes.
- Desktop only — page wrapped in `<div className="hidden md:block">` with a small "Open on desktop" notice on mobile so we never affect the mobile portal.
- Top bar `#0A2B6B` with Drive 365 logo block + breadcrumb + Edit/Suspend buttons (Suspend hidden for non‑admins, though the route is already admin‑gated).
- 5‑col grid `220px 1fr 1fr 1fr` (spec says five, lists four; will use the four columns described: hero + 3 section columns. Gap 14px, bg `#F3F4F6`, padding `16px 24px`).
- Default sections distributed per spec:
  - Col 2: Booking flow, Websites & social, Payments
  - Col 3: Pupils allocated, Loyalty points, Complaints & flags
  - Col 4: Instructor skills, Teaching vehicle, Course settings

## Out of scope (explicit)

- No changes to existing `AdminInstructorProfile.tsx` or `/admin/network-instructors`.
- No mobile layout, no dark mode.
- Custom sections/rows are session‑local; persistence deferred to a follow‑up.

## Open question

- Spec mentions "DSM Tier (Platinum/Gold/Silver/Bronze)" but no tier column exists on `instructors`. Plan: show badge from `instructor_grade` if set (e.g. "Grade A/B") and otherwise render "—". Confirm if you'd like a new `dsm_tier` column added instead (would require a migration).
