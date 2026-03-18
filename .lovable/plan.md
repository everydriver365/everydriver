

## Plan: AI Command Center + AI Workflow Builder

### Feature 1: AI Command Center
A floating action button on the instructor dashboard that opens a chat/command interface. Instructors type or speak natural language commands like "Book Sarah for Thursday 2pm", "Show this week's earnings", "Cancel tomorrow's 10am". An edge function parses intent using Lovable AI (gemini-3-flash-preview) and returns structured actions.

### Feature 2: AI Workflow Builder
Enhance the existing automations system with a visual workflow builder that supports **conditions** (e.g., "if balance > £50"), **delays** (e.g., "wait 24 hours"), and **chained actions**. This extends the current `instructor_automations` table with a new `automation_workflows` table for multi-step rules.

---

### Technical Implementation

**Database Changes (1 migration):**
- New table `automation_workflows` — stores multi-step workflow definitions with `instructor_id`, `name`, `trigger_type`, `steps` (JSONB array of condition/delay/action steps), `is_active`
- New table `ai_command_logs` — stores command history per instructor for context (`instructor_id`, `command_text`, `parsed_intent`, `result`, `created_at`)
- RLS policies scoped to instructor via `get_instructor_id_for_user(auth.uid())`

**Edge Functions (2 new):**
1. `ai-command-center` — Receives natural language text, sends to Lovable AI with a system prompt containing the app's data schema and available actions, uses tool-calling to extract structured intents (book_lesson, cancel_lesson, show_earnings, etc.), executes the action via Supabase service role, returns result
2. `process-workflows` — Evaluates multi-step workflow rules, checking conditions and executing action chains (extends existing `process-automations`)

**Frontend Components:**
1. `AICommandCenter.tsx` — Floating button + slide-up chat panel with text input and mic button (Web Speech API for voice). Streams responses from the edge function. Shows command history.
2. `WorkflowBuilder.tsx` — Visual step-by-step builder: select trigger → add conditions (dropdown-based, e.g., "pupil balance > X") → add delays → add actions. Each step rendered as a card in a vertical flow. Stores as JSONB steps array.
3. `InstructorAICommand.tsx` + `InstructorWorkflows.tsx` — Page wrappers with auth guards

**Routing:**
- `/instructor/ai-command` and `/instructor/workflows` added to App.tsx
- Both added to `discoverFeaturesData.ts`
- AI Command Center also accessible via floating button on the main dashboard

**Config:**
- Add `[functions.ai-command-center]` and `[functions.process-workflows]` with `verify_jwt = false` to config.toml
- Uses existing `LOVABLE_API_KEY` secret for Lovable AI

