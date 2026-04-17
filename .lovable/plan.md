
## Goal
Replace the "Text" button on each schedule lesson card (currently a native `sms:` link) with the same Twilio-powered, in-app sheet used by the Fill My Gap tile — but targeted at **just that one pupil**, not all pupils.

## Why
- Native `sms:` opens the phone's Messages app, loses tracking, doesn't work on desktop, and forces the instructor to type the message.
- The Gap flow uses `send-gap-sms` (Twilio), supports a discount toggle, tracks delivery, and lets pupils reply to book.
- One unified flow = consistent branding + audit trail.

## Plan

### 1. Make `send-gap-sms` accept a single-pupil target
`supabase/functions/send-gap-sms/index.ts`:
- Add optional `pupilId?: string` to the request body.
- When `pupilId` is provided → fetch only that pupil (instead of all instructor pupils).
- Everything else (offer rows, discount, message format) stays identical.

### 2. New `LessonTextSheet` component (mirrors `GapFillSheet`)
`src/components/instructor/LessonTextSheet.tsx` (new):
- Same bottom-sheet layout, slot summary, optional discount toggle.
- Header: "Text {pupil name}" (instead of "Fill this gap").
- Calls `send-gap-sms` with `{ instructorId, instructorName, pupilId, slots: [thisLesson], discountType, discountValue }`.
- Default copy adapted: "Hi {name}, just confirming your lesson on {date} {start}–{end}…" — keep the existing template path so no edge-function copy split needed (the gap message already reads naturally for a single slot).
- Optional: small free-text override field for a custom message (uses `customMessage` already supported by the function).

### 3. Wire the Text button on the lesson card
`src/components/instructor/MultiDayScheduleView.tsx`:
- Replace the `handleText` (`sms:` link) path with opening the new sheet.
- Add `lessonForText` state + render `<LessonTextSheet>` once at the bottom.
- Pass `onText={(lesson) => setLessonForText(lesson)}` instead of phone.

`src/components/instructor/ExpandableLessonCard.tsx`:
- Change `onText` signature from `(phone) => void` to `(lesson) => void`.
- Update the button handler to pass the lesson object.

### 4. Files
- EDIT `supabase/functions/send-gap-sms/index.ts` — accept `pupilId` filter.
- NEW `src/components/instructor/LessonTextSheet.tsx`.
- EDIT `src/components/instructor/MultiDayScheduleView.tsx` — open sheet instead of `sms:` link.
- EDIT `src/components/instructor/ExpandableLessonCard.tsx` — pass lesson to `onText`.

No DB changes. No new secrets (Twilio already configured).

## Open question
None — proceeding with sheet + optional discount + optional custom message override, defaulting to the existing template.
