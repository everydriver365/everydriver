import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Users, TrendingUp, Clock, Globe, ChevronRight, MessageSquare,
  CreditCard, MapPin, Bell, Star, Zap, ArrowUpRight, BarChart3, Car,
  CheckCircle2, AlertTriangle, Plus, PoundSterling, Eye, Settings,
  Activity, Briefcase, Target, Flame, Award, CircleDot,
  Navigation, Phone, Wallet, Heart, Shield, Gauge, Route, Sun, Moon,
  Layers, Grip, Hash, Inbox, Send, Timer, Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const designs = [
  { id: "focus-cards", label: "Focus Cards", description: "Large action-oriented cards with bold icons and clear CTAs. Priority-based layout puts your next action front and centre." },
  { id: "timeline", label: "Timeline Flow", description: "Time-driven vertical layout showing your day as a flowing timeline. Contextual widgets snap into the flow." },
  { id: "glassmorphic", label: "Glass Dashboard", description: "Modern frosted-glass aesthetic with layered depth. Stats float over a branded gradient canvas." },
  { id: "mission-control", label: "Mission Control", description: "Dense, data-rich control panel inspired by flight decks. Everything visible at once — no scrolling needed." },
  { id: "driver-hub", label: "Driver Hub", description: "Warm, approachable card layout with rounded corners, soft gradients, and a motivational daily summary." },
  { id: "split-pane", label: "Split Pane", description: "Two-column desktop-first layout — schedule on the left, everything else on the right. Maximises screen real-estate." },
  { id: "kanban-flow", label: "Kanban Board", description: "Visual column-based workflow: To-Do → In Progress → Done. Drag-style layout for task-oriented instructors." },
  { id: "minimal-zen", label: "Minimal Zen", description: "Ultra-clean single-column layout with generous whitespace. Focus on the essentials with calm, intentional design." },
  { id: "ios-stack", label: "iOS Stack", description: "Native iOS widget-stack feel with grouped rounded sections, subtle separators, and SF-style typography." },
  { id: "radar", label: "Radar View", description: "Circular progress rings and radial stats. A fitness-tracker-inspired dashboard with visual progress indicators." },
  { id: "newspaper", label: "Newspaper", description: "Editorial masonry layout with bold headlines, pull-quotes, and a news-feed aesthetic for daily briefings." },
  { id: "neon-dark", label: "Neon Dark", description: "High-contrast dark theme with neon accent glows, sharp borders, and a cyberpunk-inspired command terminal feel." },
  { id: "widget-grid", label: "Widget Grid", description: "Configurable widget tiles with a prominent settings gear. Drag-style grid with resizable areas and a personalisation panel." },
  { id: "coach-pro", label: "Coach Pro", description: "Professional coaching dashboard with pupil pipeline, revenue chart, and a settings sidebar always visible." },
  { id: "card-carousel", label: "Carousel", description: "Swipeable horizontal card rows for schedule, actions, and stats. Feels like a native app launcher with settings access." },
  { id: "tabbed-home", label: "Tabbed Home", description: "Segmented tabs at top — Today / Pupils / Money / Settings. Each tab loads a focused mini-dashboard." },
  { id: "command-palette", label: "Command Palette", description: "Search-first design with a spotlight-style command bar. Type to navigate, with quick-access settings and preferences." },
];

