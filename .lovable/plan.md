

# Prompt: Recreate EveryDriver Instructor Mobile App

Below is the full prompt you can paste into Google AI Studio to recreate the instructor-facing mobile app.

---

**PROMPT START**

Build a complete driving instructor business management mobile app called **EveryDriver** using React Native (Expo) with TypeScript, NativeWind (Tailwind CSS for React Native), React Navigation, and Supabase for the backend. The app is used daily by UK driving instructors to manage their entire business from their phone.

## Design System

- **Brand colours**: Primary blue `#0075c9`, dark navy `#0a1628`, emerald accents `#10b981`
- **Style**: Premium iOS-native aesthetic — rounded cards (16px radius), grouped list sections mimicking iOS Settings, subtle shadows, glassmorphism panels
- **Typography**: System font (San Francisco on iOS, Roboto on Android). Section headers are 13px uppercase tracking-wide muted text. Card titles 15px semibold.
- **Dark mode**: Full support using NativeWind dark: variants. Dark cards use `#1C1C1E`
- **Animations**: React Native Reanimated + spring physics. Haptic feedback on key actions (react-native-haptics). Pull-to-refresh on dashboard. Framer-motion-style enter animations on list items (staggered fade-up)
- **Icons**: Lucide React Native for all icons. Some menu items use custom PNG icons (32×32) in coloured rounded-square backgrounds

## Authentication

- Supabase Auth with email/password login and signup
- `InstructorAuthContext` wraps the app, providing `instructor` profile, `subscription` object, `signOut()`
- Instructor profile fields: `id, name, email, phone, app_slug, profile_image_url, brand_colour, secondary_colour, logo_url, is_active, payment_qr_url, commission_payer, booking_mode, vehicle_mpg, fuel_cost_per_litre, klarna_enabled, clearpay_enabled, availability_paused, deposit_enabled, custom_branding_enabled, quotes_enabled, broadcast_messaging_enabled, lesson_feedback_enabled, pupil_self_booking_enabled`
- Compliance date fields: `adi_badge_expiry, dbs_certificate_expiry, car_insurance_expiry, car_mot_expiry, car_tax_expiry`
- CPD fields: `cpd_hours_logged, cpd_year_target, cpd_certified`
- Login screen at `/login`, signup at `/signup`. Redirect to dashboard after auth

## Navigation

### Bottom Tab Bar (6 tabs)
1. **Home** → Dashboard (`/instructor`)
2. **Schedule** → Calendar view (`/instructor/schedule`)
3. **Track** → GPS live session (`/instructor/tracking`) — uses Radio icon, highlighted centre tab
4. **Money** → Payments hub (`/instructor/pay`)
5. **Pupils** → Pupil list (`/instructor/pupils`)
6. **More** → Full menu grid (`/instructor/menu`)

