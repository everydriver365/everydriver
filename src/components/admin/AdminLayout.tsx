import { ReactNode } from "react";
import { PortalShell, PortalNavGroup } from "@/components/layout/PortalShell";
import { HeaderSearchBox } from "@/components/HeaderSearchBox";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart3, BookOpen, CreditCard, Globe, Headphones, LayoutDashboard,
  MapPin, PoundSterling, Settings, Smartphone, Users,
  Mail, MessageCircle, Megaphone, Shield, Tag, Trophy, Satellite, AlertTriangle,
} from "lucide-react";

const sidebarGroups: PortalNavGroup[] = [
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

const sectionMeta: Record<string, { title: string; group: string }> = {};
sidebarGroups.forEach((g) =>
  g.items.forEach((i) => {
    sectionMeta[i.key] = { title: i.label, group: g.label };
  })
);

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  sectionTitle: string;
  groupTitle: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  tabCounts?: Record<string, number>;
}

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

  return (
    <PortalShell
      sidebarGroups={sidebarGroups}
      activeSection={activeSection}
      sectionTitle={sectionTitle}
      groupTitle={groupTitle}
      onSectionChange={onSectionChange}
      onLogout={onLogout}
      tabCounts={tabCounts}
      portalLabel="Admin"
      logoSrc="/everydriver-logo-v2.png"
      logoAlt="EveryDriver"
      headerExtra={
        <>
          {!isMobile && <HeaderSearchBox variant="admin" />}
          <AdminNotificationBell onNavigate={onSectionChange} />
        </>
      }
    >
      {children}
    </PortalShell>
  );
}
