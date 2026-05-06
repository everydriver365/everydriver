import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Inbox, Users, ClipboardCheck,
  Award, Repeat2, Search, CreditCard, Receipt, Clock,
  BarChart3, Globe, Palette, Link2, TrendingUp, User, Wallet, Boxes,
  Plug, LogOut, PanelLeftClose, PanelLeft,
  NotebookPen, BookOpenCheck, GraduationCap, ListChecks, UserPlus2,
  MapPin, Map, Gauge, Navigation, Video, Route, Fuel, Car,
  Mic, Banknote, Coins, Star, Share2, Zap, MoreHorizontal,
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
    { label: "Diary", to: "/instructor/diary", icon: NotebookPen },
  ]},
  { label: "Teaching", items: [
    { label: "Pupils", to: "/instructor/pupils", icon: Users, moduleId: "pupils" },
    { label: "Course Planner", to: "/instructor/course-planner", icon: BookOpenCheck },
    { label: "Waiting List", to: "/instructor/waiting-list", icon: UserPlus2 },
    { label: "Fill Gaps", to: "/instructor/gaps", icon: ListChecks },
    { label: "Test Bookings", to: "/instructor/test-bookings", icon: ClipboardCheck, moduleId: "tests" },
    { label: "Test Results", to: "/instructor/test-results", icon: Award, moduleId: "tests" },
    { label: "Test Swap", to: "/instructor/test-swap", icon: Repeat2, moduleId: "testswap" },
    { label: "Slot Finder", to: "/instructor/test-slot-finder", icon: Search, moduleId: "slotfinder" },
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
  ]},
  { label: "AI Voice", items: [
    { label: "AI Voice Hub", to: "/instructor/famulor", icon: Mic },
  ]},
  { label: "Business", items: [
    { label: "Take Payment", to: "/instructor/take-payment", icon: Banknote, moduleId: "payments" },
    { label: "Payments", to: "/instructor/pay", icon: CreditCard, moduleId: "payments" },
    { label: "Invoices", to: "/instructor/invoices", icon: Receipt, moduleId: "invoices" },
    { label: "Pending", to: "/instructor/pending-scheduling", icon: Clock },
    { label: "Expenses", to: "/instructor/expenses", icon: Coins },
    { label: "Tax", to: "/instructor/tax", icon: Receipt },
    { label: "Reports", to: "/instructor/income", icon: BarChart3, moduleId: "reports" },
    { label: "Reviews", to: "/instructor/reviews", icon: Star },
    { label: "Referrals", to: "/instructor/referrals", icon: Share2 },
    { label: "Automations", to: "/instructor/automations", icon: Zap },
  ]},
  { label: "Website", items: [
    { label: "My Site", to: "/website/my-site", icon: Globe, moduleId: "website" },
    { label: "Branding", to: "/instructor/branding", icon: Palette, moduleId: "website" },
    { label: "Domain", to: "/instructor/domains", icon: Link2, moduleId: "website" },
    { label: "SEO", to: "/instructor/seo", icon: TrendingUp, moduleId: "website" },
  ]},
  { label: "Settings", items: [
    { label: "Profile", to: "/instructor/profile", icon: User },
    { label: "Plan & Billing", to: "/instructor/billing", icon: Wallet },
    { label: "Modules", to: "/instructor/modules", icon: Boxes },
    { label: "Integrations", to: "/instructor/integrations", icon: Plug },
    { label: "More tools", to: "/instructor/menu", icon: MoreHorizontal },
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
        {visibleSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 12 }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.6px",
                  color: "var(--d2-text-3)", textTransform: "uppercase",
                  padding: "8px 8px 4px",
                }}
              >
                {section.label}
              </div>
            )}
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
                        padding: collapsed ? "8px" : "6px 8px 6px 10px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        background: active ? "var(--d2-indigo)" : "transparent",
                        color: active ? "#FFFFFF" : "var(--d2-text-2)",
                        fontSize: 12,
                        fontWeight: active ? 600 : 400,
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
                      {active && !collapsed && (
                        <span
                          aria-hidden
                          style={{
                            position: "absolute",
                            left: -8,
                            top: 6,
                            bottom: 6,
                            width: 3,
                            borderRadius: 2,
                            background: "var(--d2-indigo)",
                          }}
                        />
                      )}
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
          </div>
        ))}
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
