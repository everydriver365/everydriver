import { useState } from "react";
import { MessageSquare, ChevronRight, ChevronDown, Briefcase, Award, Headset } from "lucide-react";
import { Link } from "react-router-dom";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useTileHealth } from "@/hooks/useTileHealth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import messagesIcon from "@/assets/messages-icon.png";

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
  const [isExpanded, setIsExpanded] = useState(true);
  const { total, messageCount: pupilMsgCount, visitorChatCount, pendingJobsCount, swapCount } = useCombinedNotificationCount(instructorId);
  const { hasOutageFor } = useTileHealth(instructorId);
  const widgetOutage = hasOutageFor("messages") || hasOutageFor("course_enquiries");

  const counts: Record<string, number> = {
    pupil: pupilMsgCount,
    visitor: visitorChatCount,
    jobs: pendingJobsCount,
    tests: swapCount,
  };

  return (
    <div className="relative rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card overflow-hidden">
      {widgetOutage && (
        <span
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
          style={{ background: "#C68B16" }}
          aria-label="Live data delayed"
        />
      )}
      {/* Header — Quick Access tile style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-3.5 flex items-center gap-3"
      >
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          {total > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
              {total > 9 ? "9+" : total}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] font-semibold text-foreground leading-tight">Messages & Alerts</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", !isExpanded && "-rotate-90")} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1">
              {alertRows.map(({ key, label, icon: Icon, route, color, bg }) => {
                const count = counts[key];
                return (
                  <Link
                    key={key}
                    to={route}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`h-8 w-8 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
