import { useState, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Mic, MicOff, Send, Clock, Car, AlertTriangle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";

interface RunningLateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilName: string;
  pupilPhone: string | null;
  startTime: string;
}

const QUICK_MESSAGES = [
  { icon: Clock, text: "Running 5 mins late", delay: "5" },
  { icon: Clock, text: "Running 10 mins late", delay: "10" },
  { icon: Car, text: "Stuck in traffic, be there soon", delay: "traffic" },
  { icon: AlertTriangle, text: "Running late, will update you shortly", delay: "unknown" },
];

export function RunningLateSheet({
  open,
  onOpenChange,
  pupilName,
  pupilPhone,
  startTime,
}: RunningLateSheetProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const firstName = pupilName.split(" ")[0];

  const sendSMS = useCallback((message: string) => {
    if (!pupilPhone) return;
    
    haptics.medium();
    const fullMessage = `Hi ${firstName}, ${message}`;
    window.open(`sms:${pupilPhone}?body=${encodeURIComponent(fullMessage)}`, "_self");
    setSentMessage(message);
    
    setTimeout(() => {
      setSentMessage(null);
      onOpenChange(false);
    }, 1500);
  }, [pupilPhone, firstName, onOpenChange]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      haptics.medium();

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
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

  const sendVoiceNote = useCallback(() => {
    if (!audioBlob || !pupilPhone) return;
    
    haptics.medium();
    
    // Create a shareable file
    const file = new File([audioBlob], "voice-note.webm", { type: "audio/webm" });
    
    // Try to use Web Share API if available
    if (navigator.share && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: "Voice Note",
        text: `Hi ${firstName}, I'm running late - here's a quick voice message:`,
      }).then(() => {
        setAudioBlob(null);
        onOpenChange(false);
      }).catch(console.error);
    } else {
      // Fallback: Download the file and prompt to send manually
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "voice-note.webm";
      a.click();
      URL.revokeObjectURL(url);
      
      // Open SMS with text fallback
      sendSMS("I'm running late. I just recorded a voice note for you!");
    }
  }, [audioBlob, pupilPhone, firstName, onOpenChange, sendSMS]);

  const cancelRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(0);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-none pb-safe">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">Running Late?</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Quick Messages */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Quick Messages</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_MESSAGES.map((msg) => (
                <Button
                  key={msg.delay}
                  variant="outline"
                  className="h-auto py-3 px-3 justify-start gap-2 text-left"
                  onClick={() => sendSMS(msg.text)}
                  disabled={!pupilPhone}
                >
                  <msg.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-xs leading-tight">{msg.text}</span>
                  {sentMessage === msg.text && (
                    <Check className="h-4 w-4 text-emerald-500 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Custom Message</p>
            <div className="flex gap-2">
              <Textarea
                placeholder={`Hi ${firstName}, ...`}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
              />
              <Button
                size="icon"
                className="h-[60px] w-12 shrink-0"
                onClick={() => sendSMS(customMessage)}
                disabled={!customMessage.trim() || !pupilPhone}
              >
                <Send className="h-4 w-4" />
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
                  className="flex items-center gap-3"
                >
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    className={`flex-1 h-12 gap-2 ${isRecording ? "animate-pulse" : ""}`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Stop Recording ({formatTime(recordingTime)})
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Record Voice Note
                      </>
                    )}
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
                  <div className="flex-1 bg-muted rounded-none px-3 py-2 flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="text-sm">Voice note ({formatTime(recordingTime)})</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={cancelRecording}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={sendVoiceNote} className="gap-1">
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
