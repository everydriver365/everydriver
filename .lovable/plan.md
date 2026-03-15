

# Parent Portal UX Improvements

## Current State

The parent portal at 720 lines has similar issues to what we fixed in the pupil portal:

1. **Child detail page is a wall of content** — 10 components stacked vertically (stats card, feedback, upcoming lessons, attendance report, syllabus overview, lesson notes, payment history, safety scores, route history, payment top-up, chat). No zones or grouping.

2. **No grouped navigation on child detail** — Unlike the pupil portal's new accordion menu, the parent sees everything at once with no way to jump to a specific section.

3. **No reusable SubPageHeader** — Uses `ParentMobileHeader` with `showBackButton` prop, but the child detail page has no section-level navigation.

4. **Dashboard child cards duplicate detail view info** — The dashboard card shows stats, next lesson, test countdown — then the detail page repeats all of it. The dashboard cards are already good; the detail page needs restructuring.

5. **Settings page is bare** — Just phone number, child count, and logout. No notification preferences, no consent toggle, no theme.

6. **Bottom nav has no badges** — Unlike the updated pupil nav, no indicator for unread feedback or outstanding balances.

7. **No ARIA labels** — Same accessibility gap as the other portals (already partially addressed in the prior round for public/instructor).

---

## Implementation Plan

### 1. Restructure child detail into zoned layout with tabbed sections
Instead of 10 components stacked, add an `IOSSegmentedControl` at the top of the child detail view with 4 tabs:
- **Overview**: Stats card, next lesson, test countdown, progress bar (already exists)
- **Lessons**: Upcoming lessons, attendance report, lesson notes, route history
- **Progress**: Syllabus overview, safety scores, instructor feedback
- **Payments**: Payment history, top-up, balance info

This reduces scroll depth by ~75% on each view.

### 2. Add quick-action buttons to child detail header
Below the child info card, add 3 prominent action buttons: "Message Instructor", "Top Up Balance", "View Progress" — matching the pupil portal's FAB pattern but inline since parents have fewer actions.

### 3. Add badges to ParentBottomNav
- **Children tab**: Show count of children with negative balances (red dot)
- **Feedback tab**: Show count of unread/new feedback items

### 4. Enhance Settings page
Add notification preferences toggle (push notifications on/off), consent info display, and a "Linked Children" list with instructor contact details.

### 5. Add ARIA labels to parent components
- `ParentBottomNav`: `role="navigation"`, `aria-label`, `aria-current`
- `ParentMobileHeader`: `aria-label` on icon buttons

### 6. Use SubPageHeader pattern for consistency
Import and use the existing `SubPageHeader` component (created for pupil portal) in the child detail view instead of the full `ParentMobileHeader` with back button.

---

## Files to Modify
- **`src/pages/ParentPortal.tsx`** — Restructure child detail into tabbed zones, add quick actions, enhance settings
- **`src/components/parent/ParentBottomNav.tsx`** — Add badge support props, ARIA labels
- **`src/components/parent/ParentMobileHeader.tsx`** — Add ARIA labels

## Scope
~6 focused changes, all within existing files. No new components needed since we can reuse `SubPageHeader` and patterns from the pupil portal.

