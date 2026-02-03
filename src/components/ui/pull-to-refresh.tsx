import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
}

// Animated car driving along a road
function DrivingRefreshAnimation({ 
  progress, 
  isRefreshing 
}: { 
  progress: number; 
  isRefreshing: boolean;
}) {
  // Car moves from left to right based on pull progress
  const carPosition = Math.min(progress * 100, 85);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Road */}
      <div className="absolute w-full h-2 bg-muted-foreground/20 rounded-full">
        {/* Road markings */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-around">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="w-3 h-0.5 bg-muted-foreground/40 rounded-full"
            />
          ))}
        </div>
      </div>
      
      {/* Finish flag at threshold */}
      <motion.div
        className="absolute right-4 flex flex-col items-center"
        animate={{ 
          scale: progress >= 1 ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className={`text-lg ${progress >= 1 ? 'opacity-100' : 'opacity-30'}`}>
          🏁
        </div>
      </motion.div>
      
      {/* Car */}
      <motion.div
        className="absolute left-0"
        style={{ left: `${carPosition}%` }}
        animate={isRefreshing ? {
          y: [0, -2, 0, 2, 0],
        } : {}}
        transition={isRefreshing ? {
          duration: 0.3,
          repeat: Infinity,
        } : {}}
      >
        <span className="text-xl">🚗</span>
      </motion.div>
      
      {/* Start point */}
      <div className="absolute left-4">
        <span className="text-sm opacity-50">🏠</span>
      </div>
    </div>
  );
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
  const hasTriggeredHaptic = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance
      const resistance = 0.4;
      const newDistance = diff * resistance;
      setPullDistance(newDistance);
      
      // Haptic feedback at threshold
      if (newDistance >= threshold && !hasTriggeredHaptic.current) {
        haptics.medium();
        hasTriggeredHaptic.current = true;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      haptics.success();
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / threshold, 1);

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
              opacity: isRefreshing ? 1 : progress, 
              height: isRefreshing ? 50 : Math.min(pullDistance, threshold) 
            }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center overflow-hidden px-4"
          >
            <DrivingRefreshAnimation 
              progress={progress} 
              isRefreshing={isRefreshing} 
            />
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
