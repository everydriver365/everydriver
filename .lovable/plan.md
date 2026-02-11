

# Instructor Discount Codes System

## Overview

Allow instructors to create and manage their own discount/promo codes from both the desktop dashboard and mobile app. These codes can be shared on their mini-website, via SMS (bulk and individual), and through in-app messaging. Codes support percentage or fixed discounts, usage limits, and expiry dates.

## Database Changes

### New table: `instructor_discount_codes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto-generated |
| `instructor_id` | uuid (FK -> instructors) | Owner |
| `code` | text | Unique per instructor, auto-uppercased |
| `description` | text | Optional description |
| `discount_type` | text | `percentage` or `fixed` |
| `discount_value` | numeric | Amount (e.g. 10 for 10% or 10 for GBP10) |
| `applies_to` | text | `all`, `courses`, `lessons` |
| `min_purchase_amount` | numeric | Optional minimum spend |
| `max_uses` | integer | Optional usage cap |
| `times_used` | integer | Default 0 |
| `valid_from` | timestamptz | Optional start date |
| `valid_until` | timestamptz | Optional expiry date |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now() |

### RLS Policies

- Instructors can CRUD their own codes (using `get_instructor_id_for_user`)
- Admins can view all codes (using `has_role`)
- Public/anon can SELECT active codes (for mini-website validation)

### Migration SQL

```sql
CREATE TABLE IF NOT EXISTS public.instructor_discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 10,
  applies_to text DEFAULT 'all',
  min_purchase_amount numeric DEFAULT 0,
  max_uses integer,
  times_used integer DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id, code)
);

ALTER TABLE public.instructor_discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own discount codes"
  ON public.instructor_discount_codes FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins can view all discount codes"
  ON public.instructor_discount_codes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active discount codes"
  ON public.instructor_discount_codes FOR SELECT
  TO anon
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE INDEX idx_instructor_discount_codes_instructor
  ON public.instructor_discount_codes(instructor_id);
```

## UI Changes

### 1. New Component: `InstructorDiscountCodesManager.tsx`

Reusable component (used in both desktop and mobile) featuring:

- List of existing codes with status badges (Active/Expired/Inactive/Maxed Out)
- "Create Code" button opening a dialog with fields for code, description, type (percentage/fixed), value, applies-to, min purchase, max uses, valid from/until
- Auto-generate random code button
- Copy code to clipboard
- Edit and delete existing codes
- Share actions: "Send via SMS" (opens BulkSMSDialog pre-filled with discount message), "Copy link for website"
- Toggle active/inactive

### 2. Instructor Desktop Settings (`InstructorSettings.tsx`)

Add a "Discount Codes" tile in the "Courses and Payments" category with a Tag icon, linking to the new `InstructorDiscountCodesManager`.

### 3. Instructor Desktop Dashboard (`AccountSettings.tsx` or relevant dashboard section)

No change needed here -- the tile in Settings is the entry point.

### 4. Instructor Mobile App (`InstructorSettings.tsx`)

Add a "Discount Codes" tile in the "Courses and Payments" category, expanding to show the same `InstructorDiscountCodesManager`.

### 5. Mini-Website Integration (`MiniWebsiteServices.tsx`)

- Add a "Have a discount code?" input field on the courses/services page
- When a valid code is entered, show the discounted price with a strikethrough on the original
- Validate the code against the instructor's `instructor_discount_codes` table

### 6. SMS and Messaging Integration

- Add a "Share Code" button on each discount code row
- Options: "Copy to clipboard", "Send via Bulk SMS" (pre-fills BulkSMSDialog with a template like "Use code SAVE10 for 10% off your next lesson! Book at [mini-website-url]"), "Send in Chat" (copies formatted message for in-app chat)

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/instructor/InstructorDiscountCodesManager.tsx` | Full CRUD manager for instructor discount codes with share actions |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/InstructorSettings.tsx` | Add "Discount Codes" tile in Courses and Payments category |
| `src/pages/mini-website/MiniWebsiteServices.tsx` | Add discount code input and validation UI |

### Component Structure

The `InstructorDiscountCodesManager` will follow the same pattern as the existing admin `DiscountCodesManager` but scoped to the instructor's own codes, with added share/SMS functionality.

### Share Flow

```text
1. Instructor creates discount code (e.g. SUMMER25)
2. Can share via:
   a. Copy code to clipboard
   b. Bulk SMS -> pre-fills message template with code + mini-site link
   c. In-app chat -> copies formatted message
3. Pupil enters code on mini-website courses page
4. Price updates to show discount
5. times_used increments on redemption
```
