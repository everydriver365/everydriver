import { Check } from "lucide-react";

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

export function SlotPickerRow({
  slot,
  isSelected,
  onToggle,
  highlighted,
  onBook,
}: SlotPickerRowProps) {
  return (
    <div
      style={{
        width: "100%",
        background: isSelected ? "#E6F1FB" : "#FFFFFF",
        border: `0.5px solid ${isSelected ? "#2B7BC8" : "#E5E5EA"}`,
        borderRadius: 10,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONT_STACK,
        outline: highlighted ? "2px solid #34C759" : "none",
        outlineOffset: highlighted ? 1 : 0,
        transition: "background 120ms ease, border-color 120ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        onClick={onToggle}
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "transparent",
          border: "none",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          fontFamily: FONT_STACK,
        }}
      >
        {/* Checkbox */}
        <span
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: isSelected ? "#2B7BC8" : "#FFFFFF",
            border: isSelected ? "none" : "1.5px solid #C7C7CC",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isSelected && (
            <Check size={11} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" color="#FFFFFF" />
          )}
        </span>

        {/* Date block */}
        <div style={{ flexShrink: 0, minWidth: 56 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#6E6E73",
              letterSpacing: 0.2,
              textTransform: "uppercase",
              lineHeight: 1.1,
            }}
          >
            {slot.dayLabel}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#000000",
              letterSpacing: -0.2,
              lineHeight: 1.15,
              marginTop: 2,
            }}
          >
            {slot.dateLabel}
          </div>
        </div>

        {/* Time block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#000000",
              lineHeight: 1.2,
            }}
          >
            {slot.startTime} – {slot.endTime}
          </div>
        </div>

        {/* Duration pill */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#8A5BC9",
            background: "#F1ECFA",
            padding: "3px 8px",
            borderRadius: 999,
            flexShrink: 0,
          }}
        >
          {slot.durationPill}
        </span>
      </button>

      {onBook && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          style={{
            flexShrink: 0,
            background: "#2B7BC8",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONT_STACK,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Book
        </button>
      )}
    </div>
  );
}
