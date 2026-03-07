import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, ChevronRight, X, User, Clock, Award, PoundSterling, 
  UserMinus, ArrowRight, Bell, ChevronDown, ChevronUp 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MOCK_NUDGES = [
  {
    id: "dormant-1",
    type: "dormant_pupil",
    title: "Emma Watson hasn't booked in 2+ weeks",
    action_label: "Send check-in",
    priority: 2,
    pupil_name: "Emma Watson",
    pupil_image: null,
    category: "Pupils",
  },
  {
    id: "overdue-payments",
    type: "overdue_payments",
    title: "3 pupils owe £420",
    action_label: "Send reminders",
    priority: 1,
    pupil_name: null,
    category: "Payments",
  },
  {
    id: "test-1",
    type: "upcoming_test",
    title: "Jake Miller's test is in 2 days",
    action_label: "Schedule mock",
    priority: 1,
    pupil_name: "Jake Miller",
    pupil_image: null,
    category: "Tests",
  },
  {
    id: "gap-1",
    type: "schedule_gap",
    title: "2hr gap in your schedule today",
    action_label: "Fill gap",
    priority: 3,
    pupil_name: null,
    category: "Schedule",
  },
  {
    id: "dormant-2",
    type: "dormant_pupil",
    title: "Sarah Chen hasn't booked in 3 weeks",
    action_label: "Send check-in",
    priority: 2,
    pupil_name: "Sarah Chen",
    pupil_image: null,
    category: "Pupils",
  },
];

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getIcon(type: string) {
  switch (type) {
    case "dormant_pupil": return UserMinus;
    case "overdue_payments": return PoundSterling;
    case "upcoming_test": return Award;
    case "schedule_gap": return Clock;
    default: return Bell;
  }
}

