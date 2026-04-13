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
} from "lucide-react";
import { PortalShell, PortalNavGroup, PortalQuickAction } from "@/components/layout/PortalShell";
import driveHiveLogo from "@/assets/drive-hive-logo.png";
import SchoolTakeBookingModal from "./SchoolTakeBookingModal";
import SchoolTakePaymentModal from "./SchoolTakePaymentModal";

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
      { key: "courses", label: "Courses", icon: GraduationCap },
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
  courses: { title: "Courses", group: "Management" },
  payments: { title: "Payments", group: "Financials" },
  "payment-gateways": { title: "Payment Gateways", group: "Financials" },
  bnpl: { title: "Buy Now, Pay Later", group: "Financials" },
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
  instructorIds?: string[];
}

export function SchoolLayout({
  children,
  activeSection,
  onSectionChange,
  onLogout,
  instructorIds = [],
}: SchoolLayoutProps) {
  const meta = sectionMeta[activeSection] ?? { title: activeSection, group: "Overview" };
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
        sidebarGroups={sidebarGroups}
        activeSection={activeSection}
        sectionTitle={meta.title}
        groupTitle={meta.group}
        onSectionChange={onSectionChange}
        onLogout={onLogout}
        portalLabel="School Manager"
        logoSrc={driveHiveLogo}
        logoAlt="Drive Hive"
        quickActions={quickActions}
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
