import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Compass, ChevronRight } from "lucide-react";
import { DiscoverFeaturesSheet } from "./DiscoverFeaturesSheet";

export function BottomPromoGroup({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className={`rounded-none bg-card border border-border overflow-hidden ${className}`}>
        <motion.div
          whileTap={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          onClick={() => navigate("/instructor/waiting-room")}
          className="px-4 py-3 cursor-pointer flex items-center gap-3 border-b border-border"
        >
          <div className="h-8 w-8 rounded-none bg-blue-500 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-white" />
          </div>
          <p className="text-[15px] text-foreground flex-1">The Waiting Room</p>
          <p className="text-[13px] text-muted-foreground mr-1">Weekly</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
        </motion.div>
        <motion.div
          whileTap={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          onClick={() => setSheetOpen(true)}
          className="px-4 py-3 cursor-pointer flex items-center gap-3"
        >
          <div className="h-8 w-8 rounded-none bg-emerald-500 flex items-center justify-center shrink-0">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <p className="text-[15px] text-foreground flex-1">Discover Features</p>
          <p className="text-[13px] text-muted-foreground mr-1">30+</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
        </motion.div>
      </div>

      <DiscoverFeaturesSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
