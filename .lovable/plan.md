

## Add "Hey ED" Label to Mobile Floating Button

The "Hey ED" label was added to the legacy `VoiceAssistantButton` component, but the actual mobile layout uses a custom floating button defined directly in `InstructorPortalLayout.tsx` (line 630-654).

### Fix

**File: `src/components/layout/InstructorPortalLayout.tsx`** (~line 630)

Wrap the existing floating button in a flex-col container and add the "Hey ED" label above it when idle:

```tsx
{/* Floating Ask ED button */}
<div className="fixed bottom-[88px] right-4 z-40 flex flex-col items-center gap-1">
  {voiceAssistant.state === "idle" && (
    <span className="text-[10px] font-semibold text-primary bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border">
      Hey ED
    </span>
  )}
  <motion.button
    onClick={handleVoiceTap}
    whileTap={{ scale: 0.9 }}
    className={cn(
      "h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-colors duration-300",
      // ... existing color logic
    )}
    title="Ask ED"
  >
    {/* ... existing icon logic */}
  </motion.button>
</div>
```

The `fixed` positioning moves from the `motion.button` to the wrapper `div`. Single-file change.

