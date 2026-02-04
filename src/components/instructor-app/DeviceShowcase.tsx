import { motion } from "framer-motion";
import mobileAppMockup from "@/assets/instructor-app-mobile-mockup.png";
import desktopAppMockup from "@/assets/instructor-app-desktop-mockup.png";

export function DeviceShowcase() {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-16 px-4">
      {/* Device Container */}
      <div className="relative flex items-end justify-center">
        {/* Mobile Device - Positioned on the left, overlapping */}
        <motion.div
          initial={{ opacity: 0, x: -50, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative z-20 -mr-16 md:-mr-24"
        >
          <div className="relative">
            {/* Mobile glow effect */}
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-3xl" />
            <img
              src={mobileAppMockup}
              alt="EveryDriver mobile app showing calendar and map"
              className="relative w-32 md:w-48 lg:w-56 h-auto drop-shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Desktop/Laptop Device - Main centered element */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10"
        >
          <div className="relative">
            {/* Desktop glow effect */}
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-3xl" />
            <img
              src={desktopAppMockup}
              alt="EveryDriver desktop dashboard with analytics"
              className="relative w-64 md:w-96 lg:w-[480px] h-auto drop-shadow-2xl rounded-lg"
            />
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-3/4 h-8 bg-gradient-to-t from-slate-950/50 to-transparent blur-xl" />
    </div>
  );
}
