import { useState } from "react";
import {
  ArrowLeft, Settings, Plus, PoundSterling, Bell, Search,
  ChevronLeft, Menu, MoreHorizontal,
  Clock, Navigation, Timer, BookOpen, Target,
  CheckCircle, ChevronRight, Calendar, MessageSquare, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import edLogo from "@/assets/ed-black-white-logo.png";

const mock = {
  name: "Sarah",
  initials: "SJ",
  unread: 3,
  nextLesson: { pupil: "James W.", time: "10:30", postcode: "LS1 4AP", minutesUntil: 25, duration: "1h" },
  lessons: 5,
  earnings: 175,
  weeklyProgress: 72,
  timeline: [
    { time: "09:00", pupil: "Alice B.", postcode: "LS2 3AA", done: true },
    { time: "10:30", pupil: "James W.", postcode: "LS1 4AP", done: false, isNext: true },
    { time: "12:00", pupil: "Maria G.", postcode: "LS6 2NB", done: false },
    { time: "14:00", pupil: "Tom S.", postcode: "LS7 1RR", done: false },
  ],
  pendingJobs: 2,
};

// ════════════════════════════════════════════════════════════
// CONCEPT 1: Current Style Refined
// Frosted glass, subtle border, same layout but polished
// ════════════════════════════════════════════════════════════
function Header1() {
  return (
    <div className="bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={edLogo} alt="Logo" className="h-7 w-auto" />
          <span className="text-base font-semibold text-foreground">Dashboard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="relative h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{mock.unread}</span>
          </button>
          <button className="h-8 px-3 rounded-full bg-primary flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
            <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
            <span className="text-xs font-semibold text-primary-foreground">Pay</span>
          </button>
          <button className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <Settings className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONCEPT 2: Full Navy Bar
// Solid primary bar — native app status-bar feel
// ════════════════════════════════════════════════════════════
function Header2() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img src={edLogo} alt="Logo" className="h-7 w-auto brightness-0 invert" />
          <span className="text-base font-semibold">Dashboard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="relative h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{mock.unread}</span>
          </button>
          <button className="h-8 px-3 rounded-full bg-primary-foreground/20 flex items-center gap-1.5 hover:bg-primary-foreground/30 transition-colors">
            <PoundSterling className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Pay</span>
          </button>
          <button className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONCEPT 3: Gradient Navy + Avatar Greeting
// Blue gradient with avatar, greeting text, decorative circles
// ════════════════════════════════════════════════════════════
function Header3() {
  return (
    <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-primary-foreground relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-primary-foreground/5" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary-foreground/[0.03]" />
      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
              {mock.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight">Hi, {mock.name} 👋</p>
            <p className="text-[10px] text-primary-foreground/60">Ready to teach?</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="relative h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{mock.unread}</span>
          </button>
          <button className="h-8 px-3 rounded-full bg-primary-foreground/90 flex items-center gap-1.5 hover:bg-primary-foreground transition-colors">
            <PoundSterling className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Pay</span>
          </button>
          <button className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONCEPT 4: iOS Large Title
// Native iOS style — large bold title, minimal top actions
// ════════════════════════════════════════════════════════════
function Header4() {
  return (
    <div className="bg-[hsl(240,5%,96%)] dark:bg-background">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <img src={edLogo} alt="Logo" className="h-6 w-auto" />
        <div className="flex items-center gap-1.5">
          <button className="relative h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{mock.unread}</span>
          </button>
          <button className="h-8 px-3 rounded-full bg-primary flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
            <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
            <span className="text-xs font-semibold text-primary-foreground">Pay</span>
          </button>
          <button className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <Settings className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>
      <div className="px-4 pb-2">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>
      <div className="h-px bg-border/40" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONCEPT 5: Compact Pill + Avatar
// Ultra-compact with avatar-in-pill left, tight action icons
// ════════════════════════════════════════════════════════════
function Header5() {
  return (
    <div className="bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 bg-primary/10 rounded-full pl-1 pr-3 py-1">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
              {mock.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-foreground">{mock.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="relative h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{mock.unread}</span>
          </button>
          <button className="h-8 px-2.5 rounded-full bg-primary flex items-center gap-1 hover:bg-primary/90 transition-colors">
            <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
            <span className="text-[11px] font-semibold text-primary-foreground">Pay</span>
          </button>
          <button className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <MoreHorizontal className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONCEPT 6: Split Two-Tone
// Navy branding strip + frosted action bar below
// ════════════════════════════════════════════════════════════
function Header6() {
  return (
    <div>
      <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={edLogo} alt="Logo" className="h-6 w-auto brightness-0 invert" />
          <span className="text-sm font-medium text-primary-foreground/80">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary-foreground/60">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            Online
          </span>
        </div>
      </div>
      <div className="bg-background/90 backdrop-blur-lg border-b border-border/30 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Quick Actions</span>
        <div className="flex items-center gap-1.5">
          <button className="relative h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{mock.unread}</span>
          </button>
          <button className="h-8 px-2.5 rounded-full bg-primary flex items-center gap-1 hover:bg-primary/90 transition-colors">
            <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
            <span className="text-[11px] font-semibold text-primary-foreground">Pay</span>
          </button>
          <button className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <Settings className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONCEPT 7: Gradient Bar + Inline Stats
// Navy gradient with mini stat chips (lessons, earnings)
// ════════════════════════════════════════════════════════════
function Header7() {
  return (
    <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-primary-foreground relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary-foreground/5" />
      <div className="relative px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <img src={edLogo} alt="Logo" className="h-6 w-auto brightness-0 invert" />
            <span className="text-sm font-semibold">Good morning, {mock.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="relative h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{mock.unread}</span>
            </button>
            <button className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-foreground/15 text-[11px] font-medium">
            <BookOpen className="h-3 w-3" /> {mock.lessons} lessons
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-foreground/15 text-[11px] font-medium">
            <PoundSterling className="h-3 w-3" /> £{mock.earnings}
          </span>
          <span className="ml-auto">
            <button className="h-7 px-3 rounded-full bg-primary-foreground/90 flex items-center gap-1 hover:bg-primary-foreground transition-colors">
              <PoundSterling className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold text-primary">Pay</span>
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONCEPT 8: Minimal Transparent + Search
// Invisible header, search bar prominent, action icons right
// ════════════════════════════════════════════════════════════
function Header8() {
  return (
    <div className="bg-[hsl(240,5%,96%)] dark:bg-background">
      <div className="flex items-center gap-2 px-4 py-3">
        <img src={edLogo} alt="Logo" className="h-7 w-auto shrink-0" />
        <div className="flex-1 flex items-center gap-2 bg-card rounded-full px-3 py-1.5 border border-border/50 shadow-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Search pupils, lessons…</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="relative h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{mock.unread}</span>
          </button>
          <button className="h-8 px-2.5 rounded-full bg-primary flex items-center gap-1 hover:bg-primary/90 transition-colors">
            <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
            <span className="text-[11px] font-semibold text-primary-foreground">Pay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Fake homepage content (mimics real instructor home tiles)
// ════════════════════════════════════════════════════════════
function FakeHomepageContent() {
  return (
    <div className="bg-[hsl(240,5%,96%)] dark:bg-background">
      {/* Next Up Tile */}
      <div className="px-3 pt-3">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-primary-foreground relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-primary-foreground/10" />
            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-foreground/90 text-primary text-xs font-extrabold tracking-wide shadow-sm">
                <Clock className="h-3 w-3" /> NEXT UP
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(var(--warning))]/30 text-primary-foreground text-[11px] font-bold animate-pulse">
                <Timer className="h-3 w-3" /> in {mock.nextLesson.minutesUntil} min
              </span>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">JW</div>
              <div>
                <p className="font-bold text-foreground text-sm">{mock.nextLesson.pupil}</p>
                <p className="text-xs text-muted-foreground">{mock.nextLesson.postcode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/5 border border-primary/10 text-xs font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" /> Today · {mock.nextLesson.time}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 text-[11px] font-semibold text-[hsl(var(--success))]">
                {mock.nextLesson.duration} lesson
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Button size="sm" className="flex-1 rounded-xl gap-1 h-8 text-xs">
                <Navigation className="h-3.5 w-3.5" /> Navigate
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1 h-8 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> On Way
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Banners */}
      <div className="px-3 mt-2 space-y-1.5">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl px-4 py-3 text-primary-foreground relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-primary-foreground/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Briefcase className="h-5 w-5" />
              <div><span className="font-semibold text-sm">Job Offers</span><p className="text-primary-foreground/70 text-[10px]">{mock.pendingJobs} pending</p></div>
            </div>
            <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-primary-foreground/90 text-primary text-xs font-bold flex items-center justify-center">{mock.pendingJobs}</span>
          </div>
        </div>
      </div>

      {/* Your Day */}
      <div className="px-3 mt-3">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 px-4 py-2.5 flex items-center justify-between text-primary-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Your Day</span>
            <ChevronRight className="h-4 w-4 text-primary-foreground/60" />
          </div>
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5">
                <BookOpen className="h-4 w-4 text-primary" />
                <div><p className="text-sm font-bold text-foreground">{mock.lessons}</p><p className="text-[10px] text-muted-foreground">Lessons</p></div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[hsl(var(--success))]/5">
                <PoundSterling className="h-4 w-4 text-[hsl(var(--success))]" />
                <div><p className="text-sm font-bold text-foreground">£{mock.earnings}</p><p className="text-[10px] text-muted-foreground">Earn</p></div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-violet-500/5">
                <Target className="h-4 w-4 text-violet-500" />
                <div><p className="text-sm font-bold text-foreground">{mock.weeklyProgress}%</p><p className="text-[10px] text-muted-foreground">Goal</p></div>
              </div>
            </div>
            <div className="space-y-0">
              {mock.timeline.slice(0, 3).map((item, i) => (
                <div key={i} className="flex gap-2.5 pb-2">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${item.done ? "bg-[hsl(var(--success))]" : item.isNext ? "bg-primary ring-3 ring-primary/20" : "bg-muted"}`} />
                    {i < 2 && <div className="w-0.5 flex-1 bg-border mt-0.5" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    <p className={`text-sm font-medium ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.pupil}</p>
                  </div>
                  {item.isNext && <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full self-start mt-1">Next</span>}
                  {item.done && <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))] mt-1.5 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 mt-3 pb-4">
        <div className="bg-card rounded-2xl shadow-sm p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Tomorrow</p>
            <p className="text-xs text-muted-foreground">4 lessons · 6hrs · £210</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Concepts list
// ════════════════════════════════════════════════════════════
const concepts = [
  { id: 1, name: "Frosted Refined", desc: "Clean glass bar, polished current style", component: Header1 },
  { id: 2, name: "Full Navy", desc: "Solid dark navy, native app feel", component: Header2 },
  { id: 3, name: "Gradient + Avatar", desc: "Navy gradient with greeting & avatar", component: Header3 },
  { id: 4, name: "iOS Large Title", desc: "iOS-native large title + minimal top bar", component: Header4 },
  { id: 5, name: "Compact Pill", desc: "Avatar pill identifier, ultra-compact", component: Header5 },
  { id: 6, name: "Split Two-Tone", desc: "Navy strip + frosted action bar below", component: Header6 },
  { id: 7, name: "Stats Gradient", desc: "Gradient with inline stat chips", component: Header7 },
  { id: 8, name: "Search Forward", desc: "Prominent search bar + minimal icons", component: Header8 },
];

// ════════════════════════════════════════════════════════════
// Demo page — mobile-only, phone-frame previews
// ════════════════════════════════════════════════════════════
export default function HeaderRedesignDemo() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="min-h-screen bg-[hsl(240,5%,96%)] dark:bg-background flex flex-col items-center">
      {/* Page title */}
      <div className="w-full max-w-[430px] bg-primary text-primary-foreground px-4 py-4">
        <h1 className="text-lg font-bold">Mobile Header Concepts</h1>
        <p className="text-xs text-primary-foreground/60 mt-0.5">8 designs · Tap to preview on phone frame</p>
      </div>

      {/* Concept selector — horizontal scroll */}
      <div className="w-full max-w-[430px] px-3 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {concepts.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              className={`px-3 py-2 rounded-xl text-left transition-all shrink-0 ${
                selected === i
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              <p className="text-xs font-semibold">{c.id}. {c.name}</p>
              <p className={`text-[10px] mt-0.5 ${selected === i ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {c.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Phone frame preview */}
      <div className="w-full max-w-[430px] px-3 pb-8">
        <div className="mx-auto" style={{ maxWidth: 390 }}>
          {/* Device frame */}
          <div className="rounded-[2.5rem] overflow-hidden border-[3px] border-foreground/20 shadow-2xl bg-card ring-1 ring-foreground/5">
            {/* Notch / dynamic island */}
            <div className="bg-foreground flex justify-center py-1.5">
              <div className="w-28 h-5 rounded-full bg-foreground" />
            </div>
            {/* Header */}
            {(() => {
              const Comp = concepts[selected].component;
              return <Comp />;
            })()}
            {/* Scrollable content */}
            <div className="max-h-[520px] overflow-y-auto">
              <FakeHomepageContent />
            </div>
            {/* Bottom nav mock */}
            <div className="bg-card border-t border-border/30 px-2 py-2 flex items-center justify-around">
              {["Home", "Schedule", "Pupils", "Map", "More"].map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <div className={`h-5 w-5 rounded-sm ${i === 0 ? "bg-primary" : "bg-muted/60"}`} />
                  <span className={`text-[9px] font-medium ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
