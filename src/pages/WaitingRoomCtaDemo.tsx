import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, Coffee, Users, Video, ArrowRight,
  Sparkles, Radio, Zap, MessageCircle, Play,
} from "lucide-react";
import waitingRoomPromo from "@/assets/waiting-room-promo.jpg";

function DemoLabel({ number, name }: { number: number; name: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-bold bg-foreground text-background rounded-full w-6 h-6 flex items-center justify-center">
        {number}
      </span>
      <span className="text-sm font-semibold text-foreground">{name}</span>
    </div>
  );
}

/* ── Option 1: Glassmorphism ── */
function Option1() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl overflow-hidden cursor-pointer relative shadow-lg"
      style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}
    >
      <div className="absolute inset-0">
        <img src={waitingRoomPromo} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 via-[#1e3a5f]/70 to-transparent" />
      </div>

      <div className="relative flex items-center gap-4 p-4">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <span className="text-2xl">☕</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-bold text-white">The Waiting Room</p>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] font-bold uppercase tracking-wider border border-emerald-400/30">
              Live Weekly
            </span>
          </div>
          <p className="text-[12px] text-blue-100/80 mt-1">
            Join fellow instructors for an informal weekly Zoom catch-up
          </p>
        </div>
        <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
          <ChevronRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 2: Warm Gradient ── */
function Option2() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f472b6, #e879f9)" }}
    >
      <div className="p-4 flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <Coffee className="h-6 w-6 text-pink-300" />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-white">The Waiting Room</p>
          <p className="text-[11px] text-pink-100/80 mt-0.5">Weekly instructor Zoom</p>
        </div>
        <ChevronRight className="h-5 w-5 text-white/50 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 3: Minimal Accent Strip ── */
function Option3() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer overflow-hidden"
    >
      <div className="bg-blue-500 h-1" />
      <div className="p-4 flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Coffee className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-foreground">The Waiting Room</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Weekly instructor Zoom</p>
        </div>
        <ChevronRight className="h-5 w-5 text-blue-500 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 4: Photo Hero ── */
function Option4() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer overflow-hidden"
    >
      <div className="relative h-20">
        <img src={waitingRoomPromo} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="p-4 flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <Coffee className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-white">The Waiting Room</p>
          <p className="text-[11px] text-blue-100/80 mt-0.5">Weekly instructor Zoom</p>
        </div>
        <ChevronRight className="h-5 w-5 text-white/50 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 5: Pill / Notification ── */
function Option5() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-full cursor-pointer px-4 py-2 bg-secondary flex items-center gap-3"
    >
      <Coffee className="h-4 w-4 text-secondary-foreground" />
      <p className="text-sm font-medium text-secondary-foreground">The Waiting Room is now open</p>
    </motion.div>
  );
}

/* ── Option 6: Dark Glow Ring ── */
function Option6() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer p-4"
      style={{ background: "radial-gradient(circle, #1e293b, #0f172a)" }}
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.6)]">
          <Coffee className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-white">The Waiting Room</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Weekly instructor Zoom</p>
        </div>
        <ChevronRight className="h-5 w-5 text-white/50 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 7: Split Two-tone ── */
function Option7() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer overflow-hidden grid grid-cols-[1fr_auto]"
      style={{ height: 80 }}
    >
      <div className="p-4 flex items-center gap-4 bg-card">
        <div className="shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Coffee className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-foreground">The Waiting Room</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Weekly instructor Zoom</p>
        </div>
      </div>
      <div className="bg-blue-100 flex items-center justify-center px-5">
        <ChevronRight className="h-5 w-5 text-blue-500 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 8: Stacked Banner ── */
function Option8() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer overflow-hidden"
    >
      <div className="bg-blue-600 text-blue-100 px-4 py-1.5 text-sm font-bold">
        Join fellow instructors
      </div>
      <div className="p-4 flex items-center gap-4 bg-card">
        <div className="flex-1">
          <p className="text-[15px] font-bold text-foreground">The Waiting Room</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Weekly instructor Zoom</p>
        </div>
        <ChevronRight className="h-5 w-5 text-blue-500 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 9: Compact Chip ── */
