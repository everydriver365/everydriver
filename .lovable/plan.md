
# Implementation Plan: 8 Major Feature Enhancements

This plan covers the implementation of 8 feature enhancements to transform the driving instructor platform with offline capabilities, AI insights, voice notes, self-booking, fleet management, video clips, theory tracking, and automated referrals.

---

## Overview

| Feature | Description | Priority |
|---------|-------------|----------|
| 1. Offline Mode & PWA | Cache schedules, pupil data; queue offline changes | High |
| 2. AI Driving Insights | Analyze telemetry for personalized coaching tips | High |
| 5. Voice Lesson Notes | Hands-free dictation using Web Speech API | High |
| 6. Pupil Self-Booking | Pupils book available slots directly | Medium |
| 7. Multi-Car/Fleet | Assign vehicles to lessons, fleet dashboard | Medium |
| 8. Video Dashcam | Upload and link video clips to trips | Medium |
| 9. Theory Test Tracking | Track mock test scores, expanded questions | Medium |
| 10. Referral Automation | Auto-award points via database triggers | Medium |

---

## Phase 1: Core Enhancements

### Feature 1: Offline Mode & PWA Enhancements

**What it does:** Allows instructors to view schedules, pupil details, and add lesson notes even with no mobile signal.

**Database Changes:**
```text
NEW TABLE: offline_sync_queue
- id (uuid, primary key)
- instructor_id (uuid, references instructors)
- action_type (text) -- 'insert', 'update', 'delete'
- table_name (text) -- target table
- record_id (uuid) -- affected record
- payload (jsonb) -- data to sync
- created_at (timestamptz)
- synced_at (timestamptz, nullable)
- error (text, nullable)
```

**New Files:**
- `src/hooks/useOfflineSync.ts` - Queue management, sync on reconnection
- `src/hooks/useOfflineData.ts` - IndexedDB read/write utilities
- `src/lib/offlineStorage.ts` - IndexedDB schema and operations
- `src/components/pwa/OfflineSyncIndicator.tsx` - Shows pending sync count

**Modifications:**
- `vite.config.ts` - Expand workbox config to precache critical API routes
- `public/sw.js` - Add background sync and IndexedDB caching
- `src/components/instructor/OfflineIndicator.tsx` - Show pending changes count

**Data Cached Offline:**
- Today's and tomorrow's schedule
- Active pupils list (name, phone, address)
- Last 7 days of lesson history
- Instructor profile and settings

---

### Feature 2: AI-Powered Smart Driving Insights

**What it does:** Analyzes GPS telemetry data from `telematics_gps_points` to generate personalized coaching tips for each pupil.

**New Edge Function:** `generate-driving-insights`

```text
Location: supabase/functions/generate-driving-insights/index.ts

Inputs:
- pupilId (required)
- instructorId (required)
- sessionCount (optional, default 5)

Process:
1. Fetch last N telematics sessions for pupil
2. Aggregate from telematics_gps_points:
   - Speed compliance rate (points over limit / total)
   - Harsh braking events (speed drop > 15 km/h in 2s)
   - Average speed by road type
   - Speeding duration totals
3. Call Lovable AI (gemini-3-flash-preview) with driving data
4. Return structured coaching insights

Output:
{
  overallScore: number,
  strengths: string[],
  areasToImprove: string[],
  coachingTips: [{ priority: "high"|"medium", tip: string, evidence: string }],
  weeklyTrend: "improving" | "steady" | "declining"
}
```

**New Frontend Components:**
- `src/components/instructor/DrivingInsightsCard.tsx` - Displays AI tips on pupil detail
- `src/hooks/useDrivingInsights.ts` - Fetches and caches insights

**Integration Points:**
- Add `DrivingInsightsCard` to pupil detail/tracking pages
- Show trend indicators on pupil list

---

### Feature 5: Voice-First Lesson Notes

**What it does:** Enables hands-free voice dictation of lesson feedback using the browser's Web Speech API.

**New Files:**
- `src/components/instructor/VoiceLessonNotes.tsx` - Main voice input component
- `src/hooks/useVoiceRecognition.ts` - Web Speech API wrapper

**Component Features:**
- Large microphone button for easy touch
- Real-time transcription display
- Edit before saving capability
- Fallback to text input if Speech API unavailable

**Technical Implementation:**
```text
VoiceLessonNotes Component:
- Uses webkitSpeechRecognition / SpeechRecognition API
- continuous = true for ongoing dictation
- interimResults = true for real-time feedback
- Auto-punctuation via AI post-processing (optional)
```

**Integration Points:**
- Add to `TripSummarySheet.tsx` as "Add Voice Notes" button
- Add to lesson completion flow in `InstructorLiveSession.tsx`
- Store in `lesson_history.notes` field

---

## Phase 2: Booking & Fleet

### Feature 6: Pupil Self-Booking

