import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Volume2, Loader2, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { ShareableEODCard } from "@/components/instructor/ShareableEODCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface EndOfDaySummaryProps {
  instructorId: string | undefined;
}

export function EndOfDaySummary({ instructorId }: EndOfDaySummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  const hour = new Date().getHours();
  const isEvening = hour >= 17 && hour < 23;

  const fetchSummary = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-eod-summary", {
        body: { instructor_id: instructorId },
      });
      if (!error && result) {
        setSummary(result.summary);
        setData(result.data);
        setExpanded(true);
      }
    } catch (e) {
      console.error("EOD summary error:", e);
    } finally {
      setLoading(false);
    }
  };

  const readAloud = async () => {
    if (!summary) return;
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
          body: JSON.stringify({ text: summary }),
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
        await audio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(summary);
        utterance.onend = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch {
      setSpeaking(false);
    }
  };

  if (!isEvening || dismissed) return null;

  const key = `eod-dismissed-${new Date().toDateString()}`;
  if (sessionStorage.getItem(key)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-none p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-400/20 flex items-center justify-center">
            <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">End of Day</h3>
        </div>
        <div className="flex items-center gap-1">
          {summary && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowShareCard(!showShareCard)}>
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          {summary && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={readAloud} disabled={speaking}>
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          {!summary ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={fetchSummary}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && summary && (
        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}>
          <p className="text-[13px] leading-relaxed text-muted-foreground mb-2">{summary}</p>
          {data && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{data.lessonsCompleted}</p>
                <p className="text-[10px] text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">£{data.earnings}</p>
                <p className="text-[10px] text-muted-foreground">Earned</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{data.milesDriven}</p>
                <p className="text-[10px] text-muted-foreground">Miles</p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              sessionStorage.setItem(key, "1");
              setDismissed(true);
            }}
            className="text-[11px] text-muted-foreground/60 mt-2 hover:text-muted-foreground transition-colors"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Share card */}
      {showShareCard && summary && data && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <ShareableEODCard summary={summary} data={data} />
        </motion.div>
      )}
    </motion.div>
  );
}
