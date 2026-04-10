import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInstructorFriends } from "@/hooks/useInstructorFriends";
import { Search, UserPlus, Loader2, MapPin, Check, Clock, Users } from "lucide-react";
import { toast } from "sonner";

interface InstructorDirectoryProps {
  instructorId: string;
}

interface SearchResult {
  id: string;
  name: string;
  profile_image_url: string | null;
  home_postcode: string;
}

export function InstructorDirectory({ instructorId }: InstructorDirectoryProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { acceptedFriends, pendingSent, pendingReceived, sendRequest, searchInstructors } =
    useInstructorFriends(instructorId);

  // Build sets for quick lookups
  const acceptedIds = new Set(acceptedFriends.map((f) => f.friendInstructor?.id));
  const pendingSentIds = new Set(pendingSent.map((f) => f.friendInstructor?.id));
  const pendingReceivedIds = new Set(pendingReceived.map((f) => f.friendInstructor?.id));

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    const data = await searchInstructors(query.trim());
    setResults(data as SearchResult[]);
    setSearching(false);
  };

  const handleConnect = async (recipientId: string) => {
    try {
      await sendRequest.mutateAsync(recipientId);
      toast.success("Friend request sent!");
    } catch {
      toast.error("Could not send request");
    }
  };

  const getStatus = (id: string) => {
    if (acceptedIds.has(id)) return "friend";
    if (pendingSentIds.has(id)) return "pending-sent";
    if (pendingReceivedIds.has(id)) return "pending-received";
    return "none";
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Search bar */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Search by instructor name or postcode to find ADIs in your area
        </p>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. John Smith or LS1"
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!searching && hasSearched && results.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No instructors found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different name or postcode
          </p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((inst) => {
            const status = getStatus(inst.id);
            return (
              <div
                key={inst.id}
                className="flex items-center justify-between p-3 rounded-none bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {inst.profile_image_url ? (
                      <img
                        src={inst.profile_image_url}
                        alt={inst.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {inst.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{inst.name}</p>
                    {inst.home_postcode && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{inst.home_postcode}</span>
                      </div>
                    )}
                  </div>
                </div>

                {status === "friend" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="h-3.5 w-3.5" /> Friends
                  </span>
                )}
                {status === "pending-sent" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Pending
                  </span>
                )}
                {status === "pending-received" && (
                  <span className="text-xs font-medium text-amber-600">Respond in Friends</span>
                )}
                {status === "none" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConnect(inst.id)}
                    disabled={sendRequest.isPending}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Suggestions when no search yet */}
      {!hasSearched && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-foreground">Find Instructor Friends</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Search by name to find a specific ADI, or enter a postcode to discover instructors in your area.
          </p>
        </div>
      )}
    </div>
  );
}
