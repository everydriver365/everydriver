import { useState } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GPSGateCandidate {
  id: number;
  username: string;
  name: string;
  description: string;
}

interface GPSTrackerLookupProps {
  searchQuery: string;
  onSelect: (userId: number, username: string, name: string) => void;
}

export function GPSTrackerLookup({ searchQuery, onSelect }: GPSTrackerLookupProps) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<GPSGateCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterText, setFilterText] = useState("");

  const handleLookup = async () => {
    setLoading(true);
    setError(null);
    setCandidates([]);
    setSearched(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("gpsgate-user-lookup", {
        body: { query: searchQuery || "" }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      // Filter out any candidates with missing id
      const validCandidates = (data.candidates || []).filter(
        (c: GPSGateCandidate) => c && typeof c.id === 'number'
      );
      setCandidates(validCandidates);
      setTotal(data.total || 0);

      // Auto-select if exactly one match
      if (validCandidates.length === 1) {
        const match = validCandidates[0];
        onSelect(match.id, match.username || "", match.name || "");
        toast.success(`Linked to tracker #${match.id} (${match.name || match.username})`);
      } else if (validCandidates.length === 0) {
        // No matches - fetch all trackers to show selection
        toast.info("No exact match found. Loading all available trackers...");
        const { data: allData } = await supabase.functions.invoke("gpsgate-user-lookup", {
          body: { query: "" }
        });
        const allCandidates = (allData?.candidates || []).filter(
          (c: GPSGateCandidate) => c && typeof c.id === 'number'
        );
        setCandidates(allCandidates);
        setTotal(allData?.total || 0);
        if (allCandidates.length > 0) {
          toast.info(`Select from ${allCandidates.length} available trackers below.`);
        } else {
          toast.error("No trackers found. Check your Every Driver GPS Gate configuration.");
        }
      } else {
        toast.info(`Found ${validCandidates.length} matching trackers. Please select one.`);
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Failed to search trackers");
      toast.error("Failed to search trackers");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTracker = (c: GPSGateCandidate) => {
    setSelectedId(c.id);
    onSelect(c.id, c.username || "", c.name || "");
    toast.success(`Linked to tracker #${c.id} (${c.name || c.username})`);
  };

  const formatCandidateLabel = (c: GPSGateCandidate) => {
    if (!c) return "Unknown";
    return c.name || c.username || `User #${c.id}`;
  };

  const formatCandidateSubtitle = (c: GPSGateCandidate) => {
    const parts: string[] = [];
    if (c.name && c.username && c.username !== c.name) {
      parts.push(c.username);
    }
    if (c.description) {
      parts.push(c.description.slice(0, 50));
    }
    parts.push(`ID: ${c.id}`);
    return parts.join(' • ');
  };

  // Filter candidates locally
  const filteredCandidates = candidates.filter(c => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      c.name?.toLowerCase().includes(searchLower) ||
      c.username?.toLowerCase().includes(searchLower) ||
      c.id.toString().includes(filterText)
    );
  });

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={selectedId ? "default" : "outline"}
        size="sm"
        onClick={handleLookup}
        disabled={loading}
        className={cn(
          "w-full transition-colors",
          selectedId && "bg-green-600 hover:bg-green-700 text-white border-green-600"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : selectedId ? (
          <CheckCircle2 className="h-4 w-4 mr-2" />
        ) : (
          <Search className="h-4 w-4 mr-2" />
        )}
        {selectedId ? "Tracker Linked" : "Find Tracker"}
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {searched && candidates.length > 0 && (
        <div className="space-y-2">
          <Input
            placeholder="Search trackers..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            {filterText ? `${filteredCandidates.length} of ${candidates.length}` : candidates.length} trackers — tap to select:
          </p>
          <div className="border rounded-lg divide-y max-h-64 overflow-y-auto bg-background">
            {filteredCandidates.filter(c => c && c.id != null).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectTracker(c)}
                className={cn(
                  "w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-muted/50 transition-colors",
                  selectedId === c.id && "bg-primary/10"
                )}
              >
                {selectedId === c.id ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <Radio className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{formatCandidateLabel(c)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatCandidateSubtitle(c)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {searched && candidates.length === 0 && !error && !loading && (
        <p className="text-xs text-muted-foreground">
          No trackers found. Make sure Every Driver GPS Gate is configured correctly.
        </p>
      )}
    </div>
  );
}
