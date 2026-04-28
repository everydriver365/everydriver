# Add "Already have a website?" question to instructor onboarding

## Goal

During instructor signup, ask whether they already have their own website. If yes, capture the URL and skip the mini-website + domain/hosting steps. The instructor still gets a profile (so pupils can find them on Drive365 search), but no auto-generated mini-site is published.

## Where this fits

The onboarding flow lives in `src/pages/instructor-app/onboarding/InstructorOnboarding.tsx` with steps in `./steps/`. There's already a `StepListingPreference` (Featured vs Diary-only). We'll add a new question at the top of `StepWebsite` (the existing "build your mini-site" step), since it only matters for Featured users — Diary-only already skips Website.

Schema already has `instructors.personal_website_url`, so no migration needed.

## Changes

### 1. `OnboardingData` (InstructorOnboarding.tsx)
Add two fields:
- `hasExistingWebsite: boolean` (default `false`)
- `existing_website_url: string` (default `""`)

### 2. `StepWebsite.tsx` — add a leading question card
Before the theme/colour/slug pickers, show:

> Do you already have your own website?
> - **Yes, I have a website** → reveals URL input (`https://...`), hides the mini-site builder below, sets `website_choice = "external"`.
> - **No, build me a free Drive365 mini-site** → current behaviour (theme + slug + colours).

When "Yes" is selected:
- Hide the theme/slug/colour controls.
- Require a valid URL before "Continue" enables.
- Skip `StepDomainHosting` (step 9) on next.

### 3. Skip-step logic in `getNextStep` / `getPrevStep`
For featured + `hasExistingWebsite === true`:
- From step 8 (Website) → go to step 10 (Payment) directly, skipping 9 (Domain & Hosting).
- Mirror the back navigation.

### 4. `handleComplete` save logic
When `hasExistingWebsite` is true:
- Save `personal_website_url = data.existing_website_url` on the instructors row.
- **Do not** generate the `slug.drive365.co.uk` `custom_domain`. Leave `custom_domain` null and `custom_domain_verified` false so no mini-site is published at that subdomain.
- Still save `app_slug` (needed internally for profile URLs and admin search) but don't surface it as a public mini-site.

When false: existing behaviour unchanged.

### 5. Mini-website rendering guard
In `src/components/ConditionalHome.tsx` and `MiniWebsiteHome` lookups, when an instructor's `personal_website_url` is set and they opted out, redirect visitors of their `*.drive365.co.uk` / `/i/:slug` mini-site to their external URL instead of rendering the auto site. Lightweight — just an early `window.location.replace(personal_website_url)` inside `MiniWebsiteHome` if the loaded instructor row has `personal_website_url` set and no published mini-site content. (Optional polish — flag for confirmation below.)

## Files to edit

- `src/pages/instructor-app/onboarding/InstructorOnboarding.tsx` — add fields, update next/prev, update `handleComplete`.
- `src/pages/instructor-app/onboarding/steps/StepWebsite.tsx` — add the Yes/No question + URL input, conditional rendering.
- *(optional)* `src/pages/mini-website/MiniWebsiteHome.tsx` — redirect to `personal_website_url` if set.

## Open question

Should an instructor who opts out still have their mini-site URL (e.g. `jane.drive365.co.uk`) **redirect** to their personal website, or should it just 404? I'd recommend redirect — keeps SEO juice flowing back to them and avoids dead links from Drive365 search results. Confirm before I implement step 5.
