import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Volume2, VolumeX, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface MorningBriefingCardProps {
  instructorId: string | undefined;
}

export function MorningBriefingCard({ instructorId }: MorningBriefingCardProps) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const hour = new Date().getHours();
  // Show anytime for now (remove time restriction for demo)
  const isMorning = true; // Was: hour >= 5 && hour < 12;

  useEffect(() => {
    if (!instructorId) return;
    // Check if already dismissed today
    const key = `briefing-dismissed-${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) {
      setDismissed(true);
      return;
    }
    fetchBriefing();
  }, [instructorId]);

  const fetchBriefing = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-morning-briefing", {
        body: { instructor_id: instructorId },
      });
      if (!error && data?.briefing) {
        setBriefing(data.briefing);
      }
    } catch (e) {
      console.error("Briefing fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const readAloud = async () => {
    if (!briefing) return;
    setSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: briefing }),
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
        };
        await audio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(briefing);
        utterance.rate = 1.1;
        utterance.onend = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch {
      setSpeaking(false);
    }
  };

  const dismiss = () => {
    const key = `briefing-dismissed-${new Date().toDateString()}`;
    sessionStorage.setItem(key, "1");
    setDismissed(true);
  };

  if (!isMorning || dismissed || (!briefing && !loading)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-400/20 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Morning Briefing</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={readAloud}
                disabled={speaking || loading}
              >
                {speaking ? (
                  <VolumeX className="h-3.5 w-3.5 text-amber-600" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={fetchBriefing}
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              <span className="text-xs text-muted-foreground">Preparing your briefing...</span>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted-foreground">{briefing}</p>
          )}
          <button
            onClick={dismiss}
            className="text-[11px] text-muted-foreground/60 mt-2 hover:text-muted-foreground transition-colors"
          >
            Dismiss for today
          </button>
        </div>
      </div>
    </motion.div>
  );
}
