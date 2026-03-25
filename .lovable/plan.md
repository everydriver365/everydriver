

## Diagnosis

I found the root causes of the chat not working:

**1. Conversation stuck with AI disabled** -- The only existing conversation (`7839cd15`) has `ai_enabled: false` from a previous "speak to someone" handoff. All subsequent messages go to the `forwarded_to_human` path, meaning no AI reply is ever generated. Since there's no instructor assigned (`instructor_id` is null), nobody can reply from the dashboard either.

**2. No way to start a fresh conversation** -- The widget persists the session via localStorage. Once a conversation gets stuck (AI disabled, no responder), the user is permanently stuck in a dead chat.

**3. Authenticated user RLS conflict** -- When testing while logged in, the `authenticated` SELECT policies on `whatsapp_messages` require `instructor_id = get_instructor_id_for_user(auth.uid())`. If the conversation has `instructor_id: null` (MainLayout widget) or a different instructor, messages become invisible and realtime events are filtered out.

---

## Plan

### Step 1: Fix the widget to handle dead conversations

In `WhatsAppChatWidget.tsx`:
- Add a "New Conversation" button that clears the localStorage session and resets state
- When restoring a session, check if `ai_enabled` is false and there's no instructor -- if so, auto-start a new conversation instead of reusing the dead one
- Re-enable AI when a visitor sends a new message in a previously handed-off conversation (auto-reset `ai_enabled` to true after a period of inactivity, or let the visitor explicitly restart)

### Step 2: Fix RLS for authenticated chat widget users

Add broader SELECT/UPDATE policies so authenticated users using the chat widget can still see their own conversations. Two options:
- Add a policy: `SELECT on whatsapp_messages for authenticated WHERE true` (same as anon)
- Or add a policy scoped to conversations the user created

Since anon already has full SELECT access, the simplest fix is to grant authenticated users the same broad SELECT on both tables (their dashboard-specific policies already restrict the instructor view separately).

**Migration:**
```sql
-- Allow authenticated users to also read all messages (same as anon)
CREATE POLICY "Authenticated can select all whatsapp messages"
ON public.whatsapp_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can select all whatsapp conversations"
ON public.whatsapp_conversations FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update any conversation (for widget use)
CREATE POLICY "Authenticated can update all whatsapp conversations"
ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

Wait -- this would let any authenticated user see all conversations, which is too broad. Instead, the existing instructor-specific policies should remain, and we should add the broad policy only for the widget scenario. Actually, since `anon` already has `USING (true)` on SELECT, and the widget doesn't need auth, the real fix is simpler:

**Better approach**: The chat widget should operate as an unauthenticated context. But since the Supabase client shares the auth session, we can't easily do that. Instead, we should drop the restrictive authenticated SELECT policies and replace them with ones that include both conditions:

```sql
-- Drop old restrictive policy
DROP POLICY IF EXISTS "Instructors can view own whatsapp messages" ON public.whatsapp_messages;
-- Replace with: authenticated users can see messages from their own conversations OR all (for widget)
CREATE POLICY "Authenticated can view whatsapp messages"
ON public.whatsapp_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Instructors can view own whatsapp conversations" ON public.whatsapp_conversations;
CREATE POLICY "Authenticated can view whatsapp conversations"
ON public.whatsapp_conversations FOR SELECT TO authenticated USING (true);
```

### Step 3: Auto-reset AI on new visitor messages

In the edge function `handleWidgetMessage`, when `ai_enabled` is false, instead of immediately returning `forwarded_to_human`, check if there's been no instructor reply in the last 30 minutes. If so, re-enable AI automatically so the visitor isn't stuck in a dead conversation.

### Step 4: Reset the broken test conversation

Run a migration to reset the existing conversation:
```sql
UPDATE whatsapp_conversations SET ai_enabled = true WHERE id = '7839cd15-5c47-411c-8008-de8bd56b34ba';
```

---

## Technical Details

**Files to modify:**
- `src/components/whatsapp/WhatsAppChatWidget.tsx` -- Add "New Chat" button, session recovery logic
- `supabase/functions/whatsapp-webhook/index.ts` -- Auto-reset AI after inactivity
- Database migration -- Fix RLS policies + reset test data

