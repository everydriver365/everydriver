import { useState } from "react";
import { 
  Clock, Phone, MessageSquare, Navigation, MapPin, 
  ChevronDown, ChevronUp, Car, Hourglass, PoundSterling, 
  BookOpen, AlertTriangle, Send, X, Calendar, ClipboardList,
  Play, CheckCircle2, MessageCircle, ChevronRight, Banknote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mockData = {
  pupilName: "Sarah Mitchell",
  startTime: "14:30",
  dateLabel: "Today",
  duration: "2h",
  countdown: "47m",
  pickupLocation: "12 Oak Avenue",
  pickupPostcode: "BS8 1TH",
  balance: 80,
  etaMinutes: 12,
  lastPlan: "Continue parallel parking and bay parking practice",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/* ═══════════════════════════════════════════════
   VARIANT A — "Layered Card" 
   Stacked sections with clear visual hierarchy
   ═══════════════════════════════════════════════ */
function VariantA() {
  const [expanded, setExpanded] = useState(false);
  const navBlue = "hsl(220, 52%, 16%)";

  return (
    <div className="w-full overflow-hidden rounded-2xl"
      style={{
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
      }}>
      
      {/* Header band */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, hsl(220,52%,16%), hsl(220,52%,24%))" }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/70">Next Up</span>
          <span className="text-[10px] font-bold text-white/50">·</span>
          <span className="text-[11px] font-semibold text-white/90">{mockData.dateLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[12px] font-bold text-white">{mockData.countdown}</span>
        </div>
      </div>

      {/* Main content */}
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(220,52%,16%), hsl(220,52%,28%))", color: "white" }}>
              {getInitials(mockData.pupilName)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-bold truncate" style={{ color: navBlue }}>{mockData.pupilName}</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground">{mockData.startTime}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[12px] text-muted-foreground">{mockData.duration}</span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[12px] font-semibold text-emerald-600">£{mockData.balance}</span>
              </div>
            </div>

            {/* Expand */}
            <div className="shrink-0">
              {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(21,30,48,0.04)" }}>
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: navBlue }} />
            <span className="text-[12px] font-medium truncate" style={{ color: "hsl(220,52%,25%)" }}>
              {mockData.pickupLocation} · {mockData.pickupPostcode}
            </span>
          </div>
        </div>
      </button>

      {/* Action bar */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Navigation, label: "Navigate", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
            { icon: Phone, label: "Call", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
            { icon: MessageSquare, label: "SMS", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
            { icon: MapPin, label: "I'm Here", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
          ].map((btn) => (
            <button key={btn.label}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-transform active:scale-95"
              style={{ background: btn.bg }}>
              <btn.icon className="h-[18px] w-[18px]" style={{ color: btn.color }} />
              <span className="text-[9px] font-bold" style={{ color: btn.color }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="px-4 pb-4 space-y-2.5">
              <div className="h-px w-full bg-border" />
              
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(21,30,48,0.04)" }}>
                <Car className="h-4.5 w-4.5" style={{ color: navBlue }} />
                <div className="flex-1">
                  <span className="text-[10px] text-muted-foreground">Drive time</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold">~{mockData.etaMinutes} min</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-muted-foreground">Light</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.04)" }}>
                <BookOpen className="h-4.5 w-4.5 mt-0.5" style={{ color: "#7c3aed" }} />
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lesson Plan</span>
                  <p className="text-[12px] mt-0.5">{mockData.lastPlan}</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { icon: ClipboardList, label: "Prep", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
                  { icon: Send, label: "On Way", color: navBlue, bg: "rgba(21,30,48,0.06)" },
                  { icon: AlertTriangle, label: "Late", color: "#d97706", bg: "rgba(251,191,36,0.08)" },
                  { icon: Calendar, label: "Move", color: "#6b7280", bg: "rgba(0,0,0,0.04)" },
                  { icon: X, label: "Cancel", color: "#dc2626", bg: "rgba(239,68,68,0.06)" },
                ].map(a => (
                  <button key={a.label} className="flex flex-col items-center gap-1 py-2.5 rounded-xl active:scale-95"
                    style={{ background: a.bg }}>
                    <a.icon className="h-4 w-4" style={{ color: a.color }} />
                    <span className="text-[9px] font-bold text-muted-foreground">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   VARIANT B — "Split Time Hero"
   Big time on left, info on right, bottom action strip
   ═══════════════════════════════════════════════ */
function VariantB() {
  const [expanded, setExpanded] = useState(false);
  const navBlue = "hsl(220, 52%, 16%)";

  return (
    <div className="w-full overflow-hidden rounded-2xl"
      style={{
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
      }}>
      
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="p-4">
          {/* Top line */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">Next Up</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(34,197,94,0.1)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700">{mockData.countdown}</span>
            </div>
          </div>

          {/* Split layout */}
          <div className="flex gap-4">
            {/* Left: Time block */}
            <div className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(220,52%,16%), hsl(220,52%,24%))" }}>
              <span className="text-[32px] font-black text-white leading-none"
                style={{ fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, 'SF Mono', monospace" }}>
                {mockData.startTime}
              </span>
              <span className="text-[10px] font-semibold text-white/60 mt-1">{mockData.dateLabel} · {mockData.duration}</span>
            </div>

            {/* Right: Pupil info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(220,52%,16%), hsl(220,52%,28%))", color: "white" }}>
                  {getInitials(mockData.pupilName)}
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-bold truncate" style={{ color: navBlue }}>{mockData.pupilName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">£{mockData.balance} balance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 mt-2.5">
                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground truncate">{mockData.pickupLocation} · {mockData.pickupPostcode}</span>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Action strip */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
          {[
            { icon: Navigation, label: "Navigate", color: "#3B82F6" },
            { icon: Phone, label: "Call", color: "#10b981" },
            { icon: MessageSquare, label: "SMS", color: "#f97316" },
            { icon: MapPin, label: "I'm Here", color: "#22c55e" },
          ].map((btn) => (
            <button key={btn.label}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-transform active:scale-95 hover:bg-white/80">
              <btn.icon className="h-4 w-4" style={{ color: btn.color }} />
              <span className="text-[10px] font-bold" style={{ color: btn.color }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="px-4 pb-4 space-y-2.5">
              <div className="h-px w-full bg-border" />
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Clock, label: "Start", value: mockData.startTime, color: navBlue },
                  { icon: Hourglass, label: "Duration", value: mockData.duration, color: "hsl(220,52%,22%)" },
                  { icon: PoundSterling, label: "Balance", value: `£${mockData.balance}`, color: "#10b981" },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <s.icon className="h-4 w-4 mb-1" style={{ color: s.color }} />
                    <span className="text-[14px] font-bold">{s.value}</span>
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(21,30,48,0.04)" }}>
                <Car className="h-4.5 w-4.5" style={{ color: navBlue }} />
                <span className="text-[13px] font-bold">~{mockData.etaMinutes} min</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-muted-foreground">Light traffic</span>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.04)" }}>
                <BookOpen className="h-4.5 w-4.5 mt-0.5" style={{ color: "#7c3aed" }} />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lesson Plan</span>
                  <p className="text-[12px] mt-0.5">{mockData.lastPlan}</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { icon: ClipboardList, label: "Prep", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
                  { icon: Send, label: "On Way", color: navBlue, bg: "rgba(21,30,48,0.06)" },
                  { icon: AlertTriangle, label: "Late", color: "#d97706", bg: "rgba(251,191,36,0.08)" },
                  { icon: Calendar, label: "Move", color: "#6b7280", bg: "rgba(0,0,0,0.04)" },
                  { icon: X, label: "Cancel", color: "#dc2626", bg: "rgba(239,68,68,0.06)" },
                ].map(a => (
                  <button key={a.label} className="flex flex-col items-center gap-1 py-2.5 rounded-xl active:scale-95"
                    style={{ background: a.bg }}>
                    <a.icon className="h-4 w-4" style={{ color: a.color }} />
                    <span className="text-[9px] font-bold text-muted-foreground">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   VARIANT C — "Minimal Timeline"
   Timeline-inspired with left accent, ultra-clean
   ═══════════════════════════════════════════════ */
function VariantC() {
  const [expanded, setExpanded] = useState(false);
  const navBlue = "hsl(220, 52%, 16%)";

  return (
    <div className="w-full overflow-hidden rounded-2xl flex"
      style={{
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
      }}>
      
      {/* Left accent strip */}
      <div className="w-1.5 shrink-0" style={{ background: "linear-gradient(180deg, hsl(220,52%,16%), hsl(220,52%,30%))" }} />

      <div className="flex-1 min-w-0">
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
          <div className="px-4 pt-4 pb-3">
            {/* Row 1 */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">Next Up</span>
                </div>
                <p className="text-[20px] font-black leading-tight" style={{ color: navBlue }}>{mockData.pupilName}</p>
              </div>
              
              {/* Time + countdown */}
              <div className="text-right shrink-0 ml-3">
                <span className="text-[28px] font-black leading-none block" style={{
                  color: navBlue,
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "ui-monospace, 'SF Mono', monospace",
                }}>
                  {mockData.startTime}
                </span>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-700">in {mockData.countdown}</span>
                </div>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2.5 mt-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(220,52%,16%), hsl(220,52%,28%))", color: "white" }}>
                {getInitials(mockData.pupilName)}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
                <span>{mockData.dateLabel}</span>
                <span>·</span>
                <span>{mockData.duration}</span>
                <span>·</span>
                <span className="font-semibold text-emerald-600">£{mockData.balance}</span>
              </div>
              <div className="ml-auto">
                {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground truncate">{mockData.pickupLocation} · {mockData.pickupPostcode}</span>
            </div>
          </div>
        </button>

        {/* Action bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            {[
              { icon: Navigation, label: "Navigate", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
              { icon: Phone, label: "Call", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
              { icon: MessageSquare, label: "SMS", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
              { icon: MapPin, label: "I'm Here", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
            ].map((btn) => (
              <button key={btn.label}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-transform active:scale-95"
                style={{ background: btn.bg }}>
                <btn.icon className="h-[18px] w-[18px]" style={{ color: btn.color }} />
                <span className="text-[9px] font-bold" style={{ color: btn.color }}>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="px-4 pb-4 space-y-2.5">
                <div className="h-px w-full bg-border" />

                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(21,30,48,0.04)" }}>
                  <Car className="h-4.5 w-4.5" style={{ color: navBlue }} />
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground">ETA to pickup</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold">~{mockData.etaMinutes} min</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.04)" }}>
                  <BookOpen className="h-4.5 w-4.5 mt-0.5" style={{ color: "#7c3aed" }} />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lesson Plan</span>
                    <p className="text-[12px] mt-0.5">{mockData.lastPlan}</p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[
                    { icon: ClipboardList, label: "Prep", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
                    { icon: Send, label: "On Way", color: navBlue, bg: "rgba(21,30,48,0.06)" },
                    { icon: AlertTriangle, label: "Late", color: "#d97706", bg: "rgba(251,191,36,0.08)" },
                    { icon: Calendar, label: "Move", color: "#6b7280", bg: "rgba(0,0,0,0.04)" },
                    { icon: X, label: "Cancel", color: "#dc2626", bg: "rgba(239,68,68,0.06)" },
                  ].map(a => (
                    <button key={a.label} className="flex flex-col items-center gap-1 py-2.5 rounded-xl active:scale-95"
                      style={{ background: a.bg }}>
                      <a.icon className="h-4 w-4" style={{ color: a.color }} />
                      <span className="text-[9px] font-bold text-muted-foreground">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DEMO PAGE
   ═══════════════════════════════════════════════ */
export default function DemoNextUpRedesigns() {
  return (
    <div className="min-h-screen bg-[#F2F3F5] py-8 px-4">
      <div className="max-w-md mx-auto space-y-10">
        <div>
          <h1 className="text-2xl font-black mb-2" style={{ color: "hsl(220,52%,16%)" }}>Next Up Tile Redesigns</h1>
          <p className="text-sm text-muted-foreground">Tap each tile to expand. All keep the same functionality.</p>
        </div>

        {/* A */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">A — Layered Card</h2>
          <p className="text-[11px] text-muted-foreground mb-3">Dark header band with brand colours, clean white body, separated action bar.</p>
          <VariantA />
        </div>

        {/* B */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">B — Split Time Hero</h2>
          <p className="text-[11px] text-muted-foreground mb-3">Large time block on the left gives instant glanceability. Pupil info sits alongside.</p>
          <VariantB />
        </div>

        {/* C */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">C — Minimal Timeline</h2>
          <p className="text-[11px] text-muted-foreground mb-3">Left accent strip, name-first hierarchy, ultra-clean layout with bold typography.</p>
          <VariantC />
        </div>
      </div>
    </div>
  );
}
