import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, LogIn, LogOut, Timer } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";

export function GPSClockInOut({ instructorId }: { instructorId: string }) {
  const queryClient = useQueryClient();
  const [gettingLocation, setGettingLocation] = useState(false);

  const { data: activeEntry } = useQuery({
    queryKey: ["active-clock", instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clock_entries")
        .select("*")
        .eq("instructor_id", instructorId)
        .is("clock_out_at", null)
        .order("clock_in_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 60000,
  });

  const { data: recentEntries = [] } = useQuery({
    queryKey: ["clock-history", instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clock_entries")
        .select("*")
        .eq("instructor_id", instructorId)
        .not("clock_out_at", "is", null)
        .order("clock_in_at", { ascending: false })
        .limit(7);
      return data || [];
    },
  });

  const getPosition = (): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("No GPS");
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const clockInMutation = useMutation({
    mutationFn: async () => {
      setGettingLocation(true);
      const pos = await getPosition();
      const { error } = await supabase.from("clock_entries").insert({
        instructor_id: instructorId,
        clock_in_latitude: pos.lat,
        clock_in_longitude: pos.lng,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-clock"] });
      queryClient.invalidateQueries({ queryKey: ["clock-history"] });
      setGettingLocation(false);
      toast.success("Clocked in!");
    },
    onError: () => {
      setGettingLocation(false);
      toast.error("Failed to clock in. Check GPS permissions.");
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!activeEntry) return;
      setGettingLocation(true);
      const pos = await getPosition();
      const minutes = differenceInMinutes(new Date(), new Date(activeEntry.clock_in_at));
      const hours = +(minutes / 60).toFixed(2);
      const { error } = await supabase
        .from("clock_entries")
        .update({
          clock_out_at: new Date().toISOString(),
          clock_out_latitude: pos.lat,
          clock_out_longitude: pos.lng,
          total_hours: hours,
        })
        .eq("id", activeEntry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-clock"] });
      queryClient.invalidateQueries({ queryKey: ["clock-history"] });
      setGettingLocation(false);
      toast.success("Clocked out!");
    },
    onError: () => {
      setGettingLocation(false);
      toast.error("Failed to clock out");
    },
  });

  const elapsed = activeEntry ? differenceInMinutes(new Date(), new Date(activeEntry.clock_in_at)) : 0;
  const hrs = Math.floor(elapsed / 60);
  const mins = elapsed % 60;

  const weekTotal = recentEntries.reduce((sum: number, e: any) => sum + (e.total_hours || 0), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        GPS Clock In/Out
      </h2>

      {/* Clock status card */}
      <Card className={activeEntry ? "border-green-500/50 bg-green-500/5" : ""}>
        <CardContent className="p-5 text-center space-y-3">
          {activeEntry ? (
            <>
              <div className="flex items-center justify-center gap-2 text-green-600">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold">On the Clock</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{hrs}h {mins}m</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3" />
                Clocked in at {format(new Date(activeEntry.clock_in_at), "HH:mm")}
              </p>
              <Button variant="destructive" className="w-full" onClick={() => clockOutMutation.mutate()} disabled={gettingLocation}>
                <LogOut className="h-4 w-4 mr-2" />
                {gettingLocation ? "Getting location..." : "Clock Out"}
              </Button>
            </>
          ) : (
            <>
              <Timer className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Not currently clocked in</p>
              <Button className="w-full" onClick={() => clockInMutation.mutate()} disabled={gettingLocation}>
                <LogIn className="h-4 w-4 mr-2" />
                {gettingLocation ? "Getting location..." : "Clock In"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Weekly summary */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-muted-foreground">This week</span>
        <Badge variant="secondary">{weekTotal.toFixed(1)} hours</Badge>
      </div>

      {/* Recent history */}
      <div className="space-y-2">
        {recentEntries.map((entry: any) => (
          <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-none bg-secondary/50">
            <div>
              <p className="text-sm font-medium">{format(new Date(entry.clock_in_at), "EEE dd MMM")}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.clock_in_at), "HH:mm")} – {format(new Date(entry.clock_out_at), "HH:mm")}
              </p>
            </div>
            <Badge variant="outline">{entry.total_hours?.toFixed(1)}h</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
