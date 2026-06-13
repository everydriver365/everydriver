## Pupil Portal Dashboard — Data Audit (Part 1)

Scope: logged-in pupil portal dashboard only — `src/pages/BrandedPupilPortal.tsx` (home section) which renders `src/components/pupil-portal/Drive365PupilHome.tsx`, wrapped in `PupilMobileHeader` + `PupilBottomNav`. Public marketing pages and DSM are not touched.

### Section-by-section: what's available vs missing

**1. Header (message icon + unread dot)** — ✅ Available
- Unread count already wired via `usePupilInboundUnreadCount(instructor.id, pupil.id)` (counts `messages` where `sender_type='instructor'` and `read_at` is null on the pupil's `conversations` row).
- In-app chat exists: `PupilChat` component → in-app `messages` / `conversations` tables. Icon should set `activeSection='messages'`, no need to fall back to phone/SMS.
- Current `PupilMobileHeader` is navy with a hamburger only — needs the new white treatment + dedicated message button with a coral/red dot when `unreadMessages > 0`.

**2. Balance banner (conditional)** — ✅ Available
- Source: `pupils.account_balance` (already fetched into `pupil.account_balance`). Project convention: `< 0` means "owed" (debt), `> 0` means credit, `0` balanced. Banner condition should be `account_balance < 0`, displaying `£${Math.abs(balance).toFixed(2)}`.
- "Pay now" links to existing payment flow: `setActiveSection('payments')` → `PupilPortalPayments` (already wired with Ryft + GoCardless + Klarna/Clearpay, balance hero, PayNowCard).

**3. Greeting** — ✅ Available
- Time-based greeting helper already in `Drive365PupilHome.tsx` (`greeting()`); pupil first name from `pupil.name.split(' ')[0]`. Just needs new typography (serif 26px navy).

**4. Next lesson hero** — ✅ Available, mostly
- Source: `scheduled_lessons` filtered by `pupil_id`, `lesson_date >= today`, `status != 'cancelled'`, ordered ascending. Already a `useQuery` in `Drive365PupilHome` fetching `id, lesson_date, start_time, duration_minutes`.
- Pickup location: `scheduled_lessons.pickup_location` (text) exists — needs to be added to the SELECT.
- Instructor name: from `instructor.name` already loaded in parent.
- Empty state link: should set `activeSection='book'` (booking flow exists if `pupil_self_booking_enabled` on the instructor — otherwise we'll fall back to a "request" CTA).
- "View details" link: set `activeSection='schedule'` (existing `PupilPortalSchedule`).

**5. Theory test / driving test tiles** — ✅ Available
- Source: `pupils.theory_test_date`, `pupils.theory_test_passed`, `pupils.test_date`, `pupils.test_time`, `pupils.test_passed`, `pupils.test_centre_id → test_centres.name`. All already fetched in `pupilExtras` useQuery.
- "Take a mock test" link → `setActiveSection('theory')` (existing `PupilPortalTheory` with `TheoryMockTest`).
- "Book a date" link → driving test booking lives at gov.uk in real life; in-app we have `setActiveSection('test-requests')` for the test-swap path, and `onEditProfile` (current behaviour) for entering a test date the pupil booked themselves. Will use "Edit profile" pattern for entering a booked date, since we don't broker DVSA bookings.

**6. Quick links 2×2** — ✅ Available, all four exist
- My lessons → `activeSection='schedule'` (PupilPortalSchedule).
- My progress → `activeSection='progress'` (PupilPortalProgress — DVSA syllabus + skills).
- Theory → `activeSection='theory'`.
- Show me/tell me → `activeSection='show-tell'` (existing `ShowMeTellMeSection`).
- Image placeholders: no per-tile images yet; will use neutral `#F1EFE8` tile with 28px `#B4B2A9` icon as the placeholder per spec — flagged for you to upload imagery later.

**7. Test swap tile** — ✅ Available
- Existing feature: `PupilTestRequests` (`activeSection='test-requests'`), with full `test_requests` / `test_swap_offers` / `public_test_swap_signups` tables and a swap-checklist/profile panel already wired into the portal.
- Tile links to `activeSection='test-requests'`. Image placeholder as above.

**8. Test readiness card** — ✅ Available
- Two existing implementations to consolidate:
  - `TestReadinessCard.tsx` uses DVSA syllabus mastery + hours + average level (needs `progress` array + `totalHoursCompleted`).
  - `Drive365PupilHome` inline calc: `lessonsFactor * 0.6 + mockFactor * 0.4` (uses `lessons_completed`, `prepaid_hours`, latest `theory_mock_scores`).
- Per project rule (no hardcoded fallbacks), readiness must be `null` until at least one signal exists — current behaviour. Subtext "X lessons taken, mock score Y/50 or no mock score yet" maps directly to `lessons_completed` + `mockScoreData` (already fetched).

**9. Last lesson** — ✅ Available
- Source: `lesson_history` table — has `lesson_date`, `start_time`, `duration_minutes`, `skills_practiced text[]`, `notes`, `rating`. RLS policy `Pupils view own lesson history` was added in the prior migration so this is readable.
- Existing `LessonSummaryCard` already fetches the most recent row. Will reuse the query, restyle to the editorial layout (image tile placeholder, outlined skill tags, italic note).
- Empty state: `lesson_history` rows are written by the instructor after a lesson — first-time pupils have zero rows. Will render "No lessons yet — your first lesson summary will appear here."
- Image tile: placeholder until imagery uploaded (flagged).

**10. Bottom list (01–03)** — ✅ Available
- 01 Payment history → `activeSection='payments'`. Always show `£{Math.abs(account_balance).toFixed(2)}` with sign-aware label.
- 02 Refer a friend → existing `ReferralCard` / `pupil_referrals` table (`referral_code`, `completed_count`, `pending_count`, `points`). No dedicated full-page route today — will route to a section that surfaces ReferralCard (currently lives inside the home stack). **Minor gap**: no standalone "Refer a friend" section; suggested fix: add a thin `activeSection='referrals'` wrapper around `ReferralCard` (presentation-only, no schema work).
- 03 Account and settings → `activeSection='profile'` (`PupilPortalProfileEdit`).

**11. Bottom nav** — ✅ Available, but mismatch with spec
- Actual `PupilBottomNav` items: **Home, Lessons, Payments, Theory, Messages** (5 items, not 4). Spec assumed Home/Lessons/Theory/Account.
- Will restyle (white bg, 0.5px top border `#E5E7EB`, active `#0F2044`, inactive `#888780`) keeping the existing 5-item set unless you want me to change the items themselves.

### Items flagged (decisions needed before build)

1. **Per-tile images** for Quick Links (4) + Test Swap (1) + Last Lesson (1) — no source today. Will ship with the `#F1EFE8` icon placeholders per spec; upload images later and we'll swap them in.
2. **Driving test "Book a date" CTA** — we don't broker DVSA bookings. Plan is to open profile edit so pupil records their booked date. OK?
3. **Refer a friend** has no standalone section/route today — proposed thin wrapper around the existing `ReferralCard`. OK?
4. **Bottom nav items** — keep the current 5 (Home/Lessons/Payments/Theory/Messages) and only restyle? Or swap to spec's 4 (Home/Lessons/Theory/Account)?
5. **PupilMobileHeader** is shared with sub-pages (it shows the back button + sub-page title). Restyle applies across all sub-pages too — confirm that's fine (it is the same logged-in shell, no other portals use it).

### Build plan (Part 2 — pending your confirmation on the flagged items)

Frontend / presentation only. No schema changes. No backend logic changes.

- Rewrite `PupilMobileHeader.tsx` to the white editorial header with logo left, message icon (with red unread dot from `usePupilInboundUnreadCount`) + menu icon right. Keep existing back/title behaviour for sub-pages.
- Rewrite `Drive365PupilHome.tsx` to the editorial layout: balance banner, greeting, navy next-lesson hero, theory/driving tiles, 2×2 quick links, test-swap wide tile, test readiness ring, last lesson card, numbered 01–03 list. Wire each to the live queries already identified above; reuse `usePupilInboundUnreadCount`, `TestReadinessCard` math, existing `lesson_history` query, etc.
- Add `Georgia` serif via inline `fontFamily` on the headings (no global font change needed; matches existing inline-style pattern).
- Add a thin `referrals` ActiveSection wrapper in `BrandedPupilPortal.tsx` (if approved).
- Restyle `PupilBottomNav.tsx` only (no item changes unless approved).

### Out of scope
- Public marketing pages / DSM / instructor portal.
- Schema, RLS, edge functions, payment flows.
- New imagery (placeholders only until you supply images).
