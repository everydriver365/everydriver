## Goal

When you tap a summary tile in **Needs Attention** (Jobs / Tests / Calls / Enq's), show the actual items inline immediately — no second "Jobs" header row to click through.

## Current behaviour

Tapping Jobs reveals an `ActionTile` component that has:
1. Its own clickable header row (icon box + "Jobs" label + chevron + Clear/urgent pill)
2. A body with a sentence ("1 job requires your attention") + a "Review & mark handled →" button

So the user sees an intermediate header before getting to anything useful.

## Proposed change

Remove the nested `ActionTile` wrapper. When `openKey` is set, render a list panel directly under the 4-tile grid, with:

- A thin `#f0f1f4` divider above
- A small caption row: e.g. "1 pending job" on the left, "View all →" link on the right (routes to `/instructor/jobs` etc.)
- A short live list (up to 5 items) of the actual records for that section, each row tappable to deep-link to its detail page
- Empty state (icon + "No jobs to action") when the count is 0

The 4 summary tiles stay exactly as they are; only the expanded region changes.

### Per-section list content (all live, no fallbacks)

| Section | Source | Row shows | Tapping a row |
|---|---|---|---|
| Jobs | `course_enquiries` where `status='pending'` (latest 5) | Course type · hours · "expires in Xh" | `/instructor/jobs` (or `?id=`) |
| Tests | `test_swap_offers` pending + `test_slot_reservations` scraped_match for this instructor | Centre · date · status pill | `/instructor/test-requests` |
| Calls | `live_chat_messages` unread joined to active `live_chat_sessions` (latest 5, grouped by session) | Visitor name/anon · last message snippet · time | `/instructor/calls` |
| Enq's | unread `messages` from pupils across this instructor's `conversations` (latest 5, grouped by conversation) | Pupil name · snippet · time | `/instructor/messages?c={id}` |

### New hooks to add (small, query-only)

- `usePendingJobsList(limit=5)` — extends existing `usePendingJobsPreview` pattern to return a list
- `useTestActionItems(instructorId, limit=5)` — combines pending offers + scraped matches
- `useVisitorChatActionItems(instructorId, limit=5)`
- `useUnreadMessageThreads(instructorId, limit=5)`

Each follows the existing pattern: React Query + realtime invalidation on the same tables already used by the count hooks, so the lists refresh in lockstep with the counts.

## Files touched

- `src/components/instructor/MobileHomeDSM2026.tsx` — replace the filtered `ActionTile` render block with a direct `<SectionPanel>` that renders the list for `openKey`
- `src/hooks/usePendingJobsList.ts` *(new)*
- `src/hooks/useTestActionItems.ts` *(new)*
- `src/hooks/useVisitorChatActionItems.ts` *(new)*
- `src/hooks/useUnreadMessageThreads.ts` *(new)*

## Out of scope

- No DB changes, no migrations
- No "mark handled" mutations in this pass (kept as a "Review →" link to the dedicated page)
- No styling changes to the 4 summary tiles or to the rest of the Needs Attention card
- No changes to any other dashboard tile