import { Check, Clock, CalendarPlus, MessageSquare } from "lucide-react";

const FONT_STACK =
  'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export interface SlotPickerRowSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  dayLabel: string;
  dateLabel: string;
  durationPill: string;
  durationLabel?: string;
}

export interface SlotPickerRowProps {
  slot: SlotPickerRowSlot;
  isSelected: boolean;
  onToggle: () => void;
  highlighted?: boolean;
  /** When provided, shows a Book pill that books this slot directly. */
  onBook?: () => void;
  /** True when travel ETA for this slot came from the fallback (not real routing). */
  etaEstimated?: boolean;
}

/**
 * Mobile slot card — visual redesign only.
 * Selection and book handlers are unchanged.
 */
export function SlotPickerRow({
  slot,
  isSelected,
  onToggle,
  highlighted,
  onBook,
  etaEstimated,
}: SlotPickerRowProps) {
  const [dayNum, ...monthParts] = slot.dateLabel.split(" ");
  const monthLabel = monthParts.join(" ");

  return (
    <div
      style={{
        width: "100%",
        background: isSelected ? "#f8f9fb" : "#ffffff",
        border: `1px solid ${isSelected ? "#2952b3" : "#e0e3ea"}`,
        borderRadius: 13,
        fontFamily: FONT_STACK,
        outline: highlighted ? "2px solid #34C759" : "none",
        outlineOffset: highlighted ? 1 : 0,
        transition: "background 140ms ease, border-color 140ms ease",
        WebkitTapHighlightColor: "transparent",
        overflow: "hidden",
      }}
    >
      {/* Top tappable section */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "12px 13px",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: FONT_STACK,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Date box */}
        <div
          aria-hidden="true"
          style={{
            width: 42,
            borderRadius: 9,
            background: "#fbe8e8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: "5px 0 6px",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "#c9302c",
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {slot.dayLabel}
          </span>
          <span
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: "#1a1a1f",
              letterSpacing: -0.5,
              marginTop: 3,
            }}
          >
            {dayNum}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "#888888",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginTop: 3,
            }}
          >
            {monthLabel}
          </span>
        </div>

        {/* Time + tags */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1a1a1f",
              lineHeight: 1.15,
              whiteSpace: "nowrap",
            }}
          >
            {slot.startTime} – {slot.endTime}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 9,
                fontWeight: 600,
                color: "#6b4fc4",
                background: "#f0edfb",
                padding: "3px 7px",
                borderRadius: 20,
              }}
            >
              <Clock size={9} strokeWidth={2.4} color="#6b4fc4" />
              {slot.durationPill} slot
            </span>
            {etaEstimated && (
              <span
                aria-label="Estimated travel time"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#888888",
                  background: "#F2F4F8",
                  border: "1px solid #e0e3ea",
                  padding: "3px 7px",
                  borderRadius: 20,
                  letterSpacing: 0.2,
                }}
              >
                Est.
              </span>
            )}
          </div>
        </div>

        {/* Checkbox */}
        <span
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: isSelected ? "#2952b3" : "#ffffff",
            border: `1.5px solid ${isSelected ? "#2952b3" : "#d0d3d8"}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxSizing: "border-box",
            transition: "background 140ms ease, border-color 140ms ease",
          }}
        >
          {isSelected && (
            <Check
              size={13}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              color="#ffffff"
            />
          )}
        </span>
      </button>

      {/* Bottom action row */}
      {onBook && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderTop: "1px solid #f0f1f4",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fb";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              borderRight: "1px solid #f0f1f4",
              padding: "10px 8px",
              fontSize: 11,
              fontWeight: 600,
              color: "#1a1a1f",
              cursor: "pointer",
              fontFamily: FONT_STACK,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <MessageSquare size={12} strokeWidth={2.2} color="#1a1a1f" />
            {isSelected ? "Selected" : "Add to message"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fb";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              padding: "10px 8px",
              fontSize: 11,
              fontWeight: 600,
              color: "#2952b3",
              cursor: "pointer",
              fontFamily: FONT_STACK,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <CalendarPlus size={12} strokeWidth={2.2} color="#2952b3" />
            Book now
          </button>
        </div>
      )}
    </div>
  );
}
