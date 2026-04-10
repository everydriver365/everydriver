import { useState, useEffect } from "react";
import { ChevronDown, MapPin, Calendar, Clock, RefreshCw, Search, ArrowRight } from "lucide-react";
import blueTickIcon from "@/assets/blue_tick-removebg-preview.png";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
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

interface TestRequestsTileProps {
  instructorId: string;
}

export function TestRequestsTile({ instructorId }: TestRequestsTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: notificationCount = 0 } = useTestSwapNotifications(instructorId);

  // Watched centres from active want_test requests
  const [watchedCentres, setWatchedCentres] = useState<string[]>([]);

  // Centre browser state
  const [centres, setCentres] = useState<string[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<string | null>(null);
  const [centreSlots, setCentreSlots] = useState<Record<string, TestSlot[]>>({});
  const [loadingCentreSlots, setLoadingCentreSlots] = useState<string | null>(null);
  const [isLoadingCentres, setIsLoadingCentres] = useState(false);
  const [reservedKeys, setReservedKeys] = useState<Set<string>>(new Set());
  const [reservingKey, setReservingKey] = useState<string | null>(null);

  // Fetch watched centres on mount
  useEffect(() => {
    const fetchWatched = async () => {
      const { data } = await supabase
        .from("test_requests")
        .select("test_centre_name")
        .eq("instructor_id", instructorId)
        .eq("request_type", "want_test")
        .eq("status", "active");
      setWatchedCentres((data || []).map(r => r.test_centre_name).filter(Boolean));
    };
    fetchWatched();
  }, [instructorId]);

  // Load centres when expanded
  useEffect(() => {
    if (isExpanded && centres.length === 0 && !isLoadingCentres) {
      loadCentres();
    }
  }, [isExpanded]);

  const loadCentres = async () => {
    setIsLoadingCentres(true);
    try {
      const response = await fetchTestCentres();
      if (response.success) {
        setCentres(response.centres || []);
        if (response.slots && response.slots.length > 0) {
          const firstCentre = response.slots[0].centre;
          setCentreSlots(prev => ({ ...prev, [firstCentre]: response.slots! }));
        }
      }
    } catch (err) {
      console.error("Failed to load centres:", err);
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
      toast({ title: "Error", description: "Failed to load slots", variant: "destructive" });
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

  const handleReserve = async (slot: TestSlot, key: string) => {
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

      setReservedKeys(prev => new Set(prev).add(key));
      toast({ title: "Request sent", description: "Awaiting confirmation from admin" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to reserve slot", variant: "destructive" });
    } finally {
      setReservingKey(null);
    }
  };

  const slotKey = (centre: string, i: number) => `${centre}-${i}`;
  const slots = selectedCentre ? centreSlots[selectedCentre] || [] : [];

  return (
    <div className="mx-4 mt-3">
      <div className="rounded-none overflow-hidden shadow-sm border border-border/30">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white px-4 py-3 relative overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={blueTickIcon} alt="Test Requests" className="h-9 w-9" />
              <div className="text-left">
                <span className="font-semibold text-sm">Tests</span>
                {notificationCount > 0 && (
                  <p className="text-white/70 text-[10px]">
                    {notificationCount} slot{notificationCount !== 1 ? "s" : ""} match your requests
                  </p>
                )}
                {notificationCount === 0 && watchedCentres.length > 0 && (
                  <p className="text-white/70 text-[10px]">Watching {watchedCentres.length} centre{watchedCentres.length !== 1 ? "s" : ""}</p>
                )}
                {notificationCount === 0 && watchedCentres.length === 0 && (
                  <p className="text-white/70 text-[10px]">No active requests</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notificationCount > 0 && (
                <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
              <ChevronDown className={cn("h-4 w-4 transition-transform", !isExpanded && "-rotate-90")} />
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="bg-card p-4 space-y-4">
            {/* Watched centres summary */}
            {watchedCentres.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Watching:</span>{" "}
                {watchedCentres.join(", ")}
              </div>
            )}

            {watchedCentres.length === 0 && (
              <div className="text-center py-3">
                <p className="text-sm text-muted-foreground mb-2">
                  No active test requests. Create one from Test Swap to get alerts.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/instructor/test-requests")}
                  className="gap-1"
                >
                  Go to Test Swap <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Centre selector */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedCentre || ""}
                onValueChange={handleSelectCentre}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={isLoadingCentres ? "Loading centres..." : "Select a test centre..."} />
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => loadCentres()}
                className="shrink-0 h-10 w-10"
                disabled={isLoadingCentres}
              >
                <RefreshCw className={cn("h-4 w-4", isLoadingCentres && "animate-spin")} />
              </Button>
            </div>

            {/* Slots list */}
            {selectedCentre && (
              <div className="space-y-2">
                {loadingCentreSlots === selectedCentre ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Search className="h-4 w-4 animate-pulse" />
                    Searching slots for {selectedCentre}...
                  </div>
                ) : slots.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {slots.length} slot{slots.length !== 1 ? "s" : ""} available
                    </p>
                    {slots.map((slot, i) => {
                      const key = slotKey(selectedCentre, i);
                      return (
                        <Card key={i}>
                          <CardContent className="p-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" /> {slot.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {slot.time}
                              </span>
                            </div>
                            {reservedKeys.has(key) ? (
                              <Button size="sm" variant="outline" disabled className="gap-1 text-amber-600 border-amber-300 shrink-0">
                                <Clock className="h-4 w-4" /> Pending
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleReserve(slot, key)}
                                disabled={reservingKey === key}
                              >
                                {reservingKey === key ? "Sending..." : "Reserve"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                ) : centreSlots[selectedCentre] !== undefined ? (
                  <p className="text-sm text-muted-foreground py-2">No available slots at {selectedCentre}</p>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => loadSlotsForCentre(selectedCentre)} className="gap-1">
                    <Search className="h-4 w-4" /> Load Slots
                  </Button>
                )}
              </div>
            )}

            {/* Footer link */}
            <button
              onClick={() => navigate("/instructor/test-requests")}
              className="w-full text-center text-xs text-primary font-medium flex items-center justify-center gap-1 pt-1"
            >
              View all in Test Swap <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
