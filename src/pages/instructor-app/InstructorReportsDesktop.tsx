import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon, ChevronDown, Download, ArrowUp, ArrowDown,
  Minus, Sparkles, Info,
} from "lucide-react";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useInstructorReportsData, type ReportsRangeId } from "@/hooks/useInstructorReportsData";

// ---------- palette ----------
const ramp: Record<string, { bg: string; text: string }> = {
  blue:   { bg: "#85B7EB", text: "#042C53" },
  coral:  { bg: "#F0997B", text: "#4A1B0C" },
  green:  { bg: "#C0DD97", text: "#173404" },
  pink:   { bg: "#ED93B1", text: "#4B1528" },
  purple: { bg: "#AFA9EC", text: "#26215C" },
  amber:  { bg: "#FAC775", text: "#412402" },
};

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "0.5px solid #E2E8F0",
  borderRadius: 12,
};

// ---------- mock data ----------
function genDailyRevenue(days = 90) {
  const out: { date: string; amount: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    let base = 60 + Math.round(Math.sin(i / 7) * 25 + Math.random() * 35);
    if (dow === 0) base = 0; // Sunday off
    if (dow === 2 && d.getHours() >= 9) base += 20;
    out.push({ date: d.toISOString().slice(0, 10), amount: base });
  }
  return out;
}

function movingAvg(arr: { amount: number }[], window = 7) {
  return arr.map((_, i) => {
    if (i < window - 1) return null;
    const slice = arr.slice(i - window + 1, i + 1);
    return slice.reduce((s, x) => s + x.amount, 0) / window;
  });
}

function genHeatmap() {
  const grid: number[][] = [];
  for (let d = 0; d < 7; d++) {
    const row: number[] = [];
    for (let h = 0; h < 11; h++) {
      if (d === 6) { row.push(0); continue; } // Sunday off
      let v = 0.2 + Math.random() * 0.5;
      if (d === 1 && h === 2) v = 0.96; // Tue 10am
      if (h >= 1 && h <= 4) v += 0.1;
      if (h === 5) v -= 0.15; // lunch
      row.push(Math.max(0, Math.min(1, v)));
    }
    grid.push(row);
  }
  return grid;
}

const reports = {
  range: { preset: "90d" as const, start: "2026-02-05", end: "2026-05-05" },
  topStats: {
    revenue:  { value: 5420, prev: 4839, fmt: "currency" as const },
    hours:    { value: 142,  prev: 132,  fmt: "hours"    as const },
    avgPerHr: { value: 38.17, prev: 36.97, fmt: "currency" as const },
    passRate: { value: 0.87, prev: 0.90, fmt: "percent"  as const },
  },
  byLessonType: [
    { type: "Standard", amount: 3144, hours: 82, share: 0.58, perHour: 38.34, color: "#378ADD" },
    { type: "Motorway", amount: 1192, hours: 28, share: 0.22, perHour: 42.57, color: "#1D9E75" },
    { type: "Mock test", amount: 650, hours: 22, share: 0.12, perHour: 29.55, color: "#BA7517" },
    { type: "Test",     amount: 434, hours: 10, share: 0.08, perHour: 43.40, color: "#993556" },
  ],
  retention: [
    { step: "New enquiries",      count: 52, share: 1.00 },
    { step: "Booked first lesson", count: 46, share: 0.88 },
    { step: "5+ lessons taken",   count: 38, share: 0.73 },
    { step: "Booked test",        count: 22, share: 0.42 },
    { step: "Passed test",        count: 19, share: 0.37, accent: "success" as const },
  ],
  avgLessonsBeforeTest: 31,
  topPupils: [
    { rank: 1, pupilId: "7", name: "Marcus Owen",  initials: "MO", avatarColor: "amber",  hours: 28, lessons: 22, spend: 1064 },
    { rank: 2, pupilId: "2", name: "Sarah Mendez", initials: "SM", avatarColor: "blue",   hours: 22, lessons: 18, spend:  820 },
    { rank: 3, pupilId: "4", name: "James Taylor", initials: "JT", avatarColor: "pink",   hours: 19, lessons: 15, spend:  722 },
    { rank: 4, pupilId: "5", name: "Lucy Reilly",  initials: "LR", avatarColor: "purple", hours: 14, lessons: 12, spend:  532 },
    { rank: 5, pupilId: "3", name: "Nadia Bhatti", initials: "NB", avatarColor: "green",  hours: 12, lessons: 10, spend:  456 },
  ],
  taxYear: {
    label: "2025–26",
    grossIncome: 18420,
    deductions: [
      { label: "Square fees",      amount: 128 },
      { label: "Vehicle expenses", amount: 3240 },
      { label: "DSM subscription", amount: 216 },
    ],
    taxableProfit: 14836,
    estimatedTax: 447,
    note: "Below personal allowance, mostly Class 4 NI · Due 31 Jan 2027",
  },
};

