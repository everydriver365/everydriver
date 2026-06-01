## Problem

The **Dictate** button in the End-of-Lesson → Summary step uses the browser's `webkitSpeechRecognition` API (`useVoiceToText`). That API:

- is **not supported in iOS WKWebView / the Capacitor wrapper** used for the instructor mobile app — so taps do nothing, or the button is hidden entirely
- silently fails on permission denials with no toast
- on the second issue, `useEffect` overwrites whatever the instructor already typed in the notes box with the latest transcript

Net result: dictation appears broken on the device the user is actually testing on.

## Fix

Swap the unreliable browser API for **ElevenLabs Scribe** (already documented as the supported STT path in this project). Record audio in the browser/webview with `MediaRecorder`, POST the blob to a new edge function, return the transcript.

### 1. New edge function `transcribe-audio`

- Accepts `multipart/form-data` with an `audio` file
- Verifies the caller's JWT (instructor must be signed in)
- Calls `https://api.elevenlabs.io/v1/speech-to-text` with `model_id=scribe_v2`, `language_code=eng`, `diarize=false`, `tag_audio_events=false`
- Returns `{ text }`
- Requires `ELEVENLABS_API_KEY` secret — will prompt the user to add it if missing
- `verify_jwt = true` (default), CORS headers set

### 2. New hook `useDictation`

- `start()` → request mic, start `MediaRecorder` (webm/opus, falls back to mp4 on iOS)
- `stop()` → finalise blob, POST to `transcribe-audio`, resolve with `text`
- Exposes `{ isRecording, isTranscribing, start, stop, toggle, isSupported }`
- `isSupported = !!navigator.mediaDevices?.getUserMedia` (true on iOS WKWebView)
- Surfaces errors via `sonner` toast (permission denied, network, API error)

### 3. `StepSummary.tsx`

- Replace `useVoiceToText` with `useDictation`
- On `toggle`: if recording, stop and **append** the returned transcript to existing notes (`onNotesChange((notes ? notes.trim() + " " : "") + text)`) instead of overwriting
- Button states: `Dictate` → `Listening… (tap to stop)` → spinner `Transcribing…`
- Remove the `useEffect` that overwrote notes

### 4. Capacitor mic permission

- iOS `Info.plist` already needs `NSMicrophoneUsageDescription`. If missing, add it via the existing native config so the OS prompt fires the first time.

## Out of scope

- No change to `useVoiceToText` consumers elsewhere (kept for backwards compat).
- No DB / RLS changes.
- No change to the EOL payment flow shipped earlier.

## Files touched

- `supabase/functions/transcribe-audio/index.ts` (new)
- `supabase/config.toml` (register function, default `verify_jwt = true` — no block needed)
- `src/hooks/useDictation.ts` (new)
- `src/components/instructor/end-lesson/StepSummary.tsx` (swap hook, append-not-replace)
- `ios/App/App/Info.plist` if `NSMicrophoneUsageDescription` missing

## Prerequisite

You'll be prompted to paste an **ElevenLabs API key** before the edge function will work. Want me to proceed on that basis?
