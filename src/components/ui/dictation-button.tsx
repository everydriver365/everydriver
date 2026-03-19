import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface DictationButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  lang?: string;
}

export function DictationButton({ onTranscript, disabled, className, lang }: DictationButtonProps) {
  const { isListening, isSupported, toggle } = useSpeechToText({
    lang,
    continuous: true,
    onResult: (text) => {
      onTranscript(text);
    },
  });

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={isListening ? "Stop dictation" : "Start dictation"}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1.5 transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        isListening && "text-destructive animate-pulse bg-destructive/10",
        className
      )}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
