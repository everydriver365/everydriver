import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Plus } from "lucide-react";
import { TodayScheduleView } from "@/components/instructor/TodayScheduleView";
import { TomorrowScheduleView } from "@/components/instructor/TomorrowScheduleView";
import { GapsFiller } from "@/components/instructor/GapsFiller";

type Tab = "today" | "tomorrow" | "gaps";

interface Props {
  instructorId: string;
  todayCount: number;
  onAddLesson: () => void;
}

export function TodaySchedulePanel({ instructorId, todayCount, onAddLesson }: Props) {
  const [tab, setTab] = useState<Tab>("today");

  const TABS: { id: Tab; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "gaps", label: "Fill Gaps" },
  ];

  return (
    <div className="d2-card" style={{ padding: 16, height: "100%" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)", margin: 0 }}>
          Today's schedule
        </h2>
        <Link
          to="/instructor/schedule"
          style={{ fontSize: 12, color: "var(--d2-indigo)", fontWeight: 500 }}
        >
          View calendar →
        </Link>
      </div>

      {/* Segmented tabs */}
      <div
        className="flex gap-1"
        style={{
          padding: 3,
          background: "var(--d2-surface-soft)",
          border: "0.5px solid var(--d2-border)",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 transition-colors"
            style={{
              padding: "5px 10px",
              fontSize: 12, fontWeight: 500,
              borderRadius: 6,
              background: tab === t.id ? "var(--d2-surface)" : "transparent",
              color: tab === t.id ? "var(--d2-text-1)" : "var(--d2-text-2)",
              border: tab === t.id ? "0.5px solid var(--d2-border)" : "0.5px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "today" && (
          todayCount === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ padding: "32px 16px", gap: 12 }}
            >
              <Calendar size={32} style={{ color: "var(--d2-text-3)" }} strokeWidth={1.5} />
              <p style={{ fontSize: 13, color: "var(--d2-text-2)", margin: 0 }}>
                No lessons scheduled for today
              </p>
              <button
                onClick={onAddLesson}
                className="flex items-center gap-1.5 transition-colors"
                style={{
                  background: "var(--d2-indigo-bg)",
                  color: "var(--d2-indigo)",
                  fontSize: 12, fontWeight: 500,
                  padding: "6px 12px",
                  borderRadius: 8,
                }}
              >
                <Plus size={13} /> Add lesson
              </button>
            </div>
          ) : (
            <TodayScheduleView instructorId={instructorId} />
          )
        )}
        {tab === "tomorrow" && <TomorrowScheduleView instructorId={instructorId} />}
        {tab === "gaps" && <GapsFiller instructorId={instructorId} />}
      </div>
    </div>
  );
}
