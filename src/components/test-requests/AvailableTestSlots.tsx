import { useState, useEffect } from "react";
import { RefreshCw, MapPin, Calendar, Clock, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchTestCentres, fetchSlotsForCentre, type TestSlot } from "@/lib/api/firecrawl";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLogger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AvailableTestSlotsProps {
  instructorId?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let centresCache: { centres: string[]; timestamp: number } | null = null;

export function AvailableTestSlots({ instructorId }: AvailableTestSlotsProps) {
  const { toast } = useToast();
  const [reservedIndices, setReservedIndices] = useState<Set<string>>(new Set());
  const [reservingKey, setReservingKey] = useState<string | null>(null);
  const [centres, setCentres] = useState<string[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<string | null>(null);
  const [centreSlots, setCentreSlots] = useState<Record<string, TestSlot[]>>({});
  const [loadingCentreSlots, setLoadingCentreSlots] = useState<string | null>(null);
  const [isLoadingCentres, setIsLoadingCentres] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCentres = async (forceRefresh = false) => {
    if (!forceRefresh && centresCache && Date.now() - centresCache.timestamp < CACHE_TTL_MS) {
      setCentres(centresCache.centres);
      setIsLoadingCentres(false);
      return;
    }

    setIsLoadingCentres(true);
    setError(null);
    try {
      const response = await fetchTestCentres();
      if (response.success) {
        const c = response.centres || [];
        setCentres(c);
        // Store initial slots if returned
        if (response.slots && response.slots.length > 0) {
          const firstCentre = response.slots[0].centre;
          setCentreSlots(prev => ({ ...prev, [firstCentre]: response.slots! }));
        }
        centresCache = { centres: c, timestamp: Date.now() };
      } else {
        setError(response.error || "Failed to load test centres");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoadingCentres(false);
    }
  };

  const loadSlotsForCentre = async (centre: string) => {
    setLoadingCentreSlots(centre);
    try {
      const response = await fetchSlotsForCentre(centre);
      if (response.success) {
        setCentreSlots(prev => ({ ...prev, [centre]: response.slots || [] }));
        if ((response.slots || []).length === 0) {
          toast({ title: "No slots", description: `No available slots found for ${centre}` });
        }
      } else {
        toast({ title: "Error", description: response.error || "Failed to load slots", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoadingCentreSlots(null);
    }
  };

  const handleSelectCentre = (centre: string) => {
    setSelectedCentre(centre);
    if (!centreSlots[centre]) {
      loadSlotsForCentre(centre);
    }
  };

  useEffect(() => {
    loadCentres();
  }, []);

  const slotKey = (centre: string, i: number) => `${centre}-${i}`;

  const handleReserve = async (slot: TestSlot, key: string) => {
    if (!instructorId) {
      toast({ title: "Error", description: "Not logged in", variant: "destructive" });
      return;
    }
    setReservingKey(key);
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

      setReservedIndices(prev => new Set(prev).add(key));
      toast({ title: "Request sent", description: "Awaiting confirmation from admin" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to reserve slot", variant: "destructive" });
    } finally {
      setReservingKey(null);
    }
  };

  if (isLoadingCentres) {
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading available test centres...
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
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
        <Button variant="outline" size="sm" onClick={() => loadCentres(true)} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Select
          value={selectedCentre || ""}
          onValueChange={handleSelectCentre}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a test centre..." />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            {centres.map(centre => (
              <SelectItem key={centre} value={centre}>
                <span className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {centre}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => loadCentres(true)} className="gap-1 shrink-0">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {selectedCentre && (
        <div className="space-y-2">
          {loadingCentreSlots === selectedCentre ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Search className="h-4 w-4 animate-pulse" />
              Searching slots for {selectedCentre}...
            </div>
          ) : centreSlots[selectedCentre] && centreSlots[selectedCentre].length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {centreSlots[selectedCentre].length} slot{centreSlots[selectedCentre].length !== 1 ? "s" : ""} available
              </p>
              {centreSlots[selectedCentre].map((slot, i) => {
                const key = slotKey(selectedCentre, i);
                return (
                  <Card key={i}>
                    <CardContent className="p-3 flex items-center justify-between gap-2">
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
                      {reservedIndices.has(key) ? (
                        <Button size="sm" variant="outline" disabled className="gap-1 text-amber-600 border-amber-300 shrink-0">
                          <Clock className="h-4 w-4" />
                          Pending
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleReserve(slot, key)}
                          disabled={reservingKey === key || !instructorId}
                        >
                          {reservingKey === key ? "Sending..." : "Reserve"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : centreSlots[selectedCentre] && centreSlots[selectedCentre].length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No available slots at {selectedCentre}</p>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSlotsForCentre(selectedCentre)}
              className="gap-1"
            >
              <Search className="h-4 w-4" /> Load Slots
            </Button>
          )}
        </div>
      )}

      {centres.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No test centres found
        </p>
      )}
    </div>
  );
}
