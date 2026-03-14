

## Make Briefing Action Cards Functional with Detail Modals

### Problem
The "Review payments" and "Test prep" action cards in the Morning Briefing do nothing when clicked — `onNavigate` is never passed to `MorningBriefingCard` by any parent component, and there's no modal or navigation logic.

### Solution
Add a **BriefingActionModal** that opens when an action card is clicked, fetches and displays relevant summary data, and provides a "Go to [section]" button to navigate to the full page.

### Changes

**New file: `src/components/instructor/BriefingActionModal.tsx`**
- A dialog that accepts `actionId`, `instructorId`, and `open`/`onClose` props
- Based on `actionId`, fetches and displays:
  - **`payments`**: Query pupils with negative `account_balance` → show list of names + amounts owed, with "Go to Payments" button linking to `/instructor/payments`
  - **`tests`**: Query `driving_test_results` or `scheduled_lessons` for upcoming tests → show pupil names + test dates, with "Go to Tests" button linking to `/instructor/tests`
  - **`weather`**: Show the weather info from briefing text, with a dismiss action
  - **`waitlist`**: Show cancellation gaps info, with "Go to Schedule" button linking to `/instructor/schedule`
  - **`schedule`**: Navigate directly to `/instructor/schedule`
- Uses `useNavigate` for the "Go to" button

**Modified: `src/components/instructor/MorningBriefingCard.tsx`**
- Replace the simple `onNavigate?.(actionId)` call with local state to open `BriefingActionModal`
- Add `activeAction` state and render the modal
- Remove dependency on the unused `onNavigate` prop (keep it for backwards compat but also handle internally)

### Modal UI (390px)
```
┌──────────────────────────┐
│ 💳 Review Payments    ✕  │
│                          │
│  John Smith     £120     │
│  Sarah Jones     £45     │
│  Mike Brown      £80     │
│                          │
│  3 pupils with balances  │
│                          │
│ [ Go to Payments → ]    │
└──────────────────────────┘
```

### Files
1. **Create** `src/components/instructor/BriefingActionModal.tsx`
2. **Edit** `src/components/instructor/MorningBriefingCard.tsx` — add modal state + render

