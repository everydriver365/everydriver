import {
  AlertCircle, AlertTriangle, Calendar, CreditCard, MessageCircle, Bell,
  ChevronRight, Clock, CheckCircle2, Inbox, Flame, Sparkles,
} from "lucide-react";

const MUTED = "#6B7280";
const BORDER = "rgba(0,0,0,0.06)";

type Row = {
  key: string;
  title: string;
  subtitle: string;
  count: number;
  icon: any;
  group: "urgent" | "todo";
  tint: string;
};

const SAMPLE: Row[] = [
  { key: "pay",   title: "Overdue payments",  subtitle: "3 pupils owe £312.00",     count: 3, icon: CreditCard,   group: "urgent", tint: "#CC2229" },
  { key: "test",  title: "Tests this week",   subtitle: "Mia · Thu 10:14 Basingstoke", count: 2, icon: AlertCircle, group: "urgent", tint: "#CC2229" },
  { key: "msgs",  title: "Unread messages",   subtitle: "From Sam, Aisha +4",       count: 6, icon: MessageCircle, group: "todo",   tint: "#B45309" },
  { key: "req",   title: "Booking requests",  subtitle: "2 awaiting confirmation",  count: 2, icon: Calendar,      group: "todo",   tint: "#B45309" },
  { key: "rev",   title: "Reviews to reply",  subtitle: "1 new 5★ review",          count: 1, icon: Bell,          group: "todo",   tint: "#B45309" },
];

const bento: React.CSSProperties = {
  background: "#FFF",
  borderRadius: 16,
  border: `0.5px solid ${BORDER}`,
  boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(15,23,42,0.10)",
};

const Label = ({ children, count, tint }: { children: React.ReactNode; count?: number; tint?: string }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {children}
    </div>
    {count !== undefined && count > 0 && (
      <span style={{
        background: tint ?? "#CC2229", color: "#FFF", fontSize: 11, fontWeight: 700,
        padding: "2px 7px", borderRadius: 999, minWidth: 18, textAlign: "center",
      }}>{count}</span>
    )}
  </div>
);

