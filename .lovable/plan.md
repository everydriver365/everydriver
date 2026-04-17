

## Mobile-friendliness audit

**Honest answer:** No — not every screen, modal, and popup in the app is guaranteed mobile-friendly. The instructor mobile app shell (home, schedule, track, money, pupils, more) is heavily polished for mobile, but the codebase has **150+ instructor pages, 156 files containing dialogs, and dozens of admin/school/demo pages** — many of which were built desktop-first and only partially adapted.

### What I found in a quick scan

**Mostly mobile-friendly:**
- Instructor home, schedule, track, money, pupils, more (the 6 bottom-nav destinations) — recent shadow + iOS tile work confirms these
- Pupil portal (uses `vaul` bottom sheets per memory)
- Mini-websites (mobile-first)
- Public site (`MainLayout` with `MobileBottomNav`)

**Likely problem areas:**
1. **Dialogs without mobile sizing** — many use `sm:max-w-md` or `max-w-lg` with no `max-h-[90vh] overflow-y-auto`, so tall forms get cut off on small screens (e.g. `EditVehicleDialog`, `RewardTiersManager`, `WeightTracker`).
2. **Tab bars** — some pages cram 8 tabs (e.g. `InstructorVehicleHealth` has DVSA/Fleet/Service/Mileage/Costs/Security/Live/Speed). Already horizontally scrollable but cramped.
3. **Admin pages** (`AdminPortal`, `AdminPaymentsManager`, `CMSManager`, `LiveChatManager`, `PupilRecordsManager`, `RewardTiersManager`) — built desktop-first, tables likely overflow.
4. **Demo/design pages** (`DemoInstructorHomeDesigns`, `HomepageRedesignDemo`, `TileDesignDemo`, etc.) — internal showcase pages, often desktop-only.
5. **Deep instructor utility pages** — many of the 100+ `Instructor*.tsx` pages (Workflows, Automations, BulkOperations, DataImport, DocumentTemplates, Pipeline, ReportsHub, etc.) were likely built without thorough mobile QA.
6. **Modals with fixed widths** — `RecordPaymentModal` uses `sm:max-w-[400px] max-w-[90vw]` (good pattern), but many others use only `max-w-md` which can overflow on 320px devices.

### Proposed approach

Rather than attempt a single mega-pass that breaks things, do a **systematic mobile audit and fix in waves**:

**Wave 1 — Global safety net (low risk, high impact)**
- Patch `DialogContent` base component to enforce `max-w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto` by default, so every dialog in the app becomes scrollable on mobile automatically.
- Patch `Sheet` and `Drawer` defaults the same way.
- Add `overflow-x-hidden` to admin/school portal layouts.

**Wave 2 — High-traffic instructor pages**
- Audit the top 20 most-used instructor pages (Settings, Pupils detail, Take Payment, Vehicle Health tabs, Pay/Income, Messages, Notifications, Subscriptions, Mini-Website settings).
- Fix any tables, fixed-width grids, or off-screen content.

**Wave 3 — Admin & school portals**
- Convert key admin tables to card lists below `md:` breakpoint.
- Wrap wide controls in `overflow-x-auto`.

**Wave 4 — Long tail**
- Touch each remaining instructor utility page only when reported or used.
- Demo/design pages: deprioritised (internal only).

### Recommendation

I'd suggest starting with **Wave 1** today — it's a single focused change to the shared `DialogContent`, `SheetContent`, and `DrawerContent` components that will instantly improve hundreds of modals across the app without touching individual pages. Then we tackle Wave 2 next.

Want me to proceed with Wave 1 first?

