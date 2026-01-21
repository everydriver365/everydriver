import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Smartphone,
  Image,
  Video,
  Megaphone,
  Gift,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  Type,
  BarChart3,
  MessageSquareQuote,
  Sparkles,
  Layers,
  Rocket,
  Globe,
  LogOut,
  Trophy,
  Award,
  HelpCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "Users",
    icon: Users,
    items: [
      { id: "instructors", label: "Instructors", icon: Users },
    ],
  },
  {
    label: "Content",
    icon: BookOpen,
    items: [
      { id: "courses", label: "Course Templates", icon: BookOpen },
      { id: "upsells", label: "Booking Upsells", icon: Zap },
    ],
  },
  {
    label: "Homepage CMS",
    icon: Home,
    items: [
      { id: "hero", label: "Hero Section", icon: Sparkles },
      { id: "sections", label: "Page Sections", icon: Layers },
      { id: "stats", label: "Stats", icon: BarChart3 },
      { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
      { id: "features", label: "Features", icon: Rocket },
      { id: "included", label: "What's Included", icon: Sparkles },
      { id: "public-faqs", label: "FAQs", icon: HelpCircle },
    ],
  },
  {
    label: "Media",
    icon: Image,
    items: [
      { id: "images", label: "Site Images", icon: Image },
      { id: "videos", label: "Videos", icon: Video },
    ],
  },
  {
    label: "Instructor Platform",
    icon: Smartphone,
    items: [
      { id: "instructor-home", label: "App Homepage", icon: Smartphone },
      { id: "instructor-marketing", label: "Marketing Page", icon: Globe },
      { id: "instructor-faqs", label: "Instructor FAQs", icon: HelpCircle },
    ],
  },
  {
    label: "Mobile Apps",
    icon: Smartphone,
    items: [
      { id: "pwa-apps", label: "PWA Config", icon: Smartphone },
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    items: [
      { id: "promotions", label: "Promotions", icon: Megaphone },
      { id: "bonuses", label: "Bonuses", icon: Gift },
    ],
  },
  {
    label: "Loyalty & Rewards",
    icon: Trophy,
    items: [
      { id: "rewards-config", label: "Rewards Settings", icon: Gift },
      { id: "reward-tiers", label: "Badge Tiers", icon: Award },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { id: "site-settings", label: "Site Settings & SEO", icon: Settings },
    ],
  },
];

export function AdminSidebar({ activeSection, onSectionChange, onLogout }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Find which group contains the active section
  const activeGroupLabel = navGroups.find(group => 
    group.items.some(item => item.id === activeSection)
  )?.label;

  const [openGroups, setOpenGroups] = useState<string[]>(
    activeGroupLabel ? [activeGroupLabel] : ["Dashboard"]
  );

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-sm">Admin Portal</h2>
              <p className="text-xs text-muted-foreground">Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {navGroups.map((group) => {
          const isOpen = openGroups.includes(group.label);
          const hasActiveItem = group.items.some(item => item.id === activeSection);
          
          return (
            <Collapsible
              key={group.label}
              open={isOpen || hasActiveItem}
              onOpenChange={() => toggleGroup(group.label)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 justify-between">
                    <span className="flex items-center gap-2">
                      <group.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{group.label}</span>}
                    </span>
                    {!isCollapsed && (
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen ? "rotate-0" : "-rotate-90"
                      )} />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            onClick={() => onSectionChange(item.id)}
                            isActive={activeSection === item.id}
                            tooltip={item.label}
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
