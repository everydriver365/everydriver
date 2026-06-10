import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ChevronRight } from "lucide-react";

export function SyncHealthTile() {
  const [stale, setStale] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);

  useEffect(() => {
    void (async () => {
      // Wait for session to hydrate so invoke() attaches the Bearer token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStale(0); return; }
      const { data, error } = await supabase.functions.invoke("sync-health-stats");
      if (!error && data?.summary) {
        setStale(data.summary.stale ?? 0);
        setErrors((data.summary.with_error ?? 0) + (data.summary.queue_failed_total ?? 0));
      } else {
        setStale(0);
      }
    })();
  }, []);

  const bad = (stale ?? 0) > 0 || errors > 0;

  return (
    <Link to="/admin/sync-health">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className={`h-5 w-5 ${bad ? "text-rose-500" : "text-muted-foreground"}`} />
            <div>
              <div className="text-sm font-medium">Calendar Sync Health</div>
              <div className="text-xs text-muted-foreground">
                {stale === null
                  ? "Loading…"
                  : bad
                  ? `${stale} stale, ${errors} errors`
                  : "All in sync"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bad && <Badge variant="destructive">{(stale ?? 0) + errors}</Badge>}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
