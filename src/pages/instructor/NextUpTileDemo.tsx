import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Phone, MessageSquare, Navigation, Car,
  ChevronDown, ChevronUp, Send, MapPin, Calendar,
  Hourglass, PoundSterling, MessageCircle, AlertTriangle,
  CheckCircle2, Thermometer, Battery, Wifi, BookOpen, Banknote, X, Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data for demo
const mockData = {
  pupilName: "Sarah Johnson",
  startTime: "14:30",
  countdown: "in 42 min",
  dateLabel: "Today",
  duration: "1.5h",
  location: "15 Oak Lane, B29 6QT",
  postcode: "B29 6QT",
  balance: 70,
  eta: "~18 min",
  traffic: "light",
  temp: "14°C",
  weather: "Partly cloudy",
  lastPlan: "Practice roundabouts and lane discipline on dual carriageways",
  unread: 2,
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Shared inner content for expanded section ──
function ExpandedContent({ accent, bgCard, textMuted }: { accent: string; bgCard: string; textMuted: string }) {
  const pillBg = bgCard;
  return (
    <div className="px-[18px] pb-[18px] flex flex-col gap-4">
      <div style={{ height: 1, background: textMuted, opacity: 0.15 }} />

      {/* Info Badges */}
      <div className="grid grid-cols-3 gap-[10px]">
        {[
          { icon: <Clock className="h-4 w-4" style={{ color: textMuted }} />, val: mockData.startTime, label: "Start" },
          { icon: <Hourglass className="h-4 w-4" style={{ color: textMuted }} />, val: mockData.duration, label: "Duration" },
          { icon: <PoundSterling className="h-4 w-4" style={{ color: textMuted }} />, val: `£${mockData.balance}`, label: "Balance" },
        ].map((b, i) => (
          <div key={i} className="flex flex-col items-center py-3 rounded-xl" style={{ background: pillBg }}>
            {b.icon}
            <span className="text-[15px] font-bold mt-0.5" style={{ color: accent === "dark" ? "white" : "#1a1a2e" }}>{b.val}</span>
            <span className="text-[10px] mt-0.5" style={{ color: textMuted }}>{b.label}</span>
          </div>
        ))}
      </div>

      {/* ETA */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: pillBg }}>
        <Car className="h-5 w-5 shrink-0" style={{ color: accent === "dark" ? "#00E5FF" : "#0077CC" }} />
        <div className="flex flex-col">
          <span className="text-[10px]" style={{ color: textMuted }}>Live ETA</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold" style={{ color: accent === "dark" ? "white" : "#1a1a2e" }}>{mockData.eta}</span>
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[11px] capitalize" style={{ color: textMuted }}>Light traffic</span>
          </div>
        </div>
      </div>

      {/* Weather */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: pillBg }}>
        <Thermometer className="h-5 w-5 shrink-0" style={{ color: "#fbbf24" }} />
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold" style={{ color: accent === "dark" ? "white" : "#1a1a2e" }}>{mockData.temp}</span>
          <span className="text-[11px]" style={{ color: textMuted }}>{mockData.weather}</span>
        </div>
      </div>

      {/* Lesson Plan */}
      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: pillBg }}>
        <BookOpen className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#a78bfa" }} />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: textMuted }}>Plan for this lesson</span>
          <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: accent === "dark" ? "white" : "#1a1a2e" }}>{mockData.lastPlan}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-5 gap-[10px]">
        {[
          { icon: <Navigation className="h-5 w-5" style={{ color: accent === "dark" ? "#60a5fa" : "#0066CC" }} />, label: "Navigate" },
          { icon: <Send className="h-5 w-5" style={{ color: accent === "dark" ? "white" : "#333" }} />, label: "On Way" },
          { icon: <Phone className="h-5 w-5" style={{ color: accent === "dark" ? "#4ade80" : "#16a34a" }} />, label: "Call" },
          { icon: <MessageSquare className="h-5 w-5" style={{ color: accent === "dark" ? "#fb923c" : "#ea580c" }} />, label: "SMS" },
          { icon: <MapPin className="h-5 w-5" style={{ color: accent === "dark" ? "#4ade80" : "#16a34a" }} />, label: "Here" },
        ].map((a, i) => (
          <div key={i} className="flex flex-col items-center gap-1 py-3 rounded-xl cursor-pointer" style={{ background: i === 4 ? (accent === "dark" ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.15)") : pillBg }}>
            {a.icon}
            <span className="text-[10px] font-bold" style={{ color: accent === "dark" ? "white" : "#1a1a2e" }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Secondary */}
      <div className="grid grid-cols-2 gap-[10px]">
        <div className="flex items-center justify-center gap-1.5 py-[10px] rounded-[10px] text-[12px] font-medium cursor-pointer" style={{ background: pillBg, color: textMuted }}>
          <Calendar className="h-3.5 w-3.5" /> Reschedule
        </div>
        <div className="flex items-center justify-center gap-1.5 py-[10px] rounded-[10px] text-[12px] font-medium cursor-pointer" style={{ background: accent === "dark" ? "rgba(255,0,0,0.12)" : "rgba(255,0,0,0.08)", color: "#ef4444" }}>
          <X className="h-3.5 w-3.5" /> Cancel
        </div>
      </div>
    </div>
  );
}

// ── VARIANT 1: Current (Navy Gradient) ──
function VariantNavy({ expanded, toggle }: { expanded: boolean; toggle: () => void }) {
  return (
    <div style={{ background: "linear-gradient(135deg, rgb(38,64,140) 0%, rgb(31,89,166) 50%, rgb(26,115,179) 100%)", borderRadius: 22, boxShadow: "0 6px 12px rgba(0,0,0,0.15)" }} className="w-full overflow-hidden">
      <button onClick={toggle} className="w-full px-4 pt-4 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "rgba(255,255,255,0.2)" }}>
            {getInitials(mockData.pupilName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: "#FBBF24" }}>Next Up</span>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
              <span className="text-[11px] font-bold" style={{ color: "#00E5FF" }}>{mockData.countdown}</span>
            </div>
            <p className="text-[20px] font-bold text-white truncate mt-0.5">{mockData.pupilName}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[22px] font-bold text-white" style={{ fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>{mockData.startTime}</span>
            {expanded ? <ChevronUp className="h-4 w-4 mt-1 text-white/50" /> : <ChevronDown className="h-4 w-4 mt-1 text-white/50" />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[mockData.dateLabel, mockData.duration, mockData.postcode].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}>
              {i === 0 && <Calendar className="h-[11px] w-[11px]" />}
              {i === 1 && <Clock className="h-[11px] w-[11px]" />}
              {i === 2 && <MapPin className="h-[11px] w-[11px]" />}
              {t}
            </span>
          ))}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <ExpandedContent accent="dark" bgCard="rgba(255,255,255,0.08)" textMuted="rgba(255,255,255,0.5)" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── VARIANT 2: Charcoal + Amber ──
function VariantCharcoal({ expanded, toggle }: { expanded: boolean; toggle: () => void }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 50%, #3A3A3C 100%)", borderRadius: 22, boxShadow: "0 6px 20px rgba(0,0,0,0.3)" }} className="w-full overflow-hidden">
      <button onClick={toggle} className="w-full px-4 pt-4 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
            {getInitials(mockData.pupilName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: "#F59E0B" }}>Next Up</span>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span className="text-[11px] font-bold" style={{ color: "#FCD34D" }}>{mockData.countdown}</span>
            </div>
            <p className="text-[20px] font-bold text-white truncate mt-0.5">{mockData.pupilName}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[22px] font-bold" style={{ color: "#F59E0B", fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>{mockData.startTime}</span>
            {expanded ? <ChevronUp className="h-4 w-4 mt-1 text-white/40" /> : <ChevronDown className="h-4 w-4 mt-1 text-white/40" />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[mockData.dateLabel, mockData.duration, mockData.postcode].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#FCD34D" }}>
              {i === 0 && <Calendar className="h-[11px] w-[11px]" />}
              {i === 1 && <Clock className="h-[11px] w-[11px]" />}
              {i === 2 && <MapPin className="h-[11px] w-[11px]" />}
              {t}
            </span>
          ))}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <ExpandedContent accent="dark" bgCard="rgba(255,255,255,0.06)" textMuted="rgba(255,255,255,0.45)" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── VARIANT 3: White Card (Light Mode) ──
function VariantWhite({ expanded, toggle }: { expanded: boolean; toggle: () => void }) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 22, boxShadow: "0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" }} className="w-full overflow-hidden">
      <button onClick={toggle} className="w-full px-4 pt-4 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center font-bold text-lg" style={{ background: "#E8F1FE", color: "#1D4ED8" }}>
            {getInitials(mockData.pupilName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: "#1D4ED8" }}>Next Up</span>
              <span className="text-[11px]" style={{ color: "#D1D5DB" }}>·</span>
              <span className="text-[11px] font-bold" style={{ color: "#059669" }}>{mockData.countdown}</span>
            </div>
            <p className="text-[20px] font-bold truncate mt-0.5" style={{ color: "#111827" }}>{mockData.pupilName}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[22px] font-bold" style={{ color: "#111827", fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>{mockData.startTime}</span>
            {expanded ? <ChevronUp className="h-4 w-4 mt-1 text-gray-400" /> : <ChevronDown className="h-4 w-4 mt-1 text-gray-400" />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[mockData.dateLabel, mockData.duration, mockData.postcode].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold" style={{ background: "#F3F4F6", color: "#4B5563" }}>
              {i === 0 && <Calendar className="h-[11px] w-[11px]" />}
              {i === 1 && <Clock className="h-[11px] w-[11px]" />}
              {i === 2 && <MapPin className="h-[11px] w-[11px]" />}
              {t}
            </span>
          ))}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <ExpandedContent accent="light" bgCard="#F3F4F6" textMuted="#9CA3AF" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── VARIANT 4: Teal Gradient ──
