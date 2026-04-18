import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { IOSTile } from "./IOSTile";

export function WaitingRoomPromoTile({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <IOSTile
      compact
      interactive
      onClick={() => navigate("/instructor/waiting-room")}
      className={className}
    >
      <IOSTile.Icon>
        <Users size={22} strokeWidth={2} color="#2A394F" />
      </IOSTile.Icon>
      <IOSTile.Body
        title="The Waiting Room"
        subtitle="Informal Zoom for driving instructors"
        badge="Weekly"
      />
      <IOSTile.Chevron />
    </IOSTile>
  );
}
