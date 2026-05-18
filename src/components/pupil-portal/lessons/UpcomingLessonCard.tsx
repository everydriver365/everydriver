import { Calendar, MapPin, Phone, MessageSquare, RefreshCw, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { lessonsTokens as t, cardShadow } from "./tokens";

interface Lesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pickup_location: string | null;
  lesson_type: string;
  payment_status: string;
  booking_status: string | null;
}

interface Props {
  lesson: Lesson;
  instructorPhone: string | null;
  canCancel: boolean;
  canReschedule: boolean;
  cancelNoticeHours?: number;
  onCancel: () => void;
  onReschedule: () => void;
}

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m}${ampm}`;
};

const formatEnd = (timeStr: string, durationMinutes: number) => {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  const ampm = eh >= 12 ? "pm" : "am";
  const displayHour = eh % 12 || 12;
  return `${displayHour}:${em.toString().padStart(2, "0")}${ampm}`;
};

const durationLabel = (mins: number) => {
  const h = mins / 60;
  return `${h % 1 === 0 ? h : h.toFixed(1)} hour`;
};

export function UpcomingLessonCard({
  lesson,
  instructorPhone,
  canCancel,
  canReschedule,
  cancelNoticeHours,
  onCancel,
  onReschedule,
}: Props) {
  const lessonDate = parseISO(lesson.lesson_date);
  const isToday = format(lessonDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const dateLabel = isToday ? "Today" : format(lessonDate, "EEE d MMM");
  const isPending = lesson.booking_status === "pending_approval";
  const isPaid = lesson.payment_status === "paid";

  return (
    <div
      style={{
        backgroundColor: t.white,
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        boxShadow: cardShadow,
        overflow: "hidden",
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <div style={{ padding: 14 }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div style={{ fontSize: 14, fontWeight: 700, color: t.navy }}>{dateLabel}</div>
            <div style={{ fontSize: 12, fontWeight: 300, color: t.muted, marginTop: 2 }}>
              {formatTime(lesson.start_time)} – {formatEnd(lesson.start_time, lesson.duration_minutes)} · {durationLabel(lesson.duration_minutes)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {isPending && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: t.amber,
                  backgroundColor: t.amberLight,
                  padding: '3px 8px',
                  borderRadius: 20,
                }}
              >
                Awaiting approval
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: isPaid ? t.green : t.mid,
                backgroundColor: isPaid ? t.greenLight : t.surface,
                padding: '3px 8px',
                borderRadius: 20,
              }}
            >
              {isPaid ? 'Paid' : 'Unpaid'}
            </span>
          </div>
        </div>

        {lesson.pickup_location && (
          <div className="flex items-center gap-1.5 mb-3" style={{ color: t.charcoal, fontSize: 12 }}>
            <MapPin size={13} color={t.muted} strokeWidth={1.8} />
            <span className="truncate">{lesson.pickup_location}</span>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {instructorPhone && (
            <>
              <a
                href={`tel:${instructorPhone}`}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[88px] no-underline"
                style={{
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: t.navy,
                  backgroundColor: t.white,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <Phone size={13} strokeWidth={1.8} />
                Call
              </a>
              <a
                href={`sms:${instructorPhone}`}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[88px] no-underline"
                style={{
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: t.navy,
                  backgroundColor: t.white,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <MessageSquare size={13} strokeWidth={1.8} />
                Text
              </a>
            </>
          )}
          {canReschedule && (
            <button
              type="button"
              onClick={onReschedule}
              className="flex items-center justify-center"
              style={{
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                padding: '8px 12px',
                color: t.blue,
                backgroundColor: t.white,
              }}
              aria-label="Reschedule lesson"
            >
              <RefreshCw size={14} strokeWidth={1.8} />
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center"
              style={{
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                padding: '8px 12px',
                color: t.red,
                backgroundColor: t.white,
              }}
              aria-label="Cancel lesson"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {!canCancel && cancelNoticeHours != null && (
          <p style={{ fontSize: 11, color: t.muted, marginTop: 8, fontWeight: 300 }}>
            Cancellations require {cancelNoticeHours}h notice
          </p>
        )}
      </div>
    </div>
  );
}
