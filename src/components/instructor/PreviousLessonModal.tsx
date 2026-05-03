import { format, parse } from "date-fns";
import { Star, StickyNote, ClipboardList, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PupilLessonHistoryEntry } from "@/hooks/usePupilLessonHistory";

const BLUE = "#1A52A0";
const BLUE_TINT = "#EEF3FF";
const CHARCOAL = "#2B2B2B";
const MUTED = "#5B6B8A";
const ROW_BORDER = "#F0F3F8";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lesson: PupilLessonHistoryEntry | null;
  pupilId: string;
  pupilName: string;
}

function fmtTime(t: string | null) {
  if (!t) return "";
  try {
    return format(parse(t.slice(0, 5), "HH:mm", new Date()), "h:mm a");
  } catch {
    return t;
  }
}

export function PreviousLessonModal({ open, onOpenChange, lesson, pupilId, pupilName }: Props) {
  const navigate = useNavigate();
  if (!lesson) return null;
  const dateLabel = (() => {
    try {
      return format(new Date(lesson.lesson_date), "EEEE d MMMM yyyy");
    } catch {
      return lesson.lesson_date;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-left" style={{ fontSize: 16, color: CHARCOAL }}>
            {pupilName}
          </DialogTitle>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
            {dateLabel}
            {lesson.start_time ? ` · ${fmtTime(lesson.start_time)}` : ""} · {lesson.duration_minutes} min
          </div>
        </DialogHeader>

        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {lesson.rating != null && (
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  strokeWidth={2}
                  color={i < (lesson.rating || 0) ? "#F5A623" : "#D9DEE8"}
                  fill={i < (lesson.rating || 0) ? "#F5A623" : "none"}
                />
              ))}
            </div>
          )}

          {lesson.skills_practiced.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <ClipboardList size={12} /> Topics covered
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {lesson.skills_practiced.map((s, i) => (
                  <span
                    key={`${s}-${i}`}
                    style={{
                      background: BLUE_TINT,
                      color: BLUE,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lesson.notes && (
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <StickyNote size={12} /> Notes
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: CHARCOAL,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  background: "#FAFBFD",
                  border: `0.5px solid ${ROW_BORDER}`,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                {lesson.notes}
              </div>
            </div>
          )}

          {lesson.next_lesson_plan && (
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
                Plan for next lesson
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: CHARCOAL,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  background: BLUE_TINT,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                {lesson.next_lesson_plan}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate(`/instructor/pupils/${pupilId}`);
            }}
            style={{
              marginTop: 4,
              background: BLUE,
              color: "#FFF",
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            Open pupil profile <ArrowRight size={14} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
