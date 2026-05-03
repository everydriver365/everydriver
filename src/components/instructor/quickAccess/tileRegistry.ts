import {
  CalendarDays, Users, MapPin, PoundSterling, Navigation,
  Car, Lightbulb, Crown, CalendarPlus, ListTodo,
  Wrench, Fuel, ClipboardCheck, ArrowLeftRight, Target,
  MessageSquare, MapPinned, BookOpen, Settings,
  Gift, Clock, Receipt, FileBarChart, BarChart3, Moon,
  Megaphone, GraduationCap, Accessibility,
  type LucideIcon,
} from "lucide-react";

/**
 * Stable tile identifiers for the Quick Access section. These IDs are
 * persisted in `instructor_pinned_tiles.tile_id` — never rename without
 * a migration.
 */
export type TileTone = "blue" | "green" | "amber" | "purple" | "red" | "grey";

export interface QuickAccessTile {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: TileTone;
  route: string;
  /** Plan-feature gate — if set, the tile is locked unless the user's
   *  subscription includes this feature. */
  requiredFeature?: string;
}

/**
 * Tone palette — calm category tints used across both rich cards
 * and the compact app-grid. Stroke matches the accent colour.
 */
export const TILE_TONE: Record<TileTone, { bg: string; fg: string }> = {
  blue:   { bg: "#EEF4FF", fg: "#2952B3" },
  green:  { bg: "#E8F3E8", fg: "#3B8B3B" },
  amber:  { bg: "#FBF1DE", fg: "#B8801F" },
  purple: { bg: "#F1ECFA", fg: "#8A5BC9" },
  red:    { bg: "#FBEAEC", fg: "#C8434F" },
  grey:   { bg: "#F2F2F4", fg: "#6E6E73" },
};

/**
 * The full inventory of 33 tiles surfaced in Quick Access. Order here is
 * the alphabetical fallback baseline; the home page re-sorts dynamically.
 *
 * NOTE: every existing route, plan-feature gate, and label is preserved
 * verbatim from the previous SwipeableQuickAccess implementation.
 */
