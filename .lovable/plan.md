

## Plan: Redesign NextUpTile with Premium Gradient Design

Replace the current `NextUpTile` component with the exact design specification provided. The existing logic (hooks, handlers, dialogs) will be preserved while completely restyling the UI.

### What changes

**File: `src/components/instructor/NextUpTile.tsx`** — Full restyle of the component:

1. **Container**: Replace white card with blue gradient background (`rgb(38,64,140)` → `rgb(31,89,166)` → `rgb(26,115,179)`), 22px border-radius, box-shadow.

2. **Header (always visible)**:
   - Left: 50px circular avatar with white initials on `rgba(255,255,255,0.2)` background, red unread badge (18px).
   - Center: "NEXT UP" label (uppercase, white 60%, bold, letter-spacing 0.5px) · countdown in cyan, auto-refreshing every 30s. Pupil name in white ~20px bold.
   - Right: Start time in white ~22px bold monospaced. Chevron toggle at 50% opacity.
   - Below: Row of capsule pills (date, duration, postcode) with `rgba(255,255,255,0.1)` backgrounds.

3. **Expanded content** (350ms animation):
   - Divider: 1px `rgba(255,255,255,0.1)`
   - Info badges row: 3 equal-width vertical badges (Start, Duration, Balance/Due) on `rgba(255,255,255,0.08)`
   - Live ETA row: Cyan car icon, "~Xmin" bold, traffic condition dot + label
   - Unread messages row: Orange icon, conditional display
   - Start Lesson: Green gradient button (≤15 min only)
   - Primary actions: 4 equal buttons (Navigate, On My Way dropdown, Call, SMS) on `rgba(255,255,255,0.12)`
   - Secondary actions: Reschedule + Cancel Lesson buttons

4. **Existing logic preserved**: All hooks (`useTrafficETA`, `usePupilUnreadCount`), SMS handlers, navigation, cancel/reschedule dialogs remain unchanged.

5. **Countdown auto-refresh**: Add a `useEffect` with 30-second `setInterval` to force re-render the countdown timer.

### No other files change
The component interface (`NextUpTileProps`) stays identical. `InstructorMobileHome.tsx` continues rendering `<NextUpTile>` with the same props.

