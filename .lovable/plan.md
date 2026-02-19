

# Split-Pane Homepage Layout

A two-zone layout dividing the screen into a **fixed top panel** (current/next lesson focus) and a **scrollable bottom panel** (everything else). The top stays pinned as the user scrolls through secondary content below.

---

## Layout Structure

The screen splits roughly **40/60** vertically:

```text
+-------------------------------+
|  FIXED TOP PANE (40vh)        |
|  - Greeting + weather/GPS     |
|  - Next lesson card (hero)    |
|  - Quick stats row            |
+-------------------------------+
|  SCROLLABLE BOTTOM PANE       |
|  - Alerts (driving, engine)   |
|  - Messages tile              |
|  - Job Offers tile            |
|  - Test Requests              |
|  - YOUR DAY (timeline, route) |
|  - Quick Actions              |
|  - Vehicle Health / Agenda    |
|  - PLAN AHEAD section         |
|  - Earnings Forecast          |
|  - Road Alerts                |
|  - Setup Checklist            |
+-------------------------------+
```

---

## What Changes

1. **New wrapper in `InstructorMobileHome.tsx`** -- Instead of a single scroll container, the return JSX gets restructured into two zones:
   - A `div` with `sticky top-0 z-10` (or fixed positioning) containing the greeting card, stats grid, and the NextUpTile.
   - A scrollable `div` with `overflow-y-auto flex-1` for all remaining content.

2. **Top pane contents** (pinned):
   - Hero gradient card with avatar, greeting, GPS status, weather
   - 4-stat grid (Lessons, Earnings, Weekly %, Next up)
   - Next lesson card (NextUpTile) -- the primary focus element

3. **Bottom pane contents** (scrollable):
   - Everything else in its current order: alerts, messages, test requests, timeline, route preview, quick actions, vehicle health, agenda, plan ahead, earnings forecast, road alerts, setup checklist.

4. **Visual separator**: A subtle shadow or border between panes to reinforce the split.

5. **No hero image** in split-pane mode -- the top pane replaces it with a compact gradient header to maximize information density.

---

## Technical Details

- The existing `layoutStyle` check (line 313) already supports alternate layouts (`"schedule"` triggers `AppStyleHomeView`). We will add a new branch for `"split-pane"` or make it the new default layout.
- All existing hooks, data fetching, and component imports remain unchanged.
- The top pane will use `position: sticky; top: 0` within the PullToRefresh wrapper so pull-to-refresh still works.
- The NextUpTile component moves from the scrollable body into the fixed top section.
- The stats grid (lines 379-411) and greeting header (lines 341-377) move into the top pane.
- Bottom pane gets a `pt-4` padding and the rest of the existing content in order.
- Mobile-optimized: top pane max-height capped at ~40vh with overflow hidden to prevent it consuming too much space on small screens.

