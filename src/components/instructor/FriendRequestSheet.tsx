import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInstructorFriends, InstructorFriend } from "@/hooks/useInstructorFriends";
import { Check, X, Search, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FriendRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
}

export function FriendRequestSheet({ open, onOpenChange, instructorId }: FriendRequestSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const {
    acceptedFriends,
    pendingReceived,
    pendingSent,
    sendRequest,
    respondToRequest,
    removeFriend,
    searchInstructors,
  } = useInstructorFriends(instructorId);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchInstructors(searchQuery.trim());
    // Filter out existing friends
    const existingIds = new Set([
      ...acceptedFriends.map((f) => f.friendInstructor?.id),
      ...pendingSent.map((f) => f.friendInstructor?.id),
      ...pendingReceived.map((f) => f.friendInstructor?.id),
    ]);
    setSearchResults(results.filter((r) => !existingIds.has(r.id)));
    setSearching(false);
  };

  const handleSendRequest = async (recipientId: string) => {
    try {
      await sendRequest.mutateAsync(recipientId);
      toast.success("Friend request sent!");
      setSearchResults((prev) => prev.filter((r) => r.id !== recipientId));
    } catch {
      toast.error("Failed to send request");
    }
  };

  const handleRespond = async (friendshipId: string, status: "accepted" | "declined") => {
    try {
      await respondToRequest.mutateAsync({ friendshipId, status });
      toast.success(status === "accepted" ? "Friend added!" : "Request declined");
    } catch {
      toast.error("Failed to respond");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-2xl">
        <SheetHeader>
          <SheetTitle>ADI Friends</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6 overflow-y-auto max-h-[calc(85vh-80px)] pb-6">
          {/* Search */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Find Instructors</p>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name…"
              />
              <Button size="icon" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {searchResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-2xl bg-muted">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {r.profile_image_url ? (
                          <img src={r.profile_image_url} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">{r.name?.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{r.name}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleSendRequest(r.id)}>
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending received */}
          {pendingReceived.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Pending Requests ({pendingReceived.length})
              </p>
              <div className="space-y-2">
                {pendingReceived.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded-2xl bg-muted">
                    <span className="text-sm font-medium">{f.friendInstructor?.name || "Unknown"}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleRespond(f.id, "accepted")}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRespond(f.id, "declined")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted friends */}
          {acceptedFriends.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Friends ({acceptedFriends.length})
              </p>
              <div className="space-y-2">
                {acceptedFriends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded-2xl bg-muted">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {f.friendInstructor?.profile_image_url ? (
                          <img src={f.friendInstructor.profile_image_url} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">
                            {f.friendInstructor?.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{f.friendInstructor?.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive text-xs"
                      onClick={() => removeFriend.mutate(f.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingSent.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Sent Requests</p>
              <div className="space-y-2">
                {pendingSent.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded-2xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">{f.friendInstructor?.name} — pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
