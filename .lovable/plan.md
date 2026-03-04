

## Swipeable "Today / This Week / This Month" Tile in Hero

### What changes

Replace the static "This Week" tile at the bottom of the hero banner with a **horizontally swipeable carousel** containing three slides, each with its own progress ring and stats:

1. **Today** — Shows today's completed vs scheduled lessons, with the same dual-arc progress ring (green completed, red scheduled). Label: "TODAY", subtitle: "{n} lessons today".

2. **This Week** — The current view, unchanged. Label: "THIS WEEK", subtitle: "{n} lessons scheduled".

3. **This Month** — Shows monthly completed vs total lessons. Label: "THIS MONTH", subtitle: "{n} lessons this month".

A row of 3 small dot indicators sits below the carousel to show which slide is active.

### Data

- **Today**: Already available via `useTodayOverview` — has `lessonCount`. Need to also get today's completed count (filter by `status === 'completed'`). Will update the hook to return `completedCount`.
- **This Week**: Already passed in as props from `useWeeklyGoals`.
- **This Month**: Create a new `useMonthlyGoals` hook (similar to `useWeeklyGoals`) that queries `scheduled_lessons` for the current month, returning `lessonsThisMonth`, `lessonsCompleted`, `lessonsScheduled`.

### Implementation

1. **New hook `src/hooks/useMonthlyGoals.ts`** — Queries scheduled_lessons for current month (1st to end), returns total/completed/scheduled counts.

2. **Update `useTodayOverview.ts`** — Add `completedCount` to the return (count lessons with `status === 'completed'`).

3. **Update `HomepageHero` props** — Add today and monthly data props (todayCompleted, todayTotal, monthlyCompleted, monthlyScheduled, monthlyTotal).

4. **Refactor `HomepageHero.tsx`** — Replace the static tile with an Embla carousel (already installed). Each slide renders the frosted glass card with its own label, text, and progress ring. Add dot indicators below. Unique gradient IDs per slide to avoid SVG conflicts.

5. **Update `InstructorMobileHome.tsx`** — Import `useMonthlyGoals`, pass new props to `HomepageHero`.

### Visual details

- Carousel uses `embla-carousel-react` with `{ loop: false, align: "center" }`.
- Each slide is full-width inside the tile area.
- 3 dots centered below the card: active dot is `bg-white`, inactive `bg-white/40`, all 6px circles.
- Progress rings animate on slide entry using framer-motion.
- Card styling remains identical: `bg-white/95 dark:bg-card/90 backdrop-blur-xl rounded-2xl`.

