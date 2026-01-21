import { useState } from "react";
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
  Home,
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
  ShoppingCart,
  Car,
  Wrench,
  Search,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  color: string;
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
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    icon: Users,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    items: [
      { id: "instructors", label: "Instructors", icon: Users },
    ],
  },
  {
    label: "Learner Website",
    icon: Globe,
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    items: [
      { id: "hero", label: "Hero Section", icon: Sparkles },
      { id: "sections", label: "Page Sections", icon: Layers },
      { id: "stats", label: "Stats", icon: BarChart3 },
      { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
      { id: "features", label: "Features", icon: Rocket },
      { id: "included", label: "What's Included", icon: Sparkles },
      { id: "public-faqs", label: "FAQs", icon: HelpCircle },
      { id: "images", label: "Site Images", icon: Image },
      { id: "videos", label: "Site Videos", icon: Video },
    ],
  },
  {
    label: "Instructor Platform",
    icon: Car,
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    items: [
      { id: "instructor-home", label: "App Homepage", icon: Smartphone },
      { id: "instructor-marketing", label: "Marketing Page", icon: Globe },
      { id: "instructor-faqs", label: "Instructor FAQs", icon: HelpCircle },
    ],
  },
  {
    label: "Products & Booking",
    icon: ShoppingCart,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    items: [
      { id: "courses", label: "Course Templates", icon: BookOpen },
      { id: "upsells", label: "Booking Upsells", icon: Zap },
      { id: "promotions", label: "Promotional Banners", icon: Megaphone },
    ],
  },
  {
    label: "Engagement & Rewards",
    icon: Trophy,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    items: [
      { id: "rewards-config", label: "Loyalty Settings", icon: Gift },
      { id: "reward-tiers", label: "Badge Tiers & Perks", icon: Award },
      { id: "bonuses", label: "Instructor Bonuses", icon: Gift },
    ],
  },
  {
    label: "System Settings",
    icon: Wrench,
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    items: [
      { id: "pwa-apps", label: "PWA Configuration", icon: Smartphone },
      { id: "site-settings", label: "Site Settings & SEO", icon: Settings },
    ],
  },
];

export function AdminSidebar({ activeSection, onSectionChange, onLogout }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [searchQuery, setSearchQuery] = useState("");
  
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

  // Filter groups and items based on search
  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0 || group.label.toLowerCase().includes(searchQuery.toLowerCase()));

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
        
        {/* Search input */}
        {!isCollapsed && (
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredGroups.map((group) => {
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
                      <span className={cn("p-1 rounded", group.color)}>
                        <group.icon className="h-3.5 w-3.5" />
                      </span>
                      {!isCollapsed && <span>{group.label}</span>}
                    </span>
                    {!isCollapsed && (
                      <span className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                          {group.items.length}
                        </Badge>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen ? "rotate-0" : "-rotate-90"
                        )} />
                      </span>
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
