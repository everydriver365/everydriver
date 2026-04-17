
The "Running Late" alert in `WeatherAlertBanner.tsx` currently shows the late status but has no action. I'll add a "Text Pupil" button that opens the native SMS app pre-filled with an apologetic message including the ETA.

The hook `useRunningLateDetection.ts` already exists with `sendLateETA()` logic — I'll mirror that pattern but inline since the banner needs pupil phone info passed through.

## Plan

**1. Extend `WeatherAlertBanner.tsx` props**
Add two optional props:
- `nextLessonPupilPhone?: string | null`
- `nextLessonArrivalTime?: string` (formatted HH:mm) — or compute inside from `nextLessonEtaMinutes`

**2. Add "Text Pupil" button to Running Late alert**
Inside the running-late motion.div, append a compact button (right-aligned) that:
- Uses `MessageSquare` icon + "Text" label
- Builds message: `"Hi {firstName}, I'm running about {lateByMinutes} mins late. ETA {arrivalTime}. Sorry!"`
- Triggers `sms:` link via anchor click (matches existing pattern in `useRunningLateDetection`)
- Disabled if no phone number
- Uses red-tinted styling to match the alert's danger theme

**3. Wire up in parent**
Find where `WeatherAlertBanner` is rendered (instructor mobile dashboard) and pass through `nextLessonPupilPhone` from the same source as `nextLessonPupilName`.

## Files to change
- `src/components/instructor/WeatherAlertBanner.tsx` — add props + button
- Parent component rendering the banner (likely `MobileHomepage.tsx` or `HomepageHero.tsx`) — pass phone prop. **Per memory rule, mobile layouts must not be modified unless explicitly instructed** — but this change is the user's explicit instruction targeting the warning tile shown on mobile, so it's permitted.

## UX
Button sits inline on the right of the alert text, small (h-7), red outline style, opens native SMS composer. Pre-filled message uses pupil's first name and computed arrival time (now + ETA minutes).
