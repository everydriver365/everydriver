

## Add prominent "last updated" indicator on the live tracking map

### Current state
There is already an "Updated Xs ago" line inside the bottom sat-nav card (line 626-628), but it's small (`text-xs`) and buried among other info. The `now` state ticks every 1 second and `agoText` is already computed correctly.

### Change
Add a **floating badge** in the top-right corner of the map showing `"Updated 3s ago"` with a live-ticking clock icon. This makes the data freshness immediately visible without needing to look at the bottom panel.

### File: `src/components/instructor/GoogleLiveTrackingMap.tsx`

1. Import `Clock` from `lucide-react`
2. Add a floating overlay div positioned `absolute top-4 right-4 z-20` (next to the existing top-left controls), styled as a pill badge with backdrop blur
3. Show `agoText` with a small clock icon — green text when connected, amber when offline
4. Keep the existing "Updated" row in the bottom panel as-is for redundancy

The indicator will auto-update every second since `now` already ticks at 1s intervals.

