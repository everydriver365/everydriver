import { Link, useNavigate } from "react-router-dom";
import { Plus, UserPlus, PoundSterling, MapPin } from "lucide-react";

interface Props {
  pupilCount: number;
  pupilLimit?: number;
  planName?: string;
  planPrice?: string;
  onAddLesson: () => void;
  onTakePayment: () => void;
}

export function RightRail({
  pupilCount, pupilLimit = 100, planName = "Pro", planPrice = "£24/mo",
  onAddLesson, onTakePayment,
}: Props) {
  const navigate = useNavigate();
  const pct = Math.min(100, Math.round((pupilCount / pupilLimit) * 100));

  const actions = [
    { id: "lesson", label: "New lesson", icon: Plus, onClick: onAddLesson },
    { id: "pupil", label: "Add pupil", icon: UserPlus, onClick: () => navigate("/instructor/pupils?action=add") },
    { id: "pay", label: "Take payment", icon: PoundSterling, onClick: onTakePayment },
    { id: "track", label: "Track lesson", icon: MapPin, onClick: () => navigate("/instructor/tracking") },
  ];

  return (
    <aside
      className="hidden xl:flex flex-col"
      style={{
        width: 280,
        padding: "20px 16px",
        background: "var(--d2-surface-soft)",
        borderLeft: "0.5px solid var(--d2-border)",
        gap: 24,
      }}
    >
      {/* Quick actions */}
      <section>
        <div
          style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.6px",
            color: "var(--d2-text-3)", textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Quick Actions
        </div>
        <div className="flex flex-col gap-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={a.onClick}
                className="flex items-center gap-2 transition-colors"
                style={{
                  background: "var(--d2-surface)",
                  border: "0.5px solid var(--d2-border)",
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 11, fontWeight: 500,
                  color: "var(--d2-text-1)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d2-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--d2-surface)")}
              >
                <Icon size={13} style={{ color: "var(--d2-text-2)" }} />
                {a.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Plan */}
      <section>
        <div
          style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.6px",
            color: "var(--d2-text-3)", textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Your Plan
        </div>
        <div
          style={{
            background: "var(--d2-surface)",
            border: "0.5px solid var(--d2-border)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--d2-text-1)" }}>{planName}</span>
            <span className="d2-mono" style={{ fontSize: 12, color: "var(--d2-text-2)" }}>{planPrice}</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--d2-text-2)", margin: "0 0 6px" }}>Pupils used</p>
          <div
            style={{
              height: 4, width: "100%",
              background: "#E2E8F0",
              borderRadius: 999, overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--d2-indigo)" }} />
          </div>
          <p className="d2-mono" style={{ fontSize: 10, color: "var(--d2-text-3)", margin: 0 }}>
            {pupilCount} of {pupilLimit}
          </p>
          <Link
            to="/instructor/billing"
            className="block text-center transition-colors"
            style={{
              marginTop: 12,
              background: "var(--d2-indigo)",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12, fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d2-indigo-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--d2-indigo)")}
          >
            Upgrade to Studio
          </Link>
        </div>
      </section>
    </aside>
  );
}
