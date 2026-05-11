import { Check, Clock, CalendarPlus } from "lucide-react";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

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
}

/**
 * Mobile slot card.
 *
 * Whole card is tappable to toggle selection. A separated "Book"
 * action sits in its own row at the bottom so it's a clear, large
 * touch target without competing with the toggle gesture.
 */
export function SlotPickerRow({
  slot,
  isSelected,
  onToggle,
  highlighted,
  onBook,
}: SlotPickerRowProps) {
  // Split "11 May" -> ["11", "May"] for the calendar tile
  const [dayNum, ...monthParts] = slot.dateLabel.split(" ");
  const monthLabel = monthParts.join(" ");

  return (
    <div
      style={{
        width: "100%",
        background: isSelected ? "#E6F1FB" : "#FFFFFF",
        border: `1px solid ${isSelected ? "#2B7BC8" : "#E5E5EA"}`,
        borderRadius: 14,
        fontFamily: FONT_STACK,
        outline: highlighted ? "2px solid #34C759" : "none",
        outlineOffset: highlighted ? 1 : 0,
        boxShadow: isSelected
          ? "0 1px 2px rgba(43,123,200,0.10)"
          : "0 1px 2px rgba(0,0,0,0.03)",
        transition:
          "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
        WebkitTapHighlightColor: "transparent",
        overflow: "hidden",
      }}
    >
      {/* Tappable main area = toggle */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 14px",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: FONT_STACK,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Calendar tile */}
        <div
          aria-hidden="true"
          style={{
            width: 52,
            height: 56,
            borderRadius: 12,
            background: isSelected ? "#FFFFFF" : "#F2F2F4",
            border: `1px solid ${isSelected ? "#2B7BC8" : "#E5E5EA"}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#C8434F",
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {slot.dayLabel}
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#000000",
              letterSpacing: -0.5,
              marginTop: 2,
            }}
          >
            {dayNum}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "#6E6E73",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {monthLabel}
          </span>
        </div>

        {/* Time + duration */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#000000",
              letterSpacing: -0.4,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
            }}
          >
            {slot.startTime}–{slot.endTime}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
              fontSize: 12,
              fontWeight: 500,
              color: "#8A5BC9",
              background: "#F1ECFA",
              padding: "3px 9px",
              borderRadius: 999,
            }}
          >
            <Clock size={11} strokeWidth={2.2} color="#8A5BC9" />
            {slot.durationPill} slot
          </div>
        </div>

        {/* Selection indicator */}
        <span
          aria-hidden="true"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: isSelected ? "#2B7BC8" : "#FFFFFF",
            border: isSelected ? "none" : "1.5px solid #C7C7CC",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 140ms ease, border-color 140ms ease",
          }}
        >
          {isSelected && (
            <Check
              size={15}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              color="#FFFFFF"
            />
          )}
        </span>
      </button>

      {/* Action row */}
      {onBook && (
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderTop: `1px solid ${isSelected ? "#C8DEF2" : "#F0F0F2"}`,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              padding: "12px 12px",
              fontSize: 13,
              fontWeight: 600,
              color: isSelected ? "#2B7BC8" : "#6E6E73",
              cursor: "pointer",
              fontFamily: FONT_STACK,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isSelected ? "Selected" : "Add to message"}
          </button>
          <div style={{ width: 1, background: isSelected ? "#C8DEF2" : "#F0F0F2" }} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              padding: "12px 12px",
              fontSize: 13,
              fontWeight: 600,
              color: "#2B7BC8",
              cursor: "pointer",
              fontFamily: FONT_STACK,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <CalendarPlus size={14} strokeWidth={2.2} color="#2B7BC8" />
            Book now
          </button>
        </div>
      )}
    </div>
  );
}
