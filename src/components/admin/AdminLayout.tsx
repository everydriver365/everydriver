import { ReactNode } from "react";
import { 
  Settings, 
  BookOpen, 
  Users, 
  GraduationCap, 
  CreditCard, 
  BarChart3, 
  FileText,
  LogOut,
  ChevronRight,
  Globe,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { HeaderSearchBox } from "@/components/HeaderSearchBox";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  sectionTitle: string;
  groupTitle: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  tabCounts?: Record<string, number>;
}

const navTabs = [
  { id: "overview", label: "Settings", icon: Settings },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "instructors", label: "Instructors", icon: Users },
  { id: "subscribers", label: "Subscribers", icon: CreditCard },
  { id: "plans", label: "Plans", icon: CreditCard },
  { id: "mini-websites", label: "Websites", icon: FileText },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "enquiries", label: "Pupils", icon: GraduationCap },
  { id: "payments", label: "Money", icon: CreditCard },
  { id: "bookings", label: "Stats", icon: BarChart3 },
  { id: "hero", label: "CMS", icon: FileText },
  { id: "plan-features", label: "Plan Features", icon: CheckSquare },
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
  // Determine which tab is active based on the current section
  const getActiveTab = () => {
    // Map sections to their parent tabs
    const sectionToTab: Record<string, string> = {
      overview: "overview",
      "site-settings": "overview",
      "pwa-apps": "overview",
      courses: "courses",
      "booking-modes": "courses",
      upsells: "courses",
      instructors: "instructors",
      compliance: "instructors",
      "instructor-messages": "instructors",
      subscribers: "subscribers",
      "mini-websites": "mini-websites",
      domains: "domains",
      enquiries: "enquiries",
      "live-chat": "enquiries",
      messages: "enquiries",
      payments: "payments",
      bookings: "bookings",
      hero: "hero",
      sections: "hero",
      features: "hero",
      testimonials: "hero",
      stats: "hero",
      included: "hero",
      "public-faqs": "hero",
      images: "hero",
      videos: "hero",
      "instructor-home": "hero",
      "instructor-marketing": "hero",
      "instructor-faqs": "hero",
      "page-builder": "hero",
      "rewards-config": "overview",
      "reward-tiers": "overview",
      bonuses: "overview",
      promotions: "overview",
      "plan-features": "plan-features",
    };
    return sectionToTab[activeSection] || "overview";
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Navy Blue Header */}
      <header className="sticky top-0 z-50 bg-[#142040]">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/everydriver-logo-v2.png" 
              alt="EveryDriver" 
              className="h-8"
            />
            <HeaderSearchBox variant="admin" />
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSectionChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors relative",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {(tabCounts[tab.id] ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-white/25 text-white leading-none">
                    {tabCounts[tab.id] > 99 ? "99+" : tabCounts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
              {(tabCounts[tab.id] ?? 0) > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full bg-white/25 text-white leading-none">
                  {tabCounts[tab.id] > 99 ? "99+" : tabCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-gradient-to-r from-primary/[0.03] to-transparent px-6 py-2.5">
        <nav className="flex items-center text-sm text-muted-foreground">
          <button 
            onClick={() => onSectionChange("overview")}
            className="hover:text-foreground transition-colors"
          >
            Admin
          </button>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-muted-foreground">{groupTitle}</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-foreground font-medium">{sectionTitle}</span>
        </nav>
      </div>

      <main className="flex-1 p-6">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
