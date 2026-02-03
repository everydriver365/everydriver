

# Feature Enhancement Plan

This plan covers 11 significant enhancements to the EveryDriver platform, organized by priority and complexity. Each feature builds on existing infrastructure where possible.

---

## 1. GPS Auto-Reconnect

**What it does:** Automatically attempts to restore GPS connection when it drops, with visual feedback and smart retry logic.

**Current State:**
- `useGPSConnectionStatus` hook polls every 30 seconds
- `GPSConnectionStatusCard` shows current status
- No automatic reconnection attempts

**Implementation:**
- Add exponential backoff retry logic to `useGPSConnectionStatus`
- Create a `useGPSAutoReconnect` hook with:
  - Automatic retry on disconnect (1s, 2s, 4s, 8s, max 30s intervals)
  - Wake lock API to prevent device sleep during active sessions
  - Push notification when connection is restored or fails after 5 attempts
- Add "Reconnecting..." state to the status card with animated indicator
- Store last successful connection timestamp for debugging

**New Files:**
- `src/hooks/useGPSAutoReconnect.ts`

**Modified Files:**
- `src/hooks/useGPSConnectionStatus.ts` - Add reconnection logic
- `src/components/instructor/GPSConnectionStatusCard.tsx` - Add reconnecting state

---

## 2. Offline Mode Enhancement

**What it does:** Expands offline capabilities to support full lesson management, GPS point queuing, and background sync.

**Current State:**
- IndexedDB storage in `src/lib/offlineStorage.ts` with stores for schedules, pupils, lessonHistory, syncQueue
- `useOfflineSync` hook handles basic caching and sync
- `OfflineSyncIndicator` component shows status

**Implementation:**
- Extend IndexedDB stores to include:
  - `gpsPoints` - Store GPS data when offline for later upload
  - `lessonNotes` - Cache lesson feedback and notes
  - `paymentQueue` - Queue payment records for sync
- Add Service Worker background sync using the Background Sync API
- Create offline-first lesson completion flow
- Add storage usage indicator (current vs quota)
- Implement conflict resolution for simultaneous edits

**New Files:**
- `src/hooks/useOfflineGPSQueue.ts`
- `src/lib/backgroundSync.ts`

**Modified Files:**
- `src/lib/offlineStorage.ts` - Add new stores
- `src/hooks/useOfflineSync.ts` - Add GPS point queuing
- `public/sw.js` - Add background sync handler

---

## 3. Speed Limit Caching

**What it does:** Caches speed limits locally to reduce API calls and enable offline speed limit display.

**Current State:**
- `gpsgate-poller` fetches speed limits from OSM Overpass API
- In-memory cache with 5-minute TTL (`speedLimitCache` Map)
- Speed limits stored in `telematics_gps_points.speed_limit_kmh`

**Implementation:**
- Create IndexedDB store for speed limit grid cache
- Pre-fetch speed limits for instructor's common routes
- Add "Favorite Routes" speed limit pre-caching
- Implement persistent cache with 30-day expiry
- Add cache warming on app startup for today's scheduled routes
- Create admin endpoint to bulk-update speed limits from OSM

**New Files:**
- `src/lib/speedLimitCache.ts`
- `src/hooks/useSpeedLimitCache.ts`

**Database Changes:**
- Create `speed_limit_cache` table with grid coordinates, limit, road name, and expiry

---

## 4. Widget Support (iOS/Android Home Screen)

**What it does:** Provides native-like home screen widgets showing next lesson, today's earnings, and GPS status.

**Current State:**
- PWA configured in `vite.config.ts`
- Capacitor ready (app ID: `app.lovable.ca10d01ecc994c0b9186351c493398b9`)

**Implementation:**
- For PWA: Use the Badging API to show unread count on app icon
- For Capacitor:
  - Add `@capacitor/app` and `@nicholasaziz/capacitor-widgets` plugins
  - Create data provider endpoint for widget content
  - Build three widget types:
    1. **Next Lesson** - Time, pupil name, location
    2. **Today's Stats** - Lessons, hours, earnings
    3. **GPS Status** - Connected/Offline with quick launch

**New Files:**
- `src/capacitor/widgets/NextLessonWidget.ts`
- `src/capacitor/widgets/TodayStatsWidget.ts`
- `supabase/functions/widget-data/index.ts`

