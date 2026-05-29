import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CourseRow } from "@/components/settings/courses/tokens";

interface Props {
  courses: CourseRow[];
  activeCount: number;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  saving: boolean;
  onToggle: (id: string) => void;
  onReorder: (next: CourseRow[]) => void;
  onEdit: (id: string) => void;
  onOffer: (id: string) => void;
  onAdd: () => void;
  onSave: () => void;
}

const C = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  divider: "#F3F4F6",
  ink: "#0A0E27",
  mid: "#6B7280",
  muted: "#9CA3AF",
  blue: "#1A6FD4",
  blueBg: "#DBEAFE",
  blueInfoBg: "#EFF6FF",
  blueInfoBorder: "#BFDBFE",
  red: "#D12E2E",
  redBg: "#FEE2E2",
  green: "#10B981",
  greenText: "#059669",
  greyBg: "#F3F4F6",
};

function typeColors(t: CourseRow["type"]) {
  if (t === "intensive") return { bg: C.redBg, fg: C.red, label: "Intensive" };
  if (t === "semi_intensive") return { bg: C.blueBg, fg: C.blue, label: "Semi-intensive" };
  return { bg: C.greyBg, fg: C.ink, label: "Weekly" };
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 24,
        background: on ? C.green : C.border, border: "none", padding: 0,
        cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
        minWidth: 44, minHeight: 44,
        display: "inline-flex", alignItems: "center",
      }}
    >
      <span
        style={{
          position: "absolute", top: 2, left: on ? 22 : 2,
          width: 20, height: 20, borderRadius: 10, background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s",
        }}
      />
    </button>
  );
}

function MobileCard({
  course, onToggle, onEdit, onOffer,
}: { course: CourseRow; onToggle: () => void; onEdit: () => void; onOffer: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.id });
  const t = typeColors(course.type);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden",
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          style={{
            display: "flex", flexDirection: "column", gap: 4,
            flexShrink: 0, touchAction: "none", cursor: "grab",
            padding: "10px 2px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ display: "block", width: 20, height: 2, background: C.ink, opacity: 0.25, borderRadius: 1 }} />
          ))}
        </div>

        {/* Hours badge */}
        <div
          style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: t.bg, color: t.fg,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", lineHeight: 1,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800 }}>{course.hours ?? "—"}</span>
          <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, marginTop: 2 }}>hrs</span>
        </div>

        {/* Info — tap to edit */}
        <button
          type="button"
          onClick={onEdit}
          style={{
            flex: 1, minWidth: 0, background: "none", border: "none", padding: 0,
            textAlign: "left", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 5, lineHeight: 1.1 }}>
            {course.price != null ? `£${course.price.toLocaleString()}` : "—"}
          </div>
          <span
            style={{
              display: "inline-block",
              background: t.bg, color: t.fg,
              fontSize: 11, fontWeight: 700,
              padding: "3px 10px", borderRadius: 20,
              textTransform: "uppercase", letterSpacing: 0.3,
            }}
          >
            {t.label}
          </span>
        </button>

        {/* Toggle */}
        <Toggle on={course.visible} onChange={onToggle} />
      </div>

      <div
        style={{
          borderTop: `1px solid ${C.divider}`,
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          minHeight: 44,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: 4,
              background: course.visible ? C.green : C.muted,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: course.visible ? 600 : 500,
              color: course.visible ? C.greenText : C.muted,
            }}
          >
            {course.visible ? "Visible to pupils" : "Hidden from pupils"}
          </span>
        </div>
        <button
          type="button"
          onClick={onOffer}
          style={{
            background: "#fff",
            border: `1.5px solid ${course.hasOffer ? C.blue : C.border}`,
            color: course.hasOffer ? C.blue : C.ink,
            borderRadius: 8, padding: "9px 16px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            minHeight: 44,
          }}
        >
          🏷 {course.hasOffer ? "Offer active" : "Add offer"}
        </button>
      </div>
    </div>
  );
}

