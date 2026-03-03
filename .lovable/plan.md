

## Redesign Menu & Settings Pages to iOS Grouped-List Style

### Reference
The iOS Settings screenshot shows: grouped white cards on a grey background, items within each group separated by thin hairline dividers (inset from the left to clear the icon), no gradient headers — just a plain uppercase grey section label above each group. Each row has a rounded icon on the left, label text, and a chevron or switch on the right. The cards themselves have no heavy shadows — just a clean white `bg-white` with subtle rounding (`rounded-xl`).

### Changes

**1. `src/pages/InstructorMenu.tsx` — iOS grouped list redesign**
- Remove the gradient section headers (`bg-gradient-to-r from-primary…`)
- Replace with a small uppercase grey label above each card group (like iOS: `text-[13px] font-normal text-muted-foreground uppercase px-4 pb-1`)
- Change the card container from `bg-card` to `bg-white dark:bg-[#1C1C1E]` with `rounded-2xl` and no heavy shadow — just a subtle one
- Keep the existing 32px rounded-lg coloured icon containers and custom PNG icons as-is
- Use inset dividers between rows (left-padded ~56px to clear the icon column) instead of full-width `divide-y`
- Keep the chevron right, keep the lock/badge logic unchanged

**2. `src/pages/InstructorSettings.tsx` — iOS grouped list redesign**
- Same section label treatment: plain uppercase grey text above each category instead of bold `<h2>` headers
- The `SettingsTile` component: change from `bg-[#F2F3F5]` to `bg-white dark:bg-[#1C1C1E]`, keep `rounded-2xl`, use lighter shadow
- The quick-jump `<select>` dropdown: style it to match the iOS card aesthetic (white bg, rounded-2xl)
- Add a new **"Visibility & Toggles"** section at the top of the settings that groups the existing visibility switch and feature toggles into a single iOS-style card with rows separated by hairline dividers — each row has an icon, label, description, and a `<Switch>`. This pulls the existing `FeatureTogglesSettings` toggles and the `is_active` visibility toggle into one grouped card so instructors can quickly see and toggle features on/off

**3. `src/components/instructor/FeatureTogglesSettings.tsx` — iOS row style**
- Remove the `rounded-lg border p-3` wrapper per toggle
- Render as plain rows with hairline dividers between them (matching the iOS grouped list rows)
- Keep switch, label, description, and loading spinner

### Scope
- 3 files modified
- No new database changes
- Purely visual restructuring