function Option9() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-full cursor-pointer px-3 py-1.5 bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider"
    >
      The Waiting Room
    </motion.div>
  );
}

/* ── Option 10: Bold Neon Gradient ── */
function Option10() {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer overflow-hidden"
      style={{ background: "linear-gradient(135deg, #06b6d4, #2A394F, #d946ef)" }}
    >
      <div className="p-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[15px] font-bold text-white">The Waiting Room</p>
          <p className="text-[11px] text-blue-100/80 mt-0.5">Weekly instructor Zoom</p>
        </div>
        <Zap className="h-5 w-5 text-white/50 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 11: Neumorphic Light ── */
function Option11() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer p-4 flex items-center gap-4"
      style={{ background: "#e8ecf1", boxShadow: "8px 8px 16px #c5c9cd, -8px -8px 16px #ffffff" }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: "#e8ecf1", boxShadow: "inset 4px 4px 8px #c5c9cd, inset -4px -4px 8px #ffffff" }}>
        <Coffee className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-bold text-gray-800">The Waiting Room</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Weekly instructor Zoom catch-up</p>
      </div>
      <div className="px-4 py-2 rounded-xl text-[11px] font-bold text-white bg-blue-600 shadow-md shadow-blue-600/30">
        Join
      </div>
    </motion.div>
  );
}

/* ── Option 12: Retro Terminal ── */
function Option12() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer p-4 border-2 border-green-500/40 relative overflow-hidden"
      style={{ background: "#0a0a0a" }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)" }} />
      <div className="relative flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
        <div className="flex-1">
          <p className="text-[14px] font-mono font-bold text-green-400">the_waiting_room</p>
          <p className="text-[11px] font-mono text-green-400/50 mt-0.5">// weekly zoom :: join fellow ADIs</p>
        </div>
        <span className="text-green-400 font-mono text-sm">→</span>
      </div>
    </motion.div>
  );
}

/* ── Option 13: Sunrise Warmth ── */
function Option13() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)" }}>
      <div className="absolute top-0 left-0 w-40 h-40 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
      <div className="relative p-5 flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl">☀️</span>
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-extrabold text-amber-950">The Waiting Room</p>
          <p className="text-[11px] text-amber-900/70 mt-0.5">Start your week with fellow instructors</p>
        </div>
        <ChevronRight className="h-5 w-5 text-amber-900/50 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 14: Floating Island ── */
function Option14() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-[28px] cursor-pointer p-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-xl shadow-purple-500/20">
      <div className="bg-card rounded-[24px] p-4 flex items-center gap-4">
        <div className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
          <Coffee className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-foreground">The Waiting Room</p>
          <p className="text-[11px] text-muted-foreground">Weekly Zoom · Community</p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-[11px] font-bold text-white">
          Join
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 15: Ticket / Pass ── */
function Option15() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="cursor-pointer flex overflow-hidden rounded-2xl border border-border shadow-sm">
      <div className="bg-blue-600 p-5 flex flex-col items-center justify-center shrink-0 min-w-[80px]">
        <span className="text-2xl">☕</span>
        <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Weekly</p>
      </div>
      <div className="border-l-2 border-dashed border-border" />
      <div className="bg-card flex-1 p-4 flex flex-col justify-center">
        <p className="text-sm font-bold text-foreground">The Waiting Room</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Informal Zoom for driving instructors</p>
        <div className="flex items-center gap-1.5 mt-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Open to all ADIs</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 16: Frosted Layers ── */
function Option16() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1e293b, #334155)" }}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-sky-500/20 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-indigo-500/20 blur-2xl" />
      <div className="relative p-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 flex items-center gap-4">
          <div className="shrink-0 w-11 h-11 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-400/30">
            <Video className="h-5 w-5 text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-white">The Waiting Room</p>
            <p className="text-[11px] text-slate-400">Weekly instructor Zoom</p>
          </div>
          <ArrowRight className="h-4 w-4 text-sky-400 shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 17: Brutalist ── */
