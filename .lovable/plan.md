

## Codebase Cleanup — Remove Redundant Demo & Showcase Pages

### Problem
There are **27 demo/showcase pages** registered as routes and lazy imports in `App.tsx`. These are design exploration artifacts that add no production value but increase bundle size, clutter the router, and create maintenance overhead.

### Pages to Remove

**Demo pages (files + routes + imports):**
1. `src/pages/DesignDemo.tsx`
2. `src/pages/HeroLayoutDemo.tsx`
3. `src/pages/CollageDemo.tsx`
4. `src/pages/HeroRedesignDemo.tsx`
5. `src/pages/MobileHomeDemo.tsx`
6. `src/pages/MobilePortalDemo.tsx`
7. `src/pages/InstructorMobileDemo.tsx`
8. `src/pages/InstructorTileDemo.tsx`
9. `src/pages/InstructorHeroDemo.tsx`
10. `src/pages/InstructorHomeDesignDemo.tsx`
11. `src/pages/InstructorBlueStyleDemo.tsx`
12. `src/pages/InstructorNoHeroDemo.tsx`
13. `src/pages/InstructorNoHeroIOSDemo.tsx`
14. `src/pages/InstructorIOSDemo2.tsx`
15. `src/pages/InstructorIOSDemo3.tsx`
16. `src/pages/QuickActionGradientDemo.tsx`
17. `src/pages/HomepageRedesignDemo.tsx`
18. `src/pages/MobileHomeRedesignDemo.tsx`
19. `src/pages/MobileHomeRedesignDemo2.tsx`
20. `src/pages/MobileHomeIOSDemo.tsx`
21. `src/pages/HeaderRedesignDemo.tsx`
22. `src/pages/IOSHomeLayoutsDemo.tsx`
23. `src/pages/DiaryImageDemo.tsx`
24. `src/pages/TileDesignDemo.tsx`
25. `src/pages/instructor-app/DesignDemo.tsx`
26. `src/pages/instructor-app/PortalLayoutDemo.tsx`

**Showcase pages (also demo artifacts):**
27. `src/pages/NextUpTileShowcase.tsx`
28. `src/pages/TodoTileShowcase.tsx`
29. `src/pages/PupilCardDemo.tsx`

### Changes to `src/App.tsx`
- Remove all 29 lazy imports (lines 76–77, 91, 124–150)
- Remove all corresponding `<Route>` entries (lines 234–235, 239–243, 280–281, 292, 322–340)

### Additional Cleanup in `src/App.tsx`
- Remove the 4 homepage redesign demo routes that sit outside the demo block (lines 239–243): `/homepage-redesign-demo`, `/mobile-home-redesign`, `/mobile-home-redesign-2`, `/mobile-home-ios-demo`, `/header-redesign-demo`

### What Stays
All production pages, install pages, mini-website pages, instructor portal pages, and the instructor-app SaaS pages remain untouched.

### No Database Changes

