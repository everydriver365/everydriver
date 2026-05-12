import { type ElementType, type ReactNode, useState, useEffect } from "react";
import { RealtimeHubProvider } from "@/hooks/useRealtimeHub";
import { useGlobalLessonSync } from "@/hooks/useGlobalLessonSync";
import { motion } from "framer-motion";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { useUrgentAlerts } from "@/hooks/useUrgentAlerts";
import { UrgentAlertOverlay } from "@/components/instructor/UrgentAlertOverlay";
import { useLessonEndAlert, OverdueLesson } from "@/hooks/useLessonEndAlert";
import { LessonEndAlert } from "@/components/instructor/LessonEndAlert";
import { EndLessonWizard } from "@/components/instructor/EndLessonWizard";
import { VoiceAssistantHeaderButton, VoiceAssistantOverlay } from "@/components/instructor/VoiceAssistantButton";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useInstructorPresence } from "@/hooks/useInstructorPresence";
import { usePaymentReceivedAlert } from "@/hooks/usePaymentReceivedAlert";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home, 
  Calendar, 
  CalendarClock,
  CalendarPlus,
  Users, 
  Briefcase, 
  CreditCard, 
  Settings,
  LogOut,
  Receipt,
  Navigation,
  MapPin,
  ChevronLeft,
  Moon,
  Sun,
  Wallet,
  Globe,
  Globe2,
  MessageCircle,
  Headphones,
  ShieldCheck,
  ClipboardList,
  ClipboardCheck,
  Award,
  ChevronRight,
  ChevronDown,
  Radio,
  Menu,
  X,
  Plus,
  Car,
  PoundSterling,
  Search,
  PanelLeftClose,
  PanelLeft,
  Bell,
  FileText,
  Camera,
  Satellite,
  Coffee,
  BookOpen,
  Gift
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Check, Monitor, Contrast, CheckCircle } from "lucide-react";

import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { InstructorDesktopSidebar } from "@/components/instructor/InstructorDesktopSidebar";
import { DesktopQuickActionBar } from "@/components/instructor/DesktopQuickActionBar";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";

function getContrastColor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)";
}
import { CommandPalette } from "@/components/CommandPalette";
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { QuickActionsFAB } from "@/components/instructor/QuickActionsFAB";
import { QuickActionsPopoverMenu } from "@/components/instructor/QuickActionsPopoverMenu";
import { LayoutGrid } from "lucide-react";
import { useInstructorAppearance } from "@/hooks/useInstructorAppearance";


import { IOSInstallBanner } from "@/components/pwa/IOSInstallBanner";
import { MessageNotificationBadge } from "@/components/instructor/MessageNotificationBadge";
import { VisitorChatBadge } from "@/components/instructor/VisitorChatBadge";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { AdminMessageBadge } from "@/components/instructor/AdminMessageBadge";
import { HeaderSearchBox } from "@/components/HeaderSearchBox";
import { PendingSchedulingBadge } from "@/components/instructor/PendingSchedulingBadge";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useActivePupilsCount } from "@/hooks/useActivePupilsCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { PlanBadge } from "@/components/instructor/PlanBadge";
import planIcon from "@/assets/plan-icon.png";
import { SOSEmergencySheet } from "@/components/instructor/SOSEmergencySheet";
import { OfflineBanner } from "@/components/instructor/OfflineBanner";
import { useOfflinePrefetch } from "@/hooks/useOfflinePrefetch";
import instructorBg from "@/assets/instructor-bg-signs.png";
import dsmLogo from "@/assets/dsm-logo.png";
import { MobileBlueHeader } from "@/components/instructor/MobileBlueHeader";
const sidebarGroups = [
  {
    label: "TEACHING",
    items: [
      { href: "/instructor", label: "Dashboard", icon: Home },
      { href: "/instructor/schedule", label: "Schedule", icon: Calendar },
      { href: "/instructor/availability", label: "Availability", icon: CalendarClock },
      { href: "/instructor/pending-scheduling", label: "Pending", icon: ClipboardList },
      { href: "/instructor/pupils", label: "Pupils", icon: Users },
      { href: "/instructor/test-results", label: "Test Results", icon: Award },
      { href: "/instructor/test-requests", label: "Test Swap", icon: Award },
      { href: "/instructor/jobs", label: "Jobs", icon: Briefcase },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { href: "/instructor/pay", label: "Payments", icon: CreditCard },
      { href: "/instructor/accounts", label: "Accounts", icon: Wallet },
      { href: "/instructor/expenses", label: "Expenses", icon: Receipt },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      { href: "/instructor/messages", label: "Messages", icon: MessageCircle },
      { href: "/instructor/admin-chat", label: "Contact Admin", icon: ShieldCheck, highlight: true },
      { href: "/instructor/visitor-chats", label: "Visitor Chats", icon: Headphones },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { href: "/instructor/gaps", label: "Fill Gaps", icon: MapPin },
      { href: "/instructor/routes", label: "Saved Routes", icon: Navigation },
      { href: "/instructor/resources", label: "Resources", icon: FileText },
      { href: "/instructor/website", label: "Mini Website", icon: Globe },
      { href: "/instructor/domains", label: "Domains", icon: Globe2 },
      { href: "/instructor/tracking", label: "GPS Tracking", icon: Radio },
      { href: "/instructor/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "VEHICLE INTELLIGENCE",
    items: [
      { href: "/instructor/fleet-dashboard", label: "Telematics", icon: Car, highlight: true },
      { href: "/instructor/dashcam", label: "Dashcam", icon: Camera, highlight: true },
    ],
  },
];

// Flat list for search and mobile menu
const sidebarLinks = sidebarGroups.flatMap(g => g.items);

const desktopNavTabs = [
  { id: "/instructor", label: "Home", icon: Home },
  { id: "/instructor/schedule", label: "Schedule", icon: Calendar },
  { id: "/instructor/pupils", label: "Pupils", icon: Users },
  { id: "/instructor/messages", label: "Messages", icon: MessageCircle },
  { id: "/instructor/pay", label: "Money", icon: CreditCard },
  { id: "/instructor/test-results", label: "Tests", icon: Award },
  { id: "/instructor/tracking", label: "GPS", icon: Radio },
  { id: "/instructor/website", label: "Website", icon: Globe },
  { id: "/instructor/settings", label: "Settings", icon: Settings },
];

function DesktopNotificationBell({ instructorId }: { instructorId: string | undefined }) {
  const navigate = useNavigate();
  const { total } = useCombinedNotificationCount(instructorId);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 relative"
      onClick={() => navigate("/instructor/test-requests")}
    >
      <Bell className="h-4 w-4" />
      {total > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
          {total > 9 ? "9+" : total}
        </span>
      )}
    </Button>
  );
}

