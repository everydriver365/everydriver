import { ReactNode, useState, useEffect } from "react";
import { useUrgentAlerts } from "@/hooks/useUrgentAlerts";
import { UrgentAlertOverlay } from "@/components/instructor/UrgentAlertOverlay";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home, 
  Calendar, 
  CalendarClock,
  Users, 
  Briefcase, 
  CreditCard, 
  Settings,
  LogOut,
  Receipt,
  Navigation,
  MapPin,
  ArrowLeft,
  Moon,
  Sun,
  Wallet,
  Globe,
  Globe2,
  MessageCircle,
  Headphones,
  ShieldCheck,
  ClipboardList,
  Award,
  ChevronRight,
  Radio,
  Menu,
  X,
  Plus,
  Car,
  PoundSterling,
  Search,
  PanelLeftClose,
  PanelLeft,
  Bell
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Check, Monitor, Contrast } from "lucide-react";

import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/CommandPalette";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { TakePaymentSheet } from "@/components/instructor/TakePaymentSheet";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { QuickActionsFAB } from "@/components/instructor/QuickActionsFAB";
import { LayoutGrid } from "lucide-react";

import instructorLogo from "@/assets/ed-black-white-logo.png";
import { IOSInstallBanner } from "@/components/pwa/IOSInstallBanner";
import { MessageNotificationBadge } from "@/components/instructor/MessageNotificationBadge";
import { VisitorChatBadge } from "@/components/instructor/VisitorChatBadge";
import { AdminMessageBadge } from "@/components/instructor/AdminMessageBadge";
import { HeaderSearchBox } from "@/components/HeaderSearchBox";
import { PendingSchedulingBadge } from "@/components/instructor/PendingSchedulingBadge";
import { PlanBadge } from "@/components/instructor/PlanBadge";

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
      { href: "/instructor/website", label: "Mini Website", icon: Globe },
      { href: "/instructor/domains", label: "Domains", icon: Globe2 },
      { href: "/instructor/traccar", label: "GPS Tracking", icon: Radio },
      { href: "/instructor/settings", label: "Settings", icon: Settings },
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
  { id: "/instructor/traccar", label: "GPS", icon: Radio },
  { id: "/instructor/website", label: "Website", icon: Globe },
  { id: "/instructor/settings", label: "Settings", icon: Settings },
];

interface InstructorPortalLayoutProps {
  children: ReactNode;
}

