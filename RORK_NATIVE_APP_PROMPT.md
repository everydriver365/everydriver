# EveryDriver / Drive365 — Complete Native App Recreation Prompt (Rork Max)

> **Purpose**: This document provides everything needed to recreate the instructor mobile app as a native React Native application using Rork. Every screen, function, layout, data flow, and edge function is documented. The native app connects to the existing Supabase backend — no backend changes needed.

---

## 1. BACKEND CONNECTION

### Supabase Credentials
```
SUPABASE_URL: https://qyqeibovdhyohkfagujv.supabase.co
SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o
```

### Authentication
- Instructors authenticate via **Supabase Auth** (email + password)
- After auth, the instructor's `id` is resolved via: `SELECT id FROM instructors WHERE auth_user_id = auth.uid()`
- **Every single query** must filter by `instructor_id` — this is enforced by RLS policies
- Store session with `@supabase/supabase-js` AsyncStorage adapter

### Edge Functions Base URL
```
https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/{function-name}
```
Call with `Authorization: Bearer {session.access_token}` header.

---

## 2. NAVIGATION STRUCTURE

### Bottom Tab Bar (5 tabs + More)
```
┌──────┬──────────┬───────┬───────┬────────┬──────┐
│ Home │ Schedule │ Track │ Money │ Pupils │ More │
└──────┴──────────┴───────┴───────┴────────┴──────┘
```

### Tab → Screen Mapping

| Tab | Primary Screen | Icon |
|-----|---------------|------|
| Home | InstructorPortal (/) | `Home` |
| Schedule | InstructorSchedule | `Calendar` |
| Track | InstructorFleetDashboard | `MapPin` |
| Money | InstructorPay | `PoundSterling` |
| Pupils | InstructorPupils | `Users` |
| More | InstructorMenu | `Menu` |

---

## 3. COMPLETE SCREEN INVENTORY

### 3.1 HOME TAB — Dashboard (`/instructor`)

**Layout**: iOS Weather-Style Hero (Option Z4)
- **Header**: `InstructorMobileHeader` — frosted glass bar with:
  - Instructor avatar (from `instructors.profile_image_url`)
  - Greeting ("Good morning, {name}")
  - SOS emergency button (red, top-right)
  - Notification bell with badge count (`useInstructorNotifications` + `useCombinedNotificationCount`)
  - Admin message badge (`AdminMessageBadge`)
  - Visitor chat badge (`VisitorChatBadge`)
- **Hero Section**: `ContextualHomeHero` with weather widget (`WeatherWidget` using `useTomorrowWeather`) and vehicle health alerts (`VehicleHealthStrip`)
- **Stats Grid**: 4 frosted-glass cards via Embla Carousel:
  - Today's lessons count
  - Today's earnings (£)
  - Weekly hours
  - Pass rate %
  - Data from `useInstructorLiveStats`, `useDailyEarnings`, `useTodayOverview`
- **Next Up Tile**: `NextUpTile` — promoted above stats when lesson within 120 mins
  - Shows pupil name, avatar, time, pickup location
  - Action buttons: Prep (opens pupil syllabus), Here (marks arrival), Running Late (opens `RunningLateSheet`)
  - Record Route button (starts `LessonRouteRecorder`)
  - Data: `useNextLessonDetails`, `useLessonTravelTimes`
- **Today's Schedule**: `TodayLessonsList` — vertical timeline of today's lessons
- **Morning Briefing**: `MorningBriefingCard` — AI-generated daily summary
  - Edge function: `generate-morning-briefing`
  - Model: Gemini 2.5 Flash
- **Smart Nudges**: `SmartNudgesCard` — AI suggestions for follow-ups
  - Edge function: `generate-nudges`
- **Quick Actions FAB**: `QuickActionsFAB` / `QuickActionsPopoverMenu`
  - 4-column grid: Add Lesson, Take Payment, Record Test, Message Pupil, Start Tracking, Quick Availability, Gap Filler, Find My Car
  - Haptic feedback on tap
  - Pinnable favourites (stored in `useQuickTileActions`)
- **Dashboard Tiles** (scrollable):
  - `TodoHomeTile` — linked to `admin_todos` table
  - `OutstandingTasksCard` — pending actions
  - `TomorrowPreviewCard` — next day preview (`useTomorrowPreview`)
  - `DrivingInsightsCard` — AI coaching tips (`generate-driving-insights`)
  - `WeeklyReportCard` — summary widget (`generate-weekly-report`)
  - `RetentionAlertsTile` — at-risk pupils (`usePupilRetentionAlerts`)
  - `DormantPupilsCard` — inactive pupils
  - `GapFillerCard` — available slots (`useRealGapSlots`)
  - `StreakBadge` — teaching streak (`useInstructorStreak`)
  - `WeeklyGoalRing` — progress ring (`useWeeklyGoals`)
  - `RoadAlertsRow` — traffic/road alerts (`get-driving-alerts`)
- **Voice Assistant**: `VoiceAssistantButton` — floating mic button
  - Wake word: "Hey ED"
  - Pipeline: `voice-stt` → `voice-parse-intent` → `voice-execute` → `voice-tts`
  - Native: Use `expo-av` for recording, send to `voice-stt` edge function
  - TTS: ElevenLabs via `voice-tts` edge function, playback with `expo-av`

### 3.2 SCHEDULE TAB (`/instructor/schedule`)

**Layout**: Google Calendar-style with day/week/month views
- **Components**: `InstructorCalendar`, `MobileScheduleView`, `NewMobileScheduleView`, `GoogleStyleScheduleView`, `MobileMonthCalendarView`
- **Day View**: Vertical timeline with lesson cards showing pupil name, time, location, payment status
- **Lesson Cards**: `ExpandableLessonCard` — tap to expand showing:
  - Pupil details, pickup/dropoff addresses
  - Payment status badge (`PaymentStatusBadge`)
  - Quick actions: Message, Cancel, Reschedule, Take Payment
- **Add Lesson**: `AddLessonSheet` — bottom sheet with:
  - Pupil selector (`PupilSelector` / `PupilPickerDialog`)
  - Date/time picker
  - Duration selector
  - Lesson type (Standard, Mock Test, Test Day, Assessment, Motorway)
  - Pickup/dropoff locations
  - Notes field
