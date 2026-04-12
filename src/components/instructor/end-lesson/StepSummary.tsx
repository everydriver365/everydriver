import { useState, useEffect } from "react";
import { Clock, Route, PoundSterling, Mic, MicOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";

interface StepSummaryProps {
  pupilName: string;
  durationMinutes: number;
  balanceBefore: number;
  lessonCost: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onVoiceNoteRecorded?: (blob: Blob) => void;
}

export function StepSummary({
  pupilName,
  durationMinutes,
  balanceBefore,
  lessonCost,
  notes,
  onNotesChange,
  onVoiceNoteRecorded,
}: StepSummaryProps) {
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceToText();
  const [mode, setMode] = useState<"voice" | "text">("text");

  // Sync transcript into notes
  useEffect(() => {
    if (transcript) {
      onNotesChange(transcript);
    }
  }, [transcript]);

  const balanceAfter = balanceBefore - lessonCost;
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationLabel = hours > 0 && mins > 0 ? `${hours}h ${mins}m` : hours > 0 ? `${hours}h` : `${mins}m`;

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50">
          <Clock className="h-4 w-4 text-muted-foreground mb-1" />
          <span className="text-base font-bold text-foreground">{durationLabel}</span>
          <span className="text-[10px] text-muted-foreground">Duration</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50">
          <Route className="h-4 w-4 text-muted-foreground mb-1" />
          <span className="text-base font-bold text-foreground">—</span>
          <span className="text-[10px] text-muted-foreground">Miles</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/50">
          <PoundSterling className="h-4 w-4 text-muted-foreground mb-1" />
          <span className={`text-base font-bold ${balanceAfter < 0 ? "text-destructive" : "text-success"}`}>
            £{Math.abs(Math.round(balanceAfter))}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {balanceAfter < 0 ? "Due" : "Credit"}
          </span>
        </div>
      </div>

      {/* Voice / Text toggle */}
      <div className="flex gap-2">
        {isSupported && (
          <Button
            variant={mode === "voice" ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setMode("voice");
              if (!isListening) startListening();
            }}
          >
            <Mic className="h-3.5 w-3.5" />
            Dictate
          </Button>
        )}
        <Button
          variant={mode === "text" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setMode("text");
            if (isListening) stopListening();
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          Type
        </Button>
      </div>

      {/* Recording indicator */}
      {mode === "voice" && isListening && (
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-destructive/10 border border-destructive/20">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-destructive font-medium">Listening…</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={stopListening}>
            <MicOff className="h-3 w-3 mr-1" /> Stop
          </Button>
        </div>
      )}

      {/* Notes textarea */}
      <Textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="How did the lesson go? Add notes here…"
        rows={3}
        className="text-sm"
      />

      {/* Voice note recorder */}
      {onVoiceNoteRecorded && (
        <div className="pt-1">
          <p className="text-xs text-muted-foreground mb-2">Or record a voice note to attach:</p>
          <VoiceNoteRecorder onRecorded={onVoiceNoteRecorded} />
        </div>
      )}
    </div>
  );
}
