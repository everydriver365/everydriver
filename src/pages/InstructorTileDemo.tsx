import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PupilAvatar } from "@/components/instructor/PupilAvatar";
import { PaymentStatusBadge } from "@/components/instructor/PaymentStatusBadge";
import {
  Clock, Navigation, Phone, MessageSquare, Check, MapPin, Car,
  Cloud, ChevronRight, ChevronDown, X, User, CalendarClock, Timer
} from "lucide-react";
import { useState } from "react";

// ── Mock Data ──────────────────────────────────────────────
const MOCK = {
  pupilName: "Sarah Mitchell",
  startTime: "10:30 AM",
  dateLabel: "Today",
  minutesUntil: 26,
  durationMin: 90,
  pickup: "SW1A 1AA",
  balance: 80,
  weather: { temp: 14, desc: "Partly cloudy" },
  weeklyHours: 22,
  weeklyTarget: 30,
  trafficDelay: 5,
  greeting: "Good morning, James 👋",
};

const progress = Math.round((MOCK.weeklyHours / MOCK.weeklyTarget) * 100);

// ── Helpers ────────────────────────────────────────────────
function ProgressRing({ size = 56, stroke = 5, pct = 73, className = "", glowColor = "hsl(var(--primary))" }: { size?: number; stroke?: number; pct?: number; className?: string; glowColor?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className={className}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={glowColor} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-current text-[11px] font-bold">{pct}%</text>
    </svg>
  );
}

