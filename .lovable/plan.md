
What’s happening:
- The instructor pages are not using only the new global background. On normal instructor routes like `/instructor/pupils`, `InstructorPortalLayout` still reads the saved `wallpaper_color` from `instructor_tile_preferences`, and that saved value can still be the old blue `#E8F1FE`.
- A few instructor pages still hardcode the old blue directly, especially:
  - `src/pages/InstructorLiveSession.tsx`
  - `src/pages/InstructorGPSSetup.tsx`

Plan:
1. Create one shared instructor app default background value: `#F4F7F6`.
2. Update the instructor appearance flow so legacy saved blue values (`#E8F1FE`) no longer override the new default on pages like pupils and schedule.
3. Update the appearance/settings UI so its preview and default color also use `#F4F7F6` instead of the old blue.
4. Remove the remaining hardcoded `#E8F1FE` backgrounds from tracking/GPS pages and switch them to the shared instructor background.
5. Verify the routes where this is most visible: home, pupils, schedule, tracking, and GPS setup.

Files to update:
- `src/hooks/useInstructorAppearance.ts`
- `src/components/layout/InstructorPortalLayout.tsx`
- `src/components/instructor/AppearanceSettings.tsx`
- `src/pages/InstructorLiveSession.tsx`
- `src/pages/InstructorGPSSetup.tsx`

Technical note:
- No schema change is needed.
- The key fix is not just CSS: existing saved appearance data is still forcing blue, so I need to handle that legacy value as part of the implementation.
