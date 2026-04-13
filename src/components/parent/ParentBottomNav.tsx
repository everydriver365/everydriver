import { Home, Users, MessageSquare, Settings, LucideIcon } from "lucide-react";
import { MobilePortalNav, MobileNavItem } from "@/components/layout/MobilePortalNav";

interface ParentBottomNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  negativeBadgeCount?: number;
  feedbackBadgeCount?: number;
}

export function ParentBottomNav({ activeSection, onNavigate, negativeBadgeCount = 0, feedbackBadgeCount = 0 }: ParentBottomNavProps) {
  const navItems: MobileNavItem[] = [
    { label: "Home", icon: Home, path: "dashboard" },
    { label: "Children", icon: Users, path: "children", badge: negativeBadgeCount },
    { label: "Feedback", icon: MessageSquare, path: "feedback", badge: feedbackBadgeCount },
    { label: "Settings", icon: Settings, path: "settings" },
  ];

  return (
    <MobilePortalNav
      items={navItems}
      layoutId="parent-tab-pill"
      onNavigate={onNavigate}
      activeSection={activeSection}
    />
  );
}
