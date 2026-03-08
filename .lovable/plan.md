

# Redesign Plan — All 8 Feature Upgrades

## Overview
Redesign and enhance 8 existing features across the instructor and pupil apps, drawing from industry patterns (Google Calendar, Square, Airbnb, Apple, Calendly, Monzo).

---

## 1. Calendar Redesign (`InstructorCalendar.tsx` — 1038 lines)

**Current state**: Already has drag-to-reschedule, resize, color coding, mini sidebar, day/week/month views.

**Enhancements**:
- Add **drag-to-create**: click and drag on empty time slots to create a new event spanning that duration (Google Calendar style)
- Add **current time indicator**: red horizontal line showing "now" that auto-scrolls into view
- Add **multi-event overlap columns**: when events overlap, render them side-by-side instead of stacking
- Add **quick-preview popover**: hover/tap on event shows a small card with key details without opening the full sheet
- Polish: smoother drag ghost, snap-to-15min grid lines

**Files**: `InstructorCalendar.tsx` (enhance existing)

---

## 2. Earnings Analytics Upgrade (`EarningsDashboard.tsx` — 576 lines)

**Current state**: 4 summary cards, area chart, top pupils list, CSV/PDF export.

**Enhancements**:
- Add **comparison overlay toggle**: show this week vs last week as overlaid lines on the chart
- Add **animated counters**: numbers count up on load using framer-motion
- Add **expense vs income bar chart**: stacked bar chart showing earnings minus expenses per period
- Add **profit/loss summary row**: net profit card with color-coded indicator
- Add **hourly rate calculator**: auto-calculate effective hourly rate from total earnings / total lesson hours

**Files**: `EarningsDashboard.tsx` (enhance existing)

---

## 3. Pupil CRM Cards Enhancement (`PupilCardStack.tsx` — 918 lines)

**Current state**: iOS contact-style cards with tabs, full-screen sheet on mobile, action buttons.

**Enhancements**:
- Add **smart sort options**: sort by next lesson date, overdue balance, days since last lesson, test countdown
- Add **risk indicators**: colored dots/badges for at-risk pupils (no lesson booked, overdue payment, test in <7 days)
- Add **quick-filter chips**: "Overdue", "Test Soon", "No Booking", "New" filter chips above the list
- Add **bulk actions bar**: select multiple pupils for batch messaging or payment reminders

**Files**: `PupilCardStack.tsx` (enhance existing), may add `PupilSmartFilters.tsx` (new)

---

## 4. Waitlist Smart Matching (`WaitlistManager.tsx` — 484 lines)

**Current state**: Lists waitlist entries and pending offers with approve/reject actions. Uses Supabase realtime.

**Enhancements**:
- Add **match score calculation**: score each waitlist entry based on how well their preferences align with available gaps (day match, time match, duration fit) — display as percentage badge
- Add **visual gap-to-waitlist pipeline**: show open gaps on one side, matching waitlist pupils on the other, with connecting lines
- Add **auto-suggest notifications**: when a lesson is cancelled, automatically highlight best-match waitlist entries
- Add **priority ranking**: rank waitlist entries by wait time + match score

**Files**: `WaitlistManager.tsx` (enhance existing)

---

## 5. Morning Briefing Intelligence (`MorningBriefingCard.tsx` — 181 lines)

**Current state**: AI-generated text briefing with TTS and typewriter animation.

**Enhancements**:
- Add **contextual action cards**: parse briefing into actionable items (e.g., "3 payments overdue" → tap to view, "Rain expected" → tap to send weather alerts)
- Add **priority-ranked task list**: extract and display top 3 tasks from the briefing as tappable items
- Add **quick stats strip**: show today's lesson count, expected earnings, and weather icon inline above the briefing text
- Add **persistent daily tips**: rotate driving instruction tips below the briefing

**Files**: `MorningBriefingCard.tsx` (enhance existing), may create `BriefingActionCards.tsx` (new)

---

## 6. Self-Booking Calendar Redesign (`SelfBookingCalendar.tsx` — 447 lines)

**Current state**: Week-based grid with available slots, duration selector, confirm dialog.

**Enhancements**:
- Replace week grid with **horizontal scrolling day strip** (Calendly-style): dates as horizontal pills, tap to see that day's time slots below
- Add **slot popularity indicators**: show "Popular" or "Last slot" badges
- Add **smooth booking animation**: slot shrinks into a checkmark with confetti on confirmation
- Add **time-of-day sections**: group slots into Morning / Afternoon / Evening headers
- Add **booking summary card**: show selected date + time + duration in a sticky bottom bar before confirming

**Files**: `SelfBookingCalendar.tsx` (rewrite UI, keep data logic)

---

## 7. Dynamic Pupil Bottom Nav (`PupilBottomNav.tsx` — 73 lines)

**Current state**: 5 static tabs (Home, Lessons, Payments, Theory, More) with sliding indicator.

**Enhancements**:
- Add **contextual badges**: show upcoming lesson countdown on Lessons tab, unread count on Theory, balance on Payments
- Add **course progress ring**: replace the Home icon with a tiny circular progress indicator showing overall course completion %
- Add **long-press menu**: long-press on More to show a quick-access sheet with all secondary sections
- Add **animated tab transitions**: scale-up micro-animation on active icon

**Files**: `PupilBottomNav.tsx` (enhance existing)

---

## 8. Apple Health-Style Pupil Dashboard (`BrandedPupilPortal.tsx` — 689 lines)

**Current state**: Section-based portal with various components rendered based on activeSection.

**Enhancements to home section**:
- Redesign home as **widget card grid**: each feature (next lesson, balance, theory progress, achievements) as a distinct rounded card with its own gradient/icon
- Add **journey timeline**: vertical timeline showing key milestones (first lesson, theory passed, mock test, test date) with completed/upcoming states
- Add **daily goal ring**: Apple Watch-style activity ring showing lessons this week vs target
- Add **personalized greeting**: time-based greeting with next lesson countdown and weather

**Files**: `BrandedPupilPortal.tsx` (enhance home section), create `PupilWidgetGrid.tsx` and `PupilJourneyTimeline.tsx` (new)

---

## Summary of Files

| File | Action |
|------|--------|
| `src/components/instructor/InstructorCalendar.tsx` | Enhance with drag-to-create, now-line, overlap columns, preview popover |
| `src/components/instructor/EarningsDashboard.tsx` | Add comparison overlay, animated counters, profit/loss, hourly rate |
| `src/components/instructor/PupilCardStack.tsx` | Add smart sort, risk indicators, filter chips, bulk actions |
| `src/components/instructor/PupilSmartFilters.tsx` | **New** — filter chip bar component |
| `src/components/instructor/WaitlistManager.tsx` | Add match scoring, visual pipeline, auto-suggest |
| `src/components/instructor/MorningBriefingCard.tsx` | Add action cards, stats strip, priority tasks |
| `src/components/instructor/BriefingActionCards.tsx` | **New** — tappable action items from briefing |
| `src/components/pupil-portal/SelfBookingCalendar.tsx` | Redesign with horizontal day strip, slot sections, animations |
| `src/components/pupil-portal/PupilBottomNav.tsx` | Add badges, progress ring, long-press, animations |
| `src/pages/BrandedPupilPortal.tsx` | Redesign home section with widget grid |
| `src/components/pupil-portal/PupilWidgetGrid.tsx` | **New** — widget card layout for home |
| `src/components/pupil-portal/PupilJourneyTimeline.tsx` | **New** — milestone timeline |

No database migrations required. All enhancements use existing data sources.

