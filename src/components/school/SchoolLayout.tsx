import { ReactNode } from "react";
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
} from "lucide-react";
import { PortalShell, PortalNavGroup } from "@/components/layout/PortalShell";
import driveHiveLogo from "@/assets/drive-hive-logo.png";

const sidebarGroups: PortalNavGroup[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    icon: Users,
    items: [
      { key: "instructors", label: "Instructors", icon: Users },
      { key: "pupils", label: "Pupils", icon: GraduationCap },
      { key: "bookings", label: "Bookings", icon: CalendarDays },
      { key: "calendar", label: "Calendar", icon: BookOpen },
    ],
  },
  {
    label: "Financials",
    icon: PoundSterling,
    items: [
      { key: "payments", label: "Payments", icon: CreditCard },
      { key: "payroll", label: "Payroll", icon: Wallet },
      { key: "reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Operations",
    icon: MapPin,
    items: [
      { key: "fleet", label: "Fleet Tracking", icon: MapPin },
      { key: "test-results", label: "Test Results", icon: Award },
    ],
  },
  {
    label: "Settings",
    icon: Palette,
    items: [
      { key: "profile", label: "School Profile", icon: Building2 },
      { key: "branding", label: "Branding", icon: Palette },
      { key: "booking-page", label: "Booking Page", icon: Link2 },
      { key: "notifications", label: "Notifications", icon: Bell },
    ],
  },
];

const sectionMeta: Record<string, { title: string; group: string }> = {
  dashboard: { title: "Dashboard", group: "Overview" },
  instructors: { title: "Instructors", group: "Management" },
  pupils: { title: "Pupils", group: "Management" },
  bookings: { title: "Bookings", group: "Management" },
  calendar: { title: "Calendar", group: "Management" },
  payments: { title: "Payments", group: "Financials" },
  payroll: { title: "Payroll", group: "Financials" },
  reports: { title: "Reports", group: "Financials" },
  fleet: { title: "Fleet Tracking", group: "Operations" },
  "test-results": { title: "Test Results", group: "Operations" },
  profile: { title: "School Profile", group: "Settings" },
  branding: { title: "Branding", group: "Settings" },
  "booking-page": { title: "Booking Page", group: "Settings" },
  notifications: { title: "Notifications", group: "Settings" },
};

interface SchoolLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export function SchoolLayout({
  children,
  activeSection,
  onSectionChange,
  onLogout,
}: SchoolLayoutProps) {
  const meta = sectionMeta[activeSection] ?? { title: activeSection, group: "Overview" };

  return (
    <PortalShell
      sidebarGroups={sidebarGroups}
      activeSection={activeSection}
      sectionTitle={meta.title}
      groupTitle={meta.group}
      onSectionChange={onSectionChange}
      onLogout={onLogout}
      portalLabel="School Manager"
      logoSrc={dsmLogo}
      logoAlt="Driving School Manager"
    >
      {children}
    </PortalShell>
  );
}
