import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, MapPin, Calendar, Clock, PoundSterling, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface TestRequestListProps {
  instructorId?: string;
  pupilId?: string;
}

export function TestRequestList({ instructorId, pupilId }: TestRequestListProps) {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["test-requests", instructorId, pupilId],
    queryFn: async () => {
      let query = supabase
        .from("test_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (pupilId) {
        query = query.eq("pupil_id", pupilId);
      } else if (instructorId) {
        query = query.eq("instructor_id", instructorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!(instructorId || pupilId),
  });

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("test_requests")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast({ title: "Error cancelling", variant: "destructive" });
    } else {
      toast({ title: "Request cancelled" });
      queryClient.invalidateQueries({ queryKey: ["test-requests"] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requests?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No test requests yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={req.request_type === "have_test" ? "default" : "secondary"}>
                  {req.request_type === "have_test" ? "Have Test" : "Want Test"}
                </Badge>
                <Badge variant={req.status === "active" ? "outline" : req.status === "matched" ? "default" : "secondary"}>
                  {req.status}
                </Badge>
                {req.willing_to_pay_swap_fee && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                    <PoundSterling className="h-3 w-3 mr-0.5" />
                    £150
                  </Badge>
                )}
              </div>
              {req.status === "active" && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCancel(req.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {req.test_centre_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {req.test_centre_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {req.test_date}
                {req.date_range_end && ` – ${req.date_range_end}`}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {req.test_time?.slice(0, 5)}
                {req.time_range_end && ` – ${req.time_range_end.slice(0, 5)}`}
              </span>
            </div>

            {req.notes && (
              <p className="text-xs text-muted-foreground">{req.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
