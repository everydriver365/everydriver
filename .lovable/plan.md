

# Remove All Remaining Border Radius from Instructor Mobile App

## Summary
Comprehensive sweep of all instructor components to replace every `rounded-xl`, `rounded-2xl`, `rounded-lg`, `rounded-md`, `rounded-sm`, `rounded-t-2xl`, `rounded-t-3xl`, `rounded-[Npx]` with `rounded-none`. Preserve only `rounded-full` (circular avatars/badges).

## Files to Update

### Home page tile components
1. **ContextualHomeHero.tsx** — 7 instances of `rounded-lg` on info cards and buttons
2. **NextLessonCard.tsx** — `rounded-xl` on card, `rounded-lg` on action buttons
3. **BriefingActionCards.tsx** — 5 instances of `rounded-xl`/`rounded-lg` on stat boxes, action rows, and AI tip
4. **BriefingActionModal.tsx** — `rounded-2xl` on dialog, `rounded-xl`/`rounded-lg` on buttons and list items
5. **CleanHomeView.tsx** — ~15 instances: `rounded-2xl` on card containers, `rounded-[22px]`/`rounded-[16px]`/`rounded-[10px]` on tiles and icons, `rounded-md` on badges
6. **CompactHomeView.tsx** — `rounded-xl` and `rounded-[14px]` on tile cards
7. **DiscoverFeaturesSheet.tsx** — `rounded-t-[14px]`, `rounded-[10px]`, `rounded-[7px]`
8. **DiscoverFeaturesTile.tsx** — `rounded-2xl` on tile container

### Dashboard widgets
9. **dashboard/MessagesWidget.tsx** — `rounded-2xl`, `rounded-xl`, `rounded-lg` on container and items
10. **dashboard/PlanWidget.tsx** — `rounded-2xl`, `rounded-xl`
11. **dashboard/MileageTaxSavingsCard.tsx** — `rounded-lg`
12. **dashboard/NotesWidget.tsx** — `rounded-md` on note cards
13. **dashboard/ReferralStatsWidget.tsx** — `rounded-lg`
14. **dashboard/RetentionAlertsTile.tsx** — `rounded-lg`

### Overlays and menus
15. **QuickActionsFAB.tsx** — `rounded-xl`, `rounded-lg`
16. **QuickActionsPopoverMenu.tsx** — `rounded-2xl`, `rounded-xl`, `rounded-lg`
17. **PupilCardStack.tsx** — `rounded-t-2xl` on bottom sheets

### Other home-adjacent components
18. **DormantPupilsCard.tsx** — `rounded-xl`, `rounded-lg`
19. **DashboardLayoutManager.tsx** — `rounded-lg`, `rounded-xl`, `rounded-md`

## Approach
- Run `sed` replacements across all listed files to convert any `rounded-{variant}` (except `rounded-none` and `rounded-full`) to `rounded-none`
- Single bulk operation per file
- No functional changes, purely visual

