import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Map, 
  AlertTriangle, 
  Gauge, 
  TrendingUp,
  Navigation,
  Filter,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getMapTileUrl, getMapAttribution } from '@/lib/mapConfig';

// Extend Leaflet types for heat layer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: { [key: number]: string };
    }
  ): L.Layer;
}

interface DrivingEvent {
  id: string;
  event_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed_at_event: number | null;
  recorded_at: string;
  notes: string | null;
}

interface EventCluster {
  lat: number;
  lng: number;
  count: number;
  eventTypes: string[];
  severity: string;
}

interface DrivingSkillsHeatmapProps {
  instructorId: string;
  pupilId?: string;
  height?: string;
}

const eventTypeLabels: Record<string, string> = {
  harsh_brake: 'Harsh Braking',
  harsh_acceleration: 'Harsh Acceleration',
  sharp_turn: 'Sharp Turns',
  speeding: 'Speeding',
  smooth_stop: 'Smooth Stops',
  good_acceleration: 'Good Acceleration'
};

const eventTypeColors: Record<string, string> = {
  harsh_brake: '#ef4444',
  harsh_acceleration: '#f97316',
  sharp_turn: '#eab308',
  speeding: '#dc2626',
  smooth_stop: '#22c55e',
  good_acceleration: '#16a34a'
};

