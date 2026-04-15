import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Volume2, Loader2, ChevronDown, ChevronUp, Share2, AlertTriangle, Wrench, PoundSterling } from "lucide-react";
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
      className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-2xl p-4 mb-4"
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
            <div className="space-y-3 mt-3">
              {/* Primary stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center bg-white/60 dark:bg-white/5 rounded-xl py-2">
                  <p className="text-lg font-bold text-foreground">{data.lessonsCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">Lessons</p>
                </div>
                <div className="text-center bg-white/60 dark:bg-white/5 rounded-xl py-2">
                  <p className="text-lg font-bold text-emerald-600">£{data.earnings}</p>
                  <p className="text-[10px] text-muted-foreground">Earned</p>
                </div>
                <div className="text-center bg-white/60 dark:bg-white/5 rounded-xl py-2">
                  <p className="text-lg font-bold text-foreground">{data.milesDriven}</p>
                  <p className="text-[10px] text-muted-foreground">Miles</p>
                </div>
              </div>

              {/* Alerts row */}
              {data.totalAlerts > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">
                      {data.totalAlerts} driving alert{data.totalAlerts !== 1 ? "s" : ""} today
                    </p>
                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60">
                      {[
                        data.alertCounts?.speeding > 0 && `${data.alertCounts.speeding} speeding`,
                        data.alertCounts?.harsh_brake > 0 && `${data.alertCounts.harsh_brake} harsh braking`,
                        data.alertCounts?.harsh_accel > 0 && `${data.alertCounts.harsh_accel} harsh accel`,
                        data.alertCounts?.sharp_turn > 0 && `${data.alertCounts.sharp_turn} sharp turn`,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Service reminders */}
              {data.serviceReminders && data.serviceReminders.length > 0 && (
                <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2">
                  <Wrench className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-orange-700 dark:text-orange-400">
                      Service Reminders
                    </p>
                    {data.serviceReminders.map((r: string, i: number) => (
                      <p key={i} className="text-[10px] text-orange-600/70 dark:text-orange-400/60">{r}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Outstanding balances */}
              {data.unpaidPupilCount > 0 && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                  <PoundSterling className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-red-700 dark:text-red-400">
                      £{data.outstandingBalance} outstanding
                    </p>
                    <p className="text-[10px] text-red-600/70 dark:text-red-400/60">
                      {data.unpaidPupilCount} pupil{data.unpaidPupilCount !== 1 ? "s" : ""} with unpaid balance
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => {
              sessionStorage.setItem(key, "1");
              setDismissed(true);
            }}
            className="text-[11px] text-muted-foreground/60 mt-3 hover:text-muted-foreground transition-colors"
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
