import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Users, Compass } from "lucide-react";
import { DiscoverFeaturesSheet } from "./DiscoverFeaturesSheet";
import { DISCOVER_FEATURES } from "./discoverFeaturesData";
import { useDemoMode } from "@/context/DemoModeContext";

export function BottomPromoGroup({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isDemoMode } = useDemoMode();

  // Live count of features in the registry; demo mode shows a friendly "45+".
  const liveFeatureCount = DISCOVER_FEATURES.length;
  const featureBadge = isDemoMode ? "45+" : `${liveFeatureCount}+`;

  const tileStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 14,
    boxShadow: "0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    cursor: "pointer",
    transition: "background 120ms ease, box-shadow 180ms ease",
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
          className="focus-visible:ring-2 focus-visible:ring-[#2A394F] outline-none"
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
                backgroundColor: "#E8ECF1", color: "#2A394F",
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
          className="focus-visible:ring-2 focus-visible:ring-[#2A394F] outline-none"
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
              }}>{featureBadge}</span>
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
