import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  User, Calendar, CalendarPlus, MessageSquare, StickyNote,
  PenLine, CreditCard, BookOpen, Car, Sparkles,
  TrendingUp, Route, Video, Gauge, RefreshCw, History, FileText, LucideIcon,
} from "lucide-react";
import { IOSSearchBar } from "@/components/ui/IOSSearchBar";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  desc: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface GroupedNavMenuProps {
  onNavigate: (section: string) => void;
  brandColour?: string;
  selfBookingEnabled?: boolean;
  reflectiveLogsEnabled?: boolean;
}

function getNavGroups(selfBooking: boolean, reflective: boolean): NavGroup[] {
  return [
    {
      title: "Learning",
      items: [
        { id: "schedule", icon: Calendar, label: "My Lessons", desc: "Book, reschedule & manage" },
        ...(selfBooking ? [{ id: "book", icon: CalendarPlus, label: "Book a Lesson", desc: "Find available slots" }] : []),
        { id: "progress", icon: TrendingUp, label: "My Progress", desc: "Skills & driving report" },
        { id: "theory", icon: BookOpen, label: "Theory", desc: "Practice tests & revision" },
        { id: "show-tell", icon: Car, label: "Show Me / Tell Me", desc: "Vehicle safety questions" },
      ],
    },
    {
      title: "My Data",
      items: [
        { id: "lesson-tracks", icon: Route, label: "Lesson Tracks", desc: "View your lesson routes" },
        { id: "lesson-videos", icon: Video, label: "Lesson Videos", desc: "Watch lesson recordings" },
        { id: "driving-style", icon: Gauge, label: "Driving Style", desc: "Speeds, braking & reports" },
        { id: "history", icon: History, label: "Lesson History", desc: "Past lessons & notes" },
      ],
    },
    {
      title: "Account",
      items: [
        { id: "profile", icon: User, label: "My Profile", desc: "Photo & personal details" },
        { id: "payments", icon: CreditCard, label: "Payments", desc: "Balance & history" },
        { id: "documents", icon: FileText, label: "My Documents", desc: "Certificates & receipts" },
        { id: "messages", icon: MessageSquare, label: "Messages", desc: "Chat with instructor" },
        { id: "notes", icon: StickyNote, label: "My Notes", desc: "Personal & shared notes" },
        { id: "swap-settings", icon: RefreshCw, label: "Test swap", desc: "Swap network & alerts" },
      ],
    },
    {
      title: "Tools",
      items: [
        { id: "coaching", icon: Sparkles, label: "AI Coaching", desc: "Personalised insights" },
        { id: "test-requests", icon: RefreshCw, label: "Test Swap", desc: "Request or swap test" },
        ...(reflective ? [{ id: "reflections", icon: PenLine, label: "My Reflections", desc: "Reflect on lessons" }] : []),
      ],
    },
  ];
}

export function GroupedNavMenu({ onNavigate, brandColour, selfBookingEnabled = false, reflectiveLogsEnabled = true }: GroupedNavMenuProps) {
  const color = brandColour || "hsl(var(--primary))";
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Learning");

  const groups = getNavGroups(selfBookingEnabled, reflectiveLogsEnabled);
  const lowerSearch = search.toLowerCase();

  // If searching, show flat filtered list
  const isSearching = search.length > 0;
  const allItems = groups.flatMap((g) => g.items);
  const filteredItems = isSearching
    ? allItems.filter((item) => item.label.toLowerCase().includes(lowerSearch) || item.desc.toLowerCase().includes(lowerSearch))
    : [];

  const renderItem = (item: NavItem) => (
    <button
      key={item.id}
      onClick={() => onNavigate(item.id)}
      className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-secondary/50 active:bg-secondary transition-colors text-left"
    >
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <item.icon className="h-[18px] w-[18px]" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{item.label}</div>
        <div className="text-[11px] text-muted-foreground">{item.desc}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  );

  return (
    <div className="space-y-3">
      <IOSSearchBar value={search} onChange={setSearch} placeholder="Search menu…" />

      {isSearching ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No results</p>
          ) : (
            filteredItems.map(renderItem)
          )}
        </div>
      ) : (
        groups.map((group) => {
          const isOpen = expandedGroup === group.title;
          return (
            <div key={group.title} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedGroup(isOpen ? null : group.title)}
                className="w-full flex items-center justify-between px-4 py-3 active:bg-secondary/50 transition-colors"
              >
                <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.title}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-border border-t border-border">
                      {group.items.map(renderItem)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
}
