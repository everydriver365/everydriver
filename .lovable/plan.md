

## Plan: Drive365 Franchise Landing Page

### Key Point
The franchise page lives on the **Drive365 site** (learner-facing, `MainLayout`), NOT on EveryDriver. Route: `/franchise`. This targets instructors who visit the Drive365 site and see the opportunity.

### Database Migration

**New table: `franchise_enquiries`**
```sql
CREATE TABLE public.franchise_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  current_situation text,
  preferred_tier text,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.franchise_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit" ON public.franchise_enquiries FOR INSERT WITH CHECK (true);
```

### New Page: `src/pages/FranchisePage.tsx`

Uses `MainLayout` (Drive365 branding). Sections:

1. **Hero** — "Join the UK's Most Rewarding Driving Franchise" with healthcare + £50 bonus headline
2. **Healthcare Showcase** — Full card grid: dental cashback £150/yr, optical £100/yr, physio sessions, 24/7 GP access, mental health support, EAP — "Free. Included. No catch."
3. **£50 Bonus Calculator** — Slider: "How many pupils do you pass per year?" → shows bonus income (20 passes = £1,000/yr)
4. **Tier Comparison** — Starter £99/wk, Pro £129/wk, Elite £149/wk with feature breakdown
5. **Competitor Comparison** — vs RED £250/wk, AA £200/wk, Bill Plant £175/wk — savings per year
6. **Tech Platform** — Grid showing diary, GPS, dashcam, MTD, pupil app, website — "All included"
7. **Enquiry Form** — Name, email, phone, current situation, preferred tier, message → inserts to `franchise_enquiries`
8. **FAQ Accordion** — Common franchise questions

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `franchise_enquiries` table with public insert policy |
| `src/pages/FranchisePage.tsx` | **New** — full franchise page using `MainLayout` |
| `src/routes/publicRoutes.tsx` | Add `/franchise` route |
| `src/components/DomainRouter.tsx` | Add `/franchise` to `LEARNER_ALLOWED_ROUTES` |
| `src/components/layout/Header.tsx` | Add "Franchise" link to Drive365 nav |
| `src/pages/Index.tsx` | Add franchise promotion banner section |

