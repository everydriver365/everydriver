

# Update All Remaining Blue Hex Colors to Dark Navy Primary

## Overview
Replace every instance of the bright blue hex values (`#0075c9`, `#0068b3`, `#005a9e`) with the dark navy `primary` Tailwind token across all 49 remaining files. This ensures visual consistency between the instructor app and the marketing pages.

## Replacement Rules
All replacements follow the same pattern used in the first batch:

| Old Value | New Value |
|-----------|-----------|
| `bg-[#0075c9]` | `bg-primary` |
| `text-[#0075c9]` | `text-primary` |
| `border-[#0075c9]/20` | `border-primary/20` |
| `bg-[#0075c9]/10` | `bg-primary/10` |
| `hover:bg-[#005a9e]` | `hover:bg-primary/90` |
| `from-[#0075c9] via-[#0068b3] to-[#005a9e]` | `from-primary via-primary/90 to-primary/80` |
| `from-[#0075c9] to-[#005a9e]` | `from-primary to-primary/80` |
| Any other opacity/modifier variant | Equivalent `primary` with same modifier |

## Files to Update (49 total)

### Pages (11 files)
1. `src/pages/InstructorSchedule.tsx`
2. `src/pages/InstructorPay.tsx`
3. `src/pages/InstructorMenu.tsx`
4. `src/pages/MobileHomeRedesignDemo.tsx`
5. `src/pages/instructor-app/EveryDriverInstructorHome.tsx`
6. `src/pages/instructor-app/InstructorFeatures.tsx`
7. `src/pages/instructor-app/InstructorPricing.tsx`
8. `src/pages/instructor-app/InstructorDomains.tsx`
9. `src/pages/instructor-app/InstructorSignup.tsx`
10. `src/pages/instructor-app/InstructorLogin.tsx`
11. `src/pages/InstructorTrackingView.tsx`

### Layout Components (1 file)
12. `src/components/layout/InstructorPortalLayout.tsx`

### Instructor Components (37 files)
13. `src/components/instructor/CalendarEventSheet.tsx`
14. `src/components/instructor/PupilReflectiveLogs.tsx`
15. `src/components/instructor/RadialFAB.tsx`
16. `src/components/instructor/TomorrowScheduleView.tsx`
17. `src/components/instructor/SmartInsightsPanel.tsx`
18. `src/components/instructor/DrivingAlertsStrip.tsx`
19. `src/components/instructor/vehicle-health/AutoMileageLog.tsx`
20. `src/components/instructor/vehicle-health/VehicleHealthHub.tsx`
21. `src/components/instructor/vehicle-health/ServiceReminders.tsx`
22. `src/components/instructor/vehicle-health/MOTCheckerTab.tsx`
23. `src/components/instructor/dashboard/UnifiedAgendaTile.tsx`
24. `src/components/instructor/dashboard/MessagesWidget.tsx`
25. `src/components/instructor/TestDayPrepChecklist.tsx`
26. `src/components/instructor/PupilDetailView.tsx`
27. `src/components/instructor/PupilProgressTracker.tsx`
28. `src/components/instructor/InstructorFAQs.tsx`
29. `src/components/instructor/InstructorCalendarView.tsx`
30. `src/components/instructor/LessonPlanBuilder.tsx`
31. `src/components/instructor/MiniWebsiteEditor.tsx`
32. `src/components/instructor/PupilLessonHistory.tsx`
33. `src/components/instructor/ScheduleWeekView.tsx`
34. `src/components/instructor/AddLessonSheet.tsx`
35. `src/components/instructor/EditLessonSheet.tsx`
36. `src/components/instructor/PaymentSheet.tsx`
37. `src/components/instructor/ResourcesPage.tsx`
38. `src/components/instructor/driving-test/TestDayTimeline.tsx`
39. `src/components/instructor/driving-test/TestRouteNotes.tsx`
40. `src/components/instructor/WeatherDrivingAlerts.tsx`
41. `src/components/instructor/SettingsContent.tsx`
42. `src/components/instructor/PupilsList.tsx`
43. `src/components/instructor/PupilProfileCard.tsx`
44. `src/components/instructor/InstructorAccountsView.tsx`
45. `src/components/instructor/TrackingHeader.tsx`
46. `src/components/instructor/LiveTrackingMap.tsx`
47. `src/components/instructor/TrackingDashboard.tsx`
48. `src/components/instructor/JourneyReplayControls.tsx`
49. `src/components/instructor/GeofenceManager.tsx`

## Technical Notes
- No new dependencies or database changes required.
- The `primary` CSS variable is already set to `218 54% 17%` (dark navy) in the project theme.
- Gradient patterns like `from-[#0075c9] via-[#0068b3] to-[#005a9e]` become `from-primary via-primary/90 to-primary/80` to maintain visual depth.
- Hover states like `hover:bg-[#005a9e]` become `hover:bg-primary/90` for a subtle darkening effect.
- All semantic status colors (emerald for positive, rose for negative, amber for warnings) remain unchanged.

