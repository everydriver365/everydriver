

# Add Test Reservation Alert to Admin Dashboard

## What's Missing
The admin dashboard's System Alerts card currently monitors compliance expirations, pending payments, and inactive instructors. It has no visibility into test slot reservations. When an instructor reserves a scraped test slot, nothing appears on the admin dashboard.

## Plan

### 1. Update `src/components/admin/SystemAlertsCard.tsx`
Add a new query to the `fetchAlerts` function that counts recent/pending test slot reservations from the `test_slot_reservations` table. If any exist, display a new alert like:

> "3 test slot reservations pending" (info type, with a navigation action)

**Changes:**
- Add a new parallel query: count rows from `test_slot_reservations` where `status = 'reserved'` (or all recent ones)
- Add a new alert entry with type "info", a calendar/clipboard icon, and navigation to the test swap section
- Subscribe to realtime changes on `test_slot_reservations` so the alert updates automatically

### 2. Update `src/hooks/useAdminDashboardStats.ts` (optional enhancement)
Add a `testReservations` count to the dashboard stats so it can also appear in the overview cards if desired.

### 3. Wire up navigation
The alert's "Review" button will call `onNavigate("test-swap")` (or whichever section key the admin dashboard uses for test swap management).

## Technical Details

**SystemAlertsCard.tsx** - Add to the `Promise.all` block:
```typescript
// Test slot reservations
supabase
  .from("test_slot_reservations")
  .select("id", { count: "exact", head: true })
  .eq("status", "reserved"),
```

Add alert generation:
```typescript
const reservationCount = reservationsRes.count || 0;
if (reservationCount > 0) {
  newAlerts.push({
    id: "test-reservations",
    type: "info",
    icon: CalendarCheck,
    message: `${reservationCount} test slot reservation${reservationCount > 1 ? "s" : ""} pending`,
    count: reservationCount,
    action: "Review",
    section: "test-swap",
  });
}
```

Add realtime subscription for `test_slot_reservations` table alongside the existing ones.

No database changes needed -- the `test_slot_reservations` table already exists.
