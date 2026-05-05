import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, Search, Sparkles, GripVertical,
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

// ---- Types & constants ----
type LessonType = "standard" | "motorway" | "mock" | "test";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface Lesson {
  id: number;
  pupil: string;
  pupilId: number;
  day: Day;
  startMin: number; // minutes from 00:00
  durationMin: number;
  type: LessonType;
}

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_START = 8;
const HOUR_END = 17; // 8..16 inclusive (9 rows including end at 17)
const HOUR_PX = 50;

const TYPE_COLOR: Record<LessonType, { line: string; bg: string; text: string; label: string }> = {
  standard: { line: "#378ADD", bg: "#E6F1FB", text: "#0B3A66", label: "Standard" },
  motorway: { line: "#1D9E75", bg: "#DEF3EA", text: "#0E4A36", label: "Motorway" },
  mock:     { line: "#BA7517", bg: "#FAEBD3", text: "#5B3A0B", label: "Mock test" },
  test:     { line: "#993556", bg: "#F7E1E8", text: "#4A1626", label: "Test" },
};

function parseStart(s: string): { day: Day; startMin: number } {
  const [d, t] = s.split(" ");
  const [h, m] = t.split(":").map(Number);
  return { day: d as Day, startMin: h * 60 + m };
}

const seedLessons: Lesson[] = [
  { id: 1, pupil: "Lucy R.",   pupilId: 5, ...parseStart("Mon 09:00"), durationMin: 60,  type: "standard" },
  { id: 2, pupil: "Marcus O.", pupilId: 7, ...parseStart("Mon 13:00"), durationMin: 120, type: "motorway" },
  { id: 3, pupil: "Sarah M.",  pupilId: 2, ...parseStart("Tue 10:00"), durationMin: 60,  type: "standard" },
  { id: 4, pupil: "James T.",  pupilId: 4, ...parseStart("Tue 14:00"), durationMin: 60,  type: "standard" },
  { id: 5, pupil: "Marcus O.", pupilId: 7, ...parseStart("Wed 10:00"), durationMin: 120, type: "mock" },
  { id: 6, pupil: "Sarah M.",  pupilId: 2, ...parseStart("Wed 16:30"), durationMin: 30,  type: "standard" },
  { id: 7, pupil: "Lucy R.",   pupilId: 5, ...parseStart("Thu 09:00"), durationMin: 60,  type: "test" },
  { id: 8, pupil: "Daniel K.", pupilId: 1, ...parseStart("Fri 11:00"), durationMin: 90,  type: "standard" },
  { id: 9, pupil: "James T.",  pupilId: 4, ...parseStart("Fri 14:00"), durationMin: 60,  type: "standard" },
  { id: 10, pupil: "Nadia B.", pupilId: 3, ...parseStart("Sat 09:00"), durationMin: 60,  type: "standard" },
  { id: 11, pupil: "Priya G.", pupilId: 6, ...parseStart("Sat 11:00"), durationMin: 60,  type: "standard" },
];

const availability: Record<Day, "off" | { start: string; end: string }> = {
  Mon: { start: "08:00", end: "17:00" },
  Tue: { start: "08:00", end: "17:00" },
  Wed: { start: "08:00", end: "18:00" },
  Thu: { start: "08:00", end: "17:00" },
  Fri: { start: "08:00", end: "17:00" },
  Sat: { start: "09:00", end: "13:00" },
  Sun: "off",
};

const palette: Record<string, { bg: string; text: string }> = {
  coral:  { bg: "#F0997B", text: "#4A1B0C" },
  blue:   { bg: "#85B7EB", text: "#042C53" },
  green:  { bg: "#C0DD97", text: "#173404" },
  pink:   { bg: "#ED93B1", text: "#4B1528" },
  purple: { bg: "#AFA9EC", text: "#26215C" },
  gray:   { bg: "#B4B2A9", text: "#2C2C2A" },
  amber:  { bg: "#FAC775", text: "#412402" },
};