function Option17() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="cursor-pointer border-4 border-foreground p-4 flex items-center gap-4"
      style={{ borderRadius: 0 }}>
      <div className="shrink-0 w-14 h-14 bg-foreground flex items-center justify-center">
        <Coffee className="h-6 w-6 text-background" />
      </div>
      <div className="flex-1">
        <p className="text-[16px] font-black text-foreground uppercase tracking-tight leading-none">The Waiting Room</p>
        <p className="text-[11px] text-muted-foreground mt-1 font-medium">WEEKLY ZOOM · COMMUNITY · FREE</p>
      </div>
      <span className="text-foreground text-2xl font-black shrink-0">→</span>
    </motion.div>
  );
}

/* ── Option 18: Soft Cloud ── */
function Option18() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-3xl cursor-pointer p-5 flex items-center gap-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-sm border border-blue-200/50 dark:border-blue-800/30">
      <div className="shrink-0 w-14 h-14 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
        <span className="text-2xl">☕</span>
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-bold text-blue-900 dark:text-blue-100">The Waiting Room</p>
        <p className="text-[11px] text-blue-700/60 dark:text-blue-300/50 mt-0.5">A relaxed weekly Zoom for instructors</p>
      </div>
      <div className="shrink-0 px-4 py-2 rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-md shadow-blue-600/20">
        Join
      </div>
    </motion.div>
  );
}

/* ── Option 19: Holographic Border ── */
function Option19() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer relative overflow-hidden p-[2px]"
      style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #06b6d4)" }}>
      <div className="bg-background rounded-[14px] p-4 flex items-center gap-4">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center">
          <Coffee className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-foreground">The Waiting Room</p>
          <p className="text-[11px] text-muted-foreground">Weekly Zoom catch-up</p>
        </div>
        <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 20: Emerald Map ── */
function Option20() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl cursor-pointer overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #065f46, #047857, #059669)" }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div className="relative p-5 flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <span className="text-xl">📍</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-bold text-white">The Waiting Room</p>
            <span className="px-2 py-0.5 rounded-full bg-emerald-300/20 text-emerald-200 text-[9px] font-bold uppercase border border-emerald-300/30">
              Online
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/60 mt-0.5">Meet instructors from across the UK every week</p>
        </div>
        <ChevronRight className="h-5 w-5 text-white/40 shrink-0" />
      </div>
    </motion.div>
  );
}

export default function WaitingRoomCtaDemo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground text-sm font-medium">← Back</button>
          <h1 className="text-base font-bold text-foreground">Waiting Room CTA Options</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        <p className="text-xs text-muted-foreground">Tap any to preview feel. Pick your favourite!</p>

        <div><DemoLabel number={1} name="Glassmorphism" /><Option1 /></div>
        <div><DemoLabel number={2} name="Warm Gradient" /><Option2 /></div>
        <div><DemoLabel number={3} name="Minimal Accent Strip" /><Option3 /></div>
        <div><DemoLabel number={4} name="Photo Hero" /><Option4 /></div>
        <div><DemoLabel number={5} name="Pill / Notification" /><Option5 /></div>
        <div><DemoLabel number={6} name="Dark Glow Ring" /><Option6 /></div>
        <div><DemoLabel number={7} name="Split Two-tone" /><Option7 /></div>
        <div><DemoLabel number={8} name="Stacked Banner" /><Option8 /></div>
        <div><DemoLabel number={9} name="Compact Chip" /><Option9 /></div>
        <div><DemoLabel number={10} name="Bold Neon Gradient" /><Option10 /></div>
        <div><DemoLabel number={11} name="Neumorphic Light" /><Option11 /></div>
        <div><DemoLabel number={12} name="Retro Terminal" /><Option12 /></div>
        <div><DemoLabel number={13} name="Sunrise Warmth" /><Option13 /></div>
        <div><DemoLabel number={14} name="Floating Island" /><Option14 /></div>
        <div><DemoLabel number={15} name="Ticket / Pass" /><Option15 /></div>
        <div><DemoLabel number={16} name="Frosted Layers" /><Option16 /></div>
        <div><DemoLabel number={17} name="Brutalist" /><Option17 /></div>
        <div><DemoLabel number={18} name="Soft Cloud" /><Option18 /></div>
        <div><DemoLabel number={19} name="Holographic Border" /><Option19 /></div>
        <div><DemoLabel number={20} name="Emerald Map" /><Option20 /></div>
      </div>
    </div>
  );
}
