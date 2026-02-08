

# Fix: Next Lesson Tile Always Shows Wrong Location

## Problem

When you update a pupil's address in their record, the Next Lesson tile does not reflect the change. This is because the address is **copied onto the lesson record at the time of scheduling** and never updates afterward. The tile then reads this stale lesson-level copy instead of the pupil's current address.

For example, "Fred kebab" was scheduled with a test address ("Bsbdb / BBSBDBE"), but you later updated his real address to "31 Chambord Street / E2 7NJ". The tile still shows the old test data.

## Solution

Change the address resolution logic so the **pupil's current home address is always the fallback**, and lesson-level overrides are only used when they are genuinely different from the pupil's home address. This way, updating the pupil record always takes effect.

### Priority order (updated):
1. Pupil's default pickup address (if set) -- for pupils who are always collected from a different location
2. Pupil's home address -- the live, up-to-date address from their profile
3. Lesson-specific override -- only if it is meaningfully different from both of the above (for one-off alternate locations)

## Changes

### 1. Update `src/hooks/useNextLessonDetails.ts`

Reverse the current priority so the pupil's live profile data takes precedence over the stale lesson-level snapshot:

- **Postcode**: Use `pupil.pickup_postcode` (if set), otherwise `pupil.postcode`, and only fall back to `lesson.pickup_postcode` if the lesson has a genuinely unique override
- **Location**: Use `pupil.pickup_address` (if set), otherwise `pupil.address`, and only fall back to `lesson.pickup_location` if unique

### 2. Update `src/components/instructor/ScheduleLessonsDialog.tsx`

When scheduling lessons, use the pupil's `pickup_address`/`pickup_postcode` fields (if set) as the default pickup location, falling back to home address. This ensures new lessons start with the best available address.

---

### Technical Detail

Current broken priority in `useNextLessonDetails.ts`:
```
pupil.pickup_postcode || lesson.pickup_postcode || pupil.postcode
```

Fixed priority:
```
pupil.pickup_postcode || pupil.postcode || null
pupil.pickup_address  || pupil.address  || null
```

The lesson-level `pickup_location`/`pickup_postcode` will no longer be used for the tile display, since it is always a stale snapshot. It remains in the database for historical/export purposes but will not drive the live tile.