const unbookedSeed = [
  { id: 1, name: "Daniel K.", initials: "DK", avatarColor: "coral",  lastLessonDays: 88 },
  { id: 3, name: "Nadia B.",  initials: "NB", avatarColor: "green",  lastLessonDays: 36 },
  { id: 99, name: "Ravi H.",  initials: "RH", avatarColor: "amber",  lastLessonDays: 12 },
  { id: 88, name: "Amir H.",  initials: "AH", avatarColor: "pink",   lastLessonDays: 5 },
];

const TODAY: Day = (() => {
  const map: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[new Date().getDay()];
})();

function fmtTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---- Page ----
type View = "day" | "week" | "month" | "agenda";

export default function InstructorScheduleDesktop() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const [view, setView] = useState<View>("week");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [activeDrag, setActiveDrag] = useState<{ kind: "pupil"; pupil: typeof unbookedSeed[number] } | { kind: "lesson"; lesson: Lesson } | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<{ label: string }[] | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const totals = useMemo(() => {
    const count = lessons.length;
    const minutes = lessons.reduce((s, l) => s + l.durationMin, 0);
    const earnings = Math.round((minutes / 60) * 34); // £34/h placeholder
    return { count, hours: (minutes / 60).toFixed(1), earnings };
  }, [lessons]);

  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };
  const initials = (instructor?.name || "").split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ID";

  // ---- DnD handlers ----
  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as any;
    if (data?.kind === "pupil") setActiveDrag({ kind: "pupil", pupil: data.pupil });
    else if (data?.kind === "lesson") setActiveDrag({ kind: "lesson", lesson: data.lesson });
  }

  function onDragEnd(e: DragEndEvent) {
    const drag = activeDrag;
    setActiveDrag(null);
    if (!drag || !e.over) return;
    const overData = e.over.data.current as any;
    if (!overData?.day) return;
    const day = overData.day as Day;
    if (availability[day] === "off") return;

    // Compute drop minute from cursor Y over the column
    const rect = (e.over.rect as any) as DOMRect;
    const pointerY = e.activatorEvent && "clientY" in e.activatorEvent
      ? (e.activatorEvent as PointerEvent).clientY + (e.delta?.y ?? 0)
      : rect.top;
    const offsetMin = Math.max(0, Math.round(((pointerY - rect.top) / HOUR_PX) * 60 / 15) * 15);
    const startMin = HOUR_START * 60 + offsetMin;

    if (drag.kind === "pupil") {
      const newL: Lesson = {
        id: Date.now(), pupil: drag.pupil.name, pupilId: drag.pupil.id,
        day, startMin, durationMin: 60, type: "standard",
      };
      setLessons(ls => [...ls, newL]);
      toast(`Lesson booked · ${drag.pupil.name} ${day} ${fmtTime(startMin)}`);
    } else {
      const moved = drag.lesson;
      setLessons(ls => ls.map(l => l.id === moved.id ? { ...l, day, startMin } : l));
      toast(`Moved to ${day} ${fmtTime(startMin)}`, {
        action: { label: "Undo", onClick: () => setLessons(ls => ls.map(l => l.id === moved.id ? moved : l)) },
      });
    }
  }

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
      rightRail={
        <RightRail
          unbooked={[]}
          aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
          aiSuggestions={aiSuggestions}
          onAskAi={() => {
            if (!aiPrompt.trim()) return;
            setAiSuggestions([
              { label: "Tue 13:00" }, { label: "Wed 09:00" }, { label: "Fri 16:00" },
            ]);
          }}
        />
      }
    >
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex flex-col" style={{ gap: 0, padding: 0, margin: -8 }}>
          {/* Toolbar */}
          <div className="flex items-center" style={{ gap: 10, marginBottom: 14 }}>
            <button style={iconBtn}><ChevronLeft size={13} /></button>
            <button style={iconBtn}><ChevronRight size={13} /></button>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)" }}>May 4 – 10, 2026</div>
            <button style={{ ...outlinePill }}>Today</button>
            <div style={{ flex: 1 }} />
            <div className="flex items-center" style={{ background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 2 }}>
              {(["day", "week", "month", "agenda"] as View[]).map(v => {
                const a = v === view;
                return (
                  <button key={v} onClick={() => setView(v)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11,
                      background: a ? "#fff" : "transparent",
                      color: a ? "var(--d2-text-1)" : "var(--d2-text-2)",
                      fontWeight: a ? 500 : 400, textTransform: "capitalize",
                      boxShadow: a ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                    }}>{v}</button>
                );
              })}
            </div>
            <button style={{ ...outlinePill, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Search size={11} /> Find slot
            </button>
            <button style={{
              fontSize: 11, padding: "6px 10px", borderRadius: 8,
              background: "#4F46E5", color: "#fff", fontWeight: 500,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <Plus size={12} /> New lesson
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center" style={{ gap: 12, marginBottom: 12, fontSize: 10, color: "var(--d2-text-2)" }}>
            {(Object.keys(TYPE_COLOR) as LessonType[]).map(t => (
              <div key={t} className="flex items-center" style={{ gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR[t].line }} />
                <span>{TYPE_COLOR[t].label}</span>
              </div>
            ))}
          </div>

          {/* Calendar */}
          {view === "week" && (
            <WeekGrid
              lessons={lessons}
              now={now}
              onSelectLesson={setSelectedLesson}
            />
          )}
          {view === "day" && <PlaceholderView text="Day view — single column with 30-min rows." />}
          {view === "month" && <PlaceholderView text="Month view — compact bars per cell." />}
          {view === "agenda" && <AgendaView lessons={lessons} />}

          {/* Footer summary */}
          <div className="flex items-center" style={{
            background: "#F8FAFC", borderRadius: 8, padding: "10px 12px",
            marginTop: 12, gap: 16, fontSize: 11, color: "var(--d2-text-2)",
          }}>
            <span><span style={{ color: "var(--d2-text-3)" }}>This week:</span> <strong style={{ color: "var(--d2-text-1)", fontWeight: 600 }}>{totals.count} lessons</strong></span>
            <span><span style={{ color: "var(--d2-text-3)" }}>Hours:</span> <strong style={{ color: "var(--d2-text-1)", fontWeight: 600, fontFamily: "var(--d2-mono)" }}>{totals.hours}</strong></span>
            <span><span style={{ color: "var(--d2-text-3)" }}>Earnings:</span> <strong style={{ color: "var(--d2-text-1)", fontWeight: 600, fontFamily: "var(--d2-mono)" }}>£{totals.earnings}</strong></span>
            <div style={{ flex: 1 }} />
            <button style={{ color: "#4F46E5", fontWeight: 500 }}>Open slots: 8 →</button>
          </div>
        </div>

        <DragOverlay>
          {activeDrag?.kind === "pupil" && (
            <div style={{
              background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6,
              padding: "7px 8px", display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 11, fontWeight: 500, boxShadow: "0 6px 16px rgba(15,23,42,0.12)",
            }}>
              <Avatar color={activeDrag.pupil.avatarColor} initials={activeDrag.pupil.initials} />
              {activeDrag.pupil.name}
            </div>
          )}
          {activeDrag?.kind === "lesson" && <LessonGhost lesson={activeDrag.lesson} />}
        </DragOverlay>
      </DndContext>

      {/* Lesson popover */}
      {selectedLesson && (
        <div onClick={() => setSelectedLesson(null)} style={{
          position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 10, padding: 16, width: 320,
            boxShadow: "0 20px 40px rgba(15,23,42,0.2)",
          }}>
            <div className="flex items-center" style={{ gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: TYPE_COLOR[selectedLesson.type].bg,
                color: TYPE_COLOR[selectedLesson.type].text,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
              }}>{selectedLesson.pupil.split(" ").map(s => s[0]).join("")}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedLesson.pupil}</div>
                <div style={{ fontSize: 11, color: "var(--d2-text-3)" }}>
                  {selectedLesson.day} · {fmtTime(selectedLesson.startMin)} · {selectedLesson.durationMin}m · {TYPE_COLOR[selectedLesson.type].label}
                </div>
              </div>
            </div>
            <div className="flex" style={{ gap: 6, marginTop: 12 }}>
              <button style={smallBtn}>Edit</button>
              <button style={smallBtn}>Cancel</button>
              <button style={{ ...smallBtn, background: "#4F46E5", color: "#fff", border: "none" }}>Mark complete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

const iconBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 5, border: "0.5px solid var(--d2-border)",
  background: "#fff", color: "var(--d2-text-2)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

const outlinePill: React.CSSProperties = {
  fontSize: 11, padding: "5px 10px", borderRadius: 8,
  border: "0.5px solid var(--d2-border)", background: "#fff",
  color: "var(--d2-text-2)",
};

const smallBtn: React.CSSProperties = {
  fontSize: 11, padding: "5px 10px", borderRadius: 6,
  border: "0.5px solid var(--d2-border)", background: "#fff",
  color: "var(--d2-text-1)", flex: 1,
};

// ---- Week grid ----
function WeekGrid({
  lessons, now, onSelectLesson,
}: { lessons: Lesson[]; now: Date; onSelectLesson: (l: Lesson) => void }) {
  const rows = HOUR_END - HOUR_START + 1;
  const dates = ["4", "5", "6", "7", "8", "9", "10"];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - HOUR_START * 60) / 60) * HOUR_PX;

  return (
    <div style={{
      background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6,
      overflow: "hidden",
    }}>
      {/* Day header row */}
      <div style={{
        display: "grid", gridTemplateColumns: "38px repeat(7, 1fr)",
        background: "#F8FAFC", borderBottom: "0.5px solid var(--d2-border)",
      }}>
        <div />
        {DAYS.map((d, i) => {
          const isToday = d === TODAY;
          return (
            <div key={d} style={{
              padding: 7, textAlign: "center",
              background: isToday ? "#EEF2FF" : "transparent",
              borderLeft: "0.5px solid var(--d2-border)",
            }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: isToday ? "#4338CA" : "var(--d2-text-3)" }}>{d}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? "#4338CA" : "var(--d2-text-1)" }}>{dates[i]}</div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "38px repeat(7, 1fr)" }}>
        {/* Time col */}
        <div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{
              height: HOUR_PX, padding: "4px 6px", textAlign: "right",
              fontSize: 9, color: "var(--d2-text-3)",
              borderBottom: "0.5px solid var(--d2-border)",
            }}>
              {String(HOUR_START + i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {DAYS.map(d => (
          <DayColumn
            key={d}
            day={d}
            rows={rows}
            lessons={lessons.filter(l => l.day === d)}
            isToday={d === TODAY}
            nowTop={nowTop}
            onSelectLesson={onSelectLesson}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day, rows, lessons, isToday, nowTop, onSelectLesson,
}: {
  day: Day; rows: number; lessons: Lesson[]; isToday: boolean; nowTop: number;
  onSelectLesson: (l: Lesson) => void;
}) {
  const off = availability[day] === "off";
  const { setNodeRef, isOver } = useDroppable({ id: `col-${day}`, data: { day }, disabled: off });
  const height = rows * HOUR_PX;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "relative", height,
        borderLeft: "0.5px solid var(--d2-border)",
        background: off
          ? "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(15,23,42,0.025) 6px, rgba(15,23,42,0.025) 12px)"
          : isToday ? "#FAFBFF" : "transparent",
        boxShadow: isOver && !off ? "inset 0 0 0 2px rgba(79,70,229,0.25)" : "none",
        transition: "box-shadow 120ms",
      }}
    >
      {/* Hour grid lines */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", left: 0, right: 0, top: i * HOUR_PX, height: HOUR_PX,
          borderBottom: "0.5px solid var(--d2-border)",
        }} />
      ))}

      {off && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, color: "var(--d2-text-3)", fontWeight: 500,
          letterSpacing: "0.5px", textTransform: "uppercase",
        }}>Day off</div>
      )}

      {!off && lessons.map(l => (
        <LessonCard
          key={l.id} lesson={l}
          onClick={() => onSelectLesson(l)}
        />
      ))}

      {isToday && nowTop >= 0 && nowTop <= height && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: nowTop, height: 1,
          background: "#4F46E5", zIndex: 5,
        }}>
          <div style={{
            position: "absolute", left: -3, top: -3, width: 7, height: 7,
            borderRadius: "50%", background: "#4F46E5",
          }} />
        </div>
      )}
    </div>
  );
}

