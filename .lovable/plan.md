

## Plan: Make Ken-D Mini-Site the Default Template for All Instructors

### Current State
The `MiniWebsiteHome.tsx` component is already shared by ALL instructor mini-sites. However, several pieces of content are hardcoded with Ken-D specific values, meaning other instructors see Ken-D's details rather than their own. The database trigger `create_instructor_website_pages()` seeds generic content blocks, but the homepage layout ignores them in favour of the hardcoded Ken-D design.

### What Needs to Change

**1. Dynamic hero headline** (currently hardcoded "Winchester, Southampton & Portsmouth")
- Replace with instructor's `home_postcode` area or a fallback like the instructor's name
- Use the `hero_heading` from the instructor's home page record if available

**2. Dynamic pricing** (currently hardcoded £1,299, £999, £45/hr)
- Use the instructor's `hourly_rate` for weekly lessons (already partially done)
- For intensive/semi-intensive, calculate from instructor's actual courses if available, or show "Contact us" if no courses are set up

**3. Remove Ken-D style override**
- Lines 127-129 have a hardcoded override for the "ken-d" slug — remove this so all instructors use their own `brand_colour`

**4. Dynamic instructor image**
- Use `instructor.profile_image_url` or `instructor.hero_image_url` instead of the hardcoded `defaultHeroImage` asset, falling back to the default if none is set

**5. Dynamic phone number in promo banner**
- Line 157 has a hardcoded `07506782870` — replace with `instructor.phone`

**6. Update the database trigger**
- Modify `create_instructor_website_pages()` to include richer default content blocks that align with the Ken-D template sections (benefits, course tiles, feature grid, etc.), so the admin page editor has meaningful defaults

### Files to Edit
- `src/pages/mini-website/MiniWebsiteHome.tsx` — main changes (dynamic data instead of hardcoded values)
- Database migration — update the `create_instructor_website_pages()` trigger function with improved defaults

### No Breaking Changes
- Ken-D's site will continue to work; it will just pull data from its own instructor record instead of hardcoded overrides
- All other instructor sites will immediately get the full Ken-D layout with their own branding and data