- **Schedule FAB**: `ScheduleFAB` — floating button to add lesson
- **Calendar Sync**: Google Calendar integration via `google-calendar-service` edge function
- **Data**: `scheduled_lessons` table, `useInstructorCalendar` hook
- **Calendar Export**: `CalendarExportDialog` — share public calendar via token
- **Calendar Colors**: `CalendarColorSettings` — customise lesson type colors

### 3.3 TRACK TAB (`/instructor/fleet-dashboard`)

**Sub-tabs**: Live Map | Sessions | Trips | Geofences | Dashcam

#### Live Map
- **Component**: `GoogleLiveTrackingMap` (use `react-native-maps` in native)
- Directional arrow marker rotating by `last_heading`
- Speed badge overlay (green/amber/red)
- Speed limit roundel (`SpeedLimitRoundel`)
- Road name banner from `last_road_name`
- Auto-follow with 10s resume timer
- Speed-based auto-zoom
- Track-Up mode (map rotation + 45° tilt)
- Data: `gps_devices` table, polled every 10s
- Screen Wake Lock: Use `expo-keep-awake`

#### Session Management
- `SessionStartPanel` — select pupil, start GPS tracking session
- `FloatingSessionTimer` — persistent timer bar during active session
- `RecentSessionsList` — history of tracking sessions
- Data: `lesson_telematics` table, `useActiveSession` hook

#### Trips
- `GPSgateTripHistory` / Geotab trips
- `TripSummarySheet` — slide-up drawer with:
  - Route map replay
  - Speed vs Speed Limit chart (`SpeedTimeGraph` using Recharts → use `victory-native`)
  - Stats: distance, duration, max speed, average speed
  - Behaviour score
- Edge functions: `geotab-trips`, `quartix-trips`

#### Trip Replay (`/instructor/trip-replay/:routeId`)
- `TripReplayMap` — animated route playback on map
- `TripReplayControls` — play/pause/speed slider
- `TripReplaySpeedChart` — real-time speed graph
- `TripReplayStats` — summary statistics
- Data: `telematics_gps_points` table, `useTripReplay` hook

#### Geofences
- `GeofenceEditor` — create/edit circular geofences on map
- `GeofenceAlertsList` — notification history
- Data: `geofences`, `geofence_alerts` tables

#### Dashcam (`/instructor/dashcam`)
- `DashcamGalleryView` — thumbnail grid with:
  - Play overlays
  - Search/filter by event type, date, severity
  - Detail dialog with video playback, metadata, map location
  - Download option
- Data: `dashcam_media` table
- Edge function: `geotab-media-download`

#### Geotab Hub (`/instructor/geotab`)
- `GeotabOverviewTab` — vehicle health summary
- `GeotabTripHistory` — detailed trip log
- `GeotabDiagnosticsTab` / `GeotabDiagnosticCharts` — RPM, throttle, oil pressure, coolant temp charts
- `GeotabReportsTab` — generate PDF/CSV reports
- `TripDetailSheet` — vaul Drawer for trip investigation
- Edge functions: `geotab-status-data`, `geotab-trips`, `geotab-poller`

#### Vehicle Health (`/instructor/vehicle-health`)
- **Sub-tabs**: Fleet | Faults | Compliance | Mileage | Running Costs | Security
- `VehicleFleetCard` — vehicle card with status
- `AddVehicleDialog`, `EditVehicleDialog` — CRUD for `instructor_vehicles`
- `DeviceStatusCard` / `EnhancedDeviceStatusCard` — GPS device health
- `BatteryHistoryChart` — battery level over time
- `IgnitionEventsLog` — ignition on/off history
- `LiveTelemetryTab` — real-time vehicle data
- `ComplianceOverview` — MOT, insurance, tax due dates
- `MileageSummary` / `MileageLogList` — mileage tracking
- `RunningCostsTab` / `VehicleCostSummary` — cost analysis
- `SecurityAlertsTab` / `VehicleSecurityCard` — unauthorized movement
- `ServiceRemindersTab` / `AddServiceReminderDialog` — service scheduling
- Data: `instructor_vehicles`, `gps_devices`, `gps_battery_history`, `mileage_logs` tables

#### Routes (`/instructor/routes`)
- `SavedRoutesList` — saved teaching routes
- `SavedRoutePreview` — route visualization on map
- `RouteHeatmap` — driving skills heatmap
- `ShareRouteDialog` — share routes with pupils
- `RouteUploader` — upload GPX routes
- Data: `lesson_routes`, `saved_routes` tables
- Edge function: `snap-to-road`, `calculate-route-distance`

#### Lesson Route Recording
- `LessonRouteRecorder` — phone GPS recording
  - Native: Use `expo-location` with `watchPositionAsync`
  - Offline queue: Store points locally, sync when online
  - Haversine distance calculation
  - Jitter filtering (5m threshold)
- `LessonRouteViewer` — speed-colored route segments (green/amber/red)
- Data: `lesson_routes` table

#### Sat Nav (`/instructor/satnav`)
- `SatNavMap` — full-screen navigation view
- Uses Google Maps Directions API

#### Find My Car (`/instructor/find-my-car`)
- Shows last known vehicle position from `gps_devices`
- Walking directions to vehicle

#### Locations (`/instructor/locations`)
- `FavouriteLocationsList` — saved pickup/dropoff points
- `AddFavouriteLocationDialog` / `EditFavouriteLocationDialog`
- Categories: Home, Test Centre, School, Custom
- Data: `favourite_locations` table

#### Doodlepad / Jotter (`/instructor/doodlepad`)
- Map annotation tool (native: use `react-native-maps` + `react-native-canvas` or SVG overlay)
- Freehand lines, arrows, circles, text labels
- 6 colors, 4 line widths, undo/redo
- Geo-anchored annotations (persist as JSONB)
- Data: `doodlepads` table

### 3.4 MONEY TAB (`/instructor/pay`)

**Layout**: Finance dashboard
- **Hero**: `MoneyHeroCard` — total earnings display with gradient
- **Quick Stats**: `MoneyQuickStats` — 4 metric cards (Today, This Week, This Month, Outstanding)
- **Action Grid**: `MoneyActionGrid` — quick access buttons:
  - Take Payment, Record Expense, Send Invoice, View Reports
- **Charts**: `EarningsChart` — weekly/monthly earnings bar chart
- **Weekly Comparison**: `WeeklyComparisonBar` — vs last week
- **Recent Payments**: `RecentPaymentsCard` — latest transactions
- **Owes Money**: `OwesMoneyCard` — pupils with outstanding balances
- **Pupil Balances**: `PupilBalancesList` — all pupil account balances
- Data: `payment_history`, `pupils.account_balance`, `useDailyEarnings`, `useLastWeekComparison`

