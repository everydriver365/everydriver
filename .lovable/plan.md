

# Rewrite the EveryDriver Dashcam Page with Geotab-Inspired Content

Redesign `src/pages/instructor-app/InstructorDashcam.tsx` using the structure and themes from Geotab's fleet dashcam page, but fully reworded for driving instructors using EveryDriver.

## Content Mapping (Geotab concepts reworded for instructors)

### 1. Hero Section Update
- **Title**: "EveryDriver AI Dashcam for Driving Instructors"
- **Subtitle**: "Smart video telematics built for driving instruction -- protect your business, coach your pupils, and capture every lesson in HD."
- **Bullet points**:
  - "Compact and purpose-built": AI dashcam designed specifically for dual-control instruction vehicles.
  - "Improve pupil performance and visibility": Unified video and telematics fully integrated with your EveryDriver dashboard.
  - "Easy to install, self-calibrating": Up and running in under 15 minutes with the included mount kit.

### 2. New "Why EveryDriver Video" Section (replaces old features intro)
Six benefit cards inspired by Geotab's "Why video for fleet safety" section:
- **Collision Prevention** -- Video evidence helps analyse near-misses and implement safer lesson plans.
- **Protecting Instructors** -- Cameras capture driving behaviour in real time to safeguard against false accusations.
- **Risk Reduction** -- Timestamped, GPS-tagged footage provides indisputable evidence for insurance disputes.
- **Real-Time Safety Alerts** -- In-cab voice alerts notify you of harsh braking, sudden swerves, and distracted behaviour.
- **Operational Efficiency** -- AI automatically detects and categorises risky events, streamlining your post-lesson reviews.
- **Cost Savings** -- Reduce insurance premiums and protect against fraudulent claims with verifiable footage.

### 3. "How It Works" Section (new, inspired by Geotab's step-by-step)
Four numbered steps:
1. **Dashcam starts recording** -- Powers on when the engine starts; no manual intervention needed.
2. **AI detects key moments** -- Harsh braking, swerves, and near-misses are automatically flagged and clipped.
3. **Footage syncs to the cloud** -- When connected to Wi-Fi, clips upload and link to the correct pupil and lesson.
4. **Review inside EveryDriver** -- Watch HD footage alongside GPS data, speed, and route maps directly in your dashboard.

### 4. "Strengthen Your Instruction" Capabilities List (replaces old benefits checklist)
Reworded list of what instructors can do:
- Gain visibility into on-road activities including risky pupil habits
- Record complete driving routes with GPS overlay
- Use video clips to support pupil coaching and debrief sessions
- Record and save evidence of incidents or near-misses
- Receive instant notifications when critical events are detected
- Watch live playback during lessons via the parent portal
- See trip and map information for every lesson
- Share annotated clips with pupils via a secure link

### 5. "Protect Your Business" Section (new, inspired by Geotab's insurance/fraud section)
Highlight how dashcam footage protects instructors:
- HD video evidence that proves what happened in incidents and disputes
- Prevent exaggerated claims and exonerate yourself when not at fault
- Many insurers offer premium discounts for dashcam-equipped vehicles
- Stats: "74% of false claims dismissed with dashcam evidence", "$100k+ in insurance savings reported by driving schools"

### 6. Updated FAQ Section
Reworded FAQs inspired by both Geotab and existing content:
- What is AI incident detection?
- How does the dashcam connect to EveryDriver?
- When is video saved?
- Can parents watch lessons live?
- Is recording pupils GDPR compliant?
- Does it work with any dual-control vehicle?
- How long is footage stored?
- Can I download and share clips?

### 7. CTA Section
Keep the existing dark gradient CTA but update copy:
- "Ready to Protect Your Business and Improve Pupil Outcomes?"
- Updated subtext about joining instructors who use EveryDriver dashcam.

## Technical Details

### Files Modified
- `src/pages/instructor-app/InstructorDashcam.tsx` -- Full content rewrite with new sections, keeping the same component structure (InstructorSaaSLayout, FeaturePageHero, Card, motion animations).

### No New Dependencies
Uses existing components: Card, Button, Badge, motion, lucide icons.

### No Database Changes
This is a purely presentational content update.

