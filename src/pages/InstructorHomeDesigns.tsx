import { useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, Check, Sparkles, Layout, Smartphone, Monitor, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useInstructorAppearance, LayoutStyle } from "@/hooks/useInstructorAppearance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DesignOption {
  id: LayoutStyle;
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
  gradient: string;
  mockupSections: { label: string; height: string; color: string }[];
}

const designs: DesignOption[] = [
  {
    id: "dashboard",
    name: "Classic Dashboard",
    subtitle: "The original",
    description: "Hero banner with swipeable progress rings, activity tiles, morning briefing, and your full day agenda. Perfect for instructors who want everything at a glance.",
    tags: ["Hero Banner", "Progress Rings", "Activity Grid"],
    gradient: "from-blue-600 to-indigo-700",
    mockupSections: [
      { label: "Hero + Progress Rings", height: "h-20", color: "bg-gradient-to-r from-blue-500/20 to-indigo-500/20" },
      { label: "Activity Tiles", height: "h-12", color: "bg-blue-500/10" },
      { label: "Next Lesson", height: "h-14", color: "bg-emerald-500/10" },
      { label: "Today's Schedule", height: "h-16", color: "bg-slate-500/10" },
    ],
  },
  {
    id: "ios-native",
    name: "iOS Native",
    subtitle: "Clean & focused",
    description: "Mimics the feel of a native iOS app with a minimal header, prominent next-lesson card with live ETA, and inline actions. Best for instructors who value simplicity.",
    tags: ["Live ETA", "Quick Actions", "Minimal"],
    gradient: "from-slate-700 to-slate-900",
    mockupSections: [
      { label: "Compact Header", height: "h-10", color: "bg-slate-500/15" },
      { label: "Next Lesson + ETA", height: "h-20", color: "bg-gradient-to-r from-emerald-500/15 to-teal-500/15" },
      { label: "Stats Row", height: "h-10", color: "bg-slate-500/10" },
      { label: "Schedule List", height: "h-18", color: "bg-slate-500/8" },
    ],
  },
  {
    id: "clean",
    name: "Clean Pro",
    subtitle: "Business-focused",
    description: "Data-rich dashboard with live stats, payment summaries, and a timeline view. Built for instructors running a professional operation.",
    tags: ["Live Stats", "Payment Summary", "Timeline"],
    gradient: "from-emerald-600 to-teal-700",
    mockupSections: [
      { label: "Status Bar", height: "h-8", color: "bg-emerald-500/15" },
      { label: "KPI Tiles", height: "h-14", color: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10" },
      { label: "Timeline View", height: "h-20", color: "bg-emerald-500/8" },
      { label: "Tomorrow Preview", height: "h-10", color: "bg-teal-500/10" },
    ],
  },
  {
    id: "schedule",
    name: "App Launcher",
    subtitle: "iOS home screen",
    description: "Looks and feels like your phone's home screen with app-style tiles. Tap to launch any feature instantly. Great for tech-savvy instructors.",
    tags: ["App Grid", "Customisable", "Quick Launch"],
    gradient: "from-purple-600 to-violet-700",
    mockupSections: [
      { label: "Hero Image", height: "h-16", color: "bg-gradient-to-r from-purple-500/15 to-violet-500/15" },
      { label: "App Grid (4×2)", height: "h-20", color: "bg-purple-500/10" },
      { label: "Promo Banners", height: "h-12", color: "bg-violet-500/10" },
    ],
  },
  {
    id: "lockscreen",
    name: "Lock Screen",
    subtitle: "Widgets style",
    description: "Inspired by iOS lock screen widgets. Stacked cards for weather, next lesson, and weekly progress — all without unlocking. Minimal interaction needed.",
    tags: ["Widgets", "At-a-Glance", "Weather"],
    gradient: "from-cyan-600 to-blue-700",
    mockupSections: [
      { label: "Time & Weather", height: "h-14", color: "bg-gradient-to-r from-cyan-500/15 to-blue-500/15" },
      { label: "Widget Stack", height: "h-24", color: "bg-cyan-500/10" },
      { label: "Quick Actions", height: "h-10", color: "bg-blue-500/10" },
    ],
  },
  {
    id: "compact",
    name: "Compact",
    subtitle: "Dense & efficient",
    description: "Maximum information density with smaller cards and tighter spacing. See more of your day without scrolling. Ideal for busy schedules.",
    tags: ["Dense Layout", "Less Scrolling", "Efficient"],
    gradient: "from-amber-600 to-orange-700",
    mockupSections: [
      { label: "Slim Header", height: "h-8", color: "bg-amber-500/15" },
      { label: "Compact Stats", height: "h-10", color: "bg-gradient-to-r from-amber-500/10 to-orange-500/10" },
      { label: "Dense Schedule", height: "h-18", color: "bg-amber-500/8" },
      { label: "Quick Access Bar", height: "h-8", color: "bg-orange-500/10" },
    ],
  },
  {
    id: "bestmate",
    name: "Best Mate",
    subtitle: "Friendly & warm",
    description: "Conversational, encouraging tone with motivational messages and milestone celebrations. Makes your app feel like a supportive co-pilot.",
    tags: ["Motivational", "Celebrations", "Friendly"],
    gradient: "from-pink-600 to-rose-700",
    mockupSections: [
      { label: "Greeting + Avatar", height: "h-14", color: "bg-gradient-to-r from-pink-500/15 to-rose-500/15" },
      { label: "Encouragement Card", height: "h-12", color: "bg-pink-500/10" },
      { label: "Your Day", height: "h-16", color: "bg-rose-500/8" },
      { label: "Milestones", height: "h-10", color: "bg-pink-500/10" },
    ],
  },
];

function DesignMockup({ design, isSelected }: { design: DesignOption; isSelected: boolean }) {
  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden border-2 transition-all duration-300",
      isSelected ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "border-border/50 hover:border-border"
    )}>
      {/* Phone frame mockup */}
      <div className="bg-card">
        {/* Status bar */}
        <div className={cn("h-7 flex items-center justify-between px-3 bg-gradient-to-r", design.gradient)}>
          <span className="text-[9px] text-white/80 font-medium">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-1.5 rounded-sm bg-white/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>
        </div>

        {/* Mockup content */}
        <div className="p-2.5 space-y-1.5 min-h-[180px]">
          {design.mockupSections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={cn(
                "rounded-lg flex items-center px-2.5",
                section.height,
                section.color
              )}
            >
              <span className="text-[9px] text-muted-foreground/70 font-medium">{section.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Bottom nav mockup */}
        <div className="flex justify-around py-1.5 border-t border-border/30 px-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-4 h-4 rounded-md bg-muted/40" />
          ))}
        </div>
      </div>

      {/* Selected badge */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
          >
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InstructorHomeDesigns() {
  const { instructor, loading: authLoading } = useInstructorAuth();
  const instructorId = instructor?.id;
  const { layoutStyle, updateAppearance, loading: appearanceLoading } = useInstructorAppearance(instructorId);
  const [selectedDesign, setSelectedDesign] = useState<LayoutStyle | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync selected with current on load
  const currentSelection = selectedDesign ?? layoutStyle;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instructor) return <Navigate to="/instructor/login" replace />;

  const handleApply = async () => {
    if (!currentSelection || currentSelection === layoutStyle) {
      toast.info("This design is already active");
      return;
    }
    setSaving(true);
    try {
      await updateAppearance({ layoutStyle: currentSelection });
      toast.success("Homepage design updated!", { description: `Switched to ${designs.find(d => d.id === currentSelection)?.name}` });
    } catch {
      toast.error("Failed to update design");
    } finally {
      setSaving(false);
    }
  };

  return (
    <InstructorPortalLayout>
      <div className="pb-32">
        {/* Header */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Homepage Designs</h1>
              <p className="text-sm text-muted-foreground">Choose how your dashboard looks</p>
            </div>
          </div>
        </div>

        {/* Current design indicator */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">
              Currently using: <strong>{designs.find(d => d.id === layoutStyle)?.name || "Classic"}</strong>
            </span>
          </div>
        </div>

        {/* Design grid */}
        <div className="px-4 grid grid-cols-2 gap-3">
          {designs.map((design) => (
            <motion.button
              key={design.id}
              onClick={() => setSelectedDesign(design.id)}
              className="text-left focus:outline-none"
              whileTap={{ scale: 0.97 }}
            >
              <DesignMockup
                design={design}
                isSelected={currentSelection === design.id}
              />
              <div className="mt-2 px-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-foreground">{design.name}</h3>
                  {layoutStyle === design.id && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                </div>
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
          ))}
        </div>

        {/* Sticky apply button */}
        <AnimatePresence>
          {selectedDesign && selectedDesign !== layoutStyle && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-20 left-0 right-0 px-4 z-50 md:bottom-6"
            >
              <Button
                onClick={handleApply}
                disabled={saving}
                className="w-full h-12 rounded-2xl text-base font-semibold shadow-xl shadow-primary/30"
                size="lg"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                Apply {designs.find(d => d.id === selectedDesign)?.name}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </InstructorPortalLayout>
  );
}
