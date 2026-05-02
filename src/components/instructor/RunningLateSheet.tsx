import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Clock, Car, AlertTriangle, Check, X, Loader2, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";
import { useSendViaWhatsApp } from "@/hooks/useSendViaWhatsApp";
import { format, addMinutes } from "date-fns";

interface RunningLateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilName: string;
  pupilPhone: string | null;
  startTime: string;
  /** Optional ETA in minutes from now to enable "Send ETA" preset */
  etaMinutes?: number;
  /** Optional callback fired after a running-late message is successfully sent */
  onMarkRunningLate?: () => void;
}

type SendState = "idle" | "sending" | "sent" | "error";

export function RunningLateSheet({
  open,
  onOpenChange,
  pupilName,
  pupilPhone,
  startTime,
  etaMinutes,
  onMarkRunningLate,
}: RunningLateSheetProps) {
  const firstName = (pupilName || "").split(" ")[0] || "there";

  const presets = useMemo(() => {
    const base = [
      {
        id: "5",
        icon: Clock,
        label: "Running 5 mins late",
        message: `Hi ${firstName}, I'm running about 5 minutes late. See you shortly.`,
      },
      {
        id: "10",
        icon: Clock,
        label: "Running 10 mins late",
        message: `Hi ${firstName}, I'm running about 10 minutes late. I'll be with you as soon as possible.`,
      },
      {
        id: "traffic",
        icon: Car,
        label: "Stuck in traffic",
        message: `Hi ${firstName}, I'm stuck in traffic and may be a little late. I'll keep you updated.`,
      },
      {
        id: "update",
        icon: AlertTriangle,
        label: "Will update you",
        message: `Hi ${firstName}, I'm running late. I'll update you shortly with a more accurate arrival time.`,
      },
    ];
    if (etaMinutes && etaMinutes > 0) {
      const etaTime = format(addMinutes(new Date(), etaMinutes), "HH:mm");
      base.push({
        id: "eta",
        icon: Navigation,
        label: "Send ETA",
        message: `Hi ${firstName}, I'm on my way. My estimated arrival time is ${etaTime}.`,
      });
    }
    return base;
  }, [firstName, etaMinutes]);

  const defaultCustom = `Hi ${firstName}, I'm running late… `;
  const [customMessage, setCustomMessage] = useState(defaultCustom);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { sendMessage, sending } = useSendViaWhatsApp();

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setCustomMessage(defaultCustom);
      setActiveId(null);
      setSendState("idle");
      setErrorMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sendNow = useCallback(
    async (id: string, message: string) => {
      if (!pupilPhone) {
        setErrorMsg("No phone number available for this pupil");
        setSendState("error");
        return;
      }
      setActiveId(id);
      setSendState("sending");
      setErrorMsg(null);
      haptics.medium();

      const result = await sendMessage(pupilPhone, message);

      if (result.success) {
        setSendState("sent");
        haptics.light();
        try {
          onMarkRunningLate?.();
        } catch (e) {
          console.error("onMarkRunningLate failed:", e);
        }
        setTimeout(() => {
          setSendState("idle");
          setActiveId(null);
          onOpenChange(false);
        }, 1200);
      } else {
        // Fallback to native SMS so the user can still send something
        const a = document.createElement("a");
        a.href = `sms:${pupilPhone}?body=${encodeURIComponent(message)}`;
        a.click();
        setSendState("error");
        setErrorMsg("Couldn't send message. Try again.");
      }
    },
    [pupilPhone, sendMessage, onOpenChange, onMarkRunningLate]
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      haptics.medium();

      timerRef.current = setInterval(() => {
        setRecordingTime((p) => p + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setErrorMsg("Microphone access denied");
      setSendState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      haptics.light();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(0);
  }, []);

  const sendVoiceNote = useCallback(async () => {
    if (!audioBlob || !pupilPhone) return;
    haptics.medium();
    const file = new File([audioBlob], "voice-note.webm", { type: "audio/webm" });

    try {
      if (
        typeof navigator !== "undefined" &&
        (navigator as any).share &&
        (navigator as any).canShare?.({ files: [file] })
      ) {
        await (navigator as any).share({
          files: [file],
          title: "Voice Note",
          text: `Hi ${firstName}, I'm running late — here's a quick voice message:`,
        });
        try {
          onMarkRunningLate?.();
        } catch (e) {
          console.error(e);
        }
        setAudioBlob(null);
        onOpenChange(false);
        return;
      }
    } catch (e) {
      console.error("Share failed:", e);
    }

    // Fallback: download + SMS text
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voice-note.webm";
    a.click();
    URL.revokeObjectURL(url);
    await sendNow("voice-fallback", `Hi ${firstName}, I'm running late. I just recorded a voice note for you.`);
  }, [audioBlob, pupilPhone, firstName, onOpenChange, sendNow, onMarkRunningLate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isBusy = sending || sendState === "sending";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">Running Late?</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Quick Messages */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Quick Messages</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((msg) => {
                const isActive = activeId === msg.id;
                return (
                  <Button
                    key={msg.id}
                    variant="outline"
                    className="h-auto py-3 px-3 justify-start gap-2 text-left"
                    onClick={() => sendNow(msg.id, msg.message)}
                    disabled={!pupilPhone || isBusy}
                  >
                    {isActive && sendState === "sending" ? (
                      <Loader2 className="h-4 w-4 shrink-0 text-primary animate-spin" />
                    ) : isActive && sendState === "sent" ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <msg.icon className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className="text-xs leading-tight">{msg.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Custom Message</p>
            <div className="relative">
              <Textarea
                placeholder={`Hi ${firstName}, …`}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[72px] text-sm resize-none pr-12"
                disabled={isBusy}
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-2 h-9 w-9 rounded-full"
                onClick={() => sendNow("custom", customMessage.trim())}
                disabled={!customMessage.trim() || !pupilPhone || isBusy}
                aria-label="Send custom message"
              >
                {activeId === "custom" && sendState === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : activeId === "custom" && sendState === "sent" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Voice Note */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Voice Note</p>
            <AnimatePresence mode="wait">
              {!audioBlob ? (
                <motion.div
                  key="record"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    className={`w-full h-12 gap-2 ${isRecording ? "animate-pulse" : ""}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      if (!isRecording) startRecording();
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      if (isRecording) stopRecording();
                    }}
                    onPointerLeave={() => {
                      if (isRecording) stopRecording();
                    }}
                    onClick={() => {
                      // Tap fallback: toggle if pointer events didn't fire
                      if (isRecording) stopRecording();
                      else if (!mediaRecorderRef.current) startRecording();
                    }}
                  >
                    <Mic className="h-4 w-4" />
                    {isRecording ? `Recording… ${formatTime(recordingTime)}` : "Hold to record"}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 bg-muted rounded-2xl px-3 py-2 flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="text-sm">Voice note ({formatTime(recordingTime)})</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={cancelRecording} aria-label="Cancel voice note">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={sendVoiceNote} className="gap-1" disabled={isBusy}>
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {sendState === "sent" && (
              <motion.p
                key="ok"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-center text-emerald-600 font-medium"
              >
                Message sent
              </motion.p>
            )}
            {sendState === "error" && errorMsg && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-center text-destructive font-medium"
              >
                {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {!pupilPhone && (
            <p className="text-xs text-destructive text-center">
              No phone number available for this pupil
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
