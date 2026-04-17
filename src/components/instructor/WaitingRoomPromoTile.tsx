import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ChevronRight } from "lucide-react";

export function WaitingRoomPromoTile({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.99, backgroundColor: "#F4F4F5" }}
      whileHover={{ backgroundColor: "#FAFAFA" }}
      onClick={() => navigate("/instructor/waiting-room")}
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        border: "0.5px solid #E4E4E7",
        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.06)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        transition: "background 120ms ease",
      }}
      className={`focus-visible:ring-2 focus-visible:ring-[#2A394F] outline-none ${className}`}
      tabIndex={0}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: "#E8ECF1",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Users size={22} strokeWidth={2} color="#2A394F" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#18181B", fontFamily: "Inter, sans-serif" }}>The Waiting Room</p>
          <span style={{
            fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 4,
            backgroundColor: "#DBEAFE", color: "#1E40AF",
          }}>Weekly</span>
        </div>
        <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A", marginTop: 2, fontFamily: "Inter, sans-serif" }}>Informal Zoom for driving instructors</p>
      </div>
      <ChevronRight size={18} strokeWidth={2} color="#A1A1AA" style={{ flexShrink: 0 }} />
    </motion.div>
  );
}
