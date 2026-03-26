import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Sparkles, ArrowLeft, Monitor, 
  LayoutDashboard, Columns3, Grid3X3, Zap,
  Users, CreditCard, MessageCircle, Calendar, TrendingUp, Settings, MapPin, Bell,
  ChevronRight, Search, PoundSterling, Shield, BookOpen, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type DesignId = "current" | "command-center" | "kanban-ops" | "metro-tiles";

interface AdminDesignOption {
  id: DesignId;
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
  gradient: string;
}

const designs: AdminDesignOption[] = [
  {
    id: "current",
    name: "Settings Grid",
    subtitle: "Current layout",
    description: "iOS Settings-style grouped list with categorised links, stat cards, and a search bar. Familiar and functional.",
    tags: ["Grouped Lists", "Search Bar", "Stat Cards"],
    gradient: "from-slate-700 to-slate-900",
  },
  {
    id: "command-center",
    name: "Command Center",
    subtitle: "Mission control",
    description: "Split-panel layout with a live activity feed on the left, KPI dashboard top-right, and quick-action command palette. Built for rapid decision-making.",
    tags: ["Live Feed", "KPI Dashboard", "Command Palette"],
    gradient: "from-blue-700 to-indigo-900",
  },
  {
    id: "kanban-ops",
    name: "Kanban Ops",
    subtitle: "Pipeline view",
    description: "Horizontal kanban columns for Enquiries → Onboarding → Active → At Risk. Drag cards between stages. Perfect for managing instructor lifecycle.",
    tags: ["Drag & Drop", "Pipeline", "Visual Workflow"],
    gradient: "from-emerald-700 to-teal-900",
  },
  {
    id: "metro-tiles",
    name: "Metro Dashboard",
    subtitle: "Data-dense tiles",
    description: "Windows Metro-inspired live tiles of varying sizes showing real-time stats, alerts, and shortcuts. Maximum information density with bold colour blocks.",
    tags: ["Live Tiles", "Real-time", "Bold Colours"],
    gradient: "from-purple-700 to-violet-900",
  },
];

/* ── Mini Mockup Renderers ── */

