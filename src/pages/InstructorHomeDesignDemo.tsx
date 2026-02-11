import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, PoundSterling, Target, Timer, CloudSun,
  Calendar, MapPin, Plus, Car, Heart, Clock,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

// ── Static demo data ─────────────────────────────────────────────
const DEMO = {
  name: "Ken",
  lessons: 4,
  earnings: 180,
  progress: 72,
  nextPupil: "Sarah",
  nextTime: "14:30",
  nextPostcode: "SO31",
  temperature: 14,
  weatherDesc: "Partly Cloudy",
  isOnline: true,
};

const timeline = [
  { time: "09:00", pupil: "James", postcode: "SO15", status: "done" },
  { time: "11:00", pupil: "Priya", postcode: "SO16", status: "done" },
  { time: "14:30", pupil: "Sarah", postcode: "SO31", status: "next" },
  { time: "16:00", pupil: "Tom", postcode: "SO14", status: "upcoming" },
];

const quickActions = [
  { icon: Calendar, label: "Fill Gaps", color: "text-violet-600", bg: "bg-violet-100" },
  { icon: MapPin, label: "Track", color: "text-emerald-600", bg: "bg-emerald-100" },
  { icon: Plus, label: "Add Lesson", color: "text-blue-600", bg: "bg-blue-100" },
  { icon: PoundSterling, label: "Payment", color: "text-rose-600", bg: "bg-rose-100" },
  { icon: Car, label: "Find Car", color: "text-sky-600", bg: "bg-sky-100" },
  { icon: Heart, label: "Health", color: "text-pink-600", bg: "bg-pink-100" },
];

const stats = [
  { icon: BookOpen, label: "Lessons", value: DEMO.lessons.toString(), color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: PoundSterling, label: "Expected", value: `£${DEMO.earnings}`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: Target, label: "Weekly", value: `${DEMO.progress}%`, color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: Timer, label: DEMO.nextPupil, value: `${DEMO.nextTime} • ${DEMO.nextPostcode}`, color: "text-amber-500", bg: "bg-amber-500/10" },
];

// ── Shared sub-components ────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

function OnlineDot() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Online
    </span>
  );
}

function StatGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s, i) => (
        <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${s.bg}`}>
          <s.icon className={`h-4 w-4 ${s.color}`} />
          <div>
            <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActionsHScroll() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {quickActions.map((a, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className={`h-11 w-11 rounded-full flex items-center justify-center ${a.bg}`}>
            <a.icon className={`h-5 w-5 ${a.color}`} />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
        </div>
      ))}
    </div>
  );
}

function QuickActionsGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {quickActions.map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${a.bg}`}>
            <a.icon className={`h-4 w-4 ${a.color}`} />
          </div>
          <span className="text-xs font-medium">{a.label}</span>
        </div>
      ))}
    </div>
  );
}

