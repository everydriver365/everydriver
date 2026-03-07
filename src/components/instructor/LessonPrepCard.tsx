import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface LessonPrepCardProps {
  instructorId: string | undefined;
  pupilId: string;
  pupilName: string;
}

export function LessonPrepCard({ instructorId, pupilId, pupilName }: LessonPrepCardProps) {
  const [prep, setPrep] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchPrep = async () => {
    if (!instructorId || !pupilId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson-prep", {
        body: { instructor_id: instructorId, pupil_id: pupilId },
      });
      if (!error && data?.prep) {
        setPrep(data.prep);
        setExpanded(true);
      }
    } catch (e) {
      console.error("Lesson prep error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/40 dark:border-emerald-800/30 rounded-xl p-3 mt-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[12px] font-semibold text-foreground">
            Lesson Prep — {pupilName}
          </span>
        </div>
        {!prep ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-emerald-700 dark:text-emerald-400"
            onClick={fetchPrep}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Generate"}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        )}
      </div>

      {expanded && prep && (
        <motion.p
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="text-[12px] leading-relaxed text-muted-foreground mt-2 whitespace-pre-line"
        >
          {prep}
        </motion.p>
      )}
    </motion.div>
  );
}
