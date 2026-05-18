# Dissolve the "All settings" sidebar entry

Right now the DashboardSidebar ends with a lone **Settings → All settings** section that just opens `/instructor/settings`. From there, the user picks one of 17 areas (Profile, Working hours, Rates, Payments, Branding, Lab features, etc.). One extra hop for every settings action.

Plan: drop the **Settings** section and pin each settings area as a direct link inside the existing category that fits it best. The `/instructor/settings` hub keeps working — sidebar entries deep-link to `/instructor/settings/:areaId` so the existing detail view still renders.

## What changes

Only `src/components/instructor/dashboardV2/DashboardSidebar.tsx`. No other files touched. The settings page itself, routes, and `areas.tsx` are unchanged.

## Where each settings area lands

```text
Overview
  (unchanged)

Teaching
  + Working hours        /instructor/settings/working-hours
  + Rates & coverage     /instructor/settings/rates-coverage
  + How pupils book      /instructor/settings/how-pupils-book
  + Discounts & packages /instructor/settings/discounts-packages
  + Lesson types         /instructor/settings/lessons     (if present)

Vehicle & Tracking
  + Vehicle & credentials /instructor/settings/credentials

Telephone
  + Phone & AI            /instructor/settings/phone-ai

Business
  + Payments & fees       /instructor/settings/payments
  (Plan & Billing already lives here — leave it)

Website
  + Mini-site & pages     /instructor/settings/mini-site
  + Branding & theme      /instructor/settings/branding

People & Growth
  + Messaging             /instructor/settings/messaging
  + Notifications         /instructor/settings/notifications

Support
  + Help & close account  /instructor/settings/help-close

Account  ← new bottom section replacing "Settings"
  + Profile                /instructor/settings/profile
  + Login & security       /instructor/settings/login-security
  + Appearance & layout    /instructor/settings/appearance-layout
  + Data, terms & policies /instructor/settings/data-privacy
  + Lab features           /instructor/settings/lab-features
```

Rationale for the new **Account** bucket: profile / security / appearance / data / lab don't belong to any one workflow category above. They are personal/account‑level. Folding them into Overview or Support would be misleading. A short "Account" group at the bottom keeps the sidebar coherent and still kills the "click All settings, then click again" double‑hop.

If you'd rather not have an Account section at all, the alternative is to put Profile + Login & security under **Overview**, push Appearance & Data into **Support**, and drop Lab features. Tell me if you want that variant.

## Technical notes

- Icons: pick from `lucide-react` imports already in the file (`User`, `Lock`/`Shield`, `Bell`, `MessageCircle`, `Palette`, `Megaphone`, `Database`, `Sparkles`, `Wallet`, `Clock`, `MapPin`, `CreditCard`, `Phone`, `Globe`, `BookOpen`, `Tag`). Add any missing ones to the existing `lucide-react` import line — no new dependency.
- Active state: the existing matcher uses `pathname === item.to || pathname.startsWith(item.to + "/")`, so deep-linked `/instructor/settings/:id` items will highlight correctly without any extra logic.
- `DEFAULT_OPEN` stays as `{ Overview, Teaching, Business }` so the sidebar doesn't suddenly explode on first load.
- The pin-to-top mechanism keeps working unchanged — users can pin "Rates & coverage" if they live there.
- The existing `/instructor/settings` route still works for users who land there from other links (Account hub card, redirects, etc.). The hub is just no longer the only way in.

## Out of scope

- Mobile layouts (per project rule).
- `/instructor/settings` page itself — no edits to `SettingsShellV3` or `areas.tsx`.
- `AccountHub` "All settings" card on `/instructor/account` — different surface, leave for a follow-up.
