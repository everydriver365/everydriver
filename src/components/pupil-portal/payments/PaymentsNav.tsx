import { ChevronLeft } from "lucide-react";
import { paymentsTokens as t, poppins } from "./tokens";

interface Props {
  instructorName: string;
  centre?: string | null;
  onBack: () => void;
}

export function PaymentsNav({ instructorName, centre, onBack }: Props) {
  return (
    <div
      style={{
        backgroundColor: t.navy,
        padding: "14px 20px 0",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: poppins,
      }}
    >
      <button
        onClick={onBack}
        aria-label="Back"
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: "rgba(255,255,255,0.1)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <ChevronLeft size={15} color="#FFF" strokeWidth={2.2} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#FFF",
            letterSpacing: -0.3,
            lineHeight: 1.2,
          }}
        >
          Payments
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 300,
            color: "rgba(255,255,255,0.45)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {instructorName}
          {centre ? ` · ${centre}` : ""}
        </div>
      </div>
    </div>
  );
}
