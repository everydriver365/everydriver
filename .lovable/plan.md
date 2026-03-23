

## Audit: Features with UI Built But Not Fully Functional

### 1. Automations — NEVER TRIGGERED (High Priority)

**Problem**: The `process-automations` edge function exists and handles triggers like `lesson_completed`, `cancellation`, `no_show`, `test_passed`, etc. The UI for creating automations works (AutomationBuilder + AutomationCard). But **nothing in the app ever calls `process-automations`**. There is zero client-side code that invokes it.

When an instructor completes a lesson, cancels a lesson, marks a no-show, or records a test pass — none of these flows call `supabase.functions.invoke('process-automations', ...)`. The automations just sit in the database doing nothing.

**What needs wiring**:
- End-lesson flow → invoke `process-automations` with `trigger_type: "lesson_completed"`
- Cancel lesson flow → invoke with `trigger_type: "cancellation"`
- No-show marking → invoke with `trigger_type: "no_show"`
- Test pass recording → invoke with `trigger_type: "test_passed"`
- New booking/enquiry → invoke with `trigger_type: "new_enquiry"`

**Also**: The `send_email` action type is listed in the AutomationBuilder UI but has **no handler** in the edge function. It would silently do nothing.

---

### 2. Workflows — ALSO NEVER TRIGGERED (High Priority)

**Problem**: Same issue as automations. The `process-workflows` edge function exists, the `WorkflowBuilder` UI lets instructors create multi-step workflows, but **nothing ever calls `process-workflows`** from the client. The workflows table gets populated but never executed.

---

### 3. Lesson Check-In — NO CRON JOB (Medium Priority)

**Problem**: The `send-lesson-checkin` edge function exists and would send push notifications to pupils the day before their lesson asking them to confirm attendance. The database has `check_in_sent_at`, `check_in_status`, and `check_in_responded_at` columns on `scheduled_lessons`. But there is **no pg_cron job** scheduled to call this function. It never runs.

**What needs wiring**: A daily cron job (e.g. 6 PM) that calls `send-lesson-checkin`.

---

### 4. Abandoned Checkout Remarketing — NO CRON/TRIGGER (Medium Priority)

**Problem**: The `AbandonedCheckoutTracker` UI component exists and reads from `abandoned_checkouts`. The UI has a "Resend Reminder" button. But there is **no automated process** that detects abandoned checkouts (booking started but not completed) or sends the initial reminder. The table exists but nothing populates it automatically, and no edge function sends the reminders.

---

### 5. Pipeline "Convert to Pupil" — NO AUTOMATION TRIGGER (Low Priority)

**Problem**: When a lead is converted to a pupil via `handleConvert` in `KanbanBoard.tsx`, it inserts into `pupils` and moves the lead to "active" stage. But it does **not** trigger any automation (e.g., a welcome SMS or note). If the instructor has set up a `new_enquiry` or related automation, it won't fire on conversion.

---

### Summary

| Feature | UI Built | Edge Function | Actually Triggered | Status |
|---------|----------|---------------|-------------------|--------|
| Automations | Yes | Yes | **No** | Dead code |
| Workflows | Yes | Yes | **No** | Dead code |
| Lesson Check-In | Yes (DB columns) | Yes | **No cron** | Dead code |
| Abandoned Checkout | Yes (UI) | No | **No** | Partial |
| `send_email` action | Listed in UI | **No handler** | N/A | Missing |

### Recommended Fix Priority

1. **Wire automations to trigger points** — add `process-automations` calls to end-lesson, cancel, no-show, test-pass, and new-enquiry flows
2. **Wire workflows** to the same trigger points (or combine with automations call)
3. **Add lesson check-in cron job** — daily at 6 PM
4. **Add `send_email` handler** to `process-automations` edge function
5. **Wire abandoned checkout detection** into the booking flow

Would you like me to tackle all of these, or start with a specific one?

