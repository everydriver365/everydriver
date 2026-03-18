import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import waitingRoomPromo from "@/assets/waiting-room-promo.jpg";

export function WaitingRoomPromoTile({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/instructor/waiting-room")}
      className={`rounded-2xl overflow-hidden cursor-pointer relative shadow-lg ${className}`}
      style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}
    >
      <div className="absolute inset-0">
        <img src={waitingRoomPromo} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 via-[#1e3a5f]/70 to-transparent" />
      </div>

      <div className="relative flex items-center gap-4 p-4">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <span className="text-2xl">☕</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-bold text-white">The Waiting Room</p>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] font-bold uppercase tracking-wider border border-emerald-400/30">
              Live Weekly
            </span>
          </div>
          <p className="text-[12px] text-blue-100/80 mt-1">
            Join fellow instructors for an informal weekly Zoom catch-up
          </p>
        </div>
        <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
          <ChevronRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
