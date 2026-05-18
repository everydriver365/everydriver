import { Calendar, Loader2 } from "lucide-react";
import { lessonsTokens as t, cardShadow } from "./tokens";
import { UpcomingLessonCard } from "./UpcomingLessonCard";

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
  lessons: Lesson[];
  loading: boolean;
  instructorPhone: string | null;
  cancelNoticeHours?: number;
  canCancel: (lesson: Lesson) => boolean;
  canReschedule: (lesson: Lesson) => boolean;
  onViewSlots: () => void;
  onCancel: (lesson: Lesson) => void;
  onReschedule: (lesson: Lesson) => void;
}

function UpcomingEmptyState({ onViewSlots }: { onViewSlots: () => void }) {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{
        backgroundColor: t.white,
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        boxShadow: cardShadow,
        padding: '32px 24px',
        fontFamily: 'Poppins, system-ui, sans-serif',
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: t.surface,
          marginBottom: 14,
        }}
      >
        <Calendar size={24} color={t.disabled} strokeWidth={1.8} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: t.navy, marginBottom: 5 }}>
        No upcoming lessons
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 300,
          color: t.muted,
          lineHeight: '20px',
          marginBottom: 20,
          maxWidth: 220,
        }}
      >
        Browse your instructor's diary to find an available slot and get started
      </div>
      <button
        type="button"
        onClick={onViewSlots}
        className="flex items-center gap-2"
        style={{
          backgroundColor: t.navy,
          color: t.white,
          borderRadius: 10,
          padding: '12px 24px',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <Calendar size={14} strokeWidth={1.8} />
        View available slots
      </button>
    </div>
  );
}

export function UpcomingLessonsSection({
  lessons,
  loading,
  instructorPhone,
  cancelNoticeHours,
  canCancel,
  canReschedule,
  onViewSlots,
  onCancel,
  onReschedule,
}: Props) {
  return (
    <div className="flex flex-col gap-2.5" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
      <div className="flex items-center justify-between" style={{ paddingLeft: 2, paddingRight: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: t.navy }}>Upcoming Lessons</span>
        <span
          style={{
            backgroundColor: t.blueLight,
            color: t.blue,
            borderRadius: 20,
            padding: '2px 9px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {lessons.length} booked
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin" color={t.blue} />
        </div>
      ) : lessons.length === 0 ? (
        <UpcomingEmptyState onViewSlots={onViewSlots} />
      ) : (
        lessons.map((lesson) => (
          <UpcomingLessonCard
            key={lesson.id}
            lesson={lesson}
            instructorPhone={instructorPhone}
            canCancel={canCancel(lesson)}
            canReschedule={canReschedule(lesson)}
            cancelNoticeHours={cancelNoticeHours}
            onCancel={() => onCancel(lesson)}
            onReschedule={() => onReschedule(lesson)}
          />
        ))
      )}
    </div>
  );
}
