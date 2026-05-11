import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Clock, Calendar, User, Phone, Trash2, Bell, CheckCircle, XCircle, Radio } from "lucide-react";
import { WaitlistFreshnessIndicator } from "./WaitlistFreshnessIndicator";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WaitlistEntry {
  id: string;
  pupil_id: string;
  preferred_days: string[];
  preferred_times: string[];
  min_duration_mins: number;
  max_duration_mins: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
  };
}

interface PendingSlotOffer {
  id: string;
  pupil_id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
  instructor_approved: boolean;
  pupil_response: string;
  expires_at: string | null;
  created_at: string;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
  };
}

interface WaitlistManagerProps {
  instructorId: string;
  availableGaps?: { date: string; dayOfWeek: string; timeSlot: string; durationMins: number }[];
}

function calculateMatchScore(
  entry: WaitlistEntry,
  gap: { dayOfWeek: string; timeSlot: string; durationMins: number }
): number {
  let score = 0;
  const maxScore = 3;

  // Day match
  if (entry.preferred_days.length === 0 || entry.preferred_days.includes(gap.dayOfWeek)) {
    score += 1;
  }

  // Time match
  if (entry.preferred_times.length === 0 || entry.preferred_times.includes(gap.timeSlot)) {
    score += 1;
  }

  // Duration match
  if (gap.durationMins >= entry.min_duration_mins && gap.durationMins <= entry.max_duration_mins) {
    score += 1;
  }

  return Math.round((score / maxScore) * 100);
}

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function WaitlistManager({ instructorId, availableGaps = [] }: WaitlistManagerProps) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [pendingOffers, setPendingOffers] = useState<PendingSlotOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const debounceWaitlistRef = useRef<NodeJS.Timeout | null>(null);
  const debounceOffersRef = useRef<NodeJS.Timeout | null>(null);
  
  // Highlight state for real-time updates
  const [highlightedWaitlistIds, setHighlightedWaitlistIds] = useState<Set<string>>(new Set());
  const [highlightedOfferIds, setHighlightedOfferIds] = useState<Set<string>>(new Set());
  const previousWaitlistRef = useRef<string[]>([]);
  const previousOffersRef = useRef<string[]>([]);

  // Clear highlight after animation
  const triggerWaitlistHighlight = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setHighlightedWaitlistIds(new Set(ids));
    setTimeout(() => setHighlightedWaitlistIds(new Set()), 1500);
  }, []);

  const triggerOfferHighlight = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setHighlightedOfferIds(new Set(ids));
    setTimeout(() => setHighlightedOfferIds(new Set()), 1500);
  }, []);

  // Debounced refetch functions
  const debouncedFetchWaitlist = useCallback(() => {
    if (debounceWaitlistRef.current) clearTimeout(debounceWaitlistRef.current);
    debounceWaitlistRef.current = setTimeout(() => {
      fetchWaitlist(true);
    }, 500);
  }, []);

  const debouncedFetchOffers = useCallback(() => {
    if (debounceOffersRef.current) clearTimeout(debounceOffersRef.current);
    debounceOffersRef.current = setTimeout(() => {
      fetchPendingOffers(true);
    }, 500);
  }, []);

  useEffect(() => {
    if (instructorId) {
      fetchWaitlist();
      fetchPendingOffers();

      // Subscribe to real-time changes
      const channel = supabase
        .channel(`waitlist-${instructorId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'lesson_waitlist', filter: `instructor_id=eq.${instructorId}` },
          () => debouncedFetchWaitlist()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'slot_offers', filter: `instructor_id=eq.${instructorId}` },
          () => debouncedFetchOffers()
        )
        .subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED');
        });

      return () => {
        if (debounceWaitlistRef.current) clearTimeout(debounceWaitlistRef.current);
        if (debounceOffersRef.current) clearTimeout(debounceOffersRef.current);
        supabase.removeChannel(channel);
      };
    }
  }, [instructorId, debouncedFetchWaitlist, debouncedFetchOffers]);

  const fetchWaitlist = async (isRealtime = false) => {
    try {
      const { data, error } = await supabase
        .from("lesson_waitlist")
        .select(`
          *,
          pupil:pupils(id, name, phone)
        `)
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const newData = data || [];
      const newIds = newData.map(w => w.id);
      
      // Find new entries that weren't in the previous list
      if (isRealtime && previousWaitlistRef.current.length > 0) {
        const addedIds = newIds.filter(id => !previousWaitlistRef.current.includes(id));
        triggerWaitlistHighlight(addedIds);
      }
      
      previousWaitlistRef.current = newIds;
      setWaitlist(newData);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOffers = async (isRealtime = false) => {
    try {
      const { data, error } = await supabase
        .from("slot_offers")
        .select(`
          *,
          pupil:pupils(id, name, phone)
        `)
        .eq("instructor_id", instructorId)
        .eq("instructor_approved", false)
        .eq("pupil_response", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const newData = data || [];
      const newIds = newData.map(o => o.id);
      
      // Find new offers that weren't in the previous list
      if (isRealtime && previousOffersRef.current.length > 0) {
        const addedIds = newIds.filter(id => !previousOffersRef.current.includes(id));
        triggerOfferHighlight(addedIds);
      }
      
      previousOffersRef.current = newIds;
      setPendingOffers(newData);
    } catch (error) {
      console.error("Error fetching pending offers:", error);
    }
  };

  const handleRemoveFromWaitlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lesson_waitlist")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setWaitlist((prev) => prev.filter((w) => w.id !== id));
      toast({ title: "Removed from waitlist" });
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      toast({ title: "Error", description: "Failed to remove from waitlist", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const handleApproveOffer = async (offer: PendingSlotOffer) => {
    setApprovingId(offer.id);
    try {
      // Update offer as approved
      const { error: updateError } = await supabase
        .from("slot_offers")
        .update({
          instructor_approved: true,
          instructor_approved_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour expiry
        })
        .eq("id", offer.id);

      if (updateError) throw updateError;

      // Send notifications to pupil
      if (offer.pupil_id) {
        // Send push notification
        await supabase.functions.invoke("notify-pupil", {
          body: {
            pupilId: offer.pupil_id,
            type: "slot_offer",
            title: "Lesson Slot Available! 🎉",
            body: `A slot on ${format(new Date(offer.lesson_date), "EEEE, d MMM")} at ${formatTime(offer.start_time)} is available. Book now!`,
            data: { offerId: offer.id },
          },
        });
      }

      // Also send SMS if phone available
      if (offer.pupil?.phone) {
        await supabase.functions.invoke("send-gap-sms", {
          body: {
            instructorId,
            phones: [offer.pupil.phone],
            message: `Hi ${offer.pupil.name}! A lesson slot has become available on ${format(new Date(offer.lesson_date), "EEEE, d MMM")} at ${offer.start_time}. Reply YES to book or click the link in your app to confirm. This offer expires in 24 hours.`,
          },
        });
      }

      toast({ title: "Offer approved", description: `${offer.pupil?.name} has been notified` });
      fetchPendingOffers();
    } catch (error) {
      console.error("Error approving offer:", error);
      toast({ title: "Error", description: "Failed to approve offer", variant: "destructive" });
    } finally {
      setApprovingId(null);
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from("slot_offers")
        .update({ pupil_response: "declined" })
        .eq("id", offerId);

      if (error) throw error;

      setPendingOffers((prev) => prev.filter((o) => o.id !== offerId));
      toast({ title: "Offer declined" });
    } catch (error) {
      console.error("Error declining offer:", error);
      toast({ title: "Error", description: "Failed to decline offer", variant: "destructive" });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return `${hours.padStart(2, "0")}:${minutes}`;
  };

  if (loading) {
    return (
      <InstructorCard>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </InstructorCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Offers Awaiting Approval */}
      {pendingOffers.length > 0 && (
        <InstructorCard className="bg-amber-50 dark:bg-amber-950/50">
          <div className="flex items-center gap-2 text-lg font-semibold mb-3">
            <Bell className="h-5 w-5 text-amber-600" />
            Pending Slot Offers ({pendingOffers.length})
          </div>
          <div className="space-y-3">
            {pendingOffers.map((offer) => (
              <div
                key={offer.id}
                className={`flex flex-col gap-3 rounded-2xl bg-background p-3 transition-all sm:flex-row sm:items-center sm:justify-between ${
                  highlightedOfferIds.has(offer.id) ? "animate-highlight-pulse ring-2 ring-green-500/50 bg-green-500/10" : ""
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{offer.pupil?.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(offer.lesson_date), "EEE, d MMM")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(offer.start_time)} - {formatTime(offer.end_time)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineOffer(offer.id)}
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveOffer(offer)}
                    disabled={approvingId === offer.id}
                    className="flex-1 sm:flex-none"
                  >
                    {approvingId === offer.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Approve & Notify
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </InstructorCard>
      )}

      {/* Active Waitlist */}
      <InstructorCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5" />
            Pupil Waitlist ({waitlist.length})
          </div>
          {isLive && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-600 gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              Live
            </Badge>
          )}
        </div>
        <div>
          {waitlist.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No pupils currently on the waitlist
            </p>
          ) : (
            <div className="space-y-3">
              {waitlist
                .map((entry) => {
                  // Calculate best match score across available gaps
                  const bestScore = availableGaps.length > 0
                    ? Math.max(0, ...availableGaps.map(gap => calculateMatchScore(entry, gap)))
                    : null;
                  return { entry, bestScore };
                })
                .sort((a, b) => {
                  // Sort by match score descending, then by wait time
                  if (a.bestScore !== null && b.bestScore !== null) {
                    return b.bestScore - a.bestScore;
                  }
                  return new Date(a.entry.created_at).getTime() - new Date(b.entry.created_at).getTime();
                })
                .map(({ entry, bestScore }) => (
                <div
                  key={entry.id}
                  className={`flex items-start justify-between gap-2 rounded-2xl border p-3 transition-all ${
                    highlightedWaitlistIds.has(entry.id) ? "animate-highlight-pulse ring-2 ring-green-500/50 bg-green-500/10" : ""
                  }`}
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{entry.pupil?.name}</span>
                      </div>
                      {bestScore !== null && (
                        <Badge
                          variant={bestScore >= 80 ? "default" : bestScore >= 50 ? "secondary" : "outline"}
                          className={`text-[10px] px-1.5 ${
                            bestScore >= 80 ? "bg-emerald-500 hover:bg-emerald-500" : ""
                          }`}
                        >
                          {bestScore}% match
                        </Badge>
                      )}
                      <WaitlistFreshnessIndicator
                        lastConfirmedAt={(entry as any).last_confirmed_at}
                        createdAt={entry.created_at}
                        autoExpired={(entry as any).auto_expired}
                      />
                      {entry.pupil?.phone && (
                        <a
                          href={`tel:${entry.pupil.phone}`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {entry.pupil.phone}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entry.preferred_days?.map((day) => (
                        <Badge key={day} variant="secondary" className="text-xs">
                          {DAY_LABELS[day] || day}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entry.preferred_times?.map((time) => (
                        <Badge key={time} variant="outline" className="text-xs">
                          {TIME_LABELS[time] || time}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.min_duration_mins}-{entry.max_duration_mins} mins preferred
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground italic break-words">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </InstructorCard>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from waitlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This pupil will no longer receive notifications about available slots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleRemoveFromWaitlist(deleteId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
