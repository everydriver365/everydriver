import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, RefreshCw, RotateCcw, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface SyncQueueItem {
  id: string;
  instructor_id: string;
  lesson_id: string;
  action: string;
  created_at: string;
  processed_at: string | null;
  error: string | null;
  instructor_name?: string;
}

type TabKey = "pending" | "failed" | "processed";

export function CalendarSyncQueueManager() {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("calendar_sync_queue")
        .select("*, instructors(name)")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const mapped = (data || []).map((item: any) => ({
        ...item,
        instructor_name: item.instructors?.name || "Unknown",
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Failed to fetch sync queue:", err);
      toast.error("Failed to load sync queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 30000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  const pending = items.filter((i) => !i.processed_at);
  const failed = items.filter(
    (i) => i.processed_at && i.error && i.error !== "Deduplicated"
  );
  const processed = items.filter(
    (i) => i.processed_at && (!i.error || i.error === "Deduplicated")
  );

  const retryItem = async (id: string) => {
    setRetrying(id);
    try {
      const { error } = await supabase
        .from("calendar_sync_queue")
        .update({ processed_at: null, error: null })
        .eq("id", id);
      if (error) throw error;
      toast.success("Item queued for retry");
      await fetchItems();
    } catch {
      toast.error("Failed to retry item");
    } finally {
      setRetrying(null);
    }
  };

  const bulkRetryFailed = async () => {
    if (failed.length === 0) return;
    setBulkRetrying(true);
    try {
      const ids = failed.map((i) => i.id);
      const { error } = await supabase
        .from("calendar_sync_queue")
        .update({ processed_at: null, error: null })
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} items queued for retry`);
      await fetchItems();
    } catch {
      toast.error("Bulk retry failed");
    } finally {
      setBulkRetrying(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? format(new Date(d), "dd MMM HH:mm:ss") : "—";

  const renderTable = (data: SyncQueueItem[], showRetry: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instructor</TableHead>
          <TableHead>Lesson ID</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Processed</TableHead>
          {showRetry && <TableHead>Error</TableHead>}
          {showRetry && <TableHead className="w-24">Retry</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showRetry ? 7 : 5} className="text-center text-muted-foreground py-8">
              No items
            </TableCell>
          </TableRow>
        ) : (
          data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.instructor_name}</TableCell>
              <TableCell className="font-mono text-xs">{item.lesson_id.slice(0, 8)}…</TableCell>
              <TableCell>
                <Badge variant={item.action === "deleteLesson" ? "destructive" : "default"}>
                  {item.action}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{formatDate(item.created_at)}</TableCell>
              <TableCell className="text-xs">{formatDate(item.processed_at)}</TableCell>
              {showRetry && (
                <TableCell className="text-xs text-destructive max-w-[200px] truncate" title={item.error || ""}>
                  {item.error}
                </TableCell>
              )}
              {showRetry && (
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={retrying === item.id}
                    onClick={() => retryItem(item.id)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {retrying === item.id ? "…" : "Retry"}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Calendar Sync Queue
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="pending" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Pending
                {pending.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5">{pending.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="failed" className="gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Failed
                {failed.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5">{failed.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="processed" className="gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Processed
                {processed.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5">{processed.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            {activeTab === "failed" && failed.length > 0 && (
              <Button size="sm" variant="outline" onClick={bulkRetryFailed} disabled={bulkRetrying}>
                <RotateCcw className={`h-3.5 w-3.5 mr-1 ${bulkRetrying ? "animate-spin" : ""}`} />
                Retry All ({failed.length})
              </Button>
            )}
          </div>
          <TabsContent value="pending">{renderTable(pending, false)}</TabsContent>
          <TabsContent value="failed">{renderTable(failed, true)}</TabsContent>
          <TabsContent value="processed">{renderTable(processed, false)}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
