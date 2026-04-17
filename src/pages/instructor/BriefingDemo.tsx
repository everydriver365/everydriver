import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, CloudSun, Sparkles, Volume2, RefreshCw, X, Zap, Coffee, Star, Brain, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_BRIEFING = "You have 4 lessons today starting at 9:00am. Weather is clear and dry — perfect conditions. Sarah has her test next week so focus on independent driving. Remember to collect payment from James (£68 outstanding).";

function DemoWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}

/* ── OPTION A: Dark Slate (current) ── */
function OptionA() {
  return (
    <div className="mx-4 relative overflow-hidden">
      <div className="relative rounded-[20px] overflow-hidden shadow-xl shadow-slate-500/15 ring-1 ring-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-10 -translate-x-6" />
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-lift/20 backdrop-blur-sm flex items-center justify-center">
                <CloudSun className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Good morning</p>
                <h3 className="text-base font-bold text-white">Your Daily Briefing</h3>
              </div>
            </div>
            <button className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-white/80" />
            </button>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 mb-3">
            <p className="text-[13px] leading-[1.65] text-white/90 font-medium">{DEMO_BRIEFING}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-3.5 rounded-full bg-white/15 text-white text-xs font-semibold gap-1.5 border-0">
              <Volume2 className="h-3.5 w-3.5" /> Listen
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3.5 rounded-full bg-white/15 text-white text-xs font-semibold gap-1.5 border-0">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── OPTION B: Frosted Glass / Translucent ── */
function OptionB() {
  return (
    <div className="mx-4 relative overflow-hidden">
      <div className="relative rounded-[20px] overflow-hidden bg-white/60 dark:bg-white/10 backdrop-blur-xl shadow-lg shadow-black/5 ring-1 ring-black/5 dark:ring-white/10">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Daily Briefing</p>
                <h3 className="text-base font-bold text-foreground">Here's your day</h3>
              </div>
            </div>
            <button className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-[13px] leading-[1.65] text-muted-foreground mb-3">{DEMO_BRIEFING}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 px-3.5 rounded-full text-xs font-semibold gap-1.5">
              <Volume2 className="h-3.5 w-3.5" /> Listen
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3.5 rounded-full text-xs font-semibold gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── OPTION C: Teal/Emerald Gradient ── */
function OptionC() {
  return (
    <div className="mx-4 relative overflow-hidden">
      <div className="relative rounded-[20px] overflow-hidden shadow-xl shadow-emerald-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-lift/20 flex items-center justify-center">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider">Good morning</p>
                <h3 className="text-base font-bold text-white">Daily Briefing</h3>
              </div>
            </div>
            <button className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-white/80" />
            </button>
          </div>
          <div className="bg-black/15 backdrop-blur-sm rounded-2xl p-3.5 mb-3">
            <p className="text-[13px] leading-[1.65] text-white/90 font-medium">{DEMO_BRIEFING}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-3.5 rounded-full bg-white/20 text-white text-xs font-semibold gap-1.5 border-0">
              <Volume2 className="h-3.5 w-3.5" /> Listen
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3.5 rounded-full bg-white/20 text-white text-xs font-semibold gap-1.5 border-0">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── OPTION D: Minimal Card with accent bar ── */
function OptionD() {
  return (
    <div className="mx-4 relative overflow-hidden">
      <div className="relative rounded-[20px] overflow-hidden bg-card shadow-md ring-1 ring-border">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-l-[20px]" />
        <div className="p-5 pl-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <h3 className="text-sm font-bold text-foreground">Morning Briefing</h3>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-[13px] leading-[1.65] text-muted-foreground mb-3">{DEMO_BRIEFING}</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">AI-generated • Updated just now</span>
            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-1 text-muted-foreground">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── OPTION E: Vibrant Purple/Indigo ── */
function OptionE() {
  return (
    <div className="mx-4 relative overflow-hidden">
      <div className="relative rounded-[20px] overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-4" />
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white/60 uppercase tracking-wider">AI Briefing</p>
                <h3 className="text-base font-bold text-white">Your Day at a Glance</h3>
              </div>
            </div>
            <button className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-white/80" />
            </button>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 mb-3">
            <p className="text-[13px] leading-[1.65] text-white/90 font-medium">{DEMO_BRIEFING}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-3.5 rounded-full bg-white/15 text-white text-xs font-semibold gap-1.5 border-0">
              <Volume2 className="h-3.5 w-3.5" /> Listen
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3.5 rounded-full bg-white/15 text-white text-xs font-semibold gap-1.5 border-0">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── OPTION F: Warm neutral with golden accent ── */
function OptionF() {
  return (
    <div className="mx-4 relative overflow-hidden">
      <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-900 dark:to-stone-950 shadow-lg ring-1 ring-stone-200/60 dark:ring-stone-700/40">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-400/30">
                <Sun className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold">Good morning</p>
                <h3 className="text-base font-bold text-foreground">Daily Briefing</h3>
              </div>
            </div>
            <button className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="bg-white/80 dark:bg-black/20 rounded-2xl p-3.5 mb-3 ring-1 ring-stone-200/50 dark:ring-stone-700/30">
            <p className="text-[13px] leading-[1.65] text-foreground/80">{DEMO_BRIEFING}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 px-3.5 rounded-full text-xs font-semibold gap-1.5 border-stone-300 dark:border-stone-600">
              <Volume2 className="h-3.5 w-3.5" /> Listen
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3.5 rounded-full text-xs font-semibold gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BriefingDemo() {
  return (
    <div className="min-h-screen bg-muted/30 py-8 pb-24">
      <div className="max-w-md mx-auto">
        <div className="px-4 mb-8">
          <h1 className="text-2xl font-bold text-foreground">Briefing Designs</h1>
          <p className="text-sm text-muted-foreground mt-1">Pick your favourite style</p>
        </div>

        <DemoWrapper label="A — Dark Slate">
          <OptionA />
        </DemoWrapper>

        <DemoWrapper label="B — Frosted Glass">
          <OptionB />
        </DemoWrapper>

        <DemoWrapper label="C — Teal / Emerald">
          <OptionC />
        </DemoWrapper>

        <DemoWrapper label="D — Minimal Accent Bar">
          <OptionD />
        </DemoWrapper>

        <DemoWrapper label="E — Vibrant Indigo">
          <OptionE />
        </DemoWrapper>

        <DemoWrapper label="F — Warm Neutral + Gold">
          <OptionF />
        </DemoWrapper>
      </div>
    </div>
  );
}
