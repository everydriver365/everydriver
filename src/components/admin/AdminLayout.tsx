import { ReactNode } from "react";
import {
  LogOut,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { HeaderSearchBox } from "@/components/HeaderSearchBox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminDesktopSidebar } from "@/components/admin/AdminDesktopSidebar";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  sectionTitle: string;
  groupTitle: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  tabCounts?: Record<string, number>;
}

const mobileNavGroups = [
  {
    label: "Dashboard",
    items: [
      { key: "overview", label: "Overview" },
      { key: "live-map", label: "Live Map" },
      { key: "analytics", label: "Analytics" },
      { key: "commission", label: "Commission" },
      { key: "leaderboard", label: "Leaderboard" },
    ],
  },
  {
    label: "Communications",
    items: [
      { key: "email", label: "Email Inbox" },
      { key: "enquiries", label: "Enquiries & Callbacks" },
      { key: "instructor-messages", label: "Instructor Support" },
      { key: "live-chat", label: "Visitor Chats" },
      { key: "campaigns", label: "Campaigns" },
    ],
  },
  {
    label: "People",
    items: [
      { key: "instructors", label: "Instructors" },
      { key: "pupil-records", label: "Pupil Records" },
      { key: "compliance", label: "Compliance" },
      { key: "subscribers", label: "Subscribers" },
    ],
  },
  {
    label: "Products & Booking",
    items: [
      { key: "courses", label: "Courses" },
      { key: "bookings", label: "All Bookings" },
      { key: "payments", label: "Payments" },
      { key: "upsells", label: "Upsells" },
      { key: "discount-codes", label: "Discount Codes" },
    ],
  },
  {
    label: "Settings",
    items: [
      { key: "site-settings", label: "Site Settings" },
      { key: "pwa-apps", label: "PWA Config" },
      { key: "activity-log", label: "Activity Log" },
      { key: "admin-notes", label: "Notes" },
    ],
  },
];

export function AdminLayout({
  children,
  activeSection,
  sectionTitle,
  groupTitle,
  onSectionChange,
  onLogout,
  tabCounts = {},
}: AdminLayoutProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Navy Blue Header */}
      <header className="sticky top-0 z-50 bg-[#142040]">
        <div className="flex items-center justify-between px-3 md:px-6 h-14">
          {/* Left: hamburger (mobile) or sidebar trigger (desktop) + logo */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 shrink-0" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-left">Admin Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="py-2" role="navigation" aria-label="Admin navigation">
                    {mobileNavGroups.map((group) => (
                      <div key={group.label} className="mb-2">
                        <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {group.label}
                        </div>
                        {group.items.map((item) => (
                          <SheetTrigger asChild key={item.key}>
                            <button
                              onClick={() => onSectionChange(item.key)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                activeSection === item.key
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-foreground hover:bg-muted"
                              }`}
                              aria-current={activeSection === item.key ? "page" : undefined}
                            >
                              {item.label}
                            </button>
                          </SheetTrigger>
                        ))}
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLogout}
                        className="w-full justify-start text-destructive hover:text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10" />
            )}
            <img
              src="/everydriver-logo-v2.png"
              alt="EveryDriver"
              className="h-7 md:h-8 shrink-0"
            />
            {!isMobile && <HeaderSearchBox variant="admin" />}
          </div>

          {/* Right: bell + logout */}
          <div className="flex items-center gap-1">
            <AdminNotificationBell onNavigate={onSectionChange} />
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-gradient-to-r from-primary/[0.03] to-transparent px-3 md:px-6 py-2 md:py-2.5 overflow-x-auto">
        <nav className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
          <button
            onClick={() => onSectionChange("overview")}
            className="hover:text-foreground transition-colors shrink-0"
          >
            Admin
          </button>
          <ChevronRight className="h-4 w-4 mx-1.5 md:mx-2 shrink-0" />
          <span className="text-muted-foreground shrink-0">{groupTitle}</span>
          <ChevronRight className="h-4 w-4 mx-1.5 md:mx-2 shrink-0" />
          <span className="text-foreground font-medium truncate">{sectionTitle}</span>
        </nav>
      </div>

      <main className="flex-1 p-3 md:p-6">
        {children}
      </main>

      <Footer />
    </div>
  );

  // On desktop, wrap with SidebarProvider + persistent sidebar
  if (!isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminDesktopSidebar
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            onLogout={onLogout}
            tabCounts={tabCounts}
          />
          {content}
        </div>
      </SidebarProvider>
    );
  }

  // On mobile, no sidebar
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {content}
    </div>
  );
}
