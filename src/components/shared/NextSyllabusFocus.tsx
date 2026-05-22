import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DVSA_SYLLABUS,
  SKILL_LEVELS,
  SYLLABUS_CATEGORIES,
  type SyllabusCompetency,
} from "@/constants/dvsaSyllabus";

interface NextSyllabusFocusProps {
  pupilId: string;
  /** Audience changes the copy slightly. */
  audience?: "pupil" | "parent" | "instructor";
  /** How many focus items to surface (default 3). */
  limit?: number;
  className?: string;
}

interface ProgressRow {
  competency_id: string;
  level: number;
  updated_at?: string | null;
  instructor_notes?: string | null;
}

interface FocusItem {
  competency: SyllabusCompetency;
  level: number;
  reason: string;
  notes?: string | null;
}

/**
 * Surfaces the next 3 DVSA competencies to focus on for a pupil.
 *
 * Scoring is deterministic from live `pupil_syllabus_progress`:
 *   - Lower level wins (lots of upside)
 *   - Category-coverage gap adds a bonus (under-served categories surface first)
 *   - Mastered (level 5) and unrated-but-low-priority items are filtered out last
 *
 * No hard-coded fallbacks: if there is no progress data, we show "Not yet
 * started" guidance pulled straight from the syllabus constant.
 */
export function NextSyllabusFocus({
  pupilId,
  audience = "pupil",
  limit = 3,
  className,
}: NextSyllabusFocusProps) {
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level, updated_at, instructor_notes")
        .eq("pupil_id", pupilId);
      if (!cancelled) {
        setProgress(data || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pupilId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const progressMap = new Map(progress.map((p) => [p.competency_id, p]));

  // Category coverage % — drives the "under-served category" bonus.
  const categoryCoverage = new Map<string, number>();
  for (const cat of SYLLABUS_CATEGORIES) {
    const comps = DVSA_SYLLABUS.filter((c) => c.category === cat);
    const earned = comps.reduce(
      (sum, c) => sum + (progressMap.get(c.id)?.level || 0),
      0,
    );
    const max = comps.length * 5;
    categoryCoverage.set(cat, max > 0 ? earned / max : 0);
  }

  const scored = DVSA_SYLLABUS.map((c) => {
    const row = progressMap.get(c.id);
    const level = row?.level || 0;
    const catCoverage = categoryCoverage.get(c.category) || 0;
    // Mastered items are removed from focus list.
    if (level >= 5) return null;
    // Priority: low level + low category coverage = high priority.
    const score = (5 - level) * 10 + (1 - catCoverage) * 5;
    let reason: string;
    if (level === 0) reason = "Not yet started";
    else if (level <= 2) reason = "Needs more practice";
    else if (level === 3) reason = "Building confidence";
    else reason = "Almost there";
    return {
      competency: c,
      level,
      reason,
      notes: row?.instructor_notes,
      score,
    };
  }).filter(Boolean) as (FocusItem & { score: number })[];

  const focus = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const title =
    audience === "instructor"
      ? "Next Lesson Focus"
      : audience === "parent"
        ? "What's Next"
        : "Your Next Focus";

  const subtitle =
    audience === "instructor"
      ? "Suggested skills for the next lesson"
      : audience === "parent"
        ? "Skills to work on next"
        : "Skills to practice next";

  if (focus.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            All skills mastered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Every DVSA competency is at the Independent level. Time to book the
            test!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {focus.length} {focus.length === 1 ? "skill" : "skills"}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground pl-9">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {focus.map((item, idx) => {
          const sl = SKILL_LEVELS[item.level];
          return (
            <div
              key={item.competency.id}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">
                    {item.competency.name}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] shrink-0 ${sl?.textColor || ""}`}
                  >
                    L{item.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                  <span>{item.competency.category}</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                  <span>{item.reason}</span>
                </div>
                {item.notes && audience !== "instructor" && (
                  <p className="text-[11px] text-muted-foreground mt-1 italic line-clamp-2">
                    “{item.notes}”
                  </p>
                )}
                {item.competency.description && !item.notes && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {item.competency.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
