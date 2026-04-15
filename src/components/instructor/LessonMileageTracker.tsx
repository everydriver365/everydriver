import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Car, MapPin, Navigation, Save, Loader2, Route, Satellite } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface LessonMileageTrackerProps {
  instructorId: string;
}

interface RecentLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  pickup_postcode: string | null;
  dropoff_postcode: string | null;
  lesson_miles: number | null;
  pupil_name: string;
  duration_minutes: number;
  trip_id: string | null;
  trip_auto_linked_at: string | null;
}

export function LessonMileageTracker({ instructorId }: LessonMileageTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<RecentLesson[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mileageValue, setMileageValue] = useState("");
  const [dropoffPostcode, setDropoffPostcode] = useState("");
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [totalMiles, setTotalMiles] = useState(0);
  const [instructorHomePostcode, setInstructorHomePostcode] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentLessons();
    fetchInstructorHomePostcode();
  }, [instructorId]);

  const fetchInstructorHomePostcode = async () => {
    try {
      const { data } = await supabase
        .from("instructors")
        .select("home_postcode")
        .eq("id", instructorId)
        .single();
      
      if (data?.home_postcode) {
        setInstructorHomePostcode(data.home_postcode);
      }
    } catch (error) {
      console.error("Error fetching instructor postcode:", error);
    }
  };

  const fetchRecentLessons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          lesson_date,
          start_time,
          pickup_postcode,
          dropoff_postcode,
          lesson_miles,
          duration_minutes,
          trip_id:geotab_trip_id,
          trip_auto_linked_at,
          pupils!inner(name)
        `)
        .eq("instructor_id", instructorId)
        .eq("status", "completed")
        .order("lesson_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedLessons: RecentLesson[] = (data || []).map((l: any) => ({
        id: l.id,
        lesson_date: l.lesson_date,
        start_time: l.start_time,
        pickup_postcode: l.pickup_postcode,
        dropoff_postcode: l.dropoff_postcode,
        lesson_miles: l.lesson_miles,
        pupil_name: l.pupils?.name || "Unknown",
        duration_minutes: l.duration_minutes,
        trip_id: l.trip_id || null,
        trip_auto_linked_at: l.trip_auto_linked_at || null,
      }));

      setLessons(formattedLessons);
      
      // Calculate total tracked miles
      const total = formattedLessons.reduce((sum, l) => sum + (l.lesson_miles || 0), 0);
      setTotalMiles(total);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lesson: RecentLesson) => {
    setEditingId(lesson.id);
    setMileageValue(lesson.lesson_miles?.toString() || "");
    setDropoffPostcode(lesson.dropoff_postcode || "");
  };

  const handleSave = async (lessonId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({
          lesson_miles: parseFloat(mileageValue) || null,
          dropoff_postcode: dropoffPostcode || null,
        })
        .eq("id", lessonId);

      if (error) throw error;

      toast.success("Mileage saved");
      setEditingId(null);
      fetchRecentLessons();
    } catch (error) {
      console.error("Error saving mileage:", error);
      toast.error("Failed to save mileage");
    } finally {
      setSaving(false);
    }
  };

  const estimateMileage = async (lesson: RecentLesson) => {
    if (!lesson.pickup_postcode) {
      toast.error("No pickup postcode available");
      return;
    }

    setCalculating(true);
    try {
      // Call the edge function to calculate distance via TomTom API
      const { data, error } = await supabase.functions.invoke("calculate-route-distance", {
        body: {
          from_postcode: lesson.pickup_postcode,
          instructor_home_postcode: instructorHomePostcode,
        },
      });

      if (error) throw error;

      if (data?.success) {
        const miles = data.estimated_lesson_miles || data.distance_miles || 15;
        setMileageValue(miles.toFixed(1));
        
        if (data.estimated) {
          toast.info(`Estimated ${miles.toFixed(1)} miles (no destination set)`);
        } else {
          toast.success(`Calculated ${miles.toFixed(1)} miles via maps`);
        }
      } else {
        // Fallback to duration-based estimate
        const estimatedMiles = (lesson.duration_minutes / 60) * 12;
        setMileageValue(estimatedMiles.toFixed(1));
        toast.info(`Estimated ${estimatedMiles.toFixed(1)} miles based on duration`);
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      // Fallback to simple estimation
      const estimatedMiles = (lesson.duration_minutes / 60) * 12;
      setMileageValue(estimatedMiles.toFixed(1));
      toast.info(`Estimated ${estimatedMiles.toFixed(1)} miles based on ${lesson.duration_minutes} min lesson`);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Lesson Mileage
            </CardTitle>
            <CardDescription>Track miles for each completed lesson</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{totalMiles.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Total miles</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No completed lessons to track
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-3 rounded-2xl border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{lesson.pupil_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(lesson.lesson_date), "d MMM")} at {lesson.start_time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{lesson.pickup_postcode || "No postcode"}</span>
                      <span>•</span>
                      <span>{lesson.duration_minutes} mins</span>
                      {lesson.trip_id && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 rounded-full px-1.5 py-0.5">
                          <Satellite className="h-2.5 w-2.5" />
                          GPS linked
                        </span>
                      )}
                    </div>
                  </div>

                  {editingId === lesson.id ? (
                    <div className="flex items-center gap-2">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={mileageValue}
                          onChange={(e) => setMileageValue(e.target.value)}
                          placeholder="Miles"
                          className="w-20 h-8"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => estimateMileage(lesson)}
                        disabled={calculating}
                        title="Auto-calculate miles via maps"
                      >
                        {calculating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(lesson.id)}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(lesson)}
                      className="gap-1.5"
                    >
                      <Car className="h-4 w-4" />
                      {lesson.lesson_miles ? `${lesson.lesson_miles} mi` : "Add"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