#### Take Payment (`TakePaymentSheet`)
- Select pupil, enter amount, choose method
- Methods: Cash, Bank Transfer, Square, Klarna, Clearpay, GoCardless, Elavon
- Square: Opens Square Checkout URL in in-app browser (`square-checkout` edge function)
- Records to `payment_history` table
- Updates `pupils.account_balance` via `increment_pupil_balance` RPC

#### Income (`/instructor/income`)
- `EarningsDashboard` — detailed earnings breakdown
- `EarningsCalculator` — hourly rate calculator
- `EarningsForecaster` — AI revenue predictions
- `EarningsSummaryStrip` — compact summary

#### Expenses (`/instructor/expenses`)
- `ExpenseTracker` — log business expenses
- `RecurringExpensesManager` — recurring expense automation
- `ExpenseCategoryChart` — spending by category (pie chart)
- Receipt photo upload to `expense-receipts` storage bucket
- AI receipt scanning via `extract-invoice-data` edge function
- Data: `instructor_expenses`, `expense_receipts` tables

#### Tax (`/instructor/tax`)
- `TaxYearReport` — annual tax summary
- Mileage allowance calculations
- Export options (CSV, PDF via `generate-pdf`)
- `AnnualBusinessReport` — comprehensive yearly report
- Data: aggregated from `payment_history`, `instructor_expenses`, `mileage_logs`

#### Fuel (`/instructor/fuel`)
- `FuelFinderCard` — nearby fuel prices (`get-fuel-prices` edge function)
- Fuel log entries with cost/litre, odometer
- MPG calculations
- Data: `fuel_log` table

#### Mileage (`/instructor/mileage`)
- `FleetMileageTracker` / `LessonMileageTracker`
- Auto-logged from GPS sessions (`auto_log_mileage` trigger)
- Manual entry with `AddMileageDialog`
- Business vs personal trip categorization
- Data: `mileage_logs` table

#### Month End (`/instructor/month-end`)
- `MonthEndReview` — comprehensive monthly audit
- Aggregates: earnings, lessons, tests, expenses, DVSA triggers
- Adjustable values with notes
- Export: CSV or direct sync to Xero/QuickBooks/FreeAgent/Sage
- `AccountingExport` / `AccountingSyncPanel`
- Edge functions: `accounting-sync`, `accounting-oauth`
- Data: `accounting_sync_log` table

#### In/Out (`/instructor/in-out`)
- Cash flow tracking
- Income vs expenditure comparison

#### Invoices
- `useInvoices` hook
- Generate and send invoices to pupils

#### Payment Reminders
- `SendPaymentReminderButton` — trigger SMS/email reminder
- Edge function: `send-payment-reminder`

#### Subscriptions (`/instructor/subscriptions`)
- `AddSubscriptionSheet` — track business subscriptions
- Monthly/annual cost tracking

### 3.5 PUPILS TAB (`/instructor/pupils`)

**Layout**: iOS-style list with search and filters
- **Header**: `IOSLargeTitle` — scroll-responsive large title
- **Search**: `IOSSearchBar` — animated search bar
- **Stats Strip**: 4 columns — Active, Passes, Lessons, On Hold
- **Filter Tabs**: Pill-style scrollable tabs — All, Active, Passed, On Hold, Inactive
- **Pupil Cards**: `PupilCardStack` / `ExpandablePupilCard`
  - Tap opens 95vh full-screen sheet (no swipe gestures)
  - Dark gradient hero with circular frosted-glass action buttons
  - 4-column stats strip
  - Test date countdown gradient banner

#### Pupil Profile (full-screen sheet)
**Tabs**: Overview | Lessons | Payments | Notes

##### Overview Tab
- Contact info (phone, email, address, postcode)
- Emergency contact
- Lesson statistics (total, completed, cancelled)
- Current syllabus progress (27 DVSA competencies)
- `DrivingSyllabus` — per-competency levels with color coding:
  - Introduced, Under Guidance, Prompted, Seldom Prompted, Independent
  - Instructor notes per competency
  - Category bulk toggles ("Set all")
- `SyllabusProgressChart` — visual progress
- `SyllabusRecommendations` — AI-suggested next skills
- Driving test history
- Assignments (`PupilAssignmentsPanel`)
- Reflective logs (`PupilReflectiveLogs`)
- Gamification stats (`PupilGamificationStats`)
- Milestone feed (`PupilMilestoneFeed`)

##### Lessons Tab
- `LessonHistory` — chronological lesson list
- Each lesson shows: date, time, duration, type, skills covered, notes
- Lesson route viewer if GPS data exists

##### Payments Tab
- `PupilPaymentHistory` — all transactions
- `PupilCreditBreakdown` — balance details
- `PupilPackageCard` — lesson packages
- `RecordPaymentModal` — record new payment
- `PupilRateEditor` — set per-pupil hourly rate
- Account balance display

##### Notes Tab
- Chronological notes list
- Add/edit/delete notes
- `VoiceLessonNotes` — voice-to-text note taking
- `LessonNotesTemplates` — note templates

#### Add Pupil
- `NewPupilChecklist` — onboarding flow
- Fields: name, phone, email, address, postcode, DOB, license number
- Transmission preference, lesson rate
- Emergency contact
- Terms & conditions signing (`TermsSignatureModal`, `SignaturePad`)
- Data: `pupils` table

#### Pupil Actions
- `QuickMessageSheet` — send SMS/message
- `SharePupilDetailsDialog` — share info
- `BroadcastMessageSheet` — bulk message all/filtered pupils
- `BulkSMSDialog` — bulk SMS
- `SendQuoteSheet` — send bookable quote
- `ScheduleLessonsDialog` — schedule lessons for pupil
- `PupilAvatarUpload` — upload pupil photo

#### End Lesson Wizard (`EndLessonWizard`)
5-step wizard (bottom sheets):
1. `StepSkills` — mark competencies covered, update levels
2. `StepLessonSummary` — lesson notes, mileage
3. `StepPayment` — collect/record payment
4. `StepBookNext` — schedule next lesson
5. `StepSummary` — final review and save

#### Pupil Progress Reports
- `PupilProgressReportGenerator` — formatted PDF/HTML report
- `PupilDrivingReport` — detailed driving analysis
- Edge function: `generate-pdf`

