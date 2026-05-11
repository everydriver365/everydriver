import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { MultiDayScheduleView } from "@/components/instructor/MultiDayScheduleView";

interface Props {
  instructorId: string;
  todayCount: number;
  onAddLesson: () => void;
}

export function TodaySchedulePanel({ instructorId, onAddLesson }: Props) {
  return (
    <div className="d2-card" style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)", margin: 0 }}>
          Schedule
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onAddLesson}
            className="flex items-center gap-1 transition-colors"
            style={{
              background: "var(--d2-indigo-bg)",
              color: "var(--d2-indigo)",
              fontSize: 12, fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 8,
            }}
          >
            <Plus size={12} /> Add
          </button>
          <Link
            to="/instructor/schedule"
            style={{ fontSize: 12, color: "var(--d2-indigo)", fontWeight: 500 }}
          >
            View all →
          </Link>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: 560,
          overflowY: "auto",
          margin: "0 -8px",
          padding: "0 8px",
        }}
      >
        <MultiDayScheduleView instructorId={instructorId} />
      </div>
    </div>
  );
}
