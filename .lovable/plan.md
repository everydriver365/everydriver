## Goal
Let instructors pick from the full catalog of ~33 actions for their home Quick Actions, with a max of **12** shown on Home.

## Changes

### 1. New catalog `src/lib/quickActionsCatalog.ts`
- Re-export the existing `QUICK_ACCESS_TILES` from `src/components/instructor/quickAccess/tileRegistry.ts` as the single source of truth (id, label, subtitle, icon, route, optional `requiredFeature`).
- Add lightweight badge mapping (e.g. `messages` → unread count, `tests` → pending count) so tiles can show the same dot/number badges they do today.

### 2. Refactor `src/lib/quickActionsPrefs.ts`
- Replace the hard-coded `QuickActionId` union with `string` ids (validated against the catalog at load time — unknown ids dropped).
- Bump storage key to `instructor_home_quick_actions_v3` (clean migration; old prefs ignored).
- New defaults: first 8 ids matching today's home (`add-lesson`, `messages`, `fill-gaps`, `take-payment`, `schedule`, `pupils`, `earnings`, `tests`).
- Export `MAX_HOME_ACTIONS = 12`.
- Helper `loadQuickActionsPrefs()` returns `{ order: string[]; hidden: string[] }`; `order` only contains ids the user has chosen for Home (max 12). Anything not in `order` is "available to add".

### 3. Rework edit screen `src/pages/EveryInstructorQuickActionsEdit.tsx`
Two grouped sections:
- **Shown on Home** (`order` minus `hidden`)
  - Drag to reorder (framer-motion `Reorder`, already used)
  - Toggle to hide (kept in list but greyed)
  - Trash icon to remove entirely (returns it to "More Actions")
  - Header shows counter `8 / 12`
- **More Actions** — every catalog tile not in `order`, grouped by category (Lessons, Pupils, Money, Business, Comms, Admin), each with a `+` button to add to Home. `+` disabled with helper text once 12 are pinned.
- Sticky search field at top filtering both sections by label.
- Save / Back / Reset behaviour unchanged. Reset = first 8 defaults.

### 4. Dynamic rendering
- `src/components/instructor/PremiumIOSHomeView.tsx` and `src/pages/EveryInstructorHome.tsx` Quick Actions block: map `order` (minus `hidden`) through the catalog → render tile with icon, label, route, badge.
- Keep current tile visual (no design change).
- "Edit" button continues to navigate to `/every-instructor/quick-actions/edit`.

### 5. Plan-feature gating
- Tiles with `requiredFeature` show a lock chip in "More Actions" if the user's plan lacks it; tapping `+` opens the existing upgrade flow instead of pinning. Reuse the same gate already used by the Quick Access grid.

## Out of scope
- No DB sync — still localStorage. Can promote to a `instructor_home_prefs` table later.
- No changes to the separate Quick Access screen or its tile registry.
- No new icons/colours; reuse catalog tones.

## Acceptance
- Edit screen lists all ~33 actions split into "Shown on Home" and "More Actions".
- User can add/remove/reorder; Home cap enforced at 12 with clear messaging.
- Home renders only chosen tiles in chosen order with correct badges and routes.
- Reload preserves layout; resetting restores the 8 defaults.
