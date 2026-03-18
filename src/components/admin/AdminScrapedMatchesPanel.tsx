import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { MapPin, Calendar, Clock, Check, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScrapedMatch {
  id: string;
  instructor_id: string;
  centre: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
}

interface InstructorInfo {
  id: string;
  name: string;
}

export function AdminScrapedMatchesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["admin-scraped-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_slot_reservations" as any)
        .select("*")
        .in("status", ["scraped_match", "pending"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ScrapedMatch[];
    },
  });

  const instructorIds = [...new Set(matches.map(m => m.instructor_id))];

  const { data: instructors = [] } = useQuery({
    queryKey: ["admin-scraped-match-instructors", instructorIds.join(",")],
    queryFn: async () => {
      if (instructorIds.length === 0) return [];
      const { data } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds);
      return (data || []) as InstructorInfo[];
    },
    enabled: instructorIds.length > 0,
  });

  const instructorMap = new Map(instructors.map(i => [i.id, i.name]));

  useEffect(() => {
    const channel = supabase
      .channel("admin-scraped-matches")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_slot_reservations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-scraped-matches"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleConfirm = async (match: ScrapedMatch) => {
    try {
      const { error } = await supabase
        .from("test_slot_reservations" as any)
        .update({ status: "reserved" })
        .eq("id", match.id);
      if (error) throw error;
      toast({ title: "Confirmed", description: `Slot reserved for ${instructorMap.get(match.instructor_id) || "instructor"}` });
      queryClient.invalidateQueries({ queryKey: ["admin-scraped-matches"] });
    } catch {
      toast({ title: "Error", description: "Failed to confirm", variant: "destructive" });
    }
  };

  const handleDismiss = async (match: ScrapedMatch) => {
    try {
      const { error } = await supabase
        .from("test_slot_reservations" as any)
        .delete()
        .eq("id", match.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-scraped-matches"] });
    } catch {
      toast({ title: "Error", description: "Failed to dismiss", variant: "destructive" });
    }
  };

  // Group by instructor
  const grouped: Record<string, ScrapedMatch[]> = {};
  matches.forEach((m) => {
    const name = instructorMap.get(m.instructor_id) || "Unknown";
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(m);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No scraped matches or pending reservations
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([name, slots]) => (
        <div key={name} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{name}</span>
            <Badge variant="secondary" className="text-xs">{slots.length}</Badge>
          </div>
          {slots.map((slot) => (
            <Card key={slot.id}>
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    {slot.centre}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {slot.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {slot.time}
                    </span>
                    <Badge variant={slot.status === "pending" ? "default" : "outline"} className="text-xs">
                      {slot.status === "scraped_match" ? "Auto-matched" : slot.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleDismiss(slot)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => handleConfirm(slot)} className="h-8 gap-1">
                    <Check className="h-4 w-4" />
                    Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
