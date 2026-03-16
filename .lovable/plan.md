

## Plan: 4 Feature Improvements

### Feature 2: Real-time Slot Availability on Booking Page

**Problem:** When two pupils browse booking slots simultaneously, one may book a slot the other is viewing, leading to a failed booking attempt.

**Solution:** Add a Supabase realtime subscription in `LessonScheduler.tsx` that listens for `INSERT` events on `scheduled_lessons` for the current instructor. When a new lesson is detected, refetch availability data so booked slots disappear instantly.

**Changes:**
- `src/components/booking/LessonScheduler.tsx` — Add a `useEffect` that subscribes to `postgres_changes` on `scheduled_lessons` filtered by `instructor_id`. On any `INSERT` or `UPDATE`, re-run the availability fetch logic. Clean up subscription on unmount.
- Database migration — `ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_lessons;`

---

### Feature 3: End-of-Day Summary Push Notifications

**Problem:** The EOD summary exists but requires manual generation. Instructors may miss it.

**Solution:** Create a cron-triggered edge function that runs at 8 PM daily, generates summaries for all active instructors, and sends push notifications via the existing web push infrastructure.

**Changes:**
- `supabase/functions/eod-notification/index.ts` — New edge function that:
  1. Queries all instructors with `push_subscription` data
  2. For each, calls the existing `generate-eod-summary` logic inline (reuse the same DB queries)
  3. Sends a web push notification with the summary text using VAPID keys (already configured)
- Database — Schedule a pg_cron job: `cron.schedule('eod-notification', '0 20 * * *', ...)` to invoke the function nightly at 8 PM
- `src/components/instructor/EndOfDaySummary.tsx` — No changes needed, it already works for manual viewing

---

### Feature 4: Enhanced Pupil Progress Dashboard

**Problem:** The current pupil progress page shows a basic percentage and skill count. It lacks visual depth — no timeline, no hours tracking, no test readiness indicator.

**Solution:** Enhance `PupilPortalProgress.tsx` with three new sections below the existing progress card.

**Changes:**
- `src/components/pupil-portal/PupilProgressTimeline.tsx` — New component showing a vertical timeline of recent lessons with skills covered, fetched from `lesson_history`. Shows date, duration, and skills practiced as tags.
- `src/components/pupil-portal/TestReadinessCard.tsx` — New component calculating a "test readiness score" based on: % syllabus mastered (weight 40%), lessons completed vs average needed ~40hrs (weight 30%), number of level-5 skills (weight 30%). Displays as a circular gauge with colour coding (red/amber/green).
- `src/components/pupil-portal/HoursTracker.tsx` — New component showing hours completed vs estimated total (from `pupils.total_hours` or default 40), rendered as a visual progress bar with milestone markers at 10h, 20h, 30h, 40h.
- `src/components/pupil-portal/PupilPortalProgress.tsx` — Import and render the three new components below the existing content, passing `pupilId` and `brandColour`.

---

### Feature 5: Smart Scheduling Suggestions

**Problem:** The gap-filling system finds open slots, but doesn't proactively suggest optimal times for new lesson bookings based on patterns.

**Solution:** Add an AI-powered suggestion card to the instructor home view that analyzes availability patterns and pupil preferences to recommend optimal slots.

**Changes:**
- `supabase/functions/smart-schedule-suggestions/index.ts` — New edge function that:
  1. Fetches the instructor's upcoming 2 weeks of availability (working hours, overrides, existing lessons)
  2. Fetches pupils who haven't booked their next lesson yet
  3. Calls Gemini 2.5 Flash Lite with context to generate 3-5 scheduling suggestions (e.g., "Sarah hasn't booked next week — she usually prefers Tue 2pm", "Wednesday afternoon has 3 empty hours — consider offering a short-notice discount")
  4. Returns structured suggestions
- `src/components/instructor/SmartScheduleCard.tsx` — New card component displayed on the instructor home view showing AI suggestions with action buttons (e.g., "Send SMS", "Book Slot")
- `src/components/instructor/CompactHomeView.tsx` — Import and render `SmartScheduleCard` in the home view, positioned after the "Next Up" section

---

### Summary of all files

| File | Action |
|------|--------|
| `src/components/booking/LessonScheduler.tsx` | Add realtime subscription |
| `supabase/functions/eod-notification/index.ts` | New edge function |
| `src/components/pupil-portal/PupilProgressTimeline.tsx` | New component |
| `src/components/pupil-portal/TestReadinessCard.tsx` | New component |
| `src/components/pupil-portal/HoursTracker.tsx` | New component |
| `src/components/pupil-portal/PupilPortalProgress.tsx` | Add new sections |
| `supabase/functions/smart-schedule-suggestions/index.ts` | New edge function |
| `src/components/instructor/SmartScheduleCard.tsx` | New component |
| `src/components/instructor/CompactHomeView.tsx` | Add SmartScheduleCard |
| Database migration | Enable realtime on `scheduled_lessons` |
| Cron job | Schedule EOD notification at 8 PM daily |

