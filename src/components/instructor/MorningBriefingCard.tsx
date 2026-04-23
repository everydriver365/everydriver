import { useState, useEffect, forwardRef } from "react";
import { motion } from "framer-motion";
import { Sun, Volume2, VolumeX, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BriefingActionCards } from "./BriefingActionCards";
import { BriefingActionModal } from "./BriefingActionModal";

interface MorningBriefingCardProps {
  instructorId: string | undefined;
  onNavigate?: (section: string) => void;
}

const TypewriterText = forwardRef<HTMLParagraphElement, { text: string }>(({ text }, ref) => {
  const words = text.split(" ");
  return (
    <motion.p ref={ref} className="text-[13px] leading-[1.65] text-foreground/80">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: i * 0.025, duration: 0.15 }}
        >
          {word}{" "}
        </motion.span>
      ))}
    </motion.p>
  );
});
TypewriterText.displayName = "TypewriterText";

export function MorningBriefingCard({ instructorId, onNavigate }: MorningBriefingCardProps) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [enabled, setEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem("daily-briefing-enabled");
    return v === null ? true : v === "true";
  });
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState<{ lessons: number; earnings: number }>({ lessons: 0, earnings: 0 });

  const hour = new Date().getHours();
  const isMorning = true;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setEnabled(detail);
    };
    window.addEventListener("daily-briefing-toggled", handler);
    return () => window.removeEventListener("daily-briefing-toggled", handler);
  }, []);

  useEffect(() => {
    if (!instructorId || !enabled) return;
    const key = `briefing-shown-${instructorId}`;
    if (localStorage.getItem(key)) {
      setDismissed(true);
      return;
    }
    fetchBriefing();
    fetchTodayStats();
  }, [instructorId, enabled]);

  const fetchTodayStats = async () => {
    if (!instructorId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: lessons } = await supabase
        .from("scheduled_lessons")
        .select("id, amount_due")
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .is("deleted_at", null);
      
      if (lessons) {
        setTodayStats({
          lessons: lessons.length,
          earnings: lessons.reduce((sum, l) => sum + (l.amount_due || 0), 0),
        });
      }
    } catch {
      // Silent fail
    }
  };

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
    const key = `briefing-shown-${instructorId}`;
    localStorage.setItem(key, "1");
    setDismissed(true);
  };

  const handleActionClick = (actionId: string) => {
    setActiveAction(actionId);
    onNavigate?.(actionId);
  };

  if (!enabled || !isMorning || dismissed || (!briefing && !loading)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-4 mt-5 mb-4 relative overflow-hidden"
    >
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-900 dark:to-stone-950 shadow-lg ring-1 ring-stone-200/60 dark:ring-stone-700/40">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-400/30">
                <Sun className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold">{greeting}</p>
                <h3 className="text-base font-bold text-foreground">Daily Briefing</h3>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="bg-white/80 dark:bg-black/20 rounded-2xl p-3.5 mb-3 ring-1 ring-stone-200/50 dark:ring-stone-700/30">
            {loading ? (
              <div className="space-y-2.5 py-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-[90%]" />
                <Skeleton className="h-3.5 w-[75%]" />
              </div>
            ) : briefing ? (
              <TypewriterText text={briefing} />
            ) : null}
          </div>

          {briefing && (
            <BriefingActionCards
              briefingText={briefing}
              todayLessons={todayStats.lessons}
              expectedEarnings={todayStats.earnings}
              onActionClick={handleActionClick}
            />
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3.5 rounded-full text-xs font-semibold gap-1.5 border-stone-300 dark:border-stone-600"
              onClick={readAloud}
              disabled={speaking || loading}
            >
              {speaking ? (
                <><VolumeX className="h-3.5 w-3.5" /> Speaking...</>
              ) : (
                <><Volume2 className="h-3.5 w-3.5" /> Listen</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3.5 rounded-full text-xs font-semibold gap-1.5"
              onClick={fetchBriefing}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <BriefingActionModal
        actionId={activeAction}
        instructorId={instructorId}
        open={!!activeAction}
        onClose={() => setActiveAction(null)}
      />
    </motion.div>
  );
}
