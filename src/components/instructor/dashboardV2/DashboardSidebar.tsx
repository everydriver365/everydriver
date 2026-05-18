import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useModules } from "@/context/ModulesContext";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

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
  ]},
  { label: "Telephone", items: [
    { label: "Telephone Calls and Answering", to: "/instructor/famulor", icon: Mic },
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
    { label: "Plan & Billing", to: "/instructor/settings/plan-billing", icon: Wallet },
  ]},
  { label: "Website", items: [
    { label: "My Site", to: "/website/my-site", icon: Globe, moduleId: "website" },
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
  ]},
  { label: "Settings", items: [
    { label: "All settings", to: "/instructor/settings", icon: SettingsIcon },
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
  try {
    const { instructor } = useInstructorAuth();
    if (instructor?.logo_url) instructorLogo = instructor.logo_url;
    if (instructor?.name) instructorName = instructor.name;
    if (instructor?.brand_colour) brandColour = instructor.brand_colour;
    if ((instructor as any)?.website_font) brandFont = (instructor as any).website_font;
    if ((instructor as any)?.profile_image_url) profileImage = (instructor as any).profile_image_url;
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

  // Convert brand colour to a soft tint for active background.
  const brandTint = brandColour ? `${brandColour}1A` : null; // ~10% alpha

  const brandStyle: React.CSSProperties = brandColour
    ? ({
        ["--d2-indigo" as any]: brandColour,
        ["--d2-indigo-bg" as any]: brandTint,
      } as React.CSSProperties)
    : {};

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 z-30"
      style={{
        width: collapsed ? 64 : 260,
        background: "var(--d2-surface)",
        borderRight: "0.5px solid var(--d2-border)",
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
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.to === "/instructor"
                      ? pathname === "/instructor"
                      : pathname === item.to || pathname.startsWith(item.to + "/");
                    return (
                      <li key={item.label}>
                        <Link
                          to={item.to}
                          title={collapsed ? item.label : undefined}
                          aria-current={active ? "page" : undefined}
                          className={cn("relative flex items-center gap-2 rounded-md transition-colors group")}
                          style={{
                            height: 32,
                            padding: collapsed ? "0" : "0 8px 0 10px",
                            justifyContent: collapsed ? "center" : "flex-start",
                            background: active ? "var(--d2-indigo)" : "transparent",
                            color: active ? "#FFFFFF" : "var(--d2-text-2)",
                            fontSize: 12,
                            fontWeight: 500,
                            boxShadow: active ? "0 1px 2px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.06)" : "none",
                            transition: "background 150ms ease-out, color 150ms ease-out, box-shadow 150ms ease-out",
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = "var(--d2-hover)";
                              e.currentTarget.style.color = "var(--d2-text-1)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--d2-text-2)";
                            }
                          }}
                        >
                          <Icon size={14} strokeWidth={active ? 2.25 : 1.75} style={{ color: active ? "#FFFFFF" : undefined }} />
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
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
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