export function MobileHowPupilsBookView({
  courses, activeCount, loading, error, isDirty, saving,
  onToggle, onReorder, onEdit, onOffer, onAdd, onSave,
}: Props) {
  const navigate = useNavigate();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = courses.findIndex((c) => c.id === active.id);
    const newIndex = courses.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...courses];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onReorder(next.map((c, i) => ({ ...c, order: i })));
  };

  const saveActive = isDirty && !saving;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Poppins, inherit" }}>
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        {/* Top nav */}
        <div
          style={{
            position: "sticky", top: 0, zIndex: 10,
            background: "#fff", borderBottom: `3px solid ${C.red}`,
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/instructor/settings")}
            style={{
              background: "none", border: "none", padding: 0,
              color: C.blue, fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ← All settings
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ color: C.ink, fontSize: 15, fontWeight: 800, textAlign: "right" }}>
            How pupils book
          </span>
        </div>

        {/* Header card */}
        <div
          style={{
            margin: "16px 16px 0",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16, padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: C.blueBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}
            >
              📋
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ color: C.ink, fontSize: 17, fontWeight: 800, margin: 0, marginBottom: 5, lineHeight: 1.25 }}>
                How pupils book
              </h1>
              <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Choose the courses, prices and rules pupils see when booking with you.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onAdd}
              style={{
                flex: 1, background: "#fff", border: `2px solid ${C.blue}`,
                color: C.blue, fontSize: 14, fontWeight: 700,
                padding: "13px 16px", borderRadius: 10,
                cursor: "pointer", fontFamily: "inherit", minHeight: 44,
              }}
            >
              + Add course
            </button>
            <button
              type="button"
              onClick={saveActive ? onSave : undefined}
              disabled={!saveActive}
              style={{
                flex: 1,
                background: saveActive ? C.blue : C.border,
                color: saveActive ? "#fff" : C.muted,
                fontSize: 14, fontWeight: 700,
                padding: "13px 16px", borderRadius: 10,
                border: "none", fontFamily: "inherit",
                cursor: saveActive ? "pointer" : "not-allowed",
                minHeight: 44,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save changes"}
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div
          style={{
            margin: "14px 16px 0",
            background: C.blueInfoBg,
            border: `1px solid ${C.blueInfoBorder}`,
            borderLeft: `4px solid ${C.blue}`,
            borderRadius: 12, padding: 16,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}
        >
          <div
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: C.blue, color: "#fff",
              fontSize: 15, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            i
          </div>
          <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
            You currently offer{" "}
            <strong style={{ color: C.blue, fontWeight: 700 }}>
              {activeCount} active course{activeCount === 1 ? "" : "s"}
            </strong>
            {" "}— pupils searching your area will only see courses you've enabled.
          </div>
        </div>

        {/* Section heading */}
        <h2 style={{ color: C.ink, fontSize: 16, fontWeight: 800, padding: "20px 16px 4px", margin: 0 }}>
          Courses you offer
        </h2>
        <p style={{ color: C.mid, fontSize: 12, lineHeight: 1.6, padding: "6px 16px 14px", margin: 0 }}>
          Toggle, price and reorder your lesson types. Drag rows to change the order pupils see them.
        </p>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 className="animate-spin" style={{ color: C.muted }} />
          </div>
        ) : error ? (
          <div
            style={{
              margin: "0 16px",
              padding: 16, borderRadius: 12,
              background: C.redBg, color: C.red, fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : courses.length === 0 ? (
          <div
            style={{
              margin: "0 16px",
              padding: 24, borderRadius: 12,
              background: "#fff", border: `1px dashed ${C.border}`,
              color: C.mid, fontSize: 13, textAlign: "center",
            }}
          >
            No courses yet — add one to get started.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={courses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px 40px" }}>
                {courses.map((course) => (
                  <MobileCard
                    key={course.id}
                    course={course}
                    onToggle={() => onToggle(course.id)}
                    onEdit={() => onEdit(course.id)}
                    onOffer={() => onOffer(course.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