**Modified Files:**
- `capacitor.config.json` - Add widget configuration

---

## 5. Siri/Google Assistant Integration

**What it does:** Enables voice commands like "Hey Siri, start tracking" or "OK Google, what's my next lesson?"

**Current State:**
- `useVoiceCommands` hook uses Web Speech API for in-app voice control
- Supports commands like "Start tracking", "Show speed"

**Implementation:**
- For iOS (Siri Shortcuts):
  - Add `@nicholasaziz/siri-shortcuts` Capacitor plugin
  - Register intents: StartTracking, StopTracking, NextLesson, TodaySchedule
  - Create App Intents handler
- For Android (Google Assistant):
  - Add `actions.xml` for Google Assistant App Actions
  - Register deep links: everydriver://tracking/start, everydriver://lesson/next
- Create unified voice intent handler

**New Files:**
- `src/capacitor/voice/SiriIntents.ts`
- `android/app/src/main/res/xml/actions.xml`
- `ios/App/Intents/TrackingIntent.intentdefinition`

---

## 6. Fuel Cost Tracking Enhancement

**What it does:** Comprehensive fuel tracking with fill-up logging, cost-per-mile trends, and fuel efficiency alerts.

**Current State:**
- `useFuelPrices` fetches nearby station prices from CMA data
- `useRunningCosts` calculates fuel costs based on MPG and distance
- Instructor settings store `vehicle_mpg` and `fuel_cost_per_litre`

**Implementation:**
- Create fuel fill-up log:
  - Litres filled, price per litre, station, odometer reading
  - Calculate actual MPG from fill-to-fill
  - Receipt photo capture and OCR (optional)
- Add fuel cost tracking dashboard:
  - Weekly/monthly fuel spend charts
  - Actual vs estimated MPG comparison
  - Fuel efficiency trend alerts
- Auto-suggest fill-up when near cheapest station and tank estimate is low

**New Files:**
- `src/pages/InstructorFuelLog.tsx`
- `src/components/instructor/FuelFillUpDialog.tsx`
- `src/hooks/useFuelLog.ts`

**Database Changes:**
- Create `fuel_log` table (instructor_id, date, litres, price_per_litre, total_cost, odometer_reading, station_name, receipt_url)

---

## 7. Invoice Generation

**What it does:** Generate and send professional PDF invoices to pupils or parents.

**Current State:**
- `payment_history` table tracks payments
- `send-payment-receipt` edge function sends receipt emails
- jsPDF and jspdf-autotable are installed

**Implementation:**
- Create invoice generator:
  - Professional PDF template with instructor branding
  - Itemized lesson list with dates, times, rates
  - Payment terms and bank details
  - HMRC-compliant format
- Add invoice workflow:
  - Auto-generate monthly invoices for block bookings
  - Email/SMS delivery options
  - Payment status tracking (Sent, Viewed, Paid)
- Create invoice history view

**New Files:**
- `src/pages/InstructorInvoices.tsx`
- `src/components/instructor/InvoiceGenerator.tsx`
- `src/lib/invoicePDF.ts`
- `supabase/functions/send-invoice/index.ts`

**Database Changes:**
- Create `invoices` table (id, instructor_id, pupil_id, invoice_number, items, total, status, due_date, sent_at, paid_at)

---

## 8. Profit Margin Calculator

**What it does:** Calculate actual profit after all expenses for each lesson, day, week, or month.

**Current State:**
- `useRunningCosts` calculates fuel costs
- `instructor_expenses` table stores expenses
- `recurring_expenses` table for monthly costs

**Implementation:**
- Create profit calculator that combines:
  - Gross lesson income
  - Minus: Fuel costs (from mileage and MPG)
  - Minus: Vehicle expenses (insurance, maintenance, MOT)
  - Minus: Business expenses (phone, marketing, ADI badge)
  - Equals: Net profit
- Add per-lesson profit display
- Create hourly rate breakdown (real vs advertised)
- Add "What if" calculator (adjust rates to see impact)
- Weekly/monthly profit trends with alerts for low-margin days

**New Files:**
- `src/pages/InstructorProfitCalculator.tsx`
- `src/hooks/useProfitAnalysis.ts`
- `src/components/instructor/ProfitBreakdownCard.tsx`

---

## 9. Pre-Lesson Checklist

