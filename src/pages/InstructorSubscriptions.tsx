import { useState, useEffect } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Play, Pause, X, RefreshCw } from "lucide-react";
import { AddSubscriptionSheet } from "@/components/instructor/subscriptions/AddSubscriptionSheet";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Subscription {
  id: string;
  pupil_id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  pickup_postcode: string | null;
  pickup_address: string | null;
  price_per_lesson: number;
  payment_method: string;
  status: string;
  next_lesson_date: string | null;
  created_at: string;
  pupils?: { name: string } | null;
}

export default function InstructorSubscriptions() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (instructorId) fetchSubscriptions();
  }, [instructorId]);

  const fetchSubscriptions = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pupil_subscriptions")
        .select("*, pupils(name)")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions((data as any) || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("pupil_subscriptions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast({ title: `Subscription ${status}` });
      fetchSubscriptions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    );
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <InstructorPageHeader title="Recurring Subscriptions" />

        <div className="px-4">
          <Button onClick={() => setShowAdd(true)} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Add Subscription
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No recurring subscriptions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Set up weekly recurring lessons with auto-billing
            </p>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-card border border-border/50 rounded-xl p-4 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {(sub.pupils as any)?.name || "Unknown Pupil"}
                  </span>
                  {statusBadge(sub.status)}
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>{DAY_NAMES[sub.day_of_week]}s at {sub.start_time} • {sub.duration_minutes} min</p>
                  {sub.pickup_postcode && <p>Pickup: {sub.pickup_postcode}</p>}
                  <p>£{Number(sub.price_per_lesson).toFixed(2)} / lesson • {sub.payment_method}</p>
                  {sub.next_lesson_date && (
                    <p>Next: {new Date(sub.next_lesson_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  {sub.status === "active" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(sub.id, "paused")}>
                      <Pause className="h-3 w-3 mr-1" /> Pause
                    </Button>
                  )}
                  {sub.status === "paused" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(sub.id, "active")}>
                      <Play className="h-3 w-3 mr-1" /> Resume
                    </Button>
                  )}
                  {sub.status !== "cancelled" && (
                    <Button size="sm" variant="outline" className="text-xs h-7 text-destructive" onClick={() => updateStatus(sub.id, "cancelled")}>
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSubscriptionSheet
        open={showAdd}
        onOpenChange={setShowAdd}
        instructorId={instructorId || ""}
        onSuccess={() => {
          setShowAdd(false);
          fetchSubscriptions();
        }}
      />
    </InstructorPortalLayout>
  );
}
