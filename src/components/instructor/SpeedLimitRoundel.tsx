import React from 'react';
import { motion } from 'framer-motion';

interface SpeedLimitRoundelProps {
  speedLimit: number | null;
  isExceeding?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SpeedLimitRoundel: React.FC<SpeedLimitRoundelProps> = ({
  speedLimit,
  isExceeding = false,
  size = 'md',
  className = ''
}) => {
  // Convert km/h to mph for display
  const speedLimitMph = speedLimit ? Math.round(speedLimit * 0.621371) : null;
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg border-[3px]',
    md: 'w-16 h-16 text-2xl border-4',
    lg: 'w-20 h-20 text-3xl border-[5px]'
  };

  const innerSizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-15 h-15'
  };

  if (speedLimitMph === null) {
    return (
      <div className={`${sizeClasses[size]} rounded-full border-red-600 bg-white flex items-center justify-center shadow-lg ${className}`}>
        <span className="font-bold text-gray-900">--</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: isExceeding ? [1, 1.05, 1] : 1, 
        opacity: 1 
      }}
      transition={{ 
        scale: isExceeding ? { repeat: Infinity, duration: 0.5 } : { duration: 0.2 }
      }}
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        border-red-600 
        bg-white 
        flex items-center justify-center 
        shadow-lg
        ${isExceeding ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' : ''}
        ${className}
      `}
    >
      <span className="font-bold text-gray-900 tabular-nums">
        {speedLimitMph}
      </span>
    </motion.div>
  );
};

export default SpeedLimitRoundel;
