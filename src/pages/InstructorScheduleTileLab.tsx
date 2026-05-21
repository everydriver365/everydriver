import { useState, Fragment } from "react";
import { PhoneFrame } from "@/components/instructor/homeLab/PhoneFrame";
import {
  Plus, RefreshCw, ChevronRight, MapPin, Clock, Car, Circle,
  CheckCircle2, PlayCircle, Calendar, ArrowRight, Coffee, Zap,
} from "lucide-react";

// ============ Shared sample data ============
const today = new Date();
function at(h: number, m: number) {
  const d = new Date(today);
  d.setHours(h, m, 0, 0);
  return d;
}
const LESSONS = [
  { id: "1", start: at(9, 0),  end: at(10, 0),  name: "Sophie Turner",  type: "Standard Lesson", postcode: "SO30 0HT" },
  { id: "2", start: at(11, 30), end: at(13, 0), name: "James Mitchell", type: "Standard Lesson", postcode: "SO18 1AB" },
  { id: "3", start: at(14, 0),  end: at(15, 0), name: "Amira Khan",     type: "Mock Test",        postcode: "SO40 2BC" },
  { id: "4", start: at(16, 30), end: at(17, 30), name: "Priya Patel",   type: "Standard Lesson", postcode: "SO15 5EE" },
];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dur = (a: Date, b: Date) => {
  const m = Math.round((b.getTime() - a.getTime()) / 60000);
  const h = Math.floor(m / 60); const r = m % 60;
  return h && r ? `${h}h ${r}m` : h ? `${h}h` : `${r}m`;
};
type Status = "done" | "now" | "next" | "upcoming";
function status(l: typeof LESSONS[number]): Status {
  const n = Date.now();
  if (l.end.getTime() < n) return "done";
  if (l.start.getTime() <= n && n <= l.end.getTime()) return "now";
  return "upcoming";
}
function withStatus() {
  let foundNext = false;
  return LESSONS.map((l) => {
    let s = status(l);
    if (s === "upcoming" && !foundNext) { foundNext = true; s = "next"; }
    return { ...l, s };
  });
}

const FONT = "Poppins, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const eyebrow = `SCHEDULE · ${DAYS[today.getDay()]} ${today.getDate()} ${MONTHS[today.getMonth()]}`;