/* ───────────────────────────── A1 — Stat Triad ───────────────────────────── */
export function A1StatTriad() {
  const urgent = SAMPLE.filter((r) => r.group === "urgent").reduce((n, r) => n + r.count, 0);
  const todo = SAMPLE.filter((r) => r.group === "todo").reduce((n, r) => n + r.count, 0);
  const total = urgent + todo;

  return (
    <div style={{ ...bento, padding: 14 }}>
      <Label count={total} tint="#0F172A">Needs attention</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
        {[
          { n: urgent, label: "Urgent", color: "#CC2229", bg: "rgba(204,34,41,0.06)" },
          { n: todo,   label: "To do",  color: "#B45309", bg: "rgba(180,83,9,0.06)" },
          { n: 4,      label: "Today",  color: "#1A52A0", bg: "rgba(26,82,160,0.06)" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {SAMPLE.slice(0, 2).map((r, i) => (
        <Row key={r.key} row={r} divider={i > 0} />
      ))}
      <button style={seeAll}>See all 5 items <ChevronRight size={13} /></button>
    </div>
  );
}

/* ───────────────────────────── A2 — Priority Hero ───────────────────────────── */
export function A2PriorityHero() {
  const top = SAMPLE[0];
  return (
    <div style={{ ...bento, padding: 0, overflow: "hidden" }}>
      <div style={{
        background: "linear-gradient(135deg, #CC2229 0%, #951419 100%)",
        padding: 14, color: "#FFF",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Flame size={13} />
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top priority</div>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{top.title}</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>{top.subtitle}</div>
        <button style={{
          marginTop: 10, background: "rgba(255,255,255,0.2)", color: "#FFF",
          border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10,
          padding: "8px 12px", fontSize: 13, fontWeight: 600, width: "100%",
        }}>Resolve now</button>
      </div>
      <div style={{ padding: "10px 14px 12px" }}>
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 6 }}>4 more</div>
        {SAMPLE.slice(1, 4).map((r, i) => <Row key={r.key} row={r} divider={i > 0} compact />)}
      </div>
    </div>
  );
}

/* ───────────────────────────── A3 — Chip Cluster ───────────────────────────── */
export function A3ChipCluster() {
  return (
    <div style={{ ...bento, padding: 14 }}>
      <Label count={SAMPLE.reduce((n, r) => n + r.count, 0)} tint="#CC2229">Needs attention</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SAMPLE.map((r) => {
          const Icon = r.icon;
          return (
            <button key={r.key} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 10px", borderRadius: 999,
              background: r.group === "urgent" ? "rgba(204,34,41,0.06)" : "rgba(180,83,9,0.05)",
              border: `0.5px solid ${r.group === "urgent" ? "rgba(204,34,41,0.18)" : "rgba(180,83,9,0.16)"}`,
              fontSize: 12.5, fontWeight: 600, color: "#1A1A1A",
            }}>
              <Icon size={13} color={r.tint} />
              {r.title.replace(/^Overdue |^Booking |^Unread |^Reviews to |^Tests this /,"")}
              <span style={{
                background: r.tint, color: "#FFF", borderRadius: 999,
                padding: "1px 6px", fontSize: 10.5, fontWeight: 700,
              }}>{r.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────── A4 — Timeline Spine ───────────────────────────── */
export function A4Timeline() {
  return (
    <div style={{ ...bento, padding: "14px 14px 6px" }}>
      <Label count={SAMPLE.length} tint="#CC2229">Needs attention</Label>
      <div style={{ position: "relative", paddingLeft: 18 }}>
        <div style={{ position: "absolute", left: 6, top: 6, bottom: 14, width: 2, background: "#F1F5F9", borderRadius: 2 }} />
        {SAMPLE.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} style={{ position: "relative", paddingBottom: 12 }}>
              <div style={{
                position: "absolute", left: -16, top: 4, width: 14, height: 14,
                borderRadius: 999, background: "#FFF", border: `2px solid ${r.tint}`,
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={14} color={r.tint} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1A1A", flex: 1 }}>{r.title}</div>
                <span style={{
                  background: r.group === "urgent" ? "rgba(204,34,41,0.08)" : "rgba(180,83,9,0.08)",
                  color: r.tint, borderRadius: 999, padding: "1px 7px",
                  fontSize: 11, fontWeight: 700,
                }}>{r.count}</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginLeft: 22, marginTop: 1 }}>{r.subtitle}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────── A5 — Two-Column Bento ───────────────────────────── */
export function A5TwoColumn() {
  const urgent = SAMPLE.filter((r) => r.group === "urgent");
  const todo = SAMPLE.filter((r) => r.group === "todo");
  return (
    <div style={{ ...bento, padding: 12 }}>
      <Label count={SAMPLE.length} tint="#CC2229">Needs attention</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <ColCard tint="#CC2229" label="Urgent" count={urgent.reduce((n,r)=>n+r.count,0)} rows={urgent} />
        <ColCard tint="#B45309" label="To do"  count={todo.reduce((n,r)=>n+r.count,0)}  rows={todo} />
      </div>
    </div>
  );
}

function ColCard({ tint, label, count, rows }: { tint: string; label: string; count: number; rows: Row[] }) {
  return (
    <div style={{
      background: "#FAFBFC", borderRadius: 12, padding: 10,
      border: `0.5px solid ${BORDER}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: tint }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: tint }}>{count}</span>
      </div>
      {rows.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0" }}>
            <Icon size={12} color={tint} />
            <div style={{ fontSize: 12, color: "#1A1A1A", lineHeight: 1.25, flex: 1 }}>{r.title}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── A6 — Alert Banner Stack ───────────────────────────── */
export function A6BannerStack() {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 4 }}>
        Needs attention · {SAMPLE.length}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {SAMPLE.slice(0, 4).map((r) => {
          const Icon = r.icon;
          const isUrgent = r.group === "urgent";
          return (
            <button key={r.key} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#FFF", borderRadius: 12, padding: "10px 12px",
              border: `0.5px solid ${BORDER}`,
              borderLeft: `3px solid ${r.tint}`, width: "100%", textAlign: "left",
              boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: isUrgent ? "rgba(204,34,41,0.08)" : "rgba(180,83,9,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={15} color={r.tint} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1A1A" }}>{r.title}</div>
                <div style={{ fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subtitle}</div>
              </div>
              <span style={{
                background: r.tint, color: "#FFF", borderRadius: 999,
                padding: "2px 7px", fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: "center",
              }}>{r.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────── A7 — Inbox Style ───────────────────────────── */
export function A7Inbox() {
  return (
    <div style={{ ...bento, padding: 0, overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", borderBottom: `0.5px solid ${BORDER}`, background: "#FAFBFC",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <Inbox size={14} color="#1A1A1A" />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1A1A1A" }}>Needs attention</span>
        </span>
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{SAMPLE.length} items</span>
      </div>
      {SAMPLE.map((r, i) => {
        const Icon = r.icon;
        return (
          <div key={r.key} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px",
            borderTop: i === 0 ? "none" : `0.5px solid ${BORDER}`,
            background: r.group === "urgent" ? "rgba(204,34,41,0.025)" : "#FFF",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: r.tint, flexShrink: 0 }} />
            <Icon size={14} color={MUTED} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{r.title}</div>
              <div style={{ fontSize: 11.5, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subtitle}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: r.tint }}>{r.count}</span>
            <ChevronRight size={13} color="#C7C7CC" />
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── helpers ───────────────────────────── */
function Row({ row, divider, compact }: { row: Row; divider?: boolean; compact?: boolean }) {
  const Icon = row.icon;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: compact ? "7px 0" : "9px 0",
      borderTop: divider ? `0.5px solid ${BORDER}` : "none",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: row.group === "urgent" ? "rgba(204,34,41,0.08)" : "rgba(180,83,9,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={14} color={row.tint} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{row.title}</div>
        <div style={{ fontSize: 11.5, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.subtitle}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: row.tint }}>{row.count}</span>
    </div>
  );
}

const seeAll: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 3,
  marginTop: 8, background: "transparent", border: "none",
  padding: 0, fontSize: 12.5, fontWeight: 600, color: "#1A52A0", cursor: "pointer",
};
