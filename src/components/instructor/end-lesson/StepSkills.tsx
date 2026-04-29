import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetHeader } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { titleCaseName } from "@/lib/titleCase";
import { detectDataQualityIssues } from "@/lib/detectDataQualityIssues";
import { DVSA_SYLLABUS, SKILL_LEVELS, type SyllabusCompetency } from "@/constants/dvsaSyllabus";
import { PostLessonReview } from "@/components/instructor/PostLessonReview";

interface StepSkillsProps {
  lessonId: string;
  pupilId: string;
  pupilName: string;
  pupilPhone?: string | null;
  pupilPhotoUrl?: string | null;
  instructorId: string;
  onSaved: () => void;
}

interface InlineTopic {
  competency: SyllabusCompetency;
  previousRating: number | null; // overall stored rating before this lesson
  currentRating: number | null;  // tap-staged rating in this step
}

const RECOMMENDED_FIRST_IDS = ["cockpit_drill", "controls", "precautions"];

type SectionKind = "from-last" | "needs-work" | "recommended" | "common";

export function InlineStepSkills({
  lessonId,
  pupilId,
  pupilName,
  pupilPhone,
  pupilPhotoUrl,
  instructorId,
  onSaved,
  onSkip,
  onSaveAndNext,
}: StepSkillsProps & { onSkip: () => void; onSaveAndNext: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [topics, setTopics] = useState<InlineTopic[]>([]);
  const [sectionKind, setSectionKind] = useState<SectionKind>("common");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fullSyllabusOpen, setFullSyllabusOpen] = useState(false);

  const showReviewPill = useMemo(() => {
    return detectDataQualityIssues(
      { id: pupilId, name: pupilName, phone: pupilPhone || null },
      [],
    ).includes("invalid-name");
  }, [pupilId, pupilName, pupilPhone]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Pupil overall progress
        const { data: progressRows } = await supabase
          .from("pupil_syllabus_progress")
          .select("competency_id, level")
          .eq("pupil_id", pupilId);
        const map: Record<string, number> = {};
        (progressRows || []).forEach((r: any) => {
          map[r.competency_id] = r.level || 0;
        });

        // Last lesson updates (audit table)
        const { data: lastLessons } = await supabase
          .from("lesson_history")
          .select("id, lesson_date, start_time")
          .eq("pupil_id", pupilId)
          .neq("id", lessonId)
          .order("lesson_date", { ascending: false })
          .order("start_time", { ascending: false })
          .limit(1);

        let lastTopicIds: string[] = [];
        if (lastLessons && lastLessons.length > 0) {
          const { data: updates } = await supabase
            .from("lesson_syllabus_updates")
            .select("competency_id, new_level")
            .eq("lesson_history_id", lastLessons[0].id);
          if (updates && updates.length > 0) {
            // Keep order, dedupe
            const seen = new Set<string>();
            updates.forEach((u: any) => {
              if (!seen.has(u.competency_id)) {
                seen.add(u.competency_id);
                lastTopicIds.push(u.competency_id);
              }
            });
          }
        }

        // Pick up to 3 topics by priority
        let chosen: SyllabusCompetency[] = [];
        let kind: SectionKind = "common";

        if (lastTopicIds.length > 0) {
          kind = "from-last";
          // Sort by lowest current level (most progression potential)
          const sorted = [...lastTopicIds].sort(
            (a, b) => (map[a] || 0) - (map[b] || 0),
          );
          chosen = sorted
            .map((id) => DVSA_SYLLABUS.find((c) => c.id === id))
            .filter((c): c is SyllabusCompetency => Boolean(c))
            .slice(0, 3);
        }

        if (chosen.length < 3) {
          // Needs work: rated 1-3
          const needsWork = DVSA_SYLLABUS.filter(
            (c) =>
              (map[c.id] || 0) > 0 &&
              (map[c.id] || 0) < 4 &&
              !chosen.some((x) => x.id === c.id),
          ).sort((a, b) => (map[a.id] || 0) - (map[b.id] || 0));
          for (const c of needsWork) {
            if (chosen.length >= 3) break;
            chosen.push(c);
          }
          if (chosen.length > 0 && kind === "common") kind = "needs-work";
        }

        if (chosen.length < 3) {
          // Recommended firsts (only for new pupils — no existing progress)
          const hasAnyProgress = Object.keys(map).length > 0;
          if (!hasAnyProgress) kind = "recommended";
          for (const id of RECOMMENDED_FIRST_IDS) {
            if (chosen.length >= 3) break;
            if (chosen.some((x) => x.id === id)) continue;
            const c = DVSA_SYLLABUS.find((x) => x.id === id);
            if (c) chosen.push(c);
          }
        }

        if (cancelled) return;
        setProgressMap(map);
        setSectionKind(kind);
        setTopics(
          chosen.map((c) => ({
            competency: c,
            previousRating: map[c.id] != null ? map[c.id] : null,
            currentRating: null,
          })),
        );
      } catch (e) {
        console.error("StepSkills load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pupilId, lessonId]);

  const ratedCount = useMemo(
    () => Object.values(progressMap).filter((l) => (l || 0) > 0).length,
    [progressMap],
  );
  const stagedCount = useMemo(() => {
    // Count topics not previously rated that have a current rating
    let extra = 0;
    topics.forEach((t) => {
      if ((t.previousRating || 0) === 0 && (t.currentRating || 0) > 0) extra++;
    });
    return ratedCount + extra;
  }, [topics, ratedCount]);

  const hasChanges = useMemo(
    () =>
      topics.some(
        (t) =>
          t.currentRating != null &&
          t.currentRating !== (t.previousRating ?? 0),
      ),
    [topics],
  );

  const handleRate = (compId: string, rating: number) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.competency.id === compId ? { ...t, currentRating: rating } : t,
      ),
    );
  };

  const handleAddTopic = (compId: string) => {
    if (topics.some((t) => t.competency.id === compId)) {
      setPickerOpen(false);
      return;
    }
    const c = DVSA_SYLLABUS.find((x) => x.id === compId);
    if (!c) return;
    setTopics((prev) => [
      ...prev,
      {
        competency: c,
        previousRating: progressMap[compId] != null ? progressMap[compId] : null,
        currentRating: null,
      },
    ]);
    setPickerOpen(false);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      onSaveAndNext();
      return;
    }
    setSaving(true);
    try {
      const changes = topics.filter(
        (t) =>
          t.currentRating != null &&
          t.currentRating !== (t.previousRating ?? 0),
      );

      if (changes.length > 0) {
        const upserts = changes.map((t) => ({
          pupil_id: pupilId,
          competency_id: t.competency.id,
          level: t.currentRating!,
          instructor_id: instructorId,
        }));
        const { error: upErr } = await supabase
          .from("pupil_syllabus_progress")
          .upsert(upserts, { onConflict: "pupil_id,competency_id" });
        if (upErr) throw upErr;

        const audits = changes.map((t) => ({
          lesson_history_id: lessonId,
          pupil_id: pupilId,
          competency_id: t.competency.id,
          previous_level: t.previousRating ?? 0,
          new_level: t.currentRating!,
        }));
        // lesson_history_id may be null if step runs before lesson_history insert
        const usableAudits = audits.filter((a) => !!a.lesson_history_id);
        if (usableAudits.length > 0) {
          await supabase.from("lesson_syllabus_updates").insert(usableAudits as any);
        }
        toast.success(`${changes.length} skill${changes.length > 1 ? "s" : ""} updated`);
      }
      onSaved();
      onSaveAndNext();
    } catch (e) {
      console.error("StepSkills save error:", e);
      toast.error("Failed to save skill updates");
    } finally {
      setSaving(false);
    }
  };

  const sectionLabel =
    sectionKind === "from-last"
      ? "From last lesson"
      : sectionKind === "recommended"
        ? "Recommended first topics"
        : sectionKind === "needs-work"
          ? "Needs work"
          : "Common topics";

  const remainingPickerOptions = DVSA_SYLLABUS.filter(
    (c) => !topics.some((t) => t.competency.id === c.id),
  );

  return (
    <>
      {/* Pupil identity bar */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "0.5px solid #E5E5EA",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <UserAvatar name={titleCaseName(pupilName)} photoUrl={pupilPhotoUrl} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#000",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {titleCaseName(pupilName)}
            </span>
            {showReviewPill && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#B8801F",
                  background: "rgba(184,128,31,0.12)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                Review
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#6E6E73", margin: 0 }}>
            Standard lesson · {stagedCount} of {DVSA_SYLLABUS.length} topics
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "#6E6E73", fontSize: 12 }}>
            Loading topics…
          </div>
        ) : topics.length === 0 ? (
          <div
            style={{
              background: "#F2F2F4",
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
              color: "#6E6E73",
              fontSize: 12,
            }}
          >
            No topics to surface yet. Open the full syllabus to update skills.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6E6E73",
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {sectionLabel}
              </span>
              <span style={{ fontSize: 11, color: "#6E6E73" }}>Tap to rate</span>
            </div>

            {topics.map((t, idx) => (
              <TopicCard
                key={t.competency.id}
                topic={t}
                isLast={idx === topics.length - 1}
                onRate={(level) => handleRate(t.competency.id, level)}
              />
            ))}
          </>
        )}

        {/* Action links */}
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 12,
              fontWeight: 500,
              color: "#2B7BC8",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 8,
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#2B7BC8" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add another topic
          </button>
          <div>
            <button
              type="button"
              onClick={() => setFullSyllabusOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 12,
                fontWeight: 500,
                color: "#2B7BC8",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Open full syllabus
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#2B7BC8" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          background: "#F8FAFB",
          borderTop: "0.5px solid #E5E5EA",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: "transparent",
            border: "none",
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: 500,
            color: "#6E6E73",
            cursor: "pointer",
          }}
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "#2B7BC8",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            cursor: saving ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save & next"}
          {!saving && (
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Add another topic picker */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-base">Add a topic</SheetTitle>
            <SheetDescription className="text-xs">
              Pick any topic from the DVSA syllabus to add to this lesson.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-3 space-y-1">
            {remainingPickerOptions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleAddTopic(c.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted text-sm"
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">{c.category}</div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Full syllabus sheet — preserves existing destination */}
      <Sheet open={fullSyllabusOpen} onOpenChange={setFullSyllabusOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-base">Driving syllabus</SheetTitle>
            <SheetDescription className="sr-only">Full pupil syllabus</SheetDescription>
          </SheetHeader>
          <div className="mt-3">
            <PostLessonReview
              lessonId={lessonId}
              pupilId={pupilId}
              instructorId={instructorId}
              onSaved={() => {
                setFullSyllabusOpen(false);
                onSaved();
              }}
              onClose={() => setFullSyllabusOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface TopicCardProps {
  topic: InlineTopic;
  isLast: boolean;
  onRate: (level: number) => void;
}

function TopicCard({ topic, isLast, onRate }: TopicCardProps) {
  const { competency, previousRating, currentRating } = topic;

  // Annotation logic
  let annotationText = "Tap to rate";
  let annotationColor = "#6E6E73";
  if (currentRating != null) {
    const label = SKILL_LEVELS[currentRating]?.label || "";
    if (currentRating === 5) {
      if ((previousRating ?? 0) < 5) {
        annotationText = "Test-ready ↑ mastered";
        annotationColor = "#3B8B3B";
      } else {
        annotationText = "Test-ready";
        annotationColor = "#3B8B3B";
      }
    } else if (previousRating == null || (previousRating ?? 0) === currentRating) {
      annotationText = label;
      annotationColor = "#6E6E73";
    } else if (currentRating > (previousRating ?? 0)) {
      annotationText = `${label} ↑ improved`;
      annotationColor = "#2B7BC8";
    } else {
      annotationText = `${label} · note in lesson summary`;
      annotationColor = "#B8801F";
    }
  }

  return (
    <div
      style={{
        background: "#F2F2F4",
        borderRadius: 10,
        padding: 12,
        marginBottom: isLast ? 0 : 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#000" }}>
          {competency.name}
        </span>
        {previousRating != null && previousRating > 0 && (
          <span style={{ fontSize: 11, color: "#6E6E73" }}>Last: {previousRating}</span>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: 4,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((n) => {
          const selected = currentRating === n;
          const bg = !selected
            ? "#FFFFFF"
            : n === 5
              ? "#3B8B3B"
              : n === 0
                ? "#6E6E73"
                : "#2B7BC8";
          const color = selected ? "#FFFFFF" : "#6E6E73";
          const border = !selected
            ? "0.5px solid #E5E5EA"
            : n === 5
              ? "0.5px solid #3B8B3B"
              : n === 0
                ? "0.5px solid #6E6E73"
                : "0.5px solid #2B7BC8";
          return (
            <button
              key={n}
              type="button"
              onClick={() => onRate(n)}
              style={{
                background: bg,
                border,
                borderRadius: 6,
                padding: "6px 0",
                fontSize: 12,
                fontWeight: 500,
                color,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div
        style={{
          fontSize: 10,
          margin: "6px 0 0",
          textAlign: "center",
          color: annotationColor,
        }}
      >
        {annotationText}
      </div>
    </div>
  );
}

// Backwards-compatible default export wrapper (used elsewhere in legacy paths)
export function StepSkills(props: StepSkillsProps) {
  return (
    <PostLessonReview
      lessonId={props.lessonId}
      pupilId={props.pupilId}
      instructorId={props.instructorId}
      onSaved={props.onSaved}
    />
  );
}
