import { Check, XCircle, RotateCcw } from "lucide-react";
import { lessonsTokens as t } from "./tokens";

export interface LessonHistoryItem {
  id: string;
  status: "completed" | "cancelled";
  dateFormatted: string;
  timeFormatted: string;
  durationLabel: string;
  durationMinutes?: number;
}

interface Props {
  lesson: LessonHistoryItem;
  isLast: boolean;
  onBookAgain?: (durationMinutes: number) => void;
}

export function LessonHistoryRow({ lesson, isLast, onBookAgain }: Props) {
  const isCompleted = lesson.status === "completed";
  const isCancelled = lesson.status === "cancelled";

  const iconBg = isCompleted ? t.greenLight : t.redLight;
  const iconColor = isCompleted ? t.green : t.red;
  const statusColor = isCompleted ? t.green : t.red;
  const statusLabel = isCompleted ? "Completed" : "Cancelled";
  const StatusIcon = isCompleted ? Check : XCircle;

  const showBookAgain = !!onBookAgain && !!lesson.durationMinutes;

  return (
    <div
      className="flex items-start gap-3"
      style={{
        padding: '13px 16px',
        borderBottom: isLast ? "none" : `1px solid ${t.divider}`,
        opacity: isCancelled ? 0.65 : 1,
        fontFamily: 'Poppins, system-ui, sans-serif',
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: iconBg,
          marginTop: 1,
        }}
      >
        <StatusIcon size={14} color={iconColor} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 600, color: t.navy, marginBottom: 2 }}>
          {lesson.durationLabel} lesson
        </div>
        <div style={{ fontSize: 12, fontWeight: 300, color: t.muted }}>
          {lesson.dateFormatted} · {lesson.timeFormatted}
        </div>
        <div className="flex items-center gap-1" style={{ marginTop: 5 }}>
          <StatusIcon size={9} color={statusColor} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 500, color: statusColor }}>{statusLabel}</span>
        </div>
      </div>

      {showBookAgain && (
        <button
          type="button"
          onClick={() => onBookAgain!(lesson.durationMinutes!)}
          className="flex items-center gap-1 shrink-0"
          style={{
            alignSelf: 'center',
            backgroundColor: t.surface,
            color: t.navy,
            borderRadius: 20,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <RotateCcw size={11} strokeWidth={2} />
          Book again
        </button>
      )}
    </div>
  );
}
