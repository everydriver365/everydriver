

## Redesign: + button menu → iOS-style side drawer

Replace the small dropdown that opens from `QuickActionsFAB` with a polished full-height side drawer styled like the reference (navy header, large rows with circular icons, chevron disclosures, active-row tint).

### Reference cues being adopted
- Full-height drawer, ~80% screen width, slides in from the left
- Dark navy header bar with the DSM logo and product name
- First row visually "active" with brand-tinted background and pill highlight
- Each row: circular monochrome icon + label + chevron, generous tap height (~56px)
- Soft divider lines, rounded-2xl tap targets, iOS spring animation
- Backdrop dim + blur, swipe-to-close, safe-area padded

### Files to change
1. **Create** `src/components/instructor/QuickActionsDrawer.tsx`
   - Built on `vaul` Drawer (already used by `IOSSheet`) with `direction="left"`
   - Props: `open`, `onOpenChange`, `actions: QuickAction[]`, `onActionClick(action)`
   - Layout:
     - Sticky navy header (`hsl(var(--dsm-navy))`) with `dsm-logo.png` + "DSM" wordmark + close `X`
     - Scrollable list of rows; first row gets tinted background (`#E8EEFF` light / brand-blue 12% dark) and bold label
     - Bottom safe-area spacer; subtle footer caption "Driving School Manager"
   - Animation: spring 320 stiffness / 32 damping, scale-background enabled

2. **Modify** `src/components/instructor/QuickActionsFAB.tsx`
   - Keep the existing `QuickAction[]` array, navigation logic, `AddLessonSheet`, haptics, position, scroll/visibility — **unchanged**
   - Remove the inline `<motion.div>` dropdown panel (lines ~122–162)
   - Render `<QuickActionsDrawer open={isOpen} onOpenChange={setIsOpen} actions={quickActions} onActionClick={handleActionClick} />` instead
   - FAB button itself stays the same (rotates +45° when open)

### Action list (unchanged data, just re-styled)
Add Lesson · Add Pupil · Track Live · Take Payment · Messages · Nearby ADIs

### Styling tokens used
- Header background: `hsl(var(--dsm-navy))` with white text
- Active row tint: `hsl(var(--dsm-accent-blue) / 0.10)`
- Icon chips: 36px circle, `bg-zinc-100 dark:bg-white/8`, icon `hsl(var(--dsm-text-primary))`
- Row height: 56px, `px-4`, `rounded-2xl`, separator `bg-black/[0.06]`
- Drawer width: `min(86vw, 340px)`; full height; rounded right edge `rounded-r-[18px]`

### What stays exactly the same
- All routes and click handlers in `getQuickActions(...)`
- `AddLessonSheet` flow
- Scroll-hide behaviour and FAB position
- Haptics calls

### Out of scope
- No changes to other FABs (`RadialFAB`, `ScheduleFAB`, `PupilQuickActions`)
- No backend / data changes

