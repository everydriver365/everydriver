

## Plan: Add Pipeline Board, On-My-Way Texts, Workflow Automations & AI Receptionist

Four features to build, in order of complexity.

---

### Feature 1: Pipeline Board (Kanban for Leads)

**Database:**
- New enum `pipeline_stage`: `new_lead`, `contacted`, `quoted`, `booked`, `active`, `test_passed`, `lost`
- New table `pipeline_leads` with: `id`, `instructor_id` (FK to instructors), `name`, `phone`, `email`, `postcode`, `course_type`, `notes`, `stage` (pipeline_stage), `created_at`, `updated_at`
- RLS: instructor can CRUD own leads only

**New files:**
- `src/pages/InstructorPipeline.tsx` — page wrapper with `InstructorPortalLayout`
- `src/components/instructor/pipeline/KanbanBoard.tsx` — columns per stage, native HTML drag-and-drop
- `src/components/instructor/pipeline/LeadCard.tsx` — card showing name, postcode, course type, days since update, call/SMS buttons
- `src/components/instructor/pipeline/AddLeadSheet.tsx` — sheet form to add/edit a lead
- "Convert to Pupil" button on cards in appropriate stages — inserts into `pupils` table and moves to `active`

**Route:** Add `/instructor/pipeline` to App.tsx. Add tile `{ id: "pipeline", title: "Pipeline", icon: "Briefcase", route: "/instructor/pipeline" }` to `additionalTiles` in all 3 files (AppStyleHomeView, QuickActionTiles, DashboardLayoutManager).

---

### Feature 2: On-My-Way Texts

**Database:**
- New table `on_my_way_notifications`: `id`, `instructor_id`, `pupil_id`, `lesson_id`, `eta_minutes`, `sent_at` (default now())
- RLS: instructor can insert/select own

**New files:**
- `src/components/instructor/OnMyWayButton.tsx` — reusable button component. Takes pupil name, phone, ETA minutes. On tap: logs to `on_my_way_notifications`, opens native SMS via `sms:` URI with pre-filled message "Hi {name}, I'm on my way! ETA: {time}. See you soon!"

**Updates:**
- `InstructorSatNav.tsx` — add `OnMyWayButton` next to each upcoming lesson card (using existing lesson data which already has pupil name and pickup info)
- Leverage pattern from existing `useRunningLateDetection` hook for ETA text formatting

---

### Feature 3: Workflow Automations (IFTTT)

**Database:**
- New enum `automation_trigger`: `lesson_completed`, `cancellation`, `no_show`, `test_passed`, `payment_overdue`, `new_enquiry`
- New enum `automation_action`: `send_sms`, `send_email`, `add_note`, `move_pipeline`, `create_todo`
- New table `instructor_automations`: `id`, `instructor_id`, `name`, `trigger_type` (automation_trigger), `action_type` (automation_action), `action_config` (jsonb), `is_active` (default true), `created_at`, `updated_at`
- RLS: instructor can CRUD own

**New files:**
- `src/pages/InstructorAutomations.tsx` — list of automations with toggle on/off, "Add Automation" button
- `src/components/instructor/automations/AutomationCard.tsx` — displays trigger → action with active toggle
- `src/components/instructor/automations/AutomationBuilder.tsx` — step-by-step sheet: pick trigger → pick action → configure (message template with `{pupil_name}`, `{date}` placeholders)
- Pre-built templates: "Review request after test pass", "No-show flag", "24h reminder"

**Edge function:** `supabase/functions/process-automations/index.ts`
- Accepts trigger event type + context (instructor_id, pupil_id, etc.)
- Queries active automations for that instructor + trigger type
- Executes actions (SMS via Twilio using existing secrets, create todo in `instructor_todos`, add note)
- Called from other edge functions or via scheduled cron

**Route:** Add `/instructor/automations` to App.tsx. Add tile to `additionalTiles`.

---

### Feature 4: AI Receptionist Chatbot

The mini-website already has a `LiveChatWidget` integrated into `MiniWebsiteLayout`. The AI receptionist will enhance this by auto-responding to visitor messages when the instructor is offline.

**Database:**
- Add column `ai_receptionist_enabled` (boolean, default false) to `instructors` table
- The existing `live_chat_sessions` and `live_chat_messages` tables will be reused

**Edge function:** `supabase/functions/ai-receptionist/index.ts`
- Receives: `session_id`, `message`, `instructor_id`
- Fetches instructor profile (name, phone, areas, pricing, car type, availability) for context
- Calls Lovable AI (`google/gemini-3-flash-preview`) with system prompt: "You are a friendly receptionist for {instructor_name}'s driving school. Answer questions about pricing, availability, areas covered. If they want to book, provide the instructor's contact details."
- Inserts AI response as a `live_chat_messages` record with sender_type `'system'` or `'admin'`
- Handles 429/402 errors gracefully

**Updates:**
- `LiveChatWidget.tsx` or `LiveChatWindow.tsx` — after visitor sends a message, if no human has replied within ~30 seconds, call the `ai-receptionist` edge function to auto-respond
- Instructor settings page — toggle to enable/disable AI receptionist
- Existing `VisitorChatManager` already shows these chats, so instructors can review AI conversations

**Route:** No new route. Settings toggle added to existing instructor settings.

---

### Summary

| Feature | DB Changes | New Pages | Edge Functions | Key Files |
|---|---|---|---|---|
| Pipeline Board | 1 enum + 1 table | 1 | 0 | 4 components |
| On-My-Way | 1 table | 0 | 0 | 1 component + 1 update |
| Automations | 2 enums + 1 table | 1 | 1 | 3 components |
| AI Receptionist | 1 column | 0 | 1 | 2 updates |

All pages use `InstructorPortalLayout`. All tiles added to the 3 `additionalTiles` arrays. All tables have RLS scoped to instructor ownership.

