## Goal

Replace the body of `src/components/instructor/settings/pages/ProfilePage.tsx` with the redesigned profile layout on **desktop only** (≥ md). Mobile keeps the existing `ProfileBasicsEditor` + `InstructorDetailsEditor` stack untouched. No API, auth, route, sidebar, or upload-handler changes.

## Why this shape

`/instructor/settings/profile` is rendered inside `SettingsLayoutV2`, which already provides:
- the left settings sidebar,
- a "Back" button,
- a page `<h1>` ("Profile") + subtitle.

To avoid duplicating chrome (and per your "Integration: Replace just the ProfilePage body" answer), the new design's `BackLink`, `Breadcrumb`, `PageHeaderCard`, and outer `InstructorPortalLayout`/padding wrapper are **omitted**. The page renders the new cards directly into the existing `<main>`. All other visuals (cards, tab bar, fields, save buttons, media tiles) match the prompt exactly.

## Files to create

```
src/components/instructor/settings/profile-v2/
├── tokens.ts                  // navy/blue/red/etc colour map from the prompt
├── ProfileSettingsDesktop.tsx // top-level desktop layout (no PortalLayout / no breadcrumb)
├── ProfileContactCard.tsx     // photo row + Name/Email/Phone/Bio + SaveButton
├── ProfileTabBar.tsx          // Vehicle / Qualifications / Social / CPD pill bar
├── VehicleCard.tsx            // Make/Model/Type/Colour/Postcode/Radius/Skills/Info
├── ProfileMediaCard.tsx       // Banner + Car photo MediaItems + welcome video URL
├── MediaItem.tsx              // Upload / Replace+Remove tile with preview
├── placeholders.tsx           // QualificationsCard, SocialCard, CpdCard stubs
└── fields/
    ├── SettingField.tsx       // uppercase 10px label wrapper
    ├── SettingInput.tsx       // 1.5px border, focus ring 3px rgba(26,82,160,.09), optional right icon
    ├── SettingTextarea.tsx    // resize: vertical, lineHeight 1.6
    ├── SettingSelect.tsx      // SVG caret background
    └── SaveButton.tsx         // grey when !isDirty, #CC2229 red when isDirty
```

## File to edit

`src/components/instructor/settings/pages/ProfilePage.tsx`
- Use `useIsMobile()` (from `src/hooks/use-mobile.tsx`).
- If mobile → render the existing two `sv2-card` sections (current behaviour, untouched).
- If desktop → render `<ProfileSettingsDesktop instructorId={instructorId} />`.

No other files change.

## Data + handler binding (no new endpoints)

`ProfileSettingsDesktop` owns the form state and binds to existing Supabase calls. Inside one component (mirroring `ProfileBasicsEditor` and `InstructorDetailsEditor`):

- **Load** in one `useEffect`:
  - `supabase.from('instructors').select('name,email,phone,bio,profile_image_url,hero_image_url,car_image_url,welcome_video_url,home_postcode,radius_miles,car_type,car_make,car_model,special_skills,extra_info').eq('id', instructorId).single()`.
