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
          <div className="flex gap-2">
            {designs.map((d) => (
              <button
                key={d.id}
                onClick={() => setActive(d.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
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
