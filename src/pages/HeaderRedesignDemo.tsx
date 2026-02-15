import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Settings, Plus, PoundSterling, Bell, Search,
  Moon, Sun, ChevronLeft, Menu, MoreHorizontal, Wallet,
  Clock, Navigation, Timer, BookOpen, Target, MapPin,
  Car, CheckCircle, ChevronRight, Calendar, MessageSquare, Briefcase,
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

// ══════════════════════════════════════════════════════
// CONCEPT A: Frosted Glass + Navy Accent
// Clean frosted bar with navy logo area and green add button
// ══════════════════════════════════════════════════════
function ConceptA({ showBack = false }: { showBack?: boolean }) {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {showBack ? (
              <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            ) : (
              <img src={edLogo} alt="Logo" className="h-7 w-auto" />
            )}
            <span className="text-base font-semibold text-foreground">Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-sm transition-colors">
              <Plus className="h-5 w-5 text-white" />
            </button>
            <button className="relative h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-[18px] w-[18px] text-foreground" />
              {mock.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                  {mock.unread}
                </span>
              )}
            </button>
            <button className="h-9 px-3 rounded-full bg-primary flex items-center gap-1.5 transition-colors hover:bg-primary/90">
              <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground">Pay</span>
            </button>
            <button className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <Settings className="h-[18px] w-[18px] text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT B: Full Navy Bar
// Solid dark navy header like a native app status bar
// ══════════════════════════════════════════════════════
function ConceptB({ showBack = false }: { showBack?: boolean }) {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            {showBack ? (
              <button className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center">
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <img src={edLogo} alt="Logo" className="h-7 w-auto brightness-0 invert" />
            )}
            <span className="text-base font-semibold">Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-sm transition-colors">
              <Plus className="h-5 w-5 text-white" />
            </button>
            <button className="relative h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
              <Bell className="h-[18px] w-[18px]" />
              {mock.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                  {mock.unread}
                </span>
              )}
            </button>
            <button className="h-9 px-3 rounded-full bg-white/20 flex items-center gap-1.5 hover:bg-white/30 transition-colors">
              <PoundSterling className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Pay</span>
            </button>
            <button className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT C: Gradient Navy with Avatar
// Navy gradient header with user avatar and pill buttons
// ══════════════════════════════════════════════════════
function ConceptC({ showBack = false }: { showBack?: boolean }) {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/[0.03]" />
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center">
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <Avatar className="h-9 w-9 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                  {mock.initials}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-sm font-semibold leading-tight">Hi, {mock.name} 👋</p>
              <p className="text-[10px] text-white/60">Ready to teach?</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-md transition-colors">
              <Plus className="h-5 w-5 text-white" />
            </button>
            <button className="relative h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
              <Bell className="h-[18px] w-[18px]" />
              {mock.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {mock.unread}
                </span>
              )}
            </button>
            <button className="h-9 px-3 rounded-full bg-white/90 flex items-center gap-1.5 hover:bg-white transition-colors">
              <PoundSterling className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Pay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT D: iOS Native Style
