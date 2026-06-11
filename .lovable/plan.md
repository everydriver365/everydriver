## Goal
Surface the existing **Book First Lesson Only** setting (`StartDateOnlyBookingEditor`) in the instructor portal's desktop settings so it appears under / near **Working hours**.

## Background
- The component already exists and works on the mobile menu tile grid.
- The desktop settings currently render through the **V3 shell** (`SettingsShellV3`), which shows a grid landing and detail pages. The old two-pane sidebar (`SettingsSidebar` from `settingsSections.ts`) is still in code but is not the active desktop path.
- To make the link visible **and** functional, it must be added to **both** the legacy sidebar config and the active V3 shell.

## Changes

### 1. Legacy sidebar entry (`src/config/settingsSections.ts`)
Add a new item under the **"Teaching setup"** section, immediately after **"Working hours"**:

```text
id: "first-lesson-only"
label: "Book first lesson only"
icon: "calendar-plus"   (or closest semantic icon)
iconBg: "#EDE9FE"
iconColour: "#5B21B6"
```

### 2. Legacy sidebar titles (`src/config/settingsTitles.ts`)
Add entries:
- `SECTION_TITLES["first-lesson-only"]` = "Book first lesson only"
- `SECTION_SUBTITLES["first-lesson-only"]` = "Let pupils reserve a start date and arrange lesson times later"

### 3. Legacy content wiring (`src/components/settings/SettingsSectionContent.tsx`)
Wire the real component for `section === "first-lesson-only"` instead of the generic "Coming soon" placeholder.
Render `<StartDateOnlyBookingEditor instructorId={...} />` using the instructor ID from context or props.

### 4. V3 shell — section data (`src/components/instructor/settings/categories.tsx`)
Add a new section under the **`schedule`** category:
- id: `"first-lesson-only"`
- title: `"Book first lesson only"`
- render: `<StartDateOnlyBookingEditor instructorId={id} />`

### 5. V3 shell — area pulls (`src/components/instructor/settings/v3/areas.tsx`)
Add `G("schedule", "first-lesson-only")` to the `pulls` array of the **`working-hours`** area item so the section appears inside the Working hours detail page.

### 6. Mobile menu (already done)
No change needed — the tile already exists in `InstructorMenu.tsx` under the **Scheduling** category.

## Result
- Desktop V3: instructors navigating to **Settings → Teaching → Working hours** will see a **"Book first lesson only"** section card inside that page.
- Legacy sidebar (if rendered anywhere): a **"Book first lesson only"** link appears directly under **"Working hours"** in the left-hand menu.
- Mobile: unchanged (tile already present).