- Active tab has a pill-shaped indicator with spring animation
- Badge counts on Schedule (today's lesson count), Pupils (pending jobs), and More (unread messages)
- Tab bar colour inherits instructor's `brand_colour` with contrast-aware text (light/dark auto-detection)
- Supports `wallpaperColor` customisation from instructor appearance preferences

### Desktop Sidebar (tablet/web)
Collapsible sidebar with grouped sections: TEACHING, BUSINESS, COMMUNICATION, TOOLS, VEHICLE INTELLIGENCE. Pinnable items stored in localStorage.

## Screen-by-Screen Specification

### 1. Dashboard / Home Screen
The home screen supports **7 layout variants** selectable in appearance settings:
- **Default**: Full-featured layout (described below)
- **Schedule**: iOS app launcher style with today's schedule
- **Lock Screen**: Lock-screen inspired with time, weather, and widgets
- **Clean**: Minimal cards-only layout
- **iOS Native**: Native-feeling grouped sections
- **Compact**: Dense information layout
- **Best Mate**: Casual, friendly tone

**Default Layout Structure:**

**1a. Header**: Sticky primary-coloured header with:
- Avatar (initials fallback), instructor first name
- SOS emergency button (red circle, opens emergency contact sheet)
- Bell icon with notification badge count (combined: messages + jobs + test swaps + visitor chats)
- "Pay" button (white pill, £ icon) → opens Take Payment modal
- Settings dropdown (gear icon) → Settings, Sign Out
- Offline sync indicator
- 48px gradient overlay bleeds into content below

**1b. Homepage Hero**: Full-width card with:
- Greeting ("Good morning, {name}!" — time-aware: morning/afternoon/evening)
- Hero background image (customisable per instructor)
- Weekly progress ring: lessons completed / lessons scheduled
- Monthly stats overlay
- Profile image thumbnail

**1c. Morning Briefing Card**: Auto-generated daily brief showing today's lesson count, first lesson time, weather, key reminders. Only shows before noon.

**1d. Activity Tiles Grid**: 2×2 grid of action tiles:
- Pending Jobs (count badge)
- Unread Messages (count badge)
- Test Swap Requests (count badge)
- Gap Slots Available (count badge)
Each tile navigates to its respective screen on tap.

**1e. Driving Alerts Strip**: Horizontal scrollable strip showing real-time road alerts, weather warnings. Dismissable per alert. Shows GPS location name.

**1f. Tracker Reminder Banner**: Shows when next lesson is within 30 minutes and GPS is not connected. Prompts to start tracking.

**1g. Pupil Milestone Feed**: Vertical feed of pupil achievements (passed test, completed X lessons, etc.)

**1h. "Your Day" Section**:
- **Next Up Tile**: Large card showing next lesson with pupil name, avatar, pickup location, time until lesson, account balance, prepaid hours, duration. Tap to expand. Includes "On My Way" and "Start Tracking" quick actions.
- **Today Schedule Agenda**: Chronological list of remaining lessons for today with time, pupil, location. Then tomorrow's lessons preview.
- **Today Route Map Preview**: Mini map showing today's lesson locations as pins with route lines. Tap to open diary view.

**1i. Quick Access**: Horizontally swipeable grid of shortcut tiles (2 rows) linking to common features.

**1j. Weather Alert Banner**: Severe weather warnings when applicable.

**1k. Impact Alert Card**: Business insights — revenue changes, cancellation trends.

**1l. Insights Tiles**: Small metric cards — earnings trend, gap fill rate.

**1m. Vehicle Health Card**: OBD-connected vehicle status, fault code count.

**1n. Idle Time Cost Card**: Calculates cost of idle gaps between lessons.

**1o. End of Day Summary**: Shows after 6pm — day's earnings, lessons completed, mileage.

**1p. Bottom Promo Group**: Waiting room link, discover features tile, community links.

**1q. Floating Session Bar**: When a GPS tracking session is active, a floating bar appears above the tab bar showing: pupil name, elapsed time, current speed (in mph), live waveform animation. Swipe up or tap to go to tracking screen. Drag-to-dismiss with rubber-band physics.

**1r. Radial FAB**: Floating action button (appears on scroll) that expands radially to show: New Lesson, New Pupil, Take Payment, Quick Note.

**1s. Pull-to-Refresh**: Custom pull-to-refresh with haptic feedback. Invalidates all dashboard queries. Shows "Updated just now" pill.

**1t. Celebration Confetti**: Confetti animation triggers in the evening when all lessons are complete.

### 2. Schedule / Calendar
- **Views**: Day, 3-Day, Week, Month (toggle buttons)
- **Time grid**: 7am–9pm, 60px per hour
- **Events**: Colour-coded blocks — lessons (primary), blocks (grey), breaks (amber). Drag-to-reschedule on desktop. Drag bottom edge to resize duration.
- **Event tap**: Opens bottom sheet with lesson details, pupil info, edit/cancel/reschedule options
- **Add event**: FAB (+) button opens dialog for new lesson, availability block, or personal event
- **Calendar sidebar** (desktop): Mini month calendar for date jumping, colour legend, export (ICS), share settings
- **Google Calendar sync**: Optional bi-directional sync via Google service account
- **Mobile month view**: Dot indicators on dates, tap to see day detail

### 3. GPS Tracking / Live Session
- **Session Start Panel**: Select pupil from dropdown, tap "Start Lesson" to begin GPS tracking
- **Tracker Selector**: Choose tracking source — phone GPS, Geotab OBD device, or GPSgate hardware
- **Live Map**: Full-screen Leaflet/MapView showing real-time position with heading arrow, route polyline, speed limit roundel overlay
- **Floating Session Timer**: Elapsed time, current speed (mph), distance covered (miles)
- **GPS Status Hero**: Connection quality indicator (signal bars), device name, battery %, satellite count
- **Pupil Quick Info**: Avatar, name, lesson number, account balance — shown during session
- **Speed Compliance**: Real-time speed vs limit comparison, alerts for speeding
- **Recent Sessions List**: Past sessions with date, pupil, distance, duration. Tap for trip replay.
- **Session end**: Triggers End Lesson Wizard (see below)

### 4. End Lesson Wizard
5-step bottom sheet wizard that appears when a lesson ends or is manually completed:

- **Step 1 — Summary**: Lesson date, time, duration, pupil name. Text area for lesson notes with voice-to-text dictation button. Voice note recorder (audio blob). Route report data if GPS was active (distance, avg speed, max speed, route map thumbnail).
- **Step 2 — Payment**: Shows lesson cost, pupil's current balance. Options: Mark as paid, Record cash payment, Send payment link, Apply from balance. Supports partial payments.
- **Step 3 — Skills**: Competency picker — grid of DVSA syllabus skills (e.g., "Moving off", "Mirrors", "Roundabouts"). Tap to toggle covered/not-covered. Progress tracking per pupil.
- **Step 4 — Book Next**: Quick-book next lesson for same pupil. Shows availability slots. Option to skip.
- **Step 5 — Completion**: Success animation (confetti + trophy icon). Shows summary of what was recorded. "Done" button closes wizard.

**Critical behaviour**: The `LessonEndAlert` overlay (which polls for overdue lessons every 60s) must NOT render while the wizard is open, to prevent blocking interaction.

### 5. Pupils
- **List view**: Searchable, filterable list of all pupils. Each card shows: avatar, name, phone, lesson count, account balance, last lesson date, progress percentage
- **Smart Filters**: Quick filter chips — Active, Owing Money, Test Ready, Dormant, New
- **Pupil Detail** (split-pane on tablet, full-screen on mobile):
  - Contact info (phone, email, pickup postcode)
  - Account balance with credit breakdown
  - Lesson history (chronological list with notes)
  - Progress chart (syllabus completion %)
  - Driving report generator (PDF)
  - Assignments panel
  - Reflective learning logs
  - Payment history
  - Gamification stats (badges, streaks)
  - Rate editor (custom hourly rate per pupil)
  - Package card (prepaid lesson packs)
- **Add Pupil**: Bottom sheet form — name, phone, email, pickup postcode, hourly rate, lesson type
- **Pupil Avatar Upload**: Camera or gallery image picker, crops to circle

### 6. Money / Payments Hub
- **Money Hero Card**: Large gradient card showing: today's earnings, this week total, this month total. Animated counter on load.
- **Quick Stats**: Chips showing key metrics — outstanding balances, payments this week, average lesson value
- **Money Action Grid**: 2×3 grid of action buttons — Record Payment, Send Invoice, Payment History, Expenses, Tax Summary, Mileage
- **Recent Payments Card**: Last 5 payments with pupil name, amount, date, status badge (paid/pending/overdue)
- **Owes Money Card**: List of pupils with negative balances, sorted by amount owed
- **Weekly Comparison Bar**: Bar chart comparing this week vs last week earnings
- **Earnings Chart**: Line/bar chart of daily earnings for the month
- **Pupil Balances List**: Full list with balance, last payment date

### 7. Take Payment Modal
- Pupil selector dropdown
- Amount input (£)
- Payment method: Cash, Bank Transfer, Card (Stripe/PayPal link), QR Code
- QR code display for contactless payment (instructor's payment QR URL)
- Commission payer toggle (instructor pays vs pupil pays)
- Payment confirmation with haptic feedback

### 8. More / Menu Screen
iOS Settings-style grouped list with sections:

**Quick Actions**: To Do, Messages, Job Offers, New Bookings, Take Payment, Live Tracking, Find My Car, Expenses, Test Swap

**Money & Reports**: Payments, Income Summary, In vs Out, Mileage Tracker, Tax Summary

**Schedule & Pupils**: Schedule, Pupils

**Tools**: Fleet Dashboard, Dashcam, Reviews, Vehicle Health, Quick Test Result, Full Test Report, Saved Routes, Jotter/Doodlepad, Fill Gaps, Notes, Bulk Operations, Reports Hub

**Resources**: Documents & Files, Platform Updates

**Wellbeing**: Health Hub

**Settings**: All Settings, My Profile, Mini-Website, FAQs & Help

**Account**: Sign Out

Each item has: coloured icon background (rounded square), label, chevron. Feature-gated items show a lock icon and plan badge (e.g., "PRO") when locked. Tapping a locked item shows a toast with upgrade message.

### 9. Messages / Unified Inbox
- Threaded conversation list with pupil avatars, last message preview, timestamp, unread badge
- Chat window: WhatsApp-style bubbles, auto-scroll, typing indicator
- Quick reply suggestions (AI-generated contextual responses)
- Broadcast messaging: Send to all pupils or filtered groups
- Visitor chat integration (website visitor messages)
- Admin chat channel (contact platform support)
- Team channels (for driving school groups)

### 10. Settings
Grouped settings sections:

- **Profile**: Name, email, phone, profile image, ADI badge number
- **Business**: Hourly rates, lesson packages, cancellation policy, deposit settings, pricing rules
- **Booking**: Booking mode (manual/auto), availability windows, buffer time, intake questions
- **Appearance**: Layout style selector (7 options), wallpaper colour picker, hero image upload, dark/light/system theme toggle
- **Notifications**: Push notification preferences, reminder settings (SMS timing)
- **Calendar**: Colour customisation per event type, export settings, Google sync setup
- **Payments**: Payment QR URLs, commission payer preference, Klarna/Clearpay toggles, TrueLayer bank transfer
- **Website**: Mini-website CMS, custom domain management, SEO settings, theme editor
- **Vehicle**: MPG setting, fuel cost per litre, GPS/tracker setup
- **Pupil App**: Branding editor for pupil-facing portal, dark mode toggle
- **Data**: Export manager (CSV/PDF), GDPR retention widget
- **Feature Toggles**: Enable/disable individual features

### 11. Additional Feature Screens

**Diary View**: Day-by-day scrollable view with lessons, travel times between lessons, and map pins.

**Job Offers**: Swipeable cards for incoming lesson requests. Accept/decline with notes. Shows pickup location, requested times, pupil details.

**Waiting List**: Manage prospective pupils. Waitlist freshness indicator. Auto-matching when slots open.

**Availability Windows**: Weekly recurring availability grid. Drag to set available hours per day. Pause/resume availability.

**Fill Gaps**: AI suggests gap-filling opportunities based on geography and pupil waiting list. Shows map with potential fill routes.

**Income Summary**: Monthly earnings breakdown with charts. Revenue per pupil analysis. Comparison to previous periods.

**Expenses Tracker**: Log business expenses with receipt photo capture. Category breakdown chart (fuel, vehicle, insurance, etc.). Recurring expenses manager.

**In vs Out**: Side-by-side income vs expenses comparison. Net profit calculation. Monthly trend chart.

**Mileage Tracker**: Automatic lesson mileage from GPS sessions. Manual entry option. HMRC-ready export. Running costs calculator.

**Tax Summary**: Annual tax year overview. Income, expenses, mileage deductions, estimated tax liability.

**Test Results**: Record DVSA driving test results (DL25A format). Pass/fail, fault counts (minors/serious/dangerous). Test centre, examiner name. Pass rate dashboard.

**Standards Check**: DVSA Standards Check preparation tool. Competency self-assessment grid. Practice scenarios.

**CPD Log**: Continuing Professional Development hours tracker. Certificate generator. Year target progress ring.

**Certifications**: Track and alert on expiring documents — ADI badge, DBS, insurance, MOT, tax.

**Saved Routes**: Library of saved driving routes with map preview. Upload GPX files. Share routes. Route heatmap showing frequently driven areas.

**Trip Replay**: Playback recorded lesson routes on map with speed graph timeline. Scrub through journey. Speed compliance overlay.

**Doodlepad**: Drawing tool for explaining road layouts to pupils. Finger/stylus drawing on canvas. Save and share sketches.

**Notes**: Rich text notebook for general instructor notes. Markdown support.

**To-Do List**: Task manager with due dates, priority levels, completion tracking.

**Vehicle Health**: OBD-II connected vehicle diagnostics. Fault code reader. Service reminders. MOT/tax date tracking.

**Fleet Dashboard**: Multi-vehicle management for driving schools. Live positions of all vehicles. Mileage and fuel across fleet.

**Dashcam**: Video clip gallery from connected dashcam. Upload, tag, and review footage.

**Find My Car**: Last known vehicle position on map. Directions to car.

**Nearby Friends**: See other EveryDriver instructors nearby on a map. Send friend requests. Privacy controls.

**SatNav**: Built-in navigation to next lesson pickup location. Turn-by-turn directions using mapping API.

**Reviews**: Manage Google/Trustpilot reviews. Display on mini-website. Review request automation.

**Referrals**: Referral program dashboard. Share referral link. Track referral earnings.

**Pipeline**: Lead management funnel — enquiry → booked → active → completed. Conversion analytics.

**Automations**: Workflow builder for automated actions (e.g., send reminder 24h before lesson, follow up after test).

**Workflow Builder**: Visual drag-and-drop automation editor with trigger → condition → action nodes.

**Bulk Operations**: Bulk SMS to pupils, bulk price changes, bulk reschedule.

**Reports Hub**: Generate and download PDF reports — weekly summary, monthly earnings, annual business report, pupil progress reports.

**End of Day Report**: Shareable summary card of the day's work — lessons, earnings, mileage, pupils seen.

**Daily Manifest**: Printable/shareable day schedule with all lesson details, addresses, pupil contacts.

**Weekly Report**: Week-in-review with comparison charts and key metrics.

**Clock In/Out**: GPS-verified work hours tracker for employed instructors.

**Wellbeing / Health Hub**: Mood tracker, break reminders, drive time alerts (max hours), stretching exercises, mental health resources.

**Platform Updates**: News feed of app updates and feature announcements. Feature request voting.

**AI Command Centre**: AI assistant for natural language queries about your business ("How much did I earn last month?", "Who owes me money?").

**Waivers**: Digital waiver/consent forms for pupils to sign. Template editor. Signature pad.

**Document Vault**: Secure storage for business documents with expiry tracking.

**Document Templates**: Pre-built letter/email templates (welcome letter, cancellation policy, etc.).

**Checklists**: Pre-flight vehicle checks, new pupil onboarding checklist, test day preparation checklist.

**Mini-Website**: Built-in CMS for instructor's public booking website. Theme editor, page builder, course listings, testimonials, contact form. Custom domain support with DNS management and SSL.

**Public Availability**: Embeddable availability calendar for instructor's website.

**Pupil Portal**: White-labelled pupil-facing app with: lesson history, upcoming bookings, progress tracker, payment history, theory test resources, reflective log.

**School Dashboard**: Multi-instructor management for driving school owners. Overview of all instructors, aggregated financials, fleet management.

## Voice-to-Text / Dictation

Every text input field across the entire app should have a microphone button for voice dictation. Use `@react-native-voice/voice` library. The mic button:
- Appears as a small microphone icon at the trailing edge of input fields
- Pulses red with animation while recording
- Inserts transcribed text at cursor position
- Works with continuous recognition (keeps listening until stopped)
- Language: `en-GB` (British English)

## Offline Support

- Cache today's schedule, pupil list, and recent payments for offline access
- Queue mutations (lesson notes, payments) when offline, sync when back online
- Show offline indicator banner when disconnected
- GPS tracking continues offline with position queue

## Push Notifications

- Lesson reminders (configurable timing: 1h, 30min, 15min before)
- New message alerts
- Payment received confirmations
- Job offer notifications
- Document expiry warnings
- Pupil milestone celebrations

## Data Model (Supabase Tables)

Key tables: `instructors`, `pupils`, `lessons`, `payments`, `payment_history`, `lesson_notes`, `pupil_competencies`, `instructor_availability`, `saved_routes`, `route_recordings`, `expenses`, `mileage_logs`, `fuel_logs`, `instructor_documents`, `instructor_notes`, `instructor_todos`, `reviews`, `referrals`, `job_offers`, `waiting_list`, `messages`, `message_threads`, `visitor_chats`, `admin_messages`, `instructor_notifications`, `vehicle_devices`, `gps_positions`, `tracking_sessions`, `dashcam_clips`, `instructor_friends`, `instructor_subscriptions`, `subscription_plans`, `instructor_homepage_content`, `instructor_tile_preferences`, `instructor_appearance`, `driving_alerts`, `test_results`, `cpd_logs`, `certifications`, `waivers`, `waiver_signatures`, `checklists`, `checklist_items`, `instructor_workflows`, `workflow_triggers`, `instructor_locations`

## Currency & Units

- All monetary values displayed in GBP (£)
- All distances stored in kilometres, displayed in **miles** (conversion: km × 0.621371)
- All speeds stored in km/h, displayed in **mph**
- Date format: DD/MM/YYYY (UK format)
- Time format: 24-hour or 12-hour (user preference)

## Subscription / Feature Gating

- Plans: Free, Starter, Professional, Premium
- Features are gated by plan level. Locked features show a lock icon with the minimum plan name
- `useMenuFeatureGates` hook checks `subscription.features` object for access
- Upgrade prompts with toast messages

**PROMPT END**

---

This prompt contains the complete specification for every screen, component, interaction pattern, and data model in the instructor app. It covers all 60+ screens, the 7 dashboard layout variants, the end-lesson wizard, GPS tracking, payments, messaging, vehicle intelligence, and all utility tools.

