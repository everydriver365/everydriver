# Unify Drive365 Page Background

## Goal
Make every Drive365 (learner-facing) page use the same background color as the area behind the homepage hero — the `--background` token (`hsl(220 10% 90%)`, light slate-grey).

## Approach

### 1. Pin the canvas on `MainLayout`
Add `bg-background` to the root wrapper in `src/components/layout/MainLayout.tsx` so every page rendered through it inherits the same color the homepage hero sits on.

### 2. Strip page-level background overrides
Audit pages that wrap themselves in a different color (`bg-white`, `bg-muted`, `bg-muted/30`, `bg-gradient-to-*`, `bg-card`, etc. on the outermost wrapper) and remove those so the `MainLayout` color shows through. Section-level colors stay (e.g. dark hero cards, colored CTA bands) — only the page canvas changes.

Pages to audit (Drive365/learner only — mini-website, school, instructor, admin, accessible portal are excluded):
- `Index.tsx`, `Courses.tsx`, `WhitelabelCourses.tsx`, `WhitelabelAreaPage.tsx`
- `About.tsx`, `Contact.tsx`, `Reviews.tsx`, `Help.tsx`, `FAQs.tsx`
- `Intensives.tsx`, `SemiIntensive.tsx`, `Benefits.tsx`, `Theory.tsx`
- `News.tsx`, `NewsArticle.tsx`
- `BookingSummary.tsx`, `BookingConfirmation.tsx`
- `PrivacyPolicy.tsx`, `TermsOfService.tsx`, `GoogleApiDisclosure.tsx`
- `FranchisePage.tsx` + `franchise/*`

### 3. Out of scope
- Mini-website (`/i/:slug`), school sites, pupil/instructor portals, admin, `accessible-portal` — these have their own scoped design systems.
- Section-level colored bands inside pages (heroes, CTA strips, feature panels) are kept.
- Dark mode tokens — only the default (light) `--background` is targeted.

## Risk
Low. Background is a presentation-only change; layout and components untouched.
