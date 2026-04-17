import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Calendar, MessageSquare, Gift, AlertCircle, Briefcase, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorNotifications, InstructorNotification } from "@/hooks/useInstructorNotifications";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  gap_filled: Calendar,
  new_booking: Calendar,
  message: MessageSquare,
  offer: Gift,
  test_swap: ArrowLeftRight,
  job: Briefcase,
  default: AlertCircle,
};

const typeColors: Record<string, string> = {
  gap_filled: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  new_booking: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  message: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  offer: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  test_swap: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  job: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  default: "bg-muted text-muted-foreground",
};

export default function InstructorNotifications() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useInstructorNotifications(instructor?.id);
  const { pendingJobsCount, messageCount, swapCount, visitorChatCount } = useCombinedNotificationCount(instructor?.id);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;

  const getIcon = (type: string) => typeIcons[type] || typeIcons.default;
  const getColor = (type: string) => typeColors[type] || typeColors.default;

  const handleClick = (n: InstructorNotification) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  // Build quick-access cards for live counts
  const quickCards = [
    { label: "Messages", count: messageCount, icon: MessageSquare, color: "bg-purple-100 text-purple-600", path: "/instructor/messages" },
    { label: "Job Offers", count: pendingJobsCount, icon: Briefcase, color: "bg-emerald-100 text-emerald-600", path: "/instructor/jobs" },
    { label: "Test Swaps", count: swapCount, icon: ArrowLeftRight, color: "bg-amber-100 text-amber-600", path: "/instructor/test-requests" },
    { label: "Live Chats", count: visitorChatCount, icon: MessageSquare, color: "bg-blue-100 text-blue-600", path: "/instructor/live-chat" },
  ].filter(c => c.count > 0);

  return (
    <div className="min-h-screen bg-primary">
      <InstructorMobileHeader title="Notifications" showBackButton showSettings={false} />

      <div className="bg-background min-h-screen px-4 py-4 space-y-4" style={{ fontFamily: "Inter, -apple-system, 'SF Pro Text', system-ui, sans-serif" }}>
        {/* Page title — canonical iOS style */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="h-[29px] w-[29px] rounded-[7px] flex items-center justify-center" style={{ backgroundColor: "#E8ECF1" }}>
              <Bell className="h-3.5 w-3.5" style={{ color: "#2A394F" }} />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold tracking-[-0.02em]" style={{ color: "#18181B" }}>Notifications</h1>
              <p className="text-[13px]" style={{ color: "#71717A" }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px]">{unreadCount}</Badge>
          )}
        </div>

        {/* Messages tile - always visible */}
        <button
          onClick={() => navigate("/instructor/messages")}
          className="w-full flex items-center gap-3 rounded-[10px] border border-border/40 bg-card px-4 py-3 text-left active:bg-muted/50 transition-colors"
        >
          <div className="h-[29px] w-[29px] rounded-[7px] bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">Messages</p>
            <p className="text-[13px] text-muted-foreground">
              {messageCount > 0 ? `${messageCount} unread` : "No unread messages"}
            </p>
          </div>
          {messageCount > 0 && (
            <Badge variant="destructive" className="text-[10px]">{messageCount}</Badge>
          )}
        </button>

        {/* Quick counts */}
        {quickCards.length > 0 && (
          <div className="bg-card rounded-[10px] border border-border/40 divide-y divide-border/40 overflow-hidden">
            {quickCards.map(card => (
              <button
                key={card.label}
                onClick={() => navigate(card.path)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-muted/50 transition-colors"
              >
                <div className="h-[29px] w-[29px] rounded-[7px] bg-muted flex items-center justify-center flex-shrink-0">
                  <card.icon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium">{card.label}</p>
                </div>
                <Badge variant="destructive" className="text-[10px]">{card.count}</Badge>
              </button>
            ))}
          </div>
        )}

        {/* Filter + Mark all read */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs rounded-full"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs rounded-full"
              onClick={() => setFilter("unread")}
            >
              Unread{unreadCount > 0 && ` (${unreadCount})`}
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <div className="bg-card rounded-[10px] border border-border/40 divide-y divide-border/40 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-[13px]">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-[13px] text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            filtered.map(n => {
              const Icon = getIcon(n.type);
              const color = getColor(n.type);
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                    !n.is_read ? "bg-primary/5 active:bg-primary/10" : "active:bg-muted/50"
                  )}
                >
                  <div className={cn("h-[29px] w-[29px] rounded-[7px] flex items-center justify-center flex-shrink-0", color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-medium truncate">{n.title}</p>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-[13px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
