## Bulk select, mark-as-read, and mute on the Inbox

Add a multi-select mode to the instructor inbox so multiple conversations can be marked as read and/or muted in one go. Works across all three sources (In-app, WhatsApp, Support) and persists mute state per conversation.

### How it looks and behaves

Entering select mode (two routes):
- **Long-press** any conversation row (~450 ms hold) — that row enters selected state and the header swaps to action mode.
- **Select** text button added next to the existing Broadcast link in the list header.

Selected mode UI (replaces the hero card while active):
- Left: Cancel button (exits select mode, clears selection)
- Center: "N selected" count
- Right: two icon buttons — `CheckCheck` (mark read) and `BellOff` / `Bell` (mute / unmute, label flips when all selected are already muted)
- Rows show a circular checkbox on the left (replacing the avatar position visually with a small overlay tick); tap toggles selection. Selected rows get a subtle blue outline.
- Tapping a row in select mode toggles selection — it does NOT open the chat.

Muted conversations (in normal mode):
- Small `BellOff` glyph appears next to the timestamp on the row.
- Unread badge still shows the count, but rendered grey instead of red so muted threads don't visually shout.

Empty selection action: buttons disabled (50% opacity) when 0 selected.

### Database changes (one migration)

Add persistent mute state to both conversation tables (Support uses an instructor-level setting since it's a single thread):

```sql
ALTER TABLE public.conversations
  ADD COLUMN muted_at timestamptz;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN muted_at timestamptz;

ALTER TABLE public.instructors
  ADD COLUMN support_chat_muted_at timestamptz;
```

Also add a `read_at` column to `whatsapp_messages` so WhatsApp unread tracking is symmetrical with in-app messages (it currently has none — `unread_count` on the hook is computed from `delivery_status` heuristics and there's no way to mark read):

```sql
ALTER TABLE public.whatsapp_messages
  ADD COLUMN read_at timestamptz;
CREATE INDEX idx_wa_messages_unread
  ON public.whatsapp_messages (conversation_id)
  WHERE read_at IS NULL AND direction = 'inbound';
```

No new RLS policies needed — existing instructor-scoped policies on `conversations` and `whatsapp_conversations` already cover updates to the new column. `instructors` already has owner-scoped update policies.

### Code changes

**`src/pages/InstructorUnifiedInbox.tsx`** — bulk of the work:
- New state: `selectMode: boolean`, `selectedIds: Set<string>`.
- New handlers: `enterSelectMode(initialId?)`, `toggleSelected(id)`, `exitSelectMode()`, `bulkMarkRead()`, `bulkToggleMute()`.
- `ConversationRow` gains `selectMode`, `selected`, `muted`, `onLongPress` props. Click behaviour switches to `toggleSelected` while in select mode.
- Long-press: simple `onPointerDown` + `setTimeout(450ms)` + `onPointerUp/Leave` cancel pattern (no extra dep).
- Hero card swaps to a "selection action bar" when `selectMode === true`.
- "Select" text link added next to "Broadcast" in the list header (visible whenever the list has ≥1 row).
- Muted indicator + grey-vs-red badge tint passed down to `UnreadBadge`.

**`src/hooks/useMessaging.ts`**:
- Extend `Conversation` type with `muted_at: string | null`.
- Include `muted_at` in the conversations select.
- Add `bulkMarkConversationsRead(ids: string[])` — bulk update `messages.read_at` where `conversation_id IN (ids)` AND `sender_type = 'pupil'` AND `read_at IS NULL`.
- Add `bulkSetMute(ids: string[], muted: boolean)` — update `conversations.muted_at`.
- After each bulk action, call existing `fetchConversations()` to refresh local state.

**`src/hooks/useWhatsAppConversations.ts`**:
- Add `muted_at` to type and select.
- Recompute `unread_count` using the new `read_at` column instead of the current heuristic.
- Add `bulkMarkWaRead(ids)` and `bulkSetWaMute(ids, muted)`.

**`src/hooks/useUnreadMessagesCount.ts`** — already aggregates across sources. Add a "skip muted" filter so muted conversations don't contribute to the global tab badge (the bell icon in nav). Counts still display per-row for transparency.

**Push notification suppression** — check `supabase/functions/send-push-notification` (or equivalent) for the path that fires on new in-app/WhatsApp messages. If found, add a guard: skip push when the target conversation has `muted_at IS NOT NULL`. If the function doesn't exist or doesn't pull from these tables, this becomes a no-op for v1 and only the in-app badge dimming applies — I'll confirm during build and note it back.

### Out of scope (kept as-is)

- Bulk archive / delete (separate prompt if wanted).
- Timed mute (e.g. "mute for 8 hours"). `muted_at` is a simple on/off; we can layer a `muted_until` later without breaking anything.
- Changing the chat detail screen.
- Auto-mark-read when scrolling past a row (still requires opening the thread).