import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  ArrowLeftRight,
  MessageSquare,
  CalendarPlus,
  User,
  ChevronRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useDormantPupilsCount } from "@/hooks/useDormantPupilsCount";

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
  instructorId?: string;
}

interface AttentionItem {
  id: string;
  label: string;
  subtitle: string;
  count: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  bandColor: string;
  route: string;
  priority: number;
}

export function ActivityTilesGrid({
  pendingJobsCount,
  unreadMessagesCount,
  testRequestsCount,
  gapSlotsCount,
  instructorId,
}: ActivityTilesGridProps) {
  const navigate = useNavigate();
  const { data: dormantCount = 0 } = useDormantPupilsCount(instructorId);

  const items: AttentionItem[] = useMemo(
    () => [
      {
        id: "jobOffers",
        label: "Job offers",
        subtitle:
          pendingJobsCount > 0
            ? `${pendingJobsCount} offer${pendingJobsCount !== 1 ? "s" : ""} waiting`
            : "No new offers",
        count: pendingJobsCount,
        icon: Briefcase,
        iconBg: "#FFF0F0",
        iconColor: "#CC2229",
        bandColor: "#CC2229",
        route: "/instructor/jobs",
        priority: 1,
      },
      {
        id: "testSwaps",
        label: "Test swaps",
        subtitle:
          testRequestsCount > 0
            ? `${testRequestsCount} new match${testRequestsCount !== 1 ? "es" : ""} available`
            : "No new matches",
        count: testRequestsCount,
        icon: ArrowLeftRight,
        iconBg: "#FFF0F0",
        iconColor: "#CC2229",
        bandColor: "#CC2229",
        route: "/instructor/test-requests",
        priority: 2,
      },
      {
        id: "messages",
        label: "Messages",
        subtitle:
          unreadMessagesCount > 0
            ? `${unreadMessagesCount} unread chat${unreadMessagesCount !== 1 ? "s" : ""}`
            : "All caught up",
        count: unreadMessagesCount,
        icon: MessageSquare,
        iconBg: "#FFF0F0",
        iconColor: "#CC2229",
        bandColor: "#CC2229",
        route: "/instructor/messages",
        priority: 3,
      },
      {
        id: "openSlots",
        label: "Open slots this week",
        subtitle:
          gapSlotsCount > 0
            ? `${gapSlotsCount} gap${gapSlotsCount !== 1 ? "s" : ""} to fill`
            : "Fill gaps in your schedule",
        count: gapSlotsCount,
        icon: CalendarPlus,
        iconBg: "#EEF3FF",
        iconColor: "#1A52A0",
        bandColor: "#1A52A0",
        route: "/instructor/gaps",
        priority: 4,
      },
      {
        id: "dormantPupils",
        label: "Dormant pupils",
        subtitle:
          dormantCount > 0
            ? `${dormantCount} with no lesson in 2+ weeks`
            : "All pupils active",
        count: dormantCount,
        icon: User,
        iconBg: "#FFF6E6",
        iconColor: "#B45309",
        bandColor: "#B45309",
        route: "/instructor/pupils?filter=dormant",
        priority: 5,
      },
    ],
    [pendingJobsCount, testRequestsCount, unreadMessagesCount, gapSlotsCount, dormantCount]
  );

  const totalCount = items.reduce((sum, i) => sum + (i.count > 0 ? 1 : 0), 0);

  // "Just arrived" tracking — session-only
  const prevCounts = useRef<Record<string, number>>({});
  const [newlyActivated, setNewlyActivated] = useState<Set<string>>(new Set());

  useEffect(() => {
    const justActivated: string[] = [];
    items.forEach((item) => {
      const prev = prevCounts.current[item.id] ?? item.count;
      if (prev === 0 && item.count > 0) justActivated.push(item.id);
      prevCounts.current[item.id] = item.count;
    });
    if (justActivated.length > 0) {
      setNewlyActivated((prev) => {
        const next = new Set(prev);
        justActivated.forEach((id) => next.add(id));
        return next;
      });
      const t = setTimeout(() => {
        setNewlyActivated((prev) => {
          const next = new Set(prev);
          justActivated.forEach((id) => next.delete(id));
          return next;
        });
      }, 30000);
      return () => clearTimeout(t);
    }
  }, [items]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aActive = a.count > 0 ? 0 : 1;
        const bActive = b.count > 0 ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.priority - b.priority;
      }),
    [items]
  );

  return (
    <div style={{ padding: "0 16px", marginTop: 12 }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#8E8E93",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Needs attention
        </span>
        {totalCount > 0 && (
          <span
            style={{
              backgroundColor: "#CC2229",
              borderRadius: 10,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 700,
              color: "#FFF",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {/* Single card */}
      <div
        style={{
          backgroundColor: "#FFF",
          borderRadius: 18,
          overflow: "hidden",
          border: "0.5px solid rgba(26,82,160,0.08)",
        }}
      >
        <LayoutGroup>
          {sortedItems.map((item, i) => {
            const isActive = item.count > 0;
            const isClear = !isActive;
            const showNewBadge = newlyActivated.has(item.id);
            const isLast = i === sortedItems.length - 1;
            const Icon = item.icon;

            return (
              <motion.div key={item.id} layout transition={{ duration: 0.25, ease: "easeInOut" }}>
                <button
                  type="button"
                  onClick={() => navigate(item.route)}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    backgroundColor: isActive ? "#FFFBFB" : "transparent",
                    opacity: isClear ? 0.38 : 1,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {/* Left accent band */}
                  <div
                    style={{
                      width: 4,
                      height: 34,
                      borderRadius: 2,
                      flexShrink: 0,
                      backgroundColor: isActive ? item.bandColor : "#E0E5EE",
                    }}
                  />

                  {/* Icon tile */}
                  <div
                    style={{
                      position: "relative",
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      flexShrink: 0,
                      backgroundColor: isActive ? item.iconBg : "#F2F4F8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.7}
                      color={isActive ? item.iconColor : "#8E8E93"}
                    />
                    {showNewBadge && (
                      <span
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          width: 9,
                          height: 9,
                          borderRadius: 5,
                          backgroundColor: "#CC2229",
                          border: "1.5px solid #FFF",
                        }}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? item.iconColor : "#8E8E93",
                        fontFamily: "Inter, sans-serif",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#8E8E93",
                        marginTop: 2,
                        fontFamily: "Inter, sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>

                  {/* Right element */}
                  {isClear ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 3,
                        backgroundColor: "#E8F8ED",
                        borderRadius: 20,
                        padding: "2px 6px",
                      }}
                    >
                      <Check size={9} color="#1A7A3C" strokeWidth={2.5} />
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: "#1A7A3C",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Clear
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: item.bandColor,
                        borderRadius: 20,
                        minWidth: 20,
                        height: 20,
                        padding: "0 6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#FFF",
                          fontFamily: "Inter, sans-serif",
                          lineHeight: 1,
                        }}
                      >
                        {item.count}
                      </span>
                    </div>
                  )}

                  <ChevronRight
                    size={12}
                    color={isActive ? item.iconColor : "#D0D5DD"}
                    strokeWidth={isActive ? 2 : 1.8}
                    style={{ marginLeft: 2, flexShrink: 0 }}
                  />
                </button>

                {/* Just arrived label */}
                <AnimatePresence>
                  {showNewBadge && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{
                        overflow: "hidden",
                        backgroundColor: "#FFF8F8",
                        borderTop: "0.5px solid rgba(204,34,41,0.08)",
                        borderBottom: "0.5px solid rgba(204,34,41,0.08)",
                      }}
                    >
                      <div
                        style={{
                          padding: "3px 14px",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: "#CC2229",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#CC2229",
                            letterSpacing: 0.6,
                            textTransform: "uppercase",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          Just arrived
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Separator */}
                {!isLast && !showNewBadge && (
                  <div style={{ height: 0.5, backgroundColor: "#F0F3F8" }} />
                )}
              </motion.div>
            );
          })}
        </LayoutGroup>
      </div>
    </div>
  );
}

// Backwards-compat: some legacy imports may use InstructorTileGrid/InstructorTile from this module path.
export { InstructorTile, InstructorTileGrid } from "./InstructorTile";
