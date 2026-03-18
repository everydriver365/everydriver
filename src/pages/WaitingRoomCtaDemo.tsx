import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, Coffee, Users, Video, ArrowRight,
  Sparkles, Radio, Zap, MessageCircle, Play, Clock, Heart, Mic,
} from "lucide-react";
import waitingRoomPromo from "@/assets/waiting-room-promo.jpg";
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

/* ── Option 1: Glassmorphism Card ── */
function Option1() {
  return (
    <motion.div whileTap={{ scale: 0.97 }} className="rounded-2xl overflow-hidden cursor-pointer relative"
      style={{ background: "linear-gradient(135deg, #0f172a, #1e40af)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(96,165,250,0.3),transparent_60%)]" />
      <div className="relative p-5 flex items-center gap-4">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-[0_8px_32px_rgba(59,130,246,0.4)]">
          <Coffee className="h-7 w-7 text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-white tracking-tight">The Waiting Room</p>
          <p className="text-[11px] text-blue-200/70 mt-0.5">Weekly Zoom catch-up with fellow ADIs</p>
        </div>
        <div className="shrink-0 px-4 py-2 rounded-full bg-white text-[11px] font-bold text-blue-900">
          Join
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 2: Warm Gradient with Emoji ── */
function Option2() {
  return (
    <motion.div whileTap={{ scale: 0.97 }} className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c, #ea580c)" }}>
      <div className="p-5 flex items-center gap-4">
        <div className="shrink-0 text-4xl">☕</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-bold text-white">The Waiting Room</p>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 text-[9px] font-bold uppercase tracking-wider">
              Live
            </span>
          </div>
          <p className="text-[12px] text-orange-100/80 mt-1">Grab a brew & join the weekly chat</p>
        </div>
        <ChevronRight className="h-5 w-5 text-white/60 shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 3: Minimal Card with Accent Strip ── */
function Option3() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl overflow-hidden cursor-pointer bg-card border border-border flex">
      <div className="w-1.5 bg-blue-500 shrink-0" />
      <div className="p-4 flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <Video className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">The Waiting Room</p>
          <p className="text-[11px] text-muted-foreground">Weekly Zoom · Every Thursday</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </motion.div>
  );
}

/* ── Option 4: Full-bleed Photo Hero ── */
function Option4() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl overflow-hidden cursor-pointer relative h-32">
      <img src={waitingRoomPromo} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">☕</span>
            <p className="text-[16px] font-extrabold text-white">The Waiting Room</p>
          </div>
          <p className="text-[11px] text-white/70 mt-0.5">Join the weekly instructor Zoom</p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-[11px] font-bold text-white">
          Join Now
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 5: Pill / Notification Bar ── */
function Option5() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-full overflow-hidden cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 flex items-center gap-3 shadow-lg shadow-indigo-500/20">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <Radio className="h-4 w-4 text-white animate-pulse" />
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-bold text-white">The Waiting Room</p>
        <p className="text-[10px] text-indigo-200/80">Weekly Zoom catch-up for ADIs</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/50 shrink-0" />
    </motion.div>
  );
}

/* ── Option 6: Dark Card with Glow Ring ── */
function Option6() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl overflow-hidden cursor-pointer relative"
      style={{ background: "#0c0c0c" }}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative p-5 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-md scale-125" />
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-blue-400/50 ring-offset-2 ring-offset-[#0c0c0c]">
            <Coffee className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-white">The Waiting Room</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Informal weekly Zoom for instructors</p>
        </div>
        <div className="shrink-0 w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
          <Play className="h-4 w-4 text-white fill-white ml-0.5" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 7: Split Two-tone ── */
function Option7() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl overflow-hidden cursor-pointer flex">
      <div className="bg-blue-600 p-4 flex items-center justify-center shrink-0">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Users className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="bg-card flex-1 p-4 flex items-center justify-between border-y border-r border-border rounded-r-2xl">
        <div>
          <p className="text-sm font-bold text-foreground">The Waiting Room</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Weekly instructor catch-up on Zoom</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-[11px] font-bold text-white shrink-0 ml-2">
          Join
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 8: Stacked Banner with Pattern ── */
function Option8() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl overflow-hidden cursor-pointer relative"
      style={{ background: "linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)" }}>
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md bg-cyan-400/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-400/30">
            ☕ Community
          </span>
          <span className="px-2 py-1 rounded-md bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase">
            Live Weekly
          </span>
        </div>
        <p className="text-[17px] font-extrabold text-white">The Waiting Room</p>
        <p className="text-[12px] text-blue-200/60 mt-1 mb-3">Grab a coffee and join the Zoom chat with fellow instructors</p>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white text-[12px] font-bold text-blue-900">
            Join This Week
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/10 text-[12px] font-medium text-white border border-white/10">
            Learn More
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 9: Compact Chip Style ── */
function Option9() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-xl overflow-hidden cursor-pointer bg-card border border-border p-3 flex items-center gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30">
        <span className="text-lg">☕</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-foreground leading-tight">The Waiting Room</p>
        <p className="text-[10px] text-muted-foreground">Weekly Zoom · Community</p>
      </div>
      <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
      <div className="px-3 py-1.5 rounded-lg bg-foreground text-[11px] font-bold text-background shrink-0">
        Join
      </div>
    </motion.div>
  );
}

/* ── Option 10: Bold Neon Gradient ── */
function Option10() {
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="rounded-2xl overflow-hidden cursor-pointer relative"
      style={{ background: "linear-gradient(135deg, #4c1d95, #7c3aed, #2563eb)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(167,139,250,0.3),transparent_50%)]" />
      <div className="absolute bottom-0 right-0 w-24 h-24">
        <div className="absolute inset-0 bg-gradient-to-tl from-white/10 to-transparent rounded-tl-full" />
      </div>
      <div className="relative p-5 flex items-center gap-4">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <MessageCircle className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-bold text-white tracking-tight">The Waiting Room</p>
            <Zap className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
          </div>
          <p className="text-[11px] text-purple-200/70 mt-0.5">Weekly community Zoom for driving instructors</p>
        </div>
        <div className="shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
          <ArrowRight className="h-4 w-4 text-white" />
        </div>
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
      </div>
    </div>
  );
}
