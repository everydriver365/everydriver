import { Clock, Loader2 } from "lucide-react";
import { lessonsTokens as t, cardShadow } from "./tokens";
import { LessonHistoryRow, type LessonHistoryItem } from "./LessonHistoryRow";

interface Props {
  lessons: LessonHistoryItem[];
  loading: boolean;
  onViewAll: () => void;
}

export function LessonHistorySection({ lessons, loading, onViewAll }: Props) {
  const completedCount = lessons.filter((l) => l.status === "completed").length;

  return (
    <div className="flex flex-col gap-2.5" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
      <div className="flex items-center justify-between" style={{ paddingLeft: 2, paddingRight: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: t.navy }}>Lesson History</span>
        <span
          style={{
            backgroundColor: t.surfaceAlt,
            color: t.mid,
            borderRadius: 20,
            padding: '2px 9px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {completedCount} completed
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin" color={t.blue} />
        </div>
      ) : lessons.length === 0 ? (
        <div
          style={{
            backgroundColor: t.white,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            boxShadow: cardShadow,
            padding: '24px 16px',
            textAlign: 'center',
            fontSize: 13,
            color: t.muted,
            fontWeight: 300,
          }}
        >
          No past lessons yet
        </div>
      ) : (
        <div
          style={{
            backgroundColor: t.white,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            boxShadow: cardShadow,
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center gap-[7px]"
            style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${t.divider}` }}
          >
            <Clock size={13} color={t.muted} strokeWidth={1.8} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: t.muted,
                letterSpacing: '0.7px',
                textTransform: 'uppercase',
              }}
            >
              Past lessons
            </span>
          </div>

          {lessons.map((lesson, i) => (
            <LessonHistoryRow key={lesson.id} lesson={lesson} isLast={i === lessons.length - 1} />
          ))}
        </div>
      )}

      <div className="flex justify-center" style={{ paddingTop: 4, paddingBottom: 8 }}>
        <button
          type="button"
          onClick={onViewAll}
          style={{
            border: `1.5px solid ${t.border}`,
            borderRadius: 20,
            padding: '8px 20px',
            backgroundColor: t.white,
            color: t.mid,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          View all history
        </button>
      </div>
    </div>
  );
}
