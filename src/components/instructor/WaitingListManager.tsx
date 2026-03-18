import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function WaitingListManager() {
  const { instructor } = useInstructorAuth();

  const { data: waitlist, isLoading } = useQuery<any[]>({
    queryKey: ["waiting-list", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_waitlist")
        .select("*, pupils(name, phone)")
        .eq("instructor_id", instructor!.id)
        .eq("status", "waiting")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const { data: offers } = useQuery({
    queryKey: ["slot-offers", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slot_offers")
        .select("*, pupils(name), scheduled_lessons:original_lesson_id(lesson_date, start_time)")
        .eq("instructor_id", instructor!.id)
        .order("queue_position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const totalWaiting = waitlist?.length || 0;
  const pendingOffers = offers?.filter(o => o.pupil_response === null || o.pupil_response === "pending").length || 0;
  const claimedOffers = offers?.filter(o => o.pupil_response === "accepted").length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{totalWaiting}</p>
            <p className="text-[10px] text-muted-foreground">Waiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold text-foreground">{pendingOffers}</p>
            <p className="text-[10px] text-muted-foreground">Offers Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold text-foreground">{claimedOffers}</p>
            <p className="text-[10px] text-muted-foreground">Claimed</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Queue Order</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : waitlist?.length ? (
            waitlist.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 py-2 border-b last:border-0 border-border">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{(entry as any).pupils?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {(entry.preferred_days as string[] | null)?.join(", ") || "Any day"} • {(entry.preferred_times as string[] | null)?.join(", ") || "Any time"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No one on the waiting list.</p>
          )}
        </CardContent>
      </Card>

      {/* Active Offers */}
      {offers && offers.filter(o => o.pupil_response === null || o.pupil_response === "pending").length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Active Slot Offers</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {offers.filter(o => o.pupil_response === null || o.pupil_response === "pending").map(offer => (
              <div key={offer.id} className="flex items-center justify-between py-2 border-b last:border-0 border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{(offer as any).pupils?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {(offer as any).scheduled_lessons?.lesson_date} at {(offer as any).scheduled_lessons?.start_time}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    #{offer.queue_position || 1} in queue
                  </span>
                  {offer.claim_expires_at && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Expires {formatDistanceToNow(new Date(offer.claim_expires_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