// ---------- helpers ----------
const gbp0 = (n: number) => new Intl.NumberFormat("en-GB", {
  style: "currency", currency: "GBP", maximumFractionDigits: 0,
}).format(n);
const gbp2 = (n: number) => new Intl.NumberFormat("en-GB", {
  style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(n);

function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const mv = useMotionValue(value);
  const display = useTransform(mv, (v) => format(v));
  const [text, setText] = useState(format(value));

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    const unsub = display.on("change", (v) => setText(v));
    return () => { controls.stop(); unsub(); };
  }, [value, mv, display]);

  return <span>{text}</span>;
}

const RANGES = [
  { id: "7d",  label: "7d",  days: 7  },
  { id: "30d", label: "30d", days: 30 },
  { id: "90d", label: "90d", days: 90 },
  { id: "ytd", label: "YTD", days: 125 },
  { id: "all", label: "All", days: 365 },
] as const;

// ---------- page ----------
export default function InstructorReportsDesktop() {
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);
  const [rangeId, setRangeId] = useState<typeof RANGES[number]["id"]>("90d");
  const [datePopOpen, setDatePopOpen] = useState(false);

  const days = RANGES.find((r) => r.id === rangeId)!.days;

  const dailyRevenue = useMemo(() => genDailyRevenue(days), [days]);
  const ma7 = useMemo(() => movingAvg(dailyRevenue, 7), [dailyRevenue]);
  const heatmap = useMemo(() => genHeatmap(), []);

  // Scale stats slightly with range so the count animation has something to do
  const scale = days / 90;
  const stats = {
    revenue:  reports.topStats.revenue.value * scale,
    hours:    Math.round(reports.topStats.hours.value * scale),
    avgPerHr: reports.topStats.avgPerHr.value,
    passRate: reports.topStats.passRate.value,
  };

  const initials = (instructor?.name || "DSM").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || ""}
      notificationCount={notificationCount}
      onSignOut={signOut}
      onAskED={() => {}}
      onBell={() => {}}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: "#0F172A", margin: 0 }}>Reports</h1>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
              A clear view of how your business is going.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            <button
              onClick={() => setDatePopOpen((v) => !v)}
              style={{
                background: "#fff", border: "0.5px solid #CBD5E1", borderRadius: 6,
                padding: "6px 10px", fontSize: 11, color: "#0F172A", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <CalendarIcon size={12} />
              <span>Last {days} days · 5 Feb – 5 May</span>
              <ChevronDown size={11} />
            </button>

            {datePopOpen && (
              <div style={{
                position: "absolute", top: 32, right: 110, zIndex: 10,
                background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 8,
                padding: 6, minWidth: 160, boxShadow: "0 6px 20px rgba(15,23,42,0.08)",
              }}>
                {["Today","Last 7 days","Last 30 days","Last 90 days","Year to date","All time","Custom range"].map((l) => (
                  <button key={l} onClick={() => setDatePopOpen(false)} style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "none", border: "none", fontSize: 11, color: "#0F172A",
                    padding: "6px 8px", borderRadius: 4, cursor: "pointer",
                  }}>{l}</button>
                ))}
              </div>
            )}

            <div style={{
              display: "inline-flex", background: "#F1F5F9", borderRadius: 6, padding: 3, gap: 2,
            }}>
              {RANGES.map((r) => {
                const active = rangeId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRangeId(r.id)}
                    style={{
                      background: active ? "#fff" : "transparent",
                      color: active ? "#0F172A" : "#64748B",
                      border: "none", fontSize: 11, fontWeight: active ? 500 : 400,
                      padding: "4px 10px", borderRadius: 4, cursor: "pointer",
                      boxShadow: active ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                    }}
                  >{r.label}</button>
                );
              })}
            </div>

            <button
              onClick={() => toast.success("Report exported")}
              style={{
                background: "#fff", border: "0.5px solid #CBD5E1", borderRadius: 6,
                padding: "6px 10px", fontSize: 11, color: "#0F172A", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Download size={12} /> Export
            </button>
          </div>
        </div>

        {/* Top stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
          <StatCard label="REVENUE"     value={stats.revenue}  prev={reports.topStats.revenue.prev}  fmt="currency" />
          <StatCard label="HOURS TAUGHT" value={stats.hours}    prev={reports.topStats.hours.prev}    fmt="hours" />
          <StatCard label="AVG £/HOUR"  value={stats.avgPerHr} prev={reports.topStats.avgPerHr.prev} fmt="currency2" />
          <StatCard label="PASS RATE"   value={stats.passRate} prev={reports.topStats.passRate.prev} fmt="percent" />
        </div>

        {/* Revenue trend + lesson type */}
        <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 12, marginBottom: 12 }}>
          <RevenueTrend daily={dailyRevenue} ma7={ma7} />
          <LessonTypeCard />
        </div>

        {/* Heatmap + retention */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 12 }}>
          <HeatmapCard grid={heatmap} />
          <RetentionCard />
        </div>

        {/* Top pupils + tax */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 24 }}>
          <TopPupilsCard />
          <TaxYearCard />
        </div>
      </div>
    </DashboardShell>
  );
}

