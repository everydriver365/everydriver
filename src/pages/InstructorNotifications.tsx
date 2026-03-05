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
    <div className="min-h-screen bg-background">
      <InstructorMobileHeader title="Notifications" showBackButton showSettings={false} />

      <div className="px-4 py-4 space-y-4">
        {/* Quick counts */}
        {quickCards.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {quickCards.map(card => (
              <button
                key={card.label}
                onClick={() => navigate(card.path)}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0", card.color)}>
                  <card.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{card.count}</p>
                  <p className="text-[11px] text-muted-foreground">{card.label}</p>
                </div>
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
        <div className="space-y-1">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
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
                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors",
                    !n.is_read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0", color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
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