**What it does:** Allows pupils to view available slots and book lessons directly from their portal.

**Database Changes:**
```text
NEW TABLE: instructor_booking_settings
- id (uuid, primary key)
- instructor_id (uuid, unique, references instructors)
- allow_self_booking (boolean, default false)
- require_approval (boolean, default true)
- min_notice_hours (integer, default 24)
- max_advance_days (integer, default 14)
- allowed_durations (integer[], default {60, 90, 120})
- booking_message (text, nullable) -- shown to pupils
- created_at (timestamptz)
- updated_at (timestamptz)

MODIFY TABLE: scheduled_lessons
- ADD COLUMN booking_status (text) -- 'confirmed', 'pending_approval', 'rejected'
```

**New Files:**
- `src/components/pupil-portal/SelfBookingCalendar.tsx` - Week view with available slots
- `src/components/pupil-portal/BookingConfirmation.tsx` - Booking confirmation dialog
- `src/components/instructor/SelfBookingSettings.tsx` - Enable/configure self-booking
- `src/components/instructor/PendingBookingsView.tsx` - Approve/reject pending bookings
- `src/hooks/useAvailableSlots.ts` - Calculate open slots from availability + existing bookings

**Booking Flow:**
```text
Pupil opens portal → Book Lesson tab
  ↓
Calendar shows available slots (based on instructor availability minus booked)
  ↓
Pupil selects slot + duration → Confirm booking
  ↓
If require_approval: Creates lesson with booking_status='pending_approval'
  → Instructor notified → Approve/Reject
If auto-approve: Creates confirmed lesson immediately
```

---

### Feature 7: Multi-Car/Fleet Support

**What it does:** Extends existing `instructor_vehicles` system to assign vehicles to lessons.

**Database Changes:**
```text
MODIFY TABLE: scheduled_lessons
- ADD COLUMN vehicle_id (uuid, nullable, references instructor_vehicles)

MODIFY TABLE: instructor_vehicles
- ADD COLUMN assigned_instructor_id (uuid, nullable) -- for multi-instructor schools
- ADD COLUMN color_code (text) -- for calendar color-coding
```

**New/Modified Files:**
- `src/components/instructor/VehicleSelector.tsx` - Dropdown for lesson vehicle selection
- Modify `AddLessonSheet.tsx` - Add vehicle selector
- Modify `FleetManager.tsx` - Show vehicle assignments calendar
- `src/components/instructor/FleetMapView.tsx` - All vehicles on single map

**Features:**
- Vehicle picker when scheduling lessons
- Calendar color-coding by vehicle
- Fleet overview showing all vehicle locations
- Per-vehicle expense and mileage reports

---

## Phase 3: Video & Gamification

### Feature 8: Video Dashcam Integration

**What it does:** Allows instructors to upload and link video clips to specific trips for pupil review.

**Database Changes:**
```text
NEW TABLE: lesson_video_clips
- id (uuid, primary key)
- telematics_id (uuid, references lesson_telematics)
- instructor_id (uuid, references instructors)
- pupil_id (uuid, nullable, references pupils)
- video_url (text, not null) -- Supabase Storage URL
- thumbnail_url (text, nullable)
- duration_seconds (integer, nullable)
- clip_start_seconds (integer, default 0)
- clip_end_seconds (integer, nullable)
- instructor_note (text, nullable)
- clip_type (text, default 'general') -- 'good_practice', 'needs_work', 'highlight'
- gps_point_id (uuid, nullable, references telematics_gps_points)
- is_shared_with_pupil (boolean, default false)
- created_at (timestamptz)

RLS: Instructor can manage own clips; Pupil can view shared clips
```

**Storage Bucket:**
- Create `lesson-videos` bucket (private)
- Path structure: `{instructor_id}/clips/{date}/{clip_id}.mp4`
- Max upload: 100MB per clip
- Supported formats: MP4, MOV, WebM

**New Files:**
- `src/components/instructor/VideoClipUploader.tsx` - Upload with progress
- `src/components/instructor/VideoClipPlayer.tsx` - Playback with notes overlay
- `src/components/instructor/VideoClipGallery.tsx` - Browse clips for a trip
- `src/components/pupil-portal/PupilVideoGallery.tsx` - View shared clips

**Integration:**
- Add "Add Video" button to `TripSummarySheet.tsx`
- Show video icons on `TripReplayMap` at clip GPS locations
- List clips in pupil portal under lesson replay

**How Video Upload Works:**
```text
1. Instructor opens Trip Summary after lesson
2. Taps "Add Video Clip" button
3. Selects video from device (camera roll or files)
4. Video uploads to Supabase Storage with progress indicator
5. On completion: creates lesson_video_clips record
6. Instructor adds optional note and timestamp marker
7. Toggles "Share with pupil" if desired
8. Pupil sees clip in their portal's "Lesson Replay" section
```

---

