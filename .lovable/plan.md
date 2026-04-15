

## Make the Instructor Mobile App Very iOS-Styled

This is a substantial visual overhaul targeting the mobile instructor experience across the main portal (`/instructor/*`). The DSM page and Every Instructor portal already use iOS conventions — the main portal layout and its sub-pages need to be brought in line.

### What "iOS-styled" means here

```text
┌──────────────────────────────┐
│  status bar (safe area)      │
├──────────────────────────────┤
│  Large title header          │
│  (SF-style, left-aligned)    │
├──────────────────────────────┤
│  #F2F2F7 background          │
│                              │
│  ┌────────────────────────┐  │
│  │ Inset grouped cards    │  │
│  │ with rounded-[10px]    │  │
│  │ and thin dividers      │  │
│  └────────────────────────┘  │
│                              │
│  System blue (#007AFF)       │
│  accent throughout           │
│                              │
├──────────────────────────────┤
│  Tab bar (5 icons, blur bg)  │
│  with active pill indicator  │
└──────────────────────────────┘
```

### Scope of changes

**1. Global iOS colour tokens** — `src/index.css`
- Add an `.ios-mobile` class scope with iOS system colour variables:
  - Background: `#F2F2F7`, Card: `#FFFFFF`, System Blue: `#007AFF`
  - System Gray labels: `#8E8E93`, `#3A3A3C`, `#1C1C1E`
  - Separator: `#C6C6C8` (hairline dividers)

**2. Mobile header redesign** — `src/components/layout/InstructorPortalLayout.tsx`
- Replace the current `bg-primary` header bar with an iOS-style navigation bar:
  - Translucent white/blur background (`bg-white/80 backdrop-blur-xl`)
  - Dark text instead of white-on-blue
  - Large title on home, compact inline title on sub-pages (matching iOS UINavigationBar)
  - Back chevron using SF-style `<` with page name
  - Hamburger menu replaced with a bottom tab bar (see below)
- Page background changed from `#F4F7F6` to `#F2F2F7` (iOS system grouped background)

**3. Bottom tab bar** — new or updated component
- Replace the hamburger menu navigation with a proper iOS tab bar
- 5 tabs: Home, Schedule, Pupils, Payments, More
- Use `MobilePortalNav` component already in the codebase
- Frosted glass effect: `bg-white/80 backdrop-blur-xl border-t border-[#C6C6C8]/50`
- Active state: filled icon + system blue colour + dot indicator
- Haptic feedback already wired via `haptics.selection()`

**4. Card and list styling updates**
- Existing `InstructorCard` and `IOSGroupedList` components are already well-designed — ensure they're used consistently across instructor sub-pages
- Cards: pure white, `rounded-2xl`, subtle shadow (`0_1px_3px_rgba(0,0,0,0.08)`)
- List rows: `IOSListRow` pattern with 29px icon squares and chevron disclosure

**5. Typography alignment**
- Large titles: 28px bold (already in DSM)
- Section headers: 13px uppercase semibold `#8E8E93` (already in DSM)
- Body: 15-17px system font weights
- Already using SF Pro in the font stack — no change needed

**6. Safe area and status bar**
- Already handling `env(safe-area-inset-top)` — verify consistent application
- Ensure bottom nav respects `env(safe-area-inset-bottom)`

### Files to modify

| File | Change |
|------|--------|
| `src/index.css` | Add iOS system colour variables scoped to mobile instructor |
| `src/components/layout/InstructorPortalLayout.tsx` | Redesign mobile header (translucent nav bar, large titles), add bottom tab bar, remove hamburger for mobile, update background colour |
| `src/components/instructor/InstructorMobileHeader.tsx` | Update to translucent iOS nav bar style for pages that use it |
| `src/components/instructor/EveryInstructorBottomNav.tsx` | Update styling to match frosted glass tab bar |
| `src/components/layout/MobilePortalNav.tsx` | Add frosted glass bg option, ensure safe area bottom padding |

### Files NOT modified
- DSM page — already iOS-styled
- Desktop sidebar — unchanged (iOS styling is mobile-only)
- `IOSGroupedList`, `IOSSheet`, `InstructorCard` — already well-styled, no changes needed

### Technical notes
- All changes are CSS/component-level — no database or backend changes
- Uses existing design system components where possible
- The hamburger menu content moves to a "More" tab page (grid of all features, similar to DSM's feature grid)
- Desktop layout remains exactly as-is (changes gated behind `isMobile`)

