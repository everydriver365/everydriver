import { Download } from "lucide-react";
import { paymentsTokens as t, poppins } from "./tokens";

interface Props {
  count: number;
  onExport: () => void;
}

export function PaymentsResultsBar({ count, onExport }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2px",
        fontFamily: poppins,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: t.muted }}>
        {count} payment{count !== 1 ? "s" : ""}
      </span>
      <button
        onClick={onExport}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: poppins,
        }}
      >
        <Download size={12} color={t.blue} strokeWidth={1.8} />
        <span style={{ fontSize: 12, fontWeight: 500, color: t.blue }}>Export CSV</span>
      </button>
    </div>
  );
}
