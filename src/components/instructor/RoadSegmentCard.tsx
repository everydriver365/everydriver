import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Gauge } from 'lucide-react';

interface RoadSegmentCardProps {
  name: string;
  speedLimitMph: number | null;
  avgSpeedMph: number;
  maxSpeedMph: number;
  compliance: 'under' | 'at' | 'over';
}

const RoadSegmentCard: React.FC<RoadSegmentCardProps> = ({
  name,
  speedLimitMph,
  avgSpeedMph,
  maxSpeedMph,
  compliance,
}) => {
  const getComplianceStyles = () => {
    switch (compliance) {
      case 'over':
        return {
          dotColor: 'bg-red-500',
          badgeVariant: 'destructive' as const,
          badgeText: 'Over',
          icon: <AlertTriangle className="h-3 w-3" />,
        };
      case 'at':
        return {
          dotColor: 'bg-amber-500',
          badgeVariant: 'secondary' as const,
          badgeText: 'At limit',
          icon: <Gauge className="h-3 w-3" />,
        };
      default:
        return {
          dotColor: 'bg-green-500',
          badgeVariant: 'default' as const,
          badgeText: 'Under',
          icon: <CheckCircle className="h-3 w-3" />,
        };
    }
  };

  const styles = getComplianceStyles();

  // Calculate bar widths as percentage of limit (or max if no limit)
  const barMax = speedLimitMph || Math.max(maxSpeedMph, 70); // Default to 70mph if no limit
  const avgBarWidth = Math.min((avgSpeedMph / barMax) * 100, 100);
  const maxBarWidth = Math.min((maxSpeedMph / barMax) * 100, 100);

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${styles.dotColor}`} />
          <span className="font-medium text-sm truncate">{name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {speedLimitMph ? (
            <span className="text-xs text-muted-foreground">{speedLimitMph} mph limit</span>
          ) : (
            <span className="text-xs text-muted-foreground">No limit data</span>
          )}
        </div>
      </div>
      
      {/* Speed bars */}
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-8">Avg</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary/70 rounded-full transition-all"
              style={{ width: `${avgBarWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium w-12 text-right">{avgSpeedMph} mph</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-8">Max</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                compliance === 'over' ? 'bg-red-500' : 
                compliance === 'at' ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${maxBarWidth}%` }}
            />
          </div>
          <span className="text-xs font-medium w-12 text-right">{maxSpeedMph} mph</span>
        </div>
      </div>
      
      {/* Compliance badge */}
      <div className="flex justify-end">
        <Badge 
          variant={styles.badgeVariant}
          className="text-[10px] h-5 gap-1"
        >
          {styles.icon}
          {styles.badgeText}
        </Badge>
      </div>
    </div>
  );
};

export default RoadSegmentCard;
