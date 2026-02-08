

# Instructor Portal Desktop Redesign -- 4 Style Options

Below are four distinct redesign directions for the instructor portal desktop layout. Each option reimagines the navigation, dashboard, and overall visual design. Review all four, then tell me which one (or combination) you'd like me to build.

---

## Option A: Clean SaaS Dashboard (Notion / Linear style)

**Navigation**: Collapsible left sidebar (no top nav tabs). Sidebar has grouped sections with subtle dividers.

**Header**: Minimal white bar with just logo, search, and avatar dropdown (logout/settings inside).

**Dashboard**: 
- Clean white background, generous padding
- Stats displayed as simple inline text metrics (no cards)
- Schedule as a clean table/list
- Sidebar widgets removed; everything in a single-column flow

**Visual identity**:
- White/gray palette, no navy header
- Very thin 1px borders, no shadows
- System font stack, large headings
- Active nav items shown with a subtle left border accent

```text
+------------------------------------------+
| [Logo]    [Search...]     [Avatar v]     |
+----------+-------------------------------+
| Dashboard|  Good morning, John           |
| Schedule |  5 lessons · 6h · £240        |
| Pupils   |                               |
| Messages |  [Today's Schedule list]      |
| Money    |                               |
| GPS      |  [Pupils table]               |
| Settings |                               |
+----------+-------------------------------+
```

---

## Option B: Bold & Branded (Current direction, refined)

**Navigation**: Keep navy top bar + sidebar, but add icon-only collapse mode. Group sidebar into sections (Teaching, Business, Tools).

**Header**: Navy gradient header with glowing brand accent, integrated search and notification bells.

**Dashboard**:
- Stats in bold colored metric cards with subtle gradients
- Hero welcome section with instructor avatar and status badge
- Schedule in a prominent card with day/week toggle
- Right sidebar with payment summary and plan widget

**Visual identity**:
- Navy (#142040) header, white content area
- Primary blue accents throughout
- Medium shadows, 0px border radius (sharp corners preserved)
- Notification dots and badges for engagement

```text
+===== NAVY HEADER (logo, tabs, search, avatar) =====+
| Breadcrumb: Instructor > Home                       |
+----------+------------------------------------------+
| TEACHING | [Welcome Hero + Avatar]                  |
|  Sched   | [==== 4 Stat Cards in row ====]          |
|  Pupils  |                                          |
|  Tests   | [Schedule Card]     [Payment Summary]    |
| BUSINESS | [Gap Filler]        [Plan Widget]        |
|  Money   |                     [Reminders]          |
|  Expenses|                                          |
| TOOLS    |                                          |
|  GPS     |                                          |
|  Website |                                          |
+----------+------------------------------------------+
```

---

## Option C: Compact Data-Dense (Bloomberg / Trading terminal style)

**Navigation**: Horizontal top tabs only, no sidebar. All pages accessible from a single row of tabs + "More" dropdown.

**Header**: Slim dark header with tabs inline, maximum horizontal space for content.

**Dashboard**:
- Tight grid of metric tiles (6-8 stats visible at once)
- Schedule rendered as a compact data table with status pills
- Pupils shown as a mini table below
- Everything visible on one screen, minimal scrolling

**Visual identity**:
- Dark header, light content, very tight spacing
- Small text sizes (13-14px body)
- Tabular/monospace numbers
- No decorative elements, pure function

```text
+== [Logo] [Home|Sched|Pupils|Msgs|Money|GPS|Tests|Web|Settings] [Search] [Out] ==+
|                                                                                  |
| [5 lessons] [6.0h] [£240] [12 pupils] [38mi] [4.8★]                            |
|                                                                                  |
| Today's Schedule                          | Payment Summary                      |
| 09:00  John Smith    1h  Confirmed  £40  | This week: £580                      |
| 10:30  Jane Doe      1h  Pending    £40  | Outstanding: £120                    |
| 12:00  Bob Jones     2h  Confirmed  £80  | Next payout: Fri                     |
| ...                                       |                                      |
+----------------------------------------------------------------------------------+
```

---

## Option D: Modern Card-Based (Stripe / Apple style)

**Navigation**: Top bar with horizontal pill navigation (no sidebar). Clean logo left, avatar/actions right.

**Header**: White/light header with a soft bottom shadow. Rounded pill-style nav items.

**Dashboard**:
- Large rounded cards (8-12px radius -- exception to the sharp-corner rule for this style)
- Stats in soft-colored cards with icons
- Schedule card with smooth transitions
- Generous whitespace, breathing room between sections

**Visual identity**:
- All white/cream backgrounds
- Soft shadows (box-shadow), rounded corners on cards
- Pastel accent colors for stat icons
- Smooth hover animations and transitions

```text
+---------------------------------------------------------------+
| [Logo]   ( Home  Schedule  Pupils  Money  More )    [Avatar]  |
+---------------------------------------------------------------+
|                                                               |
|  Good morning, John                                           |
|                                                               |
|  +----------+ +----------+ +----------+ +----------+         |
|  | 5 Lessons| | 6.0 Hours| | £240 Est | | 12 Pupils|         |
|  +----------+ +----------+ +----------+ +----------+         |
|                                                               |
|  +---------------------------+  +------------------+          |
|  | Today's Schedule          |  | Payments         |          |
|  | ...                       |  | ...              |          |
|  +---------------------------+  +------------------+          |
+---------------------------------------------------------------+
```

---

## Summary Comparison

| Aspect | A: Clean SaaS | B: Bold Branded | C: Data-Dense | D: Modern Cards |
|---|---|---|---|---|
| Navigation | Left sidebar | Top nav + sidebar | Top tabs only | Top pill nav |
| Header | Minimal white | Navy gradient | Slim dark | White + shadow |
| Information density | Medium | Medium | Very high | Low-medium |
| Visual style | Minimal | Branded, bold | Functional | Soft, modern |
| Corners | Sharp | Sharp | Sharp | Rounded cards |
| Best for | Focus & clarity | Brand identity | Power users | Visual appeal |

---

Tell me which option you prefer (A, B, C, or D), or mix elements from multiple options (e.g., "Navigation from C with cards from D"). I'll then create a detailed implementation plan for your chosen direction.

