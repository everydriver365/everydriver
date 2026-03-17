

## Problem

The mini-website live chat widget's guided quick-reply flow asks 5 questions (lesson type, transmission, instructor preference, start date, postcode) but does nothing with the answers. The root cause is that `ai_receptionist_enabled` is set to `false` for Ken D's instructor record, so the `ai-receptionist` edge function returns `{"reply":null,"reason":"ai_disabled"}` and never generates a response.

The network logs confirm this -- every call to `/functions/v1/ai-receptionist` returns `{"reply":null,"reason":"ai_disabled"}`.

## Fix

**1. Enable the AI receptionist for Ken D (database update)**

Run a migration to set `ai_receptionist_enabled = true` for instructor `c9843b58-6edb-4b97-8238-65d725e30aea`.

```sql
UPDATE instructors 
SET ai_receptionist_enabled = true 
WHERE id = 'c9843b58-6edb-4b97-8238-65d725e30aea';
```

This single change will make the guided flow functional -- after the visitor completes the questions, the AI receptionist will process the conversation history and respond with relevant course/instructor information.

No code changes are needed. The chat widget, quick-reply flow, and edge function are all wired up correctly already.