### 3.6 MORE TAB (`/instructor/menu`)

**Grid layout** of feature tiles linking to all secondary screens:

#### Messages & Communication
- **Messages** (`/instructor/messages`) — `InstructorInbox`, `ChatWindow`
  - Real-time messaging with pupils
  - `QuickReplySuggestions` — AI-generated quick replies (`generate-quick-replies`)
  - Typing indicators (`useTypingIndicator`)
  - Data: `conversations`, `messages` tables (realtime enabled)
- **Visitor Chats** (`/instructor/visitor-chats`) — `VisitorChatManager`
  - Website live chat management
  - Data: `live_chat_sessions`, `live_chat_messages`
- **Admin Chat** (`/instructor/admin-chat`) — `AdminChatWindow`
  - Direct messaging with platform admin
  - Data: `admin_conversations`, `admin_messages`
- **Notifications** (`/instructor/notifications`) — `InstructorNotificationsDropdown`
  - All notification types in one feed
  - Push notification settings (`PushNotificationSettings`)
  - Native: Register Expo push token via `expo_push_tokens` table

#### Driving Tests
- **Test Results** (`/instructor/test-results`)
  - `DrivingTestReportForm` — record test results
  - `TestResultsHistory` — historical results with filters
  - `CompetencySection` / `FaultRow` — DL25A-style fault marking
  - Mock test mode (hides official fields)
  - `ExaminerManager` / `ExaminerSelector`
  - Data: `driving_test_results`, `examiners` tables
- **Standards Check** (`/instructor/standards-check`)
  - `CompactStandardsCheck` — DVSA trigger metrics
  - Minor/Serious faults, Physical Action rate, Pass Rate
  - Rolling 12-month calculations
- **Test Requests** (`/instructor/test-requests`)
  - `TestRequestsTile` — pending test slot requests
  - Data: `learner_test_requests` table

#### Business Tools
- **Pipeline** (`/instructor/pipeline`)
  - `KanbanBoard` — drag-and-drop lead stages
  - `LeadCard` — lead details
  - `AddLeadSheet` — add new leads
  - Stages: New, Contacted, Qualified, Won, Lost
  - Data: `pipeline_leads` table
- **Automations** (`/instructor/automations`)
  - `AutomationBuilder` — create follow-up sequences
  - `AutomationCard` — manage existing automations
  - Data: `followup_templates` table
- **Gaps** (`/instructor/gaps`)
  - `GapsFiller` / `GapFillerCard` — find and fill schedule gaps
  - Send gap offers to suitable pupils via SMS
  - Edge function: `send-gap-sms`
  - Data: `gap_offers` table
- **Pending Scheduling** (`/instructor/pending-scheduling`)
  - Pupils needing lesson scheduling
  - `PendingSchedulingBadge`
- **Jobs** (`/instructor/jobs`)
  - `JobOfferAlert` — new pupil assignments from admin
  - Accept/reject job offers
  - Data: `instructor_jobs` table
- **Referrals** (`/instructor/referrals`)
  - `ReferralSettingsCard` — referral program management
  - Unique referral codes
  - Data: `pupil_referrals` table
- **Reviews** (`/instructor/reviews`)
  - View and manage pupil reviews
  - Data: `course_reviews` table

#### Planning & Resources
- **Todos** (`/instructor/todos`)
  - Personal task list
  - Data: `admin_todos` table
- **Notes** (`/instructor/notes`)
  - `useNotes` — personal instructor notes
  - Data: `instructor_notes` table
- **Plans** (`/instructor/plans`)
  - Subscription plan management
  - `PlanBadge` — current plan display
- **Resources** (`/instructor/resources`)
  - `TrainingResources` — uploaded training materials
  - Storage: `instructor-resources` bucket
- **Document Templates** (`/instructor/document-templates`)
  - Pre-built document templates
- **CPD** (`/instructor/cpd`)
  - `CPDLogManager` — Continuing Professional Development log
  - Activity types, hours, certificates
  - Data: `cpd_log_entries` table

#### Vehicle & Fleet
- **Vehicle Health** → see Track tab section
- **Fuel** → see Money tab section
- **Mileage** → see Money tab section
- **GPS Setup** (`/instructor/settings/gps`)
  - `HardwareTrackerSetup` — configure GPS devices
  - `GPSConnectionChecklist` — connectivity verification
  - `GPSgateSetupGuide` — GPSgate configuration
  - Link devices to vehicles
  - Data: `gps_devices` table

#### Health & Wellness (`/instructor/health`)
- **Blood Pressure**: `BloodPressureTracker` — log systolic/diastolic, classification
- **Blood Glucose**: `BloodGlucoseTracker` — fasting/post-meal, A1C estimation
- **Weight**: `WeightTracker` — kg/lbs/stones, BMI calculation
- **Hydration**: `WaterIntakeTracker` — daily water logging
- **Break Reminders**: `BreakReminderWidget` — smart break suggestions during 30+ min gaps
- **Health Tips**: `HealthTipsFeed` / `HealthTipCard`
- **Settings**: `HealthSettingsPanel`
- **Support Hub**: `SupportHub` — articles and resources
- **Instructor Forum**: `InstructorForum` — threaded community discussions
- Data: `instructor_health_logs`, `instructor_forum_topics`, `instructor_forum_replies`, `instructor_forum_alerts`
- Color palette: Rose/pink for health differentiation

#### Social
- **Nearby Friends** (`/instructor/nearby-friends`)
  - `NearbyFriendsMap` — see other instructors on map
  - `FriendRequestSheet` — send/accept friend requests
  - Data: `instructor_friends`, `useNearbyFriends`

#### Website Management
- **Mini Website** (`/instructor/website`)
  - `MiniWebsiteCMS` — edit instructor website pages
  - `MiniWebsiteThemeEditor` — customize colors/fonts
  - `MiniWebsiteShare` — share website link
  - Website pages: Home, About, Services, Reviews, Contact
  - Data: `instructor_website_pages`, `instructor_website_settings`
- **Domains** (`/instructor/domains`)
  - `DomainManagementCard` — custom domain management
  - `DomainCheckoutModal` — purchase domains
  - `DNSManagementPanel` — DNS configuration
  - `SSLStatusBadge` — SSL certificate status
  - Edge function: GoDaddy API integration
  - Data: `domain_orders` table

