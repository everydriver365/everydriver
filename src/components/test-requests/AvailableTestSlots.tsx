import { useState, useEffect } from "react";
import { RefreshCw, MapPin, Calendar, Clock, AlertCircle, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchTestCentres, fetchSlotsForCentre, type TestSlot } from "@/lib/api/firecrawl";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLogger";

interface AvailableTestSlotsProps {
  instructorId?: string;
}

export function AvailableTestSlots({ instructorId }: AvailableTestSlotsProps) {
  const { toast } = useToast();
  const [reservedIndices, setReservedIndices] = useState<Set<number>>(new Set());
  const [reservingIndex, setReservingIndex] = useState<number | null>(null);
  const [centres, setCentres] = useState<string[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<string>("");
  const [slots, setSlots] = useState<TestSlot[]>([]);
  const [isLoadingCentres, setIsLoadingCentres] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCentres = async () => {
    setIsLoadingCentres(true);
    setError(null);
    try {
      const response = await fetchTestCentres();
      if (response.success) {
        setCentres(response.centres || []);
        if (response.slots && response.slots.length > 0) {
          setSlots(response.slots);
          setSelectedCentre(response.slots[0].centre);
        }
      } else {
        setError(response.error || "Failed to load test centres");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoadingCentres(false);
    }
  };

  const loadSlots = async (centre: string) => {
    setIsLoadingSlots(true);
    setSlots([]);
    try {
      const response = await fetchSlotsForCentre(centre);
      if (response.success) {
        setSlots(response.slots || []);
        if ((response.slots || []).length === 0) {
          toast({ title: "No slots", description: `No available slots found for ${centre}` });
        }
      } else {
        toast({ title: "Error", description: response.error || "Failed to load slots", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadCentres();
  }, []);

  const handleReserve = async (slot: TestSlot, index: number) => {
    if (!instructorId) {
      toast({ title: "Error", description: "Not logged in", variant: "destructive" });
      return;
    }
    setReservingIndex(index);
    try {
      const { error } = await supabase.from("test_slot_reservations" as any).insert({
        instructor_id: instructorId,
        centre: slot.centre,
        date: slot.date,
        time: slot.time,
      });
      if (error) throw error;

      await logAdminAction({
        actionType: "test_slot_reservation",
        description: `Instructor requested test slot: ${slot.centre} on ${slot.date} at ${slot.time}`,
        entityType: "test_slot_reservation",
        entityId: instructorId,
      });

      setReservedIndices((prev) => new Set(prev).add(index));
      toast({ title: "Reserved", description: "Reservation request sent to admin" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to reserve slot", variant: "destructive" });
    } finally {
      setReservingIndex(null);
    }
  };

  const handleCentreChange = (centre: string) => {
    setSelectedCentre(centre);
    loadSlots(centre);
  };

  if (isLoadingCentres) {
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading available test centres...
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 space-y-3">
        <Card className="border-destructive/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium">Failed to load</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" size="sm" onClick={loadCentres} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <Select value={selectedCentre} onValueChange={handleCentreChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a test centre" />
          </SelectTrigger>
          <SelectContent>
            {centres.map((centre) => (
              <SelectItem key={centre} value={centre}>
                {centre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => selectedCentre && loadSlots(selectedCentre)}
          disabled={!selectedCentre || isLoadingSlots}
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingSlots ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoadingSlots ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4 animate-pulse" />
            Searching slots for {selectedCentre}...
          </div>
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : slots.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {slots.length} slot{slots.length !== 1 ? "s" : ""} found
          </p>
          {slots.map((slot, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="h-4 w-4 text-primary" />
                    {slot.centre}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {slot.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {slot.time}
                    </span>
                  </div>
                </div>
                {reservedIndices.has(i) ? (
                  <Button size="sm" variant="outline" disabled className="gap-1 text-emerald-600 border-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                    Reserved
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleReserve(slot, i)}
                    disabled={reservingIndex === i || !instructorId}
                  >
                    {reservingIndex === i ? "Reserving..." : "Reserve"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      ) : selectedCentre ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No available slots for {selectedCentre}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Select a test centre to view available slots
        </p>
      )}

    </div>
  );
}
