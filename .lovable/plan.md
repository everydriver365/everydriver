## Product: Test Date Guarantee

Premium add-on for any pupil who has a DVSA practical test booked. We commit to:
1. An assigned instructor for every lesson in the run-up to the test.
2. The full number of lesson hours the pupil booked, completed before the test date.
3. If we fail to deliver either → **full refund of the Guarantee fee + £62 DVSA test fee covered**.

Replaces the working name "car for test" everywhere.

## Pricing

| Tier | Price | What's included |
|---|---|---|
| **Test Date Guarantee** | **£79 one-off** | Assigned instructor, all booked hours delivered before test, money-back promise, priority cover if instructor falls ill |

Margin split (instructor / contingency pot / platform):
- Instructor: **£25** (skin in the game)
- Contingency pot: **£20** (funds cover instructors when things go wrong — owned by platform)
- Platform net: **£34**

At 6,000 users with even a 15% attach rate on test-booked pupils → ~£300k/yr platform revenue from this SKU alone. Not a side feature.

## Pupil-facing UX (Drive365)

Triggered the moment a pupil enters or confirms a DVSA test date in their portal.

```text
┌──────────────────────────────────────────┐
│  Your test: Tue 14 Jul, 09:24 — Basingstoke│
│                                          │
│  ★ Add Test Date Guarantee — £79         │
│  ─────────────────────────────────────── │
│  • Same instructor every lesson          │
│  • All your booked hours, before test day│
│  • If we don't deliver → full refund +   │
│    your £62 test fee back                │
│                                          │
│  [ Add Guarantee ]   [ No thanks ]       │
└──────────────────────────────────────────┘
```

Surfaces:
- Pupil dashboard tile (top, gold accent on dark slate per Portal tokens)
- Test-date entry modal (CTA at bottom)
- Pre-test reminder email/WhatsApp 4 weeks out, if not yet purchased
- Settings → "My Guarantee" status page once purchased (countdown, hours delivered, hours remaining)

## Instructor-facing UX (DSM)

- Settings → Bookings: toggle **"Accept Test Date Guarantee pupils"** (default on for active instructors)
- Diary: Guarantee pupils' lessons get a small gold dot + "TDG" label
- Inbox: clear flag when a TDG pupil books, with a one-tap **"Confirm I can deliver all hours"**
- Failure flow: if instructor cancels a TDG lesson < 48h, system auto-offers it to cover pool (paid from contingency)

## Admin UX

- New section: **Test Date Guarantee** → live list of all active guarantees, days-to-test, hours-delivered vs hours-booked, at-risk flag
- Refund queue: any guarantee that lapsed → one-click refund (fee + £62 test fee) via existing payment rails

## Marketing

Dedicated landing page `/test-date-guarantee`:
- H1: **"Don't lose your test date."**
- Sub: "An instructor, every lesson, before your test — guaranteed. Or your money back, plus your DVSA fee."
- 3 benefit blocks: Same instructor · All your hours · Money back if we fail
- Social proof slot (3 quotes)
- Pricing card: £79 with the 3 promises listed
- FAQ (10 Qs incl. refund mechanics, what counts as failure, how cover works)
- Sticky bottom CTA on mobile

Homepage:
- New hero secondary CTA: "Booked a test? Get Test Date Guarantee →"
- Trust strip mention near the existing "Why Drive365" section

SEO:
- Title: "Test Date Guarantee — Don't Lose Your Driving Test Slot | Drive365" (<60)
- Meta desc: "Booked a driving test? We guarantee an instructor and all your lesson hours before test day, or your money back plus DVSA fee. £79." (<160)
- JSON-LD `Service` with name "Test Date Guarantee", provider Drive365, offer £79
- OG/Twitter card with the gold-on-slate hero

## Design direction

- Visual language: dark slate Portal background + **gold accent (#C9A84C, from "Noir & Gold" palette)** to signal premium — only used for this SKU
- Card style: rounded-2xl, subtle gold border (1px hairline), gold check icons, generous whitespace
- Typography: existing portal stack, headings tightened (-0.02em) for premium feel
- Motion: gentle scale-in on the Guarantee card, gold shimmer once on first reveal only (no loops — premium ≠ flashy)
- Mobile-first; mobile layouts untouched elsewhere per project rule

(When you come back tomorrow we can run design directions on the landing-page hero + the pupil dashboard tile to choose the exact visual before any code lands.)

## Rename scope (when we build)

Pure copy/identifier refactor — no behaviour change:
1. UI strings across Drive365, DSM, Admin → "Test Date Guarantee"
2. Routes: `/car-for-test*` → `/test-date-guarantee*` with `<Navigate replace>` redirect from old paths
3. Code identifiers (components, hooks, types, edge function names) renamed where safe in one pass
4. DB columns/tables: keep current names if already in production (too risky to rename live for 6,000 users); add a code-side label mapper so UI shows new name. If not yet shipped, rename in same migration.
5. SEO tags + JSON-LD updated
6. New memory entry: `mem://features/payments/test-date-guarantee` capturing name, £79 price, margin split, refund rules

## Build steps (for tomorrow)

1. DB migration: `test_date_guarantee` table (pupil_id, test_date, hours_booked, hours_delivered, status, purchased_at, fee_amount, contingency_amount, instructor_amount, refunded_at) + GRANTs + RLS
2. Edge function `purchase-test-date-guarantee` — creates row, takes £79 via existing payment rails (GoCardless / Square / SumUp per pupil's chosen method), splits to instructor + contingency on completion
3. Edge function `evaluate-test-date-guarantee` — nightly cron: for any guarantee where test_date has passed, check hours_delivered vs hours_booked + instructor continuity; mark `fulfilled` or `failed` → triggers refund if failed
4. Pupil portal: dashboard tile + test-date modal CTA + status page
5. Instructor portal: toggle + diary label + cover-offer flow
6. Admin section + refund queue
7. Marketing landing page + homepage CTA + SEO + JSON-LD
8. Reminder email/WhatsApp 4 weeks pre-test for non-purchasers
9. Rename pass across codebase

## Out of scope

- No changes to existing lesson booking flow, fee splits on regular lessons, or matching logic
- No changes to mobile layouts beyond the new TDG surfaces (per mobile-update policy)
- No new payment provider — uses existing GoCardless / Square / SumUp rails
- No changes to instructor payout architecture beyond the new £25 line item

---

Locked decisions (so we don't re-debate tomorrow):
- **Name:** Test Date Guarantee
- **Price:** £79 one-off
- **Promise:** assigned instructor + all booked hours + money back (fee + DVSA £62) if we fail
- **Visual:** dark slate + gold accent (#C9A84C), used only for this SKU
- **Refund trigger:** automated nightly check after test date