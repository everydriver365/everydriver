import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { MapPin, Calendar, Clock, X, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MatchedSlotsListProps {
  instructorId?: string;
}

interface MatchedSlot {
  id: string;
  centre: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
}

export function MatchedSlotsList({ instructorId }: MatchedSlotsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["matched-slots", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      const { data, error } = await supabase
        .from("test_slot_reservations" as any)
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("status", "scraped_match")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MatchedSlot[];
    },
    enabled: !!instructorId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!instructorId) return;
    const channel = supabase
      .channel(`matched-slots-${instructorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_slot_reservations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["matched-slots", instructorId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [instructorId, queryClient]);

  const handleReserve = async (slot: MatchedSlot) => {
    try {
      const { error } = await supabase
        .from("test_slot_reservations" as any)
        .update({ status: "pending" })
        .eq("id", slot.id);
      if (error) throw error;
      toast({ title: "Reserved", description: "Admin has been notified" });
      queryClient.invalidateQueries({ queryKey: ["matched-slots", instructorId] });
    } catch {
      toast({ title: "Error", description: "Failed to reserve slot", variant: "destructive" });
    }
  };

  const handleDismiss = async (slot: MatchedSlot) => {
    try {
      const { error } = await supabase
        .from("test_slot_reservations" as any)
        .delete()
        .eq("id", slot.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["matched-slots", instructorId] });
    } catch {
      toast({ title: "Error", description: "Failed to dismiss", variant: "destructive" });
    }
  };

  if (isLoading || slots.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {slots.length} slot{slots.length !== 1 ? "s" : ""} matched your requests!
        </p>
      </div>
      {slots.map((slot) => (
        <Card key={slot.id} className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-3 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium flex items-center gap-1 truncate">
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
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={() => handleDismiss(slot)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => handleReserve(slot)} className="h-8 gap-1">
                <Check className="h-4 w-4" />
                Reserve
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
