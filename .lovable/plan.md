

## Enhanced WordPress Embed: Course Tiles + In-Page Booking

### What changes

**1. Upgraded course tile design in the embed snippet**

The current snippet renders basic cards. The new version will produce visually rich tiles matching the style of the main app:

- Course image (if available from the API)
- "Popular" badge with instructor brand colour
- Course name, duration, and feature bullets
- Price with strike-through for discounted courses
- Next available date
- Styled "Book Now" button

**2. Enhanced `public-courses` API response**

Add additional fields to the edge function response so the embed snippet has richer data to display:

- `features` array (already returned but not used in the snippet)
- `courseImageUrl` from `instructor_courses.course_image_url` or `course_templates.default_image_url`
- `courseName` from templates (already returned as `name`)

**3. In-page booking via iframe modal**

Instead of opening a new tab (`target="_blank"`), clicking "Book Now" will open an iframe overlay **within the WordPress page**. This keeps the entire booking journey on the instructor's website:

- A full-screen semi-transparent overlay appears
- The booking page (`/book/:instructorId?course=X`) loads inside a centered, responsive iframe
- A close button lets users dismiss the overlay
- The WordPress page remains in the background

No changes are needed to the actual booking page -- it already works standalone.

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/public-courses/index.ts` | Add `courseImageUrl` field to each course in the response |
| `src/components/instructor/WordPressEmbedSnippet.tsx` | Rewrite snippet to render richer tiles and include iframe modal booking logic |

### Technical details

**Updated snippet structure (vanilla JS, no dependencies):**

```text
+--------------------------------------------------+
|  [Course Image]                                   |
|  [Popular Badge]                                  |
|                                                   |
|  Course Name                                      |
|  10 hours of instruction                          |
|                                                   |
|  * Feature 1                                      |
|  * Feature 2                                      |
|  * Feature 3                                      |
|                                                   |
|  GBP 299  (was GBP 350)                           |
|  Next available: 18 Feb 2026                      |
|                                                   |
|  [ Book Now ]                                     |
+--------------------------------------------------+
```

**Iframe modal behaviour:**

- "Book Now" calls a JS function that creates an overlay `<div>` with an `<iframe>` pointing to `everydriver.lovable.app/book/:instructorId?course=X`
- Overlay uses `position:fixed; top:0; left:0; width:100%; height:100%; z-index:999999`
- Iframe is `width:100%; max-width:600px; height:90vh` centered on screen
- Close button in top-right corner removes the overlay
- Clicking the dark backdrop also closes it

**Edge function change:**

Add `course_image_url` and `default_image_url` to the query, and include `courseImageUrl` in the response for each course.
