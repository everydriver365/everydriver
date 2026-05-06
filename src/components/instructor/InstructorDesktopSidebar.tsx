import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Calendar, CalendarClock, ClipboardList, Users, Award, Briefcase,
  CreditCard, Wallet, Receipt, MessageCircle, ShieldCheck, Headphones,
  MapPin, Navigation, FileText, Globe, Globe2, Radio, Settings,
  LogOut, Car, Camera, Pin, ChevronDown, Lock, CalendarSearch, Upload,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageNotificationBadge } from "@/components/instructor/MessageNotificationBadge";
import { VisitorChatBadge } from "@/components/instructor/VisitorChatBadge";
import { AdminMessageBadge } from "@/components/instructor/AdminMessageBadge";
import { PendingSchedulingBadge } from "@/components/instructor/PendingSchedulingBadge";
import { PlanBadge } from "@/components/instructor/PlanBadge";
import planIcon from "@/assets/plan-icon.png";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PINNED_STORAGE_KEY = "instructor-pinned-nav";
const DEFAULT_PINS = ["/instructor", "/instructor/schedule", "/instructor/pupils", "/instructor/messages"];

const sidebarGroups = [
  {
    label: "TEACHING",
    items: [
      { href: "/instructor", label: "Dashboard", icon: Home },
      { href: "/instructor/schedule", label: "Schedule", icon: Calendar },
      { href: "/instructor/availability", label: "Availability", icon: CalendarClock },
      { href: "/instructor/pending-scheduling", label: "Pending", icon: ClipboardList },
      { href: "/instructor/pupils", label: "Pupils", icon: Users },
      { href: "/instructor/test-results", label: "Test Results", icon: Award },
      { href: "/instructor/test-requests", label: "Test Swap", icon: Award },
      { href: "/instructor/find-appointment", label: "Find slot", icon: Search },
      { href: "/instructor/jobs", label: "Jobs", icon: Briefcase },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { href: "/instructor/pay", label: "Payments", icon: CreditCard },
      { href: "/instructor/accounts", label: "Accounts", icon: Wallet },
      { href: "/instructor/expenses", label: "Expenses", icon: Receipt },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      { href: "/instructor/messages", label: "Messages", icon: MessageCircle },
      { href: "/instructor/admin-chat", label: "Contact Admin", icon: ShieldCheck, highlight: true },
      { href: "/instructor/visitor-chats", label: "Visitor Chats", icon: Headphones },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { href: "/instructor/gaps", label: "Fill Gaps", icon: MapPin },
      { href: "/instructor/routes", label: "Saved Routes", icon: Navigation },
      { href: "/instructor/resources", label: "Resources", icon: FileText },
      { href: "/instructor/website", label: "Mini Website", icon: Globe },
      { href: "/instructor/website-addons", label: "Website Add-Ons", icon: Globe2, highlight: true },
      { href: "/instructor/domains", label: "Domains", icon: Globe2 },
      { href: "/instructor/tracking", label: "GPS Tracking", icon: Radio },
      { href: "/instructor/import-data", label: "Import Pupils", icon: Upload, highlight: true },
      { href: "/instructor/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "VEHICLE INTELLIGENCE",
    items: [
      { href: "/instructor/fleet-dashboard", label: "Telematics", icon: Car, highlight: true },
      { href: "/instructor/dashcam", label: "Dashcam", icon: Camera, highlight: true },
    ],
  },
];

// Flatten all items for pinning lookup
const allItems = sidebarGroups.flatMap(g => g.items);

// Map routes to required features (matches menu_feature_gates table)
const ROUTE_FEATURE_MAP: Record<string, string> = {
  "/instructor/pay": "payment_tracking",
  "/instructor/accounts": "payment_tracking",
  "/instructor/expenses": "expense_tracking",
  "/instructor/tracking": "telematics",
  "/instructor/find-my-car": "telematics",
  "/instructor/vehicle-health": "telematics",
  "/instructor/routes": "telematics",
  "/instructor/fleet-dashboard": "telematics",
  "/instructor/dashcam": "dashcam",
  "/instructor/website": "mini_website",
  "/instructor/domains": "mini_website",
  "/instructor/gaps": "sms_notifications",
};

interface InstructorDesktopSidebarProps {
  instructor: {
    id: string;
    name: string;
    email: string | null;
    profile_image_url: string | null;
  } | null;
  subscription: {
    plan_slug?: string;
    features?: string[];
  } | null;
  onSignOut: () => void;
}

export function InstructorDesktopSidebar({ instructor, subscription, onSignOut }: InstructorDesktopSidebarProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  const features = subscription?.features || [];
  const isFeatureLocked = (href: string): boolean => {
    const requiredFeature = ROUTE_FEATURE_MAP[href];
    if (!requiredFeature) return false;
    return !features.includes(requiredFeature);
  };

  // Pinned favourites
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PINS;
    } catch {
      return DEFAULT_PINS;
    }
  });

  useEffect(() => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedHrefs));
  }, [pinnedHrefs]);

  const togglePin = (href: string) => {
    setPinnedHrefs(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const pinnedItems = pinnedHrefs
    .map(href => allItems.find(i => i.href === href))
    .filter(Boolean) as typeof allItems;

  // Accordion: determine which group is active
  const activeGroupLabel = sidebarGroups.find(g =>
    g.items.some(item => location.pathname === item.href)
  )?.label || "TEACHING";

  const [openGroup, setOpenGroup] = useState<string>(activeGroupLabel);

  // Update open group when route changes
  useEffect(() => {
    const newGroup = sidebarGroups.find(g =>
      g.items.some(item => location.pathname === item.href)
    )?.label;
    if (newGroup) setOpenGroup(newGroup);
  }, [location.pathname]);

  const renderNavItem = (link: typeof allItems[0], showPinAction = false) => {
    const isActive = location.pathname === link.href;
    const isMessages = link.href === "/instructor/messages";
    const isAdminChat = link.href === "/instructor/admin-chat";
    const isVisitorChats = link.href === "/instructor/visitor-chats";
    const isPending = link.href === "/instructor/pending-scheduling";
    const isHighlighted = 'highlight' in link && link.highlight;
    const isPinned = pinnedHrefs.includes(link.href);
    const locked = isFeatureLocked(link.href);

    const handleLockedClick = (e: React.MouseEvent) => {
      e.preventDefault();
      toast.info(`${link.label} requires a plan upgrade`, {
        action: { label: "View Plans", onClick: () => navigate("/instructor/plans") },
      });
    };

    return (
      <SidebarMenuItem key={link.href}>
        <SidebarMenuButton
          asChild={!locked}
          isActive={isActive}
          tooltip={locked ? `${link.label} (Locked)` : link.label}
          className={cn(
            isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary",
            isHighlighted && !isActive && !locked && "text-emerald-600 dark:text-emerald-400",
            locked && "opacity-50 cursor-not-allowed",
          )}
          onClick={locked ? handleLockedClick : undefined}
        >
          {locked ? (
            <div className="flex items-center gap-2 w-full">
              <span className="relative shrink-0">
                <link.icon className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="flex-1 truncate text-[13px]">{link.label}</span>
              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
          ) : (
            <Link to={link.href}>
              <span className="relative shrink-0">
                <link.icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary" : isHighlighted ? "text-emerald-500" : ""
                )} />
                {isAdminChat && !isActive && <AdminMessageBadge />}
              </span>
              <span className="flex-1 truncate text-[13px]">{link.label}</span>
              {isVisitorChats && !isActive && (
                <VisitorChatBadge instructorId={instructor?.id} className="ml-auto" />
              )}
              {isMessages && !isActive && (
                <MessageNotificationBadge instructorId={instructor?.id} className="ml-auto" />
              )}
              {isPending && !isActive && (
                <PendingSchedulingBadge instructorId={instructor?.id} className="ml-auto" />
              )}
              {showPinAction && !collapsed && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(link.href); }}
                  className={cn(
                    "ml-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0",
                    isPinned && "opacity-100 text-primary"
                  )}
                  aria-label={isPinned ? `Unpin ${link.label}` : `Pin ${link.label}`}
                >
                  <Pin className={cn("h-3 w-3", isPinned && "fill-current")} />
                </button>
              )}
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      {/* Header: Avatar + Name */}
      <SidebarHeader className="border-b">
        <div className={cn("flex items-center gap-2.5", collapsed ? "justify-center" : "px-1")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={instructor?.profile_image_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {instructor?.name?.charAt(0) || "I"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{instructor?.name || "Instructor"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{instructor?.email}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Groups */}
      <SidebarContent className="py-1">
        {/* Pinned Section */}
        {pinnedItems.length > 0 && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-primary/60">
              <Pin className="h-3 w-3 mr-1 inline fill-current" />
              {!collapsed && "PINNED"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pinnedItems.map(item => renderNavItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Accordion Groups */}
        {sidebarGroups.map((group) => {
          const isOpen = openGroup === group.label;

          if (collapsed) {
            // When collapsed, show all items (icon-only mode)
            return (
              <SidebarGroup key={group.label} className="py-1">
                <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((link) => renderNavItem(link))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible key={group.label} open={isOpen} onOpenChange={() => setOpenGroup(isOpen ? "" : group.label)}>
              <SidebarGroup className="py-0.5">
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 cursor-pointer hover:text-foreground transition-colors flex items-center justify-between pr-2">
                    <span>{group.label}</span>
                    <ChevronDown className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      !isOpen && "-rotate-90"
                    )} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((link) => renderNavItem(link, true))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      {/* Footer: Plan + Sign Out */}
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Your Plan">
              <Link to="/instructor/plans" className="flex items-center gap-2.5">
                <img src={planIcon} alt="Plan" className="h-5 w-5 object-contain shrink-0" />
                <span className="flex-1 text-[13px] font-medium truncate">Your Plan</span>
                {!collapsed && <PlanBadge planSlug={subscription?.plan_slug} size="sm" />}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator />
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={onSignOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[13px]">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
