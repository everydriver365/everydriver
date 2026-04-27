interface Props {
  replies: string[];
  onSelect: (text: string) => void;
}

export const DEFAULT_QUICK_REPLIES = [
  "On my way",
  "Running 5 min late",
  "Running 10 min late",
  "Need to reschedule",
  "See you tomorrow",
  "Confirmed, thanks",
  "Pick you up at the usual spot",
];

export function QuickReplyStrip({ replies, onSelect }: Props) {
  return (
    <div
      style={{
        padding: "8px 12px 6px",
        borderTop: "0.5px solid #E5E5EA",
        display: "flex",
        gap: 6,
        overflowX: "auto",
        flexWrap: "nowrap",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        background: "#FFFFFF",
      }}
    >
      {replies.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onSelect(r)}
          style={{
            background: "#F2F2F4",
            border: "none",
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 12,
            color: "#000000",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
