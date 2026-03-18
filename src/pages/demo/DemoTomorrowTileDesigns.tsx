import { motion } from "framer-motion";
import {
  Clock, PoundSterling, BookOpen, MapPin, ChevronRight,
  Calendar, Sunrise, Sunset, User, Navigation,
} from "lucide-react";

const MOCK = {
  lessons: [
    { time: "09:00", pupil: "Sarah M.", postcode: "SO16 3RB", duration: 60 },
    { time: "10:30", pupil: "Jake T.", postcode: "SO15 5QL", duration: 90 },
    { time: "13:00", pupil: "Priya K.", postcode: "SO14 0AA", duration: 60 },
    { time: "15:00", pupil: "Tom W.", postcode: "SO17 1BJ", duration: 60 },
  ],
  totalHours: 4.5,
  earnings: 157,
  date: "Wednesday 19 March",
  dayShort: "WED",
  dayNum: "19",
  month: "MAR",
};

const PhoneFrame = ({ children, label, description }: { children: React.ReactNode; label: string; description: string }) => (
  <div className="mb-14">
    <div className="mb-4 text-center">
      <span className="inline-block bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-sm mb-2">{label}</span>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">{description}</p>
    </div>
    <div className="mx-auto w-[390px] max-w-full rounded-3xl border-4 border-border bg-background shadow-2xl overflow-hidden">
      <div className="p-3">
        {children}
      </div>
    </div>
  </div>
);

