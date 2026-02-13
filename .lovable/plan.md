
## Replace the Hero Image on the Main Page

### What this changes

The homepage currently uses `src/assets/features/features-hero.jpg` as the hero image in the `FeatureHero` component. This will replace it with the uploaded image showing the driving instructor with calendar and vehicle tracking UI mockups.

### Steps

1. **Copy the uploaded image** into the project at `src/assets/features/features-hero.png` (or overwrite the existing `.jpg` path).

2. **Update the import** in `src/pages/instructor-app/InstructorFeatures.tsx` to point to the new file (if the extension changes from `.jpg` to `.png`).

### Files changed

- **`src/assets/features/features-hero.jpg`** (or `.png`) -- replaced with the new uploaded image
- **`src/pages/instructor-app/InstructorFeatures.tsx`** -- update import path if the file extension changes
