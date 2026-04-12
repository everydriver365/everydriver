import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gauge, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface SpeedComplianceReportProps {
  telematicsId: string;
  compact?: boolean;
}

interface RoadSegmentCompliance {
  roadName: string;
  speedLimit: number;
  avgSpeed: number;
  maxSpeed: number;
  timeInSegment: number; // seconds
  compliantTime: number; // seconds
  compliancePercentage: number;
  pointCount: number;
}

interface OverallCompliance {
  totalTime: number;
  compliantTime: number;
  overallPercentage: number;
  segmentCount: number;
  worstSegment: RoadSegmentCompliance | null;
  bestSegment: RoadSegmentCompliance | null;
}

interface GPSPoint {
  speed_kmh: number | null;
  speed_limit_kmh: number | null;
  road_name: string | null;
  recorded_at: string;
}

const SpeedComplianceReport: React.FC<SpeedComplianceReportProps> = ({
  telematicsId,
  compact = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<RoadSegmentCompliance[]>([]);
  const [overall, setOverall] = useState<OverallCompliance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplianceData();
  }, [telematicsId]);

  const fetchComplianceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: points, error: fetchError } = await supabase
        .from('telematics_gps_points')
        .select('speed_kmh, speed_limit_kmh, road_name, recorded_at')
        .eq('telematics_id', telematicsId)
        .order('recorded_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (!points || points.length < 2) {
        setError('Insufficient data for compliance report');
        setLoading(false);
        return;
      }

      // Group points by road segment
      const segmentMap = new Map<string, GPSPoint[]>();
      
      for (const point of points) {
        if (!point.road_name || point.speed_limit_kmh === null) continue;
        
        const key = `${point.road_name}|${point.speed_limit_kmh}`;
        if (!segmentMap.has(key)) {
          segmentMap.set(key, []);
        }
        segmentMap.get(key)!.push(point);
      }

      // Calculate compliance for each segment
      const segmentResults: RoadSegmentCompliance[] = [];
      let totalTime = 0;
      let totalCompliantTime = 0;

      for (const [key, segmentPoints] of segmentMap.entries()) {
        if (segmentPoints.length < 2) continue;

        const [roadName, limitStr] = key.split('|');
        const speedLimit = parseFloat(limitStr);
        
        let segmentTime = 0;
        let compliantTime = 0;
        let totalSpeed = 0;
        let maxSpeed = 0;
        let validSpeedCount = 0;

        for (let i = 1; i < segmentPoints.length; i++) {
          const prev = segmentPoints[i - 1];
          const curr = segmentPoints[i];
          
          const timeDiff = (new Date(curr.recorded_at).getTime() - new Date(prev.recorded_at).getTime()) / 1000;
          
          // Skip if time gap is too large (> 30 seconds, likely GPS gap)
          if (timeDiff > 30 || timeDiff <= 0) continue;
          
          segmentTime += timeDiff;
          
          const speed = curr.speed_kmh ?? 0;
          
          if (curr.speed_kmh !== null) {
            totalSpeed += speed;
            validSpeedCount++;
            maxSpeed = Math.max(maxSpeed, speed);
          }
          
          // Compliant if within 5 km/h of limit
          if (speed <= speedLimit + 5) {
            compliantTime += timeDiff;
          }
        }

        if (segmentTime > 0 && validSpeedCount > 0) {
          const result: RoadSegmentCompliance = {
            roadName,
            speedLimit,
            avgSpeed: totalSpeed / validSpeedCount,
            maxSpeed,
            timeInSegment: segmentTime,
            compliantTime,
            compliancePercentage: (compliantTime / segmentTime) * 100,
            pointCount: segmentPoints.length,
          };
          
          segmentResults.push(result);
          totalTime += segmentTime;
          totalCompliantTime += compliantTime;
        }
      }

      // Sort by time in segment (most time first)
      segmentResults.sort((a, b) => b.timeInSegment - a.timeInSegment);

      // Calculate overall stats
      const sortedByCompliance = [...segmentResults].sort((a, b) => a.compliancePercentage - b.compliancePercentage);
      
      const overallStats: OverallCompliance = {
        totalTime,
        compliantTime: totalCompliantTime,
        overallPercentage: totalTime > 0 ? (totalCompliantTime / totalTime) * 100 : 100,
        segmentCount: segmentResults.length,
        worstSegment: sortedByCompliance.length > 0 ? sortedByCompliance[0] : null,
        bestSegment: sortedByCompliance.length > 0 ? sortedByCompliance[sortedByCompliance.length - 1] : null,
      };

      setSegments(segmentResults);
      setOverall(overallStats);
    } catch (err) {
      console.error('[SpeedComplianceReport] Error:', err);
      setError('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getComplianceColor = (percentage: number): string => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 80) return 'text-amber-600';
    return 'text-destructive';
  };

  const getComplianceBadgeVariant = (percentage: number): 'default' | 'secondary' | 'destructive' => {
    if (percentage >= 95) return 'default';
    if (percentage >= 80) return 'secondary';
    return 'destructive';
  };

  const toMph = (kmh: number): number => Math.round(kmh * 0.621371);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Analyzing speed compliance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !overall) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error || 'No compliance data available'}</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
        <div className="flex-shrink-0">
          {overall.overallPercentage >= 95 ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : overall.overallPercentage >= 80 ? (
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-destructive" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${getComplianceColor(overall.overallPercentage)}`}>
              {Math.round(overall.overallPercentage)}%
            </span>
            <span className="text-sm text-muted-foreground">Speed Limit Compliance</span>
          </div>
          <Progress value={overall.overallPercentage} className="h-1.5 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-5 w-5 text-primary" />
          Speed Limit Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-4 bg-muted/30 rounded-2xl"
        >
          <div className={`text-4xl font-bold ${getComplianceColor(overall.overallPercentage)}`}>
            {Math.round(overall.overallPercentage)}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">Overall Compliance</p>
          <Progress value={overall.overallPercentage} className="h-2 mt-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{formatTime(overall.compliantTime)} within limits</span>
            <span>{formatTime(overall.totalTime)} total</span>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded-2xl">
            <MapPin className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{overall.segmentCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Roads</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-2xl">
            <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{formatTime(overall.totalTime)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-2xl">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{formatTime(overall.compliantTime)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Compliant</p>
          </div>
        </div>

        {/* Best/Worst Segments */}
        {overall.worstSegment && overall.worstSegment.compliancePercentage < 100 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Areas for Improvement
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-2xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{overall.worstSegment.roadName}</p>
                  <p className="text-xs text-muted-foreground">
                    {toMph(overall.worstSegment.speedLimit)} mph limit • 
                    Avg: {toMph(overall.worstSegment.avgSpeed)} mph • 
                    Max: {toMph(overall.worstSegment.maxSpeed)} mph
                  </p>
                </div>
                <Badge variant="destructive" className="flex-shrink-0">
                  {Math.round(overall.worstSegment.compliancePercentage)}%
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Road Segments List */}
        {segments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              By Road ({segments.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {segments.slice(0, 10).map((segment, index) => (
                <motion.div
                  key={`${segment.roadName}-${segment.speedLimit}-${index}`}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 bg-muted/30 rounded-2xl"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-destructive bg-white flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-900">{toMph(segment.speedLimit)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{segment.roadName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTime(segment.timeInSegment)}</span>
                      <span>•</span>
                      <span>Avg {toMph(segment.avgSpeed)} mph</span>
                    </div>
                  </div>
                  <Badge variant={getComplianceBadgeVariant(segment.compliancePercentage)}>
                    {Math.round(segment.compliancePercentage)}%
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpeedComplianceReport;
