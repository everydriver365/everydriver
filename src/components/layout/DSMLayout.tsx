import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

interface DSMLayoutProps {
  title: string;
  children: ReactNode;
}

export function DSMLayout({ title, children }: DSMLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* iOS-style sticky header */}
      <div className="sticky top-0 z-50 bg-[#F2F2F7]/80 backdrop-blur-xl border-b border-black/5">
        <div className="h-[env(safe-area-inset-top,0px)]" />
        <div className="flex items-center h-11 px-2">
          <button
            onClick={() => navigate("/instructor-app/dsm")}
            className="flex items-center gap-0.5 text-[#007AFF] text-[17px] font-normal active:opacity-60 transition-opacity px-2 py-1 -ml-1"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
            <span className="text-[17px]">Back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-[#1C1C1E] truncate max-w-[60%] text-center">
            {title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="pb-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
