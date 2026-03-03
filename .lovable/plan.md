

## GoRoadie Feature Gap Analysis

After reviewing GoRoadie Pro's full feature set against your codebase, here's what you already have and what's missing:

### Already Implemented
- Pupil management and overview
- Enquiry manager
- Lesson reminders (via notify-pupil edge function)
- External calendar sync
- Fill Nearby Open Slots (gap filling with SMS offers)
- One-touch sat nav (directions in schedule)
- Reflective logs
- Expenses tracking and recurring expenses
- Financial export
- Digital payments
- Theory test tracking (dates, pass status)
- Companion learner app (pupil portal)

### Missing from GoRoadie -- Worth Building

| # | Feature | What GoRoadie Does | Gap in Your App |
|---|---------|-------------------|-----------------|
| 1 | **Live Waiting List** | Pupils auto-check-in every 2 weeks to confirm they're still waiting; stale entries drop off | You have a `WaitlistManager` but no automated pupil re-confirmation or auto-expiry |
| 2 | **Lesson Check-In** | Day before a lesson, pupil is prompted to confirm attendance; instructor gets notified | No pre-lesson confirmation flow exists |
| 3 | **Photo-Scan Receipts** | Instructor photographs a receipt, it's auto-categorised and stored for tax | Expenses exist but no camera/photo capture for receipts |
| 4 | **Digital Terms Agreement** | Paperless terms & conditions sent to pupils to sign before first lesson | No terms agreement feature exists |
| 5 | **GDPR Auto-Cleanup** | Auto-flags or removes pupil records past a retention threshold | No data retention management |
| 6 | **Theory Test Progress Sync** | Shows Theory Test 4-in-1 / Theory Test Pro app progress alongside practical | You track dates/pass status but don't show mock test scores or progress metrics |

### Implementation Plan

**1. Lesson Check-In (highest impact -- reduces no-shows by 80% per GoRoadie)**
- Add `check_in_status` column to `scheduled_lessons` (null / confirmed / declined)
- Create edge function `send-lesson-checkin` triggered day-before via cron or on lesson creation
- Sends push notification + in-app prompt to pupil
- Pupil portal gets a check-in card; tapping "I'll be there" updates status
- Instructor sees check-in status on their schedule cards (green tick / amber warning)

**2. Photo-Scan Receipts**
- New `expense_receipts` table (id, instructor_id, image_url, amount, category, date, notes)
- Use Supabase Storage bucket for receipt images
- Camera capture component on the Expenses page -- take photo or upload
- AI-powered auto-extract of amount/date/category from receipt image using Lovable AI (Gemini Flash)
- Receipts visible in expense history and included in financial export

**3. Live Waiting List Auto-Confirmation**
- Add `last_confirmed_at` column to existing waitlist data
- Every 2 weeks, send pupil a "Still interested?" notification
- If no response within 7 days, auto-mark as inactive and notify instructor
- Waiting list UI shows freshness indicator (green = recently confirmed, amber = awaiting confirmation, red = stale)

**4. Digital Terms Agreement**
- New `instructor_terms_templates` table (instructor_id, content, version)
- New `pupil_terms_agreements` table (pupil_id, instructor_id, template_version, signed_at, ip_address)
- Instructor can customise terms text in Settings
- When a new pupil is added, they receive a link to review and digitally accept terms
- Agreement status shown on pupil profile (signed / pending / not sent)

**5. GDPR Auto-Cleanup**
- Add `data_retention_months` setting to instructor profile (default 36 months)
- Dashboard widget showing pupils past retention threshold
- One-click anonymise or delete with confirmation
- Auto-notification to instructor when pupils approach threshold

**6. Theory Test Progress Tracker**
- Expand `theory_test_attempts` table usage to show mock test scores over time
- Pupil portal gets a theory progress card with score trend chart
- Instructor pupil overview shows theory readiness percentage
- Optional: pupil can manually log mock test scores from external apps

### Priority Order
1. **Lesson Check-In** -- biggest impact on reducing cancellations
2. **Photo-Scan Receipts** -- daily time-saver for instructors
3. **Digital Terms Agreement** -- professional and paperless onboarding
4. **Waiting List Auto-Confirmation** -- keeps the pipeline clean
5. **Theory Progress Tracker** -- better pupil overview
6. **GDPR Auto-Cleanup** -- compliance feature

