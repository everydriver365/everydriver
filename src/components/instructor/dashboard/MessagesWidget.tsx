import { MessageSquare, ChevronRight, Briefcase, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MessagesWidgetProps {
  instructorId: string;
}

export function MessagesWidget({ instructorId }: MessagesWidgetProps) {
  const { total, messageCount: pupilMsgCount, visitorChatCount, pendingJobsCount, swapCount } = useCombinedNotificationCount(instructorId);

  const { data: recentConversations = [] } = useQuery({
    queryKey: ["recent-conversations", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, last_message_at, last_message_preview, pupil_id, pupils(name)")
        .eq("instructor_id", instructorId)
        .order("last_message_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
    enabled: !!instructorId,
  });

  const alertSummary = [
    pupilMsgCount > 0 && `${pupilMsgCount} pupil`,
    visitorChatCount > 0 && `${visitorChatCount} chat`,
    pendingJobsCount > 0 && `${pendingJobsCount} job`,
    swapCount > 0 && `${swapCount} test`,
  ].filter(Boolean).join(" · ");

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">Messages & Alerts</h3>
              {alertSummary && (
                <p className="text-[10px] text-muted-foreground">{alertSummary}</p>
              )}
            </div>
            {total > 0 && (
              <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {total > 9 ? "9+" : total}
              </span>
            )}
          </div>
          <Link to="/instructor/messages">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentConversations.length === 0 ? (
          <Link to="/instructor/messages" className="block py-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            No conversations yet
          </Link>
        ) : (
          <div className="space-y-1.5">
            {recentConversations.map((convo: any) => (
              <Link
                key={convo.id}
                to="/instructor/messages"
                className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-[#0075c9]/10 text-[#0075c9] flex items-center justify-center text-[10px] font-medium shrink-0">
                  {convo.pupils?.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {convo.pupils?.name || "Unknown"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {convo.last_message_preview || "No messages"}
                  </p>
                </div>
                {convo.last_message_at && (
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {format(new Date(convo.last_message_at), "d MMM")}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
