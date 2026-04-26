import { X } from "lucide-react";

interface CloseButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export function CloseButton({ onClick, ariaLabel = "Close" }: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "#F2F2F4",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: 0,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <X size={16} strokeWidth={1.8} color="#6E6E73" />
    </button>
  );
}
