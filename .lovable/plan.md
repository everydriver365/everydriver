

## Suggested Improvements Across All Portals

After auditing what's already built, here are the remaining high-value gaps grouped by portal.

---

### Instructor Portal

**1. Automated Weekly Summary Email/Notification**
Every Sunday evening, generate a digest: lessons taught, earnings, cancellations, pupil progress milestones, upcoming week preview. Uses existing data from `useTodayOverview`, `useWeeklyGoals`, and `useLastWeekComparison`. New edge function on a cron schedule + email template.

**2. Lesson Notes Templates Library**
You have `LessonNotesTemplates.tsx` but no shared/community template system. Let instructors save, reuse, and share common lesson note templates (e.g. "First lesson checklist", "Test prep debrief"). Speeds up the EndLessonWizard flow.

**3. Pupil Retention Alerts**
Flag pupils who haven't booked in 14+ days, have declining lesson frequency, or cancelled multiple times. Show as a "Retention Risk" badge on the pupil card and a summary tile on the dashboard. Simple query against `scheduled_lessons` + last booking date.

**4. Smart Scheduling Suggestions**
When an instructor has a gap in the diary, suggest which pupils would be a good fit based on: proximity (pickup postcode near the gap location), lesson frequency patterns, and time preferences. Builds on existing `useRealGapSlots` + pupil data.

---

### Pupil Portal

**5. Lesson Countdown Timer with Live Instructor Location**
Enhance `PupilPortalLessonCountdown` to show a live map pin of the instructor when status is `en_route` (using existing GPS tracking data). Pupils see "Your instructor is X minutes away" with a moving dot on a mini-map.

**6. Achievement Badges & Milestones**
Award badges for: first lesson, 10 lessons completed, all manoeuvres passed, theory test passed, mock test score above 90%, etc. Display in a trophy case on the dashboard. You have `PupilGamificationStats` and `PupilRewards` — this extends them with visual badges stored in a new `pupil_achievements` table.

**7. Lesson Preparation Checklist**
Before each lesson, show a contextual checklist: "Bring provisional licence", "Wear comfortable shoes", "Review last lesson notes on [topic]". Content driven by the syllabus topics planned for the next lesson. Simple component reading from `lesson_plans` or instructor notes.

---

### Parent Portal

**8. Payment Top-Up from Parent Portal**
Parents can currently view payment history but can't pay. Add a "Top Up Balance" button that uses the instructor's existing payment integration (Square/Stripe) to let parents add credit to their child's account directly.

**9. Parent Push Notifications**
Notify parents when: a lesson is completed, the instructor is en route, a test result is recorded, or the balance is low. Uses existing push notification infrastructure (`usePupilPushNotifications` pattern) adapted for parents.

**10. Multi-Child Dashboard Comparison**
For parents with multiple children learning to drive, show a side-by-side comparison of progress, upcoming lessons, and balances. The data structure already supports multiple children per parent phone number.

---

### Admin Portal

**11. Instructor Leaderboard**
Rank instructors by: pass rate, lessons per week, pupil retention, review scores, revenue generated. Gamifies performance and helps identify top performers and those needing support. Dashboard widget using existing data.

**12. Churn Prediction Dashboard**
Surface instructors at risk of leaving the platform: declining lesson counts, support tickets, missed compliance deadlines, or inactivity. Aggregate from `scheduled_lessons`, `compliance` fields, and activity logs.

**13. Automated Onboarding Progress Tracking**
Track which setup steps each instructor has completed (profile, availability, first pupil, first lesson, payment setup, mini-website). Show completion percentage on the instructor card. You have `InstructorSetupChecklist` — this surfaces it admin-side.

**14. Bulk Operations**
Allow admin to bulk-update instructor settings: enable/disable features, change plans, send announcements, or update commission rates for selected instructors. Currently everything is one-at-a-time.

---

### Cross-Portal

**15. In-App Changelog / What's New**
Show a "What's New" modal on first login after updates. Keeps all user types informed about new features. Simple `changelog` table with entries filtered by portal type (instructor/pupil/parent/admin).

---

### Recommended Build Order

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 1 | Pupil Retention Alerts | High | Small |
| 2 | Payment Top-Up (Parent) | High | Medium |
| 3 | Live Instructor Location (Pupil) | High | Small |
| 4 | Achievement Badges | Medium | Medium |
| 5 | Instructor Leaderboard (Admin) | Medium | Small |
| 6 | Weekly Summary Digest | Medium | Medium |
| 7 | Smart Scheduling Suggestions | Medium | Medium |
| 8 | Parent Push Notifications | Medium | Small |
| 9 | Lesson Prep Checklist | Low | Small |
| 10 | In-App Changelog | Low | Small |
| 11 | Bulk Admin Operations | Medium | Medium |
| 12 | Churn Prediction | Medium | Medium |
| 13 | Admin Onboarding Tracking | Low | Small |
| 14 | Multi-Child Comparison | Low | Small |
| 15 | Notes Templates Library | Low | Small |

