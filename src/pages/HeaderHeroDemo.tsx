
import { useState } from "react";
import { format } from "date-fns";
import { Bell, Settings, PoundSterling, ChevronLeft, Search, MoreHorizontal, Calendar, Sun, Moon, Menu, User, Zap } from "lucide-react";
import instructorHeroImg from "@/assets/hero-instructor.jpg";

const firstName = "Sarah";
const date = format(new Date(), "EEEE d MMMM");
const greeting = (() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return `Good Morning`;
  if (h >= 12 && h < 17) return `Good Afternoon`;
  if (h >= 17 && h < 21) return `Good Evening`;
  return `Hello`;
})();

function Avatar({ size = "w-10 h-10", textSize = "text-sm" }: { size?: string; textSize?: string }) {
  return (
    <div className={`${size} rounded-full bg-primary-foreground/20 border-2 border-primary-foreground/30 flex items-center justify-center shrink-0`}>
      <span className={`text-primary-foreground font-semibold ${textSize}`}>S</span>
    </div>
  );
}

function AvatarDark({ size = "w-10 h-10", textSize = "text-sm" }: { size?: string; textSize?: string }) {
  return (
    <div className={`${size} rounded-full bg-emerald-500 flex items-center justify-center shrink-0`}>
      <span className={`text-white font-bold ${textSize}`}>S</span>
    </div>
  );
}

