
import { useState } from "react";
import { format } from "date-fns";
import { Bell, Settings, PoundSterling, Wifi, WifiOff, MoreHorizontal } from "lucide-react";

const firstName = "Sarah";
const date = format(new Date(), "EEEE d MMMM");
const greeting = (() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return `Good Morning`;
  if (h >= 12 && h < 17) return `Good Afternoon`;
  if (h >= 17 && h < 21) return `Good Evening`;
  return `Hello`;
})();

function Avatar({ size = "w-9 h-9", textSize = "text-xs", variant = "light" }: { size?: string; textSize?: string; variant?: "light" | "dark" | "accent" }) {
  const styles = {
    light: "bg-primary-foreground/20 border-2 border-primary-foreground/30 text-primary-foreground",
    dark: "bg-muted border-2 border-border text-foreground",
    accent: "bg-emerald-500 border-0 text-white",
  };
  return (
    <div className={`${size} rounded-full flex items-center justify-center shrink-0 ${styles[variant]}`}>
      <span className={`font-bold ${textSize}`}>SJ</span>
    </div>
  );
}

function IconBtn({ children, badge, variant = "light" }: { children: React.ReactNode; badge?: number; variant?: "light" | "dark" }) {
  return (
    <button className={`relative h-8 w-8 rounded-full flex items-center justify-center ${variant === "light" ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
      {children}
      {badge && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function PayBtn({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <button className={`h-8 px-3 rounded-full flex items-center gap-1.5 ${variant === "light" ? "bg-primary-foreground/90" : "bg-primary"}`}>
      <PoundSterling className={`h-3.5 w-3.5 ${variant === "light" ? "text-primary" : "text-primary-foreground"}`} />
      <span className={`text-xs font-semibold ${variant === "light" ? "text-primary" : "text-primary-foreground"}`}>Pay</span>
    </button>
  );
}

function SyncIcon() {
  return <span className="text-[10px] text-emerald-400">●</span>;
}

function ProgressRing({ completed, total, color = "#34D399" }: { completed: number; total: number; color?: string }) {
  const r = 24, stroke = 4, c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(completed / (total || 1), 1));
  return (
    <div className="relative w-[56px] h-[56px] shrink-0">
      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border" opacity={0.3} />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-foreground leading-none">{completed}</span>
        <span className="text-[8px] text-muted-foreground mt-0.5">of {total}</span>
      </div>
    </div>
  );
}

function StatsCard() {
  return (
    <div className="bg-card rounded-2xl p-3.5 flex items-center justify-between border border-border/50" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">TODAY</p>
        <p className="text-[17px] font-semibold text-foreground mt-0.5 leading-snug">Keep it moving!</p>
        <p className="text-[13px] text-muted-foreground mt-0.5">3 lessons today</p>
      </div>
      <ProgressRing completed={2} total={3} />
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

// ─── 2A: Compact Bar + Greeting Below ───
function Design2A() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar size="w-8 h-8" textSize="text-[10px]" />
          <SyncIcon />
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <PayBtn />
          <IconBtn><Settings className="h-4 w-4" /></IconBtn>
        </div>
      </div>
      <div className="bg-background px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-foreground">{greeting}, {firstName}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
        <div className="mt-3"><StatsCard /></div>
      </div>
    </div>
  );
}

// ─── 2B: Greeting in Bar + Stats Below ───
function Design2B() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size="w-9 h-9" textSize="text-[11px]" />
          <div>
            <p className="text-sm font-semibold leading-tight">{greeting}, {firstName}</p>
            <p className="text-[11px] text-primary-foreground/50">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <PayBtn />
          <IconBtn><Settings className="h-4 w-4" /></IconBtn>
        </div>
      </div>
      <div className="bg-background px-4 pt-3 pb-3">
        <StatsCard />
      </div>
    </div>
  );
}

// ─── 2C: Two-Row Header ───
function Design2C() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar size="w-9 h-9" textSize="text-[11px]" />
          <div>
            <p className="text-[15px] font-semibold leading-tight">{greeting}, {firstName}</p>
            <p className="text-[11px] text-primary-foreground/50">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <SyncIcon />
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <IconBtn><Settings className="h-4 w-4" /></IconBtn>
        </div>
      </div>
      <div className="px-4 pt-2 pb-3 flex items-center gap-2">
        <PayBtn />
        <div className="flex-1 flex gap-2">
          {[{ l: "Today", v: "2/3" }, { l: "Week", v: "8/12" }, { l: "Month", v: "24/40" }].map(s => (
            <div key={s.l} className="flex-1 bg-primary-foreground/10 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[9px] text-primary-foreground/40 uppercase">{s.l}</p>
              <p className="text-sm font-bold">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2D: Greeting Left, Actions Right, Full-Width Stats ───
function Design2D() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar size="w-10 h-10" textSize="text-xs" />
            <div>
              <h1 className="text-base font-bold leading-tight">{greeting}</h1>
              <p className="text-lg font-bold leading-tight">{firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <SyncIcon />
            <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
            <PayBtn />
            <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <p className="text-[11px] text-primary-foreground/40 mt-1.5">{date}</p>
      </div>
      <div className="bg-background px-4 -mt-0.5">
        <div className="bg-primary rounded-2xl px-4 py-3 text-primary-foreground">
          <div className="flex justify-between items-center">
            {[{ l: "Today", v: 2, t: 3 }, { l: "This Week", v: 8, t: 12 }, { l: "Month", v: 24, t: 40 }].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-[9px] text-primary-foreground/40 uppercase tracking-wide">{s.l}</p>
                <p className="text-xl font-bold mt-0.5">{s.v}<span className="text-primary-foreground/30 text-sm font-normal">/{s.t}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2E: Ultra Minimal Bar + Card Below ───
function Design2E() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{greeting}, {firstName}</p>
        <div className="flex items-center gap-1">
          <SyncIcon />
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <PayBtn />
          <IconBtn><Settings className="h-4 w-4" /></IconBtn>
        </div>
      </div>
      <div className="bg-background px-4 pt-3 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <Avatar size="w-11 h-11" textSize="text-sm" variant="accent" />
          <div>
            <h1 className="text-lg font-bold text-foreground">{firstName} Johnson</h1>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
        <StatsCard />
      </div>
    </div>
  );
}

// ─── 2F: Pill Actions in Greeting Area ───
function Design2F() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar size="w-11 h-11" textSize="text-sm" />
            <div>
              <h1 className="text-lg font-bold">{greeting},</h1>
              <h1 className="text-lg font-bold -mt-0.5">{firstName} 👋</h1>
              <p className="text-[11px] text-primary-foreground/40 mt-0.5">{date}</p>
            </div>
          </div>
          <IconBtn><MoreHorizontal className="h-4 w-4" /></IconBtn>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center gap-1.5 text-primary-foreground text-xs font-medium">
            <Bell className="h-3.5 w-3.5" /> Notifications <span className="bg-destructive text-destructive-foreground text-[9px] px-1.5 rounded-full font-bold">3</span>
          </button>
          <PayBtn />
        </div>
      </div>
      <div className="bg-background px-4 pt-3 pb-3 rounded-t-3xl">
        <StatsCard />
      </div>
    </div>
  );
}

// ─── 2G: Colored Stats Row in Bar ───
function Design2G() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar size="w-8 h-8" textSize="text-[10px]" />
            <p className="text-sm font-semibold">{greeting}, {firstName}</p>
          </div>
          <div className="flex items-center gap-1">
            <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
            <PayBtn />
            <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[10px] text-primary-foreground/40 mb-2">{date}</p>
          <div className="flex gap-2">
            {[
              { l: "Today", v: 2, t: 3, bg: "bg-emerald-500/20", ring: "ring-emerald-400/30" },
              { l: "Week", v: 8, t: 12, bg: "bg-blue-500/20", ring: "ring-blue-400/30" },
              { l: "Month", v: 24, t: 40, bg: "bg-purple-500/20", ring: "ring-purple-400/30" },
            ].map(s => (
              <div key={s.l} className={`flex-1 ${s.bg} ring-1 ${s.ring} rounded-xl px-2.5 py-2 text-center`}>
                <p className="text-[9px] text-primary-foreground/50 uppercase">{s.l}</p>
                <p className="text-lg font-bold">{s.v}<span className="text-primary-foreground/30 text-xs">/{s.t}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2H: Side-by-Side Greeting + Ring ───
function Design2H() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
        <SyncIcon />
        <div className="flex items-center gap-1.5">
          <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
          <PayBtn />
          <IconBtn><Settings className="h-4 w-4" /></IconBtn>
        </div>
      </div>
      <div className="bg-background px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar size="w-12 h-12" textSize="text-sm" variant="accent" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{greeting},</h1>
              <h1 className="text-xl font-bold text-foreground -mt-0.5">{firstName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
            </div>
          </div>
          <ProgressRing completed={2} total={3} />
        </div>
        <div className="flex gap-2 mt-3">
          {[{ l: "Week", v: "8/12" }, { l: "Month", v: "24/40" }].map(s => (
            <div key={s.l} className="flex-1 bg-muted rounded-xl px-3 py-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">{s.l}</p>
              <p className="text-base font-bold text-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2I: Dark Elevated Bar ───
function Design2I() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground">
        <div className="px-4 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar size="w-10 h-10" textSize="text-xs" />
            <div>
              <h1 className="text-[15px] font-bold leading-tight">{greeting}, {firstName}</h1>
              <p className="text-[11px] text-primary-foreground/40">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
            <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <div className="px-4 pt-3 pb-4">
          <div className="bg-primary-foreground/10 backdrop-blur rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {[{ l: "Today", v: 2, t: 3 }, { l: "Week", v: 8, t: 12 }, { l: "Month", v: 24, t: 40 }].map((s, i) => (
                <div key={s.l} className="flex items-center gap-2">
                  {i > 0 && <div className="w-px h-6 bg-primary-foreground/15" />}
                  <div className={i > 0 ? "pl-2" : ""}>
                    <p className="text-[9px] text-primary-foreground/40 uppercase">{s.l}</p>
                    <p className="text-lg font-bold leading-tight">{s.v}<span className="text-primary-foreground/30 text-xs">/{s.t}</span></p>
                  </div>
                </div>
              ))}
            </div>
            <PayBtn />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2J: Floating Card Overlap ───
function Design2J() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground px-4 pt-3 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar size="w-9 h-9" textSize="text-[11px]" />
            <div>
              <p className="text-sm font-semibold leading-tight">{greeting}, {firstName}</p>
              <p className="text-[11px] text-primary-foreground/50">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <SyncIcon />
            <IconBtn badge={3}><Bell className="h-4 w-4" /></IconBtn>
            <PayBtn />
            <IconBtn><Settings className="h-4 w-4" /></IconBtn>
          </div>
        </div>
      </div>
      <div className="px-4 -mt-8 relative z-10">
        <StatsCard />
      </div>
    </div>
  );
}

const designs = [
  { comp: Design2A, title: "2A — Compact Bar + Greeting Below", desc: "Thin primary bar with avatar & actions, greeting + stats on white below" },
  { comp: Design2B, title: "2B — Greeting in Bar", desc: "Avatar + greeting inside the primary bar, stats card directly below" },
  { comp: Design2C, title: "2C — Two-Row Header", desc: "Greeting row + inline stat pills row, all in primary color" },
  { comp: Design2D, title: "2D — Bold Name + Floating Stats", desc: "Large two-line name, date below, dark stats banner" },
  { comp: Design2E, title: "2E — Ultra Minimal Bar", desc: "Tiny text-only greeting bar, full profile + stats on white" },
  { comp: Design2F, title: "2F — Pill Actions", desc: "Big greeting with wave emoji, notification + pay as pill buttons, rounded transition to white" },
  { comp: Design2G, title: "2G — Colored Stats Row", desc: "Compact bar with color-coded stat cards (green/blue/purple)" },
  { comp: Design2H, title: "2H — Side-by-Side Ring", desc: "Minimal bar, large greeting beside progress ring on white, week/month below" },
  { comp: Design2I, title: "2I — Dark Elevated Panel", desc: "All-in-primary with frosted stats panel containing dividers + pay button" },
  { comp: Design2J, title: "2J — Floating Card Overlap", desc: "Primary bar with extra padding, stats card overlaps into white area below" },
];

export default function HeaderHeroDemo() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold text-foreground">Header Redesigns — No Hero</h1>
          <p className="text-sm text-muted-foreground mt-1">Based on Design 2 style — pick your favourite</p>
        </div>
        <div className="space-y-6">
          {designs.map(({ comp: Comp, title, desc }, i) => (
            <div key={i} className="overflow-hidden border border-border rounded-xl">
              <DesignLabel num={i + 1} title={title} desc={desc} />
              <Comp />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
