import { Search, Mic, SlidersHorizontal } from "lucide-react";
import { useRef } from "react";
import { paymentsTokens as t, poppins } from "./tokens";

interface Props {
  query: string;
  onChangeQuery: (v: string) => void;
  onFilter: () => void;
}

export function PaymentsSearchRow({ query, onChangeQuery, onFilter }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: poppins }}>
      <div style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 11,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <Search size={14} color={t.placeholder} strokeWidth={1.8} />
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          placeholder="Search payments…"
          style={{
            width: "100%",
            border: `1.5px solid ${t.border}`,
            borderRadius: 10,
            padding: "10px 36px 10px 34px",
            fontSize: 13,
            fontWeight: 400,
            color: t.navy,
            backgroundColor: t.white,
            fontFamily: poppins,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => inputRef.current?.focus()}
          aria-label="Voice search"
          style={{
            position: "absolute",
            right: 11,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Mic size={13} color={t.placeholder} strokeWidth={1.8} />
        </button>
      </div>
      <button
        onClick={onFilter}
        aria-label="Filter"
        style={{
          width: 40,
          height: 40,
          border: `1.5px solid ${t.border}`,
          borderRadius: 10,
          backgroundColor: t.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <SlidersHorizontal size={14} color={t.mid} strokeWidth={1.8} />
      </button>
    </div>
  );
}