function IconBtn({ children, badge }: { children: React.ReactNode; badge?: number }) {
  return (
    <button className="relative h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center text-primary-foreground">
      {children}
      {badge && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function PayBtn() {
  return (
    <button className="h-8 px-3 rounded-full bg-primary-foreground/90 flex items-center gap-1.5">
      <PoundSterling className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-semibold text-primary">Pay</span>
    </button>
  );
}

function StatsCard() {
  return (
    <div className="bg-white/95 dark:bg-card/90 backdrop-blur-xl rounded-2xl p-3.5 flex items-center justify-between" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">TODAY</p>
        <p className="text-[17px] font-semibold text-foreground mt-0.5 leading-snug">Keep it moving!</p>
        <p className="text-[13px] text-muted-foreground mt-0.5">3 lessons today</p>
      </div>
      <div className="relative w-[68px] h-[68px] shrink-0">
        <svg viewBox="0 0 68 68" className="w-full h-full -rotate-90">
          <circle cx="34" cy="34" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="5" opacity={0.4} />
          <circle cx="34" cy="34" r="28" fill="none" stroke="#34D399" strokeWidth="5" strokeLinecap="round" strokeDasharray={176} strokeDashoffset={60} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[17px] font-bold text-foreground leading-none">2</span>
          <span className="text-[9px] font-medium text-muted-foreground leading-tight mt-0.5">of 3</span>
        </div>
      </div>
    </div>
  );
}

function MiniStats() {
  return (
    <div className="flex gap-3">
      {[{ label: "Today", val: "2/3" }, { label: "Week", val: "8/12" }, { label: "Month", val: "24/40" }].map(s => (
        <div key={s.label} className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
          <p className="text-[10px] text-white/60 uppercase tracking-wide">{s.label}</p>
          <p className="text-lg font-bold text-white">{s.val}</p>
        </div>
      ))}
    </div>
  );
}

function DesignLabel({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="px-4 py-3 bg-muted/50 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{num}</span>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground mt-1 ml-8">{desc}</p>
    </div>
  );
}

// ─── DESIGN 1: Minimal Floating ───
function Design1() {
  return (
    <div className="relative h-[240px] overflow-hidden rounded-b-3xl">
      <img src={instructorHeroImg} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-5 pb-4">
        <div className="flex items-center justify-between">
          <Avatar />
          <div className="flex items-center gap-2">
            <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
            <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, {firstName}</h1>
          <p className="text-xs text-white/60 mt-0.5">{date}</p>
          <div className="mt-3"><StatsCard /></div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 2: Split Header + Hero ───
function Design2() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size="w-8 h-8" textSize="text-xs" />
          <span className="text-sm font-semibold">{firstName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <PayBtn />
          <IconBtn><Settings className="h-4 w-4" /></IconBtn>
        </div>
      </div>
      <div className="relative h-[160px] overflow-hidden">
        <img src={instructorHeroImg} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <h1 className="text-xl font-bold text-white">{greeting}, {firstName}</h1>
          <p className="text-xs text-white/60">{date}</p>
        </div>
      </div>
      <div className="px-4 -mt-6 relative z-10"><StatsCard /></div>
    </div>
  );
}

// ─── DESIGN 3: Compact Toolbar ───
function Design3() {
  return (
    <div className="relative h-[200px] overflow-hidden">
      <img src={instructorHeroImg} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-primary/40" />
      <div className="absolute inset-0 flex flex-col p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{greeting}</h1>
            <p className="text-xs text-white/60">{date}</p>
          </div>
          <div className="flex items-center gap-1">
            <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
            <PayBtn />
            <IconBtn><MoreHorizontal className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <div className="flex-1" />
        <MiniStats />
      </div>
    </div>
  );
}

// ─── DESIGN 4: Card-Based Clean ───
function Design4() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar />
            <div>
              <h1 className="text-lg font-bold">{greeting}</h1>
              <p className="text-xs text-primary-foreground/60">{date}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
            <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <div className="flex gap-2">
          {[{ label: "Today", n: "2/3" }, { label: "Week", n: "8/12" }, { label: "Month", n: "24/40" }].map(s => (
            <div key={s.label} className="flex-1 bg-primary-foreground/10 rounded-xl p-3 text-center">
              <p className="text-[10px] text-primary-foreground/50 uppercase">{s.label}</p>
              <p className="text-xl font-bold">{s.n}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 5: Left-Aligned Focus ───
function Design5() {
  return (
    <div className="relative h-[220px] overflow-hidden">
      <img src={instructorHeroImg} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        <div className="flex justify-end gap-1.5">
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <PayBtn />
          <IconBtn><Settings className="h-4 w-4" /></IconBtn>
        </div>
        <div className="flex items-end gap-3">
          <Avatar size="w-14 h-14" textSize="text-xl" />
          <div className="pb-0.5">
            <h1 className="text-2xl font-bold text-white leading-tight">{greeting},</h1>
            <h1 className="text-2xl font-bold text-white leading-tight">{firstName}</h1>
            <p className="text-xs text-white/50 mt-0.5">{date} · 2 of 3 done</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 6: Glassmorphism ───
function Design6() {
  return (
    <div className="relative h-[230px] overflow-hidden">
      <img src={instructorHeroImg} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md rounded-full pl-1 pr-3 py-1">
            <Avatar size="w-7 h-7" textSize="text-[11px]" />
            <span className="text-sm font-medium text-white">{firstName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
            <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <div>
          <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-xl font-bold text-white">{greeting}</h1>
                <p className="text-[11px] text-white/50">{date}</p>
              </div>
              <PayBtn />
            </div>
            <div className="flex gap-2 mt-2">
              {[{ l: "Today", v: "2/3" }, { l: "Week", v: "8/12" }, { l: "Month", v: "24/40" }].map(s => (
                <div key={s.l} className="flex-1 bg-white/10 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] text-white/50 uppercase">{s.l}</p>
                  <p className="text-sm font-bold text-white">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 7: Stacked Minimal ───
function Design7() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <IconBtn><Menu className="h-4 w-4" /></IconBtn>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <PayBtn />
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <Avatar size="w-12 h-12" textSize="text-base" />
          <div>
            <h1 className="text-xl font-bold">{greeting}, {firstName}</h1>
            <p className="text-xs text-primary-foreground/50">{date}</p>
          </div>
        </div>
        <div className="bg-primary-foreground/10 rounded-2xl p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[11px] text-primary-foreground/50 uppercase tracking-wide">Today's Progress</p>
              <p className="text-2xl font-bold mt-0.5">2<span className="text-primary-foreground/40">/3</span></p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-primary-foreground/50 uppercase tracking-wide">This Week</p>
              <p className="text-2xl font-bold mt-0.5">8<span className="text-primary-foreground/40">/12</span></p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-primary-foreground/50 uppercase tracking-wide">Month</p>
              <p className="text-2xl font-bold mt-0.5">24<span className="text-primary-foreground/40">/40</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 8: iOS Native Feel ───
function Design8() {
  return (
    <div>
      <div className="bg-background px-4 pt-3 pb-2 flex items-center justify-between">
        <AvatarDark size="w-9 h-9" textSize="text-xs" />
        <div className="flex items-center gap-2">
          <button className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">3</span>
          </button>
          <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="px-4 pb-4 bg-background">
        <h1 className="text-2xl font-bold text-foreground">{greeting},</h1>
        <h1 className="text-2xl font-bold text-foreground">{firstName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">{date}</p>
        <div className="mt-4 flex gap-2">
          {[{ l: "Today", v: 2, t: 3, c: "bg-emerald-500" }, { l: "Week", v: 8, t: 12, c: "bg-blue-500" }, { l: "Month", v: 24, t: 40, c: "bg-purple-500" }].map(s => (
            <div key={s.l} className="flex-1 bg-muted rounded-2xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">{s.l}</p>
              <p className="text-xl font-bold text-foreground mt-1">{s.v}<span className="text-muted-foreground font-normal text-sm">/{s.t}</span></p>
              <div className="h-1.5 bg-muted-foreground/10 rounded-full mt-2">
                <div className={`h-full ${s.c} rounded-full`} style={{ width: `${(s.v / s.t) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 9: Bold Gradient ───
function Design9() {
  return (
    <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white">
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">{greeting}, {firstName}</h1>
          <div className="flex items-center gap-1.5">
            <button className="relative h-8 w-8 rounded-full bg-white/15 flex items-center justify-center">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-orange-400 text-[9px] font-bold flex items-center justify-center">3</span>
            </button>
            <button className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center"><Settings className="h-4 w-4" /></button>
          </div>
        </div>
        <p className="text-xs text-white/50 -mt-3 mb-3">{date}</p>
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-black">2</p>
                <p className="text-[10px] text-white/50 uppercase">Done</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-black">1</p>
                <p className="text-[10px] text-white/50 uppercase">Left</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-black">3</p>
                <p className="text-[10px] text-white/50 uppercase">Total</p>
              </div>
            </div>
            <PayBtn />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 10: Centered Zen ───
function Design10() {
  return (
    <div className="relative h-[260px] overflow-hidden">
      <img src={instructorHeroImg} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/60" />
      <div className="absolute inset-0 flex flex-col p-4">
        <div className="flex justify-between">
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <div className="flex gap-1.5">
            <PayBtn />
            <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center -mt-2">
          <Avatar size="w-16 h-16" textSize="text-2xl" />
          <h1 className="text-2xl font-bold text-white mt-3">{greeting}, {firstName}</h1>
          <p className="text-xs text-white/50 mt-0.5">{date}</p>
        </div>
        <div className="flex gap-3 justify-center">
          {[{ l: "Today", v: "2/3" }, { l: "Week", v: "8/12" }, { l: "Month", v: "24/40" }].map(s => (
            <div key={s.l} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <p className="text-[9px] text-white/50 uppercase">{s.l}</p>
              <p className="text-base font-bold text-white">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const designs = [
  { comp: Design1, title: "Minimal Floating", desc: "Clean overlay — icons top-right, greeting bottom-left, stats card overlapping" },
  { comp: Design2, title: "Split Header + Hero", desc: "Separate solid nav bar above hero image — stats card bleeds below" },
  { comp: Design3, title: "Compact Toolbar", desc: "Greeting & actions on one line, inline stat pills at bottom" },
  { comp: Design4, title: "Card-Based Clean", desc: "No hero image — solid primary bg with inline stat cards" },
  { comp: Design5, title: "Left-Aligned Focus", desc: "Large avatar bottom-left, actions top-right, dramatic gradient" },
  { comp: Design6, title: "Glassmorphism", desc: "Frosted glass card over hero with name pill and embedded stats" },
  { comp: Design7, title: "Stacked Minimal", desc: "No image — clean primary bg, hamburger left, stats row below greeting" },
  { comp: Design8, title: "iOS Native Feel", desc: "Light/dark theme aware, no hero image, progress bars in stat cards" },
  { comp: Design9, title: "Bold Gradient", desc: "Rich emerald gradient, large stat numbers in glass panel" },
  { comp: Design10, title: "Centered Zen", desc: "Centered avatar + greeting over hero, bottom stat pills" },
];

export default function HeaderHeroDemo() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold text-foreground">Header / Hero Redesigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Pick your favourite — tap to select</p>
        </div>
        <div className="space-y-6">
          {designs.map(({ comp: Comp, title, desc }, i) => (
            <div key={i} className="overflow-hidden">
              <DesignLabel num={i + 1} title={title} desc={desc} />
              <Comp />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
