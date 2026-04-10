import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Loader2, ChevronDown, ChevronUp, FileText, BarChart3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PreviousLessonNotes {
  date: string;
  notes: string | null;
  nextPlan: string | null;
  skillsPracticed: string[];
  duration: number;
}

interface SyllabusSummary {
  totalCompetencies: number;
  tracked: number;
  notStarted: number;
  averageLevel: number;
  weakAreas: { id: string; level: number; levelLabel: string; notes: string | null }[];
  strongAreas: { id: string; level: number; levelLabel: string }[];
}

interface LessonPrepCardProps {
  instructorId: string | undefined;
  pupilId: string;
  pupilName: string;
}

const LEVEL_COLORS: Record<string, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "Introduced": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Under Guidance": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Prompted": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Seldom Prompted": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Independent": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function formatCompetencyId(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function LessonPrepCard({ instructorId, pupilId, pupilName }: LessonPrepCardProps) {
  const [prep, setPrep] = useState<string | null>(null);
  const [previousNotes, setPreviousNotes] = useState<PreviousLessonNotes | null>(null);
  const [syllabus, setSyllabus] = useState<SyllabusSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"prep" | "notes" | "syllabus">("prep");

  const fetchPrep = async () => {
    if (!instructorId || !pupilId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson-prep", {
        body: { instructor_id: instructorId, pupil_id: pupilId },
      });
      if (!error && data) {
        setPrep(data.prep || null);
        setPreviousNotes(data.previousLessonNotes || null);
        setSyllabus(data.syllabusSummary || null);
        setExpanded(true);
      }
    } catch (e) {
      console.error("Lesson prep error:", e);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "prep" as const, label: "AI Prep", icon: BookOpen },
    { key: "notes" as const, label: "Last Lesson", icon: FileText, disabled: !previousNotes },
    { key: "syllabus" as const, label: "Progress", icon: BarChart3, disabled: !syllabus },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/40 dark:border-emerald-800/30 rounded-none p-3 mt-2"
    >
      {/* Header */}
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

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && prep && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Tab bar */}
            <div className="flex gap-1 mt-2.5 mb-2 border-b border-emerald-200/30 dark:border-emerald-800/20 pb-1.5">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => !tab.disabled && setActiveTab(tab.key)}
                  disabled={tab.disabled}
                  className={`flex items-center gap-1 px-2 py-1 rounded-none text-[10px] font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
                      : tab.disabled
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground hover:bg-emerald-600/5"
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* AI Prep tab */}
            {activeTab === "prep" && (
              <p className="text-[12px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {prep}
              </p>
            )}

            {/* Previous Lesson Notes tab */}
            {activeTab === "notes" && previousNotes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {previousNotes.date} · {previousNotes.duration}min
                  </span>
                </div>

                {previousNotes.notes && (
                  <div className="bg-card/60 rounded-none p-2.5 border border-border/30">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Notes</span>
                    <p className="text-[11px] text-foreground leading-relaxed">{previousNotes.notes}</p>
                  </div>
                )}

                {previousNotes.nextPlan && (
                  <div className="bg-emerald-100/50 dark:bg-emerald-900/20 rounded-none p-2.5 border border-emerald-200/30 dark:border-emerald-800/20">
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">Plan for next lesson</span>
                    <p className="text-[11px] text-foreground leading-relaxed">{previousNotes.nextPlan}</p>
                  </div>
                )}

                {previousNotes.skillsPracticed && previousNotes.skillsPracticed.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Skills Practiced</span>
                    <div className="flex flex-wrap gap-1">
                      {previousNotes.skillsPracticed.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">
                          {formatCompetencyId(skill)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!previousNotes.notes && !previousNotes.nextPlan && (
                  <p className="text-[11px] text-muted-foreground italic">No notes recorded for the last lesson.</p>
                )}
              </div>
            )}

            {/* Syllabus Progress tab */}
            {activeTab === "syllabus" && syllabus && (
              <div className="space-y-2.5">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      DVSA Syllabus Progress
                    </span>
                    <span className="text-[10px] font-medium text-foreground">
                      {syllabus.tracked}/{syllabus.totalCompetencies} tracked · Avg {syllabus.averageLevel}/5
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all"
                      style={{ width: `${(syllabus.tracked / syllabus.totalCompetencies) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Weak areas */}
                {syllabus.weakAreas.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Needs Work</span>
                    </div>
                    <div className="space-y-1">
                      {syllabus.weakAreas.map((area) => (
                        <div key={area.id} className="flex items-center gap-2 bg-card/60 rounded-none px-2 py-1.5 border border-border/20">
                          <span className="text-[11px] text-foreground flex-1 min-w-0 truncate">
                            {formatCompetencyId(area.id)}
                          </span>
                          <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${LEVEL_COLORS[area.levelLabel] || "bg-muted"}`}>
                            {area.levelLabel}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strong areas */}
                {syllabus.strongAreas.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Strong</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {syllabus.strongAreas.map((area) => (
                        <Badge key={area.id} className={`text-[9px] px-1.5 py-0 ${LEVEL_COLORS[area.levelLabel] || "bg-muted"}`}>
                          {formatCompetencyId(area.id)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {syllabus.tracked === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">No syllabus progress recorded yet.</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
