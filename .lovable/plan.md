

## End-of-Lesson Wizard — Streamlined Post-Lesson Flow

### Current State

Right now, ending a lesson is fragmented across multiple disconnected screens and actions:

1. **"Done" button** on TodayScheduleView — fires a simple confirm dialog, then runs ~5 sequential DB operations (mark complete, log history, award points, deduct balance, calculate mileage). No UI for additional actions.
2. **PostLessonReview** — only accessible later from LessonHistory, not surfaced at end-of-lesson. Contains DVSA syllabus grid, notes, and AI lesson plan generator.
3. **Payment recording** — requires navigating to the pupil card, opening RecordPaymentModal separately.
4. **Booking next lesson** — no prompt at all; instructor must go to the diary or pupil card and manually schedule.
5. **Voice notes** — only exists in RunningLateSheet; no speech-to-text for lesson notes.
6. **GPS track saving** — happens silently in the background via telematics; no explicit "save route" prompt.
7. **Lesson report distribution** — no mechanism to push a summary to the pupil/parent dashboard after completion.

### Proposed Solution: Multi-Step End-of-Lesson Wizard

Create a new `EndLessonWizard` bottom sheet that replaces the simple "Complete Lesson?" confirm dialog. It guides the instructor through a streamlined sequence of steps, each optional and skippable.

```text
┌─────────────────────────────────┐
│  End Lesson — Sarah Johnson     │
│  ─────────────────────────────  │
│                                 │
│  Step 1: Quick Summary          │
│  ┌───────────────────────────┐  │
│  │ Duration: 2h  Miles: 14.2 │  │
│  │ Balance: -£40 → -£80     │  │
│  │ [🎤 Voice Note] [✏️ Type] │  │
│  └───────────────────────────┘  │
│                                 │
│  Step 2: Payment (if balance <0)│
│  ┌───────────────────────────┐  │
│  │ £40 due · [Cash] [Card]  │  │
│  │ [QR Code] [Skip]         │  │
│  └───────────────────────────┘  │
│                                 │
│  Step 3: Skills Update (compact)│
│  ┌───────────────────────────┐  │
│  │ Quick-tap DVSA levels     │  │
│  │ (collapsed, expandable)   │  │
│  └───────────────────────────┘  │
│                                 │
│  Step 4: Book Next Lesson       │
│  ┌───────────────────────────┐  │
│  │ Next available: Tue 14:00 │  │
│  │ [Book This] [Choose Date] │  │
│  │ [Skip]                    │  │
│  └───────────────────────────┘  │
│                                 │
│  [Complete & Send Report →]     │
│                                 │
└─────────────────────────────────┘
```

### Steps in Detail

**Step 1 — Quick Summary & Notes**
- Auto-populated duration, mileage (from GPS if active), balance change
- Voice-to-text button using browser `SpeechRecognition` API (no external dependency) for quick dictation of lesson notes
- Falls back to text input
- Option to save GPS route to saved_routes

**Step 2 — Take Payment** (shown only if pupil has negative balance)
- Inline version of RecordPaymentModal (cash/card/QR)
- Pre-filled with lesson cost amount
- Skip button to defer

**Step 3 — Skills Update** (compact PostLessonReview)
- Collapsed by default showing "Tap to update skills"
- When expanded, shows the existing DVSA competency grid
- AI Suggest button for next lesson plan

**Step 4 — Book Next Lesson**
- Shows next 3 available slots from instructor availability
- One-tap booking
- "Choose another date" opens the existing LessonScheduler
- Skip to finish without booking

**Final Action — Complete & Send Report**
- Runs existing `handleCompleteLesson` logic (mark complete, log history, points, balance deduction, mileage)
- Generates a lesson summary card and saves it to `lesson_history`
- Pushes the report to the pupil portal (visible in their dashboard timeline)
- Pushes to parent dashboard if parent is linked
- Shows confetti/success animation

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/instructor/EndLessonWizard.tsx` | **Create** — main wizard component with step navigation |
| `src/components/instructor/end-lesson/StepSummary.tsx` | **Create** — summary + voice note step |
| `src/components/instructor/end-lesson/StepPayment.tsx` | **Create** — inline payment step |
| `src/components/instructor/end-lesson/StepSkills.tsx` | **Create** — compact DVSA grid (wraps PostLessonReview) |
| `src/components/instructor/end-lesson/StepBookNext.tsx` | **Create** — quick-book next lesson |
| `src/hooks/useVoiceToText.ts` | **Create** — browser SpeechRecognition hook |
| `src/components/instructor/TodayScheduleView.tsx` | **Modify** — replace confirm dialog with EndLessonWizard |
| `src/components/instructor/NextUpTile.tsx` | **Modify** — add "End Lesson" action alongside "Start Lesson" |

### No Database Changes Required

All data models already exist (`lesson_history`, `payment_history`, `pupil_syllabus_progress`, `scheduled_lessons`, `saved_routes`). The wizard simply orchestrates existing operations into a single guided flow.

