

## Plan: Transform the App into a True Instructor Assistant

After reviewing the full codebase, the app already has strong tooling (schedule, payments, tracking, voice commands, weather, vehicle health). What's missing are the **proactive, anticipatory features** that make an assistant feel like it's working *for* you — not just waiting for you to tap something.

Here are the features grouped by theme:

---

### 1. Morning Briefing Card (Daily Digest)
A single card on the homepage that appears each morning with a spoken + visual summary:
- How many lessons today, first pickup time, total hours
- Weather forecast + driving conditions warning (rain/ice/fog)
- Pupils with overdue payments
- Any tests this week
- Estimated earnings for today

**Changes**: New `MorningBriefingCard.tsx` component on the home view. New `generate-morning-briefing` edge function using Lovable AI (Gemini Flash) to compose a natural-language summary from existing data. Add a "Read aloud" button that pipes through the existing `voice-tts` edge function.

---

### 2. Smart Nudges / Proactive Alerts
Push contextual nudge cards throughout the day:
- **"You're free for 2 hours after Sarah"** → suggest filling the gap
- **"Tom hasn't booked in 3 weeks"** → prompt to send a check-in message
- **"You've driven 8 hours today"** → suggest a break (health integration)
- **"Sarah's test is in 5 days"** → suggest a mock test lesson
- **"3 pupils owe £200+"** → batch payment reminder button

**Changes**: New `SmartNudgesCard.tsx` on the homepage. New `generate-nudges` edge function that queries schedule gaps, inactive pupils, health hours, upcoming tests, and unpaid balances, then returns prioritised nudge objects. Each nudge has a one-tap action button.

---

### 3. End-of-Day Summary
Triggered when the last lesson ends (or at 7pm):
- Lessons completed, total hours, earnings today
- Mileage driven, fuel cost estimate
- Pupils who need follow-up
- Tomorrow's first lesson time + prep notes

**Changes**: New `EndOfDaySummary.tsx` overlay/sheet. New `generate-eod-summary` edge function. Trigger via the existing lesson-end flow or a scheduled check.

---

### 4. Pupil Re-engagement Autopilot
Automatically detect pupils who haven't booked in X days and queue a friendly "haven't seen you in a while" message template:
- Configurable dormancy threshold (default 14 days)
- Auto-draft message the instructor can review + send with one tap
- Track which pupils have been nudged to avoid spamming

**Changes**: New `DormantPupilsCard.tsx` on homepage. Query `scheduled_lessons` for last lesson date per pupil, filter by threshold. One-tap "Send check-in" that pre-fills the message sheet.

---

### 5. Lesson Prep Assistant
Before each lesson, show a contextual prep card:
- What you covered last time (from lesson notes)
- Syllabus areas to focus on (from recommendations)
- Pupil's weak spots from telematics
- Test date countdown if applicable
- Route suggestion based on skills needed

**Changes**: New `LessonPrepCard.tsx` shown on the Next Up tile or as an expandable section. New `generate-lesson-prep` edge function using Lovable AI to synthesise notes + syllabus + telematics data into a 3-bullet prep guide.

---

### 6. Weekly Business Report (Auto-generated)
Every Sunday evening, generate and store a weekly report:
- Revenue vs last week, lesson count, cancellation rate
- Best/worst day, average lessons per day
- New pupils gained, pupils lost
- Mileage + expense summary
- AI-generated one-line insight ("Your Thursday earnings are 40% higher than other days — consider adding a Thursday slot")

**Changes**: New `WeeklyReportCard.tsx` with a "This week's report" section. New `generate-weekly-report` edge function. Store reports in a new `instructor_weekly_reports` table for history. Add a voice command: "Read my weekly report".

---

### 7. Quick Reply Suggestions
When opening a pupil message, show AI-suggested quick replies based on context:
- If pupil asks about rescheduling → "Sure, I have [gap times] available"
- If pupil asks about price → auto-fill their rate
- Generic: "See you then!", "No problem", "Let me check and get back to you"

**Changes**: New `QuickReplySuggestions.tsx` in the chat window. New `generate-quick-replies` edge function that takes the last few messages + pupil context and returns 3 short reply options.

---

### Summary of Changes

| Feature | New Components | New Edge Functions | DB Changes |
|---|---|---|---|
| Morning Briefing | `MorningBriefingCard.tsx` | `generate-morning-briefing` | None |
| Smart Nudges | `SmartNudgesCard.tsx` | `generate-nudges` | None |
| End-of-Day Summary | `EndOfDaySummary.tsx` | `generate-eod-summary` | None |
| Dormant Pupils | `DormantPupilsCard.tsx` | None (client query) | None |
| Lesson Prep | `LessonPrepCard.tsx` | `generate-lesson-prep` | None |
| Weekly Report | `WeeklyReportCard.tsx` | `generate-weekly-report` | 1 new table |
| Quick Replies | `QuickReplySuggestions.tsx` | `generate-quick-replies` | None |

All AI features use Lovable AI (Gemini Flash) via the existing `LOVABLE_API_KEY`. No new secrets needed. This is a large body of work — recommend implementing in phases, starting with Morning Briefing + Smart Nudges as the highest-impact items.