function VariantTeal({ expanded, toggle }: { expanded: boolean; toggle: () => void }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)", borderRadius: 22, boxShadow: "0 6px 16px rgba(5,150,105,0.25)" }} className="w-full overflow-hidden">
      <button onClick={toggle} className="w-full px-4 pt-4 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "rgba(255,255,255,0.2)" }}>
            {getInitials(mockData.pupilName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: "#A7F3D0" }}>Next Up</span>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span className="text-[11px] font-bold" style={{ color: "#FCD34D" }}>{mockData.countdown}</span>
            </div>
            <p className="text-[20px] font-bold text-white truncate mt-0.5">{mockData.pupilName}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[22px] font-bold text-white" style={{ fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>{mockData.startTime}</span>
            {expanded ? <ChevronUp className="h-4 w-4 mt-1 text-white/50" /> : <ChevronDown className="h-4 w-4 mt-1 text-white/50" />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[mockData.dateLabel, mockData.duration, mockData.postcode].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
              {i === 0 && <Calendar className="h-[11px] w-[11px]" />}
              {i === 1 && <Clock className="h-[11px] w-[11px]" />}
              {i === 2 && <MapPin className="h-[11px] w-[11px]" />}
              {t}
            </span>
          ))}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <ExpandedContent accent="dark" bgCard="rgba(255,255,255,0.1)" textMuted="rgba(255,255,255,0.5)" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── VARIANT 5: Slate + Electric Purple ──
