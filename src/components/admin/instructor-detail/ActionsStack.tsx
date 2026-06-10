import { useNavigate, Link } from "react-router-dom";

export function ActionsStack({
  isAdmin,
  onEditProfile,
  onSuspend,
  onRemove,
  onMessage,
  onViewDiary,
  onViewBookings,
  onViewReviews,
  onViewPayments,
  onViewDocuments,
  isSuspended,
}: {
  isAdmin: boolean;
  onEditProfile: () => void;
  onSuspend: () => void;
  onRemove: () => void;
  onMessage: () => void;
  onViewDiary: () => void;
  onViewBookings: () => void;
  onViewReviews: () => void;
  onViewPayments: () => void;
  onViewDocuments: () => void;
  isSuspended: boolean;
}) {
  const nav = useNavigate();
  return (
    <div style={{ marginTop: 14 }}>
      <Card title="ACTIONS">
        <ActionLink label="✏ Edit profile" onClick={onEditProfile} />
        <ActionLink label="📅 View diary" onClick={onViewDiary} />
        <ActionLink label="📋 View bookings" onClick={onViewBookings} />
        <ActionLink label="⭐ View reviews" onClick={onViewReviews} />
        <ActionLink label="💳 Payments" onClick={onViewPayments} />
        <ActionLink label="📄 Documents" onClick={onViewDocuments} />
        <ActionLink label="📨 Message" onClick={onMessage} last />
      </Card>

      {isAdmin && (
        <Card title="ADMIN">
          <ActionLink label={isSuspended ? "✓ Re-activate instructor" : "⚠ Suspend instructor"} onClick={onSuspend} danger={!isSuspended} />
          <ActionLink label="✕ Remove from platform" onClick={onRemove} danger last />
        </Card>
      )}

      <Card title="NAVIGATE">
        <ActionLink label="← All instructors" onClick={() => nav("/admin/network-instructors")} last />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E5E7EB",
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          fontSize: 9,
          fontWeight: 700,
          color: "#9CA3AF",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "4px 12px" }}>{children}</div>
    </div>
  );
}

function ActionLink({
  label, onClick, danger, last,
}: { label: string; onClick: () => void; danger?: boolean; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        background: "none", border: "none",
        padding: "5px 0",
        borderBottom: last ? "none" : "1px solid #F3F4F6",
        fontSize: 11, fontWeight: 500,
        color: danger ? "#DC2626" : "#0070C0",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