#### Settings (`/instructor/settings`)
- `AccountSettings` — profile, email, password
- `AppearanceSettings` — theme, colors, wallpaper
- `InstructorDetailsEditor` — business details
- `FeatureTogglesSettings` — enable/disable features
- `ReminderSettings` — lesson reminder preferences
- `ScheduledReportsSettings` — automated report scheduling
- `SmartBufferSettings` — travel buffer between lessons
- `PricingRulesSettings` — dynamic pricing rules
- `NoShowPolicySettings` — no-show fee settings
- `CancellationPolicyEditor` — cancellation terms
- `PaymentOptionsSettings` — payment gateway configuration
- `CommissionPayerSettings` — who pays platform fee
- `DepositSettingsEditor` — deposit requirements
- `BookingModeSelector` — booking mode (pupil choice / auto / instructor assigns)
- `IntakeQuestionsSettings` — custom booking questions
- `PupilBookingSettingsEditor` — pupil booking preferences
- `PupilAppBrandingEditor` — pupil portal branding
- `EmergencyContactEditor` — emergency contacts
- `CalendarShareSettings` — calendar sharing options
- `PushNotificationSettings` — notification preferences
- `DataExportManager` — GDPR data export
- `GDPRRetentionWidget` — data retention settings
- Data: `instructor_settings`, `instructor_booking_settings`, `instructor_working_hours`

#### Availability (`/instructor/availability`)
- `AvailabilityCalendar` — set working hours
- Day-by-day availability slots
- Date overrides for holidays
- Data: `instructor_working_hours`, `instructor_date_overrides`

#### End of Day (`/instructor/end-of-day`)
- `EndOfDaySummary` — daily wrap-up
- Edge function: `generate-eod-summary`

#### Weekly Report (`/instructor/weekly-report`)
- `WeeklyReportCard` — detailed weekly analysis
- Edge function: `generate-weekly-report`

#### Outstanding Tasks (`/instructor/outstanding-tasks`)
- `OutstandingTasksCard` — pending items requiring attention

#### SOS Emergency (`SOSEmergencySheet`)
- 3-tier escalation: "Please Call Me" → "Help — Call Me ASAP" → "SOS — Emergency"
- Captures GPS coordinates
- Converts to what3words (`convert-to-what3words` edge function)
- Broadcasts to nearby instructors and admin
- Data: `sos_alerts` table

---

## 4. COMPLETE EDGE FUNCTIONS REFERENCE

### AI / Content Generation (use Lovable AI — no API key needed)
| Function | Purpose | Model |
|----------|---------|-------|
| `generate-morning-briefing` | Daily briefing summary | Gemini 2.5 Flash |
| `generate-weekly-report` | Weekly business report | Gemini 2.5 Flash |
| `generate-eod-summary` | End-of-day summary | Gemini 2.5 Flash |
| `generate-business-insights` | Business analytics | Gemini 2.5 Flash |
| `generate-driving-insights` | Driving coaching tips | Gemini 2.5 Flash |
| `generate-driving-report` | Detailed driving analysis | Gemini 2.5 Flash |
| `generate-route-report` | Route analysis PDF | Gemini 2.5 Flash |
| `generate-lesson-plan` | AI lesson plans | Gemini 2.5 Flash |
| `generate-lesson-prep` | Pre-lesson preparation | Gemini 2.5 Flash |
| `generate-coaching-message` | Coaching messages | Gemini 2.5 Flash |
| `generate-nudges` | Smart follow-up nudges | Gemini 2.5 Flash |
| `generate-quick-replies` | Quick reply suggestions | Gemini 2.5 Flash |
| `extract-invoice-data` | Receipt OCR extraction | Gemini 2.5 Flash |

### Voice Pipeline
| Function | Purpose |
|----------|---------|
| `voice-stt` | Speech-to-text (ElevenLabs Scribe) |
| `voice-parse-intent` | Parse voice command intent |
| `voice-execute` | Execute parsed command |
| `voice-tts` | Text-to-speech (ElevenLabs) |

### Communication
| Function | Purpose |
|----------|---------|
| `send-push-notification` | Web Push + Expo Push |
| `send-payment-reminder` | Payment reminder SMS/email |
| `send-payment-receipt` | Payment receipt |
| `send-payment-confirmation` | Payment confirmation |
| `send-lesson-reminders` | Upcoming lesson reminders |
| `send-lesson-checkin` | Lesson check-in notification |
| `send-pupil-welcome` | Welcome message to new pupil |
| `send-pupil-otp` | Pupil OTP for auth |
| `send-parent-otp` | Parent portal OTP |
| `send-signing-link` | Remote T&C signing link |
| `send-gap-sms` | Gap offer SMS to pupils |
| `send-campaign` | Bulk campaign messages |
| `notify-instructor` | Internal instructor notification |
| `notify-pupil` | Pupil notification |
| `notify-lessons-scheduled` | Lesson scheduling confirmation |
| `notify-upsell-purchase` | Upsell purchase notification |
| `admin-email` | Admin email notifications |
| `weekly-backup-email` | Weekly data backup email |

### Payments
| Function | Purpose |
|----------|---------|
| `square-checkout` | Square Checkout session |
| `square-wallet-payment` | Square wallet (Apple/Google Pay) |
| `square-wallet-config` | Square wallet configuration |
| `square-booking-wallet-payment` | Booking wallet payment |
| `square-create-subscription` | Square subscription |
| `square-webhook` | Square webhook handler |
| `klarna-session` | Klarna payment session |
| `klarna-checkout` | Klarna checkout |
| `klarna-order` | Klarna order management |
| `clearpay-checkout` | Clearpay checkout |
| `clearpay-capture` | Clearpay capture |
| `elavon-checkout` | Elavon payment |
| `npi-checkout` | NPI/Cardstream checkout |
| `npi-hosted-fields` | NPI hosted fields |
| `cardstream-direct-sale` | Cardstream direct sale |
| `cardstream-hostedfields-init` | Cardstream hosted fields |
| `gocardless-create-billing-request` | GoCardless Direct Debit |
| `gocardless-webhook` | GoCardless webhook |
| `woocommerce-checkout` | WooCommerce checkout |
| `woocommerce-update-order` | WooCommerce order update |
| `payment-callback` | Payment callback handler |
| `payment-direct-sale` | Direct sale processing |
| `payment-health` | Payment gateway health check |
| `payment-intent-create` | Payment intent creation |
| `track-payment-link` | Track payment link clicks |
| `pupil-payment-checkout` | Pupil self-service payment |
| `process-recurring-subscriptions` | Recurring payment processing |
| `applepay-validate-merchant` | Apple Pay merchant validation |

