import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance
      const resistance = 0.4;
      setPullDistance(diff * resistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  const spinnerOpacity = Math.min(pullDistance / threshold, 1);
  const spinnerScale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 10 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: isRefreshing ? 1 : spinnerOpacity, 
              height: isRefreshing ? 50 : Math.min(pullDistance, threshold) 
            }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <motion.div
              animate={{ 
                rotate: isRefreshing ? 360 : 0,
                scale: isRefreshing ? 1 : spinnerScale 
              }}
              transition={{ 
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.2 }
              }}
            >
              <Loader2 className={`h-6 w-6 ${isRefreshing ? 'text-primary' : 'text-muted-foreground'}`} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        animate={{ y: isRefreshing ? 10 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
