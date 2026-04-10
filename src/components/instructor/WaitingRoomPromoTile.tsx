import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export function WaitingRoomPromoTile({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/instructor/waiting-room")}
      className={`cursor-pointer flex overflow-hidden rounded-none border border-border shadow-sm ${className}`}
    >
      <div className="bg-blue-600 p-5 flex flex-col items-center justify-center shrink-0 min-w-[80px]">
        <span className="text-2xl">☕</span>
        <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Weekly</p>
      </div>
      <div className="border-l-2 border-dashed border-border" />
      <div className="bg-card flex-1 p-4 flex flex-col justify-center">
        <p className="text-sm font-bold text-foreground">The Waiting Room</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Informal Zoom for driving instructors</p>
        <div className="flex items-center gap-1.5 mt-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Open to all ADIs</span>
        </div>
      </div>
    </motion.div>
  );
}
