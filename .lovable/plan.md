
# Vehicle Health Strip Below Hero

## What it does
Adds a compact, glanceable vehicle health card immediately below the hero section on the instructor mobile home page. It shows key vehicle metrics at a glance -- battery level, ignition status, connectivity, and last seen time -- so the instructor doesn't need to navigate to the full Vehicle Health page.

## Design
- A single rounded-xl card sitting between the hero and the alerts/content area
- Shows the primary (or first linked) device's status in a horizontal layout:
  - Battery icon + percentage with colour coding (green/orange/red)
  - Ignition status (ON/OFF with icon)
  - Connection status dot (green = online, grey = offline)
  - Vehicle registration if linked
- Tapping the card navigates to `/instructor/vehicle-health` for full details
- If no devices exist, the card is hidden entirely (no empty state clutter)

## Technical Details

### 1. New component: `src/components/instructor/VehicleHealthStrip.tsx`
- Accepts `instructorId` prop
- Calls `useVehicleHealth()` to get devices and vehicles
- Picks the first device (or the one linked to the primary vehicle)
- Renders a compact horizontal card with:
  - Battery icon (BatteryLow/Medium/Full) + percentage, colour-coded
  - Key icon for ignition ON/OFF
  - Wifi/WifiOff icon for connectivity
  - Vehicle registration label if linked
  - "Last seen X ago" text
  - ChevronRight to indicate it's tappable
- Wrapped in a Link to `/instructor/vehicle-health`
- Returns `null` if no devices found or still loading

### 2. Modify: `src/components/instructor/InstructorMobileHome.tsx`
- Import `VehicleHealthStrip`
- Place it inside the `<div className="px-4">` block, right after the hero closing div (around line 339), before the alerts strip
- Pass `instructorId` as a prop

### Styling
- Uses the same rounded-xl card style with shadow matching the updated tile aesthetic: `bg-white rounded-xl shadow-[0_2px_12px_rgba(20,37,66,0.12)]`
- Battery colour: red for 0-20%, orange for 21-50%, green/primary for 51-100%
- Compact height -- single row, no wasted space