// ---------- Stat Card ----------
function StatCard({ label, value, prev, fmt }: {
  label: string; value: number; prev: number;
  fmt: "currency" | "currency2" | "hours" | "percent";
}) {
  const delta = value - prev;
  const pctDelta = prev !== 0 ? (delta / prev) * 100 : 0;
  const isUp = delta > 0.001;
  const isDown = delta < -0.001;
  const trendColor = isUp ? "#047857" : isDown ? "#BE123C" : "#94A3B8";

  const formatter = (v: number) => {
    if (fmt === "currency") return gbp0(v);
    if (fmt === "currency2") return gbp2(v);
    if (fmt === "hours") return `${Math.round(v)}h`;
    if (fmt === "percent") return `${Math.round(v * 100)}%`;
    return String(v);
  };

  let trendText: string;
  if (fmt === "percent") trendText = `${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(0)}pts vs prev`;
  else if (fmt === "currency2") trendText = `${delta >= 0 ? "+" : ""}${gbp2(delta).replace("£", "£")}`;
  else trendText = `${pctDelta >= 0 ? "+" : ""}${pctDelta.toFixed(0)}% vs prev ${RANGES.find(r=>r.id==="90d")?.label.replace("d","d")}`;

  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;

  return (
    <div style={{
      ...card, padding: 12, cursor: "pointer", transition: "border-color 120ms",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#94A3B8")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
    >
      <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 500, color: "#0F172A",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        marginTop: 4, marginBottom: 6,
      }}>
        <AnimatedNumber value={value} format={formatter} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: trendColor }}>
        <Icon size={9} />
        <span>{trendText}</span>
      </div>
    </div>
  );
}

