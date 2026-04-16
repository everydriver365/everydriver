import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Users, Compass } from "lucide-react";
import { DiscoverFeaturesSheet } from "./DiscoverFeaturesSheet";

export function BottomPromoGroup({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const tileStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 14,
    border: "0.5px solid #E4E4E7",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    cursor: "pointer",
    transition: "background 120ms ease",
  };

  return (
    <>
      <div className={`flex flex-col gap-[10px] ${className}`}>
        {/* The Waiting Room */}
        <motion.div
          whileTap={{ scale: 0.99, backgroundColor: "#F4F4F5" }}
          whileHover={{ backgroundColor: "#FAFAFA" }}
          onClick={() => navigate("/instructor/waiting-room")}
          style={tileStyle}
          className="focus-visible:ring-2 focus-visible:ring-[#6366F1] outline-none"
          tabIndex={0}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: "#EEF2FF",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Users size={22} strokeWidth={2} color="#4F46E5" />
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

        {/* Discover Features */}
        <motion.div
          whileTap={{ scale: 0.99, backgroundColor: "#F4F4F5" }}
          whileHover={{ backgroundColor: "#FAFAFA" }}
          onClick={() => setSheetOpen(true)}
          style={tileStyle}
          className="focus-visible:ring-2 focus-visible:ring-[#6366F1] outline-none"
          tabIndex={0}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: "#ECFDF5",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Compass size={22} strokeWidth={2} color="#059669" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#18181B", fontFamily: "Inter, sans-serif" }}>Discover Features</p>
              <span style={{
                fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 4,
                backgroundColor: "#DCFCE7", color: "#166534",
              }}>30+</span>
            </div>
            <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A", marginTop: 2, fontFamily: "Inter, sans-serif" }}>See everything your app can do</p>
          </div>
          <ChevronRight size={18} strokeWidth={2} color="#A1A1AA" style={{ flexShrink: 0 }} />
        </motion.div>
      </div>

      <DiscoverFeaturesSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
