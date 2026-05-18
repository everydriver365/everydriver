import { CheckCircle2 } from "lucide-react";
import { tokens, type CourseRow } from "./tokens";
import { CourseList } from "./CourseList";

interface Props {
  courses: CourseRow[];
  activeCount: number;
  onToggle: (id: string) => void;
  onReorder: (next: CourseRow[]) => void;
  onEdit: (id: string) => void;
  onOffer: (id: string) => void;
}

export function CoursesSection({ courses, activeCount, onToggle, onReorder, onEdit, onOffer }: Props) {
  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: tokens.navy, margin: 0 }}>
          Courses you offer
        </h2>
        <p style={{ fontSize: 13, color: tokens.mid, margin: "4px 0 0" }}>
          Toggle, price and reorder your lesson types. Drag rows to change the order pupils see them.
        </p>
      </div>

      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 10,
          background: tokens.blueLight, marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: tokens.blue, color: tokens.white,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <CheckCircle2 size={16} />
        </div>
        <div style={{ fontSize: 13, color: tokens.navy, lineHeight: 1.4 }}>
          You currently offer{" "}
          <strong style={{ color: tokens.blue }}>
            {activeCount} active course{activeCount !== 1 ? "s" : ""}
          </strong>{" "}
          — pupils searching your area will only see courses you've enabled.
        </div>
      </div>

      {courses.length === 0 ? (
        <div
          style={{
            padding: 24, borderRadius: 12, background: tokens.surface,
            border: `1px dashed ${tokens.border}`, color: tokens.mid,
            fontSize: 13, textAlign: "center",
          }}
        >
          No courses yet — add one to get started.
        </div>
      ) : (
        <CourseList
          courses={courses}
          onToggle={onToggle}
          onReorder={onReorder}
          onEdit={onEdit}
          onOffer={onOffer}
        />
      )}
    </section>
  );
}
