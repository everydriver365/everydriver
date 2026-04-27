import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";

export type ReadReceiptStatus = "sending" | "sent" | "delivered" | "read" | "failed";

interface Props {
  status: ReadReceiptStatus;
  onRetry?: () => void;
}

export function ReadReceipt({ status, onRetry }: Props) {
  if (status === "failed") {
    return (
      <button
        type="button"
        onClick={onRetry}
        aria-label="Failed to send. Tap to retry."
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: onRetry ? "pointer" : "default",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <AlertCircle size={12} strokeWidth={2} color="#C8434F" />
      </button>
    );
  }
  if (status === "sending") {
    return <Clock size={12} strokeWidth={1.6} color="rgba(255,255,255,0.75)" aria-label="Sending" />;
  }
  if (status === "read") {
    return <CheckCheck size={13} strokeWidth={1.6} color="#FFFFFF" aria-label="Read" />;
  }
  if (status === "delivered") {
    return <CheckCheck size={13} strokeWidth={1.6} color="rgba(255,255,255,0.75)" aria-label="Delivered" />;
  }
  // sent
  return <Check size={13} strokeWidth={1.6} color="rgba(255,255,255,0.75)" aria-label="Sent" />;
}
