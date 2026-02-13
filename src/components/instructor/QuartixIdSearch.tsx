import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Satellite, Search, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuartixResult {
  vehicleId: string;
  driverId: string;
  deviceName: string | null;
}

interface QuartixIdSearchProps {
  instructorId?: string;
}

export function QuartixIdSearch({ instructorId }: QuartixIdSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<QuartixResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!instructorId) return;
    setIsSearching(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from("gps_devices")
        .select("quartix_vehicle_id, quartix_driver_id, device_name")
        .eq("instructor_id", instructorId)
        .eq("tracking_provider", "quartix");

      if (searchQuery.trim()) {
        query = query.or(
          `quartix_vehicle_id.ilike.%${searchQuery.trim()}%,quartix_driver_id.ilike.%${searchQuery.trim()}%,device_name.ilike.%${searchQuery.trim()}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setResults(
        (data || [])
          .filter((d) => d.quartix_vehicle_id || d.quartix_driver_id)
          .map((d) => ({
            vehicleId: d.quartix_vehicle_id || "Not set",
            driverId: d.quartix_driver_id || "Not set",
            deviceName: d.device_name,
          }))
      );
    } catch (err) {
      console.error("Quartix search error:", err);
      toast({
        title: "Search failed",
        description: "Could not search Quartix IDs",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({ title: "Copied", description: `${field} copied to clipboard` });
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Satellite className="h-5 w-5" />
        Quartix User ID
      </h2>

      <div className="rounded-lg border bg-white dark:bg-card border-[#E5E7EB] shadow-[0_2px_8px_rgba(20,37,66,0.08)] p-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search vehicle or driver ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching} size="icon">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setSearchQuery("");
            handleSearch();
          }}
          disabled={isSearching}
        >
          Show All My Quartix IDs
        </Button>

        {hasSearched && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No Quartix trackers found. Your admin needs to link your Quartix IDs.
              </p>
            ) : (
              results.map((result, idx) => (
                <div
                  key={idx}
                  className="rounded-md border bg-muted/30 p-3 space-y-2"
                >
                  {result.deviceName && (
                    <p className="text-sm font-medium">{result.deviceName}</p>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Vehicle ID
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md flex-1">
                        {result.vehicleId}
                      </p>
                      {result.vehicleId !== "Not set" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() =>
                            copyToClipboard(result.vehicleId, "Vehicle ID")
                          }
                        >
                          {copiedField === "Vehicle ID" ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Driver ID
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md flex-1">
                        {result.driverId}
                      </p>
                      {result.driverId !== "Not set" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() =>
                            copyToClipboard(result.driverId, "Driver ID")
                          }
                        >
                          {copiedField === "Driver ID" ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
