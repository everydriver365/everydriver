
Goal
- Make the Step 1 (Personal Details) profile photo upload button reliably clickable and able to upload.
- Remove the “camera button is disabled so nothing happens” dead-end by ensuring we always resolve an instructor profile ID (or show a clear retry error state).

What we know (from your answers + current code)
- On desktop, tapping/clicking the camera icon results in “No reaction”.
- The camera icon appears Disabled.
- In StepPersonalDetails, the file input + camera button are disabled when `!instructorId`:
  - `disabled={uploading || !instructorId}`
- Therefore the upload isn’t “failing”; it never starts because the UI is disabled.
- The backend already has an instructor row for your logged-in user, so the remaining issue is: the onboarding page is not successfully resolving/setting `instructorId` at runtime.

Likely cause
- InstructorOnboarding maintains its own `instructorId` state and fetches the instructor record in a useEffect. If that fetch/creation path fails or returns null (even temporarily), Step 1 renders with `instructorId=""`, and the upload control is disabled.
- Even if the instructor exists, any transient failure (timing, auth state race, query error, etc.) will keep the UI disabled with no visible explanation.

Implementation approach (high confidence fix)
A) Make instructorId resolution robust by using the already-fetched instructor profile from InstructorAuthContext as the primary source of truth, with the existing query as a fallback.
- In `InstructorOnboarding.tsx`, compute a “resolved instructor id” like:
  - `const resolvedInstructorId = instructor?.id ?? instructorId ?? null`
- Add a small `useEffect` that, when `instructor?.id` becomes available, sets local `instructorId` too (so everything downstream stays consistent).
- Ensure we do not render step components that require `instructorId` until `resolvedInstructorId` is available (or show a dedicated error/Retry UI).

B) Add a clear “profile loading / couldn’t load your profile” state instead of silently disabling core actions.
- If auth is ready but instructor id still isn’t resolved:
  - Show a centered panel: “We’re loading your profile…” for a short period.
  - If it still fails (or if the fetch throws), show: “We couldn’t load your instructor profile” with:
    - Retry button (re-run loadInstructorData / refreshInstructor)
    - Sign out button (optional)
- This removes the “disabled button with no explanation” experience.

C) Make the file picker trigger more robust (secondary improvement)
Even once `instructorId` is fixed, file pickers can still be finicky depending on nesting/labels. To harden it:
- In `StepPersonalDetails.tsx`:
  - Replace the “label wrapping input + Button” pattern with:
    - a hidden input controlled by a `useRef<HTMLInputElement>()`
    - a camera Button with `onClick={() => inputRef.current?.click()}`
  - Keep the existing `onChange={handleImageUpload}` logic.
  - Keep the `resetInput()` to allow re-selecting the same file.
This ensures that clicking the camera button always triggers the file dialog in a direct user gesture handler.

D) Small consistency fixes (optional but recommended while we’re there)
- StepPersonalDetails currently uses `totalSteps={9}` while InstructorOnboarding uses up to 10 steps; align these so the header progress doesn’t confuse users.
- Consider bumping max size to 10MB (desktop cameras/photos frequently exceed 5MB).

Files to update
1) `src/pages/instructor-app/onboarding/InstructorOnboarding.tsx`
- Use `instructor?.id` from context to set/derive the instructor id.
- Gate rendering of step components that depend on `instructorId` until resolved.
- Add “Loading profile / Retry” UI state.

2) `src/pages/instructor-app/onboarding/steps/StepPersonalDetails.tsx`
- Replace the label-wrapped file input with an inputRef + explicit button click.
- Optional: increase max file size to 10MB.
- Optional: align totalSteps to match actual flow.

Testing plan (end-to-end)
1) Log in as an instructor and open `/instructor-app/onboarding?step=1`.
2) Confirm the camera button is enabled after profile load (or you see an explicit loading state).
3) Click camera:
   - File dialog opens.
   - Pick a JPG/PNG and confirm an upload request is made.
   - Verify success toast appears.
   - Verify the avatar updates immediately (uses the returned public URL).
4) Refresh the page:
   - Avatar remains (because `profile_image_url` is saved when you proceed to next step; optionally we can also save immediately on successful upload).
5) Try selecting the same image twice:
   - Ensure it still triggers due to input reset.

Edge cases to validate
- Instructor row missing: confirm the onboarding shows “creating/loading profile” and then enables upload once created.
- Slow network: confirm the UI communicates loading instead of silently disabling.
- Cancel file picker: no errors; upload state resets cleanly.

Non-goals (for this pass)
- Changing backend policies (they already allow instructors to upload to the correct bucket).
- Storing images in the database (we will continue storing only URLs).

If you approve this plan, I’ll implement it by (1) making instructorId resolution depend on the auth context instructor profile + better error UI, and (2) updating the upload trigger to a ref-based click so the file picker reliably opens.
