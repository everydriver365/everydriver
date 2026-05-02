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
  /** Fired after a "running-late" message is successfully sent.
   *  Receives the delay magnitude in minutes (best-effort, may be null
   *  for free-form / voice notes). */
  onMarkRunningLate?: (delayMinutes: number | null, newEtaText: string | null) => void;
  /** Fired after a plain "On the way / Send ETA" message is sent. */
  onMarkOnWay?: (etaText: string | null) => void;
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
  onMarkOnWay,
}: RunningLateSheetProps) {
  const firstName = (pupilName || "").split(" ")[0] || "there";

  const presets = useMemo(() => {
    const items: Array<{
      id: string;
      icon: any;
      label: string;
      message: string;
      kind: "on_way" | "late";
      delayMinutes: number | null;
      newEtaText: string | null;
    }> = [];
    // "Send ETA now" — pinned first when an ETA is known. This is the
    // primary "On the way" action.
    if (etaMinutes && etaMinutes > 0) {
      const etaTime = format(addMinutes(new Date(), etaMinutes), "HH:mm");
      items.push({
        id: "eta",
        icon: Navigation,
        label: `Send ETA · ${etaTime}`,
        message: `Hi ${firstName}, I'm on my way. My estimated arrival time is ${etaTime}.`,
        kind: "on_way",
        delayMinutes: null,
        newEtaText: etaTime,
      });
    }
    const delayItem = (mins: number) => {
      const baseEta = etaMinutes && etaMinutes > 0 ? etaMinutes : 0;
      const newEtaText = baseEta > 0
        ? format(addMinutes(new Date(), baseEta + mins), "HH:mm")
        : null;
      return {
        id: String(mins),
        icon: Clock,
        label: `+${mins} min late`,
        message: `Hi ${firstName}, I'm running about ${mins} minutes late. ${
          newEtaText ? `New ETA ${newEtaText}.` : "I'll be with you as soon as possible."
        }`,
        kind: "late" as const,
        delayMinutes: mins,
        newEtaText,
      };
    };
    items.push(delayItem(5), delayItem(10));
    items.push({
      id: "traffic",
      icon: Car,
      label: "Stuck in traffic",
      message: `Hi ${firstName}, I'm stuck in traffic and may be a little late. I'll keep you updated.`,
      kind: "late",
      delayMinutes: null,
      newEtaText: null,
    });
    items.push({
      id: "update",
      icon: AlertTriangle,
      label: "Will update you",
      message: `Hi ${firstName}, I'm running late. I'll update you shortly with a more accurate arrival time.`,
      kind: "late",
      delayMinutes: null,
      newEtaText: null,
    });
    return items;
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
    async (
      id: string,
      message: string,
      meta?: { kind: "on_way" | "late"; delayMinutes: number | null; newEtaText: string | null },
    ) => {
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
          if (meta?.kind === "on_way") {
            onMarkOnWay?.(meta.newEtaText);
          } else {
            // Default: anything sent from this sheet without explicit kind
            // is treated as a late message (preserves prior behaviour for
            // custom text and voice notes).
            onMarkRunningLate?.(meta?.delayMinutes ?? null, meta?.newEtaText ?? null);
          }
        } catch (e) {
          console.error("Late sheet callback failed:", e);
        }
        setTimeout(() => {
          setSendState("idle");
          setActiveId(null);
          onOpenChange(false);
        }, 900);
      } else {
        // Fallback to native SMS so the user can still send something
        const a = document.createElement("a");
        a.href = `sms:${pupilPhone}?body=${encodeURIComponent(message)}`;
        a.click();
        setSendState("error");
        setErrorMsg("Couldn't send message. Try again.");
      }
    },
    [pupilPhone, sendMessage, onOpenChange, onMarkRunningLate, onMarkOnWay]
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
          onMarkRunningLate?.(null, null);
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
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 pb-safe bg-[#F4F7F6] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-[5px] rounded-full bg-[#D1D5DB]" />
        </div>

        <SheetHeader className="px-5 pt-2 pb-4">
          <SheetTitle className="text-left text-[17px] font-semibold text-[#0F172A]">
            Running late
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-5 space-y-5">
          {/* Quick Messages */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-2 font-semibold">
              Quick messages
            </p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((msg) => {
                const isActive = activeId === msg.id;
                const isAmber = msg.id === "traffic" || msg.id === "update";
                const iconColor = isActive && sendState === "sent"
                  ? "text-emerald-500"
                  : isAmber
                    ? "text-amber-500"
                    : "text-[#2B7BC8]";
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => sendNow(msg.id, msg.message)}
                    disabled={!pupilPhone || isBusy}
                    className={`group h-auto py-3 px-3 rounded-[16px] border text-left flex items-start gap-2 transition-all
                      bg-white border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]
                      hover:border-[#2B7BC8]/30 active:bg-[#2B7BC8]/5 active:border-[#2B7BC8]/40
                      disabled:opacity-50 disabled:pointer-events-none
                      ${isActive ? "bg-[#2B7BC8]/5 border-[#2B7BC8]/40" : ""}`}
                  >
                    {isActive && sendState === "sending" ? (
                      <Loader2 className={`h-4 w-4 shrink-0 mt-0.5 animate-spin text-[#2B7BC8]`} />
                    ) : isActive && sendState === "sent" ? (
                      <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                    ) : (
                      <msg.icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                    )}
                    <span className="text-[13px] leading-tight text-[#0F172A] font-medium">
                      {msg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-2 font-semibold">
              Custom message
            </p>
            <div className="relative">
              <Textarea
                placeholder={`Hi ${firstName}, …`}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[80px] text-[14px] resize-none pr-12 rounded-[16px] bg-white border border-[#E5E7EB] text-[#0F172A] placeholder:text-[#9CA3AF] shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-visible:ring-1 focus-visible:ring-[#2B7BC8]/40 focus-visible:border-[#2B7BC8]/40"
                disabled={isBusy}
              />
              <button
                type="button"
                onClick={() => sendNow("custom", customMessage.trim())}
                disabled={!customMessage.trim() || !pupilPhone || isBusy}
                aria-label="Send custom message"
                className="absolute bottom-2 right-2 h-9 w-9 rounded-full flex items-center justify-center bg-[#2B7BC8] text-white shadow-[0_2px_6px_rgba(43,123,200,0.35)] disabled:opacity-40 disabled:shadow-none active:scale-95 transition-transform"
              >
                {activeId === "custom" && sendState === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : activeId === "custom" && sendState === "sent" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Voice Note */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-2 font-semibold">
              Voice note
            </p>
            <AnimatePresence mode="wait">
              {!audioBlob ? (
                <motion.div
                  key="record"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    type="button"
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
                      if (isRecording) stopRecording();
                      else if (!mediaRecorderRef.current) startRecording();
                    }}
                    className={`w-full h-12 rounded-[16px] border flex items-center justify-center gap-2 text-[14px] font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]
                      ${isRecording
                        ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                        : "bg-white border-[#E5E7EB] text-[#0F172A] active:bg-[#2B7BC8]/5"}`}
                  >
                    <Mic className={`h-4 w-4 ${isRecording ? "text-red-600" : "text-[#2B7BC8]"}`} />
                    {isRecording ? `Recording… ${formatTime(recordingTime)}` : "Hold to record"}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 bg-white border border-[#E5E7EB] rounded-[16px] px-3 py-2.5 flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <Mic className="h-4 w-4 text-[#2B7BC8]" />
                    <span className="text-[13px] text-[#0F172A]">Voice note ({formatTime(recordingTime)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={cancelRecording}
                    aria-label="Cancel voice note"
                    className="h-10 w-10 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-black/5 active:bg-black/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={sendVoiceNote}
                    disabled={isBusy}
                    className="h-10 px-4 rounded-full bg-[#2B7BC8] text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-[0_2px_6px_rgba(43,123,200,0.35)] disabled:opacity-40 active:scale-95 transition-transform"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </button>
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
                className="text-[12px] text-center text-emerald-600 font-medium"
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
                className="text-[12px] text-center text-red-600 font-medium"
              >
                {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {!pupilPhone && (
            <p className="text-[12px] text-red-600 text-center">
              No phone number available for this pupil
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
