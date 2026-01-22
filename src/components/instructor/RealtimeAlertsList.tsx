import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Gauge, 
  ArrowDown, 
  ArrowUp, 
  Phone, 
  Navigation,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { TelematicsAlert } from '@/hooks/useRealtimeAlerts';
import { formatDistanceToNow } from 'date-fns';

interface RealtimeAlertsListProps {
  alerts: TelematicsAlert[];
  onAcknowledge?: (alertId: string) => void;
  onAcknowledgeAll?: () => void;
  maxHeight?: string;
  showAcknowledgeAll?: boolean;
}

const alertConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  speeding: {
    icon: Gauge,
    label: 'Speeding',
    color: 'bg-red-500',
  },
  harsh_brake: {
    icon: ArrowDown,
    label: 'Hard Brake',
    color: 'bg-orange-500',
  },
  harsh_accel: {
    icon: ArrowUp,
    label: 'Harsh Accel',
    color: 'bg-amber-500',
  },
  phone_usage: {
    icon: Phone,
    label: 'Phone',
    color: 'bg-purple-500',
  },
  sharp_turn: {
    icon: Navigation,
    label: 'Sharp Turn',
    color: 'bg-blue-500',
  },
};

const severityColors = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-yellow-500',
};

const RealtimeAlertsList: React.FC<RealtimeAlertsListProps> = ({
  alerts,
  onAcknowledge,
  onAcknowledgeAll,
  maxHeight = '300px',
  showAcknowledgeAll = true,
}) => {
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No alerts yet</p>
        <p className="text-xs mt-1">Alerts will appear here in real-time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with acknowledge all */}
      {showAcknowledgeAll && unacknowledgedCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {unacknowledgedCount} unread alert{unacknowledgedCount !== 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7"
            onClick={onAcknowledgeAll}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        </div>
      )}

      {/* Alerts list */}
      <ScrollArea style={{ maxHeight }} className="pr-2">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {alerts.map((alert, index) => {
              const config = alertConfig[alert.alert_type] || alertConfig.speeding;
              const Icon = config.icon;
              const toMph = (kmh: number) => Math.round(kmh * 0.621371);
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className={`
                    relative flex items-start gap-3 p-3 rounded-lg border-l-4
                    ${severityColors[alert.severity]}
                    ${alert.acknowledged ? 'bg-muted/30 opacity-60' : 'bg-muted/50'}
                  `}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-1.5 rounded-lg ${config.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{config.label}</span>
                      <Badge 
                        variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {alert.severity}
                      </Badge>
                      {alert.acknowledged && (
                        <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Details based on alert type */}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {alert.alert_type === 'speeding' && alert.speed_kmh && alert.speed_limit_kmh && (
                        <span>
                          {toMph(alert.speed_kmh)} mph in {toMph(alert.speed_limit_kmh)} zone
                          <span className="text-destructive font-medium ml-1">
                            (+{toMph(alert.speed_delta || 0)} over)
                          </span>
                        </span>
                      )}
                      {(alert.alert_type === 'harsh_brake' || alert.alert_type === 'harsh_accel') && alert.speed_delta && (
                        <span>
                          {Math.abs(toMph(alert.speed_delta))} mph {alert.alert_type === 'harsh_brake' ? 'drop' : 'increase'}
                        </span>
                      )}
                      {alert.alert_type === 'sharp_turn' && (
                        <span>Sharp cornering detected</span>
                      )}
                    </div>
                    
                    {/* Road name and time */}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      {alert.road_name && (
                        <>
                          <Navigation className="h-2.5 w-2.5" />
                          <span className="truncate max-w-[120px]">{alert.road_name}</span>
                          <span>•</span>
                        </>
                      )}
                      <Clock className="h-2.5 w-2.5" />
                      <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  {/* Acknowledge button */}
                  {!alert.acknowledged && onAcknowledge && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="flex-shrink-0 h-6 w-6"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Summary footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {alerts.filter(a => a.severity === 'high').length} high
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {alerts.filter(a => a.severity === 'medium').length} medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            {alerts.filter(a => a.severity === 'low').length} low
          </span>
        </div>
        <span>{alerts.length} total</span>
      </div>
    </div>
  );
};

export default RealtimeAlertsList;