function Timeline() {
  return (
    <div className="space-y-2">
      {timeline.map((t, i) => (
        <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${t.status === "next" ? "bg-primary/5 ring-1 ring-primary/20" : ""}`}>
          <Clock className={`h-3.5 w-3.5 shrink-0 ${t.status === "done" ? "text-muted-foreground/40" : t.status === "next" ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-xs font-mono w-10 ${t.status === "done" ? "text-muted-foreground/40" : "text-foreground"}`}>{t.time}</span>
          <span className={`text-xs font-medium flex-1 ${t.status === "done" ? "text-muted-foreground/40 line-through" : ""}`}>{t.pupil}</span>
          <span className="text-[10px] text-muted-foreground">{t.postcode}</span>
        </div>
      ))}
    </div>
  );
}

function GradientHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-gradient-to-br from-primary to-primary/80 p-5 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

// ── Phone Frame ──────────────────────────────────────────────────
function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="w-[375px] h-[812px] bg-[#E8F1FE] rounded-[3rem] overflow-hidden shadow-2xl border-[6px] border-gray-800 relative">
        {/* Status bar */}
        <div className="h-11 bg-black/5 flex items-center justify-between px-8 text-[11px] font-semibold text-foreground/60">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        <div className="h-[calc(100%-44px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── VARIATION A: Track-Style Cards ───────────────────────────────
function VariationA() {
  return (
    <PhoneFrame label="A: Track-Style Cards">
      <div className="p-4 space-y-4">
        {/* Header card */}
        <motion.div {...fadeUp(0)} className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <GradientHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">K</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Ready to teach, {DEMO.name}?</h2>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <OnlineDot />
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <CloudSun className="h-3.5 w-3.5" /> {DEMO.temperature}°C • {DEMO.weatherDesc}
                  </span>
                </div>
              </div>
            </div>
          </GradientHeader>
        </motion.div>

        {/* Stats card */}
        <motion.div {...fadeUp(0.1)} className="bg-white rounded-3xl shadow-xl p-4">
          <StatGrid />
        </motion.div>

        {/* Quick Actions card */}
        <motion.div {...fadeUp(0.2)} className="bg-white rounded-3xl shadow-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Actions</p>
          <QuickActionsHScroll />
        </motion.div>

        {/* Timeline card */}
        <motion.div {...fadeUp(0.3)} className="bg-white rounded-3xl shadow-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Today's Lessons</p>
          <Timeline />
        </motion.div>
      </div>
    </PhoneFrame>
  );
}

// ── VARIATION B: Hero + Gradient Overlap ─────────────────────────
function VariationB() {
  return (
    <PhoneFrame label="B: Hero + Gradient Overlap">
      <div>
        {/* Full-bleed hero */}
        <div className="relative h-[38vh]">
          <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
        </div>

        {/* Overlap card */}
        <div className="px-4 -mt-10 relative z-10 space-y-4 pb-4">
          <motion.div {...fadeUp(0)} className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <GradientHeader>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">K</div>
                <div>
                  <h2 className="text-base font-bold">Ready to teach, {DEMO.name}?</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <OnlineDot />
                    <span className="text-white/70 text-xs"><CloudSun className="h-3 w-3 inline mr-1" />{DEMO.temperature}°C</span>
                  </div>
                </div>
              </div>
            </GradientHeader>
            <div className="p-4">
              <StatGrid />
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="bg-white rounded-3xl shadow-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Actions</p>
            <QuickActionsHScroll />
          </motion.div>

          <motion.div {...fadeUp(0.25)} className="bg-white rounded-3xl shadow-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Today's Lessons</p>
            <Timeline />
          </motion.div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── VARIATION C: Split Hero ──────────────────────────────────────
function VariationC() {
  return (
    <PhoneFrame label="C: Split Hero">
      <div className="p-4 space-y-4">
        {/* Compact inset hero */}
        <motion.div {...fadeUp(0)} className="rounded-2xl overflow-hidden shadow-lg h-36">
          <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        </motion.div>

        {/* Status card */}
        <motion.div {...fadeUp(0.08)} className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <GradientHeader>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">K</div>
              <div>
                <h2 className="text-base font-bold">{DEMO.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <OnlineDot />
                  <span className="text-white/70 text-xs"><CloudSun className="h-3 w-3 inline mr-1" />{DEMO.temperature}°C • {DEMO.weatherDesc}</span>
                </div>
              </div>
            </div>
          </GradientHeader>
        </motion.div>

        {/* Horizontal stat pills */}
        <motion.div {...fadeUp(0.15)} className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {stats.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-full shrink-0 ${s.bg} border border-white`}>
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-xs font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions grid */}
        <motion.div {...fadeUp(0.22)} className="bg-white rounded-3xl shadow-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Actions</p>
          <QuickActionsGrid />
        </motion.div>

        {/* Timeline */}
        <motion.div {...fadeUp(0.3)} className="bg-white rounded-3xl shadow-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Today's Lessons</p>
          <Timeline />
        </motion.div>
      </div>
    </PhoneFrame>
  );
}

// ── VARIATION D: Immersive Hero + Floating Stats ─────────────────
function VariationD() {
  return (
    <PhoneFrame label="D: Immersive Hero">
      <div>
        {/* Large hero with overlay */}
        <div className="relative h-[50vh]">
          <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70" />

          {/* Overlaid text */}
          <div className="absolute bottom-16 left-5 right-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">Ready to teach, {DEMO.name}?</h2>
              <OnlineDot />
            </div>
            <p className="text-white/80 text-xs flex items-center gap-1">
              <CloudSun className="h-3.5 w-3.5" /> {DEMO.temperature}°C • {DEMO.weatherDesc}
            </p>
          </div>

          {/* Glassmorphism stat pills */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-full shrink-0 backdrop-blur-md bg-white/20 border border-white/30">
                <s.icon className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-bold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card stack */}
        <div className="px-4 pt-4 pb-4 space-y-4">
          <motion.div {...fadeUp(0.1)} className="bg-white rounded-3xl shadow-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Actions</p>
            <QuickActionsHScroll />
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="bg-white rounded-3xl shadow-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Today's Lessons</p>
            <Timeline />
          </motion.div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function InstructorHomeDesignDemo() {
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Instructor Home — Design Variations</h1>
        <p className="text-sm text-muted-foreground mb-6">Compare 4 approaches side-by-side. Pick your favourite!</p>

        <Tabs defaultValue="a" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="a">A: Track-Style</TabsTrigger>
            <TabsTrigger value="b">B: Hero Overlap</TabsTrigger>
            <TabsTrigger value="c">C: Split Hero</TabsTrigger>
            <TabsTrigger value="d">D: Immersive</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="a"><div className="flex justify-center"><VariationA /></div></TabsContent>
          <TabsContent value="b"><div className="flex justify-center"><VariationB /></div></TabsContent>
          <TabsContent value="c"><div className="flex justify-center"><VariationC /></div></TabsContent>
          <TabsContent value="d"><div className="flex justify-center"><VariationD /></div></TabsContent>
          <TabsContent value="all">
            <div className="flex flex-wrap justify-center gap-8">
              <VariationA />
              <VariationB />
              <VariationC />
              <VariationD />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
