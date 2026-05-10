Plan to fix the Winchester whitelabel site:

1. Fix the data access causing the 404s
- The reviews page and courses page are failing because public reads of the safe instructor view are currently blocked by database permissions.
- Add a database migration to restore anonymous/authenticated SELECT access to `public_instructors` and ensure it remains a safe public view of active instructor fields only.

2. Make whitelabel reviews use public-safe instructor data
- Update the mini-website page loader so whitelabel/public pages resolve instructors through `public_instructors` instead of the locked private `instructors` table.
- Keep published page lookup via `instructor_website_pages`, which already has a public published-page policy.
- This should stop `/reviews` showing “Page Not Found” for Ken D.

3. Make Ken D courses load from June 2026
- Keep `/courses` scoped to the Winchester instructor slug `ken-d`.
- Once the public instructor lookup works, the existing Ken D record (`available_from = 2026-06-01`) and active working hours/courses should render June 2026 availability.
- If needed, make the course page select the first actual available June date after loading instead of leaving the user on an empty state.

4. Populate contact details from the instructor record
- Remove the hard-coded Ken D contact override in the contact page.
- Use Ken D’s instructor record values: phone `07767693276`, email `info@winchesterdrivingschool.co.uk`, and location from the instructor location fields/postcode.
- Make the Winchester `/contact` route render the Ken D contact page through the whitelabel slug, matching the existing `/reviews` whitelabel handling.

5. Verify on mobile preview
- Check `/reviews`, `/courses`, and `/contact` with the Winchester whitelabel override at mobile width.
- Confirm reviews no longer 404, courses show Ken D availability from June 2026, and contact details are populated from the record.