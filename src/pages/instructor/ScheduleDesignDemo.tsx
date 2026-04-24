import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, PoundSterling, CalendarX, ChevronRight, Calendar, User, CreditCard, CheckCircle2, Circle, Timer, Navigation } from "lucide-react";
import { format, parse, addMinutes, addDays } from "date-fns";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useTodayRemainingLessons, TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { useTomorrowLessons } from "@/hooks/useTomorrowLessons";

// ─── Helpers ───
const fmtTime = (t: string) => {
  try { return format(parse(t, "HH:mm:ss", new Date()), "HH:mm"); } catch { return t?.substring(0, 5); }
};
const fmtTime24 = (t: string) => {
  try { return format(parse(t, "HH:mm:ss", new Date()), "HH:mm"); } catch { return t?.substring(0, 5); }
};
const endTime = (t: string, d: number) => {
  try { return format(addMinutes(parse(t, "HH:mm:ss", new Date()), d), "HH:mm"); } catch { return ""; }
};
const initials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

// ─── Mock data for preview (used when no real data) ───
const MOCK: TodayLesson[] = [
  { id: "1", pupilId: "p1", pupilName: "Sarah Johnson", pupilInitials: "SJ", pupilProfileImageUrl: null, startTime: "09:00:00", durationMinutes: 120, pickupPostcode: "SW1A 1AA", pickupLocation: "23 Baker Street", lessonType: "Standard", paymentStatus: "paid", amountDue: 70, status: "scheduled" },
  { id: "2", pupilId: "p2", pupilName: "James Wilson", pupilInitials: "JW", pupilProfileImageUrl: null, startTime: "11:30:00", durationMinutes: 60, pickupPostcode: "E1 6AN", pickupLocation: "15 High Street", lessonType: "Test Prep", paymentStatus: "unpaid", amountDue: 35, status: "scheduled" },
  { id: "3", pupilId: "p3", pupilName: "Emily Chen", pupilInitials: "EC", pupilProfileImageUrl: null, startTime: "14:00:00", durationMinutes: 90, pickupPostcode: "N1 9GU", pickupLocation: "8 Park Lane", lessonType: "Motorway", paymentStatus: "paid", amountDue: 52.5, status: "completed" },
  { id: "4", pupilId: "p4", pupilName: "Alex Brown", pupilInitials: "AB", pupilProfileImageUrl: null, startTime: "16:00:00", durationMinutes: 60, pickupPostcode: "W2 1JJ", pickupLocation: "42 Oxford Road", lessonType: "Standard", paymentStatus: "unpaid", amountDue: 35, status: "scheduled" },
];

const MOCK_TOMORROW: TodayLesson[] = [
  { id: "5", pupilId: "p5", pupilName: "Olivia Smith", pupilInitials: "OS", pupilProfileImageUrl: null, startTime: "10:00:00", durationMinutes: 120, pickupPostcode: "SE1 7PB", pickupLocation: "5 Tower Bridge Rd", lessonType: "Standard", paymentStatus: "paid", amountDue: 70, status: "scheduled" },
  { id: "6", pupilId: "p6", pupilName: "Noah Davis", pupilInitials: "ND", pupilProfileImageUrl: null, startTime: "13:00:00", durationMinutes: 60, pickupPostcode: "EC2R 8AH", pickupLocation: "12 Liverpool St", lessonType: "Mock Test", paymentStatus: "unpaid", amountDue: 40, status: "scheduled" },
];

const typeColors: Record<string, string> = {
  Standard: "bg-primary/10 text-primary",
  "Test Prep": "bg-amber-500/10 text-amber-600",
  "Mock Test": "bg-violet-500/10 text-violet-600",
  Motorway: "bg-emerald-500/10 text-emerald-600",
  Refresher: "bg-pink-500/10 text-pink-600",
  "Pass Plus": "bg-sky-500/10 text-sky-600",
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <CalendarX className="h-10 w-10 text-muted-foreground/40 mb-2" />
      <p className="text-sm font-medium text-muted-foreground">No lessons scheduled</p>
    </div>
  );
}

