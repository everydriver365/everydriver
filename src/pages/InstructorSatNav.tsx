import { useState, useEffect } from "react";
import { Navigation, MapPin, Clock, User, ExternalLink, Loader2, Search, Map } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { toast } from "sonner";
import { SatNavMap } from "@/components/instructor/SatNavMap";
import { SavedRoutesList } from "@/components/instructor/SavedRoutesList";
import { FavouriteLocationsList } from "@/components/instructor/FavouriteLocationsList";
import { OnMyWayButton } from "@/components/instructor/OnMyWayButton";

interface UpcomingLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  pickup_postcode: string;
  pickup_location: string | null;
  pupils: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

interface DestinationCoords {
  latitude: number;
  longitude: number;
  displayName: string;
}

export default function InstructorSatNav() {
  const { instructor } = useInstructorAuth();
  const [lessons, setLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [destination, setDestination] = useState<DestinationCoords | null>(null);

  useEffect(() => {
    const fetchUpcomingLessons = async () => {
      if (!instructor?.id) return;

      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from("scheduled_lessons")
          .select(`
            id,
            lesson_date,
            start_time,
            pickup_postcode,
            pickup_location,
            pupils(name)
          `)
          .eq("instructor_id", instructor.id)
          .eq("status", "scheduled")
          .gte("lesson_date", today)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(10);

        if (error) throw error;
        setLessons(data || []);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingLessons();
  }, [instructor?.id]);

  const isPostcode = (query: string): boolean => {
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
    return postcodeRegex.test(query.trim());
  };

  const isWhat3Words = (query: string): boolean => {
    const w3wRegex = /^(\/\/\/)?[a-z]+\.[a-z]+\.[a-z]+$/i;
    return w3wRegex.test(query.trim());
  };

  const lookupDestination = async () => {
    const query = searchQuery.trim();
    if (!query) {
      toast.error("Please enter a postcode or What3Words address");
      return;
    }

    setSearching(true);
    setDestination(null);

    try {
      if (isPostcode(query)) {
        // Use postcodes.io for postcode lookup
        const response = await fetch(
          `https://api.postcodes.io/postcodes/${encodeURIComponent(query.replace(/\s/g, ''))}`
        );
        
        if (!response.ok) {
          toast.error("Invalid postcode");
          return;
        }

        const data = await response.json();
        if (!data.result) {
          toast.error("Postcode not found");
          return;
        }

        setDestination({
          latitude: data.result.latitude,
          longitude: data.result.longitude,
          displayName: data.result.postcode
        });
        toast.success("Location found!");

      } else if (isWhat3Words(query)) {
        // Use edge function for What3Words lookup
        const cleanWords = query.replace(/^\/+/, '').trim();
        
        const { data, error } = await supabase.functions.invoke('convert-from-what3words', {
          body: { words: cleanWords }
        });

        if (error) {
          console.error("W3W lookup error:", error);
          toast.error("Failed to look up What3Words address");
          return;
        }

        if (data.error) {
          toast.error(data.error);
          return;
        }

        setDestination({
          latitude: data.latitude,
          longitude: data.longitude,
          displayName: `///${data.words}`
        });
        toast.success("Location found!");

      } else {
        toast.error("Please enter a valid UK postcode or What3Words address (e.g. ///word.word.word)");
      }
    } catch (error) {
      console.error("Lookup error:", error);
      toast.error("Failed to look up location");
    } finally {
      setSearching(false);
    }
  };

  const openNavigation = (lat: number, lng: number, displayName: string) => {
    const tomtomAppUrl = `tomtomgo://x-callback-url/navigate?destination=${lat},${lng}`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const appStoreUrl = isIOS 
      ? "https://apps.apple.com/app/tomtom-go-navigation/id884963367"
      : "https://play.google.com/store/apps/details?id=com.tomtom.gplay.navapp";

    if (isIOS) {
      // On iOS, try the deep link and fall back to App Store after a short delay
      // If the app opens, the page will be backgrounded and the timeout won't fire
      const start = Date.now();
      window.location.href = tomtomAppUrl;
      
      setTimeout(() => {
        // If we're still here after 1.5s, the app didn't open - go to App Store
        if (document.visibilityState !== "hidden" && Date.now() - start < 2000) {
          window.location.href = appStoreUrl;
        }
      }, 1500);
      return;
    }

    // Android: try to open app, fall back to Play Store
    const opened = window.open(tomtomAppUrl, "_blank");
    if (!opened) {
      window.open(appStoreUrl, "_blank");
    }
  };

  const handleNavigateToRouteStart = (lat: number, lng: number, name: string) => {
    setDestination({ latitude: lat, longitude: lng, displayName: name });
    // Scroll to top to show the destination preview
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openNativeNavigation = (address: string, postcode: string) => {
    const destination = encodeURIComponent(address || postcode);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${destination}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    }
  };

  const formatLessonDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, dd MMM");
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!instructor) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Sat Nav
          </h1>
        </div>

        {/* Search Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter postcode or ///what3words"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupDestination()}
                  className="pl-9"
                />
              </div>
              <Button onClick={lookupDestination} disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Look Up"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Examples: SW1A 1AA or ///filled.count.soap
            </p>
          </CardContent>
        </Card>

        {/* Destination Preview */}
        {destination && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">{destination.displayName}</span>
              </div>
              
              {/* TomTom Map */}
              <SatNavMap 
                latitude={destination.latitude} 
                longitude={destination.longitude}
              />

              {/* Navigation Buttons */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    if (isIOS) {
                      window.open(`maps://maps.apple.com/?daddr=${destination.latitude},${destination.longitude}`, '_blank');
                    } else {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`, '_blank');
                    }
                  }}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Map className="h-5 w-5" />
                  Open in {/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Apple' : 'Google'} Maps
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => openNavigation(destination.latitude, destination.longitude, destination.displayName)}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Navigation className="h-5 w-5" />
                  Open in TomTom GO
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    if (isIOS) {
                      window.open('https://apps.apple.com/app/tomtom-go-navigation/id884963367', '_blank');
                    } else {
                      window.open('https://play.google.com/store/apps/details?id=com.tomtom.gplay.navapp', '_blank');
                    }
                  }}
                  className="w-full gap-2"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Get TomTom GO App
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Favourite Locations */}
        <FavouriteLocationsList 
          instructorId={instructor.id} 
          onNavigate={handleNavigateToRouteStart}
        />

        {/* Saved Routes Section */}
        <SavedRoutesList 
          instructorId={instructor.id} 
          onNavigate={handleNavigateToRouteStart}
        />

        {/* Upcoming Lessons Section */}
        <div className="pt-2">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Upcoming Lessons</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Navigation className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No upcoming lessons scheduled
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <Card key={lesson.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                            {formatLessonDate(lesson.lesson_date)}
                          </Badge>
                          <span className="text-sm font-medium flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatTime(lesson.start_time)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {lesson.pupils?.name || "Unknown Pupil"}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {lesson.pickup_location || lesson.pickup_postcode}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => openNativeNavigation(
                          lesson.pickup_location || '',
                          lesson.pickup_postcode
                        )}
                        className="shrink-0 gap-2"
                        size="sm"
                      >
                        <Navigation className="h-4 w-4" />
                        Go
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick tip */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Enter a UK postcode or What3Words address above to view on the map and navigate.
            </p>
          </CardContent>
        </Card>
      </div>
    </InstructorPortalLayout>
  );
}
