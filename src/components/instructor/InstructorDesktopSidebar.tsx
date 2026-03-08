import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Calendar, CalendarClock, ClipboardList, Users, Award, Briefcase,
  CreditCard, Wallet, Receipt, MessageCircle, ShieldCheck, Headphones,
  MapPin, Navigation, FileText, Globe, Globe2, Radio, Settings,
  LogOut, Car, Camera, Satellite,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageNotificationBadge } from "@/components/instructor/MessageNotificationBadge";
import { VisitorChatBadge } from "@/components/instructor/VisitorChatBadge";
import { AdminMessageBadge } from "@/components/instructor/AdminMessageBadge";
import { PendingSchedulingBadge } from "@/components/instructor/PendingSchedulingBadge";
import { PlanBadge } from "@/components/instructor/PlanBadge";
import planIcon from "@/assets/plan-icon.png";
import { cn } from "@/lib/utils";

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
      { href: "/instructor/domains", label: "Domains", icon: Globe2 },
      { href: "/instructor/tracking", label: "GPS Tracking", icon: Radio },
      { href: "/instructor/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "VEHICLE INTELLIGENCE",
    items: [
      { href: "/instructor/geotab", label: "Geotab Hub", icon: Satellite, highlight: true },
      { href: "/instructor/fleet-dashboard", label: "Fleet Dashboard", icon: Car, highlight: true },
      { href: "/instructor/dashcam", label: "Dashcam", icon: Camera, highlight: true },
    ],
  },
];

interface InstructorDesktopSidebarProps {
  instructor: {
    id: string;
    name: string;
    email: string | null;
    profile_image_url: string | null;
  } | null;
  subscription: {
    plan_slug?: string;
  } | null;
  onSignOut: () => void;
}

export function InstructorDesktopSidebar({ instructor, subscription, onSignOut }: InstructorDesktopSidebarProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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
        {sidebarGroups.map((group) => {
          const hasActiveItem = group.items.some(item => location.pathname === item.href);
          const isVehicleIntel = group.label === "VEHICLE INTELLIGENCE";

          return (
            <SidebarGroup key={group.label} className="py-1">
              <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((link) => {
                    const isActive = location.pathname === link.href;
                    const isMessages = link.href === "/instructor/messages";
                    const isAdminChat = link.href === "/instructor/admin-chat";
                    const isVisitorChats = link.href === "/instructor/visitor-chats";
                    const isPending = link.href === "/instructor/pending-scheduling";
                    const isHighlighted = 'highlight' in link && link.highlight;

                    return (
                      <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={link.label}
                          className={cn(
                            isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary",
                            isHighlighted && !isActive && "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
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
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
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
