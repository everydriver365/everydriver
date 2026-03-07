

## Plan: Add More Useful Voice Commands to Ask ED

### Current Commands (already implemented)
- send_message, next_lesson, today_schedule, pupil_balance, navigate, record_payment, cancel_lesson, weekly_earnings, free_slots, log_lesson_note

### Proposed New Commands

**1. pupil_count** — "How many pupils do I have?"
- Query active pupil count from `pupils` table
- Simple but frequently useful stat

**2. tomorrow_schedule** — "What's on tomorrow?"
- Like today_schedule but for tomorrow (currently requires "What's my schedule today" only)
- Reuse today_schedule logic with a date parameter

**3. reschedule_lesson** — "Move Sarah's lesson to Thursday"
- Find next upcoming lesson for the pupil, update `lesson_date` to the requested day
- Parameters: `pupil_name`, `new_date`

**4. send_running_late** — "Tell Sarah I'm running 10 minutes late"
- Shortcut that auto-generates a polite "running late" message with ETA
- Parameters: `pupil_name`, `delay_minutes`

**5. total_lessons_today** — "How many lessons left today?"
- Count remaining lessons (after current time) for quick at-a-glance info

**6. pupil_test_date** — "When is Sarah's test?"
- Query `test_date` from `pupils` table
- Parameters: `pupil_name`

**7. unpaid_pupils** — "Who hasn't paid?"
- Query pupils with negative `account_balance`, list names and amounts owed

### Changes Required

#### 1. `supabase/functions/voice-parse-intent/index.ts`
- Add 7 new actions to the system prompt with example phrases
- Add new enum values and parameters (`new_date`, `delay_minutes`)

#### 2. `supabase/functions/voice-execute/index.ts`
- Add 7 new `case` blocks with the database queries described above

#### 3. `src/hooks/useVoiceAssistant.ts`
- Pass `new_date` and `delay_minutes` through to voice-execute

### No database changes needed
All data already exists in existing tables (`pupils`, `scheduled_lessons`, `payment_history`).

