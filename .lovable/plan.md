## Standardize all desktop instructor pages on the DSM (`--d2-*`) palette

Most desktop instructor pages already use the DSM tokens via `DashboardShell`. Two desktop pages drift to their own palettes and need re-skinning. The token file is also currently scoped only to `.dashboard-v2`, so we widen it to cover any instructor page.

### Token scope (1 file)

`src/components/instructor/dashboardV2/tokens.css`
- Add `.instructor-portal` next to `.dashboard-v2` in both the light selector and the `.dark` selector so every page wrapped by `InstructorPortalLayout` (which already adds `instructor-portal`) inherits the same DSM variables.
- Move the `background` / `color` / `font-family` block out of the shared selector and keep it on `.dashboard-v2` only, so we don't accidentally repaint mobile / marketing pages that happen to use `.instructor-portal`. The variables remain available for any desktop page that opts in via inline `var(--d2-*)`.

### Re-skin outlier pages to the DSM palette

DSM palette reference (already in `tokens.css`):
- Page bg `--d2-bg` `#F8FAFC`
- Surface `--d2-surface` `#FFFFFF`
- Border `--d2-border` `#E2E8F0` (used as `0.5px solid`)
- Text `--d2-text-1` `#0F172A`, `--d2-text-2` `#64748B`, `--d2-text-3` `#94A3B8`
- Accent `--d2-indigo` `#4F46E5` / bg `--d2-indigo-bg` `#EEF2FF`
- Status: emerald / rose / amber tokens
- Card radius 12, hairline 0.5px

**`src/pages/InstructorDiary.tsx`** (`/instructor/diary`)
- Replace page bg `#F2F4F8` → `var(--d2-bg)`.
- Replace card bg `#FFF` → `var(--d2-surface)`; card border `1px solid rgba(26,82,160,0.08)` → `0.5px solid var(--d2-border)`; radius 16 → 12.
- Replace heading text `#1A1A1A` → `var(--d2-text-1)`; muted `#8E8E93` / `#5B6B8A` → `var(--d2-text-2)` / `var(--d2-text-3)`.
- Stat values: keep distinct accents but switch to DSM tokens — Lessons `var(--d2-indigo)`, Hours `var(--d2-emerald-fg)`, Pupils `var(--d2-amber-fg)`.
- Active filter chip / "Clear filters" pill: bg `var(--d2-indigo-bg)`, fg `var(--d2-indigo)`; inactive chip border `0.5px solid var(--d2-border)`, fg `var(--d2-text-2)`.
- Empty-state icon tile bg `var(--d2-indigo-bg)`, icon `var(--d2-indigo)`.
- Section divider `#F0F3F8` → `var(--d2-border)`.
- Search bar border `rgba(26,82,160,0.1)` → `0.5px solid var(--d2-border)`.

**`src/components/shared/FindAppointmentBody.tsx`** (used by `/instructor/find-appointment`)
- Same substitutions: surface `#FFF` → `var(--d2-surface)`, hairlines → `var(--d2-border)`, body text → `var(--d2-text-1/2/3)`, primary CTA / active filter → `var(--d2-indigo)` on `var(--d2-indigo-bg)`, success → emerald tokens, warning → amber tokens.
- Keep behaviour, layout, hooks and props unchanged — purely visual. The component is shared with admin/school portals, but the swap to DSM tokens is consistent with those portals (which also use the same `--d2-*` palette).

### Out of scope
- Mobile layouts and mobile routers (per project rule).
- Marketing / onboarding / login pages (`InstructorAbout`, `InstructorMarketing`, `InstructorLogin`, `InstructorSignup`, etc.).
- Any non-color refactor (sizes, radii on cards stay 12/16 already used by DSM).
- The shared availability hook and business logic.

### Verification
After the edits, the `/instructor/diary` and `/instructor/find-appointment` pages will visually match `/instructor/schedule`, `/instructor/payments`, `/instructor/pupils`, etc. — same slate background, same hairline borders, same indigo accent, same status colours.