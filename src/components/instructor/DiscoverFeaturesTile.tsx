import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, ChevronRight } from "lucide-react";
import { DiscoverFeaturesSheet } from "./DiscoverFeaturesSheet";

export function DiscoverFeaturesTile({ className = "" }: { className?: string }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => setSheetOpen(true)}
        className={`cursor-pointer flex overflow-hidden rounded-none border border-border shadow-sm ${className}`}
      >
        <div className="bg-primary p-5 flex flex-col items-center justify-center shrink-0 min-w-[80px]">
          <Compass className="h-6 w-6 text-primary-foreground" />
          <p className="text-[9px] font-bold text-primary-foreground/70 uppercase tracking-widest mt-1">Explore</p>
        </div>
        <div className="border-l-2 border-dashed border-border" />
        <div className="bg-card flex-1 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Discover Features</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">See everything your app can do</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        </div>
      </motion.div>

      <DiscoverFeaturesSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
