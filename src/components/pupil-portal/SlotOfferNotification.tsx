import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Clock, Calendar, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { format, differenceInHours, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface SlotOffer {
  id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
  expires_at: string | null;
  instructor_approved: boolean;
  pupil_response: string;
}

interface SlotOfferNotificationProps {
  pupilId: string;
  onAccept?: () => void;
}

export function SlotOfferNotification({ pupilId, onAccept }: SlotOfferNotificationProps) {
  const [offers, setOffers] = useState<SlotOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    if (pupilId) {
      fetchOffers();
    }
  }, [pupilId]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from("slot_offers")
        .select("*")
        .eq("pupil_id", pupilId)
        .eq("instructor_approved", true)
        .eq("pupil_response", "pending")
        .order("lesson_date", { ascending: true });

      if (error) throw error;

      // Filter out expired offers
      const validOffers = (data || []).filter((offer) => {
        if (!offer.expires_at) return true;
        return new Date(offer.expires_at) > new Date();
      });

      setOffers(validOffers);
    } catch (error) {
      console.error("Error fetching slot offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (offerId: string, response: "accepted" | "declined") => {
    setRespondingId(offerId);
    try {
      const { error } = await supabase
        .from("slot_offers")
        .update({
          pupil_response: response,
          pupil_responded_at: new Date().toISOString(),
        })
        .eq("id", offerId);

      if (error) throw error;

      if (response === "accepted") {
        // Optionally create the actual lesson booking here
        toast({
          title: "Slot booked!",
          description: "Your lesson has been confirmed",
        });
        onAccept?.();
      } else {
        toast({ title: "Offer declined" });
      }

      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch (error) {
      console.error("Error responding to offer:", error);
      toast({
        title: "Error",
        description: "Failed to respond to offer",
        variant: "destructive",
      });
    } finally {
      setRespondingId(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
  };

  const getExpiryText = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const hoursLeft = differenceInHours(parseISO(expiresAt), new Date());
    if (hoursLeft <= 0) return "Expiring soon";
    if (hoursLeft === 1) return "1 hour left";
    return `${hoursLeft} hours left`;
  };

  if (loading || offers.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-3"
      >
        {offers.map((offer) => (
          <Card
            key={offer.id}
            className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">Slot Available!</span>
                    {offer.expires_at && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {getExpiryText(offer.expires_at)}
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
                    {offer.duration_mins} minute lesson
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespond(offer.id, "accepted")}
                    disabled={respondingId === offer.id}
                  >
                    {respondingId === offer.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Book
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRespond(offer.id, "declined")}
                    disabled={respondingId === offer.id}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Decline
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
