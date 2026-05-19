import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, Calendar, Users, ClipboardCheck,
  Award, Repeat2, Search, CreditCard, Receipt, Clock,
  BarChart3, Globe, TrendingUp, Wallet,
  LogOut, PanelLeftClose, PanelLeft, ChevronRight,
  NotebookPen, BookOpenCheck, GraduationCap, ListChecks, UserPlus2,
  MapPin, Map, Gauge, Navigation, Video, Route, Fuel, Car,
  Mic, Banknote, Coins, Star, Share2, CalendarSearch,
  StickyNote, CheckSquare, Pencil, FileText, FolderLock, FileCheck2,
  ClipboardList, Sunrise, Sunset, ClipboardCheck as ClipboardCheck2, Layers, Sparkles,
  MessageCircleQuestion, DoorOpen, ShoppingCart, Trophy, BadgeCheck,
  Crosshair, LayoutGrid, Eye, Camera, UsersRound, Building2,
  MailPlus, LifeBuoy, MessagesSquare, Hash, HelpCircle, RefreshCw,
  Heart, Activity, Settings as SettingsIcon, Pin, PinOff,
  User, Lock, Bell, MessageCircle, Palette, Database, Phone, Tag, ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useModules } from "@/context/ModulesContext";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface NavItem { label: string; to: string; icon: React.ElementType; badge?: string; moduleId?: string; }
interface NavSection { label: string; items: NavItem[]; }

