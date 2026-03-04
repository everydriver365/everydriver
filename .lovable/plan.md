

## Problem

The `TodayLessonsList` component (used on most home views) has **no links** on its lesson cards — tapping does nothing. The `TodayMiniTimeline` component links to `/instructor/pupils/:pupilId` which shows a filtered list with the card expanded, but the user expects to land directly on the profile view.

The route and auto-expand logic at `/instructor/pupils/:pupilId` already works — it filters to just that pupil and expands their card. The main fix is adding navigation to `TodayLessonsList`.

## Plan

1. **`TodayLessonsList.tsx`** — Wrap each lesson card in a `<Link to={/instructor/pupils/${lesson.pupilId}}>` so tapping navigates to the pupil's profile (same pattern `TodayMiniTimeline` uses).

2. **`HomeTodaySchedule.tsx`** — Change the link destination from `/instructor/schedule` to `/instructor/pupils/${firstPupilId}` for the lesson summary card, so tapping goes to the first pupil's profile rather than the schedule page. (Or keep it linking to schedule if that's the intent for the summary, and only fix the individual tiles.)

Both changes are small — just wrapping existing card markup in `<Link>` components with the correct `to` prop.

