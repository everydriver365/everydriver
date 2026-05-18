# Reorganise Instructor Desktop Settings

Today the sidebar "Settings" group only contains 4 items (Profile, Plan & Billing, Modules, Integrations). Everything else config-shaped is scattered across other groups (Branding, Domain, Mini-site settings, Website add-ons, Automations, Workflows, Accessibility, Data import, Install app). This makes "where do I change X?" a hunting game.

## Proposed structure

A single **Settings hub** at `/instructor/settings` with a left rail of 6 categories. Each category is a single scrollable page with grouped cards — same pattern Apple/Linear use. The sidebar keeps only one "Settings" entry; everything else lives inside the hub.

### 1. Account
- Profile (name, photo, contact)
- Login & security (password, 2FA, sessions)
- Notifications (email, SMS, push, WhatsApp)
- Language & region (units already locked to Imperial, timezone)
- Accessibility (font size, contrast, reduced motion)

### 2. Business
- Plan & Billing (subscription tier, invoices, payment method)
- Modules (toggle features on/off)
- Tax & company details (VAT, UTR, MTD)
- Service area (radius, locations)
- Working hours & buffers (lesson buffer, travel time, gap rules)

### 3. Payments
- Payment methods accepted (Klarna, Clearpay, Square, GoCardless, SumUp toggles)
- Service Fee split (instructor/pupil %, the 2.0%+25p vs 1.5%+25p tier)
- Payout settings (Square account, GoCardless mandate)
- Refund & cancellation policy
- Pricing & packages

### 4. Pupils & Lessons
- Booking rules (notice period, max advance, deposit)
- Lesson types & durations
- Waivers & required documents
- Auto-reminders & follow-ups
- Test prep defaults

### 5. Website & Brand
- My site (live/draft)
- Branding (colours, logo)
- Domain
- Mini-site settings
- Website add-ons
- SEO basics

### 6. Integrations & Automation
- Integrations (Google Calendar, WhatsApp, Famulor, etc.)
- Automations
- Workflows
- AI command defaults
- Data import / export
- Install app (PWA / native)
- Developer (API keys, webhooks) — if applicable

## Sidebar change

Replace the current "Settings" expandable group with a **single top-level "Settings" link** that opens the hub. Move these existing items into the hub (remove from their current sidebar groups):

- From Website group: Branding, Domain
- From Website Extras: Mini-site settings, Website add-ons
- From Business: Automations
- From Daily Ops: Workflows, AI command
- From Support & Utilities: Install app, Data import, Accessibility

Items that are daily workflows (not settings) stay where they are: Take Payment, Reports, Pipeline, Reviews, Referrals, etc.

## Hub page layout

```text
+--------------------------------------------------------+
| Settings                                    [Search]   |
+----------------+---------------------------------------+
| Account        |  Account                              |
| Business       |  ┌─ Profile ──────────────────────┐   |
| Payments       |  │ Name, photo, contact           │   |
| Pupils         |  └────────────────────────────────┘   |
| Website        |  ┌─ Notifications ────────────────┐   |
| Integrations   |  │ Email / SMS / Push toggles     │   |
|                |  └────────────────────────────────┘   |
+----------------+---------------------------------------+
```

- Left rail: 6 categories, sticky, active state.
- Right pane: stacked cards per sub-area, each card edits inline (no extra navigation hops).
- Global search at top filters cards across all categories.
- Deep-linkable: `/instructor/settings/payments#service-fee` jumps and highlights.

## Why this works

- **One mental model**: "If it changes how the app behaves for me, it's in Settings." Daily work stays in the sidebar.
- **Cuts sidebar noise**: removes ~9 items, makes the rest scannable.
- **Discoverable**: search across all settings means users stop asking support "where do I change X?".
- **Matches what instructors already know**: iOS/macOS Settings, Stripe Dashboard, Linear all use this rail+cards pattern.

## Out of scope for this plan

- Building the actual setting pages that don't exist yet (e.g. dedicated "Login & security" page) — initial implementation can link to existing pages and consolidate later.
- Mobile settings (per project rule: no mobile changes unless explicitly asked).
- Renaming any underlying routes.

## Technical notes

- New route: `/instructor/settings` with nested `:category` param, lazy-loaded.
- Sidebar: drop the "Settings" expandable group, add single `{ label: "Settings", to: "/instructor/settings", icon: Settings }` near the bottom.
- Existing pages keep their routes for backwards compatibility — the hub renders them inside the right pane via a registry map, or links out if they're heavy standalone pages.
- Search uses a flat index of `{ category, card, keywords, anchor }` defined alongside the registry.