const SECTIONS: NavSection[] = [
  { label: "Overview", items: [
    { label: "Dashboard", to: "/instructor", icon: LayoutDashboard, moduleId: "dashboard" },
    { label: "Schedule", to: "/instructor/schedule", icon: Calendar, moduleId: "schedule" },
    { label: "Lesson History", to: "/instructor/diary", icon: NotebookPen },
    { label: "Find slot", to: "/instructor/find-appointment", icon: Search },
    { label: "Next slot", to: "/instructor/find-appointment?next=1", icon: CalendarSearch },
  ]},
  { label: "Teaching", items: [
    { label: "Pupils", to: "/instructor/pupils", icon: Users, moduleId: "pupils" },
    { label: "Course Planner", to: "/instructor/course-planner", icon: BookOpenCheck },
    { label: "Waiting List", to: "/instructor/waiting-list", icon: UserPlus2 },
    { label: "Fill Gaps", to: "/instructor/gaps", icon: ListChecks },
    { label: "Driving Tests", to: "/instructor/test-results", icon: Award, moduleId: "tests" },
    { label: "Test Swap", to: "/instructor/test-requests", icon: Repeat2, moduleId: "testswap" },
    { label: "Standards Check", to: "/instructor/standards-check", icon: GraduationCap },
    { label: "CPD", to: "/instructor/cpd", icon: Award },
    { label: "Working hours", to: "/instructor/settings/working-hours", icon: Clock },
    { label: "Rates & coverage", to: "/instructor/settings/rates-coverage", icon: MapPin },
    { label: "How pupils book", to: "/instructor/settings/how-pupils-book", icon: BookOpenCheck },
    { label: "Discounts & packages", to: "/instructor/settings/discounts-packages", icon: Tag },
  ]},
  { label: "My Courses", items: [
    { label: "My Courses", to: "/instructor/settings/my-courses", icon: BookOpenCheck },
  ]},
  { label: "Vehicle & Tracking", items: [
    { label: "Live Tracking", to: "/instructor/tracking", icon: MapPin, moduleId: "telematics" },
    { label: "Fleet Map", to: "/instructor/fleet-map", icon: Map, moduleId: "telematics" },
    { label: "Vehicle Health", to: "/instructor/vehicle-health", icon: Gauge, moduleId: "telematics" },
    { label: "SatNav", to: "/instructor/satnav", icon: Navigation, moduleId: "telematics" },
    { label: "Dashcam", to: "/instructor/dashcam", icon: Video, moduleId: "dashcam" },
    { label: "Mileage", to: "/instructor/mileage", icon: Car },
    { label: "Fuel", to: "/instructor/fuel", icon: Fuel },
    { label: "Saved Routes", to: "/instructor/routes", icon: Route, moduleId: "telematics" },
    { label: "Find my car", to: "/instructor/find-my-car", icon: Crosshair, moduleId: "telematics" },
    { label: "Fleet dashboard", to: "/instructor/fleet-dashboard", icon: LayoutGrid, moduleId: "telematics" },
    { label: "Overspeed history", to: "/instructor/overspeed-history", icon: Eye, moduleId: "telematics" },
    { label: "Dashcam gallery", to: "/instructor/dashcam", icon: Camera, moduleId: "dashcam" },
    { label: "Nearby instructors", to: "/instructor/nearby-friends", icon: UsersRound },
    { label: "Locations", to: "/instructor/locations", icon: Building2 },
    { label: "Vehicle & credentials", to: "/instructor/settings/credentials", icon: ShieldCheck },
  ]},
  { label: "Telephone", items: [
    { label: "Telephone Calls and Answering", to: "/instructor/famulor", icon: Mic },
    { label: "Phone & AI", to: "/instructor/settings/phone-ai", icon: Phone },
  ]},
  { label: "Business", items: [
    { label: "Take Payment", to: "/instructor/take-payment", icon: Banknote, moduleId: "payments" },
    { label: "Payments", to: "/instructor/pay", icon: CreditCard, moduleId: "payments" },
    { label: "Pending", to: "/instructor/pending-scheduling", icon: Clock },
    { label: "Expenses", to: "/instructor/expenses", icon: Coins },
    { label: "Tax", to: "/instructor/tax", icon: Receipt },
    { label: "Reports", to: "/instructor/reports", icon: BarChart3, moduleId: "reports" },
    { label: "Reviews", to: "/instructor/reviews", icon: Star },
    { label: "Referrals", to: "/instructor/referrals", icon: Share2 },
    { label: "Payments & fees", to: "/instructor/settings/payments", icon: CreditCard },
    { label: "Plan & Billing", to: "/instructor/settings/plan-billing", icon: Wallet },
  ]},
  { label: "Website", items: [
    { label: "My Site", to: "/website/my-site", icon: Globe, moduleId: "website" },
    { label: "Mini-site & pages", to: "/instructor/settings/mini-site", icon: FileText },
    { label: "Branding & theme", to: "/instructor/settings/branding", icon: Palette },
  ]},
  { label: "Productivity", items: [
    { label: "Notes", to: "/instructor/notes", icon: StickyNote },
    { label: "Todos", to: "/instructor/todos", icon: CheckSquare },
    { label: "Doodlepad", to: "/instructor/doodlepad", icon: Pencil },
    { label: "Plans", to: "/instructor/plans", icon: ClipboardList },
    { label: "Checklists", to: "/instructor/checklists", icon: ClipboardCheck2 },
    { label: "Resources", to: "/instructor/resources", icon: Layers },
    { label: "Document templates", to: "/instructor/document-templates", icon: FileText },
    { label: "Document vault", to: "/instructor/document-vault", icon: FolderLock },
    { label: "Waivers", to: "/instructor/waivers", icon: FileCheck2 },
  ]},
  { label: "Daily Ops", items: [
    { label: "Daily manifest", to: "/instructor/daily-manifest", icon: Sunrise },
    { label: "End-of-day report", to: "/instructor/eod-report", icon: Sunset },
    { label: "Outstanding tasks", to: "/instructor/outstanding-tasks", icon: ListChecks },
    { label: "Weekly report", to: "/instructor/weekly-report", icon: BarChart3 },
    { label: "Clock in/out", to: "/instructor/clock-in-out", icon: Clock },
    { label: "AI command", to: "/instructor/ai-command", icon: Sparkles },
  ]},
  { label: "People & Growth", items: [
    { label: "Pipeline", to: "/instructor/pipeline", icon: TrendingUp },
    { label: "Enquiries", to: "/instructor/enquiries", icon: MessageCircleQuestion },
    { label: "Waiting room", to: "/instructor/waiting-room", icon: DoorOpen },
    { label: "Abandoned checkouts", to: "/instructor/abandoned-checkouts", icon: ShoppingCart },
    { label: "Performance", to: "/instructor/performance", icon: Trophy },
    { label: "Certifications", to: "/instructor/certifications", icon: BadgeCheck },
    { label: "Reports hub", to: "/instructor/reports-hub", icon: BarChart3 },
    { label: "Notifications", to: "/instructor/settings/notifications", icon: Bell },
    { label: "Messaging", to: "/instructor/settings/messaging", icon: MessageCircle },
  ]},
  { label: "Support", items: [
    { label: "Send reminder", to: "/instructor/send-reminder", icon: MailPlus },
    { label: "Contact us", to: "/instructor/contact", icon: LifeBuoy },
    { label: "Admin chat", to: "/instructor/admin-chat", icon: MessagesSquare },
    { label: "Team channels", to: "/instructor/team-channels", icon: Hash },
    { label: "FAQs", to: "/instructor/faqs", icon: HelpCircle },
    { label: "Platform updates", to: "/instructor/platform-updates", icon: RefreshCw },
    { label: "Wellbeing", to: "/instructor/wellbeing", icon: Heart },
    { label: "Health", to: "/instructor/health", icon: Activity },
    { label: "Help & close account", to: "/instructor/settings/help-close", icon: HelpCircle },
  ]},
  { label: "Account", items: [
    { label: "Profile", to: "/instructor/settings/profile", icon: User },
    { label: "Login & security", to: "/instructor/settings/login-security", icon: Lock },
    { label: "Appearance & layout", to: "/instructor/settings/appearance-layout", icon: LayoutDashboard },
    { label: "Data, terms & policies", to: "/instructor/settings/data-privacy", icon: Database },
    { label: "Lab features", to: "/instructor/settings/lab-features", icon: Sparkles },
  ]},
];