### GPS & Telematics
| Function | Purpose |
|----------|---------|
| `geotab-poller` | Poll Geotab for device data |
| `geotab-trips` | Fetch Geotab trip history |
| `geotab-status-data` | Geotab diagnostic data |
| `geotab-media-download` | Download dashcam media |
| `quartix-trips` | Quartix trip history |
| `quartix-route` | Quartix route data |
| `snap-to-road` | Google Roads API snap-to-road |
| `calculate-route-distance` | Calculate route distance |
| `calculate-traffic-eta` | Traffic-aware ETA |
| `get-driving-alerts` | Road/traffic alerts |
| `get-instructor-location` | Instructor GPS position |

### Location & Mapping
| Function | Purpose |
|----------|---------|
| `geocode-postcode` | Postcode to lat/lng |
| `address-lookup` | Address search |
| `postcode-autocomplete` | Postcode suggestions |
| `google-places-autocomplete` | Google Places search |
| `google-places-details` | Place details |
| `get-google-maps-key` | Google Maps API key |
| `convert-to-what3words` | Lat/lng to what3words |
| `convert-from-what3words` | what3words to lat/lng |
| `get-nearby-instructors` | Nearby instructor search |
| `get-fuel-prices` | Nearby fuel prices |

### Booking & Enquiries
| Function | Purpose |
|----------|---------|
| `create-booking` | Process new booking |
| `create-enquiry` | New enquiry submission |
| `public-courses` | Public course listing |
| `process-cancellation-waitlist` | Waitlist processing |
| `process-automations` | Trigger automation rules |
| `assign-job` | Assign pupil to instructor |
| `check-deposit-reminders` | Deposit payment reminders |
| `check-travel-buffer` | Travel buffer validation |
| `check-compliance-reminders` | Compliance expiry alerts |
| `compliance-reminders` | Send compliance reminders |
| `scrape-test-slots` | DVSA test slot checker |

### Auth
| Function | Purpose |
|----------|---------|
| `pupil-email-auth` | Pupil email/password auth |
| `verify-pupil-otp` | Verify pupil OTP code |
| `verify-parent-otp` | Verify parent OTP code |
| `pupil-driver-api` | Pupil data API |
| `pupil-notes` | Pupil notes CRUD (proxy) |

### Documents & Reports
| Function | Purpose |
|----------|---------|
| `generate-pdf` | Server-side PDF generation |
| `fetch-dvsa-news` | DVSA news feed |
| `accounting-sync` | Accounting platform sync |
| `accounting-oauth` | Accounting OAuth flow |

### Calendar
| Function | Purpose |
|----------|---------|
| `google-calendar-service` | Google Calendar sync |
| `process-calendar-queue` | Process calendar sync queue |

### Hosting & Domains
| Function | Purpose |
|----------|---------|
| `twentyi-api` | 20i hosting API |

### Webhooks
| Function | Purpose |
|----------|---------|
| `twilio-webhook` | Twilio SMS webhook |

### AI Receptionist
| Function | Purpose |
|----------|---------|
| `ai-receptionist` | AI phone answering |

### Misc
| Function | Purpose |
|----------|---------|
| `get-vapid-key` | Web push VAPID key |
| `auto-payment-reminders` | Automated payment reminders |
| `award-achievement` | Gamification achievements |

---

## 5. COMPLETE DATABASE TABLES (100+)

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `instructors` | Instructor profiles | `auth_user_id`, `name`, `phone`, `email`, `postcode`, `profile_image_url`, `hourly_rate`, `transmission_type`, `adi_number`, `badge_number`, `license_expiry`, `wallpaper_color` |
| `pupils` | Pupil records | `instructor_id`, `name`, `phone`, `email`, `address`, `postcode`, `account_balance`, `course_status`, `lesson_rate`, `transmission_preference` |
| `pupil_credentials` | Pupil auth (separate for security) | `pupil_id`, `password_hash` |
| `scheduled_lessons` | All lessons | `instructor_id`, `pupil_id`, `lesson_date`, `start_time`, `end_time`, `duration_hours`, `lesson_type`, `status`, `pickup_address`, `dropoff_address`, `notes`, `payment_status` |
| `payment_history` | All payments | `pupil_id`, `instructor_id`, `amount`, `payment_method`, `notes`, `created_at` |

### Syllabus & Progress
| Table | Purpose |
|-------|---------|
| `pupil_competency_levels` | Per-pupil competency progress (27 DVSA skills) |
| `lesson_syllabus_updates` | Audit trail for skill changes |
| `pupil_assignments` | Homework/practice assignments |
| `pupil_reflective_logs` | Pupil self-reflection entries |

### Tests & Results
| Table | Purpose |
|-------|---------|
| `driving_test_results` | Test outcomes with DL25A fault marking |
| `examiners` | Test examiners database |
| `test_centres` | Test centre locations |
| `learner_test_requests` | Test slot requests |
| `theory_mock_results` | Theory test practice results |

### Vehicle & Telematics
| Table | Purpose |
|-------|---------|
| `instructor_vehicles` | Vehicle fleet |
| `gps_devices` | GPS tracking devices |
| `lesson_telematics` | GPS tracking sessions |
| `telematics_gps_points` | Raw GPS coordinates |
| `telematics_alerts` | Speed/brake/acceleration alerts |
| `telematics_motion_data` | Accelerometer data |
| `lesson_routes` | Recorded lesson routes |
| `saved_routes` | Saved teaching routes |
| `gps_battery_history` | Device battery levels |
| `driving_behavior_events` | Driving behaviour incidents |
| `dashcam_media` | Dashcam video/images |
| `geofences` | Geographic boundaries |
| `geofence_alerts` | Boundary crossing alerts |
| `driver_timesheets` | Daily driving summaries |

### Financial
| Table | Purpose |
|-------|---------|
| `instructor_expenses` | Business expenses |
| `expense_receipts` | Receipt images with OCR data |
| `fuel_log` | Fuel purchases |
| `mileage_logs` | Mileage records |
| `instructor_bank_details` | Bank details for payouts |
| `accounting_sync_log` | Accounting platform sync history |
| `instructor_subscriptions` | Business subscriptions tracking |

