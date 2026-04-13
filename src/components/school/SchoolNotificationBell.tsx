import { Bell, CalendarPlus, CreditCard, XCircle, Award, AlertTriangle, ShieldCheck, PhoneCall, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSchoolNotifications, type SchoolNotification } from "@/hooks/useSchoolNotifications";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, typeof Bell> = {
  new_booking: CalendarPlus,
  payment: CreditCard,
  cancellation: XCircle,
  test_result: Award,
  overdue_fee: AlertTriangle,
  compliance_expiry: ShieldCheck,
  enquiry: PhoneCall,
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  schoolId?: string;
  notificationPreferences?: Record<string, boolean> | null;
}

export default function SchoolNotificationBell({ schoolId, notificationPreferences }: Props) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSchoolNotifications(schoolId, notificationPreferences);
  const { playSound } = useChatNotifications({ enabled: true, soundEnabled: true, browserNotificationsEnabled: false });
  const prevCountRef = useRef(unreadCount);

  // Play sound on new unread
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      playSound();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, playSound]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white/70 hover:text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] bg-destructive text-destructive-foreground border-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">No notifications</div>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ notification: n, onRead }: { notification: SchoolNotification; onRead: (id: string) => void }) {
  const Icon = TYPE_ICONS[n.type] || Bell;
  return (
    <button
      onClick={() => !n.read_at && onRead(n.id)}
      className={cn(
        "w-full flex gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0",
        !n.read_at && "bg-primary/5"
      )}
    >
      <div className={cn("mt-0.5 rounded-full p-1.5", !n.read_at ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-tight", !n.read_at && "font-medium")}>{n.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
      </div>
      {!n.read_at && <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
    </button>
  );
}
