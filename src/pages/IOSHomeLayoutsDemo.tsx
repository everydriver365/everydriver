import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, Users, PoundSterling, AlertCircle, MapPin,
  ChevronRight, Settings, CalendarDays, Car, BookOpen,
  MessageSquare, Wallet, Navigation, Star, Bell,
  TrendingUp, FileText, Phone, Shield, Fuel,
  GraduationCap, Route, BarChart3, Zap, Award,
  Calendar, CheckCircle2, ArrowRight,
} from "lucide-react";

/* ─── Mock data ─── */
const STATS = [
  { label: "Today's Lessons", value: "4", icon: Clock, color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Pupils", value: "18", icon: Users, color: "text-teal-600", bg: "bg-teal-500/10" },
  { label: "This Month", value: "£2,340", icon: PoundSterling, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { label: "Outstanding", value: "£185", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
];

const QUICK_ACTIONS = [
  { icon: Users, label: "Pupils", sub: "18", color: "text-primary", bg: "bg-primary/10" },
  { icon: CalendarDays, label: "Diary", sub: "4 today", color: "text-amber-500", bg: "bg-amber-500/10" },
  { icon: MapPin, label: "Live Map", sub: "Track", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: Wallet, label: "Payments", sub: "£185 due", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: GraduationCap, label: "Tests", sub: "2 soon", color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: Settings, label: "Settings", sub: "Admin", color: "text-muted-foreground", bg: "bg-muted" },
];

const SCHEDULE = [
  { name: "Sarah Johnson", time: "09:00", end: "10:00", postcode: "SW1A 1AA", type: "Standard", borderColor: "border-l-blue-400", typeBg: "bg-blue-50", typeText: "text-blue-600" },
  { name: "James Wilson", time: "10:30", end: "12:00", postcode: "EC1A 1BB", type: "Test Prep", borderColor: "border-l-amber-400", typeBg: "bg-amber-50", typeText: "text-amber-600" },
  { name: "Emma Davis", time: "13:00", end: "14:00", postcode: "N1 9GU", type: "Standard", borderColor: "border-l-emerald-400", typeBg: "bg-emerald-50", typeText: "text-emerald-600" },
  { name: "Oliver Brown", time: "15:00", end: "16:00", postcode: "SE1 7PB", type: "Mock Test", borderColor: "border-l-violet-400", typeBg: "bg-violet-50", typeText: "text-violet-600" },
];

/* ─── Shared stat card variants ─── */
function StatGrid({ variant = "default" }: { variant?: string }) {
  const styles: Record<string, string> = {
    default: "bg-card rounded-2xl border border-border p-4",
    glass: "bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-4",
    flat: "bg-muted/50 rounded-xl p-4",
    pill: "bg-card rounded-3xl border border-border p-4 shadow-sm",
    minimal: "bg-transparent p-3",
    gradient: "bg-gradient-to-br from-card to-muted/30 rounded-2xl border border-border p-4",
    outlined: "bg-transparent rounded-2xl border-2 border-border p-4",
    compact: "bg-card rounded-xl border border-border p-3",
    elevated: "bg-card rounded-2xl shadow-md p-4",
    soft: "bg-card rounded-[20px] border border-border/40 p-4",
  };
  const cls = styles[variant] || styles.default;

  return (
    <div className="grid grid-cols-2 gap-3">
      {STATS.map((s) => (
        <div key={s.label} className={cls}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} mb-2`}>
            <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
          </div>
          <p className="text-xl font-bold text-foreground leading-none">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Quick actions variants ─── */
function QuickActionsGrid({ variant = "default" }: { variant?: string }) {
  const tileStyles: Record<string, string> = {
    default: "bg-card rounded-[22px] p-3 shadow-sm border border-border/50 aspect-square",
    circle: "bg-card rounded-full p-3 shadow-sm border border-border/50 aspect-square",
    squircle: "bg-card rounded-[28px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border/50 aspect-square",
    pill: "bg-card rounded-3xl p-3 shadow-sm border border-border/30 aspect-square",
    flat: "bg-muted/40 rounded-2xl p-3 aspect-square",
    glass: "bg-card/50 backdrop-blur-sm rounded-2xl p-3 border border-border/30 aspect-square",
    minimal: "bg-transparent rounded-xl p-2 aspect-square",
    gradient: "bg-gradient-to-b from-card to-muted/20 rounded-2xl p-3 shadow-sm aspect-square",
    outlined: "bg-transparent rounded-2xl border-2 border-border p-3 aspect-square",
    soft: "bg-card rounded-[20px] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)] aspect-square",
  };
  const cls = tileStyles[variant] || tileStyles.default;

  return (
    <div className="grid grid-cols-3 gap-3">
      {QUICK_ACTIONS.map((item) => (
        <div key={item.label} className={`${cls} flex flex-col items-center justify-center gap-1 text-center`}>
          <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${item.bg}`}>
            <item.icon className={`h-5.5 w-5.5 ${item.color}`} strokeWidth={1.6} />
          </div>
          <p className="text-[11px] font-semibold text-foreground leading-tight mt-0.5">{item.label}</p>
          <p className="text-[9px] text-muted-foreground leading-none">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Schedule card variants ─── */
function ScheduleList({ variant = "default" }: { variant?: string }) {
  const cardStyles: Record<string, string> = {
    default: "bg-card rounded-2xl border border-border border-l-4 p-4",
    flat: "bg-muted/30 rounded-xl border-l-4 p-4",
    pill: "bg-card rounded-3xl border border-border border-l-4 p-4 shadow-sm",
    compact: "bg-card rounded-xl border border-border border-l-3 p-3",
    minimal: "bg-transparent border-l-4 p-3 pl-4",
    elevated: "bg-card rounded-2xl shadow-md border-l-4 p-4",
  };
  const cls = cardStyles[variant] || cardStyles.default;

  return (
    <div className="space-y-2.5">
      {SCHEDULE.map((lesson, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={`${cls} ${lesson.borderColor}`}
        >
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-foreground text-[15px]">{lesson.name}</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${lesson.typeBg} ${lesson.typeText}`}>{lesson.type}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.time} – {lesson.end}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lesson.postcode}</span>
            <span className="flex items-center gap-1"><PoundSterling className="h-3 w-3" />£35</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Hero variants ─── */
function HeroSection({ variant = 1 }: { variant: number }) {
  const heroes: Record<number, JSX.Element> = {
    1: (
      <div className="bg-primary px-5 pt-8 pb-5 text-primary-foreground">
        <p className="text-sm opacity-80">Friday 20 February</p>
        <h1 className="text-2xl font-bold mt-1">Good Morning 👋</h1>
        <p className="text-sm opacity-70 mt-1">4 lessons today · £140 expected</p>
      </div>
    ),
    2: (
      <div className="bg-gradient-to-br from-primary to-primary/80 px-5 pt-8 pb-6 text-primary-foreground rounded-b-3xl">
        <p className="text-xs tracking-wide uppercase opacity-70">Friday 20 Feb</p>
        <h1 className="text-[26px] font-bold mt-1.5 leading-tight">Good Morning</h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium">4 lessons</div>
          <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium">£140</div>
        </div>
      </div>
    ),
    3: (
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Friday 20 Feb</p>
            <h1 className="text-[28px] font-bold text-foreground">Good Morning</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">JD</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1">4 lessons · 18 pupils · £140</p>
      </div>
    ),
    4: (
      <div className="bg-gradient-to-r from-primary via-primary/90 to-blue-600 px-5 pt-8 pb-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-sm font-bold">JD</div>
          <div>
            <h1 className="text-xl font-bold">Good Morning</h1>
            <p className="text-xs opacity-75">Fri 20 Feb · 4 lessons ahead</p>
          </div>
        </div>
      </div>
    ),
    5: (
      <div className="px-5 pt-8 pb-3">
        <h1 className="text-[32px] font-black text-foreground leading-none">Morning</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-1 w-8 rounded-full bg-primary" />
          <p className="text-sm text-muted-foreground">Fri 20 Feb · 4 lessons · £140</p>
        </div>
      </div>
    ),
    6: (
      <div className="bg-card mx-4 mt-6 rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">FRIDAY 20 FEBRUARY</p>
            <h1 className="text-xl font-bold text-foreground mt-1">Good Morning 👋</h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">4</p>
            <p className="text-[10px] text-muted-foreground">LESSONS</p>
          </div>
        </div>
      </div>
    ),
    7: (
      <div className="bg-primary/5 px-5 pt-8 pb-5 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Good Morning</h1>
        <p className="text-muted-foreground text-sm mt-1">Friday 20 February</p>
        <div className="flex gap-2 mt-3">
          <span className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full font-medium">4 Lessons</span>
          <span className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-full font-medium">£140</span>
        </div>
      </div>
    ),
    8: (
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Friday</p>
          <h1 className="text-3xl font-bold text-foreground mt-0.5">20 Feb</h1>
          <p className="text-sm text-primary font-medium mt-1">Good Morning</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-3xl font-bold text-foreground">4</p>
          <p className="text-xs text-muted-foreground">lessons today</p>
        </div>
      </div>
    ),
    9: (
      <div className="bg-gradient-to-b from-primary/10 to-transparent px-5 pt-8 pb-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-emerald-600 font-medium">Active</p>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Good Morning</h1>
        <p className="text-sm text-muted-foreground mt-1">Friday 20 Feb · Your next lesson is at 09:00</p>
      </div>
    ),
    10: (
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">JD</div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Good Morning</h1>
            <p className="text-sm text-muted-foreground">Friday 20 February</p>
            <p className="text-xs text-primary font-medium mt-0.5">4 lessons · £140 expected</p>
          </div>
        </div>
      </div>
    ),
    11: (
      <div className="bg-foreground text-background px-5 pt-8 pb-5">
        <p className="text-xs opacity-50 uppercase tracking-widest">Friday 20 Feb</p>
        <h1 className="text-2xl font-bold mt-2">Good Morning</h1>
        <div className="flex gap-4 mt-3 text-sm opacity-70">
          <span>4 lessons</span><span>·</span><span>£140</span><span>·</span><span>18 pupils</span>
        </div>
      </div>
    ),
    12: (
      <div className="px-5 pt-8 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Morning ☀️</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Friday 20 February</p>
          </div>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-3 bg-primary/5 rounded-xl p-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-primary" />
          <p className="text-sm text-foreground font-medium">Next: Sarah Johnson at 09:00</p>
        </div>
      </div>
    ),
    13: (
      <div className="bg-gradient-to-br from-violet-600 to-primary px-5 pt-8 pb-6 text-white rounded-b-[28px]">
        <p className="text-xs opacity-60">FRI 20 FEB</p>
        <h1 className="text-2xl font-bold mt-1">Good Morning</h1>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/15 rounded-xl p-2 text-center"><p className="text-lg font-bold">4</p><p className="text-[10px] opacity-70">Lessons</p></div>
          <div className="bg-white/15 rounded-xl p-2 text-center"><p className="text-lg font-bold">£140</p><p className="text-[10px] opacity-70">Earnings</p></div>
          <div className="bg-white/15 rounded-xl p-2 text-center"><p className="text-lg font-bold">6h</p><p className="text-[10px] opacity-70">Hours</p></div>
        </div>
      </div>
    ),
    14: (
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <p className="text-sm text-muted-foreground">Friday 20 February</p>
        </div>
        <h1 className="text-[26px] font-bold text-foreground mt-1 leading-tight">Good Morning,<br /><span className="text-primary">John</span></h1>
      </div>
    ),
    15: (
      <div className="bg-card mx-4 mt-6 rounded-3xl border border-border p-5 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">Good Morning 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Friday 20 February</p>
        <div className="h-px bg-border my-3" />
        <div className="flex justify-between text-center">
          <div><p className="text-lg font-bold text-foreground">4</p><p className="text-[10px] text-muted-foreground">Lessons</p></div>
          <div><p className="text-lg font-bold text-foreground">6h</p><p className="text-[10px] text-muted-foreground">Teaching</p></div>
          <div><p className="text-lg font-bold text-emerald-600">£140</p><p className="text-[10px] text-muted-foreground">Expected</p></div>
        </div>
      </div>
    ),
    16: (
      <div className="px-5 pt-8 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 h-2 w-2 rounded-full" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Fri 20 Feb · Good Morning</p>
      </div>
    ),
    17: (
      <div className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-transparent px-5 pt-8 pb-5">
        <h1 className="text-2xl font-bold text-foreground">Good Morning</h1>
        <p className="text-sm text-muted-foreground mt-1">Friday 20 February</p>
        <div className="mt-3 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" />
          <p className="text-sm text-foreground font-medium">First pickup: SW1A 1AA at 09:00</p>
        </div>
      </div>
    ),
    18: (
      <div className="px-5 pt-8 pb-4">
        <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Good Morning</p>
        <h1 className="text-3xl font-black text-foreground leading-none">Friday</h1>
        <h2 className="text-3xl font-black text-primary leading-none">20 Feb</h2>
        <p className="text-sm text-muted-foreground mt-2">4 lessons scheduled · £140</p>
      </div>
    ),
    19: (
      <div className="bg-primary px-5 pt-8 pb-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Good Morning</h1>
            <p className="text-xs opacity-70 mt-0.5">Friday 20 February</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-2.5">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 bg-white/10 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm">Today's target</span>
          <span className="font-bold">£140 / £140</span>
        </div>
      </div>
    ),
    20: (
      <div className="px-5 pt-8 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">☀️</div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Good Morning</h1>
            <p className="text-xs text-muted-foreground">Friday 20 February</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-primary/5 to-emerald-500/5 rounded-2xl p-3 flex justify-around text-center">
          <div><p className="text-lg font-bold text-foreground">4</p><p className="text-[10px] text-muted-foreground">Lessons</p></div>
          <div className="w-px bg-border" />
          <div><p className="text-lg font-bold text-foreground">£140</p><p className="text-[10px] text-muted-foreground">Expected</p></div>
          <div className="w-px bg-border" />
          <div><p className="text-lg font-bold text-foreground">6h</p><p className="text-[10px] text-muted-foreground">Teaching</p></div>
        </div>
      </div>
    ),
  };
  return heroes[variant] || heroes[1];
}

/* ─── Variant config ─── */
const VARIANT_CONFIGS = [
  { id: 1, name: "Classic Blue", hero: 1, stat: "default", action: "squircle", schedule: "default" },
  { id: 2, name: "Gradient Pill", hero: 2, stat: "pill", action: "pill", schedule: "pill" },
  { id: 3, name: "Clean Profile", hero: 3, stat: "default", action: "default", schedule: "default" },
  { id: 4, name: "Compact Header", hero: 4, stat: "compact", action: "squircle", schedule: "compact" },
  { id: 5, name: "Bold Minimal", hero: 5, stat: "minimal", action: "minimal", schedule: "minimal" },
  { id: 6, name: "Floating Card", hero: 6, stat: "glass", action: "glass", schedule: "default" },
  { id: 7, name: "Tinted Header", hero: 7, stat: "flat", action: "flat", schedule: "flat" },
  { id: 8, name: "Big Date", hero: 8, stat: "default", action: "squircle", schedule: "default" },
  { id: 9, name: "Active Status", hero: 9, stat: "gradient", action: "gradient", schedule: "elevated" },
  { id: 10, name: "Avatar Block", hero: 10, stat: "soft", action: "soft", schedule: "default" },
  { id: 11, name: "Dark Header", hero: 11, stat: "outlined", action: "outlined", schedule: "default" },
  { id: 12, name: "Next Up", hero: 12, stat: "default", action: "squircle", schedule: "default" },
  { id: 13, name: "Purple Hero", hero: 13, stat: "glass", action: "glass", schedule: "pill" },
  { id: 14, name: "Split Name", hero: 14, stat: "flat", action: "flat", schedule: "flat" },
  { id: 15, name: "Card Hero", hero: 15, stat: "soft", action: "soft", schedule: "default" },
  { id: 16, name: "Dashboard", hero: 16, stat: "compact", action: "default", schedule: "compact" },
  { id: 17, name: "Nav Hint", hero: 17, stat: "gradient", action: "gradient", schedule: "elevated" },
  { id: 18, name: "Type Stack", hero: 18, stat: "default", action: "squircle", schedule: "default" },
  { id: 19, name: "Target Hero", hero: 19, stat: "elevated", action: "pill", schedule: "elevated" },
  { id: 20, name: "Sunrise", hero: 20, stat: "pill", action: "squircle", schedule: "pill" },
];

/* ─── Single phone frame ─── */
function PhoneFrame({ config }: { config: typeof VARIANT_CONFIGS[0] }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-bold text-foreground">#{config.id} – {config.name}</p>
      <div className="w-[375px] h-[812px] bg-muted/30 rounded-[40px] border-[3px] border-foreground/10 overflow-hidden shadow-xl flex flex-col">
        {/* Status bar */}
        <div className="h-11 flex items-center justify-between px-6 bg-transparent">
          <span className="text-xs font-semibold text-foreground/60">9:41</span>
          <div className="w-20 h-5 rounded-full bg-foreground/10" />
          <div className="flex gap-1">
            <div className="w-4 h-2.5 rounded-sm bg-foreground/30" />
            <div className="w-4 h-2.5 rounded-sm bg-foreground/30" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <HeroSection variant={config.hero} />

          <div className="px-5 mt-4">
            <StatGrid variant={config.stat} />
          </div>

          <div className="px-5 mt-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Quick Access</h2>
            <QuickActionsGrid variant={config.action} />
          </div>

          <div className="px-5 mt-6 pb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">Today's Schedule</h2>
              <span className="text-xs text-primary font-medium">See all</span>
            </div>
            <ScheduleList variant={config.schedule} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main demo page ─── */
export default function IOSHomeLayoutsDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[1800px] mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">iOS Home Layouts – 20 Variants</h1>
        <p className="text-muted-foreground mb-8">Each variant has a unique hero, stat cards, quick actions tiles, and schedule style.</p>
        <div className="flex flex-wrap gap-8 justify-center">
          {VARIANT_CONFIGS.map((config) => (
            <PhoneFrame key={config.id} config={config} />
          ))}
        </div>
      </div>
    </div>
  );
}
