

# iOS Premium Dashboard Redesign

## Overview
Redesign the instructor mobile homepage with Apple-native aesthetics: glass-depth cards, iOS system colours, soft gradients, and precise spacing matching the user's detailed colour specification.

## Files to Modify

### 1. `src/components/instructor/HomepageHero.tsx`
- **Background**: Change card from solid `#FFFFFF` to `rgba(255,255,255,0.8)` with `backdropFilter: blur(20px)` and gradient overlay to `#F9F9FB`
- **Shadow**: Update to `0 10px 30px rgba(0,0,0,0.06)` with subtle inner top highlight via `inset 0 1px 0 rgba(255,255,255,0.8)`; remove visible borders
- **Greeting**: "Good evening" → `#8E8E93`, name → `#1C1C1E` (softer black)
- **Date row**: "TODAY" pill → `rgba(52,199,89,0.15)` bg with `#34C759` text; date → `#8E8E93`; remove dot indicator
- **Progress ring**: Track → `#E5E5EA`, progress stroke → `#34C759` (replace current green gradient); thinner stroke
- **Centre text**: "0" → bold `#1C1C1E`, "of 0" → `#8E8E93`
- **Progress bar**: Track → `#E5E5EA`, fill → `#34C759`, height 4px, fully rounded
- **Bottom stats**: Labels → `#8E8E93`, values → `#1C1C1E`, earnings → `#34C759`, job offer → `#007AFF`; remove border dividers, use spacing only
- **Avatar**: Add subtle `boxShadow: 0 2px 8px rgba(0,0,0,0.12)`

### 2. `src/components/instructor/ActivityTilesGrid.tsx`
- **Card background**: Change from solid `#FFFFFF` to `rgba(255,255,255,0.7)` with `backdropFilter: blur(16px)`
- **Shadow**: `0 6px 20px rgba(0,0,0,0.04)` with inner highlight; no borders
- **Corner radius**: 22px
- **Icon containers** — apply iOS system colours:
  - Job Offers: bg `rgba(255,204,0,0.18)`, icon `#FFCC00`
  - Messages: bg `rgba(255,149,0,0.18)`, icon `#FF9500`
  - Tests: bg `rgba(0,122,255,0.15)`, icon `#007AFF`
  - Fill Gaps: bg `rgba(255,59,48,0.15)`, icon `#FF3B30`
- **Badges**: `#FF3B30` bg, white text, tight Apple sizing (min-width 18px, height 18px, font 10px)
- **Tap effect**: `scale(0.98)` (already close, just adjust)

### 3. `src/components/instructor/InstructorMobileHome.tsx`
- **Background**: Replace flat `#F2F2F7` with vertical gradient `#F2F2F7` → `#E5E5EA`, plus optional subtle radial highlight in center
- Apply to the default layout branch (non-layoutStyle) wrapper div

### 4. All other cards below hero (View Schedule tile, section headers)
- Apply same glass treatment: `rgba(255,255,255,0.7)`, backdrop blur, no borders, soft shadow
- Consistent 18-20px internal padding, generous vertical rhythm

## What stays untouched
- All hooks, data fetching, navigation logic
- Weather alerts, driving alerts, tracker reminder
- All alternative layout styles (lockscreen, clean, ios-native, etc.)
- Bottom nav, FAB, pull-to-refresh

## Result
The default homepage layout will feel like a native iOS app with glass-depth cards, proper Apple colour system, and premium spacing — matching iOS widgets and Apple Fitness aesthetics.

