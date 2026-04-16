

## Plan: Remove Daily Tip from Home Screen

### Change
**File: `src/components/instructor/BriefingActionCards.tsx`**

Remove the `DAILY_TIPS` array (lines 84-92), the `tipIndex` variable (line 96), and the "Daily Tip" `motion.div` block (lines 145-153).

### What stays
Everything else in the component (quick stats strip, action cards) remains unchanged.

