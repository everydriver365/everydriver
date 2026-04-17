
The user reports the new "Text" sheet isn't appearing on the instructor mobile app schedule page (route `/instructor/schedule`, viewport 390px). The previous change edited `MultiDayScheduleView.tsx`, `NewMobileScheduleView.tsx`, and `ExpandableLessonCard.tsx`. Need to check which view is actually rendered on mobile at this route.

Let me investigate.
<lov-tool-use id="toolu_vrtx_01BQzVfVFpahUxjcqw8QKWbE" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/InstructorSchedule.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01JURsGnmeRMppqgAEtDkGUZ" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/InstructorSchedule.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01GhekF9V4b1KPH7PeQQHbEG" name="code--search_files" integration-id="code" data="{\"query\": \"MobileSchedule|mobile.*schedule|isMobile.*Schedule\", \"include_patterns\": \"*.tsx\"}">
</lov-tool-use>
The mobile schedule list view uses `MultiDayScheduleView` (line 285), which we already wired up. Let me check whether the user's mobile app uses a different page entirely — possibly the "every-instructor" portal.
<lov-tool-use id="toolu_vrtx_01BoNtpcQFRin7HiYBPjYFFJ" name="code--search_files" integration-id="code" data="{\"query\": \"every-instructor.*schedule|EveryInstructor.*Schedule\", \"include_patterns\": \"*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01AoXTLB54vP2gytA6JKD1XM" name="code--search_files" integration-id="code" data="{\"query\": \"NewMobileScheduleView|MobileScheduleView\", \"include_patterns\": \"*.tsx\"}">
</lov-tool-use>
So `NewMobileScheduleView` and `MobileScheduleView` aren't actually rendered by the schedule page anymore — but I previously edited NewMobileScheduleView. The mobile route uses `MultiDayScheduleView` (already wired). Let me verify the user's actual issue by viewing MultiDayScheduleView's text-button wiring and check both NewMobileScheduleView usage.
<lov-tool-use id="toolu_vrtx_01HWhD9rrfYVqBxnPbFa8U8R" name="code--search_files" integration-id="code" data="{\"query\": \"NewMobileScheduleView|MobileScheduleView\", \"exclude_patterns\": \"*.test.*\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01KZDoUF5LMqFNmHhWVy9rK2" name="code--search_files" integration-id="code" data="{\"query\": \"sms:|onText|handleText|window\\\\.location.*sms\", \"include_patterns\": \"src/components/instructor/MultiDayScheduleView.tsx,src/components/instructor/ExpandableLessonCard.tsx,src/components/instructor/NewMobileScheduleView.tsx,src/components/instructor/MobileScheduleView.tsx\"}">
</lov-tool-use>
Found it. The legacy `MobileScheduleView.tsx` (still in the codebase) still uses the native `sms:` link and was missed in my previous edit. The user is on `/instructor/schedule` mobile, but the page actually renders `MultiDayScheduleView` (already updated). However the user says "doesnt seem to be on the instructor mobile app schedule page" — meaning the new sheet doesn't appear on their mobile schedule.

Let me check which view actually renders for mobile. Per `InstructorSchedule.tsx` line 285, mobile list view = `MultiDayScheduleView`. That has the sheet. But maybe `MultiDayScheduleView` renders a *different* mobile branch internally that uses the old SMS path. Let me check.
<lov-tool-use id="toolu_vrtx_01959RHap5ma49rjQe2qJhtz" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/instructor/MultiDayScheduleView.tsx\", \"lines\": \"200-310\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01D6ZUitRZEgjQiad2BWRjEg" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/instructor/MultiDayScheduleView.tsx\", \"lines\": \"500-700\"}">
</lov-tool-use>
The wiring looks correct in MultiDayScheduleView. So when the user taps Text on the schedule page, the `LessonTextSheet` should open. The user reports "doesnt seem to be on the instructor mobile app schedule page" — meaning it's not showing.

Possibilities:
1. The user is on the *Every Instructor* mobile portal (`/every-instructor/schedule`), which routes to `InstructorSchedule` → mobile uses `MultiDayScheduleView` (already wired).
2. Or the `Text` button visible to them is the legacy `MobileScheduleView.tsx` (lines 211, 220) that still uses `sms:`.
3. Or the GapFillSheet runtime warning suggests an unrelated issue.

Let me check the `ExpandableLessonCard` to see if Text button actually calls `onText(lesson)` and whether there's a separate "Text" path on the collapsed card.
<lov-tool-use id="toolu_vrtx_01RzkshYN4Q6qRcxA8t8QkkG" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/instructor/ExpandableLessonCard.tsx\", \"lines\": \"480-560\"}">
</lov-tool-use>
ExpandableLessonCard is correctly wired. The issue must be:
- Either user is testing on a different page that uses `MobileScheduleView.tsx` (legacy with `sms:` link)
- Or there's a separate "Quick" message path that the user is referring to

