import { useState, useEffect, useCallback } from "react";
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
  MessageSquareText,
  MessageCircle,
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
  Headphones,
  CalendarClock,
  ShieldCheck,
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
import { supabase } from "@/integrations/supabase/client";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

interface NavSubItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badgeKey?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badgeKey?: string;
  subItems?: NavSubItem[];
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
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
      { id: "enquiries", label: "Enquiries & Callbacks", icon: MessageSquareText },
      { id: "messages", label: "Pupil Messages", icon: MessageCircle },
      { 
        id: "live-chat-group", 
        label: "Live Chats", 
        icon: Headphones, 
        badgeKey: "liveChatTotal",
        subItems: [
          { id: "live-chat", label: "Visitor Chats", icon: MessageCircle, badgeKey: "liveChat" },
          { id: "instructor-messages", label: "Instructor Support", icon: ShieldCheck, badgeKey: "instructorMessages" },
        ]
      },
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
      { id: "booking-modes", label: "Booking Modes", icon: CalendarClock },
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
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({
    instructorMessages: 0,
    liveChat: 0,
    liveChatTotal: 0,
  });
  const [openSubItems, setOpenSubItems] = useState<string[]>(["live-chat-group"]);
  
  // Find which group contains the active section (including sub-items)
  const activeGroupLabel = navGroups.find(group => 
    group.items.some(item => 
      item.id === activeSection || 
      item.subItems?.some(sub => sub.id === activeSection)
    )
  )?.label;

  const [openGroups, setOpenGroups] = useState<string[]>(
    activeGroupLabel ? [activeGroupLabel] : ["Dashboard"]
  );

  const toggleSubItems = (itemId: string) => {
    setOpenSubItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const fetchBadgeCounts = useCallback(async () => {
    try {
      // Fetch instructor messages unread count
      const { count: instructorMsgCount } = await supabase
        .from("admin_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_type", "instructor")
        .is("read_at", null);

      // Fetch live chat unread count
      const { data: activeSessions } = await supabase
        .from("live_chat_sessions")
        .select("id")
        .eq("session_type", "admin")
        .eq("status", "active");

      let liveChatUnread = 0;
      if (activeSessions && activeSessions.length > 0) {
        const sessionIds = activeSessions.map(s => s.id);
        const { count: unreadCount } = await supabase
          .from("live_chat_messages")
          .select("id", { count: "exact", head: true })
          .in("session_id", sessionIds)
          .eq("sender_type", "visitor")
          .is("read_at", null);
        liveChatUnread = unreadCount || 0;
      }

      setBadgeCounts({
        instructorMessages: instructorMsgCount || 0,
        liveChat: liveChatUnread,
        liveChatTotal: (instructorMsgCount || 0) + liveChatUnread,
      });
    } catch (error) {
      console.error("Error fetching badge counts:", error);
    }
  }, []);

  useEffect(() => {
    fetchBadgeCounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("admin_sidebar_badges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_messages" },
        () => fetchBadgeCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_chat_messages" },
        () => fetchBadgeCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_chat_sessions" },
        () => fetchBadgeCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBadgeCounts]);

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
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subItems?.some(sub => sub.label.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(group => group.items.length > 0 || group.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Sidebar collapsible="icon" className="border-r bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <SidebarHeader className="border-b border-primary/10 px-4 py-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-sm bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Admin Portal</h2>
              <p className="text-xs text-muted-foreground">Management Console</p>
            </div>
          )}
        </div>
        
        {/* Search input */}
        {!isCollapsed && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-white dark:bg-slate-800 border-primary/20 focus:border-primary/40 focus:ring-primary/20 rounded-lg shadow-sm"
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
                  <SidebarGroupContent className="pl-2">
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0;
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isSubItemsOpen = openSubItems.includes(item.id);
                        const hasActiveSubItem = item.subItems?.some(sub => sub.id === activeSection);
                        
                        if (hasSubItems) {
                          return (
                            <SidebarMenuItem key={item.id}>
                              <Collapsible 
                                open={isSubItemsOpen || hasActiveSubItem} 
                                onOpenChange={() => toggleSubItems(item.id)}
                              >
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton
                                    tooltip={item.label}
                                    className={cn(
                                      "transition-all duration-200 rounded-lg",
                                      hasActiveSubItem 
                                        ? "bg-primary/5 text-primary font-medium" 
                                        : "hover:bg-muted/60"
                                    )}
                                  >
                                    <item.icon className={cn(
                                      "h-4 w-4",
                                      hasActiveSubItem && "text-primary"
                                    )} />
                                    {!isCollapsed && (
                                      <span className="flex-1 flex items-center justify-between">
                                        <span>{item.label}</span>
                                        <span className="flex items-center gap-1">
                                          {badgeCount > 0 && (
                                            <Badge 
                                              variant="destructive" 
                                              className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold animate-pulse"
                                            >
                                              {badgeCount > 99 ? "99+" : badgeCount}
                                            </Badge>
                                          )}
                                          <ChevronDown className={cn(
                                            "h-3.5 w-3.5 transition-transform text-muted-foreground",
                                            (isSubItemsOpen || hasActiveSubItem) ? "rotate-0" : "-rotate-90"
                                          )} />
                                        </span>
                                      </span>
                                    )}
                                    {isCollapsed && badgeCount > 0 && (
                                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground font-bold">
                                        {badgeCount > 9 ? "9+" : badgeCount}
                                      </span>
                                    )}
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-2">
                                    {item.subItems?.map((subItem) => {
                                      const subBadgeCount = subItem.badgeKey ? badgeCounts[subItem.badgeKey] || 0 : 0;
                                      return (
                                        <SidebarMenuButton
                                          key={subItem.id}
                                          onClick={() => onSectionChange(subItem.id)}
                                          isActive={activeSection === subItem.id}
                                          tooltip={subItem.label}
                                          className={cn(
                                            "transition-all duration-200 rounded-lg text-sm",
                                            activeSection === subItem.id 
                                              ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20" 
                                              : "hover:bg-muted/60"
                                          )}
                                        >
                                          <subItem.icon className={cn(
                                            "h-3.5 w-3.5",
                                            activeSection === subItem.id && "text-primary"
                                          )} />
                                          {!isCollapsed && (
                                            <span className="flex-1 flex items-center justify-between">
                                              <span>{subItem.label}</span>
                                              {subBadgeCount > 0 && (
                                                <Badge 
                                                  variant="destructive" 
                                                  className="h-4 min-w-[16px] px-1 text-[9px] font-bold animate-pulse"
                                                >
                                                  {subBadgeCount > 99 ? "99+" : subBadgeCount}
                                                </Badge>
                                              )}
                                            </span>
                                          )}
                                        </SidebarMenuButton>
                                      );
                                    })}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </SidebarMenuItem>
                          );
                        }
                        
                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              onClick={() => onSectionChange(item.id)}
                              isActive={activeSection === item.id}
                              tooltip={item.label}
                              className={cn(
                                "transition-all duration-200 rounded-lg",
                                activeSection === item.id 
                                  ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20" 
                                  : "hover:bg-muted/60"
                              )}
                            >
                              <item.icon className={cn(
                                "h-4 w-4",
                                activeSection === item.id && "text-primary"
                              )} />
                              {!isCollapsed && (
                                <span className="flex-1 flex items-center justify-between">
                                  <span>{item.label}</span>
                                  {badgeCount > 0 && (
                                    <Badge 
                                      variant="destructive" 
                                      className="ml-2 h-5 min-w-[20px] px-1.5 text-[10px] font-bold animate-pulse"
                                    >
                                      {badgeCount > 99 ? "99+" : badgeCount}
                                    </Badge>
                                  )}
                                </span>
                              )}
                              {isCollapsed && badgeCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground font-bold">
                                  {badgeCount > 9 ? "9+" : badgeCount}
                                </span>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-primary/10 p-4 bg-gradient-to-r from-destructive/5 to-transparent">
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