function VariantPurple({ expanded, toggle }: { expanded: boolean; toggle: () => void }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)", borderRadius: 22, boxShadow: "0 6px 20px rgba(67,56,202,0.3)" }} className="w-full overflow-hidden">
      <button onClick={toggle} className="w-full px-4 pt-4 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "rgba(255,255,255,0.15)" }}>
            {getInitials(mockData.pupilName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: "#C4B5FD" }}>Next Up</span>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span className="text-[11px] font-bold" style={{ color: "#67E8F9" }}>{mockData.countdown}</span>
            </div>
            <p className="text-[20px] font-bold text-white truncate mt-0.5">{mockData.pupilName}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[22px] font-bold text-white" style={{ fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>{mockData.startTime}</span>
            {expanded ? <ChevronUp className="h-4 w-4 mt-1 text-white/50" /> : <ChevronDown className="h-4 w-4 mt-1 text-white/50" />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[mockData.dateLabel, mockData.duration, mockData.postcode].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold" style={{ background: "rgba(196,181,253,0.15)", color: "#DDD6FE" }}>
              {i === 0 && <Calendar className="h-[11px] w-[11px]" />}
              {i === 1 && <Clock className="h-[11px] w-[11px]" />}
              {i === 2 && <MapPin className="h-[11px] w-[11px]" />}
              {t}
            </span>
          ))}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <ExpandedContent accent="dark" bgCard="rgba(255,255,255,0.08)" textMuted="rgba(255,255,255,0.45)" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── VARIANT 6: Frosted Glass ──
