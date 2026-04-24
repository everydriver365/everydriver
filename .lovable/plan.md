

## Switch Google Maps to the new API key

The Maps key is stored as the `GOOGLE_PLACES_API_KEY` backend secret (served by the `get-google-maps-key` edge function). I'll update the secret value and re-enable Google Maps on the "Next Up" card.

### Steps

1. **Update backend secret** `GOOGLE_PLACES_API_KEY` → `AIzaSyDyewuNp5nDVuolsNQe0wTqWrTqP8SMiNk`
   - Used by `supabase/functions/get-google-maps-key/index.ts`
   - Picked up automatically by every Maps surface (`GoogleMapPreview`, `NearbyFriendsMap`, `LessonRouteRecorder`, live tracking, etc.) — no code change needed for those.

2. **Re-swap "Next Up" card to Google Maps** in `src/components/instructor/IOSNativeHomeView.tsx`
   - Remove `PostcodeMapPreview` import + usage
   - Use `GoogleMapPreview` with `postcode`, `address`, `height={140}`, `className="rounded-2xl overflow-hidden border"`

### Required on your end (Google Cloud, one-time)

For the new key to actually render maps, the Google Cloud project that owns it must have:
- **Billing enabled** (no charges under $200/month free tier)
- These APIs enabled: **Maps JavaScript API**, **Directions API**, **Geocoding API**
- HTTP referrer restrictions including `*.lovable.app/*`, `*.lovableproject.com/*`, `*.drive365.co.uk/*`, `*.everydriver.co/*`, `*.drivingschoolmanager.co.uk/*`

If billing/APIs aren't on, the new key will fail with the same `BillingNotEnabledMapError` as the old one.

### Out of scope
- No changes to other Maps surfaces (they'll just start working with the new key automatically)
- No changes to Leaflet components
- No schema or route changes

### Security note
You've now shared this API key in chat. Once it's working, restrict it to your domains in Google Cloud Console so it can't be abused if leaked.

