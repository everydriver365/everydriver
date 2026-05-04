import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogRow {
  id: string;
  created_at: string;
  instructor_id: string;
  direction: string;
  purpose: string;
  status: string;
  famulor_call_id: string | null;
  metadata: any;
}

export function FamulorLogsTab() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("famulor_call_logs")
        .select("id, created_at, instructor_id, direction, purpose, status, famulor_call_id, metadata")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="py-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading logs…</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[12px] bg-[#F4F7F6] p-3 text-[12px] text-muted-foreground flex items-start gap-2">
        <ScrollText className="h-3.5 w-3.5 mt-0.5" />
        <div>Raw call event log across the whole platform. Records auto-purge after 12 months for GDPR compliance.</div>
      </div>
      <div className="rounded-[12px] bg-white border border-[#E5E5EA] overflow-hidden divide-y divide-[#F1F4F8]">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted-foreground">No log entries yet.</div>
        ) : rows.map((r) => (
          <div key={r.id} className="px-3 py-2 text-[12px] flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground font-mono">{new Date(r.created_at).toLocaleString("en-GB")}</span>
            <Badge variant="outline" className="text-[10px]">{r.direction}</Badge>
            <Badge variant="outline" className="text-[10px] capitalize">{r.purpose.replace("_", " ")}</Badge>
            <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
            {r.famulor_call_id && <span className="font-mono text-[10px] text-muted-foreground">{r.famulor_call_id}</span>}
            <span className="font-mono text-[10px] text-muted-foreground truncate ml-auto">{r.instructor_id.slice(0, 8)}…</span>
          </div>
        ))}
      </div>
    </div>
  );
}
