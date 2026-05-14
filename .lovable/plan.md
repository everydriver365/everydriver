
## What I found in the project

**Drive365 brand assets that exist:**
- Logo: `/public/drive365-logo.png` (also `everydriver-logo*` variants — will not use)
- Hero imagery: `/public/drive365-hero*.{jpg,png,webp}`
- Dark navy header colour `#142040` is already used in the existing `EnquiryOnlyView` and on Drive365 surfaces
- Generic CSS tokens in `src/index.css` `:root` — `--primary: 230 61% 10%` (very dark navy ≈ `#0a1226`), `--success: 142 71% 45%`, `--radius: 0.5rem`. Default font stack is the project-wide system/Inter sans.

**What does NOT exist (you asked me to flag these):**
1. There is **no dedicated Drive365 design-token block, no Drive365 font stack, no Drive365 accent colour, and no scoped `.drive365` theme class**. The only "Drive365" things are the logo PNG, hero images, and the dark navy used ad-hoc. I will treat the existing `--primary` deep navy as the Drive365 primary and use `#142040` as the header bar colour (matches what's already shipping on the enquiry page header today). If you want a different/official Drive365 hex, accent colour or font, please supply them — otherwise I'll lock these in.
2. **No SVG version of the Drive365 logo** (only PNG). For the email header on a navy background I'll either (a) use the PNG as-is, or (b) ask you for a white/transparent SVG. Recommend (b) for crispness — flag.

**Database — schema mismatch with your spec:**
- The existing table is `public.booking_enquiries` with fields `pupil_name / pupil_email / pupil_phone / pupil_postcode / course_name / course_hours / message / source / status / contacted_at / converted_pupil_id`.
- Your spec asks for an `enquiries` table with `learner_*` fields plus `instructor_email_sent_at / admin_email_sent_at / instructor_email_error / admin_email_error / source_page`.
- I will **extend `booking_enquiries`** (not create a parallel table) with the four new tracking columns + `source_page`. Renaming `pupil_*` → `learner_*` would break a lot of existing code (instructor enquiries inbox, conversion-to-pupil flow, notify-booking-enquiry, etc.), so I'll keep the column names and just present them as "learner" in the UI/email. **Confirm.**
- The `instructors` table does **not** have `booking_method`, `typical_response_hours`, `first_name`, `last_name`, `photo_url` or `area`. It has `name`, `email`, `phone`, `profile_image_url`. I'll:
  - derive first name from `split(name)`
  - default response time to 24h (no column to read from) — if you want this configurable per-instructor I'll add `typical_response_hours int` to `instructors`. **Confirm.**
  - the existing "show enquiry view" gate is in `BookingSummary.tsx`; I'll leave that gating logic untouched and just swap what gets rendered.

**Email sending — important blocker:**
- The configured Lovable Email domain is `drivinglessonswinchester.com` and it is currently in `provisioning_failed` state. **`drive365.co.uk` is NOT verified anywhere** — not in Lovable Email, not in Resend (the existing `notify-booking-enquiry` function sends from `notifications@resend.dev`).
- That means I **cannot** send the admin email from `noreply@drive365.co.uk` until the domain is verified. Per the prior chat we were mid-way through getting `notify.drive365.co.uk` delegated — that work is still outstanding (SiteGround NS limitation / Cloudflare migration).
- **Recommendation:** I switch the admin notification to use **Lovable's built-in transactional email system** (queued, retried, suppression-aware) which automatically uses your verified Lovable Email domain once DNS is live. Until DNS for a Drive365 sender is configured, the email will either (a) fall back to the existing Resend path with `from: Drive365 Enquiries <onboarding@resend.dev>` so it still sends, or (b) hold until the domain is verified. **Pick one.**

---

## Questions before I build

1. **Drive365 brand spec:** OK to use `--primary` deep navy + header `#142040` + system font stack, or do you have an official hex / font / accent to supply?
2. **Schema:** OK to extend `booking_enquiries` (keep `pupil_*` names internally, present as "learner" in UI/email) and add `typical_response_hours` to `instructors`?
3. **Email sender:** Until `drive365.co.uk` DNS is verified, do you want me to (a) send via Resend from `onboarding@resend.dev` with display name "Drive365 Enquiries" so it works today, or (b) wire it up to Lovable Email and accept it won't send until you finish the DNS work?

---

## Build plan (once the questions above are answered)

### 1. Brand tokens
Add a scoped `.drive365-brand` block in `src/index.css` defining `--d365-primary`, `--d365-primary-foreground`, `--d365-accent`, `--d365-success`, `--d365-success-tint`, `--d365-surface`, `--d365-surface-tint`, `--d365-border`, `--d365-text`, `--d365-text-muted`, `--d365-radius-card: 16px`, `--d365-radius-input: 10px`. Export Tailwind aliases in `tailwind.config.ts`. All three pieces consume these — single source of truth.

### 2. New components
- `src/components/booking/EnquiryForm.tsx` — Piece 1 exactly to your spec (avatar, header, fields with optional tags, trust signals).
- `src/components/booking/EnquiryConfirmation.tsx` — Piece 2 exactly to your spec (success circle, instructor recap, 3-step timeline, outline CTA, footnote).
- A new wrapper `src/components/booking/EnquiryFlow.tsx` that holds submit state and swaps between form ↔ confirmation.
- `BookingSummary.tsx` swaps `EnquiryOnlyView` → `EnquiryFlow`. `EnquiryOnlyView` is left in place for now (deletion in a follow-up to keep this PR focused on the redesign).

### 3. Migration
`booking_enquiries`: add `source_page text`, `instructor_email_sent_at timestamptz`, `admin_email_sent_at timestamptz`, `instructor_email_error text`, `admin_email_error text`. (Optional: `instructors.typical_response_hours int default 24`.)

### 4. Submit flow
1. Validate (zod, same shape as today)
2. Insert into `booking_enquiries` with `source_page = window.location.pathname`
3. `supabase.functions.invoke("notify-booking-enquiry", ...)` (existing — sends to instructor)
4. `supabase.functions.invoke("notify-admin-enquiry", ...)` (NEW)
5. Each function PATCHes back its own timestamp/error column
6. Show `EnquiryConfirmation` regardless of email success/failure

### 5. New edge function `notify-admin-enquiry`
- Reads enquiry + instructor
- Renders the Drive365-branded HTML email (table-based, inline styles, max 600px, mobile stacking via media query, plain-text fallback)
- Header bar `#142040` + Drive365 logo + "NEW ENQUIRY" pill
- Learner block / quoted message / Instructor block / centred CTA → `https://everydriver.lovable.app/admin/enquiries/{id}` / footer
- `From`: depends on Q3 answer
- `Reply-To`: learner email
- `Subject`: `New enquiry: {learner name} → {instructor name}`
- Sends to `Deno.env.get("ADMIN_ENQUIRY_EMAIL")` — I'll request this secret via `add_secret` (your spec says `enquiries@drive365.co.uk`).

### 6. Verification
- Render both screens at `/book/...` against viewport 1078×688 and a mobile width
- Trigger a test enquiry, confirm row in `booking_enquiries`, confirm both edge function logs show success, confirm admin email arrives
- Report back with screenshots of all three pieces (form / confirmation / rendered email HTML)

### 7. SPF/DKIM status I'll report
- Lovable Email: `drive365.co.uk` not configured → flag
- Resend: `drive365.co.uk` not verified → flag
- Whichever path you pick in Q3 will determine the exact DNS to-do list I hand back

---

Reply with answers to the three questions and I'll execute the plan in one pass.
