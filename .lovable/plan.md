## Bulk "Remind All" for Send Reminder

### Goal
Let an instructor remind every debtor in one tap, while keeping the existing single-pupil flow untouched. Tap → Send → Done.

### Entry points
1. **Owes Money card** — add a "Remind all" pill in the header that links to `/instructor/send-reminder?bulk=1` (only shown when there are 2+ debtors).
2. **Existing single-pupil link** (`?pupilId=...`) keeps working exactly as today.

### Send Reminder screen changes

**Mode detection from URL:**
- `?pupilId=xxx` → single mode (current behaviour, unchanged).
- `?bulk=1` → bulk mode (new).

**Bulk mode UI:**

```text
┌──────────────────────────────────────┐
│ ← Send Reminder · 5 pupils           │
├──────────────────────────────────────┤
│ OUTSTANDING                          │
│ 5 pupils owe you           £420.00   │
│ ●●●●● avatar stack                   │
├──────────────────────────────────────┤
│ Recipients (5)            Edit ▸     │
│ Alex · £120  Sam · £80  +3 more      │
├──────────────────────────────────────┤
│ QUICK MESSAGES                       │
│ [Pay {amt} now] [Friendly reminder]  │
│ [Due today]     [Overdue notice]     │
├──────────────────────────────────────┤
│ MESSAGE                              │
│ Hi {name}, just a reminder your      │
│ balance is £{amount}.                │
│ ⓘ {name} and {amount} personalised   │
├──────────────────────────────────────┤
│ SEND VIA                             │
│ [SMS]  [WhatsApp]  [In-app]          │
└──────────────────────────────────────┘
[ Send to 5 pupils ]   ← sticky
```

**Personalisation:** `{name}` and `{amount}` tokens in templates and the textarea are substituted per pupil at send time.

**Recipients editor:** "Edit" opens a sheet with a checklist of all debtors (all ticked by default). Untick to exclude. Updates count + total live.

**Channel availability in bulk:** SMS/WhatsApp tiles disabled only if no selected pupil has a phone; otherwise allowed and pupils without a phone are skipped (counted in the result toast).

**Send action (bulk):**
- Iterate selected pupils, substitute tokens, fan out via chosen channel:
  - `sms` / `whatsapp` → loop `supabase.functions.invoke("send-sms" | "send-whatsapp")` per pupil.
  - `in-app` → reuse conversation lookup/insert + `notify-pupil` per pupil.
- Insert one `followup_log` row per pupil (`manual_chase`).
- One bottom toast summary, e.g. `Sent to 4 · skipped 1 (no phone)` — no modal.
- Navigate back.

### Data fetch (bulk mode)
```ts
supabase.from("pupils")
  .select("id, name, phone, email, account_balance")
  .eq("instructor_id", instructorId)
  .is("deleted_at", null)
  .lt("account_balance", 0)
  .order("account_balance", { ascending: true });
```
Plus existing instructor query for `paymentLink`.

### Files to edit
- `src/pages/InstructorSendReminder.tsx` — add bulk mode (URL param, recipients state, token substitution, fan-out send, recipients edit sheet).
- `src/components/instructor/money/OwesMoneyCard.tsx` — add "Remind all" header pill → `/instructor/send-reminder?bulk=1`.

### Out of scope
- No backend / edge function changes.
- No changes to messaging templates infrastructure or pupil data.
- No mobile layout changes outside this screen.
