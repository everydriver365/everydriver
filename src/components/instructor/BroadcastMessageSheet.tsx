import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Megaphone, Send, Users, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pupil {
  id: string;
  name: string;
  status: string | null;
}

interface BroadcastMessageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
}

const STATUS_FILTERS = [
  { value: "all", label: "All Pupils" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "inactive", label: "Inactive" },
  { value: "passed", label: "Passed" },
] as const;

export function BroadcastMessageSheet({ open, onOpenChange, instructorId }: BroadcastMessageSheetProps) {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPupils();
      setMessage("");
      setSelectedIds(new Set());
      setStatusFilter("all");
    }
  }, [open]);

  const fetchPupils = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("pupils")
        .select("id, name, status")
        .eq("instructor_id", instructorId)
        .order("name");
      setPupils(data || []);
    } catch (e) {
      console.error("Error fetching pupils:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = pupils.filter(p => {
    if (statusFilter === "all") return true;
    return (p.status || "active") === statusFilter;
  });

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSend = async () => {
    if (!message.trim() || selectedIds.size === 0) return;
    setSending(true);

    let sentCount = 0;
    let errorCount = 0;

    for (const pupilId of selectedIds) {
      try {
        // Get or create conversation
        let convId: string | null = null;
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId)
          .eq("pupil_id", pupilId)
          .maybeSingle();

        if (existing) {
          convId = existing.id;
        } else {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({ instructor_id: instructorId, pupil_id: pupilId })
            .select("id")
            .single();
          convId = newConv?.id || null;
        }

        if (!convId) {
          errorCount++;
          continue;
        }

        // Send message
        const { error } = await supabase.from("messages").insert({
          conversation_id: convId,
          sender_type: "instructor",
          sender_id: instructorId,
          content: message.trim(),
        });

        if (error) {
          errorCount++;
        } else {
          sentCount++;

          // Send push notification
          supabase.functions.invoke("notify-pupil", {
            body: {
              pupilId,
              type: "lesson_reminder",
              title: "New Message from Instructor",
              body: message.trim().slice(0, 80),
            },
          }).catch(() => {});
        }
      } catch {
        errorCount++;
      }
    }

    setSending(false);

    if (sentCount > 0) {
      toast.success(`Broadcast sent to ${sentCount} pupil${sentCount > 1 ? "s" : ""} 📣`);
      onOpenChange(false);
    }
    if (errorCount > 0) {
      toast.error(`Failed to send to ${errorCount} pupil${errorCount > 1 ? "s" : ""}`);
    }
  };

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-5 w-5" />
            Broadcast Message
          </SheetTitle>
          <SheetDescription>
            Send a message to multiple pupils at once. Each pupil receives it in their individual conversation.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-2">
          {/* Status filter chips */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filter by status
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(f => (
                <Badge
                  key={f.value}
                  variant={statusFilter === f.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setStatusFilter(f.value);
                    setSelectedIds(new Set());
                  }}
                >
                  {f.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pupil selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {selectedIds.size} of {filtered.length} selected
              </span>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <ScrollArea className="h-40 rounded-md border">
              <div className="p-2 space-y-0.5">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No pupils match this filter</p>
                ) : (
                  filtered.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onCheckedChange={() => toggleOne(p.id)}
                      />
                      <span className="text-sm">{p.name}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] h-5">
                        {p.status || "active"}
                      </Badge>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Message compose */}
          <div className="space-y-2">
            <Textarea
              placeholder="Type your broadcast message…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim() || selectedIds.size === 0}
              className="flex-1"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Send to {selectedIds.size} pupil{selectedIds.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
