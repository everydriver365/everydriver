import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceAssistant, VoiceState } from "@/hooks/useVoiceAssistant";
import { cn } from "@/lib/utils";

interface VoiceAssistantProps {
  instructorId: string | undefined;
}

const stateConfig: Record<VoiceState, { color: string; label: string }> = {
  idle: { color: "bg-primary", label: "Tap to speak" },
  listening: { color: "bg-destructive", label: "Listening…" },
  processing: { color: "bg-amber-500", label: "Thinking…" },
  speaking: { color: "bg-emerald-500", label: "ED is speaking" },
};

export function useVoiceAssistantContext(instructorId: string | undefined) {
  return useVoiceAssistant({ instructorId });
}

/** Header mic button — goes in the top bar */
export function VoiceAssistantHeaderButton({
  state,
  onTap,
}: {
  state: VoiceState;
  onTap: () => void;
}) {
  const isActive = state !== "idle";
  const config = stateConfig[state];

  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.93 }}
      className={cn(
        "relative flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold text-[11px] transition-all duration-300 overflow-hidden",
        isActive
          ? cn(config.color, "text-white shadow-md")
          : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm hover:brightness-110"
      )}
      title="Voice Assistant (ED)"
    >
      {state === "idle" && <Mic className="h-3 w-3 relative z-10" />}
      {state === "listening" && <Mic className="h-3 w-3" />}
      {state === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
      {state === "speaking" && <Volume2 className="h-3 w-3" />}

      <span className="relative z-10">
        {isActive ? config.label : "Ask ED"}
      </span>
    </motion.button>
  );
}

/** Overlay panel — shows transcript and response when active */
export function VoiceAssistantOverlay({
  state,
  transcript,
  responseText,
  onCancel,
}: {
  state: VoiceState;
  transcript: string;
  responseText: string;
  onCancel: () => void;
}) {
  const isActive = state !== "idle";
  const config = stateConfig[state];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-12 left-4 right-4 z-[60] mx-auto max-w-sm"
        >
          <div className="bg-card rounded-none shadow-lg border overflow-hidden">
            {/* Header */}
            <div className={cn("px-3 py-2 flex items-center justify-between", config.color)}>
              <div className="flex items-center gap-1.5">
                {state === "listening" && (
                  <motion.div
                    className="flex gap-0.5"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-white rounded-full"
                        animate={{ height: ["6px", "12px", "6px"] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      />
                    ))}
                  </motion.div>
                )}
                <span className="text-white text-xs font-semibold">{config.label}</span>
              </div>
              <button
                onClick={onCancel}
                className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="px-3 py-2 space-y-1.5 max-h-[50vh] overflow-y-auto">
              {transcript && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">You said</p>
                  <p className="text-[13px] text-foreground">{transcript}</p>
                </div>
              )}
              {responseText && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">ED</p>
                  <p className="text-[13px] text-foreground whitespace-pre-wrap break-words">{responseText}</p>
                </div>
              )}
              {state === "listening" && !transcript && (
                <p className="text-[12px] text-muted-foreground italic">
                  Try: "Tell Sarah I'm on my way"
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Legacy floating button — kept for backward compat but no longer used in layout */
export function VoiceAssistantButton({ instructorId }: VoiceAssistantProps) {
  const { state, transcript, responseText, startListening, stopListening, cancel } =
    useVoiceAssistant({ instructorId });

  const isActive = state !== "idle";
  const config = stateConfig[state];

  return (
    <>
      <motion.div className="fixed bottom-20 right-4 z-50 sm:bottom-6 flex flex-col items-center gap-1" whileTap={{ scale: 0.9 }}>
        {state === "idle" && (
          <span className="text-[10px] font-semibold text-primary bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border">
            Hey ED
          </span>
        )}
        <Button
          onClick={state === "idle" ? startListening : state === "listening" ? stopListening : cancel}
          className={cn("h-14 w-14 rounded-full shadow-lg transition-colors duration-300", config.color, "text-white hover:opacity-90")}
          size="icon"
        >
          {state === "idle" && <Mic className="h-6 w-6" />}
          {state === "listening" && (
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              <Mic className="h-6 w-6" />
            </motion.div>
          )}
          {state === "processing" && <Loader2 className="h-6 w-6 animate-spin" />}
          {state === "speaking" && <Volume2 className="h-6 w-6" />}
        </Button>
      </motion.div>

      <VoiceAssistantOverlay state={state} transcript={transcript} responseText={responseText} onCancel={cancel} />
    </>
  );
}
