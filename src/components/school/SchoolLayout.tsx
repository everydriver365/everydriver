import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Palette,
  PoundSterling,
  GraduationCap,
  BookOpen,
  CreditCard,
  FileText,
  MapPin,
  Award,
  Building2,
  Link2,
  Bell,
  Wallet,
  CalendarPlus,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Target,
  Trophy,
  Tag,
  Globe,
  Megaphone,
  Map,
  PhoneCall,
  BarChart3,
} from "lucide-react";
import { PortalShell, PortalNavGroup, PortalQuickAction } from "@/components/layout/PortalShell";
import driveHiveLogo from "@/assets/drive-hive-logo.png";
import SchoolTakeBookingModal from "./SchoolTakeBookingModal";
import SchoolTakePaymentModal from "./SchoolTakePaymentModal";
import SchoolNotificationBell from "./SchoolNotificationBell";

const sidebarGroups: PortalNavGroup[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "live-map", label: "Live Map", icon: Map },
      { key: "revenue-analytics", label: "Revenue Analytics", icon: TrendingUp },
      { key: "leaderboard", label: "Leaderboard", icon: Trophy },
      { key: "pupil-progress", label: "Pupil Progress", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    icon: Users,
    items: [
      { key: "instructors", label: "Instructors", icon: Users },
      { key: "pupils", label: "Pupils", icon: GraduationCap },
      { key: "bookings", label: "Bookings", icon: CalendarDays },
      { key: "find-appointment", label: "Find appointment", icon: CalendarDays },
      { key: "calendar", label: "Calendar", icon: BookOpen },
      { key: "courses", label: "Courses", icon: GraduationCap },
      { key: "enquiries", label: "Enquiries", icon: PhoneCall },
      { key: "messages", label: "Messages", icon: MessageSquare },
      { key: "compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Financials",
    icon: PoundSterling,
    items: [
      { key: "payments", label: "Payments", icon: CreditCard },
      { key: "payment-gateways", label: "Payment Gateways", icon: CreditCard },
      { key: "bnpl", label: "Buy Now, Pay Later", icon: CreditCard },
      { key: "payroll", label: "Payroll", icon: Wallet },
      { key: "reports", label: "Reports", icon: FileText },
      { key: "franchise-fees", label: "Franchise Fees", icon: PoundSterling },
      { key: "subscription", label: "Subscription & Billing", icon: CreditCard },
    ],
  },
  {
    label: "Operations",
    icon: MapPin,
    items: [
      { key: "fleet", label: "Fleet Tracking", icon: MapPin },
      { key: "test-results", label: "Test Results", icon: Award },
      { key: "pass-rates", label: "Pass Rates & DVSA", icon: Target },
    ],
  },
  {
    label: "Engagement",
    icon: Tag,
    items: [
      { key: "discount-codes", label: "Discount Codes", icon: Tag },
      { key: "campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
  {
    label: "Settings",
    icon: Palette,
    items: [
      { key: "profile", label: "School Profile", icon: Building2 },
      { key: "branding", label: "Branding", icon: Palette },
      { key: "booking-page", label: "School Page", icon: Link2 },
      { key: "booking-pages", label: "Booking Pages", icon: Globe },
      { key: "website", label: "Website", icon: Globe },
      { key: "notifications", label: "Notifications", icon: Bell },
    ],
  },
];

const sectionMeta: Record<string, { title: string; group: string }> = {
  dashboard: { title: "Dashboard", group: "Overview" },
  "live-map": { title: "Live Map", group: "Overview" },
  "revenue-analytics": { title: "Revenue Analytics", group: "Overview" },
  leaderboard: { title: "Leaderboard", group: "Overview" },
  "pupil-progress": { title: "Pupil Progress", group: "Overview" },
  instructors: { title: "Instructors", group: "Management" },
  pupils: { title: "Pupils", group: "Management" },
  bookings: { title: "Bookings", group: "Management" },
  "find-appointment": { title: "Find appointment", group: "Management" },
  calendar: { title: "Calendar", group: "Management" },
  courses: { title: "Courses", group: "Management" },
  enquiries: { title: "Enquiries", group: "Management" },
  messages: { title: "Messages", group: "Management" },
  compliance: { title: "Compliance", group: "Management" },
  payments: { title: "Payments", group: "Financials" },
  "payment-gateways": { title: "Payment Gateways", group: "Financials" },
  bnpl: { title: "Buy Now, Pay Later", group: "Financials" },
  payroll: { title: "Payroll", group: "Financials" },
  "franchise-fees": { title: "Franchise Fees", group: "Financials" },
  subscription: { title: "Subscription & Billing", group: "Financials" },
  reports: { title: "Reports", group: "Financials" },
  fleet: { title: "Fleet Tracking", group: "Operations" },
  "test-results": { title: "Test Results", group: "Operations" },
  "pass-rates": { title: "Pass Rates & DVSA", group: "Operations" },
  "discount-codes": { title: "Discount Codes", group: "Engagement" },
  campaigns: { title: "Campaigns", group: "Engagement" },
  profile: { title: "School Profile", group: "Settings" },
  branding: { title: "Branding", group: "Settings" },
  "booking-page": { title: "School Page", group: "Settings" },
  "booking-pages": { title: "Booking Pages", group: "Settings" },
  website: { title: "Website", group: "Settings" },
  notifications: { title: "Notifications", group: "Settings" },
};

// Keys that are always visible regardless of enabled_features
const ALWAYS_VISIBLE_KEYS = new Set(["dashboard", "profile"]);

interface SchoolLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  instructorIds?: string[];
  enabledFeatures?: Record<string, boolean> | null;
  schoolId?: string;
  notificationPreferences?: Record<string, boolean> | null;
}

export function SchoolLayout({
  children,
  activeSection,
  onSectionChange,
  onLogout,
  instructorIds = [],
  enabledFeatures,
  schoolId,
  notificationPreferences,
}: SchoolLayoutProps) {
  const meta = sectionMeta[activeSection] ?? { title: activeSection, group: "Overview" };

  // Filter sidebar groups based on enabled features
  const isFeatureEnabled = (key: string) => {
    if (ALWAYS_VISIBLE_KEYS.has(key)) return true;
    if (!enabledFeatures) return true; // default all enabled if not set
    return enabledFeatures[key] !== false; // default true if key missing
  };

  const filteredGroups: PortalNavGroup[] = sidebarGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => isFeatureEnabled(item.key)),
    }))
    .filter(group => group.items.length > 0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const quickActions: PortalQuickAction[] = [
    {
      label: "Take a Booking",
      icon: CalendarPlus,
      onClick: () => setBookingOpen(true),
      variant: "default",
    },
    {
      label: "Take a Payment",
      icon: PoundSterling,
      onClick: () => setPaymentOpen(true),
      variant: "outline",
    },
  ];

  return (
    <>
      <PortalShell
        sidebarGroups={filteredGroups}
        activeSection={activeSection}
        sectionTitle={meta.title}
        groupTitle={meta.group}
        onSectionChange={onSectionChange}
        onLogout={onLogout}
        portalLabel="School Manager"
        logoSrc={driveHiveLogo}
        logoAlt="Drive Hive"
        quickActions={quickActions}
        headerExtra={<SchoolNotificationBell schoolId={schoolId} notificationPreferences={notificationPreferences} />}
      >
        {children}
      </PortalShell>

      <SchoolTakeBookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        instructorIds={instructorIds}
      />
      <SchoolTakePaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        instructorIds={instructorIds}
      />
    </>
  );
}
