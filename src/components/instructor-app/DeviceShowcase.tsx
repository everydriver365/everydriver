import { motion } from "framer-motion";
import phoneMockup from "@/assets/phone-mockup.png";
import laptopMockup from "@/assets/laptop-mockup.png";

export function DeviceShowcase() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12 md:mt-16 px-4">
      {/* Device Container - matching reference layout */}
      <div className="relative flex items-end justify-center min-h-[280px] md:min-h-[350px] lg:min-h-[420px]">
        
        {/* Mobile Device - Left side, overlapping laptop */}
        <motion.div
          initial={{ opacity: 0, x: -40, y: 30 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7, ease: "easeOut" }}
          className="absolute left-[5%] md:left-[10%] lg:left-[12%] bottom-0 z-20"
        >
          <img
            src={phoneMockup}
            alt="EveryDriver mobile app showing map and booking"
            className="w-36 sm:w-44 md:w-56 lg:w-64 h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        {/* Laptop Device - Right side, behind phone */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
          className="absolute right-[0%] md:right-[5%] lg:right-[8%] bottom-0 z-10"
        >
          <img
            src={laptopMockup}
            alt="EveryDriver dashboard with analytics"
            className="w-56 sm:w-72 md:w-96 lg:w-[480px] h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.4)]"
          />
        </motion.div>
      </div>

      {/* Subtle reflection/shadow under devices */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90%] h-16 bg-gradient-to-t from-black/30 via-black/10 to-transparent blur-2xl rounded-full" />
    </div>
  );
}
