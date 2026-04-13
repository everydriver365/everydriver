import { ReactNode, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Palette,
  PoundSterling,
} from "lucide-react";
import { PortalShell, PortalNavGroup } from "@/components/layout/PortalShell";
import dsmLogo from "@/assets/dsm-logo.png";

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
      { key: "bookings", label: "Bookings", icon: CalendarDays },
    ],
  },
  {
    label: "Settings",
    icon: Palette,
    items: [
      { key: "branding", label: "Branding", icon: Palette },
      { key: "finances", label: "Finances", icon: PoundSterling },
    ],
  },
];

const sectionMeta: Record<string, { title: string; group: string }> = {
  dashboard: { title: "Dashboard", group: "Overview" },
  instructors: { title: "Instructors", group: "Management" },
  bookings: { title: "Bookings", group: "Management" },
  branding: { title: "Branding", group: "Settings" },
  finances: { title: "Finances", group: "Settings" },
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
