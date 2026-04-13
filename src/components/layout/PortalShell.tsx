import { ReactNode } from "react";
import {
  LogOut,
  ChevronRight,
  Menu,
  LucideIcon,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PortalNavItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  badgeKey?: string;
}

export interface PortalNavGroup {
  label: string;
  icon?: LucideIcon;
  items: PortalNavItem[];
}

export interface PortalQuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline";
}

export interface PortalShellProps {
  children: ReactNode;
  sidebarGroups: PortalNavGroup[];
  activeSection: string;
  sectionTitle: string;
  groupTitle: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  tabCounts?: Record<string, number>;

  /** Branding */
  logoSrc?: string;
  logoAlt?: string;
  portalLabel?: string;
  headerBg?: string;
  headerTextClass?: string;

  /** Extra header content (e.g. search, notification bell) */
  headerExtra?: ReactNode;

  /** Quick-action buttons shown at top of sidebar */
  quickActions?: PortalQuickAction[];
}

/* ------------------------------------------------------------------ */
/*  Desktop sidebar (generic)                                          */
/* ------------------------------------------------------------------ */

function PortalDesktopSidebar({
  sidebarGroups,
  activeSection,
  onSectionChange,
  onLogout,
  tabCounts = {},
  logoSrc,
  logoAlt,
  portalLabel,
  quickActions,
}: Pick<
  PortalShellProps,
  | "sidebarGroups"
  | "activeSection"
  | "onSectionChange"
  | "onLogout"
  | "tabCounts"
  | "logoSrc"
  | "logoAlt"
  | "portalLabel"
  | "quickActions"
>) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const getBadge = (key?: string) =>
    key && tabCounts[key] ? tabCounts[key] : 0;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed ? "justify-center" : "px-1"
          )}
        >
          {logoSrc && (
            <img
              src={logoSrc}
              alt={logoAlt ?? "Logo"}
              className="h-12 shrink-0"
            />
          )}
          {!collapsed && portalLabel && (
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {portalLabel}
            </span>
          )}
        </div>
      </SidebarHeader>

      {quickActions && quickActions.length > 0 && (
        <div className={cn("border-b px-2 py-2", collapsed ? "flex flex-col gap-1" : "flex flex-col gap-1.5")}>
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant ?? "default"}
              size="sm"
              onClick={action.onClick}
              className={cn("w-full gap-2 text-xs font-medium", collapsed && "px-0 justify-center")}
            >
              <action.icon className="h-4 w-4 shrink-0" />
              {!collapsed && action.label}
            </Button>
          ))}
        </div>
      )}

      <SidebarContent className="py-1">
        {sidebarGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeSection === item.key;
                  const count = getBadge(item.badgeKey);
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={isActive}
                        onClick={() => onSectionChange(item.key)}
                        className={cn(
                          isActive &&
                            "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                        )}
                      >
                        {item.icon && (
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive && "text-primary"
                            )}
                          />
                        )}
                        <span className="flex-1 truncate text-[13px]">
                          {item.label}
                        </span>
                        {count > 0 && (
                          <Badge
                            variant="destructive"
                            className="h-5 min-w-5 px-1.5 text-[10px] ml-auto"
                          >
                            {count}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={onLogout}
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

/* ------------------------------------------------------------------ */
/*  Main PortalShell                                                   */
/* ------------------------------------------------------------------ */

export function PortalShell({
  children,
  sidebarGroups,
  activeSection,
  sectionTitle,
  groupTitle,
  onSectionChange,
  onLogout,
  tabCounts = {},
  logoSrc = "/everydriver-logo-v2.png",
  logoAlt = "Logo",
  portalLabel,
  headerBg = "bg-[#142040]",
  headerTextClass = "text-white/70 hover:text-white hover:bg-white/10",
  headerExtra,
  quickActions,
}: PortalShellProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className={cn("sticky top-0 z-50", headerBg)}>
        <div className="flex items-center justify-between px-3 md:px-6 h-14">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={headerTextClass}
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-left">
                      {portalLabel ?? "Menu"}
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="py-2" role="navigation">
                    {sidebarGroups.map((group) => (
                      <div key={group.label} className="mb-2">
                        <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {group.label}
                        </div>
                        {group.items.map((item) => (
                          <SheetTrigger asChild key={item.key}>
                            <button
                              onClick={() => onSectionChange(item.key)}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors",
                                activeSection === item.key
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-foreground hover:bg-muted"
                              )}
                              aria-current={
                                activeSection === item.key ? "page" : undefined
                              }
                            >
                              {item.label}
                            </button>
                          </SheetTrigger>
                        ))}
                      </div>
                    ))}
                    {quickActions && quickActions.length > 0 && (
                      <div className="border-t mt-2 pt-2 px-4 space-y-1.5">
                        {quickActions.map((action, idx) => (
                          <SheetTrigger asChild key={`action-${idx}`}>
                            <Button
                              variant={action.variant ?? "default"}
                              size="sm"
                              onClick={action.onClick}
                              className="w-full gap-2 text-xs font-medium"
                            >
                              <action.icon className="h-4 w-4" />
                              {action.label}
                            </Button>
                          </SheetTrigger>
                        ))}
                      </div>
                    )}
                    <div className="border-t mt-2 pt-2 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLogout}
                        className="w-full justify-start text-destructive hover:text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              <SidebarTrigger className={headerTextClass} />
            )}
            {logoSrc && (
              <img
                src={logoSrc}
                alt={logoAlt}
                className="h-10 md:h-12 shrink-0"
              />
            )}
          </div>

          <div className="flex items-center gap-1">
            {headerExtra}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className={headerTextClass}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-gradient-to-r from-primary/[0.03] to-transparent px-3 md:px-6 py-2 md:py-2.5 overflow-x-auto">
        <nav className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
          <button
            onClick={() => onSectionChange(sidebarGroups[0]?.items[0]?.key ?? "overview")}
            className="hover:text-foreground transition-colors shrink-0"
          >
            {portalLabel ?? "Portal"}
          </button>
          <ChevronRight className="h-4 w-4 mx-1.5 md:mx-2 shrink-0" />
          <span className="text-muted-foreground shrink-0">{groupTitle}</span>
          <ChevronRight className="h-4 w-4 mx-1.5 md:mx-2 shrink-0" />
          <span className="text-foreground font-medium truncate">
            {sectionTitle}
          </span>
        </nav>
      </div>

      <main className="flex-1 p-3 md:p-6">{children}</main>
      <Footer />
    </div>
  );

  if (!isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <PortalDesktopSidebar
            sidebarGroups={sidebarGroups}
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            onLogout={onLogout}
            tabCounts={tabCounts}
            logoSrc={logoSrc}
            logoAlt={logoAlt}
            portalLabel={portalLabel}
            quickActions={quickActions}
          />
          {content}
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {content}
    </div>
  );
}
