

## Plan: Add Every Possible Voice Command for the App

This is a large expansion — adding ~25 new commands covering navigation to all app pages and new data-driven actions.

### Current State
20 commands exist. The navigate action only covers 8 pages. Many app features have no voice access.

### New Commands to Add

#### A. Expanded Navigation (15 new page targets)
Expand the `navigate` case's `pageMap` to include all instructor pages:

| Voice phrase | Route |
|---|---|
| "Show my diary" | /instructor/diary |
| "Open expenses" | /instructor/expenses |
| "Go to income" | /instructor/income |
| "Show my tax" | /instructor/tax |
| "Open accounts" | /instructor/accounts |
| "Show live tracking" | /instructor/live |
| "Open sat nav" | /instructor/satnav |
| "Find my car" | /instructor/find-my-car |
| "Show my mileage" | /instructor/mileage |
| "Open vehicle health" | /instructor/vehicle-health |
| "Show my health" | /instructor/health |
| "Open to-do list" | /instructor/todos |
| "Show my notes" | /instructor/notes |
| "Open reviews" | /instructor/reviews |
| "Show referrals" | /instructor/referrals |
| "Open dashcam" | /instructor/dashcam |
| "Show routes" | /instructor/routes |
| "Open test results" | /instructor/test-results |
| "Show notifications" | /instructor/notifications |
| "Open my website" | /instructor/website |
| "Show resources" | /instructor/resources |
| "Open standards check" | /instructor/standards-check |
| "Show CPD" | /instructor/cpd |
| "Open availability" | /instructor/availability |
| "Show fleet dashboard" | /instructor/fleet-dashboard |
| "Show nearby friends" | /instructor/nearby-friends |
| "Open doodlepad" | /instructor/doodlepad |
| "Show document templates" | /instructor/document-templates |
| "Show lesson plans" | /instructor/plans |
| "Open test requests" | /instructor/test-requests |

#### B. New Data-Driven Commands (10 new actions)

1. **add_pupil** — "Add a new pupil called Emma Smith"
   - Parameters: `pupil_name`, `phone` (optional)
   - Insert into `pupils` table with instructor_id

2. **pupil_contact** — "What's Sarah's phone number?"
   - Parameters: `pupil_name`
   - Query phone/email from `pupils`

3. **monthly_earnings** — "How much did I earn this month?"
   - Query `payment_history` for current month, sum amounts

4. **lesson_count** — "How many lessons has Sarah had?"
   - Parameters: `pupil_name`
   - Count completed lessons from `scheduled_lessons`

5. **add_todo** — "Add a to-do: order new L plates"
   - Parameters: `todo_text`
   - Insert into `instructor_todos` table

6. **next_test** — "Who has a test coming up?"
   - Query all pupils with `test_date` in the future, ordered soonest first

7. **week_schedule** — "What does my week look like?"
   - Query `scheduled_lessons` for Mon-Sun of current week, summarise by day

8. **pupil_progress** — "How is Sarah doing?"
   - Parameters: `pupil_name`
   - Query lesson count, latest notes, test date — return a summary

9. **record_expense** — "Log an expense of £40 for fuel"
   - Parameters: `amount`, `expense_category` (e.g. fuel, car wash, insurance)
   - Insert into `instructor_expenses`

10. **total_hours_today** — "How many hours am I teaching today?"
    - Sum `duration_minutes` for today's non-cancelled lessons

### Files to Change

#### 1. `supabase/functions/voice-parse-intent/index.ts`
- Add 10 new action enums to the tool definition
- Add all new example phrases to the system prompt
- Add new parameters: `phone`, `todo_text`, `expense_category`

#### 2. `supabase/functions/voice-execute/index.ts`
- Expand `pageMap` with ~30 new route entries
- Add 10 new `case` blocks for the data-driven commands
- Each case follows the existing pattern: find data → build response text

#### 3. `src/hooks/useVoiceAssistant.ts`
- Pass new fields (`phone`, `todo_text`, `expense_category`) through to voice-execute

### No database changes needed
All tables already exist (`pupils`, `scheduled_lessons`, `payment_history`, `instructor_expenses`, `instructor_todos`).

