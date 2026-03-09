

## Plan: Create a Compact Chat Course Tile

Replace the full-size `DynamicCourseCard` in the chat with a purpose-built compact tile that fits the ~350px chat width without hacky CSS overrides.

### Design

Each tile will be a single horizontal row card (~80px tall):
- **Left**: Small coloured date box (brand colour) with day/month
- **Centre**: Course name, instructor name, location — stacked in tight text
- **Right**: Price + "View" button

No flip, no hero image, no Klarna/Clearpay badges, no features list. Just the essential info in a scannable format.

### Changes

**`src/components/live-chat/CourseChatCards.tsx`** — full rewrite:
- Remove the `DynamicCourseCard` import and all the CSS override hacks
- Build a compact inline card directly:
  - Brand-coloured date strip (left, ~50px wide)
  - Title row: course name + badges (Popular/Intensive/Auto) as tiny pills
  - Subtitle: instructor name + location
  - Price on the right, with strikethrough for discounts
  - Entire card clickable → navigates to `/book/:instructorId?hours=X`
- Keep the existing `CourseCard` interface and `parseCourseCardsFromMessage` unchanged
- Keep the framer-motion stagger animation

