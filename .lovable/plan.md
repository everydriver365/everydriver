
# Compact the Floating Session Timer

## What changes
The `FloatingSessionTimer` component currently has two stacked rows (a header with pupil name + session type, and a stats row with timer/distance/stop button), making it tall and covering too much of the map.

## Solution
Merge everything into a single compact row:
- Remove the separate header section with the icon, pupil name, session type text, and REC indicator
- Combine into one row: **REC dot | Pupil name | Timer | Distance | Stop button**
- Reduce padding from `px-4 py-3` to `px-3 py-2`
- Shrink the timer/distance text from `text-2xl` to `text-lg`
- Remove the 10x10 icon box and border-b divider entirely

This will cut the tile height roughly in half while keeping all essential info visible.

## Technical details

**File: `src/components/instructor/tracking/FloatingSessionTimer.tsx`**

Replace the inner content (lines 42-119) with a single-row layout:

```tsx
<div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border px-3 py-2.5 flex items-center gap-3">
  {/* Live pulse */}
  <div className="flex items-center gap-1.5 shrink-0">
    <motion.div
      className="w-2 h-2 rounded-full bg-red-500"
      animate={{ opacity: [1, 0.4, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-[10px] font-semibold text-red-500">REC</span>
  </div>

  {/* Pupil name */}
  <span className="text-sm font-semibold text-foreground truncate min-w-0">
    {pupilName || "Test Route"}
  </span>

  {/* Spacer */}
  <div className="flex-1" />

  {/* Timer */}
  <div className="flex items-center gap-1.5 shrink-0">
    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    <span className="text-lg font-bold text-foreground tabular-nums">
      {formatElapsedTime(elapsedSeconds)}
    </span>
  </div>

  <div className="h-5 w-px bg-border" />

  {/* Distance */}
  <div className="flex items-center gap-1.5 shrink-0">
    <Route className="h-3.5 w-3.5 text-muted-foreground" />
    <span className="text-lg font-bold text-foreground tabular-nums">
      {distanceMiles.toFixed(1)}
      <span className="text-xs font-normal text-muted-foreground ml-0.5">mi</span>
    </span>
  </div>

  {/* Stop Button */}
  <Button
    variant="destructive"
    size="sm"
    className="h-8 px-3 rounded-xl font-semibold text-xs shrink-0"
    onClick={onStop}
    disabled={isStopping}
  >
    {isStopping ? (
      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
    ) : (
      <>
        <Square className="h-3.5 w-3.5 mr-1" />
        End
      </>
    )}
  </Button>
</div>
```

The `User` import can also be removed since the icon is no longer used.
