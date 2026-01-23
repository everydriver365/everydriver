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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  sectionTitle: string;
  groupTitle: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

const navTabs = [
  { id: "overview", label: "Settings", icon: Settings },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "instructors", label: "Instructors", icon: Users },
  { id: "enquiries", label: "Pupils", icon: GraduationCap },
  { id: "payments", label: "Money", icon: CreditCard },
  { id: "bookings", label: "Stats", icon: BarChart3 },
  { id: "hero", label: "CMS", icon: FileText },
];

export function AdminLayout({
  children,
  activeSection,
  sectionTitle,
  groupTitle,
  onSectionChange,
  onLogout,
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
      "rewards-config": "overview",
      "reward-tiers": "overview",
      bonuses: "overview",
      promotions: "overview",
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
              src="/everydriver-logo-blue-bg.png" 
              alt="EveryDriver" 
              className="h-8"
            />
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSectionChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
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
            </button>
          ))}
        </nav>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30 px-6 py-2">
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
    </div>
  );
}
