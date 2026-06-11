import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, addWeeks } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Phone, MessageCircle, Plus, Mail } from "lucide-react";

interface Props {
  instructorId: string | null | undefined;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WINDOW_LABEL: Record<string, string> = {
  morning: "Mornings",
  afternoon: "Afternoons",
  evening: "Evenings",
};

export function ReservationsAwaitingSchedulingCard({ instructorId }: Props) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["reservations-awaiting-scheduling", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_reservations")
        .select(
          "id, start_date, completion_window_weeks, allowed_days, time_windows, hours_per_week_cap, total_hours, hours_scheduled, status, payment_status, pupil_id, pupils!course_reservations_pupil_id_fkey(id, name, phone, email)"
        )
        .eq("instructor_id", instructorId!)
        .eq("payment_status", "paid")
        .in("status", ["awaiting_scheduling", "partially_scheduled"])
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading || rows.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Reservations awaiting scheduling
          </div>
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          These pupils have paid and reserved a start date. Arrange exact lesson times with them, then add each lesson to your calendar.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r: any) => {
          const pupil = r.pupils;
          const endBy = addWeeks(new Date(r.start_date), r.completion_window_weeks);
          const remaining = Math.max(0, (r.total_hours ?? 0) - (r.hours_scheduled ?? 0));
          const days = (r.allowed_days ?? []).map((d: number) => DAY_SHORT[d]).join(", ");
          const windows = (r.time_windows ?? []).map((w: string) => WINDOW_LABEL[w] ?? w).join(", ");
          const scheduleHref = `/instructor/schedule?action=add&pupilId=${pupil?.id ?? ""}&reservationId=${r.id}`;
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-background p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{pupil?.name ?? "Pupil"}</div>
                  <div className="text-xs text-muted-foreground">
                    {remaining} of {r.total_hours} hrs remaining
                    {r.status === "partially_scheduled" && (
                      <span className="ml-2 text-amber-600">· partially scheduled</span>
                    )}
                  </div>
                </div>
                <Button asChild size="sm" variant="default">
                  <Link to={scheduleHref}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add lesson
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Start:</span>{" "}
                  <span className="font-medium">{format(new Date(r.start_date), "d MMM yyyy")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Finish by:</span>{" "}
                  <span className="font-medium">{format(endBy, "d MMM yyyy")}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Days:</span>{" "}
                  <span className="font-medium">{days || "Any"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Times:</span>{" "}
                  <span className="font-medium">{windows || "Any"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Max per week:</span>{" "}
                  <span className="font-medium">{r.hours_per_week_cap} hrs</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {pupil?.phone && (
                  <>
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <a href={`tel:${pupil.phone}`}>
                        <Phone className="h-3.5 w-3.5 mr-1" /> Call
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <a
                        href={`https://wa.me/${pupil.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                      </a>
                    </Button>
                  </>
                )}
                {pupil?.email && (
                  <Button asChild size="sm" variant="outline" className="h-8">
                    <a href={`mailto:${pupil.email}`}>
                      <Mail className="h-3.5 w-3.5 mr-1" /> Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
