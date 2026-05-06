import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { UserPlus, Filter, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  onAddToList?: () => void;
}

export function WaitingListManager({ onAddToList }: Props = {}) {
  const { instructor } = useInstructorAuth();

  const { data: waitlist, isLoading } = useQuery<any[]>({
    queryKey: ["waiting-list", instructor?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("lesson_waitlist") as any)
        .select("*, pupils(name, phone)")
        .eq("instructor_id", instructor!.id)
        .eq("status", "waiting")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const { data: offers } = useQuery<any[]>({
    queryKey: ["slot-offers", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slot_offers")
        .select("*, pupils(name), scheduled_lessons:original_lesson_id(lesson_date, start_time)")
        .eq("instructor_id", instructor!.id)
        .order("queue_position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const waitingCount = waitlist?.length || 0;
  const offersPendingCount =
    offers?.filter((o) => o.pupil_response === null || o.pupil_response === "pending").length || 0;
  const claimedCount = offers?.filter((o) => o.pupil_response === "accepted").length || 0;

  const stats = [
    {
      label: "Waiting",
      value: waitingCount,
      color: "#1D4ED8",
      subtext: waitingCount === 0 ? "No pupils in queue" : `${waitingCount} in queue`,
      accentColor: waitingCount > 0 ? "#1D4ED8" : "#E5E7EB",
    },
    {
      label: "Offers pending",
      value: offersPendingCount,
      color: "#D97706",
      subtext: offersPendingCount === 0 ? "Awaiting response" : `${offersPendingCount} awaiting response`,
      accentColor: offersPendingCount > 0 ? "#F59E0B" : "#E5E7EB",
    },
    {
      label: "Claimed",
      value: claimedCount,
      color: "#059669",
      subtext: claimedCount === 0 ? "Slots accepted" : `${claimedCount} slots accepted`,
      accentColor: claimedCount > 0 ? "#10B981" : "#E5E7EB",
    },
  ];

  const handleFilter = () => {
    window.dispatchEvent(new CustomEvent("waiting-list:filter"));
  };
  const handleExport = () => {
    window.dispatchEvent(new CustomEvent("waiting-list:export"));
  };

  const activeOffers =
    offers?.filter((o) => o.pupil_response === null || o.pupil_response === "pending") || [];

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              background: "#FFF",
              borderRadius: 12,
              padding: "18px 20px",
              border: "1px solid #ECEEF2",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#9CA3AF",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: stat.color,
                letterSpacing: -1,
                lineHeight: "32px",
                margin: 0,
              }}
            >
              {stat.value}
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0" }}>{stat.subtext}</p>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: stat.accentColor,
              }}
            />
          </div>
        ))}
      </div>

      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#9CA3AF",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Queue order
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleFilter}
            style={{
              background: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "5px 10px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            <Filter size={11} color="#6B7280" strokeWidth={1.8} />
            Filter
          </button>
          <button
            type="button"
            onClick={handleExport}
            style={{
              background: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "5px 10px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            <TrendingUp size={11} color="#6B7280" strokeWidth={1.8} />
            Export
          </button>
        </div>
      </div>

      {/* Queue list */}
      {isLoading ? (
        <div
          style={{
            background: "#FFF",
            borderRadius: 12,
            padding: 24,
            border: "1px solid #ECEEF2",
            color: "#6B7280",
            fontSize: 13,
          }}
        >
          Loading…
        </div>
      ) : waitingCount > 0 ? (
        <div
          style={{
            background: "#FFF",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #ECEEF2",
          }}
        >
          {waitlist!.map((entry, i) => (
            <div key={entry.id}>
              {i > 0 && <div style={{ height: 1, background: "#F3F4F6" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#3730A3",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                    {(entry as any).pupils?.name || "Unknown"}
                  </p>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0" }}>
                    {(entry.preferred_days as string[] | null)?.join(", ") || "Any day"} ·{" "}
                    {(entry.preferred_times as string[] | null)?.join(", ") || "Any time"}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: "#FFF",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            border: "1px solid #ECEEF2",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <UserPlus size={24} color="#4F46E5" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
            No one on the waiting list
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#6B7280",
              lineHeight: "20px",
              margin: "0 0 18px",
              whiteSpace: "pre-line",
            }}
          >
            {"When pupils request to join your waiting list,\nthey'll appear here in queue order."}
          </p>
          <button
            type="button"
            onClick={onAddToList}
            style={{
              background: "#1D4ED8",
              borderRadius: 20,
              padding: "7px 16px",
              border: 0,
              cursor: "pointer",
              color: "#FFF",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Add first pupil
          </button>
        </div>
      )}

      {/* Active Offers (existing logic preserved) */}
      {activeOffers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9CA3AF",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              margin: "0 0 10px",
            }}
          >
            Active slot offers
          </h2>
          <div
            style={{
              background: "#FFF",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #ECEEF2",
            }}
          >
            {activeOffers.map((offer, i) => (
              <div key={offer.id}>
                {i > 0 && <div style={{ height: 1, background: "#F3F4F6" }} />}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                      {(offer as any).pupils?.name || "Unknown"}
                    </p>
                    <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0" }}>
                      {(offer as any).scheduled_lessons?.lesson_date} at{" "}
                      {(offer as any).scheduled_lessons?.start_time}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#F3F4F6",
                        color: "#374151",
                        fontWeight: 600,
                      }}
                    >
                      #{offer.queue_position || 1} in queue
                    </span>
                    {offer.claim_expires_at && (
                      <p style={{ fontSize: 10, color: "#9CA3AF", margin: "4px 0 0" }}>
                        Expires {formatDistanceToNow(new Date(offer.claim_expires_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
