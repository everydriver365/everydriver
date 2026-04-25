import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { format, addHours, differenceInMinutes, isToday, isTomorrow } from "date-fns";
import { useSoonestPendingOffer } from "@/hooks/useSoonestPendingOffer";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useTileHealth } from "@/hooks/useTileHealth";

interface Props {
  instructorId: string | undefined;
}

const TXT = {
  primary: "#000000",
  secondary: "#6E6E73",
  muted: "#8E8E93",
  red: "#C8434F",
  redBorder: "#E5E5EA",
  blue: "#2B7BC8",
  blueBorder: "#E5E5EA",
  hairline: "#E5E5EA",
};

const RESPONSE_SLA_HOURS = 24;

const scaledPx = (px: number) => `calc(${px}px * var(--a11y-text-scale, 1))`;

function Skeleton({ width, height = 14 }: { width: number | string; height?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width,
        height: scaledPx(height),
        borderRadius: scaledPx(4),
        background: "#EFEDE6",
      }}
      className="animate-pulse"
    />
  );
}

function Spine({ color }: { color: string }) {
  return (
    <div
      style={{
        width: scaledPx(8),
        alignSelf: "stretch",
        borderRadius: scaledPx(4),
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function HealthDot() {
  return (
    <span
      style={{
        position: "absolute",
        top: scaledPx(8),
        right: scaledPx(8),
        width: scaledPx(6),
        height: scaledPx(6),
        borderRadius: 999,
        background: "#C68B16",
      }}
      aria-label="Live data delayed"
    />
  );
}

function TileShell({
  borderColor,
  onClick,
  children,
  showHealthDot = false,
}: {
  borderColor: string;
  onClick?: () => void;
  children: React.ReactNode;
  showHealthDot?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-stretch relative"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        boxShadow: "none",
        borderRadius: scaledPx(12),
        padding: `${scaledPx(14)} ${scaledPx(16)}`,
        gap: scaledPx(12),
      }}
    >
      {showHealthDot && <HealthDot />}
      {children}
    </button>
  );
}

function getInitial(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].charAt(0).toUpperCase() + ".";
}

function formatNextLessonDay(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEEE");
}

export function WarmHomeTiles({ instructorId }: Props) {
  const navigate = useNavigate();
  const { data: soonestOffer, isLoading: offerLoading } =
    useSoonestPendingOffer(instructorId);
  const { data: nextLesson, isLoading: lessonLoading } =
    useNextLessonDetails(instructorId);
  const { data: weekly, isLoading: weeklyLoading } = useWeeklyGoals(instructorId);
  const { data: unreadCount, isLoading: unreadLoading } =
    useUnreadMessagesCount(instructorId);
  const { messageCount, visitorChatCount, pendingJobsCount, swapCount } =
    useCombinedNotificationCount(instructorId);
  const { hasOutageFor } = useTileHealth(instructorId);

  // Map tile -> related health sources
  const tile1Outage =
    hasOutageFor("messages") ||
    hasOutageFor("course_enquiries");
  const tile2Outage = hasOutageFor("scheduled_lessons") || hasOutageFor("calendar_sync_queue");
  const tile3Outage =
    hasOutageFor("scheduled_lessons") ||
    hasOutageFor("payment_history") ||
    hasOutageFor("messages");

  // ---------- Tile 1: Action needed (priority resolver) ----------
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

  type AlertView = { count: number; title: string; subtitle: string; route: string };
  let alert: AlertView | null = null;
  if (pendingJobsCount > 0) {
    alert = {
      count: pendingJobsCount,
      title: `${pendingJobsCount} new job offer${pendingJobsCount === 1 ? "" : "s"}`,
      subtitle: respondText,
      route: "/instructor/jobs",
    };
  } else if (swapCount > 0) {
    alert = {
      count: swapCount,
      title: `${swapCount} test alert${swapCount === 1 ? "" : "s"}`,
      subtitle: "Tap to review",
      route: "/instructor/test-requests",
    };
  } else if (messageCount > 0) {
    alert = {
      count: messageCount,
      title: `${messageCount} unread message${messageCount === 1 ? "" : "s"}`,
      subtitle: "Tap to reply",
      route: "/instructor/messages",
    };
  } else if (visitorChatCount > 0) {
    alert = {
      count: visitorChatCount,
      title: `${visitorChatCount} visitor chat${visitorChatCount === 1 ? "" : "s"}`,
      subtitle: "Tap to reply",
      route: "/instructor/messages",
    };
  }

  const tile1Loading = offerLoading;

  // ---------- Tile 2: Up next ----------
  const isToday2 = nextLesson && isToday(new Date(nextLesson.lessonDate));
  const hasNextToday = !!isToday2;

  // ---------- Render ----------
  return (
    <div
      className="a11y-zoom-tile"
      style={{
        padding: "0 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Tile 1 — Action needed */}
      {tile1Loading ? (
        <TileShell borderColor={TXT.hairline}>
          <Spine color={TXT.hairline} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={110} height={11} />
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
        </TileShell>
      ) : alert ? (
        <TileShell
          borderColor={TXT.redBorder}
          onClick={() => navigate(alert!.route)}
          showHealthDot={tile1Outage}
        >
          <Spine color={TXT.red} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: TXT.red,
                letterSpacing: 0.5,
              }}
            >
              ACTION NEEDED
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: TXT.primary,
                marginTop: 4,
              }}
            >
              {alert.title}
            </div>
            <div style={{ fontSize: 12, color: TXT.secondary, marginTop: 2 }}>
              {alert.subtitle}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <ChevronRight size={14} strokeWidth={2} color={TXT.red} />
          </div>
        </TileShell>
      ) : (
        <TileShell borderColor={TXT.hairline} showHealthDot={tile1Outage}>
          <Spine color={TXT.hairline} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: TXT.muted,
                letterSpacing: 0.5,
              }}
            >
              NO PENDING ACTIONS
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: TXT.primary,
                marginTop: 4,
              }}
            >
              You're all caught up
            </div>
          </div>
        </TileShell>
      )}

      {/* Tile 2 — Up next */}
      {lessonLoading ? (
        <TileShell borderColor={TXT.hairline}>
          <Spine color={TXT.hairline} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={120} height={11} />
            <Skeleton width="65%" height={14} />
            <Skeleton width="50%" height={12} />
          </div>
        </TileShell>
      ) : hasNextToday && nextLesson ? (
        (() => {
          const startTime = nextLesson.startTime.slice(0, 5); // HH:mm
          const parts = nextLesson.pupilName.trim().split(" ");
          const firstName = parts[0];
          const lastInitial = getInitial(nextLesson.pupilName);
          const displayName = lastInitial
            ? `${firstName} ${lastInitial}`
            : firstName;
          const lessonType = "Driving lesson";
          const pickup = nextLesson.pickupLocation || nextLesson.pickupPostcode;
          return (
            <TileShell
              borderColor={TXT.blueBorder}
              onClick={() =>
                navigate(`/instructor/lessons/${nextLesson.lessonId}`)
              }
              showHealthDot={tile2Outage}
            >
              <Spine color={TXT.blue} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: TXT.blue,
                    letterSpacing: 0.5,
                  }}
                >
                  UP NEXT · {startTime}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: TXT.primary,
                    marginTop: 4,
                  }}
                >
                  {displayName} — {lessonType}
                </div>
                {pickup && (
                  <div
                    style={{
                      fontSize: 12,
                      color: TXT.secondary,
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Pickup: {pickup}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <ChevronRight size={14} strokeWidth={2} color={TXT.blue} />
              </div>
            </TileShell>
          );
        })()
      ) : (
        <TileShell
          borderColor={TXT.hairline}
          onClick={() => navigate("/instructor/schedule")}
          showHealthDot={tile2Outage}
        >
          <Spine color={TXT.hairline} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: TXT.muted,
                letterSpacing: 0.5,
              }}
            >
              NOTHING LEFT TODAY
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: TXT.primary,
                marginTop: 4,
              }}
            >
              You're done for today
            </div>
            {nextLesson && (
              <div
                style={{ fontSize: 12, color: TXT.secondary, marginTop: 2 }}
              >
                Next lesson: {formatNextLessonDay(nextLesson.lessonDate)} at{" "}
                {nextLesson.startTime.slice(0, 5)}
              </div>
            )}
          </div>
        </TileShell>
      )}

      {/* Tile 3 — This week at a glance */}
      <div
        className="relative"
        style={{
          background: "#FFFFFF",
          border: "0.5px solid #E5E5EA",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        {tile3Outage && <HealthDot />}
        <div
          style={{
            fontSize: 11,
            color: TXT.muted,
            letterSpacing: 0.5,
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          THIS WEEK AT A GLANCE
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          {[
            {
              loading: weeklyLoading,
              value: weekly?.lessonsThisWeek ?? 0,
              label: "Lessons",
              format: (v: number) => String(v),
              activeColor: TXT.blue,
            },
            {
              loading: weeklyLoading,
              value: weekly?.earningsThisWeek ?? 0,
              label: "Earned",
              format: (v: number) => `£${v.toLocaleString("en-GB")}`,
              activeColor: "#1F7A3A",
            },
            {
              loading: unreadLoading,
              value: unreadCount ?? 0,
              label: "Messages",
              format: (v: number) => String(v),
              activeColor: TXT.red,
            },
          ].map((col, idx) => {
            const hasData = col.value > 0;
            return (
              <div
                key={col.label}
                style={{
                  paddingLeft: idx === 0 ? 0 : 10,
                  borderLeft:
                    idx === 0 ? "none" : `0.5px solid ${TXT.hairline}`,
                }}
              >
                {col.loading ? (
                  <Skeleton width={32} height={18} />
                ) : (
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: hasData ? 600 : 500,
                      color: hasData ? col.activeColor : TXT.muted,
                      lineHeight: 1.1,
                      transition: "color 200ms ease",
                    }}
                  >
                    {col.format(col.value)}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 11,
                    color: TXT.muted,
                    marginTop: 2,
                  }}
                >
                  {col.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
