import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu, Bell, Settings, Search, Calendar, Plus, PoundSterling,
  Users, Car, CalendarClock, LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useInstructorHeaderActions } from "@/context/InstructorHeaderContext";

interface InstructorMobileTopBarProps {
  title?: string;
}

export function InstructorMobileTopBar({ title }: InstructorMobileTopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { onOpenMenu, onOpenSearch, onOpenPaymentSheet, instructorId } = useInstructorHeaderActions();
  const { total: totalNotifCount } = useCombinedNotificationCount(instructorId);

  // Derive page title from path if not provided
  const pageTitle = title || (() => {
    const segment = location.pathname.split("/").pop() || "";
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
  })();

  return (
    <div className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div
        className="flex items-center justify-between px-3 h-12 backdrop-blur-xl bg-background/75 dark:bg-background/80 border-b border-border/30"
      >
        {/* Left: Hamburger */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMenu}
            className="h-8 w-8 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-[15px] font-semibold text-foreground truncate max-w-[140px]">
            {pageTitle}
          </span>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/instructor/test-requests")}
            className="h-7 w-7 text-foreground/60 hover:text-foreground hover:bg-foreground/10 relative"
          >
            <Bell className="h-4 w-4" />
            {totalNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse">
                {totalNotifCount > 9 ? "9+" : totalNotifCount}
              </span>
            )}
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-foreground/60 hover:text-foreground hover:bg-foreground/10"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/logout")} className="cursor-pointer">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSearch}
            className="h-7 w-7 text-foreground/60 hover:text-foreground hover:bg-foreground/10"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/instructor/availability")}
            className="h-7 w-7 text-foreground/60 hover:text-foreground hover:bg-foreground/10"
          >
            <Calendar className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPaymentSheet}
            className="h-7 px-3 text-xs font-semibold"
          >
            Pay
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
              <DropdownMenuItem onClick={() => navigate("/instructor/pupils?action=add")} className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                Add Pupil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/schedule?action=add")} className="cursor-pointer">
                <Calendar className="h-4 w-4 mr-2" />
                Add Lesson
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/find-my-car")} className="cursor-pointer">
                <Car className="h-4 w-4 mr-2" />
                Find My Car
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/availability")} className="cursor-pointer">
                <CalendarClock className="h-4 w-4 mr-2" />
                Availability
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenPaymentSheet} className="cursor-pointer">
                <PoundSterling className="h-4 w-4 mr-2" />
                Take Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/todos?action=add-reminder")} className="cursor-pointer">
                <Bell className="h-4 w-4 mr-2" />
                Add Reminder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
