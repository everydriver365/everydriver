

# Competitor Comparison Marketing Page

## Research Summary

Based on competitor research, here are the features **unique to EveryDriver** that none of ADI Book, MyDriveTime, TotalDrive, or DriveBuddy offer:

**GPS & Telematics** (no competitor has this):
- Live GPS tracking with sat-nav experience
- Geotab hardware integration (trips, engine diagnostics, behaviour scores)
- Route replay and speed analysis
- Find My Car
- Fleet dashboard / vehicle intelligence
- Geofencing with unauthorised movement alerts
- Speed limit monitoring with roundel display
- Automatic mileage logging from GPS hardware

**AI-Powered Tools** (no competitor has this):
- AI lesson plan generator (Gemini)
- AI driving report generator
- Syllabus recommendations engine

**Financial Depth** (competitors have basic income/expense only):
- Full HMRC tax summary with auto-deductions
- Multi-gateway payments (Square, Klarna, Clearpay, Elavon)
- QR code payments
- Dynamic pricing rules (time/day/postcode/notice surcharges)
- Bookable quotes with token links
- Deposit payments at booking
- Receipt photo uploads with Xero export

**Instructor Community** (no competitor has this):
- Nearby ADIs map with live status
- Instructor friendships and direct messaging
- Test swap marketplace
- Instructor forum

**Vehicle Management** (no competitor has this):
- MOT/tax/service tracking per vehicle
- Engine diagnostics (DTC codes, RPM, oil pressure, coolant)
- Fuel price finder

**Wellbeing** (no competitor has this):
- Health hub (blood pressure, glucose, BMI, hydration tracking)
- Smart break reminders based on schedule gaps
- Support hub and instructor forum

**Advanced Workflow** (no competitor has this):
- End-of-lesson wizard (4-step guided flow with voice dictation)
- Hands-free voice-to-text lesson notes
- 6 customisable dashboard layouts
- Branded mini-website builder with CMS
- Standards check preparation tool
- CPD logging
- Doodlepad with satellite maps
- Cancellation analytics with trend charts
- Custom intake questions for booking flow
- Push notifications (web + mobile)
- Weather integration on lesson cards
- Reward points / gamification

## Plan

### 1. Create new page: `src/pages/instructor-app/InstructorCompare.tsx`

A marketing page using the existing `InstructorSaaSLayout`, structured as:

- **Hero section**: "Features Only EveryDriver Has" headline with subtitle about being the most complete instructor platform
- **Competitor logo strip**: Show the 4 competitor names in a muted row
- **Feature category sections** (8 categories): Each with an icon, title, short description, and a grid of feature cards with checkmark/cross columns for EveryDriver vs "Others"
- **Summary comparison table**: Condensed table with all 30+ unique features, showing green checkmarks for EveryDriver and grey crosses for the 4 competitors
- **Testimonial strip**: Reuse existing `TestimonialStrip` component
- **CTA section**: Reuse existing `FeatureCTA` component

### 2. Add route in `src/App.tsx`

- Lazy import and route at `/instructor-app/compare`

### 3. Categories for the feature grid:

1. **GPS & Live Tracking** -- 8 features
2. **AI-Powered Tools** -- 3 features  
3. **Advanced Financials** -- 7 features
4. **Instructor Networking** -- 4 features
5. **Vehicle Intelligence** -- 3 features
6. **Health & Wellbeing** -- 3 features
7. **Smart Workflow** -- 7 features
8. **Customisation & Branding** -- 5 features

Each section: icon + title + paragraph + feature cards in a grid showing the feature name, description, and a row of competitor columns (all crossed out) vs EveryDriver (green check).

The page will reuse existing components (`InstructorSaaSLayout`, `FeatureCTA`, `TestimonialStrip`) and follow the same motion/animation patterns as `InstructorMarketing.tsx`.

