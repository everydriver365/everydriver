import { X } from "lucide-react";

export interface CloseButtonProps {
  onPress: () => void;
  ariaLabel?: string;
}

/**
 * Premium-system circular close button used in modals and sheets.
 * 32px circle, #F2F2F4 background, 14px line-style X at 1.8px stroke, #6E6E73.
 */
export function CloseButton({ onPress, ariaLabel = "Close" }: CloseButtonProps) {
  return (
    <button
      onClick={onPress}
      aria-label={ariaLabel}
      style={{
        background: "#F2F2F4",
        border: "none",
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      <X
        size={14}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        color="#6E6E73"
      />
    </button>
  );
}