interface Props {
  collapsed: boolean;
  onToggle: () => void;
  userInitials: string;
  userName: string;
  onSignOut: () => void;
}

export function DashboardSidebar({ collapsed, onToggle, userInitials, userName, onSignOut }: Props) {
  const { pathname } = useLocation();
  const { isActive: isModuleActive } = useModules();
  let instructorLogo: string | null = null;
  let instructorName = "DSM";
  let brandColour: string | null = null;
  let brandFont: string | null = null;
  let profileImage: string | null = null;
  let instructorId: string | null = null;
  try {
    const { instructor } = useInstructorAuth();
    if (instructor?.logo_url) instructorLogo = instructor.logo_url;
    if (instructor?.name) instructorName = instructor.name;
    if (instructor?.brand_colour) brandColour = instructor.brand_colour;
    if ((instructor as any)?.website_font) brandFont = (instructor as any).website_font;
    if ((instructor as any)?.profile_image_url) profileImage = (instructor as any).profile_image_url;
    if (instructor?.id) instructorId = instructor.id;
  } catch {}

  const visibleSections = SECTIONS.map(s => ({
    ...s,
    items: s.items.filter(i => !i.moduleId || isModuleActive(i.moduleId)),
  })).filter(s => s.items.length > 0);

  // Sections collapsed by default — primary groups stay open.
  const DEFAULT_OPEN = new Set(["Overview", "Teaching", "Business"]);
  const STORAGE_KEY = "dsm.dashboard.sidebar.openGroups";
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SECTIONS.forEach((s) => (initial[s.label] = DEFAULT_OPEN.has(s.label)));
    return initial;
  });
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setOpenGroups((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);
  // Auto-open the section that contains the active route.
  useEffect(() => {
    const activeSection = visibleSections.find((s) =>
      s.items.some((i) =>
        i.to === "/instructor" ? pathname === "/instructor" : pathname === i.to || pathname.startsWith(i.to + "/")
      )
    );
    if (activeSection && !openGroups[activeSection.label]) {
      setOpenGroups((prev) => ({ ...prev, [activeSection.label]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Pinned items — synced to DB (primary) with localStorage fallback.
  const PINNED_KEY = "dsm.dashboard.sidebar.pinned";
  const [pinned, setPinned] = useState<string[]>([]);

  // Load: DB first, then localStorage fallback.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let dbPinned: string[] | null = null;
      if (instructorId) {
        try {
          const { data } = await supabase
            .from("instructors")
            .select("sidebar_pinned")
            .eq("id", instructorId)
            .single();
          if (data?.sidebar_pinned && Array.isArray(data.sidebar_pinned)) {
            dbPinned = data.sidebar_pinned as string[];
          }
        } catch {}
      }
      if (!cancelled) {
        if (dbPinned) {
          setPinned(dbPinned);
        } else {
          try {
            const saved = localStorage.getItem(PINNED_KEY);
            if (saved) setPinned(JSON.parse(saved));
          } catch {}
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [instructorId]);

  const savePinned = useCallback(async (next: string[]) => {
    try { localStorage.setItem(PINNED_KEY, JSON.stringify(next)); } catch {}
    if (instructorId) {
      try {
        await supabase.from("instructors").update({ sidebar_pinned: next }).eq("id", instructorId);
        toast.success("Favorites order saved");
      } catch {}
    } else {
      toast.success("Favorites order saved");
    }
  }, [instructorId]);

  const togglePin = (to: string) => {
    setPinned((prev) => {
      const next = prev.includes(to) ? prev.filter((t) => t !== to) : [...prev, to];
      savePinned(next);
      return next;
    });
  };
  const reorderPinned = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setPinned((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      savePinned(next);
      return next;
    });
  };
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Critical items — fixed at the top of the sidebar, editable per instructor.
  const CRITICAL_KEY = "dsm.dashboard.sidebar.critical";
  const DEFAULT_CRITICAL: string[] = [
    "/instructor/settings/profile",
    "/instructor/schedule",
    "/instructor/settings/working-hours",
    "/instructor/settings/how-pupils-book",
    "/instructor/pupils",
    "/instructor/pay",
    "/instructor/settings/discounts-packages",
    "/instructor/test-results",
  ];
  const [critical, setCritical] = useState<string[]>([]);
  const [criticalLoaded, setCriticalLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let dbCritical: string[] | null = null;
      let dbRowExists = false;
      if (instructorId) {
        try {
          const { data } = await supabase
            .from("instructors")
            .select("sidebar_critical")
            .eq("id", instructorId)
            .single();
          if (data) {
            dbRowExists = true;
            const arr = (data as { sidebar_critical?: unknown }).sidebar_critical;
            if (Array.isArray(arr)) dbCritical = arr as string[];
          }
        } catch {}
      }
      if (cancelled) return;
      if (dbCritical && dbCritical.length > 0) {
        setCritical(dbCritical);
      } else if (dbRowExists && dbCritical && dbCritical.length === 0) {
        // Existing row with empty list — first-time seed.
        setCritical(DEFAULT_CRITICAL);
        try { localStorage.setItem(CRITICAL_KEY, JSON.stringify(DEFAULT_CRITICAL)); } catch {}
        try {
          await supabase.from("instructors").update({ sidebar_critical: DEFAULT_CRITICAL }).eq("id", instructorId!);
        } catch {}
      } else {
        try {
          const saved = localStorage.getItem(CRITICAL_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setCritical(parsed as string[]);
            else setCritical(DEFAULT_CRITICAL);
          } else {
            setCritical(DEFAULT_CRITICAL);
          }
        } catch { setCritical(DEFAULT_CRITICAL); }
      }
      setCriticalLoaded(true);
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const saveCritical = useCallback(async (next: string[]) => {
    try { localStorage.setItem(CRITICAL_KEY, JSON.stringify(next)); } catch {}
    if (instructorId) {
      try {
        await supabase.from("instructors").update({ sidebar_critical: next }).eq("id", instructorId);
      } catch {}
    }
  }, [instructorId]);

  const toggleCritical = (to: string) => {
    setCritical((prev) => {
      const next = prev.includes(to) ? prev.filter((t) => t !== to) : [...prev, to];
      saveCritical(next);
      toast.success(prev.includes(to) ? "Removed from Critical" : "Added to Critical");
      return next;
    });
  };
  const reorderCritical = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setCritical((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      saveCritical(next);
      toast.success("Critical order saved");
      return next;
    });
  };
  const [critDragIndex, setCritDragIndex] = useState<number | null>(null);
  const [critDragOverIndex, setCritDragOverIndex] = useState<number | null>(null);

  const allItems = visibleSections.flatMap((s) => s.items);
  const pinnedItems = pinned
    .map((to) => allItems.find((i) => i.to === to))
    .filter((i): i is NavItem => Boolean(i));
  const criticalItems = critical
    .map((to) => allItems.find((i) => i.to === to))
    .filter((i): i is NavItem => Boolean(i));

  const brandTint = brandColour ? `${brandColour}1A` : null;

  // ---- Navy theme (DSM hybrid dashboard) ----

  // Inline overrides so we don't have to fork the whole file. CSS vars get
  // remapped on the <aside> so descendants pick them up automatically.
  const navyBg          = "#0F2044";
  const navyActiveBg    = "rgba(26,82,160,0.25)";
  const navyHoverBg     = "rgba(255,255,255,0.06)";
  const navyText        = "rgba(255,255,255,0.45)";
  const navyTextActive  = "#FFFFFF";
  const navyLabel       = "rgba(255,255,255,0.22)";
  const navyBorder      = "rgba(255,255,255,0.08)";
  const navyAccentRed   = "#CC2229";

  const brandStyle: React.CSSProperties = {
    ["--d2-surface" as any]: navyBg,
    ["--d2-surface-soft" as any]: navyBg,
    ["--d2-border" as any]: navyBorder,
    ["--d2-hover" as any]: navyHoverBg,
    ["--d2-text-1" as any]: navyTextActive,
    ["--d2-text-2" as any]: navyText,
    ["--d2-text-3" as any]: navyLabel,
    ["--d2-indigo" as any]: brandColour ?? "#1A52A0",
    ["--d2-indigo-bg" as any]: brandTint ?? "rgba(26,82,160,0.18)",
  };

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 z-30"
      style={{
        width: collapsed ? 48 : 210,
        background: navyBg,
        borderRight: `0.5px solid ${navyBorder}`,
        transition: "width 200ms ease-out",
        fontFamily: brandFont ? `${brandFont}, Inter, system-ui, sans-serif` : undefined,
        ...brandStyle,
      }}
    >

      {/* Brand */}
      <div className="flex items-center justify-between" style={{ padding: "16px 12px" }}>
        <Link to="/instructor" className="flex items-center gap-2 min-w-0">
          {instructorLogo ? (
            <img
              src={instructorLogo}
              alt={instructorName}
              style={{ height: 24, width: "auto", objectFit: "contain", flexShrink: 0 }}
            />
          ) : (
            <>
              <div className="flex items-center gap-0.5" aria-label="DSM logo">
                <span style={{ width: 10, height: 10, background: "#EF4444", borderRadius: 2, transform: "skewY(-8deg)" }} />
                <span style={{ width: 10, height: 10, background: "#3B82F6", borderRadius: 2, transform: "skewY(-8deg)" }} />
                <span style={{ width: 10, height: 10, background: "#1F2937", borderRadius: 2, transform: "skewY(-8deg)" }} />
              </div>
              {!collapsed && (
                <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px", color: "var(--d2-text-1)" }}>
                  DSM
                </span>
              )}
            </>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="rounded-md p-1 transition-colors"
          style={{ color: "var(--d2-text-3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d2-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Workspace card */}
      {!collapsed && (
        <div style={{ padding: "0 12px 12px" }}>
          <div
            className="flex items-center gap-2"
            style={{
              padding: "8px",
              borderRadius: 8,
              border: "0.5px solid var(--d2-border)",
              background: "var(--d2-surface-soft)",
            }}
          >
            <div
              className="flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--d2-indigo-bg)",
                color: "var(--d2-indigo)",
                fontSize: 11, fontWeight: 600,
              }}
            >
              {profileImage ? (
                <img src={profileImage} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : userInitials}
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--d2-text-1)", margin: 0, lineHeight: 1.2 }}>
                {userName}
              </p>
              <p style={{ fontSize: 10, color: "var(--d2-text-3)", margin: 0, lineHeight: 1.3 }}>
                Personal workspace
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "0 8px 12px" }}>
        {(() => {
          const renderItem = (
            item: NavItem,
            opts: { isPinned?: boolean; pinIndex?: number; isCritical?: boolean; critIndex?: number },
          ) => {
            const Icon = item.icon;
            const active = item.to === "/instructor"
              ? pathname === "/instructor"
              : pathname === item.to || pathname.startsWith(item.to + "/");
            const isPinnedNow = pinned.includes(item.to);
            const isCriticalNow = critical.includes(item.to);
            const draggable = !collapsed && (opts.isPinned || opts.isCritical);
            const isDragging =
              (opts.isPinned && dragIndex === opts.pinIndex) ||
              (opts.isCritical && critDragIndex === opts.critIndex);
            const isDragOver =
              (opts.isPinned && dragOverIndex === opts.pinIndex && dragIndex !== opts.pinIndex) ||
              (opts.isCritical && critDragOverIndex === opts.critIndex && critDragIndex !== opts.critIndex);
            const dragOverDir = opts.isPinned
              ? (dragIndex ?? 0) > (opts.pinIndex ?? 0) ? "above" : "below"
              : (critDragIndex ?? 0) > (opts.critIndex ?? 0) ? "above" : "below";

            const rightPad = collapsed ? "0" : opts.isCritical ? "0 24px 0 10px" : "0 48px 0 10px";

            return (
              <li
                key={`${opts.isPinned ? "pin-" : opts.isCritical ? "crit-" : ""}${item.label}-${item.to}`}
                draggable={draggable}
                onDragStart={draggable ? (e) => {
                  if (opts.isPinned) setDragIndex(opts.pinIndex ?? null);
                  if (opts.isCritical) setCritDragIndex(opts.critIndex ?? null);
                  e.dataTransfer.effectAllowed = "move";
                } : undefined}
                onDragOver={draggable ? (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (opts.isPinned && dragOverIndex !== opts.pinIndex) setDragOverIndex(opts.pinIndex ?? null);
                  if (opts.isCritical && critDragOverIndex !== opts.critIndex) setCritDragOverIndex(opts.critIndex ?? null);
                } : undefined}
                onDragLeave={draggable ? () => {
                  if (opts.isPinned && dragOverIndex === opts.pinIndex) setDragOverIndex(null);
                  if (opts.isCritical && critDragOverIndex === opts.critIndex) setCritDragOverIndex(null);
                } : undefined}
                onDrop={draggable ? (e) => {
                  e.preventDefault();
                  if (opts.isPinned && dragIndex != null && opts.pinIndex != null) reorderPinned(dragIndex, opts.pinIndex);
                  if (opts.isCritical && critDragIndex != null && opts.critIndex != null) reorderCritical(critDragIndex, opts.critIndex);
                  setDragIndex(null); setDragOverIndex(null);
                  setCritDragIndex(null); setCritDragOverIndex(null);
                } : undefined}
                onDragEnd={draggable ? () => {
                  setDragIndex(null); setDragOverIndex(null);
                  setCritDragIndex(null); setCritDragOverIndex(null);
                } : undefined}
                style={{
                  opacity: isDragging ? 0.4 : 1,
                  borderTop: isDragOver && dragOverDir === "above" ? "2px solid var(--d2-indigo)" : "2px solid transparent",
                  borderBottom: isDragOver && dragOverDir === "below" ? "2px solid var(--d2-indigo)" : "2px solid transparent",
                  cursor: draggable ? "grab" : undefined,
                }}
              >
                <div className="relative group">
                  <Link
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn("relative flex items-center gap-2 transition-colors")}
                    style={{
                      height: 32,
                      padding: rightPad,
                      justifyContent: collapsed ? "center" : "flex-start",
                      background: active ? navyActiveBg : "transparent",
                      color: active ? navyTextActive : navyText,
                      fontSize: 12,
                      fontWeight: 500,
                      borderLeft: active ? `3px solid ${navyAccentRed}` : "3px solid transparent",
                      borderRadius: 0,
                      transition: "background 150ms ease-out, color 150ms ease-out",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = navyHoverBg;
                        e.currentTarget.style.color = navyTextActive;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = navyText;
                      }
                    }}
                  >
                    <Icon size={14} strokeWidth={active ? 2.25 : 1.75} style={{ color: active ? navyTextActive : "currentColor" }} />

                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span
                        style={{
                          background: active ? "rgba(255,255,255,0.22)" : "#FEE2E2",
                          color: active ? "#FFFFFF" : "#B91C1C",
                          fontSize: 10, fontWeight: 600,
                          padding: "1px 6px", borderRadius: 999,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {!collapsed && opts.isCritical && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCritical(item.to); }}
                      title="Remove from Critical"
                      aria-label="Remove from Critical"
                      className="absolute top-1/2 -translate-y-1/2 rounded p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      style={{
                        right: 4,
                        color: active ? "rgba(255,255,255,0.85)" : "var(--d2-text-3)",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = active ? "rgba(255,255,255,0.15)" : "var(--d2-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <PinOff size={11} strokeWidth={2} />
                    </button>
                  )}
                  {!collapsed && !opts.isCritical && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCritical(item.to); }}
                        title={isCriticalNow ? "Remove from Critical" : "Add to Critical"}
                        aria-label={isCriticalNow ? "Remove from Critical" : "Add to Critical"}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 rounded p-1 transition-opacity",
                          isCriticalNow ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                        )}
                        style={{
                          right: 24,
                          color: isCriticalNow ? "#DC2626" : (active ? "rgba(255,255,255,0.85)" : "var(--d2-text-3)"),
                          background: "transparent",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = active ? "rgba(255,255,255,0.15)" : "var(--d2-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Star size={11} strokeWidth={2} fill={isCriticalNow ? "#DC2626" : "none"} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(item.to); }}
                        title={isPinnedNow ? "Unpin from top" : "Pin to top"}
                        aria-label={isPinnedNow ? "Unpin from top" : "Pin to top"}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 rounded p-1 transition-opacity",
                          isPinnedNow ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                        )}
                        style={{
                          right: 4,
                          color: active ? "rgba(255,255,255,0.85)" : "var(--d2-text-3)",
                          background: "transparent",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = active ? "rgba(255,255,255,0.15)" : "var(--d2-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {isPinnedNow ? <PinOff size={11} strokeWidth={2} /> : <Pin size={11} strokeWidth={2} />}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          };

          return (
            <>
              {criticalLoaded && criticalItems.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {!collapsed && (
                    <div
                      className="flex items-center"
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.6px",
                        color: "#DC2626", textTransform: "uppercase",
                        padding: "6px 8px",
                      }}
                    >
                      <span
                        style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#DC2626", marginRight: 6, display: "inline-block",
                        }}
                      />
                      <span>Critical</span>
                    </div>
                  )}
                  <ul className="space-y-0.5">
                    {criticalItems.map((item, idx) => renderItem(item, { isCritical: true, critIndex: idx }))}
                  </ul>
                </div>
              )}

              {pinnedItems.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {!collapsed && (
                    <div
                      className="flex items-center"
                      style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.6px",
                        color: "var(--d2-text-3)", textTransform: "uppercase",
                        padding: "6px 8px",
                      }}
                    >
                      <Pin size={10} strokeWidth={2.5} style={{ marginRight: 6 }} />
                      <span>Pinned</span>
                    </div>
                  )}
                  <ul className="space-y-0.5">
                    {pinnedItems.map((item, idx) => renderItem(item, { isPinned: true, pinIndex: idx }))}
                  </ul>
                </div>
              )}

              {visibleSections.map((section) => {
                const isOpen = collapsed ? true : (openGroups[section.label] ?? false);
                return (
                  <div key={section.label} style={{ marginBottom: 8 }}>
                    {!collapsed && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(section.label)}
                        className="flex items-center w-full rounded-md transition-colors"
                        style={{
                          fontSize: 10, fontWeight: 600, letterSpacing: "0.6px",
                          color: "var(--d2-text-3)", textTransform: "uppercase",
                          padding: "6px 8px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d2-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        aria-expanded={isOpen}
                      >
                        <ChevronRight
                          size={10}
                          strokeWidth={2.5}
                          style={{
                            marginRight: 4,
                            transition: "transform 150ms ease-out",
                            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                          }}
                        />
                        <span className="flex-1 text-left">{section.label}</span>
                      </button>
                    )}
                    {isOpen && (
                      <ul className="space-y-0.5">
                        {section.items.map((item) => renderItem(item, { isPinned: false }))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </>
          );
        })()}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "12px", borderTop: "0.5px solid var(--d2-border)" }}>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 w-full rounded-md transition-colors"
          style={{
            padding: collapsed ? "8px" : "6px 8px",
            justifyContent: collapsed ? "center" : "flex-start",
            color: "var(--d2-text-2)", fontSize: 12,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d2-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={14} strokeWidth={1.75} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
