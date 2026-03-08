## Completed: Pipeline Board, On-My-Way Texts, Workflow Automations, AI Receptionist, Smart Buffer Time & Recurring Subscriptions

All 6 features have been built and deployed.

### Feature 1: Pipeline Board ✅
- DB: `pipeline_leads` table with `pipeline_stage` enum, RLS scoped to instructor
- UI: `/instructor/pipeline` with drag-and-drop Kanban board, lead cards, add/edit sheet
- "Convert to Pupil" button creates pupil record and moves lead to active
- Tile added to home screen

### Feature 2: On-My-Way Texts ✅
- DB: `on_my_way_notifications` table with RLS
- UI: `OnMyWayButton` component integrated into SatNav lesson cards
- Opens native SMS with pre-filled ETA message

### Feature 3: Workflow Automations ✅
- DB: `instructor_automations` table with trigger/action enums, RLS
- UI: `/instructor/automations` with automation list, toggle, delete, builder sheet
- Builder has templates + step-by-step trigger→action flow
- Edge function `process-automations` executes SMS, todos, notes, pipeline moves
- Tile added to home screen

### Feature 4: AI Receptionist ✅
- DB: `ai_receptionist_enabled` column on instructors table
- Edge function `ai-receptionist` uses Lovable AI (gemini-3-flash-preview)
- LiveChatWindow triggers AI auto-response 5s after visitor message if no human reply
- Instructor context (name, rate, areas, car) included in AI prompt
- Messages prefixed with 🤖 emoji for visual distinction

### Feature 5: Smart Buffer Time (Travel-Aware Scheduling) ✅
- DB: 3 new columns on `instructors`: `smart_buffer_enabled`, `smart_buffer_mode`, `smart_buffer_padding_minutes`
- Edge function `check-travel-buffer` calculates drive time between postcodes and checks feasibility
- UI: New `SmartBufferSettings` component in Scheduling settings section
- 3 modes: flat buffer, travel time only, travel time + padding
- Uses TomTom Routing API for accurate drive time calculations

### Feature 6: Recurring Lesson Subscriptions ✅
- DB: `pupil_subscriptions` table with RLS (instructor CRUD, public read for pupil portal)
- Edge function `process-recurring-subscriptions` auto-creates lessons, skips holidays, advances dates
- UI: `/instructor/subscriptions` page with subscription list, pause/resume/cancel
- `AddSubscriptionSheet`: select pupil, day, time, duration, price, payment method
- Tile added to home screen dashboard
- Route added to App.tsx
