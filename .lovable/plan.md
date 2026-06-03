# Apply Chapman's branding to the combined booking page

Update the existing `booking_pages` row with `slug='chapmans'` to use Chapman's Driving School visual identity instead of the placeholder.

## Steps

1. Download the Chapman's wordmark logo from `drivinglessonswinchester.com`, upload it to the public `booking-page-logos` storage bucket, and capture the public URL.
2. Update `booking_pages` row `slug='chapmans'`:
   - `brand_colour` → `#F37020` (Chapman's orange)
   - `logo_url` → uploaded logo URL
3. Verify at `https://bookings.drive365.co.uk/booking/chapmans`.

No code or schema changes.
