import {
  BarChart3, BookOpen, Building2, CreditCard, Gift, Globe, Headphones, LayoutDashboard,
  MapPin, PoundSterling, Settings, Smartphone, Users, LucideIcon,
  LogOut, Mail, MessageCircle, Megaphone, Shield, Tag, Trophy, Satellite, AlertTriangle,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
}

interface SidebarGroup {
  label: string;
  icon: LucideIcon;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { key: "overview", label: "Overview", icon: LayoutDashboard },
      { key: "alerts", label: "Alerts", icon: AlertTriangle, badgeKey: "alerts" },
      { key: "live-map", label: "Live Map", icon: MapPin },
      { key: "analytics", label: "Analytics", icon: BarChart3 },
      { key: "churn-analysis", label: "Churn Analysis", icon: BarChart3 },
      { key: "commission", label: "Commission", icon: PoundSterling },
      { key: "leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Communications",
    icon: Headphones,
    items: [
      { key: "email", label: "Email Inbox", icon: Mail, badgeKey: "emails" },
      { key: "enquiries", label: "Enquiries", icon: MessageCircle, badgeKey: "enquiries" },
      { key: "instructor-messages", label: "Instructor Support", icon: Shield, badgeKey: "instructorMessages" },
      { key: "live-chat", label: "Visitor Chats", icon: Headphones, badgeKey: "liveChats" },
      { key: "campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
  {
    label: "People",
    icon: Users,
    items: [
      { key: "instructors", label: "Instructors", icon: Users },
      { key: "pupil-records", label: "Pupil Records", icon: Users },
      { key: "compliance", label: "Compliance", icon: Shield },
    ],
  },
  {
    label: "Finance",
    icon: PoundSterling,
    items: [
      { key: "commission-settings", label: "Fees & Rates", icon: PoundSterling },
      { key: "bookings", label: "Bookings", icon: CreditCard },
      { key: "payments", label: "Payments", icon: CreditCard },
      { key: "instructor-payouts", label: "Payouts", icon: CreditCard, badgeKey: "pendingPayouts" },
    ],
  },
  {
    label: "Products",
    icon: BookOpen,
    items: [
      { key: "courses", label: "Courses", icon: BookOpen },
      { key: "upsells", label: "Upsells", icon: Tag },
      { key: "discount-codes", label: "Discount Codes", icon: Tag },
    ],
  },
  {
    label: "Website",
    icon: Globe,
    items: [
      { key: "hero", label: "Hero Section", icon: Globe },
      { key: "sections", label: "Page Sections", icon: Globe },
      { key: "features", label: "Features", icon: Globe },
      { key: "testimonials", label: "Testimonials", icon: Globe },
      { key: "public-faqs", label: "FAQs", icon: Globe },
    ],
  },
  {
    label: "Platform",
    icon: Smartphone,
    items: [
      { key: "mini-websites", label: "Mini Websites", icon: Smartphone },
      { key: "instructor-onboarding", label: "Signup Wizard", icon: Smartphone },
      { key: "instructor-home", label: "App Homepage", icon: Smartphone },
      
      { key: "comparison-editor", label: "Pricing Comparison", icon: Smartphone },
      { key: "booking-pages", label: "Booking Pages", icon: Globe },
    ],
  },
  {
    label: "Schools",
    icon: Building2,
    items: [
      { key: "school-manager", label: "School Manager", icon: Building2 },
      { key: "school-fees", label: "Franchise Fees", icon: PoundSterling },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { key: "trackers", label: "GPS Trackers", icon: Satellite },
      { key: "geotab-fleet", label: "Geotab Fleet", icon: Satellite },
      { key: "pwa-apps", label: "PWA Config", icon: Settings },
      { key: "site-settings", label: "Site Settings", icon: Settings },
      { key: "activity-log", label: "Activity Log", icon: Settings },
    ],
  },
];

interface AdminDesktopSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  tabCounts?: Record<string, number>;
}

export function AdminDesktopSidebar({
  activeSection,
  onSectionChange,
  onLogout,
  tabCounts = {},
}: AdminDesktopSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const getBadgeCount = (badgeKey?: string): number => {
    if (!badgeKey || !tabCounts[badgeKey]) return 0;
    return tabCounts[badgeKey];
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className={cn("flex items-center gap-2.5", collapsed ? "justify-center" : "px-1")}>
          <img
            src="/everydriver-logo-v2.png"
            alt="EveryDriver"
            className="h-7 shrink-0"
          />
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Admin
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-1">
        {sidebarGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeSection === item.key;
                  const count = getBadgeCount(item.badgeKey);

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={isActive}
                        onClick={() => onSectionChange(item.key)}
                        className={cn(
                          isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                        <span className="flex-1 truncate text-[13px]">{item.label}</span>
                        {count > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] ml-auto">
                            {count}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={onLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[13px]">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
