import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface BroadcastLogRow {
  id: string;
  message: string;
  recipient_count: number;
  failed_count: number;
  status: string;
  sent_at: string;
}

interface BroadcastHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
}

export function BroadcastHistorySheet({ open, onOpenChange, instructorId }: BroadcastHistorySheetProps) {
  const [rows, setRows] = useState<BroadcastLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !instructorId) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("broadcast_log" as any)
          .select("id, message, recipient_count, failed_count, status, sent_at")
          .eq("instructor_id", instructorId)
          .order("sent_at", { ascending: false })
          .limit(100);
        if (!cancelled) setRows((data as unknown as BroadcastLogRow[]) || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, instructorId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-2xl">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-5 w-5" />
            Broadcast History
          </SheetTitle>
          <SheetDescription>
            Every broadcast you've sent, newest first. Read-only.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[60vh] mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No broadcasts sent yet.
            </p>
          ) : (
            <ul className="space-y-2 pr-2">
              {rows.map((r) => {
                const isOpen = expandedId === r.id;
                return (
                  <li
                    key={r.id}
                    className="rounded-2xl border bg-card p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setExpandedId(isOpen ? null : r.id)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.sent_at), { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {r.recipient_count} sent
                        </Badge>
                        {r.failed_count > 0 && (
                          <Badge variant="destructive" className="text-[10px] h-5">
                            {r.failed_count} failed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-sm text-foreground whitespace-pre-wrap ${
                        isOpen ? "" : "line-clamp-2"
                      }`}
                    >
                      {r.message}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
