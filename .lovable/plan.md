

## Show Gap Duration in Gap Filler

**What you want:** Display the duration of each gap slot (e.g., "2h") alongside the start and end times, not just the time range.

---

### Current State
Each gap slot shows:
- Date badge: `Mon 3 Feb`
- Time range: `09:00 - 11:00`

### After This Change
Each gap slot will show:
- Date badge: `Mon 3 Feb`  
- Time range with duration: `09:00 - 11:00` **`2h`**

---

### Implementation

**File:** `src/components/instructor/GapsFiller.tsx`

1. **Add a helper function** to calculate duration from start/end times:
```typescript
const calculateDuration = (startTime: string, endTime: string): string => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
```

2. **Update the slot display** (around line 430-433) to include a duration badge:
```tsx
<span className="text-sm flex items-center gap-1">
  <Clock className="h-3 w-3" />
  {slot.startTime} - {slot.endTime}
</span>
<Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300">
  {calculateDuration(slot.startTime, slot.endTime)}
</Badge>
```

This will display each gap with both the time range AND a clear duration badge (e.g., "2h" or "1h 30m").

