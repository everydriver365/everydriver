## Make toggles green when on

Update the global `Switch` component so that when toggled on it shows an iOS-style bright green instead of the current primary blue.

### Change
- File: `src/components/ui/switch.tsx`
- Replace `data-[state=checked]:bg-primary` with an iOS-style green: `hsl(142 71% 45%)` applied via an inline class (e.g. `data-[state=checked]:bg-[hsl(142_71%_45%)]`).
- Unchecked state and thumb styling stay the same.

### Scope
- Affects every `Switch` usage app-wide (instructor settings, working hours, pupil settings, school settings, etc.).
- No changes to Checkbox, Radio, Buttons, or any other component.
- No business logic changes.

### Verification
- Visit `/instructor/settings/rates-coverage` and toggle a switch — it should turn bright green.
- Spot-check a couple of other pages with toggles to confirm consistency.