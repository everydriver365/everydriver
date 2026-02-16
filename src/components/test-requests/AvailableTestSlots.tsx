import { useState, useEffect } from "react";
import { RefreshCw, MapPin, Calendar, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchAvailableTestSlots, type TestSlot } from "@/lib/api/firecrawl";

export function AvailableTestSlots() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<TestSlot[]>([]);
  const [rawMarkdown, setRawMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchAvailableTestSlots();
      if (response.success) {
        setSlots(response.slots || []);
        setRawMarkdown(response.rawMarkdown || "");
        if ((response.slots || []).length === 0 && response.rawMarkdown) {
          toast({
            title: "Data loaded",
            description: "Page scraped but no structured slots found. Showing raw content.",
          });
        }
      } else {
        setError(response.error || "Failed to load available slots");
        toast({ title: "Error", description: response.error || "Failed to load slots", variant: "destructive" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadSlots(); }, []);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Scraping available test slots...
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
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
              <p className="font-medium">Failed to load slots</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" size="sm" onClick={loadSlots} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {slots.length > 0 ? `${slots.length} slot${slots.length !== 1 ? "s" : ""} found` : "No structured slots found"}
        </p>
        <Button variant="outline" size="sm" onClick={loadSlots} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {slots.length > 0 ? (
        slots.map((slot, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  {slot.centre}
                </div>
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
              </div>
            </CardContent>
          </Card>
        ))
      ) : rawMarkdown ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Raw scraped content:</p>
            <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-lg max-h-60 overflow-auto">
              {rawMarkdown}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">No available test slots found at this time.</p>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Data sourced from TestBooking
      </p>
    </div>
  );
}
