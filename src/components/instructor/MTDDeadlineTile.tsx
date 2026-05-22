import { useNavigate } from "react-router-dom";
import { ChevronRight, FileText } from "lucide-react";
import { useInstructorMTDStatus } from "@/hooks/useInstructorMTDStatus";
import { getNextDeadline, getQuarterDeadlines, getCurrentTaxYear } from "@/lib/mtdDeadlines";

interface MTDDeadlineTileProps {
  instructorId: string;
}

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';
const ROUTE = "/instructor-app/mtd/dashboard";
const SETUP_ROUTE = "/instructor-app/mtd/setup";

const BASE_CARD: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #e0e3ea",
  borderRadius: 14,
  padding: 14,
  fontFamily: FONT,
  width: "100%",
  textAlign: "left",
  display: "block",
  cursor: "pointer",
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function formatShortDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}

function progressPct(start: Date, deadline: Date, now: Date): number {
  const total = deadline.getTime() - start.getTime();
  if (total <= 0) return 100;
  const elapsed = now.getTime() - start.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

export function MTDDeadlineTile({ instructorId }: MTDDeadlineTileProps) {
  const navigate = useNavigate();
  const status = useInstructorMTDStatus(instructorId);
  const go = () => navigate(ROUTE);

  // ─── Loading ────────────────────────────────────────────────────────────
  if (status.loading) {
    return (
      <div style={BASE_CARD} aria-busy="true">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={eyebrow}>MTD filing</span>
          <span style={{ fontSize: 10, color: "#8a93a4" }}>&nbsp;</span>
        </div>
        <div style={{ height: 22, marginTop: 8, background: "#F2F4F8", borderRadius: 6, width: "60%" }} />
        <div style={{ height: 10, marginTop: 8, background: "#F2F4F8", borderRadius: 4, width: "35%" }} />
      </div>
    );
  }

  // ─── Not enrolled ───────────────────────────────────────────────────────
  if (!status.enrolled) {
    return (
      <button type="button" onClick={go} style={BASE_CARD} aria-label="Set up Making Tax Digital">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#f0edfb", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FileText size={18} color="#6b4fc4" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>Making Tax Digital</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>Get MTD ready before April 2026</div>
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#2952b3", whiteSpace: "nowrap" }}>
            Set up →
          </span>
        </div>
      </button>
    );
  }

  const next = status.nextDeadline!;
  const now = new Date();

  // ─── Submitted (current quarter) ───────────────────────────────────────
  if (status.currentQuarterSubmitted) {
    // Show the *next* upcoming filing — getNextDeadline already accounts for
    // dates, but we want the quarter *after* the one just submitted. Find it
    // from the schedule.
    const all = [
      ...getQuarterDeadlines(getCurrentTaxYear(now)),
      ...getQuarterDeadlines(getCurrentTaxYear(now) + 1),
    ];
    const upcoming = all.find((q) => q.deadline.getTime() > next.deadline.getTime()) ?? next;
    return (
      <button
        type="button"
        onClick={go}
        style={{ ...BASE_CARD, background: "#e8f5ee", border: "1px solid #b9dec7" }}
        aria-label="MTD quarter submitted"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...eyebrow, color: "#2d8a4e" }}>MTD filing</span>
          <ChevronRight size={16} color="#2d8a4e" />
        </div>
        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
          {next.label} submitted ✓
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
          Next: {upcoming.label} due {formatShortDate(upcoming.deadline)}
        </div>
      </button>
    );
  }

  // ─── Enrolled, upcoming/warning/urgent/overdue ─────────────────────────
  const daysText = next.isOverdue
    ? "OVERDUE"
    : `${next.daysRemaining} day${next.daysRemaining === 1 ? "" : "s"} remaining`;

  if (next.urgency === "ok") {
    const pct = progressPct(next.periodStart, next.deadline, now);
    return (
      <button type="button" onClick={go} style={BASE_CARD} aria-label={`${next.label} MTD deadline`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={eyebrow}>MTD filing</span>
          <ChevronRight size={16} color="#9CA3AF" />
        </div>
        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, color: "#1F2937" }}>
          {next.label} due {formatDate(next.deadline)}
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{daysText}</div>
        <div style={{ marginTop: 10, height: 4, background: "#F2F4F8", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#2952b3" }} />
        </div>
      </button>
    );
  }

  if (next.urgency === "warning") {
    return (
      <button
        type="button"
        onClick={go}
        style={{
          ...BASE_CARD,
          background: "#fff8e8",
          borderLeft: "3px solid #f59e0b",
        }}
        aria-label={`${next.label} MTD deadline approaching`}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...eyebrow, color: "#92400e" }}>MTD filing</span>
          <span style={pill("#fde7b3", "#92400e")}>Due soon</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, color: "#1F2937" }}>
          {next.label} due {formatDate(next.deadline)}
        </div>
        <div style={{ fontSize: 12, color: "#b45309", marginTop: 2, fontWeight: 600 }}>{daysText}</div>
      </button>
    );
  }

  // urgent or overdue
  return (
    <button
      type="button"
      onClick={go}
      style={{
        ...BASE_CARD,
        background: "#fbe8e8",
        borderLeft: "3px solid #c9302c",
      }}
      aria-label={`${next.label} MTD deadline urgent`}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...eyebrow, color: "#991b1b" }}>MTD filing</span>
        <span style={pill("#f5c2c2", "#991b1b")}>
          {next.isOverdue ? "Submit now" : "Action needed"}
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
        {next.label} due {formatDate(next.deadline)}
      </div>
      <div style={{ fontSize: 13, color: "#c9302c", marginTop: 2, fontWeight: 700 }}>
        {daysText}{next.isOverdue ? " — Submit now →" : ""}
      </div>
    </button>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.6,
  color: "#8a93a4",
  textTransform: "uppercase",
};

function pill(bg: string, fg: string): React.CSSProperties {
  return {
    background: bg,
    color: fg,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    padding: "3px 8px",
    borderRadius: 999,
  };
}

export default MTDDeadlineTile;