function LessonCard({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
  const c = TYPE_COLOR[lesson.type];
  const top = ((lesson.startMin - HOUR_START * 60) / 60) * HOUR_PX;
  const height = (lesson.durationMin / 60) * HOUR_PX - 2;
  const isShort = lesson.durationMin < 45;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lesson-${lesson.id}`, data: { kind: "lesson", lesson },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes} {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", top, left: 2, right: 2, height,
        background: c.bg, borderLeft: `2px solid ${c.line}`, borderRadius: 4,
        padding: "3px 5px", overflow: "hidden", cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 500, color: c.text, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {lesson.pupil}
      </div>
      {!isShort && (
        <div style={{ fontSize: 9, color: c.text, opacity: 0.8 }}>
          {fmtTime(lesson.startMin)} · {lesson.durationMin >= 60 ? `${(lesson.durationMin / 60).toFixed(lesson.durationMin % 60 ? 1 : 0)}h` : `${lesson.durationMin}m`}
        </div>
      )}
      {!isShort && height > 50 && lesson.type !== "standard" && (
        <div style={{ fontSize: 9, color: c.text, opacity: 0.7, marginTop: 1 }}>{c.label}</div>
      )}
    </div>
  );
}

function LessonGhost({ lesson }: { lesson: Lesson }) {
  const c = TYPE_COLOR[lesson.type];
  return (
    <div style={{
      width: 140, background: c.bg, borderLeft: `2px solid ${c.line}`,
      borderRadius: 4, padding: "4px 6px",
      boxShadow: "0 6px 16px rgba(15,23,42,0.12)",
      fontSize: 10, fontWeight: 500, color: c.text,
    }}>
      {lesson.pupil}
      <div style={{ fontSize: 9, opacity: 0.8 }}>{fmtTime(lesson.startMin)}</div>
    </div>
  );
}

// ---- Right rail ----
function RightRail({
  unbooked, aiPrompt, setAiPrompt, aiSuggestions, onAskAi,
}: {
  unbooked: typeof unbookedSeed;
  aiPrompt: string; setAiPrompt: (s: string) => void;
  aiSuggestions: { label: string }[] | null;
  onAskAi: () => void;
}) {
  return (
    <aside style={{
      width: 280, flexShrink: 0,
      background: "#F8FAFC", borderLeft: "0.5px solid var(--d2-border)",
      padding: "16px 12px", display: "flex", flexDirection: "column", gap: 16,
    }}>
      <section>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--d2-text-3)", fontWeight: 500 }}>
          Drag to schedule
        </div>
        <div style={{ fontSize: 10, color: "var(--d2-text-2)", marginTop: 2, marginBottom: 8 }}>
          Pupils with no lesson booked this week.
        </div>
        <div className="flex flex-col" style={{ gap: 6 }}>
          {unbooked.map(p => <PupilChip key={p.id} pupil={p} />)}
        </div>
      </section>

      <section style={{ background: "#fff", borderRadius: 8, padding: 10, border: "0.5px solid var(--d2-border)" }}>
        <div className="flex items-center" style={{ gap: 5 }}>
          <Sparkles size={12} color="#4F46E5" />
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)" }}>Find me a slot</div>
        </div>
        <div style={{ fontSize: 10, color: "var(--d2-text-2)", marginTop: 4 }}>
          Tell ED what you need. e.g. "Sarah needs 2h next week, mornings only".
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAskAi(); }}>
          <input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Type a request..."
            style={{
              marginTop: 8, width: "100%", fontSize: 11,
              background: "#F8FAFC", border: "0.5px solid var(--d2-border)",
              borderRadius: 6, padding: "6px 8px", outline: "none",
            }}
          />
        </form>
        {aiSuggestions && (
          <div className="flex flex-col" style={{ gap: 4, marginTop: 8 }}>
            {aiSuggestions.map(s => (
              <button key={s.label}
                onClick={() => toast(`Booked ${s.label}`)}
                style={{
                  textAlign: "left", fontSize: 11, padding: "5px 8px",
                  borderRadius: 6, background: "#EEF2FF", color: "#4338CA",
                }}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}

function PupilChip({ pupil }: { pupil: typeof unbookedSeed[number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pupil-${pupil.id}`, data: { kind: "pupil", pupil },
  });
  return (
    <div
      ref={setNodeRef} {...attributes} {...listeners}
      style={{
        background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6,
        padding: "7px 8px", display: "flex", alignItems: "center", gap: 8,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <Avatar color={pupil.avatarColor} initials={pupil.initials} />
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)" }}>{pupil.name}</div>
        <div style={{ fontSize: 9, color: "var(--d2-text-3)" }}>Last: {pupil.lastLessonDays}d ago</div>
      </div>
      <GripVertical size={12} color="var(--d2-text-3)" />
    </div>
  );
}

