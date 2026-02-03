import { useState } from "react";
import { Search, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

      setCandidates(data.candidates || []);
      setTotal(data.total || 0);

      // Auto-select if exactly one match
      if (data.candidates?.length === 1) {
        const match = data.candidates[0];
        onSelect(match.id, match.username, match.name);
        toast.success(`Linked to GPSgate user #${match.id} (${match.name || match.username})`);
      } else if (data.candidates?.length === 0) {
        toast.error("No matching tracker found. Check you're viewing the correct GPSgate application.");
      } else {
        toast.info(`Found ${data.candidates.length} matching trackers. Please select one.`);
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Failed to search GPSgate");
      toast.error("Failed to search GPSgate");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (value: string) => {
    const selected = candidates.find(c => c.id.toString() === value);
    if (selected) {
      onSelect(selected.id, selected.username, selected.name);
      toast.success(`Linked to GPSgate user #${selected.id} (${selected.name || selected.username})`);
    }
  };

  const formatCandidateLabel = (c: GPSGateCandidate) => {
    const parts = [c.name || c.username];
    if (c.name && c.username !== c.name) {
      parts.push(`(${c.username})`);
    }
    if (c.description) {
      parts.push(`- ${c.description.slice(0, 30)}${c.description.length > 30 ? '...' : ''}`);
    }
    return parts.join(' ');
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLookup}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Search className="h-4 w-4 mr-2" />
        )}
        Find Tracker in GPSgate
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {searched && candidates.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Found {candidates.length} trackers{total > candidates.length ? ` (of ${total} total)` : ''}. Select one:
          </p>
          <Select onValueChange={handleSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tracker..." />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 opacity-0 group-data-[state=checked]:opacity-100" />
                    <span className="truncate">{formatCandidateLabel(c)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {searched && candidates.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">
          No trackers found matching "{searchQuery}". Make sure the GPSgate App ID matches the application shown in your GPSgate dashboard.
        </p>
      )}
    </div>
  );
}
