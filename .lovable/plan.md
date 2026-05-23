## Goal
When an instructor adds a lesson on the mobile app, the "Next Up" tile on the instructor home (`MobileHomeDSM2026` → `NextLessonCard`) should immediately reflect the new lesson when it becomes the soonest upcoming lesson.

## Findings so far
- The tile is driven by `useNextLessonDetails(instructorId)` — key `["next-lesson-details", instructorId]`, `staleTime: 0`, 60s `refetchInterval`, `refetchOnWindowFocus: true`.
- The hook queries **today only** first (`.eq("lesson_date", today)`), then falls back to the next future date *only if today returns nothing*. So if today already has a lesson, an added future lesson will correctly not change the tile — but an added **earlier-today** lesson should.
- All `AddLessonSheet` save paths (`handleAddLessonExisting` line 766, `handleAddLessonNew` line 854) call `invalidateLessonQueries(queryClient)`, which invalidates `["next-lesson-details"]` (prefix match against `[..., instructorId]`).
- On mobile `/instructor`, the home view (`MobileHomeDSM2026`) does **not** mount its own `AddLessonSheet` — its FAB navigates to `/instructor/schedule?add=1`. The sheet is mounted on `InstructorSchedule.tsx`. The invalidation still goes through the shared `QueryClient`, so when the user navigates back the home should refetch.

## Most likely causes
1. **Stale closure / no re-render**: `NextLessonCard` receives `lesson` as a prop but parent may not re-render fast enough — confirm with a console log on `useNextLessonDetails` data changing.
2. **Future-date hook gap**: when today has no lessons and user adds one for tomorrow, the fallback query *does* refetch — verify it returns the new row (no extra cache key mismatch).
3. **Realtime not firing on mobile**: `useGlobalLessonSync` invalidates on `scheduled_lessons` realtime events, but is only mounted in some layouts — verify it is mounted in the path serving `/instructor` mobile. If not, the only refresh trigger is the explicit `invalidateLessonQueries` call inside `AddLessonSheet`.
4. **Schedule page's `onSuccess` only calls `calendar.refetch()`** — that's fine because the sheet itself already invalidates lesson queries; but worth re-confirming the order (`invalidateLessonQueries` runs before `onSuccess`, so the home query is marked stale before navigation).

## Plan

### Step 1 — Reproduce & confirm
- Add a temporary `console.log` in `useNextLessonDetails` queryFn entry/exit (`instructorId`, count of `todayLessons`, returned `lessonId`).
- From mobile home → FAB → add a lesson for *today, earlier than the current next lesson* on `/instructor/schedule`.
- Navigate back to `/instructor` and observe:
  - Did `useNextLessonDetails` re-run?
  - Did it return the new lesson id?
  - Did `NextLessonCard` re-render?

### Step 2 — Apply the right fix based on the signal

- **If queryFn doesn't re-run on navigate back**: ensure `useGlobalLessonSync(instructorId)` is mounted in the InstructorPortal mobile layout (likely in `InstructorPortalLayout`). If missing, add it there so any scheduled_lessons INSERT triggers invalidation regardless of where the user is.
- **If queryFn runs but returns stale data**: harden the SELECT — drop `.neq("status","completed")` from the *primary* query path (a freshly inserted lesson is `scheduled`, so this is unlikely the culprit, but confirm there is no RLS visibility lag by adding a tiny retry-on-empty when we just invalidated).
- **If queryFn returns the right lesson but card doesn't update**: check `NextLessonCard` is not wrapped in `React.memo` with a stale equality check; remove memoization or include `lesson.lessonId` + `lesson.startTime` in comparison.
- **Always**: change `invalidateLessonQueries` callers in `AddLessonSheet` from `invalidateQueries` to `invalidateQueries({ refetchType: "all" })` so background (inactive) queries also refetch — this matters because the home query is *inactive* while the user is on `/instructor/schedule`.

### Step 3 — Verify
- Repeat the repro: add lesson for today (earlier than current next), today (no existing lessons), and tomorrow. Confirm tile updates in cases 1 and 2, and stays correct in case 3.
- Remove the temporary console logs.

## Files likely touched
- `src/lib/invalidateLessonQueries.ts` — add `refetchType: "all"` so inactive home query refetches.
- `src/components/instructor/AddLessonSheet.tsx` — no change expected if Step 2 fix is in the helper.
- `src/hooks/useNextLessonDetails.ts` — only if Step 2 reveals a data issue.
- `src/pages/InstructorPortal.tsx` or `InstructorPortalLayout` — mount `useGlobalLessonSync` if missing (defensive).

## Out of scope
- Desktop dashboard (`HybridDashboard`) — only fixing mobile per the report.
- Any business logic changes to lesson creation.
