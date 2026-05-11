## Make DVSA Indicators Clickable

Update `src/components/instructor/dashboardV2/DvsaIndicatorsPanel.tsx`:

1. **Clickable tiles** — wrap each of the 4 indicator tiles in a `<button>` that navigates to `/instructor/test-results` via `useNavigate()`. Add hover state (subtle bg tint) and pointer cursor.

2. **Empty state** — when `m.totalTests === 0`, replace the 4-tile grid with a centred "No driving test results logged yet" message + a "Log a test result" button that also routes to `/instructor/test-results`.

3. **Loading state** — while `m.loading` is true, show 4 skeleton tiles instead of zeroed-out greens (avoids the misleading "all green" flash before data loads).

No changes to data wiring, thresholds, or the parent `InstructorPortal.tsx`.