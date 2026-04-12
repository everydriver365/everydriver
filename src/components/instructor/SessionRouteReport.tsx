import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Gauge, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight,
  Share2,
  FileText,
  Route,
  ArrowRight,
  Download,
  ListFilter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapTileUrl, getMapAttribution } from '@/lib/mapConfig';
import { generateDrivingReportPDF } from './DrivingReportPDF';
import { EventReviewPanel } from './EventReviewPanel';

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
}

interface DrivingEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
  latitude: number | null;
  longitude: number | null;
  speedAtEvent: number | null;
  gForce: number | null;
  notes: string | null;
  recordedAt: string;
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
  events: DrivingEvent[];
  route: RoutePoint[];
}

interface SessionRouteReportProps {
  telematicsId: string;
  onClose?: () => void;
}

const SessionRouteReport: React.FC<SessionRouteReportProps> = ({ telematicsId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RouteReport | null>(null);
  const [insufficientData, setInsufficientData] = useState<{ message: string; pointsRecorded: number } | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setInsufficientData(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-route-report', {
        body: { telematicsId }
      });

      if (error) throw error;
      
      // Check for insufficient GPS data response
      if (data.error === 'insufficient_gps_data') {
        setInsufficientData({
          message: data.message,
          pointsRecorded: data.pointsRecorded
        });
        return;
      }
      
      // Check for database errors (503)
      if (data.error === 'database_error') {
        toast.error(data.message || 'Database temporarily unavailable. Please try again.');
        return;
      }
      
      if (!data.success) throw new Error(data.error || 'Failed to generate report');

      setReport(data);
      toast.success('Route report generated');
    } catch (err) {
      console.error('Error generating route report:', err);
      toast.error('Failed to generate route report');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'over': return 'text-red-500 bg-red-500/10';
      case 'at': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-[#0075c9] bg-[#0075c9]/10';
    }
  };

  const formatEventType = (type: string) => {
    const eventNames: Record<string, string> = {
      'harsh_brake': 'Harsh Braking',
      'harsh_acceleration': 'Harsh Acceleration',
      'sharp_turn': 'Sharp Turn',
      'speeding': 'Speeding',
      'smooth_stop': 'Smooth Stop',
      'good_acceleration': 'Good Acceleration',
      'hard_impact': 'Hard Impact',
      'phone_unstable': 'Phone Unstable',
      'smooth_cornering': 'Smooth Cornering'
    };
    return eventNames[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getEventIcon = (type: string, severity: string) => {
    const isPositive = ['smooth_stop', 'good_acceleration', 'smooth_cornering'].includes(type);
    if (isPositive) {
      return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
    }
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      default: return <Gauge className="h-4 w-4 text-[#0075c9] flex-shrink-0" />;
    }
  };

  const getComplianceIcon = (compliance: string) => {
    switch (compliance) {
      case 'over': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'at': return <Gauge className="h-4 w-4 text-amber-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const formatDuration = (minutes: number | null) => {
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
Duration: ${formatDuration(report.stats.duration)}

Speed Summary:
- Average: ${report.stats.avgSpeed ? Math.round(report.stats.avgSpeed * 0.621371) : 'N/A'} mph
- Maximum: ${report.stats.maxSpeed ? Math.round(report.stats.maxSpeed * 0.621371) : 'N/A'} mph
- Speeding incidents: ${report.stats.speedingIncidents}

Roads Visited (${report.stats.roadsVisited}):
${report.segments.map(s => `- ${s.name}: ${s.speedLimit ? Math.round(s.speedLimit * 0.621371) + ' mph limit' : 'No limit data'}, max ${Math.round(s.maxSpeed * 0.621371)} mph ${s.compliance === 'over' ? '⚠️' : '✓'}`).join('\n')}
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

  // Calculate compliance score
  const complianceScore = report ? 
    Math.round((report.segments.filter(s => s.compliance !== 'over').length / report.segments.length) * 100) : 0;

  // Show insufficient data message
  if (insufficientData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Route Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
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
            <div className="pt-2 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Tips for better tracking:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Ensure location permission is granted</li>
                <li>• Track for at least 1-2 minutes while moving</li>
                <li>• Stay in areas with good GPS signal</li>
              </ul>
            </div>
            <Button variant="outline" onClick={() => setInsufficientData(null)}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Route Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="text-center py-8">
              <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                Generate a detailed route report with road names, speed limits, and compliance analysis
              </p>
              <Button onClick={generateReport} disabled={loading}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Route Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const routeCoordinates: [number, number][] = report.route.map(p => [p.lat, p.lon]);
  const center: [number, number] = routeCoordinates.length > 0 
    ? [routeCoordinates[Math.floor(routeCoordinates.length / 2)][0], routeCoordinates[Math.floor(routeCoordinates.length / 2)][1]]
    : [51.5074, -0.1278];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Route Report
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="default" 
                className="flex-1 sm:flex-none min-w-[80px]"
                onClick={async () => {
                  toast.loading('Generating PDF with map...');
                  await generateDrivingReportPDF(report);
                  toast.dismiss();
                  toast.success('PDF downloaded');
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none min-w-[80px]" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              {onClose && (
                <Button size="sm" variant="ghost" className="flex-1 sm:flex-none min-w-[80px]" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{report.session.pupilName}</span>
            <span>•</span>
            <span>{new Date(report.session.startedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <MapPin className="h-4 w-4 text-green-500" />
            <span className="truncate">{report.session.startLocation}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <MapPin className="h-4 w-4 text-red-500" />
            <span className="truncate">{report.session.endLocation}</span>
          </div>
        </CardContent>
      </Card>

      {/* Route Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-48 rounded-2xl overflow-hidden">
            <MapContainer
              center={center}
              zoom={13}
              className="h-full w-full"
              style={{ zIndex: 0 }}
              zoomControl={false}
            >
              <TileLayer
                attribution={getMapAttribution()}
                url={getMapTileUrl()}
              />
              
              {routeCoordinates.length >= 2 && (
                <Polyline
                  positions={routeCoordinates}
                  pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
                />
              )}
              
              {/* Start marker */}
              {routeCoordinates.length > 0 && (
                <CircleMarker
                  center={routeCoordinates[0]}
                  radius={8}
                  pathOptions={{ fillColor: '#22c55e', fillOpacity: 1, color: '#ffffff', weight: 2 }}
                >
                  <Popup>Start: {report.session.startLocation}</Popup>
                </CircleMarker>
              )}
              
              {/* End marker */}
              {routeCoordinates.length > 1 && (
                <CircleMarker
                  center={routeCoordinates[routeCoordinates.length - 1]}
                  radius={8}
                  pathOptions={{ fillColor: '#ef4444', fillOpacity: 1, color: '#ffffff', weight: 2 }}
                >
                  <Popup>End: {report.session.endLocation}</Popup>
                </CircleMarker>
              )}

              {/* Speeding incident markers */}
              {report.segments.filter(s => s.compliance === 'over').map((segment, i) => (
                <CircleMarker
                  key={i}
                  center={[segment.startPoint.lat, segment.startPoint.lon]}
                  radius={6}
                  pathOptions={{ fillColor: '#f59e0b', fillOpacity: 1, color: '#ffffff', weight: 2 }}
                >
                  <Popup>
                    ⚠️ {segment.name}<br />
                    Limit: {segment.speedLimit ? Math.round(segment.speedLimit * 0.621371) : '?'} mph<br />
                    Max: {Math.round(segment.maxSpeed * 0.621371)} mph
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Navigation className="h-3 w-3" />
            Distance
          </div>
          <p className="text-xl font-bold">{(Number(report.stats.distance) * 0.621371).toFixed(1)} mi</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="h-3 w-3" />
            Duration
          </div>
          <p className="text-xl font-bold">{formatDuration(report.stats.duration)}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Gauge className="h-3 w-3" />
            Avg Speed
          </div>
          <p className="text-xl font-bold">{report.stats.avgSpeed ? Math.round(report.stats.avgSpeed * 0.621371) : 'N/A'} mph</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Route className="h-3 w-3" />
            Roads
          </div>
          <p className="text-xl font-bold">{report.stats.roadsVisited}</p>
        </Card>
      </div>

      {/* Speed Compliance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Speed Limit Compliance
            <Badge variant={complianceScore >= 80 ? 'default' : complianceScore >= 50 ? 'secondary' : 'destructive'}>
              {complianceScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={complianceScore} className="h-2 mb-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {report.stats.speedingIncidents === 0 
                ? '✓ No speeding incidents' 
                : `⚠️ ${report.stats.speedingIncidents} speeding ${report.stats.speedingIncidents === 1 ? 'incident' : 'incidents'}`}
            </span>
            <span className="text-muted-foreground">
              Max: {report.stats.maxSpeed ? Math.round(report.stats.maxSpeed * 0.621371) : 'N/A'} mph
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Road Segments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Road Segments
            <Badge variant="outline" className="font-normal">
              {report.segments.length} roads
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80 max-h-[50vh]">
            <div className="divide-y">
              {report.segments.map((segment, index) => (
                <div key={index} className="p-3 flex items-center gap-3">
                  {getComplianceIcon(segment.compliance)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{segment.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Limit: {segment.speedLimit ? `${Math.round(segment.speedLimit * 0.621371)} mph` : 'Unknown'}</span>
                      <span>•</span>
                      <span>Avg: {Math.round(segment.avgSpeed * 0.621371)} mph</span>
                      <span>•</span>
                      <span>Max: {Math.round(segment.maxSpeed * 0.621371)} mph</span>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getComplianceColor(segment.compliance)}`}
                  >
                    {segment.compliance === 'over' ? 'Over' : segment.compliance === 'at' ? 'At limit' : 'Under'}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Event Review Panel - Interactive event management */}
      <EventReviewPanel 
        telematicsId={telematicsId} 
        onEventDismissed={() => {
          // Refresh the report to reflect dismissed events
          generateReport();
        }}
      />

      {/* Regenerate button */}
      <Button variant="outline" className="w-full" onClick={generateReport} disabled={loading}>
        <FileText className="h-4 w-4 mr-2" />
        {loading ? 'Generating...' : 'Regenerate Report'}
      </Button>
    </div>
  );
};

export default SessionRouteReport;
