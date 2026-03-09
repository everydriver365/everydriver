

## Plan: Show Instructor Course Cards in Chat

### Problem
When the AI receptionist finds nearby instructors after a postcode search, it just tells the user to "visit the courses page." Instead, we should render clickable instructor/course cards directly in the chat.

### Approach
Use a structured data format embedded in the AI's chat message that the frontend can detect and render as cards. The AI receptionist will append a JSON block to its message containing instructor data, and the chat message renderer will parse it and display rich cards with direct booking links.

### Technical Changes

**1. Edge function: `supabase/functions/ai-admin-receptionist/index.ts`**
- When instructor search results are found, also fetch each instructor's `app_slug` and `id` from the database
- After the AI generates its text reply, append a hidden JSON block to the stored message: `<!--CARDS:[ { name, slug, hourlyRate, distance, profileImage, transmission } ]-->`
- This lets the frontend detect and render cards while keeping the raw message readable as fallback

**2. New component: `src/components/live-chat/InstructorChatCards.tsx`**
- Renders a horizontal-scrollable row of small instructor cards
- Each card shows: profile image, name, distance, hourly rate, transmission
- "View Courses" button links to `/i/{slug}/courses`
- Compact card design matching chat bubble aesthetics

**3. Edit: `src/components/live-chat/LiveChatWindow.tsx`**
- In the message rendering section, parse message content for `<!--CARDS:...-->` pattern
- If found, render the text portion normally and append `<InstructorChatCards>` below it
- Only applies to admin/AI messages (not visitor messages)

### Card Design
- Small rounded cards (~160px wide) in a horizontally scrollable row
- Avatar/image, instructor name, distance badge, rate, and a CTA button
- Links go to `/i/{slug}/courses` for direct booking

### Data Flow
```text
Postcode entered → AI receptionist finds instructors (with slug) 
→ AI text reply + hidden JSON in message → stored in DB
→ Frontend parses message → renders text + card row
```

