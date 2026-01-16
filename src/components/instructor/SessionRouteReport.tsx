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
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  };
  segments: RoadSegment[];
  route: RoutePoint[];
}

interface SessionRouteReportProps {
  telematicsId: string;
  onClose?: () => void;
}

const SessionRouteReport: React.FC<SessionRouteReportProps> = ({ telematicsId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RouteReport | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-route-report', {
        body: { telematicsId }
      });

      if (error) throw error;
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
Distance: ${Number(report.stats.distance).toFixed(1)} km
Duration: ${formatDuration(report.stats.duration)}

Speed Summary:
- Average: ${report.stats.avgSpeed?.toFixed(0) || 'N/A'} km/h
- Maximum: ${report.stats.maxSpeed?.toFixed(0) || 'N/A'} km/h
- Speeding incidents: ${report.stats.speedingIncidents}

Roads Visited (${report.stats.roadsVisited}):
${report.segments.map(s => `- ${s.name}: ${s.speedLimit ? s.speedLimit + ' km/h limit' : 'No limit data'}, max ${s.maxSpeed.toFixed(0)} km/h ${s.compliance === 'over' ? '⚠️' : '✓'}`).join('\n')}
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Route Report
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              {onClose && (
                <Button size="sm" variant="ghost" onClick={onClose}>
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
          <div className="h-48 rounded-t-lg overflow-hidden">
            <MapContainer
              center={center}
              zoom={13}
              className="h-full w-full"
              style={{ zIndex: 0 }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                    Limit: {segment.speedLimit} km/h<br />
                    Max: {segment.maxSpeed.toFixed(0)} km/h
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
          <p className="text-xl font-bold">{Number(report.stats.distance).toFixed(1)} km</p>
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
          <p className="text-xl font-bold">{report.stats.avgSpeed?.toFixed(0) || 'N/A'} km/h</p>
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
              Max: {report.stats.maxSpeed?.toFixed(0) || 'N/A'} km/h
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Road Segments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Road Segments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-64">
            <div className="divide-y">
              {report.segments.map((segment, index) => (
                <div key={index} className="p-3 flex items-center gap-3">
                  {getComplianceIcon(segment.compliance)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{segment.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Limit: {segment.speedLimit ? `${segment.speedLimit} km/h` : 'Unknown'}</span>
                      <span>•</span>
                      <span>Avg: {segment.avgSpeed.toFixed(0)} km/h</span>
                      <span>•</span>
                      <span>Max: {segment.maxSpeed.toFixed(0)} km/h</span>
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

      {/* Regenerate button */}
      <Button variant="outline" className="w-full" onClick={generateReport} disabled={loading}>
        <FileText className="h-4 w-4 mr-2" />
        {loading ? 'Generating...' : 'Regenerate Report'}
      </Button>
    </div>
  );
};

export default SessionRouteReport;
