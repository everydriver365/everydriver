

## Show Instructor Online Status in Mini-Site Chat Widget

### Problem
The live chat widget on the mini-site doesn't indicate whether the instructor is currently online. Visitors have no idea if they'll get a live response or need to wait.

### Approach
Use Supabase Realtime Presence to track instructor online status. When the instructor is logged in and has their dashboard open, they broadcast their presence. The chat widget on the mini-site subscribes to this presence channel and shows a green "Online" dot or an "Offline — will reply shortly" message.

### Changes

**1. Database: Add `last_active_at` column to `instructors` table**
- Fallback for when presence isn't available (e.g. page just loaded)
- Updated periodically by the instructor's dashboard

```sql
ALTER TABLE instructors ADD COLUMN last_active_at timestamptz;
```

**2. Create a hook `useInstructorPresence.ts`**
- On the **instructor side** (dashboard): join a Supabase Realtime presence channel (`instructor-presence:{instructorId}`) and track the instructor as online
- Also periodically update `last_active_at` in the database (every 2 minutes)

**3. Create a hook `useInstructorOnlineStatus.ts`**
- Used by the **visitor side** (chat widget): subscribe to the same presence channel to detect if the instructor is online
- Falls back to checking `last_active_at` (online if active within last 5 minutes)

**4. Update `LiveChatWidget.tsx`**
- Import and use `useInstructorOnlineStatus(instructorId)`
- In the header, show:
  - **Online**: green dot + "Online now"
  - **Offline**: grey dot + "{instructorName} will reply shortly"
- Replace the current static subtitle text

**5. Wire up instructor presence broadcasting**
- In the instructor dashboard layout or `VisitorChatManager`, call the presence broadcast hook so instructors are tracked as online when logged in

### Visual Result
```text
┌─────────────────────────────┐
│ 🟢 Ken D                    │
│    Online now                │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ⚪ Ken D                    │
│    Will reply shortly        │
└─────────────────────────────┘
```

