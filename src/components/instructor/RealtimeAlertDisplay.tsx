import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Gauge, 
  ArrowDown, 
  ArrowUp, 
  Phone, 
  Navigation,
  X,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TelematicsAlert } from '@/hooks/useRealtimeAlerts';

interface RealtimeAlertDisplayProps {
  alert: TelematicsAlert | null;
  onDismiss: () => void;
  voiceEnabled?: boolean;
}

const alertConfig = {
  speeding: {
    icon: Gauge,
    label: 'Speeding',
    color: 'bg-red-500',
    message: (alert: TelematicsAlert) => 
      `${Math.round(alert.speed_kmh || 0)} km/h in a ${alert.speed_limit_kmh} zone`,
  },
  harsh_brake: {
    icon: ArrowDown,
    label: 'Hard Brake',
    color: 'bg-orange-500',
    message: (alert: TelematicsAlert) => 
      `Rapid deceleration: ${Math.round(alert.speed_delta || 0)} km/h drop`,
  },
  harsh_accel: {
    icon: ArrowUp,
    label: 'Harsh Acceleration',
    color: 'bg-yellow-500',
    message: (alert: TelematicsAlert) => 
      `Rapid acceleration: +${Math.round(alert.speed_delta || 0)} km/h`,
  },
  phone_usage: {
    icon: Phone,
    label: 'Phone Usage',
    color: 'bg-purple-500',
    message: () => 'Phone movement detected',
  },
  sharp_turn: {
    icon: Navigation,
    label: 'Sharp Turn',
    color: 'bg-blue-500',
    message: () => 'Sharp cornering detected',
  },
};

const severityStyles = {
  high: 'ring-4 ring-red-400 animate-pulse',
  medium: 'ring-2 ring-orange-400',
  low: 'ring-1 ring-yellow-400',
};

export const RealtimeAlertDisplay: React.FC<RealtimeAlertDisplayProps> = ({
  alert,
  onDismiss,
  voiceEnabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      
      // Voice announcement
      if (voiceEnabled && 'speechSynthesis' in window) {
        const config = alertConfig[alert.alert_type];
        const utterance = new SpeechSynthesisUtterance(
          `${config.label}. ${config.message(alert)}`
        );
        utterance.rate = 1.1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }

      // Auto-dismiss after 5 seconds for low/medium, 8 for high
      const timeout = alert.severity === 'high' ? 8000 : 5000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for exit animation
      }, timeout);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [alert, onDismiss, voiceEnabled]);

  if (!alert) return null;

  const config = alertConfig[alert.alert_type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${severityStyles[alert.severity]}`}
        >
          <div className={`${config.color} text-white rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[400px]`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
                <Icon className="h-6 w-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg">{config.label}</span>
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white text-xs"
                  >
                    {alert.severity}
                  </Badge>
                </div>
                
                <p className="text-sm text-white/90">
                  {config.message(alert)}
                </p>
                
                {alert.road_name && (
                  <p className="text-xs text-white/70 mt-1 truncate">
                    📍 {alert.road_name}
                  </p>
                )}
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="flex-shrink-0 h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onDismiss, 300);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {voiceEnabled && (
              <div className="flex items-center gap-1 mt-2 text-xs text-white/60">
                <Volume2 className="h-3 w-3" />
                <span>Voice alert enabled</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact alert badge for showing in dashboard
interface AlertBadgeProps {
  alertCounts: {
    total: number;
    high: number;
    medium: number;
    low: number;
    unacknowledged: number;
  };
  onClick?: () => void;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ alertCounts, onClick }) => {
  if (alertCounts.total === 0) return null;

  const hasUnread = alertCounts.unacknowledged > 0;
  
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        hasUnread 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
      onClick={onClick}
    >
      <AlertTriangle className="h-4 w-4" />
      <span>{alertCounts.total} alert{alertCounts.total !== 1 ? 's' : ''}</span>
      {alertCounts.high > 0 && (
        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {alertCounts.high}
        </span>
      )}
    </motion.button>
  );
};
