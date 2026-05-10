## Problem

On `/instructor/settings/account`, the first section is called **"Profile & contact details"** but it actually renders `InstructorDetailsEditor`, which only has tabs for Vehicle, Qualifications, Social and GPS — no fields to edit name, email, phone, bio, or change the profile photo.

The fully-working profile editor (avatar upload + basic fields) already exists in the legacy `AccountHub.tsx`, but it isn't surfaced anywhere in the new unified settings hub.

## Proposal

1. Extract the profile-basics block from `AccountHub.tsx` into a small reusable component `src/components/instructor/ProfileBasicsEditor.tsx`:
   - Avatar (uploads to `instructor-images/{instructorId}/profile.{ext}`, writes `profile_image_url`)
   - Name, Email, Phone (inputs)
   - Bio (textarea)
   - Single "Save changes" button
   - Same logic and toasts already proven on AccountHub

2. In `src/components/instructor/settings/categories.tsx`, update the **Account → "Profile & contact details"** section so it renders both:
   - `<ProfileBasicsEditor instructorId={id} />` (new — photo + name/email/phone/bio)
   - `<InstructorDetailsEditor instructorId={id} />` (existing — vehicle/qualifications/social/GPS tabs)

   Stacked vertically with a divider so the user can edit personal details and instructor/vehicle details from one place.

3. No DB changes — all the columns (`name`, `email`, `phone`, `bio`, `profile_image_url`) and the `instructor-images` storage bucket already exist and are wired up.

## Out of scope

- No edits to mobile layouts (per project rule).
- No changes to the legacy `AccountHub.tsx` page itself — it continues to work; this just brings the same capability into the unified settings hub the user is actually on.
- No new tabs or restructuring of the existing Vehicle/Qualifications/Social/GPS editor.
