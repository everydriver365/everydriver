# Pupil Profile Redesign + Per-Pupil Rates Clarification

The current page (`src/pages/PremiumPupilProfile.tsx`) stacks ~10 disparate cards (Next lesson, Last lesson, History, Progress, Notes, Documents, Payments, Rates, Eyesight, Details) in a single vertical stream with identical visual weight. It reads as a "random selection of tiles" because nothing is grouped by purpose, everything is the same size, and the same content appears in different orders on mobile vs desktop.

## 1. Per-pupil rates (clarify scope)

The `PupilRateEditor` is already pupil-scoped (writes to `pupils.custom_hourly_rate / custom_rate_90min / custom_rate_120min` for the single `pupilId`). The user's concern is that it *looks* global. Fix:

- Rename section header from "Lesson rates" to **"{First name}'s lesson rates"**.
- Add a one-line caption above the inputs: *"These prices apply only to {name}. Leave blank to use your standard rate."*
- Show the resolved per-duration price (custom or default) as a read-only summary line first; the editable inputs collapse behind a "Set custom price" toggle. Default state is **read-only** so it can't be confused with a global setting.

## 2. Page structure — from flat stack to 4 named sections

Replace the current loose list with four clearly labelled sections, each with a section title bar and subordinate cards. Same sections, same order, on mobile and desktop.

```text
┌─ HEADER ──────────────────────────────────────┐
│ Back        Pupil name + status        Edit   │
│ Avatar | phone | address                      │
│ [Call] [Message] [Navigate] [Book]            │
└───────────────────────────────────────────────┘

┌─ AT A GLANCE (4 stat pills, sticky on desktop)┐
│ Lessons | Hours | Progress | Test date        │
└───────────────────────────────────────────────┘

1. LESSONS & PROGRESS
   - Next lesson  (primary, larger)
   - Last lesson  (secondary)
   - Test readiness bar
   - Lesson history → opens sheet

2. MONEY
   - Balance + prepaid hours (combined card)
   - {Name}'s lesson rates (read-only summary, expand to edit)
   - Payments history → opens sheet

3. SAFETY & ADMIN
   - Eyesight check
   - Documents
   - Notes

4. DETAILS
   - Contact, address, course type, learner permit, etc.
```

Visual hierarchy rules:
- One **hero card per section** (Next lesson / Balance / Eyesight / Contact). Larger padding, slightly stronger shadow.
- Supporting cards in the section use the existing card style at 16px padding.
- Section header bar: small uppercase label + thin divider, consistent spacing (24px above, 12px below) — replaces the current loose `SectionHeader` placement.
- Desktop: same 4 sections, but section 1 + 2 share the right column (single column, no two-column grid for cards). Sticky left rail keeps Header card + At a glance stats only.

## 3. Files

- `src/pages/PremiumPupilProfile.tsx` — restructure `MobileLayout` and `DesktopLayout`. Combine `PaymentsCard` + `RatesCard` into a single Money card group. Wrap each group in a `<Section title="…">` helper (new local component). Remove duplicated `SectionHeader` calls.
- Add a `RatesSummary` mode to `RatesCard`: shows three resolved prices as a read-only row, with a "Set custom price" link that reveals the existing `PupilRateEditor` inline.
- No DB or schema changes.

## 4. Out of scope

- No changes to `PupilRateEditor` save logic.
- No changes to lesson/payment data fetching.
- No changes to other pages.
