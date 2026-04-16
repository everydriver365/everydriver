import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { DiscoverFeaturesSheet } from "./DiscoverFeaturesSheet";

export function BottomPromoGroup({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: 20,
    overflow: "hidden",
    border: "0.5px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
  };

  const gradientLine = (
    <div style={{ height: 2, background: "linear-gradient(to right, #0d4fa0, #56a8f5)", borderRadius: 2 }} />
  );

  return (
    <>
      <div className={`flex flex-col gap-[10px] ${className}`}>
        <div style={cardStyle}>
          <motion.div
            whileTap={{ backgroundColor: "rgba(0,0,0,0.03)" }}
            onClick={() => navigate("/instructor/waiting-room")}
            style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          >
            <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "#1a6fd4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>👥</span>
            </div>
            <p style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#1c1c1e" }}>The Waiting Room</p>
            <p style={{ fontSize: 13, color: "#8e8e93", fontWeight: 400, marginRight: 4 }}>Weekly</p>
            <ChevronRight style={{ width: 14, height: 14, color: "#c7c7cc" }} />
          </motion.div>
          {gradientLine}
        </div>

        <div style={cardStyle}>
          <motion.div
            whileTap={{ backgroundColor: "rgba(0,0,0,0.03)" }}
            onClick={() => setSheetOpen(true)}
            style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          >
            <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "#0f9e75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>🧭</span>
            </div>
            <p style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#1c1c1e" }}>Discover Features</p>
            <p style={{ fontSize: 13, color: "#8e8e93", fontWeight: 400, marginRight: 4 }}>30+</p>
            <ChevronRight style={{ width: 14, height: 14, color: "#c7c7cc" }} />
          </motion.div>
          {gradientLine}
        </div>
      </div>

      <DiscoverFeaturesSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
