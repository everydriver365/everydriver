

# Review Collection and Moderation System

## Summary
Build a complete review pipeline: a public-facing form where students can submit reviews via a unique link, an instructor moderation panel to approve/reject them before they appear on the mini-website, and optional automated review request emails/SMS after lessons.

## How It Works

1. **Student submits a review** via a public link (e.g. `everydriver.lovable.app/review/{instructor_slug}`)
2. Review is saved with `is_visible = false` (pending moderation)
3. **Instructor gets notified** of the new review in their portal
4. Instructor **approves or rejects** the review from a moderation panel
5. Approved reviews appear on the mini-website Reviews page

## What Gets Built

### 1. Public Review Submission Page
A clean, mobile-friendly form accessible at `/review/{slug}` (no login required):
- Star rating (1-5, required)
- Reviewer name (required)
- Course hours completed (required)
- Written review (required, max 500 characters)
- Simple spam protection (honeypot field)
- Success confirmation screen after submission

The form uses Zod validation and encodes all inputs properly.

### 2. Database Changes
- Add a `moderation_status` column to `course_reviews` (`pending`, `approved`, `rejected`) -- this replaces the boolean `is_visible` approach with a clearer workflow
- Add a `reviewer_email` column (optional, for follow-up)
- Add a `moderation_note` column (optional, for instructor to note why they rejected)
- Update RLS: allow anonymous `INSERT` on `course_reviews` (so the public form works), keep `SELECT` restricted to `moderation_status = 'approved'` for public views
- Update existing queries to use `moderation_status = 'approved'` instead of `is_visible = true`

### 3. Instructor Moderation Panel
A new section in the instructor portal (`/instructor/reviews`) with:
- **Pending tab**: New reviews awaiting moderation, with Approve/Reject buttons
- **Approved tab**: Published reviews (with option to unpublish)
- **Rejected tab**: Rejected reviews (with option to reconsider)
- Star rating display, reviewer name, review text, and submission date shown for each
- Toast notifications for actions

### 4. Navigation Updates
- Add "Reviews" item to the instructor menu (under a suitable section)
- Show a badge count of pending reviews on the menu item

### 5. Shareable Review Link
On the moderation page, display a copyable "Request Review" link that the instructor can share with students via WhatsApp, SMS, or email. The link points to the public submission form.

### 6. Update Mini-Website Queries
Change all public-facing review queries from `.eq("is_visible", true)` to `.eq("moderation_status", "approved")` across:
- `MiniWebsiteReviews.tsx`
- `MiniWebsiteHome.tsx`
- `InstructorMiniWebsite.tsx`
- `BookingSummary.tsx`

---

## Technical Details

### Database Migration
```sql
-- Add moderation columns
ALTER TABLE public.course_reviews 
  ADD COLUMN moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN reviewer_email text,
  ADD COLUMN moderation_note text;

-- Migrate existing data: visible = approved, hidden = rejected
UPDATE public.course_reviews SET moderation_status = 'approved' WHERE is_visible = true;
UPDATE public.course_reviews SET moderation_status = 'rejected' WHERE is_visible = false;

-- Update RLS: allow anonymous inserts
CREATE POLICY "Anyone can submit a review"
  ON public.course_reviews FOR INSERT
  TO anon WITH CHECK (true);

-- Update public read policy
DROP POLICY IF EXISTS "Reviews are publicly viewable" ON public.course_reviews;
CREATE POLICY "Approved reviews are publicly viewable"
  ON public.course_reviews FOR SELECT
  USING (moderation_status = 'approved');

-- Instructors can read their own reviews (all statuses)
CREATE POLICY "Instructors can view own reviews"
  ON public.course_reviews FOR SELECT TO authenticated
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  ));

-- Instructors can update moderation status on their own reviews
CREATE POLICY "Instructors can moderate own reviews"
  ON public.course_reviews FOR UPDATE TO authenticated
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  ))
  WITH CHECK (instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  ));
```

### New Files
| File | Purpose |
|------|---------|
| `src/pages/mini-website/SubmitReview.tsx` | Public review submission form |
| `src/pages/InstructorReviews.tsx` | Instructor moderation panel |

### Modified Files
| File | Change |
|------|--------|
| `src/App.tsx` | Add routes for `/review/:slug` and `/instructor/reviews` |
| `src/pages/InstructorMenu.tsx` | Add "Reviews" menu item with pending count badge |
| `src/pages/mini-website/MiniWebsiteReviews.tsx` | Query by `moderation_status = 'approved'` |
| `src/pages/mini-website/MiniWebsiteHome.tsx` | Same query update |
| `src/pages/InstructorMiniWebsite.tsx` | Same query update |
| `src/pages/BookingSummary.tsx` | Same query update |

