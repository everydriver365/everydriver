import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, MessageSquare, ClipboardCheck, CalendarPlus, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { InstructorTile, InstructorTileGrid, type TileCategory } from "./InstructorTile";

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
  category: TileCategory;
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
    category: "money",
    emptySubtitle: "No pending jobs",
    filledSubtitle: (n) => `${n} pending ${n === 1 ? "job" : "jobs"}`,
  },
  {
    id: "messages",
    title: "Messages",
    icon: MessageSquare,
    route: "/instructor/messages",
    countKey: "unreadMessagesCount",
    category: "people",
    emptySubtitle: "All caught up",
    filledSubtitle: (n) => `${n} unread ${n === 1 ? "chat" : "chats"}`,
  },
  {
    id: "tests",
    title: "Tests",
    icon: ClipboardCheck,
    route: "/instructor/test-requests",
    countKey: "testRequestsCount",
    category: "education",
    emptySubtitle: "No swap requests",
    filledSubtitle: (n) => `${n} swap ${n === 1 ? "request" : "requests"}`,
  },
  {
    id: "fill-gaps",
    title: "Fill gaps",
    icon: CalendarPlus,
    route: "/instructor/gaps",
    countKey: "gapSlotsCount",
    category: "schedule",
    emptySubtitle: "No open slots",
    filledSubtitle: (n) => `${n} open ${n === 1 ? "slot" : "slots"}`,
  },
];

export function ActivityTilesGrid(props: ActivityTilesGridProps) {
  const navigate = useNavigate();
  const allZero = TILES.every((t) => props[t.countKey] === 0);

  const Header = (
    <div style={{ padding: "0 16px", marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#6B7280",
          letterSpacing: 0.4,
          textTransform: "uppercase",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
        }}
      >
        Overview
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 13,
          fontWeight: 400,
          color: "#6B7280",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
        }}
      >
        Your activity at a glance
      </div>
    </div>
  );

  if (allZero) {
    return (
      <div style={{ paddingTop: 16 }}>
        {Header}
        <div style={{ padding: "0 16px" }}>
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
              border: "0.5px solid #E5E5EA",
              borderRadius: 12,
            }}
          >
            <CheckCircle2 size={16} strokeWidth={2} color="#3B8B3B" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#000000", fontFamily: "Inter, sans-serif" }}>
              All clear — no actions needed
            </span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <InstructorTileGrid>
      {TILES.map((t) => {
        const count = props[t.countKey];
        return (
          <InstructorTile
            key={t.id}
            icon={t.icon}
            title={t.title}
            category={t.category}
            onPress={() => navigate(t.route)}
            count={count > 0 ? count : undefined}
            subtitle={count > 0 ? t.filledSubtitle(count) : t.emptySubtitle}
          />
        );
      })}
    </InstructorTileGrid>
  );
}
