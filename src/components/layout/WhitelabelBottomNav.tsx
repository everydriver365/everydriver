import { Home, Search, BookOpen, Star, Phone } from "lucide-react";
import { MobilePortalNav, MobileNavItem } from "@/components/layout/MobilePortalNav";

const navItems: MobileNavItem[] = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Courses", icon: Search, path: "/courses" },
  { label: "Theory", icon: BookOpen, path: "/theory" },
  { label: "Reviews", icon: Star, path: "/reviews" },
  { label: "Contact", icon: Phone, path: "/contact" },
];

/**
 * Single bottom nav used across every page on a whitelabel domain
 * (e.g. winchesterdrivingschool.co.uk). Links target the rebranded
 * Drive365 routes that already render on the whitelabel host.
 */
export function WhitelabelBottomNav() {
  return (
    <MobilePortalNav
      items={navItems}
      layoutId="whitelabel-nav-pill"
      activeColor="text-white"
      inactiveColor="text-primary-foreground/60"
      bgClassName="bg-primary border-t border-primary-foreground/10"
      pillClassName="bg-white"
    />
  );
}