export function InstructorPortalLayout({ children }: InstructorPortalLayoutProps) {
  const { instructor, subscription, signOut, loading } = useInstructorAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pupils, setPupils] = useState<Array<{ id: string; name: string; phone?: string | null; email?: string | null; account_balance?: number | null }>>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { alerts: urgentAlerts, dismissAlert: dismissUrgentAlert } = useUrgentAlerts(instructor?.id);
  
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileSearchResults, setMobileSearchResults] = useState<Array<{ id: string; name: string; subtitle: string; href?: string }>>([]);

  const isTrackingPage = location.pathname.startsWith("/instructor/traccar");
  
  // Check for fullscreen mode (used when tracking is active)
  const searchParams = new URLSearchParams(location.search);
  const isFullscreenMode = isTrackingPage && searchParams.get("fullscreen") === "true";

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

      // Search pages
      const pages = sidebarLinks.filter(p => p.label.toLowerCase().includes(lowerQ));
      items.push(...pages.map(p => ({
        id: p.href,
        name: p.label,
        subtitle: "Page",
        href: p.href,
      })));

      setMobileSearchResults(items);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check if on main dashboard (don't show back button)
  const showBackButton = location.pathname !== "/instructor";

  // Mobile Layout
  if (isMobile) {
    return (
      <>
      <UrgentAlertOverlay alerts={urgentAlerts} onDismiss={dismissUrgentAlert} />
      <div
        className={cn(
          "min-h-screen overflow-x-hidden instructor-portal",
           isFullscreenMode ? "h-[100dvh] overflow-hidden bg-background" : "pb-20 bg-[#E8F1FE] dark:bg-background"
        )}
      >
        {!isFullscreenMode && (
          <>
            {/* iOS Install Banner */}
            <IOSInstallBanner />

            {/* Mobile Header - White background with dark icons */}
            <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
              <div className="flex items-center justify-between px-3 sm:px-4 h-14">
                {/* Left: Hamburger Menu + Logo */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary/80 hover:text-primary hover:bg-[#D1E4FC] -ml-2 h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] p-0">
                      <SheetHeader className="p-4 border-b">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={instructor?.profile_image_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {instructor?.name?.charAt(0) || "I"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-medium text-sm truncate">{instructor?.name || "Instructor"}</p>
                            <p className="text-xs text-muted-foreground truncate">{instructor?.email}</p>
                          </div>
                        </div>
                      </SheetHeader>

                      {/* Navigation Links */}
                      <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                        {sidebarLinks.map((link) => {
                          const isActive = location.pathname === link.href;
                          const isMessages = link.href === "/instructor/messages";
                          const isAdminChat = link.href === "/instructor/admin-chat";
                          const isVisitorChats = link.href === "/instructor/visitor-chats";
                          const isPendingScheduling = link.href === "/instructor/pending-scheduling";
                          const isHighlighted = "highlight" in link && link.highlight;
                          return (
                            <button
                              key={link.href}
                              onClick={() => handleNavClick(link.href)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : isHighlighted
                                  ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              <span className="relative">
                                <link.icon
                                  className={cn(
                                    "h-5 w-5",
                                    isHighlighted && !isActive && "text-emerald-500"
                                  )}
                                />
                                {isAdminChat && !isActive && <AdminMessageBadge />}
                              </span>
                              {link.label}
                              {isVisitorChats && !isActive && (
                                <VisitorChatBadge instructorId={instructor?.id} className="ml-auto" />
                              )}
                              {isMessages && !isActive && (
                                <MessageNotificationBadge instructorId={instructor?.id} className="ml-auto" />
                              )}
                              {isPendingScheduling && !isActive && (
                                <PendingSchedulingBadge instructorId={instructor?.id} className="ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </nav>

                      {/* Menu Footer */}
                      <div className="p-3 border-t mt-auto">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            handleSignOut();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Sign Out
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Logo + Plan Badge */}
                  <img 
                    src={instructorLogo}
                    alt="EveryDriver" 
                    className="h-4 sm:h-5 object-contain"
                  />
                  <PlanBadge planSlug={subscription?.plan_slug} size="sm" showUpgrade onUpgradeClick={() => navigate("/instructor/plans")} />
                </div>

                {/* Right: Settings, QR, Schedule, ADD, Avatar */}
                <div className="flex items-center gap-0.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-foreground hover:bg-[#D1E4FC] h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                        title="Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
                      <DropdownMenuItem onClick={() => navigate("/instructor/settings")} className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                        <Sun className="h-4 w-4 mr-2" />
                        Light Mode
                        {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                        <Moon className="h-4 w-4 mr-2" />
                        Dark Mode
                        {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('oled')} className="cursor-pointer">
                        <Contrast className="h-4 w-4 mr-2" />
                        OLED Dark Mode
                        {theme === 'oled' && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                      {location.pathname === "/instructor" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate("/instructor?editTiles=true")} className="cursor-pointer">
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Customize Tiles
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setMobileSearchOpen(prev => !prev); setMobileSearchQuery(""); setMobileSearchResults([]); }}
                    className="text-foreground hover:bg-[#D1E4FC] h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                    title="Search"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPaymentSheet(true)}
                    className="text-foreground hover:bg-[#D1E4FC] h-7 sm:h-8 gap-1 px-2 shrink-0"
                    title="Take Payment"
                  >
                    <PoundSterling className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold">Pay</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/instructor/availability")}
                    className="text-foreground hover:bg-[#D1E4FC] h-7 w-7 sm:h-8 sm:w-8"
                    title="Availability"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#00C853] hover:bg-[#00B84D] text-white shrink-0"
                        title="Quick Actions"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
                      <DropdownMenuItem onClick={() => navigate("/instructor/pupils?action=add")} className="cursor-pointer">
                        <Users className="h-4 w-4 mr-2" />
                        Add Pupil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/instructor/schedule?action=add")} className="cursor-pointer">
                        <Calendar className="h-4 w-4 mr-2" />
                        Add Lesson
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/instructor/find-my-car")} className="cursor-pointer">
                        <Car className="h-4 w-4 mr-2" />
                        Find My Car
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/instructor/availability")} className="cursor-pointer">
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Availability
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowPaymentSheet(true)} className="cursor-pointer">
                        <PoundSterling className="h-4 w-4 mr-2" />
                        Take Payment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Avatar
                    className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-border cursor-pointer shrink-0"
                    onClick={() => navigate("/instructor/settings")}
                  >
                    <AvatarImage src={instructor?.profile_image_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {instructor?.name?.charAt(0) || "I"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </header>

            {/* Mobile Search Overlay */}
            {mobileSearchOpen && (
              <div className="sticky top-14 z-30 bg-background border-b border-border shadow-md px-3 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search pupils..."
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
            <main className={`overflow-x-hidden ${location.pathname === '/instructor' ? '' : 'px-4 py-4'}`}>{children}</main>
            <InstructorBottomNav />
          </>
        )}

        {/* Payment Sheet */}
        <TakePaymentSheet
          open={showPaymentSheet}
          onOpenChange={setShowPaymentSheet}
          paymentQrUrl={getActivePaymentQrUrl(instructor)}
          instructorName={instructor?.name}
          instructorId={instructor?.id}
          pupils={pupils}
          onShowQR={() => { setShowPaymentSheet(false); setShowQRModal(true); }}
          onRecordPayment={() => { setShowPaymentSheet(false); navigate("/instructor/pupils"); }}
        />

        {/* QR Code Modal */}
        <PaymentQRModal
          open={showQRModal}
          onOpenChange={setShowQRModal}
          paymentQrUrl={getActivePaymentQrUrl(instructor)}
          instructorId={instructor?.id}
          instructorName={instructor?.name}
        />
      </div>
      </>
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

  // Desktop Layout - Bold & Branded
  return (
    <>
      <UrgentAlertOverlay alerts={urgentAlerts} onDismiss={dismissUrgentAlert} />
      <CommandPalette variant="instructor" />
      <div className="min-h-screen flex flex-col w-full bg-background instructor-portal">
        {/* Navy Blue Header */}
        <header className="sticky top-0 z-50 bg-[#142040] shadow-lg">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Left: Collapse toggle + Search + Plan */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 hidden lg:flex"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
              <HeaderSearchBox variant="instructor" instructorId={instructor?.id} />
            </div>

            {/* Center: Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-0.5">
              {desktopNavTabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </Link>
              ))}
            </nav>
              <PlanBadge planSlug={subscription?.plan_slug} size="sm" showUpgrade onUpgradeClick={() => navigate("/instructor/plans")} />

            {/* Right: Notifications + Theme + Avatar */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 relative"
                onClick={() => navigate("/instructor/messages")}
              >
                <Bell className="h-4 w-4" />
                <MessageNotificationBadge instructorId={instructor?.id} className="absolute -top-0.5 -right-0.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
                  >
                    {resolvedTheme === 'oled' ? <Contrast className="h-4 w-4" /> : resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                    <Sun className="h-4 w-4 mr-2" /> Light
                    {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                    <Moon className="h-4 w-4 mr-2" /> Dark
                    {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('oled')} className="cursor-pointer">
                    <Contrast className="h-4 w-4 mr-2" /> OLED
                    {theme === 'oled' && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                    <Monitor className="h-4 w-4 mr-2" /> System
                    {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/10 transition-colors">
                    <Avatar className="h-7 w-7 border border-white/20">
                      <AvatarImage src={instructor?.profile_image_url || undefined} />
                      <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                        {instructor?.name?.charAt(0) || "I"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-white/80 hidden xl:inline">{instructor?.name?.split(' ')[0]}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{instructor?.name || "Instructor"}</p>
                    <p className="text-xs text-muted-foreground">{instructor?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate("/instructor/settings")} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="border-b bg-muted/30 px-6 py-1.5">
          <nav className="flex items-center text-xs text-muted-foreground">
            <Link to="/instructor" className="hover:text-foreground transition-colors">
              Instructor
            </Link>
            <ChevronRight className="h-3 w-3 mx-1.5" />
            <span className="text-muted-foreground">{getGroupTitle()}</span>
            {getPageTitle() !== getGroupTitle() && (
              <>
                <ChevronRight className="h-3 w-3 mx-1.5" />
                <span className="text-foreground font-medium">{getPageTitle()}</span>
              </>
            )}
          </nav>
        </div>

        {/* Content area with sidebar */}
        <div className="flex flex-1">
          {/* Grouped Sidebar */}
          <aside className={cn(
            "border-r bg-card hidden lg:flex flex-col shrink-0 transition-all duration-200",
            sidebarCollapsed ? "w-14" : "w-52"
          )}>
            <nav className="flex-1 py-2 px-2 overflow-y-auto">
              {sidebarGroups.map((group) => (
                <div key={group.label} className="mb-3">
                  {!sidebarCollapsed && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((link) => {
                      const isActive = location.pathname === link.href;
                      const isMessages = link.href === "/instructor/messages";
                      const isAdminChat = link.href === "/instructor/admin-chat";
                      const isVisitorChats = link.href === "/instructor/visitor-chats";
                      const isPendingScheduling = link.href === "/instructor/pending-scheduling";
                      const isHighlighted = 'highlight' in link && link.highlight;
                      return (
                        <Link
                          key={link.href}
                          to={link.href}
                          title={sidebarCollapsed ? link.label : undefined}
                          className={cn(
                            "flex items-center gap-2.5 py-1.5 text-sm transition-all rounded-md",
                            sidebarCollapsed ? "justify-center px-0" : "px-2.5",
                            isActive
                              ? "text-foreground font-medium bg-primary/10 border-l-2 border-primary"
                              : isHighlighted
                              ? "text-emerald-600 dark:text-emerald-400 hover:bg-muted/50"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <span className="relative shrink-0">
                            <link.icon className={cn(
                              "h-4 w-4",
                              isActive ? "text-primary" : isHighlighted ? "text-emerald-500" : ""
                            )} />
                            {isAdminChat && !isActive && <AdminMessageBadge />}
                          </span>
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1 truncate text-[13px]">{link.label}</span>
                              {isVisitorChats && !isActive && (
                                <VisitorChatBadge instructorId={instructor?.id} className="ml-auto" />
                              )}
                              {isMessages && !isActive && (
                                <MessageNotificationBadge instructorId={instructor?.id} className="ml-auto" />
                              )}
                              {isPendingScheduling && !isActive && (
                                <PendingSchedulingBadge instructorId={instructor?.id} className="ml-auto" />
                              )}
                            </>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* User info at bottom */}
            {!sidebarCollapsed && (
              <div className="border-t p-2">
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={instructor?.profile_image_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {instructor?.name?.charAt(0) || "I"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{instructor?.name || "Instructor"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{instructor?.email}</p>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
      
    </>
  );
}
