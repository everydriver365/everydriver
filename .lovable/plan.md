

# Replace Bottom Nav on Instructor Marketing Pages

## Problem
The instructor marketing site (EveryDriver homepage at `/`) shows the learner-focused bottom navigation bar (Home, Search, Theory, FAQs, Help, Benefits). These items are irrelevant to instructors browsing the marketing site -- they relate to the Drive365 learner experience.

## Solution
Create a dedicated bottom nav for the instructor marketing pages that mirrors the site's own navigation sections, and use it in `InstructorSaaSLayout` instead of the learner `MobileBottomNav`.

## New Bottom Nav Items
The nav will include the most important marketing page sections:

| Icon | Label | Path |
|------|-------|------|
| Home | Home | / |
| Sparkles | Features | /instructor-app/features |
| Globe | Websites | /instructor-app/domains |
| PoundSterling | Pricing | /instructor-app/pricing |
| LogIn | Log In | /instructor-app/login |

This gives visitors quick access to the key decision-making pages (features, websites/domains, pricing) plus a direct login shortcut.

## Technical Changes

### 1. New file: `src/components/layout/InstructorMarketingBottomNav.tsx`
- A mobile-only (`md:hidden`) fixed bottom nav bar matching the existing styling conventions (primary background, safe area padding).
- Uses the same active-state styling pattern as `MobileBottomNav` (white text when active, muted when inactive).
- Icons from `lucide-react`: `Home`, `Sparkles`, `Globe`, `PoundSterling`, `LogIn`.

### 2. Update: `src/components/layout/InstructorSaaSLayout.tsx`
- Replace the `<MobileBottomNav />` import and usage on line 129 with the new `<InstructorMarketingBottomNav />` component.
- Remove the `MobileBottomNav` import (line 8).

No other files are affected. The learner `MobileBottomNav` continues to work in `MainLayout` for Drive365 pages.
