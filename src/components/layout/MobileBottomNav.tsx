import { useLocation } from "react-router-dom";
import { Home, Search, BookOpen, HelpCircle, MessageCircle, Gift } from "lucide-react";
import { MobilePortalNav, MobileNavItem } from "@/components/layout/MobilePortalNav";

const navItems: MobileNavItem[] = [
  { label: "Home", icon: Home, path: "/drive365" },
  { label: "Search", icon: Search, path: "/courses" },
  { label: "Theory", icon: BookOpen, path: "/theory" },
  { label: "FAQs", icon: HelpCircle, path: "/faqs" },
  { label: "Help", icon: MessageCircle, path: "/help" },
  { label: "Benefits", icon: Gift, path: "/benefits" },
];

export function MobileBottomNav() {
  const location = useLocation();

  // Hide the public site bottom-nav inside the instructor portal.
  if (location.pathname.startsWith("/instructor")) return null;

  return (
    <MobilePortalNav
      items={navItems}
      layoutId="public-nav-pill"
      activeColor="text-white"
      inactiveColor="text-primary-foreground/60"
      bgClassName="bg-primary border-t border-primary-foreground/10"
      pillClassName="bg-white"
    />
  );
}
