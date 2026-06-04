## Problem

Clicking an instructor from **Admin → Instructor Overview** opens the legacy `AdminInstructorProfile` (rendered via the `instructor-profile` in-portal section in `AdminPortal.tsx`). The new design we built — hero card + actions stack + three editable section columns — lives on the standalone route `/admin/instructors/:id` (`AdminInstructorDetail.tsx`) and is never reached.

## Fix

In `src/pages/AdminPortal.tsx`, change the `InstructorManager` `onViewProfile` handler so it navigates to the new route instead of switching the in-portal section:

```tsx
// before
onViewProfile={(id) => { setProfileInstructorId(id); setActiveSection("instructor-profile"); }}

// after
onViewProfile={(id) => navigate(`/admin/instructors/${id}`)}
```

(`navigate` from `react-router-dom` is already available in the file; if not, add `const navigate = useNavigate();`.)

## Cleanup (optional, same edit)

- Remove the now-unused `case "instructor-profile":` block and the `profileInstructorId` state, since nothing else sets it.
- Leave `AdminInstructorProfile` component on disk for now (other places may import it); only the routing entry is removed.

## Verification

1. Open Admin → Instructor Overview, click any instructor row → URL becomes `/admin/instructors/<id>` and the new 4-column layout renders (navy top bar with DRIVE/365 badge, hero card, actions stack, three section columns).
2. "Back" via the breadcrumb / browser back returns to the Instructor Overview list.

No DB, RLS, or business-logic changes.
