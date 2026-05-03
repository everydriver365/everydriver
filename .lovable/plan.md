## Goal

Replace the "Weather data not connected" placeholder in the **Conditions** section of `src/components/instructor/UpNextExpanded.tsx` with live weather for the lesson's pickup postcode.

## Approach

Reuse the existing Open-Meteo pattern (already used by `useTomorrowWeather`) but with a new hook that:
1. Accepts a UK postcode (already in the lesson data as `pickupPostcode`).
2. Geocodes it via `https://api.postcodes.io/postcodes/{postcode}` (free, UK-only, no key).
3. Fetches current conditions from `https://api.open-meteo.com/v1/forecast` (free, no key) — temperature, WMO weather code, wind speed, visibility.
4. Maps the WMO code to a description + icon name + tint category (`clear | cloudy | rain | snow | fog | storm`).

No secrets, no edge function, no schema changes.

## Changes

### 1. New hook: `src/hooks/useLessonWeather.ts`
- Exports `useLessonWeather(postcode)` returning `{ temperature, description, icon, windSpeed, visibility, category }` plus the React Query loading/error state.
- 15-min `staleTime`, disabled when postcode is missing, returns `null` on any failure (graceful).

### 2. Edit `src/components/instructor/UpNextExpanded.tsx`
- Import the hook + the lucide icons (`Sun`, `CloudSun`, `Cloud`, `CloudFog`, `CloudDrizzle`, `CloudRain`, `CloudSnow`, `Snowflake`, `CloudLightning`, `Wind`, `Eye`).
- Call `useLessonWeather(pickupPostcode)` in the component body.
- Replace the existing `{/* SECTION 5 — Conditions */}` block (~lines 489–510) with:
  - **Loading state**: shimmer-style placeholder row (matches existing iOS Consistency memory).
  - **Error / no-postcode state**: keep current "Weather data not connected" muted message.
  - **Loaded state**:
    - Background tint per `category`: clear/cloudy → `#EEF3FF`, rain → `#EEF6FF`, fog → `#F5F5F0`, snow → `#F0F6FF`, storm → `#FFF0F0`.
    - Top row: weather icon (mapped from `icon` name) + condition label + temperature `· {n}°C`.
    - Bottom row (muted): `Wind {n} mph · Visibility {n} mi`.
- **Imperial conversion** (project rule: imperial units): convert km/h → mph (`* 0.621371`) and km → mi (`* 0.621371`), rounded to whole numbers.

## Notes / decisions

- Open-Meteo + postcodes.io are both free and keyless — no `add_secret` step, no edge function needed.
- Hook is independent of `useTomorrowWeather` so we don't disturb the dashboard's existing tomorrow-preview logic.
- All UI tokens (`BLUE`, `MUTED`, `BLUE_TINT`, `BORDER`) already exist in `UpNextExpanded.tsx`.
- Failure modes (bad postcode, API down, missing fields) all collapse to the existing "not connected" muted row, so the tile never breaks.

## Files

- New: `src/hooks/useLessonWeather.ts`
- Edit: `src/components/instructor/UpNextExpanded.tsx`
