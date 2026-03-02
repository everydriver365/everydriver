

## Feature Improvements Inspired by Zenbooker and BestMate/TotalDrive

After reviewing both platforms and auditing what your app already has, here are the gaps and improvements worth building. I've grouped them by impact.

---

### Already Covered (No Action Needed)
Your app already has: drag-and-drop diary, recurring lessons, Google Calendar sync, gap filling, discount/promo codes, cancellation fees & policies, lesson reminders, expense tracking, pupil progress/syllabus tracking, "on my way" messaging, payment recording, and the new End Lesson Wizard.

---

### High-Impact Features to Add

**1. ✅ Broadcast Messaging to Pupils** — DONE
- Added "Broadcast" button to the Messages page (BroadcastMessageSheet component)
- Instructors can filter pupils by status (active, on-hold, inactive, passed)
- Select all or individual pupils, compose message, send to individual conversations
- Push notifications sent to each recipient

**2. ✅ Post-Lesson Feedback Requests (Auto-Send)** — DONE
- Created `lesson_feedback` table with RLS policies
- After EndLessonWizard completes, auto-inserts a feedback request for the pupil
- PupilFeedbackPrompt component shows in the pupil portal with star rating + comment
- Submitted ratings stored for instructor review

**3. Lesson Summary / PDF Receipt for Pupils**
TotalDrive provides lesson summaries; Zenbooker sends branded receipts. Your app generates route reports but doesn't send a post-lesson summary card to the pupil/parent.
- After lesson completion, generate a summary card: date, duration, skills covered, notes, balance update, next lesson
- Display in the pupil portal timeline and parent dashboard
- Optional: "Send as PDF" button for the instructor
- Leverages existing `lesson_history` data + new `LessonSummaryCard` component

**4. Pupil Self-Booking from Instructor Availability**
Zenbooker's core feature — let customers book directly from real-time availability. Your public booking system exists at `bookings.drive365.co.uk` but individual pupils can't self-book recurring slots from within the pupil portal using their instructor's live availability.
- Add "Book a Lesson" tab to the pupil portal that shows the instructor's available slots (cross-referenced with working hours, date overrides, and existing bookings)
- One-tap booking with optional approval mode
- Already have the availability logic — just needs a pupil-facing UI

**5. ✅ Job Status Pipeline (En Route → Started → Complete)** — DONE
- "On My Way" buttons now update lesson status to `en_route`
- "Start Lesson" buttons update status to `in_progress`
- EndLessonWizard sets `completed`
- Pupil portal shows real-time lesson status badges (animated pulse for active states)
- Realtime subscription updates status live in the pupil portal

---

### Medium-Impact Improvements

**6. Reflective Log / Lesson Journal (Pupil-Side)**
TotalDrive highlights this as a key feature — pupils write their own reflection after each lesson. Your app has instructor notes but no pupil self-reflection.
- Add a "How did it go?" prompt in the pupil portal after a lesson is marked complete
- Free-text + optional mood/confidence rating
- Visible to the instructor on the pupil card

**7. Custom Branding on Pupil App**
TotalDrive lets instructors brand the pupil app with their logo. Your mini-website is branded, but the pupil portal uses generic EveryDriver branding.
- Pull instructor's logo and brand colors into the pupil portal header
- Already have `brand_color` and `logo_url` in the instructor profile — just need to apply them

---

### Recommended Build Order
1. ✅ Broadcast Messaging (quick win, high daily value)
2. ✅ Job Status Pipeline (improves pupil experience, relatively small change)
3. ✅ Post-Lesson Feedback Requests (ties into the new EndLessonWizard)
4. Lesson Summary Card for Pupils (completes the end-of-lesson flow)
5. Pupil Self-Booking from Portal (bigger feature, builds on existing availability logic)
6. Reflective Log
7. Custom Pupil Portal Branding
