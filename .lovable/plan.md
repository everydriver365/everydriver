

## Public Courses API + WordPress Embed Snippet

### 1. New Edge Function: `public-courses`

Create `supabase/functions/public-courses/index.ts` -- a public API endpoint that accepts an instructor's `app_slug` and returns their course availability as JSON.

**Request:** `GET /public-courses?slug=jane-smith`

**Response (JSON):**
```json
{
  "instructor": {
    "name": "Jane Smith",
    "hourlyRate": 35,
    "carType": "Manual",
    "profileImage": "https://..."
  },
  "courses": [
    {
      "hours": 10,
      "price": 350,
      "discountedPrice": 299,
      "nextAvailable": "2026-02-18",
      "isPopular": true,
      "isIntensive": false,
      "features": ["Free theory app", "Pick-up included"],
      "bookingUrl": "https://everydriver.lovable.app/i/jane-smith/courses"
    }
  ]
}
```

**Logic mirrors `useFeaturedCourses`**: fetches instructor by slug, their courses, templates, working hours, and date overrides, then calculates the first available date per course.

**Config:** Add `verify_jwt = false` to `supabase/config.toml` (public endpoint, no auth needed). Includes CORS headers for cross-origin WordPress requests.

### 2. WordPress Embed Snippet Generator

Add a new section to the **Instructor Mini-Website Settings** page (`src/pages/InstructorMiniWebsiteSettings.tsx`) with a "WordPress Embed" card containing:

- A ready-to-copy HTML/JavaScript snippet that:
  - Fetches from the `public-courses` endpoint using the instructor's slug
  - Renders course cards with name, hours, price, next available date, and a "Book Now" link
  - Uses inline CSS so it works in any WordPress theme (no external stylesheets)
  - Includes the instructor's brand colour for button styling
- A "Copy to Clipboard" button

**Example snippet output:**
```html
<div id="everydriver-courses"></div>
<script>
(function(){
  var slug = "jane-smith";
  var el = document.getElementById("everydriver-courses");
  fetch("https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/public-courses?slug=" + slug)
    .then(function(r){ return r.json(); })
    .then(function(data){
      var html = "";
      data.courses.forEach(function(c){
        html += '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:8px 0;">';
        html += '<h3>' + c.hours + ' Hour Course</h3>';
        html += '<p>From &pound;' + (c.discountedPrice || c.price) + '</p>';
        html += '<p>Next available: ' + c.nextAvailable + '</p>';
        html += '<a href="' + c.bookingUrl + '" target="_blank" '
              + 'style="background:#1e3a5f;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none;">'
              + 'Book Now</a>';
        html += '</div>';
      });
      el.innerHTML = html;
    });
})();
</script>
```

### 3. Files Changed

| File | Change |
|------|--------|
| `supabase/functions/public-courses/index.ts` | **New** -- public API returning course availability JSON |
| `supabase/config.toml` | Add `[functions.public-courses]` with `verify_jwt = false` |
| `src/pages/InstructorMiniWebsiteSettings.tsx` | Add "WordPress Embed" card with copyable snippet |

No database changes needed -- reads existing tables only.

