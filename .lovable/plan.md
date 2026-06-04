# Wire up every Actions panel item on Admin Instructor Detail

## Status today
| Action | Wired? | Issue |
|---|---|---|
| ✏ Edit profile | ✅ | opens modal, persists |
| 📅 View diary | ❌ | navigates to `/admin/instructors/:id/diary` — **route does not exist (404)** |
| 📋 View bookings | ❌ | `/…/bookings` — **404** |
| ⭐ View reviews | ❌ | `/…/reviews` — **404** |
| 💳 Payments | ❌ | `/…/payments` — **404** |
| 📄 Documents | ❌ | `/…/documents` — **404** |
| 📨 Message | ❌ | `/admin/messages?instructor=…` — **404** |
| ⚠ Suspend | ✅ | toggles `is_active` |
| ✕ Remove from platform | ⚠ | just shows a toast, no DB change |
| ← All instructors | ✅ | navigates correctly |

## Approach
Rather than create 6 brand-new pages, wire each action to an **in-page right-side drawer** that fetches live data on open. Keeps everything on the existing admin screen, matches the dense single-screen layout, and is fully wired today. Add a real soft-delete for Remove.

## Drawers (live data, read-only unless stated)

1. **Diary drawer** — next 14 days of `scheduled_lessons` (start_time, pupil name, status) for this instructor, ordered by start_time. Plus `instructor_calendar_events` busy blocks in the same window.
2. **Bookings drawer** — last 50 `scheduled_lessons` (any time), join pupils for name, show status + start_time. Filter chips: Upcoming / Past / Cancelled.
3. **Reviews drawer** — `course_reviews` where `instructor_id = id`, newest first, average rating header. Show rating + created_at.
4. **Payments drawer** — `payment_history` where `instructor_id = id`, newest first, totals header (sum amount, count). Show amount + created_at.
5. **Documents drawer** — list of certificate URLs already on the `instructors` row: `dbs_certificate_url`, `mot_certificate_url`, `insurance_certificate_url`, `driving_licence_front_url`, `driving_licence_back_url`, `adi_certificate_url`, `payment_qr_url`, `welcome_video_url`, `hero_image_url`, `logo_url`, `car_image_url`, `profile_image_url`. Each row: label + "Open ↗" link. Empty rows render "Not uploaded".
6. **Message action** — open a small composer popover with two real shortcuts:
   - **Email** → `mailto:{instructor.email}` (uses native client; works immediately)
   - **WhatsApp** → `https://wa.me/{e164 phone}` when `phone` is set
   Both buttons are disabled with a "Not set" hint when the underlying field is empty. This requires no new tables and works today.

## Remove from platform
Replace the toast with a real soft-delete: set `deleted_at = now()` and `scheduled_purge_at = now() + interval '30 days'` (both columns already exist on `instructors`). After confirm, navigate back to `/admin/network-instructors`. No hard delete — the existing 30-day purge job handles that.

## Files to touch
- `src/components/admin/instructor-detail/ActionsStack.tsx` — accept new handler props instead of in-component `nav()` calls for the 5 broken items + Message.
- `src/pages/admin/AdminInstructorDetail.tsx` — open-drawer state, pass handlers, render the drawer; replace `handleRemove` with the real soft-delete.
- `src/components/admin/instructor-detail/ActionDrawer.tsx` *(new)* — generic right-side drawer shell.
- `src/components/admin/instructor-detail/drawers/` *(new)* — `DiaryDrawer.tsx`, `BookingsDrawer.tsx`, `ReviewsDrawer.tsx`, `PaymentsDrawer.tsx`, `DocumentsDrawer.tsx`, `MessageDrawer.tsx`.

## Non-goals
- No new admin routes / pages.
- No edits to mobile layout (per the project mobile-update rule).
- No new tables — every drawer reads existing live data.
- Documents drawer is read-only (upload UI is out of scope for this turn).