function SectionLabel({ tag, title, desc }: { tag: string; title: string; desc: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-4">
      <Badge variant="secondary" className="mb-2 text-[10px] uppercase tracking-wider">{tag}</Badge>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// HERO OPTIONS
// ═══════════════════════════════════════════════════════════

function HeroA1_Glassmorphism() {
  return (
    <div className="relative rounded-2xl overflow-hidden h-[280px] bg-gradient-to-br from-primary via-primary/90 to-teal-700">
      {/* Simulated hero image overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30" />
      
      {/* Glass card */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-black/40 rounded-2xl p-4 shadow-lg border border-white/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground/80">{MOCK.greeting}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {MOCK.weeklyHours}h / {MOCK.weeklyTarget}h this week
              </p>
            </div>
            <ProgressRing pct={progress} size={48} stroke={4} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/60 dark:bg-white/10 text-xs font-medium text-foreground/80">
              <Cloud className="h-3 w-3" /> {MOCK.weather.temp}°C · {MOCK.weather.desc}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/60 dark:bg-white/10 text-xs font-medium text-amber-700 dark:text-amber-300">
              <Car className="h-3 w-3" /> +{MOCK.trafficDelay} min 🟡
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroA2_DarkOverlay() {
  return (
    <div className="relative rounded-2xl overflow-hidden h-[280px] bg-gradient-to-br from-slate-800 via-slate-900 to-black">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <p className="text-white/90 text-sm font-medium mb-1">{MOCK.greeting}</p>
        
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-white text-2xl font-bold">{MOCK.weeklyHours}h <span className="text-white/50 text-lg font-normal">/ {MOCK.weeklyTarget}h</span></p>
            <p className="text-white/60 text-xs mt-0.5">Weekly progress</p>
          </div>
          <ProgressRing pct={progress} size={56} stroke={5} glowColor="hsl(142, 71%, 45%)" className="text-white" />
        </div>
        
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white/80">
            <Cloud className="h-3 w-3" /> {MOCK.weather.temp}°C
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white/80">
            <Car className="h-3 w-3" /> +{MOCK.trafficDelay} min 🟡
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroA3_SplitGradient() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-teal-800 p-5 text-white">
      <p className="text-white/90 text-sm font-medium mb-4">{MOCK.greeting}</p>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-3xl font-bold">{MOCK.weeklyHours}h</p>
          <p className="text-white/60 text-sm">of {MOCK.weeklyTarget}h target</p>
        </div>
        <ProgressRing pct={progress} size={64} stroke={5} glowColor="hsl(142, 71%, 45%)" className="text-white" />
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-white/20 rounded-full mb-4">
        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${progress}%` }} />
      </div>
      
      <div className="flex items-center gap-4 text-sm text-white/70">
        <span className="inline-flex items-center gap-1">
          <Cloud className="h-3.5 w-3.5" /> {MOCK.weather.temp}°C · {MOCK.weather.desc}
        </span>
        <span className="inline-flex items-center gap-1">
          🚗 +{MOCK.trafficDelay} min 🟡
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NEXT LESSON OPTIONS
// ═══════════════════════════════════════════════════════════

function TileB1_CompactPill() {
  const [expanded, setExpanded] = useState(false);
  const urgencyBorder = MOCK.minutesUntil < 15 ? "border-l-red-500" : MOCK.minutesUntil <= 30 ? "border-l-amber-400" : "border-l-primary";

  return (
    <div className={`rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(20,37,66,0.08)] overflow-hidden border-l-4 ${urgencyBorder}`}>
      <div className="flex items-center gap-3 p-3">
        <PupilAvatar name={MOCK.pupilName} imageUrl={null} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{MOCK.pupilName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{MOCK.dateLabel} · {MOCK.startTime}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{MOCK.durationMin / 60}h</Badge>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-700 dark:text-amber-300 animate-pulse">
          <Clock className="h-3 w-3" /> {MOCK.minutesUntil}m
        </span>
        <Button size="icon" variant="default" className="h-9 w-9 rounded-full shrink-0">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Expand toggle */}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors border-t border-border">
        <span>{expanded ? "Less" : "Actions"}</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown className="h-3 w-3" /></motion.div>
      </button>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-3 pb-3 grid grid-cols-4 gap-2 border-t border-border pt-2">
          <button className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"><Phone className="h-4 w-4" />Call</button>
          <button className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"><MessageSquare className="h-4 w-4" />Message</button>
          <button className="flex flex-col items-center gap-0.5 text-[10px] text-emerald-600"><Check className="h-4 w-4" />On Way</button>
          <button className="flex flex-col items-center gap-0.5 text-[10px] text-destructive"><X className="h-4 w-4" />Cancel</button>
        </motion.div>
      )}
    </div>
  );
}

function TileB2_RichMapCard() {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(20,37,66,0.08)] overflow-hidden">
      {/* Map placeholder */}
      <div className="h-28 bg-muted flex items-center justify-center gap-2 text-muted-foreground">
        <MapPin className="h-5 w-5" />
        <span className="text-sm font-medium">Map preview · {MOCK.pickup}</span>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <PupilAvatar name={MOCK.pupilName} imageUrl={null} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-base truncate">{MOCK.pupilName}</p>
            <p className="text-sm text-muted-foreground truncate">{MOCK.pickup}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <PaymentStatusBadge balance={MOCK.balance} size="md" />
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                <Car className="h-3.5 w-3.5" /> 12 min 🟡
              </span>
            </div>
          </div>
        </div>

        {/* Countdown badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-sm font-bold text-amber-700 dark:text-amber-300 animate-pulse">
            <Timer className="h-4 w-4" /> Starts in {MOCK.minutesUntil} min
          </span>
          <Badge variant="secondary" className="text-xs">{MOCK.durationMin / 60}h lesson</Badge>
        </div>

        {/* Action strip */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button size="sm" className="shrink-0 rounded-xl gap-1.5"><Navigation className="h-3.5 w-3.5" /> Navigate</Button>
          <Button size="sm" variant="outline" className="shrink-0 rounded-xl gap-1.5"><Phone className="h-3.5 w-3.5" /> Call</Button>
          <Button size="sm" variant="outline" className="shrink-0 rounded-xl gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Message</Button>
          <Button size="sm" variant="outline" className="shrink-0 rounded-xl gap-1.5"><Check className="h-3.5 w-3.5" /> On Way</Button>
        </div>
      </div>
    </div>
  );
}

function TileB3_Timeline() {
  const urgencyColor = MOCK.minutesUntil < 15 ? "bg-red-500" : MOCK.minutesUntil <= 30 ? "bg-amber-400" : "bg-primary";
  const urgencyRing = MOCK.minutesUntil < 15 ? "ring-red-200" : MOCK.minutesUntil <= 30 ? "ring-amber-200" : "ring-primary/20";

  return (
    <div className="rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(20,37,66,0.08)] overflow-hidden p-4">
      <div className="flex gap-4">
        {/* Timeline bar */}
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full ${urgencyColor} ring-4 ${urgencyRing}`} />
          <div className={`w-0.5 flex-1 mt-1 ${urgencyColor}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 -mt-1">
          {/* Time header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-foreground">{MOCK.startTime}</span>
            <Badge variant="secondary" className="text-[10px]">{MOCK.durationMin / 60}h</Badge>
            <span className="text-xs text-muted-foreground">· {MOCK.dateLabel}</span>
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-700 dark:text-amber-300 animate-pulse">
              {MOCK.minutesUntil}m
            </span>
          </div>

          {/* Pupil info */}
          <div className="flex items-center gap-3 mb-3">
            <PupilAvatar name={MOCK.pupilName} imageUrl={null} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{MOCK.pupilName}</p>
              <p className="text-xs text-muted-foreground truncate">{MOCK.pickup}</p>
              <div className="flex items-center gap-2 mt-1">
                <PaymentStatusBadge balance={MOCK.balance} size="sm" />
                <span className="text-xs text-amber-600 inline-flex items-center gap-0.5">
                  <Car className="h-3 w-3" /> 12 min 🟡
                </span>
              </div>
            </div>
          </div>

          {/* Icon-only action row */}
          <div className="flex gap-2">
            <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
              <Navigation className="h-4 w-4" />
            </button>
            <button className="h-9 w-9 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 transition-colors">
              <Phone className="h-4 w-4" />
            </button>
            <button className="h-9 w-9 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 transition-colors">
              <MessageSquare className="h-4 w-4" />
            </button>
            <button className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center hover:bg-emerald-200 transition-colors">
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

export default function InstructorTileDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-800 text-white px-5 pt-12 pb-8">
        <h1 className="text-2xl font-bold">Dashboard Redesign Options</h1>
        <p className="text-white/70 text-sm mt-1">Compare hero cards and next-lesson tiles side by side</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-12">
        {/* ── Section A: Hero Cards ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">A</span>
            Hero Card Options
          </h2>
          
          <div className="space-y-8">
            <div>
              <SectionLabel tag="Option A1" title="Glassmorphism Card" desc="Frosted glass card overlapping the hero image. Modern, iOS-style feel." />
              <HeroA1_Glassmorphism />
            </div>
            
            <div>
              <SectionLabel tag="Option A2" title="Full-Bleed Dark Overlay" desc="Content rendered directly over a dark gradient. Immersive, editorial feel." />
              <HeroA2_DarkOverlay />
            </div>
            
            <div>
              <SectionLabel tag="Option A3" title="Split Gradient (No Image)" desc="Clean gradient background, no image. Fast loading, device-friendly." />
              <HeroA3_SplitGradient />
            </div>
          </div>
        </section>

        {/* ── Section B: Next Lesson Tiles ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">B</span>
            Next Lesson Tile Options
          </h2>

          <div className="space-y-8">
            <div>
              <SectionLabel tag="Option B1" title="Compact Pill Card" desc="Minimal single-row layout with urgency border. Tiny vertical footprint." />
              <TileB1_CompactPill />
            </div>

            <div>
              <SectionLabel tag="Option B2" title="Rich Card with Map Preview" desc="Map preview, pulsing countdown, scrollable action strip. Information-dense." />
              <TileB2_RichMapCard />
            </div>

            <div>
              <SectionLabel tag="Option B3" title="Timeline-Style Card" desc="Vertical timeline with urgency colors and icon-only action buttons." />
              <TileB3_Timeline />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
