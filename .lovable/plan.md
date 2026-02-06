

# Update Marketing Features Page (`/instructor-app/features`)

## Overview
Replace the current hardcoded features page with a comprehensive, CMS-driven showcase of all the app's features. The existing page only lists 6 main features and 6 small ones -- the app now has 30+ features across scheduling, finance, tracking, wellbeing, and more.

## Approach
Rewrite `src/pages/instructor-app/InstructorFeatures.tsx` to pull features from the `instructor_app_features` database table (same CMS the homepage uses), with hardcoded fallbacks that reflect the full feature set. The page will be organised into clear categories so visitors can quickly see the breadth of the platform.

## Page Structure

1. **Hero Section** -- updated headline and copy reflecting the full platform
2. **Feature Categories** -- grouped into logical sections:
   - **Schedule and Diary** -- Smart diary, Google Calendar sync, gap filling, pending bookings
   - **Pupil Management** -- Pupil profiles, progress tracking, test results (DL25A), lesson history
   - **Money and Finance** -- Payments/QR codes, income summary, expenses, income vs expenses, mileage tracker (HMRC), tax summary
   - **Live Tracking and Vehicle** -- GPS live tracking, find my car, vehicle health/telemetry, saved routes, trip replay, sat nav
   - **Communication** -- Messages, job offers, SMS notifications, visitor chats
   - **Your Online Presence** -- Mini-website builder, custom domains
   - **Wellbeing** -- Health hub (weight, water, breaks)
   - **Smart Alerts** -- Weather alerts, traffic alerts, National Highways road alerts, driving conditions
3. **"And More" strip** -- smaller tiles for settings, FAQs, install as app, etc.
4. **Comparison Section** -- kept from existing page (Without/With Drive365)
5. **CTA Section** -- kept from existing page

## Technical Details

### File changes
- **`src/pages/instructor-app/InstructorFeatures.tsx`** -- Full rewrite with:
  - CMS data from `useInstructorAppContent` hook (already exists) for the top-level features
  - Hardcoded comprehensive fallback features organised by category
  - Each category rendered as a section with a header and feature cards
  - Feature cards use the same pattern as the homepage (icon, title, description, highlights)
  - Keeps the existing `InstructorSaaSLayout` wrapper and animation patterns
  - Reuses existing `Card`/`CardContent` components

### No new files or database changes needed
- The `instructor_app_features` table and `useInstructorAppContent` hook already exist
- The layout component `InstructorSaaSLayout` is already in use
- Route `/instructor-app/features` is already registered in `App.tsx`

### Feature categories (hardcoded fallback with ~30 features)
Each feature card includes: icon, title, short description, and 2-3 highlight bullet points. Categories are rendered as alternating white/grey background sections for visual separation.