// Minimal iOS-style large title with subtle separator
// ══════════════════════════════════════════════════════
function ConceptD({ showBack = false }: { showBack?: boolean }) {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-[#f2f2f7] dark:bg-background">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            {showBack && (
              <button className="text-primary flex items-center gap-0.5 -ml-1">
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Back</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-sm transition-colors">
              <Plus className="h-5 w-5 text-white" />
            </button>
            <button className="relative h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-[18px] w-[18px] text-foreground" />
              {mock.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                  {mock.unread}
                </span>
              )}
            </button>
            <button className="h-9 px-3 rounded-full bg-primary flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
              <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground">Pay</span>
            </button>
          </div>
        </div>
        <div className="px-4 pb-2">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="h-px bg-border/40" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT E: Compact Pill Header
// Ultra-compact with all actions in rounded pills
// ══════════════════════════════════════════════════════
function ConceptE({ showBack = false }: { showBack?: boolean }) {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            {showBack ? (
              <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-primary/10 rounded-full pl-1 pr-3 py-1">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                    {mock.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground">{mock.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-sm transition-colors">
              <Plus className="h-4.5 w-4.5 text-white" />
            </button>
            <button className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-4 w-4 text-foreground" />
              {mock.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                  {mock.unread}
                </span>
              )}
            </button>
            <button className="h-8 px-2.5 rounded-full bg-primary flex items-center gap-1 hover:bg-primary/90 transition-colors">
              <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="text-[11px] font-semibold text-primary-foreground">Pay</span>
            </button>
            <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT F: Split Two-Tone
// Navy top strip + frosted glass action bar
// ══════════════════════════════════════════════════════
function ConceptF({ showBack = false }: { showBack?: boolean }) {
  return (
    <div className="sticky top-0 z-50">
      {/* Navy strip with logo/greeting */}
      <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <button className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <img src={edLogo} alt="Logo" className="h-6 w-auto brightness-0 invert" />
          )}
          <span className="text-sm font-medium text-white/80">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
      </div>
      {/* Glass action strip */}
      <div className="bg-background/90 backdrop-blur-lg border-b border-border/30 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Quick Actions</span>
        <div className="flex items-center gap-1.5">
          <button className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-sm transition-colors">
            <Plus className="h-4 w-4 text-white" />
          </button>
          <button className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Bell className="h-4 w-4 text-foreground" />
            {mock.unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                {mock.unread}
              </span>
            )}
          </button>
          <button className="h-8 px-2.5 rounded-full bg-primary flex items-center gap-1 hover:bg-primary/90 transition-colors">
            <PoundSterling className="h-3.5 w-3.5 text-primary-foreground" />
            <span className="text-[11px] font-semibold text-primary-foreground">Pay</span>
          </button>
          <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Settings className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Demo page wrapper
// ══════════════════════════════════════════════════════
const concepts = [
  { name: "A: Frosted Glass", desc: "Clean frosted bar with muted icon buttons", component: ConceptA },
  { name: "B: Full Navy", desc: "Solid dark navy bar, native app feel", component: ConceptB },
  { name: "C: Gradient + Avatar", desc: "Navy gradient with greeting & avatar", component: ConceptC },
  { name: "D: iOS Large Title", desc: "iOS-native large title with minimal top bar", component: ConceptD },
  { name: "E: Compact Pill", desc: "Ultra-compact with avatar pill identifier", component: ConceptE },
  { name: "F: Split Two-Tone", desc: "Navy strip on top + frosted action bar below", component: ConceptF },
];

export default function HeaderRedesignDemo() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-background">
      {/* Page title */}
      <div className="bg-primary text-primary-foreground px-4 py-4">
        <h1 className="text-lg font-bold">Header Redesign Concepts</h1>
        <p className="text-xs text-primary-foreground/60 mt-0.5">Tap a concept below to preview</p>
      </div>

      {/* Concept selector */}
      <div className="px-3 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {concepts.map((c, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`px-3 py-2 rounded-xl text-left transition-all ${
                selected === i
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              <p className="text-xs font-semibold">{c.name}</p>
              <p className={`text-[10px] mt-0.5 ${selected === i ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {c.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div className="px-3 pb-6 space-y-4">
        {/* Normal view */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Home / Dashboard View
          </p>
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
            {(() => {
              const Comp = concepts[selected].component;
              return <Comp showBack={false} />;
            })()}
            <FakeHomepageContent />
          </div>
        </div>

        {/* Back button view */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Sub-Page View (with back button)
          </p>
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
            {(() => {
              const Comp = concepts[selected].component;
              return <Comp showBack={true} />;
            })()}
            <FakeSubpageContent />
          </div>
        </div>
      </div>
    </div>
  );
}
