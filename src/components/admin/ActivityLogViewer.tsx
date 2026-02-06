import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RefreshCw, Clock } from "lucide-react";

interface LogEntry {
  id: string;
  action_type: string;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_TYPES = [
  "all",
  "booking_created",
  "payment_recorded",
  "instructor_updated",
  "pupil_updated",
  "enquiry_updated",
  "campaign_sent",
  "reminder_sent",
  "compliance_update",
];

export function ActivityLogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterType !== "all") {
        query = query.eq("action_type", filterType);
      }

      if (search) {
        query = query.ilike("description", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as LogEntry[]);
    } catch (error) {
      console.error("Error fetching activity log:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("activity_log_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_activity_log" }, () => fetchLogs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filterType, search]);

  const getActionColor = (type: string) => {
    if (type.includes("created") || type.includes("sent")) return "bg-emerald-500/10 text-emerald-700";
    if (type.includes("updated")) return "bg-blue-500/10 text-blue-700";
    if (type.includes("deleted")) return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All Actions" : t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No activity logged yet</p>
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${getActionColor(log.action_type)}`}>
                      {log.action_type.replace(/_/g, " ")}
                    </Badge>
                    {log.entity_type && (
                      <Badge variant="secondary" className="text-xs">
                        {log.entity_type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm mt-1">{log.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