export const QUICK_ACCESS_TILES: QuickAccessTile[] = [
  { id: "course-planner",   title: "Course planner",   subtitle: "Plan to test day",      icon: GraduationCap,   tone: "purple", route: "/instructor/course-planner" },
  { id: "schedule",         title: "Schedule",         subtitle: "Your agenda",           icon: CalendarDays,    tone: "blue",   route: "/instructor/schedule" },
  { id: "accessibility",    title: "Accessibility",    subtitle: "Text size",             icon: Accessibility,   tone: "grey",   route: "/instructor/accessibility" },
  { id: "pupils",           title: "Pupils",           subtitle: "Manage learners",       icon: Users,           tone: "green",  route: "/instructor/pupils" },
  { id: "track-lesson",     title: "Track lesson",     subtitle: "Start GPS",             icon: MapPin,          tone: "red",    route: "/instructor/tracking",          requiredFeature: "telematics" },
  { id: "take-payment",     title: "Take payment",     subtitle: "Record a payment",      icon: PoundSterling,   tone: "amber",  route: "/instructor/pay",               requiredFeature: "payment_tracking" },
  { id: "sat-nav",          title: "Sat nav",          subtitle: "Navigation",            icon: Navigation,      tone: "blue",   route: "/instructor/satnav",            requiredFeature: "telematics" },
  { id: "find-my-car",      title: "Find my car",      subtitle: "Last position",         icon: Car,             tone: "blue",   route: "/instructor/find-my-car",       requiredFeature: "telematics" },
  { id: "plan-ahead",       title: "Plan ahead",       subtitle: "Tomorrow",              icon: Lightbulb,       tone: "purple", route: "/instructor/diary" },
  { id: "your-plan",        title: "Your plan",        subtitle: "Subscription",          icon: Crown,           tone: "grey",   route: "/instructor/plans" },
  { id: "fill-gaps",        title: "Fill gaps",        subtitle: "Open slots",            icon: CalendarPlus,    tone: "green",  route: "/instructor/gaps",              requiredFeature: "sms_notifications" },
  { id: "to-do",            title: "To do",            subtitle: "Task list",             icon: ListTodo,        tone: "purple", route: "/instructor/todos" },
  { id: "vehicle-health",   title: "Vehicle health",   subtitle: "MOT & service",         icon: Wrench,          tone: "grey",   route: "/instructor/vehicle-health",    requiredFeature: "telematics" },
  { id: "find-fuel",        title: "Find fuel",        subtitle: "Nearby stations",       icon: Fuel,            tone: "blue",   route: "/instructor/fuel" },
  { id: "log-test-result",  title: "Log test result",  subtitle: "Record result",         icon: ClipboardCheck,  tone: "purple", route: "/instructor/test-results" },
  { id: "tests",            title: "Tests",            subtitle: "Swap requests",         icon: ArrowLeftRight,  tone: "blue",   route: "/instructor/test-requests" },
  { id: "standards-check",  title: "Standards check",  subtitle: "DVSA triggers",         icon: Target,          tone: "purple", route: "/instructor/standards-check" },
  { id: "messages",         title: "Messages",         subtitle: "Chat",                  icon: MessageSquare,   tone: "green",  route: "/instructor/messages" },
  { id: "find-nearby",      title: "Find nearby",      subtitle: "Toilets, food & more",  icon: MapPin,          tone: "blue",   route: "/instructor/find-nearby" },
  { id: "locations",        title: "Locations",        subtitle: "Saved places",          icon: MapPinned,       tone: "blue",   route: "/instructor/locations" },
  { id: "cpd-log",          title: "CPD log",          subtitle: "Training hours",        icon: BookOpen,        tone: "purple", route: "/instructor/cpd" },
  { id: "settings",         title: "Settings",         subtitle: "Preferences",           icon: Settings,        tone: "grey",   route: "/instructor/settings" },
  { id: "referrals",        title: "Referrals",        subtitle: "Earn rewards",          icon: Gift,            tone: "amber",  route: "/instructor/referrals" },
  { id: "availability",     title: "Availability",     subtitle: "Working hours",         icon: Clock,           tone: "blue",   route: "/instructor/availability" },
  { id: "expenses",         title: "Expenses",         subtitle: "Track costs",           icon: Receipt,         tone: "amber",  route: "/instructor/expenses",          requiredFeature: "expense_tracking" },
  { id: "nearby-adis",      title: "Nearby ADIs",      subtitle: "Friends map",           icon: Users,           tone: "green",  route: "/instructor/nearby-friends" },
  { id: "find-colleague",   title: "Find colleague",   subtitle: "School fleet",          icon: Users,           tone: "green",  route: "/instructor/fleet-map?mode=colleagues" },
  { id: "earnings",         title: "Earnings",         subtitle: "Month end",             icon: FileBarChart,    tone: "amber",  route: "/instructor/month-end",         requiredFeature: "payment_tracking" },
  { id: "weekly-report",    title: "Weekly report",    subtitle: "AI summary",            icon: BarChart3,       tone: "purple", route: "/instructor/weekly-report" },
  { id: "tasks-due",        title: "Tasks due",        subtitle: "Outstanding",           icon: ClipboardCheck,  tone: "amber",  route: "/instructor/outstanding-tasks" },
  { id: "end-of-day",       title: "End of day",       subtitle: "Day summary",           icon: Moon,            tone: "grey",   route: "/instructor/end-of-day" },
  { id: "waiting-room",     title: "Waiting room",     subtitle: "Weekly Zoom",           icon: Users,           tone: "green",  route: "/instructor/waiting-room" },
  { id: "platform-updates", title: "Platform updates", subtitle: "News & ideas",          icon: Megaphone,       tone: "grey",   route: "/instructor/platform-updates" },
];

export const QUICK_ACCESS_TILES_BY_ID: Record<string, QuickAccessTile> =
  Object.fromEntries(QUICK_ACCESS_TILES.map((t) => [t.id, t]));
