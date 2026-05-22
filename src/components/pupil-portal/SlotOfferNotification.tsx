import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Clock, Calendar, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface SlotOffer {
  id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
  expires_at: string | null;
  status: string;
  recipient_id: string;
}

interface SlotOfferNotificationProps {
  pupilId: string;
  focusOfferId?: string | null;
  onAccept?: () => void;
}

export function SlotOfferNotification({ pupilId, focusOfferId, onAccept }: SlotOfferNotificationProps) {
  const [offers, setOffers] = useState<SlotOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [unavailableFocus, setUnavailableFocus] = useState<null | { status: string; date: string; start_time: string }>(null);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  // If deep-linked with a specific offer that's no longer open, surface state immediately (no loading flash)
  useEffect(() => {
    if (!focusOfferId) { setUnavailableFocus(null); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("slot_offers")
        .select("status, lesson_date, start_time")
        .eq("id", focusOfferId)
        .maybeSingle();
      if (!alive || !data) return;
      if (data.status !== "open") {
        setUnavailableFocus({ status: data.status, date: data.lesson_date, start_time: data.start_time });
      } else {
        setUnavailableFocus(null);
      }
    })();
    return () => { alive = false; };
  }, [focusOfferId]);

  useEffect(() => {
    if (!pupilId) return;
    fetchOffers();

    const channel = supabase
      .channel(`slot-recipients-${pupilId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slot_offer_recipients", filter: `pupil_id=eq.${pupilId}` },
        () => fetchOffers()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "slot_offers" },
        () => fetchOffers()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pupilId]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from("slot_offer_recipients")
        .select(`
          id,
          slot_offer_id,
          viewed_at,
          claimed_at,
          declined_at,
          slot_offer:slot_offers!inner (
            id, lesson_date, start_time, end_time, duration_mins, expires_at, status
          )
        `)
        .eq("pupil_id", pupilId)
        .is("claimed_at", null)
        .is("declined_at", null);

      if (error) throw error;

      const rows = (data ?? [])
        .map((r: any) => ({
          recipient_id: r.id,
          ...r.slot_offer,
        }))
        .filter((o: SlotOffer) => o.status === "open")
        .filter((o: SlotOffer) => !o.expires_at || new Date(o.expires_at) > new Date());

      setOffers(rows);

      // Mark unseen as viewed
      const unseen = (data ?? []).filter((r: any) => !r.viewed_at).map((r: any) => r.id);
      if (unseen.length) {
        await supabase
          .from("slot_offer_recipients")
          .update({ viewed_at: new Date().toISOString() })
          .in("id", unseen);
      }
    } catch (e) {
      console.error("[SlotOfferNotification] fetch", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (offerId: string) => {
    setRespondingId(offerId);
    try {
      const { data, error } = await supabase.rpc("claim_slot_offer", {
        p_offer_id: offerId,
        p_pupil_id: pupilId,
      });
      if (error) throw error;
      const res = data as { success: boolean; reason?: string; lesson_id?: string };

      if (res.success) {
        toast({ title: "You got it!", description: "Lesson booked" });
        setOffers((prev) => prev.filter((o) => o.id !== offerId));
        onAccept?.();
      } else {
        switch (res.reason) {
          case "already_filled":
            toast({ title: "Sorry, someone else grabbed this slot first", variant: "destructive" });
            break;
          case "already_claimed":
            toast({ title: "You've already claimed this slot" });
            break;
          case "expired":
            toast({ title: "This offer has expired", variant: "destructive" });
            break;
          case "not_a_recipient":
          case "not_authorised":
            console.error("[SlotOfferNotification] claim denied:", res.reason);
            toast({ title: "Unable to claim this slot", variant: "destructive" });
            break;
          default:
            toast({ title: "Could not claim slot", variant: "destructive" });
        }
        setOffers((prev) => prev.filter((o) => o.id !== offerId));
      }
    } catch (e) {
      console.error("[SlotOfferNotification] claim", e);
      toast({ title: "Error", description: "Failed to claim slot", variant: "destructive" });
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (recipientId: string, offerId: string) => {
    setRespondingId(offerId);
    try {
      await supabase
        .from("slot_offer_recipients")
        .update({ declined_at: new Date().toISOString() })
        .eq("id", recipientId);
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } finally {
      setRespondingId(null);
    }
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hh = parseInt(h);
    const ampm = hh >= 12 ? "pm" : "am";
    return `${hh % 12 || 12}:${m}${ampm}`;
  };

  const getRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "Expiring";
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  };

  if (loading || (offers.length === 0 && !unavailableFocus)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-3"
      >
        {unavailableFocus && !offers.some((o) => o.id === focusOfferId) && (
          <Card className="border-muted bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {unavailableFocus.status === "filled"
                    ? "This slot has already been taken"
                    : unavailableFocus.status === "cancelled"
                    ? "This slot offer was withdrawn"
                    : "This slot offer has expired"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(parseISO(unavailableFocus.date), "EEEE, d MMMM")} · {formatTime(unavailableFocus.start_time)}
              </p>
            </CardContent>
          </Card>
        )}
        {offers.map((offer) => (
          <Card key={offer.id} className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">Grab a Gap — slot available!</span>
                    {offer.expires_at && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {getRemaining(offer.expires_at)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(parseISO(offer.lesson_date), "EEEE, d MMMM")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatTime(offer.start_time)} - {formatTime(offer.end_time)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {offer.duration_mins} minute lesson · first to claim gets it
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleClaim(offer.id)}
                    disabled={respondingId === offer.id}
                  >
                    {respondingId === offer.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Grab it
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDecline(offer.recipient_id, offer.id)}
                    disabled={respondingId === offer.id}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
