# iOS-style swipe-to-delete across instructor / pupil / parent apps

Yes — totally achievable, and we're already most of the way there. `SwipeToReveal` (the iOS-Mail-style component used in Inbox and Schedule) is the only primitive needed. The job is **rolling it out consistently** across the three portals' mobile list surfaces and standardising the destructive action.

This plan covers the *gesture* (swipe → red action → tap or full-swipe to confirm). Hard vs soft delete is already settled (we soft-delete everything instructor-facing).

## Approach

One shared primitive, one rule per row: any mobile list whose row represents a deletable record gets wrapped in `<SwipeToReveal>`. No bespoke gesture code per page.

### 1. Harden the primitive (`src/components/ui/SwipeToReveal.tsx`)
- Already has: pointer events, direction lock, single-open coordinator, haptics, fade-in action layer, reduced-motion support, button pass-through via `data-swipe-pass`.
- Add small extensions so it covers every case we'll hit:
  - **`actionVariant`** prop: `"delete" | "cancel" | "archive"` controlling label, icon (Trash2 / X / Archive) and colour (destructive / amber / muted). Default `"delete"`.
  - **`secondaryAction`** prop (optional): `{ label, icon, color, onAction }` so a row can reveal *two* buttons (e.g. Archive + Delete) like iOS Mail. Renders left of the primary; widens reveal width automatically.
  - **`onSwipeOpenChange`** callback so parent lists can dim other UI when a row is open (nice-to-have).
  - **`confirm`** prop (optional): `{ title, body, confirmLabel }` — when set, full-swipe/tap shows the existing `AlertDialog` instead of firing immediately. Used for irreversible actions.

### 2. Standard "delete row" recipe
Document one pattern in `src/components/ui/SwipeToReveal.tsx` JSDoc so every consumer does the same thing:
```tsx
<SwipeToReveal
  onDelete={() => softDelete(row.id)}
  actionLabel="Delete"
  confirm={{ title: "Delete X?", body: "...", confirmLabel: "Delete" }}
>
  <Row ... />
</SwipeToReveal>
```
Plus the existing `data-swipe-pass` rule on any wrapper `<button>` inside the row.

### 3. Roll-out surfaces

Wrap each of these row types in `<SwipeToReveal>`. All edits are presentational — no business-logic changes. Soft-delete handlers already exist for everything in the "instructor CRM" set from the previous loop.

**Instructor portal (mobile)**
- Messages — done.
- Schedule lessons — done.
- Pupils list (`InstructorPupils`) → swipe → Archive pupil (sets `archived_at`).
- Notes (`useNotes` rows in Notes drawer/page) → swipe → soft-delete.
- Documents (Document Vault rows) → swipe → soft-delete.
- Courses (`InstructorCoursesManager` cards on mobile) → swipe → soft-delete.
- Discount codes, Lesson packages, Digital waivers, Saved annotations, Geofences, Scheduled reports, Automations, Workflows → swipe → soft-delete (each row already wired for soft-delete).
- Locations, Routes, Resources, Availability windows/rules → swipe → soft-delete.

**Pupil portal (mobile)**
- Pupil inbox conversations → swipe → soft-delete (mirrors instructor inbox).
- Pupil notifications / activity feed → swipe → "Dismiss" (`actionVariant="archive"`).
- Saved courses / favourites → swipe → Remove.

**Parent portal (mobile)**
- Linked children list → swipe → "Unlink" (`actionVariant="cancel"`, with confirm).
- Parent inbox messages → swipe → soft-delete.
- Notification feed → swipe → Dismiss.

### 4. Desktop behaviour
`SwipeToReveal` already no-ops above `md`. Desktop keeps the existing inline kebab/Delete buttons — we don't change that. So no desktop regressions; this is a purely mobile UX uplift.

### 5. QA pass per portal
For each portal:
1. Mobile viewport (390×844).
2. Swipe each list type → red action reveals correctly, no bleed-through (fade-in is already shipped).
3. Tap confirms; full-swipe triggers without confirm UNLESS `confirm` is set.
4. Only one row open at a time (coordinator already handles this).
5. Vertical scroll still works (direction lock already handles this).
6. Tap to open the row's main action still works (button pass-through already handles this).
7. Desktop unaffected.

## Out of scope
- No backend changes — all required `deleted_at` / `is_active` columns are already in place from the previous "make all deletes soft" migration.
- No new icons or design tokens beyond what shadcn/lucide already give us.
- Doesn't touch the chat thread itself (per-message delete is a separate UX).

## Effort
Primitive extension: small. Rollout: ~15–20 list components, each a 3-line wrap. Realistically one focused build pass per portal.

Want me to ship it portal-by-portal (starting with Instructor since most lists live there) or all in one go?