- **Profile form** (`name,email,phone,bio`) → `supabase.from('instructors').update({...}).eq('id', instructorId)` (same payload as today's `ProfileBasicsEditor.handleSave`).
- **Vehicle form** maps to existing DB columns:
  - `make` → `car_make`
  - `model` → `car_model`
  - `type` → `car_type` (`Automatic | Manual | Both`)
  - `colour` → new local-only label; **no DB column exists today**, so store it in `extra_info`'s leading line? **Decision:** drop the field from the save payload and surface a tooltip "saved with Additional info" — OR add it under `extra_info`. Will use `extra_info` for `info` only; `colour` is rendered but **not persisted** (no schema change allowed under this prompt). I will flag this in a `TODO:` comment so you can decide later.
  - `postcode` → `home_postcode` (run through `formatUKPostcode` like today).
  - `radius` → `radius_miles` (integer miles, imperial per memory).
  - `skills` → `special_skills`
  - `info` → `extra_info`
- **Photo change** → reuse `ProfileBasicsEditor`'s upload flow by mounting a hidden `<input type="file">` and the existing `AvatarRepositionDialog`; upload bucket `instructor-images`, path `${instructorId}/profile.jpg`, then update `profile_image_url`. Same code path, just re-implemented in the new card (no API change).
- **Banner / Car photo upload + remove** → reuse `CMSImageUpload`'s underlying flow:
  - Upload: `supabase.storage.from('instructor-images').upload(...)` then `update({ hero_image_url | car_image_url })`.
  - Remove: `update({ hero_image_url: null | car_image_url: null })`.
  Wrapped in `<MediaItem>` to match the new visual; we will internally render a hidden file input + use the same storage helper that `CMSImageUpload` uses. **No new endpoint.**
- **Welcome video URL** → `update({ welcome_video_url })` (same as `ProfileMediaEditor`).

Dirty/saving state is split: `profileDirty/savingProfile` and `vehicleDirty/savingVehicle` are independent, per the hard constraint.

## Visual spec — exact from the prompt

- Page padding `28px 36px`, page bg `#F2F4F8` (applied inside `ProfileSettingsDesktop`, since `SettingsLayoutV2`'s main already has padding; we'll use `margin: -24px -28px -80px` to bleed to the layout edges, or just use `padding: 4px 8px 40px` with bg only on the cards — **decision: bleed to layout edges** so the soft grey background reads as intended).
- Card radius `14`, border `1px solid #DDE3ED`, header padding `16px 20px 14px`, body padding `20`, 28×28 header icon tile r=7, 44×44 page header icon r=11.
- Tab bar: 4px padding, active fills `#0F2044` navy with white text.
- Inputs: 1.5px `#DDE3ED` border, radius 9, focus border `#1A52A0` + `box-shadow: 0 0 0 3px rgba(26,82,160,.09)`. Textarea `resize: vertical`.
- `SaveButton`: disabled grey `#DDE3ED` text `#9CA3AF`; when dirty turns `#CC2229` red with white text + `CheckIcon`.
- `MediaItem`: 110px preview, banner placeholder uses linear gradient `#0F2044 → #1A52A0`. When `hasExisting`, shows Replace + Remove side by side; otherwise a single navy "Upload photo" button.

Icons sourced from `lucide-react` (already used everywhere) — `ChevronLeft, User, Camera, Car, Image, Check, X, Mail, Phone, Pencil`. No new icon libs. `DynamicIcon`-style mapping not required because we import lucide directly; the prompt's `DynamicIcon` references are satisfied by direct imports.

## Tabs

- `vehicle` (default) → `VehicleCard` (active form, wired).
- `qualifications`, `social`, `cpd` → placeholder stubs in `placeholders.tsx`: card header matching the pattern (28×28 tile + title + subtitle) and a "Coming soon" body. Not wired to data per the prompt.
- `ProfileMediaCard` always renders below the tabs.

## Constraints respected

- No changes to `InstructorPortalLayout`, settings sidebar, routes, or any existing page file except `ProfilePage.tsx` (which gates desktop vs mobile).
- No new endpoints, no new icon libs, no new packages.
- Mobile (`useIsMobile()` true) renders the current `ProfileBasicsEditor` + `InstructorDetailsEditor` unchanged — honours the "Mobile changes: do not update" memory rule.
- Independent dirty/save state for profile and vehicle.
- Tab bar active state uses navy `#0F2044`, not blue.
- `MediaItem` shows correct button set based on `hasExisting`.
- Inputs apply both `borderColor` and `boxShadow` on focus, clear both on blur.
- `SettingTextarea` is `resize: vertical`.

## Known caveat

`vehicle.colour` has no column on `instructors` today. To avoid a schema change in a "visual layer only" prompt, the field is rendered but **not persisted**. I'll mark it with a `TODO` comment and skip it from the update payload. Tell me if you'd prefer I add a `car_colour` column via migration — that's a one-line addition.
