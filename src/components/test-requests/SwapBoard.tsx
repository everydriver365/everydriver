import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TestSwapOfferDialog } from "./TestSwapOfferDialog";

interface SwapBoardProps {
  instructorId?: string;
}

export function SwapBoard({ instructorId }: SwapBoardProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["test-requests-board"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_requests")
        .select("*")
        .eq("status", "active")
        .order("test_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

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
        No active test requests on the swap board.
      </div>
    );
  }

  // Split into have/want
  const haveTests = requests.filter(r => r.request_type === "have_test");
  const wantTests = requests.filter(r => r.request_type === "want_test");

  return (
    <div className="space-y-6">
      {/* People with tests to swap */}
      {haveTests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Tests Available to Swap</h3>
          <div className="space-y-2">
            {haveTests.map(req => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge>Have Test</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {req.test_centre_name && (
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{req.test_centre_name}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{req.test_date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{req.test_time?.slice(0, 5)}</span>
                      </div>
                    </div>
                    {instructorId && req.instructor_id !== instructorId && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedRequestId(req.id)}>
                        Offer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* People looking for tests */}
      {wantTests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Looking for a Test</h3>
          <div className="space-y-2">
            {wantTests.map(req => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">Want Test</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {req.test_centre_name && (
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{req.test_centre_name}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {req.test_date}{req.date_range_end && ` – ${req.date_range_end}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {req.test_time?.slice(0, 5)}{req.time_range_end && ` – ${req.time_range_end.slice(0, 5)}`}
                        </span>
                      </div>
                      {req.notes && <p className="text-xs text-muted-foreground">{req.notes}</p>}
                    </div>
                    {instructorId && req.instructor_id !== instructorId && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedRequestId(req.id)}>
                        Offer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedRequestId && (
        <TestSwapOfferDialog
          requestId={selectedRequestId}
          instructorId={instructorId}
          open={!!selectedRequestId}
          onOpenChange={(open) => { if (!open) setSelectedRequestId(null); }}
        />
      )}
    </div>
  );
}
