## Per-tab unread count pills on the inbox source tabs

Add a small count pill next to each of the three source tab labels (In-app · WhatsApp · Support) showing how many unread items live in that tab — so the instructor can see at a glance where the new activity is without having to switch tabs.

### How it looks

Each segment in the existing source `SegmentedControl` keeps its icon + text label and gains a compact count pill on the right when unread > 0:

```text
[ 💬 In-app  3 ]  [ 🟢 WhatsApp ]  [ ❓ Support  1 ]
```

Pill styling:
- Active tab: white pill with system-blue text (`#2B7BC8`), so it reads on the dark active background.
- Inactive tab: red dot pill (`#C8434F` bg, white text) — same red as the row badges, ~16px tall, 5px horizontal padding.
- Counts ≥ 10 clamp to `9+`.
- No pill rendered when the count is 0.
- Muted conversations are **excluded** from the totals (consistent with the new mute behaviour — muted threads shouldn't shout from the tab).

### How the counts are computed

- **In-app** = sum of `unread_count` across `conversations` where `muted_at IS NULL` (already loaded by `useMessaging`).
- **WhatsApp** = sum of `unread_count` across `waConversations` where `muted_at IS NULL` (already loaded by `useWhatsAppConversations` after the recent `read_at` change).
- **Support** = count of `admin_messages` where `sender_type='admin'` AND `read_at IS NULL` AND `conversation_id` belongs to this instructor's `admin_conversations` row. Fetched via a small `useEffect` on mount + a realtime channel on `admin_messages` so it updates live. Cleared when the user opens and exits the support thread.

The totals are realtime: in-app and WhatsApp already refresh via the existing realtime subscriptions in their hooks; the support count subscribes to `admin_messages` for live updates.

### Code changes (single file)

**`src/pages/InstructorUnifiedInbox.tsx`**:
1. Replace the existing `totalUnread` block with three `useMemo`s (`inAppUnread`, `waUnread`) that exclude muted threads, plus a `supportUnread` state + `useEffect` that queries `admin_conversations` → `admin_messages` and subscribes to changes.
2. Add a small `<TabCountPill count active />` helper component inside the file.
3. Inject `<TabCountPill>` into each of the three `SegmentedControl` option labels, immediately after the existing text.

### Out of scope

- The global bottom-nav inbox bell badge (lives in `useUnreadMessagesCount` / nav layout) — separate prompt if you also want that to dim for muted threads.
- Per-audience (Pupils vs Admin) sub-toggle counts — In-app pupils unread already reflected on the parent In-app pill, so adding a second layer would be noisy. Easy follow-up if wanted.