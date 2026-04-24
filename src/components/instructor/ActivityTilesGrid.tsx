import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, MessageSquare, ClipboardCheck, CalendarPlus, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tile, TileGrid } from "./Tile";

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

interface TileDef {
  id: string;
  title: string;
  icon: LucideIcon;
  route: string;
  countKey: keyof ActivityTilesGridProps;
  emptySubtitle: string;
  filledSubtitle: (n: number) => string;
}

const TILES: TileDef[] = [
  {
    id: "job-offers",
    title: "Job offers",
    icon: Briefcase,
    route: "/instructor/jobs",
    countKey: "pendingJobsCount",
    emptySubtitle: "No pending jobs",
    filledSubtitle: (n) => `${n} pending ${n === 1 ? "job" : "jobs"}`,
  },
  {
    id: "messages",
    title: "Messages",
    icon: MessageSquare,
    route: "/instructor/messages",
    countKey: "unreadMessagesCount",
    emptySubtitle: "All caught up",
    filledSubtitle: (n) => `${n} unread ${n === 1 ? "chat" : "chats"}`,
  },
  {
    id: "tests",
    title: "Tests",
    icon: ClipboardCheck,
    route: "/instructor/test-requests",
    countKey: "testRequestsCount",
    emptySubtitle: "No swap requests",
    filledSubtitle: (n) => `${n} swap ${n === 1 ? "request" : "requests"}`,
  },
  {
    id: "fill-gaps",
    title: "Fill gaps",
    icon: CalendarPlus,
    route: "/instructor/gaps",
    countKey: "gapSlotsCount",
    emptySubtitle: "No open slots",
    filledSubtitle: (n) => `${n} open ${n === 1 ? "slot" : "slots"}`,
  },
];

export function ActivityTilesGrid(props: ActivityTilesGridProps) {
  const navigate = useNavigate();
  const allZero = TILES.every((t) => props[t.countKey] === 0);

  if (allZero) {
    return (
      <div style={{ padding: "0 16px", marginTop: 12 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="shadow-premium"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 14px",
            background: "hsl(var(--dsm-card))",
            borderRadius: 12,
          }}
        >
          <CheckCircle2 size={16} strokeWidth={2} color="hsl(var(--dsm-tint-green-fg))" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--dsm-text))", fontFamily: "Inter, sans-serif" }}>
            All clear — no actions needed
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <TileGrid>
      {TILES.map((t) => {
        const count = props[t.countKey];
        return (
          <Tile
            key={t.id}
            id={t.id}
            title={t.title}
            icon={t.icon}
            onClick={() => navigate(t.route)}
            metricValue={count > 0 ? count : undefined}
            metricUnit={count > 0 ? "new" : undefined}
            subtitle={count > 0 ? t.filledSubtitle(count) : t.emptySubtitle}
          />
        );
      })}
    </TileGrid>
  );
}
