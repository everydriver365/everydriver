

## Plan: Add Quick-Reply Suggestion Chips to Live Chat

### Overview
Add a multi-step guided quick-reply system to the visitor chat. Clickable chip buttons appear above the input area, walking the visitor through key preferences. Each click sends the selection as a chat message (triggering the AI receptionist), then advances to the next set of options.

### Suggestion Flow (sequential steps)
1. **Lesson type** — "Standard Lessons", "Intensive Course", "Test Prep", "Refresher"
2. **Transmission** — "Manual", "Automatic", "No Preference"
3. **Instructor preference** — "Male", "Female", "No Preference"
4. **Start date** — "ASAP", "This Week", "Next Week", "Next Month"
5. **Postcode prompt** — "Enter your postcode below to find instructors near you"

Each step only shows after the previous one is clicked. Once all steps are completed (or visitor types freely), chips hide permanently for that session.

### Technical Changes

**New component: `src/components/live-chat/QuickReplySuggestions.tsx`**
- Renders the current step's chip buttons as horizontally-wrapping pill buttons
- Props: `currentStep`, `onSelect(text)`, `disabled`
- Steps defined as a constant array of `{ label, options[] }`
- Animated with framer-motion for smooth transitions

**Edit: `src/components/live-chat/LiveChatWindow.tsx`**
- Add `quickReplyStep` state (0–4), starting at 0 for visitors with no messages yet
- On chip click: call `sendMessage()` with the selected text, increment step
- If visitor types a free-text message, skip/hide suggestions (set step to `done`)
- Render `<QuickReplySuggestions>` between the messages area and the input area, only for `userType === "visitor"` and only when step < total steps
- Suggestions only show at the start of a new conversation (messages.length <= 1 from visitor)

### UI Design
- Small rounded pill buttons in a flex-wrap row
- Styled with `variant="outline"` and subtle colours matching `LessonTypeBadge` patterns
- Each group has a small label above (e.g. "What type of lessons?")
- Smooth fade-in/out between steps

