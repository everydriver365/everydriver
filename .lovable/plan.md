Redesign the desktop instructor Settings from scratch — same visual language (DSM portal tokens, rounded-2xl cards, #F4F7F6 bg, #2B7BC8 accent), cleaner layout. Mobile is untouched.

## Layout

Two-pane shell, full-width inside the portal chrome:

```text
┌─ Settings ──────────────────────────────────────────────────────────┐
│  Sidebar (260px, sticky)        │  Detail pane (max 880px, centred) │
│  ──────────────────────────     │  ──────────────────────────────── │
│  Search settings…               │  Breadcrumb · Settings / Account  │
│                                 │                                   │
│  YOU                            │  ┌─ Hero summary card ─────────┐  │
│   • Profile           ●         │  │ Avatar  Name · ADI 12345    │  │
│   • Login & security            │  │ Profile 86% · 2 to-dos      │  │
│                                 │  │ [Quick actions]             │  │
│  TEACHING                       │  └─────────────────────────────┘  │
│   • Vehicle & credentials       │                                   │
│   • Working hours               │  Section card 1                   │
│   • Rates & coverage            │  Section card 2                   │
│                                 │  Section card 3                   │
│  BOOKINGS & MONEY               │                                   │
│   • How pupils book             │  (sticky save bar appears when    │
│   • Payments & fees             │   any field is dirty)             │
│   • Discounts & packages        │                                   │
│                                 │                                   │
│  COMMS                          │                                   │
│   • Notifications               │                                   │
│   • Phone & AI                  │                                   │
│   • WhatsApp & messaging        │                                   │
│                                 │                                   │
│  WEBSITE                        │                                   │
│   • Mini-site & pages           │                                   │
│   • Branding & theme            │                                   │
│                                 │                                   │
│  SYSTEM                         │                                   │
│   • Appearance & layout         │                                   │
│   • Plan & billing              │                                   │
│   • Data & privacy              │                                   │
│   • Help & close account        │                                   │
└─────────────────────────────────┴───────────────────────────────────┘
```

Behaviour:
- Clicking any sidebar item swaps only the right pane. No navigation to a different layout, no full-page jumps.
- Sidebar is sticky, scrolls independently, collapsible to a 56px icon rail.
- URL stays bookmarkable: `/instructor/settings/:sectionId` (legacy paths redirect to the new IDs).
- Persistent search filters the sidebar live and highlights matching sections.
- Sticky save bar appears at the bottom of the detail pane when any embedded editor is dirty.

## 6 top-level areas (flattened)

1. **You** — Profile, Login & security
2. **Teaching** — Vehicle & ADI/DBS credentials, Working hours & availability, Rates & coverage area
3. **Bookings & Money** — Booking mode, deposits, courses, intake questions; Payments (Square, GoCardless, SumUp), service fee split, BNPL; Discounts, packages, pricing rules, referrals
4. **Comms** — Notification preferences + push + quiet hours; Phone number routing & AI call answering (Famulor); WhatsApp & message templates
5. **Website** — Mini-site share link & pages, theme & fonts, test centres list
6. **System** — Appearance & dashboard layout, Plan & billing, Data export & GDPR retention, Help & support / Close account / Reset stats

Each area shows a hero summary card at the top of its detail pane with the most relevant at-a-glance info and 1–2 quick actions, then a stack of section cards using existing editor components.

### Hero summary examples

- **You** — avatar, name, ADI badge, profile completeness %, "Standards Check due" pill, [Edit photo] [Verify email]
- **Teaching** — car reg, MOT/tax expiry chips, working-hours summary, [Set unavailable today]
- **Bookings & Money** — connected gateways (Square/GoCardless/SumUp pills), service fee split %, [Open Square]
- **Comms** — current cadence, quiet hours window, AI call status, [Test push]
- **Website** — public URL with copy button, theme name, [Preview site]
- **System** — current plan + renewal date, storage used, [Open Plan & billing]

## Visual system

- Reuse DSM portal tokens (`--portal-*`, accent #2B7BC8, bg #F4F7F6, cards rounded-2xl with 12px radius for inner controls).
- Sidebar items: 13px label, 16px icon, 6px vertical padding, active = subtle filled chip + accent left bar.
- Section cards: white, border `border/50`, 20px padding, header (title + 1-line description) + body.
- Group labels in sidebar: 11px uppercase, tertiary text, 10px letter-spacing.
- All copy plain English, sentence case.

## Migration

- Build a new `SettingsShell` (sidebar + detail) and a `useSettingsModel` hook returning the 6 areas, each with `heroSummary` + `sections[]` (each section reuses an existing editor component — no business logic changes).
- Map every legacy section ID → new section ID and add redirects in `instructorPortalRoutes.tsx` so old links keep working.
- Replace `SettingsLayoutV2`, `SettingsSidebar`, `SettingsLayout` (desktop branch), and `categories.tsx` consumption with the new shell.
- Mobile: keep current `SettingsLayout` mobile drill-down untouched (per project rule).
- Account Hub Notifications inline panel stays as-is.

## Out of scope

- No changes to underlying editors (notification prefs panel, Square/GoCardless settings, mini-site CMS, etc.) — same components, new shell only.
- No mobile changes.
- No backend, RLS, or notification logic changes.