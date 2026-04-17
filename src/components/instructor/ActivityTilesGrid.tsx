import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, MessageSquare, ClipboardCheck, CalendarPlus, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BestMateTile } from "@/components/ui/BestMateTile";

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

type TileColor = "purple" | "red" | "blue" | "emerald" | "amber" | "indigo";

const tileConfig: {
  title: string;
  icon: LucideIcon;
  color: TileColor;
  route: string;
  key: "pendingJobsCount" | "unreadMessagesCount" | "testRequestsCount" | "gapSlotsCount";
  ctaLabel: string;
  emptySubtitle: string;
  filledSubtitle: (n: number) => string;
}[] = [
  {
    title: "Job Offers",
    icon: Briefcase,
    color: "red",
    route: "/instructor/jobs",
    key: "pendingJobsCount",
    ctaLabel: "View Jobs",
    emptySubtitle: "No pending jobs",
    filledSubtitle: (n) => `${n} pending ${n === 1 ? "job" : "jobs"}`,
  },
  {
    title: "Messages",
    icon: MessageSquare,
    color: "blue",
    route: "/instructor/messages",
    key: "unreadMessagesCount",
    ctaLabel: "Open Inbox",
    emptySubtitle: "All caught up",
    filledSubtitle: (n) => `${n} unread ${n === 1 ? "chat" : "chats"}`,
  },
  {
    title: "Tests",
    icon: ClipboardCheck,
    color: "amber",
    route: "/instructor/test-requests",
    key: "testRequestsCount",
    ctaLabel: "Review Tests",
    emptySubtitle: "No swap requests",
    filledSubtitle: (n) => `${n} swap ${n === 1 ? "request" : "requests"}`,
  },
  {
    title: "Fill Gaps",
    icon: CalendarPlus,
    color: "emerald",
    route: "/instructor/gaps",
    key: "gapSlotsCount",
    ctaLabel: "Fill Gaps",
    emptySubtitle: "No open slots",
    filledSubtitle: (n) => `${n} open ${n === 1 ? "slot" : "slots"}`,
  },
];

export function ActivityTilesGrid({
  pendingJobsCount,
  unreadMessagesCount,
  testRequestsCount,
  gapSlotsCount,
}: ActivityTilesGridProps) {
  const navigate = useNavigate();

  const counts: Record<string, number> = {
    pendingJobsCount,
    unreadMessagesCount,
    testRequestsCount,
    gapSlotsCount,
  };

  const allZero = Object.values(counts).every((c) => c === 0);

  if (allZero) {
    return (
      <div className="px-4 mt-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 rounded-2xl shadow-lift"
        >
          <CheckCircle2 size={18} strokeWidth={2} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700" style={{ fontFamily: "Inter, sans-serif" }}>
            All clear — no actions needed
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-3 grid grid-cols-2 gap-3">
      {tileConfig.map((tile) => {
        const count = counts[tile.key];
        return (
          <BestMateTile
            key={tile.title}
            icon={tile.icon}
            iconColor={tile.color}
            value={count > 0 ? (count > 99 ? "99+" : count) : "0"}
            label={tile.title}
            subtitle={count > 0 ? tile.filledSubtitle(count) : tile.emptySubtitle}
            ctaLabel={tile.ctaLabel}
            onClick={() => navigate(tile.route)}
            onCtaClick={() => navigate(tile.route)}
          />
        );
      })}
    </div>
  );
}