function Avatar({ color, initials }: { color: string; initials: string }) {
  const c = palette[color] || palette.gray;
  return (
    <div style={{
      width: 24, height: 24, borderRadius: "50%",
      background: c.bg, color: c.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 600, flexShrink: 0,
    }}>{initials}</div>
  );
}

// ---- Other views (light) ----
function PlaceholderView({ text }: { text: string }) {
  return (
    <div style={{
      background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6,
      padding: 48, textAlign: "center", fontSize: 12, color: "var(--d2-text-3)",
    }}>
      {text}
    </div>
  );
}

function AgendaView({ lessons }: { lessons: Lesson[] }) {
  const grouped: Record<string, Lesson[]> = {};
  DAYS.forEach(d => {
    const list = lessons.filter(l => l.day === d).sort((a, b) => a.startMin - b.startMin);
    if (list.length) grouped[d] = list;
  });
  return (
    <div style={{ background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6 }}>
      {Object.entries(grouped).map(([d, list]) => {
        const total = list.reduce((s, l) => s + l.durationMin, 0);
        return (
          <div key={d} style={{ borderBottom: "0.5px solid var(--d2-border)" }}>
            <div className="flex items-center justify-between" style={{ padding: "8px 12px", background: "#F8FAFC" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--d2-text-1)" }}>{d}</div>
              <div style={{ fontSize: 10, color: "var(--d2-text-3)", fontFamily: "var(--d2-mono)" }}>{(total / 60).toFixed(1)}h</div>
            </div>
            {list.map(l => {
              const c = TYPE_COLOR[l.type];
              return (
                <div key={l.id} className="flex items-center" style={{ gap: 10, padding: "8px 12px", borderTop: "0.5px solid var(--d2-border)" }}>
                  <div style={{ fontSize: 11, fontFamily: "var(--d2-mono)", color: "var(--d2-text-2)", width: 50 }}>{fmtTime(l.startMin)}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, flex: 1 }}>{l.pupil}</div>
                  <span style={{
                    fontSize: 9, padding: "1px 6px", borderRadius: 6,
                    background: c.bg, color: c.text, textTransform: "uppercase", letterSpacing: "0.4px",
                  }}>{c.label}</span>
                  <div style={{ fontSize: 10, color: "var(--d2-text-3)", fontFamily: "var(--d2-mono)" }}>{l.durationMin}m</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
