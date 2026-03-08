

## Competitor Feature Gap Analysis

### What You Already Have (vs competitors)
Your app already covers: diary management, recurring lessons, syllabus tracking, reflective logs, waitlist/gap filling, theory practice, QR payments, parent portal, pupil portal, booking system, pipeline CRM, broadcast messaging, expenses, mileage, tax, mini-website, referrals, reviews, automations, voice assistant, Geotab vehicle tracking, health logging, document templates, digital waivers, and more. You're well ahead of most competitors.

### Features Competitors Have That You're Missing

| # | Feature | Who Has It | Effort |
|---|---------|-----------|--------|
| 1 | **Pupil Selfie / Profile Photo** | TotalDrive | Small |
| 2 | **Lesson Route Recording** (GPS trace per lesson) | MyDriveTime | Medium |
| 3 | **Full Theory Mock Tests** (timed, 50-question DVSA format) | TotalDrive, ADI Book | Medium |
| 4 | **Hazard Perception Practice** (video clips) | TotalDrive | Large |
| 5 | **Printable Car Stickers** (branded QR code stickers for car window) | TotalDrive | Small |
| 6 | **ADI Job Board** (receive enquiries from a marketplace) | ADI Network | Large |

---

### Recommended Builds (High Value, Feasible)

#### 1. Pupil Selfie / Profile Photo Capture
TotalDrive lets instructors snap a photo of each pupil on their first lesson. Helps identify pupils, adds a personal touch to the pupil card.

- Add camera capture button to pupil card and add-pupil flow
- Store in file storage, display as avatar throughout the app
- **Files**: Update `ExpandablePupilCard.tsx`, `AddPupilSheet.tsx`, add camera component
- **DB**: Add `photo_url` column to `pupils` table, create storage bucket

#### 2. Lesson Route Recording
MyDriveTime's "Journey Tracking" logs the GPS route during each lesson automatically, showing the pupil their progress over time (from quiet estates to dual carriageways to motorways).

- Record GPS coordinates during a lesson (start/stop from the "Live Lesson" view)
- Store as GeoJSON in a `lesson_routes` table
- Display route on a Leaflet map in lesson history (pupil portal + instructor view)
- **DB**: New `lesson_routes` table (`id`, `lesson_id`, `instructor_id`, `coordinates` jsonb, `distance_km`, `duration_minutes`)
- **Files**: New `LessonRouteRecorder.tsx` component, update `InstructorLiveSession.tsx`, new route replay viewer

#### 3. Full Theory Mock Tests (Timed, 50 Questions)
Your current Theory page has a basic quiz with a small question bank. Competitors offer full DVSA-format mock tests: 50 random questions, 57-minute timer, pass mark 43/50.

- Expand the question bank (use AI to generate DVSA-style questions by category)
- Add timed mock test mode: 50 random questions, countdown timer, auto-submit
- Track results history: date, score, pass/fail, weak categories
- Show in pupil portal so pupils can self-practice
- **DB**: New `theory_mock_results` table, expand `theory_questions` data
- **Files**: Update `Theory.tsx`, new `TheoryMockTest.tsx` component

#### 4. Branded Car Window Stickers (PDF Generator)
TotalDrive sells branded car stickers with QR codes linking to the instructor's booking page. You already have QR code generation and PDF generation (jspdf) — this is a quick win.

- Generate a printable A5/A6 PDF with instructor branding, logo, phone number, and QR code linking to their mini-website or booking page
- Include "Book your lessons at..." text
- Downloadable from the mini-website settings page
- **Files**: New `CarStickerGenerator.tsx` component, add to `InstructorMiniWebsiteSettings.tsx`
- **No DB changes needed**

---

### Summary

| Feature | DB Changes | New Components | Priority |
|---------|-----------|----------------|----------|
| Pupil Selfie | 1 column + storage bucket | 1 | Quick win |
| Lesson Route Recording | 1 table | 3 | High value |
| Theory Mock Tests | 1 table + data expansion | 2 | High value |
| Car Window Stickers | None | 1 | Quick win |

The two quick wins (selfie + stickers) can be done in one pass. Route recording and theory mocks are meatier but high-value differentiators that pupils actually use daily.

