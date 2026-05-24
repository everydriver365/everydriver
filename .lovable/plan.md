
## Build 1 — Public profile SEO + improvements

Investigation deltas from your prompt:
- `react-helmet-async` is NOT installed, but `src/hooks/useMiniWebsiteSEO.ts` already handles title, description, og:*, twitter:*, canonical, and a JSON-LD `LocalBusiness` block via direct `document.head` mutation, wired through `MiniWebsiteLayout`. Per your "do not add Helmet if an alternative exists" constraint, I'll extend that hook rather than install Helmet.
- Several columns named in your prompt don't exist on `instructors` (`coverage_area`, `bio_short`, `profile_photo_url`, `banner_image_url`, `coverage_postcode`, `service_radius_miles`). Real columns: `bio`, `profile_image_url`, `logo_url`, `hero_image_url`, `home_postcode`, `radius_miles`. I'll use the real ones.

### FIX 1 — SEO meta (extend existing hook, no Helmet)

Edit `src/hooks/useMiniWebsiteSEO.ts`:
- Accept new optional inputs on `SEOInstructor`: `hourly_rate`, `radius_miles`, `custom_domain`, plus `avgRating` and `reviewCount` from the caller.
- Change `og:type` from `"website"` to `"business.business"`.
- Canonical / `og:url`: use `https://{custom_domain}/...` when `custom_domain` is set, otherwise keep the existing `https://{slug}.drive365.co.uk/...`.
- Keep description fallback chain; prepend rate when `bio` is missing: `"{name} is a DVSA-qualified driving instructor offering lessons from £{hourly_rate}/hr in {home_postcode}"`.

### FIX 2 — JSON-LD LocalBusiness extras

In the same hook, extend the existing JSON-LD block:
- Add `priceRange: "From £{hourly_rate}/hr"` when `hourly_rate` set.
- Add `aggregateRating: { @type: "AggregateRating", ratingValue, reviewCount }` only when `reviewCount > 0`.
- Add `areaServed` with `home_postcode` + `radius_miles` when both set.

In `MiniWebsiteHome.tsx`: pass `avgRating` and `reviews.length` into `MiniWebsiteLayout` so the hook gets real review data. Extend `MiniWebsiteLayout` props + forward to the hook.

### FIX 3 — Google reviews link on home

In `MiniWebsiteHome.tsx`, inside the existing star/rating cluster (~line 227): if `instructor.google_review_url` is truthy, render a subtle text link "See Google reviews →" using `target="_blank" rel="noopener noreferrer"`. Muted-foreground text-xs, no button styling, sits under the internal star rating.

### FIX 4 — Areas covered section

In `MiniWebsiteHome.tsx`, add a compact "Areas covered" line near the hero search bar:
- If `instructor.home_postcode` and `instructor.radius_miles`: render `"Covering {home_postcode} and {radius_miles} miles around"` as a single muted line with a `MapPin` icon.
- No new table; uses existing columns only. One line, no card chrome.

### FIX 5 — Public instructors SELECT policy: PII findings + safe view

**Currently exposed to anon via `Active instructors publicly viewable` (SELECT *):**

Sensitive — must NOT be public:
- `google_refresh_token`, `google_access_token`, `google_token_expires_at`
- `square_access_token_encrypted`, `square_refresh_token_encrypted`, `square_token_expires_at`, `square_merchant_id`
- `stripe_account_id`
- `xero_tenant_id`, `xero_connected`
- `tax_code`
- `adi_badge_number`, `adi_certificate_url`
- `gpsgate_user_id`, `gpsgate_username`
- `home_address` (full address — postcode is fine, full address is not)
- `auth_user_id`
- `bonus_earned`, `school_skim_percentage`, `school_skim_amount`, `commission_payer`, `commission_split_percent`
- `last_active_at`, `last_seen_at`, `is_online`, `last_calendar_sync`, `last_compliance_reminder_sent`
- `adi_badge_expiry`, `dbs_certificate_expiry`, `car_insurance_expiry`, `car_mot_expiry`, `car_tax_expiry`, `cpd_hours_logged`, `cpd_year_target`
- `data_retention_months`, `deleted_at`, `demo_mode`, `availability_paused`, `has_completed_tour`, `dark_mode_enabled`, `pupil_app_dark_mode`
- All `*_enabled` toggles (broadcast/whatsapp/ai_*/quotes/intake/pricing/etc) — operational config, not public
- `lat`, `lng` (precise home coordinates — postcode is enough for public)
- `vehicle_mpg`, `fuel_cost_per_litre`, `calendar_colors`, `mini_website_domain_id`
- `payment_qr_url*`, `truelayer_enabled`, `klarna_enabled`, `clearpay_enabled`, `cash_payments_enabled`, `instant_bank_pay_enabled`, `direct_debit_enabled`, `deposit_*`
- `booking_advance_days`, `buffer_minutes`, `preferred_lesson_length`, `allowed_lesson_lengths`, `cancellation_*`, `booking_mode`, `tracking_mode`
- `preferred_language`, `gender`, `available_from`
- `payment_link_base_url`