const DrivingSkillsHeatmap: React.FC<DrivingSkillsHeatmapProps> = ({
  instructorId,
  pupilId,
  height = '400px'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [clusters, setClusters] = useState<EventCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'problems' | 'good'>('problems');
  const [showMarkers, setShowMarkers] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [instructorId, pupilId]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // First get telematics sessions
      let query = supabase
        .from('lesson_telematics')
        .select('id')
        .eq('instructor_id', instructorId);

      if (pupilId) {
        query = query.eq('pupil_id', pupilId);
      }

      const { data: sessions } = await query;

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        
        // Fetch all events with location data
        const { data: eventsData } = await supabase
          .from('driving_behavior_events')
          .select('*')
          .in('telematics_id', sessionIds)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        setEvents(eventsData || []);
        
        // Calculate clusters
        if (eventsData && eventsData.length > 0) {
          const clustered = clusterEvents(eventsData);
          setClusters(clustered);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cluster nearby events
  const clusterEvents = (events: DrivingEvent[]): EventCluster[] => {
    const clusterRadius = 0.001; // ~100m
    const clusters: EventCluster[] = [];
    const processed = new Set<string>();

    events.forEach(event => {
      if (processed.has(event.id) || !event.latitude || !event.longitude) return;

      const nearby = events.filter(e => {
        if (processed.has(e.id) || !e.latitude || !e.longitude) return false;
        const dist = Math.sqrt(
          Math.pow(e.latitude - event.latitude!, 2) + 
          Math.pow(e.longitude - event.longitude!, 2)
        );
        return dist < clusterRadius;
      });

      nearby.forEach(e => processed.add(e.id));

      const avgLat = nearby.reduce((sum, e) => sum + e.latitude!, 0) / nearby.length;
      const avgLng = nearby.reduce((sum, e) => sum + e.longitude!, 0) / nearby.length;
      const eventTypes = [...new Set(nearby.map(e => e.event_type))];
      const highSeverity = nearby.some(e => e.severity === 'high');
      const medSeverity = nearby.some(e => e.severity === 'medium');

      clusters.push({
        lat: avgLat,
        lng: avgLng,
        count: nearby.length,
        eventTypes,
        severity: highSeverity ? 'high' : medSeverity ? 'medium' : 'low'
      });
    });

    return clusters.sort((a, b) => b.count - a.count);
  };

  // Filter events based on selection
  const getFilteredEvents = () => {
    if (filter === 'all') return events;
    if (filter === 'problems') {
      return events.filter(e => 
        ['harsh_brake', 'harsh_acceleration', 'sharp_turn', 'speeding'].includes(e.event_type)
      );
    }
    return events.filter(e => 
      ['smooth_stop', 'good_acceleration'].includes(e.event_type)
    );
  };

  useEffect(() => {
    if (!mapContainer.current || events.length === 0) return;

    const filteredEvents = getFilteredEvents();
    if (filteredEvents.length === 0) return;

    // Calculate center
    const validEvents = filteredEvents.filter(e => e.latitude && e.longitude);
    if (validEvents.length === 0) return;

    const lats = validEvents.map(e => e.latitude!);
    const lngs = validEvents.map(e => e.longitude!);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Initialize map if not exists
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        scrollWheelZoom: false
      });

      L.tileLayer(getMapTileUrl(), {
        attribution: getMapAttribution()
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Remove existing heat layer
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    // Clear markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    // Create heat data with intensity based on severity
    const heatData: [number, number, number][] = validEvents.map(e => {
      const intensity = e.severity === 'high' ? 1 : e.severity === 'medium' ? 0.6 : 0.3;
      return [e.latitude!, e.longitude!, intensity];
    });

    // Add heat layer
    const gradient = filter === 'good' 
      ? { 0.4: 'lightgreen', 0.65: 'lime', 1: 'green' }
      : { 0.4: 'yellow', 0.65: 'orange', 1: 'red' };

    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1,
      minOpacity: 0.3,
      gradient
    }).addTo(mapRef.current);

    // Add markers if enabled
    if (showMarkers && markersLayerRef.current) {
      clusters.slice(0, 20).forEach(cluster => {
        const color = cluster.severity === 'high' ? '#ef4444' : 
                     cluster.severity === 'medium' ? '#f97316' : '#eab308';
        
        const icon = L.divIcon({
          html: `<div style="
            background: ${color};
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${cluster.count}</div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon });
        
        const popupContent = `
          <div style="min-width: 150px;">
            <strong>${cluster.count} Event${cluster.count > 1 ? 's' : ''}</strong><br/>
            <span style="font-size: 12px; color: #666;">
              ${cluster.eventTypes.map(t => eventTypeLabels[t] || t).join(', ')}
            </span>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersLayerRef.current?.addLayer(marker);
      });
    }

    // Fit bounds
    const bounds = L.latLngBounds(validEvents.map(e => [e.latitude!, e.longitude!]));
    mapRef.current.fitBounds(bounds, { padding: [30, 30] });

    return () => {
      // Cleanup handled by component unmount
    };
  }, [events, filter, showMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Calculate stats
  const problemEvents = events.filter(e => 
    ['harsh_brake', 'harsh_acceleration', 'sharp_turn', 'speeding'].includes(e.event_type)
  );
  const problemAreas = clusters.filter(c => 
    c.eventTypes.some(t => ['harsh_brake', 'harsh_acceleration', 'sharp_turn', 'speeding'].includes(t))
  );

  const eventBreakdown = {
    harsh_brake: events.filter(e => e.event_type === 'harsh_brake').length,
    harsh_acceleration: events.filter(e => e.event_type === 'harsh_acceleration').length,
    sharp_turn: events.filter(e => e.event_type === 'sharp_turn').length,
    speeding: events.filter(e => e.event_type === 'speeding').length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Map className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Location Data Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Driving event locations will appear here once GPS tracking is used during lessons.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Driving Skills Heatmap
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Shows areas where driving events occurred. Red/orange areas indicate problem spots needing more practice.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="h-8">
                <TabsTrigger value="problems" className="text-xs px-2 h-6">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Problems
                </TabsTrigger>
                <TabsTrigger value="good" className="text-xs px-2 h-6">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Good
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs px-2 h-6">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
              variant={showMarkers ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setShowMarkers(!showMarkers)}
              className="h-8"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Markers
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-600">{problemEvents.length}</p>
            <p className="text-xs text-muted-foreground">Problem Events</p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Map className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-orange-600">{problemAreas.length}</p>
            <p className="text-xs text-muted-foreground">Problem Areas</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gauge className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-amber-600">{eventBreakdown.speeding}</p>
            <p className="text-xs text-muted-foreground">Speeding</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-xl font-bold text-rose-600">{eventBreakdown.harsh_brake}</p>
            <p className="text-xs text-muted-foreground">Harsh Braking</p>
          </div>
        </div>

        {/* Map */}
        <div 
          ref={mapContainer} 
          style={{ height, width: '100%' }} 
          className="rounded-2xl border"
        />

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Intensity:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span className="text-xs">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-xs">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-xs">High</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {events.length} total events tracked
          </div>
        </div>

        {/* Top Problem Areas */}
        {problemAreas.length > 0 && filter !== 'good' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Top Problem Areas</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {problemAreas.slice(0, 4).map((area, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-2xl"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      area.severity === 'high' ? 'bg-red-500' : 
                      area.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>
                      {area.count}
                    </div>
                    <span className="text-sm">
                      {area.eventTypes.slice(0, 2).map(t => eventTypeLabels[t]).join(', ')}
                    </span>
                  </div>
                  <Badge 
                    variant={area.severity === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {area.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DrivingSkillsHeatmap;