**What it does:** Customizable checklist for pupils to complete before each lesson.

**Current State:**
- `PupilTestInfo.tsx` has a test-day checklist
- `InstructorSetupChecklist` exists for instructor onboarding

**Implementation:**
- Create pre-lesson checklist system:
  - Default items: Provisional licence, glasses, appropriate shoes
  - Instructor-customizable items per pupil
  - Completion confirmation required before lesson starts
- Push notification reminder 1 hour before lesson
- Checklist completion status visible to instructor
- First-lesson vs returning pupil checklists

**New Files:**
- `src/components/pupil-portal/PreLessonChecklist.tsx`
- `src/hooks/usePreLessonChecklist.ts`
- `src/components/instructor/PupilChecklistSettings.tsx`

**Database Changes:**
- Create `pre_lesson_checklist_templates` table (instructor_id, items, is_first_lesson)
- Create `pre_lesson_checklist_completions` table (lesson_id, pupil_id, completed_items, completed_at)

---

## 10. Automated Follow-Ups

**What it does:** Smart automated messages for inactive pupils, lesson feedback, and booking prompts.

**Current State:**
- `send-lesson-reminders` edge function sends reminders
- `promotional_messages` table exists
- `instructor_reminder_preferences` controls notification channels

**Implementation:**
- Create follow-up automation engine:
  - **Post-lesson feedback request** - 2 hours after lesson ends
  - **Re-engagement** - "We miss you!" after 14 days inactive
  - **Test prep** - Countdown reminders 4 weeks before test date
  - **Booking prompt** - "Time for your next lesson?" after 7 days
- Add template customization per instructor
- Create follow-up analytics (open rates, booking conversions)
- Unsubscribe/frequency preferences for pupils

**New Files:**
- `supabase/functions/send-automated-followups/index.ts`
- `src/pages/InstructorAutomations.tsx`
- `src/components/instructor/FollowUpTemplateEditor.tsx`

**Database Changes:**
- Create `followup_templates` table (instructor_id, trigger_type, delay_hours, sms_template, email_template, enabled)
- Create `followup_log` table (template_id, pupil_id, sent_at, opened_at, booked_at)

---

## 11. Churn Detection

**What it does:** AI-powered identification of pupils at risk of leaving, with recommended retention actions.

**Current State:**
- `useInstructorStreak` tracks instructor activity
- Lesson history and booking patterns are available
- No churn analysis exists

**Implementation:**
- Create churn risk scoring based on:
  - Days since last lesson
  - Lesson frequency trend (decreasing?)
  - Cancellation rate
  - Progress rate (syllabus completion)
  - Payment delays
  - Message response times
- Add risk dashboard showing:
  - High/Medium/Low risk pupils
  - Recommended actions ("Offer discount", "Personal call", "Check-in message")
  - Retention success tracking
- Create automated "At Risk" alerts to instructor

**New Files:**
- `src/hooks/useChurnRisk.ts`
- `src/components/instructor/ChurnRiskDashboard.tsx`
- `src/pages/InstructorRetention.tsx`
- `supabase/functions/calculate-churn-risk/index.ts`

**Database Changes:**
- Create `pupil_churn_scores` table (pupil_id, risk_score, risk_factors, calculated_at, recommended_actions)

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | GPS Auto-Reconnect | Low | High |
| 2 | Pre-Lesson Checklist | Medium | Medium |
| 3 | Offline Mode Enhancement | High | High |
| 4 | Speed Limit Caching | Medium | Medium |
| 5 | Fuel Cost Tracking | Medium | Medium |
| 6 | Automated Follow-Ups | Medium | High |
| 7 | Invoice Generation | Medium | High |
| 8 | Churn Detection | High | High |
| 9 | Profit Margin Calculator | Medium | Medium |
| 10 | Widget Support | High | Medium |
| 11 | Siri/Google Assistant | High | Low |

---

## Technical Notes

**Capacitor Dependencies Required:**
```json
{
  "@capacitor/app": "^6.0.0",
  "@nicholasaziz/capacitor-widgets": "^1.0.0",
  "@nicholasaziz/siri-shortcuts": "^1.0.0"
}
```

**Edge Function Secrets Needed:**
- No new secrets required (uses existing Twilio, Resend, Supabase)

**Database Migrations:**
- 5 new tables across features
- All with appropriate RLS policies for instructor-level access

