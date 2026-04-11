import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Users, Clock, ChevronRight, MessageSquare,
  CreditCard, MapPin, Bell, Star, Zap, Car, Plus, PoundSterling,
  Settings, Navigation, Phone, Gauge, Route, Sun,
  Briefcase, Target, Award, Send, Timer, Play,
  TrendingUp, BarChart3, Shield, Wallet, Heart, ArrowRight,
  CheckCircle2, AlertTriangle, Activity, Eye, Flame, Hash,
  FileText, CircleDot, BookOpen, Map, Smartphone, Camera
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const designList = [
  { id: "ios-tiles", label: "1 · iOS Tiles" },
  { id: "hero-gradient", label: "2 · Hero Gradient" },
  { id: "dark-cockpit", label: "3 · Dark Cockpit" },
  { id: "pastel-widgets", label: "4 · Pastel Widgets" },
  { id: "hero-photo", label: "5 · Hero Photo" },
  { id: "neon-glass", label: "6 · Neon Glass" },
  { id: "card-stack", label: "7 · Card Stack" },
  { id: "hero-split", label: "8 · Hero Split" },
  { id: "minimal-mono", label: "9 · Minimal Mono" },
  { id: "sport-dash", label: "10 · Sport Dash" },
];

// ─── Shared tile component ─────────────────────────────────
function Tile({ icon: Icon, label, value, color, badge, className, onClick }: {
  icon: any; label: string; value?: string; color: string; badge?: string; className?: string; onClick?: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "rounded-2xl p-4 flex flex-col gap-2 cursor-pointer transition-shadow hover:shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>
        )}
      </div>
      {value && <p className="text-lg font-bold leading-tight">{value}</p>}
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 1: iOS Tiles — Clean white tiles on grey bg
// ═══════════════════════════════════════════════════════════════
function IOSTilesDesign() {
  return (
    <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] min-h-[700px] p-4 space-y-4 rounded-2xl">
      {/* Greeting */}
      <div className="pt-2 px-1">
        <p className="text-sm text-muted-foreground">Good afternoon</p>
        <h1 className="text-2xl font-bold">Ken Davies 👋</h1>
      </div>

      {/* Next lesson card */}
      <div className="bg-[#142744] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium opacity-80">NEXT UP · 2:00 PM</span>
        </div>
        <h3 className="text-lg font-bold">Sarah Mitchell</h3>
        <p className="text-sm opacity-70 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" /> 14 Oak Lane, SE5 8NP
        </p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs">
            <Navigation className="w-3.5 h-3.5 mr-1" /> Navigate
          </Button>
          <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs">
            <Phone className="w-3.5 h-3.5 mr-1" /> Call
          </Button>
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs ml-auto">
            <Play className="w-3.5 h-3.5 mr-1" /> Start
          </Button>
        </div>
      </div>

      {/* 2x2 tile grid */}
      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Calendar} label="Today's Lessons" value="5" color="bg-blue-500/10 text-blue-600" className="bg-white dark:bg-[#2C2C2E]" />
        <Tile icon={PoundSterling} label="This Month" value="£2,340" color="bg-emerald-500/10 text-emerald-600" className="bg-white dark:bg-[#2C2C2E]" />
        <Tile icon={Users} label="Active Pupils" value="23" color="bg-orange-500/10 text-orange-600" className="bg-white dark:bg-[#2C2C2E]" />
        <Tile icon={MessageSquare} label="Messages" value="2 new" color="bg-purple-500/10 text-purple-600" badge="2" className="bg-white dark:bg-[#2C2C2E]" />
      </div>

      {/* Action row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: CreditCard, label: "Pay", color: "bg-emerald-500 text-white" },
          { icon: Plus, label: "Book", color: "bg-blue-500 text-white" },
          { icon: Bell, label: "Alerts", color: "bg-amber-500 text-white" },
          { icon: Settings, label: "Settings", color: "bg-gray-500 text-white" },
        ].map(a => (
          <motion.div key={a.label} whileTap={{ scale: 0.92 }} className="flex flex-col items-center gap-1.5 cursor-pointer">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", a.color)}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Schedule list */}
      <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-sm font-semibold">Today's Schedule</p>
        </div>
        {["09:00 — James T. · Lesson 3", "11:00 — Priya K. · Mock Test", "14:00 — Sarah M. · Lesson 8", "16:00 — Ben W. · Assessment"].map((s, i) => (
          <div key={i} className={cn(
            "px-4 py-3 flex items-center justify-between border-b border-border/30 last:border-0",
            i === 2 && "bg-blue-50 dark:bg-blue-500/10"
          )}>
            <span className={cn("text-sm", i === 2 ? "font-semibold text-blue-600" : "text-foreground")}>{s}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 2: Hero Gradient — Bold gradient hero with floating tiles
// ═══════════════════════════════════════════════════════════════
function HeroGradientDesign() {
  return (
    <div className="min-h-[700px] rounded-2xl overflow-hidden">
      {/* Hero gradient */}
      <div className="bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#0d47a1] p-5 pb-16 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm opacity-70">Tuesday, 11 April</p>
              <h1 className="text-2xl font-bold mt-1">Hello Ken 🚗</h1>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-lg font-bold">KD</span>
            </div>
          </div>
          <div className="flex gap-4">
            {[
              { label: "Lessons", value: "5" },
              { label: "Revenue", value: "£180" },
              { label: "Hours", value: "8h" },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlapping tile grid */}
      <div className="px-4 -mt-10 space-y-3 pb-4 bg-[#F2F2F7] dark:bg-[#1C1C1E] relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={Calendar} label="Schedule" value="5 today" color="bg-blue-500/10 text-blue-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={CreditCard} label="Payments" value="£120 due" color="bg-emerald-500/10 text-emerald-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={Users} label="Pupils" value="23 active" color="bg-orange-500/10 text-orange-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={Gauge} label="Telematics" value="3 trips" color="bg-purple-500/10 text-purple-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
        </div>

        {/* Next lesson */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600">NEXT LESSON · 2:00 PM</span>
          </div>
          <h3 className="font-bold">Sarah Mitchell — Lesson 8</h3>
          <p className="text-xs text-muted-foreground mt-1">14 Oak Lane, SE5 8NP</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="rounded-xl text-xs flex-1">Navigate</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs flex-1">Start Lesson</Button>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold">Messages</span>
            </div>
            <Badge className="bg-red-500 text-white text-[10px]">2</Badge>
          </div>
          <div className="space-y-2">
            <div className="bg-[#F2F2F7] dark:bg-[#3A3A3C] rounded-xl p-3 text-xs">
              <span className="font-medium">Ben W.</span> · Can we reschedule Thursday?
            </div>
            <div className="bg-[#F2F2F7] dark:bg-[#3A3A3C] rounded-xl p-3 text-xs">
              <span className="font-medium">Priya K.</span> · Thanks for today!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 3: Dark Cockpit — Dark theme with glowing accents
// ═══════════════════════════════════════════════════════════════
function DarkCockpitDesign() {
  return (
    <div className="bg-[#0A0A0F] min-h-[700px] p-4 space-y-4 rounded-2xl text-white">
      {/* Status bar */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs text-gray-500">INSTRUCTOR COCKPIT</p>
          <h1 className="text-xl font-bold">Ken Davies</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Glowing stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Calendar, value: "5", label: "Lessons", glow: "shadow-blue-500/20 border-blue-500/30", iconColor: "text-blue-400" },
          { icon: PoundSterling, value: "£180", label: "Today", glow: "shadow-emerald-500/20 border-emerald-500/30", iconColor: "text-emerald-400" },
          { icon: Route, value: "42mi", label: "Distance", glow: "shadow-purple-500/20 border-purple-500/30", iconColor: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className={cn("bg-[#151520] border rounded-2xl p-3 text-center shadow-lg", s.glow)}>
            <s.icon className={cn("w-5 h-5 mx-auto mb-2", s.iconColor)} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Next lesson */}
      <div className="bg-gradient-to-r from-blue-600/20 to-transparent border border-blue-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-xs text-blue-400 font-semibold">NEXT UP · 14:00</span>
        </div>
        <h3 className="font-bold text-lg">Sarah Mitchell</h3>
        <p className="text-sm text-gray-400">Lesson 8 · 14 Oak Lane, SE5 8NP</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs">
            <Navigation className="w-3 h-3 mr-1" /> Navigate
          </Button>
          <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs">
            <Phone className="w-3 h-3 mr-1" /> Call
          </Button>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: CreditCard, label: "Pay", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
          { icon: Users, label: "Pupils", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
          { icon: MessageSquare, label: "Chat", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
          { icon: Bell, label: "Alerts", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
          { icon: Gauge, label: "Telematic", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
          { icon: Camera, label: "Dashcam", color: "bg-red-500/10 text-red-400 border-red-500/20" },
          { icon: FileText, label: "Reports", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
          { icon: Settings, label: "Settings", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
        ].map(a => (
          <motion.div key={a.label} whileTap={{ scale: 0.92 }}
            className={cn("flex flex-col items-center gap-1.5 p-3 rounded-2xl border cursor-pointer", a.color)}
          >
            <a.icon className="w-5 h-5" />
            <span className="text-[9px] font-medium">{a.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Schedule list */}
      <div className="bg-[#151520] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-gray-300">Today's Schedule</p>
        </div>
        {["09:00 — James T.", "11:00 — Priya K.", "14:00 — Sarah M.", "16:00 — Ben W."].map((s, i) => (
          <div key={i} className={cn(
            "px-4 py-3 flex items-center justify-between border-b border-gray-800/50 last:border-0",
            i === 2 && "bg-blue-500/5 border-l-2 border-l-blue-400"
          )}>
            <span className={cn("text-sm", i === 2 ? "text-blue-400 font-medium" : "text-gray-400")}>{s}</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 4: Pastel Widgets — Soft, friendly iOS widgets
// ═══════════════════════════════════════════════════════════════
function PastelWidgetsDesign() {
  return (
    <div className="bg-gradient-to-b from-[#E8F0FE] to-[#F5E6F0] dark:from-[#1a1a2e] dark:to-[#16213e] min-h-[700px] p-4 space-y-4 rounded-2xl">
      <div className="pt-2 px-1">
        <p className="text-sm text-muted-foreground">☀️ Good afternoon</p>
        <h1 className="text-2xl font-bold text-foreground">Ken Davies</h1>
      </div>

      {/* Soft pastel tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-100/80 dark:bg-blue-900/30 rounded-3xl p-4 space-y-3">
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">5</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Lessons Today</p>
          </div>
        </div>
        <div className="bg-green-100/80 dark:bg-green-900/30 rounded-3xl p-4 space-y-3">
          <PoundSterling className="w-8 h-8 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">£2,340</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">This Month</p>
          </div>
        </div>
        <div className="bg-orange-100/80 dark:bg-orange-900/30 rounded-3xl p-4 space-y-3">
          <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          <div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">23</p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">Active Pupils</p>
          </div>
        </div>
        <div className="bg-purple-100/80 dark:bg-purple-900/30 rounded-3xl p-4 space-y-3">
          <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">2</p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">New Messages</p>
          </div>
        </div>
      </div>

      {/* Next lesson */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-4 border border-white/50 dark:border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-blue-500">NEXT · 2:00 PM</span>
        </div>
        <h3 className="font-bold text-foreground">Sarah Mitchell — Lesson 8</h3>
        <p className="text-xs text-muted-foreground mt-1">14 Oak Lane, SE5 8NP</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="rounded-full bg-blue-500 text-white text-xs flex-1">Start Lesson</Button>
          <Button size="sm" variant="outline" className="rounded-full text-xs">Navigate</Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: CreditCard, label: "Pay", bg: "bg-green-100/80 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
          { icon: Plus, label: "Book", bg: "bg-blue-100/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
          { icon: Gauge, label: "Trips", bg: "bg-cyan-100/80 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400" },
          { icon: Star, label: "Goals", bg: "bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
        ].map(a => (
          <motion.div key={a.label} whileTap={{ scale: 0.92 }} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer", a.bg)}>
            <a.icon className="w-6 h-6" />
            <span className="text-[10px] font-semibold">{a.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Weekly progress */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-4 border border-white/50 dark:border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Weekly Goal</span>
          <span className="text-xs text-muted-foreground">32/44 hrs</span>
        </div>
        <Progress value={72} className="h-3 rounded-full" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 5: Hero Photo — Full photo header with overlay tiles
// ═══════════════════════════════════════════════════════════════
function HeroPhotoDesign() {
  return (
    <div className="min-h-[700px] rounded-2xl overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
      {/* Hero image with overlay */}
      <div className="relative h-56 bg-gradient-to-br from-[#1e3a5f] to-[#0d1b2a]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-ebd13bc0c322?w=800&q=80')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-5 text-white">
          <p className="text-sm opacity-80">Welcome back</p>
          <h1 className="text-3xl font-bold mt-1">Ken Davies</h1>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">5 lessons</span>
            </div>
            <div className="flex items-center gap-1.5">
              <PoundSterling className="w-4 h-4" />
              <span className="text-sm">£180 today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div className="p-4 -mt-6 relative z-10 space-y-3">
        {/* Next lesson */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600">NOW · 2:00 PM</span>
          </div>
          <h3 className="font-bold text-foreground">Sarah Mitchell — Lesson 8</h3>
          <p className="text-xs text-muted-foreground mt-1">14 Oak Lane, SE5 8NP</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="rounded-xl text-xs"><Navigation className="w-3 h-3 mr-1" /> Navigate</Button>
            <Button size="sm" variant="outline" className="rounded-xl text-xs"><Phone className="w-3 h-3 mr-1" /> Call</Button>
            <Button size="sm" className="rounded-xl text-xs bg-emerald-500 hover:bg-emerald-600 text-white ml-auto">Start</Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={Calendar} label="Schedule" value="5 today" color="bg-blue-500/10 text-blue-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={CreditCard} label="Payments" value="£120 due" color="bg-emerald-500/10 text-emerald-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={MessageSquare} label="Messages" badge="2" value="" color="bg-purple-500/10 text-purple-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={Users} label="Pupils" value="23" color="bg-orange-500/10 text-orange-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Plus, label: "Book", color: "bg-blue-500 text-white" },
            { icon: Gauge, label: "Telematic", color: "bg-cyan-600 text-white" },
            { icon: Camera, label: "Dashcam", color: "bg-red-500 text-white" },
            { icon: Settings, label: "Settings", color: "bg-gray-500 text-white" },
          ].map(a => (
            <motion.div key={a.label} whileTap={{ scale: 0.92 }} className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", a.color)}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 6: Neon Glass — Frosted glass on dark with neon accents
// ═══════════════════════════════════════════════════════════════
function NeonGlassDesign() {
  return (
    <div className="bg-gradient-to-b from-[#0f0f1a] via-[#13132a] to-[#0a0a15] min-h-[700px] p-4 space-y-4 rounded-2xl text-white relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-40 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]" />

      <div className="relative z-10 space-y-4">
        <div className="pt-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Dashboard</p>
          <h1 className="text-2xl font-bold mt-1">Ken Davies</h1>
        </div>

        {/* Glass stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, value: "5", label: "Today", border: "border-blue-500/30" },
            { icon: PoundSterling, value: "£180", label: "Earned", border: "border-emerald-500/30" },
            { icon: Users, value: "23", label: "Pupils", border: "border-orange-500/30" },
            { icon: Route, value: "42mi", label: "Driven", border: "border-purple-500/30" },
          ].map(s => (
            <motion.div key={s.label} whileTap={{ scale: 0.96 }}
              className={cn("bg-white/5 backdrop-blur-xl border rounded-2xl p-4 cursor-pointer", s.border)}
            >
              <s.icon className="w-6 h-6 mb-2 opacity-60" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Next lesson glass card */}
        <div className="bg-white/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-blue-400 font-semibold">NEXT · 14:00</span>
          </div>
          <h3 className="font-bold text-lg">Sarah Mitchell</h3>
          <p className="text-sm text-gray-400">Lesson 8 · 14 Oak Lane</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-xs hover:bg-blue-500/30">Navigate</Button>
            <Button size="sm" className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs hover:bg-emerald-500/30 ml-auto">Start</Button>
          </div>
        </div>

        {/* Action grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: CreditCard, label: "Pay", border: "border-emerald-500/20" },
            { icon: MessageSquare, label: "Chat", border: "border-purple-500/20" },
            { icon: Bell, label: "Alerts", border: "border-amber-500/20" },
            { icon: Plus, label: "Book", border: "border-blue-500/20" },
          ].map(a => (
            <motion.div key={a.label} whileTap={{ scale: 0.92 }}
              className={cn("bg-white/5 backdrop-blur border rounded-2xl flex flex-col items-center gap-1.5 p-3 cursor-pointer", a.border)}
            >
              <a.icon className="w-5 h-5 opacity-70" />
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 7: Card Stack — Stacked iOS notification-style cards
// ═══════════════════════════════════════════════════════════════
function CardStackDesign() {
  return (
    <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] min-h-[700px] p-4 space-y-3 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Today</h1>
          <p className="text-sm text-muted-foreground">Tuesday, 11 April</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">KD</span>
        </div>
      </div>

      {/* Stacked notification cards */}
      {[
        {
          icon: Play, iconBg: "bg-emerald-500", title: "Next Lesson", subtitle: "Sarah Mitchell — 2:00 PM",
          detail: "14 Oak Lane, SE5 8NP · Lesson 8", action: "Start Lesson"
        },
        {
          icon: PoundSterling, iconBg: "bg-blue-500", title: "Payment Received", subtitle: "James Turner — £38.00",
          detail: "Lesson 3 · Paid via Square", action: null
        },
        {
          icon: AlertTriangle, iconBg: "bg-amber-500", title: "Test Alert", subtitle: "Lucy Fisher — Test in 3 days",
          detail: "Practical test · Borehamwood TC", action: "View Details"
        },
        {
          icon: MessageSquare, iconBg: "bg-purple-500", title: "New Message", subtitle: "Ben Walker",
          detail: "Can we reschedule Thursday's lesson?", action: "Reply"
        },
      ].map((card, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0", card.iconBg)}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                <span className="text-[10px] text-muted-foreground">now</span>
              </div>
              <p className="text-sm font-semibold mt-0.5 text-foreground">{card.subtitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.detail}</p>
              {card.action && (
                <Button size="sm" variant="outline" className="rounded-xl text-xs mt-2 h-7">
                  {card.action} <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Quick tiles row */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {[
          { icon: Calendar, label: "Schedule", count: "5", bg: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
          { icon: Users, label: "Pupils", count: "23", bg: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" },
          { icon: CreditCard, label: "Money", count: "£2.3k", bg: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
          { icon: Gauge, label: "Trips", count: "3", bg: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
        ].map(t => (
          <motion.div key={t.label} whileTap={{ scale: 0.92 }}
            className={cn("rounded-2xl p-3 text-center cursor-pointer", t.bg)}
          >
            <t.icon className="w-5 h-5 mx-auto mb-1" />
            <p className="text-sm font-bold">{t.count}</p>
            <p className="text-[9px] font-medium opacity-70">{t.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 8: Hero Split — Split hero with action panel
// ═══════════════════════════════════════════════════════════════
function HeroSplitDesign() {
  return (
    <div className="min-h-[700px] rounded-2xl overflow-hidden bg-[#F2F2F7] dark:bg-[#1C1C1E]">
      {/* Split hero */}
      <div className="grid grid-cols-2 h-48">
        <div className="bg-[#142744] p-5 flex flex-col justify-end text-white">
          <p className="text-xs opacity-60">Good afternoon</p>
          <h1 className="text-xl font-bold mt-1">Ken Davies</h1>
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium">4.9</span>
            <span className="text-xs opacity-60 ml-1">· 23 pupils</span>
          </div>
        </div>
        <div className="bg-[url('https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80')] bg-cover bg-center relative">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#142744]/30" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white dark:bg-[#2C2C2E] flex justify-around py-3 shadow-sm">
        {[
          { value: "5", label: "Lessons" },
          { value: "£180", label: "Today" },
          { value: "32h", label: "Week" },
          { value: "42mi", label: "Distance" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Next lesson */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-4 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">NEXT · 14:00</span>
          </div>
          <h3 className="font-bold text-foreground">Sarah Mitchell — Lesson 8</h3>
          <p className="text-xs text-muted-foreground mt-1">14 Oak Lane, SE5 8NP</p>
        </div>

        {/* Tile grid */}
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={Calendar} label="Schedule" value="View all" color="bg-blue-500/10 text-blue-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={CreditCard} label="Payments" value="£120 due" color="bg-emerald-500/10 text-emerald-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={MessageSquare} label="Messages" badge="2" value="" color="bg-purple-500/10 text-purple-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
          <Tile icon={Gauge} label="Telematics" value="3 trips" color="bg-cyan-500/10 text-cyan-600" className="bg-white dark:bg-[#2C2C2E] shadow-sm" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 9: Minimal Mono — Ultra-clean monochrome
// ═══════════════════════════════════════════════════════════════
function MinimalMonoDesign() {
  return (
    <div className="bg-white dark:bg-[#0A0A0A] min-h-[700px] p-5 space-y-6 rounded-2xl">
      <div className="pt-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground mt-1">5 lessons · £180 revenue · 8 hours</p>
      </div>

      {/* Minimal stat row */}
      <div className="flex gap-4">
        {[
          { value: "5", label: "LESSONS" },
          { value: "23", label: "PUPILS" },
          { value: "£2,340", label: "MONTH" },
          { value: "4.9★", label: "RATING" },
        ].map(s => (
          <div key={s.label} className="flex-1">
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-border" />

      {/* Next lesson */}
      <div>
        <p className="text-[10px] text-muted-foreground tracking-widest mb-3">NEXT LESSON</p>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-foreground">Sarah Mitchell</h3>
            <p className="text-sm text-muted-foreground">Lesson 8 · 14:00 · 14 Oak Lane</p>
          </div>
          <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs">
            Start <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Schedule */}
      <div>
        <p className="text-[10px] text-muted-foreground tracking-widest mb-3">SCHEDULE</p>
        <div className="space-y-0">
          {[
            { time: "09:00", name: "James Turner", type: "Lesson 3", done: true },
            { time: "11:00", name: "Priya Kapoor", type: "Mock Test", done: true },
            { time: "14:00", name: "Sarah Mitchell", type: "Lesson 8", done: false, active: true },
            { time: "16:00", name: "Ben Walker", type: "Assessment", done: false },
            { time: "17:30", name: "Lucy Fisher", type: "Lesson 12", done: false },
          ].map((s, i) => (
            <div key={i} className={cn(
              "flex items-center py-3 border-b border-border/50 last:border-0",
              s.done && "opacity-40",
              s.active && "opacity-100"
            )}>
              <span className="text-xs font-mono text-muted-foreground w-12">{s.time}</span>
              <div className="flex-1">
                <span className={cn("text-sm", s.active ? "font-semibold text-foreground" : "text-foreground")}>{s.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{s.type}</span>
              </div>
              {s.done && <CheckCircle2 className="w-4 h-4 text-muted-foreground" />}
              {s.active && <div className="w-2 h-2 bg-foreground rounded-full" />}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: CreditCard, label: "Pay" },
          { icon: MessageSquare, label: "Chat" },
          { icon: Users, label: "Pupils" },
          { icon: Settings, label: "Settings" },
        ].map(a => (
          <motion.div key={a.label} whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border cursor-pointer hover:bg-muted/50"
          >
            <a.icon className="w-5 h-5 text-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Design 10: Sport Dashboard — Fitness-tracker inspired rings
// ═══════════════════════════════════════════════════════════════
function SportDashDesign() {
  return (
    <div className="bg-black min-h-[700px] p-4 space-y-4 rounded-2xl text-white relative overflow-hidden">
      {/* Subtle gradient */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#1a3a2a] to-transparent opacity-50" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Activity</p>
            <h1 className="text-2xl font-bold">Ken Davies</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Ring stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Lessons", value: "5/6", pct: 83, color: "text-emerald-400", ring: "stroke-emerald-400", bg: "stroke-emerald-400/20" },
            { label: "Revenue", value: "£180", pct: 65, color: "text-blue-400", ring: "stroke-blue-400", bg: "stroke-blue-400/20" },
            { label: "Hours", value: "7.5h", pct: 72, color: "text-orange-400", ring: "stroke-orange-400", bg: "stroke-orange-400/20" },
          ].map(r => (
            <div key={r.label} className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" strokeWidth="5" className={r.bg} />
                  <circle cx="32" cy="32" r="28" fill="none" strokeWidth="5" className={r.ring}
                    strokeDasharray={`${r.pct * 1.76} 176`} strokeLinecap="round" />
                </svg>
                <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", r.color)}>
                  {r.pct}%
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{r.value}</p>
                <p className="text-[10px] text-gray-500">{r.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Next lesson */}
        <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-semibold">NEXT UP · 14:00</span>
          </div>
          <h3 className="font-bold">Sarah Mitchell — Lesson 8</h3>
          <p className="text-sm text-gray-500 mt-0.5">14 Oak Lane, SE5 8NP</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs hover:bg-emerald-500/30">Navigate</Button>
            <Button size="sm" className="bg-emerald-500 text-white rounded-xl text-xs hover:bg-emerald-600 ml-auto">Start</Button>
          </div>
        </div>

        {/* Action tiles */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: CreditCard, label: "Pay", color: "text-emerald-400 border-emerald-500/20" },
            { icon: Users, label: "Pupils", color: "text-blue-400 border-blue-500/20" },
            { icon: MessageSquare, label: "Chat", color: "text-purple-400 border-purple-500/20" },
            { icon: Calendar, label: "Schedule", color: "text-orange-400 border-orange-500/20" },
          ].map(a => (
            <motion.div key={a.label} whileTap={{ scale: 0.92 }}
              className={cn("bg-white/5 border rounded-2xl flex flex-col items-center gap-1.5 p-3 cursor-pointer", a.color)}
            >
              <a.icon className="w-5 h-5" />
              <span className="text-[9px] text-gray-500">{a.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Weekly goal */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Weekly Goal</span>
            <span className="text-xs text-gray-500">32/44 hours</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-[72%] bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Demo Page
// ═══════════════════════════════════════════════════════════════
const designComponents: Record<string, () => JSX.Element> = {
  "ios-tiles": IOSTilesDesign,
  "hero-gradient": HeroGradientDesign,
  "dark-cockpit": DarkCockpitDesign,
  "pastel-widgets": PastelWidgetsDesign,
  "hero-photo": HeroPhotoDesign,
  "neon-glass": NeonGlassDesign,
  "card-stack": CardStackDesign,
  "hero-split": HeroSplitDesign,
  "minimal-mono": MinimalMonoDesign,
  "sport-dash": SportDashDesign,
};

export default function DemoiOSDesigns() {
  const [active, setActive] = useState("ios-tiles");
  const DesignComponent = designComponents[active];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky selector */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-foreground mb-2">iOS Design Gallery</h1>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {designList.map(d => (
              <button
                key={d.id}
                onClick={() => setActive(d.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  active === d.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Design preview */}
      <div className="max-w-md mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DesignComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
