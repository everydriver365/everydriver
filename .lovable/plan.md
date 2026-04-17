
## Goal
Bring every instructor mobile page in line with the "Waiting Room tile" design language already used on the home dashboard.

## Canonical tokens (the "Waiting Room" style)
| Token | Value |
|---|---|
| Tile background | `#FFFFFF` |
| Tile border | `0.5px solid #E4E4E7` |
| Tile radius | `14px` |
| Tile padding | `14px 16px` (compact) / `16px` (standard) |
| Icon roundel | `44×44`, `borderRadius: 12`, `#E8ECF1` bg, `#2A394F` icon |
| Primary text | `#18181B`, 15px / 500, Inter |
| Secondary text | `#71717A`, 12px / 400, Inter |
| Chevron | `#A1A1AA`, 18px |
| Page background | `#F2F2F7` |
| Section header | uppercase 13px, `text-muted-foreground`, `px-4 pb-1.5` |

## What gets removed
- Purple/rose/indigo gradient "Hero Cards" at the top of pages (Notifications, Health, Pipeline, etc.) → replaced with `IOSPageTitle` (compact icon + title).
- `rounded-xl` / `rounded-2xl` + `shadow-sm` + `border-border/50` patterns → replaced with the canonical tile.
- `bg-muted/30`, `bg-card border` ad-hoc tiles → canonical tile.
- Inconsistent font stacks → Inter / SF Pro across the board.

## Approach — single shared primitive
Introduce one component everyone uses, so future pages stay consistent:

```tsx
// src/components/instructor/IOSTile.tsx
<IOSTile interactive onClick={...}>
  <IOSTile.Icon><Users /></IOSTile.Icon>
  <IOSTile.Body title="…" subtitle="…" badge="Weekly" />
  <IOSTile.Chevron />
</IOSTile>
```
Plus a matching `IOSTileGroup` for grouped lists with indented dividers (already a memory pattern).

`InstructorCard` and `WaitingRoomPromoTile` get refactored to render `IOSTile` so existing callers keep working.

## Pages to sweep (grouped by area)
Instead of hand-editing 80 files, work in 6 batches — each batch swaps hero gradients for `IOSPageTitle` and converts ad-hoc cards to `IOSTile`:

1. **Dashboard & home** — `InstructorPortal`, `InstructorMenu`, `InstructorNotifications`, `InstructorPlatformUpdates`
2. **Schedule & jobs** — `InstructorSchedule`, `InstructorDiary`, `InstructorJobs`, `InstructorGaps`, `InstructorWaitingList`, `InstructorPendingScheduling`, `InstructorQuickAvailability`, `InstructorAvailabilityWindows`, `InstructorTestSlotFinder`, `InstructorTestRequests`
3. **Pupils & comms** — `InstructorPupils`, `InstructorUnifiedInbox`, `InstructorAdminChat`, `InstructorContact`, `InstructorTeamChannels`
4. **Finance** — `InstructorPay`, `InstructorTakePayment`, `InstructorIncome`, `InstructorExpenses`, `InstructorAccounts`, `InstructorTax`, `InstructorSubscriptions`, `InstructorInOut`, `MonthEndReview`, `WeeklyReportPage`
5. **Vehicle/GPS/Health** — `InstructorSatNav`, `InstructorFindMyCar`, `InstructorVehicleHealth`, `InstructorFuel`, `InstructorMileageTracker`, `InstructorRoutes`, `InstructorFleetDashboard`, `InstructorLiveSession`, `InstructorGPSSetup`, `InstructorFleetMap`, `InstructorOverspeedHistory`, `InstructorFindNearby`, `InstructorNearbyFriends`, `InstructorLocations`, `InstructorHealth`, `InstructorWellbeing`, `DashcamGallery`
6. **Marketing, tools & settings** — `InstructorMiniWebsiteSettings`, `InstructorDomainsManagement`, `InstructorWebsiteAddons`, `InstructorReviews`, `InstructorReferrals`, `InstructorPipeline`, `InstructorAutomations`, `InstructorAbandonedCheckouts`, `InstructorTestResults`, `InstructorStandardsCheck`, `InstructorCPD`, `InstructorCertifications`, `InstructorPerformance`, `InstructorFAQs`, `InstructorDoodlepad`, `InstructorTodos`, `InstructorNotes`, `InstructorPlans`, `InstructorResources`, `InstructorDocumentTemplates`, `InstructorChecklists`, `InstructorDocumentVault`, `InstructorClockInOut`, `InstructorAICommand`, `InstructorWorkflows`, `InstructorWaivers`, `InstructorDailyManifest`, `InstructorEODReport`, `InstructorBulkOperations`, `InstructorReportsHub`, `InstructorDataImport`, `OutstandingTasksPage`, `EndOfDayPage`, `InstructorSettings`, `InstructorSettingsCategory`, `InstructorWhatsAppSettings`, `InstructorWhatsAppTemplates`, `InstructorSubscriptions`

## Out of scope
- Bottom-nav `InstructorMobileBottomNav` — already canonical.
- Header `InstructorMobileHeader` — already canonical.
- The `Every Instructor` portal (`/every-instructor/*`) — separate brand per memory, not touched.
- Functional behaviour, RLS, edge functions — purely visual.

## Save memory
Add `mem://style/ios-tile-primitive` documenting `IOSTile` as the single source of truth for instructor portal tiles.

## Confirm before I start
Two questions:
1. **Hero gradients** — I'll remove the purple/rose/indigo gradient hero cards on Notifications / Health / Pipeline etc. and replace with the compact `IOSPageTitle`. OK to drop the gradients entirely?
2. **Order** — should I do all 6 batches in one go, or stop after batch 1 (Dashboard) so you can review the look first?
