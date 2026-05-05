import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Copy, ChevronDown, MoreHorizontal, Info, Check, Loader2,
  AlertTriangle, X, ExternalLink, CalendarDays, Pencil, Trash2,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO, isAfter, isBefore, differenceInCalendarDays } from "date-fns";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ---------- types ----------
type Window = { start: string; end: string };
type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
type DayCfg = { enabled: boolean; windows: Window[] };
type WeeklyHours = Record<DayKey, DayCfg>;
type Category = "holiday" | "training" | "bank-holiday" | "personal" | "sick" | "other";
type TimeOff = {
  id: string; title: string; category: Category;
  start: string; end: string; auto?: boolean; recurring?: { freq: "yearly" }; notes?: string;
};
type BookingRules = {
  travelBufferMin: number; minLeadHours: number; horizonWeeks: number;
  slotIncrementMin: number; allowSameDay: boolean; autoBlockBankHolidays: boolean;
};

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LONG: Record<DayKey, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

const HOUR_START = 6;
const HOUR_END = 22;
const HOUR_SPAN = HOUR_END - HOUR_START; // 16

const CAT_DOT: Record<Category, string> = {
  holiday: "#993556",
  training: "#BA7517",
  "bank-holiday": "#1D9E75",
  personal: "#94A3B8",
  sick: "#94A3B8",
  other: "#94A3B8",
};
const CAT_LABEL: Record<Category, string> = {
  holiday: "Holiday", training: "Training", "bank-holiday": "Bank holiday",
  personal: "Personal", sick: "Sick", other: "Other",
};

// ---------- helpers ----------
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (mins: number) => {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
const winHours = (w: Window) => Math.max(0, (toMin(w.end) - toMin(w.start)) / 60);
const dayHours = (d: DayCfg) => d.enabled ? d.windows.reduce((s, w) => s + winHours(w), 0) : 0;

const HATCH = "repeating-linear-gradient(45deg,#F1F5F9 0 4px,#E8EDF3 4px 8px)";

// ---------- seed data ----------
const seedWeekly: WeeklyHours = {
  Mon: { enabled: true,  windows: [{ start: "09:00", end: "18:00" }] },
  Tue: { enabled: true,  windows: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  Wed: { enabled: true,  windows: [{ start: "09:00", end: "20:00" }] },
  Thu: { enabled: true,  windows: [{ start: "09:00", end: "18:00" }] },
  Fri: { enabled: true,  windows: [{ start: "09:00", end: "14:00" }] },
  Sat: { enabled: true,  windows: [{ start: "10:00", end: "14:00" }] },
  Sun: { enabled: false, windows: [] },
};

const seedTimeOff: TimeOff[] = [
  { id: "to1", title: "Family holiday", category: "holiday", start: "2026-08-05", end: "2026-08-19", recurring: { freq: "yearly" } },
  { id: "to2", title: "DVSA training day", category: "training", start: "2026-05-22", end: "2026-05-22" },
  { id: "to3", title: "Bank holiday — early May", category: "bank-holiday", start: "2026-05-05", end: "2026-05-05", auto: true },
  { id: "to4", title: "Christmas break", category: "holiday", start: "2025-12-23", end: "2026-01-05" },
];

const seedRules: BookingRules = {
  travelBufferMin: 15, minLeadHours: 24, horizonWeeks: 8,
  slotIncrementMin: 30, allowSameDay: false, autoBlockBankHolidays: true,
};

// ---------- small UI atoms ----------
function Toggle({ on, onChange, size = "sm" }: { on: boolean; onChange: (v: boolean) => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? 24 : 32;
  const h = size === "sm" ? 14 : 18;
  const t = h - 3;
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: w, height: h, borderRadius: 999,
        background: on ? "#4F46E5" : "#CBD5E1",
        position: "relative", border: "none", cursor: "pointer",
        transition: "background 160ms ease",
      }}
      aria-pressed={on}
    >
      <span style={{
        position: "absolute", top: 1.5, left: on ? w - t - 1.5 : 1.5,
        width: t, height: t, background: "#fff", borderRadius: 999,
        transition: "left 160ms ease",
      }} />
    </button>
  );
}

