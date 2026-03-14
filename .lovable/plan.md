## Completed: Pipeline Board, On-My-Way Texts, Workflow Automations, AI Receptionist, Smart Buffer Time, Recurring Subscriptions & Security Hardening

All 6 features + security hardening have been built and deployed.

### Feature 1: Pipeline Board ✅
- DB: `pipeline_leads` table with `pipeline_stage` enum, RLS scoped to instructor
- UI: `/instructor/pipeline` with drag-and-drop Kanban board, lead cards, add/edit sheet
- "Convert to Pupil" button creates pupil record and moves lead to active
- Tile added to home screen

### Feature 2: On-My-Way Texts ✅
- DB: `on_my_way_notifications` table with RLS
- UI: `OnMyWayButton` component integrated into SatNav lesson cards
- Opens native SMS with pre-filled ETA message

### Feature 3: Workflow Automations ✅
- DB: `instructor_automations` table with trigger/action enums, RLS
- UI: `/instructor/automations` with automation list, toggle, delete, builder sheet
- Builder has templates + step-by-step trigger→action flow
- Edge function `process-automations` executes SMS, todos, notes, pipeline moves
- Tile added to home screen

### Feature 4: AI Receptionist ✅
- DB: `ai_receptionist_enabled` column on instructors table
- Edge function `ai-receptionist` uses Lovable AI (gemini-3-flash-preview)
- LiveChatWindow triggers AI auto-response 5s after visitor message if no human reply
- Instructor context (name, rate, areas, car) included in AI prompt
- Messages prefixed with 🤖 emoji for visual distinction

### Feature 5: Smart Buffer Time (Travel-Aware Scheduling) ✅
- DB: 3 new columns on `instructors`: `smart_buffer_enabled`, `smart_buffer_mode`, `smart_buffer_padding_minutes`
- Edge function `check-travel-buffer` calculates drive time between postcodes and checks feasibility
- UI: New `SmartBufferSettings` component in Scheduling settings section
- 3 modes: flat buffer, travel time only, travel time + padding
- Uses TomTom Routing API for accurate drive time calculations

### Feature 6: Recurring Lesson Subscriptions ✅
- DB: `pupil_subscriptions` table with RLS (instructor CRUD, public read for pupil portal)
- Edge function `process-recurring-subscriptions` auto-creates lessons, skips holidays, advances dates
- UI: `/instructor/subscriptions` page with subscription list, pause/resume/cancel
- `AddSubscriptionSheet`: select pupil, day, time, duration, price, payment method
- Tile added to home screen dashboard
- Route added to App.tsx

### Security Hardening ✅
- **P1 Critical RLS**: Removed anon SELECT on `instructors` (use `public_instructors` view), dropped public ALL on `reflective_logs`, fixed `lesson_feedback` tautology UPDATE + restricted to authenticated, added token filter to `quotes` anon SELECT, removed anon SELECT on `pupil_subscriptions`
- **P2 Permissive Writes**: Removed public INSERT on `lesson_reminders_log` and `payment_reminder_log` (service_role bypasses RLS)
- **P3 Auth/API**: Added JWT auth to `get-google-maps-key` edge function, added `geotab_session_cache` RLS policy, enabled leaked password protection
- **P4 Data Exposure**: Removed public SELECT on `instructor_calendar_events`, removed anon SELECT on `lesson_syllabus_updates`, restricted `platform_commissions` to owning instructor + admin

### Feature 7: Competitor Feature Gap — 4 New Features ✅

#### 7a. Pupil Selfie / Profile Photo Upload ✅
- `PupilAvatarUpload` component integrated into expanded `ExpandablePupilCard.tsx`
- Uses existing `pupil-avatars` storage bucket and `profile_image_url` column on `pupils` table
- Instructors can snap/upload photos directly from the pupil card

#### 7b. Lesson Route Recording & Viewer ✅
- DB: New `lesson_routes` table (coordinates JSONB, distance_km, duration_minutes, pupil_id, instructor_id)
- UI: `LessonRouteViewer` component added to pupil card's Tracking History section
- Displays route list with distance/duration badges, renders selected route on Leaflet map with start/end markers
- RLS: Instructor-scoped CRUD, anon read for pupil portal

#### 7c. Full Theory Mock Tests (Timed, DVSA Format) ✅
- DB: New `theory_mock_results` table (score, total_questions, passed, time_taken_seconds, category_breakdown JSONB)
- UI: `TheoryMockTest` component with 50-question timed test, 57-minute countdown, pass mark 43/50
- Shows category breakdown on results, saves results to DB
- Integrated into pupil portal Theory section in `BrandedPupilPortal.tsx`

#### 7d. Branded Car Window Sticker PDF Generator ✅
- `CarStickerGenerator` component generates A5/A6 PDF stickers using jsPDF
- Includes instructor name, logo, phone, custom tagline, and QR code linking to booking page
- Brand colour applied throughout; downloadable PDF
- Added as new "Sticker" tab in `InstructorMiniWebsiteSettings.tsx`

### Feature 8: UX Improvements Inspired by Leading Platforms ✅

#### 8a. Smart Empty States ✅
- Integrated `EmptyState` component into `PupilPortalHistory`, `PupilPortalPayments`
- Friendly headlines and descriptions replace plain icons

#### 8b. Booking Abandonment Recovery ✅
- `BookingRecoveryBanner` component with "Continue where you left off?" prompt
- Auto-saves form state to `localStorage` on every field change in `MobileBookingView`
- Cleared on successful payment

#### 8c. Post-Lesson Star Rating (Uber Pattern) ✅
- DB: `lesson_ratings` table (lesson_id, pupil_id, rating 1-5, comment) with RLS
- `PostLessonRating` component: auto-appears after completed lessons on dashboard
- 5-star interactive rating with optional comment, dismissible per session
- Mounted in `BrandedPupilPortal` home section

#### 8d. Cancellation Policy Card (Airbnb Pattern) ✅
- `CancellationPolicyCard` component with traffic-light visual breakdown
- Green (free), Amber (late fee), Red (no-show full charge)
- Integrated into `PupilPortalSchedule` above lesson list when self-cancel enabled

#### 8e. Lesson SMS Reminders ✅
- DB: `reminder_preferences` JSONB column on `pupils` table (default: 24h + 1h)
- Edge function `send-lesson-reminders` queries upcoming lessons and sends SMS via Twilio
- UI: Reminder preference toggles added to `PupilPortalProfileEdit`
- Updated `update_pupil_profile` RPC to allow `reminder_preferences` field

#### 8f. Share Your Pass Social Card ✅
- `PassShareCard` component generates branded celebration card
- Uses Web Share API with clipboard fallback via `share-utils.ts`
- Shows "Share Your Pass!" button with instructor branding
