import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX, Loader2, RefreshCw, X, CloudSun } from "lucide-react";
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
  const isMorning = true;

  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!instructorId) return;
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-4 mb-4 relative overflow-hidden"
    >
      {/* Main card */}
      <div className="relative rounded-[20px] overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-10 -translate-x-6" />
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-white/5 rounded-full" />

        {/* Content */}
        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
                <CloudSun className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-primary-foreground/70 uppercase tracking-wider">{greeting}</p>
                <h3 className="text-base font-bold text-primary-foreground">Your Daily Briefing</h3>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-primary-foreground/80" />
            </button>
          </div>

          {/* Briefing content */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 mb-3">
            {loading ? (
              <div className="flex items-center gap-2.5 py-3">
                <div className="relative">
                  <Loader2 className="h-5 w-5 animate-spin text-primary-foreground/70" />
                  <Sparkles className="h-3 w-3 text-primary-foreground absolute -top-1 -right-1" />
                </div>
                <span className="text-sm text-primary-foreground/80 font-medium">Preparing your briefing...</span>
              </div>
            ) : (
              <p className="text-[13px] leading-[1.65] text-primary-foreground/90 font-medium">{briefing}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-primary-foreground text-xs font-semibold gap-1.5 backdrop-blur-sm border-0"
              onClick={readAloud}
              disabled={speaking || loading}
            >
              {speaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  Speaking...
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  Listen
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-primary-foreground text-xs font-semibold gap-1.5 backdrop-blur-sm border-0"
              onClick={fetchBriefing}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
