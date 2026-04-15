import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Gauge, MapPin, Play, Route, Flame, Shield, AlertTriangle, Camera,
  Mail, Activity, CircleDot, Wrench, Fuel, Zap, ShieldAlert,
  Car, ParkingCircle, Clock, TrendingUp, ChevronRight, 
  Thermometer, Battery, Signal, Navigation, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// Mock data
const mockMileage = [
  { day: "Mon", miles: 42 },
  { day: "Tue", miles: 38 },
  { day: "Wed", miles: 55 },
  { day: "Thu", miles: 31 },
  { day: "Fri", miles: 48 },
  { day: "Sat", miles: 22 },
  { day: "Sun", miles: 0 },
];

const mockAreaData = [
  { time: "6am", speed: 0 },
  { time: "7am", speed: 28 },
  { time: "8am", speed: 35 },
  { time: "9am", speed: 42 },
  { time: "10am", speed: 30 },
  { time: "11am", speed: 38 },
  { time: "12pm", speed: 25 },
  { time: "1pm", speed: 45 },
  { time: "2pm", speed: 33 },
  { time: "3pm", speed: 40 },
  { time: "4pm", speed: 28 },
  { time: "5pm", speed: 0 },
];

// ─── CONCEPT A: "Glass Segments" ───────────────────────────────────────
// iOS Settings-style segmented control with frosted glass cards
function ConceptA() {
  const [activeTab, setActiveTab] = useState("overview");

  const generalTabs = [
    { id: "overview", icon: Gauge, label: "Overview" },
    { id: "livemap", icon: MapPin, label: "Live Map" },
    { id: "lessons", icon: Play, label: "Lessons" },
    { id: "mileage", icon: Route, label: "Mileage" },
    { id: "heatmap", icon: Flame, label: "Heatmap" },
    { id: "alerts", icon: AlertTriangle, label: "Alerts" },
    { id: "dashcam", icon: Camera, label: "Dashcam" },
  ];

  const advancedTabs = [
    { id: "diagnostics", icon: Activity, label: "Diagnostics" },
    { id: "faults", icon: Wrench, label: "Faults", badge: "2" },
    { id: "fuel", icon: Fuel, label: "Fuel" },
    { id: "behaviour", icon: ShieldAlert, label: "Behaviour" },
  ];

  return (
    <div className="bg-background min-h-[700px] rounded-2xl overflow-hidden border border-border">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-5 pt-6 pb-16">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-primary-foreground">Telematics</h1>
          <Badge className="bg-white/20 text-white border-0 text-[10px]">GPS Connected</Badge>
        </div>
        <p className="text-primary-foreground/60 text-xs">Vehicle intelligence & analytics</p>
      </div>

      {/* Content overlapping header */}
      <div className="-mt-10 px-4 space-y-4 pb-6">
        {/* Vehicle status card — frosted glass */}
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Car className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">Ford Focus — KD21 XYZ</p>
              <p className="text-xs text-muted-foreground">Moving · 32 mph · A38 Exeter</p>
            </div>
            <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
          </div>
          
          {/* KPI strip */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Miles", value: "236", icon: Route, color: "text-primary" },
              { label: "Hours", value: "18.2", icon: Clock, color: "text-chart-1" },
              { label: "Score", value: "87", icon: ShieldAlert, color: "text-success" },
              { label: "Fuel", value: "68%", icon: Fuel, color: "text-warning" },
            ].map(kpi => (
              <div key={kpi.label} className="bg-muted/30 rounded-xl p-2.5 text-center">
                <kpi.icon className={cn("h-3.5 w-3.5 mx-auto mb-1", kpi.color)} />
                <p className="text-base font-bold text-foreground">{kpi.value}</p>
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab pills — horizontal scroll */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="flex gap-1.5 w-max">
            {generalTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground border border-border"
                )}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced section */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Advanced
          </p>
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-1.5 w-max">
              {advancedTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all relative",
                    activeTab === tab.id
                      ? "bg-chart-1 text-white shadow-md"
                      : "bg-card text-muted-foreground border border-border"
                  )}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content area — overview example */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Daily Mileage</h3>
            <span className="text-[10px] text-muted-foreground">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={mockMileage}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="miles" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* iOS grouped list for quick access */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border shadow-sm">
          {[
            { icon: Shield, label: "Geofences", value: "3 active", color: "bg-primary/10 text-primary" },
            { icon: Camera, label: "Dashcam Clips", value: "12 new", color: "bg-chart-1/10 text-chart-1" },
            { icon: Mail, label: "Scheduled Reports", value: "Weekly", color: "bg-success/10 text-success" },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted/50">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-left text-sm text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground mr-1">{item.value}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CONCEPT B: "Command Center" ───────────────────────────────────────
// Dark-themed dashboard with live sensor strip and edge-to-edge data density
function ConceptB() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", icon: Gauge, label: "Overview" },
    { id: "live", icon: Activity, label: "Live" },
    { id: "trips", icon: Route, label: "Trips" },
    { id: "safety", icon: ShieldAlert, label: "Safety" },
    { id: "vehicle", icon: Car, label: "Vehicle" },
    { id: "dashcam", icon: Camera, label: "Dashcam" },
    { id: "reports", icon: Mail, label: "Reports" },
  ];

  return (
    <div className="bg-[hsl(220,20%,8%)] min-h-[700px] rounded-2xl overflow-hidden text-white">
      {/* Compact header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Telematics</h1>
          <p className="text-white/40 text-[10px]">Ford Focus · KD21 XYZ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px] font-medium">LIVE</span>
        </div>
      </div>

      {/* Live sensor strip */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { icon: Gauge, value: "32", unit: "mph", color: "text-emerald-400" },
            { icon: Thermometer, value: "14°", unit: "C", color: "text-sky-400" },
            { icon: Battery, value: "12.8", unit: "V", color: "text-amber-400" },
            { icon: Fuel, value: "68", unit: "%", color: "text-orange-400" },
            { icon: Signal, value: "GPS", unit: "OK", color: "text-emerald-400" },
            { icon: Navigation, value: "A38", unit: "", color: "text-white/70" },
          ].map((sensor, i) => (
            <div key={i} className="bg-white/5 rounded-xl px-3 py-2 min-w-[72px] text-center border border-white/5">
              <sensor.icon className={cn("h-3 w-3 mx-auto mb-1", sensor.color)} />
              <p className={cn("text-sm font-bold", sensor.color)}>{sensor.value}</p>
              <p className="text-[8px] text-white/30 uppercase">{sensor.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar — underline style */}
      <div className="px-4 border-b border-white/10 overflow-x-auto no-scrollbar">
        <div className="flex gap-0 w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-white/40 hover:text-white/60"
              )}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* KPI grid — compact dark cards */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Total Miles", value: "236", sub: "33.7 mi/day", icon: Route, color: "text-sky-400", bg: "bg-sky-400/10" },
            { label: "Drive Time", value: "18.2h", sub: "14 trips", icon: Clock, color: "text-violet-400", bg: "bg-violet-400/10" },
            { label: "Safety Score", value: "87/100", sub: "↑ 3 from last week", icon: ShieldAlert, color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Active Faults", value: "2", sub: "1 critical", icon: Wrench, color: "text-red-400", bg: "bg-red-400/10" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", kpi.bg)}>
                  <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
                </div>
              </div>
              <p className="text-lg font-bold text-white">{kpi.value}</p>
              <p className="text-[10px] text-white/40">{kpi.label}</p>
              <p className="text-[9px] text-emerald-400/70 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Speed timeline */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-xs font-medium text-white/60 mb-2">Speed Timeline — Today</p>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={mockAreaData}>
              <defs>
                <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
              <Area type="monotone" dataKey="speed" stroke="hsl(160, 84%, 39%)" fill="url(#speedGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Camera, label: "Clips", count: "12" },
            { icon: Flame, label: "Heatmap", count: "" },
            { icon: Shield, label: "Geofences", count: "3" },
          ].map(action => (
            <button key={action.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5 active:bg-white/10 transition">
              <action.icon className="h-5 w-5 mx-auto mb-1.5 text-white/60" />
              <p className="text-[10px] text-white/80 font-medium">{action.label}</p>
              {action.count && <p className="text-[9px] text-emerald-400">{action.count}</p>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CONCEPT C: "Apple Health" ─────────────────────────────────────────
// Inspired by Apple Health / Fitness app — large hero metric, category cards, clean white
function ConceptC() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  const categories = [
    {
      title: "Journey",
      items: [
        { icon: Route, label: "Mileage", value: "236 mi", trend: "+12%", trendUp: true },
        { icon: Clock, label: "Drive Time", value: "18.2 hrs", trend: "+8%", trendUp: true },
        { icon: Play, label: "Lessons Tracked", value: "14", trend: "", trendUp: true },
      ],
    },
    {
      title: "Safety",
      items: [
        { icon: ShieldAlert, label: "Driver Score", value: "87/100", trend: "+3", trendUp: true },
        { icon: Gauge, label: "Speeding Events", value: "3", trend: "-2", trendUp: true },
        { icon: Zap, label: "Hard Brakes", value: "5", trend: "+1", trendUp: false },
      ],
    },
    {
      title: "Vehicle Health",
      items: [
        { icon: Wrench, label: "Active Faults", value: "2", trend: "", trendUp: false },
        { icon: Fuel, label: "Fuel Level", value: "68%", trend: "", trendUp: true },
        { icon: Thermometer, label: "Engine Temp", value: "Normal", trend: "", trendUp: true },
      ],
    },
  ];

  return (
    <div className="bg-background min-h-[700px] rounded-2xl overflow-hidden border border-border">
      {/* Clean header */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Telematics</p>
        <h1 className="text-[28px] font-bold text-foreground leading-tight">Vehicle Health</h1>
      </div>

      {/* Period selector — Apple Health style */}
      <div className="px-5 mb-4">
        <div className="bg-muted/40 rounded-xl p-1 flex">
          {(["day", "week", "month"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize",
                period === p
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Hero metric ring */}
      <div className="px-5 mb-5 flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--success))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${87 * 2.64} ${264}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-foreground">87</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Score</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs text-foreground">Smooth driving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-xs text-foreground">3 speed events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-xs text-foreground">2 active faults</span>
          </div>
        </div>
      </div>

      {/* Live vehicle strip */}
      <div className="px-5 mb-4">
        <div className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Car className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">KD21 XYZ</p>
            <p className="text-[11px] text-muted-foreground truncate">32 mph · A38, Exeter</p>
          </div>
          <Badge variant="secondary" className="bg-success/10 text-success border-0 text-[10px]">Moving</Badge>
        </div>
      </div>

      {/* Category sections — Apple Health style */}
      <div className="px-5 space-y-4 pb-6">
        {categories.map(cat => (
          <div key={cat.title}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {cat.title}
            </p>
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-sm">
              {cat.items.map(item => (
                <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition">
                  <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center",
                    item.trendUp ? "bg-success/10" : "bg-destructive/10"
                  )}>
                    <item.icon className={cn("h-4 w-4", item.trendUp ? "text-success" : "text-destructive")} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-foreground">{item.label}</p>
                    {item.trend && (
                      <p className={cn("text-[10px]", item.trendUp ? "text-success" : "text-destructive")}>{item.trend}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Mileage chart */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Activity
          </p>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-3">Weekly Mileage</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={mockMileage}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="miles" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Demo Page ────────────────────────────────────────────────────
export default function DemoTelematicsRedesign() {
  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Telematics Page Redesign
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Three iOS-inspired concepts. All maintain the same data & functionality —
            Overview, Live Map, Lessons, Mileage, Heatmap, Geofences, Alerts, Dashcam, Reports + Advanced tabs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Concept A */}
          <div className="space-y-3">
            <div className="text-center">
              <Badge className="bg-primary text-primary-foreground mb-2">Concept A</Badge>
              <h2 className="text-lg font-bold text-foreground">Glass Segments</h2>
              <p className="text-xs text-muted-foreground">
                Frosted glass cards, pill tabs, overlapping hero header.
                iOS Settings meets Maps.
              </p>
            </div>
            <ConceptA />
          </div>

          {/* Concept B */}
          <div className="space-y-3">
            <div className="text-center">
              <Badge className="bg-primary text-primary-foreground mb-2">Concept B</Badge>
              <h2 className="text-lg font-bold text-foreground">Command Center</h2>
              <p className="text-xs text-muted-foreground">
                Dark HUD with live sensor strip, underline tabs,
                data-dense layout. Tesla meets F1.
              </p>
            </div>
            <ConceptB />
          </div>

          {/* Concept C */}
          <div className="space-y-3">
            <div className="text-center">
              <Badge className="bg-primary text-primary-foreground mb-2">Concept C</Badge>
              <h2 className="text-lg font-bold text-foreground">Apple Health</h2>
              <p className="text-xs text-muted-foreground">
                Health/Fitness-style layout with hero score ring,
                category grouped lists, clean white.
              </p>
            </div>
            <ConceptC />
          </div>
        </div>
      </div>
    </div>
  );
}
