import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Calendar, MessageSquare, Gift, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useInstructorNotifications, InstructorNotification } from "@/hooks/useInstructorNotifications";
import { cn } from "@/lib/utils";

interface InstructorNotificationsDropdownProps {
  instructorId: string | undefined;
  pendingJobsCount?: number;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  gap_filled: Calendar,
  new_booking: Calendar,
  message: MessageSquare,
  offer: Gift,
  default: AlertCircle,
};

export function InstructorNotificationsDropdown({ 
  instructorId, 
  pendingJobsCount = 0 
}: InstructorNotificationsDropdownProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useInstructorNotifications(instructorId);

  const totalBadge = unreadCount + pendingJobsCount;

  const handleNotificationClick = (notification: InstructorNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
  };

  const getIcon = (type: string) => {
    const Icon = typeIcons[type] || typeIcons.default;
    return Icon;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 relative"
        >
          <Bell className="h-5 w-5" />
          {totalBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-primary animate-pulse">
              {totalBadge > 9 ? "9+" : totalBadge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[300px]">
          {/* Pending Jobs Section */}
          {pendingJobsCount > 0 && (
            <button
              className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b"
              onClick={() => {
                navigate("/instructor/jobs");
                setOpen(false);
              }}
            >
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Gift className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {pendingJobsCount} Pending Job{pendingJobsCount > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  New learner enquiries awaiting response
                </p>
              </div>
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {pendingJobsCount}
              </Badge>
            </button>
          )}

          {/* Recent Notifications */}
          {notifications.length > 0 ? (
            notifications.slice(0, 10).map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <button
                  key={notification.id}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    notification.type === "gap_filled" 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : "bg-blue-100 dark:bg-blue-900/30"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      notification.type === "gap_filled" 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-blue-600 dark:text-blue-400"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })
          ) : pendingJobsCount === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : null}
        </ScrollArea>

        {(notifications.length > 0 || pendingJobsCount > 0) && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                navigate("/instructor/notifications");
                setOpen(false);
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