// ---------- Revenue Trend ----------
function RevenueTrend({ daily, ma7 }: {
  daily: { date: string; amount: number }[];
  ma7: (number | null)[];
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 540, H = 180, padL = 28, padR = 8, padT = 8, padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(...daily.map((d) => d.amount), 100);
  const ySteps = [0, 0.33, 0.66, 1];
  const yFor = (v: number) => padT + innerH - (v / max) * innerH;

  const barW = innerW / daily.length - 2;

  // Months on x-axis
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  daily.forEach((d, i) => {
    const m = new Date(d.date).getMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      monthLabels.push({
        x: padL + i * (barW + 2),
        label: new Date(d.date).toLocaleString("en-GB", { month: "short" }),
      });
    }
  });

  // Smooth path for MA
  const maPoints = ma7.map((v, i) => {
    if (v == null) return null;
    return { x: padL + i * (barW + 2) + barW / 2, y: yFor(v) };
  }).filter(Boolean) as { x: number; y: number }[];
  const maPath = maPoints.length > 1
    ? "M" + maPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")
    : "";

  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Revenue over time</div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
            Daily takings, with 7-day moving average
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#64748B" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, background: "#85B7EB", borderRadius: 2 }} /> Daily
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 1.5, background: "#6E59E0" }} /> 7-day avg
          </span>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
          {/* gridlines */}
          {ySteps.map((s, i) => {
            const v = max * (1 - s);
            const y = padT + innerH * s;
            return (
              <g key={i}>
                <line x1={padL} x2={W - padR} y1={y} y2={y}
                  stroke="#E2E8F0" strokeWidth={i === ySteps.length - 1 ? 1 : 0.5}
                  strokeDasharray={i === ySteps.length - 1 ? undefined : "2 3"} />
                <text x={padL - 4} y={y + 3} fill="#94A3B8" fontSize={9} textAnchor="end">
                  £{Math.round(v)}
                </text>
              </g>
            );
          })}

          {/* bars */}
          {daily.map((d, i) => {
            const x = padL + i * (barW + 2);
            const y = yFor(d.amount);
            const h = padT + innerH - y;
            const isRecent = i >= daily.length - 3;
            return (
              <rect
                key={i}
                x={x} y={y} width={Math.max(0.5, barW)} height={Math.max(0, h)}
                fill={isRecent ? "#378ADD" : "#85B7EB"}
                rx={1}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              />
            );
          })}

          {/* MA line */}
          {maPath && (
            <path d={maPath} fill="none" stroke="#6E59E0" strokeWidth={1.5}
              strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* x-axis labels */}
          {monthLabels.map((m, i) => (
            <text key={i} x={m.x} y={H - 6} fill="#94A3B8" fontSize={9}>{m.label}</text>
          ))}
        </svg>

        {hover !== null && (
          <div style={{
            position: "absolute", top: 4, left: 36 + hover * (innerW / daily.length),
            background: "#0F172A", color: "#fff", fontSize: 10,
            padding: "5px 7px", borderRadius: 4, pointerEvents: "none",
            transform: "translateX(-50%)", whiteSpace: "nowrap", zIndex: 2,
          }}>
            <div style={{ fontWeight: 500 }}>{daily[hover].date}</div>
            <div>{gbp0(daily[hover].amount)}</div>
            {ma7[hover] != null && <div style={{ color: "#A5B4FC" }}>7d avg {gbp0(ma7[hover]!)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Lesson Type Card ----------
function LessonTypeCard() {
  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", marginBottom: 12 }}>By lesson type</div>

      <div style={{
        display: "flex", height: 22, borderRadius: 5, overflow: "hidden", marginBottom: 14,
      }}>
        {reports.byLessonType.map((t) => (
          <div key={t.type} style={{ flex: t.share, background: t.color }} title={`${t.type} ${(t.share*100).toFixed(0)}%`} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {reports.byLessonType.map((t) => (
          <div key={t.type} style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", gap: 10, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#0F172A" }}>{t.type}</div>
              <div style={{ fontSize: 9, color: "#94A3B8" }}>
                {t.hours} hours · {(t.share * 100).toFixed(0)}% of revenue
              </div>
            </div>
            <div style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#0F172A", fontWeight: 500 }}>
              {gbp0(t.amount)}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 14, paddingTop: 10, borderTop: "0.5px solid #E2E8F0",
        display: "flex", justifyContent: "space-between", fontSize: 10,
      }}>
        <span style={{ color: "#64748B" }}>Most profitable per hour</span>
        <span style={{ color: "#0F172A", fontWeight: 500 }}>Motorway · £42.57</span>
      </div>
    </div>
  );
}

// ---------- Heatmap ----------
function HeatmapCard({ grid }: { grid: number[][] }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = [8,9,10,11,12,13,14,15,16,17,18];
  const STOPS = ["#F1F5F9", "#C8DDF6", "#85B7EB", "#4A95DC", "#1B5DA2"];
  const colorFor = (v: number) => {
    if (v === 0) return STOPS[0];
    if (v < 0.1) return STOPS[1];
    if (v < 0.3) return STOPS[2];
    if (v < 0.6) return STOPS[3];
    return STOPS[4];
  };

  // Find best insight
  let best: { d: number; h: number; v: number } | null = null;
  grid.forEach((row, d) => row.forEach((v, h) => {
    if (v >= 0.85 && (!best || v > best.v)) best = { d, h, v };
  }));

  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);

  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>When you're busiest</div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
            Lessons taught by day and hour, last 90 days
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#94A3B8" }}>
          <span>Less</span>
          {STOPS.map((c) => (
            <span key={c} style={{ width: 8, height: 8, background: c, borderRadius: 2, display: "inline-block" }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "28px repeat(11, 1fr)", gap: 3, position: "relative",
      }}>
        <div />
        {hours.map((h) => (
          <div key={h} style={{ fontSize: 9, color: "#94A3B8", textAlign: "center" }}>{h}</div>
        ))}

        {grid.map((row, d) => {
          const off = d === 6;
          return (
            <DayRow key={d}
              day={days[d]} row={row} d={d}
              colorFor={colorFor} off={off}
              setHover={setHover}
            />
          );
        })}

        {hover && (
          <div style={{
            position: "absolute", top: -38, left: 0, right: 0, textAlign: "center",
            pointerEvents: "none",
          }}>
            <span style={{
              background: "#0F172A", color: "#fff", fontSize: 10,
              padding: "4px 8px", borderRadius: 4,
            }}>
              {days[hover.d]} {hours[hover.h]}:00 · {Math.round(grid[hover.d][hover.h] * 30)} lessons · {Math.round(grid[hover.d][hover.h] * 100)}% full
            </span>
          </div>
        )}
      </div>

      {best && (
        <div style={{
          marginTop: 12, background: "#EEF2FF", color: "#4338CA",
          padding: "8px 10px", borderRadius: 6,
          display: "flex", alignItems: "center", gap: 6, fontSize: 11,
        }}>
          <Sparkles size={12} />
          <span>
            Your {days[best.d]} {hours[best.h]}am slots are {Math.round(best.v * 100)}% full. Worth raising the rate or adding capacity.
          </span>
        </div>
      )}
    </div>
  );
}

function DayRow({ day, row, d, colorFor, off, setHover }: {
  day: string; row: number[]; d: number;
  colorFor: (v: number) => string; off: boolean;
  setHover: (h: { d: number; h: number } | null) => void;
}) {
  return (
    <>
      <div style={{ fontSize: 9, color: off ? "#94A3B8" : "#64748B", display: "flex", alignItems: "center" }}>{day}</div>
      {row.map((v, h) => off ? (
        <div key={h} style={{
          aspectRatio: "1.2", borderRadius: 2,
          backgroundImage: "repeating-linear-gradient(45deg, #F1F5F9 0 3px, #E2E8F0 3px 6px)",
        }} />
      ) : (
        <div
          key={h}
          onMouseEnter={() => setHover({ d, h })}
          onMouseLeave={() => setHover(null)}
          style={{
            aspectRatio: "1.2", background: colorFor(v), borderRadius: 2, cursor: "pointer",
          }}
        />
      ))}
    </>
  );
}

// ---------- Retention Funnel ----------
function RetentionCard() {
  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", display: "flex", alignItems: "center", gap: 5 }}>
            Pupil retention
            <Info size={11} style={{ color: "#94A3B8" }} />
          </div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>From first lesson to test pass</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reports.retention.map((step) => (
          <div key={step.step}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#0F172A" }}>{step.step}</span>
              <span style={{ fontSize: 11, color: "#0F172A" }}>
                <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 500 }}>{step.count}</span>{" "}
                <span style={{ fontSize: 10, color: "#94A3B8" }}>{Math.round(step.share * 100)}%</span>
              </span>
            </div>
            <div style={{ height: 8, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${step.share * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  height: "100%",
                  background: step.accent === "success" ? "#1D9E75" : "#378ADD",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 14, paddingTop: 10, borderTop: "0.5px solid #E2E8F0",
        display: "flex", justifyContent: "space-between", fontSize: 10,
      }}>
        <span style={{ color: "#64748B" }}>Avg lessons before test</span>
        <span style={{ color: "#0F172A", fontWeight: 500 }}>{reports.avgLessonsBeforeTest}</span>
      </div>
    </div>
  );
}

// ---------- Top Pupils ----------
function TopPupilsCard() {
  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Top earning pupils</div>
        <a href="/instructor/pupils" style={{ fontSize: 11, color: "#4F46E5", textDecoration: "none" }}>View all →</a>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "18px minmax(0, 1.5fr) 70px 80px 90px",
        gap: 10, padding: "6px 0", borderBottom: "0.5px solid #E2E8F0",
        fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.4px",
      }}>
        <span>#</span><span>Pupil</span>
        <span style={{ textAlign: "right" }}>Hours</span>
        <span style={{ textAlign: "right" }}>Lessons</span>
        <span style={{ textAlign: "right" }}>Spend</span>
      </div>

      {reports.topPupils.map((p) => {
        const c = ramp[p.avatarColor] || ramp.blue;
        return (
          <div key={p.pupilId} style={{
            display: "grid", gridTemplateColumns: "18px minmax(0, 1.5fr) 70px 80px 90px",
            gap: 10, padding: "8px 0", borderBottom: "0.5px solid #F1F5F9",
            alignItems: "center", cursor: "pointer",
          }}>
            <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "ui-monospace, monospace" }}>{p.rank}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: c.bg, color: c.text,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 600, flexShrink: 0,
              }}>{p.initials}</div>
              <span style={{
                fontSize: 12, fontWeight: 500, color: "#0F172A",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#64748B", textAlign: "right" }}>{p.hours}h</span>
            <span style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#64748B", textAlign: "right" }}>{p.lessons}</span>
            <span style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#0F172A", fontWeight: 500, textAlign: "right" }}>
              {gbp0(p.spend)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Tax Year ----------
function TaxYearCard() {
  const t = reports.taxYear;
  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Tax year {t.label}</div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
            6 Apr 2025 – 5 Apr 2026 · Self assessment
          </div>
        </div>
        <span style={{
          background: "#EEDFEE", color: "#3C3489",
          fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 6,
          letterSpacing: "0.4px",
        }}>EST.</span>
      </div>

      <div style={{ paddingBottom: 12, borderBottom: "0.5px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 9 }}>
        <Line label="Gross income" value={gbp0(t.grossIncome)} bold />
        {t.deductions.map((d) => (
          <Line key={d.label} label={d.label} value={`−${gbp0(d.amount)}`} muted />
        ))}
      </div>

      <div style={{ padding: "10px 0", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}>Taxable profit</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#0F172A", fontFamily: "ui-monospace, monospace" }}>
          {gbp0(t.taxableProfit)}
        </span>
      </div>

      <div style={{ background: "#EEF2FF", borderRadius: 6, padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#4338CA", fontSize: 11 }}>
          <span>Estimated tax owed</span>
          <span style={{ fontWeight: 500, fontFamily: "ui-monospace, monospace" }}>{gbp0(t.estimatedTax)}</span>
        </div>
        <div style={{ fontSize: 9, color: "#4338CA", opacity: 0.8, marginTop: 3 }}>{t.note}</div>
      </div>

      <button
        onClick={() => toast.success("HMRC summary downloaded")}
        style={{
          marginTop: 10, width: "100%", background: "#fff",
          border: "0.5px solid #CBD5E1", borderRadius: 6,
          padding: "7px 10px", fontSize: 11, color: "#64748B", cursor: "pointer",
        }}
      >
        Download HMRC summary (PDF)
      </button>
    </div>
  );
}

function Line({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
      <span style={{ color: "#64748B" }}>{label}</span>
      <span style={{
        fontFamily: "ui-monospace, monospace",
        color: muted ? "#64748B" : "#0F172A",
        fontWeight: bold ? 500 : 400,
      }}>{value}</span>
    </div>
  );
}
