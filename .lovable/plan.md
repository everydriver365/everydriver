

## Change TTS Voice to British Female (Alice)

### What
Swap the ElevenLabs voice from **Roger** (British male) to **Alice** (British female) in the `voice-tts` edge function.

### Change
**File: `supabase/functions/voice-tts/index.ts`** — line 19

Change voice ID from `CwhRBWXzGAHq8TQ4Fs17` (Roger) to `Xb7hH8MSUJpSbSDYk0k2` (Alice).

Single line change, no other modifications needed. The voice settings (stability, similarity_boost, style, speed) work well across voices.