function SummaryBar({ lessons }: { lessons: TodayLesson[] }) {
  const totalMins = lessons.reduce((s, l) => s + l.durationMinutes, 0);
  const totalEarnings = lessons.reduce((s, l) => s + (l.amountDue || 0), 0);
  const paid = lessons.filter(l => l.paymentStatus === "paid").length;
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{lessons.length} lessons</span>
      <span>•</span>
      <span>{(totalMins / 60).toFixed(1)}h</span>
      <span>•</span>
      <span>£{Math.round(totalEarnings)}</span>
      <span>•</span>
      <span className="text-emerald-600">{paid}/{lessons.length} paid</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 1: Card Stack (iOS-style frosted cards)
// ═══════════════════════════════════════════════════
function Design1({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      {lessons.map((l, i) => (
        <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="bg-card border rounded-2xl p-3.5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials(l.pupilName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground truncate">{l.pupilName}</span>
                <Badge variant="outline" className={`${typeColors[l.lessonType] || typeColors.Standard} border-0 text-[10px] px-1.5`}>{l.lessonType}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(l.startTime)} – {endTime(l.startTime, l.durationMinutes)}</span>
                {l.pickupPostcode && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.pickupPostcode}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            {l.amountDue != null && <span className="text-xs text-muted-foreground">£{l.amountDue}</span>}
            <Badge variant="outline" className={`text-[10px] border-0 ${l.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              {l.paymentStatus === "paid" ? "Paid" : "Unpaid"}
            </Badge>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 2: Timeline with vertical connector line
// ═══════════════════════════════════════════════════
function Design2({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      <div className="relative pl-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
        {lessons.map((l, i) => {
          const done = l.status === "completed";
          return (
            <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="relative pb-4 last:pb-0"
            >
              <div className={`absolute left-[-17px] top-1.5 w-3 h-3 rounded-full border-2 ${done ? "bg-emerald-500 border-emerald-500" : "bg-background border-primary"}`} />
              <div className="bg-card border rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-primary">{fmtTime24(l.startTime)}</span>
                  <span className="text-[10px] text-muted-foreground">{l.durationMinutes}min</span>
                </div>
                <span className="font-semibold text-sm text-foreground">{l.pupilName}</span>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {l.pickupPostcode && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.pickupPostcode}</span>}
                  <Badge variant="outline" className={`${typeColors[l.lessonType] || typeColors.Standard} border-0 text-[10px] px-1.5`}>{l.lessonType}</Badge>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 3: Compact Table/List
// ═══════════════════════════════════════════════════
function Design3({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {lessons.map((l, i) => (
          <div key={l.id} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border/50" : ""}`}>
            <div className="w-12 text-center">
              <span className="text-xs font-bold text-primary">{fmtTime24(l.startTime)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate block">{l.pupilName}</span>
              <span className="text-[11px] text-muted-foreground">{l.durationMinutes}min · {l.pickupPostcode || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${l.paymentStatus === "paid" ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="text-xs text-muted-foreground">£{l.amountDue || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 4: Horizontal Scroll Cards
// ═══════════════════════════════════════════════════
function Design4({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
        {lessons.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="min-w-[200px] max-w-[220px] snap-start bg-card border rounded-2xl p-3 shadow-sm flex-shrink-0"
          >
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials(l.pupilName)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm truncate">{l.pupilName}</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(l.startTime)}</div>
              <div className="flex items-center gap-1"><Timer className="h-3 w-3" />{l.durationMinutes} min</div>
              {l.pickupPostcode && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.pickupPostcode}</div>}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <Badge variant="outline" className={`${typeColors[l.lessonType] || typeColors.Standard} border-0 text-[10px]`}>{l.lessonType}</Badge>
              <span className="text-xs font-medium">£{l.amountDue || 0}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 5: Agenda Style (time-centric)
// ═══════════════════════════════════════════════════
function Design5({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      <div className="space-y-1.5">
        {lessons.map((l, i) => {
          const done = l.status === "completed";
          return (
            <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className={`flex items-stretch gap-3 rounded-xl p-2.5 transition-colors ${done ? "bg-muted/50" : "bg-card border shadow-sm"}`}
            >
              <div className="flex flex-col items-center justify-center w-14 shrink-0">
                <span className="text-lg font-bold text-foreground leading-none">{fmtTime24(l.startTime)}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{l.durationMinutes}m</span>
              </div>
              <div className="w-0.5 bg-primary/20 rounded-full shrink-0" />
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{l.pupilName}</span>
                  {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {l.pickupPostcode && <span>{l.pickupPostcode}</span>}
                  <span>·</span>
                  <span>{l.lessonType}</span>
                  <span>·</span>
                  <span className={l.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}>£{l.amountDue || 0}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 6: Pill/Chip Layout (ultra compact)
// ═══════════════════════════════════════════════════
function Design6({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      <div className="grid gap-2">
        {lessons.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2 bg-card border rounded-full px-3 py-2 shadow-sm"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">{initials(l.pupilName)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm text-foreground truncate flex-1">{l.pupilName}</span>
            <span className="text-xs text-muted-foreground shrink-0">{fmtTime(l.startTime)}</span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${l.paymentStatus === "paid" ? "bg-emerald-500" : "bg-amber-400"}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 7: Color-Coded Blocks
// ═══════════════════════════════════════════════════
function Design7({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  const blockColors = [
    "border-l-primary bg-primary/5",
    "border-l-amber-500 bg-amber-500/5",
    "border-l-violet-500 bg-violet-500/5",
    "border-l-emerald-500 bg-emerald-500/5",
  ];
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      <div className="space-y-2">
        {lessons.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className={`border-l-4 rounded-xl p-3 ${blockColors[i % blockColors.length]}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-foreground">{l.pupilName}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{fmtTime(l.startTime)} – {endTime(l.startTime, l.durationMinutes)}</span>
                  {l.pickupPostcode && <span>· {l.pickupPostcode}</span>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">£{l.amountDue || 0}</span>
                <div className="text-[10px] text-muted-foreground">{l.lessonType}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 8: Dashboard Grid (2 columns)
// ═══════════════════════════════════════════════════
function Design8({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      <div className="grid grid-cols-2 gap-2">
        {lessons.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="bg-card border rounded-xl p-3 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials(l.pupilName)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-xs text-foreground truncate">{l.pupilName.split(" ")[0]}</span>
            </div>
            <div className="text-lg font-bold text-foreground leading-none">{fmtTime24(l.startTime)}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{l.durationMinutes}m · {l.lessonType}</div>
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40">
              <span className="text-xs text-muted-foreground">£{l.amountDue || 0}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${l.paymentStatus === "paid" ? "bg-emerald-500" : "bg-amber-400"}`} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 9: Split Time + Details (elegant sidebar feel)
// ═══════════════════════════════════════════════════
function Design9({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      <SummaryBar lessons={lessons} />
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden divide-y divide-border/50">
        {lessons.map((l, i) => {
          const done = l.status === "completed";
          return (
            <div key={l.id} className="flex">
              <div className={`w-16 flex flex-col items-center justify-center py-3 shrink-0 ${done ? "bg-emerald-500/10" : "bg-muted/30"}`}>
                <span className="text-sm font-bold text-foreground">{fmtTime24(l.startTime)}</span>
                <span className="text-[9px] text-muted-foreground">{endTime(l.startTime, l.durationMinutes)}</span>
              </div>
              <div className="flex-1 px-3 py-3 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground truncate">{l.pupilName}</span>
                  <span className="text-xs text-muted-foreground">£{l.amountDue || 0}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Badge variant="outline" className={`${typeColors[l.lessonType] || typeColors.Standard} border-0 text-[10px] px-1.5 py-0`}>{l.lessonType}</Badge>
                  {l.pickupPostcode && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.pickupPostcode}</span>}
                  <span className={`ml-auto ${l.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{l.paymentStatus === "paid" ? "✓ Paid" : "Unpaid"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DESIGN 10: Progress/Status Row (gamified)
// ═══════════════════════════════════════════════════
function Design10({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) return <EmptyState />;
  const completed = lessons.filter(l => l.status === "completed").length;
  const pct = Math.round((completed / lessons.length) * 100);
  return (
    <div className="space-y-2.5">
      {/* Progress header */}
      <div className="bg-card border rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">{completed}/{lessons.length} completed</span>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{(lessons.reduce((s, l) => s + l.durationMinutes, 0) / 60).toFixed(1)}h total</span>
          <span>£{Math.round(lessons.reduce((s, l) => s + (l.amountDue || 0), 0))}</span>
        </div>
      </div>
      {/* Lesson rows */}
      <div className="space-y-1.5">
        {lessons.map((l, i) => {
          const done = l.status === "completed";
          return (
            <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${done ? "bg-muted/40" : "bg-card border shadow-sm"}`}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{l.pupilName}</span>
                <span className="text-xs text-muted-foreground block">{fmtTime(l.startTime)} · {l.durationMinutes}m</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-medium text-foreground">£{l.amountDue || 0}</span>
                <span className={`block text-[10px] ${l.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                  {l.paymentStatus === "paid" ? "Paid" : "Due"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// WRAPPER: Adds Today/Tomorrow tabs around any design
// ═══════════════════════════════════════════════════
function TabbedDesign({ title, designNum, DesignComponent }: { title: string; designNum: number; DesignComponent: React.FC<{ lessons: TodayLesson[] }> }) {
  const { instructor } = useInstructorAuth();
  const { data: todayLessons } = useTodayRemainingLessons(instructor?.id);
  const { data: tomorrowLessons } = useTomorrowLessons(instructor?.id);

  const today = todayLessons?.length ? todayLessons : MOCK;
  const tomorrow = tomorrowLessons?.length ? tomorrowLessons : MOCK_TOMORROW;

  return (
    <div className="bg-background rounded-2xl border-2 border-border p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">Design {designNum}: {title}</h3>
      </div>
      <Tabs defaultValue="today">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="today" className="flex-1 text-xs">
            Today · {format(new Date(), "EEE d")}
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="flex-1 text-xs">
            Tomorrow · {format(addDays(new Date(), 1), "EEE d")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <DesignComponent lessons={today} />
        </TabsContent>
        <TabsContent value="tomorrow">
          <DesignComponent lessons={tomorrow} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DEMO PAGE
// ═══════════════════════════════════════════════════
export default function ScheduleDesignDemo() {
  const designs: { title: string; Component: React.FC<{ lessons: TodayLesson[] }> }[] = [
    { title: "Card Stack", Component: Design1 },
    { title: "Timeline", Component: Design2 },
    { title: "Compact List", Component: Design3 },
    { title: "Horizontal Scroll", Component: Design4 },
    { title: "Agenda", Component: Design5 },
    { title: "Pill Chips", Component: Design6 },
    { title: "Color Blocks", Component: Design7 },
    { title: "Grid Cards", Component: Design8 },
    { title: "Split Time", Component: Design9 },
    { title: "Progress Track", Component: Design10 },
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/instructor" className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Schedule Designs</h1>
            <p className="text-xs text-muted-foreground">10 alternatives with Today / Tomorrow tabs</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-6 max-w-md mx-auto">
        {designs.map((d, i) => (
          <TabbedDesign key={i} designNum={i + 1} title={d.title} DesignComponent={d.Component} />
        ))}
      </div>
    </div>
  );
}