function MobileNotificationBell({ instructorId }: { instructorId: string | undefined }) {
  const navigate = useNavigate();
  const { total } = useCombinedNotificationCount(instructorId);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-[hsl(240_6%_11%)] hover:bg-gray-100 relative"
      onClick={() => navigate("/instructor/notifications")}
      title="Notifications"
    >
      <Bell className="h-4 w-4" />
      {total > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse">
          {total > 9 ? "9+" : total}
        </span>
      )}
    </Button>
  );
}

function GlobalSyncBridge({ instructorId }: { instructorId: string | undefined }) {
  useGlobalLessonSync(instructorId);
  return null;
}


interface InstructorPortalLayoutProps {
  children: ReactNode;
}

export function InstructorPortalLayout({ children }: InstructorPortalLayoutProps) {
  const { instructor, subscription, signOut, loading } = useInstructorAuth();
  useInstructorPresence(instructor?.id);
  usePaymentReceivedAlert(instructor?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [headerQuickActionsOpen, setHeaderQuickActionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pupils, setPupils] = useState<Array<{ id: string; name: string; phone?: string | null; email?: string | null; account_balance?: number | null }>>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const activeGroup = sidebarGroups.find(g => g.items.some(item => location.pathname === item.href));
    return activeGroup ? [activeGroup.label] : [];
  });
  const toggleGroup = (label: string) => {
    setOpenGroups(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };
  const { alerts: urgentAlerts, dismissAlert: dismissUrgentAlert } = useUrgentAlerts(instructor?.id);
  const { overdueLesson, dismiss: dismissLessonAlert } = useLessonEndAlert(instructor?.id);
  const [endWizardLesson, setEndWizardLesson] = useState<OverdueLesson | null>(null);
  useOfflinePrefetch({ instructorId: instructor?.id });
  const todayOverview = useTodayOverview(instructor?.id).data;
  const activePupilsCount = useActivePupilsCount(instructor?.id).data ?? 0;
  const pendingCount = usePendingJobsCount();

  const handleCompleteLessonAlert = (lesson: OverdueLesson) => {
    dismissLessonAlert(lesson.id);
    setEndWizardLesson(lesson);
  };

  // Voice assistant
  const voiceAssistant = useVoiceAssistant({ instructorId: instructor?.id });
  const handleVoiceTap = () => {
    if (voiceAssistant.state === "idle") voiceAssistant.startListening();
    else if (voiceAssistant.state === "listening") voiceAssistant.stopListening();
    else voiceAssistant.cancel();
  };

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileSearchResults, setMobileSearchResults] = useState<Array<{ id: string; name: string; subtitle: string; href?: string }>>([]);

  // Appearance settings — apply wallpaper color to ALL mobile pages
  const { layoutStyle, wallpaperColor } = useInstructorAppearance(instructor?.id);
  const isHomePage = location.pathname === "/instructor";
  const isAppStyle = isHomePage && layoutStyle === "schedule";
  const mobileBg = wallpaperColor || "#EEF1F5";
  const appStyleBg = isAppStyle ? mobileBg : undefined;
  const headerContrast = getContrastColor(mobileBg);

  const isTrackingPage = location.pathname.startsWith("/instructor/tracking") || location.pathname.startsWith("/instructor/traccar");
  
  // Check for fullscreen mode (used when tracking is active)
  const searchParams = new URLSearchParams(location.search);
  const isFullscreenMode = isTrackingPage && searchParams.get("fullscreen") === "true";

  // Auto-open sidebar group when navigating to a new page
  useEffect(() => {
    const activeGroup = sidebarGroups.find(g => g.items.some(item => location.pathname === item.href));
    if (activeGroup && !openGroups.includes(activeGroup.label)) {
      setOpenGroups(prev => [...prev, activeGroup.label]);
    }
  }, [location.pathname]);

  // Fetch pupils for payment sheet
  useEffect(() => {
    if (!instructor?.id) return;
    supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance")
      .eq("instructor_id", instructor.id)
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => { if (data) setPupils(data); });
  }, [instructor?.id]);

  // Mobile search - live query (pupils, lessons, pages)
  useEffect(() => {
    if (mobileSearchQuery.length < 2) {
      setMobileSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      if (!instructor?.id) return;
      const items: Array<{ id: string; name: string; subtitle: string; href?: string }> = [];
      const lowerQ = mobileSearchQuery.toLowerCase();

      // Search pupils
      const { data } = await supabase
        .from("pupils")
        .select("id, name, lessons_completed, progress")
        .eq("instructor_id", instructor.id)
        .ilike("name", `%${mobileSearchQuery}%`)
        .limit(6);
      if (data) {
        items.push(...data.map(p => ({
          id: p.id,
          name: p.name,
          subtitle: `${p.lessons_completed || 0} lessons · ${p.progress || 0}%`,
        })));
      }

      // Search upcoming lessons
      const { data: lessons } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, pupil:pupils!inner(name)")
        .eq("instructor_id", instructor.id)
        .ilike("pupils.name", `%${mobileSearchQuery}%`)
        .gte("lesson_date", new Date().toISOString().split("T")[0])
        .order("lesson_date", { ascending: true })
        .limit(4);
      if (lessons) {
        items.push(...lessons.map((l: any) => ({
          id: l.id,
          name: `Lesson: ${l.pupil?.name || "Unknown"}`,
          subtitle: `${l.lesson_date} at ${l.start_time || "TBC"}`,
          href: "/instructor/schedule",
        })));
      }

      // Search pages / functions — match label, href slug, and a few synonyms
      const synonyms: Record<string, string[]> = {
        money: ["pay", "income", "expenses", "tax", "accounts", "in-out", "mileage"],
        finance: ["pay", "income", "expenses", "tax", "accounts"],
        earnings: ["pay", "income"],
        invoice: ["income", "pay"],
        invoices: ["income", "pay"],
        diary: ["schedule", "availability"],
        calendar: ["schedule", "availability"],
        students: ["pupils"],
        learners: ["pupils"],
        learner: ["pupils"],
        pupil: ["pupils"],
        gaps: ["fill-gaps", "gaps"],
        chat: ["messages", "admin-chat", "visitor-chats"],
        whatsapp: ["messages"],
        booking: ["schedule", "pending-scheduling"],
        bookings: ["schedule"],
        gps: ["tracking", "gps-tracking", "saved-routes"],
        route: ["saved-routes", "tracking"],
        routes: ["saved-routes"],
        site: ["website", "mini-website", "domains"],
        web: ["website", "domains"],
        domain: ["domains", "website"],
        ai: ["voice", "famulor"],
        voice: ["famulor", "voice"],
        receipts: ["expenses"],
        cars: ["fleet-dashboard", "tracking"],
        vehicle: ["fleet-dashboard", "tracking"],
        vehicles: ["fleet-dashboard", "tracking"],
      };
      const expansions = synonyms[lowerQ] || [];
      const matchesPage = (p: { label: string; href: string }) => {
        const hay = `${p.label.toLowerCase()} ${p.href.toLowerCase().replace(/[/-]/g, " ")}`;
        if (hay.includes(lowerQ)) return true;
        return expansions.some((e) => hay.includes(e));
      };
      const pages = sidebarLinks.filter(matchesPage);
      items.push(...pages.slice(0, 12).map(p => ({
        id: p.href,
        name: friendlyLabel(p.label),
        subtitle: "Page",
        href: p.href,
      })));

      // Settings sub-pages — searchable shortcuts into /instructor/settings/<category>
      const settingsPages: Array<{ label: string; href: string; keywords?: string }> = [
        { label: "Appearance & wallpaper", href: "/instructor/settings/advanced", keywords: "appearance theme wallpaper colour color dark light layout look" },
        { label: "Dashboard layout", href: "/instructor/settings/advanced", keywords: "layout tiles home dashboard" },
        { label: "Optional features", href: "/instructor/settings/advanced", keywords: "feature toggles modules enable" },
        { label: "Plan & billing", href: "/instructor/settings/plan-billing", keywords: "plan billing subscription invoice upgrade" },
        { label: "Profile & contact details", href: "/instructor/settings/account", keywords: "profile contact name email phone" },
        { label: "Login & security", href: "/instructor/settings/account", keywords: "password login security 2fa face id biometric" },
        { label: "Qualifications & credentials", href: "/instructor/settings/account", keywords: "adi badge qualifications credentials" },
        { label: "Working hours", href: "/instructor/settings/schedule", keywords: "working hours availability open shifts" },
        { label: "Lesson length & buffer", href: "/instructor/settings/schedule", keywords: "lesson length buffer bank holiday duration" },
        { label: "Google Calendar sync", href: "/instructor/settings/schedule", keywords: "google calendar sync gcal" },
        { label: "Lesson reminders", href: "/instructor/settings/schedule", keywords: "reminders sms email notifications" },
        { label: "Hourly rate", href: "/instructor/settings/rates", keywords: "rate price hourly cost" },
        { label: "Coverage area", href: "/instructor/settings/rates", keywords: "coverage area postcode radius travel" },
        { label: "Postcode rates", href: "/instructor/settings/rates", keywords: "postcode rates pricing" },
        { label: "Surcharges", href: "/instructor/settings/rates", keywords: "surcharge weekend bank holiday off peak service fee" },
        { label: "Booking mode", href: "/instructor/settings/bookings", keywords: "booking mode auto manual approval" },
        { label: "Deposit payments", href: "/instructor/settings/bookings", keywords: "deposit prepay" },
        { label: "Card service fee & QR codes", href: "/instructor/settings/bookings", keywords: "card service fee qr commission" },
        { label: "Square account", href: "/instructor/settings/bookings", keywords: "square card terminal payment" },
        { label: "Buy now pay later", href: "/instructor/settings/bookings", keywords: "klarna clearpay bnpl finance" },
        { label: "Discount codes", href: "/instructor/settings/bookings", keywords: "discount voucher promo coupon" },
        { label: "Lesson packages", href: "/instructor/settings/bookings", keywords: "packages bundle hours" },
        { label: "Referral programme", href: "/instructor/settings/bookings", keywords: "referral refer friend reward" },
        { label: "Pupil app branding", href: "/instructor/settings/business", keywords: "branding logo colour color pupil app" },
        { label: "Terms & Conditions", href: "/instructor/settings/business", keywords: "terms conditions policy legal" },
        { label: "Cancellation policy", href: "/instructor/settings/business", keywords: "cancellation policy" },
        { label: "No-show policy", href: "/instructor/settings/business", keywords: "no show policy" },
        { label: "GDPR data retention", href: "/instructor/settings/business", keywords: "gdpr privacy data retention" },
        { label: "GPS tracking setup", href: "/instructor/settings/vehicle", keywords: "gps tracking obd telematics geotab" },
        { label: "Saved routes", href: "/instructor/settings/vehicle", keywords: "saved routes" },
        { label: "Fuel & MPG", href: "/instructor/settings/vehicle", keywords: "fuel mpg economy" },
        { label: "Mileage log", href: "/instructor/settings/vehicle", keywords: "mileage log hmrc tax" },
        { label: "Notification preferences", href: "/instructor/settings/comms", keywords: "notifications preferences email sms push" },
        { label: "Push notifications", href: "/instructor/settings/comms", keywords: "push notifications mobile" },
        { label: "AI phone assistant", href: "/instructor/settings/phone-ai", keywords: "ai phone famulor voice agent call answering" },
        { label: "WhatsApp Business", href: "/instructor/settings/whatsapp", keywords: "whatsapp business meta" },
        { label: "Accessibility", href: "/instructor/settings/accessibility", keywords: "accessibility a11y font size contrast" },
        { label: "Data export & backup", href: "/instructor/settings/advanced", keywords: "export backup csv download" },
        { label: "Reset statistics", href: "/instructor/settings/advanced", keywords: "reset clear stats history" },
      ];
      const matchedSettings = settingsPages.filter((p) => {
        const hay = `${p.label.toLowerCase()} ${(p.keywords || "")} ${p.href.toLowerCase().replace(/[/-]/g, " ")}`;
        if (hay.includes(lowerQ)) return true;
        return expansions.some((e) => hay.includes(e));
      });
      // Dedupe by href+label
      const seen = new Set<string>();
      for (const s of matchedSettings.slice(0, 10)) {
        const key = `${s.href}|${s.label}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ id: key, name: s.label, subtitle: "Settings", href: s.href });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [mobileSearchQuery, instructor?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  const handleNavClick = (href: string) => {
    navigate(href);
    setIsMobileMenuOpen(false);
  };

  const drawerIconTint = (index: number) => {
    const tints = [
      { bg: "hsl(var(--dsm-tint-blue-bg))", fg: "hsl(var(--dsm-tint-blue-fg))" },
      { bg: "hsl(var(--dsm-tint-green-bg))", fg: "hsl(var(--dsm-tint-green-fg))" },
      { bg: "hsl(var(--dsm-tint-purple-bg))", fg: "hsl(var(--dsm-tint-purple-fg))" },
      { bg: "hsl(var(--dsm-tint-orange-bg))", fg: "hsl(var(--dsm-tint-orange-fg))" },
      { bg: "hsl(var(--dsm-tile-icon-bg))", fg: "hsl(var(--dsm-text))" },
    ];
    return tints[index % tints.length];
  };

  const renderDrawerBadge = (link: (typeof sidebarLinks)[number], isActive: boolean) => {
    if (isActive) return null;
    if (link.href === "/instructor/messages") return <MessageNotificationBadge instructorId={instructor?.id} className="ml-auto" />;
    if (link.href === "/instructor/admin-chat") return <AdminMessageBadge />;
    if (link.href === "/instructor/visitor-chats") return <VisitorChatBadge instructorId={instructor?.id} className="ml-auto" />;
    if (link.href === "/instructor/pending-scheduling") return <PendingSchedulingBadge instructorId={instructor?.id} className="ml-auto" />;
    return null;
  };

  const DrawerRow = ({
    icon: Icon,
    label,
    active = false,
    destructive = false,
    onClick,
    children,
  }: {
    icon: ElementType;
    label: string;
    active?: boolean;
    destructive?: boolean;
    index?: number;
    onClick: () => void;
    children?: ReactNode;
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          marginBottom: 2,
          background: active ? "#EEF3FF" : "transparent",
          border: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            flexShrink: 0,
            background: destructive ? "#FFF0F0" : active ? "#0A0F29" : "#F2F4F8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            size={14}
            strokeWidth={1.6}
            color={destructive ? "#CC2229" : active ? "#FFFFFF" : "#5B6B8A"}
          />
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            fontWeight: active ? 700 : 600,
            color: destructive ? "#CC2229" : active ? "#0A0F29" : "#1A1A1A",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        {active ? (
          <span style={{ width: 6, height: 6, borderRadius: 3, background: "#0A0F29", flexShrink: 0 }} />
        ) : children ? (
          children
        ) : !destructive ? (
          <ChevronRight size={12} color="#C7C7CC" strokeWidth={1.8} />
        ) : null}
      </button>
    );
  };

  const DrawerSectionLabel = ({ children }: { children: ReactNode }) => (
    <div
      style={{
        padding: "12px 4px 4px",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: "#8E8E93",
      }}
    >
      {children}
    </div>
  );

  // Friendly label override (sentence case, shorter)
  const friendlyLabel = (label: string) =>
    label === "Test Results" ? "Test results"
    : label === "Test Swap" ? "Test swap"
    : label === "GPS Tracking" ? "GPS tracking"
    : label === "Contact Admin" ? "Contact admin"
    : label === "Visitor Chats" ? "Visitor chats"
    : label === "Fill Gaps" ? "Fill gaps"
    : label === "Saved Routes" ? "Saved routes"
    : label === "Mini Website" ? "Mini website"
    : label;

  // Curated drawer sections (routes & items unchanged — just re-ordered/grouped)
  const drawerPrimaryHrefs = ["/instructor", "/instructor/schedule", "/instructor/pupils", "/instructor/pay"];
  const drawerSecondaryHrefs = [
    "/instructor/availability",
    "/instructor/pending-scheduling",
    "/instructor/test-results",
    "/instructor/test-requests",
    "/instructor/jobs",
  ];
  const drawerPrimary = drawerPrimaryHrefs
    .map((h) => sidebarLinks.find((l) => l.href === h))
    .filter(Boolean) as typeof sidebarLinks;
  const drawerSecondary = drawerSecondaryHrefs
    .map((h) => sidebarLinks.find((l) => l.href === h))
    .filter(Boolean) as typeof sidebarLinks;
  const usedHrefs = new Set([...drawerPrimaryHrefs, ...drawerSecondaryHrefs]);
  // Preserve original group order for the rest
  const drawerExtraGroups = sidebarGroups
    .map((g) => ({
      label: g.label,
      items: g.items.filter((i) => !usedHrefs.has(i.href)),
    }))
    .filter((g) => g.items.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Tab roots — no back button on these
  const tabRootPaths = ["/instructor", "/instructor/schedule", "/instructor/tracking", "/instructor/pupils", "/instructor/menu"];
  const isTabRoot = tabRootPaths.includes(location.pathname);
  const showBackButton = !isTabRoot;
  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const headerLabel = firstName;
  const mobilePageTitle = sidebarLinks.find(l => l.href === location.pathname)?.label || "Dashboard";

  // Mobile Layout
  if (isMobile) {
    return (
      <RealtimeHubProvider instructorId={instructor?.id}>
      <GlobalSyncBridge instructorId={instructor?.id} />
      <UrgentAlertOverlay alerts={urgentAlerts} onDismiss={dismissUrgentAlert} />
      {!endWizardLesson && <LessonEndAlert lesson={overdueLesson} onComplete={handleCompleteLessonAlert} onDismiss={dismissLessonAlert} />}
      {endWizardLesson && instructor?.id && (
        <EndLessonWizard
          open={!!endWizardLesson}
          onOpenChange={(open) => !open && setEndWizardLesson(null)}
          lessonId={endWizardLesson.id}
          pupilId={endWizardLesson.pupilId}
          pupilName={endWizardLesson.pupilName}
          instructorId={instructor.id}
          durationMinutes={endWizardLesson.durationMinutes}
          lessonDate={endWizardLesson.lessonDate}
          startTime={endWizardLesson.startTime}
          currentBalance={endWizardLesson.currentBalance}
          onCompleted={() => { dismissLessonAlert(endWizardLesson.id); setEndWizardLesson(null); }}
        />
      )}
      <div
        className={cn(
          "min-h-screen instructor-portal ios-instructor a11y-scope",
           isFullscreenMode ? "h-[100dvh] overflow-hidden bg-background" : "pb-16 instructor-shell-bg",
           !isFullscreenMode && isHomePage && "home-white-top"
        )}
      >
        {!isFullscreenMode && (
          <>
            {/* iOS Install Banner */}
            <IOSInstallBanner />

            {/* Mobile Header — iOS Blue Gradient */}
            <MobileBlueHeader
              instructorId={instructor?.id}
              firstName={firstName}
              profileImageUrl={instructor?.profile_image_url}
              isOnline={instructor?.is_active ?? true}
              showBackButton={showBackButton}
              showGreeting={!showBackButton}
              surface={isHomePage ? "white" : "page"}
              isHomePage={isHomePage}
              pageTitle={mobilePageTitle}
              onBack={() => navigate(-1)}
              onSOS={() => setShowSOS(true)}
              onPlus={() => setHeaderQuickActionsOpen(true)}
              onMenu={() => setIsMobileMenuOpen(true)}
            />

            {/* Hidden mobile menu Sheet (controlled via header) */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent
                side="right"
                className="dsm-instructor a11y-scope flex w-[84vw] max-w-[360px] flex-col border-0 bg-none p-0 opacity-100 backdrop-blur-none [&>button]:hidden"
                style={{
                  backgroundColor: "#F2F4F8",
                  borderTopLeftRadius: 24,
                  borderBottomLeftRadius: 24,
                  boxShadow: "-12px 0 40px rgba(0,0,0,0.18)",
                  overflow: "hidden",
                }}
              >
                <SheetHeader className="space-y-0 text-left">
                  <SheetTitle className="sr-only">Instructor menu</SheetTitle>
                  <div style={{ backgroundColor: "#0A0F29", padding: "20px 16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: "#CC2229",
                            border: "2px solid rgba(255,255,255,0.3)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {instructor?.profile_image_url ? (
                            <img
                              src={instructor.profile_image_url}
                              alt=""
                              style={{ width: 42, height: 42, objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#FFF" }}>
                              {instructor?.name?.charAt(0)?.toUpperCase() || "I"}
                            </span>
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#FFF",
                              letterSpacing: -0.2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {instructor?.name || "Instructor"}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.6)",
                              marginTop: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {instructor?.email}
                          </div>
                        </div>
                      </div>
                      <SheetClose
                        aria-label="Close menu"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          background: "rgba(255,255,255,0.15)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: 0,
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                      >
                        <X size={14} strokeWidth={2} color="#FFF" />
                      </SheetClose>
                    </div>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={14}
                        strokeWidth={2}
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "rgba(255,255,255,0.7)",
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search pupils, lessons, pages…"
                        value={mobileSearchQuery}
                        onChange={(e) => setMobileSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          backgroundColor: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 12,
                          padding: "9px 34px 9px 32px",
                          color: "#FFF",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                      {mobileSearchQuery && (
                        <button
                          type="button"
                          onClick={() => { setMobileSearchQuery(""); setMobileSearchResults([]); }}
                          aria-label="Clear search"
                          style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: 0,
                            color: "rgba(255,255,255,0.7)",
                            cursor: "pointer",
                            padding: 4,
                          }}
                        >
                          <X size={12} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </div>
                </SheetHeader>

                {mobileSearchQuery.length >= 2 && (
                  <div
                    className="overflow-y-auto"
                    style={{
                      margin: "8px 12px 0",
                      maxHeight: 240,
                      borderRadius: 12,
                      backgroundColor: "#FFF",
                      border: "1px solid rgba(0,0,0,0.06)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    {mobileSearchResults.length === 0 ? (
                      <div className="flex flex-col items-center gap-1 p-4">
                        <Search className="h-5 w-5 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No results found</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {mobileSearchResults.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigate(item.href || `/instructor/pupils?pupil=${item.id}`);
                              setIsMobileMenuOpen(false);
                              setMobileSearchQuery("");
                              setMobileSearchResults([]);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
                          >
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                              {item.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}


                <nav
                  className="flex-1 overflow-y-auto"
                  style={{ padding: "8px 12px", maxHeight: "calc(100dvh - 180px)" }}
                >
                  <DrawerSectionLabel>Primary</DrawerSectionLabel>
                  {drawerPrimary.map((link) => {
                    const isActive = location.pathname === link.href;
                    return (
                      <DrawerRow
                        key={link.href}
                        icon={link.icon}
                        label={friendlyLabel(link.label)}
                        active={isActive}
                        onClick={() => handleNavClick(link.href)}
                      >
                        {renderDrawerBadge(link, isActive)}
                      </DrawerRow>
                    );
                  })}

                  <DrawerSectionLabel>Secondary</DrawerSectionLabel>
                  {drawerSecondary.map((link) => {
                    const isActive = location.pathname === link.href;
                    const isPending = link.href === "/instructor/pending-scheduling";
                    return (
                      <DrawerRow
                        key={link.href}
                        icon={link.icon}
                        label={friendlyLabel(link.label)}
                        active={isActive}
                        onClick={() => handleNavClick(link.href)}
                      >
                        {!isActive && isPending && pendingCount > 0 ? (
                          <span
                            style={{
                              backgroundColor: "#FFF6E6",
                              color: "#B45309",
                              borderRadius: 8,
                              minWidth: 16,
                              height: 16,
                              padding: "0 4px",
                              fontSize: 8,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {pendingCount}
                          </span>
                        ) : (
                          renderDrawerBadge(link, isActive)
                        )}
                      </DrawerRow>
                    );
                  })}

                  <DrawerSectionLabel>Tools</DrawerSectionLabel>
                  <DrawerRow
                    icon={Search}
                    label="Search"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setMobileSearchOpen(true);
                      setMobileSearchQuery("");
                      setMobileSearchResults([]);
                    }}
                  />
                  <DrawerRow
                    icon={Headphones}
                    label="Voice assistant"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleVoiceTap();
                    }}
                  />

                  {drawerExtraGroups.map((group) => (
                    <div key={group.label}>
                      <DrawerSectionLabel>
                        {group.label.charAt(0) + group.label.slice(1).toLowerCase()}
                      </DrawerSectionLabel>
                      {group.items.map((link) => {
                        const isActive = location.pathname === link.href;
                        return (
                          <DrawerRow
                            key={link.href}
                            icon={link.icon}
                            label={friendlyLabel(link.label)}
                            active={isActive}
                            onClick={() => handleNavClick(link.href)}
                          >
                            {renderDrawerBadge(link, isActive)}
                          </DrawerRow>
                        );
                      })}
                    </div>
                  ))}

                  <DrawerSectionLabel>Account</DrawerSectionLabel>
                  <DrawerRow
                    icon={LogOut}
                    label="Sign out"
                    destructive
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  />
                </nav>
              </SheetContent>
            </Sheet>

            {/* Mobile Search Overlay */}
            {mobileSearchOpen && (
              <div className="sticky top-14 z-30 bg-background border-b border-border shadow-md px-3 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={mobileSearchQuery}
                    onChange={(e) => setMobileSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full h-10 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={() => { setMobileSearchOpen(false); setMobileSearchQuery(""); setMobileSearchResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {mobileSearchQuery.length >= 2 && (
                  <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                    {mobileSearchResults.length === 0 ? (
                      <div className="flex flex-col items-center gap-1 p-4">
                        <Search className="h-5 w-5 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No results found</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {mobileSearchResults.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigate(item.href || `/instructor/pupils?pupil=${item.id}`);
                              setMobileSearchOpen(false);
                              setMobileSearchQuery("");
                              setMobileSearchResults([]);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
                          >
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                              {item.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {isFullscreenMode ? (
          <main className="h-[100dvh] overflow-hidden">{children}</main>
        ) : (
          <>
            <OfflineBanner />
            <main className={`ios-scroll ${location.pathname === '/instructor' ? '' : 'px-4 py-4'}`} style={{ backgroundColor: 'transparent' }}>{children}</main>
            <InstructorBottomNav wallpaperColor={appStyleBg} voiceState={voiceAssistant.state} onVoiceTap={handleVoiceTap} />
            <VoiceAssistantOverlay state={voiceAssistant.state} transcript={voiceAssistant.transcript} responseText={voiceAssistant.responseText} onCancel={voiceAssistant.cancel} />
          </>
        )}

        {/* Header Quick Actions Popover */}
        <QuickActionsPopoverMenu
          open={headerQuickActionsOpen}
          onClose={() => setHeaderQuickActionsOpen(false)}
        />

        {/* Take Payment Modal */}
        <TakePaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          paymentQrUrl={getActivePaymentQrUrl(instructor)}
          commissionPayer={instructor?.commission_payer}
          commissionSplitPercent={instructor?.commission_split_percent}
          instructorName={instructor?.name}
          instructorId={instructor?.id}
          pupils={pupils}
        />

        {/* SOS Emergency Sheet */}
        <SOSEmergencySheet
          open={showSOS}
          onOpenChange={setShowSOS}
          instructorId={instructor?.id}
          instructorName={instructor?.name}
        />
      </div>
      </RealtimeHubProvider>
    );
  }

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    // Exact match first
    const exactMatch = desktopNavTabs.find(tab => tab.id === path);
    if (exactMatch) return exactMatch.id;
    // Prefix match for sub-pages
    const prefixMatch = desktopNavTabs
      .filter(tab => tab.id !== "/instructor")
      .find(tab => path.startsWith(tab.id));
    if (prefixMatch) return prefixMatch.id;
    // Money group
    if (["/instructor/expenses", "/instructor/accounts", "/instructor/income", "/instructor/in-out", "/instructor/tax", "/instructor/mileage"].some(p => path.startsWith(p))) return "/instructor/pay";
    // Schedule group
    if (["/instructor/availability", "/instructor/pending-scheduling"].some(p => path.startsWith(p))) return "/instructor/schedule";
    // Pupils group
    if (["/instructor/jobs", "/instructor/gaps"].some(p => path.startsWith(p))) return "/instructor/pupils";
    // Messages group
    if (["/instructor/admin-chat", "/instructor/visitor-chats"].some(p => path.startsWith(p))) return "/instructor/messages";
    // Website group
    if (path.startsWith("/instructor/domains")) return "/instructor/website";
    // Fleet dashboard -> GPS tab
    if (path.startsWith("/instructor/fleet-dashboard")) return "/instructor/tracking";
    return "/instructor";
  };

  const activeTab = getActiveTab();

  // Get page title from current path
  const getPageTitle = () => {
    const match = sidebarLinks.find(l => l.href === location.pathname);
    return match?.label || "Dashboard";
  };

  const getGroupTitle = () => {
    const tab = desktopNavTabs.find(t => t.id === activeTab);
    return tab?.label || "Home";
  };

  // Desktop Layout - Sidebar
  // Desktop: unify all instructor pages under DashboardShell so the sidebar
  // and top chrome match the rest of the portal. Mobile branch above is untouched.
  const initials = (instructor?.name || "I")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const { total: notificationTotal } = useCombinedNotificationCount(instructor?.id);

  return (
    <RealtimeHubProvider instructorId={instructor?.id}>
      <GlobalSyncBridge instructorId={instructor?.id} />
      <UrgentAlertOverlay alerts={urgentAlerts} onDismiss={dismissUrgentAlert} />
      {!endWizardLesson && <LessonEndAlert lesson={overdueLesson} onComplete={handleCompleteLessonAlert} onDismiss={dismissLessonAlert} />}
      {endWizardLesson && instructor?.id && (
        <EndLessonWizard
          open={!!endWizardLesson}
          onOpenChange={(open) => !open && setEndWizardLesson(null)}
          lessonId={endWizardLesson.id}
          pupilId={endWizardLesson.pupilId}
          pupilName={endWizardLesson.pupilName}
          instructorId={instructor.id}
          durationMinutes={endWizardLesson.durationMinutes}
          lessonDate={endWizardLesson.lessonDate}
          startTime={endWizardLesson.startTime}
          currentBalance={endWizardLesson.currentBalance}
          onCompleted={() => { dismissLessonAlert(endWizardLesson.id); setEndWizardLesson(null); }}
        />
      )}
      <CommandPalette variant="instructor" />
      <DashboardShell
        userInitials={initials}
        userName={instructor?.name || "Instructor"}
        notificationCount={notificationTotal}
        onSignOut={handleSignOut}
        onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
        onBell={() => navigate("/instructor/notifications")}
      >
        {children}
      </DashboardShell>
      <VoiceAssistantOverlay state={voiceAssistant.state} transcript={voiceAssistant.transcript} responseText={voiceAssistant.responseText} onCancel={voiceAssistant.cancel} />
    </RealtimeHubProvider>
  );
}