### Communication
| Table | Purpose |
|-------|---------|
| `conversations` | Instructor-pupil chat threads |
| `messages` | Chat messages (realtime) |
| `admin_conversations` | Admin chat threads |
| `admin_messages` | Admin chat messages |
| `live_chat_sessions` | Website visitor chats |
| `live_chat_messages` | Website chat messages |
| `expo_push_tokens` | Native push notification tokens |

### Booking & Business
| Table | Purpose |
|-------|---------|
| `course_enquiries` | New enquiry submissions |
| `enquiry_notes` | Notes on enquiries |
| `course_templates` | Course definitions |
| `instructor_courses` | Instructor-specific course pricing |
| `booking_upsells` | Add-on products |
| `booking_intake_questions` | Custom booking form questions |
| `booking_intake_answers` | Submitted answers |
| `discount_codes` | Promo codes |
| `gap_offers` | Schedule gap fill offers |
| `pipeline_leads` | Sales pipeline leads |
| `instructor_jobs` | Job offers from admin |
| `pupil_referrals` | Referral tracking |
| `instructor_booking_settings` | Booking configuration |
| `instructor_working_hours` | Availability schedule |
| `instructor_date_overrides` | Holiday/special date overrides |

### Settings & Configuration
| Table | Purpose |
|-------|---------|
| `instructor_settings` | General settings |
| `instructor_pricing_rules` | Dynamic pricing rules |
| `instructor_cancellation_rules` | Cancellation policies |
| `instructor_reminder_settings` | Reminder preferences |
| `instructor_feature_toggles` | Feature on/off switches |

### Content & Website
| Table | Purpose |
|-------|---------|
| `instructor_website_pages` | Mini website page content |
| `instructor_website_settings` | Website theme/branding |
| `domain_orders` | Custom domain purchases |
| `course_reviews` | Student reviews |
| `broadcast_templates` | Message templates |
| `followup_templates` | Automation templates |
| `followup_log` | Automation execution log |

### Health & Wellness
| Table | Purpose |
|-------|---------|
| `instructor_health_logs` | Health metric entries (BP, glucose, weight, water) |
| `instructor_forum_topics` | Community forum topics |
| `instructor_forum_replies` | Forum replies |
| `instructor_forum_alerts` | Forum notification alerts |

### Social
| Table | Purpose |
|-------|---------|
| `instructor_friends` | Friend connections |
| `favourite_locations` | Saved locations |
| `doodlepads` | Map annotations |

### Compliance & CPD
| Table | Purpose |
|-------|---------|
| `cpd_log_entries` | CPD activity log |
| `compliance_reminders` | Compliance alert history |
| `calendar_events` | Synced calendar events |
| `calendar_sync_queue` | Calendar sync job queue |

### Emergency
| Table | Purpose |
|-------|---------|
| `sos_alerts` | Emergency SOS alerts |

### Misc
| Table | Purpose |
|-------|---------|
| `data_audit_log` | All data change audit trail |
| `cron_sync_config` | Scheduled job configuration |
| `signing_tokens` | Remote signing tokens |
| `calendar_share_tokens` | Calendar sharing tokens |
| `pupil_otp_codes` | Pupil OTP codes |
| `parent_otp_codes` | Parent OTP codes |
| `pupil_terms_agreements` | T&C acceptance records |

---

## 6. DESIGN SYSTEM

### Color Palette (HSL)
```
Primary: 221 83% 53% (Royal Blue)
Primary Foreground: 210 40% 98%
Background: 0 0% 100%
Foreground: 222 84% 5%
Muted: 210 40% 96%
Accent: 210 40% 96%
Destructive: 0 84% 60%
Card: 0 0% 100%
Border: 214 32% 91%
```

### Dark Mode
```
Background: 222 84% 5%
Foreground: 210 40% 98%
Card: 222 84% 10%
Muted: 217 33% 17%
Border: 217 33% 17%
```

### Typography
- Headers: System font stack (SF Pro on iOS, Roboto on Android)
- Body: Same system font
- Monospace: For timers and stats (SF Mono / Roboto Mono)

### Component Patterns
- **Cards**: 20px border radius, multi-layer shadows, frosted glass effect
- **Bottom Sheets**: Vaul-style slide-up drawers → React Native: `@gorhom/bottom-sheet`
- **Tabs**: iOS segmented control style
- **Lists**: iOS-style grouped lists with separators
- **Badges**: Pill-shaped status indicators
- **FAB**: Floating action button, bottom-right, with haptic feedback
- **Animations**: Framer Motion → React Native: `react-native-reanimated`
- **Charts**: Recharts → React Native: `victory-native` or `react-native-chart-kit`
- **Maps**: Google Maps → React Native: `react-native-maps`
- **Currency**: Always £ (GBP) — never USD

### Layout Patterns
- Mobile-first (this IS the mobile app)
- Safe area padding: `react-native-safe-area-context`
- Bottom tab bar height: ~60px + safe area
- Header: Frosted glass with blur effect
- Pull-to-refresh on all list screens
- Skeleton loading states (`useSkeletonMorph`)

---

## 7. NATIVE-SPECIFIC ADAPTATIONS

### Web → Native Mapping
| Web Technology | Native Replacement |
|---|---|
| `localStorage` | `@react-native-async-storage/async-storage` |
| `navigator.geolocation` | `expo-location` |
| Web Speech API | `voice-stt` edge function + `expo-av` |
| `speechSynthesis` | `voice-tts` edge function + `expo-av` |
| Web Push (VAPID) | `expo-notifications` + `expo_push_tokens` table |
| `window.open()` | `expo-web-browser` or `Linking.openURL()` |
| `navigator.vibrate()` | `expo-haptics` |
| Screen Wake Lock | `expo-keep-awake` |
| File downloads | `expo-file-system` + `expo-sharing` |
| Camera/Gallery | `expo-image-picker` |
| Signature pad | `react-native-signature-canvas` |
| IndexedDB (offline) | `expo-sqlite` or MMKV |
| CSS animations | `react-native-reanimated` |
| Leaflet maps | `react-native-maps` |
| Recharts | `victory-native` |
| jsPDF | `generate-pdf` edge function (already done) |

### Push Notifications (Native)
1. On app launch: `await Notifications.getExpoPushTokenAsync()`
2. Store token: `INSERT INTO expo_push_tokens (instructor_id, token, platform)`
3. Backend sends via `send-push-notification` edge function (already supports Expo)

