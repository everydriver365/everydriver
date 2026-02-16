import { useState, useEffect } from "react";
import { RefreshCw, MapPin, Calendar, Clock, AlertCircle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchTestCentres, fetchSlotsForCentre, type TestSlot } from "@/lib/api/firecrawl";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLogger";

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
  const [expandedCentre, setExpandedCentre] = useState<string | null>(null);
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

  const handleToggleCentre = (centre: string) => {
    if (expandedCentre === centre) {
      setExpandedCentre(null);
      return;
    }
    setExpandedCentre(centre);
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
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {centres.length} test centre{centres.length !== 1 ? "s" : ""}
        </p>
        <Button variant="outline" size="sm" onClick={() => loadCentres(true)} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {centres.map(centre => {
        const isExpanded = expandedCentre === centre;
        const slots = centreSlots[centre];
        const isLoading = loadingCentreSlots === centre;

        return (
          <Card key={centre}>
            <CardContent className="p-0">
              <button
                className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                onClick={() => handleToggleCentre(centre)}
              >
                <span className="flex items-center gap-2 font-medium text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  {centre}
                  {slots && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({slots.length} slot{slots.length !== 1 ? "s" : ""})
                    </span>
                  )}
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="border-t px-3 pb-3 pt-2 space-y-2">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Search className="h-4 w-4 animate-pulse" />
                      Searching slots for {centre}...
                    </div>
                  ) : slots && slots.length > 0 ? (
                    slots.map((slot, i) => {
                      const key = slotKey(centre, i);
                      return (
                        <div key={i} className="flex items-center justify-between gap-2 py-1.5">
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
                        </div>
                      );
                    })
                  ) : slots && slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No available slots</p>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSlotsForCentre(centre)}
                      className="gap-1"
                    >
                      <Search className="h-4 w-4" /> Load Slots
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {centres.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No test centres found
        </p>
      )}
    </div>
  );
}