### Feature 9: Theory Test Integration

**What it does:** Tracks mock theory test attempts and expands the question bank.

**Database Changes:**
```text
NEW TABLE: theory_test_attempts
- id (uuid, primary key)
- pupil_id (uuid, references pupils)
- instructor_id (uuid, references instructors)
- test_type (text) -- 'quick_5', 'mock_50', 'hazard_perception'
- total_questions (integer)
- correct_answers (integer)
- time_taken_seconds (integer, nullable)
- passed (boolean)
- weak_categories (jsonb) -- ['road_signs', 'stopping_distances']
- created_at (timestamptz)

NEW TABLE: theory_questions
- id (uuid, primary key)
- category (text) -- 'road_signs', 'rules', 'hazards', etc.
- question (text)
- options (jsonb) -- array of answer options
- correct_index (integer)
- explanation (text, nullable)
- difficulty (text) -- 'easy', 'medium', 'hard'
- is_active (boolean, default true)
- created_at (timestamptz)
```

**Modifications:**
- Expand `PupilPortalTheory.tsx`:
  - Load questions from database instead of hardcoded
  - Show score history chart
  - Highlight weak categories
  - Track attempts in `theory_test_attempts`

**New Components:**
- `src/components/pupil-portal/TheoryProgressChart.tsx` - Score trends
- `src/components/instructor/PupilTheoryProgress.tsx` - View pupil's theory progress

---

### Feature 10: Referral & Loyalty Automation

**What it does:** Automates the existing referral system with database triggers for instant reward points.

**Database Changes:**
```text
NEW TABLE: reward_redemptions
- id (uuid, primary key)
- pupil_id (uuid, references pupils)
- instructor_id (uuid, references instructors)
- points_spent (integer)
- reward_type (text) -- 'free_lesson', 'discount', 'merchandise'
- reward_value (numeric) -- monetary value
- status (text) -- 'pending', 'approved', 'redeemed', 'rejected'
- notes (text, nullable)
- created_at (timestamptz)
- processed_at (timestamptz, nullable)

DATABASE FUNCTION: award_referral_bonus()
- Triggers when pupil_referrals.status changes to 'completed'
- Awards 100 points to referrer_pupil_id
- Updates bonus_points_awarded on the referral record
- Creates notification for referrer

DATABASE TRIGGER: on pupil_referrals UPDATE
- Calls award_referral_bonus() when status changes
```

**Modifications:**
- `ReferralCard.tsx` - Add "Redeem Points" button
- `RewardTiersDisplay.tsx` - Show redeemable rewards

**New Components:**
- `src/components/pupil-portal/RedeemPointsSheet.tsx` - Redemption flow
- `src/components/instructor/PendingRedemptions.tsx` - Approve redemptions

**Trigger Logic:**
```sql
CREATE OR REPLACE FUNCTION award_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    -- Award points to referrer
    UPDATE pupils 
    SET reward_points = COALESCE(reward_points, 0) + 100
    WHERE id = NEW.referrer_pupil_id;
    
    -- Record points awarded
    NEW.bonus_points_awarded := 100;
    
    -- Create notification (via separate notify table or function)
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_referral_complete
BEFORE UPDATE ON pupil_referrals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION award_referral_bonus();
```

---

## Implementation Order

```text
Week 1-2: Phase 1
├── Feature 5: Voice Lesson Notes (uses existing browser APIs)
├── Feature 10: Referral Automation (database triggers only)
└── Feature 1: Offline Mode (PWA/IndexedDB)

Week 3-4: Phase 2
├── Feature 2: AI Driving Insights (edge function + component)
├── Feature 9: Theory Test Tracking (database + UI expansion)
└── Feature 7: Fleet Support (add vehicle_id to lessons)

Week 5-6: Phase 3
├── Feature 6: Pupil Self-Booking (new booking flow)
└── Feature 8: Video Dashcam (storage + upload UI)
```

---

## Technical Considerations

**Storage & Costs:**
- Video clips: Recommend 720p compression before upload
- Retention policy: Auto-delete clips after 90 days unless starred
- IndexedDB for offline: ~50MB limit, prioritize schedules

**Security:**
- All new tables include RLS policies
- Video clips inherit instructor_id/pupil_id access rules
- Offline queue validates data on sync

**Performance:**
- AI insights cached for 24 hours per pupil
- Theory questions loaded in batches
- Video thumbnails generated on upload

---

## Summary

This plan delivers 8 interconnected features that enhance the platform with:
- **Reliability**: Offline mode ensures instructors always have access
- **Intelligence**: AI coaching tips based on real driving data
- **Efficiency**: Voice notes and self-booking reduce admin time
- **Engagement**: Video clips and gamified referrals increase pupil involvement
- **Scalability**: Fleet support enables growth for driving schools

Each feature builds on the existing architecture, reusing established patterns for Supabase, edge functions, and React components.