function CurrentMockup() {
  return (
    <div className="p-2 space-y-1.5">
      <div className="h-6 rounded-md bg-primary/10 flex items-center px-2 gap-1">
        <Search className="h-2.5 w-2.5 text-muted-foreground/50" />
        <div className="h-1.5 w-12 rounded bg-muted/40" />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-8 rounded-md bg-muted/30 flex flex-col items-center justify-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded bg-primary/20" />
            <div className="h-1 w-5 rounded bg-muted/50" />
          </div>
        ))}
      </div>
      {["Communications", "People", "Finance"].map(label => (
        <div key={label} className="rounded-md bg-card border border-border/30 p-1.5">
          <div className="text-[7px] font-bold text-muted-foreground/60 mb-1">{label}</div>
          {[1,2].map(i => (
            <div key={i} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-sm bg-primary/30" />
                <div className="h-1 w-10 rounded bg-muted/40" />
              </div>
              <ChevronRight className="h-2 w-2 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CommandCenterMockup() {
  return (
    <div className="p-2 flex gap-1.5 h-full">
      {/* Left: Activity feed */}
      <div className="flex-1 space-y-1">
        <div className="text-[7px] font-bold text-muted-foreground/60">LIVE FEED</div>
        {[
          { color: "bg-emerald-500/20", icon: "●" },
          { color: "bg-blue-500/20", icon: "●" },
          { color: "bg-amber-500/20", icon: "●" },
          { color: "bg-red-500/20", icon: "●" },
          { color: "bg-purple-500/20", icon: "●" },
        ].map((item, i) => (
          <div key={i} className={cn("h-5 rounded-md flex items-center px-1.5 gap-1", item.color)}>
            <div className="w-1 h-1 rounded-full bg-current opacity-60" />
            <div className="h-1 flex-1 rounded bg-foreground/10" />
          </div>
        ))}
      </div>
      {/* Right: KPIs + actions */}
      <div className="flex-1 space-y-1">
        <div className="grid grid-cols-2 gap-1">
          {["£48k", "86", "342", "12"].map((val, i) => (
            <div key={i} className="h-8 rounded-md bg-gradient-to-br from-primary/15 to-primary/5 flex flex-col items-center justify-center">
              <span className="text-[8px] font-bold text-foreground/80">{val}</span>
              <div className="h-0.5 w-4 rounded bg-muted/40 mt-0.5" />
            </div>
          ))}
        </div>
        <div className="text-[7px] font-bold text-muted-foreground/60">ACTIONS</div>
        <div className="space-y-0.5">
          {["New Booking", "Send Alert", "View Map"].map(label => (
            <div key={label} className="h-4 rounded bg-primary/10 flex items-center px-1.5">
              <div className="text-[6px] text-primary/70 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanMockup() {
  const columns = [
    { title: "Enquiry", color: "bg-amber-500/15", cards: 3 },
    { title: "Onboarding", color: "bg-blue-500/15", cards: 2 },
    { title: "Active", color: "bg-emerald-500/15", cards: 4 },
    { title: "At Risk", color: "bg-red-500/15", cards: 1 },
  ];
  return (
    <div className="p-2 flex gap-1 overflow-hidden h-full">
      {columns.map(col => (
        <div key={col.title} className="flex-1 min-w-0">
          <div className="text-[6px] font-bold text-muted-foreground/60 mb-1 truncate">{col.title}</div>
          <div className="space-y-0.5">
            {Array.from({ length: col.cards }).map((_, i) => (
              <div key={i} className={cn("h-5 rounded-md flex items-center px-1 gap-0.5", col.color)}>
                <div className="w-2 h-2 rounded-full bg-foreground/10" />
                <div className="h-1 flex-1 rounded bg-foreground/8" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MetroMockup() {
  const tiles = [
    { w: "col-span-2", h: "h-10", color: "bg-blue-500/20", label: "Revenue" },
    { w: "col-span-1", h: "h-10", color: "bg-emerald-500/25", label: "Active" },
    { w: "col-span-1", h: "h-10", color: "bg-amber-500/20", label: "Alerts" },
    { w: "col-span-1", h: "h-8", color: "bg-purple-500/20", label: "Msgs" },
    { w: "col-span-1", h: "h-8", color: "bg-red-500/15", label: "Churn" },
    { w: "col-span-2", h: "h-8", color: "bg-cyan-500/15", label: "Live Map" },
    { w: "col-span-1", h: "h-6", color: "bg-pink-500/15", label: "Pupils" },
    { w: "col-span-1", h: "h-6", color: "bg-indigo-500/20", label: "Courses" },
    { w: "col-span-2", h: "h-6", color: "bg-teal-500/15", label: "Compliance" },
  ];
  return (
    <div className="p-2 grid grid-cols-3 gap-1">
      {tiles.map((tile, i) => (
        <div key={i} className={cn("rounded-md flex items-end p-1", tile.w, tile.h, tile.color)}>
          <span className="text-[6px] font-bold text-foreground/50">{tile.label}</span>
        </div>
      ))}
    </div>
  );
}

const mockupRenderers: Record<DesignId, () => JSX.Element> = {
  current: CurrentMockup,
  "command-center": CommandCenterMockup,
  "kanban-ops": KanbanMockup,
  "metro-tiles": MetroMockup,
};

function DesignCard({ design, isSelected, onClick }: { design: AdminDesignOption; isSelected: boolean; onClick: () => void }) {
  const Mockup = mockupRenderers[design.id];
  return (
    <motion.button
      onClick={onClick}
      className="text-left focus:outline-none w-full"
      whileTap={{ scale: 0.97 }}
    >
      <div className={cn(
        "relative rounded-2xl overflow-hidden border-2 transition-all duration-300",
        isSelected ? "border-primary shadow-lg shadow-primary/20 scale-[1.01]" : "border-border/50 hover:border-border"
      )}>
        {/* Header bar */}
        <div className={cn("h-6 flex items-center justify-between px-2.5 bg-gradient-to-r", design.gradient)}>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-[8px] text-white/60 font-medium">admin portal</span>
        </div>

        {/* Sidebar + content mockup */}
        <div className="bg-card flex min-h-[160px]">
          {/* Mini sidebar */}
          <div className="w-8 border-r border-border/30 py-2 flex flex-col items-center gap-1.5">
            {[LayoutDashboard, Users, CreditCard, MessageCircle, Settings].map((Icon, i) => (
              <Icon key={i} className="h-2.5 w-2.5 text-muted-foreground/40" />
            ))}
          </div>
          {/* Content */}
          <div className="flex-1">
            <Mockup />
          </div>
        </div>

        {/* Selected badge */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md"
            >
              <Check className="h-3 w-3 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Labels */}
      <div className="mt-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-foreground">{design.name}</h3>
          {design.id === "current" && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Active</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/80 italic">{design.subtitle}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{design.description}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {design.tags.map(tag => (
            <span key={tag} className="text-[9px] font-medium text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
}

export default function DemoAdminDesigns() {
  const [selectedDesign, setSelectedDesign] = useState<DesignId>("current");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Portal Designs</h1>
            <p className="text-xs text-muted-foreground">Choose a layout for the admin dashboard</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Intro */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10 mb-6">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm text-foreground">
            These are concept designs for the admin portal overview. Tap to explore each option.
          </span>
        </div>

        {/* Design grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {designs.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              isSelected={selectedDesign === design.id}
              onClick={() => setSelectedDesign(design.id)}
            />
          ))}
        </div>

        {/* Expanded preview */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDesign}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8"
          >
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              {designs.find(d => d.id === selectedDesign)?.name} — Full Preview
            </h2>
            <div className="rounded-2xl border-2 border-border overflow-hidden bg-card shadow-lg">
              {/* Desktop browser chrome */}
              <div className={cn("h-8 flex items-center justify-between px-3 bg-gradient-to-r", designs.find(d => d.id === selectedDesign)?.gradient)}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-4 rounded bg-white/10 flex items-center justify-center">
                    <span className="text-[9px] text-white/50">admin.drive365.co.uk</span>
                  </div>
                </div>
                <div className="w-8" />
              </div>

              {/* Content area */}
              <div className="flex min-h-[320px]">
                {/* Sidebar */}
                <div className="w-44 border-r border-border/40 bg-muted/20 py-3 px-2 hidden sm:block">
                  <div className="flex items-center gap-2 px-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Drive365</span>
                  </div>
                  {[
                    { icon: LayoutDashboard, label: "Overview", active: true },
                    { icon: Users, label: "Instructors" },
                    { icon: BookOpen, label: "Courses" },
                    { icon: CreditCard, label: "Payments" },
                    { icon: MessageCircle, label: "Messages" },
                    { icon: MapPin, label: "Live Map" },
                    { icon: TrendingUp, label: "Analytics" },
                    { icon: Globe, label: "Websites" },
                    { icon: Shield, label: "Compliance" },
                    { icon: Settings, label: "Settings" },
                  ].map(item => (
                    <div key={item.label} className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium mb-0.5",
                      item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                    )}>
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main content — large mockup */}
                <div className="flex-1 p-4">
                  {selectedDesign === "current" && <LargeCurrentMockup />}
                  {selectedDesign === "command-center" && <LargeCommandCenterMockup />}
                  {selectedDesign === "kanban-ops" && <LargeKanbanMockup />}
                  {selectedDesign === "metro-tiles" && <LargeMetroMockup />}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="h-20" />
      </div>
    </div>
  );
}

/* ── Large Preview Mockups ── */

function LargeCurrentMockup() {
  return (
    <div className="space-y-4">
      <div className="h-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center px-3 gap-2">
        <Search className="h-4 w-4 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground/50">Search bookings...</span>
        <div className="ml-auto flex gap-1.5">
          <div className="h-6 w-16 rounded-md bg-muted/40" />
          <div className="h-6 w-20 rounded-md bg-primary/20" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {["Total Pupils", "Instructors", "Lessons Today", "Revenue"].map(label => (
          <div key={label} className="rounded-lg bg-card border border-border/40 p-3">
            <div className="text-[10px] text-muted-foreground">{label}</div>
            <div className="text-lg font-bold text-foreground mt-1">—</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {["Communications", "People", "Finance & Payments", "Products"].map(cat => (
          <div key={cat} className="rounded-lg bg-card border border-border/40 p-3">
            <div className="text-xs font-semibold text-foreground mb-2">{cat}</div>
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center justify-between py-1.5 border-t border-border/20">
                <div className="h-2 w-24 rounded bg-muted/40" />
                <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function LargeCommandCenterMockup() {
  return (
    <div className="flex gap-4 h-full">
      {/* Left: Live feed */}
      <div className="flex-1 space-y-2">
        <div className="text-xs font-bold text-muted-foreground mb-2">LIVE ACTIVITY</div>
        {[
          { color: "bg-emerald-500/15 border-l-2 border-emerald-500", text: "New booking — Sarah M." },
          { color: "bg-blue-500/15 border-l-2 border-blue-500", text: "Payment received — £120" },
          { color: "bg-amber-500/15 border-l-2 border-amber-500", text: "Enquiry from James W." },
          { color: "bg-red-500/15 border-l-2 border-red-500", text: "Churn alert — 2 at risk" },
          { color: "bg-purple-500/15 border-l-2 border-purple-500", text: "ADI badge expiring — Mike" },
          { color: "bg-cyan-500/15 border-l-2 border-cyan-500", text: "New subscriber — Pro plan" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn("rounded-lg p-2.5 text-[11px] text-foreground/70", item.color)}
          >
            {item.text}
          </motion.div>
        ))}
      </div>
      {/* Right: KPIs + commands */}
      <div className="w-48 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Revenue", value: "£48.2k", color: "from-emerald-500/10 to-emerald-500/5" },
            { label: "Instructors", value: "86", color: "from-blue-500/10 to-blue-500/5" },
            { label: "Lessons", value: "342", color: "from-amber-500/10 to-amber-500/5" },
            { label: "Alerts", value: "12", color: "from-red-500/10 to-red-500/5" },
          ].map(kpi => (
            <div key={kpi.label} className={cn("rounded-lg bg-gradient-to-br p-2.5 text-center", kpi.color)}>
              <div className="text-sm font-bold text-foreground">{kpi.value}</div>
              <div className="text-[9px] text-muted-foreground">{kpi.label}</div>
            </div>
          ))}
        </div>
        <div className="text-xs font-bold text-muted-foreground">QUICK ACTIONS</div>
        {["+ New Booking", "⚡ Send Alert", "🗺️ Live Map", "📊 Reports"].map(action => (
          <div key={action} className="h-7 rounded-lg bg-primary/8 hover:bg-primary/15 flex items-center px-2.5 text-[11px] text-foreground/70 cursor-pointer transition-colors">
            {action}
          </div>
        ))}
      </div>
    </div>
  );
}

function LargeKanbanMockup() {
  const columns = [
    { title: "Enquiries", color: "border-amber-500", bg: "bg-amber-500/8", cards: ["Sarah M.", "James W.", "Amy K."] },
    { title: "Onboarding", color: "border-blue-500", bg: "bg-blue-500/8", cards: ["Tom B.", "Lisa R."] },
    { title: "Active", color: "border-emerald-500", bg: "bg-emerald-500/8", cards: ["Mike D.", "Jane S.", "Chris P.", "Alex T."] },
    { title: "At Risk", color: "border-red-500", bg: "bg-red-500/8", cards: ["Dan H."] },
  ];
  return (
    <div className="flex gap-3 h-full overflow-x-auto">
      {columns.map(col => (
        <div key={col.title} className="flex-1 min-w-[120px]">
          <div className={cn("text-xs font-bold text-foreground mb-2 pb-1 border-b-2", col.color)}>
            {col.title}
            <span className="ml-1.5 text-muted-foreground font-normal">({col.cards.length})</span>
          </div>
          <div className="space-y-1.5">
            {col.cards.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn("rounded-lg p-2.5 border border-border/30", col.bg)}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[8px] font-bold text-foreground/50">
                    {name.charAt(0)}
                  </div>
                  <span className="text-[11px] font-medium text-foreground/80">{name}</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  <div className="h-1 w-6 rounded bg-foreground/10" />
                  <div className="h-1 w-4 rounded bg-foreground/8" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LargeMetroMockup() {
  const tiles = [
    { w: "col-span-2 row-span-2", color: "bg-gradient-to-br from-blue-500/20 to-blue-600/10", label: "Revenue", value: "£48.2k", sub: "+18% this month" },
    { w: "col-span-1", color: "bg-emerald-500/20", label: "Active", value: "86" },
    { w: "col-span-1", color: "bg-amber-500/20", label: "Alerts", value: "12" },
    { w: "col-span-1", color: "bg-red-500/15", label: "At Risk", value: "3" },
    { w: "col-span-1", color: "bg-purple-500/20", label: "Messages", value: "24" },
    { w: "col-span-2", color: "bg-gradient-to-r from-cyan-500/15 to-teal-500/10", label: "Live Instructor Map", value: "" },
    { w: "col-span-1", color: "bg-pink-500/15", label: "Pupils", value: "1,247" },
    { w: "col-span-1", color: "bg-indigo-500/15", label: "Courses", value: "14" },
    { w: "col-span-1", color: "bg-orange-500/15", label: "Bookings", value: "89" },
    { w: "col-span-1", color: "bg-teal-500/20", label: "Compliance", value: "94%" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 auto-rows-[60px]">
      {tiles.map((tile, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={cn("rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:brightness-110 transition-all", tile.w, tile.color)}
        >
          <div>
            {tile.value && <div className="text-lg font-bold text-foreground">{tile.value}</div>}
            {tile.sub && <div className="text-[9px] text-emerald-600">{tile.sub}</div>}
          </div>
          <div className="text-[10px] font-semibold text-foreground/60">{tile.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
