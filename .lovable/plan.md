

## Issues Found

Inspecting the edge function reveals two remaining problems in the system prompt that weren't fully cleaned up:

1. **Line 175** — Garbled text: `"The plaLearners can view and book directly from the chatpayments"` (corrupted from a previous edit)
2. **Line 177** — `"The website URL for courses is /courses"` was supposed to be removed but is still present, which means the AI can still reference `/courses`

## Plan

**Edit: `supabase/functions/ai-admin-receptionist/index.ts` (lines 175-177)**

Replace these 3 lines:
```
- The plaLearners can view and book directly from the chatpayments
- Learners can read reviews and compare instructors
- The website URL for courses is /courses
```

With:
```
- Learners can view instructor details, read reviews, and book directly from the chat
- Learners can compare instructors by price, distance, and transmission type
```

This removes the `/courses` URL entirely and fixes the corrupted line, so the AI will only present results inline via the instructor cards.

