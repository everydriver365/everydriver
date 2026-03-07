

## Three Features: Pupil Milestone Feed, Broadcast Templates, Read Receipts

### 1. Pupil Milestone Feed (Instructor Home)

A new card on the instructor mobile home showing recent pupil achievements — first lesson, test booked, test passed, lesson milestones, etc.

**Database**: New table `pupil_milestones` to track instructor-visible milestones:
- `id`, `pupil_id` (FK pupils), `instructor_id` (FK instructors), `milestone_type` (enum: first_lesson, 10_lessons, 25_lessons, 50_lessons, test_booked, test_passed, perfect_manoeuvre), `title`, `description`, `icon_name`, `created_at`
- RLS: instructors can read their own pupils' milestones
- Trigger on `scheduled_lessons` insert to auto-create lesson-count milestones
- Trigger on `pupils` when `test_date` or `test_result` changes

**New component**: `src/components/instructor/PupilMilestoneFeed.tsx`
- Horizontal scrollable cards showing recent milestones with pupil avatar, milestone icon, and timestamp
- Celebration animation (confetti) when tapping a new milestone
- "View all" link

**Integration**: Add to `InstructorMobileHome.tsx` below the today's lessons section.

---

### 2. Broadcast Message Templates

Enhance the existing `BroadcastMessageSheet.tsx` with pre-built templates that instructors can select, customise, and save their own.

**Database**: New table `broadcast_templates`:
- `id`, `instructor_id` (nullable — null = system template), `title`, `body`, `category` (e.g. reminder, promotion, holiday, general), `is_system` (boolean), `created_at`
- RLS: instructors can read system templates + their own; can insert/update/delete their own

**Seed data**: System templates — Lesson Reminder, Holiday Notice, Price Change, Weather Warning, Test Prep Reminder, Welcome Message.

**Changes to `BroadcastMessageSheet.tsx`**:
- Add a "Templates" tab/section above the message textarea
- Clicking a template populates the textarea (editable)
- "Save as Template" button to save custom templates
- Delete option on custom templates

---

### 3. Read Receipts for Messages

The `messages` table already has `read_at`. The UI already shows double-check icons. This feature adds **delivery confirmation** and **precise read timestamps**.

**Database migration**:
- Add `delivered_at TIMESTAMPTZ` column to `messages` table
- The `read_at` column already exists

**Changes to `ChatWindow.tsx`**:
- Show delivery status: single grey tick (sent), double grey tick (delivered), double blue tick (read)
- On hover/tap, show exact timestamp: "Delivered 14:32 · Read 14:35"
- Mark messages as delivered when the pupil's chat loads (before they scroll to them)

**Changes to `useMessaging.ts`**:
- When fetching messages, mark opponent's messages as `delivered_at = now()` if null (separate from `read_at` which is set when scrolled into view)

**Changes to `PupilChat.tsx`**:
- Same delivery/read indicators for pupil-side view
- Mark instructor messages as delivered on load, read when viewed

---

### Files to Create
- `src/components/instructor/PupilMilestoneFeed.tsx`
- DB migration for `pupil_milestones`, `broadcast_templates` tables, and `delivered_at` column

### Files to Modify
- `src/components/instructor/InstructorMobileHome.tsx` — add milestone feed
- `src/components/instructor/BroadcastMessageSheet.tsx` — add templates UI
- `src/components/instructor/ChatWindow.tsx` — enhanced read receipt indicators
- `src/components/pupil-portal/PupilChat.tsx` — delivery/read indicators
- `src/hooks/useMessaging.ts` — delivered_at logic

