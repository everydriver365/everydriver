

## Fix ED Voice Assistant: Speak Responses + Auto-Listen

### Problems Identified

1. **General questions get no real answer**: ED can only handle structured commands (send message, check schedule, etc). When you ask a general question like "What areas do I cover?" or "What car do I drive?", the intent parser maps it to `unknown` and returns a canned "I didn't understand" message instead of answering intelligently.

2. **No auto-listen after response**: After ED finishes speaking, state goes to `idle`. You have to tap the mic button again for each follow-up. There's no continuous conversation mode.

### Plan

#### 1. Add a `general_query` action to voice-parse-intent

**File: `supabase/functions/voice-parse-intent/index.ts`**

- Add a new action `general_query` with parameter `original_text` for questions that don't match a specific command (e.g. "What areas do I cover?", "What car do you drive?", "Do you do automatic lessons?").
- This prevents general questions from falling into `unknown`.

#### 2. Handle `general_query` in voice-execute with AI

**File: `supabase/functions/voice-execute/index.ts`**

- Add a `case "general_query"` that fetches the instructor's profile data (name, phone, hourly_rate, areas_covered, transmission_type, car_make, car_model, etc.)
- Sends the question + instructor context to Lovable AI (Gemini) to generate a natural spoken answer
- Returns the AI response as `responseText`

#### 3. Auto-listen after ED finishes speaking

**File: `src/hooks/useVoiceAssistant.ts`**

- After TTS playback ends (`audio.onended` / `utterance.onend`), instead of going to `idle`, automatically call `startListening()` to begin a new recognition session.
- Add a `conversationMode` ref that stays `true` while the user is actively interacting. Set to `false` after ~10 seconds of silence (recognition `onend` with no result).
- The cancel/stop buttons will still immediately end the conversation.

### Technical Details

**voice-parse-intent** — add to the system prompt:
```
31. general_query - Answer a general question about the instructor's business
    Parameters: original_text (string)
    Examples: "What areas do you cover?", "Do you do automatic?", "What car do you teach in?"
```

**voice-execute** — new case:
```typescript
case "general_query": {
  // Fetch instructor profile
  const { data: instructor } = await supabase
    .from("instructors")
    .select("name, phone, hourly_rate, areas_covered, transmission_type, car_make, car_model, ...")
    .eq("id", instructor_id)
    .single();

  // Call Lovable AI with instructor context + question
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { ... });
  responseText = aiResponse answer;
  break;
}
```

**useVoiceAssistant.ts** — auto-listen loop:
```typescript
// In speak(), change onended callback:
audio.onended = () => {
  URL.revokeObjectURL(audioUrl);
  // Auto-listen for next command instead of going idle
  startListening();
};

// In recognition.onend, if no result was captured, go idle after timeout
```

