import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Car, MapPin, Gauge, Clock, RefreshCw, Users, 
  AlertTriangle, Circle, Navigation, Eye, EyeOff 
} from 'lucide-react';
import { useLivePupilPositions, LivePupilPosition } from '@/hooks/useLivePupilPositions';
import { getMapTileUrl, getMapAttribution } from '@/lib/mapConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface LivePupilsDashboardProps {
  instructorId: string;
  compact?: boolean;
}

const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);

const getTripStatusColor = (status: string) => {
  switch (status) {
    case 'driving': return 'bg-green-500';
    case 'stopped': return 'bg-yellow-500';
    case 'paused': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

const getTripStatusLabel = (status: string) => {
  switch (status) {
    case 'driving': return 'Driving';
    case 'stopped': return 'Stopped';
    case 'paused': return 'Paused';
    default: return 'Idle';
  }
};

export default function LivePupilsDashboard({ instructorId, compact = false }: LivePupilsDashboardProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  
  const [selectedPupil, setSelectedPupil] = useState<string | null>(null);
  const [showList, setShowList] = useState(!compact);
  
  const { positions, isLoading, error, lastUpdate, refetch, stats } = useLivePupilPositions(instructorId, {
    refreshIntervalMs: 2000, // 2 second refresh for near-realtime tracking
    staleThresholdMs: 60000, // 60 seconds stale threshold
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [53.5, -1.5], // UK center
      zoom: 7,
      scrollWheelZoom: true,
    });

    L.tileLayer(getMapTileUrl(), {
      attribution: getMapAttribution(),
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when positions change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;
    const currentPupilIds = new Set(positions.map(p => p.pupil_id));

    // Remove markers for pupils no longer active
    currentMarkers.forEach((marker, pupilId) => {
      if (!currentPupilIds.has(pupilId)) {
        map.removeLayer(marker);
        currentMarkers.delete(pupilId);
      }
    });

    // Add or update markers
    positions.forEach((position) => {
      const isSelected = selectedPupil === position.pupil_id;
      const speedMph = kmhToMph(position.speed_kmh);
      const isOverSpeed = speedMph > 30; // Simple threshold
      
      const markerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 ${position.trip_status === 'driving' ? 'animate-ping' : ''} ${getTripStatusColor(position.trip_status)} opacity-20 rounded-full"></div>
          <div class="relative w-10 h-10 ${getTripStatusColor(position.trip_status)} rounded-full border-3 ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-white'} shadow-lg flex items-center justify-center text-white font-bold text-xs">
            ${speedMph}
          </div>
          ${isOverSpeed ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><span class="text-white text-xs">!</span></div>' : ''}
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'live-pupil-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const existingMarker = currentMarkers.get(position.pupil_id);
      
      if (existingMarker) {
        // Update existing marker
        existingMarker.setLatLng([position.latitude, position.longitude]);
        existingMarker.setIcon(icon);
      } else {
        // Create new marker
        const marker = L.marker([position.latitude, position.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <strong>${position.pupilName}</strong><br/>
              <span>Speed: ${speedMph} mph</span><br/>
              <span>Status: ${getTripStatusLabel(position.trip_status)}</span><br/>
              <small>Updated: ${formatDistanceToNow(new Date(position.updated_at), { addSuffix: true })}</small>
            </div>
          `);
        
        marker.on('click', () => setSelectedPupil(position.pupil_id));
        currentMarkers.set(position.pupil_id, marker);
      }
    });

    // Fit bounds if we have positions
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [positions, selectedPupil]);

  // Focus on selected pupil
  useEffect(() => {
    if (!mapRef.current || !selectedPupil) return;
    
    const position = positions.find(p => p.pupil_id === selectedPupil);
    if (position) {
      mapRef.current.setView([position.latitude, position.longitude], 15, { animate: true });
    }
  }, [selectedPupil, positions]);

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Live Pupils
            </CardTitle>
            <Badge variant={stats.activeDrivingCount > 0 ? 'default' : 'secondary'}>
              {stats.activeDrivingCount} driving
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={mapContainer} className="h-48 w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-2xl">
              <Car className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeDrivingCount}</p>
              <p className="text-xs text-muted-foreground">Driving Now</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-2xl">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalActiveCount}</p>
              <p className="text-xs text-muted-foreground">Active Pupils</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
              <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kmhToMph(stats.averageSpeed)}</p>
              <p className="text-xs text-muted-foreground">Avg Speed (mph)</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {lastUpdate ? formatDistanceToNow(lastUpdate, { addSuffix: true }) : 'Never'}
              </p>
              <p className="text-xs text-muted-foreground">Last Update</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Map */}
        <Card className="flex-1 relative overflow-hidden">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Map Controls */}
          <div className="absolute top-3 right-3 z-[1000] flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowList(!showList)}
              className="shadow-lg"
            >
              {showList ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={refetch}
              disabled={isLoading}
              className="shadow-lg"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Empty State */}
          {!isLoading && positions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[500]">
              <div className="text-center p-6">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium">No Active Pupils</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Pupils will appear here when they start tracking
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute bottom-3 left-3 right-3 z-[1000]">
              <div className="bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-2xl text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}
        </Card>

        {/* Pupil List */}
        <AnimatePresence>
          {showList && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0"
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active Pupils</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100%-3rem)]">
                    <div className="p-3 space-y-2">
                      {positions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No active pupils
                        </p>
                      ) : (
                        positions.map((position) => (
                          <PupilListItem
                            key={position.pupil_id}
                            position={position}
                            isSelected={selectedPupil === position.pupil_id}
                            onClick={() => setSelectedPupil(
                              selectedPupil === position.pupil_id ? null : position.pupil_id
                            )}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Pupil list item component
function PupilListItem({ 
  position, 
  isSelected, 
  onClick 
}: { 
  position: LivePupilPosition; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const speedMph = kmhToMph(position.speed_kmh);
  
  return (
    <motion.button
      onClick={onClick}
      className={`w-full p-3 rounded-2xl border text-left transition-colors ${
        isSelected 
          ? 'bg-primary/10 border-primary' 
          : 'bg-card hover:bg-muted border-border'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="relative">
          <div className={`w-10 h-10 rounded-full ${getTripStatusColor(position.trip_status)} flex items-center justify-center text-white font-bold text-sm`}>
            {speedMph}
          </div>
          {position.trip_status === 'driving' && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{position.pupilName}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Circle className={`h-2 w-2 ${getTripStatusColor(position.trip_status)}`} />
              {getTripStatusLabel(position.trip_status)}
            </span>
            <span>•</span>
            <span>{speedMph} mph</span>
          </div>
        </div>

        {/* Navigation icon */}
        {position.heading !== null && (
          <Navigation 
            className="h-4 w-4 text-muted-foreground" 
            style={{ transform: `rotate(${position.heading}deg)` }}
          />
        )}
      </div>
    </motion.button>
  );
}
