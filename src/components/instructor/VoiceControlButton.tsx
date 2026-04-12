import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useVoiceCommands, speak } from "@/hooks/useVoiceCommands";

interface VoiceControlButtonProps {
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  onRunningLate?: () => void;
  onNavigate?: () => void;
  onShowSpeed?: (speedKmh: number) => void;
  onSendLateETA?: () => void;
  isRunningLate?: boolean;
  currentSpeedKmh?: number;
  isSessionActive?: boolean;
  className?: string;
}

export function VoiceControlButton({
  onStartTracking,
  onStopTracking,
  onRunningLate,
  onNavigate,
  onShowSpeed,
  onSendLateETA,
  isRunningLate = false,
  currentSpeedKmh = 0,
  isSessionActive = false,
  className,
}: VoiceControlButtonProps) {
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  const commands = [
    {
      patterns: ["start tracking", "start", "begin tracking", "start recording"],
      action: "Starting tracking",
      callback: () => {
        haptics.success();
        onStartTracking?.();
      },
    },
    {
      patterns: ["stop tracking", "stop", "end tracking", "finish recording"],
      action: "Stopping tracking",
      callback: () => {
        haptics.success();
        onStopTracking?.();
      },
    },
    {
      patterns: ["running late", "I'm late", "going to be late", "delay"],
      action: "Opening late message",
      callback: () => {
        haptics.medium();
        onRunningLate?.();
      },
    },
    {
      patterns: ["navigate", "directions", "open maps", "get directions"],
      action: "Opening navigation",
      callback: () => {
        haptics.medium();
        onNavigate?.();
      },
    },
    {
      patterns: ["show speed", "what's my speed", "current speed", "how fast"],
      action: `Speed: ${Math.round(currentSpeedKmh * 0.621371)} mph`,
      callback: () => {
        const mph = Math.round(currentSpeedKmh * 0.621371);
        speak(`Current speed: ${mph} miles per hour`);
        onShowSpeed?.(currentSpeedKmh);
      },
    },
    {
      patterns: ["send eta", "send late message", "tell them I'm late", "send late eta"],
      action: isRunningLate ? "Sending late ETA message" : "Not currently running late",
      callback: () => {
        if (isRunningLate && onSendLateETA) {
          haptics.success();
          onSendLateETA();
          speak("Late message sent");
        } else {
          speak("You're not currently running late");
        }
      },
    },
  ];

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
  } = useVoiceCommands({
    commands,
    enabled: true,
    onCommandRecognized: (command) => {
      setShowFeedback(command);
      setTimeout(() => setShowFeedback(null), 2000);
    },
    onListeningChange: (listening) => {
      if (listening) {
        haptics.light();
      }
    },
  });

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Feedback Popup */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
              whitespace-nowrap px-3 py-1.5 bg-foreground text-background 
              text-xs rounded-2xl shadow-lg flex items-center gap-1.5"
          >
            <Volume2 className="h-3 w-3" />
            {showFeedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Display */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
              whitespace-nowrap px-3 py-1.5 bg-muted text-muted-foreground 
              text-xs rounded-2xl shadow-sm max-w-48 truncate"
          >
            "{transcript}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Button */}
      <Button
        onClick={handlePress}
        variant={isListening ? "default" : "outline"}
        size="icon"
        className={cn(
          "relative h-12 w-12 rounded-full transition-all",
          isListening && "bg-primary shadow-lg"
        )}
      >
        {/* Pulsing ring when listening */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {isListening ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      {/* Listening indicator text */}
      {isListening && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full mt-1 left-1/2 -translate-x-1/2 
            text-[10px] text-primary font-medium whitespace-nowrap"
        >
          Listening...
        </motion.p>
      )}
    </div>
  );
}