Safe to keep public (drive the mini-website):
- `id`, `name`, `business_name`, `app_slug`, `bio`, `phone`, `email` (business contact), `home_postcode`, `radius_miles`, `hourly_rate`, `profile_image_url`, `car_image_url`, `hero_image_url`, `logo_url`, `welcome_video_url`, `brand_colour`, `secondary_colour`, `website_theme`, `website_font`, `website_header_style`, `website_header_bg`, `website_button_color`, `website_footer_bg`, `website_text_color`, `website_heading_color`, `website_menu_text_color`, `hero_overlay_color`, `hero_overlay_opacity`, `hero_show_logo`, `custom_branding_enabled`, `personal_website_url`, `facebook_url`, `instagram_url`, `twitter_url`, `linkedin_url`, `google_review_url`, `instructor_grade`, `cpd_certified`, `adi_code_of_practice`, `special_skills`, `extra_info`, `car_type`, `car_make`, `car_model`, `custom_domain`, `custom_domain_verified`, `location_name`, `is_active`, `pupil_app_enabled`, `created_at`.

**Migration:**
1. Create `public.public_instructor_profiles` view selecting only the safe columns above, filtered to `is_active = true AND deleted_at IS NULL`. Grant SELECT to `anon` and `authenticated`.
2. Drop the `Active instructors publicly viewable` and `Active instructors viewable by authenticated` policies on `public.instructors`. Authenticated owner/admin policies stay intact.
3. Find every public-context query that hits `from("instructors")` for anon reads and switch to `from("public_instructor_profiles")`. Audited callers to update:
   - `src/pages/mini-website/MiniWebsiteHome.tsx`
   - `src/pages/PublicBookingPortal.tsx`
   - `src/hooks/useInstructorWebsitePages.ts` (drives `useWebsitePage`)
   - `src/hooks/useMiniWebsiteLinks.ts`
   - Any other public mini-website page selects (`MiniWebsiteAbout/Services/Courses/Reviews/Contact/Theory/Tests`) — sweep via `rg`.
   Authenticated portals continue to use the `instructors` table directly (their auth-scoped policies cover them).

Risk: removing the anon policy is hard-cutover. Any missed caller will break with no-rows. I'll grep every `.from("instructors")` reading in public-route components and convert in the same migration commit so there's no gap.

### Constraints honoured

- Additive content only on mini-website pages (no rebuild).
- `react-helmet-async` NOT installed — existing `useMiniWebsiteSEO` extended instead.
- PII findings reported above; awaiting your go/no-go on the view + policy drop before I write the migration.

### Output format on delivery

`FIX 1 / FIX 2 / FIX 3 / FIX 4 / FIX 5 (migration + caller swaps) / PART 6 verified clean / PART 7 deferred`

### Deferred to Build 2 (after Build 1 confirmed clean)

Bulk messaging fan-out edge function, recipient filters, push type fix, broadcast history tab.

### Approval needed before build

Confirm two things and I'll execute:
1. The "Safe to keep public" column list above is correct — in particular, OK to expose business `email` and `phone` publicly (they already are, but flagging since the policy rewrite is the moment to remove them if you want).
2. OK to hard-cutover the anon policy in the same migration that creates the view and swaps the public callers (no transitional grace period).