Notice line 499: `setQuickMessageOpen(true)` — there's a "Quick" button that probably opens a different message dialog. Let me check what `QuickMessage` does — that might still use SMS/native.
<lov-tool-use id="toolu_vrtx_01Quv3NSSC2ScQRG79wL6UEw" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"src/components/instructor/ExpandableLessonCard.tsx\", \"query\": \"QuickMessage|quickMessage|sms:\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01RnmEQteJXJnCcjifh5X9UX" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"*.tsx\", \"query\": \"routes.*MobileScheduleView|<MobileScheduleView\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01VSQatMH9mQoKKWghxJXNFB" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"src/components/instructor/QuickMessageSheet.tsx\", \"query\": \"sms:|window\\\\.location|supabase\\\\.functions\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Q6f5nws8Hh2psGtq6VcQUU" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/instructor/QuickMessageSheet.tsx\"}">
</lov-tool-use>
Now I have a clear picture. The user is saying the Fill-My-Gap-style flow isn't on the mobile schedule. The "Text" button in `ExpandableLessonCard` does call `onText(lesson)` which opens `LessonTextSheet` — that part is wired. But there's also a "Quick" button right next to it that opens `QuickMessageSheet` which uses WhatsApp/native SMS. The user might be tapping Quick (or expecting only one consolidated path), or the text sheet opens but doesn't look right on mobile.

Most likely: the user IS on mobile schedule (`/instructor/schedule` or `/every-instructor/schedule`), tapping "Text", and the sheet either (a) doesn't show or (b) shows but looks broken. The console shows a `forwardRef` warning related to `GapFillSheet` → indicating `LessonTextSheet` (which is structurally similar) may have the same `SheetHeader` ref issue. But that's only a warning.

I'll present a clarifying plan rather than assume.

<lov-plan>
## Diagnosis

The "Text" button on each lesson card in `MultiDayScheduleView` IS already wired to open the new `LessonTextSheet` (Twilio-powered, Fill-My-Gap style). However on mobile, the user reports the new flow isn't appearing. Three likely causes:

1. **Wrong button**: Right next to "Text" is a **"Quick"** button that opens `QuickMessageSheet` — that one still uses WhatsApp + native `sms:` fallback. The user may be tapping Quick and seeing the old behaviour.
2. **Legacy file still present**: `src/components/instructor/MobileScheduleView.tsx` still exists with `window.location.href = sms:...`. Although it's not imported by `InstructorSchedule.tsx`, leaving it around invites confusion and future regressions.
3. **Sheet not rendering visibly**: `LessonTextSheet` uses the same `Sheet` primitive as `GapFillSheet`, which is throwing a `forwardRef` warning (visible in console). On a 390px viewport the bottom sheet may be opening but landing off-screen / behind another modal because the card's expanded panel auto-scrolls into view at the same time.

## Plan

### 1. Unify the two message buttons (primary fix)
In `src/components/instructor/ExpandableLessonCard.tsx`:
- **Remove the "Quick" button** entirely (and its `QuickMessageSheet` import + state). Reason: `LessonTextSheet` already supports a custom message override + discount, so "Quick" is redundant and the only path still using native `sms:`/WhatsApp.
- Keep "Text" → opens `LessonTextSheet` (already wired).

### 2. Add quick templates inside `LessonTextSheet`
In `src/components/instructor/LessonTextSheet.tsx`:
- Above the custom-message textarea, add a small chip row of one-tap templates: "On my way", "5 mins late", "10 mins late", "Please be ready", "Lesson cancelled" — tapping a chip prefills the custom-message textarea (auto-enables the custom toggle). This preserves the Quick-message UX inside the unified Twilio flow.

### 3. Fix the sheet ref warning
In `src/components/instructor/LessonTextSheet.tsx` (and `GapFillSheet.tsx`):
- The console warning "Function components cannot be given refs… Check the render method of GapFillSheet" comes from passing children that aren't ref-forwarding into `SheetHeader`. Wrap the header content so the inner element receiving the ref is a DOM node, or remove the offending wrapper. Apply the same fix to `LessonTextSheet`.

### 4. Delete the legacy view
- Delete `src/components/instructor/MobileScheduleView.tsx` (no longer referenced by routes — confirmed via search). Prevents future regressions to native `sms:`.

### 5. Verification
After changes, on `/instructor/schedule` and `/every-instructor/schedule` (mobile viewport):
- Expand a lesson → only **one** message action labelled "Text" remains.
- Tap "Text" → `LessonTextSheet` opens with template chips, discount toggle, custom message; sending hits Twilio via `send-gap-sms` with `pupilId` set.

## Files to change
- EDIT `src/components/instructor/ExpandableLessonCard.tsx` — remove Quick button + QuickMessageSheet usage.
- EDIT `src/components/instructor/LessonTextSheet.tsx` — add template chips; fix SheetHeader ref warning.
- EDIT `src/components/instructor/GapFillSheet.tsx` — same SheetHeader ref fix.
- DELETE `src/components/instructor/MobileScheduleView.tsx` — legacy unused.
- (Optional) DELETE `src/components/instructor/QuickMessageSheet.tsx` if no other callers — will check during implementation.

No DB or edge-function changes.
