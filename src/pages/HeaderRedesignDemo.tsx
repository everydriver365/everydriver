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

// Realistic instructor mobile homepage content
function FakeHomepageContent() {
  return (
    <div className="bg-[#f2f2f7] dark:bg-background">
      {/* Next Up Tile */}
      <div className="px-3 pt-3">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-primary text-xs font-extrabold tracking-wide shadow-sm">
                <Clock className="h-3 w-3" /> NEXT UP
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400/30 text-white text-[11px] font-bold animate-pulse">
                <Timer className="h-3 w-3" /> in 25 min
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
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                {mock.nextLesson.duration} lesson
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Button size="sm" className="flex-1 rounded-xl gap-1 h-8 text-xs">
                <Navigation className="h-3.5 w-3.5" /> Navigate
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1 h-8 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> On Way
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Banners */}
      <div className="px-3 mt-2 space-y-1.5">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl px-4 py-3 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Briefcase className="h-5 w-5" />
              <div><span className="font-semibold text-sm">Job Offers</span><p className="text-white/70 text-[10px]">{mock.pendingJobs} pending</p></div>
            </div>
            <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-white/90 text-primary text-xs font-bold flex items-center justify-center">{mock.pendingJobs}</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl px-4 py-3 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-5 w-5" />
              <div><span className="font-semibold text-sm">Messages</span><p className="text-white/70 text-[10px]">{mock.unread} unread</p></div>
            </div>
            <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-rose-400 text-white text-xs font-bold flex items-center justify-center">{mock.unread}</span>
          </div>
        </div>
      </div>

      {/* Your Day */}
      <div className="px-3 mt-3">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 px-4 py-2.5 flex items-center justify-between text-white">
            <span className="text-xs font-bold uppercase tracking-wider">Your Day</span>
            <ChevronRight className="h-4 w-4 text-white/60" />
          </div>
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5">
                <BookOpen className="h-4 w-4 text-primary" />
                <div><p className="text-sm font-bold text-foreground">{mock.lessons}</p><p className="text-[10px] text-muted-foreground">Lessons</p></div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/5">
                <PoundSterling className="h-4 w-4 text-emerald-500" />
                <div><p className="text-sm font-bold text-foreground">£{mock.earnings}</p><p className="text-[10px] text-muted-foreground">Earn</p></div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-violet-500/5">
                <Target className="h-4 w-4 text-violet-500" />
                <div><p className="text-sm font-bold text-foreground">{mock.weeklyProgress}%</p><p className="text-[10px] text-muted-foreground">Goal</p></div>
              </div>
            </div>
            <div className="space-y-0">
              {mock.timeline.map((item, i) => (
                <div key={i} className="flex gap-2.5 pb-2">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-primary ring-3 ring-primary/20" : "bg-muted"}`} />
                    {i < mock.timeline.length - 1 && <div className="w-0.5 flex-1 bg-border mt-0.5" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    <p className={`text-sm font-medium ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.pupil}</p>
                  </div>
                  {item.isNext && <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full self-start mt-1">Next</span>}
                  {item.done && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-1.5 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plan ahead */}
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

function FakeSubpageContent() {
  return (
    <div className="bg-[#f2f2f7] dark:bg-background p-3 space-y-3">
      <div className="bg-card rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold text-foreground mb-2">Schedule</h3>
        <div className="space-y-2">
          {mock.timeline.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground w-10">{item.time}</span>
              <div className={`h-2 w-2 rounded-full ${item.done ? "bg-emerald-400" : "bg-primary"}`} />
              <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>{item.pupil}</span>
              <span className="text-xs text-muted-foreground ml-auto">{item.postcode}</span>
            </div>
          ))}
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

      {/* Preview area — constrained to mobile width */}
      <div className="flex flex-col items-center pb-6 space-y-6 px-3">
        {/* Normal view */}
        <div className="w-full max-w-[390px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Home / Dashboard View
          </p>
          <div className="rounded-[2rem] overflow-hidden border-2 border-foreground/20 shadow-xl bg-card ring-1 ring-black/5">
            {(() => {
              const Comp = concepts[selected].component;
              return <Comp showBack={false} />;
            })()}
            <div className="max-h-[500px] overflow-y-auto">
              <FakeHomepageContent />
            </div>
          </div>
        </div>

        {/* Back button view */}
        <div className="w-full max-w-[390px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Sub-Page View (with back button)
          </p>
          <div className="rounded-[2rem] overflow-hidden border-2 border-foreground/20 shadow-xl bg-card ring-1 ring-black/5">
            {(() => {
              const Comp = concepts[selected].component;
              return <Comp showBack={true} />;
            })()}
            <div className="max-h-[400px] overflow-y-auto">
              <FakeSubpageContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
