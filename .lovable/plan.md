## Save architectural decision to memory

Persist the decision so future sessions don't re-suggest swapping to the Lovable Google Calendar connector.

### 1. Create new memory file `mem://constraints/google-calendar-service-account-architecture.md`

```
---
name: Google Calendar uses service account, not connector
description: Calendar sync uses GOOGLE_SERVICE_ACCOUNT_EMAIL with domain-wide delegation; do not switch to the Lovable Google Calendar connector
type: constraint
---
Google Calendar integration uses a Google Cloud service account
(`GOOGLE_SERVICE_ACCOUNT_EMAIL` + private key) with domain-wide
delegation to impersonate each instructor's calendar.

Implemented in:
- supabase/functions/google-calendar-service/index.ts
- supabase/functions/process-calendar-queue/index.ts

**Do NOT switch to the Lovable Google Calendar connector.** The
connector is OAuth-based and authenticates only one Google account
(the workspace owner's) — it cannot impersonate per-instructor
calendars and would be a regression at 4,000-user scale.

The connector may only be considered as an additive feature for a
single shared admin/HQ calendar (e.g. "Drive365 HQ" internal
scheduling), never as a replacement for the per-instructor sync.
```

### 2. Update `mem://index.md` Memories list

Add this line under the existing `Google Calendar Sync` entry:

`- [GCal architecture](mem://constraints/google-calendar-service-account-architecture) — Service account + DWD; do not swap to Lovable connector`

No code changes. Memory only.
