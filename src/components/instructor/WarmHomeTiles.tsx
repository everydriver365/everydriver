import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { format, addHours, differenceInMinutes, isToday, isTomorrow } from "date-fns";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useSoonestPendingOffer } from "@/hooks/useSoonestPendingOffer";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

interface Props {
  instructorId: string | undefined;
}

const TXT = {
  primary: "#2C2C2A",
  secondary: "#5F5E5A",
  muted: "#888780",
  red: "#A32D2D",
  redBorder: "#F7C1C1",
  blue: "#185FA5",
  blueBorder: "#B5D4F4",
  hairline: "#D3D1C7",
};

const RESPONSE_SLA_HOURS = 24;

function Skeleton({ width, height = 14 }: { width: number | string; height?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: 4,
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
        width: 8,
        alignSelf: "stretch",
        borderRadius: 4,
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function TileShell({
  borderColor,
  onClick,
  children,
}: {
  borderColor: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-stretch"
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        border: `0.5px solid ${borderColor}`,
        padding: "14px 16px",
        gap: 12,
      }}
    >
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
  const pendingJobsCount = usePendingJobsCount();
  const { data: soonestOffer, isLoading: offerLoading } =
    useSoonestPendingOffer(instructorId);
  const { data: nextLesson, isLoading: lessonLoading } =
    useNextLessonDetails(instructorId);
  const { data: weekly, isLoading: weeklyLoading } = useWeeklyGoals(instructorId);
  const { data: unreadCount, isLoading: unreadLoading } =
    useUnreadMessagesCount(instructorId);

  // ---------- Tile 1: Action needed ----------
  const hasOffers = pendingJobsCount > 0;
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

  const tile1Loading = offerLoading;

  // ---------- Tile 2: Up next ----------
  const isToday2 = nextLesson && isToday(new Date(nextLesson.lessonDate));
  const hasNextToday = !!isToday2;

  // ---------- Render ----------
  return (
    <div
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
      ) : hasOffers ? (
        <TileShell
          borderColor={TXT.redBorder}
          onClick={() => navigate("/instructor/jobs")}
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
              {pendingJobsCount} new job offer{pendingJobsCount === 1 ? "" : "s"}
            </div>
            <div style={{ fontSize: 12, color: TXT.secondary, marginTop: 2 }}>
              {respondText}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <ChevronRight size={14} strokeWidth={2} color={TXT.red} />
          </div>
        </TileShell>
      ) : (
        <TileShell borderColor={TXT.hairline}>
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
              NO PENDING OFFERS
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
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: `0.5px solid ${TXT.hairline}`,
          padding: "14px 16px",
        }}
      >
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
            },
            {
              loading: weeklyLoading,
              value: weekly?.earningsThisWeek ?? 0,
              label: "Earned",
              format: (v: number) => `£${v.toLocaleString("en-GB")}`,
            },
            {
              loading: unreadLoading,
              value: unreadCount ?? 0,
              label: "Messages",
              format: (v: number) => String(v),
            },
          ].map((col, idx) => (
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
                    fontWeight: 500,
                    color: TXT.primary,
                    lineHeight: 1.1,
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
          ))}
        </div>
      </div>
    </div>
  );
}
