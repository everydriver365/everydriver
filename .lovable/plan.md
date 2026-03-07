

## Plan: Add 5 New Voice Commands to Ask ED

### New Commands

1. **record_payment** — "Record £30 from Sarah"
2. **cancel_lesson** — "Cancel my next lesson with Tom"
3. **weekly_earnings** — "How much did I earn this week?"
4. **free_slots** — "When am I free tomorrow?"
5. **log_lesson_note** — "Sarah did well on roundabouts today"

### Changes Required

#### 1. Update `voice-parse-intent` edge function
- Add 5 new actions to the system prompt with examples
- Add new enum values: `record_payment`, `cancel_lesson`, `weekly_earnings`, `free_slots`, `log_lesson_note`
- Add new tool parameters: `amount` (number), `note` (string), `date` (string for free_slots, e.g. "tomorrow")

#### 2. Update `voice-execute` edge function
Add 5 new `case` blocks:

- **record_payment**: Find pupil by name, insert into `payment_history` (amount, pupil_id, instructor_id, payment_method="Voice/Cash"), update `account_balance` on `pupils` table
- **cancel_lesson**: Find next upcoming lesson for the named pupil, update `status` to "cancelled" and set `cancellation_reason` to "Cancelled via voice assistant"
- **weekly_earnings**: Query `payment_history` for current week (Mon-Sun), sum amounts, return total
- **free_slots**: Query `scheduled_lessons` for the requested date, calculate gaps between lessons (and before first / after last), return available time windows
- **log_lesson_note**: Find the most recent or next lesson for the pupil, update `notes` field on `scheduled_lessons` with the spoken note

#### 3. Update `useVoiceAssistant.ts` hook
- Pass new parsed fields (`amount`, `note`, `date`) through to `voice-execute`

### No database changes required
All tables (`payment_history`, `scheduled_lessons`, `pupils`) already exist with the needed columns.

