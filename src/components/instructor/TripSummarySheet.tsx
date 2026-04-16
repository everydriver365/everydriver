import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  X, 
  Clock, 
  Navigation, 
  Gauge,
  Route,
  Download,
  Share2,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapTileUrl, getMapAttribution } from '@/lib/mapConfig';
import SpeedTimeGraph from './SpeedTimeGraph';
import RoadSegmentCard from './RoadSegmentCard';
import { generateDrivingReportPDF } from './DrivingReportPDF';

interface RoadSegment {
  name: string;
  speedLimit: number | null;
  avgSpeed: number;
  maxSpeed: number;
  compliance: 'under' | 'at' | 'over';
  startPoint: { lat: number; lon: number };
  endPoint: { lat: number; lon: number };
}

interface RoutePoint {
  lat: number;
  lon: number;
  speed: number | null;
  recordedAt?: string;
  speedLimit?: number | null;
  roadName?: string | null;
}

interface RouteReport {
  session: {
    id: string;
    pupilName: string;
    startedAt: string;
    endedAt: string;
    startLocation: string;
    endLocation: string;
  };
  stats: {
    totalPoints: number;
    distance: number;
    avgSpeed: number | null;
    maxSpeed: number | null;
    duration: number | null;
    speedingIncidents: number;
    roadsVisited: number;
    eventCount: number;
    harshBrakingCount: number;
    harshAccelerationCount: number;
    sharpTurnCount: number;
  };
  segments: RoadSegment[];
  events: unknown[];
  route: RoutePoint[];
}

interface TripSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telematicsId: string;
}

