

## Plan: Use DynamicCourseCard in Live Chat

The chat currently shows courses as tiny horizontal mini-cards (`CourseChatCards`). The goal is to replace these with the same `DynamicCourseCard` component used on the course search page, showing dates, prices, instructor info, brand colours, transmission, etc.

### What needs to change

**1. Edge function: Enrich course data** (`supabase/functions/ai-admin-receptionist/index.ts`)
- Add `car_type`, `brand_colour`, `home_postcode`, `home_address`, `bio`, `school_skim_amount` to the instructor query (line 49)
- Include these fields in each course object embedded in `<!--COURSES:...-->`:
  - `instructorId`, `instructorProfileImage`, `instructorCarType`, `instructorBrandColour`, `instructorPostcode`, `instructorAddress`, `instructorBio`, `instructorHourlyRate`, `instructorSchoolSkim`
  - `distance` from the nearby instructor data
  - `discountedPrice` from `instructor_courses`

**2. Update `CourseChatCards` component** (`src/components/live-chat/CourseChatCards.tsx`)
- Replace the minimal card UI with a vertical scrolling list of `DynamicCourseCard` components
- Update the `CourseCard` interface to include all the new fields from the edge function
- Map the flat course data into the `DynamicCourseCardProps` shape (constructing the `instructor` object)
- Since the chat panel is narrow (~350px), render cards stacked vertically with no flip animation (click navigates to booking instead)
- Use `DynamicCourseCard` directly but wrapped in a container that constrains width

**3. Parse function update** (`parseCourseCardsFromMessage`)
- Update the `CourseCard` interface to match the new enriched shape from the edge function

### Technical details

The `DynamicCourseCard` requires an `instructor` object with: `id`, `name`, `profile_image_url`, `car_type`, `car_make`, `car_model`, `home_postcode`, `home_address`, `hourly_rate`, `bio`, `brand_colour`, `school_skim_amount`. The edge function currently only fetches `id, name, home_postcode, hourly_rate, lat, lng, profile_image_url, special_skills, location_name, app_slug`. We need to add `car_type, brand_colour, home_address, bio, school_skim_amount` to the select query and pass them through to the course JSON.

The chat widget is ~350px wide so cards will render full-width stacked vertically, which matches the mobile course search layout. The flip interaction works on hover so it will still function in the chat context.