function Chip({
  children, onClick, mono = true, small = false,
}: { children: React.ReactNode; onClick?: () => void; mono?: boolean; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: small ? "3px 6px" : "4px 7px",
        borderRadius: 5, background: "#F8FAFC", border: "0.5px solid #E2E8F0",
        fontSize: small ? 10 : 11, color: "#0F172A",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
        cursor: onClick ? "pointer" : "default",
        display: "inline-flex", alignItems: "center", gap: 4, lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function TimePickerPopover({
  value, onChange, children,
}: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let m = 0; m <= 24 * 60; m += 15) out.push(toTime(m));
    return out;
  }, []);
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start" sideOffset={4}
        className="p-0 w-24"
        style={{ borderRadius: 8 }}
      >
        <div ref={ref} style={{ maxHeight: 220, overflowY: "auto" }}>
          {slots.map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              style={{
                width: "100%", padding: "6px 10px", textAlign: "left",
                fontSize: 11, fontFamily: "ui-monospace, monospace",
                background: s === value ? "#EEF2FF" : "transparent",
                color: s === value ? "#4F46E5" : "#0F172A",
                border: "none", cursor: "pointer", display: "block",
              }}
            >{s}</button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- weekly hours ----------
function WeeklyHoursCard({
  weekly, setWeekly, avgRate,
}: { weekly: WeeklyHours; setWeekly: (w: WeeklyHours) => void; avgRate: number }) {
  // memoize windows when day toggled off
  const memoRef = useRef<Partial<Record<DayKey, Window[]>>>({});

  const total = useMemo(() => DAYS.reduce((s, d) => s + dayHours(weekly[d]), 0), [weekly]);
  const est = Math.round(total * avgRate);

  const toggleDay = (d: DayKey) => {
    const cur = weekly[d];
    if (cur.enabled) {
      memoRef.current[d] = cur.windows;
      setWeekly({ ...weekly, [d]: { enabled: false, windows: [] } });
    } else {
      const restored = memoRef.current[d] && memoRef.current[d]!.length
        ? memoRef.current[d]!
        : [{ start: "09:00", end: "18:00" }];
      setWeekly({ ...weekly, [d]: { enabled: true, windows: restored } });
    }
  };

  const updateWindow = (d: DayKey, idx: number, w: Window) => {
    const next = { ...weekly[d], windows: weekly[d].windows.map((x, i) => i === idx ? w : x) };
    setWeekly({ ...weekly, [d]: next });
  };
  const addWindow = (d: DayKey) => {
    const cur = weekly[d];
    // find sensible gap, fallback 17:00–19:00
    const sorted = [...cur.windows].sort((a, b) => toMin(a.start) - toMin(b.start));
    let start = "17:00", end = "19:00";
    for (let i = 0; i < sorted.length - 1; i++) {
      const gapStart = toMin(sorted[i].end);
      const gapEnd = toMin(sorted[i + 1].start);
      if (gapEnd - gapStart >= 60) { start = toTime(gapStart); end = toTime(Math.min(gapStart + 120, gapEnd)); break; }
    }
    setWeekly({ ...weekly, [d]: { enabled: true, windows: [...cur.windows, { start, end }] } });
  };
  const removeWindow = (d: DayKey, idx: number) => {
    const next = weekly[d].windows.filter((_, i) => i !== idx);
    setWeekly({ ...weekly, [d]: { ...weekly[d], windows: next } });
  };
  const copyToWeekdays = () => {
    // copy Monday's hours to Mon-Fri
    const src = weekly.Mon;
    const next = { ...weekly };
    (["Mon", "Tue", "Wed", "Thu", "Fri"] as DayKey[]).forEach(d => {
      next[d] = { enabled: true, windows: src.windows.map(w => ({ ...w })) };
    });
    setWeekly(next);
    toast.success("Applied Monday's hours to all weekdays");
  };
  const applyTemplate = (t: string) => {
    const tpls: Record<string, WeeklyHours> = {
      "std": {
        Mon: { enabled: true, windows: [{ start: "09:00", end: "18:00" }] },
        Tue: { enabled: true, windows: [{ start: "09:00", end: "18:00" }] },
        Wed: { enabled: true, windows: [{ start: "09:00", end: "18:00" }] },
        Thu: { enabled: true, windows: [{ start: "09:00", end: "18:00" }] },
        Fri: { enabled: true, windows: [{ start: "09:00", end: "18:00" }] },
        Sat: { enabled: false, windows: [] },
        Sun: { enabled: false, windows: [] },
      },
      "ext": {
        Mon: { enabled: true, windows: [{ start: "07:00", end: "20:00" }] },
        Tue: { enabled: true, windows: [{ start: "07:00", end: "20:00" }] },
        Wed: { enabled: true, windows: [{ start: "07:00", end: "20:00" }] },
        Thu: { enabled: true, windows: [{ start: "07:00", end: "20:00" }] },
        Fri: { enabled: true, windows: [{ start: "07:00", end: "20:00" }] },
        Sat: { enabled: true, windows: [{ start: "09:00", end: "16:00" }] },
        Sun: { enabled: false, windows: [] },
      },
      "school": {
        Mon: { enabled: true, windows: [{ start: "09:30", end: "14:30" }] },
        Tue: { enabled: true, windows: [{ start: "09:30", end: "14:30" }] },
        Wed: { enabled: true, windows: [{ start: "09:30", end: "14:30" }] },
        Thu: { enabled: true, windows: [{ start: "09:30", end: "14:30" }] },
        Fri: { enabled: true, windows: [{ start: "09:30", end: "14:30" }] },
        Sat: { enabled: false, windows: [] },
        Sun: { enabled: false, windows: [] },
      },
      "weekends": {
        Mon: { enabled: false, windows: [] }, Tue: { enabled: false, windows: [] },
        Wed: { enabled: false, windows: [] }, Thu: { enabled: false, windows: [] },
        Fri: { enabled: false, windows: [] },
        Sat: { enabled: true, windows: [{ start: "09:00", end: "18:00" }] },
        Sun: { enabled: true, windows: [{ start: "09:00", end: "18:00" }] },
      },
    };
    setWeekly(tpls[t]);
    toast.success("Template applied");
  };

  return (
    <div style={{
      background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12,
      padding: 16, marginBottom: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>Weekly hours</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Your usual teaching hours. Pupils can only book within these times.
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={copyToWeekdays} style={smallBtnStyle}>
            <Copy size={11} /> Apply to all weekdays
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button style={smallBtnStyle}>Use template <ChevronDown size={11} /></button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-1 w-56" style={{ borderRadius: 8 }}>
              {[
                ["std", "Standard 9–6 weekdays"],
                ["ext", "Extended 7–8"],
                ["school", "School run"],
                ["weekends", "Weekends only"],
              ].map(([k, l]) => (
                <button key={k} onClick={() => applyTemplate(k)} style={{
                  width: "100%", padding: "8px 10px", textAlign: "left", fontSize: 12,
                  border: "none", background: "transparent", cursor: "pointer", borderRadius: 6,
                }} className="hover:bg-slate-50">
                  {l}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Hour ruler */}
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 110px 70px", gap: 14, marginBottom: 6 }}>
        <div />
        <div style={{ position: "relative", height: 12 }}>
          {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
            <div key={h} style={{
              position: "absolute", left: `${((h - HOUR_START) / HOUR_SPAN) * 100}%`,
              transform: "translateX(-50%)", fontSize: 9, color: "#94A3B8",
            }}>{h.toString().padStart(2, "0")}</div>
          ))}
        </div>
        <div /><div />
      </div>

      {/* Day rows */}
      <AnimatePresence initial={false}>
        {DAYS.map((d, idx) => (
          <motion.div
            key={d}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.04 } }}
            style={{
              display: "grid", gridTemplateColumns: "60px 1fr 110px 70px",
              gap: 14, alignItems: "center",
              padding: "8px 0", opacity: weekly[d].enabled ? 1 : 0.55,
              borderTop: idx === 0 ? "none" : "0.5px solid #F1F5F9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Toggle on={weekly[d].enabled} onChange={() => toggleDay(d)} />
              <span style={{ fontSize: 11, fontWeight: 500, color: "#0F172A" }}>{d}</span>
            </div>

            {/* Timeline */}
            <DayTimeline
              day={weekly[d]}
              onUpdate={(i, w) => updateWindow(d, i, w)}
              onCreate={(start, end) => setWeekly({ ...weekly, [d]: { ...weekly[d], windows: [...weekly[d].windows, { start, end }] } })}
            />

            {/* Time inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {weekly[d].enabled ? (
                weekly[d].windows.map((w, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <TimePickerPopover value={w.start} onChange={(v) => updateWindow(d, i, { ...w, start: v })}>
                      <button><Chip small={weekly[d].windows.length > 1}>{w.start}</Chip></button>
                    </TimePickerPopover>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>–</span>
                    <TimePickerPopover value={w.end} onChange={(v) => updateWindow(d, i, { ...w, end: v })}>
                      <button><Chip small={weekly[d].windows.length > 1}>{w.end}</Chip></button>
                    </TimePickerPopover>
                    {weekly[d].windows.length > 1 && (
                      <button onClick={() => removeWindow(d, i)} style={{
                        border: "none", background: "transparent", cursor: "pointer",
                        color: "#94A3B8", padding: 2,
                      }}><X size={10} /></button>
                    )}
                  </div>
                ))
              ) : (
                <span style={{ fontSize: 11, color: "#94A3B8" }}>—</span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              {weekly[d].enabled && (
                <>
                  <button onClick={() => addWindow(d)} title="Add window" style={iconBtn}>
                    <Plus size={12} />
                  </button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button title="Copy to..." style={iconBtn}><Copy size={11} /></button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="p-2 w-44" style={{ borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: "#64748B", marginBottom: 6 }}>Copy hours to:</div>
                      {DAYS.filter(x => x !== d).map(other => (
                        <label key={other} style={{
                          display: "flex", gap: 8, alignItems: "center", padding: "4px 2px",
                          cursor: "pointer", fontSize: 12,
                        }}>
                          <input type="checkbox" onChange={(e) => {
                            if (e.target.checked) {
                              setWeekly({ ...weekly, [other]: { enabled: true, windows: weekly[d].windows.map(w => ({ ...w })) } });
                              toast.success(`Copied to ${DAY_LONG[other]}`);
                            }
                          }} />
                          {DAY_LONG[other]}
                        </label>
                      ))}
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Footer */}
      <div style={{
        marginTop: 12, background: "#F8FAFC", borderRadius: 6, padding: "9px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11,
      }}>
        <div>
          <span style={{ color: "#94A3B8" }}>Total weekly capacity: </span>
          <strong style={{ color: "#0F172A" }}>{total} hours</strong>
        </div>
        <div style={{ color: "#64748B" }}>
          ~£{est.toLocaleString()} max revenue/week at avg £{avgRate}/hr
        </div>
      </div>

      {total < 20 && total > 0 && (
        <div style={{
          marginTop: 8, background: "#FEF3C7", borderRadius: 6, padding: "8px 10px",
          fontSize: 11, color: "#B45309", display: "flex", gap: 6, alignItems: "center",
        }}>
          <AlertTriangle size={12} />
          Heads up: you're below the 20-hour minimum recommended for full-time earnings.
        </div>
      )}
    </div>
  );
}

const smallBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 11, padding: "5px 10px", borderRadius: 6,
  border: "0.5px solid #E2E8F0", background: "#fff", color: "#475569",
  cursor: "pointer",
};
const iconBtn: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 5, background: "#F8FAFC",
  border: "0.5px solid #E2E8F0", display: "inline-flex",
  alignItems: "center", justifyContent: "center", cursor: "pointer",
  color: "#64748B",
};

// ---------- DayTimeline (drag windows) ----------
function DayTimeline({
  day, onUpdate, onCreate,
}: { day: DayCfg; onUpdate: (i: number, w: Window) => void; onCreate: (start: string, end: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const xToMin = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const mins = HOUR_START * 60 + pct * HOUR_SPAN * 60;
    return Math.round(mins / 15) * 15;
  };

  const handleEdgeDrag = (e: React.PointerEvent, i: number, edge: "left" | "right" | "move") => {
    e.preventDefault();
    e.stopPropagation();
    const w0 = day.windows[i];
    const startMin0 = toMin(w0.start);
    const endMin0 = toMin(w0.end);
    const startX = e.clientX;

    const move = (ev: PointerEvent) => {
      const r = ref.current!.getBoundingClientRect();
      const pxPerMin = r.width / (HOUR_SPAN * 60);
      const deltaMin = Math.round((ev.clientX - startX) / pxPerMin / 15) * 15;
      let s = startMin0, en = endMin0;
      if (edge === "left") s = Math.min(endMin0 - 15, Math.max(HOUR_START * 60, startMin0 + deltaMin));
      else if (edge === "right") en = Math.max(startMin0 + 15, Math.min(HOUR_END * 60, endMin0 + deltaMin));
      else {
        const span = endMin0 - startMin0;
        s = Math.max(HOUR_START * 60, Math.min(HOUR_END * 60 - span, startMin0 + deltaMin));
        en = s + span;
      }
      onUpdate(i, { start: toTime(s), end: toTime(en) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handleEmptyClick = (e: React.MouseEvent) => {
    if (!day.enabled) return;
    const m = xToMin(e.clientX);
    // ensure no overlap
    const overlap = day.windows.some(w => m < toMin(w.end) && m + 60 > toMin(w.start));
    if (overlap) return;
    onCreate(toTime(m), toTime(Math.min(m + 60, HOUR_END * 60)));
  };

  return (
    <div
      ref={ref}
      onClick={handleEmptyClick}
      style={{
        position: "relative", height: 22, background: day.enabled ? "#F8FAFC" : "transparent",
        backgroundImage: day.enabled ? undefined : HATCH,
        borderRadius: 4, cursor: day.enabled ? "crosshair" : "default",
      }}
    >
      {!day.enabled && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 9, fontWeight: 500,
          letterSpacing: 0.5, color: "#94A3B8",
        }}>UNAVAILABLE</div>
      )}
      {day.enabled && day.windows.map((w, i) => {
        const left = ((toMin(w.start) - HOUR_START * 60) / (HOUR_SPAN * 60)) * 100;
        const right = 100 - ((toMin(w.end) - HOUR_START * 60) / (HOUR_SPAN * 60)) * 100;
        const hours = winHours(w);
        return (
          <TooltipProvider key={i} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onPointerDown={(e) => handleEdgeDrag(e, i, "move")}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute", top: 0, bottom: 0,
                    left: `${left}%`, right: `${right}%`,
                    background: "#DBE3FE", borderRadius: 3,
                    borderLeft: "1px solid #4F46E5", borderRight: "1px solid #4F46E5",
                    cursor: "grab",
                  }}
                >
                  <div
                    onPointerDown={(e) => handleEdgeDrag(e, i, "left")}
                    style={{ position: "absolute", left: -3, top: 0, bottom: 0, width: 6, cursor: "ew-resize" }}
                  />
                  <div
                    onPointerDown={(e) => handleEdgeDrag(e, i, "right")}
                    style={{ position: "absolute", right: -3, top: 0, bottom: 0, width: 6, cursor: "ew-resize" }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" style={{ fontSize: 11 }}>
                {w.start} — {w.end} · {hours} hours
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// ---------- Time off card ----------
function TimeOffCard({
  items, onAdd, onUpdate, onDelete,
}: {
  items: TimeOff[];
  onAdd: (t: Omit<TimeOff, "id">) => void;
  onUpdate: (id: string, t: Partial<TimeOff>) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hidePast, setHidePast] = useState(false);
  const [draft, setDraft] = useState<Omit<TimeOff, "id">>({
    title: "", category: "holiday", start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"), notes: "",
  });

  const today = new Date();
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => a.start.localeCompare(b.start));
  }, [items]);
  const visible = hidePast
    ? sorted.filter(x => isAfter(parseISO(x.end), today) || isSameDay(parseISO(x.end), today))
    : sorted;

  const statusFor = (t: TimeOff) => {
    const start = parseISO(t.start);
    const end = parseISO(t.end);
    if (isBefore(end, today) && !isSameDay(end, today)) return { label: "PAST", bg: "#F1F5F9", color: "#94A3B8" };
    if ((isSameDay(start, today)) || (isBefore(start, today) && isAfter(end, today))) {
      return { label: "TODAY", bg: "#EEF2FF", color: "#4F46E5" };
    }
    const days = differenceInCalendarDays(start, today);
    if (days <= 30) return { label: `IN ${days} DAYS`, bg: "#FEF3C7", color: "#B45309" };
    return { label: "UPCOMING", bg: "#F1F5F9", color: "#64748B" };
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>Time off & blackout dates</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Block holidays, training days or any time you can't teach.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setHidePast(v => !v)} style={{
            ...smallBtnStyle, background: hidePast ? "#EEF2FF" : "#fff",
            color: hidePast ? "#4F46E5" : "#475569",
          }}>
            {hidePast ? "Show past" : "Hide past"}
          </button>
          <button onClick={() => setOpen(true)} style={{
            ...smallBtnStyle, background: "#4F46E5", color: "#fff", border: "none",
          }}>
            <Plus size={11} /> Add time off
          </button>
        </div>
      </div>

      <div>
        {visible.map((t) => {
          const s = statusFor(t);
          const isPast = s.label === "PAST";
          return (
            <div key={t.id} style={{
              display: "grid", gridTemplateColumns: "22px 1.5fr 1fr 90px 18px",
              gap: 10, alignItems: "center", padding: "9px 0",
              borderTop: "0.5px solid #F1F5F9",
              opacity: isPast ? 0.6 : 1,
            }}>
              <div style={{ marginLeft: 4 }}>
                <span style={{
                  display: "inline-block", width: 8, height: 8, borderRadius: 999,
                  background: CAT_DOT[t.category],
                }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}>{t.title}</div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>
                  {t.recurring ? "Recurring · yearly" : (t.start === t.end ? "Single day" : "Date range")}
                  {t.auto ? " · auto" : ""}
                </div>
              </div>
              <div style={{
                fontSize: 11, color: "#64748B",
                fontFamily: "ui-monospace, monospace",
              }}>
                {t.start === t.end
                  ? format(parseISO(t.start), "d MMM yyyy")
                  : `${format(parseISO(t.start), "d MMM")} – ${format(parseISO(t.end), "d MMM yyyy")}`}
              </div>
              <div>
                <span style={{
                  fontSize: 9, padding: "1px 6px", borderRadius: 6,
                  background: s.bg, color: s.color, fontWeight: 500, letterSpacing: 0.3,
                }}>{s.label}</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8" }}>
                    <MoreHorizontal size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="p-1 w-32" style={{ borderRadius: 8 }}>
                  {[
                    { i: <Pencil size={12} />, l: "Edit", a: () => toast("Edit time off") },
                    { i: <Copy size={12} />, l: "Duplicate", a: () => onAdd({ ...t, title: t.title + " (copy)" }) },
                    { i: <Trash2 size={12} />, l: "Delete", a: () => onDelete(t.id) },
                  ].map(opt => (
                    <button key={opt.l} onClick={opt.a} style={{
                      width: "100%", display: "flex", gap: 8, alignItems: "center",
                      padding: "6px 8px", border: "none", background: "transparent", cursor: "pointer",
                      fontSize: 12, color: "#475569", borderRadius: 6,
                    }} className="hover:bg-slate-50">
                      {opt.i} {opt.l}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ fontSize: 11, color: "#94A3B8", padding: "16px 0", textAlign: "center" }}>
            No time off scheduled.
          </div>
        )}
      </div>

      <div style={{
        marginTop: 10, background: "#EEF2FF", borderRadius: 6, padding: "8px 10px",
        fontSize: 11, color: "#4F46E5", display: "flex", gap: 6, alignItems: "flex-start",
      }}>
        <Info size={12} style={{ marginTop: 1 }} />
        UK bank holidays auto-block your calendar. Toggle off in settings if you'd rather teach them.
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add time off</SheetTitle>
          </SheetHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            <div>
              <label style={fieldLabel}>Name</label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Family holiday" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={fieldLabel}>Start</label>
                <Input type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
              </div>
              <div>
                <label style={fieldLabel}>End</label>
                <Input type="date" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Category</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  border: "1px solid #E2E8F0", fontSize: 13, background: "#fff",
                }}
              >
                {Object.entries(CAT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Notes</label>
              <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <SheetFooter style={{ marginTop: 16 }}>
            <button onClick={() => setOpen(false)} style={smallBtnStyle}>Cancel</button>
            <button onClick={() => {
              if (!draft.title.trim()) return toast.error("Add a name");
              onAdd(draft);
              setOpen(false);
              setDraft({ title: "", category: "holiday", start: format(new Date(), "yyyy-MM-dd"), end: format(new Date(), "yyyy-MM-dd"), notes: "" });
            }} style={{ ...smallBtnStyle, background: "#4F46E5", color: "#fff", border: "none" }}>
              Add time off
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: 14,
};
const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: 11, color: "#64748B", marginBottom: 4, fontWeight: 500,
};

// ---------- Booking rules ----------
function BookingRulesCard({
  rules, setRules,
}: { rules: BookingRules; setRules: (r: BookingRules) => void }) {
  const SelectChip = ({ value, options, onChange }: { value: string | number; options: { value: any; label: string }[]; onChange: (v: any) => void }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button>
          <Chip>
            {options.find(o => o.value === value)?.label ?? value}
            <ChevronDown size={10} />
          </Chip>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-1 w-32" style={{ borderRadius: 8 }}>
        {options.map(o => (
          <button key={o.label} onClick={() => onChange(o.value)} style={{
            width: "100%", padding: "6px 8px", textAlign: "left", border: "none",
            background: o.value === value ? "#EEF2FF" : "transparent",
            color: o.value === value ? "#4F46E5" : "#0F172A",
            fontSize: 12, cursor: "pointer", borderRadius: 6,
          }}>{o.label}</button>
        ))}
      </PopoverContent>
    </Popover>
  );

  const Row = ({ title, sub, control }: { title: string; sub: string; control: React.ReactNode }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", borderTop: "0.5px solid #F1F5F9", gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 12, color: "#0F172A", fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 10, color: "#94A3B8" }}>{sub}</div>
      </div>
      <div>{control}</div>
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>Booking rules</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Apply to all online bookings.</div>
      </div>
      <Row
        title="Travel buffer"
        sub="Time between back-to-back lessons"
        control={<SelectChip value={rules.travelBufferMin} onChange={(v) => setRules({ ...rules, travelBufferMin: v })}
          options={[0, 5, 10, 15, 20, 30, 45, 60].map(v => ({ value: v, label: v + " min" }))} />}
      />
      <Row
        title="Min lead time"
        sub="Earliest a pupil can book"
        control={<SelectChip value={rules.minLeadHours} onChange={(v) => setRules({ ...rules, minLeadHours: v })}
          options={[1, 2, 6, 12, 24, 48, 168].map(v => ({ value: v, label: v >= 168 ? "1 week" : v + " hours" }))} />}
      />
      <Row
        title="Booking horizon"
        sub="How far ahead can be booked"
        control={<SelectChip value={rules.horizonWeeks} onChange={(v) => setRules({ ...rules, horizonWeeks: v })}
          options={[1, 2, 4, 6, 8, 12, 26].map(v => ({ value: v, label: v + " weeks" }))} />}
      />
      <Row
        title="Slot increments"
        sub="Bookable in steps of"
        control={<SelectChip value={rules.slotIncrementMin} onChange={(v) => setRules({ ...rules, slotIncrementMin: v })}
          options={[15, 30, 60].map(v => ({ value: v, label: v + " min" }))} />}
      />
      <Row
        title="Allow same-day bookings"
        sub="Let pupils book today's free slots"
        control={<Toggle on={rules.allowSameDay} onChange={(v) => setRules({ ...rules, allowSameDay: v })} />}
      />
      <Row
        title="Auto-block UK bank holidays"
        sub="Automatically add UK bank holidays as time off"
        control={<Toggle on={rules.autoBlockBankHolidays} onChange={(v) => setRules({ ...rules, autoBlockBankHolidays: v })} />}
      />
    </div>
  );
}

// ---------- 4-week preview ----------
function FourWeekPreview({ weekly, timeOff }: { weekly: WeeklyHours; timeOff: TimeOff[] }) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 28 }, (_, i) => addDays(start, i));
  const today = new Date();

  const intensity = (h: number) => {
    if (h <= 0) return null;
    if (h <= 2) return "#C8DDF6";
    if (h <= 6) return "#85B7EB";
    if (h <= 9) return "#4A95DC";
    return "#1B5DA2";
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>4-week preview</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            How your availability looks to pupils right now.
          </div>
        </div>
        <a href="#" style={{ fontSize: 10, color: "#4F46E5", display: "inline-flex", alignItems: "center", gap: 3 }}>
          Open booking page <ExternalLink size={10} />
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} style={{ fontSize: 9, textAlign: "center", color: "#94A3B8", letterSpacing: 0.4 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {days.map((d, i) => {
          const dk = DAYS[(d.getDay() + 6) % 7];
          const cfg = weekly[dk];
          const event = timeOff.find(t => {
            const ts = parseISO(t.start), te = parseISO(t.end);
            return (isSameDay(d, ts) || isAfter(d, ts)) && (isSameDay(d, te) || isBefore(d, te));
          });
          const isOff = !cfg.enabled;
          const isToday = isSameDay(d, today);
          const hours = isOff || event ? 0 : dayHours(cfg);
          const color = intensity(hours);
          const bg = isToday ? "#EEF2FF"
            : event ? `${CAT_DOT[event.category]}1A`
            : "#F8FAFC";
          const showHatch = isOff || !!event;

          return (
            <TooltipProvider key={i} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div style={{
                    height: 56, borderRadius: 5, padding: 6, position: "relative",
                    background: bg,
                    cursor: "pointer",
                  }}>
                    <div style={{
                      fontSize: 10, color: isToday ? "#4F46E5" : "#0F172A",
                      fontWeight: isToday ? 600 : 400,
                    }}>{format(d, "d")}</div>
                    {showHatch ? (
                      <>
                        <div style={{
                          position: "absolute", left: 6, right: 6, bottom: 14, height: 4,
                          background: event ? `${CAT_DOT[event.category]}66` : undefined,
                          backgroundImage: !event ? HATCH : undefined, borderRadius: 1,
                        }} />
                        <div style={{
                          position: "absolute", bottom: 4, left: 6,
                          fontSize: 8, color: "#94A3B8",
                          maxWidth: "calc(100% - 12px)", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {event ? (event.category === "bank-holiday" ? "Bank hol" : event.title.split(" ")[0]) : "Off"}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{
                          position: "absolute", left: 6, right: 6, bottom: 14, height: 4,
                          background: color || "#E2E8F0", borderRadius: 1,
                        }} />
                        <div style={{
                          position: "absolute", bottom: 4, left: 6,
                          fontSize: 8, color: isToday ? "#4F46E5" : "#94A3B8",
                        }}>
                          {hours}h free
                        </div>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent style={{ fontSize: 11 }}>
                  {format(d, "EEE d MMM")} · {event ? event.title : (isOff ? "Day off" : `${hours}h free`)}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      <div style={{
        marginTop: 12, display: "flex", gap: 14, fontSize: 9, color: "#94A3B8",
        flexWrap: "wrap",
      }}>
        {[
          { c: "#C8DDF6", l: "Mostly booked" },
          { c: "#85B7EB", l: "Some availability" },
          { c: "#1B5DA2", l: "Wide open" },
          { c: "#BA751766", l: "Time off", hatched: true },
        ].map((x, i) => (
          <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{
              width: 8, height: 4, borderRadius: 1,
              background: x.c,
              backgroundImage: x.hatched ? HATCH : undefined,
            }} />
            {x.l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Page ----------
import { useQueryClient } from "@tanstack/react-query";
import {
  useAvailabilityData,
  saveWeeklyDay,
  insertTimeOff,
  updateTimeOffRow,
  deleteTimeOffRow,
  saveBookingRules,
  DEFAULT_RULES,
} from "@/hooks/useAvailabilityData";

export default function InstructorAvailabilityDesktop() {
  const { instructor, signOut } = useInstructorAuth();
  const initials = (instructor?.name?.split(" ").map((p) => p[0]).slice(0, 2).join("") || "IN").toUpperCase();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);
  const queryClient = useQueryClient();

  const { data, isLoading } = useAvailabilityData(instructor?.id);

  const [weekly, setWeekly] = useState<WeeklyHours | null>(null);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [rules, setRules] = useState<BookingRules>(DEFAULT_RULES);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");

  // Hydrate from server once loaded
  const hydrated = useRef(false);
  const lastSavedWeekly = useRef<WeeklyHours | null>(null);
  const lastSavedRules = useRef<BookingRules | null>(null);

  useEffect(() => {
    if (!data || hydrated.current) return;
    setWeekly(data.weekly);
    setTimeOff(data.timeOff);
    setRules(data.rules);
    lastSavedWeekly.current = data.weekly;
    lastSavedRules.current = data.rules;
    hydrated.current = true;
  }, [data]);

  // Debounced autosave for weekly hours (per-day diff)
  const weeklyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!weekly || !instructor?.id || !lastSavedWeekly.current) return;
    if (weeklyTimer.current) clearTimeout(weeklyTimer.current);
    setSaveState("saving");
    weeklyTimer.current = setTimeout(async () => {
      try {
        const prev = lastSavedWeekly.current!;
        const changed = DAYS.filter((d) => JSON.stringify(prev[d]) !== JSON.stringify(weekly[d]));
        for (const d of changed) {
          await saveWeeklyDay(instructor.id, d, weekly[d]);
        }
        lastSavedWeekly.current = weekly;
        setSaveState("saved");
        if (changed.length) {
          queryClient.invalidateQueries({ queryKey: ["availability-windows"] });
        }
      } catch (e) {
        console.error(e);
        setSaveState("error");
        toast.error("Couldn't save weekly hours");
      }
    }, 600);
    return () => { if (weeklyTimer.current) clearTimeout(weeklyTimer.current); };
  }, [weekly, instructor?.id, queryClient]);

  // Debounced autosave for booking rules
  const rulesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!instructor?.id || !lastSavedRules.current) return;
    if (JSON.stringify(rules) === JSON.stringify(lastSavedRules.current)) return;
    if (rulesTimer.current) clearTimeout(rulesTimer.current);
    setSaveState("saving");
    rulesTimer.current = setTimeout(async () => {
      try {
        await saveBookingRules(instructor.id, rules);
        lastSavedRules.current = rules;
        setSaveState("saved");
      } catch (e) {
        console.error(e);
        setSaveState("error");
        toast.error("Couldn't save booking rules");
      }
    }, 600);
    return () => { if (rulesTimer.current) clearTimeout(rulesTimer.current); };
  }, [rules, instructor?.id]);

  const addTimeOff = useCallback(async (t: Omit<TimeOff, "id">) => {
    if (!instructor?.id) return;
    setSaveState("saving");
    try {
      const created = await insertTimeOff(instructor.id, t);
      setTimeOff((prev) => [...prev, created]);
      setSaveState("saved");
      toast.success("Time off added");
    } catch (e) {
      console.error(e);
      setSaveState("error");
      toast.error("Couldn't add time off");
    }
  }, [instructor?.id]);

  const updateTimeOff = useCallback(async (id: string, patch: Partial<TimeOff>) => {
    setTimeOff(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
    setSaveState("saving");
    try {
      await updateTimeOffRow(id, patch);
      setSaveState("saved");
    } catch (e) {
      console.error(e);
      setSaveState("error");
      toast.error("Couldn't update time off");
    }
  }, []);

  const deleteTimeOff = useCallback(async (id: string) => {
    const prev = timeOff;
    setTimeOff((p) => p.filter(x => x.id !== id));
    setSaveState("saving");
    try {
      await deleteTimeOffRow(id);
      setSaveState("saved");
      toast.success("Time off removed");
    } catch (e) {
      console.error(e);
      setTimeOff(prev);
      setSaveState("error");
      toast.error("Couldn't remove time off");
    }
  }, [timeOff]);

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || ""}
      notificationCount={notificationCount}
      onSignOut={signOut}
      onAskED={() => {}}
      onBell={() => {}}
    >
      <div style={{ maxWidth: 1280 }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: "#0F172A", letterSpacing: "-0.01em", margin: 0 }}>
              Availability
            </h1>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              Set when you teach and protect time off.
            </div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
            {saveState === "saved" && (
              <>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: "#10B981" }} />
                All changes saved
              </>
            )}
            {saveState === "saving" && (
              <>
                <Loader2 size={11} className="animate-spin" />
                Saving...
              </>
            )}
            {saveState === "error" && (
              <span style={{ color: "#E11D48" }}>Couldn't save · Retry</span>
            )}
          </div>
        </div>

        <WeeklyHoursCard weekly={weekly} setWeekly={setWeekly} avgRate={38} />

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, marginBottom: 14 }}>
          <TimeOffCard items={timeOff} onAdd={addTimeOff} onUpdate={updateTimeOff} onDelete={deleteTimeOff} />
          <BookingRulesCard rules={rules} setRules={setRules} />
        </div>

        <FourWeekPreview weekly={weekly} timeOff={timeOff} />
      </div>
    </DashboardShell>
  );
}
