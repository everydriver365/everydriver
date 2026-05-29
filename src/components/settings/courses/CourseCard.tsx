import { Pencil } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { tokens, type CourseRow } from "./tokens";
import { HoursBadge, TransmissionBadge, TypeBadge } from "./Badges";
import { OfferButton, CourseToggle } from "./Controls";
import { useIsMobile } from "@/hooks/use-mobile";

const ACCENT: Record<string, string> = {
  intensive: tokens.red,
  semi_intensive: tokens.blue,
  weekly: tokens.blue,
};

interface Props {
  course: CourseRow;
  onToggle: () => void;
  onEdit: () => void;
  onOffer: () => void;
}

export function CourseCard({ course, onToggle, onEdit, onOffer }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.id });
  const accent = !course.visible ? tokens.border : (ACCENT[course.type] ?? tokens.blue);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        borderRadius: 12,
        background: tokens.white,
        border: `1px solid ${tokens.border}`,
        overflow: "hidden",
        marginBottom: 8,
        opacity: isDragging ? 0.8 : course.visible ? 1 : 0.6,
        boxShadow: isDragging ? "0 8px 24px rgba(15,32,68,0.12)" : "none",
      }}
    >
      <div style={{ height: 3, background: accent }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          style={{ display: "flex", flexDirection: "column", gap: 3, cursor: "grab", padding: "0 4px", touchAction: "none" }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 16, height: 2, background: tokens.disabled, borderRadius: 1 }} />
          ))}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: tokens.navy, overflow: "hidden", textOverflow: "ellipsis" }}>
              {course.name}
            </span>
            <HoursBadge hours={course.hours} disabled={!course.visible} />
            <TransmissionBadge type={course.transmission} />
            <TypeBadge type={course.type} />
          </div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6, marginTop: 4,
              fontSize: 12, color: course.visible ? tokens.green : tokens.muted,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 3, background: course.visible ? tokens.green : tokens.disabled }} />
            {course.visible ? "Visible to pupils" : "Hidden from pupils"}
          </div>
        </div>

        {/* Price */}
        {course.price != null && course.price > 0 && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: tokens.navy }}>
              £{course.price.toLocaleString()}
            </div>
            {course.priceSubLabel && (
              <div style={{ fontSize: 11, color: tokens.muted }}>{course.priceSubLabel}</div>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <OfferButton active={course.hasOffer} disabled={!course.visible} onPress={onOffer} />
          <button
            type="button"
            aria-label="Edit course"
            onClick={onEdit}
            style={{
              width: 32, height: 32, borderRadius: 7,
              border: `1.5px solid ${tokens.border}`, background: tokens.white,
              color: tokens.muted, display: "inline-flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <Pencil size={14} />
          </button>
          <CourseToggle value={course.visible} onChange={onToggle} />
        </div>
      </div>
    </div>
  );
}
