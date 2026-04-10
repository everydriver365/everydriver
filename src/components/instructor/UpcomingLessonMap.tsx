import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { format, isToday, isTomorrow } from "date-fns";
import "leaflet/dist/leaflet.css";

interface UpcomingLessonMapProps {
  instructorId: string;
}

interface UpcomingLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  pickup_postcode: string | null;
  pickup_location: string | null;
  pupils: {
    name: string;
  } | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatLessonDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE d MMM");
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours, 10);
  const period = h >= 12 ? "pm" : "am";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes}${period}`;
}

function createCustomIcon(initials: string): L.DivIcon {
  return L.divIcon({
    className: "custom-lesson-marker",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        background: hsl(var(--primary));
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        color: white;
        font-weight: 700;
        font-size: 14px;
      ">
        ${initials}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

export function UpcomingLessonMap({ instructorId }: UpcomingLessonMapProps) {
  const [lesson, setLesson] = useState<UpcomingLesson | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNextLesson = async () => {
      if (!instructorId) {
        setLoading(false);
        return;
      }

      try {
        const today = format(new Date(), "yyyy-MM-dd");
        
        const { data, error: fetchError } = await supabase
          .from("scheduled_lessons")
          .select(`
            id,
            lesson_date,
            start_time,
            pickup_postcode,
            pickup_location,
            pupils(name)
          `)
          .eq("instructor_id", instructorId)
          .eq("status", "scheduled")
          .gte("lesson_date", today)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data || !data.pickup_postcode) {
          setLoading(false);
          return;
        }

        setLesson(data);

        // Geocode the postcode
        const { data: geoData, error: geoError } = await supabase.functions.invoke("geocode-postcode", {
          body: { postcodes: [data.pickup_postcode] },
        });

        if (geoError) throw geoError;

        const result = geoData?.results?.[0];
        if (result?.latitude && result?.longitude) {
          setCoords({ lat: result.latitude, lng: result.longitude });
          setAreaName(result.area_name);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching upcoming lesson:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNextLesson();
  }, [instructorId]);

  const handleNavigate = () => {
    if (!coords) return;
    
    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Open Apple Maps
      window.open(`maps://maps.apple.com/?daddr=${coords.lat},${coords.lng}&dirflg=d`, "_blank");
    } else {
      // Open Google Maps
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&travelmode=driving`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-none h-44">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't show if no lesson or geocoding failed
  if (!lesson || !coords || error) {
    return null;
  }

  const pupilName = lesson.pupils?.name || "Unknown";
  const initials = getInitials(pupilName);
  const lessonDateLabel = formatLessonDate(lesson.lesson_date);
  const lessonTimeLabel = formatTime(lesson.start_time);

  return (
    <div className="relative rounded-none overflow-hidden border shadow-sm">
      {/* Map */}
      <div className="relative z-0" style={{ height: "180px" }}>
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={14}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          doubleClickZoom={false}
          touchZoom={false}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution={getMapAttribution()}
            url={getMapTileUrl()}
          />
          <Marker 
            position={[coords.lat, coords.lng]} 
            icon={createCustomIcon(initials)}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{pupilName}</p>
                <p className="text-sm text-muted-foreground">
                  {lessonTimeLabel} - {lessonDateLabel}
                </p>
                {areaName && (
                  <p className="text-xs text-muted-foreground mt-1">{areaName}</p>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Overlay with lesson info */}
      <div className="absolute top-3 left-3 z-10 bg-card/95 backdrop-blur-sm rounded-none px-3 py-2 shadow-lg border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm">{lessonTimeLabel}</p>
            <p className="text-xs text-muted-foreground">{lessonDateLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigate button */}
      <div className="absolute bottom-3 right-3 z-10">
        <Button 
          onClick={handleNavigate} 
          size="sm" 
          className="gap-2 shadow-lg"
        >
          <Navigation className="h-4 w-4" />
          Navigate
        </Button>
      </div>
    </div>
  );
}