// ─── Design 1: Focus Cards ────────────────────────────────────
function FocusCardsDesign() {
  return (
    <div className="space-y-4">
      {/* Priority Action Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 font-medium">Next Up · 2:00 PM</p>
            <h2 className="text-xl font-bold mt-1">Sarah Mitchell — Lesson 8</h2>
            <p className="text-sm opacity-70 mt-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> 14 Oak Lane, SE5 8NP
            </p>
          </div>
          <Button size="lg" variant="secondary" className="rounded-xl font-semibold shadow-lg">
            Start Lesson <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Quick Stat Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Calendar, value: "5", label: "Today", color: "text-primary bg-primary/10" },
          { icon: PoundSterling, value: "£2,340", label: "This Month", color: "text-emerald-600 bg-emerald-500/10" },
          { icon: Users, value: "23", label: "Pupils", color: "text-amber-600 bg-amber-500/10" },
          { icon: Clock, value: "32h", label: "This Week", color: "text-purple-600 bg-purple-500/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border hover:border-primary/20 transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column action cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Schedule Card */}
        <Card className="border-border hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Today's Schedule</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-2.5">
              {["09:00 — James T. (Lesson 3)", "11:00 — Priya K. (Mock Test)", "14:00 — Sarah M. (Lesson 8)", "16:00 — Ben W. (Assessment)", "17:30 — Lucy F. (Lesson 12)"].map((l, i) => (
                <div key={i} className={cn(
                  "text-sm px-3 py-2 rounded-lg",
                  i === 2 ? "bg-primary/10 text-primary font-medium border border-primary/20" : "bg-muted/50"
                )}>
                  {l}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Card className="border-border hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-emerald-500/5 to-transparent">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Take Payment</p>
                <p className="text-xs text-muted-foreground">3 outstanding invoices</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Messages</p>
                <p className="text-xs text-muted-foreground">2 unread from pupils</p>
              </div>
              <Badge variant="destructive" className="text-[10px] h-5">2</Badge>
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Alerts</p>
                <p className="text-xs text-muted-foreground">1 test date approaching</p>
              </div>
              <Badge className="bg-amber-500/10 text-amber-700 text-[10px] h-5 border-0">1</Badge>
            </CardContent>
          </Card>
          <Card className="border-border hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Book Lesson</p>
                <p className="text-xs text-muted-foreground">Add to schedule</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Design 2: Timeline Flow ──────────────────────────────────
function TimelineDesign() {
  const timeSlots = [
    { time: "09:00", name: "James Turner", type: "Lesson 3", status: "done" },
    { time: "11:00", name: "Priya Kapoor", type: "Mock Test", status: "done" },
    { time: "14:00", name: "Sarah Mitchell", type: "Lesson 8", status: "current" },
    { time: "16:00", name: "Ben Walker", type: "Assessment", status: "upcoming" },
    { time: "17:30", name: "Lucy Fisher", type: "Lesson 12", status: "upcoming" },
  ];

  return (
    <div className="space-y-4">
      {/* Compact header bar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">KD</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">Good afternoon, Ken</p>
            <p className="text-xs text-muted-foreground">3 of 5 lessons complete · £180 earned today</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs">
            <Globe className="h-3 w-3 mr-1" /> Online
          </Badge>
        </div>
      </div>

      {/* Stats ribbon */}
      <div className="flex gap-6 px-2">
        {[
          { label: "Revenue", value: "£2,340", trend: "+12%", up: true },
          { label: "Hours", value: "32h", trend: "+3h", up: true },
          { label: "Pupils", value: "23", trend: "−1", up: false },
          { label: "Rating", value: "4.9", trend: "★", up: true },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center">
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <span className={cn("text-[10px] font-medium", s.up ? "text-emerald-600" : "text-red-500")}>{s.trend}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Today's Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                <div className="space-y-1">
                  {timeSlots.map((slot, i) => (
                    <div key={i} className={cn(
                      "relative flex items-center gap-4 py-3 px-3 rounded-xl transition-all",
                      slot.status === "current" && "bg-primary/5 border border-primary/20",
                      slot.status === "done" && "opacity-60",
                    )}>
                      {/* Dot */}
                      <div className={cn(
                        "absolute -left-[14px] h-3 w-3 rounded-full border-2",
                        slot.status === "current" ? "bg-primary border-primary animate-pulse" :
                        slot.status === "done" ? "bg-emerald-500 border-emerald-500" :
                        "bg-card border-muted-foreground"
                      )} />
                      <div className="text-xs font-mono text-muted-foreground w-10 shrink-0">{slot.time}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{slot.name}</p>
                        <p className="text-xs text-muted-foreground">{slot.type}</p>
                      </div>
                      {slot.status === "current" && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">NOW</Badge>
                      )}
                      {slot.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          <Card className="border-border bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold">Needs Attention</p>
              </div>
              <div className="space-y-2">
                <div className="text-xs bg-card rounded-lg p-2.5 border border-border">
                  <p className="font-medium">Lucy F — Test in 3 days</p>
                  <p className="text-muted-foreground mt-0.5">Practical test booked</p>
                </div>
                <div className="text-xs bg-card rounded-lg p-2.5 border border-border">
                  <p className="font-medium">2 pupils overdue payment</p>
                  <p className="text-muted-foreground mt-0.5">£120 outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Messages</p>
                <Badge variant="destructive" className="ml-auto text-[10px] h-5">2</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-xs bg-muted/50 rounded-lg p-2.5">
                  <p className="font-medium">Ben W.</p>
                  <p className="text-muted-foreground truncate">Can we reschedule Thursday?</p>
                </div>
                <div className="text-xs bg-muted/50 rounded-lg p-2.5">
                  <p className="font-medium">Priya K.</p>
                  <p className="text-muted-foreground truncate">Thanks for today's lesson!</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Weekly Goal</p>
              </div>
              <Progress value={72} className="h-2 mb-1" />
              <p className="text-[11px] text-muted-foreground">32 / 44 hours (72%)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Design 3: Glassmorphic ──────────────────────────────────
function GlassmorphicDesign() {
  return (
    <div className="space-y-4">
      {/* Hero gradient canvas */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1f36] via-[#1e2a4a] to-[#0f172a] p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.1),transparent_50%)]" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white font-bold">KD</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Ken Dawson</p>
                <p className="text-sm text-white/60">Grade A · DVSA Approved</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1.5 text-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-medium">Online</span>
            </div>
          </div>

          {/* Floating stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Calendar, value: "5", label: "Lessons Today", accent: "from-blue-500/20 to-blue-500/5 border-blue-500/20" },
              { icon: PoundSterling, value: "£2,340", label: "Month Revenue", accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20" },
              { icon: Users, value: "23", label: "Active Pupils", accent: "from-amber-500/20 to-amber-500/5 border-amber-500/20" },
              { icon: Star, value: "4.9", label: "Avg Rating", accent: "from-purple-500/20 to-purple-500/5 border-purple-500/20" },
            ].map((s) => (
              <div key={s.label} className={cn(
                "backdrop-blur-md bg-gradient-to-b border rounded-xl p-3.5 cursor-pointer hover:scale-[1.02] transition-transform",
                s.accent
              )}>
                <s.icon className="h-4 w-4 text-white/60 mb-2" />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[11px] text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {/* Next lesson highlight */}
          <Card className="border-border overflow-hidden">
            <div className="flex">
              <div className="w-1.5 bg-primary" />
              <CardContent className="p-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">NEXT LESSON · 2:00 PM</p>
                    <p className="text-base font-semibold mt-1">Sarah Mitchell — Lesson 8</p>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> 14 Oak Lane, SE5 8NP
                    </p>
                  </div>
                  <Button className="rounded-xl">Navigate <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Schedule blocks */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Today's Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1.5">
                {[
                  { h: "09:00", done: true }, { h: "10:00", done: true }, { h: "11:00", done: true },
                  { h: "12:00", break: true }, { h: "13:00", break: true },
                  { h: "14:00", current: true }, { h: "15:00" }, { h: "16:00" }, { h: "17:00" },
                ].map((slot, i) => (
                  <div key={i} className={cn(
                    "flex-1 h-14 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all",
                    slot.done ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                    slot.current ? "bg-primary/10 text-primary border-2 border-primary/30 font-bold" :
                    slot.break ? "bg-muted/30 text-muted-foreground" :
                    "bg-muted/50 text-muted-foreground"
                  )}>
                    <span className="font-mono">{slot.h}</span>
                    {slot.done && <CheckCircle2 className="h-3 w-3 mt-0.5" />}
                    {slot.current && <CircleDot className="h-3 w-3 mt-0.5 animate-pulse" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" /> Streak
              </p>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">14</p>
                <p className="text-xs text-muted-foreground">days consecutive lessons</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Pass Rate
              </p>
              <div className="flex items-end gap-1">
                {[60, 75, 80, 85, 90, 88, 92].map((v, i) => (
                  <div key={i} className="flex-1">
                    <div className="bg-primary/20 rounded-t" style={{ height: `${v * 0.5}px` }}>
                      <div className="bg-primary rounded-t w-full" style={{ height: `${v * 0.3}px` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">92% this quarter</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-gradient-to-br from-red-500/5 to-transparent">
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Attention
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="bg-card border border-border rounded-lg p-2">DBS renewal in 18 days</div>
                <div className="bg-card border border-border rounded-lg p-2">2 payments overdue</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Design 4: Mission Control ────────────────────────────────
function MissionControlDesign() {
  return (
    <div className="space-y-3">
      {/* Top strip */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">KD</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <span className="text-sm font-semibold">Ken Dawson</span>
          <span className="text-xs text-muted-foreground ml-2">Grade A Instructor</span>
        </div>
        <div className="flex gap-1.5">
          {[
            { label: "Lessons", value: "5", color: "bg-primary/10 text-primary" },
            { label: "Revenue", value: "£2.3k", color: "bg-emerald-500/10 text-emerald-600" },
            { label: "Hours", value: "32h", color: "bg-purple-500/10 text-purple-600" },
            { label: "Pupils", value: "23", color: "bg-amber-500/10 text-amber-600" },
          ].map((s) => (
            <div key={s.label} className={cn("px-3 py-1.5 rounded-lg text-center", s.color)}>
              <p className="text-sm font-bold leading-tight">{s.value}</p>
              <p className="text-[9px] opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-lg px-2.5 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-600">LIVE</span>
        </div>
      </div>

      {/* 4-pane grid */}
      <div className="grid grid-cols-4 gap-3" style={{ height: "420px" }}>
        {/* Schedule — 2 cols */}
        <Card className="col-span-2 border-border overflow-hidden flex flex-col">
          <CardHeader className="py-2 px-4 bg-muted/30 border-b">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {[
              { time: "09:00", name: "James T.", type: "L3", done: true },
              { time: "11:00", name: "Priya K.", type: "Mock", done: true },
              { time: "14:00", name: "Sarah M.", type: "L8", current: true },
              { time: "16:00", name: "Ben W.", type: "Assess" },
              { time: "17:30", name: "Lucy F.", type: "L12" },
            ].map((l, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 px-4 py-2.5 border-b border-border/50 text-sm",
                l.current && "bg-primary/5",
                l.done && "opacity-50"
              )}>
                <span className="font-mono text-xs text-muted-foreground w-10">{l.time}</span>
                <span className={cn("font-medium flex-1", l.done && "line-through")}>{l.name}</span>
                <Badge variant="outline" className="text-[10px] h-5">{l.type}</Badge>
                {l.current && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                {l.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts pane */}
        <Card className="border-border overflow-hidden flex flex-col">
          <CardHeader className="py-2 px-4 bg-amber-500/5 border-b">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1 overflow-y-auto space-y-2">
            {[
              { text: "Lucy F. test in 3 days", severity: "high" },
              { text: "DBS expiry in 18 days", severity: "medium" },
              { text: "2 pupils overdue", severity: "high" },
              { text: "MOT due next month", severity: "low" },
            ].map((a, i) => (
              <div key={i} className={cn(
                "text-xs p-2.5 rounded-lg border",
                a.severity === "high" ? "border-red-500/20 bg-red-500/5" :
                a.severity === "medium" ? "border-amber-500/20 bg-amber-500/5" :
                "border-border bg-muted/30"
              )}>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    a.severity === "high" ? "bg-red-500" :
                    a.severity === "medium" ? "bg-amber-500" : "bg-muted-foreground"
                  )} />
                  {a.text}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions pane */}
        <Card className="border-border overflow-hidden flex flex-col">
          <CardHeader className="py-2 px-4 bg-primary/5 border-b">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide text-primary">
              <Zap className="h-3.5 w-3.5" /> Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: CreditCard, label: "Payment", color: "text-emerald-600" },
                { icon: Plus, label: "Book", color: "text-primary" },
                { icon: MessageSquare, label: "Message", color: "text-blue-600" },
                { icon: MapPin, label: "Navigate", color: "text-red-600" },
                { icon: Eye, label: "Website", color: "text-purple-600" },
                { icon: Settings, label: "Settings", color: "text-muted-foreground" },
              ].map((a) => (
                <button key={a.label} className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <a.icon className={cn("h-5 w-5", a.color)} />
                  <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Design 5: Driver Hub ─────────────────────────────────────
function DriverHubDesign() {
  return (
    <div className="space-y-4">
      {/* Motivational header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-5">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Sun className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Good afternoon, Ken 👋</h2>
            <p className="text-sm text-muted-foreground">You've completed 3 of 5 lessons · £180 earned so far</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">92%</p>
            <p className="text-[10px] text-muted-foreground">Pass rate</p>
          </div>
        </div>
      </div>

      {/* Next lesson card */}
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 mb-3">
          <Play className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Next Up — 14:00</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">SM</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">Sarah Mitchell</p>
              <p className="text-sm text-muted-foreground">Lesson 8 · Roundabouts & Dual Carriageways</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">14 Oak Lane, SE5 8NP</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl"><Phone className="h-4 w-4" /></Button>
            <Button size="sm" className="rounded-xl"><Navigation className="h-4 w-4 mr-1" /> Go</Button>
          </div>
        </div>
      </div>

      {/* Metric pills */}
      <div className="flex gap-3">
        {[
          { icon: Calendar, value: "5 lessons", color: "bg-primary/10 text-primary" },
          { icon: PoundSterling, value: "£2,340 month", color: "bg-emerald-500/10 text-emerald-600" },
          { icon: Users, value: "23 pupils", color: "bg-amber-500/10 text-amber-600" },
          { icon: Timer, value: "32h week", color: "bg-purple-500/10 text-purple-600" },
        ].map((m) => (
          <div key={m.value} className={cn("flex-1 flex items-center gap-2 rounded-xl p-3 cursor-pointer hover:scale-[1.02] transition-transform", m.color)}>
            <m.icon className="h-4 w-4" />
            <span className="text-sm font-semibold">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CreditCard, label: "Take Payment", sub: "3 outstanding", accent: "bg-emerald-500/10", iconColor: "text-emerald-600" },
          { icon: MessageSquare, label: "Messages", sub: "2 unread", accent: "bg-blue-500/10", iconColor: "text-blue-600", badge: 2 },
          { icon: Calendar, label: "Fill Gaps", sub: "4 open slots", accent: "bg-amber-500/10", iconColor: "text-amber-600" },
          { icon: Heart, label: "Health Hub", sub: "Wellness tips", accent: "bg-pink-500/10", iconColor: "text-pink-600" },
          { icon: Shield, label: "Vehicle Health", sub: "MOT & service", accent: "bg-muted", iconColor: "text-muted-foreground" },
          { icon: Gauge, label: "Telematics", sub: "Drive data", accent: "bg-primary/10", iconColor: "text-primary" },
        ].map((a) => (
          <Card key={a.label} className="border-border hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", a.accent)}>
                  <a.icon className={cn("h-5 w-5", a.iconColor)} />
                </div>
                {a.badge && <Badge variant="destructive" className="text-[10px] h-5">{a.badge}</Badge>}
              </div>
              <p className="font-semibold text-sm">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's schedule compact */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Remaining Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { time: "14:00", name: "Sarah M.", type: "Lesson 8", current: true },
              { time: "16:00", name: "Ben W.", type: "Assessment" },
              { time: "17:30", name: "Lucy F.", type: "Lesson 12" },
            ].map((l, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                l.current ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
              )}>
                <span className="font-mono text-xs text-muted-foreground w-10">{l.time}</span>
                <span className="font-medium flex-1">{l.name}</span>
                <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                {l.current && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Design 6: Split Pane ─────────────────────────────────────
function SplitPaneDesign() {
  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Left — Schedule (3 cols) */}
      <div className="col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Thursday, 26 March
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg">
              <Plus className="h-4 w-4 mr-1" /> Add Lesson
            </Button>
          </div>
        </div>

        {/* Time grid */}
        <Card className="border-border overflow-hidden">
          <div className="divide-y divide-border">
            {[
              { time: "09:00", name: "James Turner", type: "Lesson 3", loc: "12 High St", done: true },
              { time: "11:00", name: "Priya Kapoor", type: "Mock Test", loc: "Test Centre", done: true },
              { time: "12:00", label: "Lunch Break", break: true },
              { time: "14:00", name: "Sarah Mitchell", type: "Lesson 8", loc: "14 Oak Lane", current: true },
              { time: "16:00", name: "Ben Walker", type: "Assessment", loc: "23 Park Rd" },
              { time: "17:30", name: "Lucy Fisher", type: "Lesson 12", loc: "8 Elm Close" },
            ].map((slot, i) => (
              <div key={i} className={cn(
                "flex items-center gap-4 px-5 py-3.5 transition-colors",
                slot.current && "bg-primary/5",
                slot.done && "opacity-50",
                slot.break && "bg-muted/30"
              )}>
                <span className="font-mono text-sm text-muted-foreground w-12">{slot.time}</span>
                {slot.break ? (
                  <span className="text-sm text-muted-foreground italic">{slot.label}</span>
                ) : (
                  <>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {slot.name?.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{slot.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {slot.loc}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{slot.type}</Badge>
                    {slot.current && (
                      <Button size="sm" className="rounded-lg text-xs">
                        <Navigation className="h-3 w-3 mr-1" /> Navigate
                      </Button>
                    )}
                    {slot.done && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right — Panels (2 cols) */}
      <div className="col-span-2 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Today", value: "£180", icon: PoundSterling, color: "text-emerald-600" },
            { label: "This Month", value: "£2,340", icon: Wallet, color: "text-primary" },
            { label: "Hours", value: "32h", icon: Clock, color: "text-purple-600" },
            { label: "Pupils", value: "23", icon: Users, color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label} className="border-border cursor-pointer hover:shadow-sm transition-all">
              <CardContent className="p-3 flex items-center gap-2">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <div>
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Messages */}
        <Card className="border-border">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <Inbox className="h-3.5 w-3.5 text-primary" /> Messages
              <Badge variant="destructive" className="ml-auto text-[10px] h-4">2</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {[
              { name: "Ben W.", msg: "Can we reschedule Thursday?", time: "11:30" },
              { name: "Priya K.", msg: "Thanks for today!", time: "12:15" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{m.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.msg}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{m.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-border bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Attention
            </p>
            <div className="text-xs bg-card border border-border rounded-lg p-2.5">Lucy F. — test in 3 days</div>
            <div className="text-xs bg-card border border-border rounded-lg p-2.5">2 payments overdue (£120)</div>
            <div className="text-xs bg-card border border-border rounded-lg p-2.5">DBS renewal in 18 days</div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CreditCard, label: "Payment", color: "text-emerald-600" },
            { icon: Route, label: "Gaps", color: "text-amber-600" },
            { icon: Heart, label: "Health", color: "text-pink-600" },
            { icon: Gauge, label: "Telematics", color: "text-primary" },
            { icon: Eye, label: "Website", color: "text-purple-600" },
            { icon: Settings, label: "Settings", color: "text-muted-foreground" },
          ].map((a) => (
            <button key={a.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors cursor-pointer">
              <a.icon className={cn("h-5 w-5", a.color)} />
              <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Design 7: Kanban Board ───────────────────────────────────
function KanbanDesign() {
  const columns = [
    {
      title: "To Prepare",
      color: "border-amber-500/30 bg-amber-500/5",
      headerColor: "text-amber-700",
      items: [
        { label: "Review Sarah's progress notes", type: "prep", icon: Eye },
        { label: "Print route plan for Ben", type: "prep", icon: Route },
        { label: "Chase Lucy's test confirmation", type: "admin", icon: Phone },
      ],
    },
    {
      title: "In Progress",
      color: "border-primary/30 bg-primary/5",
      headerColor: "text-primary",
      items: [
        { label: "Sarah Mitchell — Lesson 8", type: "lesson", icon: Car, highlight: true },
        { label: "Process James's payment", type: "payment", icon: CreditCard },
      ],
    },
    {
      title: "Done Today",
      color: "border-emerald-500/30 bg-emerald-500/5",
      headerColor: "text-emerald-700",
      items: [
        { label: "James Turner — Lesson 3", type: "lesson", icon: CheckCircle2 },
        { label: "Priya Kapoor — Mock Test", type: "lesson", icon: CheckCircle2 },
        { label: "Sent weekly schedule update", type: "admin", icon: Send },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">KD</AvatarFallback></Avatar>
          <div>
            <p className="font-semibold text-sm">Ken Dawson</p>
            <p className="text-xs text-muted-foreground">3/5 lessons · £180 earned</p>
          </div>
        </div>
        <div className="flex gap-4">
          {[
            { label: "Lessons", value: "5", color: "text-primary" },
            { label: "Revenue", value: "£2.3k", color: "text-emerald-600" },
            { label: "Pupils", value: "23", color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.title} className={cn("rounded-xl border-2 p-3", col.color)}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Hash className={cn("h-4 w-4", col.headerColor)} />
              <h3 className={cn("text-sm font-bold", col.headerColor)}>{col.title}</h3>
              <Badge variant="outline" className="ml-auto text-[10px] h-5">{col.items.length}</Badge>
            </div>
            <div className="space-y-2">
              {col.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={cn(
                    "bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-all",
                    item.highlight && "ring-2 ring-primary/20"
                  )}>
                    <div className="flex items-start gap-2.5">
                      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0",
                        item.type === "lesson" ? "text-primary" :
                        item.type === "payment" ? "text-emerald-600" :
                        "text-muted-foreground"
                      )} />
                      <div>
                        <p className="text-sm font-medium leading-snug">{item.label}</p>
                        <Badge variant="outline" className="text-[9px] h-4 mt-1.5">{item.type}</Badge>
                      </div>
                    </div>
                    {item.highlight && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">14 Oak Lane, SE5 8NP</span>
                        <Button size="sm" className="ml-auto h-6 text-[10px] rounded-md">Navigate</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick action strip */}
      <div className="flex gap-2">
        {[
          { icon: Plus, label: "Add Lesson" },
          { icon: CreditCard, label: "Take Payment" },
          { icon: MessageSquare, label: "Messages" },
          { icon: Heart, label: "Health Hub" },
          { icon: Shield, label: "Vehicle" },
        ].map((a) => (
          <Button key={a.label} variant="outline" className="flex-1 rounded-xl h-10 text-xs gap-1.5">
            <a.icon className="h-4 w-4" /> {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ─── Design 8: Minimal Zen ────────────────────────────────────
function MinimalZenDesign() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Greeting */}
      <div className="text-center pt-4">
        <p className="text-muted-foreground text-sm">Thursday, 26 March</p>
        <h1 className="text-2xl font-bold mt-1">Good afternoon, Ken</h1>
        <p className="text-muted-foreground text-sm mt-1">3 lessons done · 2 remaining · £180 earned</p>
      </div>

      {/* Next lesson — hero */}
      <div className="rounded-2xl border-2 border-primary/15 bg-gradient-to-b from-primary/5 to-transparent p-6">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Next Lesson</p>
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">SM</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Sarah Mitchell</h2>
            <p className="text-muted-foreground">Lesson 8 · Roundabouts & Dual Carriageways</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> 14:00 — 15:30</span>
              <span className="text-sm flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> 14 Oak Lane</span>
            </div>
          </div>
          <Button size="lg" className="rounded-xl"><Navigation className="h-4 w-4 mr-2" /> Navigate</Button>
        </div>
      </div>

      {/* Remaining schedule */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Later Today</h3>
        <div className="space-y-2">
          {[
            { time: "16:00", name: "Ben Walker", type: "Assessment" },
            { time: "17:30", name: "Lucy Fisher", type: "Lesson 12" },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors cursor-pointer">
              <span className="font-mono text-sm text-muted-foreground w-12">{l.time}</span>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs bg-muted">{l.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-sm">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.type}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "This Month", value: "£2,340", sub: "+12% vs last", color: "text-emerald-600" },
          { label: "Hours", value: "32h", sub: "of 44h target", color: "text-primary" },
          { label: "Active Pupils", value: "23", sub: "1 at risk", color: "text-amber-600" },
          { label: "Pass Rate", value: "92%", sub: "above average", color: "text-purple-600" },
        ].map((m) => (
          <div key={m.label} className="text-center p-4 rounded-xl bg-card border border-border cursor-pointer hover:shadow-sm transition-all">
            <p className={cn("text-2xl font-bold", m.color)}>{m.value}</p>
            <p className="text-xs font-medium mt-1">{m.label}</p>
            <p className="text-[10px] text-muted-foreground">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Needs attention */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Needs Your Attention</h3>
        <div className="space-y-2">
          {[
            { text: "Lucy Fisher — practical test in 3 days", icon: AlertTriangle, color: "text-amber-600" },
            { text: "2 messages unread", icon: MessageSquare, color: "text-primary" },
            { text: "£120 in overdue payments", icon: PoundSterling, color: "text-red-500" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer">
              <a.icon className={cn("h-5 w-5", a.color)} />
              <span className="text-sm flex-1">{a.text}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 pb-8">
        {[
          { icon: CreditCard, label: "Take Payment", color: "text-emerald-600" },
          { icon: Plus, label: "Add Lesson", color: "text-primary" },
          { icon: Heart, label: "Health Hub", color: "text-pink-600" },
          { icon: Gauge, label: "Telematics", color: "text-primary" },
        ].map((a) => (
          <Button key={a.label} variant="outline" className="h-14 rounded-xl text-sm gap-2 justify-start px-5">
            <a.icon className={cn("h-5 w-5", a.color)} /> {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}



// ─── Design 9: iOS Stack ──────────────────────────────────────
function IOSStackDesign() {
  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Status bar */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-2xl font-bold">Home</p>
        </div>
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">KD</AvatarFallback>
        </Avatar>
      </div>

      {/* Next lesson widget */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Play className="h-3 w-3" /> Next Lesson
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">SM</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-[15px]">Sarah Mitchell</p>
              <p className="text-[13px] text-muted-foreground">Lesson 8 · 14:00</p>
            </div>
            <Button size="sm" className="rounded-full h-9 px-4 text-xs">
              <Navigation className="h-3.5 w-3.5 mr-1" /> Go
            </Button>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[13px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> 14 Oak Lane, SE5 8NP
          </div>
        </div>
      </div>

      {/* Stats group */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        <div className="px-4 py-2.5 bg-muted/30">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Today's Summary</p>
        </div>
        {[
          { label: "Lessons Completed", value: "3 of 5", icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Earned Today", value: "£180", icon: PoundSterling, color: "text-primary" },
          { label: "Hours This Week", value: "32h", icon: Clock, color: "text-purple-600" },
          { label: "Active Pupils", value: "23", icon: Users, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <span className="flex-1 text-[15px]">{s.label}</span>
            <span className="text-[15px] font-semibold text-muted-foreground">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions group */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        <div className="px-4 py-2.5 bg-muted/30">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</p>
        </div>
        {[
          { label: "Take Payment", sub: "3 outstanding", icon: CreditCard, color: "text-emerald-600", badge: "3" },
          { label: "Messages", sub: "2 unread", icon: MessageSquare, color: "text-primary", badge: "2" },
          { label: "Fill Gaps", sub: "4 open slots", icon: Calendar, color: "text-amber-600" },
          { label: "Health Hub", sub: "Wellness & breaks", icon: Heart, color: "text-pink-600" },
          { label: "Vehicle Health", sub: "MOT & service", icon: Shield, color: "text-muted-foreground" },
          { label: "Telematics", sub: "Drive data", icon: Gauge, color: "text-primary" },
        ].map((a) => (
          <div key={a.label} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <a.icon className={cn("h-4 w-4", a.color)} />
            </div>
            <div className="flex-1">
              <p className="text-[15px]">{a.label}</p>
              <p className="text-[13px] text-muted-foreground">{a.sub}</p>
            </div>
            {a.badge && (
              <Badge variant="destructive" className="text-[10px] h-5 rounded-full">{a.badge}</Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* Remaining schedule group */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        <div className="px-4 py-2.5 bg-muted/30">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Remaining Today</p>
        </div>
        {[
          { time: "16:00", name: "Ben Walker", type: "Assessment" },
          { time: "17:30", name: "Lucy Fisher", type: "Lesson 12" },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="font-mono text-[13px] text-muted-foreground w-10">{l.time}</span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-[10px] bg-muted">{l.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-[15px]">{l.name}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Design 10: Radar View ────────────────────────────────────
function RadarDesign() {
  const rings = [
    { label: "Lessons", value: 60, max: 100, color: "stroke-primary", display: "3/5" },
    { label: "Revenue", value: 78, max: 100, color: "stroke-emerald-500", display: "£2.3k" },
    { label: "Hours", value: 72, max: 100, color: "stroke-purple-500", display: "32h" },
  ];

  return (
    <div className="space-y-4">
      {/* Progress rings header */}
      <div className="rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">Daily Progress</h2>
            <p className="text-sm text-muted-foreground">Thursday, 26 March</p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Online
          </Badge>
        </div>

        <div className="flex items-center justify-center gap-12">
          {rings.map((ring) => {
            const circumference = 2 * Math.PI * 40;
            const offset = circumference - (ring.value / ring.max) * circumference;
            return (
              <div key={ring.label} className="relative flex flex-col items-center">
                <svg width="100" height="100" className="-rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" className="stroke-muted/30" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" strokeWidth="6"
                    className={ring.color}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold">{ring.display}</p>
                  <p className="text-[10px] text-muted-foreground">{ring.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next up */}
      <Card className="border-border overflow-hidden">
        <div className="flex">
          <div className="w-1.5 bg-primary" />
          <CardContent className="p-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">SM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">NEXT · 14:00</p>
                  <p className="font-semibold">Sarah Mitchell — Lesson 8</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> 14 Oak Lane, SE5
                  </p>
                </div>
              </div>
              <Button className="rounded-xl" size="sm"><Navigation className="h-4 w-4 mr-1" /> Go</Button>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Metric tiles + actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Pupils", value: "23", color: "text-amber-600 bg-amber-500/10" },
          { icon: Star, label: "Rating", value: "4.9", color: "text-purple-600 bg-purple-500/10" },
          { icon: Target, label: "Pass Rate", value: "92%", color: "text-emerald-600 bg-emerald-500/10" },
          { icon: Flame, label: "Streak", value: "14d", color: "text-red-500 bg-red-500/10" },
        ].map((m) => (
          <Card key={m.label} className="border-border cursor-pointer hover:shadow-sm transition-all">
            <CardContent className="p-4 text-center">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2", m.color)}>
                <m.icon className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-col: schedule + actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Remaining</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { time: "16:00", name: "Ben W.", type: "Assessment" },
              { time: "17:30", name: "Lucy F.", type: "Lesson 12" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{l.time}</span>
                <span className="font-medium flex-1">{l.name}</span>
                <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: CreditCard, label: "Payment", color: "text-emerald-600" },
            { icon: MessageSquare, label: "Messages", color: "text-primary", badge: 2 },
            { icon: Calendar, label: "Fill Gaps", color: "text-amber-600" },
            { icon: Heart, label: "Health", color: "text-pink-600" },
            { icon: Shield, label: "Vehicle", color: "text-muted-foreground" },
            { icon: Gauge, label: "Telematics", color: "text-primary" },
          ].map((a) => (
            <button key={a.label} className="relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-card border border-border hover:bg-muted/30 transition-colors">
              <a.icon className={cn("h-5 w-5", a.color)} />
              <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
              {a.badge && (
                <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                  <span className="text-[9px] text-destructive-foreground font-bold">{a.badge}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Design 11: Newspaper ─────────────────────────────────────
function NewspaperDesign() {
  return (
    <div className="space-y-4">
      {/* Masthead */}
      <div className="text-center border-b-2 border-foreground pb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Thursday, 26 March 2026</p>
        <h1 className="text-3xl font-black tracking-tight mt-1" style={{ fontFamily: "Georgia, serif" }}>The Daily Drive</h1>
        <p className="text-xs text-muted-foreground mt-1">Ken Dawson · Grade A · DVSA Approved</p>
      </div>

      {/* Lead story */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="border-b border-border pb-4">
            <Badge className="bg-primary/10 text-primary border-0 text-[10px] mb-2">HEADLINE</Badge>
            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: "Georgia, serif" }}>
              Next Lesson: Sarah Mitchell at 14:00
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Lesson 8 focuses on roundabouts and dual carriageways. Pickup at 14 Oak Lane, SE5 8NP. 
              Sarah has shown strong progress — mock test readiness at 78%.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="rounded-lg text-xs"><Navigation className="h-3.5 w-3.5 mr-1" /> Navigate</Button>
              <Button size="sm" variant="outline" className="rounded-lg text-xs"><Eye className="h-3.5 w-3.5 mr-1" /> View Profile</Button>
            </div>
          </div>

          {/* Schedule column */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border pb-1 mb-3">Today's Schedule</h3>
            <div className="space-y-2">
              {[
                { time: "09:00", name: "James Turner", type: "Lesson 3", done: true },
                { time: "11:00", name: "Priya Kapoor", type: "Mock Test", done: true },
                { time: "14:00", name: "Sarah Mitchell", type: "Lesson 8", current: true },
                { time: "16:00", name: "Ben Walker", type: "Assessment" },
                { time: "17:30", name: "Lucy Fisher", type: "Lesson 12" },
              ].map((l, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-3 text-sm py-1.5",
                  l.done && "opacity-40 line-through",
                  l.current && "font-semibold text-primary"
                )}>
                  <span className="font-mono text-xs w-10 text-muted-foreground">{l.time}</span>
                  <span className="flex-1">{l.name}</span>
                  <span className="text-xs text-muted-foreground">{l.type}</span>
                  {l.current && <Badge className="bg-primary text-primary-foreground text-[9px] h-4">NOW</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar columns */}
        <div className="space-y-4 border-l border-border pl-4">
          {/* By the numbers */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border pb-1 mb-3">By The Numbers</h3>
            <div className="space-y-3">
              {[
                { label: "Month Revenue", value: "£2,340", change: "+12%" },
                { label: "Weekly Hours", value: "32h", change: "+3h" },
                { label: "Active Pupils", value: "23", change: "−1" },
                { label: "Pass Rate", value: "92%", change: "+4%" },
              ].map((s) => (
                <div key={s.label} className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{s.value}</span>
                    <span className="text-[10px] text-emerald-600 ml-1">{s.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border pb-1 mb-3">Breaking</h3>
            <div className="space-y-2 text-xs">
              <div className="border-l-2 border-red-500 pl-2 py-1">
                <p className="font-semibold">Lucy F. — Test in 3 days</p>
                <p className="text-muted-foreground">Practical test booked</p>
              </div>
              <div className="border-l-2 border-amber-500 pl-2 py-1">
                <p className="font-semibold">2 Payments Overdue</p>
                <p className="text-muted-foreground">£120 outstanding</p>
              </div>
              <div className="border-l-2 border-primary pl-2 py-1">
                <p className="font-semibold">2 New Messages</p>
                <p className="text-muted-foreground">Ben W., Priya K.</p>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border pb-1 mb-3">Quick Links</h3>
            <div className="space-y-1.5">
              {["Take Payment", "Messages", "Fill Gaps", "Health Hub", "Vehicle Health", "Settings"].map((label) => (
                <button key={label} className="block text-xs text-primary hover:underline cursor-pointer">{label} →</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Design 12: Neon Dark ─────────────────────────────────────
function NeonDarkDesign() {
  return (
    <div className="space-y-4">
      {/* Dark header */}
      <div className="rounded-2xl bg-[#0a0a0f] border border-[#1a1a2e] p-5 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,136,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.05),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
                <span className="text-[#00ff88] font-bold text-sm">KD</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Ken Dawson</p>
                <p className="text-xs text-white/40">Grade A · DVSA Approved</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-full px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-[10px] text-[#00ff88] font-medium">ONLINE</span>
            </div>
          </div>

          {/* Neon stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Lessons", value: "5", color: "#00ff88", icon: Calendar },
              { label: "Revenue", value: "£2.3k", color: "#6366f1", icon: PoundSterling },
              { label: "Pupils", value: "23", color: "#f59e0b", icon: Users },
              { label: "Hours", value: "32h", color: "#ec4899", icon: Clock },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 border" style={{
                backgroundColor: `${s.color}08`,
                borderColor: `${s.color}20`,
                boxShadow: `0 0 20px ${s.color}08`,
              }}>
                <s.icon className="h-4 w-4 mb-2" style={{ color: s.color }} />
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next lesson with glow border */}
      <div className="rounded-2xl p-[1px] bg-gradient-to-r from-[#00ff88]/40 via-[#6366f1]/40 to-[#00ff88]/40">
        <div className="rounded-2xl bg-[#0a0a0f] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center">
                <Play className="h-5 w-5 text-[#6366f1]" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-[#00ff88]">NEXT_LESSON // 14:00</p>
                <p className="font-semibold text-white text-sm mt-0.5">Sarah Mitchell — Lesson 8</p>
                <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" /> 14 Oak Lane, SE5 8NP
                </p>
              </div>
            </div>
            <button className="h-10 px-4 rounded-xl text-xs font-semibold text-[#0a0a0f] bg-[#00ff88] hover:bg-[#00ff88]/90 transition-colors flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5" /> Navigate
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Schedule */}
        <div className="col-span-2 rounded-2xl bg-[#0a0a0f] border border-[#1a1a2e] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1a1a2e] flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#00ff88]" />
            <span className="text-[10px] font-mono text-white/50 uppercase">Schedule.today</span>
          </div>
          <div className="divide-y divide-[#1a1a2e]">
            {[
              { time: "09:00", name: "James T.", type: "L3", done: true },
              { time: "11:00", name: "Priya K.", type: "Mock", done: true },
              { time: "14:00", name: "Sarah M.", type: "L8", current: true },
              { time: "16:00", name: "Ben W.", type: "Assess" },
              { time: "17:30", name: "Lucy F.", type: "L12" },
            ].map((l, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm",
                l.done && "opacity-30",
                l.current && "bg-[#00ff88]/5"
              )}>
                <span className="font-mono text-xs text-white/30 w-10">{l.time}</span>
                <span className={cn("flex-1 text-white/80", l.done && "line-through")}>{l.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#1a1a2e] text-white/40">{l.type}</span>
                {l.current && <div className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />}
                {l.done && <CheckCircle2 className="h-3.5 w-3.5 text-[#00ff88]/60" />}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#0a0a0f] border border-[#1a1a2e] p-3">
            <p className="text-[10px] font-mono text-white/30 uppercase mb-2 px-1">Actions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: CreditCard, label: "Pay", color: "#00ff88" },
                { icon: MessageSquare, label: "Msg", color: "#6366f1" },
                { icon: Calendar, label: "Gaps", color: "#f59e0b" },
                { icon: Heart, label: "Health", color: "#ec4899" },
                { icon: Shield, label: "Vehicle", color: "#64748b" },
                { icon: Gauge, label: "Data", color: "#06b6d4" },
              ].map((a) => (
                <button key={a.label} className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-[#1a1a2e]">
                  <a.icon className="h-4 w-4" style={{ color: a.color }} />
                  <span className="text-[9px] font-mono text-white/40">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0a0a0f] border border-[#1a1a2e] p-3">
            <p className="text-[10px] font-mono text-red-400/60 uppercase mb-2 px-1">⚠ Alerts</p>
            <div className="space-y-1.5 text-xs">
              <div className="px-2 py-1.5 rounded border border-red-500/20 bg-red-500/5 text-red-400/80 font-mono">Test → 3 days</div>
              <div className="px-2 py-1.5 rounded border border-amber-500/20 bg-amber-500/5 text-amber-400/80 font-mono">£120 overdue</div>
              <div className="px-2 py-1.5 rounded border border-[#6366f1]/20 bg-[#6366f1]/5 text-[#6366f1]/80 font-mono">2 msgs unread</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// ─── Design 13: Widget Grid ───────────────────────────────────
function WidgetGridDesign() {
  return (
    <div className="space-y-4">
      {/* Top bar with settings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">KD</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">Good afternoon, Ken</p>
            <p className="text-xs text-muted-foreground">Thursday, 26 March</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Online
          </Badge>
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Next Lesson — 2 cols */}
        <Card className="col-span-2 border-border overflow-hidden">
          <div className="flex h-full">
            <div className="w-1.5 bg-primary" />
            <CardContent className="p-4 flex-1">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">Next Up · 14:00</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">SM</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Sarah Mitchell</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> 14 Oak Lane, SE5</p>
                </div>
                <Button size="sm" className="rounded-xl text-xs"><Navigation className="h-3.5 w-3.5 mr-1" /> Go</Button>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Stats widgets */}
        {[
          { icon: PoundSterling, value: "£2,340", label: "This Month", color: "text-emerald-600 bg-emerald-500/10" },
          { icon: Users, value: "23", label: "Pupils", color: "text-amber-600 bg-amber-500/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border cursor-pointer hover:shadow-sm transition-all">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-2", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}

        {/* Schedule widget — 2 cols */}
        <Card className="col-span-2 border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5">
            {[
              { time: "14:00", name: "Sarah M.", type: "L8", current: true },
              { time: "16:00", name: "Ben W.", type: "Assess" },
              { time: "17:30", name: "Lucy F.", type: "L12" },
            ].map((l, i) => (
              <div key={i} className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm", l.current ? "bg-primary/5 border border-primary/20" : "bg-muted/30")}>
                <span className="font-mono text-[11px] text-muted-foreground w-10">{l.time}</span>
                <span className="font-medium flex-1 text-xs">{l.name}</span>
                <Badge variant="outline" className="text-[9px] h-4">{l.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action widgets */}
        {[
          { icon: CreditCard, label: "Payment", sub: "3 due", color: "text-emerald-600 bg-emerald-500/10" },
          { icon: MessageSquare, label: "Messages", sub: "2 new", color: "text-primary bg-primary/10", badge: 2 },
        ].map((a) => (
          <Card key={a.label} className="border-border cursor-pointer hover:shadow-sm transition-all">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center relative">
              {a.badge && <Badge variant="destructive" className="absolute top-2 right-2 text-[9px] h-4 w-4 p-0 flex items-center justify-center">{a.badge}</Badge>}
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-2", a.color)}>
                <a.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">{a.label}</p>
              <p className="text-[10px] text-muted-foreground">{a.sub}</p>
            </CardContent>
          </Card>
        ))}

        {/* More actions row */}
        {[
          { icon: Calendar, label: "Fill Gaps", color: "text-amber-600 bg-amber-500/10" },
          { icon: Heart, label: "Health Hub", color: "text-pink-600 bg-pink-500/10" },
          { icon: Shield, label: "Vehicle", color: "text-muted-foreground bg-muted" },
          { icon: Gauge, label: "Telematics", color: "text-primary bg-primary/10" },
        ].map((a) => (
          <Card key={a.label} className="border-border cursor-pointer hover:shadow-sm transition-all">
            <CardContent className="p-3 flex flex-col items-center justify-center h-full text-center">
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mb-1.5", a.color)}>
                <a.icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium">{a.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Settings tile */}
      <Card className="border-border bg-gradient-to-r from-muted/50 to-transparent cursor-pointer hover:shadow-sm transition-all">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Settings & Preferences</p>
            <p className="text-xs text-muted-foreground">Layout, notifications, profile, billing</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Design 14: Coach Pro ─────────────────────────────────────
function CoachProDesign() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Main content — 3 cols */}
      <div className="col-span-3 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Thursday, 26 March · 3/5 lessons done</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg"><Plus className="h-4 w-4 mr-1" /> Add Lesson</Button>
            <Button size="sm" className="rounded-lg"><CreditCard className="h-4 w-4 mr-1" /> Take Payment</Button>
          </div>
        </div>

        {/* Revenue chart area */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Revenue — March 2026</CardTitle>
              <span className="text-lg font-bold text-emerald-600">£2,340</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-20">
              {[35, 45, 55, 40, 65, 50, 70, 60, 80, 75, 85, 65, 90, 70, 55, 80, 95, 85, 75, 60, 88, 72, 68, 82, 90, 78].map((v, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t relative overflow-hidden" style={{ height: `${v}%` }}>
                  <div className="absolute bottom-0 w-full bg-primary rounded-t" style={{ height: `${v * 0.6}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>1 Mar</span><span>Today</span>
            </div>
          </CardContent>
        </Card>

        {/* Pupil pipeline */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Pupil Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[
                { stage: "New Enquiry", count: 3, color: "bg-blue-500/10 border-blue-500/20 text-blue-700" },
                { stage: "Active", count: 18, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" },
                { stage: "Test Ready", count: 4, color: "bg-amber-500/10 border-amber-500/20 text-amber-700" },
                { stage: "Passed", count: 8, color: "bg-purple-500/10 border-purple-500/20 text-purple-700" },
                { stage: "At Risk", count: 2, color: "bg-red-500/10 border-red-500/20 text-red-700" },
              ].map((p) => (
                <div key={p.stage} className={cn("flex-1 rounded-xl border p-3 text-center cursor-pointer hover:shadow-sm transition-all", p.color)}>
                  <p className="text-2xl font-bold">{p.count}</p>
                  <p className="text-[10px] font-medium mt-0.5">{p.stage}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's schedule */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { time: "09:00", name: "James Turner", type: "Lesson 3", done: true },
              { time: "11:00", name: "Priya Kapoor", type: "Mock Test", done: true },
              { time: "14:00", name: "Sarah Mitchell", type: "Lesson 8", current: true },
              { time: "16:00", name: "Ben Walker", type: "Assessment" },
              { time: "17:30", name: "Lucy Fisher", type: "Lesson 12" },
            ].map((l, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                l.done && "opacity-40", l.current && "bg-primary/5 border border-primary/20"
              )}>
                <span className="font-mono text-xs text-muted-foreground w-10">{l.time}</span>
                <span className={cn("flex-1 font-medium", l.done && "line-through")}>{l.name}</span>
                <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                {l.current && <Badge className="bg-primary text-primary-foreground text-[9px]">NOW</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Settings sidebar — 1 col */}
      <div className="space-y-3">
        {/* Settings card */}
        <Card className="border-border bg-gradient-to-b from-muted/50 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <p className="font-semibold text-sm">Settings</p>
            </div>
            <div className="space-y-1">
              {[
                { label: "Profile & Bio", icon: Users },
                { label: "Notifications", icon: Bell },
                { label: "Layout Style", icon: Layers },
                { label: "Pricing & Rates", icon: PoundSterling },
                { label: "Website Builder", icon: Globe },
                { label: "Integrations", icon: Grip },
              ].map((s) => (
                <button key={s.label} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Alerts</p>
            <div className="space-y-2 text-xs">
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5">Lucy — test in 3 days</div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">£120 overdue</div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">2 unread messages</div>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            {[
              { label: "Pass Rate", value: "92%", color: "text-emerald-600" },
              { label: "Weekly Hours", value: "32h", color: "text-primary" },
              { label: "Rating", value: "4.9★", color: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className={cn("text-sm font-bold", s.color)}>{s.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Design 15: Carousel ──────────────────────────────────────
function CarouselDesign() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">KD</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">Ken Dawson</p>
            <p className="text-xs text-muted-foreground">3/5 done · £180 earned</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-xl"><Settings className="h-5 w-5" /></Button>
      </div>

      {/* Next lesson hero */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Next Up · 14:00</p>
            <h2 className="text-xl font-bold mt-1">Sarah Mitchell</h2>
            <p className="text-sm opacity-70 mt-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> 14 Oak Lane, SE5 8NP</p>
          </div>
          <Button variant="secondary" size="lg" className="rounded-xl shadow-lg"><Navigation className="h-4 w-4 mr-1" /> Go</Button>
        </div>
      </div>

      {/* Schedule row — horizontal scroll */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Today's Schedule</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { time: "09:00", name: "James T.", type: "L3", done: true },
            { time: "11:00", name: "Priya K.", type: "Mock", done: true },
            { time: "14:00", name: "Sarah M.", type: "L8", current: true },
            { time: "16:00", name: "Ben W.", type: "Assess" },
            { time: "17:30", name: "Lucy F.", type: "L12" },
          ].map((l, i) => (
            <Card key={i} className={cn(
              "min-w-[160px] shrink-0 border-border",
              l.current && "ring-2 ring-primary/30",
              l.done && "opacity-40"
            )}>
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{l.time}</span>
                  {l.current && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                  {l.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                </div>
                <p className="text-sm font-semibold">{l.name}</p>
                <Badge variant="outline" className="text-[9px] mt-1">{l.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats row — horizontal */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Performance</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { icon: PoundSterling, value: "£2,340", label: "Revenue", color: "text-emerald-600 bg-emerald-500/10" },
            { icon: Clock, value: "32h", label: "Hours", color: "text-purple-600 bg-purple-500/10" },
            { icon: Users, value: "23", label: "Pupils", color: "text-amber-600 bg-amber-500/10" },
            { icon: Star, value: "4.9", label: "Rating", color: "text-primary bg-primary/10" },
            { icon: Target, value: "92%", label: "Pass Rate", color: "text-emerald-600 bg-emerald-500/10" },
          ].map((s) => (
            <Card key={s.label} className="min-w-[130px] shrink-0 border-border cursor-pointer hover:shadow-sm transition-all">
              <CardContent className="p-4 text-center">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mx-auto mb-1.5", s.color)}>
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions row — horizontal */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Quick Actions</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { icon: CreditCard, label: "Payment", sub: "3 due", accent: "bg-emerald-500/10", iconColor: "text-emerald-600" },
            { icon: MessageSquare, label: "Messages", sub: "2 new", accent: "bg-primary/10", iconColor: "text-primary", badge: 2 },
            { icon: Calendar, label: "Fill Gaps", sub: "4 slots", accent: "bg-amber-500/10", iconColor: "text-amber-600" },
            { icon: Heart, label: "Health", sub: "Wellness", accent: "bg-pink-500/10", iconColor: "text-pink-600" },
            { icon: Shield, label: "Vehicle", sub: "MOT due", accent: "bg-muted", iconColor: "text-muted-foreground" },
            { icon: Gauge, label: "Telematics", sub: "Drive data", accent: "bg-primary/10", iconColor: "text-primary" },
          ].map((a) => (
            <Card key={a.label} className="min-w-[130px] shrink-0 border-border cursor-pointer hover:shadow-sm transition-all">
              <CardContent className="p-4 relative">
                {a.badge && <Badge variant="destructive" className="absolute top-2 right-2 text-[9px] h-4 w-4 p-0 flex items-center justify-center">{a.badge}</Badge>}
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-2", a.accent)}>
                  <a.icon className={cn("h-5 w-5", a.iconColor)} />
                </div>
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="text-[10px] text-muted-foreground">{a.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Settings tile */}
      <Card className="border-border bg-gradient-to-r from-muted/50 to-transparent cursor-pointer hover:shadow-sm transition-all">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Settings & Preferences</p>
            <p className="text-xs text-muted-foreground">Layout, notifications, profile, billing</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Design 16: Tabbed Home ───────────────────────────────────
function TabbedHomeDesign() {
  const [tab, setTab] = useState("today");
  const tabs = [
    { id: "today", label: "Today", icon: Calendar },
    { id: "pupils", label: "Pupils", icon: Users },
    { id: "money", label: "Money", icon: PoundSterling },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Today */}
      {tab === "today" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-primary/15 bg-primary/5 p-5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">Next Up · 14:00</p>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-primary font-bold">SM</AvatarFallback></Avatar>
              <div className="flex-1">
                <p className="font-semibold">Sarah Mitchell — Lesson 8</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> 14 Oak Lane, SE5</p>
              </div>
              <Button className="rounded-xl"><Navigation className="h-4 w-4 mr-1" /> Go</Button>
            </div>
          </div>
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { time: "09:00", name: "James T.", type: "L3", done: true },
                { time: "11:00", name: "Priya K.", type: "Mock", done: true },
                { time: "14:00", name: "Sarah M.", type: "L8", current: true },
                { time: "16:00", name: "Ben W.", type: "Assess" },
                { time: "17:30", name: "Lucy F.", type: "L12" },
              ].map((l, i) => (
                <div key={i} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm", l.done && "opacity-40", l.current && "bg-primary/5 border border-primary/20")}>
                  <span className="font-mono text-xs text-muted-foreground w-10">{l.time}</span>
                  <span className={cn("flex-1 font-medium", l.done && "line-through")}>{l.name}</span>
                  <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: CreditCard, label: "Payment", color: "text-emerald-600 bg-emerald-500/10" },
              { icon: MessageSquare, label: "Messages", color: "text-primary bg-primary/10", badge: 2 },
              { icon: Heart, label: "Health", color: "text-pink-600 bg-pink-500/10" },
            ].map((a) => (
              <Card key={a.label} className="border-border cursor-pointer hover:shadow-sm">
                <CardContent className="p-4 text-center relative">
                  {a.badge && <Badge variant="destructive" className="absolute top-2 right-2 text-[9px] h-4 w-4 p-0 flex items-center justify-center">{a.badge}</Badge>}
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2", a.color)}><a.icon className="h-5 w-5" /></div>
                  <p className="text-sm font-medium">{a.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Pupils */}
      {tab === "pupils" && (
        <Card className="border-border">
          <CardContent className="p-4 divide-y divide-border">
            {[
              { name: "Sarah Mitchell", lessons: 8, status: "Active", color: "bg-emerald-500/10 text-emerald-700" },
              { name: "Ben Walker", lessons: 15, status: "Test Ready", color: "bg-amber-500/10 text-amber-700" },
              { name: "Lucy Fisher", lessons: 12, status: "Test Ready", color: "bg-amber-500/10 text-amber-700" },
              { name: "James Turner", lessons: 3, status: "New", color: "bg-blue-500/10 text-blue-700" },
              { name: "Priya Kapoor", lessons: 20, status: "Active", color: "bg-emerald-500/10 text-emerald-700" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/30 rounded-lg px-2 -mx-2">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">{p.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.lessons} lessons</p>
                </div>
                <Badge className={cn("text-[10px] border-0", p.color)}>{p.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tab: Money */}
      {tab === "money" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Today", value: "£180", color: "text-foreground" },
              { label: "This Week", value: "£720", color: "text-foreground" },
              { label: "This Month", value: "£2,340", color: "text-emerald-600" },
            ].map((s) => (
              <Card key={s.label} className="border-border">
                <CardContent className="p-4 text-center">
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">Recent Payments</p>
              <div className="space-y-2">
                {[
                  { name: "Priya K.", amount: "£36", time: "Today 12:15" },
                  { name: "James T.", amount: "£36", time: "Today 10:00" },
                  { name: "Ben W.", amount: "£72", time: "Yesterday" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="flex-1">{p.name}</span>
                    <span className="font-semibold">{p.amount}</span>
                    <span className="text-xs text-muted-foreground">{p.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Settings */}
      {tab === "settings" && (
        <Card className="border-border">
          <CardContent className="p-0 divide-y divide-border">
            {[
              { label: "Profile & Bio", icon: Users, sub: "Name, photo, qualifications" },
              { label: "Notifications", icon: Bell, sub: "Push, email, SMS preferences" },
              { label: "Layout Style", icon: Layers, sub: "Choose homepage design" },
              { label: "Pricing & Rates", icon: PoundSterling, sub: "Lesson prices and packages" },
              { label: "Website Builder", icon: Globe, sub: "Your public booking page" },
              { label: "Vehicle Details", icon: Car, sub: "Registration, MOT, insurance" },
              { label: "Integrations", icon: Grip, sub: "Calendar sync, payments" },
              { label: "Account & Billing", icon: CreditCard, sub: "Subscription and invoices" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Design 17: Command Palette ───────────────────────────────
function CommandPaletteDesign() {
  return (
    <div className="space-y-4">
      {/* Search / command bar */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-card border-2 border-border rounded-2xl px-5 py-4 focus-within:border-primary/40 transition-colors">
          <Zap className="h-5 w-5 text-primary" />
          <input
            type="text"
            placeholder="Type a command... (e.g. 'take payment', 'add lesson', 'open settings')"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            readOnly
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
        </div>
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { icon: Calendar, label: "Schedule", color: "text-primary" },
          { icon: CreditCard, label: "Payment", color: "text-emerald-600" },
          { icon: MessageSquare, label: "Messages", color: "text-blue-600", badge: 2 },
          { icon: Users, label: "Pupils", color: "text-amber-600" },
          { icon: Heart, label: "Health", color: "text-pink-600" },
          { icon: Settings, label: "Settings", color: "text-muted-foreground" },
        ].map((a) => (
          <button key={a.label} className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border hover:bg-muted/30 transition-colors cursor-pointer">
            {a.badge && <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center"><span className="text-[9px] text-destructive-foreground font-bold">{a.badge}</span></div>}
            <a.icon className={cn("h-5 w-5", a.color)} />
            <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Next lesson */}
        <div className="col-span-2">
          <Card className="border-border overflow-hidden">
            <div className="flex">
              <div className="w-1.5 bg-primary" />
              <CardContent className="p-4 flex-1">
                <p className="text-[10px] font-mono text-primary uppercase mb-2">▸ next_lesson</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">SM</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Sarah Mitchell — 14:00</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> 14 Oak Lane, SE5</p>
                  </div>
                  <Button size="sm" className="rounded-xl text-xs"><Navigation className="h-3.5 w-3.5 mr-1" /> Go</Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Metrics */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">▸ metrics</p>
            {[
              { label: "Revenue", value: "£2,340", color: "text-emerald-600" },
              { label: "Hours", value: "32h", color: "text-purple-600" },
              { label: "Pupils", value: "23", color: "text-amber-600" },
              { label: "Pass Rate", value: "92%", color: "text-primary" },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className={cn("text-sm font-bold", m.color)}>{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Schedule + alerts + settings */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-mono text-muted-foreground uppercase">▸ schedule.remaining</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { time: "14:00", name: "Sarah M.", type: "L8", current: true },
              { time: "16:00", name: "Ben W.", type: "Assess" },
              { time: "17:30", name: "Lucy F.", type: "L12" },
            ].map((l, i) => (
              <div key={i} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm", l.current && "bg-primary/5 border border-primary/20")}>
                <span className="font-mono text-xs text-muted-foreground w-10">{l.time}</span>
                <span className="flex-1 font-medium">{l.name}</span>
                <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                {l.current && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-[10px] font-mono text-amber-600 uppercase mb-2">▸ alerts</p>
              <div className="space-y-1.5 text-xs">
                <div className="border-l-2 border-red-500 pl-2 py-1">Test in 3 days — Lucy F.</div>
                <div className="border-l-2 border-amber-500 pl-2 py-1">£120 overdue</div>
                <div className="border-l-2 border-primary pl-2 py-1">DBS renewal 18 days</div>
              </div>
            </CardContent>
          </Card>

          {/* Settings tile */}
          <Card className="border-border bg-gradient-to-br from-muted/50 to-transparent cursor-pointer hover:shadow-sm transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Settings</p>
                  <p className="text-[10px] text-muted-foreground">Profile, layout, billing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Main Demo Page ──────────────────────────────────────────
export default function DemoInstructorHomeDesigns() {
  const [active, setActive] = useState(designs[0].id);

  const renderDesign = () => {
    switch (active) {
      case "focus-cards": return <FocusCardsDesign />;
      case "timeline": return <TimelineDesign />;
      case "glassmorphic": return <GlassmorphicDesign />;
      case "mission-control": return <MissionControlDesign />;
      case "driver-hub": return <DriverHubDesign />;
      case "split-pane": return <SplitPaneDesign />;
      case "kanban-flow": return <KanbanDesign />;
      case "minimal-zen": return <MinimalZenDesign />;
      case "ios-stack": return <IOSStackDesign />;
      case "radar": return <RadarDesign />;
      case "newspaper": return <NewspaperDesign />;
      case "neon-dark": return <NeonDarkDesign />;
      case "widget-grid": return <WidgetGridDesign />;
      case "coach-pro": return <CoachProDesign />;
      case "card-carousel": return <CarouselDesign />;
      case "tabbed-home": return <TabbedHomeDesign />;
      case "command-palette": return <CommandPaletteDesign />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky selector bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-lg font-bold">Instructor Home — Design Options</h1>
            <Badge variant="outline" className="text-xs">Pick one to apply</Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {designs.map((d) => (
              <button
                key={d.id}
                onClick={() => setActive(d.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0",
                  active === d.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {designs.find((d) => d.id === active)?.description}
          </p>
        </div>
      </div>

      {/* Preview area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {renderDesign()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