const TripSummarySheet: React.FC<TripSummarySheetProps> = ({ 
  open, 
  onOpenChange, 
  telematicsId 
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RouteReport | null>(null);
  const [insufficientData, setInsufficientData] = useState<{ message: string; pointsRecorded: number } | null>(null);

  useEffect(() => {
    if (open && telematicsId) {
      generateReport();
    }
  }, [open, telematicsId]);

  const generateReport = async (retryCount = 0) => {
    setLoading(true);
    setInsufficientData(null);
    setReport(null);

    // Short delay to allow final GPS points to be written
    if (retryCount === 0) {
      await new Promise(r => setTimeout(r, 3000));
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-route-report', {
        body: { telematicsId }
      });

      if (error) throw error;
      
      if (data.error === 'insufficient_gps_data') {
        // Retry once after 5 seconds to allow poller to finish writing points
        if (retryCount < 1) {
          console.log('[TripSummary] Insufficient data, retrying in 5s...');
          await new Promise(r => setTimeout(r, 5000));
          return generateReport(retryCount + 1);
        }
        setInsufficientData({
          message: data.message,
          pointsRecorded: data.pointsRecorded
        });
        return;
      }
      
      if (data.error === 'database_error') {
        toast.error(data.message || 'Database temporarily unavailable. Please try again.');
        return;
      }
      
      if (!data.success) throw new Error(data.error || 'Failed to generate report');

      setReport(data);
    } catch (err) {
      console.error('Error generating route report:', err);
      toast.error('Failed to generate route report');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationMinutes = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleShare = async () => {
    if (!report) return;

    const shareText = `
Driving Lesson Route Report
===========================
Pupil: ${report.session.pupilName}
Date: ${new Date(report.session.startedAt).toLocaleDateString()}

Route: ${report.session.startLocation} → ${report.session.endLocation}
Distance: ${(Number(report.stats.distance) * 0.621371).toFixed(1)} mi
Duration: ${formatDurationMinutes(report.stats.duration)}

Speed Summary:
- Average: ${report.stats.avgSpeed ? Math.round(report.stats.avgSpeed * 0.621371) : 'N/A'} mph
- Maximum: ${report.stats.maxSpeed ? Math.round(report.stats.maxSpeed * 0.621371) : 'N/A'} mph
- Speeding incidents: ${report.stats.speedingIncidents}

Roads Visited: ${report.stats.roadsVisited}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Driving Lesson Route Report',
          text: shareText
        });
      } catch {
        await navigator.clipboard.writeText(shareText);
        toast.success('Report copied to clipboard');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Report copied to clipboard');
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    toast.loading('Generating PDF...');
    await generateDrivingReportPDF(report as any);
    toast.dismiss();
    toast.success('PDF downloaded');
  };

  // Calculate route bounds for map fitting
  const getRouteBounds = (route: RoutePoint[]): LatLngBounds | null => {
    if (route.length === 0) return null;
    
    const lats = route.map(p => p.lat);
    const lons = route.map(p => p.lon);
    
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)]
    );
  };

  const routeCoordinates: [number, number][] = report?.route.map(p => [p.lat, p.lon]) || [];
  const bounds = report ? getRouteBounds(report.route) : null;
  const center: [number, number] = routeCoordinates.length > 0 
    ? [routeCoordinates[Math.floor(routeCoordinates.length / 2)][0], routeCoordinates[Math.floor(routeCoordinates.length / 2)][1]]
    : [51.5074, -0.1278];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[100dvh] p-0 flex flex-col bg-background"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold">Trip Summary</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4 pb-4">
            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {/* Insufficient Data State */}
            {insufficientData && !loading && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Insufficient GPS Data</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {insufficientData.message}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{insufficientData.pointsRecorded} GPS points recorded</span>
                </div>
                <Button variant="outline" onClick={generateReport}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Report Content */}
            {report && !loading && (
              <>
                {/* Large Route Map */}
                <div className="rounded-2xl overflow-hidden border border-border">
                  <div className="h-56">
                    <MapContainer
                      center={center}
                      zoom={13}
                      bounds={bounds || undefined}
                      boundsOptions={{ padding: [30, 30] }}
                      className="h-full w-full"
                      style={{ zIndex: 0 }}
                      zoomControl={false}
                      attributionControl={false}
                    >
                      <TileLayer
                        attribution={getMapAttribution()}
                        url={getMapTileUrl()}
                      />
                      
                      {routeCoordinates.length >= 2 && (
                        <Polyline
                          positions={routeCoordinates}
                          pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.9 }}
                        />
                      )}
                      
                      {/* Start marker */}
                      {routeCoordinates.length > 0 && (
                        <CircleMarker
                          center={routeCoordinates[0]}
                          radius={10}
                          pathOptions={{ fillColor: 'hsl(142, 71%, 45%)', fillOpacity: 1, color: 'hsl(0, 0%, 100%)', weight: 3 }}
                        >
                          <Popup>Start</Popup>
                        </CircleMarker>
                      )}
                      
                      {/* End marker */}
                      {routeCoordinates.length > 1 && (
                        <CircleMarker
                          center={routeCoordinates[routeCoordinates.length - 1]}
                          radius={10}
                          pathOptions={{ fillColor: 'hsl(0, 84%, 60%)', fillOpacity: 1, color: 'hsl(0, 0%, 100%)', weight: 3 }}
                        >
                          <Popup>End</Popup>
                        </CircleMarker>
                      )}
                    </MapContainer>
                  </div>
                </div>

                {/* Duration & Distance - Large Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-2xl px-3 py-3 text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xl font-bold">
                      {report.stats.duration ? formatDuration(report.stats.duration * 60) : 'N/A'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Duration</p>
                  </div>
                  <div className="bg-muted/30 rounded-2xl px-3 py-3 text-center">
                    <Navigation className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xl font-bold">
                      {(Number(report.stats.distance) * 0.621371).toFixed(1)} mi
                    </p>
                    <p className="text-[10px] text-muted-foreground">Distance</p>
                  </div>
                </div>

                {/* Speed Over Time Graph */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" />
                      Speed Over Time
                    </h3>
                  </div>
                  <SpeedTimeGraph 
                    route={report.route.map(p => ({
                      lat: p.lat,
                      lon: p.lon,
                      speed: p.speed,
                      recordedAt: p.recordedAt || report.session.startedAt,
                      speedLimit: p.speedLimit,
                      roadName: p.roadName,
                    }))}
                    startedAt={report.session.startedAt}
                  />
                </div>

                {/* Roads Travelled */}
                <div className="bg-card border border-border rounded-2xl">
                  <div className="flex items-center justify-between p-4 pb-2">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Route className="h-4 w-4 text-primary" />
                      Roads Travelled
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {report.segments.length} roads
                    </Badge>
                  </div>
                  <div className="px-4 pb-2">
                    {report.segments.slice(0, 10).map((segment, index) => (
                      <RoadSegmentCard
                        key={index}
                        name={segment.name}
                        speedLimitMph={segment.speedLimit ? Math.round(segment.speedLimit * 0.621371) : null}
                        avgSpeedMph={Math.round(segment.avgSpeed * 0.621371)}
                        maxSpeedMph={Math.round(segment.maxSpeed * 0.621371)}
                        compliance={segment.compliance}
                      />
                    ))}
                    {report.segments.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{report.segments.length - 10} more roads
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/30 rounded-2xl p-3 text-center">
                    <p className="text-lg font-bold">
                      {report.stats.avgSpeed ? Math.round(report.stats.avgSpeed * 0.621371) : 'N/A'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avg mph</p>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-3 text-center">
                    <p className="text-lg font-bold">
                      {report.stats.maxSpeed ? Math.round(report.stats.maxSpeed * 0.621371) : 'N/A'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Max mph</p>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-3 text-center">
                    <p className={`text-lg font-bold ${report.stats.speedingIncidents > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {report.stats.speedingIncidents}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Speeding</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {report && !loading && (
          <div className="sticky bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background border-t border-border flex gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              className="flex-1 h-10 text-xs"
              onClick={handleDownloadPDF}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-10 text-xs"
              onClick={handleShare}
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Share
            </Button>
            <Button 
              className="flex-1 h-10 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TripSummarySheet;
