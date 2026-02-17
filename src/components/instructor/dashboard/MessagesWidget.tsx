import { MessageSquare, ChevronRight, Briefcase, Award, Headset } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";

interface MessagesWidgetProps {
  instructorId: string;
}

const alertRows = [
  { key: "pupil", label: "Pupil Messages", icon: MessageSquare, route: "/instructor/messages", color: "text-primary", bg: "bg-primary/10 dark:bg-primary/20" },
  { key: "visitor", label: "Admin / Visitor Chats", icon: Headset, route: "/instructor/messages", color: "text-accent-foreground", bg: "bg-accent/50" },
  { key: "jobs", label: "Job Offers", icon: Briefcase, route: "/instructor/jobs", color: "text-primary", bg: "bg-primary/10 dark:bg-primary/20" },
  { key: "tests", label: "Test Alerts", icon: Award, route: "/instructor/test-requests", color: "text-primary", bg: "bg-primary/10 dark:bg-primary/20" },
] as const;

export function MessagesWidget({ instructorId }: MessagesWidgetProps) {
  const { total, messageCount: pupilMsgCount, visitorChatCount, pendingJobsCount, swapCount } = useCombinedNotificationCount(instructorId);

  const counts: Record<string, number> = {
    pupil: pupilMsgCount,
    visitor: visitorChatCount,
    jobs: pendingJobsCount,
    tests: swapCount,
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-medium text-sm text-foreground flex-1">Messages & Alerts</h3>
          {total > 0 && (
            <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {total > 9 ? "9+" : total}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {alertRows.map(({ key, label, icon: Icon, route, color, bg }) => {
            const count = counts[key];
            return (
              <Link
                key={key}
                to={route}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {count > 0 ? `${count} unread` : "No new alerts"}
                  </p>
                </div>
                {count > 0 && (
                  <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {count}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