function VariantGlass({ expanded, toggle }: { expanded: boolean; toggle: () => void }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: 22,
      boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
      border: "1px solid rgba(255,255,255,0.5)",
    }} className="w-full overflow-hidden">
      <button onClick={toggle} className="w-full px-4 pt-4 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center font-bold text-lg" style={{ background: "linear-gradient(135deg, #3B82F6, #2A394F)", color: "white" }}>
            {getInitials(mockData.pupilName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: "#2A394F" }}>Next Up</span>
              <span className="text-[11px]" style={{ color: "#D1D5DB" }}>·</span>
              <span className="text-[11px] font-bold" style={{ color: "#059669" }}>{mockData.countdown}</span>
            </div>
            <p className="text-[20px] font-bold truncate mt-0.5" style={{ color: "#1F2937" }}>{mockData.pupilName}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[22px] font-bold" style={{ color: "#1F2937", fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>{mockData.startTime}</span>
            {expanded ? <ChevronUp className="h-4 w-4 mt-1 text-gray-400" /> : <ChevronDown className="h-4 w-4 mt-1 text-gray-400" />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[mockData.dateLabel, mockData.duration, mockData.postcode].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold" style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}>
              {i === 0 && <Calendar className="h-[11px] w-[11px]" />}
              {i === 1 && <Clock className="h-[11px] w-[11px]" />}
              {i === 2 && <MapPin className="h-[11px] w-[11px]" />}
              {t}
            </span>
          ))}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <ExpandedContent accent="light" bgCard="rgba(0,0,0,0.04)" textMuted="#9CA3AF" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MAIN DEMO PAGE ──
export default function NextUpTileDemo() {
  const navigate = useNavigate();
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setExpandedVariants(prev => ({ ...prev, [key]: !prev[key] }));

  const variants = [
    { key: "navy", label: "A. Navy Gradient", subtitle: "Current design", component: VariantNavy },
    { key: "charcoal", label: "B. Charcoal + Amber", subtitle: "Dark & warm, premium feel", component: VariantCharcoal },
    { key: "white", label: "C. Clean White", subtitle: "Light, minimal, iOS-native feel", component: VariantWhite },
    { key: "teal", label: "D. Emerald Gradient", subtitle: "Fresh, modern, calming", component: VariantTeal },
    { key: "purple", label: "E. Indigo Night", subtitle: "Bold, distinct, eye-catching", component: VariantPurple },
    { key: "glass", label: "F. Frosted Glass", subtitle: "Translucent, elegant, Apple-inspired", component: VariantGlass },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #E8F1FE 0%, #F0F4FA 100%)" }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 transition">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-gray-900">Next Up Tile — Design Options</h1>
            <p className="text-[12px] text-gray-500">Tap each tile to expand. All have the same functionality.</p>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="px-4 py-6 space-y-8 max-w-md mx-auto pb-24">
        {variants.map(({ key, label, subtitle, component: Comp }) => (
          <div key={key}>
            <div className="mb-3">
              <h2 className="text-[15px] font-bold text-gray-800">{label}</h2>
              <p className="text-[12px] text-gray-500">{subtitle}</p>
            </div>
            <Comp expanded={!!expandedVariants[key]} toggle={() => toggle(key)} />
          </div>
        ))}
      </div>
    </div>
  );
}
