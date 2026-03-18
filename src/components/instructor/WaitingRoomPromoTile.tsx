import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coffee } from "lucide-react";

export function WaitingRoomPromoTile({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/instructor/waiting-room")}
      className={`rounded-2xl cursor-pointer p-4 flex items-center gap-4 ${className}`}
      style={{ background: "#e8ecf1", boxShadow: "8px 8px 16px #c5c9cd, -8px -8px 16px #ffffff" }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: "#e8ecf1", boxShadow: "inset 4px 4px 8px #c5c9cd, inset -4px -4px 8px #ffffff" }}
      >
        <Coffee className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-bold text-gray-800">The Waiting Room</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Weekly instructor Zoom catch-up</p>
      </div>
      <div className="px-4 py-2 rounded-xl text-[11px] font-bold text-white bg-blue-600 shadow-md shadow-blue-600/30">
        Join
      </div>
    </motion.div>
  );
}
