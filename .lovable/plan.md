

## Why the Schedule Only Shows a Week

**Root cause**: There is a race condition between two effects when entering the Schedule view.

1. When the user switches to Schedule, the init effect (line 62-76 in `InstructorSchedule.tsx`) calls `calendar.goToDate(today)` followed by `calendar.refetch(true)`.
2. `goToDate` updates `currentDate` state, which causes `fetchEvents` to be recreated (it depends on `currentDate`).
3. This recreation triggers the auto-fetch effect (`useEffect(() => { fetchEvents(); }, [fetchEvents])`) which calls `fetchEvents()` with **no arguments**.
4. At that point, `lastExtendedRangeRef.current` is still `false`, so the fetch uses `getDateRange` with `view='week'` and `extendedRange=false` -- fetching only one week of data.
5. The explicit `refetch(true)` call may also run, but it can be overwritten by the subsequent auto-fetch triggered by the state change.

**The fix**: Ensure the `view` state or extended range flag is properly synchronized before any fetch occurs. The cleanest approach:

### Step 1: Add a persistent "extendedRange" mode to `useInstructorCalendar`

In `src/hooks/useInstructorCalendar.ts`:
- Add an `extendedRange` state (boolean, default `false`).
- When `extendedRange` is `true`, `getDateRange` always returns the 365-day window regardless of `view`.
- Include `extendedRange` in the `fetchEvents` dependency list so it naturally triggers a refetch.
- Remove the `lastExtendedRangeRef` workaround.
- Expose `setExtendedRange` from the hook.

### Step 2: Set extended range when entering/leaving Schedule

In `src/pages/InstructorSchedule.tsx`:
- When `viewMode` changes to `'schedule'`, call `calendar.setExtendedRange(true)`.
- When `viewMode` changes away from `'schedule'`, call `calendar.setExtendedRange(false)`.
- Remove the manual `refetch(true)` call and the `scheduleInitRef` workaround -- the state-driven approach handles it automatically.

### Technical Details

**`useInstructorCalendar.ts` changes:**
```text
- Add: const [extendedRange, setExtendedRange] = useState(false);
- Modify fetchEvents: remove the extendedRange parameter and lastExtendedRangeRef;
  always use the extendedRange state value in getDateRange call
- Add extendedRange to fetchEvents useCallback dependencies
- Return setExtendedRange from the hook
```

**`InstructorSchedule.tsx` changes:**
```text
- Remove scheduleInitRef and its associated useEffect
- Add a simpler useEffect:
    useEffect(() => {
      if (viewMode === 'schedule') {
        calendar.goToDate(new Date());
        calendar.setExtendedRange(true);
      } else {
        calendar.setExtendedRange(false);
      }
    }, [viewMode]);
```

This eliminates the race condition because `extendedRange` is part of the reactive state, and the auto-fetch effect will always use the correct range.

