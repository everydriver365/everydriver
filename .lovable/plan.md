

# Create Rork Max Prompt — Instructor App (No Auth)

## What
A single comprehensive prompt file (`RORK_MAX_INSTRUCTOR_PROMPT.md`) that Rork Max can consume to begin building the instructor native app. Authentication is **deferred** — the app uses a hardcoded demo instructor profile and mock data so all screens can be built and tested immediately.

## Approach
- Take the existing 1107-line `RORK_NATIVE_APP_PROMPT.md` as the foundation
- Remove all auth/login sections and replace with a `demoInstructor` constant and mock data provider
- Keep the full Supabase connection details (URL + anon key) so edge functions and public reads work
- Include the complete navigation structure, screen inventory, design system, and native adaptations
- Add a clear "Phase 2: Authentication" placeholder section for future implementation
- Structure as a single copy-paste prompt optimised for Rork Max's context window

## Key Differences from Existing Prompt
1. **No auth flow** — App launches straight to Home tab with a demo instructor object
2. **Mock data layer** — A `DemoDataProvider` context supplies realistic UK instructor data (pupils, lessons, payments, stats) so every screen renders
3. **Supabase optional** — Edge functions and reads are attempted but gracefully fall back to mock data
4. **Build order** — Starts with navigation shell + Home, then Schedule, Pupils, Money, Track, More — all achievable without auth

## File to Create
- `RORK_MAX_INSTRUCTOR_PROMPT.md` — ~800-1000 lines, single prompt

## Content Structure
1. **Project Overview** — App name, purpose, tech stack (Expo/React Native)
2. **Demo Data Setup** — Hardcoded instructor profile, 8 mock pupils, 6 mock lessons, payment history
3. **Navigation** — 6-tab bottom bar with exact screen mapping
4. **Screen Inventory** — All screens from the existing prompt, grouped by tab, with layout descriptions and component breakdowns
5. **Edge Functions Reference** — Full table (connect when ready, mock until then)
6. **Database Tables** — Full schema reference for when Supabase queries are wired
7. **Design System** — Colors, typography, component patterns, dark mode
8. **Native Adaptations** — Web-to-native mapping table
9. **Business Rules** — Currency (GBP), date/time formats, competency levels
10. **Phase 2 Placeholder** — Auth implementation notes for later

