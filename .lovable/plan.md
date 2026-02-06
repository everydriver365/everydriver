
# Instructor Mobile Homepage - 5 GUI Enhancements

## 1. Greeting Card "Tap to Expand" Hint
Add a bouncing ChevronDown icon at the bottom of the collapsed hero greeting card to signal it is expandable.

**File:** `src/components/instructor/ContextualHomeHero.tsx`
- Add a small ChevronDown icon centered below the rotating stats carousel (inside the card, before closing div)
- Apply a gentle bounce animation using framer-motion (`animate={{ y: [0, 3, 0] }}` repeating)
- Only show when card is NOT expanded
- Auto-hide after first tap (already handled by existing `isExpanded` state)

## 2. Quiet Day Illustration Upgrade
Enhance the QuietDayEmpty component with a gradient background and a "Book a Lesson" primary CTA.

**File:** `src/components/instructor/QuietDayEmpty.tsx`
- Replace `glass` class with a soft gradient: `bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20`
- Remove dashed border, use solid subtle border instead
- Add a primary "Book a Lesson" button linking to `/instructor/diary` above the existing "View Schedule" button
- Keep existing animated car, tips, and quotes

## 3. Section Headings for Visual Hierarchy
Add subtle uppercase section labels to group related cards on the homepage.

**File:** `src/components/instructor/InstructorMobileHome.tsx`
- Add "YOUR DAY" label before the Next Up tile / Mini Timeline / Route Preview group
- Add "QUICK ACTIONS" label before QuickActionTiles
- Add "INSIGHTS" label before Today's Stats / Weekly Progress
- Add "PLAN AHEAD" label before Tomorrow Peek / Setup Checklist
- Style: `text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-4 mt-6 mb-2`
- Only show each heading when its section has visible content

## 4. Tappable Today's Stats Card
Make the Today's Stats card navigate to the earnings/money page on tap.

**File:** `src/components/instructor/InstructorMobileHome.tsx`
- Wrap the Today's Stats card content in a clickable `div` with `onClick={() => navigate("/instructor/money")}` and `cursor-pointer`
- Add a small ChevronRight icon in the header row next to "Today's Stats" to indicate interactivity
- Add `whileTap={{ scale: 0.98 }}` via framer-motion for tactile feedback
- Import `ChevronRight` from lucide-react

## 5. Pull-to-Refresh "Updated" Feedback
Show a brief animated "Updated" banner after pull-to-refresh completes.

**File:** `src/components/instructor/InstructorMobileHome.tsx`
- Add a `showRefreshFeedback` state boolean
- After `handleRefresh` completes, set it to `true`
- Auto-dismiss after 1.5 seconds via `setTimeout`
- Render an `AnimatePresence` block at the top of the page content showing a small pill: "Updated just now" with a CheckCircle icon
- Style: centered, rounded-full, bg-emerald-500 text-white, small text, fades in/out

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/instructor/ContextualHomeHero.tsx` | Add bouncing ChevronDown hint when collapsed |
| `src/components/instructor/QuietDayEmpty.tsx` | Gradient bg, solid border, "Book a Lesson" CTA |
| `src/components/instructor/InstructorMobileHome.tsx` | Section headings, tappable stats with ChevronRight + navigation, refresh feedback banner |

No new dependencies needed. All changes use existing framer-motion, lucide-react, and react-router-dom.
