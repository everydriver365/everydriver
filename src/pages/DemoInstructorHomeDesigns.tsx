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

// ─── Main Demo Page ──────────────────────────────────────────
export default function DemoInstructorHomeDesigns() {
  const [active, setActive] = useState(designs[0].id);

  const renderDesign = () => {
    switch (active) {
      case "focus-cards": return <FocusCardsDesign />;
      case "timeline": return <TimelineDesign />;
      case "glassmorphic": return <GlassmorphicDesign />;
      case "mission-control": return <MissionControlDesign />;
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
