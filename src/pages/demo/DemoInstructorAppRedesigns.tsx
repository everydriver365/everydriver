import { useState } from "react";
import { Bell, Menu, Car, MessageSquare, MapPin, Clock, ChevronRight, Home, Calendar, Map, User, Sparkles, Zap, Award, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 10 BOLD, distinctive instructor app designs.
 * Each has its own personality: patterns, depth, shapes, typographic voice.
 * Same layout & functions retained.
 */

type Design = {
  id: number;
  name: string;
  tagline: string;
  render: () => JSX.Element;
};

/* ---------- shared mock data ---------- */
const tiles = [
  { icon: Car, label: "Job Offers", count: "2" },
  { icon: MessageSquare, label: "Messages", count: "5" },
  { icon: Award, label: "Tests", count: "1" },
  { icon: Zap, label: "Fill Gaps", count: "3" },
];
const schedule = [
  { time: "10:00", name: "Emma Wilson", dur: "1hr" },
  { time: "12:30", name: "Tom Patel", dur: "2hr" },
  { time: "15:00", name: "Lily Chen", dur: "1.5hr" },
];

/* ---------- Phone shell wrapper ---------- */
function Phone({ bg, font, children }: { bg: string; font: string; children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: 320,
        height: 640,
        borderRadius: 36,
        border: "8px solid #1c1c1e",
        background: bg,
        fontFamily: font,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
      }}
    >
      <div className="h-full overflow-y-auto" style={{ background: bg }}>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   DESIGN 1 — RACING STRIPE
   Bold black + signal yellow, motorsport energy
   ============================================================ */
const D1 = () => (
  <Phone bg="#0A0A0A" font="'Space Grotesk', system-ui, sans-serif">
    {/* Checkered top strip */}
    <div className="h-2 flex">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="flex-1" style={{ background: i % 2 ? "#FFEB00" : "#0A0A0A" }} />
      ))}
    </div>
    <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10" style={{ background: "#0A0A0A", borderBottom: "1px solid #FFEB00" }}>
      <Bell className="h-5 w-5 text-white" />
      <span className="text-[14px] font-black tracking-[0.2em] text-[#FFEB00]">DSM</span>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white" style={{ background: "#FF1A1A" }}>SOS</div>
        <Menu className="h-5 w-5 text-white" />
      </div>
    </div>
    <div className="p-3 space-y-3 pb-20">
      <div className="px-1 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFEB00]">Driver</p>
          <p className="text-[20px] font-black text-white leading-tight">SARAH M.</p>
        </div>
        <div className="text-right">
          <p className="text-[28px] font-black text-[#FFEB00] leading-none">P1</p>
          <p className="text-[8px] uppercase tracking-wider text-white/60">Today</p>
        </div>
      </div>

      {/* HERO with diagonal stripes */}
      <div className="relative overflow-hidden p-4" style={{ background: "linear-gradient(135deg, #FFEB00 0%, #FFA500 100%)", borderRadius: 4, clipPath: "polygon(0 0, 100% 0, 100% 92%, 96% 100%, 0 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0 6px, transparent 6px 14px)" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-[#FFEB00] text-[9px] font-black uppercase tracking-wider mb-2">⏱ NEXT · 14m</div>
          <p className="text-[22px] font-black text-black leading-none">JAMES CARTER</p>
          <p className="text-[11px] font-bold text-black/70 mt-1">2HR · MANUAL · 4.2MI</p>
          <button className="mt-3 px-4 py-1.5 bg-black text-[#FFEB00] text-[11px] font-black uppercase tracking-wider">START ▶</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="p-3 border-2 border-[#FFEB00]" style={{ background: "#1A1A1A" }}>
            <div className="flex items-center justify-between mb-1">
              <t.icon className="h-4 w-4 text-[#FFEB00]" />
              <span className="text-[20px] font-black text-white">{t.count}</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">{t.label}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFEB00] px-1">▌ TODAY'S GRID</p>
      <div className="border-2 border-[#FFEB00]" style={{ background: "#1A1A1A" }}>
        {schedule.map((s, i, a) => (
          <div key={s.time} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < a.length - 1 ? "1px dashed #FFEB0040" : "none" }}>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-black text-[#FFEB00]">{s.time}</span>
              <div>
                <p className="text-[12px] font-bold text-white">{s.name}</p>
                <p className="text-[9px] text-white/50 uppercase">{s.dur}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#FFEB00]" />
          </div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5" style={{ background: "#0A0A0A", borderTop: "2px solid #FFEB00" }}>
      {[Home, Calendar, Map, User].map((I, i) => (
        <I key={i} className="h-5 w-5" style={{ color: i === 0 ? "#FFEB00" : "#666" }} />
      ))}
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 2 — NEON ARCADE
   Cyberpunk dark with glowing magenta/cyan
   ============================================================ */
const D2 = () => (
  <Phone bg="#0D0221" font="'JetBrains Mono', monospace">
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: "linear-gradient(180deg, #0D0221, #1A0533)", borderBottom: "1px solid #FF2A6D40" }}>
      <Bell className="h-5 w-5" style={{ color: "#05D9E8", filter: "drop-shadow(0 0 4px #05D9E8)" }} />
      <span className="text-[12px] font-bold tracking-[0.3em]" style={{ color: "#FF2A6D", textShadow: "0 0 8px #FF2A6D" }}>D_S_M</span>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#FF2A6D", boxShadow: "0 0 12px #FF2A6D" }}>SOS</div>
        <Menu className="h-5 w-5 text-white/60" />
      </div>
    </div>
    <div className="p-3 space-y-3 pb-20">
      <div className="px-1">
        <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#05D9E8" }}>&gt; greeting.exe</p>
        <p className="text-[18px] font-bold text-white">Sarah_Mitchell</p>
      </div>

      <div className="relative p-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #1A0533 0%, #2D0B4E 100%)", borderRadius: 12, border: "1px solid #FF2A6D", boxShadow: "0 0 24px #FF2A6D40, inset 0 0 24px #05D9E820" }}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #05D9E8 0%, transparent 70%)" }} />
        <div className="inline-flex items-center gap-1 mb-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "#05D9E8" }}>◉ LIVE · T-14:00</div>
        <p className="text-[20px] font-bold text-white" style={{ textShadow: "0 0 8px #FF2A6D60" }}>James Carter</p>
        <p className="text-[11px] mt-1" style={{ color: "#05D9E8" }}>2HR // MANUAL // 4.2MI</p>
        <button className="mt-3 px-3 py-1.5 text-[11px] font-bold rounded" style={{ background: "linear-gradient(90deg, #FF2A6D, #05D9E8)", color: "#0D0221", boxShadow: "0 0 12px #FF2A6D80" }}>▶ EXEC_LESSON</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t, i) => {
          const c = i % 2 ? "#05D9E8" : "#FF2A6D";
          return (
            <div key={t.label} className="p-3 rounded-lg" style={{ background: "#1A0533", border: `1px solid ${c}60`, boxShadow: `0 0 12px ${c}30` }}>
              <t.icon className="h-4 w-4 mb-2" style={{ color: c, filter: `drop-shadow(0 0 4px ${c})` }} />
              <p className="text-[9px] uppercase tracking-wider text-white/60">{t.label}</p>
              <p className="text-[18px] font-bold text-white">{t.count}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] uppercase tracking-[0.2em] px-1" style={{ color: "#FF2A6D" }}>// schedule.log</p>
      <div className="rounded-lg" style={{ background: "#1A0533", border: "1px solid #05D9E840" }}>
        {schedule.map((s, i, a) => (
          <div key={s.time} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < a.length - 1 ? "1px solid #05D9E820" : "none" }}>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold" style={{ color: "#05D9E8" }}>{s.time}</span>
              <div>
                <p className="text-[12px] font-semibold text-white">{s.name}</p>
                <p className="text-[9px]" style={{ color: "#FF2A6D" }}>{s.dur}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: "#05D9E8" }} />
          </div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5" style={{ background: "#0D0221F0", borderTop: "1px solid #FF2A6D40" }}>
      {[Home, Calendar, Map, User].map((I, i) => (
        <I key={i} className="h-5 w-5" style={{ color: i === 0 ? "#05D9E8" : "#666", filter: i === 0 ? "drop-shadow(0 0 4px #05D9E8)" : undefined }} />
      ))}
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 3 — VINTAGE TRAVEL POSTER
   Cream, terracotta, deep teal — art deco
   ============================================================ */
const D3 = () => (
  <Phone bg="#F5EBD8" font="'Playfair Display', Georgia, serif">
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: "#0F4C5C", borderBottom: "3px double #E8B04B" }}>
      <Bell className="h-5 w-5 text-[#E8B04B]" />
      <span className="text-[14px] font-bold italic text-[#F5EBD8]" style={{ letterSpacing: "0.1em" }}>· DSM ·</span>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#C73E1D" }}>SOS</div>
        <Menu className="h-5 w-5 text-[#E8B04B]" />
      </div>
    </div>
    <div className="p-3 space-y-3 pb-20">
      <div className="px-1 text-center py-2">
        <p className="text-[9px] uppercase tracking-[0.4em] text-[#C73E1D]">— Bonjour —</p>
        <p className="text-[22px] italic font-bold text-[#0F4C5C]">Sarah Mitchell</p>
        <div className="flex justify-center mt-1">
          <div className="h-[1px] w-16" style={{ background: "#0F4C5C" }} />
        </div>
      </div>

      <div className="relative p-4 overflow-hidden" style={{ background: "#C73E1D", borderRadius: 6, border: "2px solid #0F4C5C", boxShadow: "4px 4px 0 #0F4C5C" }}>
        <div className="absolute top-2 right-2 text-[#E8B04B] opacity-30 text-[60px] leading-none font-bold">14'</div>
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#E8B04B] font-bold">— Next Departure —</p>
        <p className="text-[24px] font-bold text-[#F5EBD8] leading-tight italic mt-1">James Carter</p>
        <p className="text-[11px] text-[#F5EBD8]/80 mt-1">Two hours · Manual transmission</p>
        <div className="flex items-center gap-1.5 mt-2">
          <MapPin className="h-3 w-3 text-[#E8B04B]" />
          <span className="text-[11px] text-[#F5EBD8] italic">12 Oakwood Road</span>
        </div>
        <button className="mt-3 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ background: "#E8B04B", color: "#0F4C5C", borderRadius: 2 }}>Embark →</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="p-3 text-center" style={{ background: "#FFFFFF", border: "1px solid #0F4C5C", borderRadius: 4 }}>
            <div className="h-9 w-9 mx-auto rounded-full flex items-center justify-center mb-1" style={{ background: "#0F4C5C" }}>
              <t.icon className="h-4 w-4 text-[#E8B04B]" />
            </div>
            <p className="text-[18px] font-bold text-[#C73E1D]">{t.count}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#0F4C5C]/70">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="text-center py-1">
        <p className="text-[9px] uppercase tracking-[0.4em] text-[#0F4C5C]">~ Itinerary ~</p>
      </div>
      <div style={{ background: "#FFFFFF", border: "1px solid #0F4C5C", borderRadius: 4 }}>
        {schedule.map((s, i, a) => (
          <div key={s.time} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < a.length - 1 ? "1px dotted #0F4C5C40" : "none" }}>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold italic text-[#C73E1D]">{s.time}</span>
              <div>
                <p className="text-[13px] font-bold italic text-[#0F4C5C]">{s.name}</p>
                <p className="text-[9px] text-[#0F4C5C]/60 uppercase tracking-wider">{s.dur}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#0F4C5C]/50" />
          </div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5" style={{ background: "#0F4C5C", borderTop: "3px double #E8B04B" }}>
      {[Home, Calendar, Map, User].map((I, i) => (
        <I key={i} className="h-5 w-5" style={{ color: i === 0 ? "#E8B04B" : "#F5EBD8AA" }} />
      ))}
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 4 — MORPHIC GLASS
   Heavy blur, layered orbs, depth
   ============================================================ */
const D4 = () => (
  <Phone bg="linear-gradient(135deg, #FF6E7F 0%, #BFE9FF 50%, #A18CD1 100%)" font="-apple-system, 'SF Pro Display', sans-serif">
    <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full" style={{ background: "#FF6B9D", filter: "blur(60px)", opacity: 0.6 }} />
    <div className="absolute top-40 -right-10 w-40 h-40 rounded-full" style={{ background: "#FFD93D", filter: "blur(50px)", opacity: 0.5 }} />
    <div className="absolute bottom-20 left-10 w-44 h-44 rounded-full" style={{ background: "#6BCB77", filter: "blur(60px)", opacity: 0.4 }} />

    <div className="relative sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
      <Bell className="h-5 w-5 text-white" />
      <span className="text-[13px] font-bold tracking-wide text-white">DSM</span>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "rgba(255,59,48,0.9)", backdropFilter: "blur(10px)" }}>SOS</div>
        <Menu className="h-5 w-5 text-white/80" />
      </div>
    </div>

    <div className="relative p-3 space-y-3 pb-20">
      <div className="px-1">
        <p className="text-[11px] text-white/80">Good morning</p>
        <p className="text-[20px] font-bold text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>Sarah Mitchell</p>
      </div>

      <div className="relative p-4 overflow-hidden rounded-[24px]" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 8px 32px rgba(31,38,135,0.2), inset 0 1px 0 rgba(255,255,255,0.6)" }}>
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.3)" }}>
          <Clock className="h-3 w-3 text-white" />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white">Next · 14m</span>
        </div>
        <p className="text-[22px] font-bold text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>James Carter</p>
        <p className="text-[12px] mt-1 text-white/85">2hr · Manual · 4.2mi</p>
        <button className="mt-3 px-4 py-2 text-[11px] font-bold rounded-full" style={{ background: "rgba(255,255,255,0.95)", color: "#A18CD1", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>Start lesson →</button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 16px rgba(31,38,135,0.1)" }}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-2" style={{ background: "rgba(255,255,255,0.4)" }}>
              <t.icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-[11px] text-white/85">{t.label}</p>
            <p className="text-[18px] font-bold text-white">{t.count}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/85 px-1 pt-1">Today's Schedule</p>
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.3)" }}>
        {schedule.map((s, i, a) => (
          <div key={s.time} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < a.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-white">{s.time}</span>
              <div>
                <p className="text-[13px] font-semibold text-white">{s.name}</p>
                <p className="text-[10px] text-white/70">{s.dur}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/70" />
          </div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(30px)", borderTop: "1px solid rgba(255,255,255,0.25)" }}>
      {[Home, Calendar, Map, User].map((I, i) => (
        <I key={i} className="h-5 w-5" style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)" }} />
      ))}
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 5 — RISOGRAPH ZINE
   Off-register prints, dotted patterns, paper texture
   ============================================================ */
const D5 = () => (
  <Phone bg="#FFF9E6" font="'Space Grotesk', system-ui, sans-serif">
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "4px 4px" }} />
    <div className="relative sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: "#FFF9E6", borderBottom: "1.5px solid #1A1A1A" }}>
      <Bell className="h-5 w-5 text-[#1A1A1A]" />
      <span className="text-[14px] font-black tracking-tight text-[#1A1A1A]">D/S/M</span>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 flex items-center justify-center text-[9px] font-black text-[#FFF9E6]" style={{ background: "#FF4F4F", clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }}>SOS</div>
        <Menu className="h-5 w-5 text-[#1A1A1A]" />
      </div>
    </div>
    <div className="relative p-3 space-y-3 pb-20">
      <div className="px-1 relative">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF4F4F]">Hello,</p>
        <p className="text-[24px] font-black text-[#1A1A1A] leading-tight" style={{ textShadow: "2px 2px 0 #6BC4F040" }}>Sarah!</p>
      </div>

      <div className="relative p-4 overflow-hidden" style={{ background: "#6BC4F0", border: "1.5px solid #1A1A1A", borderRadius: 8 }}>
        <div className="absolute top-0 right-0 w-20 h-20 opacity-60" style={{ background: "radial-gradient(#FF4F4F 1.5px, transparent 1.5px)", backgroundSize: "5px 5px" }} />
        <div className="inline-block px-2 py-0.5 mb-2 text-[9px] font-black uppercase tracking-widest text-[#FFF9E6]" style={{ background: "#1A1A1A" }}>★ NEXT · 14M</div>
        <p className="text-[22px] font-black text-[#1A1A1A] leading-tight">James Carter</p>
        <p className="text-[11px] font-bold text-[#1A1A1A] mt-1">2HR · MANUAL · 4.2MI</p>
        <button className="mt-3 px-3 py-1.5 text-[11px] font-black uppercase" style={{ background: "#FF4F4F", color: "#FFF9E6", border: "1.5px solid #1A1A1A", borderRadius: 4, boxShadow: "3px 3px 0 #1A1A1A" }}>Start ▶</button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t, i) => {
          const colors = ["#FF4F4F", "#6BC4F0", "#7FD89C", "#FFB84F"];
          return (
            <div key={t.label} className="p-3" style={{ background: "#FFFFFF", border: "1.5px solid #1A1A1A", borderRadius: 6, boxShadow: "3px 3px 0 #1A1A1A" }}>
              <div className="h-8 w-8 flex items-center justify-center mb-2 rounded" style={{ background: colors[i] }}>
                <t.icon className="h-4 w-4 text-[#1A1A1A]" />
              </div>
              <p className="text-[10px] font-bold uppercase text-[#1A1A1A]/70">{t.label}</p>
              <p className="text-[20px] font-black text-[#1A1A1A]">{t.count}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest text-[#FF4F4F] px-1">▼ TODAY ▼</p>
      <div style={{ background: "#FFFFFF", border: "1.5px solid #1A1A1A", borderRadius: 6, boxShadow: "3px 3px 0 #1A1A1A" }}>
        {schedule.map((s, i, a) => (
          <div key={s.time} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < a.length - 1 ? "1px dashed #1A1A1A60" : "none" }}>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-black text-[#FF4F4F]">{s.time}</span>
              <div>
                <p className="text-[13px] font-bold text-[#1A1A1A]">{s.name}</p>
                <p className="text-[10px] font-medium text-[#1A1A1A]/60 uppercase">{s.dur}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#1A1A1A]" />
          </div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5" style={{ background: "#FFF9E6", borderTop: "1.5px solid #1A1A1A" }}>
      {[Home, Calendar, Map, User].map((I, i) => (
        <I key={i} className="h-5 w-5" style={{ color: i === 0 ? "#FF4F4F" : "#1A1A1A80" }} />
      ))}
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 6 — JAPANESE MINIMAL (Muji-inspired)
   Off-white, indigo, single red dot — extreme negative space
   ============================================================ */
const D6 = () => (
  <Phone bg="#F4F1EA" font="'Noto Serif JP', 'Lora', serif">
    <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: "#F4F1EA" }}>
      <Bell className="h-4 w-4 text-[#1A2238]" strokeWidth={1.5} />
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-[#D62828]" />
        <span className="text-[11px] tracking-[0.3em] text-[#1A2238]">D · S · M</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-medium text-white" style={{ background: "#D62828" }}>SOS</div>
        <Menu className="h-4 w-4 text-[#1A2238]" strokeWidth={1.5} />
      </div>
    </div>
    <div className="p-5 space-y-5 pb-20">
      <div>
        <p className="text-[10px] tracking-[0.3em] text-[#1A2238]/60 uppercase">Morning</p>
        <p className="text-[24px] font-normal text-[#1A2238] mt-1" style={{ letterSpacing: "0.02em" }}>Sarah Mitchell</p>
        <div className="h-[1px] w-8 bg-[#D62828] mt-3" />
      </div>

      <div className="space-y-3">
        <p className="text-[9px] tracking-[0.4em] text-[#1A2238]/50 uppercase">— Next lesson</p>
        <div>
          <p className="text-[28px] font-light text-[#1A2238] leading-tight" style={{ letterSpacing: "-0.01em" }}>James Carter</p>
          <p className="text-[12px] text-[#1A2238]/60 mt-1">10:00 — 12:00 · Manual</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="h-1 w-1 rounded-full bg-[#D62828]" />
            <span className="text-[11px] text-[#1A2238]/70">In 14 minutes · 4.2mi</span>
          </div>
        </div>
        <button className="mt-2 px-0 py-2 text-[12px] text-[#1A2238] border-b border-[#1A2238] inline-flex items-center gap-2">Start lesson <span>→</span></button>
      </div>

      <div className="h-[1px] bg-[#1A2238]/15" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {tiles.map((t) => (
          <div key={t.label} className="border-l border-[#1A2238]/30 pl-3">
            <p className="text-[10px] tracking-wider text-[#1A2238]/60 uppercase">{t.label}</p>
            <p className="text-[24px] font-light text-[#1A2238] mt-0.5">{t.count}</p>
          </div>
        ))}
      </div>

      <div className="h-[1px] bg-[#1A2238]/15" />

      <div className="space-y-3">
        <p className="text-[9px] tracking-[0.4em] text-[#1A2238]/50 uppercase">— Today</p>
        {schedule.map((s) => (
          <div key={s.time} className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-4">
              <span className="text-[11px] tabular-nums text-[#1A2238]/60">{s.time}</span>
              <span className="text-[14px] text-[#1A2238]">{s.name}</span>
            </div>
            <span className="text-[10px] text-[#1A2238]/50">{s.dur}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-3" style={{ background: "#F4F1EA", borderTop: "1px solid #1A223815" }}>
      {[Home, Calendar, Map, User].map((I, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <I className="h-4 w-4" style={{ color: i === 0 ? "#1A2238" : "#1A223860" }} strokeWidth={1.5} />
          {i === 0 && <div className="h-0.5 w-0.5 rounded-full bg-[#D62828]" />}
        </div>
      ))}
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 7 — ART DECO LUXE
   Black, gold lines, geometric ornaments
   ============================================================ */
const D7 = () => (
  <Phone bg="#0F0F0F" font="'Cormorant Garamond', 'Playfair Display', serif">
    <div className="sticky top-0 z-10" style={{ background: "#0F0F0F" }}>
      <div className="h-1" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div className="flex items-center justify-between px-4 py-3">
        <Bell className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.5} />
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-[#D4AF37]">◆</div>
          <span className="text-[12px] font-bold tracking-[0.4em] text-[#D4AF37] italic">DSM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0F0F0F]" style={{ background: "#D4AF37" }}>SOS</div>
          <Menu className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.5} />
        </div>
      </div>
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
    </div>
    <div className="p-3 space-y-3 pb-20">
      <div className="px-1 text-center py-2">
        <p className="text-[9px] tracking-[0.5em] text-[#D4AF37] uppercase">— Madame —</p>
        <p className="text-[24px] italic font-bold text-[#F5E6C8]">Sarah Mitchell</p>
      </div>

      <div className="relative p-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)", border: "1px solid #D4AF37", borderRadius: 4 }}>
        <div className="absolute top-1 left-1 right-1 h-px bg-[#D4AF37]/40" />
        <div className="absolute bottom-1 left-1 right-1 h-px bg-[#D4AF37]/40" />
        <div className="absolute top-2 right-2 text-[#D4AF37] text-[11px]">◆ ◆ ◆</div>
        <p className="text-[9px] tracking-[0.4em] text-[#D4AF37] uppercase mt-1">Next Engagement · 14'</p>
        <p className="text-[24px] italic font-bold text-[#F5E6C8] leading-tight mt-1">James Carter</p>
        <p className="text-[11px] text-[#F5E6C8]/70 italic mt-1">Two hours · Manual transmission</p>
        <div className="h-px w-12 bg-[#D4AF37] my-3" />
        <button className="text-[11px] tracking-[0.3em] text-[#D4AF37] uppercase border border-[#D4AF37] px-4 py-1.5 hover:bg-[#D4AF37] hover:text-[#0F0F0F] transition">Commence →</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="p-3 relative" style={{ background: "#1A1A1A", border: "1px solid #D4AF37", borderRadius: 2 }}>
            <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-[#D4AF37]" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-[#D4AF37]" />
            <div className="h-8 w-8 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ border: "1px solid #D4AF37" }}>
              <t.icon className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <p className="text-[9px] tracking-widest text-[#F5E6C8]/60 uppercase text-center">{t.label}</p>
            <p className="text-[20px] font-bold italic text-[#D4AF37] text-center">{t.count}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-[9px] tracking-[0.5em] text-[#D4AF37] uppercase">◆ Itinerary ◆</p>
      </div>
      <div style={{ background: "#1A1A1A", border: "1px solid #D4AF37", borderRadius: 2 }}>
        {schedule.map((s, i, a) => (
          <div key={s.time} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < a.length - 1 ? "1px solid #D4AF3730" : "none" }}>
            <div className="flex items-center gap-3">
              <span className="text-[12px] italic font-bold text-[#D4AF37]">{s.time}</span>
              <div>
                <p className="text-[13px] italic text-[#F5E6C8]">{s.name}</p>
                <p className="text-[9px] tracking-wider text-[#F5E6C8]/50 uppercase">{s.dur}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
          </div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0">
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div className="flex items-center justify-around py-2.5" style={{ background: "#0F0F0F" }}>
        {[Home, Calendar, Map, User].map((I, i) => (
          <I key={i} className="h-5 w-5" style={{ color: i === 0 ? "#D4AF37" : "#F5E6C840" }} strokeWidth={1.5} />
        ))}
      </div>
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 8 — SUNRISE GRADIENT
   Warm peach-coral-purple gradient, soft and energetic
   ============================================================ */
const D8 = () => (
  <Phone bg="linear-gradient(180deg, #FFE5D9 0%, #FFB7B2 35%, #FF8FA3 70%, #C08497 100%)" font="-apple-system, 'SF Pro Display', sans-serif">
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: "rgba(255,229,217,0.7)", backdropFilter: "blur(12px)" }}>
      <Bell className="h-5 w-5 text-[#7B2D5C]" />
      <span className="text-[13px] font-bold tracking-wide text-[#7B2D5C]">DSM</span>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#C73E5C" }}>SOS</div>
        <Menu className="h-5 w-5 text-[#7B2D5C]" />
      </div>
    </div>
    <div className="p-3 space-y-3 pb-20">
      <div className="px-1">
        <p className="text-[11px] font-medium text-[#7B2D5C]/70">☀ Good morning</p>
        <p className="text-[22px] font-bold text-[#7B2D5C]">Sarah Mitchell</p>
      </div>

      <div className="relative p-4 overflow-hidden rounded-3xl" style={{ background: "linear-gradient(135deg, #fff 0%, #FFF5F0 100%)", boxShadow: "0 12px 32px rgba(199,62,92,0.18)" }}>
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: "linear-gradient(135deg, #FFB7B2, #FF8FA3)", opacity: 0.4 }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full mb-2 text-[9px] font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(90deg, #FF8FA3, #C08497)" }}>
            <Clock className="h-2.5 w-2.5" /> Next · 14m
          </div>
          <p className="text-[22px] font-bold text-[#7B2D5C]">James Carter</p>
          <p className="text-[12px] text-[#7B2D5C]/70 mt-1">2hr · Manual · 4.2mi</p>
          <button className="mt-3 px-4 py-2 text-[11px] font-bold rounded-full text-white" style={{ background: "linear-gradient(90deg, #C73E5C, #7B2D5C)", boxShadow: "0 4px 12px rgba(199,62,92,0.3)" }}>Start lesson →</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t, i) => {
          const grads = [
            "linear-gradient(135deg, #FFE5D9, #FFB7B2)",
            "linear-gradient(135deg, #FFB7B2, #FF8FA3)",
            "linear-gradient(135deg, #FF8FA3, #C08497)",
            "linear-gradient(135deg, #FFE5D9, #C08497)",
          ];
          return (
            <div key={t.label} className="p-3 rounded-2xl" style={{ background: "#fff", boxShadow: "0 4px 12px rgba(199,62,92,0.1)" }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-2" style={{ background: grads[i] }}>
                <t.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-[11px] text-[#7B2D5C]/70">{t.label}</p>
              <p className="text-[20px] font-bold text-[#7B2D5C]">{t.count}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B2D5C]/70 px-1">Today's Schedule</p>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 12px rgba(199,62,92,0.08)" }}>
        {schedule.map((s, i, a) => (
          <div key={s.time} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < a.length - 1 ? "1px solid #FFE5D9" : "none" }}>
            <div className="flex items-center gap-3">
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "linear-gradient(90deg, #FF8FA3, #C08497)" }}>{s.time}</div>
              <div>
                <p className="text-[13px] font-semibold text-[#7B2D5C]">{s.name}</p>
                <p className="text-[10px] text-[#7B2D5C]/60">{s.dur}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#C08497]" />
          </div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5" style={{ background: "rgba(192,132,151,0.85)", backdropFilter: "blur(12px)" }}>
      {[Home, Calendar, Map, User].map((I, i) => (
        <div key={i} className="flex flex-col items-center">
          {i === 0 && <div className="h-1 w-1 rounded-full bg-white mb-0.5" />}
          <I className="h-5 w-5" style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.55)" }} />
        </div>
      ))}
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 9 — TERMINAL / DEVTOOL
   Monospace, green-on-black, code aesthetic
   ============================================================ */
const D9 = () => (
  <Phone bg="#0C0C0C" font="'JetBrains Mono', 'Fira Code', monospace">
    <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 text-[11px]" style={{ background: "#1A1A1A", borderBottom: "1px solid #2A2A2A" }}>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-[#FF5F56]" />
        <div className="h-2 w-2 rounded-full bg-[#FFBD2E]" />
        <div className="h-2 w-2 rounded-full bg-[#27C93F]" />
      </div>
      <span className="text-[#27C93F]">~/dsm/instructor</span>
      <span className="text-[#666]">v2.4</span>
    </div>
    <div className="flex items-center justify-between px-3 py-2" style={{ background: "#0C0C0C", borderBottom: "1px solid #1F1F1F" }}>
      <Bell className="h-4 w-4 text-[#27C93F]" />
      <span className="text-[10px] text-[#27C93F]">$ DSM --status=online</span>
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 flex items-center justify-center text-[8px] font-bold text-white rounded" style={{ background: "#FF5F56" }}>SOS</div>
        <Menu className="h-4 w-4 text-[#27C93F]" />
      </div>
    </div>
    <div className="p-3 space-y-3 pb-20 text-[#27C93F]">
      <div className="text-[11px]">
        <p><span className="text-[#666]">user@dsm:~$</span> whoami</p>
        <p className="text-white text-[14px]">{"> Sarah_Mitchell"}</p>
      </div>

      <div className="border border-[#27C93F]/40 rounded p-3" style={{ background: "#0F1A0F" }}>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span>┌─ NEXT_LESSON ─┐</span>
          <span className="text-[#FFBD2E]">[T-14:00]</span>
        </div>
        <p className="text-white text-[18px] font-bold">james_carter</p>
        <div className="text-[11px] mt-1 space-y-0.5">
          <p><span className="text-[#666]">duration:</span> <span className="text-white">2h</span></p>
          <p><span className="text-[#666]">type:</span> <span className="text-white">manual</span></p>
          <p><span className="text-[#666]">distance:</span> <span className="text-white">4.2mi</span></p>
          <p><span className="text-[#666]">addr:</span> <span className="text-white">12 Oakwood Rd</span></p>
        </div>
        <button className="mt-2 px-3 py-1 text-[11px] font-bold rounded" style={{ background: "#27C93F", color: "#0C0C0C" }}>./start_lesson.sh</button>
      </div>

      <div className="text-[10px] text-[#666]">// activity.json</div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {tiles.map((t) => (
          <div key={t.label} className="border border-[#27C93F]/30 rounded p-2.5" style={{ background: "#0F0F0F" }}>
            <div className="flex items-center justify-between mb-1">
              <t.icon className="h-3.5 w-3.5 text-[#27C93F]" />
              <span className="text-[16px] font-bold text-white">{t.count}</span>
            </div>
            <p className="text-[10px] text-[#666]">{t.label.toLowerCase().replace(" ", "_")}</p>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-[#666]">// schedule.log</div>
      <div className="border border-[#27C93F]/30 rounded text-[11px]" style={{ background: "#0F0F0F" }}>
        {schedule.map((s, i, a) => (
          <div key={s.time} className="flex items-center justify-between px-2.5 py-2" style={{ borderBottom: i < a.length - 1 ? "1px dashed #27C93F30" : "none" }}>
            <div className="flex items-center gap-2">
              <span className="text-[#FFBD2E]">[{s.time}]</span>
              <span className="text-white">{s.name.toLowerCase().replace(" ", "_")}</span>
            </div>
            <span className="text-[#666]">{s.dur}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-[#27C93F] animate-pulse">█</div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2 text-[10px]" style={{ background: "#1A1A1A", borderTop: "1px solid #27C93F40" }}>
      {[
        { I: Home, k: "home" },
        { I: Calendar, k: "sched" },
        { I: Map, k: "track" },
        { I: User, k: "user" },
      ].map((n, i) => (
        <div key={n.k} className="flex flex-col items-center">
          <n.I className="h-4 w-4" style={{ color: i === 0 ? "#27C93F" : "#666" }} />
          <span style={{ color: i === 0 ? "#27C93F" : "#666" }}>{n.k}</span>
        </div>
      ))}
    </div>
  </Phone>
);

/* ============================================================
   DESIGN 10 — MEMPHIS POP
   80s memphis, squiggles, primary colors, geometric chaos
   ============================================================ */
const D10 = () => (
  <Phone bg="#FAF3E7" font="'Space Grotesk', system-ui, sans-serif">
    {/* memphis decorative shapes */}
    <div className="absolute top-20 right-4 w-12 h-12 rounded-full opacity-20" style={{ background: "#FF3366" }} />
    <div className="absolute top-60 left-2 w-8 h-8 opacity-25" style={{ background: "#3D5AF1", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
    <div className="absolute bottom-40 right-6 w-10 h-10 opacity-20" style={{ background: "#22D3AA", borderRadius: "50% 0 50% 50%" }} />
    <div className="absolute top-96 right-10 opacity-25 text-[#FFB52E] text-2xl">∿∿∿</div>

    <div className="relative sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: "#FAF3E7", borderBottom: "2px solid #1A1A1A" }}>
      <div className="relative">
        <Bell className="h-5 w-5 text-[#1A1A1A]" />
        <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full" style={{ background: "#FF3366", border: "1.5px solid #FAF3E7" }} />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[14px] font-black text-[#FF3366]">D</span>
        <span className="text-[14px] font-black text-[#3D5AF1]">S</span>
        <span className="text-[14px] font-black text-[#22D3AA]">M</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 flex items-center justify-center text-[9px] font-black text-white" style={{ background: "#FF3366", borderRadius: "30% 70% 70% 30%" }}>SOS</div>
        <Menu className="h-5 w-5 text-[#1A1A1A]" />
      </div>
    </div>
    <div className="relative p-3 space-y-3 pb-20">
      <div className="px-1">
        <p className="text-[11px] font-bold text-[#3D5AF1]">Hey there ✦</p>
        <p className="text-[24px] font-black text-[#1A1A1A] leading-tight">Sarah!</p>
      </div>

      <div className="relative p-4 overflow-hidden" style={{ background: "#3D5AF1", borderRadius: 20, border: "2.5px solid #1A1A1A", boxShadow: "5px 5px 0 #1A1A1A" }}>
        <div className="absolute top-0 left-0 right-0 h-3 flex">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="flex-1" style={{ background: i % 3 === 0 ? "#FFB52E" : i % 3 === 1 ? "#FF3366" : "#22D3AA" }} />
          ))}
        </div>
        <div className="mt-2">
          <div className="inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#1A1A1A]" style={{ background: "#FFB52E", borderRadius: 4 }}>★ NEXT IN 14M</div>
          <p className="text-[22px] font-black text-white leading-tight mt-2">James Carter</p>
          <p className="text-[12px] font-bold text-white/90 mt-1">2hr · Manual · 4.2mi</p>
          <button className="mt-3 px-4 py-2 text-[11px] font-black uppercase" style={{ background: "#22D3AA", color: "#1A1A1A", borderRadius: 30, border: "2px solid #1A1A1A" }}>Let's go ↗</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t, i) => {
          const colors = [
            { bg: "#FF3366", icon: "#FFB52E" },
            { bg: "#22D3AA", icon: "#3D5AF1" },
            { bg: "#FFB52E", icon: "#FF3366" },
            { bg: "#3D5AF1", icon: "#22D3AA" },
          ];
          const shapes = [20, "30% 60% 30% 60%", 12, "60% 30% 60% 30%"];
          return (
            <div key={t.label} className="p-3" style={{ background: "#FFFFFF", borderRadius: 16, border: "2px solid #1A1A1A", boxShadow: "3px 3px 0 #1A1A1A" }}>
              <div className="h-9 w-9 flex items-center justify-center mb-2" style={{ background: colors[i].bg, borderRadius: shapes[i] as any, border: "2px solid #1A1A1A" }}>
                <t.icon className="h-4 w-4" style={{ color: colors[i].icon }} />
              </div>
              <p className="text-[10px] font-bold text-[#1A1A1A]/70">{t.label}</p>
              <p className="text-[20px] font-black text-[#1A1A1A]">{t.count}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] font-black text-[#FF3366] px-1">▸ Today's lessons ✦</p>
      <div style={{ background: "#FFFFFF", borderRadius: 16, border: "2px solid #1A1A1A", boxShadow: "3px 3px 0 #1A1A1A" }}>
        {schedule.map((s, i, a) => {
          const tColors = ["#FF3366", "#3D5AF1", "#22D3AA"];
          return (
            <div key={s.time} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < a.length - 1 ? "1.5px dashed #1A1A1A40" : "none" }}>
              <div className="flex items-center gap-3">
                <div className="px-2 py-0.5 text-[10px] font-black text-white" style={{ background: tColors[i], borderRadius: 4, border: "1.5px solid #1A1A1A" }}>{s.time}</div>
                <div>
                  <p className="text-[13px] font-bold text-[#1A1A1A]">{s.name}</p>
                  <p className="text-[10px] font-bold text-[#1A1A1A]/60">{s.dur}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#1A1A1A]" strokeWidth={2.5} />
            </div>
          );
        })}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5" style={{ background: "#FAF3E7", borderTop: "2px solid #1A1A1A" }}>
      {[
        { I: Home, c: "#FF3366" },
        { I: Calendar, c: "#3D5AF1" },
        { I: Map, c: "#22D3AA" },
        { I: User, c: "#FFB52E" },
      ].map((n, i) => (
        <div key={i} className="flex flex-col items-center">
          {i === 0 && <div className="h-1 w-4 rounded-full mb-0.5" style={{ background: n.c }} />}
          <n.I className="h-5 w-5" style={{ color: i === 0 ? n.c : "#1A1A1A60" }} strokeWidth={i === 0 ? 2.5 : 2} />
        </div>
      ))}
    </div>
  </Phone>
);

const DESIGNS: Design[] = [
  { id: 1, name: "Racing Stripe", tagline: "Black + signal yellow, motorsport energy", render: D1 },
  { id: 2, name: "Neon Arcade", tagline: "Cyberpunk glow, magenta + cyan", render: D2 },
  { id: 3, name: "Vintage Travel", tagline: "Cream, terracotta & teal — art deco poster", render: D3 },
  { id: 4, name: "Morphic Glass", tagline: "Heavy blur, layered orbs, depth", render: D4 },
  { id: 5, name: "Risograph Zine", tagline: "Off-register prints, dotted patterns", render: D5 },
  { id: 6, name: "Japanese Minimal", tagline: "Off-white, indigo, single red dot", render: D6 },
  { id: 7, name: "Art Deco Luxe", tagline: "Black, gold lines, geometric ornaments", render: D7 },
  { id: 8, name: "Sunrise Gradient", tagline: "Peach to plum, soft & energetic", render: D8 },
  { id: 9, name: "Terminal", tagline: "Monospace devtool, green-on-black", render: D9 },
  { id: 10, name: "Memphis Pop", tagline: "80s shapes, primary chaos", render: D10 },
];

export default function DemoInstructorAppRedesigns() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Instructor App — 10 Bold Design Directions
          </h1>
          <p className="mt-2 text-slate-600">
            Each one has its own personality. Same layout, same functions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {DESIGNS.map((d) => (
            <div
              key={d.id}
              className={cn(
                "rounded-2xl bg-white p-6 transition-all cursor-pointer border-2",
                selected === d.id
                  ? "border-emerald-500 shadow-2xl scale-[1.02]"
                  : "border-transparent shadow-md hover:shadow-xl"
              )}
              onClick={() => setSelected(d.id)}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
                    {d.id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{d.name}</h2>
                </div>
                <p className="text-sm text-slate-500">{d.tagline}</p>
              </div>
              <d.render />
              {selected === d.id && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Sparkles className="h-3 w-3" />
                    Selected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {selected && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50">
            <span className="text-sm">
              Selected: <strong>#{selected} {DESIGNS.find((d) => d.id === selected)?.name}</strong>
            </span>
            <span className="text-xs text-slate-400">— tell me to apply it</span>
          </div>
        )}
      </div>
    </div>
  );
}