### Offline Support
- Cache lesson data, pupil list, and schedule using MMKV or AsyncStorage
- Queue mutations when offline, sync when reconnected
- GPS recording works offline (store points locally, batch upload)

### Biometric Auth
- `expo-local-authentication` for Face ID / Fingerprint
- Store session refresh token in `expo-secure-store`

---

## 8. REALTIME SUBSCRIPTIONS

These tables have realtime enabled — subscribe for live updates:
```typescript
supabase.channel('messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handler)
supabase.channel('scheduled_lessons').on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_lessons' }, handler)
supabase.channel('admin_messages').on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages' }, handler)
supabase.channel('gps_devices').on('postgres_changes', { event: '*', schema: 'public', table: 'gps_devices' }, handler)
supabase.channel('sos_alerts').on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, handler)
```

---

## 9. KEY HOOKS TO RECREATE

All hooks connect to the Supabase tables/functions listed. Recreate each as a React Native hook:

### Dashboard
`useInstructorLiveStats`, `useDailyEarnings`, `useTodayOverview`, `useNextLessonDetails`, `useTomorrowPreview`, `useTomorrowWeather`, `useInstructorStreak`, `useWeeklyGoals`, `useMonthlyGoals`, `usePupilRetentionAlerts`, `useRealGapSlots`, `useCombinedNotificationCount`, `useInstructorNotifications`, `useUrgentAlerts`

### Schedule
`useInstructorCalendar`, `useLessonTravelTimes`, `useRunningLateDetection`, `useLessonEndAlert`, `useGoogleServiceCalendar`, `useTodayRemainingLessons`

### Tracking
`useActiveSession`, `useActiveTra ckingPupils`, `useLivePupilPositions`, `useGPSConnectionStatus`, `useGPSAutoReconnect`, `useTripReplay`, `useInterpolatedPosition`, `useGeotabTrips`, `useGeotabStatusData`, `useGPSgateTrips`, `useDeviceTelemetryHistory`, `useLessonRouteRecorder`, `useLessonRouteAutoCapture`, `useTrafficETA`, `useInstructorEnRouteETA`, `useInstructorLastPosition`, `useTodayRoute`

### Money
`useDailyEarnings`, `useLastWeekComparison`, `useProfitAnalysis`, `useRunningCosts`, `usePaymentInvalidation`, `usePaymentGatewayHealth`, `usePupilPaymentStatus`, `useInvoices`, `useFuelLog`, `useFuelPrices`, `useMileageLogs`, `useAccountingConnection`

### Pupils
`useMessaging`, `useNotes`, `usePupilAssignments`, `usePupilUnreadCount`, `useUnreadMessagesCount`, `useChatNotifications`

### Vehicle
`useVehicleHealth`, `useVehicleSecurity`, `useVehicleService`, `useDrivingAlerts`, `useDrivingInsights`, `useDriverTimesheets`

### Health
`useInstructorHealth`, `useBreakReminders`

### Social
`useInstructorFriends`, `useNearbyFriends`

### Voice
`useVoiceAssistant`, `useVoiceCommands`, `useVoiceRecognition`, `useVoiceToText`

### Misc
`useInstructorProfile`, `useInstructorAppearance`, `useInstructorTilePreferences`, `useInstructorTodos`, `useOfflineData`, `useOfflineSync`, `useOfflineGPSQueue`, `usePushNotifications`, `useMenuFeatureGates`, `useGapSuggestions`, `useWaitlistMatching`, `useCancellationRequests`, `useTestSwapNotifications`, `usePendingJobsCount`

---

## 10. CRITICAL BUSINESS RULES

1. **Currency**: Always £ GBP — never show $ or €
2. **Multi-tenant isolation**: Every query MUST filter by `instructor_id`
3. **Balance updates**: Use `increment_pupil_balance` RPC (atomic, prevents race conditions)
4. **Soft delete**: Never hard-delete pupil or lesson records
5. **Audit trail**: Log all changes to `data_audit_log`
6. **Lesson types**: Standard, Mock Test, Test Day, Assessment, Motorway, Refresher, Pass Plus, Extended Test, Intensive
7. **Payment methods**: Cash, Bank Transfer, Square, Klarna, Clearpay, GoCardless, Elavon, NPI, WooCommerce
8. **Competency levels**: Introduced → Under Guidance → Prompted → Seldom Prompted → Independent
9. **Time format**: 24-hour (e.g., 14:30)
10. **Date format**: DD/MM/YYYY (UK format)
11. **Distance**: Miles for display, km stored in database
12. **Speed**: mph for display, km/h stored in database

---

## 11. STORAGE BUCKETS

| Bucket | Public | Purpose |
|--------|--------|---------|
| `instructor-images` | Yes | Profile photos |
| `pupil-avatars` | Yes | Pupil photos |
| `expense-receipts` | Yes | Receipt photos |
| `course-videos` | Yes | Course content |
| `chat-attachments` | Yes | Chat media |
| `hero-images` | Yes | Website hero images |
| `marketing-images` | Yes | Marketing content |
| `signatures` | No | T&C signatures |
| `lesson-videos` | No | Lesson recordings |
| `instructor-resources` | No | Training materials |

Upload via: `supabase.storage.from('bucket-name').upload(path, file)`

---

## 12. PDF GENERATION

All PDF reports are generated server-side via the `generate-pdf` edge function.

```typescript
const { data } = await supabase.functions.invoke('generate-pdf', {
  body: { reportType: 'earnings', instructorId, dateRange }
});
// data.pdf_base64 — decode and save/share using expo-file-system + expo-sharing
```

Report types: `earnings`, `progress`, `mileage`, `tax`

---

## 13. VOICE CONTROL ("Hey ED")

Native implementation:
1. **Recording**: Use `expo-av` Audio.Recording
2. **STT**: Send audio to `voice-stt` edge function (ElevenLabs Scribe)
3. **Intent**: Send text to `voice-parse-intent` edge function
4. **Execute**: Send intent to `voice-execute` edge function
5. **TTS**: Receive audio from `voice-tts` edge function, play with `expo-av`

Supported commands: "Schedule a lesson", "How much did I earn today", "Message [pupil name]", "Start tracking", "Find my car", "What's my next lesson", etc.

---

This prompt covers every screen, component, edge function, database table, hook, design token, and business rule in the EveryDriver instructor app. Build each section iteratively, starting with Auth → Home → Schedule → Pupils → Money → Track → More menu features.