/* ─── OPTION A — Boarding Pass ─── */
function BoardingPass() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden border border-border shadow-md">
      {/* Top half */}
      <div className="bg-primary/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Tomorrow</span>
          <span className="text-xs text-muted-foreground">{MOCK.date}</span>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-center">
            <Sunrise className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{MOCK.lessons[0].time}</p>
            <p className="text-[10px] text-muted-foreground">FIRST</p>
          </div>
          <div className="flex-1 mx-4 flex items-center gap-1">
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
              <BookOpen className="h-3 w-3 text-primary" />
              <span className="text-xs font-bold text-primary">{MOCK.lessons.length}</span>
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="text-center">
            <Sunset className="h-4 w-4 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{MOCK.lessons[MOCK.lessons.length - 1].time}</p>
            <p className="text-[10px] text-muted-foreground">LAST</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{MOCK.totalHours}h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PoundSterling className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-600">£{MOCK.earnings}</span>
          </div>
        </div>
      </div>
      {/* Perforated divider */}
      <div className="relative h-6 flex items-center">
        <div className="absolute left-0 w-3 h-6 bg-background rounded-r-full" />
        <div className="absolute right-0 w-3 h-6 bg-background rounded-l-full" />
        <div className="w-full border-t-2 border-dashed border-border mx-4" />
      </div>
      {/* Tear-off pupil list */}
      <div className="px-4 pb-4 space-y-2">
        {MOCK.lessons.map((l, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-muted-foreground w-10">{l.time}</span>
              <span className="text-sm font-semibold text-foreground">{l.pupil}</span>
            </div>
            <span className="text-xs text-muted-foreground">{l.postcode}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── OPTION B — Dark Gradient Card ─── */
function DarkGradient() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-lg"
      style={{ background: "linear-gradient(135deg, hsl(220 20% 14%), hsl(220 25% 22%))" }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Tomorrow</p>
            <p className="text-white/80 text-sm">{MOCK.date}</p>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1">
            <span className="text-emerald-400 text-lg font-black">£{MOCK.earnings}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: BookOpen, label: "Lessons", value: MOCK.lessons.length.toString() },
            { icon: Clock, label: "Hours", value: `${MOCK.totalHours}h` },
            { icon: Navigation, label: "Areas", value: "3" },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
              <s.icon className="h-4 w-4 text-white/40 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-white/40 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {MOCK.lessons.map((l, i) => (
            <div key={i} className="shrink-0 bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 min-w-[120px]">
              <p className="text-white/50 text-[10px] font-mono">{l.time}</p>
              <p className="text-white text-sm font-semibold mt-0.5">{l.pupil}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{l.postcode}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── OPTION C — Timeline Strip ─── */
function TimelineStrip() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Tomorrow</p>
          <p className="text-sm text-muted-foreground">{MOCK.date}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground">{MOCK.totalHours}h</span>
          <span className="text-xs font-bold text-emerald-600">£{MOCK.earnings}</span>
        </div>
      </div>

      <div className="relative pl-6">
        {/* Timeline line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-primary/20" />

        {MOCK.lessons.map((l, i) => (
          <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
            {/* Node */}
            <div className="absolute left-[-15px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{l.pupil}</span>
                  <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{l.duration}m</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{l.postcode}</span>
                </div>
              </div>
              <span className="text-sm font-mono font-bold text-foreground">{l.time}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── OPTION D — Split Stat Banner ─── */
function SplitStatBanner() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Tomorrow — {MOCK.date}</p>
        <div className="flex items-end gap-6">
          <div>
            <p className="text-4xl font-black text-foreground">£{MOCK.earnings}</p>
            <p className="text-xs text-muted-foreground mt-0.5">expected earnings</p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            {[
              { label: "Lessons", value: MOCK.lessons.length },
              { label: "Hours", value: MOCK.totalHours },
            ].map((s, i) => (
              <div key={i} className="bg-background/60 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {MOCK.lessons.map((l, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{l.pupil}</p>
              <p className="text-[10px] text-muted-foreground">{l.postcode} · {l.duration}min</p>
            </div>
            <span className="text-xs font-mono font-bold text-muted-foreground">{l.time}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── OPTION E — Calendar Card ─── */
function CalendarCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
      {/* Calendar header */}
      <div className="bg-primary text-primary-foreground p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{MOCK.month}</p>
        <p className="text-5xl font-black leading-none mt-1">{MOCK.dayNum}</p>
        <p className="text-sm font-semibold opacity-80 mt-1">{MOCK.dayShort}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: "Lessons", value: MOCK.lessons.length },
          { label: "Hours", value: MOCK.totalHours },
          { label: "Earnings", value: `£${MOCK.earnings}` },
        ].map((s, i) => (
          <div key={i} className="py-3 text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lesson list */}
      <div className="p-3 space-y-1">
        {MOCK.lessons.map((l, i) => (
          <div key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-8 rounded-full bg-primary/60" />
              <div>
                <p className="text-sm font-semibold text-foreground">{l.pupil}</p>
                <p className="text-[10px] text-muted-foreground">{l.postcode}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold text-foreground">{l.time}</p>
              <p className="text-[10px] text-muted-foreground">{l.duration}m</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function DemoTomorrowTileDesigns() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Tomorrow Tile — Design Options</h1>
          <p className="text-muted-foreground">5 alternatives for the instructor dashboard tomorrow preview</p>
        </div>

        <PhoneFrame label="Option A" description="Boarding Pass — departure/arrival metaphor with perforated tear-off pupil list">
          <BoardingPass />
        </PhoneFrame>

        <PhoneFrame label="Option B" description="Dark Gradient — premium iOS-style dark card with glowing earnings and scrollable lesson chips">
          <DarkGradient />
        </PhoneFrame>

        <PhoneFrame label="Option C" description="Timeline Strip — compact vertical timeline, always expanded, scannable at a glance">
          <TimelineStrip />
        </PhoneFrame>

        <PhoneFrame label="Option D" description="Split Stat Banner — hero earnings stat with stacked metrics and pupil list">
          <SplitStatBanner />
        </PhoneFrame>

        <PhoneFrame label="Option E" description="Calendar Card — torn-off calendar page with date-forward minimal design">
          <CalendarCard />
        </PhoneFrame>
      </div>
    </div>
  );
}