// ─── OPTION A: Stacked Cards with Accent Bar ───
function OptionA() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = MOCK_NUDGES.filter(n => !dismissed.has(n.id));

  const priorityAccent: Record<number, string> = {
    1: "from-rose-500 to-rose-400",
    2: "from-amber-500 to-amber-400",
    3: "from-blue-500 to-blue-400",
  };

  const priorityBg: Record<number, string> = {
    1: "bg-rose-50 dark:bg-rose-950/30",
    2: "bg-amber-50 dark:bg-amber-950/30",
    3: "bg-blue-50 dark:bg-blue-950/30",
  };

  return (
    <div className="space-y-2.5">
      <AnimatePresence mode="popLayout">
        {visible.map((nudge, i) => {
          const Icon = getIcon(nudge.type);
          return (
            <motion.div
              key={nudge.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border border-border/50 ${priorityBg[nudge.priority] || priorityBg[3]} shadow-sm`}
            >
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${priorityAccent[nudge.priority] || priorityAccent[3]}`} />
              
              <div className="flex items-center gap-3 p-3.5 pl-4">
                {nudge.pupil_name ? (
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(nudge.pupil_name)} flex items-center justify-center shrink-0 shadow-md`}>
                    <span className="text-xs font-bold text-white">{getInitials(nudge.pupil_name)}</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0 border border-border/30">
                    <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground leading-tight">{nudge.title}</p>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">{nudge.category}</span>
                </div>

                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold whitespace-nowrap hover:bg-primary/90 transition-all active:scale-95 shadow-sm">
                  {nudge.action_label}
                  <ArrowRight className="h-3 w-3" />
                </button>

                <button
                  onClick={() => setDismissed(prev => new Set(prev).add(nudge.id))}
                  className="p-1.5 rounded-full hover:bg-foreground/5 transition-colors -mr-1"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── OPTION B: Horizontal Carousel ───
function OptionB() {
  const priorityBorder: Record<number, string> = {
    1: "border-rose-300 dark:border-rose-700",
    2: "border-amber-300 dark:border-amber-700",
    3: "border-blue-300 dark:border-blue-700",
  };

  const priorityDot: Record<number, string> = {
    1: "bg-rose-500",
    2: "bg-amber-500",
    3: "bg-blue-500",
  };

  return (
    <div className="-mx-4">
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {MOCK_NUDGES.map((nudge) => {
          const Icon = getIcon(nudge.type);
          return (
            <motion.div
              key={nudge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`snap-start shrink-0 w-[260px] rounded-2xl border-2 ${priorityBorder[nudge.priority] || priorityBorder[3]} bg-card p-4 shadow-sm`}
            >
              <div className="flex items-start gap-3 mb-3">
                {nudge.pupil_name ? (
                  <div className={`w-9 h-9 rounded-full ${getAvatarColor(nudge.pupil_name)} flex items-center justify-center shrink-0`}>
                    <span className="text-[10px] font-bold text-white">{getInitials(nudge.pupil_name)}</span>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center shrink-0 border border-border/30">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${priorityDot[nudge.priority]}`} />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{nudge.category}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground leading-snug">{nudge.title}</p>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-[12px] font-semibold hover:bg-primary/20 transition-colors active:scale-[0.98]">
                {nudge.action_label}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OPTION C: Notification Feed ───
function OptionC() {
  const [expanded, setExpanded] = useState(true);
  const grouped = MOCK_NUDGES.reduce((acc, n) => {
    (acc[n.category] = acc[n.category] || []).push(n);
    return acc;
  }, {} as Record<string, typeof MOCK_NUDGES>);

  const categoryOrder = ["Payments", "Tests", "Pupils", "Schedule"];
  const categoryIcon: Record<string, string> = {
    Payments: "🔴",
    Tests: "🟡",
    Pupils: "🟠",
    Schedule: "🔵",
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[13px] font-semibold text-foreground">Action Items</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {MOCK_NUDGES.length}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30">
              {categoryOrder.map(cat => {
                const items = grouped[cat];
                if (!items) return null;
                return (
                  <div key={cat}>
                    <div className="px-4 py-1.5 bg-muted/5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {categoryIcon[cat]} {cat}
                      </span>
                    </div>
                    {items.map((nudge, i) => (
                      <div
                        key={nudge.id}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-muted/5 transition-colors ${i < items.length - 1 ? "border-b border-border/20" : ""}`}
                      >
                        {nudge.pupil_name ? (
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(nudge.pupil_name)} flex items-center justify-center shrink-0`}>
                            <span className="text-[10px] font-bold text-white">{getInitials(nudge.pupil_name)}</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted/15 flex items-center justify-center shrink-0">
                            {(() => { const Icon = getIcon(nudge.type); return <Icon className="h-3.5 w-3.5 text-muted-foreground" />; })()}
                          </div>
                        )}
                        <p className="flex-1 text-[12px] text-foreground leading-tight">{nudge.title}</p>
                        <button className="text-[11px] font-semibold text-primary hover:underline whitespace-nowrap">
                          {nudge.action_label} →
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── DEMO PAGE ───
export default function SmartNudgesDemo() {
  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-md mx-auto space-y-10">
        <div className="text-center pt-6 pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Smart Nudges Redesign</h1>
          </div>
          <p className="text-sm text-muted-foreground">3 design concepts — tap, swipe & interact</p>
        </div>

        {/* Option A */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary text-primary-foreground text-[10px]">A</Badge>
            <h2 className="text-sm font-bold text-foreground">Stacked Cards + Accent Bar</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Bold cards with coloured left accent, dismiss with ✕, priority-based backgrounds</p>
          <OptionA />
        </section>

        {/* Option B */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary text-primary-foreground text-[10px]">B</Badge>
            <h2 className="text-sm font-bold text-foreground">Horizontal Carousel</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Swipeable pill cards, saves vertical space, priority colour dots</p>
          <OptionB />
        </section>

        {/* Option C */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary text-primary-foreground text-[10px]">C</Badge>
            <h2 className="text-sm font-bold text-foreground">Notification Feed</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Collapsible panel, grouped by category, inline action links</p>
          <OptionC />
        </section>
      </div>
    </div>
  );
}
