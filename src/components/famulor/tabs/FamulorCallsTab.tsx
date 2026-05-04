import { useState } from "react";
import { useFamulorCalls, FamulorCallsFilters, FamulorCallRow } from "@/hooks/useFamulorCalls";
import type { FamulorHubScope } from "../FamulorHub";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneIncoming, PhoneOutgoing, Search, RefreshCw, Loader2 } from "lucide-react";
import { FamulorCallLogDrawer } from "../FamulorCallLogDrawer";

interface Props {
  scope: FamulorHubScope;
  instructorId?: string;
  instructorIds?: string[];
}

const ACCENT = "#1A52A0";

const STATUS_COLOUR: Record<string, string> = {
  completed: "#10B981",
  in_progress: "#3B82F6",
  no_answer: "#F59E0B",
  failed: "#EF4444",
  queued: "#6B7280",
};

export function FamulorCallsTab({ scope, instructorId, instructorIds }: Props) {
  const [filters, setFilters] = useState<FamulorCallsFilters>({
    direction: "all", purpose: "all", status: "all", search: "",
  });
  const { rows, loading, refresh } = useFamulorCalls({ scope, instructorId, instructorIds, filters });
  const [openRow, setOpenRow] = useState<FamulorCallRow | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search number, summary, agent…"
            value={filters.search ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filters.direction} onValueChange={(v) => setFilters((f) => ({ ...f, direction: v as any }))}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directions</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.purpose} onValueChange={(v) => setFilters((f) => ({ ...f, purpose: v }))}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All purposes</SelectItem>
            <SelectItem value="receptionist">Receptionist</SelectItem>
            <SelectItem value="reminder">Reminder</SelectItem>
            <SelectItem value="win_back">Win-back</SelectItem>
            <SelectItem value="test">Test</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="no_answer">No answer</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refresh} className="h-9">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
        </Button>
      </div>

      <div className="rounded-[12px] bg-white border border-[#E5E5EA] overflow-hidden">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading calls…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted-foreground">No calls match these filters.</div>
        ) : (
          <div className="divide-y divide-[#F1F4F8]">
            {rows.map((r) => {
              const colour = STATUS_COLOUR[r.status] ?? "#6B7280";
              const Dir = r.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;
              return (
                <button
                  key={r.id}
                  onClick={() => setOpenRow(r)}
                  className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
                  >
                    <Dir className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium capitalize">{r.purpose.replace("_", " ")}</span>
                      <Badge
                        style={{ backgroundColor: `${colour}1A`, color: colour, borderColor: `${colour}33` }}
                        className="text-[10px] px-1.5 py-0 border"
                      >
                        {(r.outcome ?? r.status).replace("_", " ")}
                      </Badge>
                      {r.agent_name && (
                        <span className="text-[11px] text-muted-foreground">· {r.agent_name}</span>
                      )}
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {r.phone_number ?? r.from_number ?? r.to_number ?? "—"} · {new Date(r.created_at).toLocaleString("en-GB")}
                    </div>
                    {r.summary && (
                      <div className="text-[12px] text-foreground/80 mt-1 line-clamp-2">{r.summary}</div>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground whitespace-nowrap text-right">
                    {r.duration_seconds != null && <div>{Math.round(r.duration_seconds)}s</div>}
                    {r.cost_pence != null && <div>£{(r.cost_pence / 100).toFixed(2)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <FamulorCallLogDrawer row={openRow} onClose={() => setOpenRow(null)} />
    </div>
  );
}
