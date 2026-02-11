

# Plan Detail Pages + Admin Feature Description Editor

## Overview

Three changes:
1. Show **all 5 plans** on the pricing page (currently capped at 3) and change "Get Started" to "Continue" linking to a new detail page per plan
2. Create a new **plan detail page** (`/instructor-app/plan/:slug`) that shows full plan info pulled from the database
3. Create a new **admin section** for editing feature descriptions (a new `plan_feature_descriptions` table storing rich text about each feature key)

## Database Changes

### New table: `plan_feature_descriptions`

Stores admin-editable descriptions for each feature key (e.g. "diary", "telematics", "sms_notifications").

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto-generated |
| `feature_key` | text (unique) | Matches feature keys in subscription_plans.features |
| `display_name` | text | Human-readable name (e.g. "Smart Diary") |
| `short_description` | text | One-liner for pricing cards |
| `long_description` | text | Detailed paragraph for plan detail page |
| `icon_name` | text | Optional Lucide icon name |
| `display_order` | integer | Sorting |
| `created_at` | timestamptz | Default now() |
| `updated_at` | timestamptz | Default now() |

### RLS Policies
- Admins can CRUD (using `has_role`)
- Public/anon can SELECT (needed for the public pricing pages)

### Migration SQL

```sql
CREATE TABLE IF NOT EXISTS public.plan_feature_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  short_description text DEFAULT '',
  long_description text DEFAULT '',
  icon_name text DEFAULT '',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.plan_feature_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view feature descriptions"
  ON public.plan_feature_descriptions FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage feature descriptions"
  ON public.plan_feature_descriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed with existing feature keys
INSERT INTO public.plan_feature_descriptions (feature_key, display_name, short_description, long_description) VALUES
  ('diary', 'Smart Diary', 'Manage your schedule with an intelligent calendar', 'A powerful scheduling system that lets you manage lessons, block out time, and sync with external calendars. Pupils can see your availability and book directly.'),
  ('basic_pupil_management', 'Basic Pupil Management', 'Track up to 5 pupils', 'Manage pupil profiles, track their progress, and keep notes on each student.'),
  ('pupil_management', 'Full Pupil Management', 'Unlimited pupil tracking and progress', 'Complete pupil lifecycle management including progress tracking, lesson history, competency marking, and automated communications.'),
  ('mini_website', 'Mini Website', 'Your own professional instructor website', 'A fully branded mini-website with your own domain support, services page, reviews, contact form, and online booking.'),
  ('sms_notifications', 'SMS Notifications', 'Automated lesson reminders via text', 'Send automated lesson reminders, booking confirmations, and custom messages to pupils and parents via SMS.'),
  ('payment_tracking', 'Payment Tracking', 'Track payments and invoices', 'Full payment management with invoicing, payment history, QR code payments, and integration with payment providers.'),
  ('telematics', 'Telematics', 'GPS tracking and driving analysis', 'Real-time GPS tracking during lessons with speed monitoring, route recording, harsh braking detection, and detailed driving reports.'),
  ('expense_tracking', 'Expense Tracking', 'Log and categorise business expenses', 'Track fuel, maintenance, insurance, and other business expenses with receipt uploads and tax-ready reports.'),
  ('priority_support', 'Priority Support', 'Fast-track customer support', 'Get priority access to our support team with faster response times and dedicated assistance.'),
  ('custom_branding', 'Custom Branding', 'Personalise your portal and website', 'Apply your own logo, colours, and branding across your pupil portal and mini-website.'),
  ('multi_instructor', 'Multi-Instructor', 'Manage multiple instructors', 'Add and manage multiple instructors under one account with shared or separate diaries.'),
  ('fleet_management', 'Fleet Management', 'Track and manage your vehicle fleet', 'Monitor vehicle mileage, service schedules, MOT dates, and assign vehicles to instructors.'),
  ('shared_diary', 'Shared Diary', 'Team-wide calendar visibility', 'View and manage schedules across all instructors in your school from a single dashboard.'),
  ('team_analytics', 'Team Analytics', 'Cross-instructor reporting', 'Compare performance metrics, pass rates, and revenue across your team of instructors.'),
  ('all_max_features', 'All Max Features', 'Everything in the Max plan', 'Includes every feature from the Max plan tier.'),
  ('all_multi_features', 'All Multi Features', 'Everything in the Multi plan', 'Includes every feature from the Multi plan tier.'),
  ('dedicated_support', 'Dedicated Support', 'Named account manager', 'A dedicated account manager for your school with direct contact and tailored onboarding.'),
  ('api_access', 'API Access', 'Integrate with your own systems', 'RESTful API access to integrate EveryDriver data with your existing business systems.'),
  ('white_label', 'White Label', 'Fully rebrand the platform', 'Remove all EveryDriver branding and present the platform entirely under your own brand.'),
  ('custom_integrations', 'Custom Integrations', 'Bespoke system connections', 'We build custom integrations tailored to your school requirements.'),
  ('sla_guarantee', 'SLA Guarantee', 'Guaranteed uptime and response times', 'Service level agreement with guaranteed uptime, response times, and priority incident resolution.')
ON CONFLICT (feature_key) DO NOTHING;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.plan_feature_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## UI Changes

### 1. Update Pricing Page (`InstructorPricing.tsx`)

- Remove `.slice(0, 3)` to show **all 5 plans**
- Change grid to `md:grid-cols-3 lg:grid-cols-5` (or responsive scroll on mobile)
- Change button text from "Get Started" to "Continue"
- Change link from `/instructor-app/signup?plan={slug}` to `/instructor-app/plan/{slug}`

### 2. New Page: Plan Detail (`/instructor-app/plan/:slug`)

A full-page breakdown of a single plan showing:
- Plan name, price (monthly/yearly toggle), description
- Max pupils, SMS credits
- Full feature list with rich descriptions from `plan_feature_descriptions`
- Each feature shown as a card with icon, display name, and long description
- "Get Started" CTA button linking to `/instructor-app/signup?plan={slug}`
- "Back to Plans" link

### 3. New Admin Component: `PlanFeatureDescriptionsManager.tsx`

An admin section for editing the text about each feature:
- Table listing all feature keys with display name, short description
- Edit dialog with fields: feature_key (read-only), display_name, short_description, long_description, icon_name
- "Add Feature Description" for new feature keys
- Delete option

### 4. Add to Admin Portal

Add "Feature Descriptions" as a tab or section within the existing subscription plans admin area.

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/instructor-app/InstructorPlanDetail.tsx` | Full plan detail page |
| `src/components/admin/PlanFeatureDescriptionsManager.tsx` | Admin editor for feature descriptions |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/instructor-app/InstructorPricing.tsx` | Show all plans, change button to "Continue" linking to detail page |
| `src/App.tsx` | Add route for `/instructor-app/plan/:slug` |
| `src/components/admin/SubscriptionPlansManager.tsx` | Add tab/section for feature descriptions manager |

### Data Flow

```text
Admin edits feature descriptions in admin portal
  -> plan_feature_descriptions table updated
  -> Plan detail page fetches plan + feature descriptions
  -> Matches plan.features array keys to plan_feature_descriptions.feature_key
  -> Renders rich feature cards with long descriptions
```

