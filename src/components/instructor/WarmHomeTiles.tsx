import { useNavigate } from "react-router-dom";
import { addHours, differenceInMinutes } from "date-fns";
import { useSoonestPendingOffer } from "@/hooks/useSoonestPendingOffer";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useTileHealth } from "@/hooks/useTileHealth";
import { WeekAtAGlanceCard } from "@/components/instructor/WeekAtAGlanceCard";
import { HomeActionCard } from "@/components/instructor/HomeActionCard";
import type { PriorityAction } from "@/lib/composeStatusSubtitle";

interface Props {
  instructorId: string | undefined;
}

const RESPONSE_SLA_HOURS = 24;

/**
 * Build the prioritised action list from current notification state.
 * Priority order matches the original WarmHomeTiles "tile 1" resolver:
 *   pendingJobsCount > swapCount > messageCount > visitorChatCount
 */
export function useHomeActions(instructorId: string | undefined) {
  const { data: soonestOffer } = useSoonestPendingOffer(instructorId);
  const { messageCount, visitorChatCount, pendingJobsCount, swapCount } =
    useCombinedNotificationCount(instructorId);

  let respondText = "Tap to review";
  if (soonestOffer) {
    const deadline = addHours(new Date(soonestOffer.created_at), RESPONSE_SLA_HOURS);
    const minutesLeft = differenceInMinutes(deadline, new Date());
    if (minutesLeft > 0) {
      const hoursLeft = Math.max(1, Math.round(minutesLeft / 60));
      respondText = `Respond within ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}`;
    } else {
      respondText = "Respond now";
    }
  }

  const actions: PriorityAction[] = [];
  if (pendingJobsCount > 0) {
    actions.push({
      kind: "job_offer",
      count: pendingJobsCount,
      eyebrow: "Needs response",
      title: `${pendingJobsCount} new job offer${pendingJobsCount === 1 ? "" : "s"}`,
      subtitle: respondText,
      route: "/instructor/jobs",
    });
  }
  if (swapCount > 0) {
    actions.push({
      kind: "test_swap",
      count: swapCount,
      eyebrow: "Needs response",
      title: `${swapCount} test alert${swapCount === 1 ? "" : "s"}`,
      subtitle: "Tap to review",
      route: "/instructor/test-requests",
    });
  }
  if (messageCount > 0) {
    actions.push({
      kind: "message",
      count: messageCount,
      eyebrow: "Needs response",
      title: `${messageCount} unread message${messageCount === 1 ? "" : "s"}`,
      subtitle: "Tap to reply",
      route: "/instructor/messages",
    });
  }
  if (visitorChatCount > 0) {
    actions.push({
      kind: "visitor_chat",
      count: visitorChatCount,
      eyebrow: "Needs response",
      title: `${visitorChatCount} visitor chat${visitorChatCount === 1 ? "" : "s"}`,
      subtitle: "Tap to reply",
      route: "/instructor/messages",
    });
  }

  return actions;
}

/**
 * Top-of-home card stack:
 *   Action card (conditional) + Progress rings card (always)
 */
export function WarmHomeTiles({ instructorId }: Props) {
  const navigate = useNavigate();
  const actions = useHomeActions(instructorId);
  // Health surface is preserved indirectly through child components.
  useTileHealth(instructorId);

  const topAction = actions[0] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {topAction && (
        <HomeActionCard
          action={topAction}
          totalActions={actions.length}
          onPress={() => navigate(topAction.route)}
        />
      )}
      <div style={{ padding: "0 14px" }}>
        <WeekAtAGlanceCard instructorId={instructorId} />
      </div>
    </div>
  );
}
