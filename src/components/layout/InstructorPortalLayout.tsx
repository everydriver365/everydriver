import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Plus
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/CommandPalette";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { QuickActionsFAB } from "@/components/instructor/QuickActionsFAB";

const instructorLogo = "/everydriver-logo-instructor.png";
import { IOSInstallBanner } from "@/components/pwa/IOSInstallBanner";
import { MessageNotificationBadge } from "@/components/instructor/MessageNotificationBadge";
import { VisitorChatBadge } from "@/components/instructor/VisitorChatBadge";
import { AdminMessageBadge } from "@/components/instructor/AdminMessageBadge";
import { PendingSchedulingBadge } from "@/components/instructor/PendingSchedulingBadge";

const sidebarLinks = [
  { href: "/instructor", label: "Dashboard", icon: Home },
  { href: "/instructor/schedule", label: "Schedule", icon: Calendar },
  { href: "/instructor/availability", label: "Availability", icon: CalendarClock },
  { href: "/instructor/pending-scheduling", label: "Pending Scheduling", icon: ClipboardList },
  { href: "/instructor/pupils", label: "Pupils", icon: Users },
  { href: "/instructor/test-results", label: "Test Results", icon: Award },
  { href: "/instructor/jobs", label: "Jobs", icon: Briefcase },
  { href: "/instructor/pay", label: "Payments", icon: CreditCard },
  { href: "/instructor/accounts", label: "Accounts", icon: Wallet },
  { href: "/instructor/expenses", label: "Expenses", icon: Receipt },
  { href: "/instructor/gaps", label: "Fill Gaps", icon: MapPin },
  { href: "/instructor/routes", label: "Saved Routes", icon: Navigation },
  { href: "/instructor/messages", label: "Messages", icon: MessageCircle },
  { href: "/instructor/admin-chat", label: "Contact Admin", icon: ShieldCheck, highlight: true },
  { href: "/instructor/visitor-chats", label: "Visitor Chats", icon: Headphones },
  { href: "/instructor/website", label: "Mini Website", icon: Globe },
  { href: "/instructor/domains", label: "Domains", icon: Globe2 },
  { href: "/instructor/traccar", label: "GPS Tracking", icon: Radio },
  { href: "/instructor/settings", label: "Settings", icon: Settings },
];

interface InstructorPortalLayoutProps {
  children: ReactNode;
}

export function InstructorPortalLayout({ children }: InstructorPortalLayoutProps) {
  const { instructor, signOut, loading } = useInstructorAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { resolvedTheme, setTheme } = useTheme();
  const [showQRModal, setShowQRModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isTrackingPage = location.pathname.startsWith("/instructor/traccar");

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

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
      <div
        className={cn(
          "min-h-screen overflow-x-hidden",
          isTrackingPage ? "h-[100dvh] overflow-hidden bg-background" : "pb-20 bg-[#f0f0f0]"
        )}
      >
        {!isTrackingPage && (
          <>
            {/* iOS Install Banner */}
            <IOSInstallBanner />

            {/* Mobile Header - White background with dark icons */}
            <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
              <div className="flex items-center justify-between px-4 h-14">
                {/* Left: Hamburger Menu + Logo */}
                <div className="flex items-center gap-3">
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary/80 hover:text-primary hover:bg-primary/10 -ml-2 h-9 w-9"
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

                  {/* Logo */}
                  <img 
                    src={instructorLogo}
                    alt="EveryDriver" 
                    className="h-6 object-contain"
                  />
                </div>

                {/* Right: Quick Add, QR, Availability, Avatar */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/instructor?openQuickActions=true")}
                    className="h-8 w-8 rounded-full bg-[#00C853] hover:bg-[#00B84D] text-white shadow-sm"
                    title="Quick Actions"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                  </Button>
                  {instructor?.payment_qr_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQRModal(true)}
                      className="text-primary/80 hover:text-primary hover:bg-primary/10 h-8 px-2"
                    >
                      <span className="text-xs font-bold border border-current rounded px-1">QR</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/instructor/availability")}
                    className="text-primary/80 hover:text-primary hover:bg-primary/10 h-8 w-8"
                    title="Quick Availability"
                  >
                    <CalendarClock className="h-5 w-5" />
                  </Button>
                  <Avatar
                    className="h-9 w-9 border-2 border-border cursor-pointer"
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
          </>
        )}

        {isTrackingPage ? (
          <main className="h-[100dvh] overflow-hidden">{children}</main>
        ) : (
          <>
            <main className="px-4 py-4 overflow-x-hidden">{children}</main>
            <InstructorBottomNav />
          </>
        )}

        {/* QR Code Modal */}
        {instructor?.payment_qr_url && (
          <PaymentQRModal
            open={showQRModal}
            onOpenChange={setShowQRModal}
            paymentQrUrl={instructor.payment_qr_url}
            instructorId={instructor.id}
            instructorName={instructor.name}
          />
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <CommandPalette variant="instructor" />
      <div className="min-h-screen bg-muted/30 flex overflow-x-hidden w-full">
        {/* Sidebar - Clean minimal design */}
        <aside className="w-60 border-r bg-card fixed h-full flex flex-col">
          {/* Logo Header */}
          <div className="p-4 border-b">
            <Link to="/instructor" className="flex items-center gap-2">
              <img 
                src={instructorLogo}
                alt="EveryDriver" 
                className="h-7 object-contain"
              />
            </Link>
          </div>

          {/* Navigation - Simplified styling */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map((link) => {
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm transition-all rounded-md",
                    isActive
                      ? "text-foreground font-medium bg-muted border-l-2 border-primary ml-0 pl-[10px]"
                      : isHighlighted
                      ? "text-emerald-600 dark:text-emerald-400 hover:bg-muted/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="relative">
                    <link.icon className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : isHighlighted ? "text-emerald-500" : ""
                    )} />
                    {isAdminChat && !isActive && <AdminMessageBadge />}
                  </span>
                  <span className="flex-1">{link.label}</span>
                  {isVisitorChats && !isActive && (
                    <VisitorChatBadge 
                      instructorId={instructor?.id} 
                      className="ml-auto"
                    />
                  )}
                  {isMessages && !isActive && (
                    <MessageNotificationBadge 
                      instructorId={instructor?.id} 
                      className="ml-auto"
                    />
                  )}
                  {isPendingScheduling && !isActive && (
                    <PendingSchedulingBadge 
                      instructorId={instructor?.id} 
                      className="ml-auto"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Sign Out - Now at bottom */}
          <div className="border-t p-3 space-y-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={instructor?.profile_image_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {instructor?.name?.charAt(0) || "I"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{instructor?.name || "Instructor"}</p>
                <p className="text-xs text-muted-foreground truncate">{instructor?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 h-9"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content - Cleaner layout */}
        <main className="flex-1 ml-60">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Quick Actions FAB */}
        <QuickActionsFAB />
      </div>
    </>
  );
}
