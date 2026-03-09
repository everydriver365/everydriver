

## Plan: Update AI Prompt to Show Cards Instead of Course Page Links

### Problem
When a visitor enters a postcode, the AI tells them to "visit the courses page" — but we already have instructor cards rendering inline. The AI prompt just needs to stop directing users away and instead present the results naturally, since the cards will appear automatically below the message.

### Technical Changes

**Edit: `supabase/functions/ai-admin-receptionist/index.ts`**

Update the system prompt instructions in 3 places:

1. **Line 147** (instructors found context) — Change from "Suggest they visit the courses page to book" to "Present the instructors warmly. The visitor will see clickable instructor cards below your message — do NOT tell them to visit another page or provide links. Just summarise who's available nearby."

2. **Line 149** (no instructors found context) — Change from "Suggest they browse the courses page" to "Let them know we don't have instructors nearby yet and suggest trying a different postcode."

3. **Lines 185-187** (general guidelines) — Remove "encourage booking via the courses page" and add: "When presenting instructor search results, do NOT include links to /courses or tell the user to visit another page. Clickable instructor cards will appear automatically below your message. Just summarise the results naturally."

4. **Line 177** — Remove `- The website URL for courses is /courses`

### Result
The AI will describe the nearby instructors conversationally, and the existing `<!--CARDS:...-->` mechanism will render the interactive cards directly in chat — no more "visit the courses page" messaging.

