import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceAssistant, VoiceState } from "@/hooks/useVoiceAssistant";
import { cn } from "@/lib/utils";

interface VoiceAssistantButtonProps {
  instructorId: string | undefined;
}

const stateConfig: Record<VoiceState, { color: string; label: string }> = {
  idle: { color: "bg-primary", label: "Tap to speak" },
  listening: { color: "bg-destructive", label: "Listening…" },
  processing: { color: "bg-amber-500", label: "Thinking…" },
  speaking: { color: "bg-emerald-500", label: "ED is speaking" },
};

export function VoiceAssistantButton({ instructorId }: VoiceAssistantButtonProps) {
  const { state, transcript, responseText, startListening, stopListening, cancel } =
    useVoiceAssistant({ instructorId });

  const isActive = state !== "idle";
  const config = stateConfig[state];

  return (
    <>
      {/* Floating Mic Button */}
      <motion.div
        className="fixed bottom-20 right-4 z-50 sm:bottom-6"
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={state === "idle" ? startListening : state === "listening" ? stopListening : cancel}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-colors duration-300",
            config.color,
            "text-white hover:opacity-90"
          )}
          size="icon"
        >
          {state === "idle" && <Mic className="h-6 w-6" />}
          {state === "listening" && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Mic className="h-6 w-6" />
            </motion.div>
          )}
          {state === "processing" && <Loader2 className="h-6 w-6 animate-spin" />}
          {state === "speaking" && <Volume2 className="h-6 w-6" />}
        </Button>
      </motion.div>

      {/* Active Overlay Panel */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-36 right-4 z-50 sm:bottom-22 w-72 max-w-[calc(100vw-2rem)]"
          >
            <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden">
              {/* Header */}
              <div className={cn("px-4 py-3 flex items-center justify-between", config.color)}>
                <div className="flex items-center gap-2">
                  {state === "listening" && (
                    <motion.div
                      className="flex gap-0.5"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-white rounded-full"
                          animate={{ height: ["8px", "16px", "8px"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                  <span className="text-white text-sm font-semibold">{config.label}</span>
                </div>
                <button
                  onClick={cancel}
                  className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="px-4 py-3 space-y-2">
                {transcript && (
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">You said</p>
                    <p className="text-sm text-foreground">{transcript}</p>
                  </div>
                )}
                {responseText && (
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">ED</p>
                    <p className="text-sm text-foreground">{responseText}</p>
                  </div>
                )}
                {state === "listening" && !transcript && (
                  <p className="text-sm text-muted-foreground italic">
                    Try: "Tell Sarah I'm on my way"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
