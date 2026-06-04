## Goal
Replace the DRIVE / 365 text lockup in the new mobile hero on `/booking/chapmans` with the Chapman's logo already stored on the booking page (`page.logo_url` → `chapmans-logo.png`).

## File
`src/pages/PublicBookingPortal.tsx` — the Drive 365 lockup block inside the `slug === "chapmans"` mobile hero (currently the two coloured `DRIVE` / `365` spans above the H1).

## Change
Swap the lockup `<div>` for the logo image when `page?.logo_url` exists:

```tsx
{page?.logo_url && (
  <img
    src={page.logo_url}
    alt={page?.name ?? "Chapman's Driving School"}
    style={{
      position: "relative",
      display: "block",
      height: 40,
      width: "auto",
      margin: "0 auto 14px",
      objectFit: "contain",
    }}
  />
)}
```

The current Chapmans logo is dark/red on a transparent background and the hero is bright orange, so it would disappear. To keep it legible we wrap it in a soft white chip:

- Wrapper: inline-flex, `background: rgba(255,255,255,0.95); border-radius: 10px; padding: 6px 12px; margin: 0 auto 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);`
- Image: `height: 28px; width: auto; object-fit: contain; display: block;`

If `page.logo_url` is missing we fall back to the existing DRIVE / 365 lockup so other slugs / unconfigured pages still render something.

## Out of scope
- No copy, headline, subhead, trust-pill, search-card, or filter changes.
- Desktop hero untouched (already uses `page.logo_url`).
- No new asset upload — the logo already lives in the booking-pages storage bucket and is served via `page.logo_url`.

## Verification
Reload `/booking/chapmans` at 390×844 and confirm the Chapman's logo appears in a small white rounded chip at the top of the orange hero, replacing the DRIVE 365 pills, with everything below it unchanged.
