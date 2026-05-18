import { Lock, ExternalLink, Share2, Check } from "lucide-react";
import { paymentsTokens as t, poppins } from "./tokens";

interface Props {
  onPayNow: () => void;
  onShare: () => void;
  copied?: boolean;
  disabled?: boolean;
}

export function PayNowCard({ onPayNow, onShare, copied, disabled }: Props) {
  return (
    <div
      style={{
        backgroundColor: t.white,
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(15,32,68,0.05)",
        fontFamily: poppins,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${t.divider}`,
        }}
      >
        <Lock size={13} color={t.muted} strokeWidth={1.8} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: t.muted,
            letterSpacing: 0.7,
            textTransform: "uppercase",
          }}
        >
          Pay securely online
        </span>
      </div>
      <div style={{ padding: 16 }}>
        <button
          onClick={onPayNow}
          disabled={disabled}
          style={{
            width: "100%",
            backgroundColor: t.red,
            borderRadius: 10,
            padding: 13,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 12,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            fontFamily: poppins,
          }}
        >
          <ExternalLink size={15} color="#FFF" strokeWidth={1.8} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#FFF" }}>Pay Now</span>
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: t.surface,
            borderRadius: 9,
            padding: "10px 12px",
          }}
        >
          <button
            onClick={onShare}
            aria-label="Share payment link"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              backgroundColor: t.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            {copied ? (
              <Check size={14} color={t.green} strokeWidth={2} />
            ) : (
              <Share2 size={14} color={t.mid} strokeWidth={1.8} />
            )}
          </button>
          <span
            style={{
              fontSize: 12,
              fontWeight: 300,
              color: t.muted,
              lineHeight: "18px",
              flex: 1,
            }}
          >
            Share this link with a parent or guardian to pay on your behalf
          </span>
        </div>
      </div>
    </div>
  );
}
