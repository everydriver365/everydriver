import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Volume2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface WeeklyReportCardProps {
  instructorId: string | undefined;
}

export function WeeklyReportCard({ instructorId }: WeeklyReportCardProps) {
  const [report, setReport] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchReport = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-weekly-report", {
        body: { instructor_id: instructorId },
      });
      if (!error && result) {
        setReport(result.report);
        setData(result.data);
        setExpanded(true);
      }
    } catch (e) {
      console.error("Weekly report error:", e);
    } finally {
      setLoading(false);
    }
  };

  const readAloud = async () => {
    if (!report) return;
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
          body: JSON.stringify({ text: report }),
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
        await audio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(report);
        utterance.onend = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch {
      setSpeaking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/50 dark:border-violet-800/30 rounded-none p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-400/20 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Weekly Report</h3>
        </div>
        <div className="flex items-center gap-1">
          {report && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={readAloud} disabled={speaking}>
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          {!report ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={fetchReport} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate"}
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && report && (
        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}>
          <p className="text-[13px] leading-relaxed text-muted-foreground mb-3">{report}</p>
          {data && (
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center bg-white/50 dark:bg-white/5 rounded-none p-2">
                <p className="text-sm font-bold text-foreground">{data.lessonCount}</p>
                <p className="text-[9px] text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center bg-white/50 dark:bg-white/5 rounded-none p-2">
                <p className="text-sm font-bold text-foreground">£{data.revenue}</p>
                <p className="text-[9px] text-muted-foreground">Revenue</p>
              </div>
              <div className="text-center bg-white/50 dark:bg-white/5 rounded-none p-2">
                <p className="text-sm font-bold text-foreground">{data.totalMiles}</p>
                <p className="text-[9px] text-muted-foreground">Miles</p>
              </div>
              <div className="text-center bg-white/50 dark:bg-white/5 rounded-none p-2">
                <p className="text-sm font-bold text-foreground">
                  {data.revenueChange > 0 ? "+" : ""}{data.revenueChange}%
                </p>
                <p className="text-[9px] text-muted-foreground">vs Last</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
