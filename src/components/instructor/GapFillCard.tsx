import { useState } from "react";
import { MessageSquare, Check } from "lucide-react";
import { GapFillSheet } from "./GapFillSheet";

interface GapFillCardProps {
  instructorId: string;
  instructorName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  gapMinutes: number;
}

export function GapFillCard({
  instructorId,
  instructorName,
  date,
  startTime,
  endTime,
  gapMinutes,
}: GapFillCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  const hours = Math.floor(gapMinutes / 60);
  const mins = gapMinutes % 60;
  const gapLabel = mins > 0 ? `${hours}h ${mins}m gap` : `${hours}h gap`;

  return (
    <>
      <div
        style={{
          position: "relative",
          backgroundColor: "#FFF5F5",
          borderRadius: 12,
          border: "1px dashed #FCA5A5",
          padding: "10px 12px",
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "2px 0",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#991B1B", fontFamily: "Inter, sans-serif" }}>
            {gapLabel}
          </div>
          <div style={{ fontSize: 11, color: "#9A3412", fontFamily: "Inter, sans-serif" }}>
            {startTime} – {endTime}
          </div>
        </div>

        {sentCount !== null ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: "#15803D",
              padding: "6px 10px",
            }}
          >
            <Check style={{ width: 14, height: 14 }} />
            Sent to {sentCount}
          </div>
        ) : (
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 1px 3px rgba(220, 38, 38, 0.3)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <MessageSquare style={{ width: 13, height: 13 }} />
            Text Pupils
          </button>
        )}
      </div>

      <GapFillSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        instructorId={instructorId}
        instructorName={instructorName}
        date={date}
        startTime={startTime}
        endTime={endTime}
        onSent={(c) => setSentCount(c)}
      />
    </>
  );
}