// ============ V1 — Current (baseline) ============
function V1Current() {
  const items = withStatus();
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, color: "#888", letterSpacing: "1.2px", fontWeight: 600, textTransform: "uppercase" }}>{eyebrow}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1f", marginTop: 4 }}>Today</div>
      <div className="flex flex-col mt-3" style={{ gap: 10 }}>
        {items.map((l) => (
          <div key={l.id} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1f" }}>{hm(l.start)}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{dur(l.start, l.end)}</div>
            </div>
            <div style={{ width: 2, alignSelf: "stretch", background: "#2952b3", minHeight: 40 }} />
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1f" }}>{l.name}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{l.type}</div>
              <div className="inline-flex items-center" style={{ marginTop: 6, background: "#E6ECF8", color: "#2952b3", borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 600, gap: 4 }}>
                <MapPin size={11} strokeWidth={2.5} /> {l.postcode}
              </div>
            </div>
            <ChevronRight size={20} color="#B5B9C2" />
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

function Footer({ green = "#2d8a4e", blue = "#2952b3" }: { green?: string; blue?: string }) {
  return (
    <div className="flex mt-3" style={{ gap: 10 }}>
      <button className="flex-1 flex items-center justify-center" style={{ background: green, color: "#fff", border: 0, borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, gap: 6, fontFamily: FONT }}>
        <Plus size={16} strokeWidth={2.5} /> Add lesson
      </button>
      <button className="flex-1 flex items-center justify-center" style={{ background: blue, color: "#fff", border: 0, borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, gap: 6, fontFamily: FONT }}>
        <RefreshCw size={16} strokeWidth={2.5} /> Fill gaps
      </button>
    </div>
  );
}

// ============ V2 — Timeline Spine ============
function V2Timeline() {
  const items = withStatus();
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, color: "#888", letterSpacing: "1.2px", fontWeight: 600, textTransform: "uppercase" }}>{eyebrow}</div>
      <div className="flex items-baseline justify-between" style={{ marginTop: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1f" }}>Today</div>
        <div style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{items.length} lessons · {items.filter(i=>i.s==="done").length} done</div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #ECEEF2", borderRadius: 20, padding: "8px 14px", marginTop: 12 }}>
        {items.map((l, i) => {
          const isLast = i === items.length - 1;
          const dotColor = l.s === "done" ? "#B5B9C2" : l.s === "now" ? "#22C55E" : l.s === "next" ? "#2952b3" : "#CBD2DC";
          return (
            <div key={l.id} className="flex" style={{ gap: 14, padding: "12px 0" }}>
              <div style={{ width: 44, flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f" }}>{hm(l.start)}</div>
                <div style={{ fontSize: 11, color: "#9AA0AB", marginTop: 2 }}>{dur(l.start, l.end)}</div>
              </div>
              <div className="relative flex flex-col items-center" style={{ width: 16 }}>
                <div style={{ width: 12, height: 12, borderRadius: 999, background: dotColor, border: l.s === "now" ? "3px solid #DCFCE7" : "none", marginTop: 4 }} />
                {!isLast && <div style={{ flex: 1, width: 2, background: "#ECEEF2", marginTop: 2 }} />}
              </div>
              <div className="flex-1 min-w-0" style={{ paddingBottom: 4 }}>
                <div className="flex items-center justify-between" style={{ gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f", textDecoration: l.s === "done" ? "line-through" : "none" }}>{l.name}</div>
                  {l.s === "now" && <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "2px 8px", borderRadius: 999 }}>NOW</span>}
                  {l.s === "next" && <span style={{ fontSize: 10, fontWeight: 700, color: "#2952b3", background: "#E6ECF8", padding: "2px 8px", borderRadius: 999 }}>NEXT</span>}
                </div>
                <div className="flex items-center" style={{ fontSize: 12, color: "#888", marginTop: 2, gap: 6 }}>
                  <span>{l.type}</span><span>·</span><MapPin size={11} /><span>{l.postcode}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Footer />
    </div>
  );
}

// ============ V3 — Hero "Up Next" + Mini list ============
function V3Hero() {
  const items = withStatus();
  const hero = items.find((l) => l.s === "now") || items.find((l) => l.s === "next") || items[0];
  const rest = items.filter((l) => l.id !== hero.id);
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, color: "#888", letterSpacing: "1.2px", fontWeight: 600, textTransform: "uppercase" }}>{eyebrow}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1f", marginTop: 4 }}>Today</div>

      {/* Hero card */}
      <div style={{ marginTop: 12, background: "linear-gradient(135deg,#2952b3 0%,#1e3a8a 100%)", borderRadius: 20, padding: 18, color: "#fff", boxShadow: "0 10px 24px -12px rgba(41,82,179,.5)" }}>
        <div className="flex items-center" style={{ gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: 1, opacity: .85 }}>
          {hero.s === "now" ? <PlayCircle size={14} /> : <Clock size={14} />}
          {hero.s === "now" ? "HAPPENING NOW" : "UP NEXT"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{hero.name}</div>
        <div style={{ fontSize: 13, opacity: .85, marginTop: 2 }}>{hero.type}</div>
        <div className="flex items-center" style={{ marginTop: 14, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, opacity: .7 }}>Start</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{hm(hero.start)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: .7 }}>Duration</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{dur(hero.start, hero.end)}</div>
          </div>
          <div className="flex-1" />
          <div className="inline-flex items-center" style={{ background: "rgba(255,255,255,.18)", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, gap: 4 }}>
            <MapPin size={12} /> {hero.postcode}
          </div>
        </div>
      </div>

      {/* Mini list */}
      <div style={{ marginTop: 12, background: "#fff", border: "1px solid #ECEEF2", borderRadius: 16, overflow: "hidden" }}>
        {rest.map((l, i) => (
          <Fragment key={l.id}>
            {i > 0 && <div style={{ height: 1, background: "#F1F3F6", marginLeft: 60 }} />}
            <div className="flex items-center" style={{ padding: "12px 14px", gap: 12 }}>
              <div style={{ width: 46, fontSize: 14, fontWeight: 700, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f" }}>{hm(l.start)}</div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 14, fontWeight: 600, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f", textDecoration: l.s === "done" ? "line-through" : "none" }}>{l.name}</div>
                <div style={{ fontSize: 12, color: "#9AA0AB" }}>{l.postcode} · {dur(l.start, l.end)}</div>
              </div>
              {l.s === "done" ? <CheckCircle2 size={18} color="#22C55E" /> : <ChevronRight size={18} color="#B5B9C2" />}
            </div>
          </Fragment>
        ))}
      </div>
      <Footer />
    </div>
  );
}

// ============ V4 — Compact ribbon ============
function V4Ribbon() {
  const items = withStatus();
  return (
    <div style={{ fontFamily: FONT }}>
      <div className="flex items-baseline justify-between">
        <div>
          <div style={{ fontSize: 11, color: "#888", letterSpacing: "1.2px", fontWeight: 600, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1f", marginTop: 4 }}>Today</div>
        </div>
        <button style={{ fontSize: 12, fontWeight: 600, color: "#2952b3", background: "transparent", border: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
          Week <ArrowRight size={12} />
        </button>
      </div>

      <div className="flex flex-col" style={{ gap: 8, marginTop: 12 }}>
        {items.map((l) => {
          const accent = l.s === "done" ? "#CBD2DC" : l.s === "now" ? "#22C55E" : "#2952b3";
          return (
            <div key={l.id} className="flex items-stretch" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #ECEEF2" }}>
              <div style={{ width: 5, background: accent }} />
              <div className="flex-1 flex items-center" style={{ padding: "12px 14px", gap: 12 }}>
                <div style={{ minWidth: 46 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f" }}>{hm(l.start)}</div>
                  <div style={{ fontSize: 11, color: "#9AA0AB" }}>{dur(l.start, l.end)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 600, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f", textDecoration: l.s === "done" ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                  <div className="flex items-center" style={{ fontSize: 12, color: "#888", gap: 5, marginTop: 1 }}>
                    <span>{l.type}</span><span>·</span><MapPin size={10} /><span>{l.postcode}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Footer />
    </div>
  );
}

// ============ V5 — Gap-aware (shows free slots between) ============
function V5GapAware() {
  const items = withStatus();
  const rows: Array<{ type: "lesson"; data: typeof items[number] } | { type: "gap"; mins: number; from: Date; to: Date }> = [];
  items.forEach((l, i) => {
    rows.push({ type: "lesson", data: l });
    const next = items[i + 1];
    if (next) {
      const gap = Math.round((next.start.getTime() - l.end.getTime()) / 60000);
      if (gap >= 30) rows.push({ type: "gap", mins: gap, from: l.end, to: next.start });
    }
  });
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, color: "#888", letterSpacing: "1.2px", fontWeight: 600, textTransform: "uppercase" }}>{eyebrow}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1f", marginTop: 4 }}>Today</div>
      <div className="flex flex-col mt-3" style={{ gap: 8 }}>
        {rows.map((r, idx) => r.type === "lesson" ? (
          <div key={`l-${r.data.id}`} className="flex items-center" style={{ background: "#fff", border: "1px solid #ECEEF2", borderRadius: 14, padding: "12px 14px", gap: 12 }}>
            <div style={{ width: 50 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: r.data.s === "done" ? "#9AA0AB" : "#1a1a1f" }}>{hm(r.data.start)}</div>
              <div style={{ fontSize: 11, color: "#9AA0AB" }}>{dur(r.data.start, r.data.end)}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14, fontWeight: 600, color: r.data.s === "done" ? "#9AA0AB" : "#1a1a1f", textDecoration: r.data.s === "done" ? "line-through" : "none" }}>{r.data.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{r.data.type} · {r.data.postcode}</div>
            </div>
            <ChevronRight size={18} color="#B5B9C2" />
          </div>
        ) : (
          <button key={`g-${idx}`} className="flex items-center justify-between" style={{ background: "rgba(41,82,179,.06)", border: "1px dashed #B7C5E4", borderRadius: 14, padding: "10px 14px", color: "#2952b3", fontFamily: FONT, cursor: "pointer" }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <Zap size={14} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{r.mins >= 60 ? `${Math.floor(r.mins/60)}h ${r.mins%60 ? r.mins%60+"m" : ""}` : `${r.mins}m`} free · {hm(r.from)}–{hm(r.to)}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Fill</span>
          </button>
        ))}
      </div>
      <Footer />
    </div>
  );
}

// ============ V6 — Card grid (2-up) ============
function V6Grid() {
  const items = withStatus();
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, color: "#888", letterSpacing: "1.2px", fontWeight: 600, textTransform: "uppercase" }}>{eyebrow}</div>
      <div className="flex items-baseline justify-between" style={{ marginTop: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1f" }}>Today</div>
        <div style={{ fontSize: 12, color: "#888" }}>{items.length} lessons</div>
      </div>
      <div className="grid grid-cols-2" style={{ gap: 10, marginTop: 12 }}>
        {items.map((l) => {
          const accent = l.s === "done" ? "#CBD2DC" : l.s === "now" ? "#22C55E" : "#2952b3";
          return (
            <div key={l.id} style={{ background: "#fff", border: "1px solid #ECEEF2", borderRadius: 16, padding: 12, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f", marginTop: 6 }}>{hm(l.start)}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{dur(l.start, l.end)}</div>
              <div style={{ height: 1, background: "#F1F3F6", margin: "10px 0" }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
              <div className="inline-flex items-center" style={{ marginTop: 6, background: "#F1F3F6", color: "#475569", borderRadius: 999, padding: "2px 7px", fontSize: 10, fontWeight: 600, gap: 3 }}>
                <MapPin size={9} /> {l.postcode}
              </div>
            </div>
          );
        })}
      </div>
      <Footer />
    </div>
  );
}

// ============ V7 — Dark concierge ============
function V7Concierge() {
  const items = withStatus();
  const next = items.find((l) => l.s === "next" || l.s === "now") || items[0];
  return (
    <div style={{ fontFamily: FONT, background: "#0F172A", borderRadius: 24, padding: 18, color: "#fff" }}>
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "1.4px", fontWeight: 700, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>Today</div>
        </div>
        <div className="text-right">
          <div style={{ fontSize: 11, color: "#94A3B8" }}>Done</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{items.filter(i=>i.s==="done").length}/{items.length}</div>
        </div>
      </div>

      <div style={{ marginTop: 14, background: "rgba(59,130,246,.14)", border: "1px solid rgba(59,130,246,.3)", borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 10, color: "#93C5FD", letterSpacing: 1, fontWeight: 700 }}>UP NEXT · IN 32 MIN</div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>{next.name}</div>
        <div className="flex items-center" style={{ fontSize: 12, color: "#CBD5E1", marginTop: 4, gap: 6 }}>
          <span>{hm(next.start)} · {dur(next.start, next.end)}</span><span>·</span><MapPin size={11} /><span>{next.postcode}</span>
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: 1, marginTop: 12, background: "rgba(255,255,255,.04)", borderRadius: 12, overflow: "hidden" }}>
        {items.filter(i=>i.id !== next.id).map((l) => (
          <div key={l.id} className="flex items-center" style={{ padding: "10px 12px", gap: 12 }}>
            <div style={{ width: 44, fontSize: 13, fontWeight: 600, color: l.s === "done" ? "#64748B" : "#E2E8F0" }}>{hm(l.start)}</div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13, fontWeight: 600, color: l.s === "done" ? "#64748B" : "#fff", textDecoration: l.s === "done" ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>{l.postcode}</div>
            </div>
            {l.s === "done" && <CheckCircle2 size={14} color="#22C55E" />}
          </div>
        ))}
      </div>

      <div className="flex mt-3" style={{ gap: 8 }}>
        <button className="flex-1 flex items-center justify-center" style={{ background: "#22C55E", color: "#052e16", border: 0, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, gap: 6, fontFamily: FONT }}>
          <Plus size={14} strokeWidth={3} /> Add lesson
        </button>
        <button className="flex-1 flex items-center justify-center" style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: 0, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, gap: 6, fontFamily: FONT }}>
          <RefreshCw size={14} strokeWidth={3} /> Fill gaps
        </button>
      </div>
    </div>
  );
}

// ============ V8 — Minimal list (Apple-style) ============
function V8Minimal() {
  const items = withStatus();
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, color: "#888", letterSpacing: "1.2px", fontWeight: 600, textTransform: "uppercase" }}>{eyebrow}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1a1f", marginTop: 2, letterSpacing: "-0.5px" }}>Today</div>
      <div style={{ background: "#fff", borderRadius: 16, marginTop: 12, overflow: "hidden" }}>
        {items.map((l, i) => (
          <Fragment key={l.id}>
            {i > 0 && <div style={{ height: 1, background: "#F1F3F6", marginLeft: 70 }} />}
            <div className="flex items-center" style={{ padding: "14px 16px", gap: 14 }}>
              <div style={{ width: 56 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f", letterSpacing: "-0.3px" }}>{hm(l.start)}</div>
                <div style={{ fontSize: 12, color: "#9AA0AB" }}>{dur(l.start, l.end)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center" style={{ gap: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: l.s === "done" ? "#9AA0AB" : "#1a1a1f", textDecoration: l.s === "done" ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                  {l.s === "now" && <span style={{ width: 8, height: 8, borderRadius: 999, background: "#22C55E" }} />}
                </div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 1 }}>{l.type} · {l.postcode}</div>
              </div>
              <ChevronRight size={18} color="#C7CBD2" />
            </div>
          </Fragment>
        ))}
      </div>
      <Footer />
    </div>
  );
}

// ============ Variants registry ============
const VARIANTS = [
  { id: "v1", name: "Current",      desc: "Baseline for comparison — current live tile.",                 Component: V1Current },
  { id: "v2", name: "Timeline",     desc: "Vertical spine with status dots. Reads like a feed.",          Component: V2Timeline },
  { id: "v3", name: "Up-Next Hero", desc: "Bold gradient hero for the next lesson, then mini list.",      Component: V3Hero },
  { id: "v4", name: "Ribbon",       desc: "Compact rows with coloured left ribbon by status.",            Component: V4Ribbon },
  { id: "v5", name: "Gap-Aware",    desc: "Surfaces free slots between lessons with one-tap fill.",       Component: V5GapAware },
  { id: "v6", name: "Card Grid",    desc: "2-up cards, glanceable. Best with 2–6 lessons.",               Component: V6Grid },
  { id: "v7", name: "Concierge",    desc: "Dark premium card with AI-style summary header.",              Component: V7Concierge },
  { id: "v8", name: "Minimal",      desc: "Apple-style grouped list, hairline dividers.",                 Component: V8Minimal },
];

export default function InstructorScheduleTileLab() {
  const [active, setActive] = useState("all");
  const visible = active === "all" ? VARIANTS : VARIANTS.filter((v) => v.id === active);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Demo · sample data</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginTop: 4 }}>
            Schedule Tile — 8 Redesigns
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", marginTop: 6, maxWidth: 680 }}>
            Eight directions for the Today schedule tile on the instructor mobile homepage. All keep the same
            data and Add lesson / Fill gaps actions. Pick one and we'll port it into the live tile.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActive("all")} style={tab(active === "all")}>All 8</button>
          {VARIANTS.map((v, i) => (
            <button key={v.id} onClick={() => setActive(v.id)} style={tab(active === v.id)}>
              V{i + 1} · {v.name}
            </button>
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: visible.length === 1 ? "1fr" : "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 32, justifyItems: "center",
        }}>
          {visible.map((v) => {
            const C = v.Component;
            const num = VARIANTS.findIndex((x) => x.id === v.id) + 1;
            return (
              <div key={v.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <PhoneFrame label={`V${num} · ${v.name}`}>
                  <div style={{ padding: "16px 14px" }}>
                    <C />
                  </div>
                </PhoneFrame>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 10, maxWidth: 360, textAlign: "center" }}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function tab(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
    background: active ? "#0F172A" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#0F172A",
    border: "1px solid #E2E8F0", cursor: "pointer",
  };
}
