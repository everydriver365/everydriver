import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, MessageSquare, ClipboardCheck, CalendarPlus, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WarmTile, WarmTileGrid, WarmTileCategory } from "./WarmTile";

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

const tileConfig: {
  title: string;
  icon: LucideIcon;
  category: WarmTileCategory;
  route: string;
  key: "pendingJobsCount" | "unreadMessagesCount" | "testRequestsCount" | "gapSlotsCount";
  emptySubtitle: string;
  filledSubtitle: (n: number) => string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    title: "Job offers",
    icon: Briefcase,
    category: "urgent",
    route: "/instructor/jobs",
    key: "pendingJobsCount",
    emptySubtitle: "No pending jobs",
    filledSubtitle: (n) => `${n} pending ${n === 1 ? "job" : "jobs"}`,
    iconBg: "hsl(var(--dsm-tint-red-bg))",
    iconColor: "hsl(var(--dsm-tint-red-fg))",
  },
  {
    title: "Messages",
    icon: MessageSquare,
    category: "messages",
    route: "/instructor/messages",
    key: "unreadMessagesCount",
    emptySubtitle: "All caught up",
    filledSubtitle: (n) => `${n} unread ${n === 1 ? "chat" : "chats"}`,
    iconBg: "hsl(var(--dsm-tint-blue-bg))",
    iconColor: "hsl(var(--dsm-tint-blue-fg))",
  },
  {
    title: "Tests",
    icon: ClipboardCheck,
    category: "schedule",
    route: "/instructor/test-requests",
    key: "testRequestsCount",
    emptySubtitle: "No swap requests",
    filledSubtitle: (n) => `${n} swap ${n === 1 ? "request" : "requests"}`,
    iconBg: "hsl(var(--dsm-tint-green-bg))",
    iconColor: "hsl(var(--dsm-tint-green-fg))",
  },
  {
    title: "Fill gaps",
    icon: CalendarPlus,
    category: "schedule",
    route: "/instructor/gaps",
    key: "gapSlotsCount",
    emptySubtitle: "No open slots",
    filledSubtitle: (n) => `${n} open ${n === 1 ? "slot" : "slots"}`,
    iconBg: "hsl(var(--dsm-tint-orange-bg))",
    iconColor: "hsl(var(--dsm-tint-orange-fg))",
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
      <div style={{ padding: "0 16px", marginTop: 12 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 14px",
            background: "#FFFFFF",
            border: "0.5px solid #D3D1C7",
            borderRadius: 12,
          }}
        >
          <CheckCircle2 size={16} strokeWidth={2} color="#0F6E56" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A", fontFamily: "Inter, sans-serif" }}>
            All clear — no actions needed
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <WarmTileGrid>
        {tileConfig.map((tile) => {
          const count = counts[tile.key];
          return (
            <WarmTile
              key={tile.title}
              icon={tile.icon}
              title={tile.title}
              subtitle={count > 0 ? tile.filledSubtitle(count) : tile.emptySubtitle}
              category={tile.category}
              badgeCount={count}
              iconBg={tile.iconBg}
              iconColor={tile.iconColor}
              iconFilled
              onClick={() => navigate(tile.route)}
            />
          );
        })}
      </WarmTileGrid>
    </div>
  );
}
